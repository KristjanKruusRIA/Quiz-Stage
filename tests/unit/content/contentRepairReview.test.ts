import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { approvedHistoricalHash, assertContentRepairReview, assertReviewedInputHashes, repairReviewedTranslationIds } from '../../../scripts/content/contentRepairReview';
import { reviewedIdsFromReport } from '../../../scripts/content/validate';

const directories: string[] = [];
afterEach(() => directories.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'quiz-stage-repair-review-'));
  directories.push(root);
  mkdirSync(join(root, 'content/generated'), { recursive: true });
  mkdirSync(join(root, 'docs/content-review/2026-10-11'), { recursive: true });
  writeFileSync(join(root, 'content/generated/bank.csv'), 'repaired,independent,questions\n');
  const manifest = {
    version: 1, decision: 'approved', reviewer: 'Independent reviewer',
    reviewedAt: '2026-10-11T12:00:00Z',
    checks: ['factual', 'translation', 'independence', 'difficulty', 'attribution'],
    artifacts: [{ path: 'content/generated/bank.csv', beforeSha256: hash('original'),
      afterSha256: hash('repaired,independent,questions\n'), historicalSha256: hash('original-easy-review') }],
    evidenceSha256: hash('reviewed evidence'),
    changedClueIds: ['baltic-lithuania'], translationExceptions: [] as Array<{ id: string; reason: string }>, answerDisclosureExceptions: [],
  };
  const save = () => writeFileSync(join(root, 'docs/content-review/2026-10-11/accepted-repairs.json'), JSON.stringify(manifest));
  save();
  return { root, manifest, save };
}

it('requires a fresh review when an edited set changes, including finite answer-pool changes', () => {
  const { root } = fixture();
  expect(() => assertContentRepairReview(root)).not.toThrow();
  writeFileSync(join(root, 'content/generated/bank.csv'), 'Latvia independence day,Estonia independence day,Lithuania independence day\n');
  expect(() => assertContentRepairReview(root)).toThrow(/review.*stale/i);
});

it('bridges an approved repair to its original review without replacing the original approval', () => {
  const { root } = fixture();
  expect(approvedHistoricalHash('content/generated/bank.csv', hash('repaired,independent,questions\n'), root)).toBe(hash('original'));
  expect(approvedHistoricalHash('content/generated/bank.csv', hash('repaired,independent,questions\n'), root, true)).toBe(hash('original-easy-review'));
  expect(approvedHistoricalHash('content/generated/bank.csv', hash('tampered'), root)).toBe(hash('tampered'));
});

it('rejects an incomplete review and a missing reviewed content file', () => {
  const { root, manifest, save } = fixture();
  manifest.checks = ['factual']; save();
  expect(() => assertContentRepairReview(root)).toThrow();
  manifest.checks = ['factual', 'translation', 'independence', 'difficulty', 'attribution']; save();
  rmSync(join(root, 'content/generated/bank.csv'));
  expect(() => assertContentRepairReview(root)).toThrow();
});

it('replaces historical translation exceptions for edited clues with fresh reviewed decisions', () => {
  const { root, manifest, save } = fixture();
  manifest.translationExceptions = [{ id: 'translation:UNCHANGED_TRANSLATION:baltic-lithuania', reason: 'The replacement answer is a proper name used in both languages.' }];
  save();
  expect(repairReviewedTranslationIds([
    'SUSPICIOUS_PROPER_NOUN_CHANGE:baltic-lithuania:clue_en',
    'translation:SUSPICIOUS_PROPER_NOUN_CHANGE:baltic-lithuania',
    'translation:UNCHANGED_TRANSLATION:unchanged-clue',
  ], root)).toEqual(['translation:UNCHANGED_TRANSLATION:unchanged-clue', 'translation:UNCHANGED_TRANSLATION:baltic-lithuania']);
  writeFileSync(join(root, 'content/generated/bank.csv'), 'unreviewed translation\n');
  expect(() => repairReviewedTranslationIds([], root)).toThrow(/stale/i);
});

it('loads fresh approved translation decisions even before an output report exists', () => {
  const { root, manifest, save } = fixture();
  manifest.translationExceptions = [{ id: 'translation:UNCHANGED_TRANSLATION:baltic-lithuania', reason: 'The reviewed replacement is a proper name.' }];
  save();
  expect(reviewedIdsFromReport(join(root, 'missing-report.json'), { repositoryRoot: root }))
    .toEqual(['translation:UNCHANGED_TRANSLATION:baltic-lithuania']);
});

it('rejects retained unapproved inputs even when files on disk now match the review', () => {
  const { root, manifest } = fixture();
  const input = { file: 'content/generated/bank.csv', sha256: manifest.artifacts[0].afterSha256 };
  expect(() => assertReviewedInputHashes([input], manifest.evidenceSha256, root)).not.toThrow();
  expect(() => assertReviewedInputHashes([{ ...input, sha256: hash('previous unreviewed snapshot') }], manifest.evidenceSha256, root)).toThrow(/retained input/i);
  expect(() => assertReviewedInputHashes([input], hash('previous evidence'), root)).toThrow(/retained evidence/i);
});
