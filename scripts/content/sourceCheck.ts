import { isIP } from 'node:net';
import { lookup as dnsLookup } from 'node:dns';
import { resolve4, resolve6 } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { lstatSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { readCsvInputs } from './readCsv';
import { publishValidationReport, validateProductionCsvPack } from './validate';
import { restoreNpmRunArgs } from './npmCliCompatibility';

const USER_AGENT = 'Quiz Stage content source checker/0.1 (+offline desktop content validation)';
const OFFICIAL_ARCHIVE_HOSTS = new Set(['j-archive.com', 'www.j-archive.com', 'jeopardyarchive.com', 'www.jeopardyarchive.com']);
const CACHE_VERSION = 1;
const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60_000;
const CACHE_ONLY_MAX_AGE_MS = 30 * 24 * 60 * 60_000;

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export interface SourceFetchResponse { status: number; headers: Headers }
export interface SourceCheckDependencies {
  fetch(url: string, init?: RequestInit): Promise<SourceFetchResponse>;
  resolveHostname(hostname: string): Promise<string[]>;
  now(): Date;
  sleep(milliseconds: number): Promise<void>;
}

export interface SourceCheckResult {
  url: string;
  ok: boolean;
  status: number | null;
  retrievedAt: string | null;
  code: string | null;
  finalUrl: string | null;
}

export interface SourceCacheEntry { version: number; expiresAt: string; result: SourceCheckResult }
export interface SourceCache {
  get(url: string): SourceCacheEntry | undefined;
  set(url: string, entry: SourceCacheEntry): void;
}

export interface FileSourceCachePublicationDependencies {
  beforeRename?(): void;
  createTemporaryId?(): string;
}

export interface SourceCheckOptions {
  concurrency?: number;
  maxAttempts?: number;
  timeoutMs?: number;
  initialBackoffMs?: number;
  maxRedirects?: number;
  cache?: SourceCache;
  cacheExpiryMs?: number;
  cacheOnly?: boolean;
}

export function createMemorySourceCache(entries: Record<string, SourceCacheEntry> = {}): SourceCache {
  const values = new Map(Object.entries(entries));
  return { get: (url) => values.get(url), set: (url, entry) => { values.set(url, entry); } };
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
    || (a === 192 && b === 0 && (c === 0 || c === 2))
    || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
    || (a === 203 && b === 0 && c === 113) || a >= 240;
}

function isPrivateAddress(value: string): boolean {
  const address = value.startsWith('[') && value.endsWith(']') ? value.slice(1, -1) : value;
  if (isIP(address) === 4) return isPrivateIpv4(address);
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    const mappedIpv4 = lower.match(/(?:^|:)(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mappedIpv4 !== undefined) return isPrivateIpv4(mappedIpv4);
    const first = Number.parseInt(lower.split(':')[0] || '0', 16);
    return lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd')
      || /^fe[89ab]/.test(lower) || lower.startsWith('ff') || first < 0x2000 || first > 0x3fff;
  }
  return false;
}

async function defaultResolveHostname(hostname: string): Promise<string[]> {
  const address = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
  if (isIP(address) !== 0) return [address];
  const [v4, v6] = await Promise.all([
    resolve4(address).catch(() => []), resolve6(address).catch(() => []),
  ]);
  return [...v4, ...v6];
}

async function safeHttpsFetch(url: string, init: RequestInit = {}): Promise<SourceFetchResponse> {
  return new Promise((resolveRequest, reject) => {
    const parsed = new URL(url);
    const request = httpsRequest(parsed, {
      method: init.method ?? 'GET', headers: init.headers as Record<string, string> | undefined,
      signal: init.signal ?? undefined,
      lookup: (hostname, options, callback) => {
        dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
          if (error) { callback(error, '', 0); return; }
          const safe = addresses.filter((entry) => !isPrivateAddress(entry.address));
          if (safe.length !== addresses.length || safe.length === 0) {
            callback(new Error('SOURCE_PRIVATE_ADDRESS'), '', 0); return;
          }
          if (options.all) { callback(null, safe); return; }
          callback(null, safe[0].address, safe[0].family);
        });
      },
    }, (response) => {
      const headers = new Headers();
      for (const [name, value] of Object.entries(response.headers)) {
        if (Array.isArray(value)) for (const item of value) headers.append(name, item);
        else if (value !== undefined) headers.set(name, value);
      }
      const result = { status: response.statusCode ?? 0, headers };
      response.destroy();
      resolveRequest(result);
    });
    request.on('error', reject);
    request.end();
  });
}

const DEFAULT_DEPENDENCIES: SourceCheckDependencies = {
  fetch: safeHttpsFetch,
  resolveHostname: defaultResolveHostname,
  now: () => new Date(),
  sleep: (milliseconds) => new Promise((done) => setTimeout(done, milliseconds)),
};

function rejected(url: string, code: string): SourceCheckResult {
  return { url, ok: false, status: null, retrievedAt: null, code, finalUrl: null };
}

type TargetHostSerializer = <Value>(hostname: string, operation: () => Promise<Value>) => Promise<Value>;

function createTargetHostSerializer(): TargetHostSerializer {
  const tails = new Map<string, Promise<void>>();
  return async <Value>(hostname: string, operation: () => Promise<Value>): Promise<Value> => {
    const previous = tails.get(hostname) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolvePromise) => { release = resolvePromise; });
    const tail = previous.then(() => gate);
    tails.set(hostname, tail);
    await previous;
    try { return await operation(); } finally {
      release();
      if (tails.get(hostname) === tail) tails.delete(hostname);
    }
  };
}

function retryAfterDelayMs(value: string | null, now: Date, fallbackMs: number): number {
  const normalized = value?.trim();
  if (!normalized) return fallbackMs;
  const seconds = Number(normalized);
  if (Number.isFinite(seconds)) return seconds >= 0 ? Math.min(seconds * 1_000, 60_000) : fallbackMs;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? Math.min(Math.max(0, timestamp - now.getTime()), 60_000) : fallbackMs;
}

function normalizeHostname(value: string): string | undefined {
  const lower = value.toLowerCase();
  const hostname = lower.endsWith('.') ? lower.slice(0, -1) : lower;
  if (hostname === '' || hostname.endsWith('.')) return undefined;
  return hostname;
}

function inspectSourceUrl(raw: string): { url?: URL; hostname?: string; error?: SourceCheckResult } {
  let url: URL;
  try { url = new URL(raw); } catch { return { error: rejected(raw, 'SOURCE_URL_INVALID') }; }
  if (url.protocol !== 'https:') return { error: rejected(raw, 'SOURCE_URL_NOT_HTTPS') };
  if (url.username !== '' || url.password !== '') return { error: rejected(raw, 'SOURCE_URL_CREDENTIALS') };
  const hostname = normalizeHostname(url.hostname);
  if (hostname === undefined) return { error: rejected(raw, 'SOURCE_URL_INVALID') };
  if ([...OFFICIAL_ARCHIVE_HOSTS].some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    return { error: rejected(raw, 'OFFICIAL_ARCHIVE_HOST') };
  }
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || isPrivateAddress(hostname)) {
    return { error: rejected(raw, 'SOURCE_PRIVATE_ADDRESS') };
  }
  return { url, hostname };
}

function isSafeCachedUrl(value: string): boolean {
  return inspectSourceUrl(value).url !== undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseCanonicalTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) return undefined;
  return parsed;
}

function cacheOnlyResult(raw: string, cached: SourceCacheEntry | undefined, now: number): SourceCheckResult {
  if (cached === undefined) return rejected(raw, 'SOURCE_CACHE_MISS');
  const entry: unknown = cached;
  if (!isRecord(entry) || !isRecord(entry.result)) return rejected(raw, 'SOURCE_CACHE_INVALID');
  const result = entry.result;
  const retrievedAt = parseCanonicalTimestamp(result.retrievedAt);
  const expiresAt = parseCanonicalTimestamp(entry.expiresAt);
  if (entry.version !== CACHE_VERSION || result.url !== raw || result.ok !== true
    || typeof result.status !== 'number' || !Number.isInteger(result.status)
    || result.status < 200 || result.status >= 300
    || result.code !== null || typeof result.finalUrl !== 'string'
    || typeof result.retrievedAt !== 'string'
    || retrievedAt === undefined || retrievedAt > now
    || expiresAt === undefined || expiresAt <= retrievedAt
    || !isSafeCachedUrl(raw) || !isSafeCachedUrl(result.finalUrl)) {
    return rejected(raw, 'SOURCE_CACHE_INVALID');
  }
  if (now - retrievedAt > CACHE_ONLY_MAX_AGE_MS) return rejected(raw, 'SOURCE_CACHE_STALE');
  return {
    url: raw, ok: true, status: result.status, retrievedAt: result.retrievedAt,
    code: null, finalUrl: result.finalUrl,
  };
}

async function validateTarget(
  raw: string,
  dependencies: SourceCheckDependencies,
): Promise<{ url?: URL; hostname?: string; error?: SourceCheckResult }> {
  const inspected = inspectSourceUrl(raw);
  if (inspected.error !== undefined) return inspected;
  const url = inspected.url!;
  let addresses: string[];
  try { addresses = await dependencies.resolveHostname(inspected.hostname!); } catch { return { error: rejected(raw, 'SOURCE_DNS_FAILURE') }; }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) return { error: rejected(raw, 'SOURCE_PRIVATE_ADDRESS') };
  return { url, hostname: inspected.hostname };
}

async function checkOne(
  raw: string,
  dependencies: SourceCheckDependencies,
  options: Required<Omit<SourceCheckOptions, 'cache'>> & { cache?: SourceCache },
  serializeTargetHost: TargetHostSerializer,
): Promise<SourceCheckResult> {
  const cached = options.cache?.get(raw);
  if (options.cacheOnly) return cacheOnlyResult(raw, cached, dependencies.now().getTime());
  if (cached?.version === CACHE_VERSION && Date.parse(cached.expiresAt) > dependencies.now().getTime() && cached.result.ok) return cached.result;
  let target = raw;
  for (let redirects = 0; redirects <= options.maxRedirects; redirects += 1) {
    const checked = await validateTarget(target, dependencies);
    if (checked.error !== undefined) return { ...checked.error, url: raw };
    const outcome = await serializeTargetHost(checked.hostname!, async () => {
      let lastStatus: number | null = null;
      for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
        let response: SourceFetchResponse;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), options.timeoutMs);
          try {
            response = await dependencies.fetch(checked.url!.href, {
              method: 'GET', redirect: 'manual', signal: controller.signal,
              headers: { accept: 'text/html,application/json;q=0.9,*/*;q=0.1', 'user-agent': USER_AGENT },
            });
          } finally { clearTimeout(timer); }
        } catch {
          if (attempt < options.maxAttempts) {
            await dependencies.sleep(Math.min(options.initialBackoffMs * (2 ** (attempt - 1)), 60_000));
            continue;
          }
          return { url: raw, ok: false, status: lastStatus, retrievedAt: null, code: 'SOURCE_REQUEST_FAILED', finalUrl: checked.url!.href } satisfies SourceCheckResult;
        }
        lastStatus = response.status;
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location === null) return { url: raw, ok: false, status: response.status, retrievedAt: null, code: 'SOURCE_REDIRECT_MISSING_LOCATION', finalUrl: checked.url!.href };
          try { return { redirect: new URL(location, checked.url).href }; } catch {
            if (attempt < options.maxAttempts) {
              await dependencies.sleep(Math.min(options.initialBackoffMs * (2 ** (attempt - 1)), 60_000));
              continue;
            }
            return { url: raw, ok: false, status: lastStatus, retrievedAt: null, code: 'SOURCE_REQUEST_FAILED', finalUrl: checked.url!.href } satisfies SourceCheckResult;
          }
        }
        if (response.status >= 200 && response.status < 400) {
          const result: SourceCheckResult = { url: raw, ok: true, status: response.status, retrievedAt: dependencies.now().toISOString(), code: null, finalUrl: checked.url!.href };
          options.cache?.set(raw, { version: CACHE_VERSION, expiresAt: new Date(dependencies.now().getTime() + options.cacheExpiryMs).toISOString(), result });
          return result;
        }
        if (response.status === 429 || response.status >= 500) {
          const fallback = Math.min(options.initialBackoffMs * (2 ** (attempt - 1)), 60_000);
          const backoff = retryAfterDelayMs(response.headers.get('retry-after'), dependencies.now(), fallback);
          if (attempt < options.maxAttempts) { await dependencies.sleep(backoff); continue; }
          if (response.status === 429) await dependencies.sleep(backoff);
        }
        return { url: raw, ok: false, status: response.status, retrievedAt: null, code: 'SOURCE_HTTP_STATUS', finalUrl: checked.url!.href };
      }
      return rejected(raw, 'SOURCE_REQUEST_FAILED');
    });
    if (!('redirect' in outcome)) return outcome;
    target = outcome.redirect;
    if (redirects === options.maxRedirects) return { url: raw, ok: false, status: null, retrievedAt: null, code: 'SOURCE_TOO_MANY_REDIRECTS', finalUrl: target };
  }
  return rejected(raw, 'SOURCE_REQUEST_FAILED');
}

export async function checkSourceUrls(
  urls: readonly string[],
  dependencies: SourceCheckDependencies = DEFAULT_DEPENDENCIES,
  inputOptions: SourceCheckOptions = {},
): Promise<SourceCheckResult[]> {
  const options = {
    concurrency: Math.max(1, Math.min(inputOptions.concurrency ?? 4, 16)),
    maxAttempts: Math.max(1, Math.min(inputOptions.maxAttempts ?? 3, 5)),
    timeoutMs: Math.max(1, inputOptions.timeoutMs ?? 10_000),
    initialBackoffMs: Math.max(0, Math.min(inputOptions.initialBackoffMs ?? 250, 60_000)),
    maxRedirects: Math.max(0, Math.min(inputOptions.maxRedirects ?? 5, 10)),
    cacheExpiryMs: Math.max(1, inputOptions.cacheExpiryMs ?? DEFAULT_EXPIRY_MS),
    cacheOnly: inputOptions.cacheOnly ?? false,
    ...(inputOptions.cache === undefined ? {} : { cache: inputOptions.cache }),
  };
  const unique = [...new Set(urls)].sort(compareCodeUnits);
  const groupsByHost = new Map<string, string[]>();
  for (const url of unique) {
    const host = inspectSourceUrl(url).hostname ?? url;
    const group = groupsByHost.get(host) ?? [];
    group.push(url);
    groupsByHost.set(host, group);
  }
  const hostGroups = [...groupsByHost.values()];
  const serializeTargetHost = createTargetHostSerializer();
  const results = new Map<string, SourceCheckResult>();
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(options.concurrency, hostGroups.length) }, async () => {
    while (true) {
      const index = next; next += 1;
      if (index >= hostGroups.length) return;
      for (const url of hostGroups[index]) results.set(url, await checkOne(url, dependencies, options, serializeTargetHost));
    }
  }));
  return unique.map((url) => results.get(url)!);
}

export function buildWikidataBatchUrls(
  entityIds: readonly string[],
  limits: { maxEntities?: number; maxUrlLength?: number } = {},
): string[] {
  const maxEntities = Math.max(1, Math.min(limits.maxEntities ?? 50, 50));
  const maxUrlLength = Math.max(200, limits.maxUrlLength ?? 1_800);
  const ids = [...new Set(entityIds)].sort(compareCodeUnits);
  const urls: string[] = [];
  let batch: string[] = [];
  const make = (values: string[]) => {
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.search = new URLSearchParams({ action: 'wbgetentities', format: 'json', props: 'info', ids: values.join('|'), origin: '*' }).toString();
    return url.href;
  };
  for (const id of ids) {
    if (!/^Q\d+$/.test(id)) throw new Error(`Invalid Wikidata entity ID: ${id}`);
    const candidate = [...batch, id];
    if (candidate.length > maxEntities || make(candidate).length > maxUrlLength) {
      if (batch.length === 0) throw new Error(`Wikidata entity URL exceeds limit: ${id}`);
      urls.push(make(batch)); batch = [id];
    } else batch = candidate;
  }
  if (batch.length > 0) urls.push(make(batch));
  return urls;
}

function assertNoCacheSymlinkAncestors(path: string): void {
  let current = resolve(path);
  while (true) {
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Source cache path must not traverse a symlink or junction: ${current}`);
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function assertSafeCachePath(destination: string): void {
  const parentPath = dirname(destination);
  assertNoCacheSymlinkAncestors(parentPath);
  const parent = lstatSync(parentPath);
  if (!parent.isDirectory() || parent.isSymbolicLink()) throw new Error('Source cache parent must be a real directory');
  const stat = lstatSync(destination, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) throw new Error('Source cache must not be a symlink or junction');
  if (stat !== undefined && !stat.isFile()) throw new Error('Source cache must be a regular file');
}

function removeOwnedCacheTemporary(
  temporary: string,
  identity: { dev: number; ino: number } | undefined,
  destination: string,
): void {
  try { assertSafeCachePath(destination); } catch { return; }
  const stat = lstatSync(temporary, { throwIfNoEntry: false });
  if (stat === undefined || stat.isSymbolicLink() || !stat.isFile()
    || stat.dev !== identity?.dev || stat.ino !== identity.ino) return;
  try { unlinkSync(temporary); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export function openFileSourceCache(
  path: string,
  dependencies: FileSourceCachePublicationDependencies = {},
): SourceCache & { publish(): void } {
  const destination = resolve(path);
  let document: { version: number; entries: Record<string, SourceCacheEntry> } = { version: CACHE_VERSION, entries: {} };
  assertSafeCachePath(destination);
  const stat = lstatSync(destination, { throwIfNoEntry: false });
  if (stat?.isFile()) {
    const bytes = readFileSync(destination, 'utf8');
    assertSafeCachePath(destination);
    const after = lstatSync(destination);
    if (!after.isFile() || after.isSymbolicLink() || stat.dev !== after.dev || stat.ino !== after.ino
      || stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || stat.ctimeMs !== after.ctimeMs) {
      throw new Error('Source cache changed while reading');
    }
    const parsed = JSON.parse(bytes) as typeof document;
    if (parsed.version === CACHE_VERSION && parsed.entries !== null && typeof parsed.entries === 'object') document = parsed;
  }
  return {
    get: (url) => document.entries[url], set: (url, entry) => { document.entries[url] = entry; },
    publish: () => {
      assertSafeCachePath(destination);
      let temporary: string | undefined;
      let temporaryIdentity: { dev: number; ino: number } | undefined;
      const createTemporaryId = dependencies.createTemporaryId ?? randomUUID;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = `${destination}.${createTemporaryId()}.tmp`;
        try {
          assertSafeCachePath(destination);
          writeFileSync(candidate, `${JSON.stringify(document, null, 2)}\n`, { flag: 'wx' });
          temporary = candidate;
          const temporaryStat = lstatSync(candidate);
          temporaryIdentity = { dev: temporaryStat.dev, ino: temporaryStat.ino };
          break;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        }
      }
      if (temporary === undefined) throw new Error('Could not allocate a unique source cache temporary file');
      try {
        dependencies.beforeRename?.();
        assertSafeCachePath(destination);
        const temporaryStat = lstatSync(temporary);
        if (!temporaryStat.isFile() || temporaryStat.isSymbolicLink()
          || temporaryStat.dev !== temporaryIdentity?.dev || temporaryStat.ino !== temporaryIdentity.ino) {
          throw new Error('Source cache temporary file changed before publication');
        }
        renameSync(temporary, destination);
        temporary = undefined;
      } finally {
        if (temporary !== undefined) removeOwnedCacheTemporary(temporary, temporaryIdentity, destination);
      }
    },
  };
}

function assertReportCanBePublished(path: string): void {
  const destination = resolve(path);
  let current = dirname(destination);
  while (true) {
    const ancestor = lstatSync(current, { throwIfNoEntry: false });
    if (ancestor?.isSymbolicLink()) throw new Error('Source report path must not traverse a symlink');
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const parent = lstatSync(dirname(destination));
  if (!parent.isDirectory() || parent.isSymbolicLink()) throw new Error('Source report parent must be a real directory');
  const stat = lstatSync(destination, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) throw new Error('Source report must not be a symlink');
  if (stat !== undefined && !stat.isFile()) throw new Error('Source report must be a regular file');
  if (stat?.isFile()) {
    const parsed: unknown = JSON.parse(readFileSync(destination, 'utf8'));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Existing source report must be a JSON object');
    }
  }
}

export async function runSourceCheckCli(argv = process.argv.slice(2)): Promise<number> {
  argv = restoreNpmRunArgs(argv, ['--input', '--report', '--source-cache'], ['--cache-only']);
  const inputs: string[] = [];
  let cachePath = resolve('content/reports/source-check-cache.json');
  let reportPath: string | undefined;
  let cacheOnly = false;
  if (argv.length > 0 && !argv.some((argument) => argument.startsWith('--'))) {
    inputs.push(...argv);
  } else {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') inputs.push(argv[++index] ?? '');
    else if (argv[index] === '--cache' || argv[index] === '--source-cache') cachePath = resolve(argv[++index] ?? '');
    else if (argv[index] === '--report') reportPath = resolve(argv[++index] ?? '');
    else if (argv[index] === '--cache-only') cacheOnly = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  }
  if (inputs.length === 0 || inputs.some((value) => value === '')) throw new Error('--input is required');
  if (reportPath === '') throw new Error('--report requires a path');
  if (reportPath !== undefined) assertReportCanBePublished(reportPath);
  const parsed = await readCsvInputs(inputs);
  const validationIssues = parsed.flatMap(({ file, pack }) => validateProductionCsvPack(pack).map((issue) => ({ file, ...issue })));
  if (validationIssues.length > 0) throw new Error(`Source input failed CSV validation: ${JSON.stringify(validationIssues)}`);
  const urls = parsed.flatMap(({ pack }) => pack.rows.map((row) => row.source_url));
  const cache = openFileSourceCache(cachePath);
  const results = await checkSourceUrls(urls, DEFAULT_DEPENDENCIES, { cache, cacheOnly });
  if (!cacheOnly) cache.publish();
  if (reportPath !== undefined) publishValidationReport(reportPath, { sources: results }, { placement: 'top-level' });
  process.stdout.write(`${JSON.stringify({ sources: results }, null, 2)}\n`);
  return results.some((result) => !result.ok) ? 1 : 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runSourceCheckCli().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2;
  });
}
