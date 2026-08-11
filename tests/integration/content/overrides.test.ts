import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentRepository } from '../../../src/main/content/contentRepository';
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
});
