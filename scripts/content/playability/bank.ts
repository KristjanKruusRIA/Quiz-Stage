import { GEOGRAPHY_CATEGORIES } from './banks/packs01to04/geography';
import { HISTORY_CATEGORIES } from './banks/packs01to04/history';
import { LITERATURE_LANGUAGE_CATEGORIES } from './banks/packs01to04/literatureLanguage';
import { SCIENCE_NATURE_CATEGORIES } from './banks/packs01to04/scienceNature';
import { PACKS_05_TO_08_CATEGORIES } from './banks/packs05to08';
import { PACKS_09_TO_12_CATEGORIES } from './banks/packs09to12';
import { PLAYABLE_TARGETS } from './targets';
import type { PlayableCategory } from './types';
import { validatePlayableCorpus } from './validateBank';

export function buildPlayableCorpus(): readonly PlayableCategory[] {
  return validatePlayableCorpus([
    ...HISTORY_CATEGORIES,
    ...GEOGRAPHY_CATEGORIES,
    ...SCIENCE_NATURE_CATEGORIES,
    ...LITERATURE_LANGUAGE_CATEGORIES,
    ...PACKS_05_TO_08_CATEGORIES,
    ...PACKS_09_TO_12_CATEGORIES,
  ], PLAYABLE_TARGETS);
}
