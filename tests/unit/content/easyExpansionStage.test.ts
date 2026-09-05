import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  parseEasyExpansionArgs,
  stageEasyExpansion,
  type StageEasyExpansionDependencies,
} from '../../../scripts/content/applyEasyExpansion';
import {
  serializeEasyExpansionRows,
  type ApplyEasyExpansionInput,
  type ApplyEasyExpansionResult,
  type EasyExpansionCsvRow,
} from '../../../scripts/content/easyExpansion/apply';
import type { EasyExpansionBaselineManifest } from '../../../scripts/content/easyExpansion/createBaselineManifest';
import type { EasyExpansionCategory } from '../../../scripts/content/easyExpansion/types';
import { serializeEvidence, type ContentEvidence } from '../../../scripts/content/evidence';
import {
  acceptedBatchPaths,
  FINAL_BATCH,
  getProductionBatch,
  PRODUCTION_BATCHES,
  type ProductionBatchDefinition,
} from '../../../scripts/content/productionBatches';
import { CSV_COLUMNS, type CsvColumn } from '../../../src/shared/content/csvColumns';

const TARGET_BATCH = getProductionBatch('01-history');
const ALL_BATCHES = [...PRODUCTION_BATCHES, FINAL_BATCH] as const;
const temporaryDirectories: string[] = [];

type Fixture = Readonly<{
  acceptedRoot: string;
  outputRoot: string;
  baseline: EasyExpansionBaselineManifest;
  categories: readonly EasyExpansionCategory[];
  corpus: readonly EasyExpansionCategory[];
  projected: ApplyEasyExpansionResult;
  acceptedPaths: readonly string[];
}>;

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-easy-expansion-stage-'));
  temporaryDirectories.push(directory);
  return directory;
}

function row(batch: ProductionBatchDefinition, clueId = `${batch.id}-fixture`): EasyExpansionCsvRow {
  const values: Record<CsvColumn, string> = {
    clue_id: clueId,
    pack_id: batch.packId,
    pack_name: batch.packName,
    category_set_id: `${batch.packId}-set-fixture`,
    content_kind: batch.id === FINAL_BATCH.id ? 'final' : 'board',
    round: batch.id === FINAL_BATCH.id ? 'final' : 'round-one',
    tier: '1',
    difficulty: 'easy',
    macro_topic: batch.topicFamily,
    category_name_en: `Fixture ${batch.id}`,
    category_name_et: `Test ${batch.id}`,
    clue_en: `English clue for ${batch.id}`,
    clue_et: `Estonian clue for ${batch.id}`,
    response_en: `English response ${batch.id}`,
    response_et: `Estonian response ${batch.id}`,
    accepted_variants_en: '',
    accepted_variants_et: '',
    explanation_en: `English explanation for ${batch.id}`,
    explanation_et: `Estonian explanation for ${batch.id}`,
    source_title: `Fixture source ${batch.id}`,
    source_url: `https://example.com/${batch.id}`,
    source_license: 'CC-BY-4.0',
    source_retrieved_at: '2026-09-06',
    translation_status: 'reviewed',
    enabled: 'true',
  };
  return Object.freeze(Object.fromEntries(
    CSV_COLUMNS.map((column) => [column, values[column]]),
  ) as Record<CsvColumn, string>);
}

function evidence(batch: ProductionBatchDefinition, clueId = `${batch.id}-fixture`): ContentEvidence {
  return {
    version: 1,
    clueId,
    batchId: batch.id,
    factKey: `fixture:${batch.id}:${clueId}`,
    subjectKey: `fixture:${batch.id}`,
    assertion: `Fixture assertion for ${batch.id}`,
    origin: 'compatibleOpen',
    authoring: { author: 'Fixture Author', authoredAt: '2026-09-06T08:00:00.000Z' },
    supportingSource: {
      sourceId: `fixture-source-${batch.id}`,
      title: `Fixture source ${batch.id}`,
      url: `https://example.com/${batch.id}`,
      license: 'CC-BY-4.0',
      retrievedAt: '2026-09-06',
    },
    inspiration: null,
    factualReview: {
      reviewer: 'Fixture Factual Reviewer',
      reviewedAt: '2026-09-06T09:00:00.000Z',
      decision: 'approved',
    },
    editorialReview: {
      reviewer: 'Fixture Editorial Reviewer',
      reviewedAt: '2026-09-06T10:00:00.000Z',
      decision: 'approved',
    },
    translationReview: {
      reviewer: 'Fixture Translation Reviewer',
      reviewedAt: '2026-09-06T11:00:00.000Z',
      decision: 'approved',
    },
    adultPolicyReview: null,
  };
}

function stagingFixture(): Fixture {
  const root = temporaryDirectory();
  const acceptedRoot = resolve(root, 'accepted');
  const outputRoot = resolve(root, 'stage');
  const acceptedPaths: string[] = [];

  for (const batch of ALL_BATCHES) {
    const paths = acceptedBatchPaths(batch.id);
    const generatedPath = resolve(acceptedRoot, paths.generated);
    const evidencePath = resolve(acceptedRoot, paths.evidence);
    mkdirSync(resolve(generatedPath, '..'), { recursive: true });
    mkdirSync(resolve(evidencePath, '..'), { recursive: true });
    writeFileSync(generatedPath, serializeEasyExpansionRows([row(batch)]));
    writeFileSync(evidencePath, serializeEvidence([evidence(batch)]));
    acceptedPaths.push(generatedPath, evidencePath);
  }

  const targetPaths = acceptedBatchPaths(TARGET_BATCH.id);
  const authoredPath = resolve(acceptedRoot, targetPaths.authored);
  mkdirSync(resolve(authoredPath, '..'), { recursive: true });
  writeFileSync(authoredPath, serializeEasyExpansionRows([row(TARGET_BATCH)]));
  acceptedPaths.push(authoredPath);

  const manifestPath = resolve(
    acceptedRoot,
    'content/reports/easy-expansion-baseline-record-hashes.json',
  );
  mkdirSync(resolve(manifestPath, '..'), { recursive: true });
  writeFileSync(manifestPath, '{"fixture":true}\n');
  acceptedPaths.push(manifestPath);

  const projectedRow = row(TARGET_BATCH, 'built-in-history-easy-expansion-001');
  const projectedEvidence = evidence(
    TARGET_BATCH,
    'built-in-history-easy-expansion-001',
  );
  return {
    acceptedRoot,
    outputRoot,
    baseline: { fixture: true } as unknown as EasyExpansionBaselineManifest,
    categories: Object.freeze([]),
    corpus: Object.freeze([]),
    projected: Object.freeze({
      authoredRows: Object.freeze([projectedRow]),
      generatedRows: Object.freeze([projectedRow]),
      evidence: Object.freeze([projectedEvidence]),
      expansionClueIds: Object.freeze([projectedRow.clue_id]),
      expansionCategorySetIds: Object.freeze([projectedRow.category_set_id]),
    }),
    acceptedPaths,
  };
}

function dependencies(
  fixture: Fixture,
  overrides: Partial<StageEasyExpansionDependencies> = {},
): StageEasyExpansionDependencies {
  return {
    apply: () => fixture.projected,
    getBank: () => fixture.categories,
    buildCorpus: () => fixture.corpus,
    parseBaseline: () => fixture.baseline,
    ...overrides,
  };
}

function snapshot(paths: readonly string[]): ReadonlyMap<string, string> {
  return new Map(paths.map((path) => [path, readFileSync(path, 'utf8')]));
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('parseEasyExpansionArgs', () => {
  it('requires one supported original pack and defaults the staging root', () => {
    expect(parseEasyExpansionArgs(['--batch', '01-history'])).toEqual({
      batchId: '01-history',
      outputRoot: 'content/work/easy-expansion',
    });
    expect(() => parseEasyExpansionArgs([])).toThrowError('--batch is required');
    expect(() => parseEasyExpansionArgs(['--batch'])).toThrowError('--batch requires a value');
  });

  it('accepts an explicit output root in either argument order', () => {
    expect(parseEasyExpansionArgs([
      '--output-root', 'custom-stage', '--batch', '12-mythology-religion-philosophy',
    ])).toEqual({
      batchId: '12-mythology-religion-philosophy',
      outputRoot: 'custom-stage',
    });
  });

  it.each(['13-finals', '14-adult', '15-estonia'])('rejects unsupported batch %s', (batchId) => {
    expect(() => parseEasyExpansionArgs(['--batch', batchId])).toThrowError(
      `Easy expansion is limited to original packs 01-12: ${batchId}`,
    );
  });

  it('rejects publishing, unknown flags, duplicates, and missing values', () => {
    expect(() => parseEasyExpansionArgs(['--batch', '01-history', '--publish']))
      .toThrowError('Unknown argument: --publish');
    expect(() => parseEasyExpansionArgs(['--batch', '01-history', '--wat']))
      .toThrowError('Unknown argument: --wat');
    expect(() => parseEasyExpansionArgs(['--batch', '01-history', '--batch', '02-geography']))
      .toThrowError('Duplicate argument: --batch');
    expect(() => parseEasyExpansionArgs([
      '--batch', '01-history', '--output-root', 'first', '--output-root', 'second',
    ])).toThrowError('Duplicate argument: --output-root');
    expect(() => parseEasyExpansionArgs(['--batch', '01-history', '--output-root']))
      .toThrowError('--output-root requires a path');
    expect(() => parseEasyExpansionArgs(['--batch', '--output-root', 'stage']))
      .toThrowError('--batch requires a value');
  });
});

describe('stageEasyExpansion', () => {
  it('loads the selected accepted pack and complete collision corpus, then stages exactly three files', () => {
    const fixture = stagingFixture();
    const before = snapshot(fixture.acceptedPaths);
    const apply = vi.fn((input: ApplyEasyExpansionInput) => {
      void input;
      return fixture.projected;
    });

    const result = stageEasyExpansion({
      batchId: TARGET_BATCH.id,
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
      dependencies: dependencies(fixture, { apply }),
    });

    expect(apply).toHaveBeenCalledOnce();
    const input = apply.mock.calls[0]![0];
    expect(input.batchId).toBe(TARGET_BATCH.id);
    expect(input.authoredRows.map(({ clue_id }) => clue_id)).toEqual(['01-history-fixture']);
    expect(input.generatedRows.map(({ clue_id }) => clue_id)).toEqual(['01-history-fixture']);
    expect(input.evidence.map(({ clueId }) => clueId)).toEqual(['01-history-fixture']);
    expect(input.baseline).toBe(fixture.baseline);
    expect(input.categories).toBe(fixture.categories);
    expect(input.collisionCorpus.phaseB).toBe(fixture.corpus);
    expect(input.collisionCorpus.rows).toHaveLength(ALL_BATCHES.length);
    expect(input.collisionCorpus.evidence).toHaveLength(ALL_BATCHES.length);
    expect(input.collisionCorpus.rows.map(({ clue_id }) => clue_id)).toContain('13-finals-fixture');
    expect(input.collisionCorpus.rows.map(({ clue_id }) => clue_id)).toContain('14-adult-fixture');
    expect(input.collisionCorpus.rows.map(({ clue_id }) => clue_id)).toContain('15-estonia-fixture');

    const batchDirectory = resolve(fixture.outputRoot, TARGET_BATCH.id);
    const artifactPaths = [
      resolve(batchDirectory, 'authored.csv'),
      resolve(batchDirectory, 'generated.en-et.csv'),
      resolve(batchDirectory, 'evidence.jsonl'),
    ];
    expect(result.artifactPaths).toEqual(artifactPaths);
    expect(result.expansionClueIds).toEqual(fixture.projected.expansionClueIds);
    expect(result.expansionCategorySetIds).toEqual(fixture.projected.expansionCategorySetIds);
    expect(readdirSync(fixture.outputRoot)).toEqual([TARGET_BATCH.id]);
    expect(readdirSync(batchDirectory).sort()).toEqual([
      'authored.csv', 'evidence.jsonl', 'generated.en-et.csv',
    ]);
    expect(readFileSync(artifactPaths[0]!, 'utf8')).toBe(
      serializeEasyExpansionRows(fixture.projected.authoredRows),
    );
    expect(readFileSync(artifactPaths[1]!, 'utf8')).toBe(
      serializeEasyExpansionRows(fixture.projected.generatedRows),
    );
    expect(readFileSync(artifactPaths[2]!, 'utf8')).toBe(
      serializeEvidence(fixture.projected.evidence),
    );
    expect(snapshot(fixture.acceptedPaths)).toEqual(before);
  });

  it('calculates and validates the complete triple before making any staging write', () => {
    const fixture = stagingFixture();
    const before = snapshot(fixture.acceptedPaths);
    const mismatchedEvidence = evidence(TARGET_BATCH, 'different-clue-id');

    expect(() => stageEasyExpansion({
      batchId: TARGET_BATCH.id,
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
      dependencies: dependencies(fixture, {
        apply: () => ({ ...fixture.projected, evidence: [mismatchedEvidence] }),
      }),
    })).toThrowError('Staged evidence inventory differs for 01-history');

    expect(existsSync(resolve(fixture.outputRoot, TARGET_BATCH.id))).toBe(false);
    expect(snapshot(fixture.acceptedPaths)).toEqual(before);
  });

  it('does not write either earlier artifact when the final serialization fails', () => {
    const fixture = stagingFixture();
    const serializeEvidenceRecords = vi.fn(() => {
      throw new Error('evidence serialization failed');
    });

    expect(() => stageEasyExpansion({
      batchId: TARGET_BATCH.id,
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
      dependencies: dependencies(fixture, { serializeEvidenceRecords }),
    })).toThrowError('evidence serialization failed');
    expect(serializeEvidenceRecords).toHaveBeenCalledOnce();
    expect(existsSync(resolve(fixture.outputRoot, TARGET_BATCH.id))).toBe(false);
  });

  it('rejects a junction alias into accepted content before loading or writing', () => {
    const fixture = stagingFixture();
    const aliasRoot = resolve(temporaryDirectory(), 'accepted-authored-alias');
    const before = snapshot(fixture.acceptedPaths);
    const apply = vi.fn((input: ApplyEasyExpansionInput) => {
      void input;
      return fixture.projected;
    });
    symlinkSync(resolve(fixture.acceptedRoot, 'content/authored'), aliasRoot, 'junction');

    try {
      expect(() => stageEasyExpansion({
        batchId: TARGET_BATCH.id,
        acceptedRoot: fixture.acceptedRoot,
        outputRoot: aliasRoot,
        dependencies: dependencies(fixture, { apply }),
      })).toThrowError(/overlaps accepted destination/u);
    } finally {
      unlinkSync(aliasRoot);
    }

    expect(apply).not.toHaveBeenCalled();
    expect(snapshot(fixture.acceptedPaths)).toEqual(before);
  });

  it('rejects a pre-existing batch junction that escapes the physical output root', () => {
    const fixture = stagingFixture();
    const outside = temporaryDirectory();
    const batchDirectory = resolve(fixture.outputRoot, TARGET_BATCH.id);
    mkdirSync(fixture.outputRoot, { recursive: true });
    symlinkSync(outside, batchDirectory, 'junction');

    try {
      expect(() => stageEasyExpansion({
        batchId: TARGET_BATCH.id,
        acceptedRoot: fixture.acceptedRoot,
        outputRoot: fixture.outputRoot,
        dependencies: dependencies(fixture),
      })).toThrowError(/escapes the physical output root/u);
      expect(readdirSync(outside)).toEqual([]);
    } finally {
      unlinkSync(batchDirectory);
    }
  });

  it('revalidates boundaries after a serializer swaps the batch directory to accepted content', () => {
    const fixture = stagingFixture();
    const batchDirectory = resolve(fixture.outputRoot, TARGET_BATCH.id);
    const acceptedAuthored = resolve(fixture.acceptedRoot, 'content/authored');
    const before = snapshot(fixture.acceptedPaths);
    const serializeEvidenceRecords = vi.fn((records: readonly ContentEvidence[]) => {
      mkdirSync(fixture.outputRoot, { recursive: true });
      symlinkSync(acceptedAuthored, batchDirectory, 'junction');
      return serializeEvidence(records);
    });

    try {
      expect(() => stageEasyExpansion({
        batchId: TARGET_BATCH.id,
        acceptedRoot: fixture.acceptedRoot,
        outputRoot: fixture.outputRoot,
        dependencies: dependencies(fixture, { serializeEvidenceRecords }),
      })).toThrowError(/overlaps accepted destination/u);
    } finally {
      if (existsSync(batchDirectory)) unlinkSync(batchDirectory);
    }

    expect(serializeEvidenceRecords).toHaveBeenCalledOnce();
    expect(snapshot(fixture.acceptedPaths)).toEqual(before);
    expect(existsSync(resolve(acceptedAuthored, 'authored.csv'))).toBe(false);
    expect(existsSync(resolve(acceptedAuthored, 'generated.en-et.csv'))).toBe(false);
    expect(existsSync(resolve(acceptedAuthored, 'evidence.jsonl'))).toBe(false);
  });

  it('rejects a Windows hard-linked staged artifact before any accepted byte changes', () => {
    const fixture = stagingFixture();
    const batchDirectory = resolve(fixture.outputRoot, TARGET_BATCH.id);
    const acceptedAuthored = resolve(
      fixture.acceptedRoot,
      acceptedBatchPaths(TARGET_BATCH.id).authored,
    );
    const before = snapshot(fixture.acceptedPaths);
    mkdirSync(batchDirectory, { recursive: true });
    linkSync(acceptedAuthored, resolve(batchDirectory, 'authored.csv'));

    expect(() => stageEasyExpansion({
      batchId: TARGET_BATCH.id,
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
      dependencies: dependencies(fixture),
    })).toThrowError(/multiple hard links/u);

    expect(snapshot(fixture.acceptedPaths)).toEqual(before);
    expect(existsSync(resolve(batchDirectory, 'generated.en-et.csv'))).toBe(false);
    expect(existsSync(resolve(batchDirectory, 'evidence.jsonl'))).toBe(false);
  });
});
