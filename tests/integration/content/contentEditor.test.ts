import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentEditorService } from '../../../src/main/content/contentEditorService';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';

const seedPath = resolve('resources/content/dev-seed.sqlite');

describe('content editor service', () => {
  const directories: string[] = [];
  const connections: DatabaseConnection[] = [];

  afterEach(() => {
    for (const connection of connections.splice(0)) if (connection.open) connection.close();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  function openEditor() {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-editor-'));
    directories.push(directory);
    const databasePath = join(directory, 'content.sqlite');
    copyFileSync(seedPath, databasePath);
    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    const repository = new ContentRepository(database, { now: () => 500 });
    return { database, repository, editor: new ContentEditorService(database, repository, { now: () => 500 }) };
  }

  it('routes bundled corrections through overrides and rejects stale saves', () => {
    const { database, repository, editor } = openEditor();
    const library = editor.list();
    const bundled = library.packs.find((pack) => pack.ownership === 'bundled')!;
    const set = bundled.categorySets[0];
    const corrected = structuredClone(set);
    corrected.clues[0].prompt.en = 'Corrected prompt';

    repository.reportClue({ clueId: set.clues[0].id, matchId: null, note: 'New report', createdAt: 499 });
    expect(() => editor.saveCategorySet({ expectedRevision: set.revision, categorySet: corrected }))
      .toThrow(/stale/i);

    const fresh = editor.list().packs.find((pack) => pack.id === bundled.id)!.categorySets
      .find((category) => category.id === set.id)!;
    fresh.clues[0].prompt.en = 'Corrected prompt';
    editor.saveCategorySet({ expectedRevision: fresh.revision, categorySet: fresh });

    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id = ?').pluck().get(set.clues[0].id)).toBe(1);
    expect(repository.getClue(set.clues[0].id)).toMatchObject({ prompt: { en: 'Corrected prompt' } });
    expect(repository.listReported()).toEqual([]);
  });

  it('creates and directly edits a complete English-only custom set with immutable identities', () => {
    const { database, editor } = openEditor();
    const pack = editor.createPack({ name: 'My Pack' });
    const created = editor.saveCategorySet({
      expectedRevision: pack.revision,
      categorySet: {
        id: null,
        packId: pack.id,
        round: 'round-one',
        difficulty: 'easy',
        macroTopic: 'science',
        name: { en: 'Planets' },
        enabled: true,
        clues: [1, 2, 3, 4, 5].map((tier) => ({
          id: null,
          tier,
          value: tier * 200,
          prompt: { en: `Prompt ${tier}` },
          response: { en: `Response ${tier}` },
          explanation: { en: `Explanation ${tier}` },
          acceptedResponses: undefined,
          source: {
            title: 'Open facts', url: `https://example.com/${tier}`, license: 'CC BY 4.0',
            retrievedAt: '2026-08-12', translationStatus: 'untranslated',
          },
          enabled: true,
          reported: false,
        })),
      },
    });

    expect(created.eligibility).toEqual({ en: true, et: false });
    expect(created.clues.map((clue) => clue.tier)).toEqual([1, 2, 3, 4, 5]);
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides').pluck().get()).toBe(0);
    const originalIds = created.clues.map((clue) => clue.id);
    created.clues[0].prompt.en = 'Direct correction';
    const updated = editor.saveCategorySet({ expectedRevision: created.revision, categorySet: created });
    expect(updated.clues.map((clue) => clue.id)).toEqual(originalIds);
    expect(database.prepare('SELECT prompt_json FROM clues WHERE id = ?').pluck().get(originalIds[0]!))
      .toContain('Direct correction');
  });

  it('sorts reported content first, exposes authoring metadata, resolves reports, and refuses protected deletion', () => {
    const { database, repository, editor } = openEditor();
    const first = editor.list().packs[0].categorySets[1].clues[0];
    repository.reportClue({ clueId: first.id!, matchId: null, note: 'Verify source', createdAt: 100 });

    const listed = editor.list();
    expect(listed.reports[0]).toMatchObject({ clueId: first.id, note: 'Verify source' });
    expect(listed.packs[0].categorySets[0].clues.some((clue) => clue.id === first.id)).toBe(true);
    expect(listed.packs[0].categorySets[0].clues[0].source).toEqual(expect.objectContaining({ title: expect.any(String) }));
    editor.resolveReport({ clueId: first.id! });
    expect(editor.list().reports).toEqual([]);

    const custom = editor.createPack({ name: 'Protected Pack' });
    const protectedSet = editor.saveCategorySet({
      expectedRevision: custom.revision,
      categorySet: {
        id: null, packId: custom.id, round: 'round-one', difficulty: 'easy', macroTopic: 'general',
        name: { en: 'Protected' }, enabled: true,
        clues: [1, 2, 3, 4, 5].map((tier) => ({
          id: null, tier, value: tier * 200, prompt: { en: `P${tier}` }, response: { en: `R${tier}` },
          explanation: { en: `E${tier}` }, acceptedResponses: undefined,
          source: { title: 'S', url: `https://example.com/${tier}`, license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'untranslated' },
          enabled: true, reported: false,
        })),
      },
    });
    repository.reportClue({ clueId: protectedSet.clues[0].id, matchId: null, note: 'Keep', createdAt: 101 });
    expect(() => editor.deletePack({ packId: custom.id, expectedRevision: editor.list().packs.find((p) => p.id === custom.id)!.revision }))
      .toThrow(/protected|report/i);
    expect(database.prepare('SELECT COUNT(*) FROM content_packs WHERE id = ?').pluck().get(custom.id)).toBe(1);
  });
});
