import { randomUUID } from 'node:crypto';
import {
  lstatSync, readFileSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contentCategorySetSchema, contentClueSchema, contentFinalClueSchema,
} from '../../src/shared/content/schema';
import { serializeStoredSource } from '../../src/shared/content/sourceCitation';
import { validatePack, type ParsedCsvRow, type ParsedPack } from '../../src/main/content/csvPacks';
import { readCsvInputs } from './readCsv';
import { RELEASE_COMPOSITION_THRESHOLDS, RELEASE_THRESHOLDS, type ReleaseSummary } from './releaseThresholds';

export type ValidationMode = 'batch' | 'release';
export type ValidationSeverity = 'error' | 'warning';

export interface ProductionValidationInput { file: string; pack: ParsedPack }

export interface ProductionValidationIssue {
  file: string;
  row: number;
  code: string;
  severity: ValidationSeverity;
  message: string;
  exceptionId?: string;
}

export interface ValidationException {
  id: string;
  code: string;
  clueId: string;
  reason: string;
}

export interface ProductionValidationResult {
  mode: ValidationMode;
  blocking: boolean;
  summary: ReleaseSummary;
  issues: ProductionValidationIssue[];
  exceptions: ValidationException[];
}

export interface ProductionValidationOptions {
  mode: ValidationMode;
  allowMissingEt?: boolean;
  reviewedExceptionIds?: readonly string[];
}

interface LocatedRow { file: string; row: ParsedCsvRow }

const CSV_CODE_MAP: Record<string, string> = {
  'duplicate-clue-id': 'DUPLICATE_ID',
  'duplicate-content-id': 'DUPLICATE_ID',
  'duplicate-clue-text': 'DUPLICATE_CLUE_TEXT',
  'duplicate-category-name': 'DUPLICATE_CATEGORY_NAME',
  'incomplete-category-set': 'MISSING_TIER',
  'invalid-round': 'INVALID_ROUND',
  'invalid-difficulty': 'INVALID_DIFFICULTY',
  'inconsistent-category-set': 'INCONSISTENT_CATEGORY_SET',
  'invalid-final-shape': 'INVALID_FINAL_SHAPE',
  'invalid-source-url': 'INVALID_SOURCE_URL',
  'invalid-source-date': 'INVALID_SOURCE_DATE',
  'invalid-translation-status': 'INVALID_TRANSLATION_STATUS',
  'incomplete-translation': 'MISSING_TRANSLATION',
};

const OFFICIAL_ARCHIVE_HOSTS = new Set([
  'j-archive.com', 'www.j-archive.com', 'jeopardyarchive.com', 'www.jeopardyarchive.com',
]);

const CHANGING_FACT = /\b(current(?:ly)?|latest|today|now|incumbent|president|prime minister|population|rank(?:ed|ing)?|record holder|largest|highest|most populous)\b/i;
const EXPLICIT_DATE = /\b(?:as of|in|on|during|for)\s+(?:the\s+)?(?:\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/i;
const PLACEHOLDER_CLUE = /\b(?:topic\s+\d+\s+tier\s+\d+\s+asks\s+for|final clue\s+\d+\s+for\s+(?:easy|medium|hard)\s+difficulty)\b/iu;
const PLACEHOLDER_RESPONSE = /\b(?:generated answer|answer for .+ topic\s+\d+)\b/iu;

function normalizeText(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
}

function canonicalNumbers(value: string): string[] {
  const matches = value.match(/[-+]?(?:\d{1,3}(?:[ ,.\u00A0]\d{3})+|\d+)(?:[.,]\d+)?(?:\s?(?:%|°[CF]?|km\/h|km|cm|mm|kg|mg|mph|m|g|l|ml))?/giu) ?? [];
  return matches.map((raw) => {
    const unit = raw.match(/(?:%|°[CF]?|km\/h|km|cm|mm|kg|mg|mph|m|g|l|ml)$/iu)?.[0]?.toLowerCase() ?? '';
    let number = raw.slice(0, raw.length - unit.length).trim().replace(/\s+/g, '');
    const comma = number.lastIndexOf(',');
    const dot = number.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? ',' : '.';
      number = number.replace(decimal === ',' ? /\./g : /,/g, '').replace(decimal, '.');
    } else if (comma >= 0) {
      const digits = number.length - comma - 1;
      number = digits === 3 ? number.replace(/,/g, '') : number.replace(',', '.');
    } else if (dot >= 0 && number.length - dot - 1 === 3) number = number.replace(/\./g, '');
    return `${number}${unit}`;
  }).sort();
}

function differsNumerically(en: string, et: string): boolean {
  return canonicalNumbers(en).join('|') !== canonicalNumbers(et).join('|');
}

function stableIssueSort(left: ProductionValidationIssue, right: ProductionValidationIssue): number {
  return left.file.localeCompare(right.file, 'en')
    || left.row - right.row
    || left.code.localeCompare(right.code, 'en')
    || left.message.localeCompare(right.message, 'en');
}

function isHttpsSource(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch { return false; }
}

function sourceHost(value: string): string | null {
  try { return new URL(value).hostname.toLowerCase(); } catch { return null; }
}

function validateSharedSchema(row: ParsedCsvRow): boolean {
  let source: string;
  try {
    source = serializeStoredSource({
      format: 'quiz-stage-csv-v1', title: row.source_title, url: row.source_url,
      license: row.source_license, retrievedAt: row.source_retrieved_at,
      translationStatus: row.translation_status as 'untranslated' | 'machine' | 'reviewed',
    });
  } catch { return false; }
  const localized = (en: string, et: string) => et.trim() === '' ? { en } : { en, et };
  if (row.content_kind === 'final') return contentFinalClueSchema.safeParse({
    id: row.clue_id, packId: row.pack_id, enabled: row.enabled === 'true',
    difficulty: row.difficulty, categoryId: row.category_set_id,
    categoryName: localized(row.category_name_en, row.category_name_et), round: 'final', tier: 0, value: 0,
    prompt: localized(row.clue_en, row.clue_et), response: localized(row.response_en, row.response_et),
    explanation: localized(row.explanation_en, row.explanation_et),
    ...(row.acceptedVariantsEn.length === 0 ? {} : { acceptedResponses: localized(row.accepted_variants_en, row.accepted_variants_et) }),
    source, lastSeenAt: null,
  }).success;
  const tier = Number(row.tier);
  const value = row.round === 'round-one' ? tier * 200 : tier * 400;
  return contentClueSchema.safeParse({
    id: row.clue_id, categoryId: row.category_set_id, round: row.round, tier, value,
    prompt: localized(row.clue_en, row.clue_et), response: localized(row.response_en, row.response_et),
    explanation: localized(row.explanation_en, row.explanation_et),
    ...(row.acceptedVariantsEn.length === 0 ? {} : { acceptedResponses: localized(row.accepted_variants_en, row.accepted_variants_et) }),
    source, enabled: row.enabled === 'true',
  }).success;
}

export function validateProductionContent(
  inputs: readonly ProductionValidationInput[],
  options: ProductionValidationOptions,
): ProductionValidationResult {
  if (options.allowMissingEt && options.mode !== 'batch') {
    throw new Error('--allow-missing-et is permitted only in batch mode');
  }
  const reviewed = new Set(options.reviewedExceptionIds ?? []);
  const issues: ProductionValidationIssue[] = [];
  const exceptionMap = new Map<string, ValidationException>();
  const located: LocatedRow[] = [];
  const add = (issue: ProductionValidationIssue) => issues.push(issue);

  for (const input of [...inputs].sort((a, b) => a.file.localeCompare(b.file, 'en'))) {
    for (const issue of validatePack(input.pack)) {
      const row = issue.row ?? 0;
      const parsed = input.pack.rows.find((candidate) => candidate.rowNumber === row);
      const sourceColumn = issue.column !== undefined && ['source_title', 'source_url', 'source_license', 'source_retrieved_at'].includes(issue.column);
      const code = sourceColumn && issue.code === 'required-field' ? 'MISSING_SOURCE' : (CSV_CODE_MAP[issue.code] ?? `CSV_${issue.code.toUpperCase().replaceAll('-', '_')}`);
      const missingTranslationException = code === 'MISSING_TRANSLATION' && options.allowMissingEt && parsed !== undefined;
      const exceptionId = parsed === undefined ? undefined : `missing-et:${parsed.clue_id}`;
      if (missingTranslationException) exceptionMap.set(exceptionId!, {
        id: exceptionId!, code: 'MISSING_TRANSLATION', clueId: parsed!.clue_id,
        reason: 'Batch authoring exception requested by --allow-missing-et',
      });
      add({
        file: input.file, row,
        code, severity: missingTranslationException ? 'warning' : 'error', message: issue.message,
        ...(missingTranslationException ? { exceptionId } : {}),
      });
    }
    for (const row of input.pack.rows) located.push({ file: input.file, row });
  }

  const idOwners = new Map<string, { namespace: 'pack' | 'category' | 'clue'; located: LocatedRow }>();
  const clueTexts = new Map<string, LocatedRow>();
  const categoryNames = new Map<string, { id: string; located: LocatedRow }>();
  const categoryRows = new Map<string, LocatedRow[]>();
  for (const item of located) {
    const { file, row } = item;
    for (const [id, namespace] of [[row.pack_id, 'pack'], [row.category_set_id, 'category'], [row.clue_id, 'clue']] as const) {
      const prior = idOwners.get(id);
      if (prior !== undefined && (prior.namespace !== namespace
        || (namespace === 'clue' && prior.located.row.clue_id === row.clue_id))) {
        add({ file, row: row.rowNumber, code: 'DUPLICATE_ID', severity: 'error', message: `Stable ID ${id} is reused across content namespaces or files` });
      } else if (prior === undefined) idOwners.set(id, { namespace, located: item });
    }
    const normalizedClue = normalizeText(row.clue_en);
    const priorClue = clueTexts.get(normalizedClue);
    if (normalizedClue !== '' && priorClue !== undefined && priorClue.row.clue_id !== row.clue_id) {
      add({ file, row: row.rowNumber, code: 'DUPLICATE_CLUE_TEXT', severity: 'error', message: `Normalized clue duplicates ${priorClue.row.clue_id}` });
    } else if (normalizedClue !== '') clueTexts.set(normalizedClue, item);
    const group = categoryRows.get(row.category_set_id) ?? [];
    group.push(item); categoryRows.set(row.category_set_id, group);

    if ([row.source_title, row.source_url, row.source_license, row.source_retrieved_at].some((value) => value.trim() === '')) {
      add({ file, row: row.rowNumber, code: 'MISSING_SOURCE', severity: 'error', message: 'Source title, HTTPS URL, license, and retrieval date are required' });
    } else if (!isHttpsSource(row.source_url)) {
      add({ file, row: row.rowNumber, code: 'SOURCE_URL_NOT_HTTPS', severity: 'error', message: 'Source URL must use HTTPS without credentials' });
    }
    if (OFFICIAL_ARCHIVE_HOSTS.has(sourceHost(row.source_url) ?? '')) {
      add({ file, row: row.rowNumber, code: 'OFFICIAL_ARCHIVE_HOST', severity: 'error', message: 'Official-show clue archive sources are forbidden' });
    }
    if (CHANGING_FACT.test(`${row.clue_en} ${row.response_en} ${row.explanation_en}`)
      && !EXPLICIT_DATE.test(`${row.clue_en} ${row.response_en} ${row.explanation_en}`)) {
      add({ file, row: row.rowNumber, code: 'UNDATED_CHANGING_FACT', severity: 'error', message: 'Time-sensitive wording requires an explicit date or as-of period' });
    }
    if (PLACEHOLDER_CLUE.test(row.clue_en)
      || PLACEHOLDER_RESPONSE.test(row.response_en)) {
      add({ file, row: row.rowNumber, code: 'PLACEHOLDER_CONTENT', severity: 'error', message: 'Generated placeholder records cannot be bundled as production content' });
    }

    const missingEt = [row.category_name_et, row.clue_et, row.response_et, row.explanation_et].some((value) => value.trim() === '')
      || (row.accepted_variants_en.trim() !== '' && row.accepted_variants_et.trim() === '');
    if (missingEt) {
      const id = `missing-et:${row.clue_id}`;
      if (options.allowMissingEt) exceptionMap.set(id, { id, code: 'MISSING_TRANSLATION', clueId: row.clue_id, reason: 'Batch authoring exception requested by --allow-missing-et' });
      add({ file, row: row.rowNumber, code: 'MISSING_TRANSLATION', severity: options.allowMissingEt ? 'warning' : 'error', message: 'Required Estonian content is missing', exceptionId: id });
    } else {
      const translatedPairs = [
        [row.category_name_en, row.category_name_et],
        [row.clue_en, row.clue_et], [row.response_en, row.response_et], [row.explanation_en, row.explanation_et],
        ...(row.accepted_variants_en.trim() === '' ? [] : [[row.accepted_variants_en, row.accepted_variants_et]]),
      ];
      if (translatedPairs.some(([en, et]) => en.trim().split(/\s+/).length > 1 && normalizeText(en) === normalizeText(et))) {
        const exceptionId = `translation:UNCHANGED_TRANSLATION:${row.clue_id}`;
        add({ file, row: row.rowNumber, code: 'UNCHANGED_TRANSLATION', severity: options.mode === 'release' && !reviewed.has(exceptionId) ? 'error' : 'warning', message: 'Multiword Estonian text is unchanged from English', exceptionId });
      }
      if (translatedPairs.some(([en, et]) => differsNumerically(en, et))) {
        add({ file, row: row.rowNumber, code: 'NUMBER_DRIFT', severity: 'error', message: 'English and Estonian numeric facts differ' });
      }
      const acronyms = `${row.clue_en} ${row.response_en}`.match(/\b[A-Z]{2,}\b/g) ?? [];
      const multiwordNames = `${row.clue_en} ${row.response_en}`.match(/\b(?:[A-Z][\p{L}'’-]+\s+){1,}[A-Z][\p{L}'’-]+\b/gu) ?? [];
      if ([...acronyms, ...multiwordNames].some((name) => !`${row.clue_et} ${row.response_et}`.includes(name))) {
        const exceptionId = `translation:SUSPICIOUS_PROPER_NOUN_CHANGE:${row.clue_id}`;
        add({ file, row: row.rowNumber, code: 'SUSPICIOUS_PROPER_NOUN_CHANGE', severity: options.mode === 'release' && !reviewed.has(exceptionId) ? 'error' : 'warning', message: 'A stable acronym or proper name changed in translation', exceptionId });
      }
      if (row.translation_status === 'untranslated') {
        add({ file, row: row.rowNumber, code: 'INVALID_TRANSLATION_STATUS', severity: 'error', message: 'Complete Estonian content must be marked machine or reviewed' });
      }
    }
    if (!validateSharedSchema(row)) {
      add({ file, row: row.rowNumber, code: 'SHARED_SCHEMA_INVALID', severity: 'error', message: 'Row does not satisfy the shared content schema' });
    }
  }

  for (const [categoryId, group] of categoryRows) {
    const first = group[0];
    const normalizedName = normalizeText(first.row.category_name_en);
    const priorName = categoryNames.get(normalizedName);
    if (normalizedName !== '' && priorName !== undefined && priorName.id !== categoryId) {
      add({ file: first.file, row: first.row.rowNumber, code: 'DUPLICATE_CATEGORY_NAME', severity: 'error', message: `Normalized category name duplicates ${priorName.id}` });
    } else if (normalizedName !== '') categoryNames.set(normalizedName, { id: categoryId, located: first });
    const metadata = group.map(({ row }) => [row.pack_id, row.content_kind, row.round, row.difficulty, row.macro_topic, normalizeText(row.category_name_en)].join('|'));
    if (new Set(metadata).size !== 1) add({ file: first.file, row: first.row.rowNumber, code: 'INCONSISTENT_CATEGORY_SET', severity: 'error', message: `Category set ${categoryId} has inconsistent round, difficulty, macro-topic, or name` });
    if (first.row.content_kind === 'board') {
      const tiers = group.map(({ row }) => Number(row.tier)).sort((a, b) => a - b);
      if (tiers.join(',') !== '1,2,3,4,5') add({ file: first.file, row: first.row.rowNumber, code: 'MISSING_TIER', severity: 'error', message: `Board category ${categoryId} must contain exactly tiers 1 through 5` });
      const category = {
        id: categoryId, packId: first.row.pack_id, round: first.row.round, difficulty: first.row.difficulty,
        name: first.row.category_name_et.trim() === '' ? { en: first.row.category_name_en } : { en: first.row.category_name_en, et: first.row.category_name_et },
        macroTopic: first.row.macro_topic, enabled: group.every(({ row }) => row.enabled === 'true'), lastSeenAt: null,
      };
      if (!contentCategorySetSchema.omit({ clues: true }).safeParse(category).success) add({ file: first.file, row: first.row.rowNumber, code: 'SHARED_SCHEMA_INVALID', severity: 'error', message: `Category set ${categoryId} does not satisfy the shared schema` });
    }
  }

  const validBoardGroups = [...categoryRows.values()].filter((group) => group[0].row.content_kind === 'board'
    && group.length === 5 && group.map(({ row }) => Number(row.tier)).sort((a, b) => a - b).join(',') === '1,2,3,4,5');
  const distinctBoardNames = new Set(validBoardGroups.map((group) => normalizeText(group[0].row.category_name_en)));
  const summary: ReleaseSummary = {
    boardClues: located.filter(({ row }) => row.content_kind === 'board').length,
    categorySets: validBoardGroups.length,
    distinctCategoryNames: distinctBoardNames.size,
    finalClues: located.filter(({ row }) => row.content_kind === 'final').length,
    easySets: validBoardGroups.filter((group) => group[0].row.difficulty === 'easy').length,
    mediumSets: validBoardGroups.filter((group) => group[0].row.difficulty === 'medium').length,
    hardSets: validBoardGroups.filter((group) => group[0].row.difficulty === 'hard').length,
  };
  if (distinctBoardNames.size < 12) add({ file: '<inventory>', row: 0, code: 'MATCH_CATEGORY_NAMES_SHORTAGE', severity: 'error', message: `At least 12 distinct board category names are required; found ${distinctBoardNames.size}` });
  if (options.mode === 'release') {
    const codes: Record<keyof ReleaseSummary, string> = {
      boardClues: 'RELEASE_BOARD_CLUES_SHORTAGE', categorySets: 'RELEASE_CATEGORY_SETS_SHORTAGE',
      distinctCategoryNames: 'RELEASE_CATEGORY_NAMES_SHORTAGE', finalClues: 'RELEASE_FINAL_CLUES_SHORTAGE',
      easySets: 'RELEASE_EASY_SETS_SHORTAGE', mediumSets: 'RELEASE_MEDIUM_SETS_SHORTAGE', hardSets: 'RELEASE_HARD_SETS_SHORTAGE',
    };
    for (const key of Object.keys(RELEASE_THRESHOLDS) as (keyof ReleaseSummary)[]) {
      if (summary[key] < RELEASE_THRESHOLDS[key]) add({ file: '<inventory>', row: 0, code: codes[key], severity: 'error', message: `${key} requires ${RELEASE_THRESHOLDS[key]}; found ${summary[key]}` });
    }
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const boardClues = located.filter(({ row }) => row.content_kind === 'board' && row.difficulty === difficulty).length;
      if (boardClues < RELEASE_COMPOSITION_THRESHOLDS.boardCluesPerDifficulty) add({
        file: '<inventory>', row: 0, code: `RELEASE_${difficulty.toUpperCase()}_BOARD_CLUES_SHORTAGE`, severity: 'error',
        message: `${difficulty} board clues require ${RELEASE_COMPOSITION_THRESHOLDS.boardCluesPerDifficulty}; found ${boardClues}`,
      });
      for (const round of ['round-one', 'round-two'] as const) {
        const sets = validBoardGroups.filter((group) => group[0].row.difficulty === difficulty && group[0].row.round === round).length;
        if (sets < RELEASE_COMPOSITION_THRESHOLDS.categorySetsPerDifficultyRound) add({
          file: '<inventory>', row: 0, code: `RELEASE_${difficulty.toUpperCase()}_${round === 'round-one' ? 'ROUND_ONE' : 'ROUND_TWO'}_SETS_SHORTAGE`, severity: 'error',
          message: `${difficulty} ${round} sets require ${RELEASE_COMPOSITION_THRESHOLDS.categorySetsPerDifficultyRound}; found ${sets}`,
        });
      }
      const finals = located.filter(({ row }) => row.content_kind === 'final' && row.difficulty === difficulty).length;
      if (finals < RELEASE_COMPOSITION_THRESHOLDS.finalCluesPerDifficulty) add({
        file: '<inventory>', row: 0, code: `RELEASE_${difficulty.toUpperCase()}_FINAL_CLUES_SHORTAGE`, severity: 'error',
        message: `${difficulty} Final clues require ${RELEASE_COMPOSITION_THRESHOLDS.finalCluesPerDifficulty}; found ${finals}`,
      });
    }
  }
  const sorted = issues.sort(stableIssueSort);
  return { mode: options.mode, blocking: sorted.some((issue) => issue.severity === 'error'), summary, issues: sorted, exceptions: [...exceptionMap.values()].sort((a, b) => a.id.localeCompare(b.id, 'en')) };
}

export interface ReportPublicationOptions {
  rename?: (from: string, to: string) => void;
  createTemporaryId?: () => string;
}

function assertNoSymlinkAncestors(path: string): void {
  let current = resolve(path);
  while (true) {
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Validation report path must not traverse a symlink: ${current}`);
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

export function publishValidationReport(path: string, validation: unknown, options: ReportPublicationOptions = {}): void {
  const destination = resolve(path);
  assertNoSymlinkAncestors(dirname(destination));
  const parent = lstatSync(dirname(destination));
  if (!parent.isDirectory() || parent.isSymbolicLink()) throw new Error('Validation report parent must be a real directory');
  const stat = lstatSync(destination, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) throw new Error('Validation report destination must not be a symlink');
  if (stat !== undefined && !stat.isFile()) throw new Error('Validation report destination must be a regular file');
  let existing: Record<string, unknown> = {};
  if (stat !== undefined) {
    const parsed: unknown = JSON.parse(readFileSync(destination, 'utf8'));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Existing report must be a JSON object');
    existing = parsed as Record<string, unknown>;
  }
  let temporary = '';
  const createTemporaryId = options.createTemporaryId ?? randomUUID;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = `${destination}.${createTemporaryId()}.tmp`;
    if (lstatSync(candidate, { throwIfNoEntry: false }) === undefined) { temporary = candidate; break; }
  }
  if (temporary === '') throw new Error('Could not allocate a unique validation report temporary file');
  try {
    writeFileSync(temporary, `${JSON.stringify({ ...existing, validation }, null, 2)}\n`, { flag: 'wx' });
    (options.rename ?? renameSync)(temporary, destination);
  } finally {
    try { unlinkSync(temporary); } catch { /* absent after successful rename */ }
  }
}

interface CliOptions { inputs: string[]; mode: ValidationMode; allowMissingEt: boolean; report: string }

function parseCli(argv: readonly string[]): CliOptions {
  if (argv.length >= 3 && !argv.some((argument) => argument.startsWith('--'))) {
    const modeIndex = argv.findIndex((argument) => argument === 'batch' || argument === 'release');
    if (modeIndex < 1 || modeIndex !== argv.length - 2) throw new Error('Expected input glob(s), mode, and report path');
    return {
      inputs: argv.slice(0, modeIndex), mode: argv[modeIndex] as ValidationMode,
      report: argv[modeIndex + 1], allowMissingEt: process.env.npm_config_allow_missing_et === 'true',
    };
  }
  const inputs: string[] = [];
  let mode: ValidationMode | undefined;
  let report: string | undefined;
  let allowMissingEt = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--input') inputs.push(argv[++index] ?? '');
    else if (argument === '--mode') {
      const value = argv[++index];
      if (value !== 'batch' && value !== 'release') throw new Error('--mode must be batch or release');
      mode = value;
    } else if (argument === '--report') report = argv[++index];
    else if (argument === '--allow-missing-et') allowMissingEt = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (inputs.length === 0 || inputs.some((value) => value === '')) throw new Error('--input is required');
  if (mode === undefined) throw new Error('--mode is required');
  if (report === undefined || report === '') throw new Error('--report is required');
  return { inputs, mode, allowMissingEt, report };
}

function reviewedIdsFromReport(path: string): string[] {
  const stat = lstatSync(resolve(path), { throwIfNoEntry: false });
  if (stat === undefined || stat.isSymbolicLink() || !stat.isFile()) return [];
  const report: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (report === null || typeof report !== 'object') return [];
  const translation = (report as { translation?: unknown }).translation;
  if (translation === null || typeof translation !== 'object') return [];
  const values = (translation as { exceptions?: unknown }).exceptions;
  if (!Array.isArray(values)) return [];
  return values.filter((item): item is { id: string; status: string; reviewerReason: string } =>
    item !== null && typeof item === 'object'
    && typeof (item as { id?: unknown }).id === 'string'
    && (item as { status?: unknown }).status === 'reviewed'
    && typeof (item as { reviewerReason?: unknown }).reviewerReason === 'string'
    && (item as { reviewerReason: string }).reviewerReason.trim() !== '').map((item) => item.id);
}

export async function runValidationCli(argv = process.argv.slice(2)): Promise<number> {
  const options = parseCli(argv);
  if (options.allowMissingEt && options.mode === 'release') throw new Error('--allow-missing-et is permitted only in batch mode');
  const inputs = await readCsvInputs(options.inputs);
  const result = validateProductionContent(inputs, {
    mode: options.mode, allowMissingEt: options.allowMissingEt,
    reviewedExceptionIds: reviewedIdsFromReport(options.report),
  });
  publishValidationReport(options.report, result);
  process.stdout.write(`${JSON.stringify(result.summary)}\n`);
  return result.blocking ? 1 : 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runValidationCli().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2;
  });
}
