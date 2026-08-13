import { describe, expect, it } from 'vitest';
import {
  findNearDuplicatePairs,
  nearDuplicateSimilarity,
  normalizeForNearDuplicate,
} from '../../../scripts/content/nearDuplicate';

describe('near-duplicate clue detection', () => {
  it('normalizes Unicode and removes punctuation, numbers, and stable identifiers', () => {
    expect(normalizeForNearDuplicate('Q42: In 1969, which mission landed?'))
      .toBe('in which mission landed');
    expect(normalizeForNearDuplicate('  Ｃafé—P31 550e8400-e29b-41d4-a716-446655440000 ref7!  '))
      .toBe('café');
    expect(normalizeForNearDuplicate('prefix abcdefab-cdef-abcd-efab-cdefabcdefab suffix'))
      .toBe('prefix suffix');
  });

  it('uses exact normalized equality when both clues contain fewer than five tokens', () => {
    expect(nearDuplicateSimilarity('Red Planet', 'red planet')).toBe(1);
    expect(nearDuplicateSimilarity('Red Planet', 'Blue Planet')).toBe(0);
    expect(nearDuplicateSimilarity('Q42 1969', 'P31 2026')).toBe(0);
  });

  it('blocks a comparison when only one clue contains fewer than five tokens', () => {
    expect(nearDuplicateSimilarity('Red Planet', 'the bright red planet above')).toBe(0);
  });

  it('uses five-token-shingle Jaccard similarity at the approved threshold', () => {
    expect(nearDuplicateSimilarity(
      'This painter created the famous ceiling frescoes inside the Sistine Chapel in Vatican City',
      'Which painter created the famous ceiling frescoes inside the Sistine Chapel in Vatican City?',
    )).toBeGreaterThanOrEqual(0.8);
    expect(nearDuplicateSimilarity(
      'alpha beta gamma delta epsilon zeta eta theta',
      'alpha beta gamma delta epsilon iota kappa lambda',
    )).toBeLessThan(0.8);
  });

  it('returns only qualifying pairs in deterministic total code-unit ID order', () => {
    const text = 'This painter created the famous ceiling frescoes inside the Sistine Chapel in Vatican City';
    expect(findNearDuplicatePairs([
      { id: 'ä', text },
      { id: 'z', text: 'unrelated clue about a distant red stellar object' },
      { id: 'a\u0308', text: 'Which painter created the famous ceiling frescoes inside the Sistine Chapel in Vatican City?' },
    ])).toEqual([
      { firstId: 'a\u0308', secondId: 'ä', similarity: 9 / 11 },
    ]);
  });
});
