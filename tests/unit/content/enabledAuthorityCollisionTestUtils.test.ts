import { describe, expect, it } from 'vitest';
import type { EasyExpansionCategory } from '../../../scripts/content/easyExpansion/types';
import {
  completeCumulativeAuthorityCorpus,
  completeEnabledAuthorityCorpus,
  findAuthorityBidirectionalAliasLeaks,
  findAuthorityCollisions,
  findCumulativeAuthorityDefects,
  findAuthorityOneWayAliasLeaks,
  registeredEasyExpansionAuthorityRows,
  type AuthorityRow,
} from './enabledAuthorityCollisionTestUtils';

function fixture(overrides: Partial<AuthorityRow>): AuthorityRow {
  return {
    id: 'fixture:zaatar',
    authority: 'medium-hard',
    factKey: 'seasoning:zaatar:blend',
    subjectKey: 'seasoning:zaatar',
    clue: { en: 'Which seasoning is this?', et: 'Milline maitseaine see on?' },
    response: { en: "za'atar", et: "za'atar" },
    acceptedVariants: { en: ['zaatar'], et: ['zaatar'] },
    explanation: { en: 'A Middle Eastern seasoning blend.', et: 'Lähis-Ida maitseainesegu.' },
    source: { title: "Za'atar", url: 'https://example.com/zaatar' },
    ...overrides,
  };
}

function distinctFixture(overrides: Partial<AuthorityRow> = {}): AuthorityRow {
  return fixture({
    id: 'fixture:distinct',
    factKey: 'place:tartu:university',
    subjectKey: 'place:tartu',
    clue: { en: 'Which Estonian city is home to this university?', et: 'Millises Eesti linnas asub see ülikool?' },
    response: { en: 'Tartu', et: 'Tartu' },
    acceptedVariants: { en: [], et: [] },
    explanation: { en: 'The university is in Tartu.', et: 'Ülikool asub Tartus.' },
    source: { title: 'University of Tartu', url: 'https://example.com/tartu' },
    ...overrides,
  });
}

function phaseBCategory(): EasyExpansionCategory {
  return {
    categorySetId: 'built-in-history-set-101',
    batchId: '01-history',
    packId: 'built-in-history',
    difficulty: 'easy',
    round: 'round-one',
    macroTopic: 'ancient',
    name: { en: 'Familiar Ancient History', et: 'Tuttav antiikajalugu' },
    questions: [{
      clueId: 'built-in-history-easy-expansion-001',
      key: 'history-easy-expansion-001',
      factKey: 'history:rome:colosseum',
      tier: 1,
      subjectKey: 'landmark:colosseum',
      clue: {
        en: 'Which Roman amphitheatre is one of Italy\'s best-known landmarks?',
        et: 'Milline Rooma amfiteater on üks Itaalia tuntumaid vaatamisväärsusi?',
      },
      response: { en: 'Colosseum', et: 'Colosseum' },
      acceptedVariants: { en: ['the Colosseum'], et: [] },
      explanation: {
        en: 'The Colosseum is a large ancient amphitheatre in Rome.',
        et: 'Colosseum on suur antiikne amfiteater Roomas.',
      },
      source: {
        sourceId: 'fixture:colosseum',
        title: 'Colosseum overview',
        url: 'https://example.com/colosseum',
        license: 'CC-BY-4.0',
        retrievedAt: '2026-09-06',
      },
    }],
  };
}

describe('enabled authority one-way alias leakage', () => {
  it('detects a candidate response alias disclosed by another row clue or explanation', () => {
    const candidate = fixture({});
    const clueLeak = fixture({
      id: 'fixture:manakish-clue',
      factKey: 'dish:manakish:flatbread',
      subjectKey: 'dish:manakish',
      clue: {
        en: 'Za’atar and olive oil commonly top which Levantine flatbread?',
        et: 'Millist Levandi lameleiba katavad sageli õli ja ürdid?',
      },
      response: { en: 'manakish', et: 'manakish' },
      acceptedVariants: { en: [], et: [] },
      explanation: {
        en: 'Manakish is a topped flatbread.',
        et: 'Manakish on lameleib, mille tavapärane kate on zaatar.',
      },
      source: { title: 'Manakish', url: 'https://example.com/manakish' },
    });

    expect(findAuthorityCollisions(candidate, [candidate, clueLeak])).toEqual([]);
    expect(findAuthorityOneWayAliasLeaks(candidate, [candidate, clueLeak])).toEqual([
      'response-in-clue:en:medium-hard:fixture:manakish-clue',
      'response-in-explanation:et:medium-hard:fixture:manakish-clue',
    ]);
  });
});

describe('cumulative enabled authority collisions', () => {
  it('keeps the released board authority fixed at 7,000 rows', () => {
    expect(completeEnabledAuthorityCorpus()).toHaveLength(7_000);
  });

  it('maps injected Phase B questions by stable clue ID with category context', () => {
    const rows = registeredEasyExpansionAuthorityRows([phaseBCategory()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'built-in-history-easy-expansion-001',
      authority: 'easy-expansion',
      categorySetId: 'built-in-history-set-101',
      categoryTitle: { en: 'Familiar Ancient History', et: 'Tuttav antiikajalugu' },
    });

    expect(completeCumulativeAuthorityCorpus([phaseBCategory()])).toHaveLength(7_175);
  });

  it('rejects a normalized category title reused by a different category set', () => {
    const candidate = fixture({
      authority: 'easy-expansion',
      categorySetId: 'fixture:set-a',
      categoryTitle: { en: 'World Capitals!', et: 'Maailma pealinnad!' },
    });
    const other = distinctFixture({
      categorySetId: 'fixture:set-b',
      categoryTitle: { en: 'world capitals', et: 'maailma pealinnad' },
    });

    expect(findAuthorityCollisions(candidate, [candidate, other])).toEqual([
      'category-title:en:medium-hard:fixture:set-b',
      'category-title:et:medium-hard:fixture:set-b',
    ]);
    expect(findAuthorityCollisions(candidate, [
      candidate,
      distinctFixture({
        categorySetId: 'fixture:set-a',
        categoryTitle: candidate.categoryTitle,
      }),
    ])).toEqual([]);
  });

  it.each([
    ['fact', { factKey: ' SEASONING / ZAATAR / BLEND ' }, 'fact:medium-hard:fixture:distinct'],
    ['subject', { subjectKey: ' seasoning ZAATAR ' }, 'subject:medium-hard:fixture:distinct'],
    ['clue and response', {
      clue: { en: 'Which seasoning is this?', et: 'Milline maitseaine see on?' },
      response: { en: "za'atar", et: "za'atar" },
    }, 'clue-response:en:medium-hard:fixture:distinct'],
    ['accepted alias', {
      acceptedVariants: { en: ['zaatar'], et: ['zaatar'] },
    }, 'response-variant:en:medium-hard:fixture:distinct'],
  ] as const)('rejects a cumulative %s collision', (_label, patch, diagnostic) => {
    const candidate = fixture({ authority: 'easy-expansion' });
    const other = distinctFixture(patch);
    expect(findAuthorityCollisions(candidate, [candidate, other])).toContain(diagnostic);
  });

  it('detects answer disclosure in either direction', () => {
    const candidate = fixture({
      authority: 'easy-expansion',
      explanation: {
        en: 'A Middle Eastern seasoning blend.',
        et: 'Seda maitseainesegu võib kohata Tartu linnas.',
      },
    });
    const other = distinctFixture({
      clue: { en: 'Which city is associated with zaatar?', et: 'Milline Eesti linn on tuntud ülikooli poolest?' },
      explanation: { en: 'The answer is elsewhere.', et: 'Vastus on mujal.' },
    });

    expect(findAuthorityBidirectionalAliasLeaks(candidate, [candidate, other])).toEqual([
      'candidate-response-in-other-clue:en:medium-hard:fixture:distinct',
      'other-response-in-candidate-explanation:et:medium-hard:fixture:distinct',
    ]);
  });

  it('retains collision and one-way alias semantics in the prepared cumulative checker', () => {
    const candidate = fixture({
      authority: 'easy-expansion',
      categorySetId: 'fixture:set-a',
      categoryTitle: { en: 'World Capitals', et: 'Maailma pealinnad' },
      explanation: {
        en: 'A Middle Eastern seasoning blend.',
        et: 'Seda maitseainesegu võib kohata Tartu linnas.',
      },
    });
    const other = distinctFixture({
      factKey: candidate.factKey,
      subjectKey: candidate.subjectKey,
      categorySetId: 'fixture:set-b',
      categoryTitle: candidate.categoryTitle,
      clue: {
        en: 'Which city is associated with zaatar?',
        et: 'Milline Eesti linn on tuntud ülikooli poolest?',
      },
      explanation: {
        en: 'Zaatar appears here as a deliberate fixture leak.',
        et: 'Vastus on mujal.',
      },
      acceptedVariants: { en: ['zaatar'], et: [] },
    });

    const defects = findCumulativeAuthorityDefects([candidate], [candidate, other]);

    expect(defects).toEqual(
      expect.arrayContaining([
        'collision:easy-expansion:fixture:zaatar:fact:medium-hard:fixture:distinct',
        'collision:easy-expansion:fixture:zaatar:subject:medium-hard:fixture:distinct',
        'collision:easy-expansion:fixture:zaatar:category-title:en:medium-hard:fixture:set-b',
        'collision:easy-expansion:fixture:zaatar:response-variant:en:medium-hard:fixture:distinct',
      ]),
    );
    expect(defects.filter((diagnostic) => diagnostic.startsWith('alias:'))).toEqual([
      'alias:easy-expansion:fixture:zaatar:candidate-response-in-other-clue:en:medium-hard:fixture:distinct',
      'alias:easy-expansion:fixture:zaatar:candidate-response-in-other-explanation:en:medium-hard:fixture:distinct',
    ]);
  });

  it('keeps reverse-only candidate clue mentions diagnostic rather than blocking', () => {
    const candidate = fixture({
      authority: 'easy-expansion',
      clue: {
        en: 'Which seasoning was served in Tartu?',
        et: 'Millist maitseainet Tartus serveeriti?',
      },
    });
    const other = distinctFixture();

    expect(findAuthorityBidirectionalAliasLeaks(candidate, [candidate, other])).toContain(
      'other-response-in-candidate-clue:en:medium-hard:fixture:distinct',
    );
    expect(findCumulativeAuthorityDefects([candidate], [candidate, other])).toEqual([]);
  });

  it('does not index a category title without its category-set identity', () => {
    const candidate = fixture({
      authority: 'easy-expansion',
      categorySetId: 'fixture:set-a',
      categoryTitle: { en: 'World Capitals', et: 'Maailma pealinnad' },
    });
    const other = distinctFixture({
      categoryTitle: candidate.categoryTitle,
    });

    expect(findAuthorityCollisions(candidate, [candidate, other])).toEqual([]);
    expect(findCumulativeAuthorityDefects([candidate], [candidate, other]))
      .toEqual([]);
  });

  it('does not combine inverse-answer halves from distinct rows sharing an ID', () => {
    const candidate = fixture({
      authority: 'easy-expansion',
      clue: {
        en: 'Which seasoning is linked with the city Tartu?',
        et: 'Milline maitseaine seostub Tartu linnaga?',
      },
    });
    const clueHalf = distinctFixture({
      id: 'fixture:duplicate-id',
      factKey: 'fixture:clue-half',
      subjectKey: 'fixture:clue-half',
      clue: { en: 'Which dish uses zaatar?', et: 'Milline roog kasutab zaatarit?' },
      response: { en: 'Alpha', et: 'Alfa' },
      source: { title: 'Clue half', url: 'https://example.com/clue-half' },
    });
    const responseHalf = distinctFixture({
      id: 'fixture:duplicate-id',
      factKey: 'fixture:response-half',
      subjectKey: 'fixture:response-half',
      clue: { en: 'Which city has a famous university?', et: 'Millises linnas on kuulus ülikool?' },
      response: { en: 'Tartu', et: 'Tartu' },
      source: { title: 'Response half', url: 'https://example.com/response-half' },
    });
    const corpus = [candidate, clueHalf, responseHalf];

    expect(findAuthorityCollisions(candidate, corpus).filter((value) => value.startsWith('inverse:')))
      .toEqual([]);
    expect(findCumulativeAuthorityDefects([candidate], corpus)
      .filter((value) => value.includes(':inverse:'))).toEqual([]);
  });

  it('keeps every registered Phase B row collision-free against all accepted authorities', () => {
    const phaseBRows = registeredEasyExpansionAuthorityRows();
    const corpus = completeCumulativeAuthorityCorpus();

    expect(corpus.filter(({ authority }) => authority === 'easy-expansion'))
      .toHaveLength(phaseBRows.length);
    expect(findCumulativeAuthorityDefects(phaseBRows, corpus)).toEqual([]);
  }, 60_000);

  it('checks a complete 100-clue pack against the accepted corpus within its test budget', () => {
    const candidates = Array.from({ length: 100 }, (_, index): AuthorityRow => ({
      id: `phase-b-scale-${index}`,
      authority: 'easy-expansion',
      factKey: `phase-b-scale:fact:${index}`,
      subjectKey: `phase-b-scale:subject:${index}`,
      categorySetId: `phase-b-scale:set:${index}`,
      categoryTitle: {
        en: `Phase B Scale Category ${index}`,
        et: `B-etapi mastaabikategooria ${index}`,
      },
      clue: {
        en: `Which unique fixture belongs at position ${index}?`,
        et: `Milline unikaalne näide kuulub kohale ${index}?`,
      },
      response: {
        en: `PhaseBScaleAnswer${index}`,
        et: `BEtapiMastaabivastus${index}`,
      },
      acceptedVariants: { en: [], et: [] },
      explanation: {
        en: `This fixture validates cumulative pack breadth at position ${index}.`,
        et: `See näide kontrollib paki mastaapi kohal ${index}.`,
      },
      source: {
        title: `Phase B scale source ${index}`,
        url: `https://example.com/phase-b-scale/${index}`,
      },
    }));
    const corpus = [...completeCumulativeAuthorityCorpus(), ...candidates];

    expect(findCumulativeAuthorityDefects(candidates, corpus)).toEqual([]);
  }, 20_000);
});
