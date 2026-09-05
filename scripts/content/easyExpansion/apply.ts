import { stringify } from 'csv-stringify/sync';
import { CSV_COLUMNS, type CsvColumn } from '../../../src/shared/content/csvColumns';
import {
  contentEvidenceSchema,
  serializeEvidence,
  type ContentEvidence,
} from '../evidence';
import { normalizeCrossTierText } from '../playability/crossTierAudit';
import {
  getProductionBatch,
  PRODUCTION_BATCHES,
  type ProductionBatchDefinition,
} from '../productionBatches';
import {
  hashEasyExpansionBaselineRecord,
  validateEasyExpansionBaselineManifest,
  type EasyExpansionBaselineManifest,
} from './createBaselineManifest';
import type { EasyExpansionBatchContract, EasyExpansionCategory } from './types';
import { validateEasyExpansionBank } from './validateBank';

const INVENTORY_COLUMNS = [
  'clue_id',
  'pack_id',
  'pack_name',
  'category_set_id',
  'content_kind',
  'round',
  'tier',
  'difficulty',
  'macro_topic',
  'enabled',
] as const satisfies readonly CsvColumn[];

const ORIGINAL_BATCH_IDS = new Set(PRODUCTION_BATCHES
  .filter(({ id }) => /^(?:0[1-9]|1[0-2])-/u.test(id))
  .map(({ id }) => id));
const EASY_EXPANSION_BASELINE_BOARD_CLUES = 500;

const AUTHORING = Object.freeze({
  author: 'Codex Easy Expansion Author',
  authoredAt: '2026-09-06T08:00:00.000Z',
});
const FACTUAL_REVIEW = Object.freeze({
  reviewer: 'Codex Easy Expansion Factual Reviewer',
  reviewedAt: '2026-09-06T09:00:00.000Z',
  decision: 'approved' as const,
});
const EDITORIAL_REVIEW = Object.freeze({
  reviewer: 'Codex Easy Expansion Editorial Reviewer',
  reviewedAt: '2026-09-06T10:00:00.000Z',
  decision: 'approved' as const,
});
const TRANSLATION_REVIEW = Object.freeze({
  reviewer: 'Codex Easy Expansion Translation Reviewer',
  reviewedAt: '2026-09-06T11:00:00.000Z',
  decision: 'approved' as const,
});

export type EasyExpansionCsvRow = Readonly<Record<CsvColumn, string>>;

export type EasyExpansionCollisionCorpus = Readonly<{
  rows: readonly EasyExpansionCsvRow[];
  evidence: readonly ContentEvidence[];
  phaseB: readonly EasyExpansionCategory[];
}>;

export type ApplyEasyExpansionInput = Readonly<{
  batchId: string;
  authoredRows: readonly EasyExpansionCsvRow[];
  generatedRows: readonly EasyExpansionCsvRow[];
  evidence: readonly ContentEvidence[];
  categories: readonly EasyExpansionCategory[];
  baseline: EasyExpansionBaselineManifest;
  collisionCorpus: EasyExpansionCollisionCorpus;
}>;

export type ApplyEasyExpansionResult = Readonly<{
  authoredRows: readonly EasyExpansionCsvRow[];
  generatedRows: readonly EasyExpansionCsvRow[];
  evidence: readonly ContentEvidence[];
  expansionClueIds: readonly string[];
  expansionCategorySetIds: readonly string[];
}>;

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function originalBatch(batchId: string): ProductionBatchDefinition {
  const batch = getProductionBatch(batchId);
  if (!ORIGINAL_BATCH_IDS.has(batch.id) || batch.distribution === null) {
    throw new Error(`Batch ${batchId} does not support Easy expansion`);
  }
  return batch;
}

function logicalFields(row: EasyExpansionCsvRow): readonly string[] {
  return CSV_COLUMNS.map((column) => row[column]);
}

function indexRows(
  rows: readonly EasyExpansionCsvRow[],
  owner: string,
): ReadonlyMap<string, EasyExpansionCsvRow> {
  const indexed = new Map<string, EasyExpansionCsvRow>();
  for (const row of rows) {
    for (const column of CSV_COLUMNS) {
      if (typeof row[column] !== 'string') {
        throw new Error(`${owner} row ${row.clue_id || '<unknown>'} is missing CSV column ${column}`);
      }
    }
    if (indexed.has(row.clue_id)) throw new Error(`Duplicate ${owner} clue ID: ${row.clue_id}`);
    indexed.set(row.clue_id, row);
  }
  return indexed;
}

function indexEvidence(
  evidence: readonly ContentEvidence[],
  owner: string,
): ReadonlyMap<string, ContentEvidence> {
  const indexed = new Map<string, ContentEvidence>();
  for (const record of evidence) {
    const valid = contentEvidenceSchema.parse(record);
    if (indexed.has(valid.clueId)) throw new Error(`Duplicate ${owner} evidence: ${valid.clueId}`);
    indexed.set(valid.clueId, valid);
  }
  return indexed;
}

function assertMatchingInventories(
  authoredRows: readonly EasyExpansionCsvRow[],
  generatedRows: readonly EasyExpansionCsvRow[],
): void {
  if (authoredRows.length !== generatedRows.length) {
    throw new Error(
      `Authored/generated inventory row count differs: ${authoredRows.length} vs ${generatedRows.length}`,
    );
  }
  for (const [index, authored] of authoredRows.entries()) {
    const generated = generatedRows[index]!;
    if (INVENTORY_COLUMNS.some((column) => authored[column] !== generated[column])) {
      throw new Error(`Authored/generated inventory differs at row ${index}`);
    }
  }
}

function assertEvidenceInventory(
  rows: ReadonlyMap<string, EasyExpansionCsvRow>,
  evidence: ReadonlyMap<string, ContentEvidence>,
  batchId: string,
): void {
  for (const clueId of rows.keys()) {
    const record = evidence.get(clueId);
    if (record === undefined) throw new Error(`Missing evidence for clue: ${clueId}`);
    if (record.batchId !== batchId) {
      throw new Error(`Evidence ${clueId} belongs to ${record.batchId}; expected ${batchId}`);
    }
  }
  for (const clueId of evidence.keys()) {
    if (!rows.has(clueId)) throw new Error(`Evidence has no input clue: ${clueId}`);
  }
  if (rows.size !== evidence.size) {
    throw new Error(`Row/evidence inventory count differs: ${rows.size} vs ${evidence.size}`);
  }
}

function assertCollisionCorpusComplete(
  manifest: EasyExpansionBaselineManifest,
  rows: ReadonlyMap<string, EasyExpansionCsvRow>,
  evidence: ReadonlyMap<string, ContentEvidence>,
): void {
  for (const record of manifest.records) {
    if (!rows.has(record.clueId) || !evidence.has(record.clueId)) {
      throw new Error(
        `Collision corpus is missing baseline clue ${record.clueId} from ${record.batchId}`,
      );
    }
  }
}

function assertBaselineRecords(
  batch: ProductionBatchDefinition,
  manifest: EasyExpansionBaselineManifest,
  authored: ReadonlyMap<string, EasyExpansionCsvRow>,
  generated: ReadonlyMap<string, EasyExpansionCsvRow>,
  evidence: ReadonlyMap<string, ContentEvidence>,
): ReadonlySet<string> {
  const records = manifest.records.filter(({ batchId }) => batchId === batch.id);
  if (records.length !== EASY_EXPANSION_BASELINE_BOARD_CLUES) {
    throw new Error(
      `Baseline manifest has ${records.length} records for ${batch.id}; `
      + `expected ${EASY_EXPANSION_BASELINE_BOARD_CLUES}`,
    );
  }
  const clueIds = new Set<string>();
  for (const record of records) {
    if (clueIds.has(record.clueId)) throw new Error(`Duplicate baseline clue ID: ${record.clueId}`);
    clueIds.add(record.clueId);
    const authoredRow = authored.get(record.clueId);
    const generatedRow = generated.get(record.clueId);
    const evidenceRecord = evidence.get(record.clueId);
    if (authoredRow === undefined || generatedRow === undefined || evidenceRecord === undefined) {
      throw new Error(`Missing baseline record: ${record.clueId}`);
    }
    const actual = hashEasyExpansionBaselineRecord({
      batchId: batch.id,
      clueId: record.clueId,
      authoredFields: logicalFields(authoredRow),
      generatedFields: logicalFields(generatedRow),
      evidence: evidenceRecord,
    });
    if (actual !== record.sha256) {
      throw new Error(`Baseline record hash mismatch: ${record.clueId}`);
    }
  }
  return clueIds;
}

function expansionContract(
  batch: ProductionBatchDefinition,
  baselineRows: readonly EasyExpansionCsvRow[],
): EasyExpansionBatchContract {
  const categoryTopics = new Map<string, string>();
  for (const row of baselineRows) {
    const previous = categoryTopics.get(row.category_set_id);
    if (previous !== undefined && previous !== row.macro_topic) {
      throw new Error(`Baseline category ${row.category_set_id} has inconsistent macro topics`);
    }
    categoryTopics.set(row.category_set_id, row.macro_topic);
  }
  const counts = Object.fromEntries(batch.subthemes.map((topic) => [topic, 0]));
  for (const topic of categoryTopics.values()) {
    if (!(topic in counts)) throw new Error(`Baseline category uses unknown macro topic ${topic}`);
    counts[topic] += 1;
  }
  return Object.freeze({
    batchId: batch.id,
    packId: batch.packId,
    allowedMacroTopics: batch.subthemes,
    existingMacroTopicCounts: Object.freeze(counts),
    maxSetsPerMacroTopic: batch.maxSetsPerSubtheme,
  });
}

function serializeAcceptedVariants(variants: readonly string[]): string {
  return variants
    .map((variant) => variant.replaceAll('\\', '\\\\').replaceAll(';', '\\;'))
    .join(';');
}

function createRow(
  batch: ProductionBatchDefinition,
  category: EasyExpansionCategory,
  question: EasyExpansionCategory['questions'][number],
  authored: boolean,
): EasyExpansionCsvRow {
  const values: Record<CsvColumn, string> = {
    clue_id: question.clueId,
    pack_id: batch.packId,
    pack_name: batch.packName,
    category_set_id: category.categorySetId,
    content_kind: 'board',
    round: category.round,
    tier: String(question.tier),
    difficulty: 'easy',
    macro_topic: category.macroTopic,
    category_name_en: category.name.en,
    category_name_et: authored ? '' : category.name.et,
    clue_en: question.clue.en,
    clue_et: question.clue.et,
    response_en: question.response.en,
    response_et: question.response.et,
    accepted_variants_en: serializeAcceptedVariants(question.acceptedVariants.en),
    accepted_variants_et: serializeAcceptedVariants(question.acceptedVariants.et),
    explanation_en: question.explanation.en,
    explanation_et: question.explanation.et,
    source_title: question.source.title,
    source_url: question.source.url,
    source_license: question.source.license,
    source_retrieved_at: question.source.retrievedAt,
    translation_status: 'reviewed',
    enabled: 'true',
  };
  return Object.freeze(Object.fromEntries(
    CSV_COLUMNS.map((column) => [column, values[column]]),
  ) as Record<CsvColumn, string>);
}

function createEvidence(
  batchId: string,
  question: EasyExpansionCategory['questions'][number],
): ContentEvidence {
  return contentEvidenceSchema.parse({
    version: 1,
    clueId: question.clueId,
    batchId,
    factKey: question.factKey,
    subjectKey: question.subjectKey,
    assertion: `${question.response.en} — ${question.explanation.en}`,
    origin: 'compatibleOpen',
    authoring: AUTHORING,
    supportingSource: question.source,
    inspiration: null,
    factualReview: FACTUAL_REVIEW,
    editorialReview: EDITORIAL_REVIEW,
    translationReview: TRANSLATION_REVIEW,
    adultPolicyReview: null,
  });
}

function canonicalAnswer(value: string, language: 'en' | 'et'): string {
  const normalized = normalizeCrossTierText(value);
  return language === 'en' ? normalized.replace(/^(?:a|an|the)\s+/u, '') : normalized;
}

function clueAnswerKey(
  clue: string,
  response: string,
  language: 'en' | 'et',
): string {
  return `${normalizeCrossTierText(clue)}\0${canonicalAnswer(response, language)}`;
}

function assertNoCollisions(
  batch: ProductionBatchDefinition,
  categories: readonly EasyExpansionCategory[],
  collisionRows: ReadonlyMap<string, EasyExpansionCsvRow>,
  collisionEvidence: ReadonlyMap<string, ContentEvidence>,
  phaseB: readonly EasyExpansionCategory[],
): void {
  const setIds = new Set([...collisionRows.values()].map(({ category_set_id }) => category_set_id));
  const clueIds = new Set([...collisionRows.keys(), ...collisionEvidence.keys()]);
  const factKeys = new Set([...collisionEvidence.values()]
    .map(({ factKey }) => normalizeCrossTierText(factKey)));
  const titles = {
    en: new Set([...collisionRows.values()].map(({ category_name_en }) => (
      normalizeCrossTierText(category_name_en)
    )).filter(Boolean)),
    et: new Set([...collisionRows.values()].map(({ category_name_et }) => (
      normalizeCrossTierText(category_name_et)
    )).filter(Boolean)),
  };
  const clueAnswers = {
    en: new Set([...collisionRows.values()].map((row) => (
      clueAnswerKey(row.clue_en, row.response_en, 'en')
    ))),
    et: new Set([...collisionRows.values()].map((row) => (
      clueAnswerKey(row.clue_et, row.response_et, 'et')
    ))),
  };

  const registeredByBatch = new Map<string, EasyExpansionCategory[]>();
  for (const category of phaseB.filter(({ batchId }) => batchId !== batch.id)) {
    const registered = registeredByBatch.get(category.batchId) ?? [];
    registered.push(category);
    registeredByBatch.set(category.batchId, registered);
  }
  for (const [registeredBatchId, registeredCategories] of registeredByBatch) {
    const registeredBatch = originalBatch(registeredBatchId);
    const acceptedQuestions = registeredCategories.flatMap((category) => (
      category.questions.map((question) => {
        const acceptedRow = collisionRows.get(question.clueId);
        const acceptedEvidence = collisionEvidence.get(question.clueId);
        if (acceptedRow === undefined && acceptedEvidence === undefined) return false;
        if (acceptedRow === undefined
          || acceptedEvidence === undefined
          || !sameRow(acceptedRow, createRow(registeredBatch, category, question, false))
          || !sameEvidence(acceptedEvidence, createEvidence(registeredBatch.id, question))) {
          throw new Error(`Registered Phase B clue ID collides: ${question.clueId}`);
        }
        return true;
      })
    ));
    if (acceptedQuestions.every(Boolean)) continue;
    if (acceptedQuestions.some(Boolean)) {
      throw new Error(`Registered Phase B batch is only partially accepted: ${registeredBatchId}`);
    }
    for (const category of registeredCategories) {
      setIds.add(category.categorySetId);
      titles.en.add(normalizeCrossTierText(category.name.en));
      titles.et.add(normalizeCrossTierText(category.name.et));
      for (const question of category.questions) {
        if (clueIds.has(question.clueId)) {
          throw new Error(`Registered Phase B clue ID collides: ${question.clueId}`);
        }
        clueIds.add(question.clueId);
        factKeys.add(normalizeCrossTierText(question.factKey));
        clueAnswers.en.add(clueAnswerKey(question.clue.en, question.response.en, 'en'));
        clueAnswers.et.add(clueAnswerKey(question.clue.et, question.response.et, 'et'));
      }
    }
  }

  for (const category of categories) {
    if (setIds.has(category.categorySetId)) {
      throw new Error(`Easy expansion category set ID collides: ${category.categorySetId}`);
    }
    for (const language of ['en', 'et'] as const) {
      if (titles[language].has(normalizeCrossTierText(category.name[language]))) {
        throw new Error(`${language === 'en' ? 'English' : 'Estonian'} category title collides: ${category.name[language]}`);
      }
    }
    for (const question of category.questions) {
      if (clueIds.has(question.clueId)) {
        throw new Error(`Easy expansion clue ID collides: ${question.clueId}`);
      }
      if (factKeys.has(normalizeCrossTierText(question.factKey))) {
        throw new Error(`Easy expansion fact key collides: ${question.factKey}`);
      }
      for (const language of ['en', 'et'] as const) {
        if (clueAnswers[language].has(clueAnswerKey(
          question.clue[language],
          question.response[language],
          language,
        ))) {
          throw new Error(`${language === 'en' ? 'English' : 'Estonian'} clue-answer pair collides: ${question.key}`);
        }
      }
    }
  }
}

function sameRow(left: EasyExpansionCsvRow, right: EasyExpansionCsvRow): boolean {
  return CSV_COLUMNS.every((column) => left[column] === right[column]);
}

function sameEvidence(left: ContentEvidence, right: ContentEvidence): boolean {
  return serializeEvidence([left]) === serializeEvidence([right]);
}

function withoutExactExistingExpansion(
  collisionRows: ReadonlyMap<string, EasyExpansionCsvRow>,
  collisionEvidence: ReadonlyMap<string, ContentEvidence>,
  expectedGenerated: readonly EasyExpansionCsvRow[],
  expectedEvidence: readonly ContentEvidence[],
): Readonly<{
  rows: ReadonlyMap<string, EasyExpansionCsvRow>;
  evidence: ReadonlyMap<string, ContentEvidence>;
}> {
  const rows = new Map(collisionRows);
  const evidence = new Map(collisionEvidence);
  for (const [index, expectedRow] of expectedGenerated.entries()) {
    const corpusRow = rows.get(expectedRow.clue_id);
    const corpusEvidence = evidence.get(expectedRow.clue_id);
    if (corpusRow !== undefined
      && corpusEvidence !== undefined
      && sameRow(corpusRow, expectedRow)
      && sameEvidence(corpusEvidence, expectedEvidence[index]!)) {
      rows.delete(expectedRow.clue_id);
      evidence.delete(expectedRow.clue_id);
    }
  }
  return { rows, evidence };
}

export function serializeEasyExpansionRows(rows: readonly EasyExpansionCsvRow[]): string {
  return stringify([...rows], {
    header: true,
    columns: [...CSV_COLUMNS],
    record_delimiter: '\r\n',
  });
}

export function applyEasyExpansion(input: ApplyEasyExpansionInput): ApplyEasyExpansionResult {
  const batch = originalBatch(input.batchId);
  const baseline = validateEasyExpansionBaselineManifest(input.baseline);
  assertMatchingInventories(input.authoredRows, input.generatedRows);
  const authored = indexRows(input.authoredRows, 'authored');
  const generated = indexRows(input.generatedRows, 'generated');
  const evidence = indexEvidence(input.evidence, 'input');
  assertEvidenceInventory(generated, evidence, batch.id);

  const openTdbCount = [...evidence.values()]
    .filter(({ origin }) => origin === 'openTdbInspired').length;
  if (openTdbCount !== batch.requiredOpenTdbClues) {
    throw new Error(
      `${batch.id} requires ${batch.requiredOpenTdbClues} OpenTDB-inspired evidence records; found ${openTdbCount}`,
    );
  }

  const baselineClueIds = assertBaselineRecords(batch, baseline, authored, generated, evidence);
  const baselineRows = input.generatedRows.filter(({ clue_id }) => baselineClueIds.has(clue_id));
  const categories = validateEasyExpansionBank(
    input.categories,
    expansionContract(batch, baselineRows),
  );
  const expectedAuthored = categories.flatMap((category) => category.questions.map((question) => (
    createRow(batch, category, question, true)
  )));
  const expectedGenerated = categories.flatMap((category) => category.questions.map((question) => (
    createRow(batch, category, question, false)
  )));
  const expectedEvidence = categories.flatMap((category) => category.questions.map((question) => (
    createEvidence(batch.id, question)
  )));
  const expansionClueIds = expectedGenerated.map(({ clue_id }) => clue_id);
  const expansionCategorySetIds = categories.map(({ categorySetId }) => categorySetId);
  const expansionIdSet = new Set(expansionClueIds);
  const allowedIds = new Set([...baselineClueIds, ...expansionClueIds]);

  for (const clueId of generated.keys()) {
    if (!allowedIds.has(clueId)) throw new Error(`Unexpected non-baseline clue in ${batch.id}: ${clueId}`);
  }
  const presentExpansionIds = expansionClueIds.filter((clueId) => generated.has(clueId));
  if (presentExpansionIds.length !== 0 && presentExpansionIds.length !== expansionClueIds.length) {
    throw new Error(
      `Partial Easy expansion state for ${batch.id}: found ${presentExpansionIds.length} of ${expansionClueIds.length} clues`,
    );
  }

  const collisionRows = indexRows(input.collisionCorpus.rows, 'collision-corpus');
  const collisionEvidence = indexEvidence(input.collisionCorpus.evidence, 'collision-corpus');
  assertCollisionCorpusComplete(baseline, collisionRows, collisionEvidence);

  if (presentExpansionIds.length === expansionClueIds.length) {
    for (const [index, clueId] of expansionClueIds.entries()) {
      const authoredRow = authored.get(clueId)!;
      const generatedRow = generated.get(clueId)!;
      const evidenceRecord = evidence.get(clueId)!;
      if (!sameRow(authoredRow, expectedAuthored[index]!)
        || !sameRow(generatedRow, expectedGenerated[index]!)
        || !sameEvidence(evidenceRecord, expectedEvidence[index]!)) {
        throw new Error(`Existing Easy expansion clue does not match the reviewed bank: ${clueId}`);
      }
    }
  }

  const checkedCollisionCorpus = presentExpansionIds.length === expansionClueIds.length
    ? withoutExactExistingExpansion(
      collisionRows,
      collisionEvidence,
      expectedGenerated,
      expectedEvidence,
    )
    : { rows: collisionRows, evidence: collisionEvidence };
  assertNoCollisions(
    batch,
    categories,
    checkedCollisionCorpus.rows,
    checkedCollisionCorpus.evidence,
    input.collisionCorpus.phaseB,
  );

  const baselineAuthored = input.authoredRows.filter(({ clue_id }) => !expansionIdSet.has(clue_id));
  const baselineGenerated = input.generatedRows.filter(({ clue_id }) => !expansionIdSet.has(clue_id));
  const baselineEvidence = input.evidence.filter(({ clueId }) => !expansionIdSet.has(clueId));
  return Object.freeze({
    authoredRows: Object.freeze([...baselineAuthored, ...expectedAuthored]),
    generatedRows: Object.freeze([...baselineGenerated, ...expectedGenerated]),
    evidence: Object.freeze([...baselineEvidence, ...expectedEvidence]
      .sort((left, right) => compareCodeUnits(left.clueId, right.clueId))),
    expansionClueIds: Object.freeze([...expansionClueIds]),
    expansionCategorySetIds: Object.freeze([...expansionCategorySetIds]),
  });
}
