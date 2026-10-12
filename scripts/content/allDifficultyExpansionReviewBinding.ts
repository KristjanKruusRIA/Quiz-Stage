import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { acceptedBatchPaths, getProductionBatch, PRODUCTION_BATCHES } from './productionBatches';
import { approvedHistoricalHash } from './contentRepairReview';

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const verdictSchema = z.object({
  reviewer: z.string().trim().min(1),
  reviewedAt: z.string().datetime(),
  decision: z.literal('approved'),
  notes: z.string().trim().min(1),
});
const reviewSchema = z.object({
  batchId: z.string(),
  bankSha256: hashSchema,
  reviewedClueIds: z.array(z.string()).length(250),
  issues: z.array(z.unknown()).length(0),
  factualReview: verdictSchema,
  editorialReview: verdictSchema,
  translationReview: verdictSchema,
  translationExceptions: z.array(z.object({ id: z.string(), reason: z.string().trim().min(1) })),
  artifactHashes: z.object({ authored: hashSchema, generated: hashSchema, evidence: hashSchema }),
});
const bindingSchema = z.object({
  phase: z.literal('all-difficulty-expansion'),
  batchId: z.string(),
  manifestSha256: hashSchema,
}).strict();
type BoundException = { id: string; reviewerReason?: string; reviewBinding?: unknown };

function regularBytes(path: string): Buffer {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Review artifact must be a regular file: ${path}`);
  return readFileSync(path);
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function loadAcceptedAllDifficultyExpansionReview(batchId: string, repositoryRoot = '.') {
  const batch = getProductionBatch(batchId);
  if (batch.boardClues !== 850 || batch.requiredOpenTdbClues !== 100) {
    throw new Error(`Unexpected all-difficulty expansion batch ${batchId}`);
  }
  const bytes = regularBytes(resolve(repositoryRoot,
    `docs/superpowers/sdd/2026-10-09-all-difficulty-expansion/reviews/${batchId}.json`));
  const review = reviewSchema.parse(JSON.parse(bytes.toString('utf8')));
  const expectedIds = Array.from({ length: 250 }, (_, index) =>
    `${batch.packId}-all-level-expansion-${String(index + 1).padStart(4, '0')}`);
  if (review.batchId !== batchId || JSON.stringify([...review.reviewedClueIds].sort()) !== JSON.stringify(expectedIds)) {
    throw new Error(`${batchId} requires the exact 250 independently reviewed questions`);
  }
  const paths = acceptedBatchPaths(batchId);
  for (const artifact of ['authored', 'generated', 'evidence'] as const) {
    const currentHash = sha256(regularBytes(resolve(repositoryRoot, paths[artifact])));
    if (approvedHistoricalHash(paths[artifact], currentHash, repositoryRoot) !== review.artifactHashes[artifact]) {
      throw new Error(`${batchId} review does not match accepted ${artifact} bytes`);
    }
  }
  if (new Set(review.translationExceptions.map(({ id }) => id)).size !== review.translationExceptions.length
    || review.translationExceptions.some(({ id }) => !expectedIds.some((clueId) => id.includes(`:${clueId}:`)))) {
    throw new Error(`${batchId} has an invalid reviewed exception list`);
  }
  const binding = { phase: 'all-difficulty-expansion' as const, batchId, manifestSha256: sha256(bytes) };
  return { review, binding };
}

export function assertAllDifficultyExpansionReviewBindings(
  exceptions: readonly BoundException[], repositoryRoot = '.',
): void {
  const reviews = new Map<string, ReturnType<typeof loadAcceptedAllDifficultyExpansionReview>>();
  for (const exception of exceptions.filter(({ id }) => id.includes('-all-level-expansion-'))) {
    const batch = PRODUCTION_BATCHES.find(({ packId }) => exception.id.includes(`:${packId}-all-level-expansion-`));
    if (!batch) throw new Error(`Unexpected all-difficulty reviewed exception ${exception.id}`);
    let accepted = reviews.get(batch.id);
    if (!accepted) {
      accepted = loadAcceptedAllDifficultyExpansionReview(batch.id, repositoryRoot);
      reviews.set(batch.id, accepted);
    }
    const actual = bindingSchema.safeParse(exception.reviewBinding);
    if (!actual.success || actual.data.batchId !== accepted.binding.batchId
      || actual.data.manifestSha256 !== accepted.binding.manifestSha256) {
      throw new Error(`All-difficulty review binding for ${exception.id} is stale or invalid`);
    }
    const decision = accepted.review.translationExceptions.find(({ id }) => id === exception.id);
    if (!decision || exception.reviewerReason !== decision.reason) {
      throw new Error(`All-difficulty reviewed exception ${exception.id} is not approved by its manifest`);
    }
  }
}
