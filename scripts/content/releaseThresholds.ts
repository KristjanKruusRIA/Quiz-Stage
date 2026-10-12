export const RELEASE_THRESHOLDS = {
  boardClues: 11_200,
  categorySets: 2_240,
  distinctCategoryNames: 2_240,
  finalClues: 174,
  easySets: 907,
  mediumSets: 667,
  hardSets: 666,
  builtInPacks: 15,
} as const;

export const RELEASE_COMPOSITION_THRESHOLDS = {
  boardClues: { easy: 4_535, medium: 3_335, hard: 3_330 },
  categorySets: {
    easy: { roundOne: 454, roundTwo: 453 },
    medium: { roundOne: 333, roundTwo: 334 },
    hard: { roundOne: 333, roundTwo: 333 },
  },
  finalClues: { easy: 58, medium: 58, hard: 58 },
} as const;

export type ReleaseSummary = Record<keyof typeof RELEASE_THRESHOLDS, number>;
