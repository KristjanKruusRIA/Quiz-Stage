import { auditAccessibility } from '../accessibility/audit';
import type { AccessibilityReason } from '../accessibility/types';
import { auditPlayability } from '../playability/audit';
import { normalizeCrossTierText } from '../playability/crossTierAudit';
import type { PlayableCategory } from '../playability/types';
import type { PlayableTarget } from '../playability/targets';
import { validatePlayableCorpus } from '../playability/validateBank';
import type {
  EasyExpansionBatchContract,
  EasyExpansionCategory,
} from './types';

const CATEGORY_COUNT = 20;
const FIRST_SET_SUFFIX = 101;
const ROUND_ONE_CATEGORY_COUNT = 10;
const ANSWER_LANGUAGES = ['en', 'et'] as const;
const BLOCKING_ACCESSIBILITY_REASONS = new Set<AccessibilityReason>([
  'source-prefix',
  'infobox-residue',
  'exact-date-or-number',
  'long-answer',
  'multi-item-answer',
  'binary-question',
  'generic-category-title',
]);
const GENERIC_TITLE = /^(?:(?:quick|curious|everyday|general|random)\s+)?(?:mix|medley|tour|grab bag|roundup|sampler|potpourri|challenge|quiz|odds\s*(?:&|and)\s*ends|segu|varia|mitmesugust)(?:\s+\d+)?$/iu;
const INFOBOX_RESIDUE = /\([^)]*\b(?:born|died|sündinud|suri)\b[^)]*\)/iu;
const ESTONIAN_EXACT_DATE_REQUEST = /\b(?:mis|millisel)\s+(?:täpsel|täielikul)\s+kuupäeval\b|\bmilline\s+on\s+(?:täpne|täielik)\s+kuupäev\b/iu;

function expectedCategoryIds(packId: string): readonly string[] {
  return Array.from(
    { length: CATEGORY_COUNT },
    (_, index) => `${packId}-set-${FIRST_SET_SUFFIX + index}`,
  );
}

function expectedRound(index: number): EasyExpansionCategory['round'] {
  return index < ROUND_ONE_CATEGORY_COUNT ? 'round-one' : 'round-two';
}

function topicFamily(packId: string): string {
  return packId.replace(/^built-in-/u, '');
}

function expectedClueId(
  contract: EasyExpansionBatchContract,
  categoryIndex: number,
  questionIndex: number,
): string {
  const suffix = (categoryIndex * 5 + questionIndex + 1).toString().padStart(3, '0');
  return `built-in-${topicFamily(contract.packId)}-easy-expansion-${suffix}`;
}

function canonicalAnswerAlias(value: string, language: 'en' | 'et'): string {
  const normalized = normalizeCrossTierText(value);
  return language === 'en' ? normalized.replace(/^(?:a|an|the)\s+/u, '') : normalized;
}

function answerEntityCount(category: EasyExpansionCategory): number {
  const parents = category.questions.map((_, index) => index);
  const root = (index: number): number => {
    let result = index;
    while (parents[result] !== result) result = parents[result]!;
    return result;
  };
  const merge = (left: number, right: number): void => {
    const leftRoot = root(left);
    const rightRoot = root(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };
  const aliases = category.questions.map((question) => ({
    en: new Set([question.response.en, ...question.acceptedVariants.en]
      .map((value) => canonicalAnswerAlias(value, 'en'))),
    et: new Set([question.response.et, ...question.acceptedVariants.et]
      .map((value) => canonicalAnswerAlias(value, 'et'))),
  }));

  for (let left = 0; left < aliases.length; left += 1) {
    for (let right = left + 1; right < aliases.length; right += 1) {
      if (ANSWER_LANGUAGES.some((language) => [...aliases[left]![language]]
        .some((alias) => aliases[right]![language].has(alias)))) {
        merge(left, right);
      }
    }
  }
  return new Set(parents.map((_, index) => root(index))).size;
}

function playabilityRows(categories: readonly EasyExpansionCategory[]): readonly Record<string, string>[] {
  return categories.flatMap((category) => category.questions.map((question) => ({
    clue_id: question.clueId,
    category_set_id: category.categorySetId,
    category_name_en: category.name.en,
    category_name_et: category.name.et,
    clue_en: question.clue.en,
    clue_et: question.clue.et,
    response_en: question.response.en,
    response_et: question.response.et,
    source_title: question.source.title,
    subject_key: question.subjectKey,
  })));
}

function validatePhaseBIdentity(
  categories: readonly EasyExpansionCategory[],
  contract: EasyExpansionBatchContract,
): readonly EasyExpansionCategory[] {
  if (categories.length !== CATEGORY_COUNT) {
    throw new Error(`Expected ${CATEGORY_COUNT} easy expansion categories; found ${categories.length}`);
  }

  const expectedIds = expectedCategoryIds(contract.packId);
  const expectedIdSet = new Set(expectedIds);
  const byId = new Map<string, EasyExpansionCategory>();
  for (const category of categories) {
    if (!expectedIdSet.has(category.categorySetId)) {
      throw new Error(
        `Category ${category.categorySetId} is not present in the Phase B set range ${expectedIds[0]}..${expectedIds.at(-1)}`,
      );
    }
    if (byId.has(category.categorySetId)) {
      throw new Error(`Duplicate easy expansion category: ${category.categorySetId}`);
    }
    byId.set(category.categorySetId, category);
  }

  return expectedIds.map((categorySetId) => {
    const category = byId.get(categorySetId);
    if (category === undefined) throw new Error(`Missing easy expansion category: ${categorySetId}`);
    return category;
  });
}

function validatePhaseBAllocation(
  categories: readonly EasyExpansionCategory[],
  contract: EasyExpansionBatchContract,
): void {
  if (!Number.isInteger(contract.maxSetsPerMacroTopic) || contract.maxSetsPerMacroTopic < 1) {
    throw new Error('Maximum sets per macro topic must be a positive integer');
  }
  for (const [macroTopic, count] of Object.entries(contract.existingMacroTopicCounts)) {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`Existing set count for macro topic ${macroTopic} must be a non-negative integer`);
    }
  }
  const allowedMacroTopics = new Set(contract.allowedMacroTopics);
  for (const macroTopic of allowedMacroTopics) {
    if (contract.existingMacroTopicCounts[macroTopic] === undefined) {
      throw new Error(`Missing existing set count for allowed macro topic ${macroTopic}`);
    }
  }
  const macroTopicCounts = new Map<string, number>(Object.entries(contract.existingMacroTopicCounts));

  for (const [categoryIndex, category] of categories.entries()) {
    if (category.batchId !== contract.batchId) {
      throw new Error(`Category ${category.categorySetId} has batch ${category.batchId}; expected ${contract.batchId}`);
    }
    if (category.packId !== contract.packId) {
      throw new Error(`Category ${category.categorySetId} has pack ${category.packId}; expected ${contract.packId}`);
    }
    if (category.difficulty !== 'easy') {
      throw new Error(`Category ${category.categorySetId} has difficulty ${String(category.difficulty)}; expected easy`);
    }
    const round = expectedRound(categoryIndex);
    if (category.round !== round) {
      throw new Error(`Category ${category.categorySetId} has round ${category.round}; expected ${round}`);
    }
    if (!allowedMacroTopics.has(category.macroTopic)) {
      throw new Error(`Category ${category.categorySetId} has macro topic ${category.macroTopic}; expected an allowed topic`);
    }
    if (GENERIC_TITLE.test(normalizeCrossTierText(category.name.en))
      || GENERIC_TITLE.test(normalizeCrossTierText(category.name.et))) {
      const language = GENERIC_TITLE.test(normalizeCrossTierText(category.name.en))
        ? 'English'
        : 'Estonian';
      throw new Error(`Category ${category.categorySetId} has a generic ${language} category title`);
    }

    const tiers = category.questions.map(({ tier }) => tier);
    if (category.questions.length !== 5 || tiers.join(',') !== '1,2,3,4,5') {
      throw new Error(
        `Category ${category.categorySetId} must contain ordered tiers 1,2,3,4,5; found ${tiers.join(',')}`,
      );
    }
    for (const [questionIndex, question] of category.questions.entries()) {
      const clueId = expectedClueId(contract, categoryIndex, questionIndex);
      if (question.clueId !== clueId) {
        throw new Error(`Question ${question.key} has clue ID ${question.clueId}; expected ${clueId}`);
      }
    }

    macroTopicCounts.set(category.macroTopic, (macroTopicCounts.get(category.macroTopic) ?? 0) + 1);
  }

  for (const [macroTopic, count] of macroTopicCounts) {
    if (count > contract.maxSetsPerMacroTopic) {
      throw new Error(`Macro topic ${macroTopic} would contain ${count} sets; maximum is ${contract.maxSetsPerMacroTopic}`);
    }
  }
}

function validateAnswerDiversity(categories: readonly EasyExpansionCategory[]): void {
  for (const category of categories) {
    if (answerEntityCount(category) < 4) {
      throw new Error(`Category ${category.categorySetId} must contain at least four distinct answer entities`);
    }
  }
}

function validateSharedQuestionContract(categories: readonly EasyExpansionCategory[]): void {
  const targets: readonly PlayableTarget[] = categories.map((category) => ({
    categorySetId: category.categorySetId,
    batchId: category.batchId,
    packId: category.packId,
    difficulty: 'medium',
  }));
  const shadows: readonly PlayableCategory[] = categories.map((category) => ({
    categorySetId: category.categorySetId,
    batchId: category.batchId,
    packId: category.packId,
    difficulty: 'medium',
    name: category.name,
    questions: category.questions,
  }));
  validatePlayableCorpus(shadows, targets);
}

function validateAudits(categories: readonly EasyExpansionCategory[]): void {
  const rows = playabilityRows(categories);
  const exactDateRow = rows.find((row) => ESTONIAN_EXACT_DATE_REQUEST.test(row.clue_et ?? ''));
  if (exactDateRow !== undefined) {
    throw new Error(`${exactDateRow.clue_id} failed accessibility check exact-date-or-number`);
  }
  const infoboxRow = rows.find((row) => (
    INFOBOX_RESIDUE.test(row.clue_en ?? '') || INFOBOX_RESIDUE.test(row.clue_et ?? '')
  ));
  if (infoboxRow !== undefined) {
    throw new Error(`${infoboxRow.clue_id} failed accessibility check infobox-residue`);
  }
  const accessibility = auditAccessibility(rows);
  for (const [clueId, reasons] of accessibility.clueReasons) {
    const reason = reasons.find((candidate) => BLOCKING_ACCESSIBILITY_REASONS.has(candidate));
    if (reason !== undefined) throw new Error(`${clueId} failed accessibility check ${reason}`);
  }
  for (const [categoryId, reasons] of accessibility.categoryReasons) {
    const reason = reasons.find((candidate) => BLOCKING_ACCESSIBILITY_REASONS.has(candidate));
    if (reason !== undefined) throw new Error(`${categoryId} failed accessibility check ${reason}`);
  }

  const answerUses = new Map<string, Array<{ categoryId: string; clueId: string }>>();
  for (const row of rows) {
    const answer = canonicalAnswerAlias(row.response_en ?? row.response_et ?? '', 'en');
    const uses = answerUses.get(answer) ?? [];
    uses.push({ categoryId: row.category_set_id!, clueId: row.clue_id! });
    answerUses.set(answer, uses);
  }
  const permittedLocalRepeatIds = new Set([...answerUses.values()]
    .filter((uses) => uses.length === 2 && uses[0]!.categoryId === uses[1]!.categoryId)
    .flatMap((uses) => uses.map(({ clueId }) => clueId)));
  const diagnostic = auditPlayability(rows).diagnostics.find(({ code, id }) => (
    code !== 'repeated-answer' || !permittedLocalRepeatIds.has(id)
  ));
  if (diagnostic !== undefined) {
    throw new Error(`${diagnostic.id} failed playability check ${diagnostic.code}`);
  }
}

export function validateEasyExpansionBank(
  categories: readonly EasyExpansionCategory[],
  contract: EasyExpansionBatchContract,
): readonly EasyExpansionCategory[] {
  const ordered = validatePhaseBIdentity(categories, contract);
  validatePhaseBAllocation(ordered, contract);
  validateSharedQuestionContract(ordered);
  validateAnswerDiversity(ordered);
  validateAudits(ordered);
  return Object.freeze(ordered);
}
