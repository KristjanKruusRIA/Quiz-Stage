import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';
import { parsePackCsv } from '../../../src/main/content/csvPacks';
import {
  publishValidationReport,
  validateProductionContent,
  type ProductionValidationInput,
} from '../../../scripts/content/validate';
import { resolveCsvInputFiles } from '../../../scripts/content/readCsv';
import {
  buildWikidataBatchUrls,
  checkSourceUrls,
  createMemorySourceCache,
  type SourceCheckDependencies,
} from '../../../scripts/content/sourceCheck';

type Row = Record<(typeof CSV_COLUMNS)[number], string>;

const temporaryDirectories: string[] = [];

afterEach(async () => {
  const { rmSync } = await import('node:fs');
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-production-validator-'));
  temporaryDirectories.push(directory);
  return directory;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function csv(rows: readonly Row[]): string {
  return [CSV_COLUMNS, ...rows.map((row) => CSV_COLUMNS.map((column) => row[column]))]
    .map((cells) => cells.map(csvCell).join(','))
    .join('\n');
}

function boardRow(setIndex: number, tier: number, overrides: Partial<Row> = {}): Row {
  const difficulty = (['easy', 'medium', 'hard'] as const)[setIndex % 3];
  const round = setIndex % 2 === 0 ? 'round-one' : 'round-two';
  return {
    clue_id: `clue-${setIndex}-${tier}`,
    pack_id: 'pack-production',
    pack_name: 'Production Pack',
    category_set_id: `set-${setIndex}`,
    content_kind: 'board',
    round,
    tier: String(tier),
    difficulty,
    macro_topic: `topic-${setIndex % 12}`,
    category_name_en: `Category ${setIndex}`,
    category_name_et: `Kategooria ${setIndex}`,
    clue_en: `In 2026, clue ${setIndex} tier ${tier}`,
    clue_et: `2026. aastal vihje ${setIndex} tase ${tier}`,
    response_en: `Response ${setIndex}-${tier}`,
    response_et: `Vastus ${setIndex}-${tier}`,
    accepted_variants_en: '',
    accepted_variants_et: '',
    explanation_en: `Explanation ${setIndex}-${tier}`,
    explanation_et: `Selgitus ${setIndex}-${tier}`,
    source_title: 'Example Source',
    source_url: `https://example.com/source/${setIndex}/${tier}`,
    source_license: 'CC0-1.0',
    source_retrieved_at: '2026-08-12',
    translation_status: 'reviewed',
    enabled: 'true',
    ...overrides,
  };
}

function finalRow(index: number): Row {
  return boardRow(20_000 + index, 0, {
    clue_id: `final-${index}`,
    category_set_id: `final-set-${index}`,
    content_kind: 'final',
    round: 'final',
    tier: '0',
    difficulty: (['easy', 'medium', 'hard'] as const)[index % 3],
    macro_topic: `final-topic-${index % 12}`,
    category_name_en: `Final Category ${index}`,
    category_name_et: `Finaalkategooria ${index}`,
  });
}

function input(file: string, rows: readonly Row[]): ProductionValidationInput {
  return { file, pack: parsePackCsv(csv(rows)) };
}

function twelveValidSets(): Row[] {
  return Array.from({ length: 12 }, (_, setIndex) =>
    Array.from({ length: 5 }, (_, tierIndex) => boardRow(setIndex, tierIndex + 1))).flat();
}

describe('production content validation', () => {
  it.each([
    ['missing-tier.csv', 'MISSING_TIER'],
    ['duplicate-id.csv', 'DUPLICATE_ID'],
    ['duplicate-text.csv', 'DUPLICATE_CLUE_TEXT'],
    ['duplicate-category.csv', 'DUPLICATE_CATEGORY_NAME'],
    ['invalid-round.csv', 'INVALID_ROUND'],
    ['missing-source.csv', 'MISSING_SOURCE'],
    ['undated-changing-fact.csv', 'UNDATED_CHANGING_FACT'],
    ['missing-translation.csv', 'MISSING_TRANSLATION'],
    ['number-drift.csv', 'NUMBER_DRIFT'],
    ['release-shortage.csv', 'RELEASE_BOARD_CLUES_SHORTAGE'],
  ])('fixture %s independently emits %s', (fixture, code) => {
    const file = resolve('tests/fixtures/content-invalid', fixture);
    const result = validateProductionContent([
      { file, pack: parsePackCsv(readFileSync(file, 'utf8')) },
    ], { mode: fixture === 'release-shortage.csv' ? 'release' : 'batch' });

    expect(result.issues.map((issue) => issue.code)).toContain(code);
  });

  it('finds duplicate identities and normalized content across files in stable byte order', () => {
    const rows = twelveValidSets();
    const duplicate = boardRow(99, 1, {
      clue_id: rows[0].clue_id,
      category_set_id: 'set-99',
      category_name_en: `  ${rows[5].category_name_en.toUpperCase()}  `,
      clue_en: `  ${rows[1].clue_en.toUpperCase()}  `,
    });
    const a = validateProductionContent([input('z.csv', [duplicate]), input('a.csv', rows)], { mode: 'batch' });
    const b = validateProductionContent([input('a.csv', rows), input('z.csv', [duplicate])], { mode: 'batch' });

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'DUPLICATE_ID', 'DUPLICATE_CLUE_TEXT', 'DUPLICATE_CATEGORY_NAME',
    ]));
  });

  it('applies the missing-Estonian exception only in batch and records its exact ID', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_et: '', translation_status: 'untranslated' };
    const strict = validateProductionContent([input('batch.csv', rows)], { mode: 'batch' });
    const allowed = validateProductionContent([input('batch.csv', rows)], {
      mode: 'batch', allowMissingEt: true,
    });

    expect(strict.blocking).toBe(true);
    expect(allowed.blocking, JSON.stringify(allowed.issues.filter((issue) => issue.severity === 'error'))).toBe(false);
    expect(allowed.exceptions).toEqual([
      expect.objectContaining({ id: 'missing-et:clue-0-1', code: 'MISSING_TRANSLATION' }),
    ]);
    expect(() => validateProductionContent([input('release.csv', rows)], {
      mode: 'release', allowMissingEt: true,
    })).toThrow(/batch mode/i);
  });

  it('normalizes decimal and thousands formatting while detecting real numeric drift', () => {
    const rows = twelveValidSets();
    rows[0] = { ...rows[0], clue_en: 'The length is 1,000 km and the ratio is 1.5.', clue_et: 'Pikkus on 1 000 km ja suhe 1,5.' };
    rows[1] = { ...rows[1], clue_en: 'The launch year was 1969.', clue_et: 'Stardiaasta oli 1968.' };
    const result = validateProductionContent([input('numbers.csv', rows)], { mode: 'batch' });

    expect(result.issues.filter((issue) => issue.code === 'NUMBER_DRIFT').map((issue) => issue.row)).toEqual([3]);
  });

  it('emits every release threshold shortage independently', () => {
    const rows = twelveValidSets();
    const result = validateProductionContent([input('short.csv', rows)], { mode: 'release' });
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'RELEASE_BOARD_CLUES_SHORTAGE',
      'RELEASE_CATEGORY_SETS_SHORTAGE',
      'RELEASE_CATEGORY_NAMES_SHORTAGE',
      'RELEASE_FINAL_CLUES_SHORTAGE',
      'RELEASE_EASY_SETS_SHORTAGE',
      'RELEASE_MEDIUM_SETS_SHORTAGE',
      'RELEASE_HARD_SETS_SHORTAGE',
    ]));
  });

  it('summarizes an exact valid 6000/1200/150 inventory efficiently', () => {
    const board = Array.from({ length: 1_200 }, (_, setIndex) =>
      Array.from({ length: 5 }, (_, tierIndex) => boardRow(setIndex, tierIndex + 1))).flat();
    const finals = Array.from({ length: 150 }, (_, index) => finalRow(index));

    const result = validateProductionContent([input('release.csv', [...board, ...finals])], { mode: 'release' });

    expect(result.summary).toEqual({
      boardClues: 6000, categorySets: 1200, distinctCategoryNames: 1200,
      finalClues: 150, easySets: 400, mediumSets: 400, hardSets: 400,
    });
    expect(result.blocking, JSON.stringify(result.issues.filter((issue) => issue.severity === 'error').slice(0, 20))).toBe(false);
  }, 15_000);

  it('promotes unreviewed translation warnings in release with stable exception IDs', () => {
    const rows = Array.from({ length: 1_200 }, (_, setIndex) =>
      Array.from({ length: 5 }, (_, tierIndex) => boardRow(setIndex, tierIndex + 1))).flat();
    rows[0] = { ...rows[0], explanation_et: rows[0].explanation_en };
    const finals = Array.from({ length: 150 }, (_, index) => finalRow(index));
    const first = validateProductionContent([input('release.csv', [...rows, ...finals])], { mode: 'release' });
    const warning = first.issues.find((issue) => issue.code === 'UNCHANGED_TRANSLATION');

    expect(warning).toMatchObject({ severity: 'error', exceptionId: 'translation:UNCHANGED_TRANSLATION:clue-0-1' });
    const reviewed = validateProductionContent([input('release.csv', [...rows, ...finals])], {
      mode: 'release', reviewedExceptionIds: [warning!.exceptionId!],
    });
    expect(reviewed.issues.find((issue) => issue.code === 'UNCHANGED_TRANSLATION')?.severity).toBe('warning');
  }, 15_000);
});

describe('validator CLI boundaries and report publication', () => {
  const npmCli = process.env.npm_execpath;

  it('supports the documented npm flag invocation and writes a stable blocking report', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'invalid.json');
    const args = ['run', 'content:validate', '--', '--input', 'tests/fixtures/content-invalid/*.csv', '--mode', 'batch', '--report', report];
    expect(npmCli).toBeTruthy();
    const first = spawnSync(process.execPath, [npmCli!, ...args], { cwd: resolve('.'), encoding: 'utf8' });
    expect(first.status, first.stderr).toBe(1);
    const firstBytes = readFileSync(report, 'utf8');
    const parsed = JSON.parse(firstBytes);
    expect(parsed.validation.blocking).toBe(true);
    expect(parsed.validation.issues.map((issue: { code: string }) => issue.code)).toEqual(expect.arrayContaining([
      'MISSING_TIER', 'DUPLICATE_ID', 'DUPLICATE_CLUE_TEXT', 'DUPLICATE_CATEGORY_NAME',
      'INVALID_ROUND', 'MISSING_SOURCE', 'UNDATED_CHANGING_FACT', 'MISSING_TRANSLATION', 'NUMBER_DRIFT',
    ]));
    const second = spawnSync(process.execPath, [npmCli!, ...args], { cwd: resolve('.'), encoding: 'utf8' });
    expect(second.status, second.stderr).toBe(1);
    expect(readFileSync(report, 'utf8')).toBe(firstBytes);
  }, 20_000);

  it('rejects release --allow-missing-et before report publication', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'release.json');
    const result = spawnSync(process.execPath, [npmCli!,
      'run', 'content:validate', '--', '--allow-missing-et', '--input',
      'tests/fixtures/content-invalid/missing-translation.csv', '--mode', 'release', '--report', report,
    ], { cwd: resolve('.'), encoding: 'utf8' });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/batch mode/i);
    expect(() => readFileSync(report)).toThrow();
  });

  it('accepts an exact valid synthetic release corpus through the documented CLI', () => {
    const directory = temporaryDirectory();
    const source = join(directory, 'release.csv');
    const report = join(directory, 'release.json');
    const board = Array.from({ length: 1_200 }, (_, setIndex) =>
      Array.from({ length: 5 }, (_, tierIndex) => boardRow(setIndex, tierIndex + 1))).flat();
    writeFileSync(source, csv([...board, ...Array.from({ length: 150 }, (_, index) => finalRow(index))]));
    const result = spawnSync(process.execPath, [npmCli!, 'run', 'content:validate', '--',
      '--input', source, '--mode', 'release', '--report', report,
    ], { cwd: resolve('.'), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(JSON.parse(readFileSync(report, 'utf8')).validation.summary).toEqual({
      boardClues: 6000, categorySets: 1200, distinctCategoryNames: 1200,
      finalClues: 150, easySets: 400, mediumSets: 400, hardSets: 400,
    });
  }, 20_000);

  it('resolves BOM/malformed/duplicate globs deterministically and rejects no matches', async () => {
    const directory = temporaryDirectory();
    writeFileSync(join(directory, 'b.csv'), csv(twelveValidSets()));
    writeFileSync(join(directory, 'a.csv'), `\uFEFF${csv(twelveValidSets())}`);
    expect(await resolveCsvInputFiles([join(directory, '*.csv'), join(directory, 'a.csv')]))
      .toEqual([join(directory, 'a.csv'), join(directory, 'b.csv')]);
    await expect(resolveCsvInputFiles([join(directory, 'missing-*.csv')])).rejects.toThrow(/matched no files/i);
  });

  it('atomically merges validation while preserving siblings and rejects symlink destinations', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'report.json');
    writeFileSync(report, JSON.stringify({ translation: { retained: true } }));
    publishValidationReport(report, { mode: 'batch', blocking: false, summary: {}, issues: [], exceptions: [] });
    expect(JSON.parse(readFileSync(report, 'utf8'))).toEqual({
      translation: { retained: true },
      validation: { mode: 'batch', blocking: false, summary: {}, issues: [], exceptions: [] },
    });

    const link = join(directory, 'linked.json');
    symlinkSync(report, link, 'file');
    expect(() => publishValidationReport(link, { safe: false })).toThrow(/symlink/i);
    expect(JSON.parse(readFileSync(report, 'utf8')).translation.retained).toBe(true);
  });

  it('preserves the prior report when temporary write or rename fails', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'report.json');
    writeFileSync(report, '{"prior":true}\n');
    expect(() => publishValidationReport(report, { changed: true }, {
      rename: () => { throw new Error('forced rename failure'); },
    })).toThrow(/forced rename failure/);
    expect(readFileSync(report, 'utf8')).toBe('{"prior":true}\n');
  });

  it('does not follow a colliding temporary name when publishing a report', () => {
    const directory = temporaryDirectory();
    const report = join(directory, 'report.json');
    writeFileSync(`${report}.collision.tmp`, 'owned by another process');
    const ids = ['collision', 'safe'];
    publishValidationReport(report, { safe: true }, { createTemporaryId: () => ids.shift()! });
    expect(JSON.parse(readFileSync(report, 'utf8')).validation).toEqual({ safe: true });
    expect(readFileSync(`${report}.collision.tmp`, 'utf8')).toBe('owned by another process');
  });
});

describe('source checker', () => {
  function dependencies(fetchImpl: SourceCheckDependencies['fetch']): SourceCheckDependencies {
    return {
      fetch: fetchImpl,
      resolveHostname: async () => ['93.184.216.34'],
      now: () => new Date('2026-08-12T12:00:00.000Z'),
      sleep: async () => undefined,
    };
  }

  it('rejects non-HTTPS, credentials, official archives, localhost, private DNS, and redirect escapes', async () => {
    const neverFetch = async () => { throw new Error('fetch should not run'); };
    const direct = await checkSourceUrls([
      'http://example.com', 'https://u:p@example.com', 'https://j-archive.com/showgame.php?game_id=1',
      'https://localhost/source',
    ], dependencies(neverFetch));
    expect(Object.fromEntries(direct.map((result) => [result.url, result.code]))).toEqual({
      'http://example.com': 'SOURCE_URL_NOT_HTTPS',
      'https://u:p@example.com': 'SOURCE_URL_CREDENTIALS',
      'https://j-archive.com/showgame.php?game_id=1': 'OFFICIAL_ARCHIVE_HOST',
      'https://localhost/source': 'SOURCE_PRIVATE_ADDRESS',
    });

    const privateDns = dependencies(neverFetch);
    privateDns.resolveHostname = async () => ['10.0.0.1'];
    expect((await checkSourceUrls(['https://example.com'], privateDns))[0].code).toBe('SOURCE_PRIVATE_ADDRESS');

    const redirect = dependencies(async () => ({ status: 302, headers: new Headers({ location: 'https://127.0.0.1/private' }) }));
    expect((await checkSourceUrls(['https://example.com'], redirect))[0].code).toBe('SOURCE_PRIVATE_ADDRESS');
  });

  it('uses bounded retries/backoff, timeout signal, UA, concurrency, and caches successful metadata only', async () => {
    let attempts = 0;
    let active = 0;
    let maxActive = 0;
    const seenHeaders: string[] = [];
    const deps = dependencies(async (_url, init) => {
      active += 1; maxActive = Math.max(maxActive, active);
      seenHeaders.push(new Headers(init?.headers).get('user-agent') ?? '');
      expect(init?.redirect).toBe('manual');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      attempts += 1;
      await Promise.resolve();
      active -= 1;
      return { status: attempts <= 2 ? 503 : 204, headers: new Headers() };
    });
    const cache = createMemorySourceCache();
    const first = await checkSourceUrls(['https://example.com/a', 'https://example.com/b'], deps, {
      concurrency: 1, maxAttempts: 3, cache,
    });
    expect(maxActive).toBe(1);
    expect(seenHeaders.every((value) => value.includes('Quiz Stage'))).toBe(true);
    expect(first.every((result) => !('body' in result))).toBe(true);
    const before = attempts;
    await checkSourceUrls(['https://example.com/a', 'https://example.com/b'], deps, { cache });
    expect(attempts).toBe(before);
  });

  it('does not cache failures and ignores expired or incompatible successful entries', async () => {
    let requests = 0;
    const deps = dependencies(async () => {
      requests += 1;
      return { status: requests === 1 ? 404 : 204, headers: new Headers() };
    });
    const cache = createMemorySourceCache({
      'https://example.com/expired': {
        version: 1, expiresAt: '2026-08-11T00:00:00.000Z',
        result: { url: 'https://example.com/expired', ok: true, status: 204, retrievedAt: '2026-08-10T00:00:00.000Z', code: null, finalUrl: 'https://example.com/expired' },
      },
      'https://example.com/old-version': {
        version: 0, expiresAt: '2026-08-13T00:00:00.000Z',
        result: { url: 'https://example.com/old-version', ok: true, status: 204, retrievedAt: '2026-08-10T00:00:00.000Z', code: null, finalUrl: 'https://example.com/old-version' },
      },
    });
    expect((await checkSourceUrls(['https://example.com/failure'], deps, { cache }))[0].ok).toBe(false);
    expect((await checkSourceUrls(['https://example.com/failure'], deps, { cache }))[0].ok).toBe(true);
    await checkSourceUrls(['https://example.com/expired', 'https://example.com/old-version'], deps, { cache });
    expect(requests).toBe(4);
  });

  it('batches Wikidata entities through the official API under count and URL caps', () => {
    const ids = Array.from({ length: 121 }, (_, index) => `Q${index + 1}`);
    const urls = buildWikidataBatchUrls(ids, { maxEntities: 50, maxUrlLength: 500 });
    expect(urls.length).toBeGreaterThan(2);
    for (const url of urls) {
      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://www.wikidata.org');
      expect(parsed.pathname).toBe('/w/api.php');
      expect((parsed.searchParams.get('ids') ?? '').split('|').length).toBeLessThanOrEqual(50);
      expect(url.length).toBeLessThanOrEqual(500);
    }
  });
});
