import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { DatabaseConnection } from '../../src/main/persistence/database';
import { openDatabase } from '../../src/main/persistence/database';
import {
  developmentContentFixtureSchema,
  type DevelopmentContentFixture,
} from '../../src/shared/content/schema';

const defaultFixturePath = resolve('tests/fixtures/dev-content.json');
const defaultOutputPath = resolve('resources/content/dev-seed.sqlite');
const migrationsDirectory = resolve('src/main/persistence/sql');

export function buildDevelopmentSeed(
  fixturePath = defaultFixturePath,
  outputPath = defaultOutputPath,
): { clues: number; categorySets: number; finals: number } {
  const fixture = developmentContentFixtureSchema.parse(
    JSON.parse(readFileSync(resolve(fixturePath), 'utf8')),
  );
  const explicitOutputPath = resolve(outputPath);
  mkdirSync(dirname(explicitOutputPath), { recursive: true });
  if (existsSync(explicitOutputPath)) unlinkSync(explicitOutputPath);

  const database = openDatabase({ filePath: explicitOutputPath });
  try {
    runMigrations(database);
    importFixture(database, fixture);
    const counts = readCounts(database);
    database.pragma('wal_checkpoint(TRUNCATE)');
    database.pragma('journal_mode = DELETE');
    database.exec('VACUUM');
    return counts;
  } finally {
    database.close();
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

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const counts = buildDevelopmentSeed(defaultFixturePath, defaultOutputPath);
  console.log(`${counts.clues} clues, ${counts.categorySets} category sets, ${counts.finals} Finals`);
}
