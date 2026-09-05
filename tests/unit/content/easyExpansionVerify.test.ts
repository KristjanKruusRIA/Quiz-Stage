import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { afterEach, describe, expect, test } from 'vitest';
import { publishBatch } from '../../../scripts/content/publishBatch';
import {
  buildProvisionalEasyExpansionBatch,
  buildProvisionalEasyExpansionBatchFromCanonical,
  verifyEasyExpansion,
} from '../../../scripts/content/verifyEasyExpansion';
import { getProductionBatch, type ProductionBatchDefinition } from '../../../scripts/content/productionBatches';
import { parseBatchVerificationReport, verifyBatch } from '../../../scripts/content/verifyBatch';
import type { ContentEvidence } from '../../../scripts/content/evidence';
import type { SourceCheckDependencies } from '../../../scripts/content/sourceCheck';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';

const ORIGINAL_BATCH_IDS = [
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
] as const;
const temporaryDirectories: string[] = [];

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function word(value: number): string {
  let remaining = value + 1;
  let result = '';
  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(97 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }
  return result;
}

function createPassingWork(
  root: string,
  batch: ProductionBatchDefinition,
): { workRoot: string; sourceDependencies: SourceCheckDependencies; sourceUrl: string } {
  if (batch.distribution === null) throw new Error('Expected a board batch');
  const workRoot = join(root, 'work');
  const directory = join(workRoot, batch.id);
  mkdirSync(directory, { recursive: true });
  const cells = (['easy', 'medium', 'hard'] as const).flatMap((difficulty) =>
    (['round-one', 'round-two'] as const).map((round) => ({ difficulty, round })));
  const sets: Array<{ difficulty: 'easy' | 'medium' | 'hard'; round: 'round-one' | 'round-two' }> = [];
  for (const cell of cells) {
    const roundKey = cell.round === 'round-one' ? 'roundOne' : 'roundTwo';
    for (let index = 0; index < batch.distribution[cell.difficulty][roundKey]; index += 1) sets.push(cell);
  }

  const authoredRows: string[][] = [];
  const generatedRows: string[][] = [];
  const evidence: ContentEvidence[] = [];
  const sourceUrl = 'https://example.test/specific/history';
  for (const [setIndex, cell] of sets.entries()) {
    const setWord = word(setIndex);
    const categoryId = `history-category-${setWord}`;
    for (let tier = 1; tier <= 5; tier += 1) {
      const clueWord = `${setWord}${word(tier + 500)}`;
      const clueId = `history-clue-${clueWord}`;
      const response = `response${clueWord}`;
      const sourceTitle = `source ${clueWord}`;
      const explanation = `${response} follows from the documented ${clueWord} evidence`;
      const common = {
        clue_id: clueId, pack_id: batch.packId, pack_name: batch.packName, category_set_id: categoryId,
        content_kind: 'board', round: cell.round, tier: String(tier), difficulty: cell.difficulty,
        macro_topic: batch.subthemes[setIndex % batch.subthemes.length], category_name_en: `category ${setWord}`,
        clue_en: `identify ${clueWord} from its distinctive documented historical context`, response_en: response,
        accepted_variants_en: `alias${clueWord}`, explanation_en: explanation, source_title: sourceTitle,
        source_url: sourceUrl, source_license: 'CC0-1.0', source_retrieved_at: '2026-08-13', enabled: 'true',
      };
      authoredRows.push(CSV_COLUMNS.map((column) => ({
        ...common, category_name_et: '', clue_et: '', response_et: '', accepted_variants_et: '',
        explanation_et: '', translation_status: 'untranslated',
      })[column] ?? ''));
      generatedRows.push(CSV_COLUMNS.map((column) => ({
        ...common, category_name_et: `kategooria ${setWord}`,
        clue_et: `tuvasta ${clueWord} selle erilise dokumenteeritud ajaloolise tausta järgi`,
        response_et: `vastus${clueWord}`, accepted_variants_et: `alias${clueWord}`,
        explanation_et: `vastus${clueWord} tuleneb dokumenteeritud ${clueWord} tõendist`,
        translation_status: 'reviewed',
      })[column] ?? ''));
      evidence.push({
        version: 1, clueId, batchId: batch.id, factKey: `fact-${clueWord}`, subjectKey: `subject-${clueWord}`,
        assertion: `${response} — ${explanation}`,
        origin: evidence.length < batch.requiredOpenTdbClues ? 'openTdbInspired' : 'compatibleOpen',
        authoring: { author: 'author', authoredAt: '2026-08-13T08:00:00.000Z' },
        supportingSource: {
          sourceId: `source-${clueWord}`, title: sourceTitle, url: sourceUrl,
          license: 'CC0-1.0', retrievedAt: '2026-08-13',
        },
        inspiration: evidence.length < batch.requiredOpenTdbClues
          ? { system: 'OpenTDB', candidateId: `candidate-${clueWord}`, license: 'CC-BY-SA-4.0' }
          : null,
        factualReview: { reviewer: 'fact-reviewer', reviewedAt: '2026-08-13T09:00:00.000Z', decision: 'approved' },
        editorialReview: { reviewer: 'editor', reviewedAt: '2026-08-13T10:00:00.000Z', decision: 'approved' },
        translationReview: { reviewer: 'translator', reviewedAt: '2026-08-13T11:00:00.000Z', decision: 'approved' },
        adultPolicyReview: null,
      });
    }
  }
  writeFileSync(join(directory, 'authored.csv'), stringify([CSV_COLUMNS, ...authoredRows]));
  writeFileSync(join(directory, 'generated.en-et.csv'), stringify([CSV_COLUMNS, ...generatedRows]));
  writeFileSync(join(directory, 'evidence.jsonl'), evidence.sort((left, right) => left.clueId < right.clueId ? -1 : 1)
    .map((item) => `${JSON.stringify(item)}\n`).join(''));
  return {
    workRoot,
    sourceUrl,
    sourceDependencies: {
      fetch: async () => ({ status: 200, headers: new Headers() }),
      resolveHostname: async () => ['93.184.216.34'],
      now: () => new Date('2026-08-13T12:00:00.000Z'),
      sleep: async () => {},
    },
  };
}

describe('Easy expansion provisional verification', () => {
  test.each(ORIGINAL_BATCH_IDS)('builds a deeply frozen 600-row definition for %s', (batchId) => {
    const canonical = getProductionBatch(batchId);
    const provisional = buildProvisionalEasyExpansionBatch(batchId);
    if (canonical.distribution === null || provisional.distribution === null) throw new Error('Expected board batches');

    expect(provisional).toEqual({
      ...canonical,
      boardClues: 600,
      distribution: {
        easy: {
          roundOne: canonical.distribution.easy.roundOne + 10,
          roundTwo: canonical.distribution.easy.roundTwo + 10,
        },
        medium: canonical.distribution.medium,
        hard: canonical.distribution.hard,
      },
    });
    expect(Object.isFrozen(provisional)).toBe(true);
    expect(Object.isFrozen(provisional.subthemes)).toBe(true);
    expect(Object.isFrozen(provisional.distribution)).toBe(true);
    expect(Object.isFrozen(provisional.distribution.easy)).toBe(true);
    expect(Object.isFrozen(provisional.distribution.medium)).toBe(true);
    expect(Object.isFrozen(provisional.distribution.hard)).toBe(true);
    expect(Object.values(provisional.distribution).flatMap((rounds) => [rounds.roundOne, rounds.roundTwo])
      .reduce((total, count) => total + count, 0)).toBe(120);
    expect(provisional.requiredOpenTdbClues).toBe(canonical.requiredOpenTdbClues);
  });

  test('keeps an already-expanded canonical definition at the 600-row target', () => {
    const canonical = getProductionBatch('01-history');
    if (canonical.distribution === null) throw new Error('Expected a board batch');
    const expanded = Object.freeze({
      ...canonical,
      boardClues: 600,
      distribution: Object.freeze({
        easy: Object.freeze({
          roundOne: canonical.distribution.easy.roundOne + 10,
          roundTwo: canonical.distribution.easy.roundTwo + 10,
        }),
        medium: canonical.distribution.medium,
        hard: canonical.distribution.hard,
      }),
    });

    const provisional = buildProvisionalEasyExpansionBatchFromCanonical(expanded);

    expect(provisional.boardClues).toBe(600);
    expect(provisional.distribution).toEqual(expanded.distribution);
    expect(Object.values(provisional.distribution!).flatMap((rounds) => [
      rounds.roundOne, rounds.roundTwo,
    ]).reduce((total, count) => total + count, 0)).toBe(120);
    expect(() => buildProvisionalEasyExpansionBatchFromCanonical({
      ...expanded,
      boardClues: 550,
    })).toThrow(/500-row baseline or 600-row target/i);
  });

  test.each(['13-finals', '14-adult', '15-estonia'])('rejects ineligible batch %s', (batchId) => {
    expect(() => buildProvisionalEasyExpansionBatch(batchId)).toThrow(/original packs 01-12/i);
  });

  test('rejects an unknown batch through the canonical catalog', () => {
    expect(() => buildProvisionalEasyExpansionBatch('99-unknown')).toThrow(/unknown production batch/i);
  });

  test('still resolves the canonical catalog before accepting a trusted override', async () => {
    const canonical = getProductionBatch('01-history');
    const unknownOverride = Object.freeze({ ...canonical, id: '99-unknown' });
    await expect(verifyBatch({
      batchId: '99-unknown', batchDefinition: unknownOverride, workRoot: 'unused',
    })).rejects.toThrow(/unknown production batch/i);

    await expect(verifyBatch({
      batchId: '01-history', batchDefinition: buildProvisionalEasyExpansionBatch('02-geography'), workRoot: 'unused',
    })).rejects.toThrow(/batch definition.*01-history/i);
  });

  test('marks provisional preflight failures with the same non-publishable profile', async () => {
    const report = await verifyEasyExpansion({
      batchId: '01-history',
      workRoot: temporaryDirectory('quiz-stage-easy-expansion-preflight-'),
    });

    expect(report).toMatchObject({
      kind: 'preflight-failure',
      verificationProfile: 'easy-expansion-provisional',
      blocking: true,
    });
  });

  test('verifies a 600-row projection but its report cannot authorize canonical publication', async () => {
    const root = temporaryDirectory('quiz-stage-easy-expansion-');
    const provisional = buildProvisionalEasyExpansionBatch('01-history');
    const fixture = createPassingWork(root, provisional);
    const report = await verifyEasyExpansion({
      batchId: provisional.id,
      workRoot: fixture.workRoot,
      sourceDependencies: fixture.sourceDependencies,
    });

    expect(report.kind).toBe('verification');
    if (report.kind !== 'verification') throw new Error('Expected full verification report');
    expect(report.verificationProfile).toBe('easy-expansion-provisional');
    expect(report.blocking).toBe(false);
    expect(report.validations.generated.summary).toMatchObject({ boardClues: 600, categorySets: 120, easySets: 54 });

    const acceptedRoot = join(root, 'accepted');
    await expect(publishBatch({ batchId: provisional.id, workRoot: fixture.workRoot, acceptedRoot }))
      .rejects.toThrow(/canonical verification report/i);
    expect(existsSync(join(acceptedRoot, 'content/authored/01-history.csv'))).toBe(false);

    const reportPath = join(fixture.workRoot, provisional.id, 'report.json');
    const unmarked = JSON.parse(readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
    delete unmarked.verificationProfile;
    writeFileSync(reportPath, `${JSON.stringify(unmarked, null, 2)}\n`);
    expect(parseBatchVerificationReport(unmarked)).toMatchObject({
      verificationProfile: 'legacy-unmarked',
    });
    await expect(publishBatch({ batchId: provisional.id, workRoot: fixture.workRoot, acceptedRoot }))
      .rejects.toThrow(/canonical verification report/i);
    expect(existsSync(join(acceptedRoot, 'content/authored/01-history.csv'))).toBe(false);
  }, 30_000);

  test('CLI requires --batch and defaults to the Easy-expansion work root', () => {
    const root = temporaryDirectory('quiz-stage-easy-expansion-cli-');
    const provisional = buildProvisionalEasyExpansionBatch('01-history');
    const fixture = createPassingWork(join(root, 'fixture'), provisional);
    const expectedDirectory = join(root, 'content', 'work', 'easy-expansion', '01-history');
    mkdirSync(expectedDirectory, { recursive: true });
    for (const name of ['authored.csv', 'generated.en-et.csv', 'evidence.jsonl']) {
      writeFileSync(join(expectedDirectory, name), readFileSync(join(fixture.workRoot, '01-history', name)));
    }
    const cachePath = join(root, 'source-cache.json');
    const cacheDocument = {
      version: 1,
      entries: {
        [fixture.sourceUrl]: {
          version: 1,
          expiresAt: '2099-01-01T00:00:00.000Z',
          result: {
            url: fixture.sourceUrl, ok: true, status: 200, retrievedAt: '2026-08-13T12:00:00.000Z',
            code: null, finalUrl: fixture.sourceUrl,
          },
        },
      },
    };
    writeFileSync(cachePath, `${JSON.stringify(cacheDocument)}\n`);
    const script = resolve('scripts/content/verifyEasyExpansion.ts');
    const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

    const missingBatch = spawnSync(process.execPath, [tsxCli, script], { cwd: root, encoding: 'utf8' });
    expect(missingBatch.status).toBe(2);
    expect(missingBatch.stderr).toMatch(/--batch is required/i);

    const result = spawnSync(process.execPath, [
      tsxCli, script, '--batch', '01-history', '--source-cache', cachePath,
    ], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ batchId: '01-history', blocking: false });
    expect(JSON.parse(readFileSync(join(expectedDirectory, 'report.json'), 'utf8')))
      .toMatchObject({ batchId: '01-history', blocking: false });
    expect(readFileSync(cachePath, 'utf8')).toBe(`${JSON.stringify(cacheDocument, null, 2)}\n`);
  }, 30_000);
});
