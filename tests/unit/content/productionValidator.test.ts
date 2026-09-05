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
import { contentEvidenceSchema, serializeEvidence, type ContentEvidence } from '../../../scripts/content/evidence';
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

const approvedReview = {
  reviewer: 'Independent Reviewer',
  reviewedAt: '2026-08-12T11:00:00Z',
  decision: 'approved' as const,
};

const approvedAdultPolicyReview = {
  policy: 'adult-mature-non-graphic-v1' as const,
  reviewer: 'Independent Adult Policy Reviewer',
  reviewedAt: '2026-08-27T13:00:00.000Z',
  decision: 'approved' as const,
  notes: 'Reviewed against the approved mature, factual, non-graphic boundary.',
};

type EvidenceRow = Pick<Row,
  'clue_id' | 'pack_id' | 'response_en' | 'explanation_en' | 'source_title' | 'source_url'
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
    subjectKey: `subject:${row.clue_id}`,
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
    adultPolicyReview: row.pack_id === 'built-in-adult' ? approvedAdultPolicyReview : null,
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
            pack_name: batch.packName,
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
  const rows: Row[] = [];
  for (const [macroTopic, allocation] of Object.entries(FINAL_BATCH.finalTopicAllocations!)) {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (let index = 0; index < allocation[difficulty]; index += 1) {
        const number = rows.length + 1;
        rows.push(boardRow(20_000 + number, 0, {
          clue_id: `final-clue-${number}`,
          category_set_id: `final-set-${number}`,
          pack_id: allocation.packId,
          pack_name: allocation.packName,
          content_kind: 'final',
          round: 'final',
          tier: '0',
          difficulty,
          macro_topic: macroTopic,
          category_name_en: `Final Category ${number}`,
          category_name_et: `Finaalkategooria ${number}`,
        }));
      }
    }
  }
  return rows;
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
  const finalsByPack = new Map<string, Row[]>();
  for (const row of finals) {
    const rows = finalsByPack.get(row.pack_id) ?? [];
    rows.push(row);
    finalsByPack.set(row.pack_id, rows);
  }
  for (const [packId, rows] of finalsByPack) {
    batches.push({ file: `${FINAL_BATCH.id}-${packId}.csv`, rows });
  }
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
  it('defaults older non-Adult evidence to no Adult policy review', () => {
    const row = boardRow(0, 1);
    const olderEvidence: Partial<ContentEvidence> = { ...evidenceFor(row, '01-history') };
    delete olderEvidence.adultPolicyReview;

    expect(contentEvidenceSchema.parse(olderEvidence).adultPolicyReview).toBeNull();
  });

  it('requires approved Adult policy review for Adult board rows', () => {
    const batch = getProductionBatch('14-adult');
    const row = boardBatchRows(batch)[0];
    const result = validateProductionContent([input('adult.csv', [row])], {
      mode: 'batch', batch, evidenceByClueId: evidenceMap([evidenceFor(row, batch.id, { adultPolicyReview: null })]),
    });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'ADULT_POLICY_REVIEW_MISSING', severity: 'error' }),
    ]));
  });

  it('rejects Adult policy review by the evidence author', () => {
    const row = boardBatchRows(getProductionBatch('14-adult'))[0];

    expect(() => contentEvidenceSchema.parse({
      ...evidenceFor(row, '14-adult'),
      adultPolicyReview: { ...approvedAdultPolicyReview, reviewer: 'Content Author' },
    })).toThrow(/author/i);
  });

  it('accepts Adult Final evidence with approved Adult policy review', () => {
    const row = finalBatchRows().find((candidate) => candidate.macro_topic === 'adult')!;
    const result = validateProductionContent([input('adult-final.csv', [row])], {
      mode: 'release',
      evidenceByClueId: evidenceMap([{
        ...evidenceFor(row, '13-finals'), adultPolicyReview: approvedAdultPolicyReview,
      }]),
    });

    expect(result.issues.map((issue) => issue.code)).not.toContain('ADULT_POLICY_REVIEW_MISSING');
  });

  it('does not require Adult policy review for non-Adult clues', () => {
    const batch = getProductionBatch('01-history');
    const row = boardBatchRows(batch)[0];
    const result = validateProductionContent([input('history.csv', [row])], {
      mode: 'batch', batch, evidenceByClueId: evidenceMap([evidenceFor(row, batch.id)]),
    });

    expect(result.issues.map((issue) => issue.code)).not.toContain('ADULT_POLICY_REVIEW_MISSING');
  });

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

  it('rejects a board category whose five clues cover fewer than five primary subjects', () => {
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch);
    const records = rows.map((row, index) => ({
      ...evidenceFor(row, batch.id, {
        origin: index < batch.requiredOpenTdbClues ? 'openTdbInspired' : 'compatibleOpen',
      }),
      subjectKey: index < 5 ? 'subject:shawarma' : `subject:${row.clue_id}`,
    })) as unknown as ContentEvidence[];

    const result = validateProductionContent([input('single-subject-category.csv', rows)], {
      mode: 'batch', batch,
      evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues.map((issue) => issue.code)).toContain('CATEGORY_SUBJECT_DIVERSITY');
  });

  it('treats subject diversity as explicitly non-waivable', () => {
    expect(NON_WAIVABLE_CODES.has('CATEGORY_SUBJECT_DIVERSITY')).toBe(true);
  });

  it('rejects a five-row board category with missing subject keys', () => {
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch).slice(0, 5);
    const records = rows.map((row) => evidenceFor(row, batch.id, { subjectKey: undefined }));

    const result = validateProductionContent([input('missing-subject-keys.csv', rows)], {
      mode: 'batch', batch, evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues.map((issue) => issue.code)).toContain('CATEGORY_SUBJECT_DIVERSITY');
  });

  it('rejects a five-row board category with a repeated subject key', () => {
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch).slice(0, 5);
    const records = rows.map((row, index) => evidenceFor(row, batch.id, {
      subjectKey: index === 4 ? 'subject:history-1' : `subject:history-${index}`,
    }));

    const result = validateProductionContent([input('repeated-subject-key.csv', rows)], {
      mode: 'batch', batch, evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues.map((issue) => issue.code)).toContain('CATEGORY_SUBJECT_DIVERSITY');
  });

  it('accepts a five-row board category with five distinct subject keys', () => {
    const batch = getProductionBatch('01-history');
    const rows = boardBatchRows(batch).slice(0, 5);
    const records = rows.map((row, index) => evidenceFor(row, batch.id, {
      subjectKey: `subject:history-${index}`,
    }));

    const result = validateProductionContent([input('distinct-subject-keys.csv', rows)], {
      mode: 'batch', batch, evidenceByClueId: evidenceMap(records),
    });

    expect(result.issues.map((issue) => issue.code)).not.toContain('CATEGORY_SUBJECT_DIVERSITY');
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
    rows[0] = { ...rows[0], clue_en: 'On August 99, 2026, which country currently has the largest population?' };
    rows[1] = { ...rows[1], clue_en: 'As of August 2026-13, which country currently has the largest population?' };
    rows[2] = { ...rows[2], clue_en: 'As of Auguust 2026, which country currently has the largest population?' };
    rows[3] = { ...rows[3], clue_en: 'As of 08 2026, which country currently has the largest population?' };
    rows[4] = { ...rows[4], clue_en: 'As of August 2026/13, which country currently has the largest population?' };
    rows[5] = { ...rows[5], clue_en: 'As of August 2026.13, which country currently has the largest population?' };
    rows[6] = { ...rows[6], clue_en: 'As of August 2026- 13, which country currently has the largest population?' };
    rows[7] = { ...rows[7], clue_en: 'On February 31, 2026, which country currently has the largest population?' };
    rows[8] = { ...rows[8], clue_en: 'As of 2026-02-31, which country currently has the largest population?' };
    rows[9] = { ...rows[9], clue_en: 'On February 29, 2025, which country currently has the largest population?' };

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

  it('limits changing-fact dates to genuinely current officeholder and population questions', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'Who became the first prime minister of an independent Congo?' };
    rows[1] = { ...rows[1], clue_en: 'What device opens a circuit when too much current flows?' };
    rows[2] = { ...rows[2], clue_en: 'Monks Mound is the largest earthwork at which city?' };
    rows[3] = { ...rows[3], response_en: 'Now You See Me' };
    rows[4] = { ...rows[4], clue_en: 'Who is the current president of Exampleland?' };
    rows[5] = { ...rows[5], clue_en: 'Who is the president of Exampleland?' };
    rows[6] = { ...rows[6], clue_en: 'Which country currently has the largest population?' };
    rows[7] = { ...rows[7], clue_en: 'As of 2026, who is the current president of Exampleland?' };
    rows[8] = { ...rows[8], clue_en: 'Who now leads the company?' };
    rows[9] = { ...rows[9], clue_en: 'Which city now has the largest population?' };
    rows[10] = { ...rows[10], clue_en: 'What nation holds the record today?' };
    rows[11] = { ...rows[11], clue_en: 'Which statue shows a sitting figure?' };
    rows[12] = { ...rows[12], clue_en: 'Who is the actor who plays the president in this film?' };
    rows[13] = { ...rows[13], clue_en: 'Which film is titled Now You See Me?' };
    rows[14] = { ...rows[14], clue_en: 'As of 2026, who now leads the company?' };
    rows[15] = { ...rows[15], clue_en: 'Which country has the largest population?' };
    rows[16] = { ...rows[16], clue_en: 'Which city has the largest population?' };
    rows[17] = { ...rows[17], clue_en: 'Who leads Example Corp now?' };
    rows[18] = { ...rows[18], clue_en: 'What nation holds the record now?' };
    rows[19] = { ...rows[19], clue_en: 'Which newspaper is named USA Today?' };
    rows[20] = { ...rows[20], clue_en: 'What is known today as Zimbabwe?' };
    rows[21] = { ...rows[21], clue_en: 'Which film titled Now is based on a true story?' };
    rows[22] = { ...rows[22], clue_en: 'Which country is the most populous?' };
    rows[23] = { ...rows[23], clue_en: 'What is the most populous country?' };
    rows[24] = { ...rows[24], clue_en: 'Which building is the tallest in the world?' };
    rows[25] = { ...rows[25], clue_en: 'Who holds the world record in the men’s 100 metres?' };
    rows[26] = { ...rows[26], clue_en: 'Who is the world champion?' };
    rows[27] = { ...rows[27], clue_en: 'Which band has a song called Today?' };
    rows[28] = { ...rows[28], clue_en: 'Which artist has an album titled Now?' };
    rows[29] = { ...rows[29], clue_en: 'Which building was once the tallest in the world?' };
    rows[30] = { ...rows[30], clue_en: 'Which architect designed the tallest building in Middle-earth?' };
    rows[31] = { ...rows[31], clue_en: 'Who is the president in the series The West Wing?' };
    rows[32] = { ...rows[32], clue_en: 'Who is the prime minister in this film?' };
    rows[33] = { ...rows[33], clue_en: 'Who is the president in The United States?' };

    const result = validateProductionContent([input('changing-fact-semantics.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'UNDATED_CHANGING_FACT').map((issue) => issue.row)).toEqual([
      6, 7, 8, 10, 11, 12, 17, 18, 19, 20, 24, 25, 26, 27, 28, 35,
    ]);
  });

  it('requires dates to qualify the changing relation rather than an unrelated historical fact', () => {
    const rows = twelveValidSets();
    rows[0] = {
      ...rows[0],
      clue_en: 'Who is the current president of Exampleland?',
      explanation_en: 'The office was created in 1900.',
    };
    rows[1] = {
      ...rows[1],
      clue_en: 'Who is the current president of Exampleland?',
      explanation_en: 'As of 2026, Jane Citizen is the current president.',
    };
    rows[2] = {
      ...rows[2],
      clue_en: 'Founded in 1900, who is currently CEO of Example Corp?',
    };
    rows[3] = {
      ...rows[3],
      clue_en: 'As of 2026, according to the official register, who is the current president?',
    };
    rows[4] = {
      ...rows[4],
      clue_en: 'Who is the president of Exampleland?',
      explanation_en: 'In 2024, Jane Citizen served as president.',
    };
    rows[5] = {
      ...rows[5],
      clue_en: 'Who is the president of Exampleland?',
      explanation_en: 'The presidential palace was built in 1900.',
    };
    rows[6] = {
      ...rows[6],
      clue_en: 'Who is the current president of Exampleland?',
      explanation_en: 'The president works from this office. The palace was built in 1900.',
    };
    rows[7] = {
      ...rows[7],
      clue_en: 'As of August 99, 2026, who is the president of Exampleland?',
    };
    rows[8] = {
      ...rows[8],
      clue_en: 'According to the official register, who is the president of Exampleland?',
    };

    const result = validateProductionContent([input('changing-fact-date-scope.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'UNDATED_CHANGING_FACT').map((issue) => issue.row)).toEqual([
      2, 4, 7, 8, 9, 10,
    ]);
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

  it('normalizes bounded English and Estonian number words without hiding real drift', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'It lasted from the eighth to the fifteenth century.', clue_et: 'See kestis 8.–15. sajandini.' };
    rows[1] = { ...rows[1], clue_en: 'The poem has nineteen lines.', clue_et: 'Luuletusel on 19 rida.' };
    rows[2] = { ...rows[2], response_en: 'The Thirty-Nine Steps', response_et: '39 astet' };
    rows[3] = { ...rows[3], clue_en: 'Who won seven Formula One titles?', clue_et: 'Kes võitis seitse vormel 1 tiitlit?' };
    rows[4] = { ...rows[4], clue_en: 'Examples include type 1 diabetes.', clue_et: 'Näidete hulka kuulub I tüüpi diabeet.' };
    rows[5] = { ...rows[5], clue_en: 'The poem has nineteen lines.', clue_et: 'Luuletusel on 18 rida.' };
    rows[6] = { ...rows[6], clue_en: 'It is a fifth-century work.', clue_et: 'See on 6. sajandi teos.' };
    rows[7] = { ...rows[7], clue_en: 'The mission launched in 1969.', clue_et: 'Missioon käivitati.' };
    rows[8] = {
      ...rows[8],
      response_en: 'Civil Rights Act of 1964',
      response_et: '1964. aasta kodanikuõiguste seadus',
      accepted_variants_en: 'Civil Rights Act;Civil Rights Act of 1964',
      accepted_variants_et: 'kodanikuõiguste seadus',
    };
    rows[9] = { ...rows[9], clue_en: 'The odds were 5,000-to-1.', clue_et: 'Koefitsient oli 5000 : 1.' };
    rows[10] = { ...rows[10], clue_en: 'It became a Top 10 hit.', clue_et: 'Sellest sai esikümnehitt.' };
    rows[11] = { ...rows[11], clue_en: 'The story appears in Exodus.', clue_et: 'Lugu esineb 2. Moosese raamatus.' };
    rows[12] = { ...rows[12], clue_en: 'The route covers more than 100 km.', clue_et: 'Marsruut katab üle saja kilomeetri.' };
    rows[13] = { ...rows[13], clue_en: 'The 2015–16 season was historic.', clue_et: '2015.–2016. aasta hooaeg oli ajalooline.' };
    rows[14] = { ...rows[14], clue_en: 'The score was 2-2.', clue_et: 'Seis oli 2.' };
    rows[15] = { ...rows[15], clue_en: 'This is version 1.', clue_et: 'See on ühendus.' };
    rows[16] = { ...rows[16], clue_en: 'The value is 5.', clue_et: 'See on viisakus.' };
    rows[17] = { ...rows[17], clue_en: 'The value is 6.', clue_et: 'See on kuusk.' };
    rows[18] = { ...rows[18], clue_en: 'The 1999–00 season.', clue_et: '1999.–2000. aasta hooaeg.' };
    rows[19] = { ...rows[19], clue_en: 'The 1999–00 season.', clue_et: '1999.–1900. aasta hooaeg.' };
    rows[20] = { ...rows[20], clue_en: 'This device numbers pages.', clue_et: 'See viitab 4. Moosese raamatule.' };
    rows[21] = { ...rows[21], clue_en: 'One million people attended.', clue_et: 'Kohal oli 1 inimene.' };
    rows[22] = { ...rows[22], clue_en: 'One hundred thousand people attended.', clue_et: 'Kohal oli 100 inimest.' };
    rows[23] = { ...rows[23], clue_en: '100 people attended.', clue_et: 'Kohal oli sada tuhat inimest.' };
    rows[24] = { ...rows[24], clue_en: 'The route is one hundred kilometres long.', clue_et: 'Marsruut on 100 km pikk.' };
    rows[25] = { ...rows[25], clue_en: 'Version 2026-02 was released.', clue_et: 'Versioon 2026-2102 ilmus.' };
    rows[26] = { ...rows[26], clue_en: 'The route is one hundred metres long.', clue_et: 'Marsruut on 100 m pikk.' };
    rows[27] = { ...rows[27], clue_en: 'The route is 100 m long.', clue_et: 'Marsruut on sada meetrit pikk.' };
    rows[28] = { ...rows[28], clue_en: 'The distance is 8 m.', clue_et: 'Kogus on kaheksa liitrit.' };
    rows[29] = { ...rows[29], clue_en: 'The distance is 8 km.', clue_et: 'Vahemaa on kaheksa meetrit.' };
    rows[30] = { ...rows[30], clue_en: 'The result was 100 percent.', clue_et: 'Tulemus oli 100%.' };
    rows[31] = { ...rows[31], clue_en: 'The route is 100 kilometres long.', clue_et: 'Marsruut on 100 km pikk.' };
    rows[32] = { ...rows[32], clue_en: 'The samples were 100 m and 5 g.', clue_et: 'Proovid olid sada grammi ja viis meetrit.' };
    rows[33] = { ...rows[33], clue_en: 'The totals were 100 km and 5 l.', clue_et: 'Kogused olid sada liitrit ja viis kilomeetrit.' };
    rows[34] = { ...rows[34], clue_en: 'The answer was one. Metres are the unit.', clue_et: 'Vastus oli 1. Ühik on meeter.' };
    rows[35] = { ...rows[35], clue_en: 'He won the 400-metre race.', clue_et: 'Ta võitis 400 meetri jooksu.' };
    rows[36] = { ...rows[36], clue_en: 'The dance is in lively 2/4 metre.', clue_et: 'Tants on elavas 2/4-taktis.' };
    rows[37] = { ...rows[37], clue_en: 'The result was 52 to 48 percent.', clue_et: 'Tulemus oli 52 protsendiga 48 vastu.' };
    rows[38] = { ...rows[38], clue_en: 'The result was 50.58 percent to 49.42 percent.', clue_et: 'Tulemus oli 50,58 protsenti 49,42 vastu.' };
    rows[39] = { ...rows[39], clue_en: 'The result was 52 to 48 percent.', clue_et: 'Tulemus oli 52 protsendiga 47 vastu.' };
    rows[40] = { ...rows[40], clue_en: 'The margin was one percentage point.', clue_et: 'Vahe oli ühe protsendipunktine.' };
    rows[41] = { ...rows[41], clue_en: 'The margin was one percentage point.', clue_et: 'Vahe oli üks protsent.' };
    rows[42] = { ...rows[42], clue_en: 'The margin was one percent.', clue_et: 'Vahe oli üks protsendipunkt.' };
    rows[43] = { ...rows[43], clue_en: 'It was a one-percentage-point lead.', clue_et: 'See oli ühe protsendipunktine edu.' };
    rows[44] = { ...rows[44], clue_en: 'It was a 1-percentage-point lead.', clue_et: 'See oli 1 protsendipunktine edu.' };

    const result = validateProductionContent([input('localized-number-words.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'NUMBER_DRIFT').map((issue) => issue.row)).toEqual([
      7, 8, 9, 16, 17, 18, 19, 21, 22, 23, 24, 25, 27, 30, 31, 34, 35, 41, 43, 44,
    ]);
  });

  it('compares numeric facts across canonical responses and accepted-variant families', () => {
    const rows = twelveValidSets();
    rows[0] = {
      ...rows[0],
      response_en: 'Apollo 11',
      response_et: 'Apollo 11',
      accepted_variants_en: 'Moon mission',
      accepted_variants_et: 'Apollo 12',
    };
    rows[1] = {
      ...rows[1],
      response_en: 'Civil Rights Act of 1964',
      response_et: '1964. aasta kodanikuõiguste seadus',
      accepted_variants_en: 'Civil Rights Act;Civil Rights Act of 1964',
      accepted_variants_et: 'kodanikuõiguste seadus',
    };
    rows[2] = {
      ...rows[2], response_en: 'length', response_et: 'pikkus',
      accepted_variants_en: '8 m', accepted_variants_et: '8 l',
    };
    rows[3] = {
      ...rows[3], response_en: 'offset', response_et: 'nihe',
      accepted_variants_en: '-5', accepted_variants_et: '5',
    };
    rows[4] = {
      ...rows[4], response_en: 'mission', response_et: 'missioon',
      accepted_variants_en: 'mission launched in 1969', accepted_variants_et: 'kuumissioon',
    };
    rows[5] = {
      ...rows[5], response_en: 'draw', response_et: 'viik',
      accepted_variants_en: '2-2 draw', accepted_variants_et: '2 viik',
    };
    rows[6] = {
      ...rows[6], response_en: 'mission', response_et: 'missioon',
      accepted_variants_en: 'Apollo 11 (1969)', accepted_variants_et: 'Apollo 11',
    };
    rows[7] = {
      ...rows[7], response_en: 'Apollo 11', response_et: 'Apollo',
      accepted_variants_en: 'Apollo', accepted_variants_et: 'Apollo 11;Apollo 11',
    };
    rows[8] = {
      ...rows[8], response_en: 'one hundred metres', response_et: 'sada meetrit',
    };
    rows[9] = {
      ...rows[9], response_en: 'one percent', response_et: 'üks protsendipunkt',
    };
    rows[10] = {
      ...rows[10], response_en: 'one hundred metres', response_et: 'sada liitrit',
    };
    rows[11] = {
      ...rows[11], response_en: 'fourteen grammatical cases', response_et: 'neliteist käänet',
      accepted_variants_en: 'fourteen cases;14 cases', accepted_variants_et: 'neliteist;14',
    };

    const result = validateProductionContent([input('accepted-variant-numbers.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'NUMBER_DRIFT').map((issue) => issue.row)).toEqual([
      2, 4, 5, 6, 7, 8, 11, 12,
    ]);
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

    const validResult = validate(rows);
    const validCodes = validResult.issues.map((issue) => issue.code);
    expect(validResult.blocking).toBe(false);
    expect(validCodes).not.toEqual(expect.arrayContaining([
      'CSV_MULTIPLE_PACK_ID', 'CSV_INCONSISTENT_PACK_NAME',
    ]));
    expect(validCodes).not.toEqual(expect.arrayContaining(['BATCH_ALLOCATION', 'OPENTDB_COMPOSITION']));
    expect(validCodes).not.toContain('MATCH_CATEGORY_NAMES_SHORTAGE');

    const invalidFamilies = rows.map((row) => ({ ...row }));
    const otherTopic = rows.findIndex((row) => row.macro_topic !== FINAL_BATCH.subthemes[0]);
    invalidFamilies[otherTopic] = { ...invalidFamilies[otherTopic], macro_topic: FINAL_BATCH.subthemes[0] };
    expect(validate(invalidFamilies).issues.map((issue) => issue.code)).toContain('BATCH_ALLOCATION');

    const adultFinal = rows.findIndex((row) => row.macro_topic === 'adult');
    const invalidAdultPack = rows.map((row) => ({ ...row }));
    invalidAdultPack[adultFinal] = { ...invalidAdultPack[adultFinal], pack_id: 'built-in-finals', pack_name: 'Finals Pack' };
    expect(validate(invalidAdultPack).issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'CSV_MULTIPLE_PACK_ID', 'CSV_INCONSISTENT_PACK_NAME', 'BATCH_ALLOCATION',
    ]));

    const invalidDifficulty = rows.map((row) => ({ ...row }));
    invalidDifficulty[adultFinal] = { ...invalidDifficulty[adultFinal], difficulty: 'hard' };
    expect(validate(invalidDifficulty).issues.map((issue) => issue.code)).toContain('BATCH_ALLOCATION');

    const records = rows.map((row, index) => evidenceFor(row, FINAL_BATCH.id, {
      origin: index === 0 ? 'openTdbInspired' : 'compatibleOpen',
    }));
    expect(validate(rows, records).issues.map((issue) => issue.code)).toContain('OPENTDB_COMPOSITION');
  });

  it('resolves Final evidence through the Final batch even when its pack belongs to Adult', () => {
    const adultFinal = finalBatchRows().filter((row) => row.macro_topic === 'adult');
    const wrongBatch = validateProductionContent([input('adult-finals.csv', adultFinal)], {
      mode: 'release', evidenceByClueId: evidenceMap(adultFinal.map((row) => evidenceFor(row, '14-adult'))),
    });
    const finalBatch = validateProductionContent([input('adult-finals.csv', adultFinal)], {
      mode: 'release', evidenceByClueId: evidenceMap(adultFinal.map((row) => evidenceFor(row, '13-finals'))),
    });

    expect(wrongBatch.issues.map((issue) => issue.code)).toContain('SOURCE_MISMATCH');
    expect(finalBatch.issues.map((issue) => issue.code)).not.toContain('SOURCE_MISMATCH');
  });

  it('requires a stable pack name for every pack ID', () => {
    const batch = getProductionBatch('14-adult');
    const rows = boardBatchRows(batch);
    const mismatched = rows.map((row) => ({ ...row }));
    mismatched[0] = { ...mismatched[0], pack_name: 'Different Adult Pack' };

    const result = validateProductionContent([input('adult.csv', mismatched)], { mode: 'batch', batch });

    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'CSV_INCONSISTENT_PACK_NAME', 'PACK_IDENTITY_MISMATCH',
    ]));
  });

  it('exports every factual, source, duplicate, allocation, and filler code as non-waivable', () => {
    expect([...NON_WAIVABLE_CODES]).toEqual(expect.arrayContaining([
      'MISSING_EVIDENCE', 'SOURCE_MISMATCH', 'GENERIC_SOURCE', 'DUPLICATE_FACT',
      'NEAR_DUPLICATE_CLUE', 'BOARD_FINAL_FACT_REUSE', 'SUBTHEME_LIMIT',
      'BATCH_ALLOCATION', 'PACK_IDENTITY_MISMATCH', 'OPENTDB_COMPOSITION', 'PLACEHOLDER_CONTENT',
      'ADULT_POLICY_REVIEW_MISSING',
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
      'RELEASE_BUILT_IN_PACKS_SHORTAGE',
    ]));
  });

  it('emits excess inventory codes for a unique extra board category set', () => {
    const corpus = releaseCorpus();
    const batch = getProductionBatch('01-history');
    const extra = boardBatchRows(batch, 200).slice(0, 5).map((row) => ({
      ...row,
      clue_id: `extra-${row.clue_id}`,
      category_set_id: 'extra-category-set',
      category_name_en: 'Extra category',
      category_name_et: 'Lisakategooria',
    }));
    corpus.batches[0].rows.push(...extra);
    const evidence = [...corpus.evidence.values(), ...extra.map((row) => evidenceFor(row, batch.id))];

    const result = validateProductionContent(releaseInputs(corpus), { mode: 'release', evidenceByClueId: evidenceMap(evidence) });

    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'RELEASE_BOARD_CLUES_EXCESS', 'RELEASE_CATEGORY_SETS_EXCESS',
    ]));
  });

  it('emits each difficulty and round set shortage independently', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (const round of ['round-one', 'round-two'] as const) {
        const corpus = releaseCorpus();
        const batch = corpus.batches.find((candidate) => candidate.rows.some((row) => row.difficulty === difficulty && row.round === round))!;
        const index = batch.rows.findIndex((row) => row.difficulty === difficulty && row.round === round);
        batch.rows.splice(index, 1);

        const result = validateProductionContent(releaseInputs(corpus), { mode: 'release', evidenceByClueId: corpus.evidence });

        expect(result.issues.map((issue) => issue.code)).toContain(
          `RELEASE_${difficulty.toUpperCase()}_${round === 'round-one' ? 'ROUND_ONE' : 'ROUND_TWO'}_SETS_SHORTAGE`,
        );
      }
    }
  }, 60_000);

  it('summarizes an exact valid 7000/1400/174 inventory efficiently', () => {
    const corpus = releaseCorpus();

    const result = validateProductionContent(releaseInputs(corpus), {
      mode: 'release', evidenceByClueId: corpus.evidence,
    });

    expect(result.summary).toEqual({
      boardClues: 7_000, categorySets: 1_400, distinctCategoryNames: 1_400,
      finalClues: 174, easySets: 467, mediumSets: 467, hardSets: 466, builtInPacks: 15,
    });
    expect(Object.fromEntries(['easy', 'medium', 'hard'].map((difficulty) => [difficulty,
      corpus.batches.flatMap((batch) => batch.rows).filter((row) => row.content_kind === 'board' && row.difficulty === difficulty).length,
    ]))).toEqual({ easy: 2_335, medium: 2_335, hard: 2_330 });
    expect(Object.fromEntries(['easy', 'medium', 'hard'].map((difficulty) => [difficulty,
      Object.fromEntries(['round-one', 'round-two'].map((round) => [round,
        corpus.batches.flatMap((batch) => batch.rows).filter((row) => row.content_kind === 'board'
          && row.difficulty === difficulty && row.round === round).length / 5,
      ])),
    ]))).toEqual({
      easy: { 'round-one': 234, 'round-two': 233 },
      medium: { 'round-one': 233, 'round-two': 234 },
      hard: { 'round-one': 233, 'round-two': 233 },
    });
    expect(Object.fromEntries(['easy', 'medium', 'hard'].map((difficulty) => [difficulty,
      corpus.batches.flatMap((batch) => batch.rows).filter((row) => row.content_kind === 'final' && row.difficulty === difficulty).length,
    ]))).toEqual({ easy: 58, medium: 58, hard: 58 });
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
  }, 20_000);

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
      boardClues: 7_000, categorySets: 1_400, distinctCategoryNames: 1_400,
      finalClues: 174, easySets: 467, mediumSets: 467, hardSets: 466, builtInPacks: 15,
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

  it('rejects malformed, non-HTTPS, credentialed, archive, localhost, private DNS, and redirect targets', async () => {
    const neverFetch = async () => { throw new Error('fetch should not run'); };
    const direct = await checkSourceUrls([
      'not a URL', 'http://example.com', 'https://u:p@example.com', 'https://j-archive.com/showgame.php?game_id=1',
      'https://localhost/source',
    ], dependencies(neverFetch));
    expect(Object.fromEntries(direct.map((result) => [result.url, result.code]))).toEqual({
      'not a URL': 'SOURCE_URL_INVALID',
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

  it('allows public IPv4 neighbours while rejecting the exact reserved documentation ranges', async () => {
    const reachable = dependencies(async () => ({ status: 204, headers: new Headers() }));
    reachable.resolveHostname = async () => ['192.0.66.16'];
    expect((await checkSourceUrls(['https://public.example/source'], reachable))[0]).toMatchObject({ ok: true, status: 204 });

    for (const address of ['192.0.0.1', '192.0.2.1', '198.51.100.1', '203.0.113.1']) {
      const reserved = dependencies(async () => { throw new Error('fetch should not run'); });
      reserved.resolveHostname = async () => [address];
      expect((await checkSourceUrls(['https://reserved.example/source'], reserved))[0].code).toBe('SOURCE_PRIVATE_ADDRESS');
    }
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

  it.each([
    ['absent', new Headers()],
    ['blank', new Headers({ 'retry-after': '' })],
  ])('uses exponential fallback when Retry-After is %s', async (_label, headers) => {
    let attempts = 0;
    const sleeps: number[] = [];
    const deps = dependencies(async () => {
      attempts += 1;
      return { status: attempts < 3 ? 429 : 204, headers };
    });
    deps.sleep = async (milliseconds) => { sleeps.push(milliseconds); };

    const [result] = await checkSourceUrls(['https://example.com/source'], deps, {
      concurrency: 1, maxAttempts: 3, initialBackoffMs: 250,
    });

    expect(result.ok).toBe(true);
    expect(sleeps).toEqual([250, 500]);
  });

  it('honors numeric and IMF-date Retry-After values', async () => {
    let attempts = 0;
    const sleeps: number[] = [];
    const deps = dependencies(async () => {
      attempts += 1;
      const retryAfter = attempts === 1 ? '1' : 'Wed, 12 Aug 2026 12:00:03 GMT';
      return { status: attempts < 3 ? 429 : 204, headers: new Headers({ 'retry-after': retryAfter }) };
    });
    deps.sleep = async (milliseconds) => { sleeps.push(milliseconds); };

    const [result] = await checkSourceUrls(['https://example.com/source'], deps, {
      concurrency: 1, maxAttempts: 3, initialBackoffMs: 250,
    });

    expect(result.ok).toBe(true);
    expect(sleeps).toEqual([1_000, 3_000]);
  });

  it('holds a host through terminal 429 cooldown without sleeping after terminal 5xx', async () => {
    const firstUrl = 'https://rate.example/first';
    const secondUrl = 'https://rate.example/second';
    const serverErrorUrl = 'https://server.example/failure';
    const events: string[] = [];
    let markCooldownStarted!: () => void;
    let releaseCooldown!: () => void;
    const cooldownStarted = new Promise<void>((resolvePromise) => { markCooldownStarted = resolvePromise; });
    const holdCooldown = new Promise<void>((resolvePromise) => { releaseCooldown = resolvePromise; });
    const deps = dependencies(async (url) => {
      events.push(`fetch:${url}`);
      if (url === firstUrl) return { status: 429, headers: new Headers({ 'retry-after': '1' }) };
      if (url === serverErrorUrl) return { status: 503, headers: new Headers() };
      return { status: 204, headers: new Headers() };
    });
    deps.sleep = async (milliseconds) => {
      events.push(`sleep:${milliseconds}`);
      markCooldownStarted();
      await holdCooldown;
    };

    const checking = checkSourceUrls([secondUrl, firstUrl], deps, {
      concurrency: 2, maxAttempts: 1, initialBackoffMs: 250,
    });
    const boundary = await Promise.race([
      cooldownStarted.then(() => 'cooldown' as const),
      checking.then(() => 'completed' as const),
    ]);
    releaseCooldown();
    const results = await checking;
    const [serverError] = await checkSourceUrls([serverErrorUrl], deps, { maxAttempts: 1 });

    expect(boundary).toBe('cooldown');
    expect(events).toEqual([
      `fetch:${firstUrl}`,
      'sleep:1000',
      `fetch:${secondUrl}`,
      `fetch:${serverErrorUrl}`,
    ]);
    expect([...results, serverError].map(({ url, status }) => ({ url, status }))).toEqual([
      { url: firstUrl, status: 429 },
      { url: secondUrl, status: 204 },
      { url: serverErrorUrl, status: 503 },
    ]);
  });

  it('contains malformed redirect locations as sorted per-URL request failures', async () => {
    const goodUrl = 'https://a.example/source';
    const malformedRedirectUrl = 'https://b.example/source';
    let malformedAttempts = 0;
    const sleeps: number[] = [];
    const deps = dependencies(async (url) => {
      if (url === malformedRedirectUrl) {
        malformedAttempts += 1;
        return { status: 302, headers: new Headers({ location: 'https://[::1' }) };
      }
      return { status: 204, headers: new Headers() };
    });
    deps.sleep = async (milliseconds) => { sleeps.push(milliseconds); };

    const results = await checkSourceUrls([malformedRedirectUrl, goodUrl], deps, {
      concurrency: 2, maxAttempts: 2, initialBackoffMs: 250,
    });

    expect(malformedAttempts).toBe(2);
    expect(sleeps).toEqual([250]);
    expect(results.map((result) => result.url)).toEqual([goodUrl, malformedRedirectUrl]);
    expect(results[1]).toEqual({
      url: malformedRedirectUrl,
      ok: false,
      status: 302,
      retrievedAt: null,
      code: 'SOURCE_REQUEST_FAILED',
      finalUrl: malformedRedirectUrl,
    });
  });

  it('serializes same-host checks while allowing cross-host concurrency and preserving output order', async () => {
    const firstAUrl = 'https://a.example/one';
    const secondAUrl = 'https://a.example/two';
    const bUrl = 'https://b.example/one';
    let releaseFirstA!: () => void;
    let markFirstAStarted!: () => void;
    let markBStarted!: () => void;
    const holdFirstA = new Promise<void>((resolvePromise) => { releaseFirstA = resolvePromise; });
    const firstAStarted = new Promise<void>((resolvePromise) => { markFirstAStarted = resolvePromise; });
    const bStarted = new Promise<void>((resolvePromise) => { markBStarted = resolvePromise; });
    const activeByHost = new Map<string, number>();
    const maximumByHost = new Map<string, number>();
    const started: string[] = [];
    let crossHostOverlap = false;
    const deps = dependencies(async (url) => {
      const host = new URL(url).hostname;
      const active = (activeByHost.get(host) ?? 0) + 1;
      activeByHost.set(host, active);
      maximumByHost.set(host, Math.max(maximumByHost.get(host) ?? 0, active));
      crossHostOverlap ||= [...activeByHost.values()].filter((count) => count > 0).length > 1;
      started.push(url);
      try {
        if (url === firstAUrl) {
          markFirstAStarted();
          await holdFirstA;
        } else if (url === bUrl) {
          markBStarted();
        }
        return { status: 204, headers: new Headers() };
      } finally {
        activeByHost.set(host, active - 1);
      }
    });

    const checking = checkSourceUrls([bUrl, secondAUrl, firstAUrl], deps, {
      concurrency: 3, maxAttempts: 1,
    });
    await Promise.all([firstAStarted, bStarted]);
    const secondAStartedBeforeRelease = started.includes(secondAUrl);
    releaseFirstA();
    const results = await checking;

    expect(secondAStartedBeforeRelease).toBe(false);
    expect(maximumByHost.get('a.example')).toBe(1);
    expect(crossHostOverlap).toBe(true);
    expect(results.map((result) => result.url)).toEqual([firstAUrl, secondAUrl, bUrl]);
  });

  it('serializes redirect targets shared by different origins while an unrelated host overlaps', async () => {
    const firstOrigin = 'https://a.example/start';
    const secondOrigin = 'https://b.example/start';
    const unrelatedUrl = 'https://z.example/source';
    const firstTarget = 'https://shared.example/first';
    const secondTarget = 'https://shared.example/second';
    let markFirstTargetStarted!: () => void;
    let markUnrelatedStarted!: () => void;
    let releaseFirstTarget!: () => void;
    const firstTargetStarted = new Promise<void>((resolvePromise) => { markFirstTargetStarted = resolvePromise; });
    const unrelatedStarted = new Promise<void>((resolvePromise) => { markUnrelatedStarted = resolvePromise; });
    const holdFirstTarget = new Promise<void>((resolvePromise) => { releaseFirstTarget = resolvePromise; });
    const validationCounts = new Map<string, number>();
    let unrelatedActive = false;
    let activeShared = 0;
    let maximumShared = 0;
    let sharedAndUnrelatedOverlap = false;
    let secondTargetEntered = false;
    const deps = dependencies(async (url) => {
      if (url === firstOrigin) return { status: 302, headers: new Headers({ location: firstTarget }) };
      if (url === secondOrigin) {
        await firstTargetStarted;
        return { status: 302, headers: new Headers({ location: secondTarget }) };
      }
      if (url === unrelatedUrl) {
        unrelatedActive = true;
        markUnrelatedStarted();
        await firstTargetStarted;
        sharedAndUnrelatedOverlap ||= activeShared > 0;
        unrelatedActive = false;
        return { status: 204, headers: new Headers() };
      }
      activeShared += 1;
      maximumShared = Math.max(maximumShared, activeShared);
      sharedAndUnrelatedOverlap ||= unrelatedActive;
      try {
        if (url === firstTarget) {
          markFirstTargetStarted();
          await holdFirstTarget;
        } else secondTargetEntered = true;
        return { status: 204, headers: new Headers() };
      } finally {
        activeShared -= 1;
      }
    });
    deps.resolveHostname = async (hostname) => {
      validationCounts.set(hostname, (validationCounts.get(hostname) ?? 0) + 1);
      return ['93.184.216.34'];
    };

    const checking = checkSourceUrls([unrelatedUrl, secondOrigin, firstOrigin], deps, {
      concurrency: 3, maxAttempts: 1,
    });
    await Promise.all([firstTargetStarted, unrelatedStarted]);
    await new Promise<void>((resolvePromise) => { setImmediate(resolvePromise); });
    const secondTargetStartedBeforeRelease = secondTargetEntered;
    releaseFirstTarget();
    const results = await checking;

    expect(secondTargetStartedBeforeRelease).toBe(false);
    expect(maximumShared).toBe(1);
    expect(sharedAndUnrelatedOverlap).toBe(true);
    expect(validationCounts.get('shared.example')).toBe(2);
    expect(results.map((result) => result.url)).toEqual([firstOrigin, secondOrigin, unrelatedUrl]);
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
