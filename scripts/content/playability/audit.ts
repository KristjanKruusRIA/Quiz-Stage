import type {
  PlayabilityAudit,
  PlayabilityDiagnostic,
  PlayabilityReason,
} from './types';

const REASONS: readonly PlayabilityReason[] = [
  'answer-leak',
  'arbitrary-exact-value',
  'associated-with-prompt',
  'binary-or-multiple-choice',
  'generic-category-title',
  'incoherent-source-fanout',
  'minor-credit-prompt',
  'raw-field-prompt',
  'repeated-answer',
  'source-heading-prefix',
  'undated-changing-fact',
];

const MESSAGES: Readonly<Record<PlayabilityReason, string>> = {
  'answer-leak': 'Clue or category title contains the intended response.',
  'arbitrary-exact-value': 'Clue asks for an arbitrary exact date, measurement, or metadata value.',
  'associated-with-prompt': 'Clue uses a vague associated-with answer template.',
  'binary-or-multiple-choice': 'Clue can be answered as yes/no or from supplied choices.',
  'generic-category-title': 'Category title is generic filler rather than an announceable theme.',
  'incoherent-source-fanout': 'Category fans out several clues from one primary subject.',
  'minor-credit-prompt': 'Clue asks for an obscure minor production credit.',
  'raw-field-prompt': 'Clue exposes a raw source field instead of a standalone trivia prompt.',
  'repeated-answer': 'The same canonical response appears in another clue.',
  'source-heading-prefix': 'Clue begins with its source-page heading.',
  'undated-changing-fact': 'Clue asks about a changing fact without an explicit date.',
};

const GENERIC_TITLE = /^(?:mix|medley|tour|grab bag|roundup|sampler|potpourri|challenge|quiz|odds\s*(?:&|and)\s*ends|segu)(?:\s+\d+)?$/iu;
const RAW_FIELD = /^(?:occupation|country of citizenship|citizenship|date of birth|place of birth|native name|runtime|capacity|elevation|coordinates|height|weight|developer|publisher|manufacturer)\s*[:—-]|^(?:what|which)\s+(?:is|was|are|were)\s+(?:the\s+)?(?:occupation|country of citizenship|citizenship|date of birth|place of birth|runtime|capacity|elevation|coordinates|height|weight)\b/iu;
const RAW_FIELD_ET = /^(?:amet|kodakondsus|sünniaeg|sünnikuupäev|sünnikoht|emakeelne nimi|kestus|mahutavus|kõrgus|koordinaadid|kaal|arendaja|kirjastaja|tootja)\s*[:—-]|^(?:mis|milline)\s+on\s+(?:selle\s+)?(?:amet|kodakondsus|sünniaeg|sünnikuupäev|sünnikoht|kestus|mahutavus|kõrgus|koordinaadid|kaal)\b/iu;
const ASSOCIATED_WITH = /^(?:who|what|which)\b[^?]{0,100}\b(?:is|are|was|were) associated with\b/iu;
const ASSOCIATED_WITH_ET = /^(?:kes|mis|milline)\b[^?]{0,100}\b(?:on|oli|olid) seotud\b/iu;
const EXACT_DATE_REQUEST = /\b(?:what|which)\s+(?:exact|full)\s+date\b|\bon what exact date\b/iu;
const EXACT_DATE_REQUEST_ET = /\bmis täpsel kuupäeval\b|\bmilline on (?:täpne|täielik) kuupäev\b/iu;
const ARBITRARY_DATE_CONTEXT = /\b(?:born|birth|died|death|released|premiered|opened|founded|established|incorporated|registered|married|graduated)\b/iu;
const ARBITRARY_DATE_CONTEXT_ET = /\b(?:sündis|sündinud|suri|surm|avaldati|esilinastus|avati|asutati|asutatud|registreeriti|registreeritud|abiellus|lõpetas)\b/iu;
const ARBITRARY_NUMBER = /\bexactly how many\b|^how many\s+(?:seats?|metres?|meters?|kilometres?|kilometers?|grams?|kilograms?|calories?|episodes?|rooms?|storeys?|stories?)\b|^(?:what|which)\s+(?:is|was|are|were)\s+(?:the\s+)?(?:capacity|runtime|height|weight|elevation|area|coordinates|population)\b/iu;
const ARBITRARY_NUMBER_ET = /\btäpselt mitu\b|^mitu\s+(?:istekohta|meetrit|kilomeetrit|grammi|kilogrammi|kalorit|episoodi|tuba|korrust)\b|^(?:mis|milline)\s+on\s+(?:selle\s+)?(?:mahutavus|kestus|kõrgus|kaal|koordinaadid|rahvaarv)\b/iu;
const MINOR_CREDIT = /\b(?:second|third)\s+assistant\s+director\b|\b(?:assistant\s+(?:art|costume|production)\s+(?:director|designer)|production coordinator|script supervisor|key grip|best boy|gaffer|unit production manager)\b/iu;
const MINOR_CREDIT_ET = /\b(?:teine|kolmas)\s+režissööri assistent\b|\b(?:tootmiskoordinaator|stsenaariumi juhendaja|võttegrupi valgustaja)\b/iu;
const BINARY_OR_MULTIPLE_CHOICE = /^(?:is|are|was|were|do|does|did|can|could|will|would|has|have|had|should)\b|^(?:which|what)\s+(?:one\s+)?of\s+(?:these|the following)\b/iu;
const BINARY_OR_MULTIPLE_CHOICE_ET = /^kas\b|^(?:milline|mis)\s+(?:üks\s+)?(?:neist|järgmistest)\b/iu;
const CURRENT_CUE = /\b(?:currently|today|now|presently|at present|most recent|latest|incumbent|sitting)\b|\bcurrent\s+(?:president|prime minister|chief executive(?: officer)?|ceo|mayor|governor|leader|chair(?:person|man|woman)?|champion|record holder|population)\b/iu;
const CURRENT_CUE_ET = /\b(?:praegu|hetkel|tänapäeval|praegune|viimane|uusim|ametis olev)\b/iu;
const CHANGING_ROLE = /^(?:who|which person)\s+is\b[^?]{0,100}\b(?:president|prime minister|chief executive(?: officer)?|ceo|mayor|governor|leader|chair(?:person|man|woman)?)\b|\b(?:which|what) country\b[^?]{0,100}\b(?:has|had) the largest population\b/iu;
const CHANGING_ROLE_ET = /^(?:kes|milline isik)\s+on\b[^?]{0,100}\b(?:president|peaminister|tegevjuht|linnapea|kuberner|juht|esimees)\b|\bmillisel riigil\b[^?]{0,60}\b(?:on|oli) suurim rahvaarv\b/iu;
const AS_OF_DATE = /\bas of\s+(?:\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})\b/iu;
const AS_OF_DATE_ET = /\b(?:1[5-9]\d{2}|20\d{2}|2100)\.?\s+aasta seisuga\b|\bseisuga\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b/iu;
const RELATION_YEAR = /\b(?:in|during)\s+(?:1[5-9]\d{2}|20\d{2}|2100)\b/iu;
const RELATION_YEAR_ET = /\b(?:1[5-9]\d{2}|20\d{2}|2100)\.?\s+aastal\b/iu;
const NON_LEAKING_ANSWERS = new Set(['false', 'no', 'true', 'what', 'when', 'where', 'which', 'who', 'yes']);

const compareCodeUnits = (left: string, right: string): number => (
  left < right ? -1 : left > right ? 1 : 0
);

const normalize = (value: string | undefined): string => (
  value?.normalize('NFKC').replace(/\s+/g, ' ').trim() ?? ''
);

const searchable = (value: string | undefined): string => normalize(value)
  .toLocaleLowerCase('en')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

const canonicalAnswer = (value: string | undefined): string => searchable(value)
  .replace(/^(?:a|an|the)\s+/u, '');

const sourceHeading = (value: string | undefined): string => normalize(value)
  .replace(/\s+(?:[–—-]\s*)?(?:wikipedia|encyclopaedia britannica|britannica)$/iu, '')
  .trim();

const values = (
  row: Readonly<Record<string, string>>,
  english: string,
  estonian: string,
): readonly string[] => [normalize(row[english]), normalize(row[estonian])];

const startsWithSourceHeading = (clues: readonly string[], title: string | undefined): boolean => {
  const heading = sourceHeading(title);
  if (heading.length < 4) return false;
  const headingPattern = heading.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const prefixedHeading = new RegExp(`^${headingPattern}\\s*(?::|[–—-])(?:\\s|$)`, 'iu');
  return clues.some((clue) => {
    const normalizedClue = normalize(clue);
    return normalizedClue.toLocaleLowerCase('en') === heading.toLocaleLowerCase('en')
      || prefixedHeading.test(normalizedClue);
  });
};

const containsAnswer = (text: string, answer: string): boolean => (
  answer.length >= 4
  && !NON_LEAKING_ANSWERS.has(answer)
  && (` ${searchable(text)} `).includes(` ${answer} `)
);

const hasAnswerLeak = (row: Readonly<Record<string, string>>): boolean => {
  const pairs = [
    [row.clue_en, row.category_name_en, row.response_en],
    [row.clue_et, row.category_name_et, row.response_et],
  ] as const;
  return pairs.some(([clue, category, response]) => {
    const answer = canonicalAnswer(response);
    return containsAnswer(clue ?? '', answer) || containsAnswer(category ?? '', answer);
  });
};

const genericTitle = (value: string): boolean => {
  const suffix = normalize(value).split(':').at(-1) ?? '';
  return GENERIC_TITLE.test(suffix.trim());
};

const hasArbitraryExactValue = (clue: string): boolean => (
  ARBITRARY_NUMBER.test(clue)
  || ARBITRARY_NUMBER_ET.test(clue)
  || (EXACT_DATE_REQUEST.test(clue) && ARBITRARY_DATE_CONTEXT.test(clue))
  || (EXACT_DATE_REQUEST_ET.test(clue) && ARBITRARY_DATE_CONTEXT_ET.test(clue))
);

const hasUndatedChangingFact = (clue: string): boolean => {
  const hasCurrentCue = CURRENT_CUE.test(clue) || CURRENT_CUE_ET.test(clue);
  const hasChangingRole = CHANGING_ROLE.test(clue) || CHANGING_ROLE_ET.test(clue);
  if (!hasCurrentCue && !hasChangingRole) return false;
  if (AS_OF_DATE.test(clue) || AS_OF_DATE_ET.test(clue)) return false;
  return hasCurrentCue || !(RELATION_YEAR.test(clue) || RELATION_YEAR_ET.test(clue));
};

const sortedMap = (
  reasonsById: ReadonlyMap<string, Set<PlayabilityReason>>,
): ReadonlyMap<string, readonly PlayabilityReason[]> => new Map(
  [...reasonsById]
    .sort(([left], [right]) => compareCodeUnits(left, right))
    .map(([id, reasons]) => [id, [...reasons].sort(compareCodeUnits)]),
);

const addReason = (
  reasonsById: Map<string, Set<PlayabilityReason>>,
  id: string | undefined,
  reason: PlayabilityReason,
): void => {
  if (id === undefined || id === '') return;
  const reasons = reasonsById.get(id) ?? new Set<PlayabilityReason>();
  reasons.add(reason);
  reasonsById.set(id, reasons);
};

const diagnosticsFor = (
  entity: 'clue' | 'category',
  reasonsById: ReadonlyMap<string, readonly PlayabilityReason[]>,
): PlayabilityDiagnostic[] => [...reasonsById].flatMap(([id, reasons]) => reasons.map((code) => ({
  code,
  entity,
  id,
  message: MESSAGES[code],
})));

export const auditPlayability = (
  rows: readonly Readonly<Record<string, string>>[],
): PlayabilityAudit => {
  const clueReasons = new Map<string, Set<PlayabilityReason>>();
  const categoryReasons = new Map<string, Set<PlayabilityReason>>();
  const answers = new Map<string, Map<string, Set<string>>>();
  const categorySubjects = new Map<string, Map<string, Set<string>>>();

  for (const row of rows) {
    const clueId = row.clue_id;
    const categoryId = row.category_set_id;
    const clues = values(row, 'clue_en', 'clue_et');
    const clueSignals: readonly [PlayabilityReason, boolean][] = [
      ['source-heading-prefix', startsWithSourceHeading(clues, row.source_title)],
      ['raw-field-prompt', clues.some((clue) => RAW_FIELD.test(clue) || RAW_FIELD_ET.test(clue))],
      ['associated-with-prompt', clues.some((clue) => (
        ASSOCIATED_WITH.test(clue) || ASSOCIATED_WITH_ET.test(clue)
      ))],
      ['arbitrary-exact-value', clues.some(hasArbitraryExactValue)],
      ['minor-credit-prompt', clues.some((clue) => (
        MINOR_CREDIT.test(clue) || MINOR_CREDIT_ET.test(clue)
      ))],
      ['binary-or-multiple-choice', clues.some((clue) => (
        BINARY_OR_MULTIPLE_CHOICE.test(clue) || BINARY_OR_MULTIPLE_CHOICE_ET.test(clue)
      ))],
      ['answer-leak', hasAnswerLeak(row)],
      ['undated-changing-fact', clues.some(hasUndatedChangingFact)],
    ];
    for (const [reason, present] of clueSignals) {
      if (present) addReason(clueReasons, clueId, reason);
    }

    if (categoryId !== undefined
      && values(row, 'category_name_en', 'category_name_et').some(genericTitle)) {
      addReason(categoryReasons, categoryId, 'generic-category-title');
    }

    const answer = canonicalAnswer(row.response_en) || canonicalAnswer(row.response_et);
    if (clueId !== undefined && answer.length >= 4 && !NON_LEAKING_ANSWERS.has(answer)) {
      const categoryKey = categoryId ?? `clue:${clueId}`;
      const categoryAnswers = answers.get(answer) ?? new Map<string, Set<string>>();
      const clueIds = categoryAnswers.get(categoryKey) ?? new Set<string>();
      clueIds.add(clueId);
      categoryAnswers.set(categoryKey, clueIds);
      answers.set(answer, categoryAnswers);
    }

    const subject = searchable(row.subject_key);
    if (categoryId !== undefined && clueId !== undefined && subject !== '') {
      const subjects = categorySubjects.get(categoryId) ?? new Map<string, Set<string>>();
      const clueIds = subjects.get(subject) ?? new Set<string>();
      clueIds.add(clueId);
      subjects.set(subject, clueIds);
      categorySubjects.set(categoryId, subjects);
    }
  }

  for (const categoryAnswers of answers.values()) {
    const allClueIds = new Set([...categoryAnswers.values()].flatMap((clueIds) => [...clueIds]));
    if (allClueIds.size >= 3) {
      for (const clueId of allClueIds) addReason(clueReasons, clueId, 'repeated-answer');
      continue;
    }
    for (const clueIds of categoryAnswers.values()) {
      if (clueIds.size < 2) continue;
      for (const clueId of clueIds) addReason(clueReasons, clueId, 'repeated-answer');
    }
  }
  for (const [categoryId, subjects] of categorySubjects) {
    if ([...subjects.values()].some((clueIds) => clueIds.size >= 3)) {
      addReason(categoryReasons, categoryId, 'incoherent-source-fanout');
    }
  }

  const sortedClueReasons = sortedMap(clueReasons);
  const sortedCategoryReasons = sortedMap(categoryReasons);
  const diagnostics = [
    ...diagnosticsFor('clue', sortedClueReasons),
    ...diagnosticsFor('category', sortedCategoryReasons),
  ].sort((left, right) => compareCodeUnits(
    `${left.entity}:${left.id}:${left.code}`,
    `${right.entity}:${right.id}:${right.code}`,
  ));
  const counts = Object.fromEntries(REASONS.map((reason) => [reason, 0])) as Record<PlayabilityReason, number>;
  for (const diagnostic of diagnostics) counts[diagnostic.code] += 1;

  return {
    clueReasons: sortedClueReasons,
    categoryReasons: sortedCategoryReasons,
    counts,
    diagnostics,
  };
};
