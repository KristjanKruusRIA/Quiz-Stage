import {
  copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, truncateSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CSV_PACK_LIMITS,
  exportPack,
  importPack,
  previewPackImport,
  CsvPackWorkflow,
  readPackCsvFile,
  type ImportConflictStrategy,
} from '../../../src/main/content/csvPacks';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';
import { parse as parseCsv } from 'csv-parse/sync';

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

function identityState(database: DatabaseConnection) {
  return {
    packs: database.prepare('SELECT * FROM content_packs ORDER BY id').all(),
    categories: database.prepare('SELECT * FROM category_sets ORDER BY id').all(),
    clues: database.prepare('SELECT * FROM clues ORDER BY id').all(),
  };
}

function replaceBytes(text: string, marker: string, replacement: Uint8Array): Buffer {
  const source = Buffer.from(text, 'utf8');
  const markerBytes = Buffer.from(marker, 'utf8');
  const index = source.indexOf(markerBytes);
  if (index < 0) throw new Error(`Missing test marker: ${marker}`);
  return Buffer.concat([
    source.subarray(0, index),
    replacement,
    source.subarray(index + markerBytes.length),
  ]);
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

  it('neutralizes every spreadsheet formula prefix reversibly, including leading apostrophes', () => {
    const { directory, database, repository } = openCopy();
    const dangerous = csv([1, 2, 3, 4, 5].map((tier) => row(tier, {
      pack_name: '=Formula Pack',
      macro_topic: '+science',
      category_name_en: '-Formula Category',
      clue_en: ['=one', '+two', '-three', '@four', "'=five"][tier - 1],
      response_en: ['+one', '-two', '@three', '=four', "''=five"][tier - 1],
      explanation_en: ['-one', '@two', '=three', '+four', "'plain"][tier - 1],
      accepted_variants_en: ['=alias', '+alias', '-alias', '@alias', "'=alias"][tier - 1],
      source_title: '@Formula Source',
    })));
    const normalizedBefore = previewPackImport({ database, text: dangerous }).records;
    expect(previewPackImport({ database, text: dangerous }).issues).toEqual([]);
    commit(database, repository, dangerous);
    const destination = join(directory, 'formula-safe.csv');

    exportPack({ database, packId: 'import-pack', destination });

    const text = readFileSync(destination, 'utf8');
    const rawRows = parseCsv(text, { bom: true, columns: false }) as string[][];
    expect(rawRows.slice(1).flat().every((cell) => !/^[=+\-@]/.test(cell))).toBe(true);
    expect(rawRows.slice(1).every((cells) => cells.every((cell) => cell.startsWith("'")))).toBe(true);
    const reimported = previewPackImport({ database, text });
    expect(reimported.issues).toEqual([]);
    expect(reimported.records).toEqual(normalizedBefore);
  });

  it.each([
    ['unknown escape', String.raw`alpha\q`],
    ['dangling escape', 'alpha\\'],
  ])('rejects an ordinary override with an invalid accepted-response %s before export publication', (_name, invalid) => {
    const { directory, database, repository } = openCopy();
    commit(database, repository, packCsv());
    const clue = repository.getClue('import-clue-1')!;
    repository.saveOverride({
      ...clue,
      prompt: { en: clue.prompt.en, et: 'Küsimus' },
      response: { en: clue.response.en, et: 'Vastus' },
      explanation: { en: clue.explanation.en, et: 'Selgitus' },
      acceptedResponses: { en: invalid, et: 'Variant' },
    });
    const destination = join(directory, 'invalid-override.csv');
    const original = Buffer.from('existing export', 'utf8');
    writeFileSync(destination, original);

    expect(() => exportPack({ database, packId: 'import-pack', destination }))
      .toThrow(/accepted.*escape.*import-clue-1/i);
    expect(readFileSync(destination)).toEqual(original);
    expect(readdirSync(directory).filter((name) => name.includes('.tmp'))).toEqual([]);
  });

  it('rejects invalid base accepted responses even when a valid override would hide them', () => {
    const { directory, database, repository } = openCopy();
    commit(database, repository, packCsv());
    database.prepare('UPDATE clues SET accepted_responses_json = ? WHERE id = ?')
      .run(JSON.stringify({ en: String.raw`base\q` }), 'import-clue-1');
    const clue = repository.getClue('import-clue-1')!;
    repository.saveOverride({
      ...clue,
      prompt: { en: clue.prompt.en, et: 'Küsimus' },
      response: { en: clue.response.en, et: 'Vastus' },
      explanation: { en: clue.explanation.en, et: 'Selgitus' },
      acceptedResponses: { en: String.raw`valid\;variant`, et: 'Variant' },
    });
    const destination = join(directory, 'invalid-base.csv');

    expect(() => exportPack({ database, packId: 'import-pack', destination }))
      .toThrow(/accepted.*escape.*import-clue-1/i);
    expect(existsSync(destination)).toBe(false);
  });

  it('round-trips strictly valid escaped semicolons and backslashes from an ordinary override', () => {
    const { directory, database, repository } = openCopy();
    commit(database, repository, packCsv());
    const clue = repository.getClue('import-clue-1')!;
    repository.saveOverride({
      ...clue,
      prompt: { en: clue.prompt.en, et: 'Küsimus' },
      response: { en: clue.response.en, et: 'Vastus' },
      explanation: { en: clue.explanation.en, et: 'Selgitus' },
      acceptedResponses: {
        en: String.raw`alpha\;beta;path\\name`,
        et: String.raw`alfa\;beeta;tee\\nimi`,
      },
    });
    const destination = join(directory, 'valid-override.csv');

    exportPack({ database, packId: 'import-pack', destination });

    expect(previewPackImport({ database, text: readFileSync(destination, 'utf8') }).records)
      .toContainEqual(expect.objectContaining({
        clueId: 'import-clue-1',
        acceptedVariantsEn: ['alpha;beta', String.raw`path\name`],
        acceptedVariantsEt: ['alfa;beeta', String.raw`tee\nimi`],
      }));
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

  it('limits Replace Existing to identities already owned by that same custom pack', () => {
    const { database, repository } = openCopy();
    commit(database, repository, packCsv());
    commit(database, repository, csv([1, 2, 3, 4, 5].map((tier) => row(tier, {
      clue_id: `foreign-clue-${tier}`,
      pack_id: 'foreign-pack',
      pack_name: 'Foreign Pack',
      category_set_id: 'foreign-category',
      category_name_en: 'Foreign Category',
      clue_en: `Foreign prompt ${tier}`,
    }))));
    const before = identityState(database);
    const replacement = previewPackImport({
      database,
      text: csv([1, 2, 3, 4, 5].map((tier) => row(tier, tier === 1
        ? { clue_id: 'foreign-clue-1' }
        : {}))),
    });
    expect(replacement.issues).toEqual([]);

    expect(() => importPack({
      database, repository, preview: replacement, conflict: 'replace-existing',
    })).toThrow(/collision|another pack/i);
    expect(identityState(database)).toEqual(before);
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

  it.each([
    ['incoming pack ID matches an existing clue ID', { pack_id: 'easy-r1-01-t1' }, true],
    ['incoming category ID matches an existing pack ID', { category_set_id: 'dev-library' }, true],
    ['incoming category ID matches an existing category ID', { category_set_id: 'easy-r1-01' }, true],
    ['incoming clue ID matches an existing category ID', { clue_id: 'easy-r1-01' }, false],
    ['incoming clue ID matches an existing clue ID', { clue_id: 'easy-r1-01-t1' }, false],
  ])('rejects fresh-pack identity collisions across every namespace: %s', (_name, overrides, applyToEveryRow) => {
    const { database, repository } = openCopy();
    const before = identityState(database);
    const incoming = [1, 2, 3, 4, 5].map((tier) => row(tier, applyToEveryRow || tier === 1 ? overrides : {}));
    const preview = previewPackImport({ database, text: csv(incoming) });
    expect(preview.issues).toEqual([]);
    expect(preview.conflict).toBe(false);

    expect(() => importPack({ database, repository, preview })).toThrow(/identity|ID.*(exists|belongs|collision)/i);
    expect(identityState(database)).toEqual(before);
  });

  it('rejects fresh-pack Final identity collisions without mutating the existing Final or partial new pack', () => {
    const { database, repository } = openCopy();
    const before = identityState(database);
    const final = row(0, {
      clue_id: 'easy-final-01',
      category_set_id: 'fresh-final-category',
      content_kind: 'final',
      round: 'final',
      tier: '0',
      macro_topic: 'final',
      category_name_en: 'Fresh Final',
      clue_en: 'Incoming Final prompt',
    });
    const preview = previewPackImport({
      database,
      text: csv([...Array.from({ length: 5 }, (_, index) => row(index + 1)), final]),
    });
    expect(preview.issues).toEqual([]);

    expect(() => importPack({ database, repository, preview })).toThrow(/identity|ID.*(exists|belongs|collision)/i);
    expect(identityState(database)).toEqual(before);
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

  it('rejects an oversized selected file by stat size before parsing or writing', () => {
    const { directory } = openCopy();
    const oversized = join(directory, 'oversized.csv');
    writeFileSync(oversized, '');
    truncateSync(oversized, CSV_PACK_LIMITS.maxFileBytes + 1);

    expect(() => readPackCsvFile(oversized)).toThrow(/file.*limit/i);
  });

  it.each([
    ['invalid header byte', 'clue_id', Uint8Array.from([0x63, 0xff])],
    ['overlong cell sequence', 'Prompt 2', Uint8Array.from([0xc0, 0xaf])],
    ['surrogate cell sequence', 'Prompt 2', Uint8Array.from([0xed, 0xa0, 0x80])],
    ['truncated cell sequence', 'Prompt 2', Uint8Array.from([0xe2, 0x82])],
  ])('rejects malformed UTF-8 in %s before creating a preview or writing content', (_name, marker, malformed) => {
    const { directory, database, repository } = openCopy();
    const source = join(directory, 'malformed.csv');
    writeFileSync(source, replaceBytes(packCsv(), marker, malformed));
    const before = identityState(database);
    const workflow = new CsvPackWorkflow(database, repository, { createPreviewId: () => 'malformed-preview' });

    expect(() => workflow.previewFile(source)).toThrow(/UTF-8/i);
    expect(identityState(database)).toEqual(before);
    expect(() => workflow.importPreview({ previewId: 'malformed-preview' })).toThrow(/unknown|expired/i);
  });

  it('accepts a BOM and valid multibyte Estonian UTF-8 through preview and commit', () => {
    const { directory, database, repository } = openCopy();
    const source = join(directory, 'estonian.csv');
    const text = packCsv({
      category_name_et: 'Õigekeelsuse sõnaraamat',
      clue_et: 'Jäääärne küsimus',
      response_et: 'Võõrsõna vastus',
      explanation_et: 'Täielik selgitus',
      translation_status: 'reviewed',
    });
    writeFileSync(source, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')]));
    const workflow = new CsvPackWorkflow(database, repository, { createPreviewId: () => 'estonian-preview' });

    expect(workflow.previewFile(source)).toMatchObject({ previewId: 'estonian-preview', issues: [] });
    workflow.importPreview({ previewId: 'estonian-preview' });
    expect(repository.getClue('import-clue-1')).toMatchObject({
      prompt: { en: expect.any(String), et: 'Jäääärne küsimus' },
    });
  });

  it('rejects a path entry swapped to a symlink between validation and open before reading bytes', () => {
    const { directory } = openCopy();
    const source = join(directory, 'swapped.csv');
    writeFileSync(source, packCsv());
    const regularEntry = {
      dev: 1, ino: 10, size: 100,
      isFile: () => true,
      isSymbolicLink: () => false,
    };
    const openedTarget = { ...regularEntry, ino: 20 };
    const swappedLink = {
      ...regularEntry,
      ino: 30,
      isFile: () => false,
      isSymbolicLink: () => true,
    };
    const read = vi.fn(() => 0);
    const fileSystem = {
      lstat: vi.fn()
        .mockReturnValueOnce(regularEntry)
        .mockReturnValueOnce(swappedLink),
      open: vi.fn(() => 7),
      fstat: vi.fn(() => openedTarget),
      read,
      close: vi.fn(),
    };

    expect(() => readPackCsvFile(source, fileSystem)).toThrow(/changed|symbolic|regular file/i);
    expect(read).not.toHaveBeenCalled();
  });

  it('fails closed before publishing legacy bundled metadata and preserves an existing destination', () => {
    const { directory, database } = openCopy();
    const missingDestination = join(directory, 'legacy-missing.csv');
    const existingDestination = join(directory, 'legacy-existing.csv');
    const original = Buffer.from('existing user file', 'utf8');
    writeFileSync(existingDestination, original);

    expect(() => exportPack({ database, packId: 'dev-library', destination: missingDestination }))
      .toThrow(/metadata|validation/i);
    expect(existsSync(missingDestination)).toBe(false);
    expect(() => exportPack({ database, packId: 'dev-library', destination: existingDestination }))
      .toThrow(/metadata|validation/i);
    expect(readFileSync(existingDestination)).toEqual(original);
    expect(readdirSync(directory).filter((name) => name.includes('.tmp'))).toEqual([]);
  });

  it('merges an ordinary source-title override with authoritative stored CSV metadata before export', () => {
    const { directory, database, repository } = openCopy();
    commit(database, repository, packCsv());
    const clue = repository.getClue('import-clue-1')!;
    repository.saveOverride({
      ...clue,
      prompt: { en: clue.prompt.en, et: 'Küsimus' },
      response: { en: clue.response.en, et: 'Vastus' },
      explanation: { en: clue.explanation.en, et: 'Selgitus' },
      acceptedResponses: { en: clue.acceptedResponses!.en, et: 'Variant' },
      source: 'Editorial source title',
    });
    const destination = join(directory, 'override.csv');

    exportPack({ database, packId: 'import-pack', destination });

    const preview = previewPackImport({ database, text: readFileSync(destination, 'utf8') });
    expect(preview.issues).toEqual([]);
    expect(preview.records.find((record) => record.clueId === 'import-clue-1')).toMatchObject({
      sourceTitle: 'Editorial source title',
      sourceUrl: 'https://example.com/1',
      sourceLicense: 'CC BY 4.0',
      sourceRetrievedAt: '2026-08-11',
      translationStatus: 'untranslated',
    });
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

  it('re-authorizes the current host after import/export dialogs before any selected-path I/O', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, input: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler), removeHandler: vi.fn(),
      on: vi.fn(), removeListener: vi.fn(),
    };
    const contentCsv = {
      previewFile: vi.fn(() => ({
        previewId: 'preview-stale', packId: 'import-pack', packName: 'Imported Pack',
        rowCount: 5, conflict: false, issues: [],
      })),
      importPreview: vi.fn(),
      exportToFile: vi.fn(() => ({ packId: 'import-pack', rowCount: 5, bytes: 100 })),
    };
    let resolveImport!: (path: string | null) => void;
    let resolveExport!: (path: string | null) => void;
    const importDialog = new Promise<string | null>((resolveDialog) => { resolveImport = resolveDialog; });
    const exportDialog = new Promise<string | null>((resolveDialog) => { resolveExport = resolveDialog; });
    let currentHostId = 10;
    let hostDestroyed = false;
    registerIpc({
      ipcMain,
      coordinator: {
        dispatch: vi.fn(), subscribe: vi.fn(() => () => undefined),
        getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
      },
      contentCsv,
      csvDialogs: {
        chooseImportFile: () => importDialog,
        chooseExportFile: () => exportDialog,
      },
      getWindows: () => ({
        hostWindow: { webContents: { id: currentHostId, send: vi.fn(), isDestroyed: () => hostDestroyed } },
        publicWindow: null,
      }),
    });

    const importRequest = handlers.get(IPC_CHANNELS.contentImportPreview)!({ sender: { id: 10 } }, undefined);
    currentHostId = 11;
    resolveImport('C:\\chosen\\stale-import.csv');
    await expect(importRequest).rejects.toThrow('HOST_SENDER_REQUIRED');
    expect(contentCsv.previewFile).not.toHaveBeenCalled();

    currentHostId = 10;
    const exportRequest = handlers.get(IPC_CHANNELS.contentExport)!({ sender: { id: 10 } }, { packId: 'import-pack' });
    hostDestroyed = true;
    resolveExport('C:\\chosen\\stale-export.csv');
    await expect(exportRequest).rejects.toThrow('HOST_SENDER_REQUIRED');
    expect(contentCsv.exportToFile).not.toHaveBeenCalled();
  });
});
