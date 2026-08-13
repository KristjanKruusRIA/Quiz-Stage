import { isIP } from 'node:net';
import { lookup as dnsLookup } from 'node:dns';
import { resolve4, resolve6 } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { lstatSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { readCsvInputs } from './readCsv';
import { validatePack } from '../../src/main/content/csvPacks';

const USER_AGENT = 'Quiz Stage content source checker/0.1 (+offline desktop content validation)';
const OFFICIAL_ARCHIVE_HOSTS = new Set(['j-archive.com', 'www.j-archive.com', 'jeopardyarchive.com', 'www.jeopardyarchive.com']);
const CACHE_VERSION = 1;
const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60_000;

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

export interface SourceCheckOptions {
  concurrency?: number;
  maxAttempts?: number;
  timeoutMs?: number;
  initialBackoffMs?: number;
  maxRedirects?: number;
  cache?: SourceCache;
  cacheExpiryMs?: number;
}

export function createMemorySourceCache(entries: Record<string, SourceCacheEntry> = {}): SourceCache {
  const values = new Map(Object.entries(entries));
  return { get: (url) => values.get(url), set: (url, entry) => { values.set(url, entry); } };
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
    || (a === 192 && (b === 0 || b === 2)) || (a === 198 && (b === 18 || b === 19 || b === 51))
    || (a === 203 && b === 0) || a >= 240;
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

async function validateTarget(raw: string, dependencies: SourceCheckDependencies): Promise<{ url?: URL; error?: SourceCheckResult }> {
  let url: URL;
  try { url = new URL(raw); } catch { return { error: rejected(raw, 'SOURCE_URL_INVALID') }; }
  if (url.protocol !== 'https:') return { error: rejected(raw, 'SOURCE_URL_NOT_HTTPS') };
  if (url.username !== '' || url.password !== '') return { error: rejected(raw, 'SOURCE_URL_CREDENTIALS') };
  if ([...OFFICIAL_ARCHIVE_HOSTS].some((host) => url.hostname.toLowerCase() === host || url.hostname.toLowerCase().endsWith(`.${host}`))) return { error: rejected(raw, 'OFFICIAL_ARCHIVE_HOST') };
  if (url.hostname.toLowerCase() === 'localhost' || url.hostname.toLowerCase().endsWith('.localhost')) return { error: rejected(raw, 'SOURCE_PRIVATE_ADDRESS') };
  if (isPrivateAddress(url.hostname)) return { error: rejected(raw, 'SOURCE_PRIVATE_ADDRESS') };
  let addresses: string[];
  try { addresses = await dependencies.resolveHostname(url.hostname); } catch { return { error: rejected(raw, 'SOURCE_DNS_FAILURE') }; }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) return { error: rejected(raw, 'SOURCE_PRIVATE_ADDRESS') };
  return { url };
}

async function checkOne(raw: string, dependencies: SourceCheckDependencies, options: Required<Omit<SourceCheckOptions, 'cache'>> & { cache?: SourceCache }): Promise<SourceCheckResult> {
  const cached = options.cache?.get(raw);
  if (cached?.version === CACHE_VERSION && Date.parse(cached.expiresAt) > dependencies.now().getTime() && cached.result.ok) return cached.result;
  let target = raw;
  for (let redirects = 0; redirects <= options.maxRedirects; redirects += 1) {
    const checked = await validateTarget(target, dependencies);
    if (checked.error !== undefined) return { ...checked.error, url: raw };
    let lastStatus: number | null = null;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs);
      try {
        const response = await dependencies.fetch(checked.url!.href, {
          method: 'GET', redirect: 'manual', signal: controller.signal,
          headers: { accept: 'text/html,application/json;q=0.9,*/*;q=0.1', 'user-agent': USER_AGENT },
        });
        lastStatus = response.status;
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location === null) return { url: raw, ok: false, status: response.status, retrievedAt: null, code: 'SOURCE_REDIRECT_MISSING_LOCATION', finalUrl: checked.url!.href };
          target = new URL(location, checked.url).href;
          break;
        }
        if (response.status >= 200 && response.status < 400) {
          const result: SourceCheckResult = { url: raw, ok: true, status: response.status, retrievedAt: dependencies.now().toISOString(), code: null, finalUrl: checked.url!.href };
          options.cache?.set(raw, { version: CACHE_VERSION, expiresAt: new Date(dependencies.now().getTime() + options.cacheExpiryMs).toISOString(), result });
          return result;
        }
        if ((response.status === 429 || response.status >= 500) && attempt < options.maxAttempts) {
          const retryAfter = Number(response.headers.get('retry-after'));
          const backoff = Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.min(retryAfter * 1000, 60_000) : Math.min(options.initialBackoffMs * (2 ** (attempt - 1)), 60_000);
          await dependencies.sleep(backoff); continue;
        }
        return { url: raw, ok: false, status: response.status, retrievedAt: null, code: 'SOURCE_HTTP_STATUS', finalUrl: checked.url!.href };
      } catch {
        if (attempt < options.maxAttempts) { await dependencies.sleep(Math.min(options.initialBackoffMs * (2 ** (attempt - 1)), 60_000)); continue; }
        return { url: raw, ok: false, status: lastStatus, retrievedAt: null, code: 'SOURCE_REQUEST_FAILED', finalUrl: checked.url!.href };
      } finally { clearTimeout(timer); }
    }
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
    ...(inputOptions.cache === undefined ? {} : { cache: inputOptions.cache }),
  };
  const unique = [...new Set(urls)].sort(compareCodeUnits);
  const results = new Map<string, SourceCheckResult>();
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(options.concurrency, unique.length) }, async () => {
    while (true) {
      const index = next; next += 1;
      if (index >= unique.length) return;
      results.set(unique[index], await checkOne(unique[index], dependencies, options));
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

function fileCache(path: string): SourceCache & { publish(): void } {
  const destination = resolve(path);
  let document: { version: number; entries: Record<string, SourceCacheEntry> } = { version: CACHE_VERSION, entries: {} };
  const stat = lstatSync(destination, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) throw new Error('Source cache must not be a symlink');
  if (stat?.isFile()) {
    const parsed = JSON.parse(readFileSync(destination, 'utf8')) as typeof document;
    if (parsed.version === CACHE_VERSION && parsed.entries !== null && typeof parsed.entries === 'object') document = parsed;
  }
  return {
    get: (url) => document.entries[url], set: (url, entry) => { document.entries[url] = entry; },
    publish: () => {
      const parent = lstatSync(dirname(destination));
      if (!parent.isDirectory() || parent.isSymbolicLink()) throw new Error('Source cache parent must be a real directory');
      const temporary = `${destination}.${randomUUID()}.tmp`;
      try { writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, { flag: 'wx' }); renameSync(temporary, destination); }
      finally { try { unlinkSync(temporary); } catch { /* renamed or absent */ } }
    },
  };
}

export async function runSourceCheckCli(argv = process.argv.slice(2)): Promise<number> {
  const inputs: string[] = [];
  let cachePath = resolve('content/reports/source-check-cache.json');
  if (argv.length > 0 && !argv.some((argument) => argument.startsWith('--'))) {
    inputs.push(...argv);
    if (process.env.npm_config_cache !== undefined && process.env.npm_config_cache !== '') {
      cachePath = resolve(process.env.npm_config_cache);
    }
  } else {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') inputs.push(argv[++index] ?? '');
    else if (argv[index] === '--cache') cachePath = resolve(argv[++index] ?? '');
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  }
  if (inputs.length === 0 || inputs.some((value) => value === '')) throw new Error('--input is required');
  const parsed = await readCsvInputs(inputs);
  const validationIssues = parsed.flatMap(({ file, pack }) => validatePack(pack).map((issue) => ({ file, ...issue })));
  if (validationIssues.length > 0) throw new Error(`Source input failed CSV validation: ${JSON.stringify(validationIssues)}`);
  const urls = parsed.flatMap(({ pack }) => pack.rows.map((row) => row.source_url));
  const cache = fileCache(cachePath);
  const results = await checkSourceUrls(urls, DEFAULT_DEPENDENCIES, { cache });
  cache.publish();
  process.stdout.write(`${JSON.stringify({ sources: results }, null, 2)}\n`);
  return results.some((result) => !result.ok) ? 1 : 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runSourceCheckCli().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2;
  });
}
