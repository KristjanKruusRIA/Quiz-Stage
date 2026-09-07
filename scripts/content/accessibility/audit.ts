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

const DIRECT_ANSWER_REQUEST = /^(?:what|which|name|list|give|identify|supply|state|complete|mis|millised?|nimeta|loetle|ütle|kuidas)\b/iu;
const DIRECT_MULTI_ITEM_REQUEST = /^(?:(?:name|list|give|identify|supply|state)\s+(?:both|all)\b|(?:which|what|name|list|give|identify|supply|state)\s+(?:the\s+)?(?:two|three|four|five|six|seven|eight|nine|ten)\b|(?:what|which|name|supply|state|give|complete)\b[^.!?]*\bcomplete\s+(?:two|three|four|five|six|seven|eight|nine|ten)[-\s]+(?:items?|parts?)\b|(?:nimeta|loetle|ütle)\s+(?:mõlemad|kõik)\b|(?:millised?|mis|nimeta|loetle|ütle)\s+(?:need\s+)?(?:kaks|kolm|neli|viis|kuus|seitse|kaheksa|üheksa|kümme)\b|(?:nimeta|loetle|ütle)\s+nii\b[^.!?]{0,120}\bkui\s+ka|(?:mis|milline|kuidas|nimeta|ütle)\b[^.!?]*\btäielik\w*\b[^.!?]{0,40}\b(?:kahe|kolme|nelja|viie|kuue|seitsme|kaheksa|üheksa|kümne)(?:[-\s]?osaline|[-\s]+osa))\b/iu;

const requestWords = (request: string): string[] => request.match(/[\p{L}\p{N}'’.-]+/gu) ?? [];

type RequestNumber = 'ambiguous' | 'multi' | 'single';

const englishRequestNumber = (request: string): RequestNumber | undefined => {
  const [command, ...rawWords] = requestWords(request);
  if (command === undefined || !/^(?:complete|give|identify|list|name|state|supply|what|which)$/iu.test(command)) return undefined;
  if (/^(?:what|which)$/iu.test(command) && /^(?:are|were)$/iu.test(rawWords[0] ?? '')) return 'multi';
  if (/^(?:what|which)$/iu.test(command) && /^(?:is|was)$/iu.test(rawWords[0] ?? '')) return 'single';
  if (/^(?:a|an|it|one|that|this)$/iu.test(rawWords[0] ?? '')) return 'single';
  const words = [...rawWords];
  while (/^(?:all|the|these|those)$/iu.test(words[0] ?? '')) words.shift();
  for (let skipped = 0; skipped < 3 && words.length > 1; skipped += 1) {
    if (!/^\p{Lu}/u.test(words[0]!) && !/^(?:animated|famous|major|popular|primary)$/iu.test(words[0]!)) break;
    words.shift();
  }
  const target = words[0];
  if (target === undefined) return 'ambiguous';
  if (/^\p{Lu}/u.test(target)) return 'ambiguous';
  const lower = target.toLowerCase();
  if (/^(?:deer|fish|series|sheep|species)$/u.test(lower)) {
    const agreement = words[1]?.toLowerCase() ?? '';
    if (/^(?:are|do|have|were)$/u.test(agreement)) return 'multi';
    if (/^(?:does|has|is|was)$/u.test(agreement) || /(?:s|es)$/u.test(agreement)) return 'single';
    return 'ambiguous';
  }
  if (/^(?:children|feet|geese|men|mice|people|teeth|women)$/u.test(lower)) return 'multi';
  if (/^(?:alias|atlas|bias|canvas|chaos|cosmos|gas|lens|news|status)$/u.test(lower)) return 'single';
  if (/(?:ies|ves|s)$/u.test(lower) && !/(?:is|ous|ss|us)$/u.test(lower)) return 'multi';
  return 'single';
};

const estonianRequestNumber = (request: string): RequestNumber | undefined => {
  const [command, ...rawWords] = requestWords(request);
  if (command === undefined || !/^(?:kuidas|loetle|millised?|mis|nimeta|ütle)$/iu.test(command)) return undefined;
  if (/^millised$/iu.test(command)) return 'multi';
  if (/^millise$/iu.test(command)) return 'single';
  if (/^(?:see|seda|üks)$/iu.test(rawWords[0] ?? '')) return 'single';
  const words = [...rawWords];
  while (/^(?:kõik|need)$/iu.test(words[0] ?? '')) words.shift();
  if (/^(?:nende|oma|selle)$/iu.test(words[0] ?? '')) words.splice(0, 2);
  for (let skipped = 0; skipped < 3 && words.length > 1; skipped += 1) {
    if (!/^\p{Lu}/u.test(words[0]!) && !/^tuntud$/iu.test(words[0]!)) break;
    words.shift();
  }
  const target = words[0];
  if (target === undefined) return 'ambiguous';
  if (/^\p{Lu}/u.test(target)) return 'ambiguous';
  const lower = target.toLowerCase();
  if (/(?:nud|tud)$/u.test(lower)) return 'ambiguous';
  return lower.endsWith('d') ? 'multi' : 'single';
};

const hasGenericPluralRequest = (request: string): boolean => (
  englishRequestNumber(request) ?? estonianRequestNumber(request) ?? 'ambiguous'
) !== 'single';

const directAnswerRequests = (clues: readonly string[]): readonly string[] => clues
  .flatMap((clue) => clue.split(/[.!?;:]+/u))
  .map((clause) => clause.trim())
  .filter((clause) => DIRECT_ANSWER_REQUEST.test(clause));

const hasMultiItemAnswer = (
  responses: readonly string[],
  clues: readonly string[],
): boolean => responses.some((response) => /;/u.test(response))
  || (
    responses.some((response) => /,/u.test(response))
    && directAnswerRequests(clues).some((request) => (
      DIRECT_MULTI_ITEM_REQUEST.test(request)
      || hasGenericPluralRequest(request)
    ))
  );

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
      ['multi-item-answer', hasMultiItemAnswer(responses, clues)],
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
