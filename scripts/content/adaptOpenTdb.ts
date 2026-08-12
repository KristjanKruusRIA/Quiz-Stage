import { createHash } from 'node:crypto';

export const OPEN_TDB_SOURCE_TITLE = 'Open Trivia Database';
export const OPEN_TDB_SOURCE_URL = 'https://opentdb.com/';
export const OPEN_TDB_SOURCE_LICENSE = 'CC-BY-SA-4.0';

export type OpenTdbDifficulty = 'easy' | 'medium' | 'hard';

export interface OpenTdbRawQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface OpenTdbDecodedQuestion {
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: OpenTdbDifficulty;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface OpenTdbAdaptedCandidate {
  sourceSystem: 'OpenTDB';
  sourceId: string;
  sourceTitle: typeof OPEN_TDB_SOURCE_TITLE;
  sourceUrl: typeof OPEN_TDB_SOURCE_URL;
  sourceLicense: typeof OPEN_TDB_SOURCE_LICENSE;
  category: string;
  difficulty: OpenTdbDifficulty;
  question: string;
  answer: string;
  questionType: 'multiple' | 'boolean';
  requiresFactualSource: true;
  normalizedDuplicateKey: string;
  requiresFactualSourceReason: 'OpenTDB questions are used for draft inspiration only';
  fetchedAt: string;
}

const ENTITY_DECODERS: Record<string, string> = {
  amp: '&',
  gt: '>',
  lt: '<',
  quot: '"',
  apos: "'",
};

export function stripHtmlEntities(value: string): string {
  return value.replace(/&(#\d+|#x[0-9A-Fa-f]+|[a-zA-Z]+);/g, (match) => {
    if (match.startsWith('&#x') || match.startsWith('&#')) {
      const radix = match.startsWith('&#x') ? 16 : 10;
      const body = match.slice(match.startsWith('&#x') ? 3 : 2, -1);
      const code = Number.parseInt(body, radix);
      return Number.isNaN(code) ? '' : String.fromCodePoint(code);
    }
    const name = match.slice(1, -1);
    return ENTITY_DECODERS[name] ?? '';
  });
}

export function sanitizeOpenTdbText(value: string): string {
  const withoutTags = value.replace(/<[^>]*>/g, '');
  return stripHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

function normalizeText(value: string): string {
  return sanitizeOpenTdbText(value)
    .normalize('NFKC')
    .toLocaleLowerCase('en');
}

export function buildOpenTdbDuplicateKey(question: string, answer: string, category: string, difficulty: string): string {
  return [
    normalizeText(question),
    normalizeText(answer),
    normalizeText(category),
    normalizeText(difficulty),
  ].join('|');
}

function buildOpenTdbSourceId(key: string): string {
  return `opentdb:${createHash('sha1').update(key).digest('hex')}`;
}

export function adaptOpenTdbQuestion(raw: OpenTdbDecodedQuestion, fetchedAt: string): OpenTdbAdaptedCandidate {
  const category = sanitizeOpenTdbText(raw.category);
  const question = sanitizeOpenTdbText(raw.question);
  const answer = sanitizeOpenTdbText(raw.correct_answer);
  const duplicateKey = buildOpenTdbDuplicateKey(question, answer, category, raw.difficulty);
  return {
    sourceSystem: 'OpenTDB',
    sourceId: buildOpenTdbSourceId(duplicateKey),
    sourceTitle: OPEN_TDB_SOURCE_TITLE,
    sourceUrl: OPEN_TDB_SOURCE_URL,
    sourceLicense: OPEN_TDB_SOURCE_LICENSE,
    category,
    difficulty: raw.difficulty,
    question,
    answer,
    questionType: raw.type,
    requiresFactualSource: true,
    requiresFactualSourceReason: 'OpenTDB questions are used for draft inspiration only',
    normalizedDuplicateKey: duplicateKey,
    fetchedAt,
  };
}
