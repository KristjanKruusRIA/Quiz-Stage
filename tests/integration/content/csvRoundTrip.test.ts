import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  exportPack,
  importPack,
  previewPackImport,
  CsvPackWorkflow,
  type ImportConflictStrategy,
} from '../../../src/main/content/csvPacks';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';

type Row = Record<(typeof CSV_COLUMNS)[number], string>;
const seedPath = resolve('resources/content/dev-seed.sqlite');

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function csv(rows: readonly Row[], newline = '\r\n'): string {
  return [CSV_COLUMNS, ...rows.map((row) => CSV_COLUMNS.map((column) => row[column]))]
    .map((cells) => cells.map(csvCell).join(','))
    .join(newline);
}

function row(tier: number, overrides: Partial<Row> = {}): Row {
  return {
    clue_id: `import-clue-${tier}`,
    pack_id: 'import-pack',
    pack_name: 'Imported Pack',
    category_set_id: 'import-category',
    content_kind: 'board',
    round: 'round-one',
    tier: String(tier),
    difficulty: 'easy',
    macro_topic: 'science',
    category_name_en: 'CSV Science',
    category_name_et: '',
    clue_en: tier === 1 ? 'A formula-looking =SUM(A1:A2),\nkept as text' : `Prompt ${tier}`,
    clue_et: '',
    response_en: `Response ${tier}`,
    response_et: '',
    accepted_variants_en: tier === 1 ? String.raw`one\;literal;path\\segment` : '',
    accepted_variants_et: '',
    explanation_en: `Explanation ${tier}`,
    explanation_et: '',
    source_title: 'Source, Inc.',
    source_url: `https://example.com/${tier}`,
    source_license: 'CC BY 4.0',
    source_retrieved_at: '2026-08-11',
    translation_status: 'untranslated',
    enabled: tier === 5 ? 'false' : 'true',
    ...overrides,
  };
}

function packCsv(overrides: Partial<Row> = {}): string {
  return csv([1, 2, 3, 4, 5].map((tier) => row(tier, overrides)));
}

describe('transactional CSV pack import and export', () => {
  const directories: string[] = [];
  const connections: DatabaseConnection[] = [];

  afterEach(() => {
    for (const connection of connections.splice(0)) if (connection.open) connection.close();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  function openCopy(): {
    directory: string;
    databasePath: string;
    database: DatabaseConnection;
    repository: ContentRepository;
  } {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-csv-'));
    directories.push(directory);
    const databasePath = join(directory, 'content.sqlite');
    copyFileSync(seedPath, databasePath);
    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    return { directory, databasePath, database, repository: new ContentRepository(database) };
  }

  function commit(
    database: DatabaseConnection,
    repository: ContentRepository,
    text: string,
    conflict?: ImportConflictStrategy,
    createId?: () => string,
  ) {
    const preview = previewPackImport({ database, text });
    expect(preview.issues).toEqual([]);
    return importPack({ database, repository, preview, conflict, createId });
  }

  it('previews without writes, commits once, and keeps disabled English-only content English-eligible only', () => {
    const { database, repository } = openCopy();
    const before = database.prepare('SELECT COUNT(*) FROM content_packs').pluck().get();

    const preview = previewPackImport({ database, text: packCsv() });

    expect(preview).toMatchObject({ packId: 'import-pack', conflict: false, issues: [], rowCount: 5 });
    expect(database.prepare('SELECT COUNT(*) FROM content_packs').pluck().get()).toBe(before);
    const result = importPack({ database, repository, preview });
    expect(result).toEqual({ packId: 'import-pack', replaced: false, keptBoth: false, rowCount: 5 });
    const imported = repository.loadLibrary().categorySets.find((set) => set.id === 'import-category');
    expect(imported).toMatchObject({
      packId: 'import-pack',
      name: { en: 'CSV Science' },
      clues: expect.arrayContaining([expect.objectContaining({
        id: 'import-clue-1',
        prompt: { en: 'A formula-looking =SUM(A1:A2),\nkept as text' },
        acceptedResponses: { en: String.raw`one\;literal;path\\segment` },
      })]),
    });
    expect(imported?.clues[4].enabled).toBe(false);
    expect(imported?.clues.every((clue) => clue.prompt.et === undefined)).toBe(true);
  });

  it('exports deterministically with BOM, CRLF, exact columns, and byte-equivalent normalized re-import records', () => {
    const { directory, database, repository } = openCopy();
    commit(database, repository, packCsv());
    const first = join(directory, 'first.csv');
    const second = join(directory, 'second.csv');

    exportPack({ database, packId: 'import-pack', destination: first });
    exportPack({ database, packId: 'import-pack', destination: second });

    const firstBytes = readFileSync(first);
    const secondBytes = readFileSync(second);
    expect(firstBytes.equals(secondBytes)).toBe(true);
    expect(firstBytes.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    const text = firstBytes.toString('utf8');
    expect(text).not.toMatch(/(?<!\r)\n/);
    expect(text.slice(1).split('\r\n')[0].split(',')).toEqual(CSV_COLUMNS);
    expect(previewPackImport({ database, text }).records).toEqual(
      previewPackImport({ database, text: packCsv() }).records,
    );
  });

  it('replaces only the existing custom pack while preserving stable reports, overrides, and identity', () => {
    const { directory, database, repository } = openCopy();
    commit(database, repository, packCsv());
    repository.reportClue({ clueId: 'import-clue-1', matchId: null, note: 'Review', createdAt: 10 });
    const original = repository.getClue('import-clue-2')!;
    repository.saveOverride({
      ...original,
      prompt: { en: 'Override survives', et: 'Parandus säilib' },
      response: { en: original.response.en, et: 'Vastus' },
      explanation: { en: original.explanation.en, et: 'Selgitus' },
    });
    database.prepare('UPDATE content_packs SET enabled = 0 WHERE id = ?').run('import-pack');

    commit(database, repository, packCsv({ pack_name: 'Replaced Pack' }), 'replace-existing');

    expect(repository.listReported()).toContainEqual(expect.objectContaining({ clueId: 'import-clue-1' }));
    expect(repository.getClue('import-clue-1')?.enabled).toBe(false);
    expect(repository.getClue('import-clue-2')?.prompt.en).toBe('Override survives');
    expect(database.prepare('SELECT name FROM content_packs WHERE id = ?').pluck().get('import-pack'))
      .toBe('Replaced Pack');
    expect(database.prepare('SELECT enabled FROM content_packs WHERE id = ?').pluck().get('import-pack')).toBe(0);
    const disabledExport = join(directory, 'disabled-pack.csv');
    exportPack({ database, packId: 'import-pack', destination: disabledExport });
    expect(previewPackImport({ database, text: readFileSync(disabledExport, 'utf8') }).issues).toEqual([]);

    const changedIdentity = packCsv({ category_set_id: 'different-category' });
    const preview = previewPackImport({ database, text: changedIdentity });
    expect(() => importPack({
      database, repository, preview, conflict: 'replace-existing',
    })).toThrow(/stable.*identity/i);
    expect(database.prepare('SELECT id FROM category_sets WHERE pack_id = ?').pluck().all('import-pack'))
      .toEqual(['import-category']);

    const removeProtectedRows = csv([1, 2, 3, 4, 5].map((tier) => row(tier, {
      clue_id: `replacement-${tier}`,
      category_set_id: 'replacement-category',
      category_name_en: 'Replacement Category',
      pack_name: 'Must Roll Back',
    })));
    const removalPreview = previewPackImport({ database, text: removeProtectedRows });
    expect(() => importPack({
      database, repository, preview: removalPreview, conflict: 'replace-existing',
    })).toThrow(/foreign key/i);
    expect(database.prepare('SELECT name FROM content_packs WHERE id = ?').pluck().get('import-pack'))
      .toBe('Replaced Pack');
    expect(database.prepare("SELECT COUNT(*) FROM category_sets WHERE id = 'replacement-category'").pluck().get())
      .toBe(0);
  });

  it('Keep Both rewrites pack, category, board, and Final identities and every reference collision-free', () => {
    const { database, repository } = openCopy();
    const final = row(0, {
      clue_id: 'import-final',
      category_set_id: 'import-final-category',
      content_kind: 'final',
      round: 'final',
      tier: '0',
      macro_topic: 'final',
      category_name_en: 'CSV Final',
      clue_en: 'Final prompt',
      response_en: 'Final response',
      explanation_en: 'Final explanation',
    });
    const text = csv([...Array.from({ length: 5 }, (_, index) => row(index + 1)), final]);
    commit(database, repository, text);
    const ids = ['import-pack', 'import-pack', 'copy-pack', 'import-category', 'copy-category',
      'import-clue-1', 'copy-clue-1', 'copy-clue-2', 'copy-clue-3', 'copy-clue-4', 'copy-clue-5',
      'copy-final-category', 'copy-final'];
    const result = commit(database, repository, text, 'keep-both', () => ids.shift() ?? 'unused');

    expect(result).toMatchObject({ packId: 'copy-pack', keptBoth: true, rowCount: 6 });
    expect(database.prepare('SELECT id FROM category_sets WHERE pack_id = ? ORDER BY id').pluck().all('copy-pack'))
      .toEqual(['copy-category', 'copy-final-category']);
    expect(database.prepare(`
      SELECT clues.id || ':' || clues.category_set_id
      FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id
      WHERE category_sets.pack_id = ? ORDER BY clues.id
    `).pluck().all('copy-pack')).toEqual([
      'copy-clue-1:copy-category', 'copy-clue-2:copy-category', 'copy-clue-3:copy-category',
      'copy-clue-4:copy-category', 'copy-clue-5:copy-category', 'copy-final:copy-final-category',
    ]);
  });

  it('rejects one invalid row before writing and rolls back an injected late database failure', () => {
    const { database, repository } = openCopy();
    const before = database.prepare('SELECT COUNT(*) FROM content_packs').pluck().get();
    const invalid = packCsv({ source_url: 'not-a-url' });
    const invalidPreview = previewPackImport({ database, text: invalid });

    expect(invalidPreview.issues).not.toEqual([]);
    expect(() => importPack({ database, repository, preview: invalidPreview })).toThrow(/validation/i);
    expect(database.prepare('SELECT COUNT(*) FROM content_packs').pluck().get()).toBe(before);

    database.exec(`
      CREATE TRIGGER fail_late_csv_import BEFORE INSERT ON clues
      WHEN NEW.id = 'import-clue-5'
      BEGIN SELECT RAISE(ABORT, 'late csv failure'); END;
    `);
    const validPreview = previewPackImport({ database, text: packCsv() });
    expect(() => importPack({ database, repository, preview: validPreview })).toThrow(/late csv failure/i);
    expect(database.prepare('SELECT COUNT(*) FROM content_packs').pluck().get()).toBe(before);
    expect(database.prepare("SELECT COUNT(*) FROM category_sets WHERE pack_id = 'import-pack'").pluck().get()).toBe(0);
  });

  it('revalidates the complete preview snapshot at commit instead of trusting mutated records', () => {
    const { database, repository } = openCopy();
    const preview = previewPackImport({ database, text: packCsv() });
    preview.records[0].sourceUrl = 'javascript:alert(1)';

    expect(() => importPack({ database, repository, preview })).toThrow(/validation/i);
    expect(database.prepare("SELECT COUNT(*) FROM content_packs WHERE id = 'import-pack'").pluck().get()).toBe(0);
  });

  it('rechecks stale previews at commit and never replaces the bundled seed pack', () => {
    const { database, repository } = openCopy();
    const stale = previewPackImport({ database, text: packCsv() });
    expect(stale.conflict).toBe(false);
    database.prepare(`
      INSERT INTO content_packs (id, name, version, source, enabled)
      VALUES ('import-pack', 'Concurrent pack', '1', 'custom-csv', 1)
    `).run();

    expect(() => importPack({ database, repository, preview: stale })).toThrow(/conflict choice/i);
    expect(database.prepare("SELECT COUNT(*) FROM category_sets WHERE pack_id = 'import-pack'").pluck().get()).toBe(0);

    const bundledText = packCsv({ pack_id: 'dev-library', pack_name: 'Do not replace bundled content' });
    const bundled = previewPackImport({ database, text: bundledText });
    expect(bundled.conflict).toBe(true);
    expect(() => importPack({
      database, repository, preview: bundled, conflict: 'replace-existing',
    })).toThrow(/only.*custom CSV pack/i);
    expect(database.prepare("SELECT name FROM content_packs WHERE id = 'dev-library'").pluck().get())
      .toBe('Quiz Stage Development Library');
  });

  it('keeps previews read-only and commits their exact validated in-memory snapshot through the workflow', () => {
    const { database, repository } = openCopy();
    const before = database.prepare('SELECT COUNT(*) FROM content_packs').pluck().get();
    const readFile = vi.fn(() => packCsv());
    const workflow = new CsvPackWorkflow(database, repository, {
      createPreviewId: () => 'preview-workflow-1',
      readFile,
    });

    const preview = workflow.previewFile('C:\\dialog-selected.csv');

    expect(preview).toMatchObject({ previewId: 'preview-workflow-1', issues: [], conflict: false });
    expect(readFile).toHaveBeenCalledWith('C:\\dialog-selected.csv');
    expect(database.prepare('SELECT COUNT(*) FROM content_packs').pluck().get()).toBe(before);
    expect(workflow.importPreview({ previewId: preview.previewId })).toMatchObject({ packId: 'import-pack' });
    expect(() => workflow.importPreview({ previewId: preview.previewId })).toThrow(/expired/i);
  });

  it('serializes writers with the repository immediate transaction while readers see no partial pack', () => {
    const { databasePath, database, repository } = openCopy();
    const observer = openDatabase({ filePath: databasePath });
    connections.push(observer);
    observer.pragma('busy_timeout = 0');
    let observedCount: unknown;
    let writerCode: string | undefined;
    database.function('observe_csv_import', () => {
      observedCount = observer.prepare("SELECT COUNT(*) FROM content_packs WHERE id = 'import-pack'").pluck().get();
      try {
        observer.prepare("INSERT INTO settings (key, value_json, updated_at) VALUES ('concurrent', '{}', 1)").run();
      } catch (error) {
        writerCode = (error as { code?: string }).code;
      }
      return 1;
    });
    database.exec(`
      CREATE TRIGGER observe_csv_import AFTER INSERT ON content_packs
      WHEN NEW.id = 'import-pack'
      BEGIN SELECT observe_csv_import(); END;
    `);

    commit(database, repository, packCsv());

    expect(observedCount).toBe(0);
    expect(writerCode).toBe('SQLITE_BUSY');
    expect(observer.prepare("SELECT COUNT(*) FROM content_packs WHERE id = 'import-pack'").pluck().get()).toBe(1);
  });

  it('never leaves a partial destination or temporary file when export fails', () => {
    const { directory, database, repository } = openCopy();
    commit(database, repository, packCsv());
    const destination = join(directory, 'blocked.csv');
    const writeFile = vi.fn(() => { throw new Error('disk full'); });

    expect(() => exportPack({ database, packId: 'import-pack', destination, writeFile })).toThrow('disk full');
    expect(existsSync(destination)).toBe(false);
    expect(readdirSync(directory).filter((name) => name.includes('.tmp'))).toEqual([]);
  });

  it('keeps import/export file paths behind current-host dialogs with strict cancellation-safe IPC', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, input: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    const coordinator = {
      dispatch: vi.fn(), subscribe: vi.fn(() => () => undefined),
      getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
    };
    const contentCsv = {
      previewFile: vi.fn(() => ({
        previewId: 'preview-1', packId: 'import-pack', packName: 'Imported Pack',
        rowCount: 5, conflict: false, issues: [],
      })),
      importPreview: vi.fn(() => ({
        packId: 'import-pack', replaced: false, keptBoth: false, rowCount: 5,
      })),
      exportToFile: vi.fn(() => ({ packId: 'import-pack', rowCount: 5, bytes: 100 })),
    };
    const paths = [null, 'C:\\chosen\\pack.csv'];
    const csvDialogs = {
      chooseImportFile: vi.fn(async () => paths.shift() ?? null),
      chooseExportFile: vi.fn(async () => 'C:\\chosen\\export.csv'),
    };
    const hostWindow = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    const publicWindow = { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } };
    registerIpc({
      ipcMain, coordinator, contentCsv, csvDialogs,
      getWindows: () => ({ hostWindow, publicWindow }),
    });

    const preview = handlers.get(IPC_CHANNELS.contentImportPreview)!;
    const commitImport = handlers.get(IPC_CHANNELS.contentImportCommit)!;
    const exportCsv = handlers.get(IPC_CHANNELS.contentExport)!;
    await expect(preview({ sender: { id: 20 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(preview({ sender: { id: 10 } }, { path: 'C:\\forbidden.csv' })).rejects.toThrow();
    await expect(preview({ sender: { id: 10 } }, undefined)).resolves.toEqual({ cancelled: true });
    expect(contentCsv.previewFile).not.toHaveBeenCalled();
    await expect(preview({ sender: { id: 10 } }, undefined)).resolves.toMatchObject({
      cancelled: false, previewId: 'preview-1', packId: 'import-pack',
    });
    expect(contentCsv.previewFile).toHaveBeenCalledWith('C:\\chosen\\pack.csv');

    await expect(commitImport({ sender: { id: 10 } }, {
      previewId: 'preview-1', conflict: 'replace-existing', extra: true,
    })).rejects.toThrow();
    await expect(commitImport({ sender: { id: 10 } }, {
      previewId: 'preview-1', conflict: 'replace-existing',
    })).resolves.toMatchObject({ packId: 'import-pack', replaced: false });
    await expect(exportCsv({ sender: { id: 10 } }, { packId: ' import-pack' })).rejects.toThrow();
    await expect(exportCsv({ sender: { id: 10 } }, { packId: 'import-pack' })).resolves.toEqual({
      cancelled: false, packId: 'import-pack', rowCount: 5, bytes: 100,
    });
    expect(contentCsv.exportToFile).toHaveBeenCalledWith('import-pack', 'C:\\chosen\\export.csv');
  });

  it('rejects malformed CSV IPC responses and propagates selected-path read/write failures without fallback paths', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, input: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler), removeHandler: vi.fn(),
      on: vi.fn(), removeListener: vi.fn(),
    };
    const contentCsv = {
      previewFile: vi.fn(() => { throw new Error('read denied'); }),
      importPreview: vi.fn(() => ({ packId: 'pack', replaced: false, keptBoth: false, rowCount: 5 })),
      exportToFile: vi.fn(() => ({ packId: 'pack', rowCount: 5, bytes: 1, extra: true })),
    };
    const hostWindow = { webContents: { id: 1, send: vi.fn(), isDestroyed: () => false } };
    registerIpc({
      ipcMain,
      coordinator: {
        dispatch: vi.fn(), subscribe: vi.fn(() => () => undefined),
        getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
      },
      contentCsv,
      csvDialogs: {
        chooseImportFile: async () => 'C:\\chosen\\broken.csv',
        chooseExportFile: async () => 'C:\\chosen\\broken.csv',
      },
      getWindows: () => ({ hostWindow, publicWindow: null }),
    });

    await expect(handlers.get(IPC_CHANNELS.contentImportPreview)!({ sender: { id: 1 } }, undefined))
      .rejects.toThrow('read denied');
    await expect(handlers.get(IPC_CHANNELS.contentExport)!({ sender: { id: 1 } }, { packId: 'pack' }))
      .rejects.toThrow();
  });
});
