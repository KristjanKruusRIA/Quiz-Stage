import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
import { buildEasyExpansionCorpus } from '../../../scripts/content/easyExpansion/bank';
import type { EasyExpansionCategory } from '../../../scripts/content/easyExpansion/types';
import { GEOGRAPHY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/geography';
import { HISTORY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/history';
import { LITERATURE_LANGUAGE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/literatureLanguage';
import { SCIENCE_NATURE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/scienceNature';
import { PACKS_05_TO_08_CATEGORIES } from '../../../scripts/content/playability/banks/packs05to08';
import { PACKS_09_TO_12_CATEGORIES } from '../../../scripts/content/playability/banks/packs09to12';
import { parsePackCsv } from '../../../src/main/content/csvPacks';

const LANGUAGES = ['en', 'et'] as const;

type Language = (typeof LANGUAGES)[number];
type Authority = 'easy' | 'easy-expansion' | 'medium-hard' | 'final' | 'adult' | 'estonia';

export type AuthorityRow = Readonly<{
  id: string;
  authority: Authority;
  factKey: string;
  subjectKey?: string;
  categorySetId?: string;
  categoryTitle?: Readonly<Record<Language, string>>;
  clue: Readonly<Record<Language, string>>;
  response: Readonly<Record<Language, string>>;
  acceptedVariants: Readonly<Record<Language, readonly string[]>>;
  explanation: Readonly<Record<Language, string>>;
  source: Readonly<{ title: string; url: string }>;
}>;

type BankCategory = Readonly<{
  categorySetId: string;
  name: Readonly<Record<Language, string>>;
  questions: readonly Readonly<{
    clueId?: string;
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

function containsPreparedPhrase(normalizedValue: string, phrase: string): boolean {
  return phrase.length >= 3 && ` ${normalizedValue} `.includes(` ${phrase} `);
}

function normalizedSourceUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.href.replace(/\/$/u, '').toLocaleLowerCase('en');
}

function bankAuthorityRows(
  categories: readonly BankCategory[],
  authority: Extract<Authority, 'easy' | 'easy-expansion' | 'medium-hard'>,
  questionId: (question: BankCategory['questions'][number]) => string = ({ key }) => key,
): AuthorityRow[] {
  return categories.flatMap(({ categorySetId, name, questions }) => questions.map((question) => ({
    id: questionId(question),
    authority,
    factKey: question.factKey ?? `accessible-corpus:${question.key}`,
    subjectKey: question.subjectKey,
    categorySetId,
    categoryTitle: name,
    clue: question.clue,
    response: question.response,
    acceptedVariants: question.acceptedVariants,
    explanation: question.explanation,
    source: question.source,
  })));
}

function generatedAuthorityRows(
  batchId: '13-finals' | '14-adult' | '15-estonia',
  authority: Extract<Authority, 'final' | 'adult' | 'estonia'>,
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
    if (record === undefined) {
      throw new Error(`Missing evidence authority for ${row.clue_id}`);
    }
    if (authority !== 'final' && record.subjectKey === undefined) {
      throw new Error(`Missing subject authority for ${row.clue_id}`);
    }
    if (row.variantErrors.length > 0) {
      throw new Error(`Invalid accepted variants for ${row.clue_id}`);
    }
    return {
      id: row.clue_id,
      authority,
      factKey: record.factKey,
      ...(record.subjectKey === undefined ? {} : { subjectKey: record.subjectKey }),
      categorySetId: row.category_set_id,
      categoryTitle: { en: row.category_name_en, et: row.category_name_et },
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

export function registeredEasyExpansionAuthorityRows(
  categories: readonly EasyExpansionCategory[] = buildEasyExpansionCorpus(),
): readonly AuthorityRow[] {
  return bankAuthorityRows(categories, 'easy-expansion', (question) => {
    if (question.clueId === undefined) {
      throw new Error(`Missing Phase B clue ID for ${question.key}`);
    }
    return question.clueId;
  });
}

export function completeCumulativeAuthorityCorpus(
  categories: readonly EasyExpansionCategory[] = buildEasyExpansionCorpus(),
): readonly AuthorityRow[] {
  return [
    ...completeEnabledAuthorityCorpus(),
    ...generatedAuthorityRows('13-finals', 'final'),
    ...registeredEasyExpansionAuthorityRows(categories),
  ];
}

function responseAliases(row: AuthorityRow, language: Language): ReadonlySet<string> {
  return new Set([row.response[language], ...row.acceptedVariants[language]]
    .map((value) => canonicalResponse(value, language))
    .filter((value) => value.length >= 3));
}

type PreparedLanguage = Readonly<{
  aliases: ReadonlySet<string>;
  clue: string;
  explanation: string;
  clueResponseIdentity: string;
}>;

type PreparedAuthorityRow = Readonly<{
  row: AuthorityRow;
  owner: string;
  factKey: string;
  subjectKey?: string;
  categoryTitle?: Readonly<Record<Language, string>>;
  sourceUrl: string;
  sourceTitle: string;
  responseIdentity: string;
  language: Readonly<Record<Language, PreparedLanguage>>;
}>;

const PREPARED_AUTHORITY_ROWS = new WeakMap<AuthorityRow, PreparedAuthorityRow>();

function prepareAuthorityRow(row: AuthorityRow): PreparedAuthorityRow {
  const cached = PREPARED_AUTHORITY_ROWS.get(row);
  if (cached !== undefined) return cached;

  const language = Object.fromEntries(LANGUAGES.map((languageKey) => {
    const clue = normalizeAuthorityText(row.clue[languageKey]);
    const response = canonicalResponse(row.response[languageKey], languageKey);
    return [languageKey, {
      aliases: responseAliases(row, languageKey),
      clue,
      explanation: normalizeAuthorityText(row.explanation[languageKey]),
      clueResponseIdentity: [clue, response].join('\0'),
    }];
  })) as Readonly<Record<Language, PreparedLanguage>>;
  const prepared: PreparedAuthorityRow = {
    row,
    owner: `${row.authority}:${row.id}`,
    factKey: normalizeAuthorityText(row.factKey),
    ...(row.subjectKey === undefined
      ? {}
      : { subjectKey: normalizeAuthorityText(row.subjectKey) }),
    ...(row.categoryTitle === undefined
      ? {}
      : {
          categoryTitle: Object.fromEntries(LANGUAGES.map((languageKey) => [
            languageKey,
            normalizeAuthorityText(row.categoryTitle![languageKey]),
          ])) as Readonly<Record<Language, string>>,
        }),
    sourceUrl: normalizedSourceUrl(row.source.url),
    sourceTitle: normalizeAuthorityText(row.source.title),
    responseIdentity: LANGUAGES
      .map((languageKey) => canonicalResponse(row.response[languageKey], languageKey))
      .join('\0'),
    language,
  };
  PREPARED_AUTHORITY_ROWS.set(row, prepared);
  return prepared;
}

function prepareAuthorityCorpus(corpus: readonly AuthorityRow[]): readonly PreparedAuthorityRow[] {
  return corpus.map(prepareAuthorityRow);
}

function findPreparedOneWayAliasLeaks(
  candidate: PreparedAuthorityRow,
  corpus: readonly PreparedAuthorityRow[],
): readonly string[] {
  return corpus.filter(({ row }) => row.id !== candidate.row.id).flatMap((other) =>
    LANGUAGES.flatMap((language) => {
      const aliases = candidate.language[language].aliases;
      const leaks: string[] = [];
      if ([...aliases].some((alias) =>
        containsPreparedPhrase(other.language[language].clue, alias))) {
        leaks.push(`response-in-clue:${language}:${other.owner}`);
      }
      if ([...aliases].some((alias) =>
        containsPreparedPhrase(other.language[language].explanation, alias))) {
        leaks.push(`response-in-explanation:${language}:${other.owner}`);
      }
      return leaks;
    })).sort();
}

export function findAuthorityOneWayAliasLeaks(
  candidate: AuthorityRow,
  corpus: readonly AuthorityRow[],
): readonly string[] {
  return findPreparedOneWayAliasLeaks(
    prepareAuthorityRow(candidate),
    prepareAuthorityCorpus(corpus),
  );
}

function findPreparedBidirectionalAliasLeaks(
  candidate: PreparedAuthorityRow,
  corpus: readonly PreparedAuthorityRow[],
): readonly string[] {
  return corpus.filter(({ row }) => row.id !== candidate.row.id).flatMap((other) =>
    LANGUAGES.flatMap((language) => {
      const candidateAliases = candidate.language[language].aliases;
      const otherAliases = other.language[language].aliases;
      const leaks: string[] = [];
      if ([...candidateAliases].some((alias) =>
        containsPreparedPhrase(other.language[language].clue, alias))) {
        leaks.push(`candidate-response-in-other-clue:${language}:${other.owner}`);
      }
      if ([...candidateAliases].some((alias) =>
        containsPreparedPhrase(other.language[language].explanation, alias))) {
        leaks.push(`candidate-response-in-other-explanation:${language}:${other.owner}`);
      }
      if ([...otherAliases].some((alias) =>
        containsPreparedPhrase(candidate.language[language].clue, alias))) {
        leaks.push(`other-response-in-candidate-clue:${language}:${other.owner}`);
      }
      if ([...otherAliases].some((alias) =>
        containsPreparedPhrase(candidate.language[language].explanation, alias))) {
        leaks.push(`other-response-in-candidate-explanation:${language}:${other.owner}`);
      }
      return leaks;
    })).sort();
}

export function findAuthorityBidirectionalAliasLeaks(
  candidate: AuthorityRow,
  corpus: readonly AuthorityRow[],
): readonly string[] {
  return findPreparedBidirectionalAliasLeaks(
    prepareAuthorityRow(candidate),
    prepareAuthorityCorpus(corpus),
  );
}

function findPreparedAuthorityCollisions(
  candidate: PreparedAuthorityRow,
  corpus: readonly PreparedAuthorityRow[],
): readonly string[] {
  return corpus.filter(({ row }) => row.id !== candidate.row.id).flatMap((other) => {
    const collisions: string[] = [];
    if (candidate.factKey === other.factKey) collisions.push(`fact:${other.owner}`);
    if (candidate.subjectKey !== undefined && other.subjectKey !== undefined
      && candidate.subjectKey === other.subjectKey) {
      collisions.push(`subject:${other.owner}`);
    }
    if (candidate.row.categorySetId !== undefined && other.row.categorySetId !== undefined
      && candidate.row.categorySetId !== other.row.categorySetId
      && candidate.categoryTitle !== undefined && other.categoryTitle !== undefined) {
      for (const language of LANGUAGES) {
        if (candidate.categoryTitle[language] === other.categoryTitle[language]) {
          collisions.push(
            `category-title:${language}:${other.row.authority}:${other.row.categorySetId}`,
          );
        }
      }
    }
    if (candidate.sourceUrl === other.sourceUrl) collisions.push(`source-url:${other.owner}`);
    if (candidate.sourceTitle === other.sourceTitle) collisions.push(`source-title:${other.owner}`);
    if (candidate.responseIdentity === other.responseIdentity) {
      collisions.push(`response-identity:${other.owner}`);
    }
    for (const language of LANGUAGES) {
      const candidateLanguage = candidate.language[language];
      const otherLanguage = other.language[language];
      if ([...candidateLanguage.aliases].some((alias) => otherLanguage.aliases.has(alias))) {
        collisions.push(`response-variant:${language}:${other.owner}`);
      }
      const inverse = [...candidateLanguage.aliases].some((alias) =>
        containsPreparedPhrase(otherLanguage.clue, alias))
        && [...otherLanguage.aliases].some((alias) =>
          containsPreparedPhrase(candidateLanguage.clue, alias));
      if (inverse) collisions.push(`inverse:${language}:${other.owner}`);
      if (candidateLanguage.clueResponseIdentity === otherLanguage.clueResponseIdentity) {
        collisions.push(`clue-response:${language}:${other.owner}`);
      }
    }
    return collisions;
  }).filter((value, index, values) => values.indexOf(value) === index).sort();
}

export function findAuthorityCollisions(
  candidate: AuthorityRow,
  corpus: readonly AuthorityRow[],
): readonly string[] {
  return findPreparedAuthorityCollisions(
    prepareAuthorityRow(candidate),
    prepareAuthorityCorpus(corpus),
  );
}

type PreparedRowsByKey = Map<string, PreparedAuthorityRow[]>;

type PreparedAuthorityIndex = Readonly<{
  factKeys: PreparedRowsByKey;
  subjectKeys: PreparedRowsByKey;
  categoryTitles: Record<Language, PreparedRowsByKey>;
  sourceUrls: PreparedRowsByKey;
  sourceTitles: PreparedRowsByKey;
  responseIdentities: PreparedRowsByKey;
  responseAliases: Record<Language, PreparedRowsByKey>;
  clueResponseIdentities: Record<Language, PreparedRowsByKey>;
  aliasesInClues: Record<Language, PreparedRowsByKey>;
  aliasesInExplanations: Record<Language, PreparedRowsByKey>;
  aliasVocabulary: Record<Language, ReadonlySet<string>>;
  aliasTokenLengths: Record<Language, readonly number[]>;
}>;

function languageIndexes(): Record<Language, PreparedRowsByKey> {
  return { en: new Map(), et: new Map() };
}

function addIndexedRow(
  index: PreparedRowsByKey,
  key: string,
  row: PreparedAuthorityRow,
): void {
  const rows = index.get(key);
  if (rows === undefined) {
    index.set(key, [row]);
  } else {
    rows.push(row);
  }
}

function aliasesInText(
  normalizedText: string,
  vocabulary: ReadonlySet<string>,
  tokenLengths: readonly number[],
): ReadonlySet<string> {
  const tokens = normalizedText.split(' ').filter((token) => token !== '');
  const matches = new Set<string>();
  for (const tokenLength of tokenLengths) {
    for (let start = 0; start + tokenLength <= tokens.length; start += 1) {
      const phrase = tokens.slice(start, start + tokenLength).join(' ');
      if (vocabulary.has(phrase)) matches.add(phrase);
    }
  }
  return matches;
}

function buildPreparedAuthorityIndex(
  corpus: readonly PreparedAuthorityRow[],
  candidates: readonly PreparedAuthorityRow[],
): PreparedAuthorityIndex {
  const factKeys: PreparedRowsByKey = new Map();
  const subjectKeys: PreparedRowsByKey = new Map();
  const categoryTitles = languageIndexes();
  const sourceUrls: PreparedRowsByKey = new Map();
  const sourceTitles: PreparedRowsByKey = new Map();
  const responseIdentities: PreparedRowsByKey = new Map();
  const responseAliases = languageIndexes();
  const clueResponseIdentities = languageIndexes();
  const aliasesInClues = languageIndexes();
  const aliasesInExplanations = languageIndexes();
  const mutableAliasVocabulary: Record<Language, Set<string>> = {
    en: new Set(),
    et: new Set(),
  };

  for (const row of [...corpus, ...candidates]) {
    for (const language of LANGUAGES) {
      for (const alias of row.language[language].aliases) {
        mutableAliasVocabulary[language].add(alias);
      }
    }
  }
  const tokenLengths = (language: Language): readonly number[] =>
    [...new Set([...mutableAliasVocabulary[language]]
      .map((alias) => alias.split(' ').length))].sort((left, right) => left - right);
  const aliasTokenLengths: Record<Language, readonly number[]> = {
    en: tokenLengths('en'),
    et: tokenLengths('et'),
  };

  for (const row of corpus) {
    addIndexedRow(factKeys, row.factKey, row);
    if (row.subjectKey !== undefined) addIndexedRow(subjectKeys, row.subjectKey, row);
    addIndexedRow(sourceUrls, row.sourceUrl, row);
    addIndexedRow(sourceTitles, row.sourceTitle, row);
    addIndexedRow(responseIdentities, row.responseIdentity, row);
    for (const language of LANGUAGES) {
      if (row.row.categorySetId !== undefined && row.categoryTitle !== undefined) {
        addIndexedRow(categoryTitles[language], row.categoryTitle[language], row);
      }
      for (const alias of row.language[language].aliases) {
        addIndexedRow(responseAliases[language], alias, row);
      }
      addIndexedRow(
        clueResponseIdentities[language],
        row.language[language].clueResponseIdentity,
        row,
      );
      for (const alias of aliasesInText(
        row.language[language].clue,
        mutableAliasVocabulary[language],
        aliasTokenLengths[language],
      )) {
        addIndexedRow(aliasesInClues[language], alias, row);
      }
      for (const alias of aliasesInText(
        row.language[language].explanation,
        mutableAliasVocabulary[language],
        aliasTokenLengths[language],
      )) {
        addIndexedRow(aliasesInExplanations[language], alias, row);
      }
    }
  }

  return {
    factKeys,
    subjectKeys,
    categoryTitles,
    sourceUrls,
    sourceTitles,
    responseIdentities,
    responseAliases,
    clueResponseIdentities,
    aliasesInClues,
    aliasesInExplanations,
    aliasVocabulary: mutableAliasVocabulary,
    aliasTokenLengths,
  };
}

function addOwnerFindings(
  findings: Set<string>,
  prefix: string,
  candidate: PreparedAuthorityRow,
  rows: readonly PreparedAuthorityRow[] | undefined,
): void {
  for (const other of rows ?? []) {
    if (other.row.id !== candidate.row.id) findings.add(`${prefix}:${other.owner}`);
  }
}

function findIndexedAuthorityCollisions(
  candidate: PreparedAuthorityRow,
  index: PreparedAuthorityIndex,
): readonly string[] {
  const findings = new Set<string>();
  addOwnerFindings(findings, 'fact', candidate, index.factKeys.get(candidate.factKey));
  if (candidate.subjectKey !== undefined) {
    addOwnerFindings(
      findings,
      'subject',
      candidate,
      index.subjectKeys.get(candidate.subjectKey),
    );
  }
  if (candidate.row.categorySetId !== undefined && candidate.categoryTitle !== undefined) {
    for (const language of LANGUAGES) {
      for (const other of index.categoryTitles[language]
        .get(candidate.categoryTitle[language]) ?? []) {
        if (other.row.id !== candidate.row.id
          && other.row.categorySetId !== candidate.row.categorySetId) {
          findings.add(
            `category-title:${language}:${other.row.authority}:${other.row.categorySetId}`,
          );
        }
      }
    }
  }
  addOwnerFindings(
    findings,
    'source-url',
    candidate,
    index.sourceUrls.get(candidate.sourceUrl),
  );
  addOwnerFindings(
    findings,
    'source-title',
    candidate,
    index.sourceTitles.get(candidate.sourceTitle),
  );
  addOwnerFindings(
    findings,
    'response-identity',
    candidate,
    index.responseIdentities.get(candidate.responseIdentity),
  );
  for (const language of LANGUAGES) {
    const candidateLanguage = candidate.language[language];
    for (const alias of candidateLanguage.aliases) {
      addOwnerFindings(
        findings,
        `response-variant:${language}`,
        candidate,
        index.responseAliases[language].get(alias),
      );
    }
    addOwnerFindings(
      findings,
      `clue-response:${language}`,
      candidate,
      index.clueResponseIdentities[language].get(candidateLanguage.clueResponseIdentity),
    );

    const candidateAnswerInOtherClue = new Set<PreparedAuthorityRow>();
    for (const alias of candidateLanguage.aliases) {
      for (const other of index.aliasesInClues[language].get(alias) ?? []) {
        if (other.row.id !== candidate.row.id) {
          candidateAnswerInOtherClue.add(other);
        }
      }
    }
    const otherAnswerInCandidateClue = new Set<PreparedAuthorityRow>();
    for (const alias of aliasesInText(
      candidateLanguage.clue,
      index.aliasVocabulary[language],
      index.aliasTokenLengths[language],
    )) {
      for (const other of index.responseAliases[language].get(alias) ?? []) {
        if (other.row.id !== candidate.row.id) otherAnswerInCandidateClue.add(other);
      }
    }
    for (const other of candidateAnswerInOtherClue) {
      if (otherAnswerInCandidateClue.has(other)) {
        findings.add(`inverse:${language}:${other.owner}`);
      }
    }
  }
  return [...findings].sort();
}

function findIndexedOneWayAliasLeaks(
  candidate: PreparedAuthorityRow,
  index: PreparedAuthorityIndex,
): readonly string[] {
  const findings = new Set<string>();
  for (const language of LANGUAGES) {
    const candidateLanguage = candidate.language[language];
    for (const alias of candidateLanguage.aliases) {
      addOwnerFindings(
        findings,
        `candidate-response-in-other-clue:${language}`,
        candidate,
        index.aliasesInClues[language].get(alias),
      );
      addOwnerFindings(
        findings,
        `candidate-response-in-other-explanation:${language}`,
        candidate,
        index.aliasesInExplanations[language].get(alias),
      );
    }
  }
  return [...findings].sort();
}

export function findCumulativeAuthorityDefects(
  candidates: readonly AuthorityRow[],
  corpus: readonly AuthorityRow[],
): readonly string[] {
  if (candidates.length === 0) return [];
  const preparedCorpus = prepareAuthorityCorpus(corpus);
  const preparedCandidates = prepareAuthorityCorpus(candidates);
  const index = buildPreparedAuthorityIndex(preparedCorpus, preparedCandidates);
  return preparedCandidates.flatMap((candidate) => {
    const owner = candidate.owner;
    return [
      ...findIndexedAuthorityCollisions(candidate, index)
        .map((diagnostic) => `collision:${owner}:${diagnostic}`),
      ...findIndexedOneWayAliasLeaks(candidate, index)
        .map((diagnostic) => `alias:${owner}:${diagnostic}`),
    ];
  }).sort();
}
