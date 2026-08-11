import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { ContentService } from '../../../src/main/content/contentService';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';

const seedPath = resolve('resources/content/dev-seed.sqlite');

describe('local content overrides', () => {
  const directories: string[] = [];
  const connections: DatabaseConnection[] = [];

  afterEach(() => {
    for (const connection of connections.splice(0)) {
      if (connection.open) connection.close();
    }
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  function openCopy(): { databasePath: string; database: DatabaseConnection; repository: ContentRepository } {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-overrides-'));
    directories.push(directory);
    const databasePath = join(directory, 'content.sqlite');
    copyFileSync(seedPath, databasePath);
    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    return { databasePath, database, repository: new ContentRepository(database, { now: () => 500 }) };
  }

  it('prefers a field-complete local correction across bundled-row upgrades and restart', () => {
    const { databasePath, database, repository } = openCopy();
    const original = repository.loadLibrary().categorySets[0].clues[0];
    const corrected = {
      ...original,
      response: { en: 'Corrected response', et: 'Parandatud vastus' },
      explanation: { en: 'Corrected explanation', et: 'Parandatud selgitus' },
    };

    repository.saveOverride(corrected);
    database.prepare('UPDATE clues SET response_json = ?, explanation_json = ? WHERE id = ?').run(
      JSON.stringify({ en: 'Upgraded bundled response', et: 'Uuendatud komplekti vastus' }),
      JSON.stringify({ en: 'Upgraded bundled explanation', et: 'Uuendatud komplekti selgitus' }),
      original.id,
    );

    expect(repository.getClue(original.id)).toMatchObject({
      response: corrected.response,
      explanation: corrected.explanation,
    });
    database.close();
    const reopened = openDatabase({ filePath: databasePath });
    connections.push(reopened);
    expect(new ContentRepository(reopened).getClue(original.id)).toMatchObject({
      response: corrected.response,
      explanation: corrected.explanation,
    });
  });

  it('rejects non-bilingual, structurally changed, extra-field, and malformed-ID overrides atomically', () => {
    const { database, repository } = openCopy();
    const original = repository.loadLibrary().categorySets[0].clues[0];
    const invalidOverrides = [
      { ...original, response: { en: 'English only' } },
      { ...original, tier: original.tier === 1 ? 2 : 1 },
      { ...original, unexpected: true },
      { ...original, id: ` ${original.id}` },
    ];

    for (const invalid of invalidOverrides) expect(() => repository.saveOverride(invalid)).toThrow();

    expect(database.prepare('SELECT COUNT(*) FROM content_overrides').pluck().get()).toBe(0);
    expect(repository.getClue(original.id)).toEqual(original);
  });

  it('stores one idempotent override and resolves its report only when the correction is enabled', () => {
    const { database, repository } = openCopy();
    const original = repository.loadLibrary().categorySets[0].clues[0];
    repository.reportClue({ clueId: original.id, matchId: null, note: 'Needs review', createdAt: 100 });
    const disabledCorrection = { ...original, enabled: false };

    repository.saveOverride(disabledCorrection);
    expect(repository.listReported()).toHaveLength(1);
    expect(repository.isEligible(original.id)).toBe(false);

    const corrected = {
      ...original,
      prompt: { en: 'Corrected prompt', et: 'Parandatud küsimus' },
      enabled: true,
    };
    repository.saveOverride(corrected);
    repository.saveOverride(corrected);

    expect(repository.listReported()).toEqual([]);
    expect(repository.isEligible(original.id)).toBe(true);
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides').pluck().get()).toBe(1);
    expect(database.prepare('SELECT updated_at FROM content_overrides').pluck().get()).toBe(500);
  });

  it('finds and corrects stable board and Final rows behind a disabled pack without selecting them', () => {
    const { database, repository } = openCopy();
    const library = repository.loadLibrary();
    const board = library.categorySets[0].clues[0];
    const final = library.finalClues[0];
    const finalContent = structuredClone(final);
    delete (finalContent as { lastSeenAt?: number | null }).lastSeenAt;
    database.prepare('UPDATE content_packs SET enabled = 0 WHERE id = ?').run('dev-library');
    repository.reportClue({ clueId: board.id, matchId: null, note: 'Board correction', createdAt: 100 });
    repository.reportClue({ clueId: final.id, matchId: null, note: 'Final correction', createdAt: 100 });

    const correctedBoard = repository.saveOverride({
      ...board,
      prompt: { en: 'Corrected hidden board prompt', et: 'Parandatud peidetud lauaküsimus' },
    });
    const correctedFinal = repository.saveOverride({
      ...finalContent,
      prompt: { en: 'Corrected hidden Final prompt', et: 'Parandatud peidetud finaalküsimus' },
    });

    expect(correctedBoard).toMatchObject({ prompt: { en: 'Corrected hidden board prompt' }, enabled: false });
    expect(correctedFinal).toMatchObject({ prompt: { en: 'Corrected hidden Final prompt' }, enabled: false });
    expect(repository.getClue(board.id)).toEqual(correctedBoard);
    expect(repository.getClue(final.id)).toEqual(correctedFinal);
    expect(repository.listReported()).toEqual([]);
    expect(repository.loadLibrary().categorySets).toEqual([]);
    expect(repository.loadLibrary().finalClues).toEqual([]);
    expect(() => new ContentService(repository).selectNextTiebreaker({
      language: 'en',
      difficulty: 'easy',
      clueSeconds: 15,
      displayMode: 'single',
      packIds: ['dev-library'],
      teams: [
        { id: 'a', name: 'Alpha', color: '#E3B341' },
        { id: 'b', name: 'Beta', color: '#50A7F5' },
      ],
    }, 'disabled-pack-seed', [], 0)).toThrow('No unused Final-eligible clue is available for the tiebreaker');
  });

  it('finds a stable Final row behind a disabled category without making it selectable', () => {
    const { database, repository } = openCopy();
    const final = repository.loadLibrary().finalClues[0];
    const finalContent = structuredClone(final);
    delete (finalContent as { lastSeenAt?: number | null }).lastSeenAt;
    database.prepare('UPDATE category_sets SET enabled = 0 WHERE id = ?').run(final.categoryId);

    const corrected = repository.saveOverride({
      ...finalContent,
      explanation: { en: 'Corrected hidden explanation', et: 'Parandatud peidetud selgitus' },
    });

    expect(corrected).toMatchObject({ explanation: { en: 'Corrected hidden explanation' }, enabled: false });
    expect(repository.getClue(final.id)).toEqual(corrected);
    expect(repository.loadLibrary().finalClues).toContainEqual(expect.objectContaining({ id: final.id, enabled: false }));
  });

  it('treats a deleted stable base as missing and keeps persisted overrides FK-protected', () => {
    const { database, repository } = openCopy();
    const [deleted, protectedClue] = repository.loadLibrary().categorySets[0].clues;
    const deletedOverride = { ...deleted, prompt: { en: 'Deleted', et: 'Kustutatud' } };
    database.prepare('DELETE FROM clues WHERE id = ?').run(deleted.id);

    expect(repository.getClue(deleted.id)).toBeNull();
    expect(() => repository.saveOverride(deletedOverride)).toThrow(`Unknown bundled clue: ${deleted.id}`);

    repository.saveOverride(protectedClue);
    expect(() => database.prepare('DELETE FROM clues WHERE id = ?').run(protectedClue.id)).toThrow(/FOREIGN KEY/);
    expect(repository.getClue(protectedClue.id)).not.toBeNull();
  });
});
