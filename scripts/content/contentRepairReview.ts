import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

export const CONTENT_REPAIR_REVIEW_PATH = 'docs/content-review/2026-10-11/accepted-repairs.json';
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const reviewSchema = z.strictObject({
  version: z.literal(1), decision: z.literal('approved'),
  reviewer: z.string().trim().min(1), reviewedAt: z.string().datetime(),
  checks: z.tuple([z.literal('factual'), z.literal('translation'), z.literal('independence'), z.literal('difficulty'), z.literal('attribution')]),
  artifacts: z.array(z.strictObject({
    path: z.string().regex(/^content\/(?:authored|generated|evidence)\/[\w.-]+$/u),
    beforeSha256: hashSchema, afterSha256: hashSchema, historicalSha256: hashSchema.optional(),
  })).min(1),
  changedClueIds: z.array(z.string().min(1)),
  evidenceSha256: hashSchema.optional(),
  translationExceptions: z.array(z.strictObject({ id: z.string().min(1), reason: z.string().trim().min(1) })),
  answerDisclosureExceptions: z.array(z.strictObject({ id: z.string().min(1), reason: z.string().trim().min(1) })),
});

export function loadContentRepairReview(repositoryRoot = '.') {
  const path = resolve(repositoryRoot, CONTENT_REPAIR_REVIEW_PATH);
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat) return undefined;
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Content repair review must be a regular file');
  const review = reviewSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  if (new Set(review.artifacts.map(item => item.path)).size !== review.artifacts.length
    || new Set(review.changedClueIds).size !== review.changedClueIds.length
    || new Set(review.translationExceptions.map(item => item.id)).size !== review.translationExceptions.length
    || new Set(review.answerDisclosureExceptions.map(item => item.id)).size !== review.answerDisclosureExceptions.length) {
    throw new Error('Content repair review contains duplicate identities');
  }
  return review;
}

/** Original approvals stay immutable; this bridge accepts only the separately reviewed replacement bytes. */
export function approvedHistoricalHash(path: string, actualSha256: string, repositoryRoot = '.', easyExpansion = false): string {
  const artifact = loadContentRepairReview(repositoryRoot)?.artifacts.find(item => item.path === path.replaceAll('\\', '/'));
  if (!artifact || artifact.afterSha256 !== actualSha256) return actualSha256;
  return (easyExpansion ? artifact.historicalSha256 : artifact.beforeSha256) ?? actualSha256;
}

export function assertContentRepairReview(repositoryRoot = '.'): void {
  const review = loadContentRepairReview(repositoryRoot);
  if (!review) throw new Error('Production content requires its independent content repair review');
  const paths = ['authored', 'generated', 'evidence'].flatMap(directory => {
    const path = resolve(repositoryRoot, 'content', directory);
    return lstatSync(path, { throwIfNoEntry: false }) ? readdirSync(path)
      .filter(name => /\.(csv|jsonl)$/u.test(name)).map(name => `content/${directory}/${name}`) : [];
  }).sort();
  if (JSON.stringify(paths) !== JSON.stringify(review.artifacts.map(item => item.path).sort())) {
    throw new Error('Content repair review does not cover the complete authored, generated and evidence bank');
  }
  for (const artifact of review.artifacts) {
    const path = resolve(repositoryRoot, artifact.path);
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Content repair artifact must be a regular file: ${artifact.path}`);
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (actual !== artifact.afterSha256) throw new Error(`Content repair review is stale for ${artifact.path}; review the complete category again`);
  }
}

export function repairReviewedTranslationIds(historicalIds: readonly string[], repositoryRoot = '.'): string[] {
  const review = loadContentRepairReview(repositoryRoot);
  if (!review) return [...historicalIds];
  assertContentRepairReview(repositoryRoot);
  const changed = new Set(review.changedClueIds);
  const retained = historicalIds.filter(id => {
    const parts = id.split(':');
    return !changed.has(parts[0] === 'translation' ? parts[2] : parts[1]);
  });
  return [...new Set([...retained, ...review.translationExceptions.map(item => item.id)])];
}

export function reviewedEvidenceHash(records: ReadonlyMap<string, unknown>): string {
  const digest = createHash('sha256');
  for (const [id, record] of [...records].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)) {
    digest.update(id); digest.update('\0'); digest.update(JSON.stringify(record)); digest.update('\n');
  }
  return digest.digest('hex');
}

export function assertReviewedInputHashes(inputs: readonly { file: string; sha256: string }[], evidenceSha256: string, repositoryRoot = '.'): void {
  assertContentRepairReview(repositoryRoot);
  const review = loadContentRepairReview(repositoryRoot)!;
  for (const input of inputs) {
    if (review.artifacts.find(item => item.path === input.file)?.afterSha256 !== input.sha256) throw new Error(`Unreviewed retained input: ${input.file}`);
  }
  if (review.evidenceSha256 !== evidenceSha256) throw new Error('Unreviewed retained evidence snapshot');
}
