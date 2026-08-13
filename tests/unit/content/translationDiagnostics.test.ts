import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import { parsePackCsv } from '../../../src/main/content/csvPacks';
import { diagnoseTranslations, runTranslationDiagnostics } from '../../../scripts/content/translationDiagnostics';

type CsvRow = Record<(typeof CSV_COLUMNS)[number], string>;

const tempRoots: string[] = [];

function disposeTemporaries(): void {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root !== undefined) rmSync(root, { recursive: true, force: true });
  }
}

afterEach(() => {
  disposeTemporaries();
});

function withTemporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'quiz-stage-translation-diagnostics-'));
  tempRoots.push(root);
  return root;
}

function toCsvValue(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function writeCsv(path: string, rows: readonly CsvRow[]): void {
  const body = [CSV_COLUMNS, ...rows]
    .map((cells, index) => (
      index === 0
        ? CSV_COLUMNS.join(',')
        : CSV_COLUMNS.map((column) => toCsvValue((cells as CsvRow)[column])).join(','))
    )
    .join('\n');
  writeFileSync(path, `${body}\n`, 'utf8');
}

function row(overrides: Partial<CsvRow>): CsvRow {
  const base: CsvRow = {
    clue_id: 'base-row',
    pack_id: 'fixture-translation',
    pack_name: 'Fixture Translation',
    category_set_id: 'base-set',
    content_kind: 'board',
    round: 'round-one',
    tier: '1',
    difficulty: 'easy',
    macro_topic: 'numbers',
    category_name_en: 'Fixture',
    category_name_et: 'Fikseer',
    clue_en: 'The value is 100.',
    clue_et: 'Väärtus on 100.',
    response_en: 'One hundred.',
    response_et: 'Sada.',
    accepted_variants_en: 'Alternative',
    accepted_variants_et: 'Alternatiiv',
    explanation_en: 'Explanation is consistent.',
    explanation_et: 'Selgitus on kooskõlas.',
    source_title: 'Fixture source',
    source_url: 'https://example.com/fixture/source',
    source_license: 'CC0-1.0',
    source_retrieved_at: '2026-08-12',
    translation_status: 'machine',
    enabled: 'true',
  };
  return { ...base, ...overrides };
}

function diagnosticsFor(rows: readonly CsvRow[]) {
  const csv = [CSV_COLUMNS.join(','), ...rows.map((item) => CSV_COLUMNS.map((column) => toCsvValue(item[column])).join(','))]
    .join('\n');
  return diagnoseTranslations([{ file: 'translations.csv', pack: parsePackCsv(csv) }]);
}

describe('translation diagnostics', () => {
  it('detects numeric, canonical-answer, variant, and qualifier drift without file output', () => {
    const report = diagnosticsFor([
      row({
        clue_id: 'numeric-drift',
        clue_en: 'In 1991 Estonia restored its independence from the Soviet Union.',
        clue_et: 'Eesti taastas iseseisvuse Nõukogude Liidust.',
      }),
      row({
        clue_id: 'answer-drift',
        response_en: 'Lake Peipus',
        response_et: 'Võrtsjärv',
      }),
      row({
        clue_id: 'variant-drift',
        accepted_variants_en: 'Lake Peipus;Peipsi järv',
        accepted_variants_et: 'Võrtsjärv;Peipsi järv',
      }),
      row({
        clue_id: 'variant-count-drift',
        accepted_variants_en: 'Q123;P456',
        accepted_variants_et: 'Q123;P456;Q789',
      }),
      row({
        clue_id: 'qualifier-drift',
        clue_en: 'Which country borders Estonia to the south?',
        clue_et: 'Milline riik piirneb Eestiga põhjas?',
      }),
      row({
        clue_id: 'reverse-qualifier-drift',
        clue_en: 'Which country borders Estonia to the north?',
        clue_et: 'Milline riik piirneb Eestiga lõunas?',
      }),
      row({
        clue_id: 'paired-qualifiers',
        clue_en: 'Estonia has north and south borders.',
        clue_et: 'Eestil on põhi ja lõuna piirid.',
      }),
      row({
        clue_id: 'stable-answer',
        response_en: 'Q123',
        response_et: 'Q123',
        accepted_variants_en: 'https://example.com/Q123',
        accepted_variants_et: 'https://example.com/Q123',
      }),
    ]);
    const codesFor = (clueId: string) => report.issues
      .filter((issue) => issue.clueId === clueId)
      .map((issue) => issue.code);

    expect(codesFor('numeric-drift')).toContain('NUMBER_DRIFT');
    expect(codesFor('answer-drift')).toContain('ANSWER_DRIFT');
    expect(codesFor('variant-drift')).toContain('VARIANT_DRIFT');
    expect(codesFor('variant-count-drift')).toContain('VARIANT_DRIFT');
    expect(codesFor('qualifier-drift')).toContain('QUALIFIER_DRIFT');
    expect(codesFor('reverse-qualifier-drift')).toContain('QUALIFIER_DRIFT');
    expect(codesFor('paired-qualifiers')).not.toContain('QUALIFIER_DRIFT');
    expect(codesFor('stable-answer')).not.toEqual(expect.arrayContaining(['ANSWER_DRIFT', 'VARIANT_DRIFT']));
    expect(report.blocking).toBe(true);
  });

  it('flags translation regressions and keeps stable identifiers/url text allowed', async () => {
    const root = withTemporaryRoot();
    const input = join(root, 'translated.csv');
    const report = join(root, 'translated-report.json');
    const rows: CsvRow[] = [
      row({
        clue_id: 'numeric-drift',
        clue_en: 'The first match was in 1969.',
        clue_et: 'Esimene kohtumine oli 1968.',
      }),
      row({
        clue_id: 'proper-noun-missing',
        clue_en: 'NASA led the mission.',
        clue_et: 'Missioon algas edukalt.',
        category_name_en: 'Space Program',
        category_name_et: 'Kosmoseprogramm',
      }),
      row({
        clue_id: 'blank-translation',
        clue_en: 'This clue still needs translation.',
        clue_et: '',
        response_en: 'Still untranslated.',
        response_et: '',
      }),
      row({
        clue_id: 'unchanged-multilanguage',
        clue_en: 'Open stage remains open stage',
        clue_et: 'Open stage remains open stage',
      }),
      row({
        clue_id: 'stable-id',
        category_name_en: 'Q123',
        category_name_et: 'Q123',
        clue_id: 'Q123',
        clue_en: 'US',
        clue_et: 'US',
        response_en: 'US',
        response_et: 'US',
        accepted_variants_en: 'https://example.com/id',
        accepted_variants_et: 'https://example.com/id',
        explanation_en: 'ID stays same.',
        explanation_et: 'ID stays same.',
      }),
    ];
    rows[4] = { ...rows[4], clue_id: 'stable-id', category_set_id: 'stable-set', source_url: 'https://example.com/fixture/stable' };
    writeCsv(input, rows);

    const code = await runTranslationDiagnostics(['--input', input, '--report', report]);
    expect(code).toBe(1);

    const parsed = JSON.parse(readFileSync(report, 'utf8'));
    const reportData = parsed.translation as {
      blocking: boolean;
      checkedRows: number;
      issues: Array<{ clueId: string; code: string; field: string; row: number; file: string }>;
      exceptions: Array<{ status: string; clueId: string; code: string; correctedText: string; reviewerReason: string }>;
    };

    const issuesByClue = (clueId: string) => reportData.issues.filter((issue) => issue.clueId === clueId).map((issue) => issue.code);
    expect(issuesByClue('numeric-drift')).toContain('NUMBER_DRIFT');
    expect(issuesByClue('proper-noun-missing')).toContain('SUSPICIOUS_PROPER_NOUN_CHANGE');
    expect(issuesByClue('blank-translation')).toContain('BLANK_TRANSLATION');
    expect(issuesByClue('unchanged-multilanguage')).toContain('UNCHANGED_TRANSLATION');
    expect(issuesByClue('Q123')).toHaveLength(0);
    expect(reportData.blocking).toBe(true);
    expect(reportData.checkedRows).toBe(5);

    const exceptions = reportData.exceptions.map((item) => item.id);
    expect(exceptions).toEqual(expect.arrayContaining([
      expect.stringMatching(/^NUMBER_DRIFT:numeric-drift:/),
      expect.stringMatching(/^SUSPICIOUS_PROPER_NOUN_CHANGE:proper-noun-missing:/),
      expect.stringMatching(/^BLANK_TRANSLATION:blank-translation:/),
      expect.stringMatching(/^UNCHANGED_TRANSLATION:unchanged-multilanguage:/),
    ]));
    expect(reportData.exceptions.some((item) => item.status === 'pending')).toBe(true);
  });

  it('records exception review fields for manual correction', async () => {
    const root = withTemporaryRoot();
    const input = join(root, 'translation-for-exception.csv');
    const report = join(root, 'translation-for-exception-report.json');
    const records: CsvRow[] = [
      row({
        clue_id: 'exception-case',
        clue_en: 'Open stage remains open stage',
        clue_et: 'Open stage remains open stage',
      }),
    ];
    writeCsv(input, records);

    await runTranslationDiagnostics(['--input', input, '--report', report]);
    const parsed = JSON.parse(readFileSync(report, 'utf8'));
    const exception = (parsed.translation.exceptions ?? []).find((item: { code: string }) => item.code === 'UNCHANGED_TRANSLATION') as
      { id: string; clueId: string; code: string; status: string; reviewerReason: string; correctedText: string } | undefined;

    expect(exception).toMatchObject({
      clueId: 'exception-case',
      code: 'UNCHANGED_TRANSLATION',
      status: 'pending',
      reviewerReason: 'pending-review',
      correctedText: '',
    });
  });
});
