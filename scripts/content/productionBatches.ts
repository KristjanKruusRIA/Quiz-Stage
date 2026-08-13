export type BatchDistribution = Readonly<{
  easy: Readonly<{ roundOne: number; roundTwo: number }>;
  medium: Readonly<{ roundOne: number; roundTwo: number }>;
  hard: Readonly<{ roundOne: number; roundTwo: number }>;
}>;

export type ProductionBatchDefinition = Readonly<{
  id: string;
  packId: string;
  topicFamily: string;
  subthemes: readonly string[];
  maxSetsPerSubtheme: number;
  requiredOpenTdbClues: number;
  distribution: BatchDistribution | null;
  boardClues: number;
  finalClues: number;
}>;

export type AcceptedBatchPaths = Readonly<{
  authored: string;
  generated: string;
  evidence: string;
  report: string;
}>;

const TOPIC_DEFINITIONS = [
  ['01-history', 'built-in-history', 'history', ['ancient', 'medieval', 'early-modern', 'modern', 'political', 'social', 'military', 'economic', 'archaeological', 'cultural']],
  ['02-geography', 'built-in-geography', 'geography', ['countries-capitals', 'cities', 'physical-geography', 'rivers-lakes', 'mountains', 'islands', 'borders', 'maps-coordinates', 'human-geography', 'landmarks']],
  ['03-science-nature', 'built-in-science-nature', 'science-nature', ['physics', 'chemistry', 'astronomy', 'biology', 'medicine-history', 'earth-science', 'weather-climate', 'ecology', 'animals', 'plants']],
  ['04-literature-language', 'built-in-literature-language', 'literature-language', ['world-literature', 'authors', 'novels', 'poetry', 'drama', 'literary-movements', 'fictional-characters', 'linguistics', 'etymology', 'writing-systems']],
  ['05-art-architecture', 'built-in-art-architecture', 'art-architecture', ['painting', 'sculpture', 'photography-history', 'design', 'artists', 'museums', 'architecture', 'buildings', 'movements', 'materials-techniques']],
  ['06-music', 'built-in-music', 'music', ['classical', 'jazz', 'rock', 'pop', 'folk-world', 'composers', 'performers', 'albums', 'instruments', 'music-theory-history']],
  ['07-film-television', 'built-in-film-television', 'film-television', ['world-cinema', 'directors', 'actors', 'awards', 'genres', 'animation', 'television-history', 'series', 'production-craft', 'screen-adaptations']],
  ['08-sports-games', 'built-in-sports-games', 'sports-games', ['association-football', 'basketball', 'athletics', 'winter-sports', 'racket-sports', 'motorsport', 'olympics', 'traditional-sports', 'board-card-games', 'video-game-history']],
  ['09-food-drink', 'built-in-food-drink', 'food-drink', ['world-cuisines', 'ingredients', 'dishes', 'cooking-techniques', 'baking', 'non-alcoholic-drinks', 'alcohol-history', 'food-geography', 'culinary-figures', 'food-science']],
  ['10-technology-inventions', 'built-in-technology-inventions', 'technology-inventions', ['computing-history', 'communications', 'transportation', 'engineering', 'materials', 'energy', 'space-technology', 'inventors', 'standards-units', 'everyday-devices']],
  ['11-politics-economics-society', 'built-in-politics-economics-society', 'politics-economics-society', ['political-systems', 'constitutions', 'historical-leaders', 'international-institutions', 'economics', 'currencies', 'law-courts', 'sociology', 'education', 'demographics']],
  ['12-mythology-religion-philosophy', 'built-in-mythology-religion-philosophy', 'mythology-religion-philosophy', ['greek-roman', 'norse', 'egyptian', 'baltic-finnic', 'asian', 'african', 'american', 'world-religions', 'ancient-philosophy', 'early-modern-philosophy', 'modern-philosophy']],
] as const;

const DISTRIBUTIONS = {
  '01-history': [[17, 17], [17, 16], [16, 17]],
  '02-geography': [[17, 17], [16, 17], [17, 16]],
  '03-science-nature': [[17, 17], [17, 16], [16, 17]],
  '04-literature-language': [[17, 17], [16, 17], [17, 16]],
  '05-art-architecture': [[17, 16], [17, 17], [16, 17]],
  '06-music': [[16, 17], [17, 17], [17, 16]],
  '07-film-television': [[17, 16], [17, 17], [16, 17]],
  '08-sports-games': [[16, 17], [17, 17], [17, 16]],
  '09-food-drink': [[17, 16], [16, 17], [17, 17]],
  '10-technology-inventions': [[16, 17], [17, 16], [17, 17]],
  '11-politics-economics-society': [[17, 16], [16, 17], [17, 17]],
  '12-mythology-religion-philosophy': [[16, 17], [17, 16], [17, 17]],
} as const;

type DifficultyRounds = readonly [number, number];

function toDistribution(rounds: readonly [DifficultyRounds, DifficultyRounds, DifficultyRounds]): BatchDistribution {
  return {
    easy: { roundOne: rounds[0][0], roundTwo: rounds[0][1] },
    medium: { roundOne: rounds[1][0], roundTwo: rounds[1][1] },
    hard: { roundOne: rounds[2][0], roundTwo: rounds[2][1] },
  };
}

export const PRODUCTION_BATCHES: readonly ProductionBatchDefinition[] = Object.freeze(
  TOPIC_DEFINITIONS.map(([id, packId, topicFamily, subthemes]) => ({
    id,
    packId,
    topicFamily,
    subthemes,
    maxSetsPerSubtheme: 15,
    requiredOpenTdbClues: 100,
    distribution: toDistribution(DISTRIBUTIONS[id]),
    boardClues: 500,
    finalClues: 0,
  })),
);

export const FINAL_BATCH: ProductionBatchDefinition = Object.freeze({
  id: '13-finals',
  packId: 'built-in-finals',
  topicFamily: 'finals',
  subthemes: TOPIC_DEFINITIONS.map(([, , topicFamily]) => topicFamily),
  maxSetsPerSubtheme: 15,
  requiredOpenTdbClues: 0,
  distribution: null,
  boardClues: 0,
  finalClues: 150,
});

export function getProductionBatch(id: string): ProductionBatchDefinition {
  if (id === FINAL_BATCH.id) return FINAL_BATCH;
  const batch = PRODUCTION_BATCHES.find((candidate) => candidate.id === id);
  if (batch !== undefined) return batch;
  throw new Error(`Unknown production batch: ${id}`);
}

export function acceptedBatchPaths(id: string): AcceptedBatchPaths {
  const batch = getProductionBatch(id);
  return {
    authored: `content/authored/${batch.id}.csv`,
    generated: `content/generated/${batch.id}.en-et.csv`,
    evidence: `content/evidence/${batch.id}.jsonl`,
    report: `content/reports/${batch.id}.json`,
  };
}
