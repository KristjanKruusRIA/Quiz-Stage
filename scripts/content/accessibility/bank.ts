import { ART_MYTHOLOGY_CATEGORIES } from './banks/artMythology';
import { GEOGRAPHY_SCIENCE_FOOD_CATEGORIES } from './banks/geographyScienceFood';
import { HISTORY_LITERATURE_SCREEN_CATEGORIES } from './banks/historyLiteratureScreen';
import { SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES } from './banks/societyTechnologyCulture';
import { LEGACY_EASY_TARGETS } from './targets';
import type { AccessibleCategory } from './types';
import { validateAccessibleCorpus } from './validateBank';

export { validateAccessibleCorpus } from './validateBank';

export function buildAccessibleCorpus(): readonly AccessibleCategory[] {
  return validateAccessibleCorpus(
    [
      ...ART_MYTHOLOGY_CATEGORIES,
      ...SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES,
      ...GEOGRAPHY_SCIENCE_FOOD_CATEGORIES,
      ...HISTORY_LITERATURE_SCREEN_CATEGORIES,
    ],
    LEGACY_EASY_TARGETS,
  );
}
