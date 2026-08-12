export const CSV_COLUMNS = [
  'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind',
  'round', 'tier', 'difficulty', 'macro_topic', 'category_name_en',
  'category_name_et', 'clue_en', 'clue_et', 'response_en', 'response_et',
  'accepted_variants_en', 'accepted_variants_et', 'explanation_en',
  'explanation_et', 'source_title', 'source_url', 'source_license',
  'source_retrieved_at', 'translation_status', 'enabled',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

export const CSV_VALIDATION_ISSUE_CODES = [
  'empty-pack', 'required-field', 'invalid-id', 'multiple-pack-id', 'inconsistent-pack-name',
  'duplicate-content-id', 'invalid-content-kind', 'invalid-round', 'invalid-tier', 'invalid-difficulty',
  'invalid-translation-status', 'invalid-enabled', 'invalid-source-url', 'invalid-source-date',
  'invalid-accepted-variants', 'estonian-variants-require-english', 'incomplete-translation',
  'duplicate-clue-id', 'duplicate-clue-text', 'inconsistent-category-set', 'duplicate-category-name',
  'incomplete-category-set', 'invalid-final-shape',
  'file-too-large', 'record-too-large', 'too-many-rows', 'field-too-long', 'misplaced-bom',
  'missing-header', 'invalid-header', 'invalid-csv-shape', 'invalid-utf8',
] as const;

export type CsvValidationIssueCode = (typeof CSV_VALIDATION_ISSUE_CODES)[number];

const SAFE_CSV_ERROR_MESSAGES: Partial<Record<CsvValidationIssueCode, string>> = {
  'file-too-large': 'CSV file exceeds the size limit',
  'record-too-large': 'CSV record exceeds the size limit',
  'too-many-rows': 'CSV row count exceeds the limit',
  'field-too-long': 'CSV field exceeds the length limit',
  'misplaced-bom': 'A UTF-8 BOM is allowed only at the start',
  'missing-header': 'CSV header is missing',
  'invalid-header': 'CSV header is invalid',
  'invalid-csv-shape': 'CSV row shape or quoting is invalid',
  'invalid-utf8': 'CSV import source is not valid UTF-8',
};

export class CsvValidationError extends Error {
  constructor(readonly code: CsvValidationIssueCode) {
    super(SAFE_CSV_ERROR_MESSAGES[code] ?? code);
    this.name = 'CsvValidationError';
  }
}
