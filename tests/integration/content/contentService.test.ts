import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { ContentService } from '../../../src/main/content/contentService';
import { ContentEditorService } from '../../../src/main/content/contentEditorService';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { developmentContentFixtureSchema } from '../../../src/shared/content/schema';
import type { GameConfig } from '../../../src/shared/game/types';
import { toWritableFinalClue } from '../../../src/shared/content/editor';

const seedPath = resolve('resources/content/dev-seed.sqlite');
const mediumEnglish: GameConfig = {
  language: 'en',
  difficulty: 'medium',
  clueSeconds: 15,
  teams: [
    { id: 'team-1', name: 'Alpha', color: '#E3B341' },
    { id: 'team-2', name: 'Beta', color: '#50A7F5' },
  ],
  packIds: ['dev-library'],
  displayMode: 'single',
};

describe('ContentService', () => {
  const temporaryDirectories: string[] = [];
  const connections: DatabaseConnection[] = [];

  afterEach(() => {
    for (const connection of connections.splice(0)) connection.close();
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  function openSeed(): { database: DatabaseConnection; service: ContentService } {
    const database = openDatabase({ filePath: seedPath, readonly: true });
    connections.push(database);
    return {
      database,
      service: new ContentService(new ContentRepository(database)),
    };
  }

  function openWritableSeedCopy(): { database: DatabaseConnection; service: ContentService } {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-content-'));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, 'content.sqlite');
    copyFileSync(seedPath, databasePath);
    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    return {
      database,
      service: new ContentService(new ContentRepository(database)),
    };
  }

  it('reports availability and deterministically selects a complete match', () => {
    const { service } = openSeed();

    expect(service.checkAvailability(mediumEnglish).ok).toBe(true);
    const selected = service.selectForMatch(mediumEnglish, 'seed');
    expect(selected.ok).toBe(true);
    if (!selected.ok) throw new Error('Expected complete match content');
    expect(selected.roundOne.categories).toHaveLength(6);
    expect(selected.roundTwo.categories).toHaveLength(6);
    expect(selected.final.source).toMatch(/^Development source:/);
    expect(service.selectForMatch(mediumEnglish, 'seed')).toEqual(selected);
  });

  it('returns the selector exact shortage when one Estonian category translation is missing', () => {
    const { database, service } = openWritableSeedCopy();
    const row = database.prepare(`
      SELECT id, name_json
      FROM category_sets
      WHERE difficulty = 'medium' AND round = 'round-one'
      ORDER BY id
      LIMIT 1
    `).get() as { id: string; name_json: string };
    const name = JSON.parse(row.name_json) as { en: string; et: string };
    database.prepare('UPDATE category_sets SET name_json = ? WHERE id = ?')
      .run(JSON.stringify({ en: name.en }), row.id);

    expect(service.checkAvailability({ ...mediumEnglish, language: 'et' })).toEqual({
      ok: false,
      roundOneMissing: 1,
      roundTwoMissing: 0,
      finalMissing: 0,
    });
  });

  it('uses effective Final category enable overrides for Setup availability in both directions', () => {
    const { database, service } = openWritableSeedCopy();
    const editor = new ContentEditorService(database, new ContentRepository(database), { now: () => 500 });
    const final = structuredClone(editor.list().packs.find((pack) => pack.ownership === 'bundled')!
      .finalClues.find((clue) => clue.difficulty === 'medium')!);
    final.enabled = false;
    editor.saveFinalClue({ expectedRevision: final.revision, finalClue: toWritableFinalClue(final) });

    expect(service.checkAvailability(mediumEnglish)).toEqual({
      ok: false,
      roundOneMissing: 0,
      roundTwoMissing: 0,
      finalMissing: 1,
    });

    database.prepare('UPDATE category_sets SET enabled = 0 WHERE id = ?').run(final.categoryId);
    const fresh = structuredClone(editor.list().packs.find((pack) => pack.ownership === 'bundled')!
      .finalClues.find((clue) => clue.id === final.id)!);
    fresh.enabled = true;
    editor.saveFinalClue({ expectedRevision: fresh.revision, finalClue: toWritableFinalClue(fresh) });

    expect(new ContentService(new ContentRepository(database)).checkAvailability(mediumEnglish).ok).toBe(true);
  });

  it('aggregates persisted clue history into category and Final last-seen values', () => {
    const { database } = openWritableSeedCopy();
    database.prepare('INSERT INTO matches (id, started_at, updated_at) VALUES (?, ?, ?)')
      .run('history-match', 10, 20);
    const boardClueId = database.prepare(`
      SELECT clues.id
      FROM clues
      JOIN category_sets ON category_sets.id = clues.category_set_id
      WHERE category_sets.difficulty = 'medium' AND category_sets.round = 'round-one'
      ORDER BY clues.id
      LIMIT 1
    `).pluck().get() as string;
    const finalClueId = database.prepare("SELECT id FROM clues WHERE round = 'final' AND id LIKE 'medium-%'")
      .pluck().get() as string;
    database.prepare('INSERT INTO seen_clues (clue_id, match_id, seen_at) VALUES (?, ?, ?)')
      .run(boardClueId, 'history-match', 100);
    database.prepare('INSERT INTO seen_clues (clue_id, match_id, seen_at) VALUES (?, ?, ?)')
      .run(finalClueId, 'history-match', 200);

    const library = new ContentRepository(database).loadLibrary();
    expect(library.categorySets.find((set) => set.clues.some((clue) => clue.id === boardClueId))?.lastSeenAt)
      .toBe(100);
    expect(library.finalClues.find((clue) => clue.id === finalClueId)?.lastSeenAt).toBe(200);
  });

  it('rejects a development fixture with a missing translation', () => {
    const fixture = JSON.parse(readFileSync(resolve('tests/fixtures/dev-content.json'), 'utf8'));
    delete fixture.categorySets[0].name.et;

    expect(() => developmentContentFixtureSchema.parse(fixture)).toThrow();
  });

  it('validates persisted pack rows before selecting content', () => {
    const { database, service } = openWritableSeedCopy();
    database.prepare("UPDATE content_packs SET source = '' WHERE id = 'dev-library'").run();

    expect(() => service.checkAvailability(mediumEnglish)).toThrow();
  });
});
