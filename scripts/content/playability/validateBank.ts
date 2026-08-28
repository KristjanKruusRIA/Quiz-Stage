import type { LocalizedText, PlayableCategory, PlayableQuestion } from './types';
import type { PlayableTarget } from './targets';

const LANGUAGES = [
  ['en', 'English'],
  ['et', 'Estonian'],
] as const;

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
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

function containsNormalizedPhrase(value: string, phrase: string): boolean {
  return ` ${normalize(value)} `.includes(` ${normalize(phrase)} `);
}

function isBinaryOrMultipleChoice(value: string, language: 'en' | 'et'): boolean {
  const prompt = normalize(value);
  if (language === 'en') {
    return /^(?:am|are|can|could|did|do|does|had|has|have|is|should|was|were|will|would)\b/u
      .test(prompt)
      || /^(?:which|what)\s+(?:one\s+)?of\s+(?:these|the following)\b/u.test(prompt)
      || /\b(?:true\s*(?:or\s*)?false|yes\s*(?:or\s*)?no)\b/u.test(prompt);
  }
  return /^(?:kas|on|olid|oli|saab|võib)\b/u.test(prompt)
    || /^(?:milline|mis)\s+(?:üks\s+)?(?:neist|järgmistest)\b/u.test(prompt)
    || /\b(?:jah\s*(?:või\s*)?ei|tõene\s*(?:või\s*)?väär)\b/u.test(prompt);
}

function asksUndatedChangingFact(value: string, language: 'en' | 'et'): boolean {
  if (language === 'en') {
    const changing = /\b(?:currently|today|now|presently|at present|most recent|latest|incumbent|sitting)\b/u
      .test(normalize(value))
      || /^(?:who|which person)\s+is\b[^?]{0,100}\b(?:president|prime minister|chief executive(?: officer)?|ceo|mayor|governor|leader|chair(?:person|man|woman)?)\b/iu
        .test(value)
      || /\b(?:which|what) country\b[^?]{0,100}\bhas\b[^?]{0,60}\b(?:largest|highest) population\b/iu
        .test(value);
    return changing && !/\bas of\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b/iu.test(value);
  }
  const changing = /\b(?:praegu|hetkel|tänapäeval|praegune|viimane|uusim|ametis olev)\b/u
    .test(normalize(value))
    || /^(?:kes|milline isik)\s+on\b[^?]{0,100}\b(?:president|peaminister|tegevjuht|linnapea|kuberner|juht|esimees)\b/iu
      .test(value)
    || /\bmillisel riigil\b[^?]{0,60}\bon\b[^?]{0,60}\bsuurim rahvaarv\b/iu.test(value);
  return changing
    && !/\b(?:1[5-9]\d{2}|20\d{2}|2100)\.?\s+aasta seisuga\b|\bseisuga\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b/iu
      .test(value);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function hasValidSource(question: PlayableQuestion): boolean {
  const source = question.source;
  if (!isNonEmpty(source?.sourceId)
    || !isNonEmpty(source.title)
    || !isNonEmpty(source.license)
    || !isIsoDate(source.retrievedAt)) {
    return false;
  }
  try {
    return new URL(source.url).protocol === 'https:';
  } catch {
    return false;
  }
}

function validateAcceptedVariants(question: PlayableQuestion): void {
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

function validateQuestionText(question: PlayableQuestion, category: PlayableCategory): void {
  validateLocalizedText(question.clue, `Question ${question.key}`, 'clue');
  validateLocalizedText(question.response, `Question ${question.key}`, 'response');
  validateLocalizedText(question.explanation, `Question ${question.key}`, 'explanation');
  validateAcceptedVariants(question);

  for (const [language, label] of LANGUAGES) {
    if (isBinaryOrMultipleChoice(question.clue[language], language)) {
      throw new Error(`Question ${question.key} uses a binary or multiple-choice ${label} prompt`);
    }
    if (asksUndatedChangingFact(question.clue[language], language)) {
      throw new Error(
        `Question ${question.key} asks about an unstable fact without an explicit date`,
      );
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

function clueAnswerIdentity(question: PlayableQuestion): string {
  return [
    normalize(question.clue.en),
    normalize(question.response.en),
    normalize(question.clue.et),
    normalize(question.response.et),
  ].join('\0');
}

export function validatePlayableCorpus(
  categories: readonly PlayableCategory[],
  expectedTargets: readonly PlayableTarget[],
): readonly PlayableCategory[] {
  if (categories.length !== expectedTargets.length) {
    throw new Error(
      `Expected ${expectedTargets.length} playable categories; found ${categories.length}`,
    );
  }

  const targetById = new Map<string, PlayableTarget>();
  for (const target of expectedTargets) {
    if (targetById.has(target.categorySetId)) {
      throw new Error(`Duplicate target category: ${target.categorySetId}`);
    }
    targetById.set(target.categorySetId, target);
  }

  const categoryById = new Map<string, PlayableCategory>();
  for (const category of categories) {
    const target = targetById.get(category.categorySetId);
    if (target === undefined) {
      throw new Error(`Category ${category.categorySetId} is not present in the target ledger`);
    }
    if (categoryById.has(category.categorySetId)) {
      throw new Error(`Duplicate playable category: ${category.categorySetId}`);
    }
    if (category.batchId !== target.batchId
      || category.packId !== target.packId
      || category.difficulty !== target.difficulty) {
      throw new Error(`Category ${category.categorySetId} does not match its target ledger identity`);
    }
    categoryById.set(category.categorySetId, category);
  }

  const ordered = expectedTargets.map((target) => {
    const category = categoryById.get(target.categorySetId);
    if (category === undefined) {
      throw new Error(`Missing playable category: ${target.categorySetId}`);
    }
    return category;
  });

  const titleOwners = {
    en: new Map<string, string>(),
    et: new Map<string, string>(),
  };
  const questionKeys = new Set<string>();
  const factKeys = new Set<string>();
  const clueAnswerOwners = new Map<string, Readonly<{ categorySetId: string; key: string }>>();

  for (const category of ordered) {
    validateLocalizedText(category.name, `Category ${category.categorySetId}`, 'title');
    for (const [language, label] of LANGUAGES) {
      const title = normalize(category.name[language]);
      const existingOwner = titleOwners[language].get(title);
      if (existingOwner !== undefined) {
        throw new Error(
          `Duplicate ${label} category title: ${category.categorySetId} duplicates ${existingOwner}`,
        );
      }
      titleOwners[language].set(title, category.categorySetId);
    }

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

      if (!isNonEmpty(question.factKey)) {
        throw new Error(`Question ${question.key} has an empty fact key`);
      }
      if (factKeys.has(question.factKey)) {
        throw new Error(`Duplicate fact key: ${question.factKey}`);
      }
      factKeys.add(question.factKey);

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

      const identity = clueAnswerIdentity(question);
      const existingOwner = clueAnswerOwners.get(identity);
      if (existingOwner !== undefined) {
        const scope = existingOwner.categorySetId === category.categorySetId
          ? `within category ${category.categorySetId}`
          : 'across categories';
        throw new Error(
          `Duplicate clue/answer pair ${scope}: ${question.key} duplicates ${existingOwner.key}`,
        );
      }
      clueAnswerOwners.set(identity, { categorySetId: category.categorySetId, key: question.key });
    }
  }

  return ordered;
}
