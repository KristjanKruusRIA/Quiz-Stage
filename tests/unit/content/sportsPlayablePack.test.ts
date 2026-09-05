import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { GEOGRAPHY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/geography';
import { HISTORY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/history';
import { LITERATURE_LANGUAGE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/literatureLanguage';
import { SCIENCE_NATURE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/scienceNature';
import { PACKS_05_TO_08_CATEGORIES } from '../../../scripts/content/playability/banks/packs05to08';
import { PACKS_09_TO_12_CATEGORIES } from '../../../scripts/content/playability/banks/packs09to12';
import { parsePackCsv } from '../../../src/main/content/csvPacks';

const SPORTS_PACK_ID = 'built-in-sports-games';
const SPORTS_CATEGORIES = PACKS_05_TO_08_CATEGORIES.filter(
  ({ packId }) => packId === SPORTS_PACK_ID,
);
const EASY_SPORTS_CATEGORIES = buildAccessibleCorpus().filter(
  ({ batchId }) => batchId === '08-sports-games',
);
const LANGUAGES = ['en', 'et'] as const;

type Language = (typeof LANGUAGES)[number];
type Authority = 'easy' | 'medium-hard' | 'adult' | 'estonia';
type AuthorityRow = Readonly<{
  id: string;
  authority: Authority;
  factKey: string;
  subjectKey: string;
  clue: Readonly<Record<Language, string>>;
  response: Readonly<Record<Language, string>>;
  acceptedVariants: Readonly<Record<Language, readonly string[]>>;
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
    source: Readonly<{ title: string; url: string }>;
  }>[];
}>;

function normalized(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function canonicalResponse(value: string, language: Language): string {
  const identity = normalized(value);
  return language === 'en' ? identity.replace(/^(?:a|an|the)\s+/u, '') : identity;
}

function containsNormalizedPhrase(value: string, phrase: string): boolean {
  return phrase.length >= 3 && ` ${normalized(value)} `.includes(` ${phrase} `);
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
      source: { title: row.source_title, url: row.source_url },
    };
  });
}

function completeAuthorityCorpus(): readonly AuthorityRow[] {
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

function replacementCollisions(
  candidate: AuthorityRow,
  corpus: readonly AuthorityRow[],
): readonly string[] {
  return corpus.filter(({ id }) => id !== candidate.id).flatMap((other) => {
    const owner = `${other.authority}:${other.id}`;
    const collisions: string[] = [];
    if (normalized(candidate.factKey) === normalized(other.factKey)) {
      collisions.push(`fact:${owner}`);
    }
    if (normalized(candidate.subjectKey) === normalized(other.subjectKey)) {
      collisions.push(`subject:${owner}`);
    }
    if (normalizedSourceUrl(candidate.source.url) === normalizedSourceUrl(other.source.url)) {
      collisions.push(`source-url:${owner}`);
    }
    if (normalized(candidate.source.title) === normalized(other.source.title)) {
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
        normalized(candidate.clue[language]),
        canonicalResponse(candidate.response[language], language),
      ].join('\0');
      const otherIdentity = [
        normalized(other.clue[language]),
        canonicalResponse(other.response[language], language),
      ].join('\0');
      if (candidateIdentity === otherIdentity) collisions.push(`clue-response:${language}:${owner}`);
    }
    return collisions;
  }).sort();
}

function category(setNumber: string) {
  const found = SPORTS_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Sports & Games set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions[tier - 1];
  if (found === undefined) throw new Error(`Missing Sports & Games question ${setNumber}:${tier}`);
  return found;
}

function easyQuestion(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = EASY_SPORTS_CATEGORIES
    .find(({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`))
    ?.questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) throw new Error(`Missing Easy Sports & Games question ${setNumber}:${tier}`);
  return found;
}

describe('Sports & Games playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const categories = SPORTS_CATEGORIES;
    const questions = categories.flatMap(({ questions }) => questions);
    const rows = categories.flatMap((category) => category.questions.map((question) => ({
      clue_id: question.key,
      category_set_id: category.categorySetId,
      category_name_en: category.name.en,
      category_name_et: category.name.et,
      clue_en: question.clue.en,
      clue_et: question.clue.et,
      response_en: question.response.en,
      response_et: question.response.et,
      accepted_variants_en: question.acceptedVariants.en.join(';'),
      accepted_variants_et: question.acceptedVariants.et.join(';'),
      subject_key: question.subjectKey,
      source_title: question.source.title,
    })));

    expect(categories).toHaveLength(67);
    expect(questions).toHaveLength(335);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('detects punctuation-only PSG collisions without folding distinct diacritics', () => {
    const psgQuestion = question('070', 2);
    const psg: AuthorityRow = {
      id: psgQuestion.key,
      authority: 'medium-hard',
      factKey: psgQuestion.factKey,
      subjectKey: psgQuestion.subjectKey,
      clue: psgQuestion.clue,
      response: psgQuestion.response,
      acceptedVariants: psgQuestion.acceptedVariants,
      source: psgQuestion.source,
    };
    const punctuationOnly: AuthorityRow = {
      ...psg,
      id: 'fixture:paris-saint-germain-spaced',
      authority: 'adult',
      factKey: 'fixture:paris-saint-germain-spaced',
      subjectKey: 'fixture:paris-saint-germain-spaced',
      response: { en: 'Paris Saint Germain', et: 'Paris Saint Germain' },
      acceptedVariants: { en: [], et: [] },
    };
    const collisions = replacementCollisions(psg, [psg, punctuationOnly]);

    expect(collisions).toEqual(expect.arrayContaining([
      'response-identity:adult:fixture:paris-saint-germain-spaced',
      'response-variant:en:adult:fixture:paris-saint-germain-spaced',
      'response-variant:et:adult:fixture:paris-saint-germain-spaced',
      'clue-response:en:adult:fixture:paris-saint-germain-spaced',
      'clue-response:et:adult:fixture:paris-saint-germain-spaced',
    ]));
    expect(normalized('Seleção')).not.toBe(normalized('Selecao'));
  });

  it('keeps the three replacements collision-free across every enabled authority row', () => {
    const corpus = completeAuthorityCorpus();
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));
    const replacementIds = [
      'built-in-sports-games-set-068:tier-1',
      'built-in-sports-games-set-070:tier-2',
      'built-in-sports-games-set-089:tier-1',
    ];
    const replacements = replacementIds.map((id) => {
      const row = corpus.find((candidate) => candidate.id === id);
      if (row === undefined) throw new Error(`Missing protected replacement ${id}`);
      return row;
    });

    expect(counts).toEqual({ easy: 2_000, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(7_000);
    expect(replacements.map(({ response }) => response.en)).toEqual([
      'Seleção',
      'Paris Saint-Germain',
      '147',
    ]);
    expect(replacements.flatMap((candidate) =>
      replacementCollisions(candidate, corpus).map((collision) =>
        `${candidate.id}:${collision}`))).toEqual([]);
  });

  it('replaces three Easy collisions without changing their frozen anchors or M/H slots', () => {
    expect(easyQuestion('011', 2)).toMatchObject({
      key: 'built-in-sports-games-set-011:france-les-bleus-won-2018',
      tier: 2,
      subjectKey: 'place:france',
      clue: {
        en: 'Les Bleus beat Croatia in the 2018 final to give which country its second men’s title?',
        et: 'Les Bleus alistas 2018. aasta finaalis Horvaatia. Milline riik sai nii oma teise meeste tiitli?',
      },
      response: { en: 'France', et: 'Prantsusmaa' },
      source: { url: 'https://en.wikipedia.org/wiki/2018_FIFA_World_Cup_final' },
    });
    expect(easyQuestion('010', 3)).toMatchObject({
      key: 'built-in-sports-games-set-010:old-trafford-home-of-manchester-united',
      tier: 3,
      subjectKey: 'place:old-trafford',
      clue: {
        en: 'Which ground known as the Theatre of Dreams is home to Manchester United?',
        et: 'Milline Unistuste teatrina tuntud väljak on Manchester Unitedi kodu?',
      },
      response: { en: 'Old Trafford', et: 'Old Trafford' },
      source: { url: 'https://en.wikipedia.org/wiki/Old_Trafford' },
    });
    expect(easyQuestion('004', 5)).toMatchObject({
      key: 'retained-easy-05-08:champion-comaneci-perfect-ten',
      tier: 5,
      subjectKey: 'retained-easy-05-08:person-nadia-comaneci-perfect-ten',
      clue: {
        en: 'Which Romanian gymnast received the first perfect score in Olympic gymnastics?',
        et: 'Milline Rumeenia võimleja sai olümpiavõimlemise ajaloo esimese täiusliku hinde?',
      },
      response: { en: 'Nadia Comăneci', et: 'Nadia Comăneci' },
      source: { url: 'https://en.wikipedia.org/wiki/Nadia_Com%C4%83neci' },
    });

    expect(question('068', 1)).toEqual({
      key: 'built-in-sports-games-set-068:tier-1',
      factKey: 'nickname:selecao-brazil-football:national-team-nickname',
      tier: 1,
      subjectKey: 'nickname:selecao-brazil-football',
      clue: {
        en: 'Which Portuguese nickname, meaning “the national squad”, identifies the yellow-shirted men’s team that won the FIFA World Cup in 1958, 1962, 1970, 1994 and 2002?',
        et: 'Milline portugalikeelne hüüdnimi tähendusega „rahvuskoondis“ tähistab kollastes särkides meeste koondist, kes võitis jalgpalli MM-i aastatel 1958, 1962, 1970, 1994 ja 2002?',
      },
      response: { en: 'Seleção', et: 'Seleção' },
      acceptedVariants: {
        en: ['A Seleção', 'Selecao', 'A Selecao'],
        et: ['A Seleção', 'Selecao', 'A Selecao'],
      },
      explanation: {
        en: 'Seleção, meaning “the national squad”, is a nickname for Brazil’s men’s team, which won those five World Cups.',
        et: 'Seleção ehk „rahvuskoondis“ on Brasiilia meeste koondise hüüdnimi; see koondis võitis nimetatud viis MM-i.',
      },
      source: {
        sourceId: 'wikipedia:brazil-national-football-team',
        title: 'Brazil national football team — Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Brazil_national_football_team',
        license: 'CC BY-SA 4.0',
        retrievedAt: '2026-08-28',
      },
    });

    expect(question('070', 2)).toEqual({
      key: 'built-in-sports-games-set-070:tier-2',
      factKey: 'club:paris-saint-germain-parc-des-princes:football-club-calling-card',
      tier: 2,
      subjectKey: 'club:paris-saint-germain-parc-des-princes',
      clue: {
        en: 'Which French football club calls the Parc des Princes its home ground?',
        et: 'Milline Prantsuse jalgpalliklubi peab Parc des Princes’i oma kodustaadioniks?',
      },
      response: { en: 'Paris Saint-Germain', et: 'Paris Saint-Germain' },
      acceptedVariants: { en: ['PSG', 'Paris SG'], et: ['PSG', 'Paris SG'] },
      explanation: {
        en: 'The Parc des Princes is Paris Saint-Germain’s home stadium in the French capital.',
        et: 'Parc des Princes on Prantsusmaa pealinnas asuva Paris Saint-Germaini kodustaadion.',
      },
      source: {
        sourceId: 'psg:parc-des-princes',
        title: 'Parc des Princes, the stadium of Paris Saint-Germain — Paris Saint-Germain',
        url: 'https://www.psg.fr/en/the-club/facilities/parc-des-princes',
        license: 'All rights reserved',
        retrievedAt: '2026-08-28',
      },
    });

    expect(question('089', 1)).toEqual({
      key: 'built-in-sports-games-set-089:tier-1',
      factKey: 'feat:snooker-perfect-break-147:iconic-sporting-feat',
      tier: 1,
      subjectKey: 'feat:snooker-perfect-break-147',
      clue: {
        en: 'In snooker, what number names the perfect break made by potting all 15 reds with blacks and then clearing the colours in order?',
        et: 'Milline arv tähistab snuukri täiuslikku seeriat, kus iga punase järel lüüakse sisse must pall ning pärast 15 punast lüüakse õiges järjekorras sisse kõik värvilised pallid?',
      },
      response: { en: '147', et: '147' },
      acceptedVariants: {
        en: ['147 points', 'a 147', 'a 147 break', 'a 147-point break'],
        et: ['147 punkti', '147-punktiline seeria', 'maksimaalne 147-punktiline seeria'],
      },
      explanation: {
        en: 'A 147 is snooker’s standard perfect break: 15 red-black pairs score 120, and the final six colours add 27.',
        et: '147 on snuukri tavaline täiuslik seeria: 15 punase-musta paari annavad 120 punkti ja kuus lõpus löödavat värvilist palli veel 27.',
      },
      source: {
        sourceId: 'wst:147-perfect-break',
        title: '147s: The perfect break — World Snooker Tour',
        url: 'https://www.wst.tv/147s/',
        license: 'All rights reserved',
        retrievedAt: '2026-08-28',
      },
    });
  });
});
