import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import { z } from 'zod';
import { parsePackCsv, type ParsedPack } from '../../src/main/content/csvPacks';
import { parseEvidenceJsonl, type ContentEvidence } from './evidence';
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
  reportDependencies?: BatchReportDependencies;
}

export interface BatchReportDependencies {
  rename?(source: string, destination: string): void;
  createTemporaryId?(): string;
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

export interface FullBatchVerificationReport {
  version: 1;
  batchId: string;
  kind: 'verification';
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

export interface BatchPreflightIssue {
  artifact: 'authored' | 'generated' | 'evidence';
  code: 'MISSING_ARTIFACT' | 'UNREADABLE_ARTIFACT' | 'UNPARSEABLE_ARTIFACT';
  message: string;
}

export interface BatchPreflightFailureReport {
  version: 1;
  batchId: string;
  kind: 'preflight-failure';
  blocking: true;
  fatalIssues: BatchPreflightIssue[];
}

export type BatchVerificationReport = FullBatchVerificationReport | BatchPreflightFailureReport;

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
const batchValidationSchema = validationSchema.extend({ mode: z.literal('batch') });
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

const fullBatchVerificationReportSchema = z.object({
  version: z.literal(1), batchId: z.string().trim().min(1), kind: z.literal('verification'), blocking: z.boolean(),
  artifactHashes: z.object({
    authored: z.string().regex(/^[a-f0-9]{64}$/), generated: z.string().regex(/^[a-f0-9]{64}$/),
    evidence: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  validations: z.object({ authored: batchValidationSchema, generated: batchValidationSchema }).strict(),
  translationDiagnostics: translationSchema,
  sources: z.array(sourceSchema), samples: z.record(z.string(), z.array(z.string())),
  unresolvedIssues: z.array(unresolvedSchema),
}).strict();

const preflightFailureReportSchema = z.object({
  version: z.literal(1), batchId: z.string().trim().min(1), kind: z.literal('preflight-failure'),
  blocking: z.literal(true),
  fatalIssues: z.array(z.object({
    artifact: z.enum(['authored', 'generated', 'evidence']),
    code: z.enum(['MISSING_ARTIFACT', 'UNREADABLE_ARTIFACT', 'UNPARSEABLE_ARTIFACT']),
    message: z.string().trim().min(1),
  }).strict()),
}).strict();

export const batchVerificationReportSchema = z.discriminatedUnion('kind', [
  fullBatchVerificationReportSchema, preflightFailureReportSchema,
]);

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

function within(root: string, path: string): boolean {
  const child = relative(root, path);
  return child !== '' && !isAbsolute(child) && child !== '..' && !child.startsWith(`..${sep}`);
}

function assertNoSymlinkAncestors(path: string): void {
  let current = resolve(path);
  while (true) {
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Batch report path must not traverse a symlink: ${current}`);
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function prepareReportPath(workRoot: string, batchId: string): { directory: string; report: string } {
  const root = resolve(workRoot);
  const directory = resolve(root, batchId);
  const report = resolve(directory, 'report.json');
  if (!within(root, directory) || !within(root, report)) throw new Error('Batch report path escapes or prefix-collides with work root');
  assertNoSymlinkAncestors(root);
  assertNoSymlinkAncestors(directory);
  mkdirSync(directory, { recursive: true });
  assertNoSymlinkAncestors(directory);
  const stat = lstatSync(report, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) throw new Error('Batch report destination must not be a symlink');
  if (stat !== undefined && !stat.isFile()) throw new Error('Batch report destination must be a regular file');
  return { directory, report };
}

function assertReportPathRemainsSafe(workRoot: string, directory: string, report: string): void {
  const root = resolve(workRoot);
  if (!within(root, directory) || !within(root, report) || dirname(report) !== directory) {
    throw new Error('Batch report path escapes or prefix-collides with work root');
  }
  assertNoSymlinkAncestors(root);
  assertNoSymlinkAncestors(directory);
  const directoryStat = lstatSync(directory, { throwIfNoEntry: false });
  if (directoryStat === undefined || !directoryStat.isDirectory()) {
    throw new Error('Batch report parent must be a safe directory');
  }
  const reportStat = lstatSync(report, { throwIfNoEntry: false });
  if (reportStat?.isSymbolicLink()) throw new Error('Batch report destination must not be a symlink');
  if (reportStat !== undefined && !reportStat.isFile()) throw new Error('Batch report destination must be a regular file');
}

function removeOwnedReportTemporary(
  temporary: string,
  identity: { dev: number; ino: number } | undefined,
  assertSafePath: () => void,
): void {
  try { assertSafePath(); } catch { return; }
  const stat = lstatSync(temporary, { throwIfNoEntry: false });
  if (stat === undefined || stat.isSymbolicLink() || !stat.isFile()
    || stat.dev !== identity?.dev || stat.ino !== identity.ino) return;
  try { unlinkSync(temporary); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

function writeReportAtomically(
  path: string,
  report: BatchVerificationReport,
  assertSafePath: () => void,
  dependencies: BatchReportDependencies = {},
): void {
  const bytes = `${JSON.stringify(report, null, 2)}\n`;
  const createTemporaryId = dependencies.createTemporaryId ?? randomUUID;
  let temporary: string | undefined;
  let temporaryIdentity: { dev: number; ino: number } | undefined;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = `${path}.${createTemporaryId()}.tmp`;
    try {
      assertSafePath();
      writeFileSync(candidate, bytes, { encoding: 'utf8', flag: 'wx' });
      temporary = candidate;
      const stat = lstatSync(candidate);
      temporaryIdentity = { dev: stat.dev, ino: stat.ino };
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
  if (temporary === undefined) throw new Error('Could not allocate a unique batch report temporary file');
  try {
    assertSafePath();
    (dependencies.rename ?? renameSync)(temporary, path);
    temporary = undefined;
  } finally {
    if (temporary !== undefined) removeOwnedReportTemporary(temporary, temporaryIdentity, assertSafePath);
  }
}

function decodeUtf8(bytes: Buffer): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function preflightIssue(
  artifact: BatchPreflightIssue['artifact'],
  code: BatchPreflightIssue['code'],
): BatchPreflightIssue {
  const descriptions: Record<BatchPreflightIssue['code'], string> = {
    MISSING_ARTIFACT: 'is missing',
    UNREADABLE_ARTIFACT: 'is unreadable or unsafe',
    UNPARSEABLE_ARTIFACT: 'cannot be parsed',
  };
  return { artifact, code, message: `${artifact} ${descriptions[code]}` };
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
  const { directory, report: reportPath } = prepareReportPath(options.workRoot, batch.id);
  const assertSafeReportPath = (): void => assertReportPathRemainsSafe(options.workRoot, directory, reportPath);
  const paths = {
    authored: join(directory, 'authored.csv'), generated: join(directory, 'generated.en-et.csv'),
    evidence: join(directory, 'evidence.jsonl'),
  };

  const bytes: Partial<Record<keyof typeof paths, Buffer>> = {};
  const fatalIssues: BatchPreflightIssue[] = [];
  let authoredPack: ParsedPack | undefined;
  let generatedPack: ParsedPack | undefined;
  let evidence: ReadonlyMap<string, ContentEvidence> | undefined;
  for (const artifact of ['authored', 'generated', 'evidence'] as const) {
    try {
      bytes[artifact] = safeRead(paths[artifact]);
    } catch {
      const missing = lstatSync(paths[artifact], { throwIfNoEntry: false }) === undefined;
      fatalIssues.push(preflightIssue(artifact, missing ? 'MISSING_ARTIFACT' : 'UNREADABLE_ARTIFACT'));
      continue;
    }
    try {
      const text = decodeUtf8(bytes[artifact]!);
      if (artifact === 'authored') authoredPack = parsePackCsv(text);
      else if (artifact === 'generated') generatedPack = parsePackCsv(text);
      else evidence = parseEvidenceJsonl(text, 'evidence.jsonl');
    } catch {
      fatalIssues.push(preflightIssue(artifact, 'UNPARSEABLE_ARTIFACT'));
    }
  }
  if (fatalIssues.length > 0 || authoredPack === undefined || generatedPack === undefined || evidence === undefined) {
    const failure: BatchPreflightFailureReport = {
      version: 1, batchId: batch.id, kind: 'preflight-failure', blocking: true,
      fatalIssues: fatalIssues.sort((left, right) => compareCodeUnits(
        `${left.artifact}\0${left.code}\0${left.message}`,
        `${right.artifact}\0${right.code}\0${right.message}`,
      )),
    };
    writeReportAtomically(reportPath, failure, assertSafeReportPath, options.reportDependencies);
    return failure;
  }

  const authored = stableValidation(validateProductionContent([{ file: 'authored.csv', pack: authoredPack }], {
    mode: 'batch', allowMissingEt: true, evidenceByClueId: evidence, batch,
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

  const report: FullBatchVerificationReport = {
    version: 1, batchId: batch.id, kind: 'verification',
    blocking: authored.blocking || generated.blocking || translationDiagnostics.blocking
      || sources.some((source) => !source.ok) || unresolvedIssues.some((issue) => issue.scope === 'evidence' || issue.scope === 'samples'),
    artifactHashes: { authored: hash(bytes.authored!), generated: hash(bytes.generated!), evidence: hash(bytes.evidence!) },
    validations: { authored, generated }, translationDiagnostics, sources, samples: sampled.samples, unresolvedIssues,
  };
  const parsed = parseBatchVerificationReport(report);
  writeReportAtomically(reportPath, parsed, assertSafeReportPath, options.reportDependencies);
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
