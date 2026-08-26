import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import { parsePackCsv } from '../../../src/main/content/csvPacks';
import {
  NON_WAIVABLE_CODES,
  publishValidationReport,
  validateProductionContent,
  type ProductionValidationInput,
} from '../../../scripts/content/validate';
import { serializeEvidence, type ContentEvidence } from '../../../scripts/content/evidence';
import {
  FINAL_BATCH,
  PRODUCTION_BATCHES,
  getProductionBatch,
  type ProductionBatchDefinition,
} from '../../../scripts/content/productionBatches';
import { resolveCsvInputFiles } from '../../../scripts/content/readCsv';
import {
  buildWikidataBatchUrls,
  checkSourceUrls,
  createMemorySourceCache,
  type SourceCheckDependencies,
} from '../../../scripts/content/sourceCheck';

type Row = Record<(typeof CSV_COLUMNS)[number], string>;

const temporaryDirectories: string[] = [];

afterEach(async () => {
  const { rmSync } = await import('node:fs');
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-production-validator-'));
  temporaryDirectories.push(directory);
  return directory;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function csv(rows: readonly Row[]): string {
  return [CSV_COLUMNS, ...rows.map((row) => CSV_COLUMNS.map((column) => row[column]))]
    .map((cells) => cells.map(csvCell).join(','))
    .join('\n');
}

function alphabeticId(value: number): string {
  let remaining = value + 1;
  let result = '';
  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(97 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }
  return result;
}

function boardRow(setIndex: number, tier: number, overrides: Partial<Row> = {}): Row {
  const difficulty = (['easy', 'medium', 'hard'] as const)[setIndex % 3];
  const round = setIndex % 2 === 0 ? 'round-one' : 'round-two';
  return {
    clue_id: `clue-${setIndex}-${tier}`,
    pack_id: 'pack-production',
    pack_name: 'Production Pack',
    category_set_id: `set-${setIndex}`,
    content_kind: 'board',
    round,
    tier: String(tier),
    difficulty,
    macro_topic: `topic-${setIndex % 12}`,
    category_name_en: `Category ${setIndex}`,
    category_name_et: `Kategooria ${setIndex}`,
    clue_en: `Unique clue ${alphabeticId(setIndex * 5 + tier)}`,
    clue_et: `Ainulaadne vihje ${alphabeticId(setIndex * 5 + tier)}`,
    response_en: `Response ${setIndex}-${tier}`,
    response_et: `Vastus ${setIndex}-${tier}`,
    accepted_variants_en: '',
    accepted_variants_et: '',
    explanation_en: `Explanation ${setIndex}-${tier}`,
    explanation_et: `Selgitus ${setIndex}-${tier}`,
    source_title: 'Example Source',
    source_url: `https://example.com/source/${setIndex}/${tier}`,
    source_license: 'CC0-1.0',
    source_retrieved_at: '2026-08-12',
    translation_status: 'reviewed',
    enabled: 'true',
    ...overrides,
  };
}

function finalRow(index: number): Row {
  return boardRow(20_000 + index, 0, {
    clue_id: `final-${index}`,
    category_set_id: `final-set-${index}`,
    content_kind: 'final',
    round: 'final',
    tier: '0',
    difficulty: (['easy', 'medium', 'hard'] as const)[index % 3],
    macro_topic: `final-topic-${index % 12}`,
    category_name_en: `Final Category ${index}`,
    category_name_et: `Finaalkategooria ${index}`,
  });
}

const approvedReview = {
  reviewer: 'Independent Reviewer',
  reviewedAt: '2026-08-12T11:00:00Z',
  decision: 'approved' as const,
};

type EvidenceRow = Pick<Row,
  'clue_id' | 'response_en' | 'explanation_en' | 'source_title' | 'source_url'
  | 'source_license' | 'source_retrieved_at'>;

function evidenceFor(
  row: EvidenceRow,
  batchId: string,
  overrides: Partial<ContentEvidence> = {},
): ContentEvidence {
  const origin = overrides.origin ?? 'compatibleOpen';
  return {
    version: 1,
    clueId: row.clue_id,
    batchId,
    factKey: `fact:${row.clue_id}`,
    assertion: `${row.response_en.trim()} — ${row.explanation_en.trim()}`,
    origin,
    authoring: { author: 'Content Author', authoredAt: '2026-08-12T10:00:00Z' },
    supportingSource: {
      sourceId: `source:${row.clue_id}`,
      title: row.source_title,
      url: row.source_url,
      license: row.source_license,
      retrievedAt: row.source_retrieved_at,
    },
    inspiration: origin === 'openTdbInspired' ? {
      system: 'OpenTDB', candidateId: `candidate:${row.clue_id}`, license: 'CC-BY-SA-4.0',
    } : null,
    factualReview: approvedReview,
    editorialReview: approvedReview,
    translationReview: approvedReview,
    ...overrides,
  };
}

function evidenceMap(records: readonly ContentEvidence[]): ReadonlyMap<string, ContentEvidence> {
  return new Map(records.map((record) => [record.clueId, record]));
}

function boardBatchRows(batch: ProductionBatchDefinition, batchIndex = 0): Row[] {
  const rows: Row[] = [];
  let localSetIndex = 0;
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    for (const round of ['round-one', 'round-two'] as const) {
      const count = batch.distribution![difficulty][round === 'round-one' ? 'roundOne' : 'roundTwo'];
      for (let offset = 0; offset < count; offset += 1) {
        const globalSetIndex = batchIndex * 100 + localSetIndex;
        const categoryId = `${batch.id}-set-${localSetIndex}`;
        const subtheme = batch.subthemes[localSetIndex % batch.subthemes.length];
        for (let tier = 1; tier <= 5; tier += 1) {
          rows.push(boardRow(globalSetIndex, tier, {
            pack_id: batch.packId,
            pack_name: batch.topicFamily,
            category_set_id: categoryId,
            round,
            difficulty,
            macro_topic: subtheme,
            category_name_en: `${batch.topicFamily} category ${localSetIndex}`,
            category_name_et: `${batch.topicFamily} kategooria ${localSetIndex}`,
          }));
        }
        localSetIndex += 1;
      }
    }
  }
  return rows;
}

function finalBatchRows(): Row[] {
  return Array.from({ length: 150 }, (_, index) => finalRow(index)).map((row, index) => ({
    ...row,
    pack_id: FINAL_BATCH.packId,
    pack_name: FINAL_BATCH.topicFamily,
    macro_topic: FINAL_BATCH.subthemes[index % FINAL_BATCH.subthemes.length],
    difficulty: (['easy', 'medium', 'hard'] as const)[index % 3],
  }));
}

function releaseCorpus(): {
  batches: Array<{ file: string; rows: Row[] }>;
  evidence: ReadonlyMap<string, ContentEvidence>;
} {
  const batches: Array<{ file: string; rows: Row[] }> = [];
  const records: ContentEvidence[] = [];
  for (const [batchIndex, batch] of PRODUCTION_BATCHES.entries()) {
    const batchRows = boardBatchRows(batch, batchIndex);
    batches.push({ file: `${batch.id}.csv`, rows: batchRows });
    records.push(...batchRows.map((row, index) => evidenceFor(row, batch.id, {
      origin: index < batch.requiredOpenTdbClues ? 'openTdbInspired' : 'compatibleOpen',
    })));
  }
  const finals = finalBatchRows();
  batches.push({ file: `${FINAL_BATCH.id}.csv`, rows: finals });
  records.push(...finals.map((row) => evidenceFor(row, FINAL_BATCH.id)));
  return { batches, evidence: evidenceMap(records) };
}

function releaseInputs(corpus: ReturnType<typeof releaseCorpus>): ProductionValidationInput[] {
  return corpus.batches.map(({ file, rows }) => input(file, rows));
}

function qualityFixture(name: string): { input: ProductionValidationInput; rows: readonly EvidenceRow[] } {
  const file = resolve('tests/fixtures/content-quality', name);
  const pack = parsePackCsv(readFileSync(file, 'utf8'));
  return { input: { file, pack }, rows: pack.rows };
}

function input(file: string, rows: readonly Row[]): ProductionValidationInput {
  return { file, pack: parsePackCsv(csv(rows)) };
}

function twelveValidSets(): Row[] {
  return Array.from({ length: 12 }, (_, setIndex) =>
    Array.from({ length: 5 }, (_, tierIndex) => boardRow(setIndex, tierIndex + 1))).flat();
}

describe('production content validation', () => {
  it.each([
    ['missing-tier.csv', 'MISSING_TIER'],
    ['duplicate-id.csv', 'DUPLICATE_ID'],
    ['duplicate-text.csv', 'DUPLICATE_CLUE_TEXT'],
    ['duplicate-category.csv', 'DUPLICATE_CATEGORY_NAME'],
    ['invalid-round.csv', 'INVALID_ROUND'],
    ['missing-source.csv', 'MISSING_SOURCE'],
    ['undated-changing-fact.csv', 'UNDATED_CHANGING_FACT'],
    ['missing-translation.csv', 'MISSING_TRANSLATION'],
    ['number-drift.csv', 'NUMBER_DRIFT'],
    ['release-shortage.csv', 'RELEASE_BOARD_CLUES_SHORTAGE'],
  ])('fixture %s independently emits %s', (fixture, code) => {
    const file = resolve('tests/fixtures/content-invalid', fixture);
    const result = validateProductionContent([
      { file, pack: parsePackCsv(readFileSync(file, 'utf8')) },
    ], { mode: fixture === 'release-shortage.csv' ? 'release' : 'batch' });

    expect(result.issues.map((issue) => issue.code)).toContain(code);
  });

  it('recognizes reader-visible month-year dates for changing facts', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'As of August 2026, which city was the largest?' };
    rows[1] = {
      ...rows[1],
      clue_en: 'Which city was the largest?',
      explanation_en: 'In July 2026, it was the largest by population.',
    };

    const result = validateProductionContent([input('month-year-dates.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'UNDATED_CHANGING_FACT')).toEqual([]);
  });

  it('rejects malformed and calendar-invalid explicit dates for changing facts', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'On August 99, 2026, which city was the largest?' };
    rows[1] = { ...rows[1], clue_en: 'As of August 2026-13, which city was the largest?' };
    rows[2] = { ...rows[2], clue_en: 'As of Auguust 2026, which city was the largest?' };
    rows[3] = { ...rows[3], clue_en: 'As of 08 2026, which city was the largest?' };
    rows[4] = { ...rows[4], clue_en: 'As of August 2026/13, which city was the largest?' };
    rows[5] = { ...rows[5], clue_en: 'As of August 2026.13, which city was the largest?' };
    rows[6] = { ...rows[6], clue_en: 'As of August 2026- 13, which city was the largest?' };
    rows[7] = { ...rows[7], clue_en: 'On February 31, 2026, which city was the largest?' };
    rows[8] = { ...rows[8], clue_en: 'As of 2026-02-31, which city was the largest?' };
    rows[9] = { ...rows[9], clue_en: 'On February 29, 2025, which city was the largest?' };

    const result = validateProductionContent([input('malformed-lexical-dates.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'UNDATED_CHANGING_FACT').map((issue) => issue.row)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('requires reader-visible dates while preserving existing explicit date formats', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'Who is the current president?' };
    rows[1] = {
      ...rows[1],
      clue_en: 'Who is the current president?',
      source_url: 'https://example.com/source?oldid=12345',
    };
    rows[2] = { ...rows[2], clue_en: 'As of 2026, which city was the largest?' };
    rows[3] = { ...rows[3], clue_en: 'On August 14, 2026, which city was the largest?' };
    rows[4] = { ...rows[4], clue_en: 'As of 2026-08-14, which city was the largest?' };
    rows[5] = { ...rows[5], clue_en: 'On February 29, 2024, which city was the largest?' };
    rows[6] = { ...rows[6], clue_en: 'On April 30, 2026, which city was the largest?' };
    rows[7] = { ...rows[7], clue_en: 'As of 2024-02-29, which city was the largest?' };

    const result = validateProductionContent([input('explicit-date-formats.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'UNDATED_CHANGING_FACT').map((issue) => issue.row)).toEqual([2, 3]);
  });

  it('finds duplicate identities and normalized content across files in stable byte order', () => {
    const rows = twelveValidSets();
    const duplicate = boardRow(99, 1, {
      clue_id: rows[0].clue_id,
      category_set_id: 'set-99',
      category_name_en: `  ${rows[5].category_name_en.toUpperCase()}  `,
      clue_en: `  ${rows[1].clue_en.toUpperCase()}  `,
    });
    const a = validateProductionContent([input('z.csv', [duplicate]), input('a.csv', rows)], { mode: 'batch' });
    const b = validateProductionContent([input('a.csv', rows), input('z.csv', [duplicate])], { mode: 'batch' });

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'DUPLICATE_ID', 'DUPLICATE_CLUE_TEXT', 'DUPLICATE_CATEGORY_NAME',
    ]));
  });

  it('applies the missing-Estonian exception only in batch and records its exact ID', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_et: '', translation_status: 'untranslated' };
    const strict = validateProductionContent([input('batch.csv', rows)], { mode: 'batch' });
    const allowed = validateProductionContent([input('batch.csv', rows)], {
      mode: 'batch', allowMissingEt: true,
    });

    expect(strict.blocking).toBe(true);
    expect(allowed.blocking, JSON.stringify(allowed.issues.filter((issue) => issue.severity === 'error'))).toBe(false);
    expect(allowed.exceptions).toEqual([
      expect.objectContaining({ id: 'missing-et:clue-0-1', code: 'MISSING_TRANSLATION' }),
    ]);
    expect(() => validateProductionContent([input('release.csv', rows)], {
      mode: 'release', allowMissingEt: true,
    })).toThrow(/batch mode/i);
  });

  it('normalizes decimal and thousands formatting while detecting real numeric drift', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'The length is 1,000 km and the ratio is 1.5.', clue_et: 'Pikkus on 1 000 km ja suhe 1,5.' };
    rows[1] = { ...rows[1], clue_en: 'The launch year was 1969.', clue_et: 'Stardiaasta oli 1968.' };
    const result = validateProductionContent([input('numbers.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'NUMBER_DRIFT').map((issue) => issue.row)).toEqual([3]);
  });

  it('treats numeric units as complete tokens across localized dates and era notation', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'The war ended on 8 May.', clue_et: 'Sõda lõppes 8. mail.' };
    rows[1] = { ...rows[1], clue_en: 'Apollo 11 lunar module landed.', clue_et: 'Apollo 11 kuumoodul maandus.' };
    rows[2] = { ...rows[2], clue_en: 'The attack came on 20 March.', clue_et: 'Rünnak toimus 20. märtsil.' };
    rows[3] = { ...rows[3], accepted_variants_en: 'AD 79;79 AD', accepted_variants_et: '79 pKr;79 m.a.j.' };
    rows[4] = { ...rows[4], accepted_variants_en: 'BC 44;44 BC', accepted_variants_et: '44 eKr;44 e.m.a.' };
    rows[5] = { ...rows[5], clue_en: 'The armistice took effect on November 11, 1918.', clue_et: 'Vaherahu jõustus 11. novembril 1918.' };
    rows[6] = { ...rows[6], clue_en: 'The total was 1,234.5.', clue_et: 'Kogusumma oli 1 234,5.' };
    rows[7] = { ...rows[7], clue_en: 'The length is 8 m.', clue_et: 'Pikkus on 8 l.' };
    rows[8] = { ...rows[8], clue_en: 'The mission carried 11 people.', clue_et: 'Missioonil oli 12 inimest.' };

    const result = validateProductionContent([input('numeric-token-boundaries.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'NUMBER_DRIFT').map((issue) => issue.row)).toEqual([9, 10]);
  });

  it('recognizes localized Genesis numbering and hyphenated alternatives without hiding signed-number drift', () => {
    const rows = twelveValidSets();
    rows[0] = {
      ...rows[0],
      explanation_en: 'The figures are drawn from Genesis and classical prophecy.',
      explanation_et: 'Figuurid pärinevad 1. Moosese raamatust ja antiiksetest ettekuulutustest.',
    };
    rows[1] = {
      ...rows[1],
      explanation_en: 'The proposed 1503-or-1504 start is narrower than the 1503–1506 span.',
      explanation_et: 'Pakutud algusaeg 1503 või 1504 on kitsam kui vahemik 1503–1506.',
    };
    rows[2] = {
      ...rows[2],
      explanation_en: 'The offset is -1504.',
      explanation_et: 'Nihe on 1504.',
    };

    const result = validateProductionContent([input('localized-number-boundaries.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'NUMBER_DRIFT').map((issue) => issue.row)).toEqual([4]);
  });

  it('rejects generated placeholder records from production batches', () => {
    const rows = twelveValidSets();
    rows[0] = {
      ...rows[0],
      clue_en: 'History topic 1 tier 1 asks for a generated reference.',
      clue_et: 'Ajaloo teema 1 tase 1 küsib genereeritud viidet.',
      response_en: 'The generated answer for History topic 1 tier 1',
      response_et: 'Genereeritud vastus ajaloo teemale 1 tasemel 1',
    };

    const result = validateProductionContent([input('placeholder.csv', rows)], { mode: 'batch' });

    expect(result.issues).toContainEqual(expect.objectContaining({
      row: 2,
      code: 'PLACEHOLDER_CONTENT',
      severity: 'error',
    }));
  });

  it('does not waive generated placeholder records in release mode', () => {
    const rows = twelveValidSets();
    rows[0] = {
      ...rows[0],
      clue_en: 'History topic 1 tier 1 asks for a generated reference.',
      response_en: 'The generated answer for History topic 1 tier 1',
    };

    const result = validateProductionContent([input('placeholder.csv', rows)], {
      mode: 'release',
      reviewedExceptionIds: ['placeholder:clue-0-1'],
    });

    expect(result.issues).toContainEqual(expect.objectContaining({
      row: 2,
      code: 'PLACEHOLDER_CONTENT',
      severity: 'error',
    }));
  });

  it.each([
    ['release mode', { mode: 'release' as const }],
    ['an explicit batch', { mode: 'batch' as const, batch: getProductionBatch('01-history') }],
    ['an evidence map', { mode: 'batch' as const, evidenceByClueId: new Map<string, ContentEvidence>() }],
  ])('requires evidence for every row in %s', (_name, options) => {
    const row = boardRow(0, 1, { pack_id: 'built-in-history', macro_topic: 'ancient' });
    const result = validateProductionContent([input('missing-evidence.csv', [row])], options);

    expect(result.issues).toContainEqual(expect.objectContaining({
      row: 2, code: 'MISSING_EVIDENCE', severity: 'error',
    }));
  });

  it('binds evidence identity, batch, source fields, and assertion to its CSV row', () => {
    const row = boardRow(0, 1, { pack_id: 'built-in-history', macro_topic: 'ancient' });
    const valid = evidenceFor(row, '01-history');
    const mismatches: ContentEvidence[] = [
      { ...valid, clueId: 'different-clue' },
      { ...valid, batchId: '02-geography' },
      { ...valid, assertion: 'A different assertion' },
      { ...valid, supportingSource: { ...valid.supportingSource, title: 'Different title' } },
      { ...valid, supportingSource: { ...valid.supportingSource, url: 'https://example.com/source/different' } },
      { ...valid, supportingSource: { ...valid.supportingSource, license: 'Different license' } },
      { ...valid, supportingSource: { ...valid.supportingSource, retrievedAt: '2026-08-11' } },
    ];

    for (const mismatch of mismatches) {
      const result = validateProductionContent([input('mismatch.csv', [row])], {
        mode: 'batch', evidenceByClueId: new Map([[row.clue_id, mismatch]]),
      });
      expect(result.issues).toContainEqual(expect.objectContaining({ row: 2, code: 'SOURCE_MISMATCH' }));
    }

    const orphan = evidenceFor({ ...row, clue_id: 'orphan' }, '01-history');
    const withOrphan = validateProductionContent([input('mismatch.csv', [row])], {
      mode: 'batch', evidenceByClueId: evidenceMap([valid, orphan]),
    });
    expect(withOrphan.issues).toContainEqual(expect.objectContaining({ row: 0, code: 'SOURCE_MISMATCH' }));
  });

  it('requires approved factual/editorial review and release translation review', () => {
    const rows = [0, 1, 2].map((index) => boardRow(index, 1, {
      pack_id: 'built-in-history', macro_topic: 'ancient',
    }));
    const records = [
      { ...evidenceFor(rows[0], '01-history'), factualReview: null },
      { ...evidenceFor(rows[1], '01-history'), editorialReview: null },
      { ...evidenceFor(rows[2], '01-history'), translationReview: null },
    ] as unknown as ContentEvidence[];
    const result = validateProductionContent([input('reviews.csv', rows)], {
      mode: 'release', evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues.filter((issue) => issue.code === 'MISSING_EVIDENCE').map((issue) => issue.row))
      .toEqual([2, 3, 4]);
  });

  it('requires CSV translation status and evidence review to agree before trusting evidence', () => {
    const machineRow = boardRow(0, 1, {
      pack_id: 'built-in-history', macro_topic: 'ancient', translation_status: 'machine',
    });
    const reviewedRow = boardRow(1, 1, {
      pack_id: 'built-in-history', macro_topic: 'ancient', translation_status: 'reviewed',
    });
    const machineEvidence = evidenceFor(machineRow, '01-history');
    const unreviewedEvidence = evidenceFor(reviewedRow, '01-history', { translationReview: null });

    const machineRelease = validateProductionContent([input('machine.csv', [machineRow])], {
      mode: 'release', evidenceByClueId: evidenceMap([machineEvidence]),
    });
    const reviewedBatch = validateProductionContent([input('reviewed.csv', [reviewedRow])], {
      mode: 'batch', evidenceByClueId: evidenceMap([unreviewedEvidence]),
    });
    const reviewedRelease = validateProductionContent([input('reviewed.csv', [reviewedRow])], {
      mode: 'release', evidenceByClueId: evidenceMap([unreviewedEvidence]),
    });

    expect(machineRelease.issues).toContainEqual(expect.objectContaining({ row: 2, code: 'MISSING_EVIDENCE', severity: 'error' }));
    expect(reviewedBatch.issues).toContainEqual(expect.objectContaining({ row: 2, code: 'MISSING_EVIDENCE', severity: 'error' }));
    expect(reviewedRelease.issues).toContainEqual(expect.objectContaining({ row: 2, code: 'MISSING_EVIDENCE', severity: 'error' }));
  });

  it('accepts already-reviewed evidence while authored Estonian fields are still missing', () => {
    const authored = boardRow(0, 1, {
      pack_id: 'built-in-history', macro_topic: 'ancient', translation_status: 'untranslated',
      category_name_et: '', clue_et: '', response_et: '', accepted_variants_et: '', explanation_et: '',
    });
    const result = validateProductionContent([input('authored.csv', [authored])], {
      mode: 'batch', allowMissingEt: true,
      evidenceByClueId: evidenceMap([evidenceFor(authored, '01-history')]),
    });

    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: 'MISSING_EVIDENCE' }));
  });

  it('excludes batch translation-review disagreements from fact ownership and composition', () => {
    const batch = getProductionBatch('01-history');
    const machine = boardRow(0, 1, {
      pack_id: batch.packId, macro_topic: 'ancient', translation_status: 'machine',
    });
    const machineWithReview = boardRow(1, 1, {
      pack_id: batch.packId, macro_topic: 'ancient', translation_status: 'machine',
    });
    const reviewedWithoutReview = boardRow(2, 1, {
      pack_id: batch.packId, macro_topic: 'ancient', translation_status: 'reviewed',
    });
    const result = validateProductionContent([input('translation-batch.csv', [machine, machineWithReview, reviewedWithoutReview])], {
      mode: 'batch',
      batch,
      evidenceByClueId: evidenceMap([
        evidenceFor(machine, batch.id, { factKey: 'fact:shared', translationReview: null }),
        evidenceFor(machineWithReview, batch.id, { factKey: 'fact:shared', origin: 'openTdbInspired' }),
        evidenceFor(reviewedWithoutReview, batch.id, { translationReview: null }),
      ]),
    });

    expect(result.issues.filter((issue) => issue.code === 'MISSING_EVIDENCE').map((issue) => issue.row)).toEqual([3, 4]);
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: 'DUPLICATE_FACT' }));
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'OPENTDB_COMPOSITION', message: expect.stringContaining('found 0'),
    }));
  });

  it('rejects generic, non-entity Wikidata, and OpenTDB supporting URLs', () => {
    const generic = qualityFixture('generic-source.csv');
    const wikidataRow = boardRow(1, 1, {
      pack_id: 'built-in-history', macro_topic: 'ancient',
      source_url: 'https://www.wikidata.org/wiki/Property:P31',
    });
    const openTdbRow = boardRow(2, 1, {
      pack_id: 'built-in-history', macro_topic: 'ancient',
      source_url: 'https://opentdb.com/api.php?amount=1',
    });
    const genericEvidence = evidenceFor(generic.rows[0], '01-history');
    const wikidataEvidence = evidenceFor(wikidataRow, '01-history', { origin: 'wikidata' });
    const openTdbEvidence = evidenceFor(openTdbRow, '01-history', { origin: 'openTdbInspired' });
    const result = validateProductionContent([
      generic.input,
      input('specificity.csv', [wikidataRow, openTdbRow]),
    ], {
      mode: 'batch',
      reviewedExceptionIds: ['source:generic-source'],
      evidenceByClueId: evidenceMap([genericEvidence, wikidataEvidence, openTdbEvidence]),
    });

    const sourceIssues = result.issues.filter((issue) => issue.code === 'GENERIC_SOURCE');
    expect(sourceIssues).toHaveLength(3);
    expect(sourceIssues.every((issue) => issue.severity === 'error' && issue.exceptionId === undefined)).toBe(true);
  });

  it('rejects repeated fact keys after their first occurrence', () => {
    const fixture = qualityFixture('duplicate-fact.csv');
    const records = fixture.rows.map((row) => evidenceFor(row, '01-history', { factKey: 'fact:shared' }));
    const result = validateProductionContent([fixture.input], {
      mode: 'batch', evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues).toContainEqual(expect.objectContaining({
      row: 3, code: 'DUPLICATE_FACT', severity: 'error',
    }));
  });

  it('rejects near-duplicate clue wording on the pair second row', () => {
    const fixture = qualityFixture('near-duplicate.csv');
    const records = fixture.rows.map((row) => evidenceFor(row, '05-art-architecture'));
    const result = validateProductionContent([fixture.input], {
      mode: 'batch', evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues).toContainEqual(expect.objectContaining({
      row: 3, code: 'NEAR_DUPLICATE_CLUE', severity: 'error',
    }));
  });

  it('rejects fact reuse between board and Final rows on the later occurrence', () => {
    const fixture = qualityFixture('board-final-reuse.csv');
    const records = fixture.rows.map((row) => evidenceFor(
      row,
      row.clue_id === 'reuse-board' ? '01-history' : '13-finals',
      { factKey: 'fact:board-final-shared' },
    ));
    const result = validateProductionContent([fixture.input], {
      mode: 'batch', evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 3, code: 'DUPLICATE_FACT' }),
      expect.objectContaining({ row: 3, code: 'BOARD_FINAL_FACT_REUSE' }),
    ]));
  });

  it('enforces every board-batch allocation dimension', () => {
    const batch = getProductionBatch('01-history');
    const validRows = boardBatchRows(batch);
    const validate = (rows: readonly Row[]) => validateProductionContent([input('history.csv', rows)], {
      mode: 'batch', batch,
      evidenceByClueId: evidenceMap(rows.map((row, index) => evidenceFor(row, batch.id, {
        origin: index < batch.requiredOpenTdbClues ? 'openTdbInspired' : 'compatibleOpen',
      }))),
    });

    expect(validate(validRows).issues.map((issue) => issue.code)).not.toEqual(expect.arrayContaining([
      'BATCH_ALLOCATION', 'SUBTHEME_LIMIT', 'OPENTDB_COMPOSITION',
    ]));

    const mutations: Array<(rows: Row[]) => void> = [
      (rows) => { rows.pop(); },
      (rows) => { rows[0] = { ...rows[0], category_set_id: rows[5].category_set_id }; },
      (rows) => { for (let index = 0; index < 5; index += 1) rows[index] = { ...rows[index], pack_id: 'built-in-geography' }; },
      (rows) => { for (let index = 0; index < 5; index += 1) rows[index] = { ...rows[index], content_kind: 'final' }; },
      (rows) => { for (let index = 0; index < 5; index += 1) rows[index] = { ...rows[index], macro_topic: 'undeclared' }; },
      (rows) => { for (let index = 0; index < 5; index += 1) rows[index] = { ...rows[index], difficulty: 'hard' }; },
    ];
    for (const mutate of mutations) {
      const rows = validRows.map((row) => ({ ...row }));
      mutate(rows);
      expect(validate(rows).issues.map((issue) => issue.code)).toContain('BATCH_ALLOCATION');
    }
  });

  it('enforces board subtheme and OpenTDB composition limits', () => {
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch);
    for (let setIndex = 0; setIndex < 16; setIndex += 1) {
      for (let tierIndex = 0; tierIndex < 5; tierIndex += 1) {
        const index = setIndex * 5 + tierIndex;
        rows[index] = { ...rows[index], macro_topic: batch.subthemes[0] };
      }
    }
    const records = rows.map((row, index) => evidenceFor(row, batch.id, {
      origin: index < batch.requiredOpenTdbClues - 1 ? 'openTdbInspired' : 'compatibleOpen',
    }));
    const result = validateProductionContent([input('history.csv', rows)], {
      mode: 'batch', batch, evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'SUBTHEME_LIMIT', 'OPENTDB_COMPOSITION',
    ]));
  });

  it('rejects evidence-map aliases without counting them toward OpenTDB composition', () => {
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch);
    const records = rows.map((row, index) => evidenceFor(row, batch.id, {
      origin: index < 99 ? 'openTdbInspired' : 'compatibleOpen',
    }));
    const evidence = new Map(records.map((record) => [record.clueId, record]));
    evidence.set('spoofed-alias', records[0]);

    const result = validateProductionContent([input('history.csv', rows)], {
      mode: 'batch', batch, evidenceByClueId: evidence,
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 0, code: 'SOURCE_MISMATCH', severity: 'error' }),
      expect.objectContaining({
        row: 0,
        code: 'OPENTDB_COMPOSITION',
        message: expect.stringContaining('found 99'),
      }),
    ]));
  });

  it('strictly parses direct evidence-map values before trusting them', () => {
    const rows = Array.from({ length: 6 }, (_, index) => boardRow(index, 1, {
      pack_id: 'built-in-history', macro_topic: 'ancient',
    }));
    const valid = rows.map((row) => evidenceFor(row, '01-history'));
    const missingReviewer = Object.fromEntries(
      Object.entries(valid[0].factualReview).filter(([key]) => key !== 'reviewer'),
    );
    const missingReviewTime = Object.fromEntries(
      Object.entries(valid[1].editorialReview).filter(([key]) => key !== 'reviewedAt'),
    );
    const malformed = [
      { ...valid[0], factualReview: missingReviewer },
      { ...valid[1], editorialReview: missingReviewTime },
      {
        ...valid[2],
        factualReview: { ...valid[2].factualReview, reviewer: valid[2].authoring.author },
      },
      {
        ...valid[3],
        editorialReview: { ...valid[3].editorialReview, reviewedAt: valid[3].authoring.authoredAt },
      },
      {
        ...valid[4],
        supportingSource: { ...valid[4].supportingSource, url: 'http://example.com/not-https' },
      },
      { ...valid[5], origin: 'openTdbInspired', inspiration: null },
    ];
    const runtimeMap = new Map(malformed.map((record, index) => [
      rows[index].clue_id,
      record as unknown as ContentEvidence,
    ]));

    const result = validateProductionContent([input('malformed-evidence.csv', rows)], {
      mode: 'batch', evidenceByClueId: runtimeMap,
    });

    expect(result.issues.filter((issue) => issue.code === 'MISSING_EVIDENCE').map((issue) => issue.row))
      .toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('excludes schema-invalid evidence from OpenTDB composition', () => {
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch);
    const records = rows.map((row, index) => evidenceFor(row, batch.id, {
      origin: index < 100 ? 'openTdbInspired' : 'compatibleOpen',
    }));
    records[0] = {
      ...records[0],
      factualReview: { ...records[0].factualReview, reviewer: records[0].authoring.author },
    };

    const result = validateProductionContent([input('history.csv', rows)], {
      mode: 'batch', batch, evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, code: 'MISSING_EVIDENCE' }),
      expect.objectContaining({
        code: 'OPENTDB_COMPOSITION',
        message: expect.stringContaining('found 99'),
      }),
    ]));
  });

  it('enforces Final allocation and zero OpenTDB-inspired evidence', () => {
    const rows = finalBatchRows();
    const validate = (candidateRows: readonly Row[], records = candidateRows.map((row) => evidenceFor(row, FINAL_BATCH.id))) =>
      validateProductionContent([input('finals.csv', candidateRows)], {
        mode: 'batch', batch: FINAL_BATCH, evidenceByClueId: evidenceMap(records),
      });

    const validCodes = validate(rows).issues.map((issue) => issue.code);
    expect(validCodes).not.toEqual(expect.arrayContaining(['BATCH_ALLOCATION', 'OPENTDB_COMPOSITION']));
    expect(validCodes).not.toContain('MATCH_CATEGORY_NAMES_SHORTAGE');

    const invalidFamilies = rows.map((row) => ({ ...row }));
    invalidFamilies[1] = { ...invalidFamilies[1], macro_topic: FINAL_BATCH.subthemes[0] };
    expect(validate(invalidFamilies).issues.map((issue) => issue.code)).toContain('BATCH_ALLOCATION');

    const invalidDifficulty = rows.map((row) => ({ ...row }));
    invalidDifficulty[0] = { ...invalidDifficulty[0], difficulty: 'hard' };
    expect(validate(invalidDifficulty).issues.map((issue) => issue.code)).toContain('BATCH_ALLOCATION');

    const records = rows.map((row, index) => evidenceFor(row, FINAL_BATCH.id, {
      origin: index === 0 ? 'openTdbInspired' : 'compatibleOpen',
    }));
    expect(validate(rows, records).issues.map((issue) => issue.code)).toContain('OPENTDB_COMPOSITION');
  });

  it('exports every factual, source, duplicate, allocation, and filler code as non-waivable', () => {
    expect([...NON_WAIVABLE_CODES]).toEqual(expect.arrayContaining([
      'MISSING_EVIDENCE', 'SOURCE_MISMATCH', 'GENERIC_SOURCE', 'DUPLICATE_FACT',
      'NEAR_DUPLICATE_CLUE', 'BOARD_FINAL_FACT_REUSE', 'SUBTHEME_LIMIT',
      'BATCH_ALLOCATION', 'OPENTDB_COMPOSITION', 'PLACEHOLDER_CONTENT',
    ]));
  });

  it('emits every release threshold shortage independently', () => {
    const rows = twelveValidSets();
    const result = validateProductionContent([input('short.csv', rows)], { mode: 'release' });
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'RELEASE_BOARD_CLUES_SHORTAGE',
      'RELEASE_CATEGORY_SETS_SHORTAGE',
      'RELEASE_CATEGORY_NAMES_SHORTAGE',
      'RELEASE_FINAL_CLUES_SHORTAGE',
      'RELEASE_EASY_SETS_SHORTAGE',
      'RELEASE_MEDIUM_SETS_SHORTAGE',
      'RELEASE_HARD_SETS_SHORTAGE',
    ]));
  });

  it('summarizes an exact valid 6000/1200/150 inventory efficiently', () => {
    const corpus = releaseCorpus();

    const result = validateProductionContent(releaseInputs(corpus), {
      mode: 'release', evidenceByClueId: corpus.evidence,
    });

    expect(result.summary).toEqual({
      boardClues: 6000, categorySets: 1200, distinctCategoryNames: 1200,
      finalClues: 150, easySets: 400, mediumSets: 400, hardSets: 400,
    });
    expect(result.blocking, JSON.stringify(result.issues.filter((issue) => issue.severity === 'error').slice(0, 20))).toBe(false);
  }, 15_000);

  it('promotes unreviewed translation warnings in release with stable exception IDs', () => {
    const corpus = releaseCorpus();
    corpus.batches[0].rows[0] = {
      ...corpus.batches[0].rows[0], explanation_et: corpus.batches[0].rows[0].explanation_en,
    };
    const first = validateProductionContent(releaseInputs(corpus), {
      mode: 'release', evidenceByClueId: corpus.evidence,
    });
    const warning = first.issues.find((issue) => issue.code === 'UNCHANGED_TRANSLATION');

    expect(warning).toMatchObject({ severity: 'error', exceptionId: 'translation:UNCHANGED_TRANSLATION:clue-0-1' });
    const reviewed = validateProductionContent(releaseInputs(corpus), {
      mode: 'release', reviewedExceptionIds: [warning!.exceptionId!], evidenceByClueId: corpus.evidence,
    });
    expect(reviewed.issues.find((issue) => issue.code === 'UNCHANGED_TRANSLATION')?.severity).toBe('warning');
  }, 15_000);
});

describe('validator CLI boundaries and report publication', () => {
  const npmCli = process.env.npm_execpath;

  it('supports the documented npm flag invocation and writes a stable blocking report', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'invalid.json');
    const args = ['run', 'content:validate', '--', '--input', 'tests/fixtures/content-invalid/*.csv', '--mode', 'batch', '--report', report];
    expect(npmCli).toBeTruthy();
    const first = spawnSync(process.execPath, [npmCli!, ...args], { cwd: resolve('.'), encoding: 'utf8' });
    expect(first.status, first.stderr).toBe(1);
    const firstBytes = readFileSync(report, 'utf8');
    const parsed = JSON.parse(firstBytes);
    expect(parsed.validation.blocking).toBe(true);
    expect(parsed.validation.issues.map((issue: { code: string }) => issue.code)).toEqual(expect.arrayContaining([
      'MISSING_TIER', 'DUPLICATE_ID', 'DUPLICATE_CLUE_TEXT', 'DUPLICATE_CATEGORY_NAME',
      'INVALID_ROUND', 'MISSING_SOURCE', 'UNDATED_CHANGING_FACT', 'MISSING_TRANSLATION', 'NUMBER_DRIFT',
    ]));
    const second = spawnSync(process.execPath, [npmCli!, ...args], { cwd: resolve('.'), encoding: 'utf8' });
    expect(second.status, second.stderr).toBe(1);
    expect(readFileSync(report, 'utf8')).toBe(firstBytes);
  }, 20_000);

  it('rejects release --allow-missing-et before report publication', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'release.json');
    const result = spawnSync(process.execPath, [npmCli!,
      'run', 'content:validate', '--', '--allow-missing-et', '--input',
      'tests/fixtures/content-invalid/missing-translation.csv', '--mode', 'release', '--report', report,
    ], { cwd: resolve('.'), encoding: 'utf8' });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/batch mode/i);
    expect(() => readFileSync(report)).toThrow();
  });

  it('accepts an exact valid synthetic release corpus through the documented CLI', () => {
    const directory = temporaryDirectory();
    const evidence = join(directory, 'release.jsonl');
    const report = join(directory, 'release.json');
    const corpus = releaseCorpus();
    for (const batch of corpus.batches) writeFileSync(join(directory, batch.file), csv(batch.rows));
    writeFileSync(evidence, serializeEvidence([...corpus.evidence.values()]));
    const result = spawnSync(process.execPath, [npmCli!, 'run', 'content:validate', '--',
      '--input', join(directory, '*.csv'), '--evidence', evidence, '--mode', 'release', '--report', report,
    ], { cwd: resolve('.'), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(JSON.parse(readFileSync(report, 'utf8')).validation.summary).toEqual({
      boardClues: 6000, categorySets: 1200, distinctCategoryNames: 1200,
      finalClues: 150, easySets: 400, mediumSets: 400, hardSets: 400,
    });
  }, 60_000);

  it('accepts evidence and an optional batch ID through the documented CLI', () => {
    const directory = temporaryDirectory();
    const source = join(directory, 'history.csv');
    const evidence = join(directory, 'history.jsonl');
    const report = join(directory, 'history-report.json');
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch);
    const records = rows.map((row, index) => evidenceFor(row, batch.id, {
      origin: index < batch.requiredOpenTdbClues ? 'openTdbInspired' : 'compatibleOpen',
    }));
    writeFileSync(source, csv(rows));
    writeFileSync(evidence, serializeEvidence(records));

    const result = spawnSync(process.execPath, [npmCli!, 'run', 'content:validate', '--',
      '--input', source, '--evidence', evidence, '--batch', batch.id,
      '--mode', 'batch', '--report', report,
    ], { cwd: resolve('.'), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(JSON.parse(readFileSync(report, 'utf8')).validation.blocking).toBe(false);
  }, 30_000);

  it('resolves BOM/malformed/duplicate globs deterministically and rejects no matches', async () => {
    const directory = temporaryDirectory();
    writeFileSync(join(directory, 'b.csv'), csv(twelveValidSets()));
    writeFileSync(join(directory, 'a.csv'), `\uFEFF${csv(twelveValidSets())}`);
    expect(await resolveCsvInputFiles([join(directory, '*.csv'), join(directory, 'a.csv')]))
      .toEqual([join(directory, 'a.csv'), join(directory, 'b.csv')]);
    await expect(resolveCsvInputFiles([join(directory, 'missing-*.csv')])).rejects.toThrow(/matched no files/i);
  });

  it('atomically merges validation while preserving siblings and rejects symlink destinations', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'report.json');
    writeFileSync(report, JSON.stringify({ translation: { retained: true } }));
    publishValidationReport(report, { mode: 'batch', blocking: false, summary: {}, issues: [], exceptions: [] });
    expect(JSON.parse(readFileSync(report, 'utf8'))).toEqual({
      translation: { retained: true },
      validation: { mode: 'batch', blocking: false, summary: {}, issues: [], exceptions: [] },
    });

    const link = join(directory, 'linked.json');
    symlinkSync(report, link, 'file');
    expect(() => publishValidationReport(link, { safe: false })).toThrow(/symlink/i);
    expect(JSON.parse(readFileSync(report, 'utf8')).translation.retained).toBe(true);
  });

  it('publishes a complete report at top level only when explicitly requested', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'release.json');
    writeFileSync(report, JSON.stringify({ translation: { retained: true }, stale: true }));
    const release = {
      generatedAt: '2026-08-13T12:00:00.000Z',
      mode: 'release',
      validation: { mode: 'release', blocking: false, summary: { boardClues: 6000 } },
      input: { sha256: 'input' }, output: { sha256: 'seed' }, inventory: { boardClues: 6000 },
    };

    publishValidationReport(report, release, { placement: 'top-level' });

    expect(JSON.parse(readFileSync(report, 'utf8'))).toEqual({
      translation: { retained: true }, stale: true, ...release,
    });
  });

  it('keeps nested placement as the default even for report-shaped payloads', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'validation.json');
    const reportShapedValidation = {
      generatedAt: '2026-08-13T12:00:00.000Z',
      input: { sha256: 'not-a-release-report' },
      mode: 'batch', blocking: false, summary: {}, issues: [], exceptions: [],
    };

    publishValidationReport(report, reportShapedValidation);

    expect(JSON.parse(readFileSync(report, 'utf8'))).toEqual({ validation: reportShapedValidation });
  });

  it('preserves the prior report when temporary write or rename fails', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'report.json');
    writeFileSync(report, '{"prior":true}\n');
    expect(() => publishValidationReport(report, { changed: true }, {
      rename: () => { throw new Error('forced rename failure'); },
    })).toThrow(/forced rename failure/);
    expect(readFileSync(report, 'utf8')).toBe('{"prior":true}\n');
  });

  it('does not follow a colliding temporary name when publishing a report', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'report.json');
    writeFileSync(`${report}.collision.tmp`, 'owned by another process');
    const ids = ['collision', 'safe'];
    publishValidationReport(report, { safe: true }, { createTemporaryId: () => ids.shift()! });
    expect(JSON.parse(readFileSync(report, 'utf8')).validation).toEqual({ safe: true });
    expect(readFileSync(`${report}.collision.tmp`, 'utf8')).toBe('owned by another process');
  });
});

describe('source checker', () => {
  function dependencies(fetchImpl: SourceCheckDependencies['fetch']): SourceCheckDependencies {
    return {
      fetch: fetchImpl,
      resolveHostname: async () => ['93.184.216.34'],
      now: () => new Date('2026-08-12T12:00:00.000Z'),
      sleep: async () => undefined,
    };
  }

  it('rejects non-HTTPS, credentials, official archives, localhost, private DNS, and redirect escapes', async () => {
    const neverFetch = async () => { throw new Error('fetch should not run'); };
    const direct = await checkSourceUrls([
      'http://example.com', 'https://u:p@example.com', 'https://j-archive.com/showgame.php?game_id=1',
      'https://localhost/source',
    ], dependencies(neverFetch));
    expect(Object.fromEntries(direct.map((result) => [result.url, result.code]))).toEqual({
      'http://example.com': 'SOURCE_URL_NOT_HTTPS',
      'https://u:p@example.com': 'SOURCE_URL_CREDENTIALS',
      'https://j-archive.com/showgame.php?game_id=1': 'OFFICIAL_ARCHIVE_HOST',
      'https://localhost/source': 'SOURCE_PRIVATE_ADDRESS',
    });

    const privateDns = dependencies(neverFetch);
    privateDns.resolveHostname = async () => ['10.0.0.1'];
    expect((await checkSourceUrls(['https://example.com'], privateDns))[0].code).toBe('SOURCE_PRIVATE_ADDRESS');

    const redirect = dependencies(async () => ({ status: 302, headers: new Headers({ location: 'https://127.0.0.1/private' }) }));
    expect((await checkSourceUrls(['https://example.com'], redirect))[0].code).toBe('SOURCE_PRIVATE_ADDRESS');
  });

  it('uses bounded retries/backoff, timeout signal, UA, concurrency, and caches successful metadata only', async () => {
    let attempts = 0;
    let active = 0;
    let maxActive = 0;
    const seenHeaders: string[] = [];
    const deps = dependencies(async (_url, init) => {
      active += 1; maxActive = Math.max(maxActive, active);
      seenHeaders.push(new Headers(init?.headers).get('user-agent') ?? '');
      expect(init?.redirect).toBe('manual');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      attempts += 1;
      await Promise.resolve();
      active -= 1;
      return { status: attempts <= 2 ? 503 : 204, headers: new Headers() };
    });
    const cache = createMemorySourceCache();
    const first = await checkSourceUrls(['https://example.com/a', 'https://example.com/b'], deps, {
      concurrency: 1, maxAttempts: 3, cache,
    });
    expect(maxActive).toBe(1);
    expect(seenHeaders.every((value) => value.includes('Quiz Stage'))).toBe(true);
    expect(first.every((result) => !('body' in result))).toBe(true);
    const before = attempts;
    await checkSourceUrls(['https://example.com/a', 'https://example.com/b'], deps, { cache });
    expect(attempts).toBe(before);
  });

  it('does not cache failures and ignores expired or incompatible successful entries', async () => {
    let requests = 0;
    const deps = dependencies(async () => {
      requests += 1;
      return { status: requests === 1 ? 404 : 204, headers: new Headers() };
    });
    const cache = createMemorySourceCache({
      'https://example.com/expired': {
        version: 1, expiresAt: '2026-08-11T00:00:00.000Z',
        result: { url: 'https://example.com/expired', ok: true, status: 204, retrievedAt: '2026-08-10T00:00:00.000Z', code: null, finalUrl: 'https://example.com/expired' },
      },
      'https://example.com/old-version': {
        version: 0, expiresAt: '2026-08-13T00:00:00.000Z',
        result: { url: 'https://example.com/old-version', ok: true, status: 204, retrievedAt: '2026-08-10T00:00:00.000Z', code: null, finalUrl: 'https://example.com/old-version' },
      },
    });
    expect((await checkSourceUrls(['https://example.com/failure'], deps, { cache }))[0].ok).toBe(false);
    expect((await checkSourceUrls(['https://example.com/failure'], deps, { cache }))[0].ok).toBe(true);
    await checkSourceUrls(['https://example.com/expired', 'https://example.com/old-version'], deps, { cache });
    expect(requests).toBe(4);
  });

  it('batches Wikidata entities through the official API under count and URL caps', () => {
    const ids = Array.from({ length: 121 }, (_, index) => `Q${index + 1}`);
    const urls = buildWikidataBatchUrls(ids, { maxEntities: 50, maxUrlLength: 500 });
    expect(urls.length).toBeGreaterThan(2);
    for (const url of urls) {
      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://www.wikidata.org');
      expect(parsed.pathname).toBe('/w/api.php');
      expect((parsed.searchParams.get('ids') ?? '').split('|').length).toBeLessThanOrEqual(50);
      expect(url.length).toBeLessThanOrEqual(500);
    }
  });
});
