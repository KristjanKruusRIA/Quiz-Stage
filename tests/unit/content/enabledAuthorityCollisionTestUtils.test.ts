import { describe, expect, it } from 'vitest';
import {
  findAuthorityCollisions,
  findAuthorityOneWayAliasLeaks,
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
