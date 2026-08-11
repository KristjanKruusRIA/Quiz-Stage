import { constants, copyFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { DatabaseConnection } from './database';
import initialMigration from './sql/001_initial.sql?raw';
import categorySetOverridesMigration from './sql/002_category_set_overrides.sql?raw';

interface Migration {
  version: number;
  sql: string;
}

interface WalCheckpointResult {
  busy: number;
  log: number;
  checkpointed: number;
}

export interface MigrationOptions {
  checkpoint?: (database: DatabaseConnection) => WalCheckpointResult[];
  now?: () => Date;
}

const migrations: Migration[] = [
  { version: 1, sql: initialMigration },
  { version: 2, sql: categorySetOverridesMigration },
];

export function readSchemaVersion(database: DatabaseConnection): number {
  const exists = database.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'",
  ).pluck().get();
  if (exists === undefined) return 0;
  return database.prepare('SELECT COALESCE(MAX(version), 0) FROM schema_version').pluck().get() as number;
}

export function migrateDatabase(
  database: DatabaseConnection,
  backupDirectory: string,
  options: MigrationOptions = {},
): void {
  const currentVersion = readSchemaVersion(database);
  const pending = migrations.filter(({ version }) => version > currentVersion);
  if (pending.length === 0) return;

  createBackup(database, backupDirectory, options);
  const applyMigrations = database.transaction(() => {
    for (const migration of pending) {
      database.exec(migration.sql);
      database.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)')
        .run(migration.version, Date.now());
    }
  });
  applyMigrations();
}

function createBackup(
  database: DatabaseConnection,
  backupDirectory: string,
  options: MigrationOptions,
): void {
  if (database.name === ':memory:') throw new Error('Cannot create a migration backup for an in-memory database');

  const checkpoint = options.checkpoint?.(database)
    ?? database.pragma('wal_checkpoint(FULL)') as WalCheckpointResult[];
  if (
    checkpoint.length !== 1
    || checkpoint[0].busy !== 0
    || checkpoint[0].checkpointed !== checkpoint[0].log
  ) {
    throw new Error('Full WAL checkpoint did not complete; migration was not started');
  }

  mkdirSync(backupDirectory, { recursive: true });
  const timestamp = (options.now?.() ?? new Date()).toISOString().replace(/[-:.]/g, '');
  const backupBaseName = `${basename(database.name)}.${timestamp}`;
  for (let attempt = 0; ; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${attempt}`;
    const backupPath = join(backupDirectory, `${backupBaseName}${suffix}.bak`);
    try {
      copyFileSync(database.name, backupPath, constants.COPYFILE_EXCL);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
}
