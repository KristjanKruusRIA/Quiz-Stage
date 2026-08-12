export const RELEASE_THRESHOLDS = {
  boardClues: 6_000,
  categorySets: 1_200,
  distinctCategoryNames: 1_200,
  finalClues: 150,
  easySets: 400,
  mediumSets: 400,
  hardSets: 400,
} as const;

export const RELEASE_COMPOSITION_THRESHOLDS = {
  boardCluesPerDifficulty: 2_000,
  categorySetsPerDifficultyRound: 200,
  finalCluesPerDifficulty: 50,
} as const;

export type ReleaseSummary = Record<keyof typeof RELEASE_THRESHOLDS, number>;
