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
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  EASY_EXPANSION_BATCH_IDS,
  type EasyExpansionReviewBinding,
} from "../../../scripts/content/easyExpansion/reviewBinding";
import { reviewEasyExpansionTranslationExceptions } from "../../../scripts/content/easyExpansion/reviewTranslationExceptions";
import { acceptedBatchPaths } from "../../../scripts/content/productionBatches";
import { reviewedIdsFromReport } from "../../../scripts/content/validate";

const temporaryDirectories: string[] = [];
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
    ({ id }) => !id.includes("easy-expansion"),
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
      copyFileSync(resolve(relativePath), destination);
    }
  }
  return repositoryRoot;
}

beforeAll(async () => {
  legacyReportText = legacyReport();
  const reportPath = writeTemporaryReport(legacyReportText);
  const result = await reviewEasyExpansionTranslationExceptions({
    repositoryRoot: resolve("."),
    reportPath,
  });
  reviewedReportText = readFileSync(reportPath, "utf8");
  expectedReviewedIds = result.reviewedExceptionIds;
}, 120_000);

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
      repositoryRoot: resolve("."),
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
      reviewedIdsFromReport(reportPath, { repositoryRoot: resolve(".") }),
    ).toThrow(/review binding/i);
  });

  it("does not overwrite a release report changed during validation", async () => {
    const reportPath = writeTemporaryReport(legacyReportText);
    await expect(
      reviewEasyExpansionTranslationExceptions(
        { repositoryRoot: resolve("."), reportPath },
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
    writeFileSync(
      generatedPath,
      Buffer.concat([readFileSync(generatedPath), Buffer.from("\n")]),
    );
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
