import {
  copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { ContentService } from '../../../src/main/content/contentService';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import { parseStoredSource } from '../../../src/shared/content/sourceCitation';
import { buildProductionSeed, reportArtifactPath } from '../../../scripts/content/buildSeed';
import { serializeEvidence, type ContentEvidence } from '../../../scripts/content/evidence';
import {
  FINAL_BATCH, PRODUCTION_BATCHES, type ProductionBatchDefinition,
} from '../../../scripts/content/productionBatches';
import { RELEASE_THRESHOLDS, type ReleaseSummary } from '../../../scripts/content/releaseThresholds';
import { inspectSeed, readReleaseInventoryReport, runVerifySeed } from '../../../scripts/content/verifySeed';

interface InventoryReport {
  validation: {
    mode: string;
    blocking: boolean;
    summary: ReleaseSummary;
    issues: ReadonlyArray<{
      code: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      row: number;
      file: string;
    }>;
  };
}

interface SeedInventory {
  boardClues: number;
  categorySets: number;
  distinctCategoryNames: number;
  finalClues: number;
  easySets: number;
  mediumSets: number;
  hardSets: number;
  builtInPacks: number;
}

const seedPath = resolve('resources/content/seed.sqlite');
const inventoryReportPath = resolve('content/reports/release-inventory.json');

const connections: DatabaseConnection[] = [];
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const connection of connections.splice(0)) connection.close();
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

type CsvRow = Record<(typeof CSV_COLUMNS)[number], string>;

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-production-seed-'));
  temporaryDirectories.push(directory);
  return directory;
}

function alphabeticId(value: number): string {
  let remaining = value + 1;
  let result = '';
  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(97 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }
  return result;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function serializeCsv(rows: readonly CsvRow[]): string {
  return [CSV_COLUMNS, ...rows.map((row) => CSV_COLUMNS.map((column) => row[column]))]
    .map((cells) => cells.map(csvCell).join(','))
    .join('\n');
}

function evidenceFor(row: CsvRow, batchId: string, origin: ContentEvidence['origin'] = 'compatibleOpen'): ContentEvidence {
  return {
    version: 1,
    clueId: row.clue_id,
    batchId,
    factKey: `fact:${row.clue_id}`,
    subjectKey: `subject:${row.clue_id}`,
    assertion: `${row.response_en} — ${row.explanation_en}`,
    origin,
    authoring: { author: 'Content Author', authoredAt: '2026-08-13T08:00:00.000Z' },
    supportingSource: {
      sourceId: `source:${row.clue_id}`,
      title: row.source_title,
      url: row.source_url,
      license: row.source_license,
      retrievedAt: row.source_retrieved_at,
    },
    inspiration: origin === 'openTdbInspired'
      ? { system: 'OpenTDB', candidateId: `candidate:${row.clue_id}`, license: 'CC-BY-SA-4.0' }
      : null,
    factualReview: { reviewer: 'Fact Reviewer', reviewedAt: '2026-08-13T09:00:00.000Z', decision: 'approved' },
    editorialReview: { reviewer: 'Editor', reviewedAt: '2026-08-13T10:00:00.000Z', decision: 'approved' },
    translationReview: { reviewer: 'Translator', reviewedAt: '2026-08-13T11:00:00.000Z', decision: 'approved' },
    adultPolicyReview: row.pack_id === 'built-in-adult' ? {
      policy: 'adult-mature-non-graphic-v1',
      reviewer: 'Independent Adult Policy Reviewer',
      reviewedAt: '2026-08-27T13:00:00.000Z',
      decision: 'approved',
      notes: 'Reviewed against the approved mature, factual, non-graphic boundary.',
    } : null,
  };
}

function boardRows(batch: ProductionBatchDefinition, batchIndex: number): CsvRow[] {
  const rows: CsvRow[] = [];
  let localSetIndex = 0;
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    for (const round of ['round-one', 'round-two'] as const) {
      const count = batch.distribution![difficulty][round === 'round-one' ? 'roundOne' : 'roundTwo'];
      for (let offset = 0; offset < count; offset += 1) {
        const globalSetIndex = batchIndex * 100 + localSetIndex;
        for (let tier = 1; tier <= 5; tier += 1) {
          const unique = alphabeticId(globalSetIndex * 5 + tier);
          rows.push({
            clue_id: `${batch.id}-clue-${localSetIndex}-${tier}`,
            pack_id: batch.packId,
            pack_name: batch.packName,
            category_set_id: `${batch.id}-set-${localSetIndex}`,
            content_kind: 'board', round, tier: String(tier), difficulty,
            macro_topic: batch.subthemes[localSetIndex % batch.subthemes.length],
            category_name_en: `${batch.topicFamily} category ${localSetIndex}`,
            category_name_et: `${batch.topicFamily} kategooria ${localSetIndex}`,
            clue_en: `Identify the documented subject ${unique}`,
            clue_et: `Tuvasta dokumenteeritud teema ${unique}`,
            response_en: `Response ${globalSetIndex}-${tier}`,
            response_et: `Vastus ${globalSetIndex}-${tier}`,
            accepted_variants_en: '', accepted_variants_et: '',
            explanation_en: `The source documents response ${globalSetIndex}-${tier}`,
            explanation_et: `Allikas dokumenteerib vastuse ${globalSetIndex}-${tier}`,
            source_title: `Supporting source ${batch.id} ${localSetIndex}-${tier}`,
            source_url: `https://example.com/source/${batch.id}/${localSetIndex}/${tier}`,
            source_license: 'CC0-1.0', source_retrieved_at: '2026-08-13',
            translation_status: 'reviewed', enabled: 'true',
          });
        }
        localSetIndex += 1;
      }
    }
  }
  return rows;
}

function finalRows(): CsvRow[] {
  const rows: CsvRow[] = [];
  for (const [macroTopic, allocation] of Object.entries(FINAL_BATCH.finalTopicAllocations!)) {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (let index = 0; index < allocation[difficulty]; index += 1) {
        const number = rows.length;
        const unique = alphabeticId(10_000 + number);
        rows.push({
          clue_id: `final-clue-${number}`, pack_id: allocation.packId, pack_name: allocation.packName,
          category_set_id: `final-set-${number}`, content_kind: 'final', round: 'final', tier: '0',
          difficulty, macro_topic: macroTopic,
          category_name_en: `Final category ${number}`, category_name_et: `Finaalkategooria ${number}`,
          clue_en: `Identify the documented final subject ${unique}`,
          clue_et: `Tuvasta dokumenteeritud finaaliteema ${unique}`,
          response_en: `Final response ${number}`, response_et: `Finaalvastus ${number}`,
          accepted_variants_en: '', accepted_variants_et: '',
          explanation_en: `The source documents final response ${number}`,
          explanation_et: `Allikas dokumenteerib finaalvastuse ${number}`,
          source_title: `Supporting final source ${number}`,
          source_url: `https://example.com/source/finals/${number}`,
          source_license: 'CC0-1.0', source_retrieved_at: '2026-08-13',
          translation_status: 'reviewed', enabled: 'true',
        });
      }
    }
  }
  return rows;
}

function writeReleaseFixture(root: string): {
  inputs: string[];
  evidence: string[];
  evidenceByClueId: ReadonlyMap<string, ContentEvidence>;
  sample: ContentEvidence;
} {
  const generated = join(root, 'generated');
  const evidenceDirectory = join(root, 'evidence');
  mkdirSync(generated, { recursive: true });
  mkdirSync(evidenceDirectory, { recursive: true });
  const records: ContentEvidence[] = [];
  for (const [batchIndex, batch] of PRODUCTION_BATCHES.entries()) {
    const rows = boardRows(batch, batchIndex);
    const batchEvidence = rows.map((row, index) => evidenceFor(
      row, batch.id, index < batch.requiredOpenTdbClues ? 'openTdbInspired' : 'compatibleOpen',
    ));
    records.push(...batchEvidence);
    writeFileSync(join(generated, `${batch.id}.en-et.csv`), serializeCsv(rows));
    writeFileSync(join(evidenceDirectory, `${batch.id}.jsonl`), serializeEvidence(batchEvidence));
  }
  const finals = finalRows();
  const finalEvidence = finals.map((row) => evidenceFor(row, FINAL_BATCH.id));
  records.push(...finalEvidence);
  const finalsByPack = new Map<string, CsvRow[]>();
  for (const row of finals) {
    const rows = finalsByPack.get(row.pack_id) ?? [];
    rows.push(row);
    finalsByPack.set(row.pack_id, rows);
  }
  for (const [packId, rows] of finalsByPack) {
    writeFileSync(join(generated, `${FINAL_BATCH.id}-${packId}.en-et.csv`), serializeCsv(rows));
  }
  writeFileSync(join(evidenceDirectory, `${FINAL_BATCH.id}.jsonl`), serializeEvidence(finalEvidence));
  return {
    inputs: [join(generated, '*.en-et.csv')],
    evidence: [join(evidenceDirectory, '*.jsonl')],
    evidenceByClueId: new Map(records.map((record) => [record.clueId, record])),
    sample: records[0],
  };
}

function oneRowFixture(root: string): { input: string; evidence: ContentEvidence; evidencePath: string } {
  const batch = PRODUCTION_BATCHES[0];
  const row = boardRows(batch, 0)[0];
  const input = join(root, 'one-row.csv');
  const evidencePath = join(root, 'one-row.jsonl');
  const evidence = evidenceFor(row, batch.id, 'openTdbInspired');
  writeFileSync(input, serializeCsv([row]));
  writeFileSync(evidencePath, serializeEvidence([evidence]));
  return { input, evidence, evidencePath };
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function openSeed() {
  const database = openDatabase({ filePath: seedPath, readonly: true });
  const repository = new ContentRepository(database);
  const service = new ContentService(repository);
  const packIds = repository.loadLibrary().packs.filter((pack) => pack.enabled).map((pack) => pack.id);
  connections.push(database);
  return { database, service, packIds };
}

function querySeedInventory(database: DatabaseConnection): SeedInventory {
  return {
    boardClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
    categorySets: database.prepare("SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
    finalClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round = 'final'").pluck().get() as number,
    distinctCategoryNames: database.prepare(
      "SELECT COUNT(DISTINCT(json_extract(name_json, '$.en'))) FROM category_sets WHERE round IN ('round-one', 'round-two')",
    ).pluck().get() as number,
    easySets: database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'easy'",
    ).pluck().get() as number,
    mediumSets: database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'medium'",
    ).pluck().get() as number,
    hardSets: database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'hard'",
    ).pluck().get() as number,
    builtInPacks: database.prepare("SELECT COUNT(*) FROM content_packs WHERE id LIKE 'built-in-%'").pluck().get() as number,
  };
}

function packInventory(database: DatabaseConnection, packId: string): {
  boardSets: number;
  boardClues: number;
  finalClues: number;
} {
  return {
    boardSets: database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE pack_id = ? AND round IN ('round-one', 'round-two')",
    ).pluck().get(packId) as number,
    boardClues: database.prepare(
      "SELECT COUNT(*) FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id WHERE category_sets.pack_id = ? AND clues.round IN ('round-one', 'round-two')",
    ).pluck().get(packId) as number,
    finalClues: database.prepare(
      "SELECT COUNT(*) FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id WHERE category_sets.pack_id = ? AND clues.round = 'final'",
    ).pluck().get(packId) as number,
  };
}

function loadInventoryReport(): InventoryReport {
  const raw = JSON.parse(readFileSync(inventoryReportPath, 'utf8')) as InventoryReport;
  return raw;
}

describe('evidence-bound production seed infrastructure', () => {
  it('records repository artifacts with checkout-independent report paths', () => {
    expect(reportArtifactPath(resolve('content/generated/01-history.en-et.csv')))
      .toBe('content/generated/01-history.en-et.csv');
    const external = join(tmpdir(), 'quiz-stage-external.csv');
    expect(reportArtifactPath(external)).toBe(resolve(external));
  });

  it('requires evidence before reading CSV or changing an existing seed or report', async () => {
    const directory = temporaryDirectory();
    const output = join(directory, 'seed.sqlite');
    const report = join(directory, 'report.json');
    writeFileSync(output, 'existing seed bytes');
    writeFileSync(report, 'existing report bytes');

    await expect(buildProductionSeed({
      inputs: [join(directory, 'missing.csv')], evidence: [], output, report,
    })).rejects.toThrow(/evidence/i);

    expect(readFileSync(output, 'utf8')).toBe('existing seed bytes');
    expect(readFileSync(report, 'utf8')).toBe('existing report bytes');
    expect(readdirSync(directory).filter((name) => name.includes('.tmp.sqlite'))).toEqual([]);
  });

  it.each([
    ['malformed', () => '{not-json}\n'],
    ['duplicate', (fixture: ReturnType<typeof oneRowFixture>) =>
      `${JSON.stringify(fixture.evidence)}\n${JSON.stringify(fixture.evidence)}\n`],
    ['alias', (fixture: ReturnType<typeof oneRowFixture>) => serializeEvidence([{
      ...fixture.evidence, clueId: 'alias-clue', factKey: 'fact:alias-clue',
      supportingSource: { ...fixture.evidence.supportingSource, sourceId: 'source:alias-clue' },
    }])],
    ['orphan', (fixture: ReturnType<typeof oneRowFixture>) => serializeEvidence([
      fixture.evidence,
      {
        ...fixture.evidence, clueId: 'orphan-clue', factKey: 'fact:orphan-clue',
        supportingSource: { ...fixture.evidence.supportingSource, sourceId: 'source:orphan-clue' },
      },
    ])],
    ['batch mismatch', (fixture: ReturnType<typeof oneRowFixture>) => serializeEvidence([{
      ...fixture.evidence, batchId: PRODUCTION_BATCHES[1].id,
    }])],
    ['unapproved review', (fixture: ReturnType<typeof oneRowFixture>) => `${JSON.stringify({
      ...fixture.evidence,
      factualReview: { ...fixture.evidence.factualReview, decision: 'pending' },
    })}\n`],
  ])('rejects %s evidence without changing existing seed or report bytes', async (_name, evidenceBytes) => {
    const directory = temporaryDirectory();
    const fixture = oneRowFixture(directory);
    const output = join(directory, 'seed.sqlite');
    const report = join(directory, 'report.json');
    writeFileSync(fixture.evidencePath, evidenceBytes(fixture));
    writeFileSync(output, 'existing seed bytes');
    writeFileSync(report, 'existing report bytes');

    await expect(buildProductionSeed({
      inputs: [fixture.input], evidence: [fixture.evidencePath], output, report,
    })).rejects.toThrow();

    expect(readFileSync(output, 'utf8')).toBe('existing seed bytes');
    expect(readFileSync(report, 'utf8')).toBe('existing report bytes');
    expect(readdirSync(directory).filter((name) => name.includes('.tmp.sqlite'))).toEqual([]);
  });

  it('accepts repeatable build evidence flags and reads every supplied pattern before mutation', () => {
    const directory = temporaryDirectory();
    const fixture = oneRowFixture(directory);
    const output = join(directory, 'seed.sqlite');
    const report = join(directory, 'report.json');
    writeFileSync(output, 'existing seed bytes');
    writeFileSync(report, 'existing report bytes');
    const result = spawnSync(process.execPath, [
      resolve('node_modules/tsx/dist/cli.mjs'), resolve('scripts/content/buildSeed.ts'),
      '--input', fixture.input,
      '--evidence', fixture.evidencePath,
      '--evidence', fixture.evidencePath,
      '--output', output,
      '--report', report,
    ], { cwd: resolve('.'), encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/duplicate evidence/i);
    expect(readFileSync(output, 'utf8')).toBe('existing seed bytes');
    expect(readFileSync(report, 'utf8')).toBe('existing report bytes');
  }, 30_000);

  it('makes verification require and read repeatable evidence before report, source, or SQLite checks', async () => {
    const directory = temporaryDirectory();
    const fixture = oneRowFixture(directory);
    const report = join(directory, 'report.json');
    const existingReport = '{"sentinel":true}\n';
    writeFileSync(report, existingReport);

    await expect(runVerifySeed([
      '--input', join(directory, 'missing.csv'), '--report', report,
      '--seed', join(directory, 'missing.sqlite'), '--source-cache', join(directory, 'cache.json'),
    ])).rejects.toThrow(/evidence/i);
    expect(readFileSync(report, 'utf8')).toBe(existingReport);

    await expect(runVerifySeed([
      '--input', fixture.input,
      '--evidence', fixture.evidencePath,
      '--evidence', fixture.evidencePath,
      '--report', report,
      '--seed', join(directory, 'missing.sqlite'),
      '--source-cache', join(directory, 'cache.json'),
    ])).rejects.toThrow(/duplicate evidence/i);
    expect(readFileSync(report, 'utf8')).toBe(existingReport);

    writeFileSync(fixture.evidencePath, serializeEvidence([{
      ...fixture.evidence, batchId: PRODUCTION_BATCHES[1].id,
    }]));
    await expect(runVerifySeed([
      '--input', fixture.input,
      '--evidence', fixture.evidencePath,
      '--report', report,
      '--seed', join(directory, 'missing.sqlite'),
      '--source-cache', join(directory, 'cache.json'),
    ])).resolves.toBe(1);
    expect(readFileSync(report, 'utf8')).toBe(existingReport);
    expect(readdirSync(directory).filter((name) => name.includes('.verify.tmp'))).toEqual([]);
  });

  it('stores only evidence-backed v2 citations and produces identical hashes from identical bytes', async () => {
    const directory = temporaryDirectory();
    const fixture = writeReleaseFixture(directory);
    const firstOutput = join(directory, 'first.sqlite');
    const secondOutput = join(directory, 'second.sqlite');
    const firstReport = join(directory, 'first-report.json');
    const secondReport = join(directory, 'second-report.json');

    const first = await buildProductionSeed({
      inputs: fixture.inputs, evidence: fixture.evidence, output: firstOutput, report: firstReport,
    });
    const second = await buildProductionSeed({
      inputs: fixture.inputs, evidence: fixture.evidence, output: secondOutput, report: secondReport,
    });

    expect(second.seedSha256).toBe(first.seedSha256);
    expect(readFileSync(secondOutput)).toEqual(readFileSync(firstOutput));
    expect(first.input.sha256).toBe(second.input.sha256);
    expect(first.input.evidence).toMatchObject({ records: 7174, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
    const firstReportData = JSON.parse(readFileSync(firstReport, 'utf8'));
    expect(firstReportData.validation).toMatchObject({
      mode: 'release', blocking: false,
    });
    expect(firstReportData.validation.summary).toEqual({
      boardClues: 7_000,
      categorySets: 1_400,
      distinctCategoryNames: 1_400,
      finalClues: 174,
      easySets: 467,
      mediumSets: 467,
      hardSets: 466,
      builtInPacks: 15,
    });
    expect(firstReportData.validation).not.toHaveProperty('validation');
    expect(readReleaseInventoryReport(firstReport).validation.summary).toEqual(firstReportData.validation.summary);
    const aboveThreshold = structuredClone(firstReportData);
    aboveThreshold.validation.summary.boardClues = 7_001;
    writeFileSync(firstReport, `${JSON.stringify(aboveThreshold, null, 2)}\n`);
    expect(() => readReleaseInventoryReport(firstReport)).toThrow(
      'Release inventory report does not match exact inventory for boardClues: 7001 != 7000',
    );
    writeFileSync(firstReport, `${JSON.stringify(firstReportData, null, 2)}\n`);

    const database = openDatabase({ filePath: firstOutput, readonly: true });
    connections.push(database);
    const rawSource = database.prepare('SELECT source FROM clues WHERE id = ?').pluck().get(fixture.sample.clueId) as string;
    expect(parseStoredSource(rawSource)).toEqual({
      format: 'quiz-stage-csv-v2',
      title: fixture.sample.supportingSource.title,
      url: fixture.sample.supportingSource.url,
      license: fixture.sample.supportingSource.license,
      retrievedAt: fixture.sample.supportingSource.retrievedAt,
      translationStatus: 'reviewed',
      sourceId: fixture.sample.supportingSource.sourceId,
      factualVerifiedAt: fixture.sample.factualReview.reviewedAt,
    });
    expect(database.prepare(
      "SELECT COUNT(*) FROM clues WHERE json_extract(source, '$.format') = 'quiz-stage-csv-v2'",
    ).pluck().get()).toBe(7174);
    expect(database.prepare(
      "SELECT COUNT(*) FROM content_packs WHERE id LIKE 'built-in-%'",
    ).pluck().get()).toBe(15);
    expect(packInventory(database, 'built-in-adult')).toEqual({
      boardSets: 100, boardClues: 500, finalClues: 12,
    });
    expect(packInventory(database, 'built-in-estonia')).toEqual({
      boardSets: 100, boardClues: 500, finalClues: 12,
    });
    expect(packInventory(database, 'built-in-finals')).toEqual({
      boardSets: 0, boardClues: 0, finalClues: 150,
    });
    database.close();
    connections.splice(connections.indexOf(database), 1);
    expect(inspectSeed(firstOutput, fixture.evidenceByClueId).inventory).toEqual({
      boardClues: 7_000,
      categorySets: 1_400,
      distinctCategoryNames: 1_400,
      finalClues: 174,
      easySets: 467,
      mediumSets: 467,
      hardSets: 466,
      builtInPacks: 15,
    });

    const selectionDatabase = openDatabase({ filePath: firstOutput, readonly: true });
    connections.push(selectionDatabase);
    const service = new ContentService(new ContentRepository(selectionDatabase));
    for (const packId of ['built-in-adult', 'built-in-estonia']) {
      const selection = service.selectForMatch({
        language: 'en', difficulty: 'easy', clueSeconds: 15,
        teams: [
          { id: 'team-1', name: 'Alpha', color: '#E3B341' },
          { id: 'team-2', name: 'Beta', color: '#50A7F5' },
        ],
        packIds: [packId], displayMode: 'single',
      }, `${packId}-only`);
      expect(selection).toMatchObject({ ok: true });
      if (selection.ok) {
        expect(selection.categorySets).toHaveLength(12);
        expect(selection.categorySets.every((categorySet) => categorySet.packId === packId)).toBe(true);
        expect(selection.final.packId).toBe(packId);
      }
    }
    selectionDatabase.close();
    connections.splice(connections.indexOf(selectionDatabase), 1);

    const tampered = openDatabase({ filePath: firstOutput });
    connections.push(tampered);
    tampered.prepare('UPDATE clues SET source = ? WHERE id = ?').run(JSON.stringify({
      format: 'quiz-stage-csv-v1',
      title: fixture.sample.supportingSource.title,
      url: fixture.sample.supportingSource.url,
      license: fixture.sample.supportingSource.license,
      retrievedAt: fixture.sample.supportingSource.retrievedAt,
      translationStatus: 'reviewed',
    }), fixture.sample.clueId);
    tampered.close();
    connections.splice(connections.indexOf(tampered), 1);
    expect(() => inspectSeed(firstOutput, fixture.evidenceByClueId)).toThrow(/v2 evidence citation/i);
  }, 120_000);

  it('honors reviewed translation warning IDs already sealed in the release report', async () => {
    const directory = temporaryDirectory();
    const fixture = writeReleaseFixture(directory);
    const output = join(directory, 'seed.sqlite');
    const report = join(directory, 'release.json');
    const firstInput = join(directory, 'generated', `${PRODUCTION_BATCHES[0].id}.en-et.csv`);
    const input = readFileSync(firstInput, 'utf8');
    const prior = 'Allikas dokumenteerib vastuse 0-1';
    const next = 'The source documents response 0-1';
    expect(input).toContain(prior);
    writeFileSync(firstInput, input.replace(prior, next));
    writeFileSync(report, `${JSON.stringify({
      translation: {
        exceptions: [{
          id: 'translation:UNCHANGED_TRANSLATION:01-history-clue-0-1',
          status: 'reviewed',
          reviewerReason: 'The independent semantic reviewer approved this intentional unchanged text.',
        }],
      },
    }, null, 2)}\n`);

    await expect(buildProductionSeed({
      inputs: fixture.inputs, evidence: fixture.evidence, output, report,
    })).resolves.toMatchObject({ boardClues: 7_000, categorySets: 1_400, finalClues: 174 });
    expect(JSON.parse(readFileSync(report, 'utf8')).translation.exceptions).toHaveLength(1);
  }, 120_000);

  it('publishes verification reports only after validation, sources, citations, hash, and inventory pass', async () => {
    const directory = temporaryDirectory();
    const fixture = writeReleaseFixture(directory);
    const baseSeed = join(directory, 'base.sqlite');
    const report = join(directory, 'release.json');
    const seed = join(directory, 'candidate.sqlite');
    await buildProductionSeed({ inputs: fixture.inputs, evidence: fixture.evidence, output: baseSeed, report });
    const reportData = JSON.parse(readFileSync(report, 'utf8'));
    reportData.sentinel = 'preserve until every gate passes';
    const writeReport = (value = reportData) => writeFileSync(report, `${JSON.stringify(value, null, 2)}\n`);
    const verify = (runSourceCheck: () => Promise<number>) => runVerifySeed([
      ...fixture.inputs.flatMap((input) => ['--input', input]),
      ...fixture.evidence.flatMap((evidence) => ['--evidence', evidence]),
      '--report', report, '--seed', seed, '--source-cache', join(directory, 'source-cache.json'),
    ], { runSourceCheck });
    const expectPreserved = async (run: () => Promise<unknown>, expectedBytes: Buffer) => {
      await expect(run()).rejects.toThrow();
      expect(readFileSync(report)).toEqual(expectedBytes);
      expect(readdirSync(directory).filter((name) => name.includes('.verify.tmp'))).toEqual([]);
    };

    copyFileSync(baseSeed, seed);
    writeReport();
    const sourceFailureBytes = readFileSync(report);
    await expect(verify(async () => 1)).resolves.toBe(1);
    expect(readFileSync(report)).toEqual(sourceFailureBytes);
    expect(readdirSync(directory).filter((name) => name.includes('.verify.tmp'))).toEqual([]);

    const firstEvidencePath = join(directory, 'evidence', `${PRODUCTION_BATCHES[0].id}.jsonl`);
    const originalEvidence = readFileSync(firstEvidencePath, 'utf8');
    const evidenceLines = originalEvidence.trimEnd().split('\n');
    const mismatchedEvidence = JSON.parse(evidenceLines[0]);
    mismatchedEvidence.batchId = PRODUCTION_BATCHES[1].id;
    evidenceLines[0] = JSON.stringify(mismatchedEvidence);
    writeFileSync(firstEvidencePath, `${evidenceLines.join('\n')}\n`);
    writeReport();
    const validationFailureBytes = readFileSync(report);
    await expect(verify(async () => 0)).resolves.toBe(1);
    expect(readFileSync(report)).toEqual(validationFailureBytes);
    expect(readdirSync(directory).filter((name) => name.includes('.verify.tmp'))).toEqual([]);
    writeFileSync(firstEvidencePath, originalEvidence);

    for (const tamperedSource of [
      {
        format: 'quiz-stage-csv-v1', title: fixture.sample.supportingSource.title,
        url: fixture.sample.supportingSource.url, license: fixture.sample.supportingSource.license,
        retrievedAt: fixture.sample.supportingSource.retrievedAt, translationStatus: 'reviewed',
      },
      {
        format: 'quiz-stage-csv-v2', title: fixture.sample.supportingSource.title,
        url: fixture.sample.supportingSource.url, license: fixture.sample.supportingSource.license,
        retrievedAt: fixture.sample.supportingSource.retrievedAt, translationStatus: 'reviewed',
        sourceId: 'source:mismatch', factualVerifiedAt: fixture.sample.factualReview.reviewedAt,
      },
    ]) {
      copyFileSync(baseSeed, seed);
      const database = openDatabase({ filePath: seed });
      database.prepare('UPDATE clues SET source = ? WHERE id = ?')
        .run(JSON.stringify(tamperedSource), fixture.sample.clueId);
      database.close();
      writeReport();
      await expectPreserved(() => verify(async () => 0), readFileSync(report));
    }

    copyFileSync(baseSeed, seed);
    const badHashReport = structuredClone(reportData);
    badHashReport.output.sha256 = '0'.repeat(64);
    writeReport(badHashReport);
    await expectPreserved(() => verify(async () => 0), readFileSync(report));

    copyFileSync(baseSeed, seed);
    const inventoryDatabase = openDatabase({ filePath: seed });
    inventoryDatabase.prepare(
      "UPDATE category_sets SET difficulty = 'medium' WHERE id = (SELECT id FROM category_sets WHERE difficulty = 'easy' LIMIT 1)",
    ).run();
    inventoryDatabase.close();
    const inventoryReport = structuredClone(reportData);
    inventoryReport.output.sha256 = sha256(seed);
    writeReport(inventoryReport);
    await expectPreserved(() => verify(async () => 0), readFileSync(report));

    copyFileSync(baseSeed, seed);
    writeReport();
    await expect(verify(async () => 0)).resolves.toBe(0);
    const published = JSON.parse(readFileSync(report, 'utf8'));
    expect(published.validation).toMatchObject({ mode: 'release', blocking: false });
    expect(published.validation).not.toHaveProperty('validation');
    expect(published.output.sha256).toBe(sha256(seed));
    expect(published.sentinel).toBe('preserve until every gate passes');
  }, 180_000);
});

describe('production seed', () => {
  it('matches the release inventory thresholds and passes seeded selection in all difficulties', () => {
    const report = loadInventoryReport();
    const summary = report.validation.summary;
    expect(report.validation.mode).toBe('release');
    expect(report.validation.blocking).toBe(false);
    expect(report.validation.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(summary).toEqual(expect.objectContaining(RELEASE_THRESHOLDS));

    const { service, packIds } = openSeed();
    const baseConfig = {
      language: 'en' as const,
      clueSeconds: 15,
      teams: [
        { id: 'team-1', name: 'Alpha', color: '#E3B341' },
        { id: 'team-2', name: 'Beta', color: '#50A7F5' },
      ],
      packIds,
      displayMode: 'single' as const,
    };

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (let seed = 0; seed < 100; seed += 1) {
        const config = { ...baseConfig, difficulty };
        expect(service.checkAvailability(config)).toEqual({ ok: true });
        const selection = service.selectForMatch(config, `${difficulty}-${seed}`);
        expect(selection).toMatchObject({ ok: true, seed: `${difficulty}-${seed}` });
        if (selection.ok) {
          expect(selection.roundOne.categories).toHaveLength(6);
          expect(selection.roundTwo.categories).toHaveLength(6);
          expect(selection.final.round).toBe('final');
        }
      }
    }
  }, 45_000);

  it('supports a healthy production database inventory with SQLite integrity', () => {
    const summary = loadInventoryReport().validation.summary;
    const database = openDatabase({ filePath: seedPath, readonly: true });
    connections.push(database);
    const checks = database.pragma('integrity_check') as Array<{ integrity_check: string }>;
    expect(checks.length > 0 ? checks[0]?.integrity_check : undefined).toBe('ok');

    const inventory = querySeedInventory(database);
    expect(inventory).toEqual(expect.objectContaining({
      boardClues: summary.boardClues,
      categorySets: summary.categorySets,
      distinctCategoryNames: summary.distinctCategoryNames,
      finalClues: summary.finalClues,
      easySets: summary.easySets,
      mediumSets: summary.mediumSets,
      hardSets: summary.hardSets,
    }));
  });
});
