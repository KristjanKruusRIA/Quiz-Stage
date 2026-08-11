import { copyFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { DatabaseConnection } from './database';
import initialMigration from './sql/001_initial.sql?raw';

interface Migration {
  version: number;
  sql: string;
}

const migrations: Migration[] = [{ version: 1, sql: initialMigration }];

export function readSchemaVersion(database: DatabaseConnection): number {
  const exists = database.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'",
  ).pluck().get();
  if (exists === undefined) return 0;
  return database.prepare('SELECT COALESCE(MAX(version), 0) FROM schema_version').pluck().get() as number;
}

export function migrateDatabase(database: DatabaseConnection, backupDirectory: string): void {
  const currentVersion = readSchemaVersion(database);
  const pending = migrations.filter(({ version }) => version > currentVersion);
  if (pending.length === 0) return;

  createBackup(database, backupDirectory);
  const applyMigrations = database.transaction(() => {
    for (const migration of pending) {
      database.exec(migration.sql);
      database.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)')
        .run(migration.version, Date.now());
    }
  });
  applyMigrations();
}

function createBackup(database: DatabaseConnection, backupDirectory: string): void {
  if (database.name === ':memory:') throw new Error('Cannot create a migration backup for an in-memory database');

  mkdirSync(backupDirectory, { recursive: true });
  database.pragma('wal_checkpoint(FULL)');
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  const backupPath = join(backupDirectory, `${basename(database.name)}.${timestamp}.bak`);
  copyFileSync(database.name, backupPath);
}
