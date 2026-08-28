export type LocalizedText = Readonly<{ en: string; et: string }>;

export type AccessibleCategory = Readonly<{
  categorySetId: string;
  batchId: string;
  name: LocalizedText;
  questions: readonly AccessibleQuestion[];
}>;

export type AccessibleQuestion = Readonly<{
  key: string;
  tier: 1 | 2 | 3 | 4 | 5;
  subjectKey: string;
  clue: LocalizedText;
  response: LocalizedText;
  acceptedVariants: Readonly<{ en: readonly string[]; et: readonly string[] }>;
  explanation: LocalizedText;
  source: Readonly<{
    sourceId: string;
    title: string;
    url: string;
    license: string;
    retrievedAt: string;
  }>;
}>;

export type CategoryTitle = Readonly<{
  categorySetId: string;
  batchId: string;
  name: LocalizedText;
}>;

export type AccessibilityReason =
  | 'source-prefix'
  | 'infobox-residue'
  | 'exact-date-or-number'
  | 'numeric-answer'
  | 'long-answer'
  | 'multi-item-answer'
  | 'binary-question'
  | 'generic-category-title';

export type AccessibilityAudit = Readonly<{
  clueReasons: ReadonlyMap<string, readonly AccessibilityReason[]>;
  categoryReasons: ReadonlyMap<string, readonly AccessibilityReason[]>;
  counts: Readonly<Record<AccessibilityReason, number>>;
}>;
