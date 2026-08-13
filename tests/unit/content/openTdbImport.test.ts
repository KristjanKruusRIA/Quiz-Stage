import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildOpenTdbDuplicateKey,
  sanitizeOpenTdbText,
} from '../../../scripts/content/adaptOpenTdb';
import { fetchOpenTdbCandidates } from '../../../scripts/content/fetchOpenTdb';

interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body: string;
}

interface MockResponseDependencies {
  calls: string[];
  sleeps: number[];
  request: (url: string, init?: RequestInit) => Promise<{
    status: number;
    headers: { get: (name: string) => string | null };
    body: string;
  }>;
  sleep: (milliseconds: number) => Promise<void>;
}

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const root = resolve('content/imports');
  mkdirSync(root, { recursive: true });
  const directory = mkdtempSync(resolve(root, '.quiz-stage-openTdb-'));
  temporaryDirectories.push(directory);
  return directory;
}

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures/opentdb', name), 'utf8').trim();
}

function createMockFetcher(queue: MockResponse[]): MockResponseDependencies {
  const calls: string[] = [];
  const sleeps: number[] = [];
  return {
    calls,
    sleeps,
    request: async (url) => {
      const next = queue.shift();
      if (next === undefined) throw new Error(`No mocked response for ${url}`);
      calls.push(url);
      return {
        status: next.status,
        headers: {
          get: (name: string) => next.headers?.[name.toLowerCase()] ?? next.headers?.[name] ?? null,
        },
        body: next.body,
      };
    },
    sleep: async (milliseconds: number) => {
      sleeps.push(milliseconds);
    },
  };
}

function parseJsonl(path: string): Array<Record<string, unknown>> {
  const content = readFileSync(path, 'utf8').trim();
  if (content === '') return [];
  return content.split(/\r?\n/).map((line) => JSON.parse(line));
}

describe('OpenTDB HTML/base64 normalization', () => {
  it('strips HTML tags and decodes entities', () => {
    expect(sanitizeOpenTdbText('What does <b>HTML</b> stand for?')).toBe('What does HTML stand for?');
    expect(sanitizeOpenTdbText('AT&amp;T')).toBe('AT&T');
  });
});

describe('OpenTDB candidate fetcher', () => {
  it('writes decoded candidates with stable IDs, attribution, and duplicate keys', async () => {
    const directory = temporaryDirectory();
    const output = resolve(directory, 'opentdb-candidates.jsonl');
    const checkpoint = resolve(directory, 'opentdb-state.json');
    const mock = createMockFetcher([
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('page.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('exhausted.json'), headers: { 'content-type': 'application/json' } },
    ]);

    const result = await fetchOpenTdbCandidates({
      output, checkpoint, resume: false, target: 5, delayMs: 0, maxAttempts: 5,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    });

    expect(result.totalWritten).toBe(2);
    expect(result.totalSkipped).toBe(0);
    expect(result.tokenExhausted).toBe(true);
    const rows = parseJsonl(output);
    expect(rows).toHaveLength(2);

    const first = rows[0]!;
    expect(first.sourceSystem).toBe('OpenTDB');
    expect(first.sourceTitle).toBe('Open Trivia Database');
    expect(first.sourceLicense).toBe('CC-BY-SA-4.0');
    expect(first.license).toBe('CC-BY-SA-4.0');
    expect(first.inspirationOnly).toBe(true);
    expect(first.candidateId).toBe(first.sourceId);
    expect(first.question).toBe('What does HTML stand for?');
    expect(first.answer).toBe('HyperText Markup Language');
    expect(first.normalizedDuplicateKey).toBe(
      buildOpenTdbDuplicateKey('What does HTML stand for?', 'HyperText Markup Language', 'Computers', 'easy'),
    );

    const second = rows[1]!;
    expect(second.answer).toBe('AT&T');
    expect(second.requiresFactualSource).toBe(true);
  });

  it('deduplicates resume runs using checkpoint-safe output state', async () => {
    const directory = temporaryDirectory();
    const output = resolve(directory, 'opentdb-candidates.jsonl');
    const checkpoint = resolve(directory, 'opentdb-state.json');
    const firstRun = createMockFetcher([
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('page.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('exhausted.json'), headers: { 'content-type': 'application/json' } },
    ]);

    await fetchOpenTdbCandidates({
      output, checkpoint, resume: false, target: 5, delayMs: 0, maxAttempts: 5,
      dependencies: {
        request: firstRun.request,
        sleep: firstRun.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    });

    const secondRun = createMockFetcher([
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('page.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('exhausted.json'), headers: { 'content-type': 'application/json' } },
    ]);
    const result = await fetchOpenTdbCandidates({
      output, checkpoint, resume: true, target: 5, delayMs: 0, maxAttempts: 5,
      dependencies: {
        request: secondRun.request,
        sleep: secondRun.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    });
    expect(result.totalWritten).toBe(0);
    expect(result.totalSkipped).toBe(2);
    expect(parseJsonl(output)).toHaveLength(2);
  });

  it('retries on temporary HTTP failures and applies Retry-After to wait window', async () => {
    const directory = temporaryDirectory();
    const output = resolve(directory, 'opentdb-candidates.jsonl');
    const checkpoint = resolve(directory, 'opentdb-state.json');
    const mock = createMockFetcher([
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 429, headers: { 'retry-after': '2' }, body: fixture('rate-limited.json') },
      { status: 200, body: fixture('page.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('exhausted.json'), headers: { 'content-type': 'application/json' } },
    ]);

    const result = await fetchOpenTdbCandidates({
      output, checkpoint, resume: false, target: 2, delayMs: 0, maxAttempts: 5,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    });

    expect(result.totalWritten).toBe(2);
    expect(mock.sleeps).toContain(2000);
  });

  it('throws on non-transient API status code and reports malformed responses', async () => {
    const directory = temporaryDirectory();
    const output = resolve(directory, 'opentdb-candidates.jsonl');
    const checkpoint = resolve(directory, 'opentdb-state.json');
    const queue: MockResponse[] = [
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      { status: 200, body: fixture('token.json'), headers: { 'content-type': 'application/json' } },
      {
        status: 200,
        body: Buffer.from(
          JSON.stringify({
            response_code: 2,
            response_message: 'Invalid parameter',
            results: [],
          }),
          'utf8',
        ).toString('base64'),
        headers: { 'content-type': 'application/json' },
      },
    ];
    const mock = createMockFetcher(queue);
    const now = () => new Date('2026-08-12T12:00:00.000Z');
    await expect(fetchOpenTdbCandidates({
      output,
      checkpoint,
      resume: false,
      target: 1,
      delayMs: 0,
      maxAttempts: 5,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now,
      },
    })).rejects.toThrow(/page request returned 2/);
  });

  it('rejects an unsafe output before requesting data or creating the file', async () => {
    const output = resolve('content/authored/.task-6-opentdb-candidates.jsonl');
    const checkpoint = resolve(temporaryDirectory(), 'opentdb-state.json');
    const mock = createMockFetcher([]);

    await expect(fetchOpenTdbCandidates({
      output, checkpoint, resume: false, target: 1, delayMs: 0, maxAttempts: 1,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    })).rejects.toThrow(/content[\\/]imports/i);
    expect(mock.calls).toHaveLength(0);
    expect(existsSync(output)).toBe(false);
  });

  it('rejects an unsafe checkpoint before requesting data or creating output', async () => {
    const output = resolve(temporaryDirectory(), 'opentdb-candidates.jsonl');
    const checkpoint = resolve('content/evidence/.task-6-opentdb-state.json');
    const mock = createMockFetcher([]);

    await expect(fetchOpenTdbCandidates({
      output, checkpoint, resume: false, target: 1, delayMs: 0, maxAttempts: 1,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    })).rejects.toThrow(/content[\\/]imports/i);
    expect(mock.calls).toHaveLength(0);
    expect(existsSync(output)).toBe(false);
    expect(existsSync(checkpoint)).toBe(false);
  });

  it('rechecks the output ancestor after network activity before appending candidates', async () => {
    const directory = temporaryDirectory();
    const outputDirectory = resolve(directory, 'mutable-output');
    const outsideDirectory = mkdtempSync(resolve(tmpdir(), 'quiz-stage-openTdb-outside-'));
    temporaryDirectories.push(outsideDirectory);
    mkdirSync(outputDirectory);
    const output = resolve(outputDirectory, 'opentdb-candidates.jsonl');
    const checkpoint = resolve(directory, 'opentdb-state.json');
    const mock = createMockFetcher([
      { status: 200, body: fixture('token.json') },
      { status: 200, body: fixture('token.json') },
      { status: 200, body: fixture('page.json') },
    ]);
    let swapped = false;

    await expect(fetchOpenTdbCandidates({
      output, checkpoint, resume: false, target: 1, delayMs: 0, maxAttempts: 1,
      dependencies: {
        request: async (url, init) => {
          if (!swapped) {
            rmSync(outputDirectory, { recursive: true });
            symlinkSync(outsideDirectory, outputDirectory, 'junction');
            swapped = true;
          }
          return mock.request(url, init);
        },
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    })).rejects.toThrow(/symbolic link/i);
    expect(existsSync(resolve(outsideDirectory, 'opentdb-candidates.jsonl'))).toBe(false);
  });
});
