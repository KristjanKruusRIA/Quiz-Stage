import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contentEvidenceSchema,
  readEvidenceInputs,
  serializeEvidence,
  type ContentEvidence,
  type ReviewDecision,
} from '../../../scripts/content/evidence';

declare global {
  var evidenceInputOpenHook: undefined | (() => Promise<void>);
}

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...original,
    open: async (...args: Parameters<typeof original.open>) => {
      const handle = await original.open(...args);
      await globalThis.evidenceInputOpenHook?.();
      return handle;
    },
  };
});

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

const validReview: ReviewDecision = {
  reviewer: 'Review Person',
  reviewedAt: '2026-08-02T13:00:00Z',
  decision: 'approved',
};

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(resolve(tmpdir(), 'evidence-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
  globalThis.evidenceInputOpenHook = undefined;
  vi.restoreAllMocks();
});

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
    await expect(readEvidenceInputs([fixture('evidence-invalid.jsonl')])).rejects.toThrow(/author/i);
  });

  it('rejects blank evidence lines', async () => {
    await expect(readEvidenceInputs([fixture('evidence-blank.jsonl')])).rejects.toThrow(/blank evidence line/i);
  });

  it('rejects malformed evidence JSON', async () => {
    await expect(readEvidenceInputs([fixture('evidence-malformed.jsonl')])).rejects.toThrow(/malformed evidence json/i);
  });

  it('rejects strict extra evidence fields', () => {
    expect(() => contentEvidenceSchema.parse({ ...validEvidence, unexpected: true })).toThrow();
  });

  it('rejects inspiration for non-OpenTDB origins', () => {
    expect(() => contentEvidenceSchema.parse({
      ...validEvidence,
      origin: 'wikidata',
    })).toThrow(/inspiration/i);
  });

  it('rejects translation reviews that do not occur after authoring', () => {
    expect(() => contentEvidenceSchema.parse({
      ...validEvidence,
      translationReview: { ...validReview, reviewedAt: validEvidence.authoring.authoredAt },
    })).toThrow(/later/i);
  });

  it('expands evidence globs and rejects missing matches', async () => {
    const directory = await temporaryDirectory();
    await fs.writeFile(resolve(directory, 'a.jsonl'), `${JSON.stringify(validEvidence)}\n`);
    await fs.writeFile(resolve(directory, 'b.jsonl'), `${JSON.stringify({ ...validEvidence, clueId: 'clue-200' })}\n`);

    expect([...await readEvidenceInputs([resolve(directory, '*.jsonl')])].map(([clueId]) => clueId)).toEqual(['clue-100', 'clue-200']);
    await expect(readEvidenceInputs([resolve(directory, 'missing-*.jsonl')])).rejects.toThrow(/matched no files/i);
  });

  it('rejects symlink evidence inputs', async () => {
    const directory = await temporaryDirectory();
    const target = resolve(directory, 'target.jsonl');
    const link = resolve(directory, 'link.jsonl');
    await fs.writeFile(target, `${JSON.stringify(validEvidence)}\n`);
    await fs.symlink(target, link, 'file');

    await expect(readEvidenceInputs([link])).rejects.toThrow(/not a safe regular file/i);
  });

  it('rejects evidence changed after the path identity check', async () => {
    const directory = await temporaryDirectory();
    const input = resolve(directory, 'input.jsonl');
    await fs.writeFile(input, `${JSON.stringify(validEvidence)}\n`);
    globalThis.evidenceInputOpenHook = async () => {
      await fs.writeFile(input, `${JSON.stringify({ ...validEvidence, assertion: 'The answer is 43.' })}\n`);
    };

    await expect(readEvidenceInputs([input])).rejects.toThrow(/changed while/i);
  });

  it('serializes canonical evidence JSONL by clue ID', () => {
    const second = { ...validEvidence, clueId: 'clue-200', origin: 'wikidata' as const, inspiration: null };

    expect(serializeEvidence([second, validEvidence])).toBe(
      `${JSON.stringify(validEvidence)}\n${JSON.stringify(second)}\n`,
    );
  });

  it('uses total code-unit ordering for canonically equivalent clue IDs', async () => {
    const directory = await temporaryDirectory();
    const composed = { ...validEvidence, clueId: 'ä' };
    const decomposed = { ...validEvidence, clueId: 'a\u0308' };
    await fs.writeFile(resolve(directory, 'a.jsonl'), `${JSON.stringify(composed)}\n`);
    await fs.writeFile(resolve(directory, 'b.jsonl'), `${JSON.stringify(decomposed)}\n`);

    const expectedIds = ['a\u0308', 'ä'];
    expect([...await readEvidenceInputs([resolve(directory, 'a.jsonl'), resolve(directory, 'b.jsonl')])].map(([clueId]) => clueId))
      .toEqual(expectedIds);
    expect([...await readEvidenceInputs([resolve(directory, 'b.jsonl'), resolve(directory, 'a.jsonl')])].map(([clueId]) => clueId))
      .toEqual(expectedIds);

    const expectedJsonl = `${JSON.stringify(decomposed)}\n${JSON.stringify(composed)}\n`;
    expect(serializeEvidence([composed, decomposed])).toBe(expectedJsonl);
    expect(serializeEvidence([decomposed, composed])).toBe(expectedJsonl);
  });
});
