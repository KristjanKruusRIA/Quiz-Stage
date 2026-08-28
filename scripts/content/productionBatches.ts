export type BatchDistribution = Readonly<{
  easy: Readonly<{ roundOne: number; roundTwo: number }>;
  medium: Readonly<{ roundOne: number; roundTwo: number }>;
  hard: Readonly<{ roundOne: number; roundTwo: number }>;
}>;

export type FinalTopicAllocation = Readonly<{
  packId: string;
  packName: string;
  easy: number;
  medium: number;
  hard: number;
}>;

export type ProductionBatchDefinition = Readonly<{
  id: string;
  packId: string;
  packName: string;
  topicFamily: string;
  subthemes: readonly string[];
  maxSetsPerSubtheme: number;
  requiredOpenTdbClues: number;
  distribution: BatchDistribution | null;
  finalTopicAllocations: Readonly<Record<string, FinalTopicAllocation>> | null;
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
  ['01-history', 'built-in-history', 'History Pack', 'history', ['ancient', 'medieval', 'early-modern', 'modern', 'political', 'social', 'military', 'economic', 'archaeological', 'cultural'], 100],
  ['02-geography', 'built-in-geography', 'Geography Pack', 'geography', ['countries-capitals', 'cities', 'physical-geography', 'rivers-lakes', 'mountains', 'islands', 'borders', 'maps-coordinates', 'human-geography', 'landmarks'], 100],
  ['03-science-nature', 'built-in-science-nature', 'Science and Nature Pack', 'science-nature', ['physics', 'chemistry', 'astronomy', 'biology', 'medicine-history', 'earth-science', 'weather-climate', 'ecology', 'animals', 'plants'], 100],
  ['04-literature-language', 'built-in-literature-language', 'Literature and Language Pack', 'literature-language', ['world-literature', 'authors', 'novels', 'poetry', 'drama', 'literary-movements', 'fictional-characters', 'linguistics', 'etymology', 'writing-systems'], 100],
  ['05-art-architecture', 'built-in-art-architecture', 'Art and Architecture Pack', 'art-architecture', ['painting', 'sculpture', 'photography-history', 'design', 'artists', 'museums', 'architecture', 'buildings', 'movements', 'materials-techniques'], 100],
  ['06-music', 'built-in-music', 'Music Pack', 'music', ['classical', 'jazz', 'rock', 'pop', 'folk-world', 'composers', 'performers', 'albums', 'instruments', 'music-theory-history'], 100],
  ['07-film-television', 'built-in-film-television', 'Film and Television Pack', 'film-television', ['world-cinema', 'directors', 'actors', 'awards', 'genres', 'animation', 'television-history', 'series', 'production-craft', 'screen-adaptations'], 100],
  ['08-sports-games', 'built-in-sports-games', 'Sports and Games', 'sports-games', ['association-football', 'basketball', 'athletics', 'winter-sports', 'racket-sports', 'motorsport', 'olympics', 'traditional-sports', 'board-card-games', 'video-game-history'], 100],
  ['09-food-drink', 'built-in-food-drink', 'Food and Drink', 'food-drink', ['world-cuisines', 'ingredients', 'dishes', 'cooking-techniques', 'baking', 'non-alcoholic-drinks', 'alcohol-history', 'food-geography', 'culinary-figures', 'food-science'], 100],
  ['10-technology-inventions', 'built-in-technology-inventions', 'Technology and Inventions', 'technology-inventions', ['computing-history', 'communications', 'transportation', 'engineering', 'materials', 'energy', 'space-technology', 'inventors', 'standards-units', 'everyday-devices'], 100],
  ['11-politics-economics-society', 'built-in-politics-economics-society', 'Politics, Economics, and Society', 'politics-economics-society', ['political-systems', 'constitutions', 'historical-leaders', 'international-institutions', 'economics', 'currencies', 'law-courts', 'sociology', 'education', 'demographics'], 100],
  ['12-mythology-religion-philosophy', 'built-in-mythology-religion-philosophy', 'Mythology, Religion, and Philosophy', 'mythology-religion-philosophy', ['greek-roman', 'norse', 'egyptian', 'baltic-finnic', 'asian', 'african', 'american', 'world-religions', 'ancient-philosophy', 'early-modern-philosophy', 'modern-philosophy'], 100],
  ['14-adult', 'built-in-adult', 'Adult (Mature) / Täiskasvanutele', 'adult', ['sexology-reproductive-health-history', 'relationships-partnership-customs', 'sexuality-identity-society', 'nightlife-adult-social-culture', 'censorship-obscenity-law', 'erotic-art-literature-film-history', 'sex-work-history-regulation', 'adult-entertainment-history', 'vice-moral-regulation', 'landmark-research-terminology'], 0],
  ['15-estonia', 'built-in-estonia', 'Estonia / Eesti', 'estonia', ['history-statehood', 'geography-regions', 'towns-landmarks', 'language-literature', 'folklore-traditions', 'music-performing-arts', 'art-architecture', 'science-technology', 'government-civics', 'nature-environment', 'sports', 'food-everyday-culture'], 0],
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
  '14-adult': [[17, 16], [17, 17], [16, 17]],
  '15-estonia': [[17, 17], [16, 17], [17, 16]],
} as const;

type DifficultyRounds = readonly [number, number];

function toDistribution(rounds: readonly [DifficultyRounds, DifficultyRounds, DifficultyRounds]): BatchDistribution {
  return Object.freeze({
    easy: Object.freeze({ roundOne: rounds[0][0], roundTwo: rounds[0][1] }),
    medium: Object.freeze({ roundOne: rounds[1][0], roundTwo: rounds[1][1] }),
    hard: Object.freeze({ roundOne: rounds[2][0], roundTwo: rounds[2][1] }),
  });
}

export const PRODUCTION_BATCHES: readonly ProductionBatchDefinition[] = Object.freeze(
  TOPIC_DEFINITIONS.map(([id, packId, packName, topicFamily, subthemes, requiredOpenTdbClues]) => Object.freeze({
    id,
    packId,
    packName,
    topicFamily,
    subthemes: Object.freeze([...subthemes]),
    maxSetsPerSubtheme: 15,
    requiredOpenTdbClues,
    distribution: toDistribution(DISTRIBUTIONS[id]),
    finalTopicAllocations: null,
    boardClues: 500,
    finalClues: 0,
  })),
);

const FINAL_TOPIC_ALLOCATIONS: Readonly<Record<string, FinalTopicAllocation>> = Object.freeze(Object.fromEntries(Object.entries({
  history: { packId: 'built-in-finals', packName: 'Finals Pack', easy: 5, medium: 4, hard: 4 },
  geography: { packId: 'built-in-finals', packName: 'Finals Pack', easy: 5, medium: 4, hard: 4 },
  'science-nature': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 5, hard: 4 },
  'literature-language': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 5, hard: 4 },
  'art-architecture': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 5 },
  music: { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 5 },
  'film-television': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'sports-games': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'food-drink': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'technology-inventions': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'politics-economics-society': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'mythology-religion-philosophy': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  adult: { packId: 'built-in-adult', packName: 'Adult (Mature) / Täiskasvanutele', easy: 4, medium: 4, hard: 4 },
  estonia: { packId: 'built-in-estonia', packName: 'Estonia / Eesti', easy: 4, medium: 4, hard: 4 },
}).map(([topic, allocation]) => [topic, Object.freeze(allocation)])));

export const FINAL_BATCH: ProductionBatchDefinition = Object.freeze({
  id: '13-finals',
  packId: 'built-in-finals',
  packName: 'Finals Pack',
  topicFamily: 'finals',
  subthemes: Object.freeze(Object.keys(FINAL_TOPIC_ALLOCATIONS)),
  maxSetsPerSubtheme: 15,
  requiredOpenTdbClues: 0,
  distribution: null,
  finalTopicAllocations: FINAL_TOPIC_ALLOCATIONS,
  boardClues: 0,
  finalClues: 174,
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
