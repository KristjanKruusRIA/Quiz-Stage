import { randomUUID } from 'node:crypto';
import {
  closeSync, existsSync, fstatSync, lstatSync, openSync, readSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { TextDecoder } from 'node:util';
import type { DatabaseConnection } from '../persistence/database';
import type { ContentRepository } from './contentRepository';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { contentIdSchema } from '../../shared/content/schema';
import { CSV_COLUMNS, type CsvColumn } from '../../shared/content/csvColumns';

const BOARD_ROUNDS = ['round-one', 'round-two'] as const;
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const TRANSLATION_STATUSES = ['untranslated', 'machine', 'reviewed'] as const;
const CSV_SOURCE_FORMAT = 'quiz-stage-csv-v1';

// These bounds comfortably exceed the bundled library while keeping synchronous main-process work finite.
export const CSV_PACK_LIMITS = {
  maxFileBytes: 16 * 1024 * 1024,
  maxRows: 10_000,
  maxRecordBytes: 128 * 1024,
  maxFieldCharacters: 32 * 1024,
} as const;

type BoardRound = (typeof BOARD_ROUNDS)[number];
type Difficulty = (typeof DIFFICULTIES)[number];
type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];
type CsvFields = Record<CsvColumn, string>;

export type ParsedCsvRow = CsvFields & {
  rowNumber: number;
  acceptedVariantsEn: string[];
  acceptedVariantsEt: string[];
  variantErrors: CsvColumn[];
};

export interface ParsedPack {
  rows: ParsedCsvRow[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  row?: number;
  column?: CsvColumn;
}

export interface CsvPackRecord {
  clueId: string;
  packId: string;
  packName: string;
  categorySetId: string;
  contentKind: 'board' | 'final';
  round: BoardRound | 'final';
  tier: number;
  difficulty: Difficulty;
  macroTopic: string;
  categoryNameEn: string;
  categoryNameEt?: string;
  clueEn: string;
  clueEt?: string;
  responseEn: string;
  responseEt?: string;
  acceptedVariantsEn: string[];
  acceptedVariantsEt: string[];
  explanationEn: string;
  explanationEt?: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceLicense: string;
  sourceRetrievedAt: string;
  translationStatus: TranslationStatus;
  enabled: boolean;
}

export interface PackImportPreview {
  packId: string;
  packName: string;
  rowCount: number;
  conflict: boolean;
  issues: ValidationIssue[];
  records: CsvPackRecord[];
}

export type ImportConflictStrategy = 'replace-existing' | 'keep-both';

export interface ImportPackOptions {
  database: DatabaseConnection;
  repository: ContentRepository;
  preview: PackImportPreview;
  conflict?: ImportConflictStrategy;
  createId?: () => string;
}

export interface ExportPackOptions {
  database: DatabaseConnection;
  packId: string;
  destination: string;
  writeFile?: (path: string, data: Uint8Array) => void;
}

export interface CsvPackWorkflowOptions {
  createPreviewId?: () => string;
  readFile?: (path: string) => string;
}

interface CsvFileEntry {
  dev: number | bigint;
  ino: number | bigint;
  size: number;
  isFile(): boolean;
  isSymbolicLink(): boolean;
}

export interface CsvFileReadPort {
  lstat(path: string): CsvFileEntry;
  open(path: string): number;
  fstat(descriptor: number): CsvFileEntry;
  read(descriptor: number, buffer: Buffer, offset: number, length: number, position: null): number;
  close(descriptor: number): void;
}

const NODE_CSV_FILE_READ_PORT: CsvFileReadPort = {
  lstat: (path) => lstatSync(path),
  open: (path) => openSync(path, 'r'),
  fstat: (descriptor) => fstatSync(descriptor),
  read: (descriptor, buffer, offset, length, position) =>
    readSync(descriptor, buffer, offset, length, position),
  close: (descriptor) => closeSync(descriptor),
};

export class CsvPackWorkflow {
  private readonly previews = new Map<string, PackImportPreview>();
  private readonly createPreviewId: () => string;
  private readonly readFile: (path: string) => string;

  constructor(
    private readonly database: DatabaseConnection,
    private readonly repository: ContentRepository,
    options: CsvPackWorkflowOptions = {},
  ) {
    this.createPreviewId = options.createPreviewId ?? randomUUID;
    this.readFile = options.readFile ?? readPackCsvFile;
  }

  previewFile(path: string) {
    const preview = previewPackImport({ database: this.database, text: this.readFile(path) });
    let previewId = '';
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = contentIdSchema.parse(this.createPreviewId());
      if (!this.previews.has(candidate)) {
        previewId = candidate;
        break;
      }
    }
    if (previewId === '') throw new Error('Could not generate a unique CSV preview ID');
    this.previews.set(previewId, preview);
    return {
      previewId,
      packId: preview.packId,
      packName: preview.packName,
      rowCount: preview.rowCount,
      conflict: preview.conflict,
      issues: preview.issues,
    };
  }

  importPreview(input: { previewId: string; conflict?: ImportConflictStrategy }) {
    const preview = this.previews.get(input.previewId);
    if (preview === undefined) throw new Error('Unknown or expired CSV import preview');
    const result = importPack({
      database: this.database,
      repository: this.repository,
      preview,
      ...(input.conflict === undefined ? {} : { conflict: input.conflict }),
    });
    this.previews.delete(input.previewId);
    return result;
  }

  exportToFile(packId: string, destination: string) {
    return exportPack({ database: this.database, packId, destination });
  }
}

interface StoredCsvSource {
  format: typeof CSV_SOURCE_FORMAT;
  title: string;
  url: string;
  license: string;
  retrievedAt: string;
  translationStatus: TranslationStatus;
}

interface ExportRow {
  pack_id: string;
  pack_name: string;
  pack_enabled: number;
  category_set_id: string;
  category_round: BoardRound | 'final' | 'tiebreaker';
  difficulty: Difficulty;
  macro_topic: string;
  category_name_json: string;
  category_enabled: number;
  clue_id: string;
  clue_round: BoardRound | 'final' | 'tiebreaker';
  tier: number;
  prompt_json: string;
  response_json: string;
  explanation_json: string;
  accepted_responses_json: string | null;
  source: string;
  clue_enabled: number;
  override_json: string | null;
}

export function parsePackCsv(text: string): ParsedPack {
  if (Buffer.byteLength(text, 'utf8') > CSV_PACK_LIMITS.maxFileBytes) {
    throw new Error(`CSV file exceeds the ${CSV_PACK_LIMITS.maxFileBytes}-byte limit`);
  }
  const withoutInitialBom = text.startsWith('\uFEFF') ? text.slice(1) : text;
  if (withoutInitialBom.includes('\uFEFF')) {
    throw new Error('A UTF-8 BOM is allowed only at the start of the CSV file');
  }
  const parseOptions = {
    bom: false,
    columns: false,
    delimiter: ',',
    record_delimiter: ['\r\n', '\n'],
    relax_quotes: false,
    skip_empty_lines: true,
    max_record_size: CSV_PACK_LIMITS.maxRecordBytes,
  };
  let header: string[][];
  try {
    header = parse(withoutInitialBom, {
      ...parseOptions,
      relax_column_count: true,
      to_line: 1,
    }) as string[][];
  } catch (error) {
    if (error instanceof Error && /max(?:imum)? record|record.*size/i.test(error.message)) {
      throw new Error(`CSV record exceeds the ${CSV_PACK_LIMITS.maxRecordBytes}-byte limit`);
    }
    throw error;
  }
  if (header.length === 0) throw new Error('CSV header is missing');
  if (!sameColumns(header[0])) {
    throw new Error(`CSV header must exactly match: ${CSV_COLUMNS.join(',')}`);
  }
  let parsed: string[][];
  let parsedRecordCount = 0;
  try {
    parsed = parse(withoutInitialBom, {
      ...parseOptions,
      relax_column_count: false,
      on_record: (record: string[]) => {
        parsedRecordCount += 1;
        if (parsedRecordCount > CSV_PACK_LIMITS.maxRows + 1) {
          throw new Error(`CSV row count exceeds the ${CSV_PACK_LIMITS.maxRows}-row limit`);
        }
        return parsedRecordCount === 1 ? record : validateParsedDataCells(record);
      },
    }) as string[][];
  } catch (error) {
    if (error instanceof Error && /max(?:imum)? record|record.*size/i.test(error.message)) {
      throw new Error(`CSV record exceeds the ${CSV_PACK_LIMITS.maxRecordBytes}-byte limit`);
    }
    throw error;
  }

  return {
    rows: parsed.slice(1).map((cells, index) => {
      const fields = Object.fromEntries(CSV_COLUMNS.map((column, cellIndex) => [
        column,
        normalizeNewlines(cells[cellIndex] ?? ''),
      ])) as CsvFields;
      const en = decodeVariants(fields.accepted_variants_en);
      const et = decodeVariants(fields.accepted_variants_et);
      return {
        ...fields,
        rowNumber: index + 2,
        acceptedVariantsEn: en.values,
        acceptedVariantsEt: et.values,
        variantErrors: [
          ...(en.valid ? [] : ['accepted_variants_en' as const]),
          ...(et.valid ? [] : ['accepted_variants_et' as const]),
        ],
      };
    }),
  };
}

export function validatePack(pack: ParsedPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (pack.rows.length === 0) {
    return [{ code: 'empty-pack', message: 'A CSV pack must contain at least one clue row' }];
  }
  const add = (row: ParsedCsvRow, code: string, message: string, column?: CsvColumn) => {
    issues.push({ code, message, row: row.rowNumber, ...(column === undefined ? {} : { column }) });
  };
  const first = pack.rows[0];
  const clueIds = new Map<string, ParsedCsvRow>();
  const clueTexts = new Map<string, ParsedCsvRow>();
  const categoryGroups = new Map<string, ParsedCsvRow[]>();
  const categoryNames = new Map<string, { id: string; row: ParsedCsvRow }>();
  const incomingCategoryIds = new Set(pack.rows.map((row) => row.category_set_id));

  for (const row of pack.rows) {
    for (const column of [
      'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind', 'round', 'tier',
      'difficulty', 'macro_topic', 'category_name_en', 'clue_en', 'response_en', 'explanation_en',
      'source_title', 'source_url', 'source_license', 'source_retrieved_at', 'translation_status', 'enabled',
    ] as const) {
      if (row[column].trim() === '') add(row, 'required-field', `${column} is required`, column);
    }
    for (const column of ['clue_id', 'pack_id', 'category_set_id'] as const) {
      if (!contentIdSchema.safeParse(row[column]).success) {
        add(row, 'invalid-id', `${column} must be a stable content ID`, column);
      }
    }
    if (row.pack_id !== first.pack_id) add(row, 'multiple-pack-id', 'Every row must use one pack ID', 'pack_id');
    if (row.pack_name !== first.pack_name) add(row, 'inconsistent-pack-name', 'Every row must use one pack name', 'pack_name');
    if (row.category_set_id === row.pack_id) {
      add(row, 'duplicate-content-id', 'A category ID cannot reuse the pack ID', 'category_set_id');
    }
    if (row.clue_id === row.pack_id || incomingCategoryIds.has(row.clue_id)) {
      add(row, 'duplicate-content-id', 'A clue ID cannot reuse a pack or category ID', 'clue_id');
    }
    if (row.content_kind !== 'board' && row.content_kind !== 'final') {
      add(row, 'invalid-content-kind', 'content_kind must be board or final', 'content_kind');
    }
    if (![...BOARD_ROUNDS, 'final'].includes(row.round as BoardRound | 'final')) {
      add(row, 'invalid-round', 'round must be round-one, round-two, or final', 'round');
    }
    const tier = Number(row.tier);
    if (!Number.isInteger(tier)) add(row, 'invalid-tier', 'tier must be an integer', 'tier');
    if (!DIFFICULTIES.includes(row.difficulty as Difficulty)) {
      add(row, 'invalid-difficulty', 'difficulty must be easy, medium, or hard', 'difficulty');
    }
    if (!TRANSLATION_STATUSES.includes(row.translation_status as TranslationStatus)) {
      add(row, 'invalid-translation-status', 'translation_status is invalid', 'translation_status');
    }
    if (row.enabled !== 'true' && row.enabled !== 'false') {
      add(row, 'invalid-enabled', 'enabled must be true or false', 'enabled');
    }
    if (!isHttpUrl(row.source_url)) add(row, 'invalid-source-url', 'source_url must be an HTTP(S) URL', 'source_url');
    if (!isIsoDate(row.source_retrieved_at)) {
      add(row, 'invalid-source-date', 'source_retrieved_at must be a real YYYY-MM-DD date', 'source_retrieved_at');
    }
    for (const column of row.variantErrors) {
      add(row, 'invalid-accepted-variants', 'Accepted variants contain an invalid escape or empty entry', column);
    }
    if (row.acceptedVariantsEt.length > 0 && row.acceptedVariantsEn.length === 0) {
      add(
        row,
        'estonian-variants-require-english',
        'Estonian accepted variants require authoritative English variants',
        'accepted_variants_et',
      );
    }
    if (row.translation_status === 'machine' || row.translation_status === 'reviewed') {
      for (const column of ['category_name_et', 'clue_et', 'response_et', 'explanation_et'] as const) {
        if (row[column].trim() === '') {
          add(row, 'incomplete-translation', `${column} is required for translated content`, column);
        }
      }
    }

    const priorClueId = clueIds.get(row.clue_id);
    if (priorClueId !== undefined) add(row, 'duplicate-clue-id', `Duplicate clue ID ${row.clue_id}`, 'clue_id');
    else clueIds.set(row.clue_id, row);
    const normalizedClue = normalizeForDuplicate(row.clue_en);
    const priorClue = clueTexts.get(normalizedClue);
    if (normalizedClue !== '' && priorClue !== undefined) {
      add(row, 'duplicate-clue-text', `Clue text duplicates row ${priorClue.rowNumber}`, 'clue_en');
    } else if (normalizedClue !== '') clueTexts.set(normalizedClue, row);

    const group = categoryGroups.get(row.category_set_id) ?? [];
    group.push(row);
    categoryGroups.set(row.category_set_id, group);
  }

  for (const [categoryId, rows] of categoryGroups) {
    const category = rows[0];
    const metadata = ['pack_id', 'content_kind', 'round', 'difficulty', 'macro_topic', 'category_name_en', 'category_name_et'] as const;
    for (const row of rows.slice(1)) {
      if (metadata.some((column) => row[column] !== category[column])) {
        add(row, 'inconsistent-category-set', `Category set ${categoryId} has inconsistent metadata`, 'category_set_id');
      }
    }
    const normalizedName = normalizeForDuplicate(category.category_name_en);
    const priorName = categoryNames.get(normalizedName);
    if (normalizedName !== '' && priorName !== undefined && priorName.id !== categoryId) {
      add(category, 'duplicate-category-name', `Category name duplicates ${priorName.id}`, 'category_name_en');
    } else if (normalizedName !== '') categoryNames.set(normalizedName, { id: categoryId, row: category });

    if (category.content_kind === 'board') {
      const tiers = rows.map((row) => Number(row.tier)).sort((left, right) => left - right);
      if (rows.some((row) => row.round !== 'round-one' && row.round !== 'round-two')
        || tiers.join(',') !== '1,2,3,4,5') {
        add(category, 'incomplete-category-set', `Board category ${categoryId} must contain tiers 1 through 5`);
      }
    } else if (category.content_kind === 'final') {
      if (rows.length !== 1 || category.round !== 'final' || category.tier !== '0') {
        add(category, 'invalid-final-shape', `Final category ${categoryId} must contain one tier-0 Final row`);
      }
    }
    if ((category.content_kind === 'board' && category.round === 'final')
      || (category.content_kind === 'final' && category.round !== 'final')) {
      add(category, 'invalid-final-shape', `content_kind and round disagree for ${categoryId}`);
    }
  }
  return issues;
}

export function previewPackImport({
  database,
  text,
}: { database: DatabaseConnection; text: string }): PackImportPreview {
  const parsed = parsePackCsv(text);
  const issues = validatePack(parsed);
  const records = normalizeRecords(parsed);
  const first = parsed.rows[0];
  const packId = first?.pack_id ?? '';
  return {
    packId,
    packName: first?.pack_name ?? '',
    rowCount: parsed.rows.length,
    conflict: packId !== '' && packExists(database, packId),
    issues,
    records,
  };
}

export function importPack({
  database,
  repository,
  preview,
  conflict,
  createId = () => randomUUID(),
}: ImportPackOptions): { packId: string; replaced: boolean; keptBoth: boolean; rowCount: number } {
  const commitPack = recordsToParsedPack(preview.records);
  const commitIssues = validatePack(commitPack);
  const validatedRecords = normalizeRecords(commitPack);
  if (preview.issues.length > 0 || commitIssues.length > 0 || validatedRecords.length === 0
    || preview.rowCount !== validatedRecords.length
    || preview.packId !== validatedRecords[0]?.packId
    || preview.packName !== validatedRecords[0]?.packName) {
    throw new Error('CSV pack validation failed; no content was imported');
  }

  return repository.runTransaction(() => {
    const exists = packExists(database, preview.packId);
    if (exists && conflict === undefined) throw new Error('An import conflict choice is required');
    if (!exists && conflict !== undefined) throw new Error('The requested import conflict no longer exists');
    let records = validatedRecords;
    let packId = preview.packId;
    if (exists && conflict === 'replace-existing') {
      assertReplaceAllowed(database, preview.packId, records);
    } else if (exists && conflict === 'keep-both') {
      const rewritten = rewritePackIdentities(database, records, createId);
      records = rewritten.records;
      packId = rewritten.packId;
    } else {
      assertNoIdentityCollisions(database, preview.packId, records, false);
    }

    writePack(database, records, exists && conflict === 'replace-existing');
    return {
      packId,
      replaced: exists && conflict === 'replace-existing',
      keptBoth: exists && conflict === 'keep-both',
      rowCount: records.length,
    };
  });
}

export function exportPack({
  database,
  packId: inputPackId,
  destination,
  writeFile = (path, data) => writeFileSync(path, data, { flag: 'wx' }),
}: ExportPackOptions): { packId: string; rowCount: number; bytes: number } {
  const packId = contentIdSchema.parse(inputPackId);
  if (destination.trim() === '' || extname(destination).toLowerCase() !== '.csv') {
    throw new Error('CSV export destination must be an explicit .csv file');
  }
  const destinationEntry = lstatSync(destination, { throwIfNoEntry: false });
  if (destinationEntry !== undefined && (destinationEntry.isSymbolicLink() || !destinationEntry.isFile())) {
    throw new Error('CSV export destination must be a regular file');
  }
  const records = loadExportRecords(database, packId);
  if (records.length === 0) throw new Error(`Unknown or empty content pack: ${packId}`);
  const csvText = stringify(records.map((record) => encodeSpreadsheetRow(recordToCsvFields(record))), {
    bom: true,
    header: true,
    columns: [...CSV_COLUMNS],
    delimiter: ',',
    record_delimiter: '\r\n',
    eof: true,
  });
  const exportedPack = parsePackCsv(csvText);
  const exportIssues = validatePack(exportedPack);
  if (exportIssues.length > 0 || JSON.stringify(normalizeRecords(exportedPack)) !== JSON.stringify(records)) {
    const firstIssue = exportIssues[0];
    const detail = firstIssue === undefined
      ? 'exported records did not preserve their normalized content'
      : `${firstIssue.message}${firstIssue.row === undefined ? '' : ` at row ${firstIssue.row}`}`;
    throw new Error(`CSV export validation failed: ${detail}`);
  }
  const bytes = Buffer.from(csvText, 'utf8');
  const temporaryPath = join(dirname(destination), `.${randomUUID()}.csv.tmp`);
  try {
    writeFile(temporaryPath, bytes);
    renameSync(temporaryPath, destination);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
  return { packId, rowCount: records.length, bytes: bytes.length };
}

export function readPackCsvFile(path: string, fileSystem: CsvFileReadPort = NODE_CSV_FILE_READ_PORT): string {
  const entry = fileSystem.lstat(path);
  if (entry.isSymbolicLink() || !entry.isFile()) throw new Error('CSV import source must be a regular file');
  if (entry.size > CSV_PACK_LIMITS.maxFileBytes) {
    throw new Error(`CSV file exceeds the ${CSV_PACK_LIMITS.maxFileBytes}-byte limit`);
  }
  const descriptor = fileSystem.open(path);
  try {
    const openedEntry = fileSystem.fstat(descriptor);
    const currentEntry = fileSystem.lstat(path);
    if (currentEntry.isSymbolicLink() || !currentEntry.isFile()) {
      throw new Error('CSV import source path changed or became a symbolic link');
    }
    if (!openedEntry.isFile()) throw new Error('CSV import source must be a regular file');
    if (!sameFileIdentity(entry, openedEntry) || !sameFileIdentity(openedEntry, currentEntry)) {
      throw new Error('CSV import source path changed before it could be read');
    }
    if (openedEntry.size > CSV_PACK_LIMITS.maxFileBytes) {
      throw new Error(`CSV file exceeds the ${CSV_PACK_LIMITS.maxFileBytes}-byte limit`);
    }
    const chunks: Buffer[] = [];
    let total = 0;
    while (total <= CSV_PACK_LIMITS.maxFileBytes) {
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, CSV_PACK_LIMITS.maxFileBytes + 1 - total));
      const bytesRead = fileSystem.read(descriptor, chunk, 0, chunk.length, null);
      if (bytesRead === 0) break;
      chunks.push(chunk.subarray(0, bytesRead));
      total += bytesRead;
    }
    if (total > CSV_PACK_LIMITS.maxFileBytes) {
      throw new Error(`CSV file exceeds the ${CSV_PACK_LIMITS.maxFileBytes}-byte limit`);
    }
    try {
      return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Buffer.concat(chunks, total));
    } catch {
      throw new Error('CSV import source is not valid UTF-8');
    }
  } finally {
    fileSystem.close(descriptor);
  }
}

function sameFileIdentity(left: CsvFileEntry, right: CsvFileEntry): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameColumns(header: readonly string[]): boolean {
  return header.length === CSV_COLUMNS.length && header.every((value, index) => value === CSV_COLUMNS[index]);
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function encodeSpreadsheetRow(fields: CsvFields): CsvFields {
  return Object.fromEntries(CSV_COLUMNS.map((column) => [column, `'${fields[column]}`])) as CsvFields;
}

function decodeSpreadsheetRow(cells: readonly string[]): readonly string[] {
  return cells.length === CSV_COLUMNS.length && cells.every((cell) => cell.startsWith("'"))
    ? cells.map((cell) => cell.slice(1))
    : cells;
}

function validateParsedDataCells(cells: readonly string[]): string[] {
  const decodedCells = [...decodeSpreadsheetRow(cells)];
  for (const [index, value] of decodedCells.entries()) {
    if (value.length > CSV_PACK_LIMITS.maxFieldCharacters) {
      throw new Error(
        `CSV field ${CSV_COLUMNS[index] ?? index} exceeds the ${CSV_PACK_LIMITS.maxFieldCharacters}-character limit`,
      );
    }
  }
  return decodedCells;
}

function decodeVariants(value: string): { values: string[]; valid: boolean } {
  if (value === '') return { values: [], valid: true };
  const values: string[] = [];
  let current = '';
  let escaped = false;
  let valid = true;
  for (const character of value) {
    if (escaped) {
      if (character !== '\\' && character !== ';') valid = false;
      current += character;
      escaped = false;
    } else if (character === '\\') escaped = true;
    else if (character === ';') {
      values.push(current);
      current = '';
    } else current += character;
  }
  values.push(current);
  return { values, valid: valid && !escaped && values.every((variant) => variant.trim() !== '') };
}

function encodeVariants(values: readonly string[]): string {
  return values.map((value) => value.replaceAll('\\', '\\\\').replaceAll(';', '\\;')).join(';');
}

function normalizeForDuplicate(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function normalizeRecords(pack: ParsedPack): CsvPackRecord[] {
  return pack.rows.map((row) => ({
    clueId: row.clue_id,
    packId: row.pack_id,
    packName: row.pack_name,
    categorySetId: row.category_set_id,
    contentKind: row.content_kind as 'board' | 'final',
    round: row.round as BoardRound | 'final',
    tier: Number(row.tier),
    difficulty: row.difficulty as Difficulty,
    macroTopic: row.macro_topic,
    categoryNameEn: row.category_name_en,
    ...(row.category_name_et === '' ? {} : { categoryNameEt: row.category_name_et }),
    clueEn: row.clue_en,
    ...(row.clue_et === '' ? {} : { clueEt: row.clue_et }),
    responseEn: row.response_en,
    ...(row.response_et === '' ? {} : { responseEt: row.response_et }),
    acceptedVariantsEn: row.acceptedVariantsEn,
    acceptedVariantsEt: row.acceptedVariantsEt,
    explanationEn: row.explanation_en,
    ...(row.explanation_et === '' ? {} : { explanationEt: row.explanation_et }),
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    sourceLicense: row.source_license,
    sourceRetrievedAt: row.source_retrieved_at,
    translationStatus: row.translation_status as TranslationStatus,
    enabled: row.enabled === 'true',
  })).sort(compareRecords);
}

function recordsToParsedPack(records: readonly CsvPackRecord[]): ParsedPack {
  return {
    rows: records.map((record, index) => {
      const fields = recordToCsvFields(record);
      return {
        ...Object.fromEntries(CSV_COLUMNS.map((column) => [column, normalizeNewlines(fields[column])])) as CsvFields,
        rowNumber: index + 2,
        acceptedVariantsEn: [...record.acceptedVariantsEn],
        acceptedVariantsEt: [...record.acceptedVariantsEt],
        variantErrors: [],
      };
    }),
  };
}

function compareRecords(left: CsvPackRecord, right: CsvPackRecord): number {
  const roundOrder = { 'round-one': 0, 'round-two': 1, final: 2 };
  return left.packId.localeCompare(right.packId)
    || roundOrder[left.round] - roundOrder[right.round]
    || left.categorySetId.localeCompare(right.categorySetId)
    || left.tier - right.tier
    || left.clueId.localeCompare(right.clueId);
}

function packExists(database: DatabaseConnection, packId: string): boolean {
  return database.prepare('SELECT 1 FROM content_packs WHERE id = ?').pluck().get(packId) === 1;
}

function assertReplaceAllowed(
  database: DatabaseConnection,
  packId: string,
  records: readonly CsvPackRecord[],
): void {
  const packSource = database.prepare('SELECT source FROM content_packs WHERE id = ?').pluck().get(packId);
  if (packSource !== 'custom-csv') throw new Error('Replace Existing is allowed only for a custom CSV pack');
  const existing = database.prepare(`
    SELECT clues.id, clues.category_set_id, clues.round, clues.tier
    FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id
    WHERE category_sets.pack_id = ?
  `).all(packId) as Array<{ id: string; category_set_id: string; round: string; tier: number }>;
  const incoming = new Map(records.map((record) => [record.clueId, record]));
  for (const row of existing) {
    const replacement = incoming.get(row.id);
    if (replacement !== undefined && (
      replacement.categorySetId !== row.category_set_id
      || replacement.round !== row.round
      || replacement.tier !== row.tier
    )) throw new Error(`Replace Existing cannot change stable clue identity: ${row.id}`);
  }
  assertNoIdentityCollisions(database, packId, records, true);
}

function assertNoIdentityCollisions(
  database: DatabaseConnection,
  packId: string,
  records: readonly CsvPackRecord[],
  allowSamePack: boolean,
): void {
  const packMatches = findIdentityMatches(database, packId);
  if (packMatches.some((match) => match.kind !== 'pack' || !allowSamePack || match.owner !== packId)) {
    throw new Error(`Content ID collision for pack: ${packId}`);
  }
  for (const categoryId of new Set(records.map((record) => record.categorySetId))) {
    const matches = findIdentityMatches(database, categoryId);
    if (matches.some((match) => match.kind !== 'category' || !allowSamePack || match.owner !== packId)) {
      throw new Error(`Content ID collision for category: ${categoryId}`);
    }
  }
  for (const record of records) {
    const matches = findIdentityMatches(database, record.clueId);
    if (matches.some((match) => match.kind !== 'clue' || !allowSamePack || match.owner !== packId)) {
      throw new Error(`Content ID collision for clue: ${record.clueId}`);
    }
  }
}

function findIdentityMatches(
  database: DatabaseConnection,
  id: string,
): Array<{ kind: 'pack' | 'category' | 'clue'; owner: string }> {
  return database.prepare(`
    SELECT 'pack' AS kind, id AS owner FROM content_packs WHERE id = ?
    UNION ALL SELECT 'category', pack_id FROM category_sets WHERE id = ?
    UNION ALL SELECT 'clue', category_sets.pack_id
      FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id WHERE clues.id = ?
  `).all(id, id, id) as Array<{ kind: 'pack' | 'category' | 'clue'; owner: string }>;
}

function rewritePackIdentities(
  database: DatabaseConnection,
  records: readonly CsvPackRecord[],
  createId: () => string,
): { packId: string; records: CsvPackRecord[] } {
  const reserved = new Set<string>();
  const nextId = () => {
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const candidate = createId();
      if (!contentIdSchema.safeParse(candidate).success || reserved.has(candidate) || idExists(database, candidate)) continue;
      reserved.add(candidate);
      return candidate;
    }
    throw new Error('Could not generate a collision-free content ID');
  };
  const packId = nextId();
  const categoryIds = new Map<string, string>();
  const clueIds = new Map<string, string>();
  for (const record of records) {
    if (!categoryIds.has(record.categorySetId)) categoryIds.set(record.categorySetId, nextId());
    clueIds.set(record.clueId, nextId());
  }
  return {
    packId,
    records: records.map((record) => ({
      ...record,
      packId,
      categorySetId: categoryIds.get(record.categorySetId)!,
      clueId: clueIds.get(record.clueId)!,
    })).sort(compareRecords),
  };
}

function idExists(database: DatabaseConnection, id: string): boolean {
  return database.prepare(`
    SELECT 1 FROM content_packs WHERE id = ?
    UNION ALL SELECT 1 FROM category_sets WHERE id = ?
    UNION ALL SELECT 1 FROM clues WHERE id = ?
    LIMIT 1
  `).pluck().get(id, id, id) === 1;
}

function writePack(
  database: DatabaseConnection,
  records: readonly CsvPackRecord[],
  replacing: boolean,
): void {
  const first = records[0];
  if (replacing) {
    database.prepare('UPDATE content_packs SET name = ? WHERE id = ?').run(first.packName, first.packId);
  } else {
    database.prepare(`
      INSERT INTO content_packs (id, name, version, source, enabled) VALUES (?, ?, '1', 'custom-csv', 1)
    `).run(first.packId, first.packName);
  }
  const categoryRecords = new Map<string, CsvPackRecord>();
  for (const record of records) categoryRecords.set(record.categorySetId, record);
  for (const category of [...categoryRecords.values()].sort((left, right) => left.categorySetId.localeCompare(right.categorySetId))) {
    const categoryValues = [
      category.categorySetId,
      category.packId,
      category.round,
      category.difficulty,
      localizedJson(category.categoryNameEn, category.categoryNameEt),
      category.macroTopic,
    ] as const;
    if (replacing && database.prepare('SELECT 1 FROM category_sets WHERE id = ?').pluck().get(category.categorySetId) === 1) {
      database.prepare(`
        UPDATE category_sets SET round = ?, difficulty = ?, name_json = ?, macro_topic = ? WHERE id = ? AND pack_id = ?
      `).run(category.round, category.difficulty, categoryValues[4], category.macroTopic, category.categorySetId, category.packId);
    } else {
      database.prepare(`
        INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(...categoryValues);
    }
  }
  for (const record of records) {
    const clueValues = [
      record.clueId,
      record.categorySetId,
      record.round,
      record.tier,
      record.round === 'final' ? 0 : record.tier * (record.round === 'round-one' ? 200 : 400),
      localizedJson(record.clueEn, record.clueEt),
      localizedJson(record.responseEn, record.responseEt),
      localizedJson(record.explanationEn, record.explanationEt),
      localizedVariantsJson(record.acceptedVariantsEn, record.acceptedVariantsEt),
      storedSource(record),
      Number(record.enabled),
    ] as const;
    if (replacing && database.prepare('SELECT 1 FROM clues WHERE id = ?').pluck().get(record.clueId) === 1) {
      database.prepare(`
        UPDATE clues SET prompt_json = ?, response_json = ?, explanation_json = ?,
          accepted_responses_json = ?, source = ?, enabled = ?
        WHERE id = ? AND category_set_id = ?
      `).run(clueValues[5], clueValues[6], clueValues[7], clueValues[8], clueValues[9], clueValues[10],
        record.clueId, record.categorySetId);
    } else {
      database.prepare(`
        INSERT INTO clues (
          id, category_set_id, round, tier, value, prompt_json, response_json,
          explanation_json, accepted_responses_json, source, enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(...clueValues);
    }
  }
  if (replacing) {
    const clueIds = records.map((record) => record.clueId);
    const categoryIds = [...categoryRecords.keys()];
    deleteMissing(database, 'clues', 'id', `category_set_id IN (SELECT id FROM category_sets WHERE pack_id = ?)`, first.packId, clueIds);
    deleteMissing(database, 'category_sets', 'id', 'pack_id = ?', first.packId, categoryIds);
  }
}

function deleteMissing(
  database: DatabaseConnection,
  table: 'clues' | 'category_sets',
  idColumn: 'id',
  ownerWhere: string,
  ownerId: string,
  retainedIds: readonly string[],
): void {
  const placeholders = retainedIds.map(() => '?').join(',');
  database.prepare(`DELETE FROM ${table} WHERE ${ownerWhere} AND ${idColumn} NOT IN (${placeholders})`)
    .run(ownerId, ...retainedIds);
}

function localizedJson(en: string, et?: string): string {
  return JSON.stringify(et === undefined ? { en } : { en, et });
}

function localizedVariantsJson(en: readonly string[], et: readonly string[]): string | null {
  if (en.length === 0 && et.length === 0) return null;
  return JSON.stringify({
    ...(en.length === 0 ? {} : { en: encodeVariants(en) }),
    ...(et.length === 0 ? {} : { et: encodeVariants(et) }),
  });
}

function storedSource(record: CsvPackRecord): string {
  const source: StoredCsvSource = {
    format: CSV_SOURCE_FORMAT,
    title: record.sourceTitle,
    url: record.sourceUrl,
    license: record.sourceLicense,
    retrievedAt: record.sourceRetrievedAt,
    translationStatus: record.translationStatus,
  };
  return JSON.stringify(source);
}

function loadExportRecords(database: DatabaseConnection, packId: string): CsvPackRecord[] {
  const rows = database.prepare(`
    SELECT
      content_packs.id AS pack_id,
      content_packs.name AS pack_name,
      content_packs.enabled AS pack_enabled,
      category_sets.id AS category_set_id,
      category_sets.round AS category_round,
      category_sets.difficulty,
      category_sets.macro_topic,
      category_sets.name_json AS category_name_json,
      category_sets.enabled AS category_enabled,
      clues.id AS clue_id,
      clues.round AS clue_round,
      clues.tier,
      clues.prompt_json,
      clues.response_json,
      clues.explanation_json,
      clues.accepted_responses_json,
      clues.source,
      clues.enabled AS clue_enabled,
      content_overrides.override_json
    FROM content_packs
    JOIN category_sets ON category_sets.pack_id = content_packs.id
    JOIN clues ON clues.category_set_id = category_sets.id
    LEFT JOIN content_overrides ON content_overrides.clue_id = clues.id
    WHERE content_packs.id = ?
    ORDER BY category_sets.round, category_sets.id, clues.tier, clues.id
  `).all(packId) as ExportRow[];
  return rows.map(exportRowToRecord).sort(compareRecords);
}

function exportRowToRecord(row: ExportRow): CsvPackRecord {
  const categoryName = parseLocalized(row.category_name_json);
  const override = row.override_json === null ? undefined : JSON.parse(row.override_json) as Record<string, unknown>;
  const prompt = override?.prompt as { en: string; et?: string } | undefined ?? parseLocalized(row.prompt_json);
  const response = override?.response as { en: string; et?: string } | undefined ?? parseLocalized(row.response_json);
  const explanation = override?.explanation as { en: string; et?: string } | undefined ?? parseLocalized(row.explanation_json);
  const baseAccepted = decodeStoredAcceptedResponses(
    row.accepted_responses_json === null ? undefined : JSON.parse(row.accepted_responses_json),
    row.clue_id,
    'base',
  );
  const overrideAccepted = override?.acceptedResponses === undefined
    ? undefined
    : decodeStoredAcceptedResponses(override.acceptedResponses, row.clue_id, 'override');
  const accepted = overrideAccepted ?? baseAccepted;
  const baseSource = parseStoredSource(row.source, prompt.et === undefined ? 'untranslated' : 'reviewed');
  const overrideSource = typeof override?.source === 'string' ? override.source : undefined;
  const source = overrideSource === undefined ? baseSource : { ...baseSource, title: overrideSource };
  const finalCategory = override?.categoryName as { en: string; et?: string } | undefined;
  return {
    clueId: row.clue_id,
    packId: row.pack_id,
    packName: row.pack_name,
    categorySetId: row.category_set_id,
    contentKind: row.clue_round === 'final' ? 'final' : 'board',
    round: row.clue_round as BoardRound | 'final',
    tier: row.tier,
    difficulty: row.difficulty,
    macroTopic: row.macro_topic,
    categoryNameEn: finalCategory?.en ?? categoryName.en,
    ...((finalCategory?.et ?? categoryName.et) === undefined ? {} : { categoryNameEt: finalCategory?.et ?? categoryName.et }),
    clueEn: prompt.en,
    ...(prompt.et === undefined ? {} : { clueEt: prompt.et }),
    responseEn: response.en,
    ...(response.et === undefined ? {} : { responseEt: response.et }),
    acceptedVariantsEn: accepted.en,
    acceptedVariantsEt: accepted.et,
    explanationEn: explanation.en,
    ...(explanation.et === undefined ? {} : { explanationEt: explanation.et }),
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceLicense: source.license,
    sourceRetrievedAt: source.retrievedAt,
    translationStatus: source.translationStatus,
    enabled: typeof override?.enabled === 'boolean' ? override.enabled : row.clue_enabled === 1,
  };
}

function decodeStoredAcceptedResponses(
  input: unknown,
  clueId: string,
  origin: 'base' | 'override',
): { en: string[]; et: string[] } {
  if (input === undefined) return { en: [], et: [] };
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error(`Accepted response escape data for ${clueId} is invalid in ${origin}`);
  }
  const stored = input as Record<string, unknown>;
  if (Object.keys(stored).some((language) => language !== 'en' && language !== 'et')) {
    throw new Error(`Accepted response escape data for ${clueId} is invalid in ${origin}`);
  }
  const decodeLanguage = (language: 'en' | 'et') => {
    const value = stored[language];
    if (value === undefined) return [];
    if (typeof value !== 'string') {
      throw new Error(`Accepted response escape data for ${clueId} is invalid in ${origin}.${language}`);
    }
    const decoded = decodeVariants(value);
    if (!decoded.valid) {
      throw new Error(`Accepted response escape for ${clueId} is invalid in ${origin}.${language}`);
    }
    return decoded.values;
  };
  return { en: decodeLanguage('en'), et: decodeLanguage('et') };
}

function parseLocalized(value: string): { en: string; et?: string } {
  return JSON.parse(value) as { en: string; et?: string };
}

function parseStoredSource(
  value: string,
  fallbackStatus: TranslationStatus,
): StoredCsvSource {
  try {
    const parsed = JSON.parse(value) as Partial<StoredCsvSource>;
    if (parsed.format === CSV_SOURCE_FORMAT
      && typeof parsed.title === 'string'
      && typeof parsed.url === 'string'
      && typeof parsed.license === 'string'
      && typeof parsed.retrievedAt === 'string'
      && TRANSLATION_STATUSES.includes(parsed.translationStatus as TranslationStatus)) {
      return parsed as StoredCsvSource;
    }
  } catch {
    // Legacy bundled source strings predate CSV metadata.
  }
  return {
    format: CSV_SOURCE_FORMAT,
    title: value,
    url: '',
    license: '',
    retrievedAt: '',
    translationStatus: fallbackStatus,
  };
}

function recordToCsvFields(record: CsvPackRecord): CsvFields {
  const canonical = (value: string) => value.replace(/\r\n?|\n/g, '\r\n');
  return {
    clue_id: record.clueId,
    pack_id: record.packId,
    pack_name: canonical(record.packName),
    category_set_id: record.categorySetId,
    content_kind: record.contentKind,
    round: record.round,
    tier: String(record.tier),
    difficulty: record.difficulty,
    macro_topic: canonical(record.macroTopic),
    category_name_en: canonical(record.categoryNameEn),
    category_name_et: canonical(record.categoryNameEt ?? ''),
    clue_en: canonical(record.clueEn),
    clue_et: canonical(record.clueEt ?? ''),
    response_en: canonical(record.responseEn),
    response_et: canonical(record.responseEt ?? ''),
    accepted_variants_en: canonical(encodeVariants(record.acceptedVariantsEn)),
    accepted_variants_et: canonical(encodeVariants(record.acceptedVariantsEt)),
    explanation_en: canonical(record.explanationEn),
    explanation_et: canonical(record.explanationEt ?? ''),
    source_title: canonical(record.sourceTitle),
    source_url: record.sourceUrl,
    source_license: canonical(record.sourceLicense),
    source_retrieved_at: record.sourceRetrievedAt,
    translation_status: record.translationStatus,
    enabled: String(record.enabled),
  };
}
