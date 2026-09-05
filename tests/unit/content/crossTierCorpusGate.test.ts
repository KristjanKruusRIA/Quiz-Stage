import { describe, expect, it } from 'vitest';
import { buildAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
import type { AccessibleCategory } from '../../../scripts/content/accessibility/types';
import { buildEasyExpansionCorpus } from '../../../scripts/content/easyExpansion/bank';
import type { EasyExpansionCategory } from '../../../scripts/content/easyExpansion/types';
import { buildPlayableCorpus } from '../../../scripts/content/playability/bank';
import type { PlayableCategory } from '../../../scripts/content/playability/types';
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

function buildEasyCrossTierCorpus(
  acceptedEasy: readonly AccessibleCategory[],
  phaseB: readonly EasyExpansionCategory[],
): readonly AccessibleCategory[] {
  return [...acceptedEasy, ...phaseB];
}

const phaseBCategory: EasyExpansionCategory = {
  categorySetId: 'built-in-history-set-101',
  batchId: '01-history',
  packId: 'built-in-history',
  difficulty: 'easy',
  round: 'round-one',
  macroTopic: 'History',
  name: { en: 'Familiar History', et: 'Tuttav ajalugu' },
  questions: [{
    clueId: 'built-in-history-easy-expansion-001',
    key: 'history-easy-expansion-question-001',
    factKey: 'history:shared-fact',
    tier: 1,
    subjectKey: 'history:shared-subject',
    clue: { en: 'This Phase B clue is deliberately shared.', et: 'See B-etapi vihje on meelega kattuv.' },
    response: { en: 'Shared answer', et: 'Jagatud vastus' },
    acceptedVariants: { en: [], et: [] },
    explanation: { en: 'Fixture explanation.', et: 'Näite selgitus.' },
    source: {
      sourceId: 'phase-b-fixture-source',
      title: 'Phase B fixture source',
      url: 'https://example.com/phase-b-fixture',
      license: 'CC-BY-4.0',
      retrievedAt: '2026-09-06',
    },
  }],
};

const playableCategory: PlayableCategory = {
  categorySetId: 'built-in-history-set-201',
  batchId: 'history-playable',
  packId: 'built-in-history',
  difficulty: 'medium',
  name: { en: 'Other History', et: 'Muu ajalugu' },
  questions: [{
    key: 'history-medium-question-001',
    factKey: 'history:other-fact',
    tier: 1,
    subjectKey: 'history:shared-subject',
    clue: { en: 'This playable clue is otherwise distinct.', et: 'See mängitav vihje on muidu erinev.' },
    response: { en: 'Other answer', et: 'Muu vastus' },
    acceptedVariants: { en: [], et: [] },
    explanation: { en: 'Fixture explanation.', et: 'Näite selgitus.' },
    source: {
      sourceId: 'playable-fixture-source',
      title: 'Playable fixture source',
      url: 'https://example.com/playable-fixture',
      license: 'CC-BY-4.0',
      retrievedAt: '2026-09-06',
    },
  }],
};

describe('Phase B Easy cross-tier inclusion', () => {
  it('includes an injected Phase B category in candidate detection', () => {
    const easy = buildEasyCrossTierCorpus([], [phaseBCategory]);

    expect(findCrossTierCandidates(easy, [playableCategory])).toEqual([
      expect.objectContaining({
        easyId: 'built-in-history-set-101:1',
        playableId: 'built-in-history-set-201:1',
        reasons: ['subject-key'],
      }),
    ]);
  });
});

describe('default Easy versus Medium/Hard corpus gate', () => {
  it('has no unreviewed semantic duplicates or response concentrations', () => {
    const easy = buildEasyCrossTierCorpus(buildAccessibleCorpus(), buildEasyExpansionCorpus());
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
