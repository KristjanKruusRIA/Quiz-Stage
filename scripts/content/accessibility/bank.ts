import { ART_MYTHOLOGY_CATEGORIES } from './banks/artMythology';
import { GEOGRAPHY_SCIENCE_FOOD_CATEGORIES } from './banks/geographyScienceFood';
import { HISTORY_LITERATURE_SCREEN_CATEGORIES } from './banks/historyLiteratureScreen';
import { REAUTHORED_RETAINED_EASY_CATEGORIES } from './banks/retainedEasy';
import { SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES } from './banks/societyTechnologyCulture';
import { LEGACY_EASY_TARGET_IDS, LEGACY_EASY_TARGETS } from './targets';
import type { AccessibleCategory } from './types';
import { validateAccessibleCorpus } from './validateBank';

export { validateAccessibleCorpus } from './validateBank';

function normalizedIdentity(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, '');
}

function alignReauthoredSubjectKeys(
  categories: readonly AccessibleCategory[],
): readonly AccessibleCategory[] {
  const subjectByFact = new Map<string, string>();
  return categories.map((category) => ({
    ...category,
    questions: category.questions.map((question) => {
      const identity = [
        normalizedIdentity(question.response.en),
        normalizedIdentity(question.response.et),
        normalizedIdentity(question.source.url),
      ].join('\0');
      const canonicalSubject = subjectByFact.get(identity);
      subjectByFact.set(identity, canonicalSubject ?? question.subjectKey);
      if (!question.key.startsWith('retained-easy-') || canonicalSubject === undefined) {
        return question;
      }
      return { ...question, subjectKey: canonicalSubject };
    }),
  }));
}

export function buildAccessibleCorpus(): readonly AccessibleCategory[] {
  const targetById = new Map(LEGACY_EASY_TARGETS.map((target) => [target.categorySetId, target]));
  const corpusTargets = LEGACY_EASY_TARGET_IDS.map((categorySetId) => {
    const target = targetById.get(categorySetId);
    if (target === undefined) throw new Error(`Missing Easy target: ${categorySetId}`);
    return target;
  });

  return validateAccessibleCorpus(
    alignReauthoredSubjectKeys([
      ...ART_MYTHOLOGY_CATEGORIES,
      ...SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES,
      ...GEOGRAPHY_SCIENCE_FOOD_CATEGORIES,
      ...HISTORY_LITERATURE_SCREEN_CATEGORIES,
      ...REAUTHORED_RETAINED_EASY_CATEGORIES,
    ]),
    corpusTargets,
  );
}
