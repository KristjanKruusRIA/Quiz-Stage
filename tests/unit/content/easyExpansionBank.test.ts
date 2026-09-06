import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildEasyExpansionCorpus,
  combineEasyExpansionBanks,
  getEasyExpansionBank,
  type EasyExpansionBankRegistration,
} from '../../../scripts/content/easyExpansion/bank';
import type {
  EasyExpansionCategory,
  EasyExpansionQuestion,
} from '../../../scripts/content/easyExpansion/types';

function question(
  batchId: string,
  packId: string,
  categoryIndex: number,
  questionIndex: number,
): EasyExpansionQuestion {
  const ordinal = categoryIndex * 5 + questionIndex + 1;
  return {
    clueId: `${packId}-easy-expansion-${ordinal.toString().padStart(3, '0')}`,
    key: `${batchId}-question-${ordinal}`,
    factKey: `${batchId}:fact:${ordinal}`,
    tier: (questionIndex + 1) as 1 | 2 | 3 | 4 | 5,
    subjectKey: `${batchId}:subject:${ordinal}`,
    clue: { en: `Clue ${ordinal}`, et: `Vihje ${ordinal}` },
    response: { en: `Answer ${ordinal}`, et: `Vastus ${ordinal}` },
    acceptedVariants: { en: [], et: [] },
    explanation: { en: `Explanation ${ordinal}`, et: `Selgitus ${ordinal}` },
    source: {
      sourceId: `${batchId}-source-${ordinal}`,
      title: `Source ${ordinal}`,
      url: `https://example.com/${batchId}/${ordinal}`,
      license: 'CC-BY-4.0',
      retrievedAt: '2026-09-06',
    },
  };
}

function bank(batchId: string, packId: string): EasyExpansionBankRegistration {
  return {
    batchId,
    categories: Array.from({ length: 20 }, (_, categoryIndex): EasyExpansionCategory => ({
      categorySetId: `${packId}-set-${101 + categoryIndex}`,
      batchId,
      packId,
      difficulty: 'easy',
      round: categoryIndex < 10 ? 'round-one' : 'round-two',
      macroTopic: `${batchId}-topic`,
      name: {
        en: `${batchId} category ${categoryIndex + 1}`,
        et: `${batchId} kategooria ${categoryIndex + 1}`,
      },
      questions: Array.from(
        { length: 5 },
        (_, questionIndex) => question(batchId, packId, categoryIndex, questionIndex),
      ),
    })).reverse(),
  };
}

function replaceCategory(
  registration: EasyExpansionBankRegistration,
  index: number,
  replacement: EasyExpansionCategory,
): EasyExpansionBankRegistration {
  return {
    ...registration,
    categories: registration.categories.map((category, categoryIndex) => (
      categoryIndex === index ? replacement : category
    )),
  };
}

describe('Easy expansion bank registry', () => {
  it('registers the complete History, Geography, and Science & Nature banks as a stable frozen corpus', () => {
    const corpus = buildEasyExpansionCorpus();
    const questions = corpus.flatMap(({ questions }) => questions);

    expect(corpus).toHaveLength(60);
    expect(questions).toHaveLength(300);
    expect(corpus.map(({ categorySetId }) => categorySetId)).toEqual([
      ...Array.from({ length: 20 }, (_, index) => `built-in-history-set-${101 + index}`),
      ...Array.from({ length: 20 }, (_, index) => `built-in-geography-set-${101 + index}`),
      ...Array.from(
        { length: 20 },
        (_, index) => `built-in-science-nature-set-${101 + index}`,
      ),
    ]);
    expect(questions.map(({ clueId }) => clueId)).toEqual([
      ...Array.from(
        { length: 100 },
        (_, index) => `built-in-history-easy-expansion-${(index + 1).toString().padStart(3, '0')}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) => `built-in-geography-easy-expansion-${(index + 1).toString().padStart(3, '0')}`,
      ),
      ...Array.from(
        { length: 100 },
        (_, index) => `built-in-science-nature-easy-expansion-${(index + 1).toString().padStart(3, '0')}`,
      ),
    ]);
    expect(corpus.filter(({ round }) => round === 'round-one')).toHaveLength(30);
    expect(corpus.filter(({ round }) => round === 'round-two')).toHaveLength(30);
    expect(Object.isFrozen(corpus)).toBe(true);
    expect(buildEasyExpansionCorpus()).toBe(corpus);
    expect(getEasyExpansionBank('01-history')).toEqual(corpus.slice(0, 20));
    expect(getEasyExpansionBank('02-geography')).toEqual(corpus.slice(20, 40));
    expect(getEasyExpansionBank('03-science-nature')).toEqual(corpus.slice(40));
    expect(() => getEasyExpansionBank('04-literature-language')).toThrowError(
      'No Easy expansion bank registered for batch "04-literature-language".',
    );
  });

  it.each([
    ['History', '01-history'],
    ['Geography', '02-geography'],
    ['Science & Nature', '03-science-nature'],
  ])('binds the completed %s review manifest to the current bank', (_name, batchId) => {
    const manifestPath = resolve(
      `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/${batchId}.json`,
    );
    const bankPath = resolve(`scripts/content/easyExpansion/banks/${batchId}.ts`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      version: number;
      batchId: string;
      baseCommit: string;
      bankSha256: string;
      projectedArtifactHashes: Record<'authored' | 'generated' | 'evidence', string>;
      reviewers: Record<'factual' | 'playability' | 'estonian' | 'release', string>;
      reviewedCounts: { clues: number; categories: number; sources: number };
      sourceDisposition: { checked: number; passed: number; failed: number };
      collisionDispositions: unknown[];
      finalSeverityCounts: { critical: number; important: number; minor: number };
    };
    const bankBytes = readFileSync(bankPath, 'utf8').replace(/\r\n?/gu, '\n');
    const bankSha256 = createHash('sha256').update(bankBytes, 'utf8').digest('hex');

    expect(manifest.version).toBe(1);
    expect(manifest.batchId).toBe(batchId);
    expect(manifest.baseCommit).toMatch(/^[0-9a-f]{40}$/u);
    expect(manifest.bankSha256).toBe(bankSha256);
    expect(manifest.projectedArtifactHashes).toEqual({
      authored: expect.stringMatching(/^[0-9a-f]{64}$/u),
      generated: expect.stringMatching(/^[0-9a-f]{64}$/u),
      evidence: expect.stringMatching(/^[0-9a-f]{64}$/u),
    });
    expect(Object.keys(manifest.reviewers).sort()).toEqual([
      'estonian',
      'factual',
      'playability',
      'release',
    ]);
    expect(Object.values(manifest.reviewers).every((reviewer) => reviewer.trim() !== '')).toBe(true);
    expect(manifest.reviewedCounts).toEqual({ clues: 100, categories: 20, sources: 100 });
    expect(manifest.sourceDisposition).toEqual({ checked: 100, passed: 100, failed: 0 });
    expect(Array.isArray(manifest.collisionDispositions)).toBe(true);
    expect(manifest.finalSeverityCounts).toEqual({ critical: 0, important: 0, minor: 0 });
  });

  it('combines banks deterministically by batch and category set without mutating inputs', () => {
    const history = bank('01-history', 'built-in-history');
    const geography = bank('02-geography', 'built-in-geography');
    const historyFirstInputId = history.categories[0]!.categorySetId;

    const corpus = combineEasyExpansionBanks([geography, history]);

    expect(Object.isFrozen(corpus)).toBe(true);
    expect(corpus.map(({ categorySetId }) => categorySetId)).toEqual([
      ...Array.from({ length: 20 }, (_, index) => `built-in-history-set-${101 + index}`),
      ...Array.from({ length: 20 }, (_, index) => `built-in-geography-set-${101 + index}`),
    ]);
    expect(history.categories[0]!.categorySetId).toBe(historyFirstInputId);
    expect(() => (corpus as EasyExpansionCategory[]).push(history.categories[0]!)).toThrow();
  });

  it('rejects a registered bank that does not contain exactly twenty categories', () => {
    const history = bank('01-history', 'built-in-history');

    expect(() => combineEasyExpansionBanks([{
      ...history,
      categories: history.categories.slice(1),
    }])).toThrowError(/01-history.*exactly 20 categories.*19/iu);
  });

  it('rejects duplicate batch registrations', () => {
    expect(() => combineEasyExpansionBanks([
      bank('01-history', 'built-in-history'),
      bank('01-history', 'built-in-other-history'),
    ])).toThrowError(/duplicate easy expansion batch registration.*01-history/iu);
  });

  it('rejects duplicate category set registrations across banks', () => {
    const history = bank('01-history', 'built-in-history');
    const geography = bank('02-geography', 'built-in-geography');
    const duplicate = {
      ...geography.categories[0]!,
      categorySetId: history.categories[0]!.categorySetId,
    };

    expect(() => combineEasyExpansionBanks([
      history,
      replaceCategory(geography, 0, duplicate),
    ])).toThrowError(/duplicate easy expansion category set registration.*built-in-history-set-120/iu);
  });

  it('rejects duplicate clue registrations across banks', () => {
    const history = bank('01-history', 'built-in-history');
    const geography = bank('02-geography', 'built-in-geography');
    const geographyCategory = geography.categories[0]!;
    const duplicateClue = {
      ...geographyCategory.questions[0]!,
      clueId: history.categories[0]!.questions[0]!.clueId,
    };
    const duplicate = {
      ...geographyCategory,
      questions: [duplicateClue, ...geographyCategory.questions.slice(1)],
    };

    expect(() => combineEasyExpansionBanks([
      history,
      replaceCategory(geography, 0, duplicate),
    ])).toThrowError(/duplicate easy expansion clue registration.*built-in-history-easy-expansion-096/iu);
  });

  it('rejects a category registered under a different batch', () => {
    const history = bank('01-history', 'built-in-history');
    const mismatched = {
      ...history.categories[0]!,
      batchId: '02-geography',
    };

    expect(() => combineEasyExpansionBanks([
      replaceCategory(history, 0, mismatched),
    ])).toThrowError(/category.*built-in-history-set-120.*02-geography.*01-history/iu);
  });
});
