import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readEvidenceInputs, type ContentEvidence } from "../evidence";
import { readCsvInputs } from "../readCsv";
import {
  publishValidationReport,
  validateProductionContent,
  type ProductionValidationIssue,
} from "../validate";
import { buildEasyExpansionCorpus } from "./bank";
import {
  EASY_EXPANSION_BATCH_IDS,
  loadAcceptedEasyExpansionReviews,
  reviewBindingFor,
  type EasyExpansionReviewBinding,
} from "./reviewBinding";

const REVIEWABLE_TRANSLATION_CODES = new Set([
  "SUSPICIOUS_PROPER_NOUN_CHANGE",
  "UNCHANGED_TRANSLATION",
]);
const EXPECTED_REVIEWABLE_ERROR_COUNTS = {
  SUSPICIOUS_PROPER_NOUN_CHANGE: 295,
  UNCHANGED_TRANSLATION: 143,
} as const;
const EXPECTED_NEW_EXCEPTION_COUNT = 438;
const EXPECTED_LEGACY_REVIEWED_EXCEPTION_COUNT = 6_961;

type UnknownRecord = Record<string, unknown>;

interface ReviewedException extends UnknownRecord {
  id: string;
  status: "reviewed";
  reviewerReason: string;
  reviewBinding?: EasyExpansionReviewBinding;
}

export interface ReviewEasyExpansionTranslationExceptionsOptions {
  repositoryRoot?: string;
  reportPath?: string;
}

export interface ReviewEasyExpansionTranslationExceptionsResult {
  reviewedExceptionIds: string[];
}

export interface ReviewEasyExpansionTranslationExceptionsDependencies {
  beforePublish?: () => void;
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

function readRegularFile(path: string): Buffer {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (stat === undefined || !stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${path} must be a regular file`);
  }
  return readFileSync(path);
}

function approvedTranslationEvidence(
  evidence: ContentEvidence | undefined,
  batchId: string,
): boolean {
  return (
    evidence?.batchId === batchId &&
    evidence.translationReview !== null &&
    evidence.translationReview.decision === "approved" &&
    evidence.translationReview.reviewer.trim() !== "" &&
    evidence.translationReview.reviewedAt.trim() !== ""
  );
}

function reviewedException(value: unknown): value is ReviewedException {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Partial<ReviewedException>;
  return (
    typeof candidate.id === "string" &&
    candidate.status === "reviewed" &&
    typeof candidate.reviewerReason === "string" &&
    candidate.reviewerReason.trim() !== ""
  );
}

function clueIdFromReviewableExceptionId(id: string): string | undefined {
  const match =
    /^translation:(?:SUSPICIOUS_PROPER_NOUN_CHANGE|UNCHANGED_TRANSLATION):(.+)$/u.exec(
      id,
    );
  return match?.[1];
}

function assertReviewableExpansionErrors(
  errors: readonly ProductionValidationIssue[],
  expectedClueIds: ReadonlySet<string>,
): string[] {
  if (errors.length !== EXPECTED_NEW_EXCEPTION_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_NEW_EXCEPTION_COUNT} reviewable release errors; found ${errors.length}`,
    );
  }
  const counts = new Map<string, number>();
  const ids = new Set<string>();
  for (const issue of errors) {
    const clueId =
      issue.exceptionId === undefined
        ? undefined
        : clueIdFromReviewableExceptionId(issue.exceptionId);
    if (
      !REVIEWABLE_TRANSLATION_CODES.has(issue.code) ||
      issue.exceptionId !== `translation:${issue.code}:${clueId}` ||
      clueId === undefined ||
      !expectedClueIds.has(clueId)
    ) {
      throw new Error(
        `Unexpected release error ${issue.code} at ${issue.file}:${issue.row}`,
      );
    }
    counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
    if (ids.has(issue.exceptionId)) {
      throw new Error(`Duplicate reviewable exception ID ${issue.exceptionId}`);
    }
    ids.add(issue.exceptionId);
  }
  for (const [code, expected] of Object.entries(
    EXPECTED_REVIEWABLE_ERROR_COUNTS,
  )) {
    if (counts.get(code) !== expected) {
      throw new Error(
        `Expected ${expected} ${code} errors; found ${counts.get(code) ?? 0}`,
      );
    }
  }
  return [...ids].sort(compareCodeUnits);
}

export async function reviewEasyExpansionTranslationExceptions(
  options: ReviewEasyExpansionTranslationExceptionsOptions = {},
  dependencies: ReviewEasyExpansionTranslationExceptionsDependencies = {},
): Promise<ReviewEasyExpansionTranslationExceptionsResult> {
  const repositoryRoot = resolve(options.repositoryRoot ?? ".");
  const reportPath = resolve(
    options.reportPath ??
      resolve(repositoryRoot, "content/reports/release-inventory.json"),
  );
  const acceptedReviews = loadAcceptedEasyExpansionReviews(repositoryRoot);

  const expansionCorpus = buildEasyExpansionCorpus();
  const batchByClueId = new Map<string, string>();
  for (const category of expansionCorpus) {
    if (!acceptedReviews.has(category.batchId)) {
      throw new Error(`Unexpected Easy expansion batch ${category.batchId}`);
    }
    for (const question of category.questions) {
      if (batchByClueId.has(question.clueId)) {
        throw new Error(`Duplicate Easy expansion clue ID ${question.clueId}`);
      }
      batchByClueId.set(question.clueId, category.batchId);
    }
  }
  if (expansionCorpus.length !== 240 || batchByClueId.size !== 1_200) {
    throw new Error(
      "Easy expansion review requires exactly 240 sets and 1,200 clues",
    );
  }
  for (const batchId of EASY_EXPANSION_BATCH_IDS) {
    if (
      [...batchByClueId.values()].filter((value) => value === batchId)
        .length !== 100
    ) {
      throw new Error(`${batchId} requires exactly 100 Easy expansion clues`);
    }
  }

  const evidenceByClueId = await readEvidenceInputs([
    resolve(repositoryRoot, "content/evidence/*.jsonl"),
  ]);
  for (const [clueId, batchId] of batchByClueId) {
    if (!approvedTranslationEvidence(evidenceByClueId.get(clueId), batchId)) {
      throw new Error(`${clueId} requires approved translation evidence`);
    }
  }
  const inputs = await readCsvInputs([
    resolve(repositoryRoot, "content/generated/*.en-et.csv"),
  ]);
  const acceptedExpansionIds = inputs
    .flatMap(({ pack }) => pack.rows.map(({ clue_id }) => clue_id))
    .filter((clueId) => /-easy-expansion-\d{3}$/u.test(clueId))
    .sort(compareCodeUnits);
  const expectedClueIds = [...batchByClueId.keys()].sort(compareCodeUnits);
  if (
    JSON.stringify(acceptedExpansionIds) !== JSON.stringify(expectedClueIds)
  ) {
    throw new Error(
      "Accepted generated content does not contain the exact reviewed Easy expansion corpus",
    );
  }

  const reportBytes = readRegularFile(reportPath);
  const report = objectAt(JSON.parse(reportBytes.toString("utf8")), reportPath);
  const translation = objectAt(report.translation, `${reportPath} translation`);
  if (!Array.isArray(translation.exceptions)) {
    throw new Error(`${reportPath} translation exceptions must be an array`);
  }
  const existingExceptions = translation.exceptions.map((value, index) => {
    const exception = objectAt(
      value,
      `${reportPath} translation exception ${index}`,
    );
    if (typeof exception.id !== "string") {
      throw new Error(
        `${reportPath} translation exception ${index} requires an ID`,
      );
    }
    return exception;
  });
  const existingById = new Map<string, UnknownRecord>();
  for (const exception of existingExceptions) {
    const id = exception.id as string;
    if (existingById.has(id))
      throw new Error(`Duplicate existing exception ID ${id}`);
    existingById.set(id, exception);
  }
  const legacyReviewedIds = existingExceptions
    .filter(reviewedException)
    .map(({ id }) => id)
    .filter((id) => {
      const clueId = clueIdFromReviewableExceptionId(id);
      return clueId === undefined || !batchByClueId.has(clueId);
    });
  if (
    legacyReviewedIds.length !== EXPECTED_LEGACY_REVIEWED_EXCEPTION_COUNT ||
    new Set(legacyReviewedIds).size !== legacyReviewedIds.length
  ) {
    throw new Error(
      `Expected ${EXPECTED_LEGACY_REVIEWED_EXCEPTION_COUNT} unique legacy reviewed exceptions`,
    );
  }

  const validation = validateProductionContent(inputs, {
    mode: "release",
    evidenceByClueId,
    reviewedExceptionIds: legacyReviewedIds,
  });
  const errors = validation.issues.filter(
    ({ severity }) => severity === "error",
  );
  const reviewedExceptionIds = assertReviewableExpansionErrors(
    errors,
    new Set(expectedClueIds),
  );
  const additions = reviewedExceptionIds.map((id): ReviewedException => {
    const clueId = clueIdFromReviewableExceptionId(id)!;
    const batchId = batchByClueId.get(clueId)!;
    const review = acceptedReviews.get(batchId)!;
    return {
      id,
      status: "reviewed",
      reviewerReason: `Easy expansion review ${batchId}: Estonian reviewer ${review.estonianReviewer} approved all 100 translations; accepted authored, generated, and evidence hashes match the review manifest.`,
      reviewBinding: reviewBindingFor(review),
    };
  });

  for (const addition of additions) {
    const existing = existingById.get(addition.id);
    if (existing === undefined) {
      existingById.set(addition.id, addition);
      continue;
    }
    if (
      existing.status !== addition.status ||
      existing.reviewerReason !== addition.reviewerReason ||
      (existing.reviewBinding !== undefined &&
        JSON.stringify(existing.reviewBinding) !==
          JSON.stringify(addition.reviewBinding))
    ) {
      throw new Error(
        `Existing Easy expansion exception ${addition.id} does not match its review manifest`,
      );
    }
    existingById.set(addition.id, { ...existing, ...addition });
  }
  for (const exception of existingExceptions) {
    const clueId = clueIdFromReviewableExceptionId(exception.id as string);
    if (
      clueId !== undefined &&
      batchByClueId.has(clueId) &&
      !reviewedExceptionIds.includes(exception.id as string)
    ) {
      throw new Error(
        `Unexpected existing Easy expansion exception ${exception.id as string}`,
      );
    }
  }

  const exceptions = [...existingById.values()].sort((left, right) =>
    compareCodeUnits(left.id as string, right.id as string),
  );
  const recheckedReviews = loadAcceptedEasyExpansionReviews(repositoryRoot);
  for (const batchId of EASY_EXPANSION_BATCH_IDS) {
    if (
      JSON.stringify(recheckedReviews.get(batchId)) !==
      JSON.stringify(acceptedReviews.get(batchId))
    ) {
      throw new Error(
        `Accepted Easy expansion review ${batchId} changed before publication`,
      );
    }
  }
  dependencies.beforePublish?.();
  if (!readRegularFile(reportPath).equals(reportBytes)) {
    throw new Error(
      "Release inventory report changed before Easy expansion publication",
    );
  }
  publishValidationReport(
    reportPath,
    { translation: { ...translation, exceptions } },
    { placement: "top-level" },
  );
  return { reviewedExceptionIds };
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  reviewEasyExpansionTranslationExceptions()
    .then(({ reviewedExceptionIds }) => {
      process.stdout.write(
        `Reviewed ${reviewedExceptionIds.length} Easy expansion translation exceptions\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
