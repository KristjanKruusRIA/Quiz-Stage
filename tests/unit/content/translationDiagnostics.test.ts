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
  it('skips absent variants while keeping missing Estonian variants blocking', () => {
    const report = diagnosticsFor([
      row({
        clue_id: 'no-variants',
        accepted_variants_en: '',
        accepted_variants_et: '',
      }),
      row({
        clue_id: 'missing-estonian-variant',
        accepted_variants_en: 'Alternative',
        accepted_variants_et: '',
      }),
    ]);
    const issuesFor = (clueId: string) => report.issues.filter((issue) => issue.clueId === clueId);

    expect(issuesFor('no-variants')).toEqual([]);
    expect(report.exceptions.filter((item) => item.clueId === 'no-variants')).toEqual([]);
    expect(issuesFor('missing-estonian-variant')).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'BLANK_TRANSLATION', field: 'accepted_variants_en', severity: 'error' }),
      expect.objectContaining({ code: 'VARIANT_DRIFT', field: 'accepted_variants_en', severity: 'error' }),
    ]));
    expect(report.blocking).toBe(true);
  });

  it('detects numeric, canonical-answer, variant, and qualifier drift without file output', () => {
    const report = diagnosticsFor([
      row({
        clue_id: 'numeric-drift',
        clue_en: 'In 1991 Estonia restored its independence from the Soviet Union.',
        clue_et: 'Eesti taastas iseseisvuse Nõukogude Liidust.',
      }),
      row({
        clue_id: 'natural-language-answer',
        response_en: 'Lake Peipus',
        response_et: 'Võrtsjärv',
      }),
      row({
        clue_id: 'numeric-answer-drift',
        response_en: '100',
        response_et: '101',
      }),
      row({
        clue_id: 'equal-number-prose-answer',
        response_en: 'The 1991 revolution',
        response_et: '1991. aasta revolutsioon',
      }),
      row({
        clue_id: 'identifier-answer-drift',
        response_en: 'Q123',
        response_et: 'Q456',
      }),
      row({
        clue_id: 'translated-variants',
        accepted_variants_en: 'False;November 11;Eighty Years War;Dutch Revolt',
        accepted_variants_et: 'Vale;11. november;Kaheksakümneaastane sõda;Madalmaade ülestõus',
      }),
      row({
        clue_id: 'localized-acronym-variants',
        accepted_variants_en: 'US Seventh Army;China;PRC;the Second World War;WWII',
        accepted_variants_et: 'USA seitsmes armee;Hiina;HRV;Teine maailmasõda;II maailmasõda',
      }),
      row({
        clue_id: 'numeric-variant-drift',
        accepted_variants_en: '8 m;Q123',
        accepted_variants_et: '8 l;Q123',
      }),
      row({
        clue_id: 'variant-count-drift',
        accepted_variants_en: 'Q123;P456',
        accepted_variants_et: 'Q123;P456;Q789',
      }),
      row({
        clue_id: 'identifier-variant-drift',
        accepted_variants_en: 'Q123',
        accepted_variants_et: 'Q456',
      }),
      row({
        clue_id: 'identifier-variant-loss',
        accepted_variants_en: 'Q123',
        accepted_variants_et: 'tundmatu',
      }),
      row({
        clue_id: 'identifier-variant-addition',
        accepted_variants_en: 'unknown',
        accepted_variants_et: 'Q123',
      }),
      row({
        clue_id: 'url-variant-drift',
        accepted_variants_en: 'https://example.com/a',
        accepted_variants_et: 'https://example.com/b',
      }),
      row({
        clue_id: 'url-case-variant-drift',
        accepted_variants_en: 'https://example.com/Archive?item=Alpha',
        accepted_variants_et: 'https://example.com/archive?item=alpha',
      }),
      row({
        clue_id: 'url-case-answer-drift',
        response_en: 'https://example.com/Archive?item=Alpha',
        response_et: 'https://example.com/Archive?item=alpha',
      }),
      row({
        clue_id: 'entity-id-case-equivalent',
        accepted_variants_en: 'Q123',
        accepted_variants_et: 'q123',
      }),
      row({
        clue_id: 'url-variant-loss',
        accepted_variants_en: 'https://example.com/a',
        accepted_variants_et: 'näide',
      }),
      row({
        clue_id: 'url-variant-addition',
        accepted_variants_en: 'example',
        accepted_variants_et: 'https://example.com/a',
      }),
      row({
        clue_id: 'unsupported-acronym-substitution',
        accepted_variants_en: 'NATO',
        accepted_variants_et: 'UN',
      }),
      row({
        clue_id: 'acronym-loss',
        accepted_variants_en: 'NATO',
        accepted_variants_et: 'liit',
      }),
      row({
        clue_id: 'literal-acronym',
        accepted_variants_en: 'NATO',
        accepted_variants_et: 'NATO',
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
    expect(codesFor('natural-language-answer')).not.toContain('ANSWER_DRIFT');
    expect(codesFor('numeric-answer-drift')).toContain('ANSWER_DRIFT');
    expect(codesFor('equal-number-prose-answer')).not.toContain('ANSWER_DRIFT');
    expect(codesFor('identifier-answer-drift')).toContain('ANSWER_DRIFT');
    expect(codesFor('translated-variants')).not.toContain('VARIANT_DRIFT');
    expect(codesFor('localized-acronym-variants')).not.toContain('VARIANT_DRIFT');
    expect(codesFor('numeric-variant-drift')).toContain('VARIANT_DRIFT');
    expect(codesFor('variant-count-drift')).toContain('VARIANT_DRIFT');
    expect(codesFor('identifier-variant-drift')).toContain('VARIANT_DRIFT');
    expect(codesFor('unsupported-acronym-substitution')).toContain('SUSPICIOUS_PROPER_NOUN_CHANGE');
    expect(codesFor('acronym-loss')).toContain('SUSPICIOUS_PROPER_NOUN_CHANGE');
    expect(codesFor('literal-acronym')).not.toContain('SUSPICIOUS_PROPER_NOUN_CHANGE');
    expect(codesFor('identifier-variant-loss')).toContain('VARIANT_DRIFT');
    expect(codesFor('identifier-variant-addition')).toContain('VARIANT_DRIFT');
    expect(codesFor('url-variant-drift')).toContain('VARIANT_DRIFT');
    expect(codesFor('url-case-answer-drift')).toContain('ANSWER_DRIFT');
    expect(codesFor('url-case-variant-drift')).toContain('VARIANT_DRIFT');
    expect(codesFor('entity-id-case-equivalent')).not.toContain('VARIANT_DRIFT');
    expect(codesFor('url-variant-loss')).toContain('VARIANT_DRIFT');
    expect(codesFor('url-variant-addition')).toContain('VARIANT_DRIFT');
    expect(codesFor('qualifier-drift')).toContain('QUALIFIER_DRIFT');
    expect(codesFor('reverse-qualifier-drift')).toContain('QUALIFIER_DRIFT');
    expect(codesFor('paired-qualifiers')).not.toContain('QUALIFIER_DRIFT');
    expect(codesFor('stable-answer')).not.toEqual(expect.arrayContaining(['ANSWER_DRIFT', 'VARIANT_DRIFT']));
    expect(report.blocking).toBe(true);
  });

  it('does not parse the initial of a following word as a numeric unit', () => {
    const report = diagnosticsFor([
      row({
        clue_id: 'may-date',
        clue_en: 'The war ended on 8 May.',
        clue_et: 'Sõda lõppes 8. mail.',
      }),
      row({
        clue_id: 'lunar-module',
        clue_en: 'Apollo 11 lunar module landed.',
        clue_et: 'Apollo 11 kuumoodul maandus.',
      }),
      row({
        clue_id: 'march-date',
        clue_en: 'The attack came on 20 March.',
        clue_et: 'Rünnak toimus 20. märtsil.',
      }),
      row({
        clue_id: 'real-unit-drift',
        clue_en: 'The length is 8 m.',
        clue_et: 'Pikkus on 8 l.',
      }),
      row({
        clue_id: 'real-number-drift',
        clue_en: 'The mission carried 11 people.',
        clue_et: 'Missioonil oli 12 inimest.',
      }),
      row({
        clue_id: 'dotted-abbreviation',
        accepted_variants_en: 'AD 79;79 AD',
        accepted_variants_et: '79 pKr;79 m.a.j.',
      }),
      row({
        clue_id: 'alternate-dotted-abbreviation',
        accepted_variants_en: 'BC 44;44 BC',
        accepted_variants_et: '44 eKr;44 e.m.a.',
      }),
      row({
        clue_id: 'localized-decimal-and-thousands',
        clue_en: 'The total was 1,234.5.',
        clue_et: 'Kogusumma oli 1 234,5.',
      }),
      row({
        clue_id: 'reordered-date',
        clue_en: 'The armistice took effect on November 11, 1918.',
        clue_et: 'Vaherahu jõustus 11. novembril 1918.',
      }),
    ]);
    const codesFor = (clueId: string) => report.issues
      .filter((issue) => issue.clueId === clueId)
      .map((issue) => issue.code);

    expect(codesFor('may-date')).not.toContain('NUMBER_DRIFT');
    expect(codesFor('lunar-module')).not.toContain('NUMBER_DRIFT');
    expect(codesFor('march-date')).not.toContain('NUMBER_DRIFT');
    expect(codesFor('real-unit-drift')).toContain('NUMBER_DRIFT');
    expect(codesFor('real-number-drift')).toContain('NUMBER_DRIFT');
    expect(codesFor('dotted-abbreviation')).not.toContain('VARIANT_DRIFT');
    expect(codesFor('alternate-dotted-abbreviation')).not.toContain('VARIANT_DRIFT');
    expect(codesFor('localized-decimal-and-thousands')).not.toContain('NUMBER_DRIFT');
    expect(codesFor('reordered-date')).not.toContain('NUMBER_DRIFT');
  });

  it('normalizes bounded bilingual number words while preserving true numeric drift', () => {
    const report = diagnosticsFor([
      row({
        clue_id: 'word-centuries',
        clue_en: 'It lasted from the eighth to the fifteenth century.',
        clue_et: 'See kestis 8.–15. sajandini.',
      }),
      row({ clue_id: 'word-count', clue_en: 'The poem has nineteen lines.', clue_et: 'Luuletusel on 19 rida.' }),
      row({ clue_id: 'numbered-title', response_en: 'The Thirty-Nine Steps', response_et: '39 astet' }),
      row({ clue_id: 'formula-one', clue_en: 'Who won seven Formula One titles?', clue_et: 'Kes võitis seitse vormel 1 tiitlit?' }),
      row({ clue_id: 'roman-type', clue_en: 'Examples include type 1 diabetes.', clue_et: 'Näidete hulka kuulub I tüüpi diabeet.' }),
      row({ clue_id: 'top-ten', clue_en: 'It became a Top 10 hit.', clue_et: 'Sellest sai esikümnehitt.' }),
      row({ clue_id: 'exodus-name', clue_en: 'The story appears in Exodus.', clue_et: 'Lugu esineb 2. Moosese raamatus.' }),
      row({ clue_id: 'word-unit', clue_en: 'The route covers more than 100 km.', clue_et: 'Marsruut katab üle saja kilomeetri.' }),
      row({ clue_id: 'word-unit-reverse', clue_en: 'The route is one hundred kilometres long.', clue_et: 'Marsruut on 100 km pikk.' }),
      row({ clue_id: 'word-metre-unit', clue_en: 'The route is one hundred metres long.', clue_et: 'Marsruut on 100 m pikk.' }),
      row({ clue_id: 'word-metre-unit-reverse', clue_en: 'The route is 100 m long.', clue_et: 'Marsruut on sada meetrit pikk.' }),
      row({ clue_id: 'digit-percent-word-unit', clue_en: 'The result was 100 percent.', clue_et: 'Tulemus oli 100%.' }),
      row({ clue_id: 'digit-kilometre-word-unit', clue_en: 'The route is 100 kilometres long.', clue_et: 'Marsruut on 100 km pikk.' }),
      row({ clue_id: 'unit-across-sentence', clue_en: 'The answer was one. Metres are the unit.', clue_et: 'Vastus oli 1. Ühik on meeter.' }),
      row({ clue_id: 'hyphenated-word-unit', clue_en: 'He won the 400-metre race.', clue_et: 'Ta võitis 400 meetri jooksu.' }),
      row({ clue_id: 'musical-metre', clue_en: 'The dance is in lively 2/4 metre.', clue_et: 'Tants on elavas 2/4-taktis.' }),
      row({ clue_id: 'coordinated-percent', clue_en: 'The result was 52 to 48 percent.', clue_et: 'Tulemus oli 52 protsendiga 48 vastu.' }),
      row({ clue_id: 'coordinated-decimal-percent', clue_en: 'The result was 50.58 percent to 49.42 percent.', clue_et: 'Tulemus oli 50,58 protsenti 49,42 vastu.' }),
      row({ clue_id: 'percentage-point', clue_en: 'The margin was one percentage point.', clue_et: 'Vahe oli ühe protsendipunktine.' }),
      row({ clue_id: 'hyphenated-percentage-point-word', clue_en: 'It was a one-percentage-point lead.', clue_et: 'See oli ühe protsendipunktine edu.' }),
      row({ clue_id: 'hyphenated-percentage-point-digit', clue_en: 'It was a 1-percentage-point lead.', clue_et: 'See oli 1 protsendipunktine edu.' }),
      row({ clue_id: 'grammatical-not-gram-unit', response_en: 'fourteen grammatical cases', response_et: 'neliteist käänet' }),
      row({ clue_id: 'short-year-rollover', clue_en: 'The 1999–00 season.', clue_et: '1999.–2000. aasta hooaeg.' }),
      row({ clue_id: 'wrong-word-count', clue_en: 'The poem has nineteen lines.', clue_et: 'Luuletusel on 18 rida.' }),
      row({ clue_id: 'wrong-word-century', clue_en: 'It is a fifth-century work.', clue_et: 'See on 6. sajandi teos.' }),
      row({ clue_id: 'omitted-year', clue_en: 'The mission launched in 1969.', clue_et: 'Missioon käivitati.' }),
      row({ clue_id: 'repeated-score-loss', clue_en: 'The score was 2-2.', clue_et: 'Seis oli 2.' }),
      row({ clue_id: 'unrelated-one-prefix', clue_en: 'This is version 1.', clue_et: 'See on ühendus.' }),
      row({ clue_id: 'unrelated-five-prefix', clue_en: 'The value is 5.', clue_et: 'See on viisakus.' }),
      row({ clue_id: 'unrelated-six-prefix', clue_en: 'The value is 6.', clue_et: 'See on kuusk.' }),
      row({ clue_id: 'wrong-short-year-rollover', clue_en: 'The 1999–00 season.', clue_et: '1999.–1900. aasta hooaeg.' }),
      row({ clue_id: 'ordinary-numbers-word', clue_en: 'This device numbers pages.', clue_et: 'See viitab 4. Moosese raamatule.' }),
      row({ clue_id: 'unsupported-million', clue_en: 'One million people attended.', clue_et: 'Kohal oli 1 inimene.' }),
      row({ clue_id: 'unsupported-hundred-thousand', clue_en: 'One hundred thousand people attended.', clue_et: 'Kohal oli 100 inimest.' }),
      row({ clue_id: 'unsupported-et-magnitude', clue_en: '100 people attended.', clue_et: 'Kohal oli sada tuhat inimest.' }),
      row({ clue_id: 'ascii-year-month', clue_en: 'Version 2026-02 was released.', clue_et: 'Versioon 2026-2102 ilmus.' }),
      row({ clue_id: 'wrong-word-unit', clue_en: 'The distance is 8 m.', clue_et: 'Kogus on kaheksa liitrit.' }),
      row({ clue_id: 'wrong-word-unit-reverse', clue_en: 'The distance is 8 km.', clue_et: 'Vahemaa on kaheksa meetrit.' }),
      row({ clue_id: 'swapped-word-units', clue_en: 'The samples were 100 m and 5 g.', clue_et: 'Proovid olid sada grammi ja viis meetrit.' }),
      row({ clue_id: 'swapped-word-units-reverse', clue_en: 'The totals were 100 km and 5 l.', clue_et: 'Kogused olid sada liitrit ja viis kilomeetrit.' }),
      row({ clue_id: 'wrong-coordinated-percent', clue_en: 'The result was 52 to 48 percent.', clue_et: 'Tulemus oli 52 protsendiga 47 vastu.' }),
      row({ clue_id: 'wrong-percentage-point-unit', clue_en: 'The margin was one percentage point.', clue_et: 'Vahe oli üks protsent.' }),
      row({ clue_id: 'wrong-percent-unit', clue_en: 'The margin was one percent.', clue_et: 'Vahe oli üks protsendipunkt.' }),
    ]);
    const codesFor = (clueId: string) => report.issues
      .filter((issue) => issue.clueId === clueId)
      .map((issue) => issue.code);

    for (const clueId of [
      'word-centuries', 'word-count', 'numbered-title', 'formula-one', 'roman-type',
      'top-ten', 'exodus-name', 'word-unit', 'word-unit-reverse', 'word-metre-unit',
      'word-metre-unit-reverse', 'short-year-rollover',
      'digit-percent-word-unit', 'digit-kilometre-word-unit',
      'unit-across-sentence',
      'hyphenated-word-unit', 'musical-metre', 'coordinated-percent', 'coordinated-decimal-percent',
      'percentage-point', 'hyphenated-percentage-point-word', 'hyphenated-percentage-point-digit',
      'grammatical-not-gram-unit',
    ]) {
      expect(codesFor(clueId)).not.toEqual(expect.arrayContaining(['NUMBER_DRIFT', 'ANSWER_DRIFT']));
    }
    for (const clueId of [
      'wrong-word-count', 'wrong-word-century', 'omitted-year', 'repeated-score-loss',
      'unrelated-one-prefix', 'unrelated-five-prefix', 'unrelated-six-prefix',
      'wrong-short-year-rollover', 'ordinary-numbers-word', 'unsupported-million',
      'unsupported-hundred-thousand', 'unsupported-et-magnitude', 'ascii-year-month',
      'wrong-word-unit', 'wrong-word-unit-reverse',
      'swapped-word-units', 'swapped-word-units-reverse',
      'wrong-coordinated-percent', 'wrong-percentage-point-unit', 'wrong-percent-unit',
    ]) {
      expect(codesFor(clueId)).toContain('NUMBER_DRIFT');
    }
  });

  it('recognizes localized Genesis numbering and hyphenated alternatives without hiding signed-number drift', () => {
    const report = diagnosticsFor([
      row({
        clue_id: 'localized-genesis-name',
        explanation_en: 'The figures are drawn from Genesis and classical prophecy.',
        explanation_et: 'Figuurid pärinevad 1. Moosese raamatust ja antiiksetest ettekuulutustest.',
      }),
      row({
        clue_id: 'hyphenated-year-alternatives',
        explanation_en: 'The proposed 1503-or-1504 start is narrower than the 1503–1506 span.',
        explanation_et: 'Pakutud algusaeg 1503 või 1504 on kitsam kui vahemik 1503–1506.',
      }),
      row({
        clue_id: 'signed-number-drift',
        explanation_en: 'The offset is -1504.',
        explanation_et: 'Nihe on 1504.',
      }),
    ]);
    const codesFor = (clueId: string) => report.issues
      .filter((issue) => issue.clueId === clueId)
      .map((issue) => issue.code);

    expect(codesFor('localized-genesis-name')).not.toContain('NUMBER_DRIFT');
    expect(codesFor('hyphenated-year-alternatives')).not.toContain('NUMBER_DRIFT');
    expect(codesFor('signed-number-drift')).toContain('NUMBER_DRIFT');
  });

  it('checks every fixed qualifier pair in every required field without flagging correct translations', () => {
    const pairs = [
      ['north', 'põhi', 'south', 'lõuna'],
      ['east', 'ida', 'west', 'lääs'],
      ['before', 'enne', 'after', 'pärast'],
      ['first', 'esimene', 'last', 'viimane'],
      ['more', 'rohkem', 'less', 'vähem'],
      ['largest', 'suurim', 'smallest', 'väikseim'],
    ] as const;
    const fields = [
      ['clue_en', 'clue_et'],
      ['response_en', 'response_et'],
      ['accepted_variants_en', 'accepted_variants_et'],
      ['explanation_en', 'explanation_et'],
    ] as const;
    const rows: CsvRow[] = [];
    for (const [index, [english, estonian, , oppositeEstonian]] of pairs.entries()) {
      for (const [fieldIndex, [enField, etField]] of fields.entries()) {
        rows.push(row({
          clue_id: `mismatch-${index}-${fieldIndex}`,
          [enField]: enField === 'accepted_variants_en' ? `same\\;value;${english}` : english,
          [etField]: etField === 'accepted_variants_et' ? `sama\\;väärtus;${oppositeEstonian}` : oppositeEstonian,
        }));
        rows.push(row({
          clue_id: `match-${index}-${fieldIndex}`,
          [enField]: enField === 'accepted_variants_en' ? `same\\;value;${english}` : english,
          [etField]: etField === 'accepted_variants_et' ? `sama\\;väärtus;${estonian}` : estonian,
          clue_en: fieldIndex === 0 ? english : 'Neutral clue',
          clue_et: fieldIndex === 0 ? estonian : 'Neutraalne vihje',
          response_en: fieldIndex === 1 ? english : 'Neutral answer',
          response_et: fieldIndex === 1 ? estonian : 'Neutraalne vastus',
          explanation_en: fieldIndex === 3 ? english : 'Neutral explanation',
          explanation_et: fieldIndex === 3 ? estonian : 'Neutraalne selgitus',
        }));
      }
    }
    const report = diagnosticsFor(rows);
    const codesFor = (clueId: string) => report.issues
      .filter((issue) => issue.clueId === clueId)
      .map((issue) => issue.code);

    for (const [index] of pairs.entries()) {
      for (const [fieldIndex] of fields.entries()) {
        expect(codesFor(`mismatch-${index}-${fieldIndex}`)).toContain('QUALIFIER_DRIFT');
        expect(codesFor(`match-${index}-${fieldIndex}`)).not.toContain('QUALIFIER_DRIFT');
      }
    }

    const directionalForms = [
      ['north', 'põhjas', 'south', 'lõunas'],
      ['east', 'idas', 'west', 'läänes'],
    ] as const;
    const formRows: CsvRow[] = [];
    for (const [index, [english, estonian, oppositeEnglish, oppositeEstonian]] of directionalForms.entries()) {
      for (const [fieldIndex, [enField, etField]] of fields.entries()) {
        formRows.push(
          row({ clue_id: `form-forward-${index}-${fieldIndex}`, [enField]: english, [etField]: oppositeEstonian }),
          row({ clue_id: `form-reverse-${index}-${fieldIndex}`, [enField]: oppositeEnglish, [etField]: estonian }),
          row({ clue_id: `form-match-${index}-${fieldIndex}`, [enField]: english, [etField]: estonian }),
        );
      }
    }
    const formReport = diagnosticsFor(formRows);
    const formCodesFor = (clueId: string) => formReport.issues
      .filter((issue) => issue.clueId === clueId)
      .map((issue) => issue.code);
    for (const [index] of directionalForms.entries()) {
      for (const [fieldIndex] of fields.entries()) {
        expect(formCodesFor(`form-forward-${index}-${fieldIndex}`)).toContain('QUALIFIER_DRIFT');
        expect(formCodesFor(`form-reverse-${index}-${fieldIndex}`)).toContain('QUALIFIER_DRIFT');
        expect(formCodesFor(`form-match-${index}-${fieldIndex}`)).not.toContain('QUALIFIER_DRIFT');
      }
    }
    expect(diagnosticsFor([row({ clue_id: 'unsupported-form', clue_en: 'north', clue_et: 'põhjast' })]).issues)
      .not.toContainEqual(expect.objectContaining({ code: 'QUALIFIER_DRIFT' }));
  });

  it('sorts otherwise identical public issues by clue ID independently of input order', () => {
    const packFor = (clueId: string) => parsePackCsv([
      CSV_COLUMNS.join(','),
      CSV_COLUMNS.map((column) => toCsvValue(row({
        clue_id: clueId,
        response_en: 'Q123',
        response_et: 'Q456',
      })[column])).join(','),
    ].join('\n'));
    const first = { file: 'same.csv', pack: packFor('ä') };
    const second = { file: 'same.csv', pack: packFor('a\u0308') };
    const inForwardOrder = diagnoseTranslations([first, second]).issues;

    expect(inForwardOrder).toEqual(diagnoseTranslations([second, first]).issues);
    expect(inForwardOrder.filter((issue) => issue.code === 'ANSWER_DRIFT').map((issue) => issue.clueId))
      .toEqual(['a\u0308', 'ä']);
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
      exceptions: Array<{ id: string; status: string; clueId: string; code: string; correctedText: string; reviewerReason: string }>;
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
