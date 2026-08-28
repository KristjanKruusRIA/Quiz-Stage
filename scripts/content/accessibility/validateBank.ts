import type { AccessibleCategory, AccessibleQuestion, LocalizedText } from './types';
import type { LegacyEasyTarget } from './targets';

const LANGUAGES = [
  ['en', 'English'],
  ['et', 'Estonian'],
] as const;

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/\p{P}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsNormalizedPhrase(value: string, phrase: string): boolean {
  return ` ${normalize(value)} `.includes(` ${normalize(phrase)} `);
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && normalize(value) !== '';
}

function validateLocalizedText(
  value: LocalizedText | undefined,
  owner: string,
  field: string,
): void {
  for (const [language, label] of LANGUAGES) {
    if (!isNonEmpty(value?.[language])) {
      throw new Error(`${owner} has an empty ${label} ${field}`);
    }
  }
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function hasValidSource(question: AccessibleQuestion): boolean {
  const source = question.source;
  if (source === undefined || source === null) return false;
  if (!isNonEmpty(source.sourceId) || !isNonEmpty(source.title) || !isNonEmpty(source.license)) {
    return false;
  }
  if (!isIsoDate(source.retrievedAt)) return false;
  try {
    return new URL(source.url).protocol === 'https:';
  } catch {
    return false;
  }
}

function isBinaryPrompt(value: string, language: 'en' | 'et'): boolean {
  const prompt = normalize(value);
  if (language === 'en') {
    return /^(?:am|are|can|could|did|do|does|had|has|have|is|should|was|were|will|would)\b/u.test(prompt)
      || /\b(?:true\s*(?:or\s*)?false|yes\s*(?:or\s*)?no)\b/u.test(prompt);
  }
  return /^(?:kas|on|olid|oli|saab|võib)\b/u.test(prompt)
    || /\b(?:jah\s*(?:või\s*)?ei|tõene\s*(?:või\s*)?väär)\b/u.test(prompt);
}

function validateAcceptedVariants(question: AccessibleQuestion): void {
  const variants = question.acceptedVariants;
  if (!Array.isArray(variants?.en) || !Array.isArray(variants?.et)) {
    throw new Error(
      `Question ${question.key} must provide English and Estonian accepted-variant arrays`,
    );
  }
  for (const [language, label] of LANGUAGES) {
    if (variants[language].some((variant) => !isNonEmpty(variant))) {
      throw new Error(`Question ${question.key} has an empty ${label} accepted variant`);
    }
  }
  if ((variants.en.length === 0) !== (variants.et.length === 0)) {
    throw new Error(`Question ${question.key} must provide bilingual accepted variants`);
  }
}

function validateQuestionText(question: AccessibleQuestion, category: AccessibleCategory): void {
  validateLocalizedText(question.clue, `Question ${question.key}`, 'clue');
  validateLocalizedText(question.response, `Question ${question.key}`, 'response');
  validateLocalizedText(question.explanation, `Question ${question.key}`, 'explanation');
  validateAcceptedVariants(question);

  for (const [language, label] of LANGUAGES) {
    if (isBinaryPrompt(question.clue[language], language)) {
      throw new Error(`Question ${question.key} uses a binary ${label} prompt`);
    }
    const response = question.response[language];
    if (containsNormalizedPhrase(question.clue[language], response)) {
      throw new Error(`Question ${question.key} leaks its ${label} response in the clue`);
    }
    if (containsNormalizedPhrase(category.name[language], response)) {
      throw new Error(
        `Question ${question.key} leaks its ${label} response in the category title`,
      );
    }
  }
}

export function validateAccessibleCorpus(
  categories: readonly AccessibleCategory[],
  expectedTargets: readonly LegacyEasyTarget[],
): readonly AccessibleCategory[] {
  if (categories.length !== expectedTargets.length) {
    throw new Error(
      `Expected ${expectedTargets.length} accessible categories; found ${categories.length}`,
    );
  }

  const targetById = new Map<string, LegacyEasyTarget>();
  for (const target of expectedTargets) {
    if (targetById.has(target.categorySetId)) {
      throw new Error(`Duplicate target category: ${target.categorySetId}`);
    }
    targetById.set(target.categorySetId, target);
  }

  const categoryById = new Map<string, AccessibleCategory>();
  for (const category of categories) {
    const target = targetById.get(category.categorySetId);
    if (target === undefined) {
      throw new Error(`Category ${category.categorySetId} is not present in the target ledger`);
    }
    if (categoryById.has(category.categorySetId)) {
      throw new Error(`Duplicate accessible category: ${category.categorySetId}`);
    }
    if (category.batchId !== target.batchId) {
      throw new Error(
        `Category ${category.categorySetId} has batch ${category.batchId}; expected ${target.batchId}`,
      );
    }
    categoryById.set(category.categorySetId, category);
  }

  const ordered = expectedTargets.map((target) => {
    const category = categoryById.get(target.categorySetId);
    if (category === undefined) {
      throw new Error(`Missing accessible category: ${target.categorySetId}`);
    }
    return category;
  });

  const questionKeys = new Set<string>();
  const clueAnswerOwners = new Map<string, string>();
  for (const category of ordered) {
    validateLocalizedText(category.name, `Category ${category.categorySetId}`, 'title');

    const tiers = category.questions.map(({ tier }) => tier).sort((left, right) => left - right);
    if (category.questions.length !== 5 || tiers.join(',') !== '1,2,3,4,5') {
      throw new Error(
        `Category ${category.categorySetId} must contain tiers 1,2,3,4,5; found ${tiers.join(',')}`,
      );
    }

    const subjectKeys = new Set<string>();
    for (const question of category.questions) {
      if (!isNonEmpty(question.key)) {
        throw new Error(`Category ${category.categorySetId} has a question with an empty key`);
      }
      if (questionKeys.has(question.key)) {
        throw new Error(`Duplicate question key: ${question.key}`);
      }
      questionKeys.add(question.key);

      if (!isNonEmpty(question.subjectKey)) {
        throw new Error(`Question ${question.key} has an empty subject key`);
      }
      if (subjectKeys.has(question.subjectKey)) {
        throw new Error(
          `Category ${category.categorySetId} has duplicate subject key: ${question.subjectKey}`,
        );
      }
      subjectKeys.add(question.subjectKey);

      validateQuestionText(question, category);
      if (!hasValidSource(question)) {
        throw new Error(`Question ${question.key} has an invalid source`);
      }

      const clueAnswerPair = `${normalize(question.clue.en)}\0${normalize(question.response.en)}`;
      const existingOwner = clueAnswerOwners.get(clueAnswerPair);
      if (existingOwner !== undefined) {
        throw new Error(
          `Duplicate English clue/answer pair: ${question.key} duplicates ${existingOwner}`,
        );
      }
      clueAnswerOwners.set(clueAnswerPair, question.key);
    }
  }

  return ordered;
}
