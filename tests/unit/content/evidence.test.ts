import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  contentEvidenceSchema,
  readEvidenceInputs,
  serializeEvidence,
  type ContentEvidence,
} from '../../../scripts/content/evidence';

const fixture = (name: string): string => resolve('tests/fixtures/content-quality', name);

const validEvidence: ContentEvidence = {
  version: 1,
  clueId: 'clue-100',
  batchId: 'batch-2026-08',
  factKey: 'opentdb:42',
  assertion: 'The answer is 42.',
  origin: 'openTdbInspired',
  authoring: {
    author: 'Ada Author',
    authoredAt: '2026-08-02T09:00:00Z',
  },
  supportingSource: {
    sourceId: 'britannica:42',
    title: "The Hitchhiker's Guide to the Galaxy",
    url: 'https://www.britannica.com/topic/The-Hitchhikers-Guide-to-the-Galaxy',
    license: 'Fair use',
    retrievedAt: '2026-08-02',
  },
  inspiration: {
    system: 'OpenTDB',
    candidateId: 'opentdb-42',
    license: 'CC-BY-SA-4.0',
  },
  factualReview: {
    reviewer: 'Fran Fact',
    reviewedAt: '2026-08-02T10:00:00Z',
    decision: 'approved',
  },
  editorialReview: {
    reviewer: 'Ed Editor',
    reviewedAt: '2026-08-02T11:00:00Z',
    decision: 'approved',
  },
  translationReview: null,
};

describe('content evidence', () => {
  it('indexes sorted strict evidence and rejects duplicate clue IDs', async () => {
    const evidence = await readEvidenceInputs([fixture('evidence-valid.jsonl')]);

    expect([...evidence]).toEqual([...evidence].sort(([a], [b]) => a.localeCompare(b)));
    await expect(readEvidenceInputs([fixture('evidence-valid.jsonl'), fixture('evidence-valid.jsonl')]))
      .rejects.toThrow(/duplicate evidence.*clue/i);
  });

  it('requires independent evidence for OpenTDB inspiration', () => {
    expect(() => contentEvidenceSchema.parse({
      ...validEvidence,
      origin: 'openTdbInspired',
      inspiration: null,
    })).toThrow(/inspiration/i);
  });

  it('rejects non-independent or premature factual and editorial reviews', () => {
    expect(() => contentEvidenceSchema.parse({
      ...validEvidence,
      factualReview: { ...validEvidence.factualReview, reviewer: validEvidence.authoring.author },
    })).toThrow(/author/i);
    expect(() => contentEvidenceSchema.parse({
      ...validEvidence,
      editorialReview: { ...validEvidence.editorialReview, reviewedAt: validEvidence.authoring.authoredAt },
    })).toThrow(/later/i);
  });

  it('rejects non-HTTPS source URLs and malformed JSONL lines', async () => {
    expect(() => contentEvidenceSchema.parse({
      ...validEvidence,
      supportingSource: { ...validEvidence.supportingSource, url: 'http://example.com/source' },
    })).toThrow(/https/i);
    await expect(readEvidenceInputs([fixture('evidence-invalid.jsonl')])).rejects.toThrow(/author|blank|malformed/i);
  });

  it('serializes canonical evidence JSONL by clue ID', () => {
    const second = { ...validEvidence, clueId: 'clue-200', origin: 'wikidata' as const, inspiration: null };

    expect(serializeEvidence([second, validEvidence])).toBe(
      `${JSON.stringify(validEvidence)}\n${JSON.stringify(second)}\n`,
    );
  });
});
