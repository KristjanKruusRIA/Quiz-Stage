import { describe, expect, it } from 'vitest';
import type {
  AccessibleCategory,
  AccessibleQuestion,
} from '../../../scripts/content/accessibility/types';
import {
  findCrossTierCandidates,
  findCrossTierPrimaryResponseConcentrations,
  findStaleConfirmedCrossTierDuplicatePairIds,
  findStaleCrossTierCandidateReviews,
  findStaleCrossTierConcentrationReviews,
  findUnreviewedCrossTierCandidates,
  findUnreviewedCrossTierConcentrations,
  normalizeCrossTierText,
} from '../../../scripts/content/playability/crossTierAudit';
import type {
  PlayableCategory,
  PlayableQuestion,
} from '../../../scripts/content/playability/types';

type QuestionOverrides = Readonly<{
  subjectKey?: string;
  clueEn?: string;
  clueEt?: string;
  responseEn?: string;
  responseEt?: string;
  variantsEn?: readonly string[];
  variantsEt?: readonly string[];
  explanationEn?: string;
  explanationEt?: string;
  sourceTitle?: string;
  sourceUrl?: string;
}>;

function accessibleCategory(
  id: string,
  overrides: QuestionOverrides = {},
): AccessibleCategory {
  const question: AccessibleQuestion = {
    key: `${id}:question:1`,
    tier: 1,
    subjectKey: overrides.subjectKey ?? `easy-subject:${id}`,
    clue: {
      en: overrides.clueEn ?? `easytoken ${id}`,
      et: overrides.clueEt ?? `lihtnetunnus ${id}`,
    },
    response: {
      en: overrides.responseEn ?? `easyanswer ${id}`,
      et: overrides.responseEt ?? `lihtnevastus ${id}`,
    },
    acceptedVariants: {
      en: overrides.variantsEn ?? [],
      et: overrides.variantsEt ?? [],
    },
    explanation: {
      en: overrides.explanationEn ?? 'Easy explanation.',
      et: overrides.explanationEt ?? 'Lihtne selgitus.',
    },
    source: {
      sourceId: `easy-source:${id}`,
      title: overrides.sourceTitle ?? `Easy source ${id}`,
      url: overrides.sourceUrl ?? `https://easy.example/${id}`,
      license: 'CC-BY-4.0',
      retrievedAt: '2026-09-05',
    },
  };
  return {
    categorySetId: id,
    batchId: '01-history',
    name: { en: `Easy ${id}`, et: `Lihtne ${id}` },
    questions: [question],
  };
}

function playableCategory(
  id: string,
  overrides: QuestionOverrides = {},
): PlayableCategory {
  const question: PlayableQuestion = {
    key: `${id}:question:1`,
    factKey: `${id}:fact:1`,
    tier: 1,
    subjectKey: overrides.subjectKey ?? `playable-subject:${id}`,
    clue: {
      en: overrides.clueEn ?? `hardtoken ${id}`,
      et: overrides.clueEt ?? `rasketunnus ${id}`,
    },
    response: {
      en: overrides.responseEn ?? `hardanswer ${id}`,
      et: overrides.responseEt ?? `raskevastus ${id}`,
    },
    acceptedVariants: {
      en: overrides.variantsEn ?? [],
      et: overrides.variantsEt ?? [],
    },
    explanation: {
      en: overrides.explanationEn ?? 'Hard explanation.',
      et: overrides.explanationEt ?? 'Raske selgitus.',
    },
    source: {
      sourceId: `playable-source:${id}`,
      title: overrides.sourceTitle ?? `Hard source ${id}`,
      url: overrides.sourceUrl ?? `https://hard.example/${id}`,
      license: 'CC-BY-4.0',
      retrievedAt: '2026-09-05',
    },
  };
  return {
    categorySetId: id,
    batchId: '01-history',
    packId: 'built-in-history',
    difficulty: 'medium',
    name: { en: `Medium ${id}`, et: `Keskmine ${id}` },
    questions: [question],
  };
}

function reasons(
  easy: AccessibleCategory,
  playable: PlayableCategory,
): readonly string[] {
  return findCrossTierCandidates([easy], [playable])[0]?.reasons ?? [];
}

describe('cross-tier candidate discovery', () => {
  it('preserves C, C++, and C# as distinct normalized subjects', () => {
    expect(normalizeCrossTierText('C')).toBe('c');
    expect(normalizeCrossTierText('C++')).toBe('cplusplus');
    expect(normalizeCrossTierText('C#')).toBe('csharp');
    expect(new Set([
      normalizeCrossTierText('C'),
      normalizeCrossTierText('C++'),
      normalizeCrossTierText('C#'),
    ])).toHaveLength(3);
  });

  it('finds an identical normalized subject key', () => {
    expect(reasons(
      accessibleCategory('easy-subject', { subjectKey: 'language:C++' }),
      playableCategory('medium-subject', { subjectKey: ' LANGUAGE : C++ ' }),
    )).toEqual(['subject-key']);
  });

  it('finds the same normalized subject slug across specific namespaces', () => {
    expect(reasons(
      accessibleCategory('easy-subject-slug', { subjectKey: 'object:quartz' }),
      playableCategory('medium-subject-slug', { subjectKey: 'clock:quartz' }),
    )).toEqual(['subject-key']);
  });

  it('finds an identical normalized source URL', () => {
    expect(reasons(
      accessibleCategory('easy-url', { sourceUrl: 'HTTPS://Example.COM/wiki/Ada/' }),
      playableCategory('medium-url', { sourceUrl: 'https://example.com/wiki/Ada' }),
    )).toEqual(['source-url']);
  });

  it('clears URL fragments without collapsing distinct query strings', () => {
    expect(reasons(
      accessibleCategory('easy-url-fragment', {
        sourceUrl: 'https://example.com/topic?view=full#history',
      }),
      playableCategory('medium-url-fragment', {
        sourceUrl: 'https://example.com/topic?view=full#legacy',
      }),
    )).toEqual(['source-url']);

    expect(findCrossTierCandidates(
      [accessibleCategory('easy-url-query', {
        sourceUrl: 'https://example.com/topic?view=summary#history',
      })],
      [playableCategory('medium-url-query', {
        sourceUrl: 'https://example.com/topic?view=full#history',
      })],
    )).toEqual([]);
  });

  it('finds an identical source heading after publisher suffixes are removed', () => {
    expect(reasons(
      accessibleCategory('easy-heading', { sourceTitle: 'Ada Lovelace - Wikipedia' }),
      playableCategory('medium-heading', { sourceTitle: 'Ada Lovelace | Britannica' }),
    )).toEqual(['source-heading']);
  });

  it('uses canonical and variant responses as candidate signals', () => {
    expect(reasons(
      accessibleCategory('easy-alias', { variantsEn: ['The Bard'] }),
      playableCategory('medium-alias', { responseEn: 'the bard' }),
    )).toEqual(['response-overlap-en']);
  });

  it('finds an Estonian-only canonical and variant response overlap', () => {
    expect(reasons(
      accessibleCategory('easy-et-alias', {
        responseEn: 'lynx',
        responseEt: 'ilves',
        variantsEt: ['metsakass'],
      }),
      playableCategory('medium-et-alias', {
        responseEn: 'bobcat',
        responseEt: 'metsakass',
      }),
    )).toEqual(['response-overlap-et']);
  });

  it('does not compare response aliases across different locale fields', () => {
    expect(findCrossTierCandidates(
      [
      accessibleCategory('easy-cross-locale', {
        responseEn: 'tee',
        responseEt: 'tii',
      }),
      ],
      [
      playableCategory('medium-cross-locale', {
        responseEn: 'tea',
        responseEt: 'tee',
      }),
      ],
    )).toEqual([]);
  });

  it('finds English lexical overlap at the stated thresholds', () => {
    expect(reasons(
      accessibleCategory('easy-lexical', {
        clueEn: 'alpha beta gamma delta epsilon',
        responseEn: 'amber',
      }),
      playableCategory('medium-lexical', {
        clueEn: 'alpha beta gamma zeta eta',
        responseEn: 'cobalt',
      }),
    )).toEqual(['english-lexical']);

    expect(reasons(
      accessibleCategory('easy-containment', {
        clueEn: 'alpha beta gamma delta epsilon',
        responseEn: 'amber',
      }),
      playableCategory('medium-containment', {
        clueEn: 'alpha beta gamma',
        responseEn: 'cobalt',
      }),
    )).toEqual(['english-lexical']);
  });

  it('requires at least three shared English tokens and the similarity threshold', () => {
    expect(findCrossTierCandidates(
      [accessibleCategory('easy-below', {
        clueEn: 'alpha beta gamma delta epsilon zeta eta theta',
        responseEn: 'amber',
      })],
      [playableCategory('medium-below', {
        clueEn: 'alpha beta gamma iota kappa lambda mu nu',
        responseEn: 'cobalt',
      })],
    )).toEqual([]);

    expect(findCrossTierCandidates(
      [accessibleCategory('easy-two', { clueEn: 'alpha beta', responseEn: 'amber' })],
      [playableCategory('medium-two', { clueEn: 'alpha beta', responseEn: 'cobalt' })],
    )).toEqual([]);
  });

  it('finds inverse answer-in-clue matches in English and Estonian', () => {
    expect(reasons(
      accessibleCategory('easy-inverse-en', {
        clueEn: 'Which biome includes taiga?',
        responseEn: 'lynx',
      }),
      playableCategory('medium-inverse-en', {
        clueEn: 'Where does the lynx live?',
        responseEn: 'taiga',
      }),
    )).toEqual(['inverse-answer-in-clue-en']);

    expect(reasons(
      accessibleCategory('easy-inverse-et', {
        clueEt: 'Millises ookeanis elab sinivaal?',
        responseEt: 'ookean',
      }),
      playableCategory('medium-inverse-et', {
        clueEt: 'Kus asub see ookean?',
        responseEt: 'sinivaal',
      }),
    )).toEqual(['inverse-answer-in-clue-et']);
  });

  it('does not treat a one-way answer mention as an inverse pair', () => {
    expect(findCrossTierCandidates(
      [accessibleCategory('easy-one-way', {
        clueEn: 'amber question',
        responseEn: 'red panda',
      })],
      [playableCategory('medium-one-way', {
        clueEn: 'Which habitat supports the red panda?',
        responseEn: 'cobalt',
      })],
    )).toEqual([]);
  });

  it('ignores a leading English article in an inverse pair', () => {
    expect(reasons(
      accessibleCategory('easy-article-answer', {
        clueEn: 'A protest track named Zombie belongs to which band?',
        responseEn: 'The Cranberries',
      }),
      playableCategory('medium-article-answer', {
        clueEn: 'This Irish group was called Cranberries.',
        responseEn: 'Zombie',
      }),
    )).toEqual(['inverse-answer-in-clue-en']);
  });

  it('does not form inverse pairs from answers shorter than three characters', () => {
    expect(findCrossTierCandidates(
      [accessibleCategory('easy-complete-answer', {
        clueEn: 'Which letter marks Normandy?',
        responseEn: 'Normandy',
      })],
      [playableCategory('medium-complete-answer', {
        clueEn: 'Which region was marked D?',
        responseEn: 'D',
      })],
    )).toEqual([]);
  });
});

describe('cross-tier distinct-pair review', () => {
  it('accepts only the exact Easy ID, Medium/Hard ID, and proposition hash', () => {
    const candidates = findCrossTierCandidates(
      [accessibleCategory('easy-reviewed', { subjectKey: 'person:ada-lovelace' })],
      [playableCategory('medium-reviewed', { subjectKey: 'person:ada-lovelace' })],
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      easyId: 'easy-reviewed:1',
      playableId: 'medium-reviewed:1',
      propositionHash: '98bb6e196a1b',
      reviewKey: 'easy-reviewed:1>medium-reviewed:1@98bb6e196a1b',
    });
    expect(findUnreviewedCrossTierCandidates(candidates, [
      'easy-reviewed:1>medium-reviewed:1@98bb6e196a1b',
    ])).toEqual([]);
    expect(findStaleCrossTierCandidateReviews(candidates, [
      'easy-reviewed:1>medium-reviewed:1@98bb6e196a1b',
    ])).toEqual([]);
    expect(findUnreviewedCrossTierCandidates(candidates, [
      'easy-reviewed:1>wrong-medium:1@98bb6e196a1b',
    ])).toEqual(candidates);
    expect(findUnreviewedCrossTierCandidates(candidates, [
      'easy-reviewed:1>medium-reviewed:1@000000000000',
    ])).toEqual(candidates);
    expect(findStaleCrossTierCandidateReviews(candidates, [
      'easy-reviewed:1>medium-reviewed:1@000000000000',
    ])).toEqual(['easy-reviewed:1>medium-reviewed:1@000000000000']);
  });

  it('invalidates a reviewed pair when its proposition changes', () => {
    const easy = accessibleCategory('easy-mutation', { subjectKey: 'person:grace-hopper' });
    const playable = playableCategory('medium-mutation', { subjectKey: 'person:grace-hopper' });
    const original = findCrossTierCandidates([easy], [playable]);
    const mutated = findCrossTierCandidates([easy], [{
      ...playable,
      questions: [{
        ...playable.questions[0]!,
        clue: {
          ...playable.questions[0]!.clue,
          en: `${playable.questions[0]!.clue.en} A materially different proposition.`,
        },
      }],
    }]);

    expect(original).toHaveLength(1);
    expect(mutated).toHaveLength(1);
    expect(mutated[0]!.propositionHash).not.toBe(original[0]!.propositionHash);
    expect(findUnreviewedCrossTierCandidates(mutated, [original[0]!.reviewKey]))
      .toEqual(mutated);
    expect(findStaleCrossTierCandidateReviews(mutated, [original[0]!.reviewKey]))
      .toEqual([original[0]!.reviewKey]);
  });

  it('invalidates a reviewed pair when only a localized category title changes', () => {
    const easy = accessibleCategory('easy-title', { subjectKey: 'person:marie-curie' });
    const playable = playableCategory('medium-title', { subjectKey: 'person:marie-curie' });
    const original = findCrossTierCandidates([easy], [playable]);
    const renamed = findCrossTierCandidates([{
      ...easy,
      name: { ...easy.name, et: 'Muudetud eestikeelne kategooria' },
    }], [playable]);

    expect(original).toHaveLength(1);
    expect(renamed).toHaveLength(1);
    expect(renamed[0]!.propositionHash).not.toBe(original[0]!.propositionHash);
    expect(findUnreviewedCrossTierCandidates(renamed, [original[0]!.reviewKey]))
      .toEqual(renamed);
    expect(findStaleCrossTierCandidateReviews(renamed, [original[0]!.reviewKey]))
      .toEqual([original[0]!.reviewKey]);
  });

  it('invalidates a reviewed pair when only an explanation changes', () => {
    const easy = accessibleCategory('easy-explanation', { subjectKey: 'person:hedy-lamarr' });
    const playable = playableCategory('medium-explanation', { subjectKey: 'person:hedy-lamarr' });
    const original = findCrossTierCandidates([easy], [playable]);
    const changed = findCrossTierCandidates([easy], [{
      ...playable,
      questions: [{
        ...playable.questions[0]!,
        explanation: {
          ...playable.questions[0]!.explanation,
          et: 'Sisuliselt muudetud eestikeelne selgitus.',
        },
      }],
    }]);

    expect(original).toHaveLength(1);
    expect(changed).toHaveLength(1);
    expect(changed[0]!.propositionHash).not.toBe(original[0]!.propositionHash);
    expect(findUnreviewedCrossTierCandidates(changed, [original[0]!.reviewKey]))
      .toEqual(changed);
    expect(findStaleCrossTierCandidateReviews(changed, [original[0]!.reviewKey]))
      .toEqual([original[0]!.reviewKey]);
  });

  it('orders canonically equivalent IDs by UTF-16 code units', () => {
    const candidates = findCrossTierCandidates([
      accessibleCategory('easy-\u00e9', { subjectKey: 'person:ordering' }),
      accessibleCategory('easy-e\u0301', { subjectKey: 'person:ordering' }),
    ], [playableCategory('medium-ordering', { subjectKey: 'person:ordering' })]);

    expect(candidates.map(({ easyId }) => easyId)).toEqual([
      'easy-e\u0301:1',
      'easy-\u00e9:1',
    ]);
  });

  it('reports a confirmed duplicate pair when its candidate disappears', () => {
    const easy = accessibleCategory('easy-confirmed', { subjectKey: 'person:alan-turing' });
    const playable = playableCategory('medium-confirmed', { subjectKey: 'person:alan-turing' });
    const candidates = findCrossTierCandidates([easy], [playable]);
    const confirmedPairId = 'easy-confirmed:1>medium-confirmed:1';

    expect(findStaleConfirmedCrossTierDuplicatePairIds(
      candidates,
      [confirmedPairId],
    )).toEqual([]);

    const disappeared = findCrossTierCandidates([easy], [{
      ...playable,
      questions: [{
        ...playable.questions[0]!,
        subjectKey: 'person:katherine-johnson',
      }],
    }]);
    expect(disappeared).toEqual([]);
    expect(findStaleConfirmedCrossTierDuplicatePairIds(
      disappeared,
      [confirmedPairId],
    )).toEqual([confirmedPairId]);
  });
});

describe('cross-tier primary-response concentration review', () => {
  it('reports primary-response groups independently in each language', () => {
    const easy = [
      accessibleCategory('easy-france-one', {
        responseEn: 'France', responseEt: 'Prantsusmaa', variantsEn: ['French Republic'],
      }),
      accessibleCategory('easy-france-two', {
        responseEn: 'France', responseEt: 'Prantsusmaa',
      }),
    ];
    const playable = [playableCategory('medium-france', {
      responseEn: 'France', responseEt: 'Prantsusmaa',
    })];

    expect(findCrossTierPrimaryResponseConcentrations(easy, playable)).toEqual([
      expect.objectContaining({
        responseKey: 'en:france',
        ownerIds: ['easy-france-one:1', 'easy-france-two:1', 'medium-france:1'],
      }),
      expect.objectContaining({
        responseKey: 'et:prantsusmaa',
        ownerIds: ['easy-france-one:1', 'easy-france-two:1', 'medium-france:1'],
      }),
    ]);
  });

  it('finds one-language concentrations when the other translations differ', () => {
    const easy = [
      accessibleCategory('easy-en-one', { responseEn: 'Mercury', responseEt: 'Elavh\u00f5be' }),
      accessibleCategory('easy-en-two', { responseEn: 'Mercury', responseEt: 'Merkuur' }),
      accessibleCategory('easy-et-one', { responseEn: 'Rowan', responseEt: 'Pihlakas' }),
      accessibleCategory('easy-et-two', { responseEn: 'Mountain ash', responseEt: 'Pihlakas' }),
    ];
    const playable = [
      playableCategory('medium-en', { responseEn: 'Mercury', responseEt: 'Mercury' }),
      playableCategory('medium-et', { responseEn: 'Sorbus', responseEt: 'Pihlakas' }),
    ];

    expect(findCrossTierPrimaryResponseConcentrations(easy, playable).map((concentration) => ({
      responseKey: concentration.responseKey,
      ownerIds: concentration.ownerIds,
    }))).toEqual([
      {
        responseKey: 'en:mercury',
        ownerIds: ['easy-en-one:1', 'easy-en-two:1', 'medium-en:1'],
      },
      {
        responseKey: 'et:pihlakas',
        ownerIds: ['easy-et-one:1', 'easy-et-two:1', 'medium-et:1'],
      },
    ]);
  });

  it('does not let accepted variants create or inflate concentration groups', () => {
    const easy = [
      accessibleCategory('easy-primary', {
        responseEn: 'Gaul', responseEt: 'Gallia', variantsEn: ['France'], variantsEt: ['Prantsusmaa'],
      }),
      accessibleCategory('easy-france', { responseEn: 'France', responseEt: 'Prantsusmaa' }),
    ];
    const playable = [playableCategory('medium-france', {
      responseEn: 'France', responseEt: 'Prantsusmaa',
    })];

    expect(findCrossTierPrimaryResponseConcentrations(easy, playable)).toEqual([]);
  });

  it('accepts only the exact reviewed concentration ownership', () => {
    const concentrations = findCrossTierPrimaryResponseConcentrations([
      accessibleCategory('easy-germany-one', { responseEn: 'Germany', responseEt: 'Saksamaa' }),
      accessibleCategory('easy-germany-two', { responseEn: 'Germany', responseEt: 'Saksamaa' }),
    ], [
      playableCategory('medium-germany', { responseEn: 'Germany', responseEt: 'Saksamaa' }),
    ]);

    expect(concentrations).toHaveLength(2);
    const reviewedKeys = concentrations.map(({ reviewKey }) => reviewKey);
    expect(findUnreviewedCrossTierConcentrations(concentrations, reviewedKeys))
      .toEqual([]);
    expect(findStaleCrossTierConcentrationReviews(
      concentrations,
      reviewedKeys,
    )).toEqual([]);
    const tamperedKeys = [
      `${concentrations[0]!.reviewKey}tampered`,
      concentrations[1]!.reviewKey,
    ];
    expect(findUnreviewedCrossTierConcentrations(concentrations, tamperedKeys))
      .toEqual([concentrations[0]]);
    expect(findStaleCrossTierConcentrationReviews(concentrations, tamperedKeys))
      .toEqual([`${concentrations[0]!.reviewKey}tampered`]);
  });

  it('invalidates a concentration review when only an owner explanation changes', () => {
    const easy = [
      accessibleCategory('easy-owner-one', {
        responseEn: 'Mercury', responseEt: 'Elavh\u00f5be',
      }),
      accessibleCategory('easy-owner-two', {
        responseEn: 'Mercury', responseEt: 'Merkuur',
      }),
    ];
    const playable = [playableCategory('medium-owner', {
      responseEn: 'Mercury', responseEt: 'Mercury',
    })];
    const original = findCrossTierPrimaryResponseConcentrations(easy, playable);
    const changed = findCrossTierPrimaryResponseConcentrations(easy, [{
      ...playable[0]!,
      questions: [{
        ...playable[0]!.questions[0]!,
        explanation: {
          ...playable[0]!.questions[0]!.explanation,
          en: 'A materially different explanation.',
        },
      }],
    }]);

    expect(original).toHaveLength(1);
    expect(changed).toHaveLength(1);
    expect(changed[0]!.reviewKey).not.toBe(original[0]!.reviewKey);
    expect(findUnreviewedCrossTierConcentrations(changed, [original[0]!.reviewKey]))
      .toEqual(changed);
    expect(findStaleCrossTierConcentrationReviews(changed, [original[0]!.reviewKey]))
      .toEqual([original[0]!.reviewKey]);
  });
});
