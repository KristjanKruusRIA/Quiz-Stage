import { createHash } from 'node:crypto';
import type { AccessibleCategory, AccessibleQuestion } from '../accessibility/types';
import type { PlayableCategory, PlayableQuestion } from './types';

export type CrossTierCandidateReason =
  | 'subject-key'
  | 'source-url'
  | 'source-heading'
  | 'response-overlap-en'
  | 'response-overlap-et'
  | 'english-lexical'
  | 'inverse-answer-in-clue-en'
  | 'inverse-answer-in-clue-et';

export type CrossTierCandidate = Readonly<{
  easyId: string;
  playableId: string;
  propositionHash: string;
  reviewKey: string;
  reasons: readonly CrossTierCandidateReason[];
}>;

export type CrossTierConcentration = Readonly<{
  responseKey: string;
  ownerIds: readonly string[];
  reviewKey: string;
}>;

type Language = 'en' | 'et';
type CrossTierQuestion = AccessibleQuestion | PlayableQuestion;

type PreparedQuestion = Readonly<{
  id: string;
  question: CrossTierQuestion;
  categoryTitle: Readonly<Record<Language, string>>;
  subjectKey: string;
  sourceUrl: string;
  sourceHeading: string;
  answer: Readonly<Record<Language, string>>;
  response: Readonly<Record<Language, string>>;
  aliases: Readonly<Record<Language, ReadonlySet<string>>>;
  clue: Readonly<Record<Language, string>>;
  lexicalTokens: ReadonlySet<string>;
}>;

const REASON_ORDER: readonly CrossTierCandidateReason[] = [
  'subject-key',
  'source-url',
  'source-heading',
  'response-overlap-en',
  'response-overlap-et',
  'english-lexical',
  'inverse-answer-in-clue-en',
  'inverse-answer-in-clue-et',
];

const ENGLISH_STOP_WORDS = new Set<string>([
  'a', 'about', 'above', 'across', 'after', 'along', 'also', 'among', 'an', 'and',
  'are', 'around', 'as', 'at', 'be', 'became', 'become', 'becomes', 'been', 'before',
  'being', 'below', 'between', 'by', 'called', 'can', 'could', 'did', 'do', 'does',
  'during', 'five', 'for', 'form', 'four', 'from', 'give', 'given', 'had', 'has',
  'have', 'her', 'his', 'how', 'identify', 'in', 'into', 'is', 'it', 'its', 'kind',
  'known', 'made', 'make', 'makes', 'may', 'might', 'name', 'near', 'of', 'on',
  'one', 'or', 'our', 'over', 'part', 'should', 'than', 'that', 'the', 'their',
  'then', 'these', 'this', 'those', 'three', 'through', 'to', 'two', 'type', 'under',
  'use', 'used', 'using', 'was', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'whose', 'why', 'will', 'with', 'would', 'your',
] as const);

const compareCodeUnits = (left: string, right: string): number => (
  left < right ? -1 : left > right ? 1 : 0
);

export function normalizeCrossTierText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/([\p{L}\p{N}])\+\+/gu, '$1plusplus')
    .replace(/([\p{L}\p{N}])#/gu, '$1sharp')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeResponse(value: string, language: Language): string {
  const normalized = normalizeCrossTierText(value);
  return language === 'en' ? normalized.replace(/^(?:a|an|the)\s+/u, '') : normalized;
}

function normalizeSourceUrl(value: string): string {
  const trimmed = value.normalize('NFKC').trim();
  try {
    const url = new URL(trimmed);
    url.protocol = url.protocol.toLocaleLowerCase('en');
    url.hostname = url.hostname.toLocaleLowerCase('en');
    url.pathname = url.pathname.replace(/\/+$/u, '') || '/';
    url.hash = '';
    return url.toString().replace(/\/$/u, '');
  } catch {
    return normalizeCrossTierText(trimmed);
  }
}

function normalizeSourceHeading(value: string): string {
  return normalizeCrossTierText(value.replace(
    /\s*(?:[-|–—:]\s*)?(?:wikipedia|encyclop(?:a)?edia britannica|britannica)\s*$/iu,
    '',
  ));
}

function stemEnglishToken(value: string): string {
  if (value.length <= 5) return value;
  return value.replace(/(?:ing|ers|ies|ied|ed|es|s)$/u, (suffix) => (
    suffix === 'ies' || suffix === 'ied' ? 'y' : ''
  ));
}

function englishLexicalTokens(question: CrossTierQuestion): ReadonlySet<string> {
  return new Set(normalizeCrossTierText(`${question.clue.en} ${question.response.en}`)
    .split(' ')
    .filter((token) => token.length > 2 && !ENGLISH_STOP_WORDS.has(token))
    .map(stemEnglishToken));
}

function questionId(categorySetId: string, tier: number): string {
  return `${categorySetId}:${tier}`;
}

function prepareQuestion(
  categorySetId: string,
  categoryTitle: Readonly<Record<Language, string>>,
  question: CrossTierQuestion,
): PreparedQuestion {
  const answer = {
    en: normalizeCrossTierText(question.response.en),
    et: normalizeCrossTierText(question.response.et),
  };
  const response = {
    en: normalizeResponse(answer.en, 'en'),
    et: normalizeResponse(answer.et, 'et'),
  };
  return {
    id: questionId(categorySetId, question.tier),
    question,
    categoryTitle: {
      en: normalizeCrossTierText(categoryTitle.en),
      et: normalizeCrossTierText(categoryTitle.et),
    },
    subjectKey: normalizeCrossTierText(question.subjectKey),
    sourceUrl: normalizeSourceUrl(question.source.url),
    sourceHeading: normalizeSourceHeading(question.source.title),
    answer,
    response,
    aliases: {
      en: new Set([question.response.en, ...question.acceptedVariants.en]
        .map((value) => normalizeResponse(value, 'en')).filter(Boolean)),
      et: new Set([question.response.et, ...question.acceptedVariants.et]
        .map((value) => normalizeResponse(value, 'et')).filter(Boolean)),
    },
    clue: {
      en: normalizeCrossTierText(question.clue.en),
      et: normalizeCrossTierText(question.clue.et),
    },
    lexicalTokens: englishLexicalTokens(question),
  };
}

function prepareAccessible(categories: readonly AccessibleCategory[]): readonly PreparedQuestion[] {
  return categories.flatMap((category) => category.questions.map((question) =>
    prepareQuestion(category.categorySetId, category.name, question)));
}

function preparePlayable(categories: readonly PlayableCategory[]): readonly PreparedQuestion[] {
  return categories.flatMap((category) => category.questions.map((question) =>
    prepareQuestion(category.categorySetId, category.name, question)));
}

function addIndexedValues(
  index: Map<string, number[]>,
  values: Iterable<string>,
  itemIndex: number,
): void {
  for (const value of new Set(values)) {
    if (value === '') continue;
    const owners = index.get(value) ?? [];
    owners.push(itemIndex);
    index.set(value, owners);
  }
}

function indexPrepared(
  rows: readonly PreparedQuestion[],
  values: (row: PreparedQuestion) => Iterable<string>,
): ReadonlyMap<string, readonly number[]> {
  const index = new Map<string, number[]>();
  rows.forEach((row, itemIndex) => addIndexedValues(index, values(row), itemIndex));
  return index;
}

function containsPhrase(text: string, phrase: string): boolean {
  return phrase !== '' && ` ${text} `.includes(` ${phrase} `);
}

function questionDigest(row: PreparedQuestion): string {
  return createHash('sha256').update([
    row.id,
    row.categoryTitle.en,
    row.categoryTitle.et,
    row.subjectKey,
    row.clue.en,
    row.clue.et,
    row.answer.en,
    row.answer.et,
    normalizeCrossTierText(row.question.explanation.en),
    normalizeCrossTierText(row.question.explanation.et),
    [...row.aliases.en].sort(compareCodeUnits).join('\u001f'),
    [...row.aliases.et].sort(compareCodeUnits).join('\u001f'),
    row.sourceHeading,
    row.sourceUrl,
  ].join('\0')).digest('hex').slice(0, 12);
}

function pairDigest(easy: PreparedQuestion, playable: PreparedQuestion): string {
  return createHash('sha256')
    .update(`${questionDigest(easy)}\0${questionDigest(playable)}`)
    .digest('hex')
    .slice(0, 12);
}

export function findCrossTierCandidates(
  easyCategories: readonly AccessibleCategory[],
  playableCategories: readonly PlayableCategory[],
): readonly CrossTierCandidate[] {
  const easy = prepareAccessible(easyCategories);
  const playable = preparePlayable(playableCategories);
  const reasonsByPair = new Map<string, Set<CrossTierCandidateReason>>();

  const addReason = (
    easyIndex: number,
    playableIndex: number,
    reason: CrossTierCandidateReason,
  ): void => {
    const pairKey = `${easyIndex}:${playableIndex}`;
    const reasons = reasonsByPair.get(pairKey) ?? new Set<CrossTierCandidateReason>();
    reasons.add(reason);
    reasonsByPair.set(pairKey, reasons);
  };

  const addExactMatches = (
    values: (row: PreparedQuestion) => Iterable<string>,
    reason: CrossTierCandidateReason,
  ): void => {
    const playableIndex = indexPrepared(playable, values);
    easy.forEach((row, easyIndex) => {
      const matchingPlayable = new Set<number>();
      for (const value of new Set(values(row))) {
        if (value === '') continue;
        for (const itemIndex of playableIndex.get(value) ?? []) matchingPlayable.add(itemIndex);
      }
      for (const itemIndex of matchingPlayable) addReason(easyIndex, itemIndex, reason);
    });
  };

  addExactMatches((row) => [row.subjectKey], 'subject-key');
  addExactMatches((row) => [normalizeCrossTierText(
    row.question.subjectKey.split(':').slice(1).join(':') || row.question.subjectKey,
  )], 'subject-key');
  addExactMatches((row) => [row.sourceUrl], 'source-url');
  addExactMatches((row) => [row.sourceHeading], 'source-heading');
  addExactMatches((row) => row.aliases.en, 'response-overlap-en');
  addExactMatches((row) => row.aliases.et, 'response-overlap-et');

  const playableByLexicalToken = indexPrepared(playable, (row) => row.lexicalTokens);
  easy.forEach((easyRow, easyIndex) => {
    const sharedCounts = new Map<number, number>();
    for (const token of easyRow.lexicalTokens) {
      for (const playableIndex of playableByLexicalToken.get(token) ?? []) {
        sharedCounts.set(playableIndex, (sharedCounts.get(playableIndex) ?? 0) + 1);
      }
    }
    for (const [playableIndex, shared] of sharedCounts) {
      if (shared < 3) continue;
      const playableSize = playable[playableIndex]!.lexicalTokens.size;
      const easySize = easyRow.lexicalTokens.size;
      const union = easySize + playableSize - shared;
      if (shared / union >= 0.27 || shared / Math.min(easySize, playableSize) >= 0.60) {
        addReason(easyIndex, playableIndex, 'english-lexical');
      }
    }
  });

  for (const language of ['en', 'et'] as const) {
    const playableByClueToken = indexPrepared(playable, (row) => new Set(row.clue[language].split(' ')));
    easy.forEach((easyRow, easyIndex) => {
      const answer = easyRow.response[language];
      if (answer.length < 3) return;
      const firstToken = answer.split(' ')[0];
      if (firstToken === undefined || firstToken === '') return;
      for (const playableIndex of playableByClueToken.get(firstToken) ?? []) {
        const playableRow = playable[playableIndex]!;
        if (
          playableRow.response[language].length >= 3
          && containsPhrase(playableRow.clue[language], answer)
          && containsPhrase(easyRow.clue[language], playableRow.response[language])
        ) {
          addReason(easyIndex, playableIndex, `inverse-answer-in-clue-${language}`);
        }
      }
    });
  }

  return [...reasonsByPair.entries()].map(([pairKey, reasonSet]) => {
    const [easyIndex, playableIndex] = pairKey.split(':').map(Number);
    const easyRow = easy[easyIndex!]!;
    const playableRow = playable[playableIndex!]!;
    const propositionHash = pairDigest(easyRow, playableRow);
    return {
      easyId: easyRow.id,
      playableId: playableRow.id,
      propositionHash,
      reviewKey: `${easyRow.id}>${playableRow.id}@${propositionHash}`,
      reasons: REASON_ORDER.filter((reason) => reasonSet.has(reason)),
    };
  }).sort((left, right) => (
    compareCodeUnits(left.easyId, right.easyId)
      || compareCodeUnits(left.playableId, right.playableId)
  ));
}

export function findUnreviewedCrossTierCandidates(
  candidates: readonly CrossTierCandidate[],
  reviewedKeys: readonly string[],
): readonly CrossTierCandidate[] {
  const reviewed = new Set(reviewedKeys);
  return candidates.filter(({ reviewKey }) => !reviewed.has(reviewKey));
}

export function findStaleCrossTierCandidateReviews(
  candidates: readonly CrossTierCandidate[],
  reviewedKeys: readonly string[],
): readonly string[] {
  const current = new Set(candidates.map(({ reviewKey }) => reviewKey));
  return reviewedKeys.filter((reviewKey) => !current.has(reviewKey));
}

export function findStaleConfirmedCrossTierDuplicatePairIds(
  candidates: readonly CrossTierCandidate[],
  confirmedPairIds: readonly string[],
): readonly string[] {
  const current = new Set(candidates.map(({ easyId, playableId }) => `${easyId}>${playableId}`));
  return confirmedPairIds.filter((pairId) => !current.has(pairId));
}

export function findCrossTierPrimaryResponseConcentrations(
  easyCategories: readonly AccessibleCategory[],
  playableCategories: readonly PlayableCategory[],
): readonly CrossTierConcentration[] {
  const easy = prepareAccessible(easyCategories);
  const playable = preparePlayable(playableCategories);
  const ownersByResponse = new Map<string, Array<PreparedQuestion & { difficulty: 'easy' | 'playable' }>>();

  for (const [difficulty, rows] of [
    ['easy', easy],
    ['playable', playable],
  ] as const) {
    for (const row of rows) {
      for (const language of ['en', 'et'] as const) {
        const responseKey = `${language}:${row.response[language]}`;
        const owners = ownersByResponse.get(responseKey) ?? [];
        owners.push({ ...row, difficulty });
        ownersByResponse.set(responseKey, owners);
      }
    }
  }

  return [...ownersByResponse.entries()]
    .filter(([, owners]) => owners.length >= 3
      && owners.some(({ difficulty }) => difficulty === 'easy')
      && owners.some(({ difficulty }) => difficulty === 'playable'))
    .map(([responseKey, owners]) => {
      const ordered = [...owners].sort((left, right) => compareCodeUnits(left.id, right.id));
      return {
        responseKey,
        ownerIds: ordered.map(({ id }) => id),
        reviewKey: `${responseKey}::${ordered.map((row) => (
          `${row.id}@${questionDigest(row)}`
        )).join(',')}`,
      };
    })
    .sort((left, right) => compareCodeUnits(left.responseKey, right.responseKey));
}

export function findUnreviewedCrossTierConcentrations(
  concentrations: readonly CrossTierConcentration[],
  reviewedKeys: readonly string[],
): readonly CrossTierConcentration[] {
  const reviewed = new Set(reviewedKeys);
  return concentrations.filter(({ reviewKey }) => !reviewed.has(reviewKey));
}

export function findStaleCrossTierConcentrationReviews(
  concentrations: readonly CrossTierConcentration[],
  reviewedKeys: readonly string[],
): readonly string[] {
  const current = new Set(concentrations.map(({ reviewKey }) => reviewKey));
  return reviewedKeys.filter((reviewKey) => !current.has(reviewKey));
}
