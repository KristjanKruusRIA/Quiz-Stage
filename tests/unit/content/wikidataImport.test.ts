import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  WIKIDATA_MAX_ROWS,
  buildWikidataRecipeQuery,
  WIKIDATA_RECIPE_NAMES,
} from '../../../scripts/content/wikidataRecipes';
import {
  mapWikidataCandidates,
  parseWikidataResponse,
} from '../../../scripts/content/mapWikidataCandidates';
import { fetchWikidataCandidates } from '../../../scripts/content/fetchWikidata';

interface MockResponse {
  status: number;
  body: string;
  headers?: Record<string, string>;
}

interface FetchDependencies {
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
  const directory = mkdtempSync(resolve(root, '.quiz-stage-wikidata-'));
  temporaryDirectories.push(directory);
  return directory;
}

function fixture(name: string): string {
  return readFileSync(resolve('tests/fixtures/wikidata', name), 'utf8').trim();
}

function createMockFetcher(queue: MockResponse[]): FetchDependencies {
  const calls: string[] = [];
  const sleeps: number[] = [];
  const queueRef = [...queue];
  return {
    calls,
    sleeps,
    request: async (url, init) => {
      calls.push(url);
      const next = queueRef.shift();
      if (next === undefined) throw new Error(`No mocked response for ${url}`);
      const headers = new Headers(init?.headers);
      for (const [key, value] of Object.entries(next.headers ?? {})) {
        if (value !== undefined) headers.set(key, value);
      }
      return {
        status: next.status,
        headers: { get: (name) => headers.get(name) ?? next.headers?.[name.toLowerCase()] ?? null },
        body: next.body,
      };
    },
    sleep: async (milliseconds: number) => { sleeps.push(milliseconds); },
  };
}

describe('Wikidata recipes and mapping contracts', () => {
  it('declares all required recipe families and builds bounded English-label SPARQL queries', () => {
    expect(WIKIDATA_RECIPE_NAMES).toEqual([
      'historical-events',
      'places-and-features',
      'scientists-and-discoveries',
      'authors-and-works',
      'artists-and-works',
      'composers-and-works',
      'films-and-directors',
      'athletes-and-teams',
      'foods-and-origins',
      'inventions-and-inventors',
      'institutions-and-foundings',
      'mythology-philosophy',
    ]);
    for (const recipe of WIKIDATA_RECIPE_NAMES) {
      const query = buildWikidataRecipeQuery(recipe, { limit: WIKIDATA_MAX_ROWS });
      expect(query).toContain('LIMIT 500');
      expect(query).toContain('wikibase:language "en"');
      expect(query).not.toMatch(/OFFSET\s+\d+/i);
    }
  });

  it('maps valid rows and rejects rows missing English labels for stable candidate contracts', () => {
    const first = parseWikidataResponse(fixture('historical-events-page1.json'));
    const missing = parseWikidataResponse(fixture('missing-label.json'));
    const places = parseWikidataResponse(fixture('places-page1.json'));
    const mapped = mapWikidataCandidates('historical-events', first, '2026-08-12T12:00:00.000Z');
    const rejected = mapWikidataCandidates('historical-events', missing, '2026-08-12T12:00:00.000Z');
    const mappedPlaces = mapWikidataCandidates('places-and-features', places, '2026-08-12T12:00:00.000Z');

    expect(mapped.candidates).toHaveLength(2);
    expect(mapped.skipped).toBe(0);
    expect(rejected.candidates).toHaveLength(0);
    expect(rejected.skipped).toBe(1);
    expect(mappedPlaces.candidates).toHaveLength(1);

    const firstCandidate = mapped.candidates[0];
    expect(firstCandidate).toBeDefined();
    expect(firstCandidate!.sourceSystem).toBe('Wikidata');
    expect(firstCandidate!.sourceLicense).toBe('CC0-1.0');
    expect(firstCandidate!.candidateId).toBe(firstCandidate!.sourceId);
    expect(firstCandidate!.sourceUrl).toBe('https://www.wikidata.org/wiki/Q1');
    expect(firstCandidate!.sourceRecipe).toBe('historical-events');
    expect(firstCandidate!.factSourceIds).toEqual(['P31', 'Q1', 'Q2']);
  });

  it('deduplicates duplicate fact keys across paginated pages with keyset cursors', async () => {
    const directory = temporaryDirectory();
    const output = resolve(directory, 'wikidata-candidates.jsonl');
    const cache = resolve(directory, 'wikidata-cache.json');
    const secondPage = JSON.stringify({
      results: {
        bindings: [
          {
            item: { value: 'http://www.wikidata.org/entity/Q1' },
            itemLabel: { value: 'Apollo 11' },
            property: { value: 'http://www.wikidata.org/entity/P31' },
            propertyLabel: { value: 'instance of' },
            value: { type: 'uri', value: 'http://www.wikidata.org/entity/Q2' },
            valueLabel: { value: 'mission' },
          },
          {
            item: { value: 'http://www.wikidata.org/entity/Q3' },
            itemLabel: { value: 'Aurora' },
            property: { value: 'http://www.wikidata.org/entity/P31' },
            propertyLabel: { value: 'instance of' },
            value: { type: 'uri', value: 'http://www.wikidata.org/entity/Q4' },
            valueLabel: { value: 'phenomenon' },
          },
        ],
      },
    });
    const mock = createMockFetcher([
      { status: 200, body: fixture('historical-events-page1.json') }, // two unique facts
      { status: 200, body: secondPage }, // duplicate + new fact
      { status: 200, body: '{"results":{"bindings":[]}}' },
    ]);
    const result = await fetchWikidataCandidates({
      output,
      cache,
      recipes: ['historical-events'],
      resume: false,
      pageSize: 2,
      delayMs: 0,
      maxAttempts: 5,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    });

    expect(result.totalWritten).toBe(3);
    expect(result.totalSkipped).toBe(1);
    expect(mock.sleeps.every((value) => value === 0)).toBe(true);
    const secondRequest = new URL(mock.calls[1]!);
    const secondQuery = secondRequest.searchParams.get('query') ?? '';
    expect(decodeURIComponent(secondQuery)).toContain('LIMIT 2');
    expect(decodeURIComponent(secondQuery)).toContain('?item > ?afterItem');

    const lines = readFileSync(output, 'utf8')
      .trim()
      .split(/\r?\n/)
      .filter((line) => line !== '')
      .map((line) => JSON.parse(line));
    expect(lines).toHaveLength(3);
    expect(lines.map((row) => row.sourceRecipe)).toEqual([
      'historical-events',
      'historical-events',
      'historical-events',
    ]);
  });

  it('retries 429/5xx responses using Retry-After and eventually maps candidates', async () => {
    const directory = temporaryDirectory();
    const output = resolve(directory, 'wikidata-candidates.jsonl');
    const cache = resolve(directory, 'wikidata-cache.json');
    const mock = createMockFetcher([
      { status: 429, body: fixture('rate-limited.json'), headers: { 'retry-after': '2' } },
      { status: 200, body: fixture('historical-events-page1.json') },
      { status: 200, body: '{"results":{"bindings":[]}}' },
    ]);
    const result = await fetchWikidataCandidates({
      output,
      cache,
      recipes: ['historical-events'],
      resume: false,
      pageSize: 500,
      delayMs: 0,
      maxAttempts: 3,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    });

    expect(result.totalWritten).toBe(2);
    expect(mock.sleeps).toContain(2000);
    expect(mock.calls).toHaveLength(2);
  });

  it('rejects an unsafe cache before requesting data or creating output', async () => {
    const directory = temporaryDirectory();
    const output = resolve(directory, 'wikidata-candidates.jsonl');
    const cache = resolve('content/reports/.task-6-wikidata-cache.json');
    const mock = createMockFetcher([]);

    await expect(fetchWikidataCandidates({
      output, cache, recipes: ['historical-events'], resume: false, pageSize: 1, delayMs: 0, maxAttempts: 1,
      dependencies: {
        request: mock.request,
        sleep: mock.sleep,
        now: () => new Date('2026-08-12T12:00:00.000Z'),
      },
    })).rejects.toThrow(/content[\\/]imports/i);
    expect(mock.calls).toHaveLength(0);
    expect(existsSync(output)).toBe(false);
    expect(existsSync(cache)).toBe(false);
  });
});
