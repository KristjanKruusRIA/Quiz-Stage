import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import {
  THIRD_PARTY_NOTICE_PATH,
  assertCandidateOutputPath,
  assertWorkOutputPath,
} from '../../../scripts/content/candidatePaths';
import {
  buildAuthoringWorklist,
  runBuildAuthoringWorklist,
} from '../../../scripts/content/buildAuthoringWorklist';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(root: 'imports' | 'work'): string {
  const parent = resolve(`content/${root}`);
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(resolve(parent, '.task-6-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

function foreignTemporaryDirectory(): string {
  const directory = mkdtempSync(resolve(tmpdir(), 'quiz-stage-task-6-foreign-'));
  temporaryDirectories.push(directory);
  return directory;
}

function tsxImportUrl(): string {
  return pathToFileURL(resolve('node_modules/tsx/dist/loader.mjs')).href;
}

describe('candidate and authoring-work destination boundaries', () => {
  it('rejects traversal, accepted-content, and prefix-collision candidate paths', () => {
    expect(() => assertCandidateOutputPath(resolve('content/authored/01-history.csv')))
      .toThrow(/content[\\/]imports/i);
    expect(() => assertCandidateOutputPath(resolve('content/imports/../../resources/content/seed.sqlite')))
      .toThrow(/content[\\/]imports/i);
    expect(() => assertCandidateOutputPath(resolve('content/imports-collision/candidates.jsonl')))
      .toThrow(/content[\\/]imports/i);
  });

  it('rejects accepted-content and prefix-collision work paths', () => {
    expect(() => assertWorkOutputPath(resolve('content/generated/01-history.en-et.csv')))
      .toThrow(/content[\\/]work/i);
    expect(() => assertWorkOutputPath(resolve('content/work-collision/01-history/worklist.jsonl')))
      .toThrow(/content[\\/]work/i);
  });

  it('rejects existing symlink targets and symlinked ancestors', () => {
    const directory = temporaryDirectory('imports');
    const realDirectory = resolve(directory, 'real');
    const linkedDirectory = resolve(directory, 'linked');
    mkdirSync(realDirectory);
    symlinkSync(realDirectory, linkedDirectory, 'junction');

    expect(() => assertCandidateOutputPath(linkedDirectory)).toThrow(/symbolic link/i);
    expect(() => assertCandidateOutputPath(resolve(linkedDirectory, 'candidates.jsonl')))
      .toThrow(/symbolic link/i);
  });

  it('accepts ordinary descendants of the candidate and work roots', () => {
    expect(assertCandidateOutputPath(resolve('content/imports/opentdb-candidates.jsonl')))
      .toBe(resolve('content/imports/opentdb-candidates.jsonl'));
    expect(assertWorkOutputPath(resolve('content/work/01-history/worklist.jsonl')))
      .toBe(resolve('content/work/01-history/worklist.jsonl'));
  });

  it('rejects a foreign content tree when the exported guards run from that CWD', () => {
    const foreignDirectory = foreignTemporaryDirectory();
    const moduleUrl = pathToFileURL(resolve('scripts/content/candidatePaths.ts')).href;
    const script = [
      `import { assertCandidateOutputPath } from ${JSON.stringify(moduleUrl)};`,
      `process.chdir(${JSON.stringify(foreignDirectory)});`,
      "assertCandidateOutputPath(resolve('content/imports/candidates.jsonl'));",
    ].join('\n');
    const result = spawnSync(process.execPath, ['--import', tsxImportUrl(), '--input-type=module', '--eval', `import { resolve } from 'node:path';\n${script}`], {
      cwd: foreignDirectory,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/content[\\/]imports/i);
  });

  it('rejects a foreign content/work output through the CLI', () => {
    const foreignDirectory = foreignTemporaryDirectory();
    const script = resolve('scripts/content/buildAuthoringWorklist.ts');
    const output = resolve(foreignDirectory, 'content/work/01-history/worklist.jsonl');
    const result = spawnSync(process.execPath, [
      '--import', tsxImportUrl(), script, '--batch', '01-history', '--output', output,
    ], { cwd: foreignDirectory, encoding: 'utf8' });

    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/content[\\/]work/i);
    expect(existsSync(output)).toBe(false);
  });

  it('keeps the legal-notice destination repository-anchored from a foreign CWD', () => {
    const foreignDirectory = foreignTemporaryDirectory();
    const moduleUrl = pathToFileURL(resolve('scripts/content/candidatePaths.ts')).href;
    const result = spawnSync(process.execPath, [
      '--import', tsxImportUrl(), '--input-type=module', '--eval',
      `import { THIRD_PARTY_NOTICE_PATH } from ${JSON.stringify(moduleUrl)}; process.stdout.write(THIRD_PARTY_NOTICE_PATH);`,
    ], { cwd: foreignDirectory, encoding: 'utf8' });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe(THIRD_PARTY_NOTICE_PATH);
    expect(result.stdout).toBe(resolve('content/THIRD_PARTY_NOTICES.md'));
  });
});

describe('unpublished authoring worklists', () => {
  it('preserves candidate inputs and writes byte-identical, deterministically sorted worklists', () => {
    const importsDirectory = temporaryDirectory('imports');
    const workDirectory = temporaryDirectory('work');
    const openTdbInput = resolve(importsDirectory, 'opentdb.jsonl');
    const wikidataInput = resolve(importsDirectory, 'wikidata.jsonl');
    const output = resolve(workDirectory, 'worklist.jsonl');
    const openTdbBytes = [
      JSON.stringify({
        candidateId: 'opentdb:z', sourceId: 'opentdb:z', question: 'Question Z?', answer: 'Answer Z',
        sourceUrl: 'https://opentdb.com/',
      }),
      JSON.stringify({
        candidateId: 'opentdb:a', sourceId: 'opentdb:a', question: 'Question A?', answer: 'Answer A',
        sourceUrl: 'https://opentdb.com/',
      }),
    ].join('\n') + '\n';
    const wikidataBytes = [
      JSON.stringify({
        candidateId: 'wikidata:b', sourceId: 'wikidata:b', entityId: 'Q2', entityLabel: 'Entity B',
        propertyId: 'P31', propertyLabel: 'instance of', value: 'value b', normalizedFactKey: 'Q2|P31|value b',
        sourceUrl: 'https://www.wikidata.org/wiki/Q2',
      }),
      JSON.stringify({
        candidateId: 'wikidata:a', sourceId: 'wikidata:a', entityId: 'Q1', entityLabel: 'Entity A',
        propertyId: 'P31', propertyLabel: 'instance of', value: 'value a', normalizedFactKey: 'Q1|P31|value a',
        sourceUrl: 'https://www.wikidata.org/wiki/Q1',
      }),
    ].join('\n') + '\n';
    writeFileSync(openTdbInput, openTdbBytes);
    writeFileSync(wikidataInput, wikidataBytes);

    buildAuthoringWorklist({ batchId: '01-history', openTdbInput, wikidataInput, output });
    const firstOutput = readFileSync(output, 'utf8');
    buildAuthoringWorklist({ batchId: '01-history', openTdbInput, wikidataInput, output });

    expect(readFileSync(openTdbInput, 'utf8')).toBe(openTdbBytes);
    expect(readFileSync(wikidataInput, 'utf8')).toBe(wikidataBytes);
    expect(readFileSync(output, 'utf8')).toBe(firstOutput);
    expect(firstOutput).toBe([
      '{"batchId":"01-history","candidateId":"opentdb:a","origin":"openTdbInspired","rawFact":"Question A? | Answer: Answer A","factKey":null,"sourceId":"opentdb:a","sourceUrl":"https://opentdb.com/","selected":false}',
      '{"batchId":"01-history","candidateId":"opentdb:z","origin":"openTdbInspired","rawFact":"Question Z? | Answer: Answer Z","factKey":null,"sourceId":"opentdb:z","sourceUrl":"https://opentdb.com/","selected":false}',
      '{"batchId":"01-history","candidateId":"wikidata:a","origin":"wikidata","rawFact":"Entity A (Q1) | instance of (P31) | value a","factKey":"Q1|P31|value a","sourceId":"wikidata:a","sourceUrl":"https://www.wikidata.org/wiki/Q1","selected":false}',
      '{"batchId":"01-history","candidateId":"wikidata:b","origin":"wikidata","rawFact":"Entity B (Q2) | instance of (P31) | value b","factKey":"Q2|P31|value b","sourceId":"wikidata:b","sourceUrl":"https://www.wikidata.org/wiki/Q2","selected":false}',
      '',
    ].join('\n'));
  });

  it('rejects missing and unknown batch IDs without creating output', () => {
    const output = resolve(temporaryDirectory('work'), 'worklist.jsonl');

    expect(() => runBuildAuthoringWorklist(['--output', output])).toThrow(/--batch/i);
    expect(() => runBuildAuthoringWorklist(['--batch', 'unknown', '--output', output]))
      .toThrow(/unknown production batch/i);
    expect(existsSync(output)).toBe(false);
  });
});
