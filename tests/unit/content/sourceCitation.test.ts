import { describe, expect, it } from 'vitest';
import {
  parseStoredSource,
  serializeStoredSource,
  sourceCitation,
  type StoredSourceV1,
  type StoredSourceV2,
} from '../../../src/shared/content/sourceCitation';

const v1: StoredSourceV1 = {
  format: 'quiz-stage-csv-v1',
  title: 'Legacy imported source',
  url: 'https://example.com/legacy',
  license: 'CC BY 4.0',
  retrievedAt: '2026-08-12',
  translationStatus: 'reviewed',
};

const v2: StoredSourceV2 = {
  ...v1,
  format: 'quiz-stage-csv-v2',
  sourceId: 'wikidata:Q42:P31:Q5',
  factualVerifiedAt: '2026-08-13T12:00:00.000Z',
};

describe('stored source citations', () => {
  it('preserves explicit v1 parsing, serialization, and display compatibility', () => {
    expect(parseStoredSource(JSON.stringify(v1))).toEqual(v1);
    expect(parseStoredSource(serializeStoredSource(v1))).toEqual(v1);
    expect(sourceCitation(JSON.stringify(v1))).toBe(v1.title);
  });

  it('round-trips a strict v2 citation without dropping evidence identity', () => {
    expect(parseStoredSource(JSON.stringify(v2))).toEqual(v2);
    expect(parseStoredSource(serializeStoredSource(v2))).toEqual(v2);
    expect(sourceCitation(JSON.stringify(v2))).toBe(v2.title);
  });

  it.each([
    [{ ...v1, format: 'quiz-stage-csv-v2' }],
    [{ ...v2, sourceId: '' }],
    [{ ...v2, factualVerifiedAt: '2026-08-13' }],
    [{ ...v2, unexpected: true }],
  ])('rejects incomplete or non-strict v2 citations', (candidate) => {
    expect(parseStoredSource(JSON.stringify(candidate))).toBeNull();
  });
});
