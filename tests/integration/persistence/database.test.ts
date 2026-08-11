import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateDatabase, readSchemaVersion } from '../../../src/main/persistence/migrations';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';

const expectedTables = [
  'schema_version',
  'matches',
  'match_events',
  'match_snapshots',
  'settings',
  'content_packs',
  'category_sets',
  'clues',
  'content_overrides',
  'content_reports',
  'seen_clues',
];

describe('database migrations', () => {
  const temporaryDirectories: string[] = [];
  const connections: DatabaseConnection[] = [];

  afterEach(() => {
    for (const connection of connections.splice(0)) connection.close();
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  function temporaryDirectory() {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-persistence-'));
    temporaryDirectories.push(directory);
    return directory;
  }

  function open(filePath: string, readonly = false) {
    const connection = openDatabase({ filePath, readonly });
    connections.push(connection);
    return connection;
  }

  it('creates schema version 1 with the required tables and connection pragmas', () => {
    const directory = temporaryDirectory();
    const database = open(join(directory, 'quiz.sqlite'));

    migrateDatabase(database, join(directory, 'backups'));

    expect(readSchemaVersion(database)).toBe(1);
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all();
    expect(tables).toEqual(expect.arrayContaining(expectedTables));
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(database.pragma('foreign_key_list(match_events)')).toEqual(
      expect.arrayContaining([expect.objectContaining({ table: 'matches', from: 'match_id', to: 'id' })]),
    );
  });

  it('backs up the prior database and rolls back a failed migration without making it unreadable', () => {
    const directory = temporaryDirectory();
    const databasePath = join(directory, 'quiz.sqlite');
    const backupDirectory = join(directory, 'backups');
    mkdirSync(backupDirectory);
    const database = open(databasePath);
    database.exec(`
      CREATE TABLE legacy_marker (value TEXT NOT NULL);
      INSERT INTO legacy_marker (value) VALUES ('still-readable');
      CREATE TABLE matches (incompatible TEXT NOT NULL);
    `);

    expect(() => migrateDatabase(database, backupDirectory)).toThrow();

    expect(database.prepare('SELECT value FROM legacy_marker').pluck().get()).toBe('still-readable');
    expect(readSchemaVersion(database)).toBe(0);
    const backups = readdirSync(backupDirectory);
    expect(backups).toHaveLength(1);
    expect(backups[0]).toMatch(/^quiz\.sqlite\.\d{8}T\d{9}Z\.bak$/);

    const backup = open(join(backupDirectory, backups[0]), true);
    expect(backup.prepare('SELECT value FROM legacy_marker').pluck().get()).toBe('still-readable');
    expect(readSchemaVersion(backup)).toBe(0);
  });
});
