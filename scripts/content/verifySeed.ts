import { lstatSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { ReleaseSummary } from './releaseThresholds';
import { openDatabase, type DatabaseConnection } from '../../src/main/persistence/database';
import { parseStoredSource } from '../../src/shared/content/sourceCitation';
import { RELEASE_THRESHOLDS } from './releaseThresholds';
import { readEvidenceInputs, type ContentEvidence } from './evidence';
import { runSourceCheckCli } from './sourceCheck';
import { publishValidationReport, runValidationCli } from './validate';

const repositoryRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const defaultInputGlob = resolve(repositoryRoot, 'content/generated/*.en-et.csv');
const defaultReportPath = resolve(repositoryRoot, 'content/reports/release-inventory.json');
const defaultSeedPath = resolve(repositoryRoot, 'resources/content/seed.sqlite');
const defaultSourceCachePath = resolve(repositoryRoot, 'content/reports/source-check-cache.json');

interface VerifySeedOptions {
  inputs: string[];
  evidence: string[];
  report: string;
  seed: string;
  sourceCache: string;
}

interface ReleaseInventoryReport {
  [key: string]: unknown;
  generatedAt: string;
  mode: 'release';
  validation: {
    mode: 'release';
    blocking: boolean;
    summary: ReleaseSummary;
  };
  output: {
    sha256: string;
  };
  input: Record<string, unknown>;
  inventory: SeedInventory;
}

function parseCli(argv: readonly string[]): VerifySeedOptions {
  const inputs: string[] = [];
  const evidence: string[] = [];
  let report = defaultReportPath;
  let seed = defaultSeedPath;
  let sourceCache = defaultSourceCachePath;

  if (argv.length > 0 && !argv.some((argument) => argument.startsWith('--'))) {
    inputs.push(...argv);
    return { inputs, evidence, report, seed, sourceCache };
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--input') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--input is required');
      inputs.push(next);
      index += 1;
    } else if (argument === '--evidence') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--evidence is required');
      evidence.push(next);
      index += 1;
    } else if (argument === '--report') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--report is required');
      report = resolve(next);
      index += 1;
    } else if (argument === '--seed') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--seed is required');
      seed = resolve(next);
      index += 1;
    } else if (argument === '--source-cache') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--source-cache is required');
      sourceCache = resolve(next);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (inputs.length === 0) inputs.push(defaultInputGlob);
  return { inputs, evidence, report, seed, sourceCache };
}

export function readReleaseInventoryReport(path: string): ReleaseInventoryReport {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  if (typeof parsed.generatedAt !== 'string' || parsed.generatedAt === '') {
    throw new Error(`Release inventory report is missing generatedAt: ${path}`);
  }
  if (parsed.mode !== 'release') throw new Error(`Release inventory report top-level mode must be release: ${String(parsed.mode)}`);
  const validation = parsed.validation;
  if (validation === undefined || validation === null || typeof validation !== 'object') throw new Error(`Release inventory report is missing validation: ${path}`);
  const cast = validation as { mode?: string; blocking?: boolean; summary?: unknown };
  if (cast.mode !== 'release') throw new Error(`Release inventory report must be in release mode: ${cast.mode}`);
  if (cast.blocking !== false) throw new Error('Release inventory report indicates blocking issues');
  if (cast.summary === undefined || cast.summary === null || typeof cast.summary !== 'object') {
    throw new Error('Release inventory report is missing a summary section');
  }
  const summary = cast.summary as ReleaseSummary;
  for (const key of Object.keys(RELEASE_THRESHOLDS) as (keyof ReleaseSummary)[]) {
    const expected = RELEASE_THRESHOLDS[key];
    if (typeof summary[key] !== 'number' || summary[key] < expected) {
      throw new Error(`Release inventory report is below threshold for ${key}: ${summary[key]}`);
    }
  }
  const input = parsed.input;
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Release inventory report is missing an input manifest');
  }
  const output = parsed.output;
  if (output === null || typeof output !== 'object' || Array.isArray(output)
    || typeof (output as { sha256?: unknown }).sha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test((output as { sha256: string }).sha256)) {
    throw new Error('Release inventory report is missing a valid output SHA-256');
  }
  const inventory = parsed.inventory;
  if (inventory === null || typeof inventory !== 'object' || Array.isArray(inventory)) {
    throw new Error('Release inventory report is missing an inventory');
  }
  for (const key of Object.keys(RELEASE_THRESHOLDS) as (keyof SeedInventory)[]) {
    if (!Number.isInteger((inventory as Record<string, unknown>)[key])) {
      throw new Error(`Release inventory report has invalid inventory ${key}`);
    }
  }
  return {
    ...parsed,
    generatedAt: parsed.generatedAt,
    mode: 'release',
    validation: { mode: 'release', blocking: false, summary },
    input: input as Record<string, unknown>,
    output: output as { sha256: string },
    inventory: inventory as unknown as SeedInventory,
  };
}

interface SeedInventory {
  boardClues: number;
  categorySets: number;
  distinctCategoryNames: number;
  finalClues: number;
  easySets: number;
  mediumSets: number;
  hardSets: number;
}

export function inspectSeed(
  databasePath: string,
  evidenceByClueId: ReadonlyMap<string, ContentEvidence>,
): { fileSha256: string; inventory: SeedInventory } {
  const stat = lstatSync(databasePath, { throwIfNoEntry: false });
  if (stat === undefined || !stat.isFile()) throw new Error(`Seed database must exist: ${databasePath}`);
  const fileHash = createHash('sha256').update(readFileSync(databasePath)).digest('hex');
  let database: DatabaseConnection | undefined;
  try {
    database = openDatabase({ filePath: databasePath, readonly: true });
    const checks = database.pragma('integrity_check') as Array<{ integrity_check: string }>;
    if (checks.length === 0 || checks[0]?.integrity_check !== 'ok') {
      throw new Error(`SQLite integrity check failed: ${JSON.stringify(checks[0])}`);
    }
    const storedSources = database.prepare('SELECT id, source FROM clues').all() as Array<{ id: string; source: string }>;
    const consumedEvidence = new Set<string>();
    for (const row of storedSources) {
      const evidence = evidenceByClueId.get(row.id);
      const source = parseStoredSource(row.source);
      if (evidence === undefined || source?.format !== 'quiz-stage-csv-v2'
        || source.title !== evidence.supportingSource.title
        || source.url !== evidence.supportingSource.url
        || source.license !== evidence.supportingSource.license
        || source.retrievedAt !== evidence.supportingSource.retrievedAt
        || source.translationStatus !== 'reviewed'
        || source.sourceId !== evidence.supportingSource.sourceId
        || source.factualVerifiedAt !== evidence.factualReview.reviewedAt) {
        throw new Error(`Seed clue ${row.id} does not contain its exact v2 evidence citation`);
      }
      consumedEvidence.add(row.id);
    }
    if (consumedEvidence.size !== evidenceByClueId.size) {
      throw new Error(`Seed evidence bindings are not one-to-one: ${consumedEvidence.size}/${evidenceByClueId.size}`);
    }
    return {
      fileSha256: fileHash,
      inventory: {
        boardClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
        categorySets: database.prepare("SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
        finalClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round = 'final'").pluck().get() as number,
        distinctCategoryNames: database.prepare("SELECT COUNT(DISTINCT(json_extract(name_json, '$.en'))) FROM category_sets WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
        easySets: database.prepare(
          "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'easy'",
        ).pluck().get() as number,
        mediumSets: database.prepare(
          "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'medium'",
        ).pluck().get() as number,
        hardSets: database.prepare(
          "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'hard'",
        ).pluck().get() as number,
      },
    };
  } finally {
    if (database?.open) database.close();
  }
}

function ensureSeedInventoryMatchesReport(
  seedInventory: SeedInventory,
  releaseSummary: ReleaseSummary,
  reportedInventory: SeedInventory,
): void {
  const keys = Object.keys(RELEASE_THRESHOLDS) as (keyof ReleaseSummary)[];
  for (const key of keys) {
    if (seedInventory[key] !== releaseSummary[key]) {
      throw new Error(`Seed inventory ${key} does not match validation summary: ${seedInventory[key]} != ${releaseSummary[key]}`);
    }
    if (seedInventory[key] !== reportedInventory[key]) {
      throw new Error(`Seed inventory ${key} does not match report inventory: ${seedInventory[key]} != ${reportedInventory[key]}`);
    }
  }
}

export interface VerifySeedDependencies {
  runValidation?: typeof runValidationCli;
  runSourceCheck?: typeof runSourceCheckCli;
}

function createTemporaryReport(path: string): string {
  const existing = lstatSync(path, { throwIfNoEntry: false });
  const initial = existing?.isFile() ? readFileSync(path) : Buffer.from('{}\n');
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = `${path}.${process.pid}-${randomUUID()}.verify.tmp`;
    try {
      writeFileSync(candidate, initial, { flag: 'wx' });
      return candidate;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
  throw new Error('Could not allocate a unique verification report temporary file');
}

export async function runVerifySeed(
  argv: readonly string[] = process.argv.slice(2),
  dependencies: VerifySeedDependencies = {},
): Promise<number> {
  const options = parseCli(argv);
  const evidenceByClueId = await readEvidenceInputs(options.evidence);
  const temporaryReport = createTemporaryReport(options.report);
  try {
    const validation = await (dependencies.runValidation ?? runValidationCli)([
      ...options.inputs.flatMap((input) => ['--input', input]),
      ...options.evidence.flatMap((evidence) => ['--evidence', evidence]),
      '--mode', 'release',
      '--report', temporaryReport,
    ], evidenceByClueId);
    if (validation !== 0) return validation;

    const sourceChecks = await (dependencies.runSourceCheck ?? runSourceCheckCli)([
      ...options.inputs.flatMap((input) => ['--input', input]),
      '--cache', options.sourceCache,
    ]);
    if (sourceChecks !== 0) return sourceChecks;

    const releaseInventory = readReleaseInventoryReport(temporaryReport);
    const { fileSha256, inventory: seedInventory } = inspectSeed(options.seed, evidenceByClueId);
    if (releaseInventory.output.sha256 !== fileSha256) {
      throw new Error(`Seed SHA-256 mismatch: report has ${releaseInventory.output.sha256}, file has ${fileSha256}`);
    }
    ensureSeedInventoryMatchesReport(seedInventory, releaseInventory.validation.summary, releaseInventory.inventory);
    publishValidationReport(options.report, releaseInventory, { placement: 'top-level' });

    process.stdout.write(`Verified release seed:
  mode: ${releaseInventory.validation.mode}
  board: ${seedInventory.boardClues}
  categorySets: ${seedInventory.categorySets}
  finalClues: ${seedInventory.finalClues}
`);
    return 0;
  } finally {
    try { unlinkSync(temporaryReport); } catch { /* owned temporary may already be absent */ }
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runVerifySeed().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
