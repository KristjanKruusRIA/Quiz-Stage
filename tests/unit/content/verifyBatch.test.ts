import {
  appendFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, renameSync,
  symlinkSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, test } from 'vitest';
import { stringify } from 'csv-stringify/sync';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import { publishBatch } from '../../../scripts/content/publishBatch';
import { verifyBatch, type BatchVerificationReport } from '../../../scripts/content/verifyBatch';
import { getProductionBatch } from '../../../scripts/content/productionBatches';
import type { ContentEvidence } from '../../../scripts/content/evidence';
import { checkSourceUrls, type SourceCheckDependencies } from '../../../scripts/content/sourceCheck';

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

function createPassingWork(root: string): { workRoot: string; sourceDependencies: SourceCheckDependencies } {
  const batch = getProductionBatch('01-history');
  const workRoot = join(root, 'work');
  const directory = join(workRoot, batch.id);
  mkdirSync(directory, { recursive: true });
  const cells = (['easy', 'medium', 'hard'] as const).flatMap((difficulty) =>
    (['round-one', 'round-two'] as const).map((round) => ({ difficulty, round })));
  const sets: Array<{ difficulty: string; round: string }> = [];
  for (const cell of cells) {
    const count = batch.distribution![cell.difficulty][cell.round === 'round-one' ? 'roundOne' : 'roundTwo'];
    for (let index = 0; index < count; index += 1) sets.push(cell);
  }
  const authoredRows: string[][] = [];
  const generatedRows: string[][] = [];
  const evidence: ContentEvidence[] = [];
  for (const [setIndex, cell] of sets.entries()) {
    const setWord = word(setIndex);
    const categoryId = `history-category-${setWord}`;
    for (let tier = 1; tier <= 5; tier += 1) {
      const clueWord = `${setWord}${word(tier + 500)}`;
      const clueId = `history-clue-${clueWord}`;
      const response = `response${clueWord}`;
      const sourceUrl = 'https://example.test/specific/history';
      const sourceTitle = `source ${clueWord}`;
      const explanation = `${response} follows from the documented ${clueWord} evidence`;
      const common = {
        clue_id: clueId, pack_id: batch.packId, pack_name: 'History', category_set_id: categoryId,
        content_kind: 'board', round: cell.round, tier: String(tier), difficulty: cell.difficulty,
        macro_topic: batch.subthemes[setIndex % batch.subthemes.length], category_name_en: `category ${setWord}`,
        clue_en: `identify ${clueWord} from its distinctive documented historical context`, response_en: response,
        accepted_variants_en: `alias${clueWord}`, explanation_en: explanation, source_title: sourceTitle, source_url: sourceUrl,
        source_license: 'CC0-1.0', source_retrieved_at: '2026-08-13', enabled: 'true',
      };
      authoredRows.push(CSV_COLUMNS.map((column) => ({
        ...common, category_name_et: '', clue_et: '', response_et: '', accepted_variants_et: '',
        explanation_et: '', translation_status: 'untranslated',
      })[column] ?? ''));
      generatedRows.push(CSV_COLUMNS.map((column) => ({
        ...common, category_name_et: `kategooria ${setWord}`,
        clue_et: `tuvasta ${clueWord} selle erilise dokumenteeritud ajaloolise tausta järgi`,
        response_et: `vastus${clueWord}`, accepted_variants_et: `alias${clueWord}`,
        explanation_et: `vastus${clueWord} tuleneb dokumenteeritud ${clueWord} tõendist`, translation_status: 'reviewed',
      })[column] ?? ''));
      evidence.push({
        version: 1, clueId, batchId: batch.id, factKey: `fact-${clueWord}`,
        assertion: `${response} — ${explanation}`,
        origin: evidence.length < batch.requiredOpenTdbClues ? 'openTdbInspired' : 'compatibleOpen',
        authoring: { author: 'author', authoredAt: '2026-08-13T08:00:00.000Z' },
        supportingSource: { sourceId: `source-${clueWord}`, title: sourceTitle, url: sourceUrl, license: 'CC0-1.0', retrievedAt: '2026-08-13' },
        inspiration: evidence.length < batch.requiredOpenTdbClues
          ? { system: 'OpenTDB', candidateId: `candidate-${clueWord}`, license: 'CC-BY-SA-4.0' } : null,
        factualReview: { reviewer: 'fact-reviewer', reviewedAt: '2026-08-13T09:00:00.000Z', decision: 'approved' },
        editorialReview: { reviewer: 'editor', reviewedAt: '2026-08-13T10:00:00.000Z', decision: 'approved' },
        translationReview: { reviewer: 'translator', reviewedAt: '2026-08-13T11:00:00.000Z', decision: 'approved' },
      });
    }
  }
  writeFileSync(join(directory, 'authored.csv'), stringify([CSV_COLUMNS, ...authoredRows]));
  writeFileSync(join(directory, 'generated.en-et.csv'), stringify([CSV_COLUMNS, ...generatedRows]));
  writeFileSync(join(directory, 'evidence.jsonl'), evidence.sort((a, b) => a.clueId < b.clueId ? -1 : 1)
    .map((item) => `${JSON.stringify(item)}\n`).join(''));
  return {
    workRoot,
    sourceDependencies: {
      fetch: async () => ({ status: 200, headers: new Headers() }),
      resolveHostname: async () => ['93.184.216.34'],
      now: () => new Date('2026-08-13T12:00:00.000Z'), sleep: async () => {},
    },
  };
}

function seedAccepted(root: string): Record<string, string> {
  const originals = { authored: 'old authored', generated: 'old generated', evidence: 'old evidence', report: 'old report' };
  for (const [folder, name, value] of [
    ['authored', '01-history.csv', originals.authored], ['generated', '01-history.en-et.csv', originals.generated],
    ['evidence', '01-history.jsonl', originals.evidence], ['reports', '01-history.json', originals.report],
  ]) {
    mkdirSync(join(root, 'content', folder), { recursive: true });
    writeFileSync(join(root, 'content', folder, name), value);
  }
  return originals;
}

async function passingReport(root: string): Promise<{
  fixture: ReturnType<typeof createPassingWork>;
  reportPath: string;
  report: Extract<BatchVerificationReport, { kind: 'verification' }>;
}> {
  const fixture = createPassingWork(root);
  const report = await verifyBatch({
    batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: fixture.sourceDependencies,
  });
  if (report.kind !== 'verification') throw new Error('Fixture did not produce a verification report');
  return { fixture, reportPath: join(fixture.workRoot, '01-history/report.json'), report };
}

describe('batch publication boundary', () => {
  test('source result order is UTF-16 code-unit total order', async () => {
    const dependencies: SourceCheckDependencies = {
      fetch: async () => ({ status: 200, headers: new Headers() }),
      resolveHostname: async () => ['93.184.216.34'],
      now: () => new Date('2026-08-13T12:00:00.000Z'), sleep: async () => {},
    };
    const decomposed = 'https://example.com/a\u0308';
    const composed = 'https://example.com/ä';

    expect((await checkSourceUrls([composed, decomposed], dependencies)).map((item) => item.url))
      .toEqual([decomposed, composed]);
  });

  test('rejects publication without a passing verification report', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const workRoot = join(root, 'work');
    const acceptedRoot = join(root, 'accepted');
    mkdirSync(join(workRoot, '01-history'), { recursive: true });
    mkdirSync(acceptedRoot, { recursive: true });
    writeFileSync(join(workRoot, '01-history', 'report.json'), '{"blocking":false}\n');

    await expect(publishBatch({ batchId: '01-history', workRoot, acceptedRoot }))
      .rejects.toThrow(/passing verification report/i);

    expect(readFileSync(join(workRoot, '01-history', 'report.json'), 'utf8')).toBe('{"blocking":false}\n');
  });

  test.each([
    ['missing authored input', (directory: string) => renameSync(join(directory, 'authored.csv'), join(directory, 'removed.csv'))],
    ['unreadable generated input', (directory: string) => {
      renameSync(join(directory, 'generated.en-et.csv'), join(directory, 'removed.csv'));
      mkdirSync(join(directory, 'generated.en-et.csv'));
    }],
    ['malformed evidence input', (directory: string) => writeFileSync(join(directory, 'evidence.jsonl'), '{not-json}\n')],
  ])('atomically invalidates a stale passing report after %s', async (_name, breakInput) => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const { fixture, reportPath } = await passingReport(root);
    const stale = readFileSync(reportPath, 'utf8');
    breakInput(join(fixture.workRoot, '01-history'));

    const report = await verifyBatch({
      batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: fixture.sourceDependencies,
    });

    expect(report).toMatchObject({ version: 1, batchId: '01-history', kind: 'preflight-failure', blocking: true });
    expect(readFileSync(reportPath, 'utf8')).not.toBe(stale);
    expect(JSON.parse(readFileSync(reportPath, 'utf8'))).toEqual(report);
    await expect(publishBatch({ batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot: join(root, 'accepted') }))
      .rejects.toThrow(/passing verification report|safe regular file/i);
  }, 30_000);

  test('preserves a pre-existing report temporary collision when stale-report invalidation cannot stage', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const { fixture, reportPath } = await passingReport(root);
    const stale = readFileSync(reportPath, 'utf8');
    renameSync(join(fixture.workRoot, '01-history/authored.csv'), join(fixture.workRoot, '01-history/removed.csv'));
    const collision = `${reportPath}.collision.tmp`;
    writeFileSync(collision, 'not owned');

    await expect(verifyBatch({
      batchId: '01-history', workRoot: fixture.workRoot,
      sourceDependencies: fixture.sourceDependencies,
      reportDependencies: { createTemporaryId: () => 'collision' },
    })).rejects.toThrow(/temporary/i);

    expect(readFileSync(collision, 'utf8')).toBe('not owned');
    expect(readFileSync(reportPath, 'utf8')).toBe(stale);
  }, 30_000);

  test('rejects a symlinked work report without changing its external target', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const fixture = createPassingWork(root);
    const reportPath = join(fixture.workRoot, '01-history/report.json');
    const outside = join(root, 'outside-report.json');
    writeFileSync(outside, 'outside bytes');
    symlinkSync(outside, reportPath, 'file');

    await expect(verifyBatch({
      batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: fixture.sourceDependencies,
    })).rejects.toThrow(/symlink/i);
    expect(readFileSync(outside, 'utf8')).toBe('outside bytes');
  }, 30_000);

  test('writes a deterministic passing report and checks each distinct supporting URL once', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const fixture = createPassingWork(root);
    const secondRoot = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const secondFixture = createPassingWork(secondRoot);
    let fetches = 0;
    const dependencies = { ...fixture.sourceDependencies, fetch: async () => {
      fetches += 1;
      return { status: 200, headers: new Headers() };
    } };

    const first = await verifyBatch({ batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: dependencies });
    const firstBytes = readFileSync(join(fixture.workRoot, '01-history', 'report.json'), 'utf8');
    const second = await verifyBatch({ batchId: '01-history', workRoot: secondFixture.workRoot, sourceDependencies: dependencies });
    const secondBytes = readFileSync(join(secondFixture.workRoot, '01-history', 'report.json'), 'utf8');

    expect(first.kind).toBe('verification');
    expect(second.kind).toBe('verification');
    if (first.kind !== 'verification' || second.kind !== 'verification') throw new Error('Expected full reports');
    expect(first.blocking).toBe(false);
    expect(second.blocking).toBe(false);
    expect(first.samples['easy/round-one']).toHaveLength(5);
    expect(firstBytes).toBe(secondBytes);
    expect(fetches).toBe(2);
  }, 30_000);

  test('publishes all four verified artifacts with the report last', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const fixture = createPassingWork(root);
    await verifyBatch({ batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: fixture.sourceDependencies });
    const acceptedRoot = join(root, 'accepted');
    seedAccepted(acceptedRoot);
    const destinations: string[] = [];

    await publishBatch({
      batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot,
      dependencies: { rename: (source, destination) => {
        renameSync(source, destination);
        if (source.endsWith('.tmp')) destinations.push(destination);
      } },
    });

    expect(destinations.at(-1)).toBe(join(acceptedRoot, 'content/reports/01-history.json'));
    expect(readFileSync(join(acceptedRoot, 'content/authored/01-history.csv')))
      .toEqual(readFileSync(join(fixture.workRoot, '01-history/authored.csv')));
    expect(readFileSync(join(acceptedRoot, 'content/generated/01-history.en-et.csv')))
      .toEqual(readFileSync(join(fixture.workRoot, '01-history/generated.en-et.csv')));
    expect(readFileSync(join(acceptedRoot, 'content/evidence/01-history.jsonl')))
      .toEqual(readFileSync(join(fixture.workRoot, '01-history/evidence.jsonl')));
    expect(readFileSync(join(acceptedRoot, 'content/reports/01-history.json')))
      .toEqual(readFileSync(join(fixture.workRoot, '01-history/report.json')));
  }, 30_000);

  test('publishes the exact report bytes that passed parsing even if the path is swapped afterward', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const { fixture, reportPath } = await passingReport(root);
    const verifiedBytes = readFileSync(reportPath);
    const acceptedRoot = join(root, 'accepted');
    seedAccepted(acceptedRoot);

    await publishBatch({
      batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot,
      dependencies: { afterReportRead: () => writeFileSync(reportPath, '{"swapped":true}\n') },
    });

    expect(readFileSync(join(acceptedRoot, 'content/reports/01-history.json'))).toEqual(verifiedBytes);
  }, 30_000);

  test('binds publication to exact artifact hashes without touching accepted bytes', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const fixture = createPassingWork(root);
    await verifyBatch({ batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: fixture.sourceDependencies });
    const acceptedRoot = join(root, 'accepted');
    const originals = seedAccepted(acceptedRoot);
    appendFileSync(join(fixture.workRoot, '01-history', 'authored.csv'), '\n');

    await expect(publishBatch({ batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot }))
      .rejects.toThrow(/artifact hash/i);

    expect(readFileSync(join(acceptedRoot, 'content/authored/01-history.csv'), 'utf8')).toBe(originals.authored);
    expect(readFileSync(join(acceptedRoot, 'content/generated/01-history.en-et.csv'), 'utf8')).toBe(originals.generated);
    expect(readFileSync(join(acceptedRoot, 'content/evidence/01-history.jsonl'), 'utf8')).toBe(originals.evidence);
    expect(readFileSync(join(acceptedRoot, 'content/reports/01-history.json'), 'utf8')).toBe(originals.report);
  }, 30_000);

  test('does not trust a false top-level blocking flag over failing strict report details', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const fixture = createPassingWork(root);
    await verifyBatch({ batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: fixture.sourceDependencies });
    const reportPath = join(fixture.workRoot, '01-history/report.json');
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    report.validations.generated.blocking = true;
    report.validations.generated.issues.push({
      file: 'generated.en-et.csv', row: 2, code: 'FORGED_FAILURE', severity: 'error', message: 'still failing',
    });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    const acceptedRoot = join(root, 'accepted');
    const originals = seedAccepted(acceptedRoot);

    await expect(publishBatch({ batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot }))
      .rejects.toThrow(/passing verification report/i);
    expect(readFileSync(join(acceptedRoot, 'content/generated/01-history.en-et.csv'), 'utf8')).toBe(originals.generated);
  }, 30_000);

  test('rejects forged modes, samples, and incoherent successful source results', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const { fixture, reportPath, report } = await passingReport(root);
    const acceptedRoot = join(root, 'accepted');
    const originals = seedAccepted(acceptedRoot);
    const original = JSON.parse(JSON.stringify(report)) as typeof report;
    const forgeries: Array<(candidate: typeof report) => void> = [
      (candidate) => { candidate.validations.generated.mode = 'release'; },
      (candidate) => { candidate.samples['easy/round-one'] = [...candidate.samples['easy/round-one']].reverse(); },
      (candidate) => { candidate.samples['easy/round-one'].pop(); },
      (candidate) => { candidate.samples['easy/round-one'][1] = candidate.samples['easy/round-one'][0]; },
      (candidate) => { candidate.samples.extra = ['history-clue-forged']; },
      (candidate) => { candidate.sources[0] = { ...candidate.sources[0], ok: true, status: 503, code: null }; },
      (candidate) => { candidate.sources[0] = { ...candidate.sources[0], ok: true, code: 'SOURCE_HTTP_STATUS' }; },
      (candidate) => { candidate.sources[0] = { ...candidate.sources[0], ok: true, retrievedAt: null }; },
      (candidate) => { candidate.sources[0] = { ...candidate.sources[0], ok: true, finalUrl: 'http://example.test/source' }; },
    ];

    for (const forge of forgeries) {
      const candidate = JSON.parse(JSON.stringify(original)) as typeof report;
      forge(candidate);
      writeFileSync(reportPath, `${JSON.stringify(candidate, null, 2)}\n`);
      await expect(publishBatch({ batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot }))
        .rejects.toThrow(/passing verification report/i);
    }
    expect(readFileSync(join(acceptedRoot, 'content/authored/01-history.csv'), 'utf8')).toBe(originals.authored);
  }, 60_000);

  test('records source failures as blocking without publishing accepted artifacts', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const fixture = createPassingWork(root);
    const report = await verifyBatch({
      batchId: '01-history', workRoot: fixture.workRoot,
      sourceDependencies: { ...fixture.sourceDependencies, fetch: async () => ({ status: 503, headers: new Headers() }) },
      sourceCheckOptions: { maxAttempts: 1 },
    });
    const acceptedRoot = join(root, 'accepted');
    const originals = seedAccepted(acceptedRoot);

    expect(report.kind).toBe('verification');
    if (report.kind !== 'verification') throw new Error('Expected a full blocking report');
    expect(report.blocking).toBe(true);
    expect(report.sources).toEqual([expect.objectContaining({ ok: false, status: 503 })]);
    await expect(publishBatch({ batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot }))
      .rejects.toThrow(/passing verification report/i);
    expect(readFileSync(join(acceptedRoot, 'content/authored/01-history.csv'), 'utf8')).toBe(originals.authored);
  }, 30_000);

  test.each([1, 2, 3, 4, 5, 6, 7, 8])('restores every accepted byte when rename phase %i fails', async (failurePhase) => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const fixture = createPassingWork(root);
    await verifyBatch({ batchId: '01-history', workRoot: fixture.workRoot, sourceDependencies: fixture.sourceDependencies });
    const acceptedRoot = join(root, 'accepted');
    const originals = seedAccepted(acceptedRoot);
    let renames = 0;

    await expect(publishBatch({
      batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot,
      dependencies: { rename: (source, destination) => {
        renames += 1;
        if (renames === failurePhase) throw new Error(`injected rename ${failurePhase}`);
        renameSync(source, destination);
      } },
    })).rejects.toThrow(`injected rename ${failurePhase}`);

    expect(readFileSync(join(acceptedRoot, 'content/authored/01-history.csv'), 'utf8')).toBe(originals.authored);
    expect(readFileSync(join(acceptedRoot, 'content/generated/01-history.en-et.csv'), 'utf8')).toBe(originals.generated);
    expect(readFileSync(join(acceptedRoot, 'content/evidence/01-history.jsonl'), 'utf8')).toBe(originals.evidence);
    expect(readFileSync(join(acceptedRoot, 'content/reports/01-history.json'), 'utf8')).toBe(originals.report);
    expect([...walkFiles(acceptedRoot)].some((path) => /\.(?:tmp|bak)$/.test(path))).toBe(false);
  }, 30_000);

  test('attempts every restore and preserves a backup whose restore fails', async () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const { fixture } = await passingReport(root);
    const acceptedRoot = join(root, 'accepted');
    const originals = seedAccepted(acceptedRoot);
    let forwardRenames = 0;
    const restores: string[] = [];

    await expect(publishBatch({
      batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot,
      dependencies: {
        createTemporaryId: () => 'rollback-test',
        rename: (source, destination) => {
          forwardRenames += 1;
          if (forwardRenames === 8) throw new Error('forward report failure');
          renameSync(source, destination);
        },
        restore: (source, destination) => {
          restores.push(destination);
          if (destination.endsWith('01-history.csv')) throw new Error('authored restore failure');
          renameSync(source, destination);
        },
      },
    })).rejects.toThrow(/rollback.*authored restore failure/i);

    expect(restores).toHaveLength(4);
    expect(existsSync(`${join(acceptedRoot, 'content/authored/01-history.csv')}.rollback-test.bak`)).toBe(true);
    expect(readFileSync(join(acceptedRoot, 'content/generated/01-history.en-et.csv'), 'utf8')).toBe(originals.generated);
    expect(readFileSync(join(acceptedRoot, 'content/evidence/01-history.jsonl'), 'utf8')).toBe(originals.evidence);
    expect(readFileSync(join(acceptedRoot, 'content/reports/01-history.json'), 'utf8')).toBe(originals.report);
  }, 30_000);

  test.each(['tmp', 'bak'])('preserves a pre-existing publisher %s collision', async (suffix) => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-batch-'));
    const { fixture } = await passingReport(root);
    const acceptedRoot = join(root, 'accepted');
    seedAccepted(acceptedRoot);
    const collision = `${join(acceptedRoot, 'content/authored/01-history.csv')}.collision.${suffix}`;
    writeFileSync(collision, 'not owned');

    await expect(publishBatch({
      batchId: '01-history', workRoot: fixture.workRoot, acceptedRoot,
      dependencies: { createTemporaryId: () => 'collision' },
    })).rejects.toThrow();

    expect(readFileSync(collision, 'utf8')).toBe('not owned');
  }, 30_000);
});

function* walkFiles(root: string): Generator<string> {
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) yield join(entry.parentPath, entry.name);
  }
}
