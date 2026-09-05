import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildEasyExpansionBaselineManifest,
  EASY_EXPANSION_BASELINE_SOURCE_COMMIT,
  hashEasyExpansionBaselineRecord,
  parseEasyExpansionBaselineManifest,
  serializeEasyExpansionBaselineManifest,
  type EasyExpansionBaselineManifest,
  type EasyExpansionBaselineRecordInput,
} from '../../../scripts/content/easyExpansion/createBaselineManifest';
import { type ContentEvidence } from '../../../scripts/content/evidence';
import { parsePackCsv } from '../../../src/main/content/csvPacks';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';

const EXPECTED_BATCH_IDS = [
  '01-history',
  '02-geography',
  '03-science-nature',
  '04-literature-language',
  '05-art-architecture',
  '06-music',
  '07-film-television',
  '08-sports-games',
  '09-food-drink',
  '10-technology-inventions',
  '11-politics-economics-society',
  '12-mythology-religion-philosophy',
  '13-finals',
  '14-adult',
  '15-estonia',
] as const;

const EXPECTED_ARTIFACT_PATHS = [
  ...EXPECTED_BATCH_IDS.flatMap((batchId) => [
    `content/authored/${batchId}.csv`,
    `content/evidence/${batchId}.jsonl`,
    `content/generated/${batchId}.en-et.csv`,
    `content/reports/${batchId}.json`,
  ]),
  'content/reports/release-inventory.json',
  'content/reports/source-check-cache.json',
  'resources/content/seed.sqlite',
].sort();

const validEvidence: ContentEvidence = {
  version: 1,
  clueId: 'clue-100',
  batchId: '01-history',
  factKey: 'history:fact-100',
  subjectKey: 'history:subject-100',
  assertion: 'A stable factual assertion.',
  origin: 'compatibleOpen',
  authoring: {
    author: 'Ada Author',
    authoredAt: '2026-09-05T08:00:00Z',
  },
  supportingSource: {
    sourceId: 'source:100',
    title: 'Direct source',
    url: 'https://example.com/source/100',
    license: 'Compatible open source',
    retrievedAt: '2026-09-05',
  },
  inspiration: null,
  factualReview: {
    reviewer: 'Fran Fact',
    reviewedAt: '2026-09-05T09:00:00Z',
    decision: 'approved',
  },
  editorialReview: {
    reviewer: 'Ed Editor',
    reviewedAt: '2026-09-05T10:00:00Z',
    decision: 'approved',
  },
  translationReview: {
    reviewer: 'Tiina Translator',
    reviewedAt: '2026-09-05T11:00:00Z',
    decision: 'approved',
  },
  adultPolicyReview: null,
};

function recordInput(): EasyExpansionBaselineRecordInput {
  return {
    batchId: '01-history',
    clueId: 'clue-100',
    authoredFields: CSV_COLUMNS.map((column) => `authored:${column}`),
    generatedFields: CSV_COLUMNS.map((column) => `generated:${column}`),
    evidence: validEvidence,
  };
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

type MutableManifest = {
  recordCount: number;
  records: Array<Record<string, unknown>>;
  artifacts: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

function mutableCopy(manifest: EasyExpansionBaselineManifest): MutableManifest {
  return JSON.parse(serializeEasyExpansionBaselineManifest(manifest)) as MutableManifest;
}

describe('Easy expansion baseline record hash', () => {
  it('uses the stable versioned record-hash contract', () => {
    expect(hashEasyExpansionBaselineRecord(recordInput()))
      .toBe('e6424de639ae8a05668a1820785602df3e5f1467027f145e095b32f5311454bc');
  });

  it.each([
    ['batch ID', (input: EasyExpansionBaselineRecordInput) => ({ ...input, batchId: '02-geography' })],
    ['clue ID', (input: EasyExpansionBaselineRecordInput) => ({ ...input, clueId: 'clue-101' })],
    ['authored field', (input: EasyExpansionBaselineRecordInput) => ({
      ...input,
      authoredFields: input.authoredFields.map((value, index) => index === 11 ? `${value}:changed` : value),
    })],
    ['generated field', (input: EasyExpansionBaselineRecordInput) => ({
      ...input,
      generatedFields: input.generatedFields.map((value, index) => index === 11 ? `${value}:changed` : value),
    })],
    ['nested evidence', (input: EasyExpansionBaselineRecordInput) => ({
      ...input,
      evidence: {
        ...input.evidence,
        supportingSource: { ...input.evidence.supportingSource, title: 'Changed direct source' },
      },
    })],
  ] as const)('changes when the %s changes', (_name, mutate) => {
    const input = recordInput();
    expect(hashEasyExpansionBaselineRecord(mutate(input)))
      .not.toBe(hashEasyExpansionBaselineRecord(input));
  });

  it('rejects a record that does not supply all 25 CSV fields', () => {
    const input = recordInput();
    expect(() => hashEasyExpansionBaselineRecord({
      ...input,
      authoredFields: input.authoredFields.slice(1),
    })).toThrow(/25 authored fields/i);
    expect(() => hashEasyExpansionBaselineRecord({
      ...input,
      generatedFields: input.generatedFields.slice(1),
    })).toThrow(/25 generated fields/i);
  });

  it('is invariant to CSV record line endings after logical parsing', () => {
    const values = CSV_COLUMNS.map((column) => column === 'clue_id' ? 'clue-100' : `value-${column}`);
    const parseFields = (lineEnding: '\n' | '\r\n') => {
      const row = parsePackCsv([
        CSV_COLUMNS.join(','),
        values.join(','),
        '',
      ].join(lineEnding)).rows[0];
      return CSV_COLUMNS.map((column) => row[column]);
    };

    const input = recordInput();
    expect(hashEasyExpansionBaselineRecord({
      ...input,
      authoredFields: parseFields('\n'),
    })).toBe(hashEasyExpansionBaselineRecord({
      ...input,
      authoredFields: parseFields('\r\n'),
    }));
  });
});

describe('Easy expansion baseline manifest', () => {
  let manifest: EasyExpansionBaselineManifest;

  beforeAll(() => {
    manifest = buildEasyExpansionBaselineManifest();
  }, 60_000);

  it('binds all 7,174 accepted records in strict clue-ID order', () => {
    expect(manifest.sourceCommit).toBe('5323a546f4d03460dae7c934703dbcfd8468031f');
    expect(manifest.sourceCommit).toBe(EASY_EXPANSION_BASELINE_SOURCE_COMMIT);
    expect(manifest.recordCount).toBe(7_174);
    expect(manifest.records).toHaveLength(7_174);
    expect(manifest.records.map(({ clueId }) => clueId))
      .toEqual(manifest.records.map(({ clueId }) => clueId).sort(compareCodeUnits));
    expect(new Set(manifest.records.map(({ clueId }) => clueId)).size).toBe(7_174);
    expect(new Set(manifest.records.map(({ sha256 }) => sha256)).size).toBe(7_174);
    expect(manifest.records.every(({ sha256 }) => /^[0-9a-f]{64}$/u.test(sha256))).toBe(true);
  });

  it('assigns every accepted record to its sealed production batch', () => {
    const counts = Object.fromEntries(EXPECTED_BATCH_IDS.map((batchId) => [
      batchId,
      manifest.records.filter((record) => record.batchId === batchId).length,
    ]));

    expect(counts).toEqual({
      '01-history': 500,
      '02-geography': 500,
      '03-science-nature': 500,
      '04-literature-language': 500,
      '05-art-architecture': 500,
      '06-music': 500,
      '07-film-television': 500,
      '08-sports-games': 500,
      '09-food-drink': 500,
      '10-technology-inventions': 500,
      '11-politics-economics-society': 500,
      '12-mythology-religion-philosophy': 500,
      '13-finals': 174,
      '14-adult': 500,
      '15-estonia': 500,
    });
  });

  it('hashes the exact 63 accepted artifacts from Git blob bytes', () => {
    expect(manifest.hashAlgorithm).toBe('sha256');
    expect(manifest.artifactHashBasis).toBe('git-blob-bytes');
    expect(manifest.artifacts.map(({ path }) => path)).toEqual(EXPECTED_ARTIFACT_PATHS);
    expect(new Set(manifest.artifacts.map(({ path }) => path)).size).toBe(63);

    const hashes = new Map(manifest.artifacts.map(({ path, sha256 }) => [path, sha256]));
    expect(hashes.get('content/reports/release-inventory.json'))
      .toBe('96cff31db0d7ce9eeb6ae3f77f695901429524c9e871d90d62de5c9d0df301de');
    expect(hashes.get('content/reports/source-check-cache.json'))
      .toBe('49980400bb018c38fa9ecc506545c434070e9f2836a43cb36e68180186b1209a');
    expect(hashes.get('resources/content/seed.sqlite'))
      .toBe('0a94337640f8a4f1a063193717947b584ef29ed57304da1e94294babafd9daa3');
  });

  it('matches the committed deterministic manifest byte for byte', () => {
    const committed = readFileSync(resolve(
      'content/reports/easy-expansion-baseline-record-hashes.json',
    ), 'utf8');

    expect(committed).toBe(serializeEasyExpansionBaselineManifest(manifest));
    expect(parseEasyExpansionBaselineManifest(committed)).toEqual(manifest);
    expect(committed.endsWith('\n')).toBe(true);
    expect(Object.keys(manifest)).toEqual([
      'version',
      'sourceCommit',
      'hashAlgorithm',
      'artifactHashBasis',
      'recordCount',
      'records',
      'artifacts',
    ]);
  });

  it('rejects malformed JSON and extra top-level or nested keys', () => {
    expect(() => parseEasyExpansionBaselineManifest('{'))
      .toThrow(/malformed baseline manifest/i);

    const extraTopLevel = mutableCopy(manifest);
    extraTopLevel.timestamp = '2026-09-05T12:00:00Z';
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(extraTopLevel))).toThrow();

    const extraRecordKey = mutableCopy(manifest);
    extraRecordKey.records[0].unexpected = true;
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(extraRecordKey))).toThrow();

    const extraArtifactKey = mutableCopy(manifest);
    extraArtifactKey.artifacts[0].unexpected = true;
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(extraArtifactKey))).toThrow();
  });

  it('rejects a wrong source commit, bad SHA, or count mismatch', () => {
    const wrongCommit = mutableCopy(manifest);
    wrongCommit.sourceCommit = '0000000000000000000000000000000000000000';
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(wrongCommit))).toThrow();

    const badSha = mutableCopy(manifest);
    badSha.records[0].sha256 = 'not-a-sha';
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(badSha))).toThrow();

    const badCount = mutableCopy(manifest);
    badCount.recordCount -= 1;
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(badCount))).toThrow(/record count/i);
  });

  it('rejects unsorted or duplicate records', () => {
    const unsorted = mutableCopy(manifest);
    [unsorted.records[0], unsorted.records[1]] = [unsorted.records[1], unsorted.records[0]];
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(unsorted))).toThrow(/sorted/i);

    const duplicate = mutableCopy(manifest);
    duplicate.records[1] = { ...duplicate.records[0] };
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(duplicate))).toThrow(/duplicate/i);
  });

  it('rejects unsorted, duplicate, missing, or unknown artifact paths', () => {
    const unsorted = mutableCopy(manifest);
    [unsorted.artifacts[0], unsorted.artifacts[1]] = [unsorted.artifacts[1], unsorted.artifacts[0]];
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(unsorted))).toThrow(/artifact paths/i);

    const duplicate = mutableCopy(manifest);
    duplicate.artifacts[1] = { ...duplicate.artifacts[0] };
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(duplicate))).toThrow(/duplicate/i);

    const missing = mutableCopy(manifest);
    missing.artifacts.pop();
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(missing))).toThrow(/63 items|artifact paths/i);

    const unknown = mutableCopy(manifest);
    unknown.artifacts[0].path = 'content/reports/not-a-baseline-artifact.json';
    expect(() => parseEasyExpansionBaselineManifest(JSON.stringify(unknown))).toThrow(/artifact paths/i);
  });
});
