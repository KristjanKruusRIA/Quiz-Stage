import { describe, expect, it } from 'vitest';
import {
  FINAL_BATCH,
  PRODUCTION_BATCHES,
  acceptedBatchPaths,
  getProductionBatch,
} from '../../../scripts/content/productionBatches';
import type { BatchDistribution } from '../../../scripts/content/productionBatches';

const expectedBatches = [
  ['01-history', 'built-in-history', 'history', ['ancient', 'medieval', 'early-modern', 'modern', 'political', 'social', 'military', 'economic', 'archaeological', 'cultural'], [[17, 17], [17, 16], [16, 17]]],
  ['02-geography', 'built-in-geography', 'geography', ['countries-capitals', 'cities', 'physical-geography', 'rivers-lakes', 'mountains', 'islands', 'borders', 'maps-coordinates', 'human-geography', 'landmarks'], [[17, 17], [16, 17], [17, 16]]],
  ['03-science-nature', 'built-in-science-nature', 'science-nature', ['physics', 'chemistry', 'astronomy', 'biology', 'medicine-history', 'earth-science', 'weather-climate', 'ecology', 'animals', 'plants'], [[17, 17], [17, 16], [16, 17]]],
  ['04-literature-language', 'built-in-literature-language', 'literature-language', ['world-literature', 'authors', 'novels', 'poetry', 'drama', 'literary-movements', 'fictional-characters', 'linguistics', 'etymology', 'writing-systems'], [[17, 17], [16, 17], [17, 16]]],
  ['05-art-architecture', 'built-in-art-architecture', 'art-architecture', ['painting', 'sculpture', 'photography-history', 'design', 'artists', 'museums', 'architecture', 'buildings', 'movements', 'materials-techniques'], [[17, 16], [17, 17], [16, 17]]],
  ['06-music', 'built-in-music', 'music', ['classical', 'jazz', 'rock', 'pop', 'folk-world', 'composers', 'performers', 'albums', 'instruments', 'music-theory-history'], [[16, 17], [17, 17], [17, 16]]],
  ['07-film-television', 'built-in-film-television', 'film-television', ['world-cinema', 'directors', 'actors', 'awards', 'genres', 'animation', 'television-history', 'series', 'production-craft', 'screen-adaptations'], [[17, 16], [17, 17], [16, 17]]],
  ['08-sports-games', 'built-in-sports-games', 'sports-games', ['association-football', 'basketball', 'athletics', 'winter-sports', 'racket-sports', 'motorsport', 'olympics', 'traditional-sports', 'board-card-games', 'video-game-history'], [[16, 17], [17, 17], [17, 16]]],
  ['09-food-drink', 'built-in-food-drink', 'food-drink', ['world-cuisines', 'ingredients', 'dishes', 'cooking-techniques', 'baking', 'non-alcoholic-drinks', 'alcohol-history', 'food-geography', 'culinary-figures', 'food-science'], [[17, 16], [16, 17], [17, 17]]],
  ['10-technology-inventions', 'built-in-technology-inventions', 'technology-inventions', ['computing-history', 'communications', 'transportation', 'engineering', 'materials', 'energy', 'space-technology', 'inventors', 'standards-units', 'everyday-devices'], [[16, 17], [17, 16], [17, 17]]],
  ['11-politics-economics-society', 'built-in-politics-economics-society', 'politics-economics-society', ['political-systems', 'constitutions', 'historical-leaders', 'international-institutions', 'economics', 'currencies', 'law-courts', 'sociology', 'education', 'demographics'], [[17, 16], [16, 17], [17, 17]]],
  ['12-mythology-religion-philosophy', 'built-in-mythology-religion-philosophy', 'mythology-religion-philosophy', ['greek-roman', 'norse', 'egyptian', 'baltic-finnic', 'asian', 'african', 'american', 'world-religions', 'ancient-philosophy', 'early-modern-philosophy', 'modern-philosophy'], [[16, 17], [17, 16], [17, 17]]],
] as const;

function countSets(distribution: BatchDistribution): number {
  return Object.values(distribution).reduce(
    (sum, rounds) => sum + rounds.roundOne + rounds.roundTwo,
    0,
  );
}

function sumByDifficultyAndRound(batches: typeof PRODUCTION_BATCHES) {
  return batches.reduce((totals, batch) => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      totals[difficulty].roundOne += batch.distribution![difficulty].roundOne;
      totals[difficulty].roundTwo += batch.distribution![difficulty].roundTwo;
    }
    return totals;
  }, {
    easy: { roundOne: 0, roundTwo: 0 },
    medium: { roundOne: 0, roundTwo: 0 },
    hard: { roundOne: 0, roundTwo: 0 },
  });
}

describe('production batch catalog', () => {
  it('encodes all twelve 100-set batches and the exact global allocation', () => {
    expect(PRODUCTION_BATCHES).toHaveLength(12);
    expect(new Set(PRODUCTION_BATCHES.map((batch) => batch.id)).size).toBe(12);
    expect(PRODUCTION_BATCHES.every((batch) => batch.boardClues === 500)).toBe(true);
    expect(PRODUCTION_BATCHES.reduce((sum, batch) => sum + countSets(batch.distribution!), 0)).toBe(1_200);
    expect(sumByDifficultyAndRound(PRODUCTION_BATCHES)).toEqual({
      easy: { roundOne: 200, roundTwo: 200 },
      medium: { roundOne: 200, roundTwo: 200 },
      hard: { roundOne: 200, roundTwo: 200 },
    });
    expect(FINAL_BATCH.finalClues).toBe(150);
  });

  it('encodes every batch metadata, vocabulary, and difficulty allocation exactly', () => {
    for (const [id, packId, topicFamily, subthemes, distribution] of expectedBatches) {
      const batch = getProductionBatch(id);
      expect(batch).toEqual({
        id,
        packId,
        topicFamily,
        subthemes,
        maxSetsPerSubtheme: 15,
        requiredOpenTdbClues: 100,
        distribution: {
          easy: { roundOne: distribution[0][0], roundTwo: distribution[0][1] },
          medium: { roundOne: distribution[1][0], roundTwo: distribution[1][1] },
          hard: { roundOne: distribution[2][0], roundTwo: distribution[2][1] },
        },
        boardClues: 500,
        finalClues: 0,
      });
    }
  });

  it('defines Finals with every board topic family as its authoritative vocabulary', () => {
    expect(FINAL_BATCH).toEqual({
      id: '13-finals',
      packId: 'built-in-finals',
      topicFamily: 'finals',
      subthemes: expectedBatches.map(([, , topicFamily]) => topicFamily),
      maxSetsPerSubtheme: 15,
      requiredOpenTdbClues: 0,
      distribution: null,
      boardClues: 0,
      finalClues: 150,
    });
    expect(getProductionBatch('13-finals')).toBe(FINAL_BATCH);
  });

  it('resolves every accepted repository-relative batch path', () => {
    expect(acceptedBatchPaths('01-history')).toEqual({
      authored: 'content/authored/01-history.csv',
      generated: 'content/generated/01-history.en-et.csv',
      evidence: 'content/evidence/01-history.jsonl',
      report: 'content/reports/01-history.json',
    });
    expect(acceptedBatchPaths('13-finals')).toEqual({
      authored: 'content/authored/13-finals.csv',
      generated: 'content/generated/13-finals.en-et.csv',
      evidence: 'content/evidence/13-finals.jsonl',
      report: 'content/reports/13-finals.json',
    });
  });

  it('rejects unknown batch IDs for both lookups', () => {
    expect(() => getProductionBatch('not-a-batch')).toThrowError('Unknown production batch: not-a-batch');
    expect(() => acceptedBatchPaths('not-a-batch')).toThrowError('Unknown production batch: not-a-batch');
  });
});
