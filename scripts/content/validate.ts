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
import { contentEvidenceSchema, readEvidenceInputs, type ContentEvidence } from './evidence';
import { findNearDuplicatePairs } from './nearDuplicate';
import {
  FINAL_BATCH, PRODUCTION_BATCHES, getProductionBatch, type ProductionBatchDefinition,
} from './productionBatches';
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
  evidenceByClueId?: ReadonlyMap<string, ContentEvidence>;
  batch?: ProductionBatchDefinition;
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

export const NON_WAIVABLE_CODES: ReadonlySet<string> = new Set([
  'MISSING_EVIDENCE',
  'SOURCE_MISMATCH',
  'GENERIC_SOURCE',
  'DUPLICATE_FACT',
  'NEAR_DUPLICATE_CLUE',
  'BOARD_FINAL_FACT_REUSE',
  'SUBTHEME_LIMIT',
  'BATCH_ALLOCATION',
  'OPENTDB_COMPOSITION',
  'PLACEHOLDER_CONTENT',
]);

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

function hasSpecificSupportingSource(evidence: ContentEvidence): boolean {
  let url: URL;
  try { url = new URL(evidence.supportingSource.url); } catch { return false; }
  if ((url.pathname === '' || url.pathname === '/') && url.search === '' && url.hash === '') return false;
  if (evidence.origin === 'wikidata') {
    return url.hostname.toLowerCase() === 'www.wikidata.org' && /^\/wiki\/Q[1-9]\d*$/.test(url.pathname);
  }
  if (evidence.origin === 'openTdbInspired') {
    return !new Set(['opentdb.com', 'www.opentdb.com']).has(url.hostname.toLowerCase());
  }
  return true;
}

const ALL_PRODUCTION_BATCHES: readonly ProductionBatchDefinition[] = [...PRODUCTION_BATCHES, FINAL_BATCH];

function batchForPack(packId: string): ProductionBatchDefinition | undefined {
  return ALL_PRODUCTION_BATCHES.find((batch) => batch.packId === packId);
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
  const add = (issue: ProductionValidationIssue) => {
    if (!NON_WAIVABLE_CODES.has(issue.code)) {
      issues.push(issue);
      return;
    }
    issues.push({
      file: issue.file,
      row: issue.row,
      code: issue.code,
      severity: 'error',
      message: issue.message,
    });
  };

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

  const evidenceRequired = options.mode === 'release'
    || options.batch !== undefined
    || options.evidenceByClueId !== undefined;
  const rowIds = new Set(located.map(({ row }) => row.clue_id));
  const rowLocations = new Map(located.map((item) => [item.row.clue_id, item]));
  const parsedEvidenceByClueId = new Map<string, ContentEvidence>();
  const invalidEvidenceKeys = new Set<string>();
  for (const [mapKey, rawEvidence] of options.evidenceByClueId ?? []) {
    const parsed = contentEvidenceSchema.safeParse(rawEvidence);
    const rawClueId = rawEvidence !== null && typeof rawEvidence === 'object'
      && typeof (rawEvidence as { clueId?: unknown }).clueId === 'string'
      ? (rawEvidence as { clueId: string }).clueId
      : undefined;
    const keyMismatch = rawClueId !== undefined && mapKey !== rawClueId;
    if (keyMismatch) {
      const location = rowLocations.get(mapKey);
      add({
        file: location?.file ?? '<evidence>',
        row: location?.row.rowNumber ?? 0,
        code: 'SOURCE_MISMATCH', severity: 'error',
        message: `Evidence map key ${mapKey} does not match clue ID ${rawClueId}`,
      });
    }
    if (!parsed.success) {
      invalidEvidenceKeys.add(mapKey);
      const location = rowLocations.get(mapKey);
      add({
        file: location?.file ?? '<evidence>',
        row: location?.row.rowNumber ?? 0,
        code: 'MISSING_EVIDENCE',
        severity: 'error',
        message: `Evidence at key ${mapKey} is invalid: ${parsed.error.issues[0].message}`,
      });
      continue;
    }
    if (keyMismatch) continue;
    if (!rowIds.has(parsed.data.clueId)) {
      add({
        file: '<evidence>', row: 0, code: 'SOURCE_MISMATCH', severity: 'error',
        message: `Evidence for ${parsed.data.clueId} has no CSV row`,
      });
      continue;
    }
    parsedEvidenceByClueId.set(mapKey, parsed.data);
  }

  const boundEvidenceByClueId = new Map<string, ContentEvidence>();
  const factOwners = new Map<string, { kinds: Set<string>; located: LocatedRow }>();
  for (const item of located) {
    const { file, row } = item;
    const evidence = parsedEvidenceByClueId.get(row.clue_id);
    if (evidence === undefined) {
      if (evidenceRequired && !invalidEvidenceKeys.has(row.clue_id)) add({
        file, row: row.rowNumber, code: 'MISSING_EVIDENCE', severity: 'error',
        message: `Clue ${row.clue_id} requires approved evidence`,
      });
      continue;
    }

    const translationReviewAgrees = (row.translation_status === 'reviewed') === (evidence.translationReview !== null);
    const translationReviewRequired = options.mode === 'release'
      && (row.translation_status !== 'reviewed' || evidence.translationReview === null);
    const invalidTranslationReview = !translationReviewAgrees || translationReviewRequired;
    if (invalidTranslationReview) {
      add({
        file, row: row.rowNumber, code: 'MISSING_EVIDENCE', severity: 'error',
        message: `Clue ${row.clue_id} requires matching reviewed translation status and evidence`,
      });
    }

    const expectedBatch = options.batch ?? batchForPack(row.pack_id);
    const canonicalAssertion = `${row.response_en.trim()} — ${row.explanation_en.trim()}`;
    const sourceMatches = evidence.supportingSource.title.trim() === row.source_title.trim()
      && evidence.supportingSource.url.trim() === row.source_url.trim()
      && evidence.supportingSource.license.trim() === row.source_license.trim()
      && evidence.supportingSource.retrievedAt.trim() === row.source_retrieved_at.trim();
    const sourceMismatch = evidence.clueId !== row.clue_id
      || expectedBatch === undefined
      || evidence.batchId !== expectedBatch.id
      || !sourceMatches
      || normalizeText(evidence.assertion) !== normalizeText(canonicalAssertion);
    if (sourceMismatch) {
      add({
        file, row: row.rowNumber, code: 'SOURCE_MISMATCH', severity: 'error',
        message: `Evidence for ${row.clue_id} does not match its CSV identity, batch, source, or assertion`,
      });
    }
    const genericSource = !hasSpecificSupportingSource(evidence);
    if (genericSource) add({
      file, row: row.rowNumber, code: 'GENERIC_SOURCE', severity: 'error',
      message: `Evidence for ${row.clue_id} requires a specific independent source URL`,
    });

    if (invalidTranslationReview || sourceMismatch || genericSource) continue;
    boundEvidenceByClueId.set(row.clue_id, evidence);

    const priorFact = factOwners.get(evidence.factKey);
    if (priorFact === undefined) {
      factOwners.set(evidence.factKey, { kinds: new Set([row.content_kind]), located: item });
    } else {
      add({
        file, row: row.rowNumber, code: 'DUPLICATE_FACT', severity: 'error',
        message: `Fact key ${evidence.factKey} repeats ${priorFact.located.row.clue_id}`,
      });
      if (!priorFact.kinds.has(row.content_kind)) add({
        file, row: row.rowNumber, code: 'BOARD_FINAL_FACT_REUSE', severity: 'error',
        message: `Fact key ${evidence.factKey} is shared by board and Final content`,
      });
      priorFact.kinds.add(row.content_kind);
    }
  }

  const clueLocations = new Map(located.map((item) => [item.row.clue_id, item]));
  for (const pair of findNearDuplicatePairs(located
    .filter(({ row }) => row.clue_en.trim() !== '')
    .map(({ row }) => ({ id: row.clue_id, text: row.clue_en })))) {
    const second = clueLocations.get(pair.secondId);
    if (second !== undefined) add({
      file: second.file, row: second.row.rowNumber, code: 'NEAR_DUPLICATE_CLUE', severity: 'error',
      message: `Clue ${pair.secondId} is near-duplicate wording of ${pair.firstId} (${pair.similarity.toFixed(3)})`,
    });
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

  const enforceBatchComposition = (batch: ProductionBatchDefinition, batchRows: readonly LocatedRow[]) => {
    const location = `<batch:${batch.id}>`;
    let allocationMismatch = batchRows.some(({ row }) => row.pack_id !== batch.packId);
    const groups = new Map<string, LocatedRow[]>();
    for (const item of batchRows) {
      const group = groups.get(item.row.category_set_id) ?? [];
      group.push(item);
      groups.set(item.row.category_set_id, group);
    }

    if (batch.distribution !== null) {
      allocationMismatch ||= batchRows.length !== batch.boardClues
        || batchRows.some(({ row }) => row.content_kind !== 'board')
        || groups.size !== batch.boardClues / 5
        || batchRows.some(({ row }) => !batch.subthemes.includes(row.macro_topic));

      const setRows = [...groups.values()];
      for (const group of setRows) {
        const tiers = group.map(({ row }) => Number(row.tier)).sort((left, right) => left - right).join(',');
        const metadata = new Set(group.map(({ row }) => [
          row.pack_id, row.content_kind, row.round, row.difficulty, row.macro_topic,
        ].join('|')));
        if (group.length !== 5 || tiers !== '1,2,3,4,5' || metadata.size !== 1) allocationMismatch = true;
      }

      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        for (const round of ['round-one', 'round-two'] as const) {
          const actual = setRows.filter((group) => group[0]?.row.difficulty === difficulty
            && group[0]?.row.round === round).length;
          const expected = batch.distribution[difficulty][round === 'round-one' ? 'roundOne' : 'roundTwo'];
          if (actual !== expected) allocationMismatch = true;
        }
      }

      for (const subtheme of batch.subthemes) {
        const count = setRows.filter((group) => group[0]?.row.macro_topic === subtheme).length;
        if (count > batch.maxSetsPerSubtheme) add({
          file: location, row: 0, code: 'SUBTHEME_LIMIT', severity: 'error',
          message: `${batch.id} subtheme ${subtheme} has ${count} sets; maximum is ${batch.maxSetsPerSubtheme}`,
        });
      }
    } else {
      allocationMismatch ||= batchRows.length !== batch.finalClues
        || batchRows.some(({ row }) => row.content_kind !== 'final')
        || batchRows.some(({ row }) => !batch.subthemes.includes(row.macro_topic));
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        if (batchRows.filter(({ row }) => row.difficulty === difficulty).length !== 50) allocationMismatch = true;
      }
      for (const family of batch.subthemes) {
        const count = batchRows.filter(({ row }) => row.macro_topic === family).length;
        if (count !== 12 && count !== 13) allocationMismatch = true;
      }
    }

    if (allocationMismatch) add({
      file: location, row: 0, code: 'BATCH_ALLOCATION', severity: 'error',
      message: `${batch.id} does not match its required pack, kind, count, set, subtheme, or difficulty allocation`,
    });

    const openTdbCount = [...boundEvidenceByClueId.values()]
      .filter((evidence) => evidence.batchId === batch.id && evidence.origin === 'openTdbInspired').length;
    if (openTdbCount !== batch.requiredOpenTdbClues) add({
      file: location, row: 0, code: 'OPENTDB_COMPOSITION', severity: 'error',
      message: `${batch.id} requires ${batch.requiredOpenTdbClues} OpenTDB-inspired evidence records; found ${openTdbCount}`,
    });
  };

  if (options.batch !== undefined) {
    enforceBatchComposition(options.batch, located);
  } else if (options.mode === 'release') {
    for (const batch of ALL_PRODUCTION_BATCHES) {
      enforceBatchComposition(batch, located.filter(({ row }) =>
        boundEvidenceByClueId.get(row.clue_id)?.batchId === batch.id));
    }
  }

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

interface CliOptions {
  inputs: string[];
  evidence: string[];
  mode: ValidationMode;
  allowMissingEt: boolean;
  report: string;
  batchId?: string;
}

function parseCli(argv: readonly string[]): CliOptions {
  if (argv.length >= 3 && !argv.some((argument) => argument.startsWith('--'))) {
    const modeIndex = argv.findIndex((argument) => argument === 'batch' || argument === 'release');
    if (modeIndex < 1 || modeIndex !== argv.length - 2) throw new Error('Expected input glob(s), mode, and report path');
    return {
      inputs: argv.slice(0, modeIndex), mode: argv[modeIndex] as ValidationMode,
      evidence: [], report: argv[modeIndex + 1],
      allowMissingEt: process.env.npm_config_allow_missing_et === 'true',
    };
  }
  const inputs: string[] = [];
  const evidence: string[] = [];
  let mode: ValidationMode | undefined;
  let report: string | undefined;
  let batchId: string | undefined;
  let allowMissingEt = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--input') inputs.push(argv[++index] ?? '');
    else if (argument === '--evidence') evidence.push(argv[++index] ?? '');
    else if (argument === '--batch') batchId = argv[++index] ?? '';
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
  if (evidence.some((value) => value === '')) throw new Error('--evidence requires a glob');
  if (batchId === '') throw new Error('--batch requires an ID');
  return { inputs, evidence, mode, allowMissingEt, report, ...(batchId === undefined ? {} : { batchId }) };
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
  const evidenceByClueId = options.evidence.length === 0
    ? undefined
    : await readEvidenceInputs(options.evidence);
  const result = validateProductionContent(inputs, {
    mode: options.mode, allowMissingEt: options.allowMissingEt,
    reviewedExceptionIds: reviewedIdsFromReport(options.report),
    ...(evidenceByClueId === undefined ? {} : { evidenceByClueId }),
    ...(options.batchId === undefined ? {} : { batch: getProductionBatch(options.batchId) }),
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
