import type { LocalizedText, PlayableCategory, PlayableQuestion } from './types';
import type { PlayableTarget } from './targets';

const LANGUAGES = [
  ['en', 'English'],
  ['et', 'Estonian'],
] as const;
const GENERIC_TITLE = /^(?:mix|medley|tour|grab bag|roundup|sampler|potpourri|challenge|quiz|odds ends|segu|varia|mitmesugust)(?:\s+\d+)?$/u;
const ENGLISH_CURRENT_CUE = /\b(?:currently|today|now|presently|at present|most recent|latest|incumbent|sitting)\b/u;
const ENGLISH_CURRENT_CONTEXT = /\bcurrent\s+(?:(?:[a-z]\s+){1,3})?(?:president|prime minister|chief executive(?: officer)?|ceo|mayor|governor|leader|chair(?:person|man|woman)?|officeholder|(?:world |national )?record holder|(?:(?:formula one )?world )?champion|population|ranking|tallest|highest|largest|newest)\b/u;
const ESTONIAN_CURRENT_CUE = /\b(?:praegu|hetkel|tänapäeval|praegune|viimane|uusim|ametis olev)\b/u;
const ENGLISH_RELATION_CUE = /\b(?:president|prime minister|chief executive(?: officer)?|ceo|mayor|governor|leader|chair(?:person|man|woman)?|officeholder|record holder|champion|population|ranking|tallest|highest|largest|newest|building|skyscraper)\b/u;
const ESTONIAN_RELATION_CUE = /\b(?:president|peaminister|tegevjuht|linnapea|kuberner|juht|esimees|rekord|rahvaarv|kõrgeim|kõige kõrgem|hoone|pilvelõhkuja)\b/u;
const RELATION_CLAUSE_SEPARATOR = /(?:[;:]|,(?!\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b)|[!?]+|\s+[–—-]\s+|\.(?=\s+(?!(?:aasta(?:l)?|jaanuaril|veebruaril|märtsil|aprillil|mail|juunil|juulil|augustil|septembril|oktoobril|novembril|detsembril)\b)))\s*/iu;
const SET_SHAPED_SUBJECT_NAMESPACES = new Set([
  'bank',
  'batch',
  'category',
  'category-set',
  'pack',
  'set',
  'subject',
  'theme',
  'topic',
]);
const NUMERIC_SUBJECT_NAMESPACES = new Set(['element', 'mission', 'year']);
const ENGLISH_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;
const ESTONIAN_MONTHS = [
  'jaanuaril', 'veebruaril', 'märtsil', 'aprillil', 'mail', 'juunil',
  'juulil', 'augustil', 'septembril', 'oktoobril', 'novembril', 'detsembril',
] as const;

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}+#]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string'
    && normalize(value) !== ''
    && /[\p{L}\p{N}]/u.test(value.normalize('NFKC'));
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

function hasGenericTitle(value: string): boolean {
  const suffix = value.split(':').at(-1) ?? value;
  return GENERIC_TITLE.test(normalize(suffix));
}

function canonicalSubjectKey(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/\s*:\s*/gu, ':')
    .replace(/[_\s\u2010-\u2015]+/gu, '-')
    .replace(/-{2,}/gu, '-');
}

function validateSubjectKey(question: PlayableQuestion, category: PlayableCategory): string {
  const key = question.subjectKey;
  const canonical = canonicalSubjectKey(key);
  if (key !== canonical) {
    throw new Error(`Question ${question.key} has a non-canonical subject key: ${key}`);
  }
  if (!/^[a-z][a-z0-9-]*:[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(key)) {
    throw new Error(`Question ${question.key} has an invalid subject key: ${key}`);
  }
  const [namespace, slug] = key.split(':') as [string, string];
  if (SET_SHAPED_SUBJECT_NAMESPACES.has(namespace)
    || slug.includes(category.categorySetId)
    || /^built-in-.+-set-\d+(?:-|$)/u.test(slug)) {
    throw new Error(`Question ${question.key} has a set-shaped subject key: ${key}`);
  }
  if (/^\d+$/u.test(slug) && !NUMERIC_SUBJECT_NAMESPACES.has(namespace)) {
    throw new Error(`Question ${question.key} has a digits-only subject key: ${key}`);
  }
  // Semantic aliases require editorial/global review; this validator enforces structural identity.
  return canonical;
}

function isBinaryOrMultipleChoice(value: string, language: 'en' | 'et'): boolean {
  const prompt = normalize(value);
  if (language === 'en') {
    return /^(?:am|are|can|could|did|do|does|had|has|have|is|should|was|were|will|would)\b/u
      .test(prompt)
      || /^(?:which|what)\s+(?:one\s+)?of\s+(?:these|the following)\b/u.test(prompt)
      || /^which\s+(?:one\s+)?is\s+(?:larger|smaller|older|younger|higher|lower|longer|shorter|faster|slower|closer|farther|more|less)\b[^?]*\bor\b/u
        .test(prompt)
      || /^which\s+(?:came|comes)\s+first\b[^?]*\bor\b/u.test(prompt)
      || /^(?:answer|respond|say|state)\s+(?:with\s+)?(?:true\s+(?:or\s+)?false|yes\s+(?:or\s+)?no)\b/u
        .test(prompt)
      || /^(?:true\s*(?:or\s*)?false|yes\s*(?:or\s*)?no)\b/u.test(prompt);
  }
  return /^(?:kas|on|olid|oli|saab|võib)\b/u.test(prompt)
    || /^(?:milline|mis)\s+(?:üks\s+)?(?:neist|järgmistest)\b/u.test(prompt)
    || /^kumb\b/u.test(prompt)
    || /^(?:asub|kasutab|kehtib|kuulub|sisaldab|sõltub|tähendab|toimub)\b[^.!?]*\?\s*$/iu
      .test(value.trim())
    || /^(?:vasta|ütle)\s+(?:jah\s+(?:või\s+)?ei|tõene\s+(?:või\s+)?väär)\b/u.test(prompt)
    || /^(?:jah\s*(?:või\s*)?ei|tõene\s*(?:või\s*)?väär)\b/u.test(prompt);
}

function hasEnglishCurrentCue(value: string): boolean {
  const normalized = normalize(value);
  return ENGLISH_CURRENT_CUE.test(normalized) || ENGLISH_CURRENT_CONTEXT.test(normalized);
}

function changingRelationScope(
  value: string,
  language: 'en' | 'et',
): Readonly<{ clause: string; precedingPreamble?: string }> {
  const clauses = value.split(RELATION_CLAUSE_SEPARATOR).filter((clause) => clause.trim() !== '');
  const hasCue = language === 'en'
    ? (clause: string) => hasEnglishCurrentCue(clause)
      || ENGLISH_RELATION_CUE.test(normalize(clause))
    : (clause: string) => ESTONIAN_CURRENT_CUE.test(normalize(clause))
      || ESTONIAN_RELATION_CUE.test(normalize(clause));
  let relationIndex = clauses.length - 1;
  while (relationIndex > 0 && !hasCue(clauses[relationIndex]!)) relationIndex -= 1;
  return {
    clause: clauses[relationIndex] ?? value,
    precedingPreamble: relationIndex > 0 ? clauses[relationIndex - 1] : undefined,
  };
}

function isPureDatePreamble(value: string | undefined, language: 'en' | 'et'): boolean {
  if (value === undefined) return false;
  if (language === 'en') {
    return /^\s*as of\s+(?:1[5-9]\d{2}|20\d{2}|2100)\s*$/iu.test(value);
  }
  return /^\s*(?:(?:1[5-9]\d{2}|20\d{2}|2100)\.?\s+aasta seisuga|seisuga\s+(?:1[5-9]\d{2}|20\d{2}|2100))\s*$/iu
    .test(value);
}

function hasLeadingDatePreamble(value: string, language: 'en' | 'et'): boolean {
  const match = language === 'en'
    ? /^\s*as of\s+(?:1[5-9]\d{2}|20\d{2}|2100)(?:\s*[,;:]|\s*\.(?=\s)|\s+[–—-]\s+)(?<remainder>\s*\S.*)$/iu.exec(value)
    : /^\s*(?:(?:1[5-9]\d{2}|20\d{2}|2100)\.?\s+aasta seisuga|seisuga\s+(?:1[5-9]\d{2}|20\d{2}|2100))(?:\s*[,;:]|\s*\.(?=\s)|\s+[–—-]\s+)(?<remainder>\s*\S.*)$/iu.exec(value);
  const remainder = match?.groups?.remainder;
  if (remainder === undefined) return false;

  const cue = language === 'en'
    ? /\b(?:currently|today|now|presently|at present|most recent|latest|incumbent|sitting|president|prime minister|chief executive(?: officer)?|ceo|mayor|governor|leader|chair(?:person|man|woman)?|officeholder|record holder|champion|population|ranking|tallest|highest|largest|newest|building|skyscraper)\b/iu.exec(remainder)
    : /\b(?:praegu|hetkel|tänapäeval|praegune|viimane|uusim|ametis olev|president|peaminister|tegevjuht|linnapea|kuberner|juht|esimees|rekord|rahvaarv|kõrgeim|kõige kõrgem|hoone|pilvelõhkuja)\b/iu.exec(remainder);
  if (cue === null) return false;
  const sentenceBoundary = /[!?]+|\.(?=\s+[\p{Pi}\p{Ps}"']*\p{Lu})/u.exec(remainder);
  return sentenceBoundary === null || cue.index < sentenceBoundary.index;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month
    && date.getUTCDate() === day;
}

function hasValidEnglishCalendarDate(value: string): boolean {
  const match = /\bon\s+(?:(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?|(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)),?\s+(1[5-9]\d{2}|20\d{2}|2100)\b/iu
    .exec(value);
  const monthName = match?.[1] ?? match?.[4];
  const dayText = match?.[2] ?? match?.[3];
  const yearText = match?.[5];
  if (!monthName || !dayText || !yearText) return false;
  const month = ENGLISH_MONTHS.indexOf(monthName.toLocaleLowerCase('en') as typeof ENGLISH_MONTHS[number]);
  return isValidCalendarDate(Number(yearText), month, Number(dayText));
}

function hasValidEstonianCalendarDate(value: string): boolean {
  const match = /\b(\d{1,2})\.\s*(jaanuaril|veebruaril|märtsil|aprillil|mail|juunil|juulil|augustil|septembril|oktoobril|novembril|detsembril)\s+(1[5-9]\d{2}|20\d{2}|2100)\b/iu
    .exec(value);
  if (!match?.[1] || !match[2] || !match[3]) return false;
  const month = ESTONIAN_MONTHS.indexOf(match[2].toLocaleLowerCase('et') as typeof ESTONIAN_MONTHS[number]);
  return isValidCalendarDate(Number(match[3]), month, Number(match[1]));
}

function hasExplicitDate(value: string, language: 'en' | 'et'): boolean {
  if (hasLeadingDatePreamble(value, language)) return true;
  const { clause, precedingPreamble } = changingRelationScope(value, language);
  if (isPureDatePreamble(precedingPreamble, language)) return true;
  if (language === 'en') {
    if (/\bas of\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b/iu.test(clause)) return true;
    if (hasEnglishCurrentCue(clause)) return false;
    return /\b(?:in|during)\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b/iu.test(clause)
      || hasValidEnglishCalendarDate(clause);
  }
  if (/\b(?:1[5-9]\d{2}|20\d{2}|2100)\.?\s+aasta seisuga\b|\bseisuga\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b/iu
    .test(clause)) return true;
  if (ESTONIAN_CURRENT_CUE.test(normalize(clause))) return false;
  return /\b(?:1[5-9]\d{2}|20\d{2}|2100)\.?\s+aastal\b/iu.test(clause)
    || hasValidEstonianCalendarDate(clause);
}

function asksUndatedChangingFact(value: string, language: 'en' | 'et'): boolean {
  if (language === 'en') {
    const changing = hasEnglishCurrentCue(value)
      || /^(?:who|which person)\s+is\b[^?]{0,100}\b(?:president|prime minister|chief executive(?: officer)?|ceo|mayor|governor|leader|chair(?:person|man|woman)?)\b/iu
        .test(value)
      || /\b(?:which|what) country\b[^?]{0,100}\bhas\b[^?]{0,60}\b(?:largest|highest) population\b/iu
        .test(value)
      || /\b(?:building|skyscraper)\b[^?]{0,80}\b(?:tallest|highest)\b|\b(?:tallest|highest)\b[^?]{0,80}\b(?:building|skyscraper)\b/iu
        .test(value)
      || /^(?:who|which person)\s+holds\b[^?]{0,100}\b(?:world |national )?record\b/iu
        .test(value);
    return changing && !hasExplicitDate(value, language);
  }
  const changing = ESTONIAN_CURRENT_CUE.test(normalize(value))
    || /^(?:kes|milline isik)\s+on\b[^?]{0,100}\b(?:president|peaminister|tegevjuht|linnapea|kuberner|juht|esimees)\b/iu
      .test(value)
    || /\bmillisel riigil\b[^?]{0,60}\bon\b[^?]{0,60}\bsuurim rahvaarv\b/iu.test(value)
    || /\b(?:hoone|pilvelõhkuja)\b[^?]{0,80}\b(?:kõrgeim|kõige kõrgem)\b|\b(?:kõrgeim|kõige kõrgem)\b[^?]{0,80}\b(?:hoone|pilvelõhkuja)\b/iu
      .test(value)
    || /^kes\s+hoiab\b[^?]{0,100}\brekordit\b/iu.test(value);
  return changing && !hasExplicitDate(value, language);
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
    const url = new URL(source.url);
    const pathname = url.pathname.replace(/\/+$/u, '').toLocaleLowerCase('en');
    return url.protocol === 'https:'
      && pathname !== ''
      && !/^\/(?:home(?:page)?|index|default)(?:\.(?:html?|php|aspx?))?$/u.test(pathname);
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
    for (const variant of question.acceptedVariants[language]) {
      if (containsNormalizedPhrase(question.clue[language], variant)) {
        throw new Error(
          `Question ${question.key} leaks its ${label} accepted variant in the clue`,
        );
      }
      if (containsNormalizedPhrase(category.name[language], variant)) {
        throw new Error(
          `Question ${question.key} leaks its ${label} accepted variant in the category title`,
        );
      }
    }
  }
}

function clueAnswerIdentity(question: PlayableQuestion, language: 'en' | 'et'): string {
  return [normalize(question.clue[language]), normalize(question.response[language])].join('\0');
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
  const clueAnswerOwners = {
    en: new Map<string, Readonly<{ categorySetId: string; key: string }>>(),
    et: new Map<string, Readonly<{ categorySetId: string; key: string }>>(),
  };

  for (const category of ordered) {
    validateLocalizedText(category.name, `Category ${category.categorySetId}`, 'title');
    for (const [language, label] of LANGUAGES) {
      if (hasGenericTitle(category.name[language])) {
        throw new Error(`Category ${category.categorySetId} has a generic ${label} category title`);
      }
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
      const subjectKey = validateSubjectKey(question, category);
      if (subjectKeys.has(subjectKey)) {
        throw new Error(
          `Category ${category.categorySetId} has duplicate subject key: ${question.subjectKey}`,
        );
      }
      subjectKeys.add(subjectKey);

      validateQuestionText(question, category);
      if (!hasValidSource(question)) {
        throw new Error(`Question ${question.key} has an invalid source`);
      }

      for (const [language, label] of LANGUAGES) {
        const identity = clueAnswerIdentity(question, language);
        const existingOwner = clueAnswerOwners[language].get(identity);
        if (existingOwner !== undefined) {
          const scope = existingOwner.categorySetId === category.categorySetId
            ? `within category ${category.categorySetId}`
            : 'across categories';
          throw new Error(
            `Duplicate clue/answer pair ${scope} (${label}): ${question.key} duplicates ${existingOwner.key}`,
          );
        }
        clueAnswerOwners[language].set(identity, {
          categorySetId: category.categorySetId,
          key: question.key,
        });
      }
    }
  }

  return ordered;
}
