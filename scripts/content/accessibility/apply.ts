import { contentEvidenceSchema, type ContentEvidence } from '../evidence';
import { validateAccessibleCorpus } from './bank';
import {
  applyRetainedEasyClueCorrection,
  applyRetainedEasyEvidenceCorrection,
} from './retainedClueCorrections';
import type { AccessibleCategory, AccessibleQuestion, CategoryTitle } from './types';

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
] as const;

const AUTHORING = {
  author: 'Codex Accessible Corpus Author',
  authoredAt: '2026-08-28T08:00:00.000Z',
} as const;

const FACTUAL_REVIEW = {
  reviewer: 'Codex Accessible Corpus Factual Reviewer',
  reviewedAt: '2026-08-28T09:00:00.000Z',
  decision: 'approved',
} as const;

const EDITORIAL_REVIEW = {
  reviewer: 'Codex Accessible Corpus Editorial Reviewer',
  reviewedAt: '2026-08-28T10:00:00.000Z',
  decision: 'approved',
} as const;

const TRANSLATION_REVIEW = {
  reviewer: 'Codex Accessible Corpus Translation Reviewer',
  reviewedAt: '2026-08-28T11:00:00.000Z',
  decision: 'approved',
} as const;

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function serializeAcceptedVariants(variants: readonly string[]): string {
  return variants
    .map((variant) => variant.replaceAll('\\', '\\\\').replaceAll(';', '\\;'))
    .join(';');
}

function assertMatchingInventories(
  authoredRows: readonly Record<string, string>[],
  generatedRows: readonly Record<string, string>[],
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

function indexEvidence(evidence: readonly ContentEvidence[]): ReadonlyMap<string, ContentEvidence> {
  const byClueId = new Map<string, ContentEvidence>();
  const inspirationOwners = new Map<string, string>();
  for (const record of evidence) {
    if (record.origin === 'openTdbInspired' && record.inspiration === null) {
      throw new Error(`OpenTDB evidence ${record.clueId} has no valid inspiration`);
    }
    let valid: ContentEvidence;
    try {
      valid = contentEvidenceSchema.parse(record);
    } catch (error) {
      throw new Error(
        `Invalid evidence for clue ${record.clueId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (byClueId.has(valid.clueId)) {
      throw new Error(`Duplicate evidence for clue: ${valid.clueId}`);
    }
    byClueId.set(valid.clueId, record);
    if (valid.inspiration !== null) {
      const owner = inspirationOwners.get(valid.inspiration.candidateId);
      if (owner !== undefined) {
        throw new Error(`OpenTDB candidate reused: ${valid.inspiration.candidateId}`);
      }
      inspirationOwners.set(valid.inspiration.candidateId, valid.clueId);
    }
  }
  return byClueId;
}

function validateCategoryInputs(
  categories: readonly AccessibleCategory[],
  targetCategorySetIds: ReadonlySet<string>,
): string {
  if (categories.length !== targetCategorySetIds.size) {
    throw new Error(
      `Expected ${targetCategorySetIds.size} accessible categories; found ${categories.length}`,
    );
  }
  const seen = new Set<string>();
  for (const category of categories) {
    if (!targetCategorySetIds.has(category.categorySetId)) {
      throw new Error(`Accessible category is not a selected target: ${category.categorySetId}`);
    }
    if (seen.has(category.categorySetId)) {
      throw new Error(`Duplicate accessible category: ${category.categorySetId}`);
    }
    seen.add(category.categorySetId);
  }
  for (const categorySetId of targetCategorySetIds) {
    if (!seen.has(categorySetId)) {
      throw new Error(`Missing accessible category: ${categorySetId}`);
    }
  }
  const batchIds = new Set(categories.map(({ batchId }) => batchId));
  if (batchIds.size !== 1) throw new Error('Accessible categories must belong to one batch');
  const batchId = categories[0]?.batchId;
  if (batchId === undefined) throw new Error('At least one accessible category is required');
  validateAccessibleCorpus(
    categories,
    categories.map(({ categorySetId }) => ({ categorySetId, batchId })),
  );
  return batchId;
}

function indexTitles(
  titles: readonly CategoryTitle[],
  batchId: string,
): ReadonlyMap<string, CategoryTitle> {
  const byCategorySetId = new Map<string, CategoryTitle>();
  for (const title of titles) {
    if (title.batchId !== batchId) {
      throw new Error(
        `Category title ${title.categorySetId} has batch ${title.batchId}; expected ${batchId}`,
      );
    }
    if (byCategorySetId.has(title.categorySetId)) {
      throw new Error(`Duplicate category title: ${title.categorySetId}`);
    }
    byCategorySetId.set(title.categorySetId, title);
  }
  return byCategorySetId;
}

function targetRowsByTier(
  rows: readonly Record<string, string>[],
  categorySetId: string,
): ReadonlyMap<number, Record<string, string>> {
  const targetRows = rows.filter((row) => row.category_set_id === categorySetId);
  if (targetRows.length === 0) throw new Error(`Missing target rows: ${categorySetId}`);
  const tiers = targetRows.map((row) => Number(row.tier)).sort((left, right) => left - right);
  if (
    targetRows.some((row) => row.content_kind !== 'board' || row.difficulty !== 'easy')
    || tiers.join(',') !== '1,2,3,4,5'
  ) {
    throw new Error(
      `Target ${categorySetId} must contain tiers 1,2,3,4,5; found ${tiers.join(',')}`,
    );
  }
  return new Map(targetRows.map((row) => [Number(row.tier), row]));
}

function replaceTargetRow(
  row: Readonly<Record<string, string>>,
  question: AccessibleQuestion,
  category: AccessibleCategory,
  clueId: string,
  authored: boolean,
): Record<string, string> {
  return {
    ...row,
    clue_id: clueId,
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
  };
}

function createEvidence(
  clueId: string,
  batchId: string,
  question: AccessibleQuestion,
  removed: ContentEvidence,
): ContentEvidence {
  const inspiration = removed.origin === 'openTdbInspired' ? removed.inspiration : null;
  if (removed.origin === 'openTdbInspired' && inspiration === null) {
    throw new Error(`OpenTDB evidence ${removed.clueId} has no valid inspiration`);
  }
  return contentEvidenceSchema.parse({
    version: 1,
    clueId,
    batchId,
    factKey: `accessible-corpus:${question.key}`,
    subjectKey: question.subjectKey,
    assertion: `${question.response.en} — ${question.explanation.en}`,
    origin: inspiration === null ? 'compatibleOpen' : 'openTdbInspired',
    authoring: AUTHORING,
    supportingSource: question.source,
    inspiration,
    factualReview: FACTUAL_REVIEW,
    editorialReview: EDITORIAL_REVIEW,
    translationReview: TRANSLATION_REVIEW,
  });
}

export function applyAccessibleCorpus(input: Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  targetCategorySetIds: ReadonlySet<string>;
  titles: readonly CategoryTitle[];
  categories: readonly AccessibleCategory[];
}>): Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  replacedClueIds: readonly string[];
}> {
  assertMatchingInventories(input.authoredRows, input.generatedRows);
  const batchId = validateCategoryInputs(input.categories, input.targetCategorySetIds);
  const titlesByCategorySetId = indexTitles(input.titles, batchId);
  const evidenceByClueId = indexEvidence(input.evidence);
  const inputClueIds = new Set<string>();
  for (const row of input.generatedRows) {
    if (inputClueIds.has(row.clue_id)) throw new Error(`Duplicate input clue ID: ${row.clue_id}`);
    inputClueIds.add(row.clue_id);
  }
  for (const record of input.evidence) {
    if (record.batchId !== batchId) {
      throw new Error(`Evidence ${record.clueId} has batch ${record.batchId}; expected ${batchId}`);
    }
  }

  const targetOldIds = new Set<string>();
  const replacements = new Map<string, Readonly<{
    clueId: string;
    category: AccessibleCategory;
    question: AccessibleQuestion;
    removed: ContentEvidence;
  }>>();
  const replacedClueIds: string[] = [];
  let sequence = 0;
  for (const category of input.categories) {
    const title = titlesByCategorySetId.get(category.categorySetId);
    if (title === undefined) throw new Error(`Missing category title: ${category.categorySetId}`);
    if (title.name.en !== category.name.en || title.name.et !== category.name.et) {
      throw new Error(`Category title does not match accessible category: ${category.categorySetId}`);
    }
    const rowsByTier = targetRowsByTier(input.generatedRows, category.categorySetId);
    const questionsByTier = new Map(category.questions.map((question) => [question.tier, question]));
    for (const tier of [1, 2, 3, 4, 5] as const) {
      const row = rowsByTier.get(tier)!;
      const question = questionsByTier.get(tier)!;
      const removed = evidenceByClueId.get(row.clue_id);
      if (removed === undefined) throw new Error(`Missing evidence for target clue: ${row.clue_id}`);
      sequence += 1;
      const clueId = `${row.pack_id}-accessible-corpus-${sequence.toString().padStart(3, '0')}`;
      replacements.set(row.clue_id, { clueId, category, question, removed });
      replacedClueIds.push(row.clue_id);
      targetOldIds.add(row.clue_id);
    }
  }

  const retainedClueIds = new Set(
    input.generatedRows
      .filter((row) => !targetOldIds.has(row.clue_id))
      .map((row) => row.clue_id),
  );
  const retainedFactKeys = new Set(
    input.evidence.filter((record) => !targetOldIds.has(record.clueId)).map(({ factKey }) => factKey),
  );
  for (const { clueId, question } of replacements.values()) {
    if (retainedClueIds.has(clueId)) {
      throw new Error(`Replacement clue ID collides with retained clue: ${clueId}`);
    }
    const factKey = `accessible-corpus:${question.key}`;
    if (retainedFactKeys.has(factKey)) {
      throw new Error(`Replacement fact key collides with retained evidence: ${factKey}`);
    }
  }

  const transformRows = (
    rows: readonly Record<string, string>[],
    authored: boolean,
  ): readonly Record<string, string>[] => rows.map((row) => {
    const replacement = replacements.get(row.clue_id);
    if (replacement !== undefined) {
      return replaceTargetRow(
        row,
        replacement.question,
        replacement.category,
        replacement.clueId,
        authored,
      );
    }
    if (row.content_kind !== 'board' || row.difficulty !== 'easy') return row;
    const title = titlesByCategorySetId.get(row.category_set_id);
    if (title === undefined) throw new Error(`Missing category title: ${row.category_set_id}`);
    return {
      ...applyRetainedEasyClueCorrection(row, retainedClueIds),
      category_name_en: title.name.en,
      category_name_et: authored ? '' : title.name.et,
    };
  });

  const replacementEvidence = [...replacements.values()].map((replacement) => createEvidence(
    replacement.clueId,
    batchId,
    replacement.question,
    replacement.removed,
  ));
  const evidence = [
    ...input.evidence
      .filter((record) => !targetOldIds.has(record.clueId))
      .map((record) => applyRetainedEasyEvidenceCorrection(record, retainedClueIds)),
    ...replacementEvidence,
  ].sort((left, right) => compareCodeUnits(left.clueId, right.clueId));

  return {
    authoredRows: transformRows(input.authoredRows, true),
    generatedRows: transformRows(input.generatedRows, false),
    evidence,
    replacedClueIds,
  };
}
