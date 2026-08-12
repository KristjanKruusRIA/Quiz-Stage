import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentEditorService } from '../../../src/main/content/contentEditorService';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { exportPack, previewPackImport } from '../../../src/main/content/csvPacks';
import { toWritableCategorySet, toWritableFinalClue, type EditorSource } from '../../../src/shared/content/editor';
import { sourceCitation } from '../../../src/shared/content/sourceCitation';

const seedPath = resolve('resources/content/dev-seed.sqlite');
const BASE_SOURCE: EditorSource = {
  title: 'Structured seed source',
  url: 'https://example.com/seed',
  license: 'CC0',
  retrievedAt: '2026-08-01',
  translationStatus: 'reviewed',
};

function storedSource(source: EditorSource): string {
  return JSON.stringify({ format: 'quiz-stage-csv-v1', ...source });
}

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

  function createCustomCategory(editor: ContentEditorService, name: string) {
    const pack = editor.createPack({ name });
    const category = editor.saveCategorySet({ expectedRevision: pack.revision, categorySet: toWritableCategorySet({
      id: null, packId: pack.id, round: 'round-one', difficulty: 'easy', macroTopic: 'science',
      name: { en: `${name} category` }, enabled: true,
      clues: [1, 2, 3, 4, 5].map((tier) => ({
        id: null, tier, value: tier * 200, prompt: { en: `Prompt ${tier}` }, response: { en: `Response ${tier}` },
        explanation: { en: `Explanation ${tier}` }, acceptedResponses: undefined,
        source: { title: 'Open facts', url: `https://example.com/${tier}`, license: 'CC0',
          retrievedAt: '2026-08-12', translationStatus: 'untranslated' },
        enabled: true, reported: false,
      })),
    }) });
    return { pack, category };
  }

  function createCustomFinal(editor: ContentEditorService, packId: string) {
    const pack = editor.list().packs.find((candidate) => candidate.id === packId)!;
    return editor.saveFinalClue({ expectedRevision: pack.revision, finalClue: toWritableFinalClue({
      id: null, packId, categoryId: null, difficulty: 'easy', macroTopic: 'history', enabled: true,
      categoryName: { en: 'Custom Final' }, clue: {
        id: null, tier: 0, value: 0, prompt: { en: 'Final prompt' }, response: { en: 'Final response' },
        explanation: { en: 'Final explanation' }, acceptedResponses: undefined,
        source: { title: 'Open final facts', url: 'https://example.com/final', license: 'CC0',
          retrievedAt: '2026-08-12', translationStatus: 'untranslated' },
        enabled: true, reported: false,
      },
    }) });
  }

  function installStructuredBundledSources(database: DatabaseConnection): void {
    database.prepare('UPDATE clues SET source = ?').run(storedSource(BASE_SOURCE));
  }

  const sourceChanges: { field: keyof EditorSource; value: string }[] = [
    { field: 'title', value: 'Corrected source title' },
    { field: 'url', value: 'https://example.com/corrected' },
    { field: 'license', value: 'CC BY 4.0' },
    { field: 'retrievedAt', value: '2026-08-12' },
    { field: 'translationStatus', value: 'machine' },
  ];

  it.each(['board', 'final'].flatMap((kind) => sourceChanges.map((change) => ({ kind, ...change }))))(
    'preserves the complete bundled $kind provenance when only $field changes',
    ({ kind, field, value }) => {
      const { database, repository, editor } = openEditor();
      installStructuredBundledSources(database);
      const bundled = editor.list().packs.find((pack) => pack.ownership === 'bundled')!;
      const initial = kind === 'board' ? bundled.categorySets[0] : bundled.finalClues[0];
      const clueId = 'clues' in initial ? initial.clues[0].id : initial.clue.id;
      repository.reportClue({ clueId, matchId: null, note: `Correct ${field}`, createdAt: 499 });

      const reportedPack = editor.list().packs.find((pack) => pack.id === bundled.id)!;
      const draft = structuredClone(kind === 'board'
        ? reportedPack.categorySets.find((category) => category.id === initial.id)!
        : reportedPack.finalClues.find((final) => final.id === initial.id)!);
      const clue = 'clues' in draft ? draft.clues[0] : draft.clue;
      Object.assign(clue.source, { [field]: value });
      const expectedSource = { ...BASE_SOURCE, [field]: value };
      const savedClue = 'clues' in draft
        ? editor.saveCategorySet({ expectedRevision: draft.revision, categorySet: toWritableCategorySet(draft) }).clues[0]
        : editor.saveFinalClue({ expectedRevision: draft.revision, finalClue: toWritableFinalClue(draft) }).clue;

      expect(savedClue.source).toEqual(expectedSource);
      expect(repository.listReported().some((report) => report.clueId === clueId)).toBe(false);
      const rawOverride = database.prepare('SELECT override_json FROM content_overrides WHERE clue_id = ?')
        .pluck().get(clueId) as string;
      const overrideSource = (JSON.parse(rawOverride) as { source: string }).source;
      expect(JSON.parse(overrideSource)).toEqual({ format: 'quiz-stage-csv-v1', ...expectedSource });
      expect(sourceCitation(overrideSource)).toBe(expectedSource.title);

      database.prepare('UPDATE clues SET source = ? WHERE id = ?').run(storedSource({
        title: 'Upgraded seed source',
        url: 'https://example.com/upgraded',
        license: 'ODC-BY-1.0',
        retrievedAt: '2026-08-13',
        translationStatus: 'untranslated',
      }), clueId);
      database.close();
      const restartedDatabase = openDatabase({ filePath: database.name });
      connections.push(restartedDatabase);
      const restartedRepository = new ContentRepository(restartedDatabase, { now: () => 501 });
      const restarted = new ContentEditorService(restartedDatabase, restartedRepository, { now: () => 501 });
      const restartedPack = restarted.list().packs.find((pack) => pack.id === bundled.id)!;
      const restartedClue = kind === 'board'
        ? restartedPack.categorySets.find((category) => category.id === initial.id)!.clues[0]
        : restartedPack.finalClues.find((final) => final.id === initial.id)!.clue;
      expect(restartedClue.source).toEqual(expectedSource);
      expect(sourceCitation(restartedRepository.getClue(clueId)!.source)).toBe(expectedSource.title);

      const destination = join(dirname(database.name), `${kind}-${field}.csv`);
      exportPack({ database: restartedDatabase, packId: bundled.id, destination });
      const preview = previewPackImport({ database: restartedDatabase, text: readFileSync(destination, 'utf8') });
      expect(preview.issues).toEqual([]);
      expect(preview.records.find((record) => record.clueId === clueId)).toMatchObject({
        sourceTitle: expectedSource.title,
        sourceUrl: expectedSource.url,
        sourceLicense: expectedSource.license,
        sourceRetrievedAt: expectedSource.retrievedAt,
        translationStatus: expectedSource.translationStatus,
      });
    },
  );

  it('keeps bundled reports and skips clue overrides when structured sources do not change', () => {
    const { database, repository, editor } = openEditor();
    installStructuredBundledSources(database);
    const bundled = editor.list().packs.find((pack) => pack.ownership === 'bundled')!;
    const board = bundled.categorySets[0];
    const final = bundled.finalClues[0];
    repository.reportClue({ clueId: board.clues[0].id, matchId: null, note: 'Board report', createdAt: 10 });
    repository.reportClue({ clueId: final.clue.id, matchId: null, note: 'Final report', createdAt: 11 });

    const reportedPack = editor.list().packs.find((pack) => pack.id === bundled.id)!;
    const reportedBoard = reportedPack.categorySets.find((category) => category.id === board.id)!;
    editor.saveCategorySet({ expectedRevision: reportedBoard.revision, categorySet: toWritableCategorySet(reportedBoard) });
    const reportedFinal = editor.list().packs.find((pack) => pack.id === bundled.id)!.finalClues
      .find((candidate) => candidate.id === final.id)!;
    editor.saveFinalClue({ expectedRevision: reportedFinal.revision, finalClue: toWritableFinalClue(reportedFinal) });

    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id IN (?, ?)').pluck()
      .get(board.clues[0].id, final.clue.id)).toBe(0);
    expect(repository.listReported().map((report) => report.clueId).sort())
      .toEqual([board.clues[0].id, final.clue.id].sort());
  });

  it.each(['board', 'final'] as const)('rolls back a failed bundled %s source save without resolving its report', (kind) => {
    const { database, repository, editor } = openEditor();
    installStructuredBundledSources(database);
    const bundled = editor.list().packs.find((pack) => pack.ownership === 'bundled')!;
    const initial = kind === 'board' ? bundled.categorySets[0] : bundled.finalClues[0];
    const clueId = 'clues' in initial ? initial.clues[0].id : initial.clue.id;
    repository.reportClue({ clueId, matchId: null, note: 'Must survive rollback', createdAt: 10 });
    const reportedPack = editor.list().packs.find((pack) => pack.id === bundled.id)!;
    const draft = structuredClone(kind === 'board'
      ? reportedPack.categorySets.find((category) => category.id === initial.id)!
      : reportedPack.finalClues.find((final) => final.id === initial.id)!);
    ('clues' in draft ? draft.clues[0] : draft.clue).source.url = 'https://example.com/rollback';
    database.exec(`CREATE TRIGGER reject_source_override BEFORE INSERT ON content_overrides
      BEGIN SELECT RAISE(ABORT, 'forced source override failure'); END`);

    expect(() => {
      if ('clues' in draft) {
        editor.saveCategorySet({ expectedRevision: draft.revision, categorySet: toWritableCategorySet(draft) });
      } else {
        editor.saveFinalClue({ expectedRevision: draft.revision, finalClue: toWritableFinalClue(draft) });
      }
    }).toThrow('forced source override failure');
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id = ?').pluck().get(clueId)).toBe(0);
    expect(repository.listReported()).toEqual([expect.objectContaining({ clueId, note: 'Must survive rollback' })]);
  });

  it('keeps a legacy bundled source as plain text when only its title is corrected', () => {
    const { database, repository, editor } = openEditor();
    const bundled = editor.list().packs.find((pack) => pack.ownership === 'bundled')!;
    const draft = structuredClone(bundled.categorySets[0]);
    expect(draft.clues[0].source).toMatchObject({ url: null, license: null, retrievedAt: null, translationStatus: null });
    draft.clues[0].source.title = 'Corrected legacy title';

    const saved = editor.saveCategorySet({ expectedRevision: draft.revision, categorySet: toWritableCategorySet(draft) });

    expect(saved.clues[0].source).toEqual({
      title: 'Corrected legacy title', url: null, license: null, retrievedAt: null, translationStatus: null,
    });
    expect(repository.getClue(draft.clues[0].id)!.source).toBe('Corrected legacy title');
    expect(database.prepare('SELECT override_json FROM content_overrides WHERE clue_id = ?').pluck().get(draft.clues[0].id))
      .toContain('Corrected legacy title');
  });

  it('routes bundled corrections through overrides and rejects stale saves', () => {
    const { database, repository, editor } = openEditor();
    const library = editor.list();
    const bundled = library.packs.find((pack) => pack.ownership === 'bundled')!;
    const set = bundled.categorySets[0];
    const corrected = structuredClone(set);
    corrected.clues[0].prompt.en = 'Corrected prompt';

    repository.reportClue({ clueId: set.clues[0].id, matchId: null, note: 'New report', createdAt: 499 });
    expect(() => editor.saveCategorySet({ expectedRevision: set.revision, categorySet: toWritableCategorySet(corrected) }))
      .toThrow(/stale/i);

    const fresh = editor.list().packs.find((pack) => pack.id === bundled.id)!.categorySets
      .find((category) => category.id === set.id)!;
    fresh.clues[0].prompt.en = 'Corrected prompt';
    editor.saveCategorySet({ expectedRevision: fresh.revision, categorySet: toWritableCategorySet(fresh) });

    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id = ?').pluck().get(set.clues[0].id)).toBe(1);
    expect(repository.getClue(set.clues[0].id)).toMatchObject({ prompt: { en: 'Corrected prompt' } });
    expect(repository.listReported()).toEqual([]);
  });

  it('persists bundled category metadata as an override without manufacturing clue overrides', () => {
    const { database, editor } = openEditor();
    const bundled = editor.list().packs.find((pack) => pack.ownership === 'bundled')!;
    const set = structuredClone(bundled.categorySets[0]);
    set.name = { en: 'Locally corrected category', et: 'Kohalik parandus' };
    set.difficulty = 'hard';
    set.macroTopic = 'corrected-topic';

    const saved = editor.saveCategorySet({ expectedRevision: set.revision, categorySet: toWritableCategorySet(set) });

    expect(saved).toMatchObject({ name: set.name, difficulty: 'hard', macroTopic: 'corrected-topic' });
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id IN (SELECT id FROM clues WHERE category_set_id = ?)').pluck().get(set.id)).toBe(0);
    expect(database.prepare('SELECT COUNT(*) FROM category_set_overrides WHERE category_set_id = ?').pluck().get(set.id)).toBe(1);
    database.prepare("UPDATE category_sets SET name_json = ?, difficulty = 'easy', macro_topic = 'seed-upgrade' WHERE id = ?")
      .run(JSON.stringify({ en: 'Seed upgrade' }), set.id);
    const restartedDatabase = openDatabase({ filePath: database.name });
    connections.push(restartedDatabase);
    const restarted = new ContentEditorService(restartedDatabase, new ContentRepository(restartedDatabase), { now: () => 501 });
    expect(restarted.list().packs.find((pack) => pack.id === bundled.id)!.categorySets.find((candidate) => candidate.id === set.id))
      .toMatchObject({ name: set.name, difficulty: 'hard', macroTopic: 'corrected-topic' });
  });

  it('uses accepted responses in bilingual eligibility for board and Final content', () => {
    const { database, repository, editor } = openEditor();
    const pack = editor.createPack({ name: 'Eligibility Pack' });
    const category = editor.saveCategorySet({ expectedRevision: pack.revision, categorySet: toWritableCategorySet({
      id: null, packId: pack.id, round: 'round-one', difficulty: 'easy', macroTopic: 'language',
      name: { en: 'Words', et: 'Sõnad' }, enabled: true,
      clues: [1, 2, 3, 4, 5].map((tier) => ({ id: null, tier, value: tier * 200,
        prompt: { en: `P${tier}`, et: `K${tier}` }, response: { en: `R${tier}`, et: `V${tier}` },
        explanation: { en: `E${tier}`, et: `S${tier}` }, acceptedResponses: { en: 'alias' },
        source: { title: 'S', url: `https://example.com/${tier}`, license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' },
        enabled: true, reported: false })),
    }) });
    expect(category.eligibility).toEqual({ en: true, et: false });
    const freshPack = editor.list().packs.find((candidate) => candidate.id === pack.id)!;
    const final = editor.saveFinalClue({ expectedRevision: freshPack.revision, finalClue: toWritableFinalClue({
      id: null, packId: pack.id, categoryId: null, difficulty: 'easy', macroTopic: 'language', enabled: true,
      categoryName: { en: 'Final', et: 'Finaal' }, clue: { id: null, tier: 0, value: 0,
        prompt: { en: 'P', et: 'K' }, response: { en: 'R', et: 'V' }, explanation: { en: 'E', et: 'S' },
        acceptedResponses: { en: 'alias' }, source: { title: 'S', url: 'https://example.com/final', license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' }, enabled: true, reported: false },
    }) });
    expect(final.eligibility).toEqual({ en: true, et: false });
    const destination = join(dirname(database.name), 'url-roundtrip.csv');
    exportPack({ database, packId: pack.id, destination });
    const exported = previewPackImport({ database, text: readFileSync(destination, 'utf8') });
    expect(exported.issues).toEqual([]);
    expect(exported.records.find((record) => record.contentKind === 'final')?.sourceUrl).toBe('https://example.com/final');
    const invalid = structuredClone(final); invalid.clue.source.url = 'mailto:source@example.com';
    expect(() => editor.saveFinalClue({ expectedRevision: final.revision, finalClue: toWritableFinalClue(invalid) })).toThrow(/HTTP|source URL/i);
    expect(repository.getClue(final.id)?.source).toContain('https://example.com/final');
  });

  it('rejects stale report and exact-report resolution snapshots including ABA reports', () => {
    const { editor } = openEditor();
    const set = editor.list().packs[0].categorySets[0];
    const clue = set.clues[0];
    const report = editor.reportClue({ clueId: clue.id, note: 'First', expectedRevision: set.revision });
    expect(() => editor.reportClue({ clueId: clue.id, note: 'Stale', expectedRevision: set.revision })).toThrow(/stale/i);
    const reported = editor.list().packs[0].categorySets.find((candidate) => candidate.id === set.id)!;
    expect(editor.resolveReport({ clueId: clue.id, reportId: report.id, expectedRevision: reported.revision })).toEqual({ resolved: true });
    const clean = editor.list().packs[0].categorySets.find((candidate) => candidate.id === set.id)!;
    const replacement = editor.reportClue({ clueId: clue.id, note: 'Replacement', expectedRevision: clean.revision });
    const replacementSet = editor.list().packs[0].categorySets.find((candidate) => candidate.id === set.id)!;
    expect(() => editor.resolveReport({ clueId: clue.id, reportId: report.id, expectedRevision: replacementSet.revision })).toThrow(/stale|report/i);
    expect(editor.list().reports[0].id).toBe(replacement.id);
  });

  it('applies Final category enabled overrides in both directions across repository and editor reads', () => {
    const { database, repository, editor } = openEditor();
    const bundled = editor.list().packs.find((pack) => pack.ownership === 'bundled')!;
    const final = structuredClone(bundled.finalClues[0]);
    final.enabled = false;
    const disabled = editor.saveFinalClue({ expectedRevision: final.revision, finalClue: toWritableFinalClue(final) });
    expect(disabled.enabled).toBe(false);
    expect(repository.loadLibrary().finalClues.find((clue) => clue.id === final.id)).toMatchObject({ enabled: false });

    database.prepare('UPDATE category_sets SET enabled = 0 WHERE id = ?').run(final.categoryId);
    const disabledBase = editor.list().packs.find((pack) => pack.id === bundled.id)!.finalClues.find((clue) => clue.id === final.id)!;
    disabledBase.enabled = true;
    const enabled = editor.saveFinalClue({ expectedRevision: disabledBase.revision, finalClue: toWritableFinalClue(disabledBase) });
    expect(enabled.enabled).toBe(true);
    expect(repository.loadLibrary().finalClues.find((clue) => clue.id === final.id)).toMatchObject({ enabled: true });
  });

  it('preserves bundled reports on metadata and unrelated-tier saves, then resolves only the corrected clue', () => {
    const { repository, editor } = openEditor();
    const set = editor.list().packs.find((pack) => pack.ownership === 'bundled')!.categorySets[0];
    repository.reportClue({ clueId: set.clues[0].id, matchId: null, note: 'Correct this', createdAt: 10 });
    repository.reportClue({ clueId: set.clues[1].id, matchId: null, note: 'Preserve this', createdAt: 11 });
    const reported = editor.list().packs.flatMap((pack) => pack.categorySets).find((candidate) => candidate.id === set.id)!;
    reported.macroTopic = 'corrected metadata';
    const metadataSaved = editor.saveCategorySet({ expectedRevision: reported.revision, categorySet: toWritableCategorySet(reported) });
    expect(repository.listReported().map((report) => report.clueId).sort()).toEqual(
      [set.clues[0].id, set.clues[1].id].sort(),
    );

    metadataSaved.clues[2].prompt.en = 'Unrelated tier correction';
    const unrelatedSaved = editor.saveCategorySet({
      expectedRevision: metadataSaved.revision, categorySet: toWritableCategorySet(metadataSaved),
    });
    expect(repository.listReported().map((report) => report.clueId).sort()).toEqual(
      [set.clues[0].id, set.clues[1].id].sort(),
    );

    unrelatedSaved.clues[0].acceptedResponses = { en: 'Correct alias', et: 'Õige alias' };
    unrelatedSaved.clues[0].source.title = 'Corrected source';
    unrelatedSaved.clues[0].enabled = false;
    const saved = editor.saveCategorySet({
      expectedRevision: unrelatedSaved.revision, categorySet: toWritableCategorySet(unrelatedSaved),
    });
    expect(saved.clues[0]).toMatchObject({ enabled: false, reported: false });
    expect(repository.getClue(saved.clues[0].id)).toMatchObject({ enabled: false });
    expect(editor.list().reports.map((report) => report.clueId)).toEqual([set.clues[1].id]);
    expect(saved.eligibility).toEqual({ en: false, et: false });
  });

  it('rejects bundled board status fields without creating an override or resolving its report', () => {
    const { database, repository, editor } = openEditor();
    const set = editor.list().packs.find((pack) => pack.ownership === 'bundled')!.categorySets[0];
    repository.reportClue({ clueId: set.clues[0].id, matchId: null, note: 'Preserve board report', createdAt: 10 });
    const reported = editor.list().packs.flatMap((pack) => pack.categorySets)
      .find((candidate) => candidate.id === set.id)!;
    const beforeReports = structuredClone(repository.listReported());
    const hostile = structuredClone(reported);
    hostile.revision = 'renderer-controlled-revision';
    hostile.ownership = 'custom';
    hostile.eligibility = { en: false, et: false };
    hostile.clues[0].reported = false;
    delete hostile.clues[0].report;

    expect(() => editor.saveCategorySet({ expectedRevision: reported.revision, categorySet: hostile })).toThrow();

    expect(database.prepare('SELECT COUNT(*) FROM category_set_overrides WHERE category_set_id = ?').pluck().get(set.id)).toBe(0);
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id = ?').pluck().get(set.clues[0].id)).toBe(0);
    expect(repository.listReported()).toEqual(beforeReports);
    expect(editor.list().packs.flatMap((pack) => pack.categorySets).find((candidate) => candidate.id === set.id)).toEqual(reported);
  });

  it('rejects bundled Final status fields without creating an override or resolving its report', () => {
    const { database, repository, editor } = openEditor();
    const final = editor.list().packs.find((pack) => pack.ownership === 'bundled')!.finalClues[0];
    repository.reportClue({ clueId: final.clue.id, matchId: null, note: 'Preserve Final report', createdAt: 11 });
    const reported = editor.list().packs.flatMap((pack) => pack.finalClues)
      .find((candidate) => candidate.id === final.id)!;
    const beforeReports = structuredClone(repository.listReported());
    const hostile = structuredClone(reported);
    hostile.revision = 'renderer-controlled-revision';
    hostile.ownership = 'custom';
    hostile.eligibility = { en: false, et: false };
    hostile.clue.reported = false;
    delete hostile.clue.report;

    expect(() => editor.saveFinalClue({ expectedRevision: reported.revision, finalClue: hostile })).toThrow();

    expect(database.prepare('SELECT COUNT(*) FROM category_set_overrides WHERE category_set_id = ?').pluck().get(final.categoryId)).toBe(0);
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides WHERE clue_id = ?').pluck().get(final.clue.id)).toBe(0);
    expect(repository.listReported()).toEqual(beforeReports);
    expect(editor.list().packs.flatMap((pack) => pack.finalClues).find((candidate) => candidate.id === final.id)).toEqual(reported);
  });

  it('rejects custom board status fields and preserves its exact report and revision', () => {
    const { repository, editor } = openEditor();
    const { category } = createCustomCategory(editor, 'Hostile board status');
    repository.reportClue({ clueId: category.clues[0].id, matchId: null, note: 'Custom board report', createdAt: 12 });
    const reported = editor.list().packs.flatMap((pack) => pack.categorySets)
      .find((candidate) => candidate.id === category.id)!;
    const beforeReports = structuredClone(repository.listReported());
    const hostile = structuredClone(reported);
    hostile.revision = 'renderer-controlled-revision';
    hostile.ownership = 'bundled';
    hostile.eligibility = { en: false, et: false };
    hostile.clues[0].reported = false;
    delete hostile.clues[0].report;

    expect(() => editor.saveCategorySet({ expectedRevision: reported.revision, categorySet: hostile })).toThrow();
    expect(repository.listReported()).toEqual(beforeReports);
    expect(editor.list().packs.flatMap((pack) => pack.categorySets).find((candidate) => candidate.id === category.id)).toEqual(reported);
  });

  it('rejects custom Final status fields and preserves its exact report and revision', () => {
    const { repository, editor } = openEditor();
    const { pack } = createCustomCategory(editor, 'Hostile Final status');
    const final = createCustomFinal(editor, pack.id);
    repository.reportClue({ clueId: final.clue.id, matchId: null, note: 'Custom Final report', createdAt: 13 });
    const reported = editor.list().packs.flatMap((candidate) => candidate.finalClues)
      .find((candidate) => candidate.id === final.id)!;
    const beforeReports = structuredClone(repository.listReported());
    const hostile = structuredClone(reported);
    hostile.revision = 'renderer-controlled-revision';
    hostile.ownership = 'bundled';
    hostile.eligibility = { en: false, et: false };
    hostile.clue.reported = false;
    delete hostile.clue.report;

    expect(() => editor.saveFinalClue({ expectedRevision: reported.revision, finalClue: hostile })).toThrow();
    expect(repository.listReported()).toEqual(beforeReports);
    expect(editor.list().packs.flatMap((candidate) => candidate.finalClues).find((candidate) => candidate.id === final.id)).toEqual(reported);
  });

  it('preserves custom board reports until that exact clue changes, including unrelated-tier and metadata saves', () => {
    const { repository, editor } = openEditor();
    const { category } = createCustomCategory(editor, 'Report preservation');
    repository.reportClue({ clueId: category.clues[0].id, matchId: null, note: 'First report', createdAt: 10 });
    repository.reportClue({ clueId: category.clues[1].id, matchId: null, note: 'Second report', createdAt: 11 });

    const stale = structuredClone(category);
    stale.name.en = 'Stale metadata';
    expect(() => editor.saveCategorySet({ expectedRevision: stale.revision, categorySet: toWritableCategorySet(stale) })).toThrow(/stale/i);

    const metadataOnly = structuredClone(editor.list().packs.flatMap((pack) => pack.categorySets)
      .find((candidate) => candidate.id === category.id)!);
    metadataOnly.macroTopic = 'updated metadata';
    const metadataSaved = editor.saveCategorySet({ expectedRevision: metadataOnly.revision, categorySet: toWritableCategorySet(metadataOnly) });
    expect(editor.list().reports.map((report) => report.clueId).sort()).toEqual(
      [category.clues[0].id, category.clues[1].id].sort(),
    );

    metadataSaved.clues[2].prompt.en = 'Unrelated tier correction';
    const unrelatedSaved = editor.saveCategorySet({ expectedRevision: metadataSaved.revision, categorySet: toWritableCategorySet(metadataSaved) });
    expect(editor.list().reports.map((report) => report.clueId).sort()).toEqual(
      [category.clues[0].id, category.clues[1].id].sort(),
    );

    unrelatedSaved.clues[0].acceptedResponses = { en: 'Corrected alias' };
    unrelatedSaved.clues[0].source.title = 'Corrected source';
    unrelatedSaved.clues[0].enabled = false;
    const corrected = editor.saveCategorySet({ expectedRevision: unrelatedSaved.revision, categorySet: toWritableCategorySet(unrelatedSaved) });
    expect(corrected.clues[0]).toMatchObject({ enabled: false, reported: false });
    expect(editor.list().reports.map((report) => report.clueId)).toEqual([category.clues[1].id]);
  });

  it('preserves a custom Final report on metadata-only save and resolves it on a disabled content correction', () => {
    const { repository, editor } = openEditor();
    const { pack } = createCustomCategory(editor, 'Final report preservation');
    const final = createCustomFinal(editor, pack.id);
    repository.reportClue({ clueId: final.clue.id, matchId: null, note: 'Final report', createdAt: 12 });

    const metadataOnly = structuredClone(editor.list().packs.find((candidate) => candidate.id === pack.id)!
      .finalClues.find((candidate) => candidate.id === final.id)!);
    metadataOnly.macroTopic = 'updated Final metadata';
    const metadataSaved = editor.saveFinalClue({ expectedRevision: metadataOnly.revision, finalClue: toWritableFinalClue(metadataOnly) });
    expect(editor.list().reports.map((report) => report.clueId)).toEqual([final.clue.id]);

    metadataSaved.clue.acceptedResponses = { en: 'Corrected Final alias' };
    metadataSaved.clue.source.title = 'Corrected Final source';
    metadataSaved.clue.enabled = false;
    const corrected = editor.saveFinalClue({ expectedRevision: metadataSaved.revision, finalClue: toWritableFinalClue(metadataSaved) });
    expect(corrected.clue).toMatchObject({ enabled: false, reported: false });
    expect(editor.list().reports).toEqual([]);
  });

  it('creates and directly edits a complete English-only custom set with immutable identities', () => {
    const { database, editor } = openEditor();
    const pack = editor.createPack({ name: 'My Pack' });
    const created = editor.saveCategorySet({
      expectedRevision: pack.revision,
      categorySet: toWritableCategorySet({
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
      }),
    });

    expect(created.eligibility).toEqual({ en: true, et: false });
    expect(created.clues.map((clue) => clue.tier)).toEqual([1, 2, 3, 4, 5]);
    expect(database.prepare('SELECT COUNT(*) FROM content_overrides').pluck().get()).toBe(0);
    const originalIds = created.clues.map((clue) => clue.id);
    created.clues[0].prompt.en = 'Direct correction';
    const updated = editor.saveCategorySet({ expectedRevision: created.revision, categorySet: toWritableCategorySet(created) });
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
    const reportedEditor = editor.list().packs.flatMap((pack) => pack.categorySets)
      .find((category) => category.clues.some((clue) => clue.id === first.id))!;
    const reportedClue = reportedEditor.clues.find((clue) => clue.id === first.id)!;
    editor.resolveReport({ clueId: first.id!, reportId: reportedClue.report!.id, expectedRevision: reportedEditor.revision });
    expect(editor.list().reports).toEqual([]);

    const custom = editor.createPack({ name: 'Protected Pack' });
    const protectedSet = editor.saveCategorySet({
      expectedRevision: custom.revision,
      categorySet: toWritableCategorySet({
        id: null, packId: custom.id, round: 'round-one', difficulty: 'easy', macroTopic: 'general',
        name: { en: 'Protected' }, enabled: true,
        clues: [1, 2, 3, 4, 5].map((tier) => ({
          id: null, tier, value: tier * 200, prompt: { en: `P${tier}` }, response: { en: `R${tier}` },
          explanation: { en: `E${tier}` }, acceptedResponses: undefined,
          source: { title: 'S', url: `https://example.com/${tier}`, license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'untranslated' },
          enabled: true, reported: false,
        })),
      }),
    });
    repository.reportClue({ clueId: protectedSet.clues[0].id, matchId: null, note: 'Keep', createdAt: 101 });
    expect(() => editor.deletePack({ packId: custom.id, expectedRevision: editor.list().packs.find((p) => p.id === custom.id)!.revision }))
      .toThrow(/protected|report/i);
    expect(database.prepare('SELECT COUNT(*) FROM content_packs WHERE id = ?').pluck().get(custom.id)).toBe(1);
  });
});
