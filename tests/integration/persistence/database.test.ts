import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
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
  'category_set_overrides',
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

  it('creates the current schema with the required tables and connection pragmas', () => {
    const directory = temporaryDirectory();
    const database = open(join(directory, 'quiz.sqlite'));

    migrateDatabase(database, join(directory, 'backups'));

    expect(readSchemaVersion(database)).toBe(2);
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

  it('does not back up or migrate when a full WAL checkpoint is incomplete', () => {
    const directory = temporaryDirectory();
    const backupDirectory = join(directory, 'backups');
    const database = open(join(directory, 'quiz.sqlite'));
    database.exec('CREATE TABLE legacy_marker (value TEXT NOT NULL)');

    expect(() => migrateDatabase(database, backupDirectory, {
      checkpoint: () => [{ busy: 1, log: 2, checkpointed: 1 }],
    })).toThrow(/checkpoint/i);

    expect(readSchemaVersion(database)).toBe(0);
    expect(existsSync(backupDirectory) ? readdirSync(backupDirectory) : []).toEqual([]);
    expect(database.prepare('SELECT COUNT(*) FROM legacy_marker').pluck().get()).toBe(0);
  });

  it('keeps both backups when two database names collide at the same timestamp', () => {
    const directory = temporaryDirectory();
    const backupDirectory = join(directory, 'backups');
    const firstDirectory = join(directory, 'first');
    const secondDirectory = join(directory, 'second');
    mkdirSync(firstDirectory);
    mkdirSync(secondDirectory);
    const first = open(join(firstDirectory, 'quiz.sqlite'));
    const second = open(join(secondDirectory, 'quiz.sqlite'));
    first.exec("CREATE TABLE legacy_marker (value TEXT NOT NULL); INSERT INTO legacy_marker VALUES ('first')");
    second.exec("CREATE TABLE legacy_marker (value TEXT NOT NULL); INSERT INTO legacy_marker VALUES ('second')");
    const options = { now: () => new Date('2030-01-02T03:04:05.678Z') };

    migrateDatabase(first, backupDirectory, options);
    migrateDatabase(second, backupDirectory, options);

    const backups = readdirSync(backupDirectory).sort();
    expect(backups).toEqual([
      'quiz.sqlite.20300102T030405678Z-1.bak',
      'quiz.sqlite.20300102T030405678Z.bak',
    ]);
    const values = backups.map((backupName) => open(join(backupDirectory, backupName), true)
      .prepare('SELECT value FROM legacy_marker').pluck().get()).sort();
    expect(values).toEqual(['first', 'second']);
  });

  it('prevents clue, category, or pack deletion from erasing user-authored clue data', () => {
    const directory = temporaryDirectory();
    const database = open(join(directory, 'quiz.sqlite'));
    migrateDatabase(database, join(directory, 'backups'));
    database.exec(`
      INSERT INTO matches (id, started_at, updated_at) VALUES ('match-1', 0, 0);
      INSERT INTO content_packs (id, name, version, source) VALUES ('pack-1', 'Pack', '1', 'bundled');
      INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic)
        VALUES ('category-1', 'pack-1', 'round-one', 'easy', '{"en":"Category"}', 'topic');
      INSERT INTO clues (
        id, category_set_id, round, tier, value, prompt_json, response_json, explanation_json, source
      ) VALUES (
        'clue-1', 'category-1', 'round-one', 1, 200,
        '{"en":"Prompt"}', '{"en":"Response"}', '{"en":"Explanation"}', 'Source'
      );
      INSERT INTO content_overrides (clue_id, override_json, updated_at)
        VALUES ('clue-1', '{"prompt":{"en":"Edited"}}', 1);
      INSERT INTO content_reports (clue_id, match_id, note, created_at)
        VALUES ('clue-1', 'match-1', 'Host report', 1);
      INSERT INTO seen_clues (clue_id, match_id, seen_at) VALUES ('clue-1', 'match-1', 1);
    `);

    expect(() => database.prepare('DELETE FROM clues WHERE id = ?').run('clue-1')).toThrow(/foreign key/i);
    expect(() => database.prepare('DELETE FROM category_sets WHERE id = ?').run('category-1')).toThrow(/foreign key/i);
    expect(() => database.prepare('DELETE FROM content_packs WHERE id = ?').run('pack-1')).toThrow(/foreign key/i);

    expect(database.prepare('SELECT COUNT(*) FROM content_overrides').pluck().get()).toBe(1);
    expect(database.prepare('SELECT COUNT(*) FROM content_reports').pluck().get()).toBe(1);
    expect(database.prepare('SELECT COUNT(*) FROM seen_clues').pluck().get()).toBe(1);
  });
});
