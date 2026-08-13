import { createHash, randomUUID } from 'node:crypto';
import {
  lstatSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, parse, resolve } from 'node:path';
import { TextDecoder } from 'node:util';
import { glob } from 'glob';
import type { DatabaseConnection } from '../../src/main/persistence/database';
import { openDatabase } from '../../src/main/persistence/database';
import { serializeStoredSource } from '../../src/shared/content/sourceCitation';
import { parsePackCsv, type ParsedPack, type ParsedCsvRow } from '../../src/main/content/csvPacks';
import { readEvidenceInputs, type ContentEvidence } from './evidence';
import { publishValidationReport, validateProductionContent } from './validate';

export interface SeedBuildArgs {
  inputs: string[];
  evidence: string[];
  output: string;
  report: string;
}

interface SeedBuildInput {
  file: string;
  pack: ParsedPack;
  sha256: string;
}

interface ParsedSeedRow {
  file: string;
  row: ParsedCsvRow;
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

interface BuildSeedResult extends SeedInventory {
  seedSha256: string;
  input: {
    files: ReadonlyArray<{ file: string; rowCount: number; sha256: string }>;
    evidence: { records: number; sha256: string };
    sha256: string;
  };
}

const repositoryRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const defaultInputGlob = resolve(repositoryRoot, 'content/generated/*.en-et.csv');
const defaultOutputPath = resolve(repositoryRoot, 'resources/content/seed.sqlite');
const defaultReportPath = resolve(repositoryRoot, 'content/reports/release-inventory.json');
const migrationAppliedAt = 0;

export async function buildProductionSeed(
  args: SeedBuildArgs = {
    inputs: [defaultInputGlob], evidence: [], output: defaultOutputPath, report: defaultReportPath,
  },
): Promise<BuildSeedResult> {
  const evidenceByClueId = await readEvidenceInputs(args.evidence);
  const inputs = await readProductionInputs(args.inputs);
  const validation = validateProductionContent(
    inputs.map((input) => ({ file: input.file, pack: input.pack })),
    { mode: 'release', evidenceByClueId },
  );
  if (validation.blocking) {
    throw new Error('Production validation failed');
  }

  const explicitOutputPath = resolve(args.output);
  assertSafeOutput(explicitOutputPath);
  const temporaryOutputPath = `${explicitOutputPath}.${process.pid}-${randomUUID()}.tmp.sqlite`;

  let database: DatabaseConnection | undefined;
  try {
    database = openDatabase({ filePath: temporaryOutputPath });
    runMigrations(database);
    importProductionRows(database, sortRows(inputs), evidenceByClueId);
    verifyIntegrity(database);
    database.pragma('wal_checkpoint(TRUNCATE)');
    database.pragma('journal_mode = DELETE');
    database.exec('VACUUM');
    database.close();
    database = undefined;

    renameSync(temporaryOutputPath, explicitOutputPath);
    const inventory = readSeedInventory(explicitOutputPath);
    const evidenceManifest = createEvidenceManifest(evidenceByClueId);
    const inputHash = createSeedInputManifest(inputs, evidenceManifest.sha256);
    const seedSha256 = sha256File(explicitOutputPath);

    const report = {
      generatedAt: new Date().toISOString(),
      mode: 'release',
      validation,
      input: {
        files: inputs.map((input) => ({ file: input.file, rowCount: input.pack.rows.length, sha256: input.sha256 })),
        evidence: evidenceManifest,
        sha256: inputHash,
      },
      output: {
        path: explicitOutputPath,
        sha256: seedSha256,
      },
      inventory,
    };
    publishValidationReport(args.report, report, { placement: 'top-level' });

    return {
      ...inventory,
      seedSha256,
      input: {
        files: report.input.files,
        evidence: report.input.evidence,
        sha256: report.input.sha256,
      },
    };
  } finally {
    if (database?.open) database.close();
    for (const path of [temporaryOutputPath, `${temporaryOutputPath}-wal`, `${temporaryOutputPath}-shm`]) {
      try { unlinkSync(path); } catch { /* best-effort cleanup */ }
    }
  }
}

function assertSafeOutput(outputPath: string): void {
  if (outputPath === parse(outputPath).root) {
    throw new Error(`Unsafe seed output target: filesystem root ${outputPath}`);
  }
  if (!outputPath.endsWith('.sqlite')) {
    throw new Error(`Unsafe seed output target: expected a .sqlite file, received ${outputPath}`);
  }
  const outputStat = lstatSync(outputPath, { throwIfNoEntry: false });
  if (outputStat === undefined) return;
  if (outputStat.isSymbolicLink() || !outputStat.isFile()) {
    throw new Error(`Unsafe seed output target: expected a regular SQLite file, received ${outputPath}`);
  }
}

function readProductionInputs(patterns: readonly string[]): Promise<readonly SeedBuildInput[]> {
  if (patterns.length === 0) throw new Error('At least one input glob is required');
  const files = new Map<string, string>();
  return (async () => {
    for (const pattern of patterns) {
      const found = await glob(pattern, { absolute: true, cwd: process.cwd(), nodir: true, follow: false, windowsPathsNoEscape: true });
      for (const path of found) {
        const absolute = resolve(path);
        const stat = lstatSync(absolute);
        if (stat.isSymbolicLink()) throw new Error(`CSV input must not be a symlink: ${absolute}`);
        if (!stat.isFile()) throw new Error(`CSV input is not a regular file: ${absolute}`);
        files.set(process.platform === 'win32' ? absolute.toLowerCase() : absolute, absolute);
      }
    }
    const sortedFiles = [...files.values()].sort(compareCodeUnits);
    if (sortedFiles.length === 0) throw new Error(`Input glob matched no files: ${patterns.join(', ')}`);
    return sortedFiles.map((file) => {
      const before = lstatSync(file);
      const bytes = readFileSync(file);
      const after = lstatSync(file);
      if (!after.isFile() || after.isSymbolicLink()
        || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size) {
        throw new Error(`CSV input changed while reading: ${file}`);
      }
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const pack = parsePackCsv(text);
      return {
        file,
        pack,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
    });
  })();
}

function sortRows(inputs: readonly SeedBuildInput[]): ParsedSeedRow[] {
  const rows: ParsedSeedRow[] = [];
  for (const input of inputs) {
    for (const row of input.pack.rows) rows.push({ file: input.file, row });
  }
  return rows.sort((left, right) => {
    const leftPack = left.row.pack_id;
    const rightPack = right.row.pack_id;
    if (leftPack !== rightPack) return compareCodeUnits(leftPack, rightPack);
    if (left.row.category_set_id !== right.row.category_set_id) {
      return compareCodeUnits(left.row.category_set_id, right.row.category_set_id);
    }
    if (left.row.round !== right.row.round) return compareCodeUnits(left.row.round, right.row.round);
    const leftTier = Number(left.row.tier);
    const rightTier = Number(right.row.tier);
    if (leftTier !== rightTier) return leftTier - rightTier;
    return compareCodeUnits(left.row.clue_id, right.row.clue_id);
  });
}

function runMigrations(database: DatabaseConnection): void {
  const migrationDirectory = resolve(repositoryRoot, 'src/main/persistence/sql');
  const migrationFiles = readdirSync(migrationDirectory)
    .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
    .sort(compareCodeUnits);
  for (const fileName of migrationFiles) {
    const version = Number.parseInt(fileName.slice(0, fileName.indexOf('_')), 10);
    const migrationSql = readFileSync(resolve(migrationDirectory, fileName), 'utf8');
    const applyMigration = database.transaction(() => {
      database.exec(migrationSql);
      database.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(version, migrationAppliedAt);
    });
    applyMigration();
  }
}

function encodeAcceptedResponses(row: ParsedCsvRow): string | null {
  const acceptedEn = row.accepted_variants_en;
  const acceptedEt = row.accepted_variants_et;
  if (acceptedEn === '' && acceptedEt === '') return null;
  return JSON.stringify({
    ...(acceptedEn === '' ? {} : { en: acceptedEn }),
    ...(acceptedEt === '' ? {} : { et: acceptedEt }),
  });
}

function stableJson(value: { en: string; et?: string }): string {
  return JSON.stringify(value.et === undefined ? { en: value.en } : { en: value.en, et: value.et });
}

function translationStatus(value: string): 'untranslated' | 'machine' | 'reviewed' {
  if (value === 'untranslated' || value === 'machine' || value === 'reviewed') return value;
  throw new Error(`Unsupported translation status: ${value}`);
}

function importProductionRows(
  database: DatabaseConnection,
  rows: readonly ParsedSeedRow[],
  evidenceByClueId: ReadonlyMap<string, ContentEvidence>,
): void {
  const insertPack = database.prepare(`
    INSERT INTO content_packs (id, name, version, source, enabled)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertCategory = database.prepare(`
    INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertClue = database.prepare(`
    INSERT INTO clues (
      id, category_set_id, round, tier, value, prompt_json, response_json,
      explanation_json, accepted_responses_json, source, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seenPacks = new Set<string>();
  const seenCategorySets = new Set<string>();
  const consumedEvidence = new Set<string>();

  const importAll = database.transaction(() => {
    for (const { row } of rows) {
      const evidence = evidenceByClueId.get(row.clue_id);
      if (evidence === undefined || consumedEvidence.has(row.clue_id)) {
        throw new Error(`Validated evidence binding is missing or reused for clue ${row.clue_id}`);
      }
      consumedEvidence.add(row.clue_id);
      if (!seenPacks.has(row.pack_id)) {
        insertPack.run(
          row.pack_id,
          row.pack_name,
          '1.0.0',
          `Production generated library: ${row.pack_id}`,
          Number(row.enabled === 'true'),
        );
        seenPacks.add(row.pack_id);
      }
      if (!seenCategorySets.has(row.category_set_id)) {
        insertCategory.run(
          row.category_set_id,
          row.pack_id,
          row.round,
          row.difficulty,
          stableJson({ en: row.category_name_en, et: row.category_name_et || undefined }),
          row.macro_topic,
          Number(row.enabled === 'true'),
        );
        seenCategorySets.add(row.category_set_id);
      }
      insertClue.run(
        row.clue_id,
        row.category_set_id,
        row.round,
        Number(row.tier),
        row.round === 'final' ? 0 : Number(row.tier) * (row.round === 'round-one' ? 200 : 400),
        stableJson({ en: row.clue_en, et: row.clue_et }),
        stableJson({ en: row.response_en, et: row.response_et }),
        stableJson({ en: row.explanation_en, et: row.explanation_et }),
        encodeAcceptedResponses(row),
        serializeStoredSource({
          format: 'quiz-stage-csv-v2',
          title: evidence.supportingSource.title,
          url: evidence.supportingSource.url,
          license: evidence.supportingSource.license,
          retrievedAt: evidence.supportingSource.retrievedAt,
          translationStatus: translationStatus(row.translation_status),
          sourceId: evidence.supportingSource.sourceId,
          factualVerifiedAt: evidence.factualReview.reviewedAt,
        }),
        Number(row.enabled === 'true'),
      );
    }
    if (consumedEvidence.size !== evidenceByClueId.size) {
      throw new Error(`Validated evidence was not consumed one-to-one: ${consumedEvidence.size}/${evidenceByClueId.size}`);
    }
  });
  importAll();
}

function verifyIntegrity(database: DatabaseConnection): void {
  const checks = database.pragma('integrity_check') as Array<{ [key: string]: string }>;
  if (checks.length === 0 || checks[0]?.integrity_check !== 'ok') {
    throw new Error(`SQLite integrity check failed: ${JSON.stringify(checks[0])}`);
  }
}

function readSeedInventory(seedPath: string): SeedInventory {
  const database = openDatabase({ filePath: seedPath, readonly: true });
  try {
    return {
      boardClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
      categorySets: database.prepare("SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
      finalClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round = 'final'").pluck().get() as number,
      distinctCategoryNames: database.prepare(
        "SELECT COUNT(DISTINCT(json_extract(name_json, '$.en'))) FROM category_sets WHERE round IN ('round-one', 'round-two')",
      ).pluck().get() as number,
      easySets: database.prepare(
        "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'easy'",
      ).pluck().get() as number,
      mediumSets: database.prepare(
        "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'medium'",
      ).pluck().get() as number,
      hardSets: database.prepare(
        "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'hard'",
      ).pluck().get() as number,
    };
  } finally {
    database.close();
  }
}

function createEvidenceManifest(evidenceByClueId: ReadonlyMap<string, ContentEvidence>): {
  records: number;
  sha256: string;
} {
  const hasher = createHash('sha256');
  const entries = [...evidenceByClueId].sort(([left], [right]) => compareCodeUnits(left, right));
  for (const [clueId, evidence] of entries) {
    hasher.update(clueId);
    hasher.update('\0');
    hasher.update(JSON.stringify(evidence));
    hasher.update('\n');
  }
  return { records: entries.length, sha256: hasher.digest('hex') };
}

function createSeedInputManifest(inputs: readonly SeedBuildInput[], evidenceSha256: string): string {
  const hasher = createHash('sha256');
  for (const input of inputs) {
    hasher.update(input.sha256);
  }
  hasher.update(evidenceSha256);
  return hasher.digest('hex');
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function parseCli(argv: readonly string[]): SeedBuildArgs {
  const inputs: string[] = [];
  const evidence: string[] = [];
  let output = defaultOutputPath;
  let report = defaultReportPath;
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
    } else if (argument === '--output') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--output is required');
      output = next;
      index += 1;
    } else if (argument === '--report') {
      const next = argv[index + 1];
      if (next === undefined || next === '') throw new Error('--report is required');
      report = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { inputs: inputs.length === 0 ? [defaultInputGlob] : inputs, evidence, output, report };
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  buildProductionSeed(parseCli(process.argv.slice(2))).then((result) => {
    console.log(`${result.boardClues} board clues, ${result.categorySets} board category sets, ${result.finalClues} Finals`);
    console.log(`Seed SHA-256: ${result.seedSha256}`);
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
