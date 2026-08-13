import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { parsePackCsv, type ParsedPack } from '../../src/main/content/csvPacks';
import { contentEvidenceSchema, readEvidenceInputs, type ContentEvidence } from './evidence';
import { getProductionBatch } from './productionBatches';
import {
  checkSourceUrls, type SourceCache, type SourceCheckDependencies, type SourceCheckOptions,
  type SourceCheckResult,
} from './sourceCheck';
import {
  diagnoseTranslations, type TranslationDiagnosticReport,
} from './translationDiagnostics';
import {
  validateProductionContent, type ProductionValidationResult,
} from './validate';

export interface VerifyBatchOptions {
  batchId: string;
  workRoot: string;
  sourceCache?: SourceCache;
  sourceDependencies?: SourceCheckDependencies;
  sourceCheckOptions?: Omit<SourceCheckOptions, 'cache'>;
}

export interface BatchArtifactHashes {
  authored: string;
  generated: string;
  evidence: string;
}

export interface BatchUnresolvedIssue {
  scope: 'authored' | 'generated' | 'translation' | 'source' | 'evidence' | 'samples';
  code: string;
  clueId: string | null;
  message: string;
}

export interface BatchVerificationReport {
  version: 1;
  batchId: string;
  blocking: boolean;
  artifactHashes: BatchArtifactHashes;
  validations: {
    authored: ProductionValidationResult;
    generated: ProductionValidationResult;
  };
  translationDiagnostics: TranslationDiagnosticReport;
  sources: SourceCheckResult[];
  samples: Record<string, string[]>;
  unresolvedIssues: BatchUnresolvedIssue[];
}

const issueSchema = z.object({
  file: z.string(), row: z.number(), code: z.string(), severity: z.enum(['error', 'warning']),
  message: z.string(), exceptionId: z.string().optional(),
}).strict();
const exceptionSchema = z.object({ id: z.string(), code: z.string(), clueId: z.string(), reason: z.string() }).strict();
const summarySchema = z.object({
  boardClues: z.number(), categorySets: z.number(), distinctCategoryNames: z.number(),
  finalClues: z.number(), easySets: z.number(), mediumSets: z.number(), hardSets: z.number(),
}).strict();
const validationSchema = z.object({
  mode: z.enum(['batch', 'release']), blocking: z.boolean(), summary: summarySchema,
  issues: z.array(issueSchema), exceptions: z.array(exceptionSchema),
}).strict();
const translationIssueSchema = z.object({
  file: z.string(), row: z.number(), clueId: z.string(), field: z.string(), code: z.string(),
  message: z.string(), severity: z.enum(['error', 'warning']),
}).strict();
const translationExceptionSchema = z.object({
  id: z.string(), clueId: z.string(), code: z.string(), status: z.enum(['pending', 'reviewed', 'resolved']),
  reviewerReason: z.string(), correctedText: z.string(),
}).strict();
const translationSchema = z.object({
  blocking: z.boolean(), checkedRows: z.number(), issues: z.array(translationIssueSchema),
  exceptions: z.array(translationExceptionSchema),
}).strict();
const sourceSchema = z.object({
  url: z.string(), ok: z.boolean(), status: z.number().nullable(), retrievedAt: z.string().nullable(),
  code: z.string().nullable(), finalUrl: z.string().nullable(),
}).strict();
const unresolvedSchema = z.object({
  scope: z.enum(['authored', 'generated', 'translation', 'source', 'evidence', 'samples']),
  code: z.string(), clueId: z.string().nullable(), message: z.string(),
}).strict();

export const batchVerificationReportSchema = z.object({
  version: z.literal(1), batchId: z.string().trim().min(1), blocking: z.boolean(),
  artifactHashes: z.object({
    authored: z.string().regex(/^[a-f0-9]{64}$/), generated: z.string().regex(/^[a-f0-9]{64}$/),
    evidence: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  validations: z.object({ authored: validationSchema, generated: validationSchema }).strict(),
  translationDiagnostics: translationSchema,
  sources: z.array(sourceSchema), samples: z.record(z.string(), z.array(z.string())),
  unresolvedIssues: z.array(unresolvedSchema),
}).strict();

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function hash(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function safeRead(path: string): Buffer {
  const before = lstatSync(path);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error(`Batch artifact is not a safe regular file: ${path}`);
  const bytes = readFileSync(path);
  const after = lstatSync(path);
  if (!after.isFile() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino
    || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
    throw new Error(`Batch artifact changed while reading: ${path}`);
  }
  return bytes;
}

function evidenceFromBytes(bytes: Buffer): ReadonlyMap<string, ContentEvidence> {
  const records = new Map<string, ContentEvidence>();
  const lines = bytes.toString('utf8').split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  for (const line of lines) {
    const evidence = contentEvidenceSchema.parse(JSON.parse(line));
    if (records.has(evidence.clueId)) throw new Error(`Duplicate evidence for clue ID: ${evidence.clueId}`);
    records.set(evidence.clueId, evidence);
  }
  return new Map([...records].sort(([left], [right]) => compareCodeUnits(left, right)));
}

function stableValidation(result: ProductionValidationResult): ProductionValidationResult {
  return {
    ...result,
    issues: [...result.issues].sort((left, right) => compareCodeUnits(
      `${left.file}\0${String(left.row).padStart(10, '0')}\0${left.code}\0${left.message}`,
      `${right.file}\0${String(right.row).padStart(10, '0')}\0${right.code}\0${right.message}`,
    )),
    exceptions: [...result.exceptions].sort((left, right) => compareCodeUnits(left.id, right.id)),
  };
}

function sampleClues(pack: ParsedPack): { samples: Record<string, string[]>; issues: BatchUnresolvedIssue[] } {
  const rows = [...pack.rows].sort((left, right) => compareCodeUnits(left.clue_id, right.clue_id));
  const samples: Record<string, string[]> = {};
  const issues: BatchUnresolvedIssue[] = [];
  const cells = rows[0]?.content_kind === 'final'
    ? ['easy', 'medium', 'hard'].map((difficulty) => ({ key: difficulty, count: 15, difficulty, round: 'final' }))
    : ['easy', 'medium', 'hard'].flatMap((difficulty) => ['round-one', 'round-two']
      .map((round) => ({ key: `${difficulty}/${round}`, count: 5, difficulty, round })));
  for (const cell of cells.sort((left, right) => compareCodeUnits(left.key, right.key))) {
    const ids = rows.filter((row) => row.difficulty === cell.difficulty && row.round === cell.round)
      .slice(0, cell.count).map((row) => row.clue_id);
    samples[cell.key] = ids;
    if (ids.length !== cell.count) issues.push({
      scope: 'samples', code: 'MISSING_SAMPLE', clueId: null,
      message: `${cell.key} requires ${cell.count} sample clues; found ${ids.length}`,
    });
  }
  return { samples, issues };
}

function issueOrder(left: BatchUnresolvedIssue, right: BatchUnresolvedIssue): number {
  return compareCodeUnits(
    `${left.scope}\0${left.code}\0${left.clueId ?? ''}\0${left.message}`,
    `${right.scope}\0${right.code}\0${right.clueId ?? ''}\0${right.message}`,
  );
}

export function parseBatchVerificationReport(value: unknown): BatchVerificationReport {
  return batchVerificationReportSchema.parse(value) as BatchVerificationReport;
}

export async function verifyBatch(options: VerifyBatchOptions): Promise<BatchVerificationReport> {
  const batch = getProductionBatch(options.batchId);
  const directory = resolve(options.workRoot, batch.id);
  const paths = {
    authored: join(directory, 'authored.csv'), generated: join(directory, 'generated.en-et.csv'),
    evidence: join(directory, 'evidence.jsonl'), report: join(directory, 'report.json'),
  };

  await readEvidenceInputs([paths.evidence]);
  const bytes = { authored: safeRead(paths.authored), generated: safeRead(paths.generated), evidence: safeRead(paths.evidence) };
  const evidence = evidenceFromBytes(bytes.evidence);
  const authoredEvidence = new Map([...evidence].map(([clueId, record]) => [
    clueId, { ...record, translationReview: null },
  ]));
  const authoredPack = parsePackCsv(bytes.authored.toString('utf8'));
  const generatedPack = parsePackCsv(bytes.generated.toString('utf8'));
  const authored = stableValidation(validateProductionContent([{ file: 'authored.csv', pack: authoredPack }], {
    mode: 'batch', allowMissingEt: true, evidenceByClueId: authoredEvidence, batch,
  }));
  const generated = stableValidation(validateProductionContent([{ file: 'generated.en-et.csv', pack: generatedPack }], {
    mode: 'batch', evidenceByClueId: evidence, batch,
  }));
  const translationDiagnostics = diagnoseTranslations([{ file: 'generated.en-et.csv', pack: generatedPack }]);
  translationDiagnostics.issues.sort((left, right) => issueOrder(
    { scope: 'translation', code: left.code, clueId: left.clueId, message: `${left.file}:${left.row}:${left.field}:${left.message}` },
    { scope: 'translation', code: right.code, clueId: right.clueId, message: `${right.file}:${right.row}:${right.field}:${right.message}` },
  ));
  translationDiagnostics.exceptions.sort((left, right) => compareCodeUnits(left.id, right.id));

  const unresolvedIssues: BatchUnresolvedIssue[] = [];
  for (const [clueId, record] of evidence) {
    if (record.batchId !== batch.id) unresolvedIssues.push({
      scope: 'evidence', code: 'EVIDENCE_BATCH_MISMATCH', clueId,
      message: `Evidence ${clueId} belongs to ${record.batchId}, not ${batch.id}`,
    });
    if (record.translationReview === null) unresolvedIssues.push({
      scope: 'evidence', code: 'MISSING_TRANSLATION_APPROVAL', clueId,
      message: `Evidence ${clueId} requires translation approval`,
    });
  }
  for (const issue of authored.issues) unresolvedIssues.push({ scope: 'authored', code: issue.code, clueId: null, message: `${issue.file}:${issue.row}: ${issue.message}` });
  for (const issue of generated.issues) unresolvedIssues.push({ scope: 'generated', code: issue.code, clueId: null, message: `${issue.file}:${issue.row}: ${issue.message}` });
  for (const issue of translationDiagnostics.issues) unresolvedIssues.push({ scope: 'translation', code: issue.code, clueId: issue.clueId, message: `${issue.file}:${issue.row}:${issue.field}: ${issue.message}` });

  const urls = [...new Set([...evidence.values()].filter((item) => item.batchId === batch.id)
    .map((item) => item.supportingSource.url))].sort(compareCodeUnits);
  const sourceOptions = { ...options.sourceCheckOptions, ...(options.sourceCache === undefined ? {} : { cache: options.sourceCache }) };
  const sources = (options.sourceDependencies === undefined
    ? await checkSourceUrls(urls, undefined, sourceOptions)
    : await checkSourceUrls(urls, options.sourceDependencies, sourceOptions))
    .sort((left, right) => compareCodeUnits(left.url, right.url));
  for (const source of sources.filter((item) => !item.ok)) unresolvedIssues.push({
    scope: 'source', code: source.code ?? 'SOURCE_CHECK_FAILED', clueId: null,
    message: `${source.url} failed source verification`,
  });
  const sampled = sampleClues(generatedPack);
  unresolvedIssues.push(...sampled.issues);
  unresolvedIssues.sort(issueOrder);

  const report: BatchVerificationReport = {
    version: 1, batchId: batch.id,
    blocking: authored.blocking || generated.blocking || translationDiagnostics.blocking
      || sources.some((source) => !source.ok) || unresolvedIssues.some((issue) => issue.scope === 'evidence' || issue.scope === 'samples'),
    artifactHashes: { authored: hash(bytes.authored), generated: hash(bytes.generated), evidence: hash(bytes.evidence) },
    validations: { authored, generated }, translationDiagnostics, sources, samples: sampled.samples, unresolvedIssues,
  };
  const parsed = parseBatchVerificationReport(report);
  writeFileSync(paths.report, `${JSON.stringify(parsed, null, 2)}\n`, { encoding: 'utf8' });
  return parsed;
}

async function runCli(argv = process.argv.slice(2)): Promise<number> {
  const value = (name: string) => argv[argv.indexOf(name) + 1];
  const batchId = value('--batch');
  if (batchId === undefined) throw new Error('--batch is required');
  const workRoot = value('--work-root') ?? resolve('content/work');
  const report = await verifyBatch({ batchId, workRoot });
  process.stdout.write(`${JSON.stringify(report)}\n`);
  return report.blocking ? 1 : 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2;
  });
}
