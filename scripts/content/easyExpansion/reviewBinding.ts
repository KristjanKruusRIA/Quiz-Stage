import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { acceptedBatchPaths, PRODUCTION_BATCHES } from "../productionBatches";

export const EASY_EXPANSION_BATCH_IDS = [
  "01-history",
  "02-geography",
  "03-science-nature",
  "04-literature-language",
  "05-art-architecture",
  "06-music",
  "07-film-television",
  "08-sports-games",
  "09-food-drink",
  "10-technology-inventions",
  "11-politics-economics-society",
  "12-mythology-religion-philosophy",
] as const;

const ARTIFACT_NAMES = ["authored", "generated", "evidence"] as const;
const REVIEWABLE_TRANSLATION_CODES = [
  "SUSPICIOUS_PROPER_NOUN_CHANGE",
  "UNCHANGED_TRANSLATION",
] as const;

type UnknownRecord = Record<string, unknown>;

export interface EasyExpansionArtifactHashes {
  authored: string;
  generated: string;
  evidence: string;
}

export interface EasyExpansionReviewBinding {
  version: 1;
  batchId: string;
  artifactHashes: EasyExpansionArtifactHashes;
}

export interface AcceptedEasyExpansionReview {
  batchId: string;
  artifactHashes: EasyExpansionArtifactHashes;
  estonianReviewer: string;
}

export interface BoundReviewedException {
  id: string;
  reviewBinding?: unknown;
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function objectAt(value: unknown, label: string): UnknownRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as UnknownRecord;
}

function readStableRegularFile(path: string): Buffer {
  const before = lstatSync(path, { throwIfNoEntry: false });
  if (before === undefined || !before.isFile() || before.isSymbolicLink()) {
    throw new Error(`${path} must be a regular file`);
  }
  const bytes = readFileSync(path);
  const after = lstatSync(path, { throwIfNoEntry: false });
  if (
    after === undefined ||
    !after.isFile() ||
    after.isSymbolicLink() ||
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.size !== after.size ||
    before.mtimeMs !== after.mtimeMs ||
    before.ctimeMs !== after.ctimeMs
  ) {
    throw new Error(`${path} changed while reading`);
  }
  return bytes;
}

function sha256(path: string): string {
  return createHash("sha256").update(readStableRegularFile(path)).digest("hex");
}

function assertExactNumbers(
  value: unknown,
  expected: Readonly<Record<string, number>>,
  label: string,
): void {
  const record = objectAt(value, label);
  const keys = Object.keys(record).sort(compareCodeUnits);
  const expectedKeys = Object.keys(expected).sort(compareCodeUnits);
  if (
    JSON.stringify(keys) !== JSON.stringify(expectedKeys) ||
    expectedKeys.some((key) => record[key] !== expected[key])
  ) {
    throw new Error(`${label} does not match the accepted review contract`);
  }
}

function artifactHashesAt(
  value: unknown,
  label: string,
): EasyExpansionArtifactHashes {
  const hashes = objectAt(value, label);
  const keys = Object.keys(hashes).sort(compareCodeUnits);
  if (
    JSON.stringify(keys) !==
    JSON.stringify([...ARTIFACT_NAMES].sort(compareCodeUnits))
  ) {
    throw new Error(`${label} must contain the exact accepted artifact hashes`);
  }
  for (const artifact of ARTIFACT_NAMES) {
    if (
      typeof hashes[artifact] !== "string" ||
      !/^[0-9a-f]{64}$/u.test(hashes[artifact])
    ) {
      throw new Error(`${label}.${artifact} must be a SHA-256 hash`);
    }
  }
  return {
    authored: hashes.authored as string,
    generated: hashes.generated as string,
    evidence: hashes.evidence as string,
  };
}

function assertEligibleBatchInventory(repositoryRoot: string): void {
  const expectedIds = [...EASY_EXPANSION_BATCH_IDS];
  const productionIds = PRODUCTION_BATCHES.filter(
    ({ boardClues }) => boardClues === 600,
  ).map(({ id }) => id);
  if (JSON.stringify(productionIds) !== JSON.stringify(expectedIds)) {
    throw new Error(
      "Easy expansion review requires the exact 12 eligible production batches",
    );
  }

  const reviewDirectory = resolve(
    repositoryRoot,
    "docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews",
  );
  const directoryStat = lstatSync(reviewDirectory, { throwIfNoEntry: false });
  if (
    directoryStat === undefined ||
    !directoryStat.isDirectory() ||
    directoryStat.isSymbolicLink()
  ) {
    throw new Error(`${reviewDirectory} must be a real directory`);
  }
  const reviewIds = readdirSync(reviewDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.slice(0, -".json".length))
    .sort(compareCodeUnits);
  if (JSON.stringify(reviewIds) !== JSON.stringify(expectedIds)) {
    throw new Error(
      "Easy expansion review requires exactly 12 accepted review manifests",
    );
  }
}

export function loadAcceptedEasyExpansionReviews(
  root = ".",
): ReadonlyMap<string, AcceptedEasyExpansionReview> {
  const repositoryRoot = resolve(root);
  assertEligibleBatchInventory(repositoryRoot);
  const reviews = new Map<string, AcceptedEasyExpansionReview>();

  for (const batchId of EASY_EXPANSION_BATCH_IDS) {
    const path = resolve(
      repositoryRoot,
      `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/${batchId}.json`,
    );
    const manifest = objectAt(
      JSON.parse(readStableRegularFile(path).toString("utf8")),
      path,
    );
    if (manifest.version !== 1 || manifest.batchId !== batchId) {
      throw new Error(`${path} is not the accepted ${batchId} review manifest`);
    }
    assertExactNumbers(
      manifest.reviewedCounts,
      { clues: 100, categories: 20, sources: 100 },
      `${path} reviewedCounts`,
    );
    assertExactNumbers(
      manifest.finalSeverityCounts,
      { critical: 0, important: 0, minor: 0 },
      `${path} finalSeverityCounts`,
    );

    const artifactHashes = artifactHashesAt(
      manifest.projectedArtifactHashes,
      `${path} projectedArtifactHashes`,
    );
    const reviewers = objectAt(manifest.reviewers, `${path} reviewers`);
    const estonianReviewer = reviewers.estonian;
    if (
      typeof estonianReviewer !== "string" ||
      estonianReviewer.trim() === ""
    ) {
      throw new Error(`${path} requires an Estonian reviewer`);
    }
    const acceptedPaths = acceptedBatchPaths(batchId);
    for (const artifact of ARTIFACT_NAMES) {
      if (
        sha256(resolve(repositoryRoot, acceptedPaths[artifact])) !==
        artifactHashes[artifact]
      ) {
        throw new Error(`${path} does not match accepted ${artifact} bytes`);
      }
    }
    reviews.set(batchId, { batchId, artifactHashes, estonianReviewer });
  }

  return reviews;
}

export function reviewBindingFor(
  review: AcceptedEasyExpansionReview,
): EasyExpansionReviewBinding {
  return {
    version: 1,
    batchId: review.batchId,
    artifactHashes: { ...review.artifactHashes },
  };
}

function batchIdFromExceptionId(id: string): string | undefined {
  const codePattern = REVIEWABLE_TRANSLATION_CODES.join("|");
  const match = new RegExp(`^translation:(?:${codePattern}):(.+)$`, "u").exec(
    id,
  );
  const clueId = match?.[1];
  if (clueId === undefined) return undefined;
  for (const batch of PRODUCTION_BATCHES.filter(
    ({ boardClues }) => boardClues === 600,
  )) {
    if (
      new RegExp(
        `^${batch.packId}-easy-expansion-(?:00[1-9]|0[1-9]\\d|100)$`,
        "u",
      ).test(clueId)
    ) {
      return batch.id;
    }
  }
  return undefined;
}

function bindingAt(value: unknown, label: string): EasyExpansionReviewBinding {
  const binding = objectAt(value, label);
  const keys = Object.keys(binding).sort(compareCodeUnits);
  if (
    JSON.stringify(keys) !==
    JSON.stringify(["artifactHashes", "batchId", "version"])
  ) {
    throw new Error(
      `${label} does not match the accepted review binding schema`,
    );
  }
  if (binding.version !== 1 || typeof binding.batchId !== "string") {
    throw new Error(
      `${label} does not match the accepted review binding schema`,
    );
  }
  return {
    version: 1,
    batchId: binding.batchId,
    artifactHashes: artifactHashesAt(
      binding.artifactHashes,
      `${label}.artifactHashes`,
    ),
  };
}

export function assertEasyExpansionReviewBindings(
  exceptions: readonly BoundReviewedException[],
  repositoryRoot = ".",
): void {
  const expansionExceptions = exceptions.filter(({ id }) =>
    id.includes("-easy-expansion-"),
  );
  if (expansionExceptions.length === 0) return;

  const reviews = loadAcceptedEasyExpansionReviews(repositoryRoot);
  for (const exception of expansionExceptions) {
    const batchId = batchIdFromExceptionId(exception.id);
    if (batchId === undefined) {
      throw new Error(
        `Unexpected Easy expansion reviewed exception ${exception.id}`,
      );
    }
    const actual = bindingAt(
      exception.reviewBinding,
      `Easy expansion review binding for ${exception.id}`,
    );
    const review = reviews.get(batchId);
    if (
      review === undefined ||
      JSON.stringify(actual) !== JSON.stringify(reviewBindingFor(review))
    ) {
      throw new Error(
        `Easy expansion review binding for ${exception.id} is stale or invalid`,
      );
    }
  }
}
