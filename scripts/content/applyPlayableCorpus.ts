import { randomUUID } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'csv-stringify/sync';
import { parsePackCsv } from '../../src/main/content/csvPacks';
import { CSV_COLUMNS } from '../../src/shared/content/csvColumns';
import { applyPlayableCorpus } from './playability/apply';
import { PLAYABLE_TARGETS, type PlayableTarget } from './playability/targets';
import type { PlayableCategory } from './playability/types';
import { validatePlayableCorpus } from './playability/validateBank';
import { parseEvidenceJsonl, serializeEvidence, type ContentEvidence } from './evidence';
import { PRODUCTION_BATCHES } from './productionBatches';

const DEFAULT_OUTPUT_ROOT = 'content/work/playable-corpus-overhaul/staged';
const INVENTORY_COLUMNS = [
  'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind',
  'round', 'tier', 'difficulty', 'macro_topic', 'enabled',
] as const;

type RequireModule = (id: string) => unknown;

type StageOptions = Readonly<{
  acceptedRoot: string;
  outputRoot: string;
  categories: readonly PlayableCategory[];
  targets: readonly PlayableTarget[];
}>;

type PublishDependencies = Readonly<{
  createTemporaryId?: () => string;
  rename?: (source: string, destination: string) => void;
  restore?: (source: string, destination: string) => void;
}>;

type StagedArtifact = Readonly<{
  batchId: string;
  kind: 'authored' | 'generated' | 'evidence';
  stagedPath: string;
  destinationPath: string;
}>;

function artifactDefinitions(acceptedRoot: string, outputRoot: string): readonly StagedArtifact[] {
  return PRODUCTION_BATCHES.flatMap(({ id: batchId }) => [
    {
      batchId,
      kind: 'authored' as const,
      stagedPath: resolve(outputRoot, `authored/${batchId}.csv`),
      destinationPath: resolve(acceptedRoot, `content/authored/${batchId}.csv`),
    },
    {
      batchId,
      kind: 'generated' as const,
      stagedPath: resolve(outputRoot, `generated/${batchId}.en-et.csv`),
      destinationPath: resolve(acceptedRoot, `content/generated/${batchId}.en-et.csv`),
    },
    {
      batchId,
      kind: 'evidence' as const,
      stagedPath: resolve(outputRoot, `evidence/${batchId}.jsonl`),
      destinationPath: resolve(acceptedRoot, `content/evidence/${batchId}.jsonl`),
    },
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

function assertDistinctStagingPaths(acceptedRoot: string, outputRoot: string): void {
  const artifacts = artifactDefinitions(acceptedRoot, outputRoot);
  const destinationDirectories = new Set(
    artifacts.map(({ destinationPath }) => resolveThroughExistingAncestor(dirname(destinationPath))),
  );
  for (const { stagedPath } of artifacts) {
    const stagedDirectory = resolveThroughExistingAncestor(dirname(stagedPath));
    if ([...destinationDirectories].some((destinationDirectory) =>
      containsPath(stagedDirectory, destinationDirectory)
      || containsPath(destinationDirectory, stagedDirectory))) {
      throw new Error(`Staged artifact overlaps accepted destination: ${stagedPath}`);
    }
  }
}

function parseRows(
  text: string,
  path: string,
  source: 'accepted' | 'staged',
): Array<Record<string, string>> {
  const parsed = parsePackCsv(text);
  const invalid = parsed.rows.find((row) => row.variantErrors.length > 0);
  if (invalid !== undefined) {
    throw new Error(
      `Invalid accepted variants in ${source} CSV artifact ${path} at row ${invalid.rowNumber}`,
    );
  }
  return parsed.rows.map((row) => Object.fromEntries(
    CSV_COLUMNS.map((column) => [column, row[column]]),
  ));
}

function serializeRows(rows: readonly Record<string, string>[]): string {
  return stringify([...rows], {
    header: true,
    columns: [...CSV_COLUMNS],
    record_delimiter: '\r\n',
  });
}

function readAcceptedRows(path: string): Array<Record<string, string>> {
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

function validateGlobalInputs(options: StageOptions): void {
  if (options.targets.length !== PLAYABLE_TARGETS.length) {
    throw new Error(
      `Expected ${PLAYABLE_TARGETS.length} canonical playable targets; found ${options.targets.length}`,
    );
  }
  for (const [index, expected] of PLAYABLE_TARGETS.entries()) {
    const actual = options.targets[index]!;
    if (actual.categorySetId !== expected.categorySetId
      || actual.batchId !== expected.batchId
      || actual.packId !== expected.packId
      || actual.difficulty !== expected.difficulty) {
      throw new Error(
        `Playable staging targets must exactly match the canonical ledger at index ${index}`,
      );
    }
  }
  validatePlayableCorpus(options.categories, options.targets);
  const productionBatchIds = new Set(PRODUCTION_BATCHES.map(({ id }) => id));
  for (const target of options.targets) {
    if (!productionBatchIds.has(target.batchId)) {
      throw new Error(`Playable target has an unknown batch: ${target.batchId}`);
    }
  }
  for (const batchId of productionBatchIds) {
    if (!options.targets.some((target) => target.batchId === batchId)) {
      throw new Error(`Missing playable targets for batch: ${batchId}`);
    }
  }
}

function buildExpectedStage(options: StageOptions): Readonly<{
  artifacts: ReadonlyMap<string, string>;
  replacedClueIds: readonly string[];
}> {
  validateGlobalInputs(options);
  const staged = new Map<string, string>();
  const replacedClueIds: string[] = [];
  for (const { id: batchId } of PRODUCTION_BATCHES) {
    const authoredPath = resolve(options.acceptedRoot, `content/authored/${batchId}.csv`);
    const generatedPath = resolve(options.acceptedRoot, `content/generated/${batchId}.en-et.csv`);
    const evidencePath = resolve(options.acceptedRoot, `content/evidence/${batchId}.jsonl`);
    const result = applyPlayableCorpus({
      authoredRows: readAcceptedRows(authoredPath),
      generatedRows: readAcceptedRows(generatedPath),
      evidence: readAcceptedEvidence(evidencePath),
      targets: options.targets.filter((target) => target.batchId === batchId),
      categories: options.categories.filter((category) => category.batchId === batchId),
    });
    const outputAuthored = resolve(options.outputRoot, `authored/${batchId}.csv`);
    const outputGenerated = resolve(options.outputRoot, `generated/${batchId}.en-et.csv`);
    const outputEvidence = resolve(options.outputRoot, `evidence/${batchId}.jsonl`);
    staged.set(outputAuthored, serializeRows(result.authoredRows));
    staged.set(outputGenerated, serializeRows(result.generatedRows));
    staged.set(outputEvidence, serializeEvidence(result.evidence));
    replacedClueIds.push(...result.replacedClueIds);
  }
  return { artifacts: staged, replacedClueIds };
}

export function stagePlayableCorpus(options: StageOptions): Readonly<{
  artifactPaths: readonly string[];
  replacedClueIds: readonly string[];
}> {
  assertDistinctStagingPaths(options.acceptedRoot, options.outputRoot);
  const expected = buildExpectedStage(options);
  for (const [path, bytes] of expected.artifacts) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
  }
  return { artifactPaths: [...expected.artifacts.keys()], replacedClueIds: expected.replacedClueIds };
}

function readStagedArtifact(path: string): Buffer {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (stat === undefined) throw new Error(`Missing staged artifact: ${path}`);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`Staged artifact is not a safe regular file: ${path}`);
  }
  return readFileSync(path);
}

function validateStagedBatch(
  batchId: string,
  authoredBytes: Buffer,
  generatedBytes: Buffer,
  evidenceBytes: Buffer,
): void {
  const authored = parseRows(authoredBytes.toString('utf8'), `${batchId} authored`, 'staged');
  const generated = parseRows(generatedBytes.toString('utf8'), `${batchId} generated`, 'staged');
  const evidence = parseEvidenceJsonl(evidenceBytes.toString('utf8'), `${batchId}.jsonl`);
  if (authored.length !== generated.length) {
    throw new Error(`Staged authored/generated inventory row count differs for ${batchId}`);
  }
  for (const [index, authoredRow] of authored.entries()) {
    const generatedRow = generated[index]!;
    if (INVENTORY_COLUMNS.some((column) => authoredRow[column] !== generatedRow[column])) {
      throw new Error(`Staged authored/generated inventory differs for ${batchId} at row ${index}`);
    }
  }
  if (evidence.size !== generated.length || generated.some((row) => !evidence.has(row.clue_id))) {
    throw new Error(`Staged evidence inventory differs for ${batchId}`);
  }
}

function removeOwned(path: string, errors: Error[]): void {
  try {
    unlinkSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') errors.push(error as Error);
  }
}

export function publishPlayableCorpusStage(options: StageOptions & Readonly<{
  dependencies?: PublishDependencies;
}>): void {
  assertDistinctStagingPaths(options.acceptedRoot, options.outputRoot);
  const expected = buildExpectedStage(options);
  const artifacts = artifactDefinitions(options.acceptedRoot, options.outputRoot);
  const bytes = new Map<string, Buffer>();
  for (const artifact of artifacts) bytes.set(artifact.stagedPath, readStagedArtifact(artifact.stagedPath));
  for (const { id: batchId } of PRODUCTION_BATCHES) {
    const batchArtifacts = artifacts.filter((artifact) => artifact.batchId === batchId);
    validateStagedBatch(
      batchId,
      bytes.get(batchArtifacts.find(({ kind }) => kind === 'authored')!.stagedPath)!,
      bytes.get(batchArtifacts.find(({ kind }) => kind === 'generated')!.stagedPath)!,
      bytes.get(batchArtifacts.find(({ kind }) => kind === 'evidence')!.stagedPath)!,
    );
  }
  for (const artifact of artifacts) {
    const expectedBytes = Buffer.from(expected.artifacts.get(artifact.stagedPath)!, 'utf8');
    if (!bytes.get(artifact.stagedPath)!.equals(expectedBytes)) {
      throw new Error(`Staged artifact does not match expected transform: ${artifact.stagedPath}`);
    }
  }

  const token = (options.dependencies?.createTemporaryId ?? randomUUID)();
  const rename = options.dependencies?.rename ?? renameSync;
  const restore = options.dependencies?.restore ?? renameSync;
  const temporaries = new Map(
    artifacts.map((artifact) => [artifact.destinationPath, `${artifact.destinationPath}.${token}.tmp`]),
  );
  const backups = new Map(
    artifacts.map((artifact) => [artifact.destinationPath, `${artifact.destinationPath}.${token}.bak`]),
  );
  const hadOriginal = new Set<string>();
  const replaced = new Set<string>();
  const ownedTemporaries = new Set<string>();
  const ownedBackups = new Set<string>();

  try {
    for (const path of [...temporaries.values(), ...backups.values()]) {
      if (existsSync(path)) throw new Error(`Publisher-owned path collision: ${path}`);
    }
    for (const artifact of artifacts) {
      const temporary = temporaries.get(artifact.destinationPath)!;
      mkdirSync(dirname(artifact.destinationPath), { recursive: true });
      writeFileSync(temporary, bytes.get(artifact.stagedPath)!, { flag: 'wx' });
      ownedTemporaries.add(temporary);
    }
    for (const artifact of artifacts) {
      if (existsSync(artifact.destinationPath)) {
        const backup = backups.get(artifact.destinationPath)!;
        rename(artifact.destinationPath, backup);
        hadOriginal.add(artifact.destinationPath);
        ownedBackups.add(backup);
      }
    }
    for (const artifact of artifacts) {
      const temporary = temporaries.get(artifact.destinationPath)!;
      rename(temporary, artifact.destinationPath);
      replaced.add(artifact.destinationPath);
      ownedTemporaries.delete(temporary);
    }
  } catch (error) {
    const rollbackErrors: Error[] = [];
    for (const artifact of [...artifacts].reverse()) {
      if (replaced.has(artifact.destinationPath)) removeOwned(artifact.destinationPath, rollbackErrors);
      if (hadOriginal.has(artifact.destinationPath)) {
        const backup = backups.get(artifact.destinationPath)!;
        try {
          restore(backup, artifact.destinationPath);
          ownedBackups.delete(backup);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError as Error);
        }
      }
    }
    for (const temporary of ownedTemporaries) removeOwned(temporary, rollbackErrors);
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `Playable corpus publication failed with rollback errors: ${rollbackErrors.map(({ message }) => message).join('; ')}`,
      );
    }
    throw error;
  }

  const cleanupErrors: Error[] = [];
  for (const path of [...ownedTemporaries, ...ownedBackups]) removeOwned(path, cleanupErrors);
  if (cleanupErrors.length > 0) {
    throw new AggregateError(cleanupErrors, 'Playable corpus publication succeeded but cleanup failed');
  }
}

export function parsePlayableCorpusArgs(argv: readonly string[]): Readonly<{
  outputRoot: string;
  publish: boolean;
}> {
  let outputRoot = DEFAULT_OUTPUT_ROOT;
  let publish = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === '--publish') {
      publish = true;
      continue;
    }
    if (argument === '--output-root') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error('--output-root requires a path');
      }
      outputRoot = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return { outputRoot, publish };
}

export function loadPlayableCorpus(
  requireModule: RequireModule = createRequire(import.meta.url),
): readonly PlayableCategory[] {
  const bankPath = resolve(import.meta.dirname, 'playability/bank.ts');
  const bank = requireModule(bankPath) as { buildPlayableCorpus?: unknown };
  if (typeof bank.buildPlayableCorpus !== 'function') {
    throw new Error('playability/bank.ts must export a callable buildPlayableCorpus');
  }
  const categories = bank.buildPlayableCorpus();
  if (!Array.isArray(categories)) throw new Error('buildPlayableCorpus must return an array');
  return categories as readonly PlayableCategory[];
}

function runCli(argv = process.argv.slice(2)): void {
  const repositoryRoot = resolve(import.meta.dirname, '../..');
  const args = parsePlayableCorpusArgs(argv);
  const pipeline = {
    acceptedRoot: repositoryRoot,
    outputRoot: resolve(repositoryRoot, args.outputRoot),
    categories: loadPlayableCorpus(),
    targets: PLAYABLE_TARGETS,
  } as const;
  const result = stagePlayableCorpus(pipeline);
  if (args.publish) publishPlayableCorpusStage(pipeline);
  process.stdout.write(
    `Staged ${result.replacedClueIds.length} playable corpus clues across ${PRODUCTION_BATCHES.length} batches${args.publish ? ' and published 36 artifacts' : ''}.\n`,
  );
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
