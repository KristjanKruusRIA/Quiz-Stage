export const RELEASE_THRESHOLDS = {
  boardClues: 7_000,
  categorySets: 1_400,
  distinctCategoryNames: 1_400,
  finalClues: 174,
  easySets: 467,
  mediumSets: 467,
  hardSets: 466,
  builtInPacks: 15,
} as const;

export const RELEASE_COMPOSITION_THRESHOLDS = {
  boardClues: { easy: 2_335, medium: 2_335, hard: 2_330 },
  categorySets: {
    easy: { roundOne: 234, roundTwo: 233 },
    medium: { roundOne: 233, roundTwo: 234 },
    hard: { roundOne: 233, roundTwo: 233 },
  },
  finalClues: { easy: 58, medium: 58, hard: 58 },
} as const;

export type ReleaseSummary = Record<keyof typeof RELEASE_THRESHOLDS, number>;
