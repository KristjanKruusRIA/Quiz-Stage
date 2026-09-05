import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  applyEasyExpansion,
  serializeEasyExpansionRows,
  type EasyExpansionCollisionCorpus,
  type EasyExpansionCsvRow,
} from '../../../scripts/content/easyExpansion/apply';
import {
  parseEasyExpansionBaselineManifest,
  type EasyExpansionBaselineManifest,
} from '../../../scripts/content/easyExpansion/createBaselineManifest';
import type { EasyExpansionCategory } from '../../../scripts/content/easyExpansion/types';
import {
  parseEvidenceJsonl,
  serializeEvidence,
  type ContentEvidence,
} from '../../../scripts/content/evidence';
import {
  acceptedBatchPaths,
  FINAL_BATCH,
  getProductionBatch,
  PRODUCTION_BATCHES,
} from '../../../scripts/content/productionBatches';
import { parsePackCsv } from '../../../src/main/content/csvPacks';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';

const HISTORY = getProductionBatch('01-history');
const SUBJECTS = ['atlas', 'beacon', 'comet', 'delta', 'ember'] as const;
const HISTORY_EXPANSION_TOPICS = [
  'ancient', 'ancient',
  'archaeological', 'archaeological',
  'cultural', 'cultural',
  'early-modern', 'early-modern',
  'economic', 'economic',
  'medieval', 'medieval',
  'military',
  'political', 'political',
  'social', 'social', 'social', 'social', 'social',
] as const;

type Fixture = Readonly<{
  authoredRows: readonly EasyExpansionCsvRow[];
  generatedRows: readonly EasyExpansionCsvRow[];
  evidence: readonly ContentEvidence[];
  baseline: EasyExpansionBaselineManifest;
  collisionCorpus: EasyExpansionCollisionCorpus;
}>;

function readRows(path: string): readonly EasyExpansionCsvRow[] {
  return parsePackCsv(readFileSync(resolve(path), 'utf8')).rows.map((row) => Object.freeze(
    Object.fromEntries(CSV_COLUMNS.map((column) => [column, row[column]])),
  ) as EasyExpansionCsvRow);
}

function readEvidence(path: string): readonly ContentEvidence[] {
  return [...parseEvidenceJsonl(readFileSync(resolve(path), 'utf8'), path).values()];
}

function category(index: number): EasyExpansionCategory {
  const token = String.fromCharCode('a'.charCodeAt(0) + index);
  return Object.freeze({
    categorySetId: `${HISTORY.packId}-set-${101 + index}`,
    batchId: HISTORY.id,
    packId: HISTORY.packId,
    difficulty: 'easy',
    round: index < 10 ? 'round-one' : 'round-two',
    macroTopic: HISTORY_EXPANSION_TOPICS[index]!,
    name: Object.freeze({
      en: `Familiar History ${token.toUpperCase()}`,
      et: `Tuttav ajalugu ${token.toUpperCase()}`,
    }),
    questions: Object.freeze(SUBJECTS.map((subject, questionIndex) => {
      const tier = (questionIndex + 1) as 1 | 2 | 3 | 4 | 5;
      return Object.freeze({
        clueId: `${HISTORY.packId}-easy-expansion-${(index * 5 + tier).toString().padStart(3, '0')}`,
        key: `history-expansion-${token}-${subject}`,
        factKey: `history:easy-expansion:${token}:${subject}`,
        tier,
        subjectKey: `history-expansion:${token}-${subject}`,
        clue: Object.freeze({
          en: `Identify the familiar historical subject marked ${token.toUpperCase()}-${tier}.`,
          et: `Nimeta tuttav ajalooteema, mille tähis on ${token.toUpperCase()}-${tier}.`,
        }),
        response: Object.freeze({
          en: `${subject} response ${token.toUpperCase()}`,
          et: `${subject} vastus ${token.toUpperCase()}`,
        }),
        acceptedVariants: Object.freeze({ en: Object.freeze([]), et: Object.freeze([]) }),
        explanation: Object.freeze({
          en: `The documented context identifies ${subject} response ${token.toUpperCase()}.`,
          et: `Dokumenteeritud taust osutab vastusele ${subject} vastus ${token.toUpperCase()}.`,
        }),
        source: Object.freeze({
          sourceId: `history-expansion-source-${token}-${subject}`,
          title: `History reference ${token.toUpperCase()} ${subject}`,
          url: `https://example.com/history/${token}/${subject}`,
          license: 'CC-BY-4.0',
          retrievedAt: '2026-09-06',
        }),
      });
    })),
  });
}

function bank(): readonly EasyExpansionCategory[] {
  return Object.freeze(Array.from({ length: 20 }, (_, index) => category(index)));
}

function acceptedOtherPhaseBCategory(categoryIndex = 0): EasyExpansionCategory {
  const geography = getProductionBatch('02-geography');
  const token = String.fromCharCode('A'.charCodeAt(0) + categoryIndex);
  return Object.freeze({
    ...category(0),
    categorySetId: `${geography.packId}-set-${101 + categoryIndex}`,
    batchId: geography.id,
    packId: geography.packId,
    round: categoryIndex < 10 ? 'round-one' : 'round-two',
    macroTopic: geography.subthemes[0]!,
    name: Object.freeze({
      en: `Familiar World Maps ${token}`,
      et: `Tuttavad maailmakaardid ${token}`,
    }),
    questions: Object.freeze(SUBJECTS.map((subject, index) => {
      const tier = (index + 1) as 1 | 2 | 3 | 4 | 5;
      return Object.freeze({
        ...category(0).questions[index]!,
        clueId: `${geography.packId}-easy-expansion-${String(categoryIndex * 5 + tier).padStart(3, '0')}`,
        key: `geography-accepted-${token}-${subject}`,
        factKey: `geography:accepted:${token}:${subject}`,
        subjectKey: `geography-accepted:${token}:${subject}`,
        clue: Object.freeze({
          en: `Identify the familiar mapped place marked ${token}-${tier}.`,
          et: `Nimeta tuttav kaardikoht tähisega ${token}-${tier}.`,
        }),
        response: Object.freeze({
          en: `map answer ${token} ${subject}`,
          et: `kaardivastus ${token} ${subject}`,
        }),
        explanation: Object.freeze({
          en: `The mapped context identifies map answer ${token} ${subject}.`,
          et: `Kaardikontekst osutab vastusele kaardivastus ${token} ${subject}.`,
        }),
        source: Object.freeze({
          sourceId: `geography-accepted-source-${token}-${subject}`,
          title: `Geography reference ${token} ${subject}`,
          url: `https://example.com/geography/${token}/${subject}`,
          license: 'CC-BY-4.0',
          retrievedAt: '2026-09-06',
        }),
      });
    })),
  });
}

function acceptedPhaseBRow(
  categoryValue: EasyExpansionCategory,
  question: EasyExpansionCategory['questions'][number],
): EasyExpansionCsvRow {
  const batchValue = getProductionBatch(categoryValue.batchId);
  const values = {
    clue_id: question.clueId,
    pack_id: batchValue.packId,
    pack_name: batchValue.packName,
    category_set_id: categoryValue.categorySetId,
    content_kind: 'board',
    round: categoryValue.round,
    tier: String(question.tier),
    difficulty: 'easy',
    macro_topic: categoryValue.macroTopic,
    category_name_en: categoryValue.name.en,
    category_name_et: categoryValue.name.et,
    clue_en: question.clue.en,
    clue_et: question.clue.et,
    response_en: question.response.en,
    response_et: question.response.et,
    accepted_variants_en: '',
    accepted_variants_et: '',
    explanation_en: question.explanation.en,
    explanation_et: question.explanation.et,
    source_title: question.source.title,
    source_url: question.source.url,
    source_license: question.source.license,
    source_retrieved_at: question.source.retrievedAt,
    translation_status: 'reviewed',
    enabled: 'true',
  } as const;
  return Object.freeze(Object.fromEntries(
    CSV_COLUMNS.map((column) => [column, values[column]]),
  ) as Record<(typeof CSV_COLUMNS)[number], string>);
}

function acceptedPhaseBEvidence(
  categoryValue: EasyExpansionCategory,
  question: EasyExpansionCategory['questions'][number],
): ContentEvidence {
  return {
    version: 1,
    clueId: question.clueId,
    batchId: categoryValue.batchId,
    factKey: question.factKey,
    subjectKey: question.subjectKey,
    assertion: `${question.response.en} — ${question.explanation.en}`,
    origin: 'compatibleOpen',
    authoring: { author: 'Codex Easy Expansion Author', authoredAt: '2026-09-06T08:00:00.000Z' },
    supportingSource: question.source,
    inspiration: null,
    factualReview: {
      reviewer: 'Codex Easy Expansion Factual Reviewer',
      reviewedAt: '2026-09-06T09:00:00.000Z',
      decision: 'approved',
    },
    editorialReview: {
      reviewer: 'Codex Easy Expansion Editorial Reviewer',
      reviewedAt: '2026-09-06T10:00:00.000Z',
      decision: 'approved',
    },
    translationReview: {
      reviewer: 'Codex Easy Expansion Translation Reviewer',
      reviewedAt: '2026-09-06T11:00:00.000Z',
      decision: 'approved',
    },
    adultPolicyReview: null,
  };
}

function changedRow(
  rows: readonly EasyExpansionCsvRow[],
  clueId: string,
  patch: Partial<Record<(typeof CSV_COLUMNS)[number], string>>,
): readonly EasyExpansionCsvRow[] {
  return rows.map((row) => row.clue_id === clueId ? { ...row, ...patch } : row);
}

function withoutClue<T extends { clueId?: string; clue_id?: string }>(
  records: readonly T[],
  clueId: string,
): readonly T[] {
  return records.filter((record) => (record.clueId ?? record.clue_id) !== clueId);
}

describe('applyEasyExpansion', () => {
  let fixture: Fixture;

  beforeAll(() => {
    const historyPaths = acceptedBatchPaths(HISTORY.id);
    const batches = [...PRODUCTION_BATCHES, FINAL_BATCH];
    fixture = {
      authoredRows: readRows(historyPaths.authored),
      generatedRows: readRows(historyPaths.generated),
      evidence: readEvidence(historyPaths.evidence),
      baseline: parseEasyExpansionBaselineManifest(readFileSync(
        resolve('content/reports/easy-expansion-baseline-record-hashes.json'),
        'utf8',
      )),
      collisionCorpus: {
        rows: batches.flatMap(({ id }) => readRows(acceptedBatchPaths(id).generated)),
        evidence: batches.flatMap(({ id }) => readEvidence(acceptedBatchPaths(id).evidence)),
        phaseB: [],
      },
    };
  });

  const project = (overrides: Partial<Parameters<typeof applyEasyExpansion>[0]> = {}) => (
    applyEasyExpansion({
      batchId: HISTORY.id,
      authoredRows: fixture.authoredRows,
      generatedRows: fixture.generatedRows,
      evidence: fixture.evidence,
      categories: bank(),
      baseline: fixture.baseline,
      collisionCorpus: fixture.collisionCorpus,
      ...overrides,
    })
  );

  it('projects one original pack from 500/100 to 600/120 with exact Easy additions', () => {
    const result = project();
    const addedGenerated = result.generatedRows.filter(({ clue_id }) => (
      clue_id.includes('-easy-expansion-')
    ));

    expect(result.authoredRows).toHaveLength(600);
    expect(result.generatedRows).toHaveLength(600);
    expect(result.evidence).toHaveLength(600);
    expect(new Set(result.generatedRows.map(({ category_set_id }) => category_set_id))).toHaveLength(120);
    expect(addedGenerated).toHaveLength(100);
    expect(addedGenerated.filter(({ round }) => round === 'round-one')).toHaveLength(50);
    expect(addedGenerated.filter(({ round }) => round === 'round-two')).toHaveLength(50);
    expect(new Set(addedGenerated.map(({ category_set_id }) => category_set_id))).toHaveLength(20);
    expect(addedGenerated.every(({ difficulty }) => difficulty === 'easy')).toBe(true);
    expect(result.expansionClueIds).toEqual(
      Array.from({ length: 100 }, (_, index) => `${HISTORY.packId}-easy-expansion-${String(index + 1).padStart(3, '0')}`),
    );
    expect(result.expansionCategorySetIds).toEqual(
      Array.from({ length: 20 }, (_, index) => `${HISTORY.packId}-set-${101 + index}`),
    );
    expect(Object.keys(addedGenerated[0]!)).toEqual(CSV_COLUMNS);
    expect(Object.isFrozen(result.authoredRows)).toBe(true);
    expect(Object.isFrozen(result.generatedRows)).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);
  });

  it('preserves every baseline logical row and evidence record field for field', () => {
    const result = project();
    const authored = new Map(result.authoredRows.map((row) => [row.clue_id, row]));
    const generated = new Map(result.generatedRows.map((row) => [row.clue_id, row]));
    const evidence = new Map(result.evidence.map((record) => [record.clueId, record]));

    for (const row of fixture.authoredRows) expect(authored.get(row.clue_id)).toEqual(row);
    for (const row of fixture.generatedRows) expect(generated.get(row.clue_id)).toEqual(row);
    for (const record of fixture.evidence) expect(evidence.get(record.clueId)).toEqual(record);

    const added = result.evidence.filter(({ clueId }) => clueId.includes('-easy-expansion-'));
    expect(added).toHaveLength(100);
    expect(added.every(({ origin, inspiration }) => origin === 'compatibleOpen' && inspiration === null))
      .toBe(true);
    expect(added.every((record) => record.assertion === `${
      result.generatedRows.find(({ clue_id }) => clue_id === record.clueId)!.response_en
    } — ${
      result.generatedRows.find(({ clue_id }) => clue_id === record.clueId)!.explanation_en
    }`)).toBe(true);
    expect(new Set(added.flatMap(({ authoring, factualReview, editorialReview }) => [
      authoring.author,
      factualReview.reviewer,
      editorialReview.reviewer,
    ]))).toHaveLength(3);
  });

  it('is byte-deterministic and idempotent with the natural post-cutover collision corpus', () => {
    const first = project();
    const second = project({
      authoredRows: first.authoredRows,
      generatedRows: first.generatedRows,
      evidence: first.evidence,
      collisionCorpus: {
        rows: [
          ...fixture.collisionCorpus.rows.filter(({ pack_id }) => pack_id !== HISTORY.packId),
          ...first.generatedRows,
        ],
        evidence: [
          ...fixture.collisionCorpus.evidence.filter(({ batchId }) => batchId !== HISTORY.id),
          ...first.evidence,
        ],
        phaseB: fixture.collisionCorpus.phaseB,
      },
    });

    expect(serializeEasyExpansionRows(second.authoredRows))
      .toBe(serializeEasyExpansionRows(first.authoredRows));
    expect(serializeEasyExpansionRows(second.generatedRows))
      .toBe(serializeEasyExpansionRows(first.generatedRows));
    expect(serializeEvidence(second.evidence)).toBe(serializeEvidence(first.evidence));
  });

  it('does not waive a non-exact target collision in a post-cutover corpus', () => {
    const complete = project();
    const collisionId = complete.expansionClueIds[0]!;
    expect(() => project({
      authoredRows: complete.authoredRows,
      generatedRows: complete.generatedRows,
      evidence: complete.evidence,
      collisionCorpus: {
        rows: [
          ...fixture.collisionCorpus.rows.filter(({ pack_id }) => pack_id !== HISTORY.packId),
          ...changedRow(complete.generatedRows, collisionId, { response_en: 'Conflicting answer' }),
        ],
        evidence: [
          ...fixture.collisionCorpus.evidence.filter(({ batchId }) => batchId !== HISTORY.id),
          ...complete.evidence,
        ],
        phaseB: fixture.collisionCorpus.phaseB,
      },
    })).toThrowError(/collides/i);
  });

  it('deduplicates exact accepted registrations for other Phase B packs after cutover', () => {
    const complete = project();
    const expansionIds = new Set(complete.expansionClueIds);
    const registered = acceptedOtherPhaseBCategory();
    const registeredRows = registered.questions.map((question) => (
      acceptedPhaseBRow(registered, question)
    ));
    const registeredEvidence = registered.questions.map((question) => (
      acceptedPhaseBEvidence(registered, question)
    ));

    const rerun = project({
      authoredRows: complete.authoredRows,
      generatedRows: complete.generatedRows,
      evidence: complete.evidence,
      collisionCorpus: {
        rows: [
          ...fixture.collisionCorpus.rows,
          ...complete.generatedRows.filter(({ clue_id }) => expansionIds.has(clue_id)),
          ...registeredRows,
        ],
        evidence: [
          ...fixture.collisionCorpus.evidence,
          ...complete.evidence.filter(({ clueId }) => expansionIds.has(clueId)),
          ...registeredEvidence,
        ],
        phaseB: [registered],
      },
    });

    expect(serializeEasyExpansionRows(rerun.generatedRows))
      .toBe(serializeEasyExpansionRows(complete.generatedRows));
    expect(serializeEvidence(rerun.evidence)).toBe(serializeEvidence(complete.evidence));
  });

  it('rejects a non-exact accepted registration for another Phase B pack', () => {
    const complete = project();
    const expansionIds = new Set(complete.expansionClueIds);
    const registered = acceptedOtherPhaseBCategory();
    const registeredRows = registered.questions.map((question) => (
      acceptedPhaseBRow(registered, question)
    ));
    const collisionId = registeredRows[0]!.clue_id;

    expect(() => project({
      authoredRows: complete.authoredRows,
      generatedRows: complete.generatedRows,
      evidence: complete.evidence,
      collisionCorpus: {
        rows: [
          ...fixture.collisionCorpus.rows,
          ...complete.generatedRows.filter(({ clue_id }) => expansionIds.has(clue_id)),
          ...changedRow(registeredRows, collisionId, { response_en: 'Conflicting accepted answer' }),
        ],
        evidence: [
          ...fixture.collisionCorpus.evidence,
          ...complete.evidence.filter(({ clueId }) => expansionIds.has(clueId)),
          ...registered.questions.map((question) => acceptedPhaseBEvidence(registered, question)),
        ],
        phaseB: [registered],
      },
    })).toThrowError(/registered Phase B clue ID collides/i);
  });

  it('rejects a partially accepted registered Phase B batch', () => {
    const accepted = acceptedOtherPhaseBCategory(0);
    const absent = acceptedOtherPhaseBCategory(1);
    const acceptedRows = accepted.questions.map((question) => (
      acceptedPhaseBRow(accepted, question)
    ));
    const acceptedEvidence = accepted.questions.map((question) => (
      acceptedPhaseBEvidence(accepted, question)
    ));

    expect(() => project({
      collisionCorpus: {
        rows: [...fixture.collisionCorpus.rows, ...acceptedRows],
        evidence: [...fixture.collisionCorpus.evidence, ...acceptedEvidence],
        phaseB: [accepted, absent],
      },
    })).toThrowError(/registered Phase B batch is only partially accepted/i);
  });

  it('keeps the sealed baseline expectation at 500 records per original pack', () => {
    const moved = fixture.baseline.records.findIndex(({ batchId }) => batchId === HISTORY.id);
    expect(moved).toBeGreaterThanOrEqual(0);
    expect(() => project({
      baseline: {
        ...fixture.baseline,
        records: fixture.baseline.records.map((record, index) => index === moved
          ? { ...record, batchId: '02-geography' }
          : record),
      },
    })).toThrowError(/has 499 records.*expected 500/i);
  });

  it('rejects partial and mismatched prior expansion state', () => {
    const complete = project();
    const lastClueId = complete.expansionClueIds.at(-1)!;
    expect(() => project({
      authoredRows: withoutClue(complete.authoredRows, lastClueId),
      generatedRows: withoutClue(complete.generatedRows, lastClueId),
      evidence: withoutClue(complete.evidence, lastClueId),
    })).toThrowError(/partial easy expansion state/i);

    expect(() => project({
      authoredRows: changedRow(complete.authoredRows, lastClueId, { clue_en: 'Changed expansion clue' }),
      generatedRows: changedRow(complete.generatedRows, lastClueId, { clue_en: 'Changed expansion clue' }),
      evidence: complete.evidence,
    })).toThrowError(/does not match the reviewed bank/i);
  });

  it('rejects baseline mutation, inventory drift, missing evidence, and OpenTDB quota drift', () => {
    const baselineId = fixture.generatedRows[0]!.clue_id;
    expect(() => project({
      authoredRows: changedRow(fixture.authoredRows, baselineId, { clue_en: 'Mutated baseline clue' }),
      generatedRows: changedRow(fixture.generatedRows, baselineId, { clue_en: 'Mutated baseline clue' }),
    })).toThrowError(/baseline record hash mismatch/i);

    expect(() => project({
      generatedRows: changedRow(fixture.generatedRows, baselineId, { tier: '2' }),
    })).toThrowError(/authored\/generated inventory differs/i);

    expect(() => project({
      evidence: fixture.evidence.slice(1),
    })).toThrowError(/missing evidence/i);

    const inspired = fixture.evidence.find(({ origin }) => origin === 'openTdbInspired')!;
    expect(() => project({
      evidence: fixture.evidence.map((record) => record.clueId === inspired.clueId
        ? { ...record, origin: 'compatibleOpen', inspiration: null }
        : record) as readonly ContentEvidence[],
    })).toThrowError(/OpenTDB-inspired evidence records/i);
  });

  it.each([
    ['clue ID', (corpus: EasyExpansionCollisionCorpus, categories: readonly EasyExpansionCategory[]) => ({
      ...corpus,
      rows: [...corpus.rows, {
        ...corpus.rows[0]!,
        clue_id: categories[0]!.questions[0]!.clueId,
        pack_id: 'built-in-finals',
      }],
    }), /clue ID collides/i],
    ['category set ID', (corpus: EasyExpansionCollisionCorpus, categories: readonly EasyExpansionCategory[]) => ({
      ...corpus,
      rows: [...corpus.rows, {
        ...corpus.rows[0]!,
        clue_id: 'collision-corpus-extra-clue',
        category_set_id: categories[0]!.categorySetId,
      }],
    }), /category set ID collides/i],
    ['fact key', (corpus: EasyExpansionCollisionCorpus, categories: readonly EasyExpansionCategory[]) => ({
      ...corpus,
      evidence: [...corpus.evidence, {
        ...corpus.evidence[0]!,
        clueId: 'collision-corpus-extra-clue',
        factKey: categories[0]!.questions[0]!.factKey,
      }],
    }), /fact key collides/i],
    ['Final title', (corpus: EasyExpansionCollisionCorpus, categories: readonly EasyExpansionCategory[]) => ({
      ...corpus,
      rows: corpus.rows.map((row) => row.pack_id === FINAL_BATCH.packId
        ? { ...row, category_name_en: categories[0]!.name.en }
        : row),
    }), /English category title collides/i],
    ['clue-answer pair', (corpus: EasyExpansionCollisionCorpus, categories: readonly EasyExpansionCategory[]) => ({
      ...corpus,
      rows: corpus.rows.map((row, index) => index === 0 ? {
        ...row,
        clue_en: categories[0]!.questions[0]!.clue.en,
        response_en: categories[0]!.questions[0]!.response.en,
      } : row),
    }), /English clue-answer pair collides/i],
    ['registered Phase B title', (corpus: EasyExpansionCollisionCorpus, categories: readonly EasyExpansionCategory[]) => ({
      ...corpus,
      phaseB: [{
        ...categories[0]!,
        batchId: '02-geography',
        packId: 'built-in-geography',
        categorySetId: 'built-in-geography-set-101',
      }],
    }), /English category title collides/i],
    ['registered Phase B clue ID', (corpus: EasyExpansionCollisionCorpus, categories: readonly EasyExpansionCategory[]) => ({
      ...corpus,
      phaseB: [{
        ...categories[0]!,
        batchId: '02-geography',
        packId: 'built-in-geography',
        categorySetId: 'built-in-geography-set-120',
        name: { en: 'Independent geography title', et: 'Sõltumatu geograafia pealkiri' },
        questions: categories[0]!.questions.map((question, index) => ({
          ...question,
          clueId: index === 0 ? question.clueId : `registered-phase-b-clue-${index}`,
          factKey: `registered phase b fact ${index}`,
          clue: {
            en: `Independent registered clue ${index}`,
            et: `Sõltumatu registreeritud vihje ${index}`,
          },
          response: { en: `Answer ${index}`, et: `Vastus ${index}` },
        })),
      }],
    }), /clue ID collides/i],
  ] as const)('rejects a cumulative %s collision', (_label, mutate, message) => {
    const categories = bank();
    expect(() => project({
      categories,
      collisionCorpus: mutate(fixture.collisionCorpus, categories),
    })).toThrowError(message);
  });

  it('requires the collision corpus to include every baseline record, including Finals', () => {
    const finalId = fixture.collisionCorpus.rows.find(({ pack_id }) => pack_id === FINAL_BATCH.packId)!.clue_id;
    expect(() => project({
      collisionCorpus: {
        ...fixture.collisionCorpus,
        rows: withoutClue(fixture.collisionCorpus.rows, finalId),
      },
    })).toThrowError(/collision corpus.*missing.*Finals|collision corpus.*missing/i);
  });
});
