import {
  CSV_COLUMNS, CSV_VALIDATION_ISSUE_CODES,
  type CsvColumn, type CsvValidationIssueCode,
} from '../../../shared/content/csvColumns';
import type { Language } from '../../../shared/game/types';
import { translate, type TranslationKey } from '../../i18n';

const COLUMN_KEYS = {
  clue_id: 'import.column.clue_id',
  pack_id: 'import.column.pack_id',
  pack_name: 'import.column.pack_name',
  category_set_id: 'import.column.category_set_id',
  content_kind: 'import.column.content_kind',
  round: 'import.column.round',
  tier: 'import.column.tier',
  difficulty: 'import.column.difficulty',
  macro_topic: 'import.column.macro_topic',
  category_name_en: 'import.column.category_name_en',
  category_name_et: 'import.column.category_name_et',
  clue_en: 'import.column.clue_en',
  clue_et: 'import.column.clue_et',
  response_en: 'import.column.response_en',
  response_et: 'import.column.response_et',
  accepted_variants_en: 'import.column.accepted_variants_en',
  accepted_variants_et: 'import.column.accepted_variants_et',
  explanation_en: 'import.column.explanation_en',
  explanation_et: 'import.column.explanation_et',
  source_title: 'import.column.source_title',
  source_url: 'import.column.source_url',
  source_license: 'import.column.source_license',
  source_retrieved_at: 'import.column.source_retrieved_at',
  translation_status: 'import.column.translation_status',
  enabled: 'import.column.enabled',
} as const satisfies Record<CsvColumn, TranslationKey>;

type IssueFormatter = (locale: Language, column: string) => string;
const fixed = (key: TranslationKey): IssueFormatter => (locale) => translate(locale, key as never);
const withColumn = (
  key: 'import.issue.required-field' | 'import.issue.invalid-id' | 'import.issue.incomplete-translation',
): IssueFormatter => (locale, column) => translate(locale, key, { column });

const ISSUE_FORMATTERS = {
  'empty-pack': fixed('import.issue.empty-pack'),
  'required-field': withColumn('import.issue.required-field'),
  'invalid-id': withColumn('import.issue.invalid-id'),
  'multiple-pack-id': fixed('import.issue.multiple-pack-id'),
  'inconsistent-pack-name': fixed('import.issue.inconsistent-pack-name'),
  'duplicate-content-id': fixed('import.issue.duplicate-content-id'),
  'invalid-content-kind': fixed('import.issue.invalid-content-kind'),
  'invalid-round': fixed('import.issue.invalid-round'),
  'invalid-tier': fixed('import.issue.invalid-tier'),
  'invalid-difficulty': fixed('import.issue.invalid-difficulty'),
  'invalid-translation-status': fixed('import.issue.invalid-translation-status'),
  'invalid-enabled': fixed('import.issue.invalid-enabled'),
  'invalid-source-url': fixed('import.issue.invalid-source-url'),
  'invalid-source-date': fixed('import.issue.invalid-source-date'),
  'invalid-accepted-variants': fixed('import.issue.invalid-accepted-variants'),
  'estonian-variants-require-english': fixed('import.issue.estonian-variants-require-english'),
  'incomplete-translation': withColumn('import.issue.incomplete-translation'),
  'duplicate-clue-id': fixed('import.issue.duplicate-clue-id'),
  'duplicate-clue-text': fixed('import.issue.duplicate-clue-text'),
  'inconsistent-category-set': fixed('import.issue.inconsistent-category-set'),
  'duplicate-category-name': fixed('import.issue.duplicate-category-name'),
  'incomplete-category-set': fixed('import.issue.incomplete-category-set'),
  'invalid-final-shape': fixed('import.issue.invalid-final-shape'),
  'file-too-large': fixed('import.issue.file-too-large'),
  'record-too-large': fixed('import.issue.record-too-large'),
  'too-many-rows': fixed('import.issue.too-many-rows'),
  'field-too-long': fixed('import.issue.field-too-long'),
  'misplaced-bom': fixed('import.issue.misplaced-bom'),
  'missing-header': fixed('import.issue.missing-header'),
  'invalid-header': fixed('import.issue.invalid-header'),
  'invalid-csv-shape': fixed('import.issue.invalid-csv-shape'),
  'invalid-utf8': fixed('import.issue.invalid-utf8'),
} as const satisfies Record<CsvValidationIssueCode, IssueFormatter>;

const knownCodes = new Set<string>(CSV_VALIDATION_ISSUE_CODES);
const knownColumns = new Set<string>(CSV_COLUMNS);

function columnLabel(locale: Language, column: unknown): string {
  return typeof column === 'string' && knownColumns.has(column)
    ? translate(locale, COLUMN_KEYS[column as CsvColumn])
    : translate(locale, 'import.column.unknown');
}

export function formatImportIssue(
  locale: Language,
  issue: { code: string; row?: number; column?: unknown },
): string {
  const column = columnLabel(locale, issue.column);
  const context = issue.row === undefined
    ? ''
    : `${issue.column === undefined
      ? translate(locale, 'import.row', { row: issue.row })
      : translate(locale, 'import.rowColumn', { row: issue.row, column })}: `;
  const message = knownCodes.has(issue.code)
    ? ISSUE_FORMATTERS[issue.code as CsvValidationIssueCode](locale, column)
    : translate(locale, 'import.issue.generic');
  return `${context}${message}`;
}
