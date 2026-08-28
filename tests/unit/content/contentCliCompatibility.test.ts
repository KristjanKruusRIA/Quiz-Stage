import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { stringify } from 'csv-stringify/sync';
import { describe, expect, test } from 'vitest';
import { runSourceCheckCli } from '../../../scripts/content/sourceCheck';
import { parsePackCsv } from '../../../src/main/content/csvPacks';

function runNpm(script: string, args: readonly string[]) {
  const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
  const command = `npm run ${script} -- ${args.map(quote).join(' ')}`;
  return spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    cwd: resolve('.'), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
  });
}

function writePrivateSourceInput(path: string): void {
  const [header, template] = readFileSync('tests/fixtures/content-invalid/release-shortage.csv', 'utf8')
    .trim().split(/\r?\n/);
  const rows = Array.from({ length: 5 }, (_, index) => {
    const columns = template.split(',');
    columns[0] = `source-${index + 1}`;
    columns[6] = String(index + 1);
    columns[11] = `A stable source clue ${index + 1}`;
    columns[13] = `Answer ${index + 1}`;
    columns[17] = `Explanation ${index + 1}`;
    columns[20] = 'https://127.0.0.1/source';
    return columns.join(',');
  });
  writeFileSync(path, `${header}\n${rows.join('\n')}\n`);
}

describe('npm 11 content CLI compatibility', () => {
  test('worklist builder reconstructs the documented batch and output arguments', () => {
    mkdirSync(resolve('content/work'), { recursive: true });
    const directory = mkdtempSync(resolve('content/work/quiz-stage-worklist-cli-'));
    const output = join(directory, 'worklist.jsonl');

    try {
      const result = runNpm('content:build-worklist', [
        '--batch', '02-geography', '--output', output,
      ]);

      const inputs = ['content/imports/opentdb-candidates.jsonl', 'content/imports/wikidata-candidates.jsonl'];
      if (inputs.every((path) => existsSync(path))) {
        expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
        const expectedRows = inputs.reduce((sum, path) => (
          sum + readFileSync(path, 'utf8').trim().split(/\r?\n/).length
        ), 0);
        const rows = readFileSync(output, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
        expect(rows).toHaveLength(expectedRows);
        expect(rows.every((row) => row.batchId === '02-geography')).toBe(true);
      } else {
        expect(result.status).not.toBe(0);
        expect(result.stderr).not.toMatch(/unknown argument/i);
        expect(result.stderr).toMatch(/ENOENT|no such file/i);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }, 20_000);

  test('validator reconstructs the documented batch input, evidence, batch, mode, and report', () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-validate-cli-'));
    const report = join(directory, 'report.json');
    const result = runNpm('content:validate', [
      '--input', 'tests/fixtures/content-invalid/release-shortage.csv',
      '--evidence', 'tests/fixtures/content-quality/evidence-valid.jsonl',
      '--batch', '01-history', '--mode', 'batch', '--report', report,
    ]);

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
    const parsed = JSON.parse(readFileSync(report, 'utf8'));
    expect(parsed.validation.mode).toBe('batch');
    expect(parsed.validation.blocking).toBe(true);
    expect(parsed.validation.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'BATCH_ALLOCATION' }),
    ]));
    expect(parsed.validation.issues.every((issue: { file: string }) => !isAbsolute(issue.file))).toBe(true);
  }, 20_000);

  test('seed builder reconstructs the documented input, evidence, output, and report arguments', () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-seed-cli-'));
    const result = runNpm('content:build-seed', [
      '--input', join(directory, 'missing.csv'),
      '--evidence', join(directory, 'missing.jsonl'),
      '--output', join(directory, 'seed.sqlite'),
      '--report', join(directory, 'report.json'),
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toMatch(/unknown argument/i);
    expect(result.stderr).toMatch(/ENOENT|no such file|matched no files/i);
  }, 20_000);

  test('source checker merges completed failures into the report and writes the exact source-cache file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-source-cli-'));
    const input = join(directory, 'input.csv');
    const report = join(directory, 'report.json');
    const cache = join(directory, 'source-cache.json');
    writePrivateSourceInput(input);
    writeFileSync(report, '{"validation":{"retained":true},"sibling":"keep"}\n');

    const result = runNpm('content:source-check', [
      '--input', input, '--report', report, '--source-cache', cache,
    ]);

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
    expect(statSync(cache).isFile()).toBe(true);
    expect(JSON.parse(readFileSync(cache, 'utf8'))).toEqual({ version: 1, entries: {} });
    expect(JSON.parse(readFileSync(report, 'utf8'))).toEqual({
      validation: { retained: true }, sibling: 'keep',
      sources: [{
        url: 'https://127.0.0.1/source', ok: false, status: null, retrievedAt: null,
        code: 'SOURCE_PRIVATE_ADDRESS', finalUrl: null,
      }],
    });
  }, 20_000);

  test('source checker retains direct --cache compatibility without a report', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-source-direct-'));
    const input = join(directory, 'input.csv');
    const cache = join(directory, 'source-cache.json');
    writePrivateSourceInput(input);

    await expect(runSourceCheckCli(['--input', input, '--cache', cache])).resolves.toBe(1);
    expect(statSync(cache).isFile()).toBe(true);
    expect(JSON.parse(readFileSync(cache, 'utf8'))).toEqual({ version: 1, entries: {} });
  });

  test('source checker accepts the catalogued multi-pack Finals artifact', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-source-finals-'));
    const input = join(directory, '13-finals.en-et.csv');
    const cache = join(directory, 'source-cache.json');
    const finalsBytes = readFileSync('content/generated/13-finals.en-et.csv', 'utf8');
    const columns = finalsBytes.slice(0, finalsBytes.indexOf('\n')).trimEnd().split(',');
    const rows = parsePackCsv(finalsBytes).rows;
    const sample = [
      rows.find((row: { pack_id: string }) => row.pack_id === 'built-in-finals'),
      rows.find((row: { pack_id: string }) => row.pack_id === 'built-in-adult'),
    ].map((row) => ({ ...row, source_url: 'https://127.0.0.1/source' }));
    writeFileSync(input, stringify(sample, { header: true, columns }));

    await expect(runSourceCheckCli(['--input', input, '--cache', cache])).resolves.toBe(1);
    expect(JSON.parse(readFileSync(cache, 'utf8'))).toEqual({ version: 1, entries: {} });
  });

  test('source checker leaves the existing report unchanged on input preflight failure', () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-source-preflight-'));
    const report = join(directory, 'report.json');
    const cache = join(directory, 'source-cache.json');
    const prior = '{"validation":{"retained":true}}\n';
    writeFileSync(report, prior);

    const result = runNpm('content:source-check', [
      '--input', join(directory, 'missing.csv'), '--report', report, '--source-cache', cache,
    ]);

    expect(result.status).toBe(1);
    expect(readFileSync(report, 'utf8')).toBe(prior);
  }, 20_000);

  test('source checker rejects report symlinks and non-file cache destinations before publication', () => {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-source-paths-'));
    const input = join(directory, 'input.csv');
    const target = join(directory, 'target.json');
    const reportLink = join(directory, 'report-link.json');
    const cacheDirectory = join(directory, 'cache-directory');
    const report = join(directory, 'report.json');
    const prior = '{"validation":{"retained":true}}\n';
    writePrivateSourceInput(input);
    writeFileSync(target, prior);
    symlinkSync(target, reportLink, 'file');
    mkdirSync(cacheDirectory);

    const linked = runNpm('content:source-check', [
      '--input', input, '--report', reportLink, '--source-cache', join(directory, 'unused-cache.json'),
    ]);
    expect(linked.status).toBe(1);
    expect(readFileSync(target, 'utf8')).toBe(prior);

    writeFileSync(report, prior);
    const nonFileCache = runNpm('content:source-check', [
      '--input', input, '--report', report, '--source-cache', cacheDirectory,
    ]);
    expect(nonFileCache.status).toBe(1);
    expect(readFileSync(report, 'utf8')).toBe(prior);
    expect(statSync(cacheDirectory).isDirectory()).toBe(true);
  }, 20_000);
});
