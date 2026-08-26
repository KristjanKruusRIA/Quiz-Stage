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

const expectedPaths = [
  ['01-history', 'content/authored/01-history.csv', 'content/generated/01-history.en-et.csv', 'content/evidence/01-history.jsonl', 'content/reports/01-history.json'],
  ['02-geography', 'content/authored/02-geography.csv', 'content/generated/02-geography.en-et.csv', 'content/evidence/02-geography.jsonl', 'content/reports/02-geography.json'],
  ['03-science-nature', 'content/authored/03-science-nature.csv', 'content/generated/03-science-nature.en-et.csv', 'content/evidence/03-science-nature.jsonl', 'content/reports/03-science-nature.json'],
  ['04-literature-language', 'content/authored/04-literature-language.csv', 'content/generated/04-literature-language.en-et.csv', 'content/evidence/04-literature-language.jsonl', 'content/reports/04-literature-language.json'],
  ['05-art-architecture', 'content/authored/05-art-architecture.csv', 'content/generated/05-art-architecture.en-et.csv', 'content/evidence/05-art-architecture.jsonl', 'content/reports/05-art-architecture.json'],
  ['06-music', 'content/authored/06-music.csv', 'content/generated/06-music.en-et.csv', 'content/evidence/06-music.jsonl', 'content/reports/06-music.json'],
  ['07-film-television', 'content/authored/07-film-television.csv', 'content/generated/07-film-television.en-et.csv', 'content/evidence/07-film-television.jsonl', 'content/reports/07-film-television.json'],
  ['08-sports-games', 'content/authored/08-sports-games.csv', 'content/generated/08-sports-games.en-et.csv', 'content/evidence/08-sports-games.jsonl', 'content/reports/08-sports-games.json'],
  ['09-food-drink', 'content/authored/09-food-drink.csv', 'content/generated/09-food-drink.en-et.csv', 'content/evidence/09-food-drink.jsonl', 'content/reports/09-food-drink.json'],
  ['10-technology-inventions', 'content/authored/10-technology-inventions.csv', 'content/generated/10-technology-inventions.en-et.csv', 'content/evidence/10-technology-inventions.jsonl', 'content/reports/10-technology-inventions.json'],
  ['11-politics-economics-society', 'content/authored/11-politics-economics-society.csv', 'content/generated/11-politics-economics-society.en-et.csv', 'content/evidence/11-politics-economics-society.jsonl', 'content/reports/11-politics-economics-society.json'],
  ['12-mythology-religion-philosophy', 'content/authored/12-mythology-religion-philosophy.csv', 'content/generated/12-mythology-religion-philosophy.en-et.csv', 'content/evidence/12-mythology-religion-philosophy.jsonl', 'content/reports/12-mythology-religion-philosophy.json'],
  ['13-finals', 'content/authored/13-finals.csv', 'content/generated/13-finals.en-et.csv', 'content/evidence/13-finals.jsonl', 'content/reports/13-finals.json'],
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

  it('deeply freezes every public catalog value', () => {
    expect(Object.isFrozen(PRODUCTION_BATCHES)).toBe(true);
    for (const batch of PRODUCTION_BATCHES) {
      expect(Object.isFrozen(batch)).toBe(true);
      expect(Object.isFrozen(batch.subthemes)).toBe(true);
      expect(Object.isFrozen(batch.distribution)).toBe(true);
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        expect(Object.isFrozen(batch.distribution![difficulty])).toBe(true);
      }
    }
    expect(Object.isFrozen(FINAL_BATCH)).toBe(true);
    expect(Object.isFrozen(FINAL_BATCH.subthemes)).toBe(true);
  });

  it('resolves every accepted repository-relative batch path exactly', () => {
    for (const [id, authored, generated, evidence, report] of expectedPaths) {
      expect(acceptedBatchPaths(id)).toEqual({ authored, generated, evidence, report });
    }
  });

  it('rejects unknown batch IDs for both lookups', () => {
    expect(() => getProductionBatch('not-a-batch')).toThrowError('Unknown production batch: not-a-batch');
    expect(() => acceptedBatchPaths('not-a-batch')).toThrowError('Unknown production batch: not-a-batch');
  });
});
