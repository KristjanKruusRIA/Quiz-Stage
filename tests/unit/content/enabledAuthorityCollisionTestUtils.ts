import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
import { GEOGRAPHY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/geography';
import { HISTORY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/history';
import { LITERATURE_LANGUAGE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/literatureLanguage';
import { SCIENCE_NATURE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/scienceNature';
import { PACKS_05_TO_08_CATEGORIES } from '../../../scripts/content/playability/banks/packs05to08';
import { PACKS_09_TO_12_CATEGORIES } from '../../../scripts/content/playability/banks/packs09to12';
import { parsePackCsv } from '../../../src/main/content/csvPacks';

const LANGUAGES = ['en', 'et'] as const;

type Language = (typeof LANGUAGES)[number];
type Authority = 'easy' | 'medium-hard' | 'adult' | 'estonia';

export type AuthorityRow = Readonly<{
  id: string;
  authority: Authority;
  factKey: string;
  subjectKey: string;
  clue: Readonly<Record<Language, string>>;
  response: Readonly<Record<Language, string>>;
  acceptedVariants: Readonly<Record<Language, readonly string[]>>;
  explanation: Readonly<Record<Language, string>>;
  source: Readonly<{ title: string; url: string }>;
}>;

type BankCategory = Readonly<{
  questions: readonly Readonly<{
    key: string;
    factKey?: string;
    subjectKey: string;
    clue: Readonly<Record<Language, string>>;
    response: Readonly<Record<Language, string>>;
    acceptedVariants: Readonly<Record<Language, readonly string[]>>;
    explanation: Readonly<Record<Language, string>>;
    source: Readonly<{ title: string; url: string }>;
  }>[];
}>;

export function normalizeAuthorityText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function canonicalResponse(value: string, language: Language): string {
  const identity = normalizeAuthorityText(value);
  return language === 'en' ? identity.replace(/^(?:a|an|the)\s+/u, '') : identity;
}

function containsNormalizedPhrase(value: string, phrase: string): boolean {
  return phrase.length >= 3
    && ` ${normalizeAuthorityText(value)} `.includes(` ${phrase} `);
}

function normalizedSourceUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.href.replace(/\/$/u, '').toLocaleLowerCase('en');
}

function bankAuthorityRows(
  categories: readonly BankCategory[],
  authority: Extract<Authority, 'easy' | 'medium-hard'>,
): AuthorityRow[] {
  return categories.flatMap(({ questions }) => questions.map((question) => ({
    id: question.key,
    authority,
    factKey: question.factKey ?? `accessible-corpus:${question.key}`,
    subjectKey: question.subjectKey,
    clue: question.clue,
    response: question.response,
    acceptedVariants: question.acceptedVariants,
    explanation: question.explanation,
    source: question.source,
  })));
}

function generatedAuthorityRows(
  batchId: '14-adult' | '15-estonia',
  authority: Extract<Authority, 'adult' | 'estonia'>,
): AuthorityRow[] {
  const evidence = new Map<string, Readonly<{
    clueId: string;
    factKey: string;
    subjectKey?: string;
  }>>();
  const evidenceText = readFileSync(resolve('content', 'evidence', `${batchId}.jsonl`), 'utf8');
  for (const line of evidenceText.split(/\r?\n/u).filter((value) => value.trim() !== '')) {
    const record = JSON.parse(line) as Readonly<{
      clueId: string;
      factKey: string;
      subjectKey?: string;
    }>;
    evidence.set(record.clueId, record);
  }

  const csv = readFileSync(resolve('content', 'generated', `${batchId}.en-et.csv`), 'utf8');
  return parsePackCsv(csv).rows.filter(({ enabled }) => enabled === 'true').map((row) => {
    const record = evidence.get(row.clue_id);
    if (record?.subjectKey === undefined) {
      throw new Error(`Missing subject authority for ${row.clue_id}`);
    }
    if (row.variantErrors.length > 0) {
      throw new Error(`Invalid accepted variants for ${row.clue_id}`);
    }
    return {
      id: row.clue_id,
      authority,
      factKey: record.factKey,
      subjectKey: record.subjectKey,
      clue: { en: row.clue_en, et: row.clue_et },
      response: { en: row.response_en, et: row.response_et },
      acceptedVariants: { en: row.acceptedVariantsEn, et: row.acceptedVariantsEt },
      explanation: { en: row.explanation_en, et: row.explanation_et },
      source: { title: row.source_title, url: row.source_url },
    };
  });
}

export function completeEnabledAuthorityCorpus(): readonly AuthorityRow[] {
  const mediumHardCategories = [
    ...HISTORY_CATEGORIES,
    ...GEOGRAPHY_CATEGORIES,
    ...SCIENCE_NATURE_CATEGORIES,
    ...LITERATURE_LANGUAGE_CATEGORIES,
    ...PACKS_05_TO_08_CATEGORIES,
    ...PACKS_09_TO_12_CATEGORIES,
  ];
  return [
    ...bankAuthorityRows(buildAccessibleCorpus(), 'easy'),
    ...bankAuthorityRows(mediumHardCategories, 'medium-hard'),
    ...generatedAuthorityRows('14-adult', 'adult'),
    ...generatedAuthorityRows('15-estonia', 'estonia'),
  ];
}

function responseAliases(row: AuthorityRow, language: Language): ReadonlySet<string> {
  return new Set([row.response[language], ...row.acceptedVariants[language]]
    .map((value) => canonicalResponse(value, language))
    .filter((value) => value.length >= 3));
}

export function findAuthorityOneWayAliasLeaks(
  candidate: AuthorityRow,
  corpus: readonly AuthorityRow[],
): readonly string[] {
  const aliasesByLanguage = Object.fromEntries(LANGUAGES.map((language) =>
    [language, responseAliases(candidate, language)])) as Readonly<Record<
      Language,
      ReadonlySet<string>
    >>;
  return corpus.filter(({ id }) => id !== candidate.id).flatMap((other) => {
    const owner = `${other.authority}:${other.id}`;
    return LANGUAGES.flatMap((language) => {
      const aliases = aliasesByLanguage[language];
      const leaks: string[] = [];
      if ([...aliases].some((alias) => containsNormalizedPhrase(other.clue[language], alias))) {
        leaks.push(`response-in-clue:${language}:${owner}`);
      }
      if ([...aliases].some((alias) =>
        containsNormalizedPhrase(other.explanation[language], alias))) {
        leaks.push(`response-in-explanation:${language}:${owner}`);
      }
      return leaks;
    });
  }).sort();
}

export function findAuthorityCollisions(
  candidate: AuthorityRow,
  corpus: readonly AuthorityRow[],
): readonly string[] {
  return corpus.filter(({ id }) => id !== candidate.id).flatMap((other) => {
    const owner = `${other.authority}:${other.id}`;
    const collisions: string[] = [];
    if (normalizeAuthorityText(candidate.factKey) === normalizeAuthorityText(other.factKey)) {
      collisions.push(`fact:${owner}`);
    }
    if (normalizeAuthorityText(candidate.subjectKey) === normalizeAuthorityText(other.subjectKey)) {
      collisions.push(`subject:${owner}`);
    }
    if (normalizedSourceUrl(candidate.source.url) === normalizedSourceUrl(other.source.url)) {
      collisions.push(`source-url:${owner}`);
    }
    if (normalizeAuthorityText(candidate.source.title)
      === normalizeAuthorityText(other.source.title)) {
      collisions.push(`source-title:${owner}`);
    }
    if (LANGUAGES.every((language) =>
      canonicalResponse(candidate.response[language], language)
      === canonicalResponse(other.response[language], language))) {
      collisions.push(`response-identity:${owner}`);
    }
    for (const language of LANGUAGES) {
      const candidateAliases = responseAliases(candidate, language);
      const otherAliases = responseAliases(other, language);
      if ([...candidateAliases].some((alias) => otherAliases.has(alias))) {
        collisions.push(`response-variant:${language}:${owner}`);
      }
      const inverse = [...candidateAliases].some((alias) =>
        containsNormalizedPhrase(other.clue[language], alias))
        && [...otherAliases].some((alias) =>
          containsNormalizedPhrase(candidate.clue[language], alias));
      if (inverse) collisions.push(`inverse:${language}:${owner}`);
      const candidateIdentity = [
        normalizeAuthorityText(candidate.clue[language]),
        canonicalResponse(candidate.response[language], language),
      ].join('\0');
      const otherIdentity = [
        normalizeAuthorityText(other.clue[language]),
        canonicalResponse(other.response[language], language),
      ].join('\0');
      if (candidateIdentity === otherIdentity) {
        collisions.push(`clue-response:${language}:${owner}`);
      }
    }
    return collisions;
  }).sort();
}
