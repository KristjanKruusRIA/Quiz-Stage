import { lstatSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import {
  CANDIDATE_ROOT,
  THIRD_PARTY_NOTICE_PATH,
  assertCandidateOutputPath,
  assertThirdPartyNoticeOutputPath,
} from './candidatePaths';
import {
  WIKIDATA_RECIPE_NAMES,
  buildWikidataRecipeQuery,
  WIKIDATA_MAX_ROWS,
} from './wikidataRecipes';
import {
  buildWikidataFactKey,
  extractWikidataLastItemId,
  mapWikidataCandidates,
  parseWikidataResponse,
  type WikidataMappedCandidate,
} from './mapWikidataCandidates';

const USER_AGENT = 'Quiz Stage content fetcher/0.1 (+Wikidata candidate ingestion)';
const DEFAULT_OUTPUT_PATH = resolve(CANDIDATE_ROOT, 'wikidata-candidates.jsonl');
const DEFAULT_CACHE_PATH = resolve(CANDIDATE_ROOT, 'wikidata-cache.json');
const DEFAULT_PAGE_SIZE = WIKIDATA_MAX_ROWS;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_MIN_DELAY_MS = 1_000;

interface RawResponse {
  status: number;
  headers: {
    get(name: string): string | null;
  };
  body: string;
}

export interface WikidataDependencies {
  request(url: string, init?: RequestInit): Promise<RawResponse>;
  sleep(milliseconds: number): Promise<void>;
  now(): Date;
}

interface WikidataCache {
  get(url: string): string | undefined;
  set(url: string, body: string): void;
  publish(): void;
}

interface FetchWikidataOptions {
  output: string;
  cache: string;
  recipes: readonly string[];
  resume: boolean;
  pageSize: number;
  delayMs: number;
  maxAttempts: number;
  dependencies?: WikidataDependencies;
}

interface FetchWikidataResult {
  totalWritten: number;
  totalSkipped: number;
}

interface RawResponseCacheDocument {
  version: number;
  entries: Record<string, string>;
}

const RESPONSE_CACHE_VERSION = 1;

function parseRetryAfter(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function defaultDependencies(): WikidataDependencies {
  return {
    request: async (url, init) => {
      const response = await fetch(url, {
        headers: {
          accept: 'application/sparql-results+json',
          'user-agent': USER_AGENT,
          ...(init?.headers as Record<string, string> | undefined),
        },
      });
      return {
        status: response.status,
        headers: {
          get: (name) => response.headers.get(name) ?? null,
        },
        body: await response.text(),
      };
    },
    sleep: (milliseconds) => new Promise((done) => setTimeout(done, milliseconds)),
    now: () => new Date(),
  };
}

function ensureRegularDirectory(path: string): void {
  const directory = lstatSync(dirname(path), { throwIfNoEntry: false });
  if (directory !== undefined && !directory.isDirectory()) {
    throw new Error(`Wikidata path parent must be a directory: ${dirname(path)}`);
  }
}

function buildCache(path: string): WikidataCache {
  let document: RawResponseCacheDocument = { version: RESPONSE_CACHE_VERSION, entries: {} };
  if (existsSync(path)) {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as RawResponseCacheDocument;
    if (parsed.version === RESPONSE_CACHE_VERSION && typeof parsed.entries === 'object' && parsed.entries !== null) {
      document = parsed;
    }
  }
  return {
    get: (url) => document.entries[url],
    set: (url, body) => { document.entries[url] = body; },
    publish: () => {
      assertCandidateOutputPath(path);
      ensureRegularDirectory(path);
      const temporary = `${path}.${randomUUID()}.tmp`;
      try {
        assertCandidateOutputPath(path);
        assertCandidateOutputPath(temporary);
        writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, { flag: 'wx' });
        assertCandidateOutputPath(path);
        assertCandidateOutputPath(temporary);
        renameSync(temporary, path);
      } finally {
        try {
          assertCandidateOutputPath(temporary);
          unlinkSync(temporary);
        } catch { /* already renamed or no longer safe */ }
      }
    },
  };
}

function buildQueryUrl(query: string): string {
  const endpoint = new URL('https://query.wikidata.org/sparql');
  endpoint.searchParams.set('query', query);
  endpoint.searchParams.set('format', 'json');
  return endpoint.toString();
}

async function requestWithRetries(
  url: string,
  dependencies: WikidataDependencies,
  options: { maxAttempts: number; },
  attempt = 1,
): Promise<string> {
  const response = await dependencies.request(url, { headers: { accept: 'application/sparql-results+json', 'user-agent': USER_AGENT } });
  if ((response.status === 429 || response.status >= 500) && attempt < options.maxAttempts) {
    const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
    const backoff = retryAfter !== null ? Math.min(retryAfter * 1000, 60_000) : Math.min(250 * 2 ** (attempt - 1), 60_000);
    await dependencies.sleep(Math.max(200, backoff));
    return requestWithRetries(url, dependencies, options, attempt + 1);
  }
  if (response.status !== 200) throw new Error(`Wikidata request failed with status: ${response.status}`);
  return response.body;
}

function readResponse(
  url: string,
  dependencies: WikidataDependencies,
  cache: WikidataCache,
  maxAttempts: number,
): Promise<string> {
  const cached = cache.get(url);
  if (cached !== undefined) return Promise.resolve(cached);
  return requestWithRetries(url, dependencies, { maxAttempts }).then((body) => {
    cache.set(url, body);
    return body;
  });
}

function loadSeenCandidateKeys(path: string): Set<string> {
  if (!existsSync(path)) return new Set();
  const content = readFileSync(path, 'utf8');
  const keys = new Set<string>();
  for (const line of content.split(/\r?\n/).map((value) => value.trim()).filter((value) => value !== '')) {
    const candidate = JSON.parse(line) as WikidataMappedCandidate;
    if (typeof candidate.normalizedFactKey === 'string') keys.add(candidate.normalizedFactKey);
    if (typeof candidate.sourceId === 'string' && candidate.sourceId.startsWith('wikidata:')) {
      const reconstructed = buildWikidataFactKey(
        candidate.entityId,
        candidate.propertyId,
        candidate.value,
      );
      keys.add(reconstructed);
    }
  }
  return keys;
}

function writeCandidates(path: string, candidates: readonly WikidataMappedCandidate[]): void {
  if (candidates.length === 0) return;
  const payload = `${candidates.map((candidate) => JSON.stringify(candidate)).join('\n')}\n`;
  assertCandidateOutputPath(path);
  appendFileSync(path, payload);
}

export function appendIfNotPresent(path: string, line: string): void {
  assertThirdPartyNoticeOutputPath(path);
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (existing.includes(line.trim())) return;
  const separator = existing === '' || existing.endsWith('\n') ? '' : '\n';
  assertThirdPartyNoticeOutputPath(path);
  writeFileSync(path, `${existing}${separator}${line}`, { flag: 'w' });
}

export async function fetchWikidataCandidates(
  options: FetchWikidataOptions,
): Promise<FetchWikidataResult> {
  assertCandidateOutputPath(options.output);
  assertCandidateOutputPath(options.cache);
  assertThirdPartyNoticeOutputPath(THIRD_PARTY_NOTICE_PATH);
  const dependencies = options.dependencies ?? defaultDependencies();
  const outputCandidates = options.resume ? loadSeenCandidateKeys(options.output) : new Set<string>();
  const seenSourceIds = new Set<string>(outputCandidates);
  const cache = buildCache(options.cache);
  const now = dependencies.now();
  let totalWritten = 0;
  let totalSkipped = 0;

  for (const recipe of options.recipes) {
    let afterCursor: string | undefined = undefined;
    while (true) {
      await dependencies.sleep(options.delayMs);
      const query = buildWikidataRecipeQuery(recipe, { after: afterCursor, limit: options.pageSize });
      const requestUrl = buildQueryUrl(query);
      const body = await readResponse(requestUrl, dependencies, cache, options.maxAttempts);
      const bindings = parseWikidataResponse(body);
      if (bindings.length === 0) break;
      const mapped = mapWikidataCandidates(recipe, bindings, now.toISOString());
      const unique: WikidataMappedCandidate[] = [];
      for (const candidate of mapped.candidates) {
        if (seenSourceIds.has(candidate.normalizedFactKey)) {
          totalSkipped += 1;
          continue;
        }
        seenSourceIds.add(candidate.normalizedFactKey);
        totalWritten += 1;
        unique.push(candidate);
      }
      totalSkipped += mapped.skipped;
      writeCandidates(options.output, unique);
      if (bindings.length < options.pageSize) break;
      afterCursor = extractWikidataLastItemId(bindings) ?? undefined;
      if (afterCursor === undefined) break;
    }
  }

  cache.publish();
  const result = { totalWritten, totalSkipped };
  const line = `- Wikidata fetch: ${result.totalWritten} draft candidates on ${now.toISOString()} from Wikidata CC0-1.0 (SPARQL, source CC0)\n`;
  appendIfNotPresent(THIRD_PARTY_NOTICE_PATH, line);
  return result;
}

export async function runWikidataFetch(argv: string[] = process.argv.slice(2)): Promise<number> {
  const dependencies = defaultDependencies();
  const options: Omit<FetchWikidataOptions, 'dependencies'> = {
    output: DEFAULT_OUTPUT_PATH,
    cache: DEFAULT_CACHE_PATH,
    recipes: [],
    resume: false,
    pageSize: DEFAULT_PAGE_SIZE,
    delayMs: DEFAULT_MIN_DELAY_MS,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--output') {
      options.output = resolve(argv[index + 1] ?? '');
      index += 1;
    } else if (argument === '--cache') {
      options.cache = resolve(argv[index + 1] ?? '');
      index += 1;
    } else if (argument === '--all-recipes') {
      options.recipes = [...WIKIDATA_RECIPE_NAMES];
    } else if (argument === '--recipes') {
      const recipes = argv[index + 1];
      if (recipes === undefined || recipes.trim() === '') throw new Error('--recipes requires comma-separated names');
      options.recipes = recipes.split(',').map((value) => value.trim()).filter((value) => value !== '');
      index += 1;
    } else if (argument === '--resume') {
      options.resume = true;
    } else if (argument === '--page-size') {
      const pageSize = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isInteger(pageSize) || pageSize <= 0) throw new Error('--page-size must be a positive integer');
      options.pageSize = Math.min(pageSize, WIKIDATA_MAX_ROWS);
      index += 1;
    } else if (argument === '--delay-ms') {
      const delayMs = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isInteger(delayMs) || delayMs < 0) throw new Error('--delay-ms must be zero or greater');
      options.delayMs = delayMs;
      index += 1;
    } else if (argument === '--max-attempts') {
      const maxAttempts = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isInteger(maxAttempts) || maxAttempts <= 0) throw new Error('--max-attempts must be a positive integer');
      options.maxAttempts = maxAttempts;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (options.recipes.length === 0) {
    throw new Error('No recipes selected. Use --all-recipes or --recipes');
  }

  assertCandidateOutputPath(options.output);
  assertCandidateOutputPath(options.cache);
  assertThirdPartyNoticeOutputPath(THIRD_PARTY_NOTICE_PATH);
  if (!options.resume && existsSync(options.output)) {
    assertCandidateOutputPath(options.output);
    writeFileSync(options.output, '', { flag: 'w' });
  }
  assertCandidateOutputPath(options.output);
  mkdirSync(dirname(options.output), { recursive: true });
  assertCandidateOutputPath(options.cache);
  mkdirSync(dirname(options.cache), { recursive: true });
  const result = await fetchWikidataCandidates({ ...options, dependencies });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runWikidataFetch(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
