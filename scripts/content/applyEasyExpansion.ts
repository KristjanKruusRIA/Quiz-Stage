import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePackCsv } from '../../src/main/content/csvPacks';
import { CSV_COLUMNS, type CsvColumn } from '../../src/shared/content/csvColumns';
import {
  applyEasyExpansion,
  serializeEasyExpansionRows,
  type ApplyEasyExpansionInput,
  type ApplyEasyExpansionResult,
  type EasyExpansionCsvRow,
} from './easyExpansion/apply';
import {
  buildEasyExpansionCorpus,
  getEasyExpansionBank,
} from './easyExpansion/bank';
import {
  EASY_EXPANSION_BASELINE_MANIFEST_PATH,
  parseEasyExpansionBaselineManifest,
  type EasyExpansionBaselineManifest,
} from './easyExpansion/createBaselineManifest';
import type { EasyExpansionCategory } from './easyExpansion/types';
import {
  parseEvidenceJsonl,
  serializeEvidence,
  type ContentEvidence,
} from './evidence';
import {
  acceptedBatchPaths,
  FINAL_BATCH,
  PRODUCTION_BATCHES,
} from './productionBatches';

const DEFAULT_OUTPUT_ROOT = 'content/work/easy-expansion';
const ORIGINAL_BATCH_IDS = new Set(PRODUCTION_BATCHES
  .filter(({ id }) => /^(?:0[1-9]|1[0-2])-/u.test(id))
  .map(({ id }) => id));
const ACCEPTED_BATCHES = Object.freeze([...PRODUCTION_BATCHES, FINAL_BATCH]);
const INVENTORY_COLUMNS = [
  'clue_id',
  'pack_id',
  'pack_name',
  'category_set_id',
  'content_kind',
  'round',
  'tier',
  'difficulty',
  'macro_topic',
  'enabled',
] as const satisfies readonly CsvColumn[];

type ApplyEasyExpansion = (input: ApplyEasyExpansionInput) => ApplyEasyExpansionResult;

export type StageEasyExpansionDependencies = Readonly<{
  apply?: ApplyEasyExpansion;
  getBank?: (batchId: string) => readonly EasyExpansionCategory[];
  buildCorpus?: () => readonly EasyExpansionCategory[];
  parseBaseline?: (text: string) => EasyExpansionBaselineManifest;
  serializeRows?: (rows: readonly EasyExpansionCsvRow[]) => string;
  serializeEvidenceRecords?: (records: readonly ContentEvidence[]) => string;
}>;

export type StageEasyExpansionOptions = Readonly<{
  batchId: string;
  acceptedRoot: string;
  outputRoot: string;
  dependencies?: StageEasyExpansionDependencies;
}>;

export type StageEasyExpansionResult = Readonly<{
  artifactPaths: readonly string[];
  expansionClueIds: readonly string[];
  expansionCategorySetIds: readonly string[];
}>;

type OutputArtifacts = Readonly<{
  authored: string;
  generated: string;
  evidence: string;
}>;

function assertOriginalBatch(batchId: string): void {
  if (!ORIGINAL_BATCH_IDS.has(batchId)) {
    throw new Error(`Easy expansion is limited to original packs 01-12: ${batchId}`);
  }
}

function outputArtifacts(outputRoot: string, batchId: string): OutputArtifacts {
  const directory = resolve(outputRoot, batchId);
  return Object.freeze({
    authored: resolve(directory, 'authored.csv'),
    generated: resolve(directory, 'generated.en-et.csv'),
    evidence: resolve(directory, 'evidence.jsonl'),
  });
}

function acceptedArtifacts(acceptedRoot: string): readonly string[] {
  return Object.freeze([
    ...ACCEPTED_BATCHES.flatMap(({ id }) => {
      const paths = acceptedBatchPaths(id);
      return [paths.authored, paths.generated, paths.evidence]
        .map((path) => resolve(acceptedRoot, path));
    }),
    resolve(acceptedRoot, EASY_EXPANSION_BASELINE_MANIFEST_PATH),
  ]);
}

function comparablePath(path: string): string {
  const absolute = resolve(path);
  return process.platform === 'win32' ? absolute.toLocaleLowerCase('en') : absolute;
}

function resolveThroughExistingAncestor(path: string): string {
  let ancestor = resolve(path);
  const missingSegments: string[] = [];
  while (!existsSync(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor) throw new Error(`Cannot resolve path ancestor: ${path}`);
    missingSegments.unshift(basename(ancestor));
    ancestor = parent;
  }
  return resolve(realpathSync.native(ancestor), ...missingSegments);
}

function containsPath(ancestor: string, candidate: string): boolean {
  const relation = relative(comparablePath(ancestor), comparablePath(candidate));
  return relation === ''
    || (relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation));
}

function assertDistinctStagingPaths(
  acceptedRoot: string,
  artifacts: OutputArtifacts,
): void {
  const acceptedPaths = acceptedArtifacts(acceptedRoot)
    .map((path) => resolveThroughExistingAncestor(path));
  const acceptedDirectories = new Set(
    acceptedPaths.map((path) => resolveThroughExistingAncestor(dirname(path))),
  );
  const stagedPaths = Object.values(artifacts)
    .map((path) => resolveThroughExistingAncestor(path));
  const stagedDirectories = new Set(
    stagedPaths.map((path) => resolveThroughExistingAncestor(dirname(path))),
  );

  for (const stagedDirectory of stagedDirectories) {
    if ([...acceptedDirectories].some((acceptedDirectory) =>
      containsPath(stagedDirectory, acceptedDirectory)
      || containsPath(acceptedDirectory, stagedDirectory))) {
      throw new Error(`Staged artifact overlaps accepted destination: ${stagedDirectory}`);
    }
  }
  const acceptedComparable = new Set(acceptedPaths.map(comparablePath));
  for (const stagedPath of stagedPaths) {
    if (acceptedComparable.has(comparablePath(stagedPath))) {
      throw new Error(`Staged artifact overlaps accepted destination: ${stagedPath}`);
    }
  }
}

function assertStagingWithinPhysicalOutputRoot(
  outputRoot: string,
  artifacts: OutputArtifacts,
): void {
  const physicalOutputRoot = resolveThroughExistingAncestor(outputRoot);
  for (const stagedPath of Object.values(artifacts)) {
    const physicalStagedPath = resolveThroughExistingAncestor(stagedPath);
    if (!containsPath(physicalOutputRoot, physicalStagedPath)) {
      throw new Error(`Staged artifact escapes the physical output root: ${stagedPath}`);
    }
  }
}

function assertSafeStagingPaths(
  acceptedRoot: string,
  outputRoot: string,
  artifacts: OutputArtifacts,
): void {
  assertDistinctStagingPaths(acceptedRoot, artifacts);
  assertStagingWithinPhysicalOutputRoot(outputRoot, artifacts);
}

function assertSafeExistingStagedArtifacts(artifacts: OutputArtifacts): void {
  for (const path of Object.values(artifacts)) {
    const stat = lstatSync(path, { throwIfNoEntry: false });
    if (stat === undefined) continue;
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(`Staged artifact is not a safe regular file: ${path}`);
    }
    if (stat.nlink > 1) {
      throw new Error(`Staged artifact has multiple hard links: ${path}`);
    }
  }
}

function parseRows(text: string, path: string, source: 'accepted' | 'staged'): EasyExpansionCsvRow[] {
  const parsed = parsePackCsv(text);
  const invalid = parsed.rows.find((row) => row.variantErrors.length > 0);
  if (invalid !== undefined) {
    throw new Error(
      `Invalid accepted variants in ${source} CSV artifact ${path} at row ${invalid.rowNumber}`,
    );
  }
  return parsed.rows.map((row) => Object.freeze(Object.fromEntries(
    CSV_COLUMNS.map((column) => [column, row[column]]),
  ) as Record<CsvColumn, string>));
}

function readAcceptedRows(path: string): readonly EasyExpansionCsvRow[] {
  try {
    return parseRows(readFileSync(path, 'utf8'), path, 'accepted');
  } catch (error) {
    throw new Error(
      `Cannot read accepted CSV artifact ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function readAcceptedEvidence(path: string): readonly ContentEvidence[] {
  try {
    return [...parseEvidenceJsonl(readFileSync(path, 'utf8'), path).values()];
  } catch (error) {
    throw new Error(
      `Cannot read accepted evidence artifact ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function readBaseline(
  acceptedRoot: string,
  parser: (text: string) => EasyExpansionBaselineManifest,
): EasyExpansionBaselineManifest {
  const path = resolve(acceptedRoot, EASY_EXPANSION_BASELINE_MANIFEST_PATH);
  try {
    return parser(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `Cannot read Easy expansion baseline manifest ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function buildApplyInput(
  options: StageEasyExpansionOptions,
  dependencies: Required<Pick<StageEasyExpansionDependencies,
    'getBank' | 'buildCorpus' | 'parseBaseline'>>,
): ApplyEasyExpansionInput {
  const generatedByBatch = new Map<string, readonly EasyExpansionCsvRow[]>();
  const evidenceByBatch = new Map<string, readonly ContentEvidence[]>();
  for (const { id } of ACCEPTED_BATCHES) {
    const paths = acceptedBatchPaths(id);
    generatedByBatch.set(
      id,
      readAcceptedRows(resolve(options.acceptedRoot, paths.generated)),
    );
    evidenceByBatch.set(
      id,
      readAcceptedEvidence(resolve(options.acceptedRoot, paths.evidence)),
    );
  }

  const selectedPaths = acceptedBatchPaths(options.batchId);
  return {
    batchId: options.batchId,
    authoredRows: readAcceptedRows(resolve(options.acceptedRoot, selectedPaths.authored)),
    generatedRows: generatedByBatch.get(options.batchId)!,
    evidence: evidenceByBatch.get(options.batchId)!,
    categories: dependencies.getBank(options.batchId),
    baseline: readBaseline(options.acceptedRoot, dependencies.parseBaseline),
    collisionCorpus: {
      rows: ACCEPTED_BATCHES.flatMap(({ id }) => generatedByBatch.get(id)!),
      evidence: ACCEPTED_BATCHES.flatMap(({ id }) => evidenceByBatch.get(id)!),
      phaseB: dependencies.buildCorpus(),
    },
  };
}

function validateStagedArtifacts(
  batchId: string,
  artifacts: Readonly<{ authored: string; generated: string; evidence: string }>,
): void {
  const authored = parseRows(artifacts.authored, `${batchId} authored`, 'staged');
  const generated = parseRows(artifacts.generated, `${batchId} generated`, 'staged');
  const evidence = parseEvidenceJsonl(artifacts.evidence, `${batchId} evidence`);
  if (authored.length !== generated.length) {
    throw new Error(`Staged authored/generated inventory row count differs for ${batchId}`);
  }
  for (const [index, authoredRow] of authored.entries()) {
    const generatedRow = generated[index]!;
    if (INVENTORY_COLUMNS.some((column) => authoredRow[column] !== generatedRow[column])) {
      throw new Error(`Staged authored/generated inventory differs for ${batchId} at row ${index}`);
    }
  }
  if (evidence.size !== generated.length
    || generated.some(({ clue_id: clueId }) => !evidence.has(clueId))) {
    throw new Error(`Staged evidence inventory differs for ${batchId}`);
  }
}

export function stageEasyExpansion(options: StageEasyExpansionOptions): StageEasyExpansionResult {
  assertOriginalBatch(options.batchId);
  const paths = outputArtifacts(options.outputRoot, options.batchId);
  assertSafeStagingPaths(options.acceptedRoot, options.outputRoot, paths);

  const apply = options.dependencies?.apply ?? applyEasyExpansion;
  const serializeRows = options.dependencies?.serializeRows ?? serializeEasyExpansionRows;
  const serializeEvidenceRecords = options.dependencies?.serializeEvidenceRecords
    ?? serializeEvidence;
  const input = buildApplyInput(options, {
    getBank: options.dependencies?.getBank ?? getEasyExpansionBank,
    buildCorpus: options.dependencies?.buildCorpus ?? buildEasyExpansionCorpus,
    parseBaseline: options.dependencies?.parseBaseline ?? parseEasyExpansionBaselineManifest,
  });
  const result = apply(input);
  const artifacts = Object.freeze({
    authored: serializeRows(result.authoredRows),
    generated: serializeRows(result.generatedRows),
    evidence: serializeEvidenceRecords(result.evidence),
  });
  validateStagedArtifacts(options.batchId, artifacts);

  assertSafeStagingPaths(options.acceptedRoot, options.outputRoot, paths);
  assertSafeExistingStagedArtifacts(paths);
  mkdirSync(dirname(paths.authored), { recursive: true });
  assertSafeStagingPaths(options.acceptedRoot, options.outputRoot, paths);
  assertSafeExistingStagedArtifacts(paths);
  writeFileSync(paths.authored, artifacts.authored);
  writeFileSync(paths.generated, artifacts.generated);
  writeFileSync(paths.evidence, artifacts.evidence);

  return Object.freeze({
    artifactPaths: Object.freeze([paths.authored, paths.generated, paths.evidence]),
    expansionClueIds: Object.freeze([...result.expansionClueIds]),
    expansionCategorySetIds: Object.freeze([...result.expansionCategorySetIds]),
  });
}

export function parseEasyExpansionArgs(argv: readonly string[]): Readonly<{
  batchId: string;
  outputRoot: string;
}> {
  let batchId: string | undefined;
  let outputRoot = DEFAULT_OUTPUT_ROOT;
  let hasOutputRoot = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--batch') {
      if (batchId !== undefined) throw new Error('Duplicate argument: --batch');
      const value = argv[index + 1];
      if (value === undefined || value.length === 0 || value.startsWith('--')) {
        throw new Error('--batch requires a value');
      }
      batchId = value;
      index += 1;
      continue;
    }
    if (argument === '--output-root') {
      if (hasOutputRoot) throw new Error('Duplicate argument: --output-root');
      const value = argv[index + 1];
      if (value === undefined || value.length === 0 || value.startsWith('--')) {
        throw new Error('--output-root requires a path');
      }
      outputRoot = value;
      hasOutputRoot = true;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (batchId === undefined) throw new Error('--batch is required');
  assertOriginalBatch(batchId);
  return Object.freeze({ batchId, outputRoot });
}

function runCli(argv = process.argv.slice(2)): void {
  const acceptedRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const args = parseEasyExpansionArgs(argv);
  const result = stageEasyExpansion({
    batchId: args.batchId,
    acceptedRoot,
    outputRoot: resolve(acceptedRoot, args.outputRoot),
  });
  process.stdout.write(
    `Staged ${result.expansionClueIds.length} Easy expansion clues for ${args.batchId}.\n`,
  );
}

if (process.argv[1] !== undefined
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
