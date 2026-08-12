import { lstatSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { ReleaseSummary } from './releaseThresholds';
import { openDatabase, type DatabaseConnection } from '../../src/main/persistence/database';
import { RELEASE_THRESHOLDS } from './releaseThresholds';
import { runSourceCheckCli } from './sourceCheck';
import { runValidationCli } from './validate';

const repositoryRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const defaultInputGlob = resolve(repositoryRoot, 'content/generated/*.en-et.csv');
const defaultReportPath = resolve(repositoryRoot, 'content/reports/release-inventory.json');
const defaultSeedPath = resolve(repositoryRoot, 'resources/content/seed.sqlite');
const defaultSourceCachePath = resolve(repositoryRoot, 'content/reports/source-check-cache.json');

interface VerifySeedOptions {
  inputs: string[];
  report: string;
  seed: string;
  sourceCache: string;
}

interface ReleaseInventoryReport {
  validation: {
    mode: 'release';
    blocking: boolean;
    summary: ReleaseSummary;
  };
  output?: {
    sha256?: string;
  };
  input?: unknown;
}

function parseCli(argv: readonly string[]): VerifySeedOptions {
  const inputs: string[] = [];
  let report = defaultReportPath;
  let seed = defaultSeedPath;
  let sourceCache = defaultSourceCachePath;

  if (argv.length > 0 && !argv.some((argument) => argument.startsWith('--'))) {
    inputs.push(...argv);
    return { inputs, report, seed, sourceCache };
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--input') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--input is required');
      inputs.push(next);
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
  return { inputs, report, seed, sourceCache };
}

function readReleaseInventoryReport(path: string): ReleaseInventoryReport {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
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
  const output = parsed.output as { sha256?: string } | undefined;
  return { validation: { mode: 'release', blocking: false, summary }, output };
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

function inspectSeed(databasePath: string): { fileSha256: string; inventory: SeedInventory } {
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

function ensureSeedInventoryMatchesReport(seedInventory: SeedInventory, releaseSummary: ReleaseSummary): void {
  const keys = Object.keys(RELEASE_THRESHOLDS) as (keyof ReleaseSummary)[];
  for (const key of keys) {
    if (seedInventory[key] < releaseSummary[key]) {
      throw new Error(`Seed inventory ${key} is below report summary: ${seedInventory[key]} < ${releaseSummary[key]}`);
    }
  }
}

export async function runVerifySeed(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const options = parseCli(argv);
  const validation = await runValidationCli([
    ...options.inputs.flatMap((input) => ['--input', input]),
    '--mode', 'release',
    '--report', options.report,
  ]);
  if (validation !== 0) return validation;

  const sourceChecks = await runSourceCheckCli([
    ...options.inputs.flatMap((input) => ['--input', input]),
    '--cache', options.sourceCache,
  ]);
  if (sourceChecks !== 0) return sourceChecks;

  const releaseInventory = readReleaseInventoryReport(options.report);
  const { fileSha256, inventory: seedInventory } = inspectSeed(options.seed);
  const reportedSha256 = releaseInventory.output?.sha256;
  if (reportedSha256 !== undefined && reportedSha256 !== fileSha256) {
    throw new Error(`Seed SHA-256 mismatch: report has ${reportedSha256}, file has ${fileSha256}`);
  }
  ensureSeedInventoryMatchesReport(seedInventory, releaseInventory.validation.summary);

  process.stdout.write(`Verified release seed:
  mode: ${releaseInventory.validation.mode}
  board: ${seedInventory.boardClues}
  categorySets: ${seedInventory.categorySets}
  finalClues: ${seedInventory.finalClues}
`);
  return 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runVerifySeed().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
