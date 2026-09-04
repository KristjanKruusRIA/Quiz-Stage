import { contentEvidenceSchema, type ContentEvidence } from '../evidence';
import type { PlayableTarget } from './targets';
import type { PlayableCategory, PlayableQuestion } from './types';
import { validatePlayableCorpus } from './validateBank';

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
  author: 'Codex Playable Corpus Author',
  authoredAt: '2026-08-28T12:00:00.000Z',
} as const;

const FACTUAL_REVIEW = {
  reviewer: 'Codex Playable Corpus Factual Reviewer',
  reviewedAt: '2026-08-28T13:00:00.000Z',
  decision: 'approved',
} as const;

const EDITORIAL_REVIEW = {
  reviewer: 'Codex Playable Corpus Editorial Reviewer',
  reviewedAt: '2026-08-28T14:00:00.000Z',
  decision: 'approved',
} as const;

const TRANSLATION_REVIEW = {
  reviewer: 'Codex Playable Corpus Translation Reviewer',
  reviewedAt: '2026-08-28T15:00:00.000Z',
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

function indexRows(
  rows: readonly Record<string, string>[],
): ReadonlyMap<string, Readonly<Record<string, string>>> {
  const byClueId = new Map<string, Readonly<Record<string, string>>>();
  for (const row of rows) {
    const clueId = row.clue_id;
    if (byClueId.has(clueId)) throw new Error(`Duplicate input clue ID: ${clueId}`);
    byClueId.set(clueId, row);
  }
  return byClueId;
}

function indexEvidence(
  evidence: readonly ContentEvidence[],
  rowsByClueId: ReadonlyMap<string, Readonly<Record<string, string>>>,
  batchId: string,
): ReadonlyMap<string, ContentEvidence> {
  const byClueId = new Map<string, ContentEvidence>();
  const inspirationOwners = new Map<string, string>();
  for (const record of evidence) {
    let valid: ContentEvidence;
    try {
      valid = contentEvidenceSchema.parse(record);
    } catch (error) {
      throw new Error(
        `Invalid evidence for clue ${record.clueId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (byClueId.has(valid.clueId)) throw new Error(`Duplicate evidence for clue: ${valid.clueId}`);
    if (valid.batchId !== batchId) {
      throw new Error(`Evidence ${valid.clueId} has batch ${valid.batchId}; expected ${batchId}`);
    }
    if (!rowsByClueId.has(valid.clueId)) {
      throw new Error(`Evidence has no input clue: ${valid.clueId}`);
    }
    if (valid.inspiration !== null) {
      const candidateId = valid.inspiration.candidateId;
      if (inspirationOwners.has(candidateId)) {
        throw new Error(`OpenTDB candidate reused: ${candidateId}`);
      }
      inspirationOwners.set(candidateId, valid.clueId);
    }
    byClueId.set(valid.clueId, valid);
  }
  for (const clueId of rowsByClueId.keys()) {
    if (!byClueId.has(clueId)) throw new Error(`Missing evidence for input clue: ${clueId}`);
  }
  return byClueId;
}

function targetRowsByTier(
  rows: readonly Record<string, string>[],
  target: PlayableTarget,
): ReadonlyMap<number, Readonly<Record<string, string>>> {
  const targetRows = rows.filter((row) => row.category_set_id === target.categorySetId);
  if (targetRows.length === 0) throw new Error(`Missing target rows: ${target.categorySetId}`);
  const tiers = targetRows.map((row) => Number(row.tier)).sort((left, right) => left - right);
  if (
    targetRows.some((row) => row.content_kind !== 'board'
      || row.pack_id !== target.packId
      || row.difficulty !== target.difficulty)
    || tiers.join(',') !== '1,2,3,4,5'
  ) {
    throw new Error(
      `Target ${target.categorySetId} must contain tiers 1,2,3,4,5; found ${tiers.join(',')}`,
    );
  }
  return new Map(targetRows.map((row) => [Number(row.tier), row]));
}

function replaceTargetRow(
  row: Readonly<Record<string, string>>,
  question: PlayableQuestion,
  category: PlayableCategory,
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
  question: PlayableQuestion,
  removed: ContentEvidence,
): ContentEvidence {
  const inspiration = removed.inspiration;
  return contentEvidenceSchema.parse({
    version: 1,
    clueId,
    batchId,
    factKey: question.factKey,
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

export function applyPlayableCorpus(input: Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  targets: readonly PlayableTarget[];
  categories: readonly PlayableCategory[];
}>): Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  replacedClueIds: readonly string[];
}> {
  assertMatchingInventories(input.authoredRows, input.generatedRows);
  const categories = validatePlayableCorpus(input.categories, input.targets);
  const batchIds = new Set(input.targets.map(({ batchId }) => batchId));
  if (batchIds.size !== 1) throw new Error('Playable targets must belong to one batch');
  const batchId = input.targets[0]?.batchId;
  if (batchId === undefined) throw new Error('At least one playable target is required');

  const rowsByClueId = indexRows(input.generatedRows);
  const evidenceByClueId = indexEvidence(input.evidence, rowsByClueId, batchId);
  const targetOldIds = new Set<string>();
  const replacements = new Map<string, Readonly<{
    clueId: string;
    category: PlayableCategory;
    question: PlayableQuestion;
    removed: ContentEvidence;
  }>>();
  const replacedClueIds: string[] = [];
  const inspiredByDifficulty = { medium: 0, hard: 0 };
  let sequence = 0;

  for (const [index, target] of input.targets.entries()) {
    const category = categories[index]!;
    const rowsByTier = targetRowsByTier(input.generatedRows, target);
    const questionsByTier = new Map(category.questions.map((question) => [question.tier, question]));
    for (const tier of [1, 2, 3, 4, 5] as const) {
      const row = rowsByTier.get(tier)!;
      const removed = evidenceByClueId.get(row.clue_id)!;
      if (removed.origin === 'openTdbInspired') inspiredByDifficulty[target.difficulty] += 1;
      sequence += 1;
      const clueId = `${target.packId}-playable-corpus-${sequence.toString().padStart(3, '0')}`;
      replacements.set(row.clue_id, {
        clueId,
        category,
        question: questionsByTier.get(tier)!,
        removed,
      });
      replacedClueIds.push(row.clue_id);
      targetOldIds.add(row.clue_id);
    }
  }

  for (const difficulty of ['medium', 'hard'] as const) {
    const expected = input.targets.filter((target) => target.difficulty === difficulty).length;
    if (inspiredByDifficulty[difficulty] !== expected) {
      throw new Error(
        `Expected ${expected} OpenTDB-inspired ${difficulty} target clues; found ${inspiredByDifficulty[difficulty]}`,
      );
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
    if (retainedFactKeys.has(question.factKey)) {
      throw new Error(`Replacement fact key collides with retained evidence: ${question.factKey}`);
    }
  }

  const transformRows = (
    rows: readonly Record<string, string>[],
    authored: boolean,
  ): readonly Record<string, string>[] => rows.map((row) => {
    const replacement = replacements.get(row.clue_id);
    return replacement === undefined
      ? row
      : replaceTargetRow(
          row,
          replacement.question,
          replacement.category,
          replacement.clueId,
          authored,
        );
  });

  const evidence = [
    ...input.evidence.filter((record) => !targetOldIds.has(record.clueId)),
    ...[...replacements.values()].map((replacement) => createEvidence(
      replacement.clueId,
      batchId,
      replacement.question,
      replacement.removed,
    )),
  ].sort((left, right) => compareCodeUnits(left.clueId, right.clueId));

  return {
    authoredRows: transformRows(input.authoredRows, true),
    generatedRows: transformRows(input.generatedRows, false),
    evidence,
    replacedClueIds,
  };
}
