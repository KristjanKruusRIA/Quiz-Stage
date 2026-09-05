import { describe, expect, it } from 'vitest';
import { buildAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
import { buildPlayableCorpus } from '../../../scripts/content/playability/bank';
import {
  findCrossTierCandidates,
  findCrossTierPrimaryResponseConcentrations,
  findStaleConfirmedCrossTierDuplicatePairIds,
  findStaleCrossTierCandidateReviews,
  findStaleCrossTierConcentrationReviews,
  findUnreviewedCrossTierCandidates,
  findUnreviewedCrossTierConcentrations,
} from '../../../scripts/content/playability/crossTierAudit';
import {
  CONFIRMED_CROSS_TIER_DUPLICATE_PAIR_IDS,
  REVIEWED_CROSS_TIER_CONCENTRATIONS,
  REVIEWED_DISTINCT_CROSS_TIER_PAIRS,
} from './reviewedCrossTierFacts';

describe('default Easy versus Medium/Hard corpus gate', () => {
  it('has no unreviewed semantic duplicates or response concentrations', () => {
    const easy = buildAccessibleCorpus();
    const playable = buildPlayableCorpus();
    const candidates = findCrossTierCandidates(easy, playable);
    const concentrations = findCrossTierPrimaryResponseConcentrations(easy, playable);
    const unreviewed = findUnreviewedCrossTierCandidates(
      candidates,
      REVIEWED_DISTINCT_CROSS_TIER_PAIRS,
    );
    const confirmedPairs = new Set<string>(CONFIRMED_CROSS_TIER_DUPLICATE_PAIR_IDS);
    const unadjudicated = unreviewed.filter(({ easyId, playableId }) => (
      !confirmedPairs.has(`${easyId}>${playableId}`)
    ));
    const blockerIds = [...new Set(candidates.filter(({ easyId, playableId }) => (
      confirmedPairs.has(`${easyId}>${playableId}`)
    )).map(({ playableId }) => playableId))].sort();
    const concentrationKeys = findUnreviewedCrossTierConcentrations(
      concentrations,
      REVIEWED_CROSS_TIER_CONCENTRATIONS,
    ).map(({ responseKey }) => responseKey);

    expect.soft(findStaleCrossTierCandidateReviews(
      candidates,
      REVIEWED_DISTINCT_CROSS_TIER_PAIRS,
    )).toEqual([]);
    expect.soft(findStaleCrossTierConcentrationReviews(
      concentrations,
      REVIEWED_CROSS_TIER_CONCENTRATIONS,
    )).toEqual([]);
    expect.soft(findStaleConfirmedCrossTierDuplicatePairIds(
      candidates,
      CONFIRMED_CROSS_TIER_DUPLICATE_PAIR_IDS,
    )).toEqual([]);
    expect.soft(unadjudicated).toEqual([]);
    expect.soft(blockerIds).toEqual([]);
    expect.soft(concentrationKeys).toEqual([]);
  }, 20_000);
});
