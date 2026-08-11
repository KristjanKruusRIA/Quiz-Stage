import { randomUUID } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, extname, join, parse, resolve } from 'node:path';
import type { DatabaseConnection } from '../../src/main/persistence/database';
import { openDatabase } from '../../src/main/persistence/database';
import {
  developmentContentFixtureSchema,
  type DevelopmentContentFixture,
} from '../../src/shared/content/schema';

const repositoryRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const defaultFixturePath = join(repositoryRoot, 'tests/fixtures/dev-content.json');
const defaultOutputPath = join(repositoryRoot, 'resources/content/dev-seed.sqlite');
const migrationsDirectory = join(repositoryRoot, 'src/main/persistence/sql');

export function buildDevelopmentSeed(
  fixturePath = defaultFixturePath,
  outputPath = defaultOutputPath,
): { clues: number; categorySets: number; finals: number } {
  const explicitFixturePath = resolve(fixturePath);
  const explicitOutputPath = resolve(outputPath);
  assertSafeOutput(explicitFixturePath, explicitOutputPath);
  const fixture = developmentContentFixtureSchema.parse(
    JSON.parse(readFileSync(explicitFixturePath, 'utf8')),
  );
  mkdirSync(dirname(explicitOutputPath), { recursive: true });
  const temporaryOutputPath = join(
    dirname(explicitOutputPath),
    `.${basename(explicitOutputPath)}.${process.pid}-${randomUUID()}.tmp.sqlite`,
  );

  let database: DatabaseConnection | undefined;
  try {
    database = openDatabase({ filePath: temporaryOutputPath });
    runMigrations(database);
    importFixture(database, fixture);
    const counts = readCounts(database);
    database.pragma('wal_checkpoint(TRUNCATE)');
    database.pragma('journal_mode = DELETE');
    database.exec('VACUUM');
    database.close();
    database = undefined;
    renameSync(temporaryOutputPath, explicitOutputPath);
    return counts;
  } finally {
    if (database?.open) database.close();
    removeTemporaryArtifacts(temporaryOutputPath);
  }
}

function assertSafeOutput(fixturePath: string, outputPath: string): void {
  if (outputPath === parse(outputPath).root) {
    throw new Error(`Unsafe seed output target: filesystem root ${outputPath}`);
  }
  if (extname(outputPath).toLowerCase() !== '.sqlite') {
    throw new Error(`Unsafe seed output target: expected a .sqlite file, received ${outputPath}`);
  }
  const fixtureRealPath = realpathSync(fixturePath);
  if (outputPath === fixturePath || (existsSync(outputPath) && realpathSync(outputPath) === fixtureRealPath)) {
    throw new Error('Unsafe seed output target: output aliases the input fixture');
  }
  if (!existsSync(outputPath)) return;

  const outputStats = lstatSync(outputPath);
  if (outputStats.isSymbolicLink() || !outputStats.isFile()) {
    throw new Error(`Unsafe seed output target: expected a regular SQLite file, received ${outputPath}`);
  }
  const sqliteHeader = readFileSync(outputPath).subarray(0, 16).toString('utf8');
  if (sqliteHeader !== 'SQLite format 3\0') {
    throw new Error(`Unsafe seed output target: existing file is not SQLite: ${outputPath}`);
  }
}

function removeTemporaryArtifacts(temporaryOutputPath: string): void {
  for (const path of [temporaryOutputPath, `${temporaryOutputPath}-wal`, `${temporaryOutputPath}-shm`]) {
    if (existsSync(path)) unlinkSync(path);
  }
}

function runMigrations(database: DatabaseConnection): void {
  const migrationFiles = readdirSync(migrationsDirectory)
    .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
    .sort((left, right) => left.localeCompare(right));
  for (const fileName of migrationFiles) {
    const version = Number.parseInt(fileName.slice(0, fileName.indexOf('_')), 10);
    const migrationSql = readFileSync(resolve(migrationsDirectory, fileName), 'utf8');
    const applyMigration = database.transaction(() => {
      database.exec(migrationSql);
      database.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(version, 0);
    });
    applyMigration();
  }
}

function importFixture(database: DatabaseConnection, fixture: DevelopmentContentFixture): void {
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
  const importAll = database.transaction(() => {
    for (const pack of [...fixture.packs].sort(byId)) {
      insertPack.run(pack.id, pack.name, pack.version, pack.source, Number(pack.enabled));
    }
    for (const category of [...fixture.categorySets].sort(byId)) {
      insertCategory.run(
        category.id,
        category.packId,
        category.round,
        category.difficulty,
        stableJson(category.name),
        category.macroTopic,
        Number(category.enabled),
      );
      for (const clue of [...category.clues].sort(byId)) {
        insertClue.run(
          clue.id,
          category.id,
          clue.round,
          clue.tier,
          clue.value,
          stableJson(clue.prompt),
          stableJson(clue.response),
          stableJson(clue.explanation),
          clue.acceptedResponses === undefined ? null : stableJson(clue.acceptedResponses),
          clue.source,
          Number(clue.enabled),
        );
      }
    }
    for (const clue of [...fixture.finals].sort(byId)) {
      insertCategory.run(
        clue.categoryId,
        clue.packId,
        'final',
        clue.difficulty,
        stableJson(clue.categoryName),
        'final',
        Number(clue.enabled),
      );
      insertClue.run(
        clue.id,
        clue.categoryId,
        'final',
        clue.tier,
        clue.value,
        stableJson(clue.prompt),
        stableJson(clue.response),
        stableJson(clue.explanation),
        clue.acceptedResponses === undefined ? null : stableJson(clue.acceptedResponses),
        clue.source,
        Number(clue.enabled),
      );
    }
  });
  importAll();
}

function readCounts(database: DatabaseConnection) {
  const clues = database.prepare('SELECT COUNT(*) FROM clues').pluck().get() as number;
  const categorySets = database.prepare(
    "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two')",
  ).pluck().get() as number;
  const finals = database.prepare("SELECT COUNT(*) FROM clues WHERE round = 'final'").pluck().get() as number;
  return { clues, categorySets, finals };
}

function stableJson(value: { en: string; et?: string }): string {
  return JSON.stringify(value.et === undefined ? { en: value.en } : { en: value.en, et: value.et });
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const outputPath = process.argv[2] ?? defaultOutputPath;
  const fixturePath = process.argv[3] ?? defaultFixturePath;
  const counts = buildDevelopmentSeed(fixturePath, outputPath);
  console.log(`${counts.clues} clues, ${counts.categorySets} category sets, ${counts.finals} Finals`);
}
