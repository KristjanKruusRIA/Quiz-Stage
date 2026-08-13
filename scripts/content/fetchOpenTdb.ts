import { lstatSync, mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';
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
  adaptOpenTdbQuestion, buildOpenTdbDuplicateKey, type OpenTdbAdaptedCandidate,
  type OpenTdbDecodedQuestion, type OpenTdbRawQuestion, OPEN_TDB_SOURCE_LICENSE, OPEN_TDB_SOURCE_TITLE,
  OPEN_TDB_SOURCE_URL, sanitizeOpenTdbText,
} from './adaptOpenTdb';

const USER_AGENT = 'Quiz Stage content fetcher/0.1 (+OpenTDB candidate ingestion)';
const DEFAULT_OUTPUT_PATH = resolve(CANDIDATE_ROOT, 'opentdb-candidates.jsonl');
const DEFAULT_CHECKPOINT_PATH = resolve(CANDIDATE_ROOT, 'opentdb-checkpoint.json');
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_MIN_REQUEST_DELAY_MS = 5_000;
const DEFAULT_MAX_ATTEMPTS = 5;

interface ResponseLike {
  status: number;
  headers: {
    get(name: string): string | null;
  };
  body: string;
}

export interface OpenTdbHttpDependencies {
  request(url: string, init?: RequestInit): Promise<ResponseLike>;
  sleep(milliseconds: number): Promise<void>;
  now(): Date;
}

interface OpenTdbFetchOptions {
  output: string;
  checkpoint: string;
  resume: boolean;
  target: number | null;
  delayMs: number;
  maxAttempts: number;
  dependencies?: OpenTdbHttpDependencies;
}

interface OpenTdbRawTokenResponse {
  response_code: number;
  response_message: string;
  token?: string;
}

interface OpenTdbRawCountResponse {
  overall?: unknown;
  response_code?: number;
}

interface OpenTdbRawQuestionResponse {
  response_code: number;
  response_message: string;
  results: OpenTdbRawQuestion[];
  response_message?: string;
}

interface OpenTdbCheckpointState {
  version: 1;
  token: string;
  seenKeys: string[];
  seenSourceIds: string[];
  fetchedAt: string;
}

interface OpenTdbFetchResult {
  totalWritten: number;
  totalSkipped: number;
  tokenExhausted: boolean;
}

function decodeBase64Json(value: string): string {
  return Buffer.from(value, 'base64').toString('utf8');
}

function decodeQuestion(raw: OpenTdbRawQuestion): OpenTdbDecodedQuestion {
  const candidate: OpenTdbDecodedQuestion = {
    category: decodeBase64Json(raw.category),
    type: parseQuestionType(decodeBase64Json(raw.type)),
    difficulty: parseDifficulty(decodeBase64Json(raw.difficulty)),
    question: decodeBase64Json(raw.question),
    correct_answer: decodeBase64Json(raw.correct_answer),
    incorrect_answers: raw.incorrect_answers.map((answer) => decodeBase64Json(answer)),
  };
  return candidate;
}

function parseQuestionType(value: string): 'multiple' | 'boolean' {
  if (value === 'multiple' || value === 'boolean') return value;
  throw new Error(`OpenTDB returned unsupported question type: ${value}`);
}

function parseDifficulty(value: string): 'easy' | 'medium' | 'hard' {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  throw new Error(`OpenTDB returned unsupported difficulty: ${value}`);
}

function parseRetryAfter(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function defaultDependencies(): OpenTdbHttpDependencies {
  return {
    request: async (url, init) => {
      const response = await fetch(url, {
        headers: {
          ...init?.headers,
          'user-agent': USER_AGENT,
          accept: 'application/json',
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
    throw new Error(`OpenTDB path parent must be a directory: ${dirname(path)}`);
  }
}

function parseOpenTdbResponse<T>(body: string): T {
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`OpenTDB response was not valid JSON: ${body.slice(0, 120)}`);
  }
}

function parseTokenResponse(body: string): OpenTdbRawTokenResponse {
  const parsed = parseOpenTdbResponse<OpenTdbRawTokenResponse>(body);
  if (parsed.response_code !== 0 || typeof parsed.token !== 'string' || parsed.token === '') {
    throw new Error(`OpenTDB token request failed: ${parsed.response_message}`);
  }
  return parsed;
}

async function requestWithRetries(
  url: string,
  options: { dependencies: OpenTdbHttpDependencies; maxAttempts: number; },
  attempt = 1,
): Promise<string> {
  let response: ResponseLike;
  try {
    response = await options.dependencies.request(url, { headers: { 'user-agent': USER_AGENT } });
  } catch (error) {
    if (attempt >= options.maxAttempts) throw error;
    const backoff = Math.min(250 * 2 ** (attempt - 1), 60_000);
    await options.dependencies.sleep(Math.max(200, backoff));
    return requestWithRetries(url, options, attempt + 1);
  }
  if ((response.status === 429 || response.status >= 500) && attempt < options.maxAttempts) {
    const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
    const backoff = retryAfter !== null
      ? Math.min(retryAfter * 1000, 60_000)
      : 250 * 2 ** (attempt - 1);
    await options.dependencies.sleep(Math.max(200, backoff));
    return requestWithRetries(url, options, attempt + 1);
  }
  if (response.status !== 200) throw new Error(`OpenTDB request failed with status: ${response.status}`);
  return response.body;
}

function parseQuestionResponse(text: string): OpenTdbRawQuestionResponse {
  const response = parseOpenTdbResponse<OpenTdbRawQuestionResponse>(text);
  if (!Array.isArray(response.results)) {
    throw new Error(`OpenTDB page response is malformed: results missing`);
  }
  return response;
}

async function requestToken(dependencies: OpenTdbHttpDependencies, maxAttempts: number): Promise<string> {
  const body = await requestWithRetries('https://opentdb.com/api_token.php?command=request', { dependencies, maxAttempts });
  return parseTokenResponse(body).token!;
}

async function requestQuestions(token: string, dependencies: OpenTdbHttpDependencies, attempts: number): Promise<OpenTdbRawQuestionResponse> {
  const url = `https://opentdb.com/api.php?amount=${DEFAULT_PAGE_SIZE}&encode=base64&token=${token}`;
  const body = await requestWithRetries(url, { dependencies, maxAttempts: attempts });
  return parseQuestionResponse(body);
}

async function requestCategoryCount(dependencies: OpenTdbHttpDependencies, maxAttempts = DEFAULT_MAX_ATTEMPTS): Promise<OpenTdbRawCountResponse> {
  const response = await requestWithRetries('https://opentdb.com/api_count_global.php', { dependencies, maxAttempts });
  return parseOpenTdbResponse<OpenTdbRawCountResponse>(response);
}

function loadCheckpoint(path: string): OpenTdbCheckpointState | null {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8');
  const parsed = parseOpenTdbResponse<OpenTdbCheckpointState>(raw);
  if (parsed.version !== 1 || typeof parsed.token !== 'string') {
    throw new Error(`OpenTDB checkpoint is invalid: ${path}`);
  }
  return {
    version: 1,
    token: parsed.token,
    seenKeys: Array.isArray(parsed.seenKeys) ? parsed.seenKeys.filter((value): value is string => typeof value === 'string') : [],
    seenSourceIds: Array.isArray(parsed.seenSourceIds) ? parsed.seenSourceIds.filter((value): value is string => typeof value === 'string') : [],
    fetchedAt: typeof parsed.fetchedAt === 'string' && parsed.fetchedAt !== '' ? parsed.fetchedAt : new Date(0).toISOString(),
  };
}

function writeCheckpoint(path: string, state: OpenTdbCheckpointState): void {
  const destination = resolve(path);
  assertCandidateOutputPath(destination);
  ensureRegularDirectory(destination);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  const payload = `${JSON.stringify(state)}\n`;
  assertCandidateOutputPath(destination);
  assertCandidateOutputPath(temporary);
  try {
    writeFileSync(temporary, payload, { flag: 'wx' });
    assertCandidateOutputPath(destination);
    assertCandidateOutputPath(temporary);
    renameSync(temporary, destination);
  } finally {
    try {
      assertCandidateOutputPath(temporary);
      unlinkSync(temporary);
    } catch { /* already renamed or no longer safe */ }
  }
}

function loadExistingDuplicateKeys(output: string): Set<string> {
  if (!existsSync(output)) return new Set();
  const raw = readFileSync(output, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== '');
  const keys = new Set<string>();
  for (const line of lines) {
    const parsed = parseOpenTdbResponse<{ normalizedDuplicateKey?: string }>(line);
    if (typeof parsed.normalizedDuplicateKey === 'string') keys.add(parsed.normalizedDuplicateKey);
  }
  return keys;
}

function publishCandidates(
  output: string,
  existing: string,
  candidates: readonly OpenTdbAdaptedCandidate[],
): void {
  const separator = candidates.length > 0 && existing !== '' && !existing.endsWith('\n') ? '\n' : '';
  const appended = candidates.length === 0
    ? ''
    : `${candidates.map((candidate) => JSON.stringify(candidate)).join('\n')}\n`;
  const payload = `${existing}${separator}${appended}`;
  const temporary = `${output}.${randomUUID()}.tmp`;
  try {
    assertCandidateOutputPath(output);
    ensureRegularDirectory(output);
    assertCandidateOutputPath(temporary);
    writeFileSync(temporary, payload, { flag: 'wx' });
    assertCandidateOutputPath(output);
    assertCandidateOutputPath(temporary);
    renameSync(temporary, output);
  } finally {
    try {
      assertCandidateOutputPath(temporary);
      unlinkSync(temporary);
    } catch { /* already renamed or no longer safe */ }
  }
}

async function fetchOpenTdbCandidates(options: OpenTdbFetchOptions): Promise<OpenTdbFetchResult> {
  assertCandidateOutputPath(options.output);
  assertCandidateOutputPath(options.checkpoint);
  const dependencies = options.dependencies ?? defaultDependencies();
  ensureRegularDirectory(options.output);
  const existingOutput = options.resume && existsSync(options.output) ? readFileSync(options.output, 'utf8') : '';
  const outputCandidates = options.resume ? loadExistingDuplicateKeys(options.output) : new Set<string>();
  const checkpoint = options.resume ? loadCheckpoint(options.checkpoint) : null;
  const seenSourceIds = checkpoint === null ? new Set<string>() : new Set(checkpoint.seenSourceIds);
  const token = checkpoint?.token ?? await requestToken(dependencies, options.maxAttempts);
  const fetchedAt = dependencies.now().toISOString();

  let totalWritten = 0;
  let totalSkipped = 0;
  let tokenExhausted = false;
  const stagedCandidates: OpenTdbAdaptedCandidate[] = [];

  await requestCategoryCount(dependencies, options.maxAttempts).catch(() => undefined);

  while (options.target === null || totalWritten < options.target) {
    await dependencies.sleep(options.delayMs);
    const page = await requestQuestions(token, dependencies, options.maxAttempts);
    if (page.response_code === 4) {
      tokenExhausted = true;
      break;
    }
    if (page.response_code === 1) {
      break;
    }
    if (page.response_code !== 0) {
      throw new Error(`OpenTDB page request returned ${page.response_code}: ${page.response_message}`);
    }

    const pageCandidates = page.results.map((row) => adaptOpenTdbQuestion(decodeQuestion(row), fetchedAt));
    for (const candidate of pageCandidates) {
      if (outputCandidates.has(candidate.normalizedDuplicateKey) || seenSourceIds.has(candidate.sourceId)) {
        totalSkipped += 1;
        continue;
      }
      outputCandidates.add(candidate.normalizedDuplicateKey);
      seenSourceIds.add(candidate.sourceId);
      stagedCandidates.push(candidate);
      totalWritten += 1;
      if (options.target !== null && totalWritten >= options.target) break;
    }
    if (options.target !== null && totalWritten >= options.target) break;
  }

  publishCandidates(options.output, existingOutput, stagedCandidates);
  writeCheckpoint(options.checkpoint, {
    version: 1,
    token,
    seenKeys: [...outputCandidates],
    seenSourceIds: [...seenSourceIds],
    fetchedAt,
  });
  return { totalWritten, totalSkipped, tokenExhausted };
}

export async function runOpenTdbFetch(argv: string[] = process.argv.slice(2)): Promise<number> {
  const dependencies = defaultDependencies();
  const options: OpenTdbFetchOptions = {
    output: DEFAULT_OUTPUT_PATH,
    checkpoint: DEFAULT_CHECKPOINT_PATH,
    resume: false,
    target: null,
    delayMs: DEFAULT_MIN_REQUEST_DELAY_MS,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--output') {
      const output = argv[index + 1];
      if (output === undefined) throw new Error('--output requires a path');
      options.output = resolve(output);
      index += 1;
    } else if (argument === '--checkpoint') {
      const checkpoint = argv[index + 1];
      if (checkpoint === undefined) throw new Error('--checkpoint requires a path');
      options.checkpoint = resolve(checkpoint);
      index += 1;
    } else if (argument === '--resume') {
      options.resume = true;
    } else if (argument === '--target') {
      const target = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isInteger(target) || target <= 0) throw new Error('--target must be a positive integer');
      options.target = target;
      index += 1;
    } else if (argument === '--delay-ms') {
      const delay = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isInteger(delay) || delay < 0) throw new Error('--delay-ms must be zero or greater');
      options.delayMs = delay;
      index += 1;
    } else if (argument === '--max-attempts') {
      const attempts = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isInteger(attempts) || attempts <= 0) throw new Error('--max-attempts must be a positive integer');
      options.maxAttempts = attempts;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  assertCandidateOutputPath(options.output);
  assertThirdPartyNoticeOutputPath(THIRD_PARTY_NOTICE_PATH);
  assertCandidateOutputPath(options.checkpoint);
  assertCandidateOutputPath(options.output);
  mkdirSync(dirname(options.output), { recursive: true });
  assertCandidateOutputPath(options.checkpoint);
  mkdirSync(dirname(options.checkpoint), { recursive: true });

  const result = await fetchOpenTdbCandidates({ ...options, dependencies });
  process.stdout.write(JSON.stringify({
    candidates: result.totalWritten,
    skipped: result.totalSkipped,
    tokenExhausted: result.tokenExhausted,
  }, null, 2));

  const line = `- OpenTDB fetch: ${result.totalWritten} draft candidates on ${dependencies.now().toISOString()} from OpenTDB (retrieved ${new Date().toISOString()})\n`;
  appendIfNotPresent(THIRD_PARTY_NOTICE_PATH, line);
  return 0;
}

export function appendIfNotPresent(path: string, line: string): void {
  assertThirdPartyNoticeOutputPath(path);
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (existing.includes(line.trim())) return;
  assertThirdPartyNoticeOutputPath(path);
  writeFileSync(path, `${existing}${existing.endsWith('\n') || existing === '' ? '' : '\n'}${line}`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runOpenTdbFetch(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}

export { buildOpenTdbDuplicateKey, fetchOpenTdbCandidates, parseQuestionResponse, requestCategoryCount };
