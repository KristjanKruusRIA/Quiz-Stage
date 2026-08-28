import type { AccessibilityAudit, AccessibilityReason } from './types';

const REASONS: readonly AccessibilityReason[] = [
  'source-prefix',
  'infobox-residue',
  'exact-date-or-number',
  'numeric-answer',
  'long-answer',
  'multi-item-answer',
  'binary-question',
  'generic-category-title',
];

const GENERIC_CATEGORY_TITLES = new Set([
  'general knowledge',
  'general trivia',
  'miscellaneous',
  'mixed bag',
  'trivia',
  'üldteadmised',
]);

const normalize = (value: string | undefined): string => value?.replace(/\s+/g, ' ').trim() ?? '';

const compareCodeUnits = (left: string, right: string): number => (
  left < right ? -1 : left > right ? 1 : 0
);

const values = (row: Readonly<Record<string, string>>, english: string, estonian: string): readonly string[] => [
  normalize(row[english]),
  normalize(row[estonian]),
];

const hasSourcePrefix = (clues: readonly string[], sourceTitle: string): boolean => {
  const prefix = sourceTitle.toLowerCase();
  return prefix !== '' && clues.some((clue) => {
    const lowerClue = clue.toLowerCase();
    return lowerClue.startsWith(prefix) && /^[\s:–—-]/.test(lowerClue.slice(prefix.length));
  });
};

const hasInfoboxResidue = (clues: readonly string[]): boolean => clues.some((clue) => (
  /\((?:[^)]*\b(?:born|died|sündinud|suri)\b|\d{1,2}\s+[A-Za-z]+\s+\d{4}[^)]*)\)/i.test(clue)
));

const hasExactDatePrompt = (clues: readonly string[]): boolean => clues.some((clue) => (
  /\b(?:what|which)\s+(?:exact|full)\s+date\b|\bon\s+what\s+date\b/i.test(clue)
));

const hasNumericAnswer = (responses: readonly string[]): boolean => responses.some((response) => {
  if (!/^\d+(?:[.,]\d+)?$/.test(response)) return false;
  const number = Number(response.replace(',', '.'));
  return !Number.isInteger(number) || number < 1000 || number > 2099;
});

const hasLongAnswer = (responses: readonly string[]): boolean => responses.some((response) => response.length >= 40);

const hasMultiItemAnswer = (responses: readonly string[]): boolean => responses.some((response) => /[,;]/.test(response));

const hasBinaryQuestion = (clues: readonly string[]): boolean => clues.some((clue) => (
  /^(?:is|are|was|were|do|does|did|can|could|will|would|has|have|had|kas|oli|olid|kasutas|saab|võib)\b/i.test(clue)
));

const hasGenericCategoryTitle = (names: readonly string[]): boolean => names.some((name) => (
  GENERIC_CATEGORY_TITLES.has(name.toLowerCase())
));

const sortedMap = (reasonsById: ReadonlyMap<string, Set<AccessibilityReason>>): ReadonlyMap<string, readonly AccessibilityReason[]> => (
  new Map([...reasonsById]
    .sort(([left], [right]) => compareCodeUnits(left, right))
    .map(([id, reasons]) => [id, [...reasons].sort(compareCodeUnits)]))
);

export const auditAccessibility = (rows: readonly Record<string, string>[]): AccessibilityAudit => {
  const clueReasons = new Map<string, Set<AccessibilityReason>>();
  const categoryReasons = new Map<string, Set<AccessibilityReason>>();

  for (const row of rows) {
    const clueId = row.clue_id;
    const categoryId = row.category_set_id;
    const clues = values(row, 'clue_en', 'clue_et');
    const responses = values(row, 'response_en', 'response_et');
    const clueSignals: readonly [AccessibilityReason, boolean][] = [
      ['source-prefix', hasSourcePrefix(clues, normalize(row.source_title))],
      ['infobox-residue', hasInfoboxResidue(clues)],
      ['exact-date-or-number', hasExactDatePrompt(clues)],
      ['numeric-answer', hasNumericAnswer(responses)],
      ['long-answer', hasLongAnswer(responses)],
      ['multi-item-answer', hasMultiItemAnswer(responses)],
      ['binary-question', hasBinaryQuestion(clues)],
    ];

    for (const [reason, present] of clueSignals) {
      if (!present || clueId === undefined) continue;
      const reasons = clueReasons.get(clueId) ?? new Set<AccessibilityReason>();
      reasons.add(reason);
      clueReasons.set(clueId, reasons);
    }

    if (categoryId !== undefined && hasGenericCategoryTitle(values(row, 'category_name_en', 'category_name_et'))) {
      const reasons = categoryReasons.get(categoryId) ?? new Set<AccessibilityReason>();
      reasons.add('generic-category-title');
      categoryReasons.set(categoryId, reasons);
    }
  }

  const sortedClueReasons = sortedMap(clueReasons);
  const sortedCategoryReasons = sortedMap(categoryReasons);
  const counts = Object.fromEntries(REASONS.map((reason) => [reason, 0])) as Record<AccessibilityReason, number>;

  for (const reasons of sortedClueReasons.values()) {
    for (const reason of reasons) counts[reason] += 1;
  }
  for (const reasons of sortedCategoryReasons.values()) {
    for (const reason of reasons) counts[reason] += 1;
  }

  return { clueReasons: sortedClueReasons, categoryReasons: sortedCategoryReasons, counts };
};
