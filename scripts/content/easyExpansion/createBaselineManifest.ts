import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { parsePackCsv, type ParsedCsvRow } from '../../../src/main/content/csvPacks';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import {
  parseEvidenceJsonl,
  serializeEvidence,
  type ContentEvidence,
} from '../evidence';
import {
  acceptedBatchPaths,
  FINAL_BATCH,
  PRODUCTION_BATCHES,
  type ProductionBatchDefinition,
} from '../productionBatches';

export const EASY_EXPANSION_BASELINE_SOURCE_COMMIT =
  '5323a546f4d03460dae7c934703dbcfd8468031f';
export const EASY_EXPANSION_BASELINE_MANIFEST_PATH =
  'content/reports/easy-expansion-baseline-record-hashes.json';

const BASELINE_RECORD_COUNT = 7_174;
const BASELINE_ARTIFACT_COUNT = 63;
const BASELINE_RECORD_DOMAIN = 'quiz-stage/easy-expansion-baseline-record/v1';
const MAX_GIT_BLOB_BYTES = 64 * 1024 * 1024;
const DEFAULT_REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

const BASELINE_BATCHES: readonly ProductionBatchDefinition[] = Object.freeze(
  [...PRODUCTION_BATCHES, FINAL_BATCH]
    .sort((left, right) => compareCodeUnits(left.id, right.id)),
);
const BASELINE_BATCH_IDS = new Set(BASELINE_BATCHES.map(({ id }) => id));

export const EASY_EXPANSION_BASELINE_ARTIFACT_PATHS: readonly string[] = Object.freeze([
  ...BASELINE_BATCHES.flatMap(({ id }) => {
    const paths = acceptedBatchPaths(id);
    return [paths.authored, paths.generated, paths.evidence, paths.report];
  }),
  'content/reports/release-inventory.json',
  'content/reports/source-check-cache.json',
  'resources/content/seed.sqlite',
].sort(compareCodeUnits));

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u, 'Expected a lowercase SHA-256 digest');
const recordSchema = z.object({
  clueId: z.string().trim().min(1),
  batchId: z.string().refine((value) => BASELINE_BATCH_IDS.has(value), 'Unknown baseline batch ID'),
  sha256: sha256Schema,
}).strict();
const artifactSchema = z.object({
  path: z.string().trim().min(1),
  sha256: sha256Schema,
}).strict();

const manifestSchema = z.object({
  version: z.literal(1),
  sourceCommit: z.literal(EASY_EXPANSION_BASELINE_SOURCE_COMMIT),
  hashAlgorithm: z.literal('sha256'),
  artifactHashBasis: z.literal('git-blob-bytes'),
  recordCount: z.number().int().nonnegative(),
  records: z.array(recordSchema),
  artifacts: z.array(artifactSchema),
}).strict().superRefine((manifest, context) => {
  if (manifest.recordCount !== BASELINE_RECORD_COUNT
    || manifest.records.length !== BASELINE_RECORD_COUNT
    || manifest.recordCount !== manifest.records.length) {
    context.addIssue({
      code: 'custom',
      path: ['recordCount'],
      message: `Baseline manifest record count must be ${BASELINE_RECORD_COUNT}`,
    });
  }

  const clueIds = manifest.records.map(({ clueId }) => clueId);
  if (new Set(clueIds).size !== clueIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['records'],
      message: 'Baseline manifest contains duplicate clue IDs',
    });
  }
  if (clueIds.some((clueId, index) => index > 0
    && compareCodeUnits(clueIds[index - 1], clueId) >= 0)) {
    context.addIssue({
      code: 'custom',
      path: ['records'],
      message: 'Baseline manifest records must be strictly sorted by clue ID',
    });
  }

  const artifactPaths = manifest.artifacts.map(({ path }) => path);
  if (new Set(artifactPaths).size !== artifactPaths.length) {
    context.addIssue({
      code: 'custom',
      path: ['artifacts'],
      message: 'Baseline manifest contains duplicate artifact paths',
    });
  }
  if (manifest.artifacts.length !== BASELINE_ARTIFACT_COUNT
    || artifactPaths.some((path, index) => path !== EASY_EXPANSION_BASELINE_ARTIFACT_PATHS[index])) {
    context.addIssue({
      code: 'custom',
      path: ['artifacts'],
      message: `Baseline artifact paths must be the exact ${BASELINE_ARTIFACT_COUNT} sorted paths`,
    });
  }
});

export type EasyExpansionBaselineManifest = z.infer<typeof manifestSchema>;

export type EasyExpansionBaselineRecordInput = Readonly<{
  batchId: string;
  clueId: string;
  authoredFields: readonly string[];
  generatedFields: readonly string[];
  evidence: ContentEvidence;
}>;

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashEasyExpansionBaselineRecord(input: EasyExpansionBaselineRecordInput): string {
  if (input.authoredFields.length !== CSV_COLUMNS.length) {
    throw new Error(`Expected ${CSV_COLUMNS.length} authored fields`);
  }
  if (input.generatedFields.length !== CSV_COLUMNS.length) {
    throw new Error(`Expected ${CSV_COLUMNS.length} generated fields`);
  }

  return sha256(JSON.stringify({
    domain: BASELINE_RECORD_DOMAIN,
    batchId: input.batchId,
    clueId: input.clueId,
    authored: input.authoredFields,
    generated: input.generatedFields,
    evidence: serializeEvidence([input.evidence]),
  }));
}

function indexRows(
  batchId: string,
  kind: 'authored' | 'generated',
  rows: readonly ParsedCsvRow[],
): ReadonlyMap<string, ParsedCsvRow> {
  const indexed = new Map<string, ParsedCsvRow>();
  for (const row of rows) {
    if (indexed.has(row.clue_id)) {
      throw new Error(`Duplicate ${kind} clue ID in ${batchId}: ${row.clue_id}`);
    }
    indexed.set(row.clue_id, row);
  }
  return indexed;
}

function gitBlob(repositoryRoot: string, sourceCommit: string, path: string): Buffer {
  return Buffer.from(execFileSync(
    'git',
    ['cat-file', 'blob', `${sourceCommit}:${path}`],
    {
      cwd: repositoryRoot,
      maxBuffer: MAX_GIT_BLOB_BYTES,
      windowsHide: true,
    },
  ));
}

function logicalFields(row: ParsedCsvRow): readonly string[] {
  return CSV_COLUMNS.map((column) => row[column]);
}

export function validateEasyExpansionBaselineManifest(value: unknown): EasyExpansionBaselineManifest {
  return manifestSchema.parse(value);
}

export function parseEasyExpansionBaselineManifest(text: string): EasyExpansionBaselineManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Malformed baseline manifest JSON');
  }
  return validateEasyExpansionBaselineManifest(parsed);
}

export function serializeEasyExpansionBaselineManifest(
  manifest: EasyExpansionBaselineManifest,
): string {
  return `${JSON.stringify(validateEasyExpansionBaselineManifest(manifest), null, 2)}\n`;
}

export function buildEasyExpansionBaselineManifest(
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
): EasyExpansionBaselineManifest {
  const blobs = new Map<string, Buffer>();
  const readBlob = (path: string): Buffer => {
    const existing = blobs.get(path);
    if (existing !== undefined) return existing;
    const value = gitBlob(repositoryRoot, EASY_EXPANSION_BASELINE_SOURCE_COMMIT, path);
    blobs.set(path, value);
    return value;
  };
  const records: Array<z.infer<typeof recordSchema>> = [];

  for (const batch of BASELINE_BATCHES) {
    const paths = acceptedBatchPaths(batch.id);
    const authored = indexRows(
      batch.id,
      'authored',
      parsePackCsv(readBlob(paths.authored).toString('utf8')).rows,
    );
    const generated = indexRows(
      batch.id,
      'generated',
      parsePackCsv(readBlob(paths.generated).toString('utf8')).rows,
    );
    const evidence = parseEvidenceJsonl(readBlob(paths.evidence).toString('utf8'), paths.evidence);

    const clueIds = [...authored.keys()].sort(compareCodeUnits);
    if (authored.size !== generated.size || authored.size !== evidence.size) {
      throw new Error(`Baseline record counts do not match for ${batch.id}`);
    }
    for (const clueId of clueIds) {
      const authoredRow = authored.get(clueId);
      const generatedRow = generated.get(clueId);
      const evidenceRecord = evidence.get(clueId);
      if (authoredRow === undefined || generatedRow === undefined || evidenceRecord === undefined) {
        throw new Error(`Baseline record inputs do not match for ${batch.id}:${clueId}`);
      }
      if (evidenceRecord.batchId !== batch.id || evidenceRecord.clueId !== clueId) {
        throw new Error(`Baseline evidence identity does not match for ${batch.id}:${clueId}`);
      }
      records.push({
        clueId,
        batchId: batch.id,
        sha256: hashEasyExpansionBaselineRecord({
          batchId: batch.id,
          clueId,
          authoredFields: logicalFields(authoredRow),
          generatedFields: logicalFields(generatedRow),
          evidence: evidenceRecord,
        }),
      });
    }
  }

  records.sort((left, right) => compareCodeUnits(left.clueId, right.clueId));
  const artifacts = EASY_EXPANSION_BASELINE_ARTIFACT_PATHS.map((path) => ({
    path,
    sha256: sha256(readBlob(path)),
  }));

  return validateEasyExpansionBaselineManifest({
    version: 1,
    sourceCommit: EASY_EXPANSION_BASELINE_SOURCE_COMMIT,
    hashAlgorithm: 'sha256',
    artifactHashBasis: 'git-blob-bytes',
    recordCount: records.length,
    records,
    artifacts,
  });
}

export function writeEasyExpansionBaselineManifest(
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
): string {
  const outputPath = resolve(repositoryRoot, EASY_EXPANSION_BASELINE_MANIFEST_PATH);
  writeFileSync(
    outputPath,
    serializeEasyExpansionBaselineManifest(buildEasyExpansionBaselineManifest(repositoryRoot)),
    'utf8',
  );
  return outputPath;
}

if (process.argv[1] !== undefined
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(`Wrote ${writeEasyExpansionBaselineManifest()}\n`);
}
