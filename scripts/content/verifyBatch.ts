import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import { z } from 'zod';
import { parsePackCsv, type ParsedPack } from '../../src/main/content/csvPacks';
import { CSV_COLUMNS } from '../../src/shared/content/csvColumns';
import { parseEvidenceJsonl, serializeEvidence, type ContentEvidence } from './evidence';
import {
  acceptedBatchPaths, getProductionBatch, type ProductionBatchDefinition,
} from './productionBatches';
import {
  checkSourceUrls, openFileSourceCache, type SourceCache, type SourceCheckDependencies, type SourceCheckOptions,
  type SourceCheckResult,
} from './sourceCheck';
import { restoreNpmRunArgs } from './npmCliCompatibility';
import {
  diagnoseTranslations, type TranslationDiagnosticReport,
} from './translationDiagnostics';
import {
  validateProductionContent, type ProductionValidationResult,
} from './validate';

export interface VerifyBatchOptions {
  batchId: string;
  workRoot: string;
  batchDefinition?: ProductionBatchDefinition;
  sourceCache?: SourceCache;
  sourceDependencies?: SourceCheckDependencies;
  sourceCheckOptions?: Omit<SourceCheckOptions, 'cache'>;
  reportDependencies?: BatchReportDependencies;
  translationDiagnosticClueIds?: ReadonlySet<string>;
  baselineRoot?: string;
}

export interface BatchReportDependencies {
  rename?(source: string, destination: string): void;
  createTemporaryId?(): string;
  beforeRename?(): void;
}

export interface BatchArtifactHashes {
  authored: string;
  generated: string;
  evidence: string;
}

export type VerificationProfile = 'canonical' | 'easy-expansion-provisional' | 'legacy-unmarked';

export interface BatchUnresolvedIssue {
  scope: 'authored' | 'generated' | 'translation' | 'source' | 'evidence' | 'samples' | 'baseline';
  code: string;
  clueId: string | null;
  message: string;
}

export interface FullBatchVerificationReport {
  version: 1;
  batchId: string;
  kind: 'verification';
  verificationProfile: VerificationProfile;
  translationDiagnosticClueIds: string[] | null;
  acceptedBaselineHashes: BatchArtifactHashes | null;
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
  verificationProfile: VerificationProfile;
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
  finalClues: z.number(), easySets: z.number(), mediumSets: z.number(), hardSets: z.number(), builtInPacks: z.number(),
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
  scope: z.enum(['authored', 'generated', 'translation', 'source', 'evidence', 'samples', 'baseline']),
  code: z.string(), clueId: z.string().nullable(), message: z.string(),
}).strict();

const fullBatchVerificationReportSchema = z.object({
  version: z.literal(1), batchId: z.string().trim().min(1), kind: z.literal('verification'), blocking: z.boolean(),
  verificationProfile: z.enum([
    'canonical', 'easy-expansion-provisional', 'legacy-unmarked',
  ]).default('legacy-unmarked'),
  translationDiagnosticClueIds: z.array(z.string().trim().min(1))
    .refine((ids) => new Set(ids).size === ids.length, 'Translation diagnostic clue IDs must be unique')
    .nullable().default(null),
  acceptedBaselineHashes: z.object({
    authored: z.string().regex(/^[a-f0-9]{64}$/), generated: z.string().regex(/^[a-f0-9]{64}$/),
    evidence: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict().nullable().default(null),
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
  verificationProfile: z.enum([
    'canonical', 'easy-expansion-provisional', 'legacy-unmarked',
  ]).default('legacy-unmarked'),
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

export function expectedEasyExpansionTranslationClueIds(
  batch: ProductionBatchDefinition,
): string[] {
  if (!/^(?:0[1-9]|1[0-2])-/u.test(batch.id) || batch.boardClues !== 600) {
    throw new Error(`Scoped translation verification is not available for ${batch.id}`);
  }
  return Array.from(
    { length: 100 },
    (_, index) => `${batch.packId}-easy-expansion-${(index + 1).toString().padStart(3, '0')}`,
  );
}

function rowIndex(pack: ParsedPack, label: string): ReadonlyMap<string, ParsedPack['rows'][number]> {
  const rows = new Map<string, ParsedPack['rows'][number]>();
  for (const row of pack.rows) {
    if (rows.has(row.clue_id)) throw new Error(`Accepted baseline ${label} contains duplicate clue ${row.clue_id}`);
    rows.set(row.clue_id, row);
  }
  return rows;
}

function rowFingerprint(row: ParsedPack['rows'][number]): string {
  return JSON.stringify(CSV_COLUMNS.map((column) => row[column]));
}

export function compareAcceptedTranslationBaseline(options: {
  batch: ProductionBatchDefinition;
  acceptedRoot: string;
  authoredPack: ParsedPack;
  generatedPack: ParsedPack;
  evidence: ReadonlyMap<string, ContentEvidence>;
  translationDiagnosticClueIds: readonly string[];
}): BatchArtifactHashes {
  const expectedScope = expectedEasyExpansionTranslationClueIds(options.batch);
  const actualScope = [...options.translationDiagnosticClueIds];
  if (JSON.stringify(actualScope) !== JSON.stringify(expectedScope)) {
    throw new Error('Accepted baseline comparison requires the exact 100 Easy-expansion clue IDs');
  }
  const scope = new Set(actualScope);
  const acceptedRoot = resolve(options.acceptedRoot);
  const relativePaths = acceptedBatchPaths(options.batch.id);
  const paths = {
    authored: resolve(acceptedRoot, relativePaths.authored),
    generated: resolve(acceptedRoot, relativePaths.generated),
    evidence: resolve(acceptedRoot, relativePaths.evidence),
  };
  assertNoSymlinkAncestors(acceptedRoot);
  for (const path of Object.values(paths)) {
    if (!within(acceptedRoot, path)) throw new Error('Accepted baseline path escapes its root');
    assertNoSymlinkAncestors(dirname(path));
  }
  const bytes = {
    authored: safeRead(paths.authored),
    generated: safeRead(paths.generated),
    evidence: safeRead(paths.evidence),
  };
  let acceptedAuthored: ParsedPack;
  let acceptedGenerated: ParsedPack;
  let acceptedEvidence: ReadonlyMap<string, ContentEvidence>;
  try {
    acceptedAuthored = parsePackCsv(decodeUtf8(bytes.authored));
    acceptedGenerated = parsePackCsv(decodeUtf8(bytes.generated));
    acceptedEvidence = parseEvidenceJsonl(decodeUtf8(bytes.evidence), 'accepted-baseline-evidence.jsonl');
  } catch {
    throw new Error('Accepted baseline artifacts are not parseable');
  }
  const candidateAuthored = rowIndex(options.authoredPack, 'candidate authored');
  const candidateGenerated = rowIndex(options.generatedPack, 'candidate generated');
  const baselineAuthored = rowIndex(acceptedAuthored, 'authored');
  const baselineGenerated = rowIndex(acceptedGenerated, 'generated');
  const sortedIds = (values: Iterable<string>): string[] => [...values].sort(compareCodeUnits);
  const candidateAllIds = sortedIds(candidateGenerated.keys());
  if (candidateAllIds.length !== 600
    || JSON.stringify(candidateAllIds) !== JSON.stringify(sortedIds(candidateAuthored.keys()))
    || JSON.stringify(candidateAllIds) !== JSON.stringify(sortedIds(options.evidence.keys()))) {
    throw new Error('Accepted baseline comparison requires matching 600-row candidate inventories');
  }
  const baselineAllIds = sortedIds(baselineGenerated.keys());
  if (baselineAllIds.length !== 500
    || baselineAllIds.some((clueId) => scope.has(clueId))
    || JSON.stringify(baselineAllIds) !== JSON.stringify(sortedIds(baselineAuthored.keys()))
    || JSON.stringify(baselineAllIds) !== JSON.stringify(sortedIds(acceptedEvidence.keys()))) {
    throw new Error('Accepted baseline comparison requires matching 500-row pre-expansion inventories');
  }
  for (const clueId of expectedScope) {
    if (!candidateAuthored.has(clueId) || !candidateGenerated.has(clueId) || !options.evidence.has(clueId)) {
      throw new Error(`Accepted baseline comparison is missing scoped clue ${clueId}`);
    }
  }
  const candidateIds = candidateAllIds.filter((clueId) => !scope.has(clueId));
  const baselineIds = baselineAllIds;
  if (JSON.stringify(candidateIds) !== JSON.stringify(baselineIds)) {
    throw new Error('Accepted baseline clue inventory differs outside the scoped Easy expansion');
  }
  for (const clueId of candidateIds) {
    const candidateAuthoredRow = candidateAuthored.get(clueId);
    const candidateGeneratedRow = candidateGenerated.get(clueId);
    const candidateEvidence = options.evidence.get(clueId);
    const baselineAuthoredRow = baselineAuthored.get(clueId);
    const baselineGeneratedRow = baselineGenerated.get(clueId);
    const baselineEvidence = acceptedEvidence.get(clueId);
    if (candidateAuthoredRow === undefined || candidateGeneratedRow === undefined || candidateEvidence === undefined
      || baselineAuthoredRow === undefined || baselineGeneratedRow === undefined || baselineEvidence === undefined
      || rowFingerprint(candidateAuthoredRow) !== rowFingerprint(baselineAuthoredRow)
      || rowFingerprint(candidateGeneratedRow) !== rowFingerprint(baselineGeneratedRow)
      || serializeEvidence([candidateEvidence]) !== serializeEvidence([baselineEvidence])) {
      throw new Error(`Accepted baseline record differs outside the scoped Easy expansion: ${clueId}`);
    }
  }
  return {
    authored: hash(bytes.authored),
    generated: hash(bytes.generated),
    evidence: hash(bytes.evidence),
  };
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
    dependencies.beforeRename?.();
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
  const canonicalBatch = getProductionBatch(options.batchId);
  if (options.batchDefinition !== undefined && options.batchDefinition.id !== canonicalBatch.id) {
    throw new Error(`Trusted batch definition must match canonical batch ${canonicalBatch.id}`);
  }
  const batch = options.batchDefinition ?? canonicalBatch;
  const translationDiagnosticClueIds = options.translationDiagnosticClueIds === undefined
    ? undefined
    : [...options.translationDiagnosticClueIds].sort(compareCodeUnits);
  if (translationDiagnosticClueIds !== undefined) {
    const expected = expectedEasyExpansionTranslationClueIds(batch);
    if (JSON.stringify(translationDiagnosticClueIds) !== JSON.stringify(expected)) {
      throw new Error('Translation diagnostic scope must contain the exact 100 Easy-expansion clue IDs');
    }
    if (options.batchDefinition === undefined && options.baselineRoot === undefined) {
      throw new Error('Canonical translation diagnostic scope requires an accepted baseline root');
    }
  }
  const verificationProfile: VerificationProfile = options.batchDefinition === undefined
    ? 'canonical'
    : 'easy-expansion-provisional';
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
      verificationProfile,
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
  const translationPack = translationDiagnosticClueIds === undefined
    ? generatedPack
    : {
        rows: generatedPack.rows.filter(({ clue_id }) => (
          translationDiagnosticClueIds.includes(clue_id)
        )),
      };
  const generatedClueIdCounts = new Map<string, number>();
  for (const { clue_id: clueId } of generatedPack.rows) {
    generatedClueIdCounts.set(clueId, (generatedClueIdCounts.get(clueId) ?? 0) + 1);
  }
  const missingTranslationDiagnosticClueIds = translationDiagnosticClueIds === undefined
    ? []
    : translationDiagnosticClueIds
        .filter((clueId) => !generatedClueIdCounts.has(clueId))
        .sort(compareCodeUnits);
  const duplicateTranslationDiagnosticClueIds = translationDiagnosticClueIds === undefined
    ? []
    : translationDiagnosticClueIds
        .filter((clueId) => (generatedClueIdCounts.get(clueId) ?? 0) > 1)
        .sort(compareCodeUnits);
  let acceptedBaselineHashes: BatchArtifactHashes | null = null;
  let acceptedBaselineFailure: string | null = null;
  if (translationDiagnosticClueIds !== undefined && verificationProfile === 'canonical') {
    try {
      acceptedBaselineHashes = compareAcceptedTranslationBaseline({
        batch,
        acceptedRoot: options.baselineRoot!,
        authoredPack,
        generatedPack,
        evidence,
        translationDiagnosticClueIds,
      });
    } catch (error) {
      acceptedBaselineFailure = error instanceof Error ? error.message : String(error);
    }
  }
  const translationDiagnostics = diagnoseTranslations([{
    file: 'generated.en-et.csv',
    pack: translationPack,
  }]);
  translationDiagnostics.issues.sort((left, right) => issueOrder(
    { scope: 'translation', code: left.code, clueId: left.clueId, message: `${left.file}:${left.row}:${left.field}:${left.message}` },
    { scope: 'translation', code: right.code, clueId: right.clueId, message: `${right.file}:${right.row}:${right.field}:${right.message}` },
  ));
  translationDiagnostics.exceptions.sort((left, right) => compareCodeUnits(left.id, right.id));

  const unresolvedIssues: BatchUnresolvedIssue[] = [];
  if (acceptedBaselineFailure !== null) unresolvedIssues.push({
    scope: 'baseline', code: 'ACCEPTED_BASELINE_MISMATCH', clueId: null,
    message: acceptedBaselineFailure,
  });
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
  for (const clueId of missingTranslationDiagnosticClueIds) unresolvedIssues.push({
    scope: 'translation',
    code: 'MISSING_TRANSLATION_DIAGNOSTIC_CLUE',
    clueId,
    message: `Expected translation-diagnostic clue is missing from generated.en-et.csv: ${clueId}`,
  });
  for (const clueId of duplicateTranslationDiagnosticClueIds) unresolvedIssues.push({
    scope: 'translation',
    code: 'DUPLICATE_TRANSLATION_DIAGNOSTIC_CLUE',
    clueId,
    message: `Expected translation-diagnostic clue appears more than once in generated.en-et.csv: ${clueId}`,
  });

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
    verificationProfile,
    translationDiagnosticClueIds: translationDiagnosticClueIds ?? null,
    acceptedBaselineHashes,
    blocking: authored.blocking || generated.blocking || translationDiagnostics.blocking
      || missingTranslationDiagnosticClueIds.length > 0
      || duplicateTranslationDiagnosticClueIds.length > 0
      || acceptedBaselineFailure !== null
      || sources.some((source) => !source.ok) || unresolvedIssues.some((issue) => issue.scope === 'evidence' || issue.scope === 'samples'),
    artifactHashes: { authored: hash(bytes.authored!), generated: hash(bytes.generated!), evidence: hash(bytes.evidence!) },
    validations: { authored, generated }, translationDiagnostics, sources, samples: sampled.samples, unresolvedIssues,
  };
  const parsed = parseBatchVerificationReport(report);
  writeReportAtomically(reportPath, parsed, assertSafeReportPath, options.reportDependencies);
  return parsed;
}

async function runCli(argv = process.argv.slice(2)): Promise<number> {
  argv = restoreNpmRunArgs(argv, ['--batch', '--work-root', '--source-cache']);
  const value = (name: string) => {
    const index = argv.indexOf(name);
    return index < 0 ? undefined : argv[index + 1];
  };
  const batchId = value('--batch');
  if (batchId === undefined) throw new Error('--batch is required');
  const workRoot = value('--work-root') ?? resolve('content/work');
  const sourceCachePath = value('--source-cache');
  const sourceCache = sourceCachePath === undefined ? undefined : openFileSourceCache(sourceCachePath);
  const report = await verifyBatch({
    batchId, workRoot,
    ...(sourceCache === undefined ? {} : {
      sourceCache,
      reportDependencies: { beforeRename: () => sourceCache.publish() },
    }),
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
  return report.blocking ? 1 : 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2;
  });
}
