import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { syncBundledContent } from '../../../src/main/content/bundledContentSync';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';

const seedPath = resolve('resources/content/seed.sqlite');
const temporaryDirectories: string[] = [];
const connections: DatabaseConnection[] = [];

afterEach(() => {
  for (const connection of connections.splice(0)) connection.close();
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('bundled content synchronization', () => {
  it('refreshes bundled content in an existing user database without replacing user data', () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-bundled-content-'));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, 'quiz-stage.sqlite');
    copyFileSync(seedPath, databasePath);

    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    database.prepare("DELETE FROM content_packs WHERE id IN ('built-in-adult', 'built-in-estonia')").run();
    database.prepare(`
      UPDATE category_sets SET name_json = '{"en":"A Pendulum Tracks a Turning Earth","et":"Vana pealkiri"}'
      WHERE id = 'built-in-history-set-000'
    `).run();
    database.prepare(`
      UPDATE clues SET prompt_json = '{"en":"Old specific clue","et":"Vana vihje"}'
      WHERE id = 'built-in-history-accessible-easy-001'
    `).run();
    database.prepare("UPDATE content_packs SET enabled = 0 WHERE id = 'built-in-history'").run();
    database.prepare(`
      INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
      VALUES ('built-in-history-obsolete-set', 'built-in-history', 'round-one', 'easy',
        '{"en":"Obsolete category","et":"Aegunud kategooria"}', 'history', 1)
    `).run();
    database.prepare(`
      INSERT INTO clues (
        id, category_set_id, round, tier, value, prompt_json, response_json,
        explanation_json, accepted_responses_json, source, enabled
      ) VALUES (
        'built-in-history-obsolete-clue', 'built-in-history-obsolete-set', 'round-one', 1, 200,
        '{"en":"Obsolete clue","et":"Aegunud vihje"}', '{"en":"Answer","et":"Vastus"}',
        '{"en":"Explanation","et":"Selgitus"}', NULL, 'test', 1
      )
    `).run();
    database.prepare(`
      INSERT INTO matches (id, started_at, updated_at) VALUES ('test-match', 1, 1)
    `).run();
    database.prepare(`
      INSERT INTO seen_clues (clue_id, match_id, seen_at)
      VALUES ('built-in-history-obsolete-clue', 'test-match', 1)
    `).run();
    database.prepare(`
      INSERT INTO content_reports (clue_id, note, created_at)
      VALUES ('built-in-history-obsolete-clue', 'preserve this report', 1)
    `).run();
    database.prepare(`
      INSERT INTO content_packs (id, name, version, source, enabled)
      VALUES ('built-in-retired', 'Retired Pack', '1', 'bundled', 1)
    `).run();
    database.prepare(`
      INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
      VALUES ('built-in-retired-set', 'built-in-retired', 'round-one', 'easy',
        '{"en":"Retired category","et":"Eemaldatud kategooria"}', 'retired', 1)
    `).run();
    database.prepare(`
      INSERT INTO clues (
        id, category_set_id, round, tier, value, prompt_json, response_json,
        explanation_json, accepted_responses_json, source, enabled
      ) VALUES (
        'built-in-retired-clue', 'built-in-retired-set', 'round-one', 1, 200,
        '{"en":"Retired clue","et":"Eemaldatud vihje"}', '{"en":"Answer","et":"Vastus"}',
        '{"en":"Explanation","et":"Selgitus"}', NULL, 'test', 1
      )
    `).run();
    database.prepare(
      "INSERT INTO settings (key, value_json, updated_at) VALUES ('test-setting', '\"preserved\"', 1)",
    ).run();

    syncBundledContent(database, seedPath);
    syncBundledContent(database, seedPath);

    expect(database.prepare(
      "SELECT id FROM content_packs WHERE id IN ('built-in-adult', 'built-in-estonia') ORDER BY id",
    ).pluck().all()).toEqual(['built-in-adult', 'built-in-estonia']);
    expect(database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE pack_id IN ('built-in-adult', 'built-in-estonia')",
    ).pluck().get()).toBe(224);
    expect(database.prepare(`
      SELECT COUNT(*) FROM clues
      JOIN category_sets ON category_sets.id = clues.category_set_id
      WHERE category_sets.pack_id IN ('built-in-adult', 'built-in-estonia')
    `).pluck().get()).toBe(1_024);
    expect(database.prepare(`
      SELECT json_extract(name_json, '$.en') FROM category_sets WHERE id = 'built-in-history-set-000'
    `).pluck().get()).toBe('History: Landmark Years in Modern History');
    expect(database.prepare(`
      SELECT json_extract(prompt_json, '$.en') FROM clues WHERE id = 'built-in-history-accessible-easy-001'
    `).pluck().get()).toBe('Which year matches this event: the Berlin Wall opened?');
    expect(database.prepare(`
      SELECT enabled FROM category_sets WHERE id = 'built-in-history-obsolete-set'
    `).pluck().get()).toBe(0);
    expect(database.prepare(`
      SELECT enabled FROM clues WHERE id = 'built-in-history-obsolete-clue'
    `).pluck().get()).toBe(0);
    expect(database.prepare("SELECT enabled FROM content_packs WHERE id = 'built-in-history'").pluck().get()).toBe(0);
    expect(database.prepare("SELECT enabled FROM content_packs WHERE id = 'built-in-retired'").pluck().get()).toBe(0);
    expect(database.prepare("SELECT enabled FROM category_sets WHERE id = 'built-in-retired-set'").pluck().get()).toBe(0);
    expect(database.prepare("SELECT enabled FROM clues WHERE id = 'built-in-retired-clue'").pluck().get()).toBe(0);
    expect(database.prepare("SELECT COUNT(*) FROM seen_clues WHERE clue_id = 'built-in-history-obsolete-clue'").pluck().get())
      .toBe(1);
    expect(database.prepare("SELECT COUNT(*) FROM content_reports WHERE clue_id = 'built-in-history-obsolete-clue'").pluck().get())
      .toBe(1);
    expect(database.prepare("SELECT value_json FROM settings WHERE key = 'test-setting'").pluck().get())
      .toBe('"preserved"');
  });
});
