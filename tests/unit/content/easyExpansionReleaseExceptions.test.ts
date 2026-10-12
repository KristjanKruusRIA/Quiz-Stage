import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  EASY_EXPANSION_BATCH_IDS,
  type EasyExpansionReviewBinding,
} from "../../../scripts/content/easyExpansion/reviewBinding";
import { reviewEasyExpansionTranslationExceptions } from "../../../scripts/content/easyExpansion/reviewTranslationExceptions";
import { readEvidenceInputs } from "../../../scripts/content/evidence";
import { acceptedBatchPaths } from "../../../scripts/content/productionBatches";
import { readCsvInputs } from "../../../scripts/content/readCsv";
import {
  NON_WAIVABLE_CODES,
  reviewedIdsFromReport,
  validateProductionContent,
} from "../../../scripts/content/validate";
import { readPreRepairContent } from "./preRepairContent";

// This completed phase retains the catalog recorded by the 8,374-row baseline.
vi.mock("../../../scripts/content/productionBatches", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../scripts/content/productionBatches")>();
  const { readFileSync } = await import("node:fs");
  const { parsePackCsv } = await import("../../../src/main/content/csvPacks");
  const baseline = JSON.parse(readFileSync("content/reports/all-difficulty-expansion-baseline-record-hashes.json", "utf8")) as {
    batches: Record<string, { generated: Record<string, string> }>;
  };
  const batches = Object.freeze(actual.PRODUCTION_BATCHES.map((batch) => {
    const rows = parsePackCsv(readFileSync(actual.acceptedBatchPaths(batch.id).generated, "utf8")).rows
      .filter(({ clue_id }) => Object.hasOwn(baseline.batches[batch.id].generated, clue_id));
    const sets = (difficulty: string, round: string) => new Set(rows
      .filter((row) => row.difficulty === difficulty && row.round === round)
      .map(({ category_set_id }) => category_set_id)).size;
    return Object.freeze({
      ...batch,
      boardClues: rows.length,
      subthemes: Object.freeze(batch.subthemes.filter((subtheme) => rows.some((row) => row.macro_topic === subtheme))),
      distribution: Object.freeze(Object.fromEntries(["easy", "medium", "hard"].map((difficulty) => [difficulty, Object.freeze({
        roundOne: sets(difficulty, "round-one"), roundTwo: sets(difficulty, "round-two"),
      })]))) as typeof batch.distribution,
    });
  }));
  return {
    ...actual,
    PRODUCTION_BATCHES: batches,
    getProductionBatch: (id: string) => batches.find((batch) => batch.id === id) ?? actual.getProductionBatch(id),
  };
});

vi.mock("../../../scripts/content/releaseThresholds", () => ({
  RELEASE_THRESHOLDS: {
    boardClues: 8_200, categorySets: 1_640, distinctCategoryNames: 1_640,
    finalClues: 174, easySets: 707, mediumSets: 467, hardSets: 466, builtInPacks: 15,
  },
  RELEASE_COMPOSITION_THRESHOLDS: {
    boardClues: { easy: 3_535, medium: 2_335, hard: 2_330 },
    categorySets: {
      easy: { roundOne: 354, roundTwo: 353 },
      medium: { roundOne: 233, roundTwo: 234 },
      hard: { roundOne: 233, roundTwo: 233 },
    },
    finalClues: { easy: 58, medium: 58, hard: 58 },
  },
}));

const temporaryDirectories: string[] = [];
const historicalRepositoryRoot = mkdtempSync(join(tmpdir(), "quiz-stage-easy-historical-"));
let legacyReportText = "";
let reviewedReportText = "";
let expectedReviewedIds: string[] = [];

function temporaryPath(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function writeTemporaryReport(text: string): string {
  const path = join(
    temporaryPath("quiz-stage-easy-exceptions-"),
    "release-inventory.json",
  );
  writeFileSync(path, text);
  return path;
}

function legacyReport(): string {
  const report = JSON.parse(
    readFileSync(resolve("content/reports/release-inventory.json"), "utf8"),
  ) as Record<string, unknown>;
  const translation = report.translation as Record<string, unknown>;
  const exceptions = (translation.exceptions as Array<{ id: string }>).filter(
    ({ id }) => !id.includes("easy-expansion") && !id.includes("all-level-expansion"),
  );
  return `${JSON.stringify(
    {
      ...report,
      testSentinel: { preserved: true },
      translation: {
        ...translation,
        exceptions,
        testSentinel: "preserved",
      },
    },
    null,
    2,
  )}\n`;
}

function copyBindingFixture(): string {
  const repositoryRoot = temporaryPath("quiz-stage-easy-binding-");
  for (const batchId of EASY_EXPANSION_BATCH_IDS) {
    const review = `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/${batchId}.json`;
    const { authored, generated, evidence } = acceptedBatchPaths(batchId);
    for (const relativePath of [review, authored, generated, evidence]) {
      const destination = join(repositoryRoot, relativePath);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(historicalRepositoryRoot, relativePath), destination);
    }
  }
  return repositoryRoot;
}

beforeAll(async () => {
  const baseline = JSON.parse(readFileSync("content/reports/all-difficulty-expansion-baseline-record-hashes.json", "utf8")) as {
    recordCount: number;
    batches: Record<string, Record<"authored" | "generated" | "evidence", Record<string, string>>>;
  };
  expect(baseline.recordCount).toBe(8_374);
  for (const [batchId, records] of Object.entries(baseline.batches)) {
    const paths = acceptedBatchPaths(batchId);
    for (const artifact of ["authored", "generated", "evidence"] as const) {
      const bytes = Buffer.from(readPreRepairContent(paths[artifact]));
      const parts: Buffer[] = [];
      if (artifact === "evidence") {
        for (const line of bytes.toString("utf8").match(/[^\n]*\n|[^\n]+$/gu) ?? []) {
          if (Object.hasOwn(records.evidence, JSON.parse(line).clueId)) parts.push(Buffer.from(line));
        }
      } else {
        let start = 0;
        for (const row of parse(bytes, { info: true }) as unknown as Array<{ record: string[]; info: { bytes: number } }>) {
          if (row.record[0] === "clue_id" || Object.hasOwn(records[artifact], row.record[0])) {
            parts.push(bytes.subarray(start, row.info.bytes));
          }
          start = row.info.bytes;
        }
        parts.push(bytes.subarray(start));
      }
      const destination = join(historicalRepositoryRoot, paths[artifact]);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, Buffer.concat(parts));
    }
  }
  for (const batchId of EASY_EXPANSION_BATCH_IDS) {
    const relativePath = `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/${batchId}.json`;
    const destination = join(historicalRepositoryRoot, relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(relativePath, destination);
  }
  legacyReportText = legacyReport();
  const reportPath = writeTemporaryReport(legacyReportText);
  const result = await reviewEasyExpansionTranslationExceptions({
    repositoryRoot: historicalRepositoryRoot,
    reportPath,
  });
  reviewedReportText = readFileSync(reportPath, "utf8");
  expectedReviewedIds = result.reviewedExceptionIds;
}, 120_000);

afterAll(() => rmSync(historicalRepositoryRoot, { recursive: true, force: true }));

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("Easy expansion release translation exceptions", () => {
  it("pins checkout line endings for every manifest-bound artifact", () => {
    const expectedAttributes = EASY_EXPANSION_BATCH_IDS.flatMap((batchId) => {
      const { authored, generated, evidence } = acceptedBatchPaths(batchId);
      return [
        `${authored}: eol: crlf`,
        `${generated}: eol: crlf`,
        `${evidence}: eol: lf`,
      ];
    });
    const paths = expectedAttributes.map((line) =>
      line.slice(0, line.indexOf(":")),
    );

    const output = execFileSync(
      "git",
      ["check-attr", "eol", "--", ...paths],
      {
        cwd: resolve("."),
        encoding: "utf8",
      },
    )
      .trim()
      .split(/\r?\n/u);

    expect(output).toEqual(expectedAttributes);
  });

  it("records only the 438 manifest-bound exceptions and is byte-stable on rerun", async () => {
    const before = JSON.parse(legacyReportText) as {
      translation: { exceptions: unknown[]; testSentinel: string };
      testSentinel: { preserved: boolean };
    };
    const afterFirstRun = JSON.parse(reviewedReportText) as {
      translation: {
        exceptions: Array<{
          id: string;
          status: string;
          reviewBinding?: EasyExpansionReviewBinding;
        }>;
        testSentinel: string;
      };
      testSentinel: { preserved: boolean };
    };

    expect(expectedReviewedIds).toHaveLength(438);
    expect(expectedReviewedIds).toEqual(
      [...expectedReviewedIds].sort((left, right) =>
        left.localeCompare(right, "en"),
      ),
    );
    expect(
      expectedReviewedIds.every((id) =>
        /^translation:(?:SUSPICIOUS_PROPER_NOUN_CHANGE|UNCHANGED_TRANSLATION):built-in-.+-easy-expansion-\d{3}$/u.test(
          id,
        ),
      ),
    ).toBe(true);
    expect(afterFirstRun.testSentinel).toEqual(before.testSentinel);
    expect(afterFirstRun.translation.testSentinel).toBe("preserved");
    expect(afterFirstRun.translation.exceptions).toHaveLength(
      before.translation.exceptions.length + 438,
    );
    for (const existing of before.translation.exceptions) {
      expect(afterFirstRun.translation.exceptions).toContainEqual(existing);
    }
    const additions = afterFirstRun.translation.exceptions.filter(({ id }) =>
      expectedReviewedIds.includes(id),
    );
    expect(additions).toHaveLength(438);
    expect(
      additions.every(
        ({ status, reviewBinding }) =>
          status === "reviewed" &&
          reviewBinding?.version === 1 &&
          EASY_EXPANSION_BATCH_IDS.includes(
            reviewBinding.batchId as (typeof EASY_EXPANSION_BATCH_IDS)[number],
          ) &&
          Object.values(reviewBinding.artifactHashes).every((hash) =>
            /^[0-9a-f]{64}$/u.test(hash),
          ),
      ),
    ).toBe(true);

    const rerunPath = writeTemporaryReport(reviewedReportText);
    const rerun = await reviewEasyExpansionTranslationExceptions({
      repositoryRoot: historicalRepositoryRoot,
      reportPath: rerunPath,
    });
    expect(rerun.reviewedExceptionIds).toEqual(expectedReviewedIds);
    expect(readFileSync(rerunPath, "utf8")).toBe(reviewedReportText);
  }, 180_000);

  it("rejects a tampered persisted binding before returning its waiver", () => {
    const report = JSON.parse(reviewedReportText) as {
      translation: {
        exceptions: Array<{
          id: string;
          reviewBinding?: EasyExpansionReviewBinding;
        }>;
      };
    };
    const exception = report.translation.exceptions.find(({ id }) =>
      expectedReviewedIds.includes(id),
    );
    expect(exception?.reviewBinding).toBeDefined();
    exception!.reviewBinding!.artifactHashes.generated = "0".repeat(64);
    const reportPath = writeTemporaryReport(
      `${JSON.stringify(report, null, 2)}\n`,
    );

    expect(() =>
      reviewedIdsFromReport(reportPath, { repositoryRoot: historicalRepositoryRoot }),
    ).toThrow(/review binding/i);
  });

  it("keeps historical licence errors blocking after reviewing translation exceptions", async () => {
    const reportPath = writeTemporaryReport(reviewedReportText);
    const reviewedExceptionIds = reviewedIdsFromReport(reportPath, {
      repositoryRoot: historicalRepositoryRoot,
    });
    const [inputs, evidenceByClueId] = await Promise.all([
      readCsvInputs([join(historicalRepositoryRoot, "content/generated/*.en-et.csv")]),
      readEvidenceInputs([join(historicalRepositoryRoot, "content/evidence/*.jsonl")]),
    ]);
    const validation = validateProductionContent(inputs, {
      mode: "release",
      evidenceByClueId,
      reviewedExceptionIds: [
        ...reviewedExceptionIds,
        "INVALID_SOURCE_LICENSE",
        ...inputs.flatMap(({ pack }) => pack.rows.map(({ clue_id }) =>
          `translation:INVALID_SOURCE_LICENSE:${clue_id}`)),
      ],
    });
    const errors = validation.issues.filter(({ severity }) => severity === "error");

    expect(validation.blocking).toBe(true);
    expect(errors).toHaveLength(5);
    expect(errors.every(({ code, exceptionId }) =>
      code === "INVALID_SOURCE_LICENSE" && exceptionId === undefined)).toBe(true);
    expect(NON_WAIVABLE_CODES.has("INVALID_SOURCE_LICENSE")).toBe(true);
    expect(validation.exceptions.some(({ code }) => code === "INVALID_SOURCE_LICENSE")).toBe(false);
    expect(expectedReviewedIds).toHaveLength(438);
    expect(expectedReviewedIds.some((id) => id.includes("INVALID_SOURCE_LICENSE"))).toBe(false);

    const historicalReport = JSON.parse(readFileSync(reportPath, "utf8")) as Record<string, unknown>;
    historicalReport.validation = validation;
    writeFileSync(reportPath, `${JSON.stringify(historicalReport, null, 2)}\n`);
    await reviewEasyExpansionTranslationExceptions({
      repositoryRoot: historicalRepositoryRoot,
      reportPath,
    });
    const published = JSON.parse(readFileSync(reportPath, "utf8")) as { validation: typeof validation };
    expect(published.validation).toEqual(validation);
    expect(published.validation.blocking).toBe(true);
    expect(published.validation.issues.filter(({ severity, code }) =>
      severity === "error" && code === "INVALID_SOURCE_LICENSE")).toHaveLength(5);
  }, 120_000);

  it("does not overwrite a release report changed during validation", async () => {
    const reportPath = writeTemporaryReport(legacyReportText);
    await expect(
      reviewEasyExpansionTranslationExceptions(
        { repositoryRoot: historicalRepositoryRoot, reportPath },
        {
          beforePublish: () => {
            const current = JSON.parse(readFileSync(reportPath, "utf8")) as {
              translation: Record<string, unknown>;
            };
            current.translation.concurrentSentinel = "preserved";
            writeFileSync(reportPath, `${JSON.stringify(current, null, 2)}\n`);
          },
        },
      ),
    ).rejects.toThrow(/report changed before Easy expansion publication/i);

    const after = JSON.parse(readFileSync(reportPath, "utf8")) as {
      translation: { concurrentSentinel?: string };
    };
    expect(after.translation.concurrentSentinel).toBe("preserved");
  }, 120_000);

  it("rejects a waiver after accepted artifact bytes change", () => {
    const repositoryRoot = copyBindingFixture();
    const generatedPath = join(
      repositoryRoot,
      acceptedBatchPaths("01-history").generated,
    );
    const generatedBytes = readFileSync(generatedPath);
    generatedBytes[0] = generatedBytes[0]! ^ 1;
    writeFileSync(generatedPath, generatedBytes);
    const reportPath = writeTemporaryReport(reviewedReportText);

    expect(() => reviewedIdsFromReport(reportPath, { repositoryRoot })).toThrow(
      /accepted generated bytes/i,
    );
  });

  it("preserves legacy waiver loading without requiring Easy expansion artifacts", () => {
    const legacyId =
      "translation:UNCHANGED_TRANSLATION:built-in-history-accessible-corpus-001";
    const reportPath = writeTemporaryReport(
      `${JSON.stringify({
        translation: {
          exceptions: [
            {
              id: legacyId,
              status: "reviewed",
              reviewerReason: "Previously reviewed legacy exception",
            },
          ],
        },
      })}\n`,
    );

    expect(
      reviewedIdsFromReport(reportPath, {
        repositoryRoot: join(
          temporaryPath("quiz-stage-missing-root-"),
          "absent",
        ),
      }),
    ).toEqual([legacyId]);
  });
});
