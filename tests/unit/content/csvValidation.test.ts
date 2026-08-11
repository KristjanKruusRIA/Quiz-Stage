import { describe, expect, it } from 'vitest';
import { parsePackCsv, validatePack } from '../../../src/main/content/csvPacks';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';

type Row = Record<(typeof CSV_COLUMNS)[number], string>;

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function csv(rows: readonly Row[], newline = '\r\n'): string {
  return [CSV_COLUMNS, ...rows.map((row) => CSV_COLUMNS.map((column) => row[column]))]
    .map((cells) => cells.map(csvCell).join(','))
    .join(newline);
}

function boardRow(tier: number, overrides: Partial<Row> = {}): Row {
  return {
    clue_id: `clue-${tier}`,
    pack_id: 'custom-pack',
    pack_name: 'Custom Pack',
    category_set_id: 'category-1',
    content_kind: 'board',
    round: 'round-one',
    tier: String(tier),
    difficulty: 'medium',
    macro_topic: 'history',
    category_name_en: 'Quoted History',
    category_name_et: '',
    clue_en: `Prompt ${tier}`,
    clue_et: '',
    response_en: `Response ${tier}`,
    response_et: '',
    accepted_variants_en: '',
    accepted_variants_et: '',
    explanation_en: `Explanation ${tier}`,
    explanation_et: '',
    source_title: 'Example Source',
    source_url: 'https://example.com/source',
    source_license: 'CC0-1.0',
    source_retrieved_at: '2026-08-11',
    translation_status: 'untranslated',
    enabled: 'true',
    ...overrides,
  };
}

function validRows(): Row[] {
  return [1, 2, 3, 4, 5].map((tier) => boardRow(tier));
}

describe('CSV pack parsing and validation', () => {
  it('uses the approved ordered columns exactly', () => {
    expect(CSV_COLUMNS).toEqual([
      'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind',
      'round', 'tier', 'difficulty', 'macro_topic', 'category_name_en',
      'category_name_et', 'clue_en', 'clue_et', 'response_en', 'response_et',
      'accepted_variants_en', 'accepted_variants_et', 'explanation_en',
      'explanation_et', 'source_title', 'source_url', 'source_license',
      'source_retrieved_at', 'translation_status', 'enabled',
    ]);
  });

  it.each(['\r\n', '\n'])('parses RFC 4180 quoting with %j newlines', (newline) => {
    const rows = validRows().map((row) => ({ ...row, category_name_en: 'History, quoted' }));
    rows[0] = boardRow(1, {
      category_name_en: 'History, quoted',
      clue_en: 'First line\nsecond "quoted" line',
      response_en: '=2+2',
    });

    const pack = parsePackCsv(csv(rows, newline));

    expect(pack.rows[0]).toMatchObject({
      rowNumber: 2,
      category_name_en: 'History, quoted',
      clue_en: 'First line\nsecond "quoted" line',
      response_en: '=2+2',
    });
    expect(validatePack(pack)).toEqual([]);
  });

  it('strips one UTF-8 BOM only at the start and rejects an interior BOM', () => {
    expect(parsePackCsv(`\uFEFF${csv(validRows())}`).rows[0].clue_id).toBe('clue-1');
    expect(() => parsePackCsv(csv(validRows()).replace('Prompt 1', 'Prompt\uFEFF 1')))
      .toThrow(/BOM.*start/i);
  });

  it('decodes escaped semicolons and backslashes without losing literal data', () => {
    const rows = validRows();
    rows[0] = boardRow(1, {
      accepted_variants_en: String.raw`alpha\;beta;path\\name;plain`,
    });

    const pack = parsePackCsv(csv(rows));

    expect(validatePack(pack)).toEqual([]);
    expect(pack.rows[0].acceptedVariantsEn).toEqual(['alpha;beta', String.raw`path\name`, 'plain']);
  });

  it('rejects dangling escapes, empty variants, and Estonian-only accepted variants', () => {
    const rows = validRows();
    rows[0] = boardRow(1, { accepted_variants_en: 'dangling\\' });
    rows[1] = boardRow(2, { accepted_variants_en: 'one;;two' });
    rows[2] = boardRow(3, { accepted_variants_et: 'ainult eesti' });

    const issues = validatePack(parsePackCsv(csv(rows)));

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, code: 'invalid-accepted-variants', column: 'accepted_variants_en' }),
      expect.objectContaining({ row: 3, code: 'invalid-accepted-variants', column: 'accepted_variants_en' }),
      expect.objectContaining({ row: 4, code: 'estonian-variants-require-english', column: 'accepted_variants_et' }),
    ]));
  });

  it.each([
    ['missing', CSV_COLUMNS.slice(0, -1).join(',')],
    ['extra', [...CSV_COLUMNS, 'unexpected'].join(',')],
    ['duplicate', CSV_COLUMNS.map((column, index) => index === 1 ? 'clue_id' : column).join(',')],
    ['reordered', [CSV_COLUMNS[1], CSV_COLUMNS[0], ...CSV_COLUMNS.slice(2)].join(',')],
  ])('rejects %s headers', (_name, header) => {
    const lines = csv(validRows()).split('\r\n');
    lines[0] = header;
    expect(() => parsePackCsv(lines.join('\r\n'))).toThrow(/header/i);
  });

  it('reports every invalid type, enum, URL, date, and translation combination by row', () => {
    const rows = validRows();
    rows[0] = boardRow(1, {
      content_kind: 'essay',
      round: 'opening',
      tier: '1.5',
      difficulty: 'expert',
      source_url: 'javascript:alert(1)',
      source_retrieved_at: '2026-02-30',
      translation_status: 'human',
      enabled: 'yes',
    });

    const issues = validatePack(parsePackCsv(csv(rows)));

    expect(issues.filter((issue) => issue.row === 2).map((issue) => issue.column)).toEqual(expect.arrayContaining([
      'content_kind', 'round', 'tier', 'difficulty', 'source_url', 'source_retrieved_at',
      'translation_status', 'enabled',
    ]));
  });

  it('allows English-only custom content while requiring complete translated rows when marked translated', () => {
    expect(validatePack(parsePackCsv(csv(validRows())))).toEqual([]);
    const translated = validRows();
    translated[0] = boardRow(1, {
      category_name_et: 'Ajalugu',
      clue_et: 'Küsimus',
      response_et: 'Vastus',
      explanation_et: '',
      translation_status: 'machine',
    });

    expect(validatePack(parsePackCsv(csv(translated)))).toContainEqual(expect.objectContaining({
      row: 2,
      column: 'explanation_et',
    }));
  });

  it('finds duplicate IDs, normalized clue text, and normalized category names', () => {
    const rows = validRows();
    rows.push(boardRow(5, { clue_id: 'clue-1', clue_en: '  PROMPT\t1  ' }));
    rows.push(...[1, 2, 3, 4, 5].map((tier) => boardRow(tier, {
      clue_id: `other-${tier}`,
      category_set_id: 'category-2',
      category_name_en: '  QUOTED\tHISTORY ',
      clue_en: `Other prompt ${tier}`,
    })));

    const codes = validatePack(parsePackCsv(csv(rows))).map((issue) => issue.code);

    expect(codes).toEqual(expect.arrayContaining([
      'duplicate-clue-id', 'duplicate-clue-text', 'duplicate-category-name',
    ]));
  });

  it('requires complete, internally consistent five-tier board category sets and stable Final shape', () => {
    const incomplete = validRows().slice(0, 4);
    incomplete[1] = boardRow(2, { macro_topic: 'changed' });
    incomplete.push(boardRow(0, {
      clue_id: 'final-1',
      category_set_id: 'final-category-1',
      content_kind: 'final',
      round: 'round-one',
      tier: '1',
      macro_topic: 'final',
      category_name_en: 'Final Category',
      clue_en: 'Final prompt',
    }));

    const codes = validatePack(parsePackCsv(csv(incomplete))).map((issue) => issue.code);

    expect(codes).toEqual(expect.arrayContaining([
      'incomplete-category-set', 'inconsistent-category-set', 'invalid-final-shape',
    ]));
  });
});
