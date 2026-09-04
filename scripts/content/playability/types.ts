export type LocalizedText = Readonly<{ en: string; et: string }>;

export type PlayableSource = Readonly<{
  sourceId: string;
  title: string;
  url: string;
  license: string;
  retrievedAt: string;
}>;

export type PlayableQuestion = Readonly<{
  key: string;
  factKey: string;
  tier: 1 | 2 | 3 | 4 | 5;
  subjectKey: string;
  clue: LocalizedText;
  response: LocalizedText;
  acceptedVariants: Readonly<{ en: readonly string[]; et: readonly string[] }>;
  explanation: LocalizedText;
  source: PlayableSource;
}>;

export type PlayableCategory = Readonly<{
  categorySetId: string;
  batchId: string;
  packId: string;
  difficulty: 'medium' | 'hard';
  name: LocalizedText;
  questions: readonly PlayableQuestion[];
}>;

export type PlayabilityReason =
  | 'source-heading-prefix'
  | 'raw-field-prompt'
  | 'associated-with-prompt'
  | 'arbitrary-exact-value'
  | 'minor-credit-prompt'
  | 'binary-or-multiple-choice'
  | 'answer-leak'
  | 'undated-changing-fact'
  | 'generic-category-title'
  | 'repeated-answer'
  | 'incoherent-source-fanout';

export type PlayabilityDiagnostic = Readonly<{
  code: PlayabilityReason;
  entity: 'clue' | 'category';
  id: string;
  message: string;
}>;

export type PlayabilityAudit = Readonly<{
  clueReasons: ReadonlyMap<string, readonly PlayabilityReason[]>;
  categoryReasons: ReadonlyMap<string, readonly PlayabilityReason[]>;
  counts: Readonly<Record<PlayabilityReason, number>>;
  diagnostics: readonly PlayabilityDiagnostic[];
}>;
