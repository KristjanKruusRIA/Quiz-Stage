export const CSV_COLUMNS = [
  'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind',
  'round', 'tier', 'difficulty', 'macro_topic', 'category_name_en',
  'category_name_et', 'clue_en', 'clue_et', 'response_en', 'response_et',
  'accepted_variants_en', 'accepted_variants_et', 'explanation_en',
  'explanation_et', 'source_title', 'source_url', 'source_license',
  'source_retrieved_at', 'translation_status', 'enabled',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
