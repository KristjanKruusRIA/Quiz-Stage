import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const EXPANSION_CLUE_ID = 'built-in-history-easy-expansion-001';

const [databasePath, backupPath, fixtureRoot] = process.argv.slice(2);
if (databasePath === undefined || backupPath === undefined || fixtureRoot === undefined) {
  throw new Error('Usage: verify-upgrade-data.ts <database> <backup> <fixture-user-data>');
}

function count(database: Database.Database, sql: string, params: unknown[] = []): number {
  return Number(database.prepare(sql).pluck().get(...params));
}

function assertPreserved(database: Database.Database): void {
  if (count(database, 'SELECT COUNT(*) FROM content_packs WHERE id = ?', ['previous-version-pack']) !== 1) {
    throw new Error('Custom pack missing after migration');
  }
  if (count(database, 'SELECT COUNT(*) FROM clues WHERE id = ?', ['previous-version-round-one-clue-100']) !== 1) {
    throw new Error('Custom clue missing after migration');
  }
  if (count(database, 'SELECT COUNT(*) FROM content_overrides WHERE clue_id = ?', ['previous-version-round-one-clue-100']) !== 1) {
    throw new Error('Custom content override missing after migration');
  }
  if (count(database, 'SELECT COUNT(*) FROM settings WHERE key IN (?, ?)', ['audio', 'appearance']) !== 2) {
    throw new Error('Non-default settings missing after migration');
  }
  if (count(database, 'SELECT COUNT(*) FROM matches WHERE id = ? AND completed_at IS NOT NULL', ['previous-version-match-complete']) !== 1) {
    throw new Error('Completed history entry missing after migration');
  }
  if (count(database, 'SELECT COUNT(*) FROM matches WHERE id = ? AND completed_at IS NULL', ['previous-version-match-autosave']) !== 1) {
    throw new Error('Incomplete autosave missing after migration');
  }
  if (count(database, 'SELECT COUNT(*) FROM content_reports') !== 1) {
    throw new Error('Content report missing after migration');
  }
}

const database = new Database(databasePath, { readonly: true });
try {
  if (count(database, 'SELECT MAX(version) FROM schema_version') !== 2) {
    throw new Error('Packaged application did not migrate the database to schema version 2');
  }
  assertPreserved(database);
  if (count(database, 'SELECT COUNT(*) FROM clues WHERE id = ?', [EXPANSION_CLUE_ID]) !== 1) {
    throw new Error(`Expansion clue missing after migration: ${EXPANSION_CLUE_ID}`);
  }
  database.prepare('SELECT category_set_id FROM category_set_overrides LIMIT 1').all();
} finally {
  database.close();
}

const backup = new Database(backupPath, { readonly: true });
try {
  if (count(backup, 'SELECT MAX(version) FROM schema_version') !== 1) {
    throw new Error('Migration backup does not preserve schema version 1');
  }
  assertPreserved(backup);
  if (count(backup, 'SELECT COUNT(*) FROM clues WHERE id = ?', [EXPANSION_CLUE_ID]) !== 0) {
    throw new Error(`Migration backup unexpectedly contains new clue: ${EXPANSION_CLUE_ID}`);
  }
} finally {
  backup.close();
}

const sourceLogo = path.join(fixtureRoot, 'media', 'logo.png');
const migratedLogo = path.join(path.dirname(databasePath), 'media', 'logo.png');
if (!existsSync(migratedLogo) || !readFileSync(migratedLogo).equals(readFileSync(sourceLogo))) {
  throw new Error('Media override was not preserved byte-for-byte');
}
