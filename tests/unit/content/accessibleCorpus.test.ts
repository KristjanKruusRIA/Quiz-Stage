import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { afterEach, describe, expect, it } from 'vitest';
import {
  REVIEWED_DATE_OR_NUMBER_PROMPT_OWNERS,
  REVIEWED_NUMERIC_RESPONSE_OWNERS,
} from './reviewedAccessibleCorpusFlags';
import {
  REVIEWED_DISTINCT_EASY_PRIMARY_ALIAS_GROUPS,
  REVIEWED_DISTINCT_EASY_RESPONSE_GROUPS,
  REVIEWED_DISTINCT_EASY_SOURCE_OWNER_GROUPS,
  REVIEWED_DISTINCT_EASY_VARIANT_ALIAS_GROUPS,
} from './reviewedRepeatedEasyFacts';
import { applyAccessibleCorpus } from '../../../scripts/content/accessibility/apply';
import { createHash } from 'node:crypto';
import {
  buildAccessibleCorpus,
  validateAccessibleCorpus,
} from '../../../scripts/content/accessibility/bank';
import { ART_MYTHOLOGY_CATEGORIES } from '../../../scripts/content/accessibility/banks/artMythology';
import { GEOGRAPHY_SCIENCE_FOOD_CATEGORIES } from '../../../scripts/content/accessibility/banks/geographyScienceFood';
import { HISTORY_LITERATURE_SCREEN_CATEGORIES } from '../../../scripts/content/accessibility/banks/historyLiteratureScreen';
import { SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES } from '../../../scripts/content/accessibility/banks/societyTechnologyCulture';
import { ACCESSIBLE_CATEGORY_TITLES } from '../../../scripts/content/accessibility/categoryNames';
import {
  ACCESSIBLE_EASY_SET_IDS,
  LEGACY_EASY_TARGET_IDS,
  LEGACY_EASY_TARGETS,
} from '../../../scripts/content/accessibility/targets';
import type {
  AccessibleCategory,
  AccessibleQuestion,
  CategoryTitle,
} from '../../../scripts/content/accessibility/types';
import type { LegacyEasyTarget } from '../../../scripts/content/accessibility/targets';
import type { ContentEvidence } from '../../../scripts/content/evidence';
import {
  loadAccessibleCorpus,
  parseAccessibleCorpusArgs,
  publishAccessibleCorpusStage,
  stageAccessibleCorpus,
} from '../../../scripts/content/applyAccessibleCorpus';
import { CSV_COLUMNS } from '../../../src/shared/content/csvColumns';

const ACCEPTED_BATCHES = [
  '01-history',
  '02-geography',
  '03-science-nature',
  '04-literature-language',
  '05-art-architecture',
  '06-music',
  '07-film-television',
  '08-sports-games',
  '09-food-drink',
  '10-technology-inventions',
  '11-politics-economics-society',
  '12-mythology-religion-philosophy',
] as const;

const EXPECTED_TARGETS_BY_BATCH = [26, 26, 26, 26, 33, 25, 25, 25, 25, 25, 25, 33] as const;

type AcceptedRow = Readonly<{
  clue_id: string;
  category_set_id: string;
  content_kind: string;
  difficulty: string;
  response_en: string;
  response_et: string;
}>;

function acceptedEasySets(): Map<string, Readonly<{
  batchId: string;
  clueIds: readonly string[];
  responses: readonly Readonly<{ en: string; et: string }>[];
}>> {
  const sets = new Map<string, {
    batchId: string;
    clueIds: string[];
    responses: Array<{ en: string; et: string }>;
  }>();
  for (const batchId of ACCEPTED_BATCHES) {
    const path = resolve('content', 'generated', `${batchId}.en-et.csv`);
    const rows = parse(readFileSync(path, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
    }) as AcceptedRow[];
    for (const row of rows) {
      if (row.content_kind !== 'board' || row.difficulty !== 'easy') continue;
      const existing = sets.get(row.category_set_id) ?? { batchId, clueIds: [], responses: [] };
      existing.clueIds.push(row.clue_id);
      existing.responses.push({ en: row.response_en, et: row.response_et });
      sets.set(row.category_set_id, existing);
    }
  }
  return sets;
}

type ProposedEasyCorpus = Readonly<{
  rows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
}>;

function acceptedRows(path: string): readonly Record<string, string>[] {
  return parse(readFileSync(path, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
  }) as Array<Record<string, string>>;
}

function acceptedEvidence(path: string): readonly ContentEvidence[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/u)
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as ContentEvidence);
}

function proposedEasyCorpus(): ProposedEasyCorpus {
  const categories = buildAccessibleCorpus();
  const rows: Record<string, string>[] = [];
  const evidence: ContentEvidence[] = [];

  for (const batchId of ACCEPTED_BATCHES) {
    const targetCategorySetIds = new Set(
      LEGACY_EASY_TARGETS
        .filter((target) => target.batchId === batchId)
        .map(({ categorySetId }) => categorySetId),
    );
    const result = applyAccessibleCorpus({
      authoredRows: acceptedRows(resolve('content', 'authored', `${batchId}.csv`)),
      generatedRows: acceptedRows(resolve('content', 'generated', `${batchId}.en-et.csv`)),
      evidence: acceptedEvidence(resolve('content', 'evidence', `${batchId}.jsonl`)),
      targetCategorySetIds,
      titles: ACCESSIBLE_CATEGORY_TITLES.filter((title) => title.batchId === batchId),
      categories: categories.filter((category) => category.batchId === batchId),
    });
    const easyRows = result.generatedRows.filter((row) =>
      row.content_kind === 'board' && row.difficulty === 'easy');
    const easyClueIds = new Set(easyRows.map((row) => row.clue_id));
    rows.push(...easyRows);
    evidence.push(...result.evidence.filter((record) => easyClueIds.has(record.clueId)));
  }

  return { rows, evidence };
}

function acceptedInspirationDuplicates(): readonly Readonly<{
  batchId: string;
  candidateId: string;
  clueIds: readonly string[];
}>[] {
  return ACCEPTED_BATCHES.flatMap((batchId) => {
    const clueIdsByCandidate = new Map<string, string[]>();
    for (const record of acceptedEvidence(resolve('content', 'evidence', `${batchId}.jsonl`))) {
      if (record.inspiration === null) continue;
      const clueIds = clueIdsByCandidate.get(record.inspiration.candidateId) ?? [];
      clueIds.push(record.clueId);
      clueIdsByCandidate.set(record.inspiration.candidateId, clueIds);
    }
    return [...clueIdsByCandidate]
      .filter(([, clueIds]) => clueIds.length > 1)
      .map(([candidateId, clueIds]) => ({ batchId, candidateId, clueIds }));
  });
}

function normalized(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/\p{P}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function acceptedVariants(value: string): string[] {
  if (value === '') return [];
  const variants: string[] = [];
  let current = '';
  let escaped = false;
  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === '\\') escaped = true;
    else if (character === ';') {
      variants.push(current);
      current = '';
    } else current += character;
  }
  variants.push(current);
  return variants;
}

function containsNormalizedPhrase(value: string, phrase: string): boolean {
  return ` ${normalized(value)} `.includes(` ${normalized(phrase)} `);
}

function question(categoryKey: string, tier: 1 | 2 | 3 | 4 | 5): AccessibleQuestion {
  return {
    key: `${categoryKey}-question-${tier}`,
    tier,
    subjectKey: `${categoryKey}-subject-${tier}`,
    clue: {
      en: `Which landmark is associated with example place ${categoryKey} ${tier}?`,
      et: `Milline vaatamisväärsus on seotud näidiskohaga ${categoryKey} ${tier}?`,
    },
    response: {
      en: `Example monument ${categoryKey} ${tier}`,
      et: `Näidismonument ${categoryKey} ${tier}`,
    },
    acceptedVariants: {
      en: [`Monument ${categoryKey} ${tier}`],
      et: [`Monument ${categoryKey} ${tier}`],
    },
    explanation: {
      en: `The landmark is a well-known example from place ${categoryKey} ${tier}.`,
      et: `See vaatamisväärsus on tuntud näide kohast ${categoryKey} ${tier}.`,
    },
    source: {
      sourceId: `${categoryKey}-source-${tier}`,
      title: `Reference for ${categoryKey} ${tier}`,
      url: `https://example.com/${categoryKey}/${tier}`,
      license: 'CC-BY-SA-4.0',
      retrievedAt: '2026-08-28',
    },
  };
}

function category(categorySetId: string, batchId = '01-history'): AccessibleCategory {
  return {
    categorySetId,
    batchId,
    name: {
      en: `Landmarks of ${categorySetId}`,
      et: `${categorySetId} vaatamisväärsused`,
    },
    questions: [1, 2, 3, 4, 5].map((tier) =>
      question(categorySetId, tier as 1 | 2 | 3 | 4 | 5)),
  };
}

function withQuestion(
  source: AccessibleCategory,
  index: number,
  replacement: AccessibleQuestion,
): AccessibleCategory {
  const questions = [...source.questions];
  questions[index] = replacement;
  return { ...source, questions };
}

type ApplyFixture = Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  targetCategorySetIds: ReadonlySet<string>;
  titles: readonly CategoryTitle[];
  categories: readonly AccessibleCategory[];
}>;

function applyRow(categorySetId: string, tier: number, difficulty = 'easy'): Record<string, string> {
  return {
    clue_id: `old-${categorySetId}-${tier}`,
    pack_id: 'built-in-history',
    pack_name: 'History Pack',
    category_set_id: categorySetId,
    content_kind: 'board',
    round: tier <= 3 ? 'round-one' : 'round-two',
    tier: String(tier),
    difficulty,
    macro_topic: 'fixture-topic',
    category_name_en: `Old ${categorySetId}`,
    category_name_et: `Vana ${categorySetId}`,
    clue_en: `Old clue ${categorySetId} ${tier}`,
    clue_et: `Vana küsimus ${categorySetId} ${tier}`,
    response_en: `Old response ${categorySetId} ${tier}`,
    response_et: `Vana vastus ${categorySetId} ${tier}`,
    accepted_variants_en: 'Old alias',
    accepted_variants_et: 'Vana alias',
    explanation_en: `Old explanation ${categorySetId} ${tier}`,
    explanation_et: `Vana selgitus ${categorySetId} ${tier}`,
    source_title: 'Old source',
    source_url: 'https://example.com/old',
    source_license: 'CC-BY-SA-4.0',
    source_retrieved_at: '2026-08-01',
    translation_status: 'reviewed',
    enabled: 'true',
  };
}

function applyEvidence(
  row: Readonly<Record<string, string>>,
  candidateId?: string,
): ContentEvidence {
  return {
    version: 1,
    clueId: row.clue_id!,
    batchId: '01-history',
    factKey: `old-fact:${row.clue_id}`,
    subjectKey: `old-subject:${row.clue_id}`,
    assertion: `Old assertion for ${row.clue_id}`,
    origin: candidateId === undefined ? 'compatibleOpen' : 'openTdbInspired',
    authoring: { author: 'Original Author', authoredAt: '2026-08-01T08:00:00.000Z' },
    supportingSource: {
      sourceId: `old-source:${row.clue_id}`,
      title: 'Old source',
      url: 'https://example.com/old',
      license: 'CC-BY-SA-4.0',
      retrievedAt: '2026-08-01',
    },
    inspiration: candidateId === undefined ? null : {
      system: 'OpenTDB',
      candidateId,
      license: 'CC-BY-SA-4.0',
    },
    factualReview: {
      reviewer: 'Original Factual Reviewer',
      reviewedAt: '2026-08-01T09:00:00.000Z',
      decision: 'approved',
    },
    editorialReview: {
      reviewer: 'Original Editorial Reviewer',
      reviewedAt: '2026-08-01T10:00:00.000Z',
      decision: 'approved',
    },
    translationReview: {
      reviewer: 'Original Translation Reviewer',
      reviewedAt: '2026-08-01T11:00:00.000Z',
      decision: 'approved',
    },
  };
}

function applyFixture(): ApplyFixture {
  const baseTargetA = category('target-a');
  const firstQuestion = baseTargetA.questions[0]!;
  const targetA = {
    ...baseTargetA,
    name: { en: 'Target A Knowledge', et: 'Sihtmärgi A teadmised' },
    questions: [
      {
        ...firstQuestion,
        acceptedVariants: {
          en: ['Alias; one', 'Back\\slash'],
          et: [],
        },
      },
      ...baseTargetA.questions.slice(1),
    ],
  };
  const targetB = {
    ...category('target-b'),
    name: { en: 'Target B Knowledge', et: 'Sihtmärgi B teadmised' },
  };
  const rows = [
    applyRow('target-a', 3),
    applyRow('retained', 1),
    applyRow('target-b', 5),
    applyRow('untouched-hard', 1, 'hard'),
    applyRow('target-a', 1),
    applyRow('target-a', 2),
    applyRow('target-a', 4),
    applyRow('target-a', 5),
    applyRow('retained', 2),
    applyRow('retained', 3),
    applyRow('retained', 4),
    applyRow('retained', 5),
    applyRow('target-b', 1),
    applyRow('target-b', 2),
    applyRow('target-b', 3),
    applyRow('target-b', 4),
  ];
  const authoredRows = rows.map((row) => ({ ...row, category_name_et: '' }));
  const generatedRows = rows.map((row) => ({ ...row }));
  const evidence = rows.map((row) => applyEvidence(
    row,
    row.clue_id === 'old-target-a-2'
      ? 'candidate-a-2'
      : row.clue_id === 'old-target-b-4' ? 'candidate-b-4' : undefined,
  ));
  return {
    authoredRows,
    generatedRows,
    evidence,
    targetCategorySetIds: new Set(['target-a', 'target-b']),
    titles: [
      { categorySetId: 'target-a', batchId: '01-history', name: targetA.name },
      { categorySetId: 'target-b', batchId: '01-history', name: targetB.name },
      {
        categorySetId: 'retained',
        batchId: '01-history',
        name: { en: 'Retained Knowledge', et: 'Säilitatud teadmised' },
      },
    ],
    categories: [targetA, targetB],
  };
}

type StagingFixture = Readonly<{
  acceptedRoot: string;
  outputRoot: string;
  categories: readonly AccessibleCategory[];
  titles: readonly CategoryTitle[];
  targets: readonly LegacyEasyTarget[];
}>;

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'accessible-corpus-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeApplyRows(path: string, rows: readonly Record<string, string>[]): void {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, stringify([...rows], {
    header: true,
    columns: [...CSV_COLUMNS],
    record_delimiter: '\r\n',
  }));
}

function stagingFixture(): StagingFixture {
  const acceptedRoot = temporaryDirectory();
  const outputRoot = resolve(acceptedRoot, 'staged');
  const categories: AccessibleCategory[] = [];
  const titles: CategoryTitle[] = [];
  const targets: LegacyEasyTarget[] = [];
  for (const batchId of ACCEPTED_BATCHES) {
    const categorySetId = `target-${batchId}`;
    const accessibleCategory = category(categorySetId, batchId);
    categories.push(accessibleCategory);
    titles.push({ categorySetId, batchId, name: accessibleCategory.name });
    targets.push({ categorySetId, batchId });
    const rows = [1, 2, 3, 4, 5].map((tier) => ({
      ...applyRow(categorySetId, tier),
      pack_id: `built-in-${batchId}`,
    }));
    const authoredRows = rows.map((row) => ({ ...row, category_name_et: '' }));
    writeApplyRows(resolve(acceptedRoot, `content/authored/${batchId}.csv`), authoredRows);
    writeApplyRows(resolve(acceptedRoot, `content/generated/${batchId}.en-et.csv`), rows);
    mkdirSync(resolve(acceptedRoot, 'content/evidence'), { recursive: true });
    const evidence = rows.map((row, index) => ({
      ...applyEvidence(row, index === 0 ? `candidate-${batchId}` : undefined),
      batchId,
    }));
    writeFileSync(
      resolve(acceptedRoot, `content/evidence/${batchId}.jsonl`),
      evidence.map((record) => `${JSON.stringify(record)}\n`).join(''),
    );
  }
  writeFileSync(resolve(acceptedRoot, 'content/unrelated.txt'), 'leave me alone');
  return { acceptedRoot, outputRoot, categories, titles, targets };
}

function acceptedArtifactPaths(): string[] {
  return ACCEPTED_BATCHES.flatMap((batchId) => [
    `content/authored/${batchId}.csv`,
    `content/generated/${batchId}.en-et.csv`,
    `content/evidence/${batchId}.jsonl`,
  ]);
}

function acceptedArtifactBytes(root: string): Map<string, string> {
  return new Map(acceptedArtifactPaths().map((path) => [
    path,
    readFileSync(resolve(root, path), 'utf8'),
  ]));
}

describe('accessible corpus ledgers', () => {
  it('partitions the 400 accepted easy sets into the stable 80 retained and 320 target IDs', () => {
    const accepted = acceptedEasySets();
    const acceptedIds = [...accepted.keys()];
    const retainedIds = acceptedIds.filter((id) =>
      accepted.get(id)!.clueIds.every((clueId) => clueId.includes('-accessible-easy-')));
    const targetIds = acceptedIds.filter((id) => !retainedIds.includes(id));

    expect(acceptedIds).toHaveLength(400);
    expect(ACCESSIBLE_EASY_SET_IDS).toEqual(retainedIds);
    expect(ACCESSIBLE_EASY_SET_IDS).toHaveLength(80);
    expect(LEGACY_EASY_TARGET_IDS).toEqual(targetIds);
    expect(LEGACY_EASY_TARGET_IDS).toHaveLength(320);
    expect(new Set([...ACCESSIBLE_EASY_SET_IDS, ...LEGACY_EASY_TARGET_IDS])).toEqual(
      new Set(acceptedIds),
    );
    expect(LEGACY_EASY_TARGETS.map(({ categorySetId }) => categorySetId)).toEqual(targetIds);
    expect(ACCEPTED_BATCHES.map((batchId) =>
      LEGACY_EASY_TARGETS.filter((target) => target.batchId === batchId).length)).toEqual(
      EXPECTED_TARGETS_BY_BATCH,
    );
  });

  it('gives every accepted easy set one concrete, unique bilingual title in its accepted batch', () => {
    const accepted = acceptedEasySets();
    const titleIds = ACCESSIBLE_CATEGORY_TITLES.map(({ categorySetId }) => categorySetId);
    const normalizedEnglish = ACCESSIBLE_CATEGORY_TITLES.map(({ name }) => normalized(name.en));
    const normalizedEstonian = ACCESSIBLE_CATEGORY_TITLES.map(({ name }) => normalized(name.et));
    const genericTitle = /\b(?:mix|medley|sampler|grab bag|odds ends|potpourri|roundup|tour|quiz|challenge)\b/u;

    expect(ACCESSIBLE_CATEGORY_TITLES).toHaveLength(400);
    expect(new Set(titleIds)).toEqual(new Set(accepted.keys()));
    expect(new Set(normalizedEnglish).size).toBe(400);
    expect(new Set(normalizedEstonian).size).toBe(400);
    for (const title of ACCESSIBLE_CATEGORY_TITLES) {
      expect(title.batchId, title.categorySetId).toBe(accepted.get(title.categorySetId)?.batchId);
      expect(normalized(title.name.en), title.categorySetId).not.toBe('');
      expect(normalized(title.name.et), title.categorySetId).not.toBe('');
      expect(normalized(title.name.en), title.categorySetId).not.toMatch(genericTitle);
      expect(normalized(title.name.et), title.categorySetId).not.toMatch(genericTitle);
    }
  });

  it('never distinguishes title themes with Roman-numeral or numeric suffixes', () => {
    const numericVariant = /(?:\b[IVXLCDM]+|\d+)$/u;
    const variants = ACCESSIBLE_CATEGORY_TITLES.filter(({ name }) =>
      numericVariant.test(name.en.trim()) || numericVariant.test(name.et.trim()));

    expect(variants).toEqual([]);
  });

  it('uses truthful umbrellas for retained five-clue sets', () => {
    const titleById = new Map(ACCESSIBLE_CATEGORY_TITLES.map((title) => [title.categorySetId, title]));
    const retainedTitleIds = ACCESSIBLE_CATEGORY_TITLES
      .filter(({ categorySetId }) => ACCESSIBLE_EASY_SET_IDS.includes(
        categorySetId as (typeof ACCESSIBLE_EASY_SET_IDS)[number],
      ))
      .map(({ categorySetId }) => categorySetId);

    expect(retainedTitleIds).toHaveLength(80);
    expect(titleById.get('built-in-history-set-019')?.name).toEqual({
      en: 'History: Places That Witnessed History',
      et: 'Ajalugu: Ajaloo tunnistajaks olnud paigad',
    });
    expect(titleById.get('built-in-literature-language-set-003')?.name).toEqual({
      en: 'Literature & Language: Classic Books and Their Connections',
      et: 'Kirjandus ja keel: Klassikalised raamatud ja nende seosed',
    });
    expect(titleById.get('built-in-geography-set-013')?.name).toEqual({
      en: 'Geography: Seas, Oceans, and Great Rivers',
      et: 'Geograafia: Mered, ookeanid ja suured jõed',
    });
    expect(titleById.get('built-in-science-nature-set-010')?.name).toEqual({
      en: 'Science & Nature: Remarkable Animals from Ocean to Ice',
      et: 'Teadus ja loodus: Tähelepanuväärsed loomad ookeanist jääväljadeni',
    });
    expect(titleById.get('built-in-sports-games-set-008')?.name).toEqual({
      en: 'Sports & Games: Games from Cards to Consoles',
      et: 'Sport ja mängud: Mängud kaartidest konsoolideni',
    });
    expect(titleById.get('built-in-history-set-013')?.name).toEqual({
      en: 'History: Reformers, Monarchs, and Wartime Leaders',
      et: 'Ajalugu: Uuendajad, monarhid ja sõjaaegsed juhid',
    });
    expect(titleById.get('built-in-sports-games-set-003')?.name).toEqual({
      en: 'Sports & Games: Global Sports Stars Across Stadiums, Courts, and Tracks',
      et: 'Sport ja mängud: Maailma sporditähed staadionidel, väljakutel ja radadel',
    });
    expect(titleById.get('built-in-technology-inventions-set-001')?.name).toEqual({
      en: 'Technology & Inventions: Companies Behind Phones, Software, Games, and E-Readers',
      et: 'Tehnoloogia ja leiutised: Telefonide, tarkvara, mängude ja e-lugerite ettevõtted',
    });
    expect(titleById.get('built-in-technology-inventions-set-002')?.name).toEqual({
      en: 'Technology & Inventions: Makers Behind Mobiles, Consoles, and Mini Computers',
      et: 'Tehnoloogia ja leiutised: Mobiilide, konsoolide ja miniarvutite loojad',
    });
  });

  it('keeps every retained bilingual response out of its category title', () => {
    const accepted = acceptedEasySets();
    const retainedIds = new Set<string>(ACCESSIBLE_EASY_SET_IDS);

    for (const title of ACCESSIBLE_CATEGORY_TITLES) {
      if (!retainedIds.has(title.categorySetId)) continue;
      for (const response of accepted.get(title.categorySetId)!.responses) {
        expect(
          containsNormalizedPhrase(title.name.en, response.en),
          `${title.categorySetId} English: ${response.en}`,
        ).toBe(false);
        expect(
          containsNormalizedPhrase(title.name.et, response.et),
          `${title.categorySetId} Estonian: ${response.et}`,
        ).toBe(false);
      }
    }
  });
});

describe('buildAccessibleCorpus', () => {
  it('assembles every replacement category in target-ledger order', () => {
    const categories = buildAccessibleCorpus();

    expect(categories).toHaveLength(320);
    expect(categories.flatMap(({ questions }) => questions)).toHaveLength(1_600);
    expect(categories.map(({ categorySetId }) => categorySetId)).toEqual(
      LEGACY_EASY_TARGET_IDS,
    );
  });

  it('meets every lane and accepted-batch allocation', () => {
    const lanes = [
      ART_MYTHOLOGY_CATEGORIES,
      SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES,
      GEOGRAPHY_SCIENCE_FOOD_CATEGORIES,
      HISTORY_LITERATURE_SCREEN_CATEGORIES,
    ] as const;
    const categories = buildAccessibleCorpus();

    expect(lanes.map((lane) => lane.length)).toEqual([66, 100, 77, 77]);
    expect(lanes.map((lane) => lane.flatMap(({ questions }) => questions).length)).toEqual(
      [330, 500, 385, 385],
    );
    expect(ACCEPTED_BATCHES.map((batchId) =>
      categories.filter((category) => category.batchId === batchId).length)).toEqual(
      EXPECTED_TARGETS_BY_BATCH,
    );
  });

  it('keeps direct lane imports validated against their exact target slices', () => {
    for (const lane of [
      ART_MYTHOLOGY_CATEGORIES,
      SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES,
      GEOGRAPHY_SCIENCE_FOOD_CATEGORIES,
      HISTORY_LITERATURE_SCREEN_CATEGORIES,
    ]) {
      const laneIds = new Set(lane.map(({ categorySetId }) => categorySetId));
      const targets = LEGACY_EASY_TARGETS.filter(({ categorySetId }) =>
        laneIds.has(categorySetId));
      expect(validateAccessibleCorpus(lane, targets)).toEqual(lane);
    }
  });

  it('has globally unique authored identities and consistent subject keys', () => {
    const questions = buildAccessibleCorpus().flatMap(({ questions }) => questions);
    const questionKeys = questions.map(({ key }) => key);
    const clueAnswerPairs = questions.map(({ clue, response }) =>
      `${normalized(clue.en)}\0${normalized(response.en)}\0${normalized(clue.et)}\0${normalized(response.et)}`);
    const responsesBySubject = new Map<string, Set<string>>();
    const subjectsByResponse = new Map<string, Set<string>>();

    for (const question of questions) {
      const responseIdentity = `${normalized(question.response.en)}\0${normalized(question.response.et)}`;
      const factIdentity = [
        normalized(question.response.en),
        normalized(question.response.et),
        normalized(question.source.url),
      ].join('\0');
      const responses = responsesBySubject.get(question.subjectKey) ?? new Set<string>();
      responses.add(responseIdentity);
      responsesBySubject.set(question.subjectKey, responses);
      const subjects = subjectsByResponse.get(factIdentity) ?? new Set<string>();
      subjects.add(question.subjectKey);
      subjectsByResponse.set(factIdentity, subjects);
    }

    expect(new Set(questionKeys).size).toBe(1_600);
    expect(new Set(clueAnswerPairs).size).toBe(1_600);
    const conflictingIdentities = [...subjectsByResponse]
      .filter(([, subjects]) => subjects.size > 1);
    const kalevipoegAmbiguity = conflictingIdentities.filter(([identity]) =>
      identity.startsWith('kalevipoeg\0kalevipoeg\0'));

    expect([...responsesBySubject].filter(([, responses]) => responses.size > 1)).toEqual([]);
    expect(kalevipoegAmbiguity).toHaveLength(1);
    expect(kalevipoegAmbiguity[0]![1]).toEqual(
      new Set(['work:kalevipoeg', 'myth:kalevipoeg']),
    );
    expect(conflictingIdentities.filter(([identity]) =>
      !identity.startsWith('kalevipoeg\0kalevipoeg\0'))).toEqual([]);
  });

  it('locks every deferred bilingual and difficulty-ladder ruling', () => {
    const categories = buildAccessibleCorpus();
    const questions = categories.flatMap(({ questions }) => questions);
    const findQuestion = (keyFragment: string): AccessibleQuestion => {
      const matches = questions.filter(({ key }) => key.includes(keyFragment));
      expect(matches, keyFragment).toHaveLength(1);
      return matches[0]!;
    };
    const responses = (categorySetId: string): readonly string[] =>
      categories.find((category) => category.categorySetId === categorySetId)!.questions
        .map((question) => question.response.en);

    expect(findQuestion('art-primary-colours-ryb-blue').clue.et).toContain(
      'põhivärvide hulka',
    );
    expect(findQuestion('art-sculpture-material-wood').clue.en).toBe(
      'What material is a sculptor carving when gouges reveal a figure inside a tree trunk?',
    );
    expect(findQuestion('religion-festival-christmas-nativity').explanation.et).toContain(
      'Jõulud tähistavad Jeesuse sündi',
    );
    expect(findQuestion('religion-text-talmud-mishnah-gemara').clue.en).toContain(
      'consists of the Mishnah together with the Gemara',
    );
    expect(findQuestion('front-crawl-fast-freestyle-stroke').acceptedVariants.et).not.toContain(
      'vabaujumine',
    );
    expect(findQuestion('steam-locomotive-powered-by-boiler').acceptedVariants.et).not.toContain(
      'aururong',
    );
    expect(findQuestion('royal-flush-ten-to-ace').clue.et).toBe(
      'Milline pokkerikäsi koosneb sama masti kümnest, soldatist, emandast, kuningast ja ässast?',
    );
    expect(findQuestion('date-line-pacific').clue.et).toContain('piiri, mille ületamisel');
    expect(findQuestion('croissant-layered-pastry').clue.et).toContain(
      'korduva tainasse voltimise',
    );
    expect(findQuestion('bat-powered-flight').clue.et).toBe(
      'Millised imetajad suudavad tiibade abil kestvalt lennata?',
    );
    expect(findQuestion('medieval-castles-portcullis').response.et).toBe('Langevõre');
    expect(findQuestion('idioms-under-the-weather').response.et).toBe('Haige');
    expect(responses('built-in-geography-set-065')).toEqual(
      ['Iceland', 'Norway', 'Finland', 'Sweden', 'Denmark'],
    );
    expect(responses('built-in-history-set-043')).toEqual(
      ['Suffragettes', 'New Zealand', 'Finland', 'Emmeline Pankhurst', 'The Nineteenth Amendment'],
    );
    expect(responses('built-in-history-set-053')).toEqual(
      ['Egyptian hieroglyphs', 'The Rosetta Stone', 'Cuneiform', 'The Phoenician alphabet', 'Linear A'],
    );
    expect(responses('built-in-science-nature-set-029')).toEqual(
      ['Hedgehog', 'Dolphin', 'Koala', 'Bats', 'Platypus'],
    );
    expect(responses('built-in-food-drink-set-025')).toEqual(
      ['Pineapple juice', 'Apple juice', 'Tomato juice', 'Cranberry juice', 'Grapefruit juice'],
    );
    expect(responses('built-in-food-drink-set-010')).toEqual(
      ['Carrot', 'Onion', 'Radish', 'Broccoli', 'Asparagus'],
    );
    expect(responses('built-in-mythology-religion-philosophy-set-009')).toEqual(
      ['amber', 'the fern flower', 'a hiis', 'Velnias', 'Jūratė'],
    );
    expect(responses('built-in-science-nature-set-030')).toEqual(
      ['Frog', 'Snake', 'Turtle', 'Salamander', 'Crocodile'],
    );
  });

  it('records deterministic authored-line review flags', () => {
    const questions = buildAccessibleCorpus().flatMap(({ questions }) => questions);
    const longResponses = questions.filter((question) =>
      Math.max(question.response.en.length, question.response.et.length) >= 40);
    const listResponses = questions.filter((question) =>
      /[,;]/u.test(question.response.en) || /[,;]/u.test(question.response.et));
    const dateOrNumberPrompts = questions.filter((question) =>
      /\b(?:1[0-9]{3}|20[0-9]{2}|\d{2,})\b/u.test(question.clue.en)
      || /\b(?:1[0-9]{3}|20[0-9]{2}|\d{2,})\b/u.test(question.clue.et));
    const numericResponses = questions.filter((question) =>
      /^\s*[\d.,-]+\s*$/u.test(question.response.en)
      || /^\s*[\d.,-]+\s*$/u.test(question.response.et));
    const identicalProse = questions.filter((question) =>
      normalized(question.clue.en) === normalized(question.clue.et));

    expect(longResponses).toEqual([]);
    expect(listResponses.map(({ key }) => key)).toEqual([
      'accessible-corpus:built-in-geography-set-015:united-states-capital-washington',
    ]);
    expect(dateOrNumberPrompts).toHaveLength(77);
    expect(numericResponses).toEqual([]);
    expect(identicalProse).toEqual([]);
  });

  it('locks the complete bilingual editorial sample population', () => {
    const authoredEdges = buildAccessibleCorpus().flatMap((category) =>
      category.questions.filter(({ tier }) => tier === 1 || tier === 5));
    const accepted = acceptedEasySets();
    const retainedEdges = [...accepted]
      .filter(([categorySetId]) => ACCESSIBLE_EASY_SET_IDS.includes(
        categorySetId as (typeof ACCESSIBLE_EASY_SET_IDS)[number],
      ))
      .flatMap(([, category]) => category.responses.filter((_, index) => index === 0 || index === 4));

    expect(ACCESSIBLE_CATEGORY_TITLES).toHaveLength(400);
    expect(authoredEdges).toHaveLength(640);
    expect(retainedEdges).toHaveLength(160);
  });
});

describe('proposed complete easy corpus', () => {
  it('starts from unique accepted OpenTDB candidate ownership', () => {
    const duplicates = acceptedInspirationDuplicates();

    expect(duplicates).toEqual([]);
    expect(() => proposedEasyCorpus()).not.toThrow();
  });

  it('applies all 400 titles and 1,600 replacements in memory without changing inventory', () => {
    const proposed = proposedEasyCorpus();
    const sets = new Map<string, Record<string, string>[]>();
    for (const row of proposed.rows) {
      const existing = sets.get(row.category_set_id) ?? [];
      existing.push(row);
      sets.set(row.category_set_id, existing);
    }
    const titleById = new Map<string, CategoryTitle>(ACCESSIBLE_CATEGORY_TITLES.map((title) => [
      title.categorySetId,
      title,
    ]));

    expect(proposed.rows).toHaveLength(2_000);
    expect(sets.size).toBe(400);
    expect(proposed.rows.filter(({ clue_id }) => clue_id.includes('-accessible-corpus-'))).toHaveLength(
      1_600,
    );
    expect(proposed.rows.filter(({ clue_id }) => clue_id.includes('-accessible-easy-'))).toHaveLength(
      400,
    );
    for (const [categorySetId, categoryRows] of sets) {
      const title = titleById.get(categorySetId)!;
      expect(categoryRows.map(({ tier }) => tier).sort()).toEqual(['1', '2', '3', '4', '5']);
      expect(new Set(categoryRows.map(({ category_name_en }) => category_name_en))).toEqual(
        new Set([title.name.en]),
      );
      expect(new Set(categoryRows.map(({ category_name_et }) => category_name_et))).toEqual(
        new Set([title.name.et]),
      );
    }
  });

  it('has no duplicate facts, clue-answer pairs, title/answer leaks, or repeated set subjects', () => {
    const proposed = proposedEasyCorpus();
    const evidenceByClueId = new Map(proposed.evidence.map((record) => [record.clueId, record]));
    const factKeys = proposed.evidence.map(({ factKey }) => factKey);
    const bilingualPairs = proposed.rows.map((row) => [
      normalized(row.clue_en), normalized(row.response_en),
      normalized(row.clue_et), normalized(row.response_et),
    ].join('\0'));
    const answerLeaks: string[] = [];
    const subjectsBySet = new Map<string, string[]>();

    for (const row of proposed.rows) {
      for (const language of ['en', 'et'] as const) {
        if (
          containsNormalizedPhrase(row[`clue_${language}`]!, row[`response_${language}`]!)
          || containsNormalizedPhrase(
            row[`category_name_${language}`]!,
            row[`response_${language}`]!,
          )
        ) {
          answerLeaks.push(`${row.clue_id}:${language}`);
        }
      }
      const subjects = subjectsBySet.get(row.category_set_id) ?? [];
      subjects.push(evidenceByClueId.get(row.clue_id!)!.subjectKey!);
      subjectsBySet.set(row.category_set_id, subjects);
    }

    expect(new Set(factKeys).size).toBe(2_000);
    expect(new Set(bilingualPairs).size).toBe(2_000);
    expect.soft(answerLeaks).toEqual([]);
    expect.soft(
      [...subjectsBySet].filter(([, subjects]) => new Set(subjects).size !== 5),
    ).toEqual([]);
  });

  it('locks every reviewed repeated response, subject owner, and distinct proposition', () => {
    const proposed = proposedEasyCorpus();
    const evidenceByClueId = new Map(proposed.evidence.map((record) => [record.clueId, record]));
    const rowsByResponse = new Map<string, Record<string, string>[]>();

    for (const row of proposed.rows) {
      const responseIdentity = [
        normalized(row.response_en).replace(/^(?:a|an|the)\s+/u, ''),
        normalized(row.response_et),
      ].join('|');
      const rows = rowsByResponse.get(responseIdentity) ?? [];
      rows.push(row);
      rowsByResponse.set(responseIdentity, rows);
    }

    const reviewedGroups = [...rowsByResponse]
      .filter(([, rows]) => rows.length > 1)
      .map(([responseIdentity, rows]) => `${responseIdentity}::${rows.map((row) => {
        const propositionHash = createHash('sha256')
          .update([
            normalized(row.clue_en),
            normalized(row.clue_et),
            normalized(row.response_en),
            normalized(row.response_et),
          ].join('\0'))
          .digest('hex')
          .slice(0, 12);
        return [
          row.clue_id,
          evidenceByClueId.get(row.clue_id)!.subjectKey,
          propositionHash,
        ].join('@');
      }).sort().join(',')}`)
      .sort();

    expect(reviewedGroups).toEqual(REVIEWED_DISTINCT_EASY_RESPONSE_GROUPS);
  });

  it('locks reviewed primary-response aliases with different bilingual labels', () => {
    const proposed = proposedEasyCorpus();
    const evidenceByClueId = new Map(proposed.evidence.map((record) => [record.clueId, record]));
    const rowsByLanguageResponse = new Map<string, Record<string, string>[]>();

    for (const row of proposed.rows) {
      for (const language of ['en', 'et'] as const) {
        const responseIdentity = [
          language,
          normalized(row[`response_${language}`]).replace(/^(?:a|an|the)\s+/u, ''),
        ].join('|');
        const rows = rowsByLanguageResponse.get(responseIdentity) ?? [];
        rows.push(row);
        rowsByLanguageResponse.set(responseIdentity, rows);
      }
    }

    const aliasGroups = [...rowsByLanguageResponse]
      .filter(([, rows]) =>
        rows.length > 1 && new Set(rows.map((row) => [
          normalized(row.response_en).replace(/^(?:a|an|the)\s+/u, ''),
          normalized(row.response_et),
        ].join('|'))).size > 1)
      .map(([responseIdentity, rows]) => `${responseIdentity}::${rows.map((row) => {
        const propositionHash = createHash('sha256')
          .update([
            normalized(row.clue_en),
            normalized(row.clue_et),
            normalized(row.response_en),
            normalized(row.response_et),
          ].join('\0'))
          .digest('hex')
          .slice(0, 12);
        return [
          row.clue_id,
          normalized(row.response_et),
          evidenceByClueId.get(row.clue_id)!.subjectKey,
          propositionHash,
        ].join('@');
      }).sort().join(',')}`)
      .sort();

    expect(aliasGroups).toEqual(REVIEWED_DISTINCT_EASY_PRIMARY_ALIAS_GROUPS);
  });

  it('locks reviewed accepted-variant aliases with different primary labels', () => {
    const proposed = proposedEasyCorpus();
    const evidenceByClueId = new Map(proposed.evidence.map((record) => [record.clueId, record]));
    const ownersByAlias = new Map<string, Record<string, string>[]>();

    for (const row of proposed.rows) {
      for (const language of ['en', 'et'] as const) {
        const aliases = [
          row[`response_${language}`],
          ...acceptedVariants(row[`accepted_variants_${language}`]),
        ].map((value) => normalized(value).replace(/^(?:a|an|the)\s+/u, ''));
        for (const alias of new Set(aliases)) {
          const identity = `${language}|${alias}`;
          const rows = ownersByAlias.get(identity) ?? [];
          rows.push(row);
          ownersByAlias.set(identity, rows);
        }
      }
    }

    const variantAliasGroups = [...ownersByAlias]
      .filter(([identity, rows]) => {
        const language = identity.slice(0, 2) as 'en' | 'et';
        return rows.length > 1 && new Set(rows.map((row) =>
          normalized(row[`response_${language}`]).replace(/^(?:a|an|the)\s+/u, ''))).size > 1;
      })
      .map(([identity, rows]) => `${identity}::${rows.map((row) => {
        const propositionHash = createHash('sha256')
          .update([
            normalized(row.clue_en),
            normalized(row.clue_et),
            normalized(row.response_en),
            normalized(row.response_et),
          ].join('\0'))
          .digest('hex')
          .slice(0, 12);
        return [
          row.clue_id,
          evidenceByClueId.get(row.clue_id)!.subjectKey,
          propositionHash,
        ].join('@');
      }).sort().join(',')}`)
      .sort();

    expect(variantAliasGroups).toEqual(REVIEWED_DISTINCT_EASY_VARIANT_ALIAS_GROUPS);
  });

  it('locks every reviewed repeated supporting-source owner and proposition', () => {
    const proposed = proposedEasyCorpus();
    const evidenceByClueId = new Map(proposed.evidence.map((record) => [record.clueId, record]));
    const rowsBySourceUrl = new Map<string, Record<string, string>[]>();

    for (const row of proposed.rows) {
      const sourceUrl = row.source_url.trim().toLocaleLowerCase('en');
      const rows = rowsBySourceUrl.get(sourceUrl) ?? [];
      rows.push(row);
      rowsBySourceUrl.set(sourceUrl, rows);
    }

    const reviewedSourceOwners = [...rowsBySourceUrl]
      .filter(([, rows]) => rows.length > 1)
      .map(([sourceUrl, rows]) => `${sourceUrl}::${rows.map((row) => {
        const propositionHash = createHash('sha256')
          .update([
            normalized(row.clue_en),
            normalized(row.clue_et),
            normalized(row.response_en),
            normalized(row.response_et),
          ].join('\0'))
          .digest('hex')
          .slice(0, 12);
        return [
          row.clue_id,
          evidenceByClueId.get(row.clue_id)!.subjectKey,
          propositionHash,
        ].join('@');
      }).sort().join(',')}`)
      .sort();

    expect(reviewedSourceOwners).toEqual(REVIEWED_DISTINCT_EASY_SOURCE_OWNER_GROUPS);
  });

  it('locks every final-corpus long, list, date, number, and identical-prose review owner', () => {
    const rows = proposedEasyCorpus().rows;
    const ids = (selected: readonly Record<string, string>[]) =>
      selected.map(({ clue_id }) => clue_id).sort();
    const reviewedOwners = (selected: readonly Record<string, string>[]) =>
      selected.map((row) => `${row.clue_id}@${createHash('sha256')
        .update([
          normalized(row.clue_en),
          normalized(row.clue_et),
          normalized(row.response_en),
          normalized(row.response_et),
        ].join('\0'))
        .digest('hex')
        .slice(0, 12)}`).sort();
    const longResponses = rows.filter((row) =>
      Math.max(row.response_en.length, row.response_et.length) >= 40);
    const listResponses = rows.filter((row) =>
      /[,;]/u.test(row.response_en) || /[,;]/u.test(row.response_et));
    const dateOrNumberPrompts = rows.filter((row) =>
      /\b(?:1[0-9]{3}|20[0-9]{2}|\d{2,})\b/u.test(row.clue_en)
      || /\b(?:1[0-9]{3}|20[0-9]{2}|\d{2,})\b/u.test(row.clue_et));
    const numericResponses = rows.filter((row) =>
      /^\s*[\d.,-]+\s*$/u.test(row.response_en)
      || /^\s*[\d.,-]+\s*$/u.test(row.response_et));
    const identicalProse = rows.filter((row) =>
      normalized(row.clue_en) === normalized(row.clue_et));

    expect(ids(longResponses)).toEqual([]);
    expect(ids(listResponses)).toEqual(['built-in-geography-accessible-corpus-061']);
    expect(reviewedOwners(dateOrNumberPrompts)).toEqual(REVIEWED_DATE_OR_NUMBER_PROMPT_OWNERS);
    expect(reviewedOwners(numericResponses)).toEqual(REVIEWED_NUMERIC_RESPONSE_OWNERS);
    expect(ids(identicalProse)).toEqual([]);
  });

  it('contains no binary prompts or banned generic titles', () => {
    const proposed = proposedEasyCorpus();
    const binary = proposed.rows.filter((row) =>
      /^(?:am|are|can|could|did|do|does|had|has|have|is|should|was|were|will|would)\b|\b(?:true\s*(?:or\s*)?false|yes\s*(?:or\s*)?no)\b/iu.test(
        normalized(row.clue_en),
      )
      || /^(?:kas|on|olid|oli|saab|võib)\b|\b(?:jah\s*(?:või\s*)?ei|tõene\s*(?:või\s*)?väär)\b/iu.test(
        normalized(row.clue_et),
      ));
    const bannedTitle = /\b(?:mix|medley|sampler|grab bag|odds ends|potpourri|roundup|tour|quiz|challenge)\b/iu;
    const banned = proposed.rows.filter((row) =>
      bannedTitle.test(normalized(row.category_name_en))
      || bannedTitle.test(normalized(row.category_name_et)));

    expect(binary.map(({ clue_id }) => clue_id)).toEqual([]);
    expect(banned.map(({ category_set_id }) => category_set_id)).toEqual([]);
  });
});

describe('validateAccessibleCorpus', () => {
  const targets = [
    { categorySetId: 'target-a', batchId: '01-history' },
    { categorySetId: 'target-b', batchId: '02-geography' },
  ] as const;

  it('returns a new array sorted by target order without mutating either input', () => {
    const first = category('target-a', '01-history');
    const second = category('target-b', '02-geography');
    const categories = [second, first] as const;

    const result = validateAccessibleCorpus(categories, targets);

    expect(result).toEqual([first, second]);
    expect(result).not.toBe(categories);
    expect(categories).toEqual([second, first]);
  });

  it('rejects a wrong expected category count', () => {
    expect(() => validateAccessibleCorpus([category('target-a')], targets)).toThrowError(
      'Expected 2 accessible categories; found 1',
    );
  });

  it('rejects a category outside the supplied target ledger', () => {
    expect(() => validateAccessibleCorpus(
      [category('target-a'), category('not-a-target', '02-geography')],
      targets,
    )).toThrowError('Category not-a-target is not present in the target ledger');
  });

  it('rejects a category whose batch does not match its target', () => {
    expect(() => validateAccessibleCorpus(
      [category('target-a', '02-geography'), category('target-b', '02-geography')],
      targets,
    )).toThrowError('Category target-a has batch 02-geography; expected 01-history');
  });

  it('rejects a missing tier', () => {
    const invalid = { ...category('target-a'), questions: category('target-a').questions.slice(0, 4) };
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Category target-a must contain tiers 1,2,3,4,5; found 1,2,3,4',
    );
  });

  it('rejects a duplicate tier', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 4, { ...original.questions[4]!, tier: 4 });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Category target-a must contain tiers 1,2,3,4,5; found 1,2,3,4,4',
    );
  });

  it('rejects a duplicate question key within one category', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 1, {
      ...original.questions[1]!,
      key: original.questions[0]!.key,
    });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Duplicate question key: target-a-question-1',
    );
  });

  it('rejects a duplicate canonical fact key across categories', () => {
    const first = category('target-a', '01-history');
    const second = category('target-b', '02-geography');
    const invalidSecond = withQuestion(second, 0, {
      ...second.questions[0]!,
      key: first.questions[0]!.key,
    });
    expect(() => validateAccessibleCorpus([first, invalidSecond], targets)).toThrowError(
      'Duplicate question key: target-a-question-1',
    );
  });

  it('rejects a duplicate normalized English clue and answer pair', () => {
    const first = category('target-a', '01-history');
    const second = category('target-b', '02-geography');
    const invalidSecond = withQuestion(second, 0, {
      ...second.questions[0]!,
      clue: { ...second.questions[0]!.clue, en: `  ${first.questions[0]!.clue.en.toUpperCase()}  ` },
      response: { ...second.questions[0]!.response, en: `${first.questions[0]!.response.en}!` },
    });
    expect(() => validateAccessibleCorpus([first, invalidSecond], targets)).toThrowError(
      'Duplicate English clue/answer pair: target-b-question-1 duplicates target-a-question-1',
    );
  });

  it('rejects a duplicate subject within one category', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 1, {
      ...original.questions[1]!,
      subjectKey: original.questions[0]!.subjectKey,
    });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Category target-a has duplicate subject key: target-a-subject-1',
    );
  });

  it('rejects a missing bilingual field', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 0, {
      ...original.questions[0]!,
      clue: { ...original.questions[0]!.clue, et: '' },
    });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Question target-a-question-1 has an empty Estonian clue',
    );
  });

  it('rejects incomplete accepted-variant arrays', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 0, {
      ...original.questions[0]!,
      acceptedVariants: { en: [], et: undefined },
    } as unknown as AccessibleQuestion);
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Question target-a-question-1 must provide English and Estonian accepted-variant arrays',
    );
  });

  it('rejects an answer leaked by a clue', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 0, {
      ...original.questions[0]!,
      clue: { ...original.questions[0]!.clue, en: `Name ${original.questions[0]!.response.en}.` },
    });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Question target-a-question-1 leaks its English response in the clue',
    );
  });

  it('rejects an answer leaked by a category title', () => {
    const original = category('target-a');
    const invalid = {
      ...original,
      name: { ...original.name, en: `About ${original.questions[0]!.response.en}` },
    };
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Question target-a-question-1 leaks its English response in the category title',
    );
  });

  it.each([
    {
      response: 'Moon',
      clue: 'Name Earth\'s familiar natural satellite.',
      title: 'Moons of the Solar System',
    },
    {
      response: 'euro',
      clue: 'Name the currency used across many European countries.',
      title: 'Currencies of Europe',
    },
  ])('does not treat $response inside a longer token as an answer leak', ({
    response,
    clue,
    title,
  }) => {
    const original = category('target-a');
    const candidate = withQuestion(
      { ...original, name: { ...original.name, en: title } },
      0,
      {
        ...original.questions[0]!,
        clue: { ...original.questions[0]!.clue, en: clue },
        response: { ...original.questions[0]!.response, en: response },
      },
    );

    expect(() => validateAccessibleCorpus([candidate], targets.slice(0, 1))).not.toThrow();
  });

  it.each([
    {
      response: 'Moon',
      clue: 'Name Earth\'s familiar natural satellite.',
      title: 'Facts about the Moon',
      location: 'category title',
    },
    {
      response: 'euro',
      clue: 'Name the euro used across many countries.',
      title: 'Currencies of Europe',
      location: 'clue',
    },
  ])('still rejects the exact $response token in the $location', ({
    response,
    clue,
    title,
    location,
  }) => {
    const original = category('target-a');
    const invalid = withQuestion(
      { ...original, name: { ...original.name, en: title } },
      0,
      {
        ...original.questions[0]!,
        clue: { ...original.questions[0]!.clue, en: clue },
        response: { ...original.questions[0]!.response, en: response },
      },
    );

    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      `Question target-a-question-1 leaks its English response in the ${location}`,
    );
  });

  it('rejects a binary prompt', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 0, {
      ...original.questions[0]!,
      clue: { ...original.questions[0]!.clue, en: 'Is this landmark in Europe?' },
    });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Question target-a-question-1 uses a binary English prompt',
    );
  });

  it.each([
    'True/False: this landmark is in Europe.',
    'Yes/No: this landmark is in Europe.',
  ])('rejects the explicit binary prompt %s', (clue) => {
    const original = category('target-a');
    const invalid = withQuestion(original, 0, {
      ...original.questions[0]!,
      clue: { ...original.questions[0]!.clue, en: clue },
    });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Question target-a-question-1 uses a binary English prompt',
    );
  });

  it('rejects an unstable source shape', () => {
    const original = category('target-a');
    const invalid = withQuestion(original, 0, {
      ...original.questions[0]!,
      source: { ...original.questions[0]!.source, url: 'http://example.com/not-secure' },
    });
    expect(() => validateAccessibleCorpus([invalid], targets.slice(0, 1))).toThrowError(
      'Question target-a-question-1 has an invalid source',
    );
  });
});

describe('applyAccessibleCorpus', () => {
  it('preserves slots while replacing target content, retitling easy sets, and transferring inspiration exactly', () => {
    const fixture = applyFixture();
    const authoredBefore = structuredClone(fixture.authoredRows);
    const generatedBefore = structuredClone(fixture.generatedRows);
    const evidenceBefore = structuredClone(fixture.evidence);

    const result = applyAccessibleCorpus(fixture);

    expect(result.replacedClueIds).toEqual([
      'old-target-a-1', 'old-target-a-2', 'old-target-a-3', 'old-target-a-4',
      'old-target-a-5', 'old-target-b-1', 'old-target-b-2', 'old-target-b-3',
      'old-target-b-4', 'old-target-b-5',
    ]);
    expect(result.authoredRows).toHaveLength(16);
    expect(result.generatedRows).toHaveLength(16);
    const targetA1Index = fixture.generatedRows.findIndex((row) =>
      row.category_set_id === 'target-a' && row.tier === '1');
    expect(result.generatedRows[targetA1Index]).toEqual({
      ...fixture.generatedRows[targetA1Index],
      clue_id: 'built-in-history-accessible-corpus-001',
      category_name_en: 'Target A Knowledge',
      category_name_et: 'Sihtmärgi A teadmised',
      clue_en: 'Which landmark is associated with example place target-a 1?',
      clue_et: 'Milline vaatamisväärsus on seotud näidiskohaga target-a 1?',
      response_en: 'Example monument target-a 1',
      response_et: 'Näidismonument target-a 1',
      accepted_variants_en: 'Alias\\; one;Back\\\\slash',
      accepted_variants_et: '',
      explanation_en: 'The landmark is a well-known example from place target-a 1.',
      explanation_et: 'See vaatamisväärsus on tuntud näide kohast target-a 1.',
      source_title: 'Reference for target-a 1',
      source_url: 'https://example.com/target-a/1',
      source_license: 'CC-BY-SA-4.0',
      source_retrieved_at: '2026-08-28',
      translation_status: 'reviewed',
    });
    expect(result.authoredRows[targetA1Index]).toEqual({
      ...result.generatedRows[targetA1Index],
      category_name_et: '',
    });

    const retainedIndex = fixture.generatedRows.findIndex((row) =>
      row.category_set_id === 'retained' && row.tier === '1');
    expect(result.generatedRows[retainedIndex]).toEqual({
      ...fixture.generatedRows[retainedIndex],
      category_name_en: 'Retained Knowledge',
      category_name_et: 'Säilitatud teadmised',
    });
    expect(result.authoredRows[retainedIndex]).toEqual({
      ...fixture.authoredRows[retainedIndex],
      category_name_en: 'Retained Knowledge',
    });
    const untouchedIndex = fixture.generatedRows.findIndex((row) =>
      row.category_set_id === 'untouched-hard');
    expect(result.generatedRows[untouchedIndex]).toEqual(fixture.generatedRows[untouchedIndex]);
    expect(result.authoredRows[untouchedIndex]).toEqual(fixture.authoredRows[untouchedIndex]);

    expect(result.evidence.map(({ clueId }) => clueId)).toEqual([
      'built-in-history-accessible-corpus-001',
      'built-in-history-accessible-corpus-002',
      'built-in-history-accessible-corpus-003',
      'built-in-history-accessible-corpus-004',
      'built-in-history-accessible-corpus-005',
      'built-in-history-accessible-corpus-006',
      'built-in-history-accessible-corpus-007',
      'built-in-history-accessible-corpus-008',
      'built-in-history-accessible-corpus-009',
      'built-in-history-accessible-corpus-010',
      'old-retained-1',
      'old-retained-2',
      'old-retained-3',
      'old-retained-4',
      'old-retained-5',
      'old-untouched-hard-1',
    ]);
    const transferred = result.evidence.find((record) =>
      record.clueId === 'built-in-history-accessible-corpus-002');
    expect(transferred).toEqual({
      version: 1,
      clueId: 'built-in-history-accessible-corpus-002',
      batchId: '01-history',
      factKey: 'accessible-corpus:target-a-question-2',
      subjectKey: 'target-a-subject-2',
      assertion: 'Example monument target-a 2 — The landmark is a well-known example from place target-a 2.',
      origin: 'openTdbInspired',
      authoring: {
        author: 'Codex Accessible Corpus Author',
        authoredAt: '2026-08-28T08:00:00.000Z',
      },
      supportingSource: {
        sourceId: 'target-a-source-2',
        title: 'Reference for target-a 2',
        url: 'https://example.com/target-a/2',
        license: 'CC-BY-SA-4.0',
        retrievedAt: '2026-08-28',
      },
      inspiration: {
        system: 'OpenTDB',
        candidateId: 'candidate-a-2',
        license: 'CC-BY-SA-4.0',
      },
      factualReview: {
        reviewer: 'Codex Accessible Corpus Factual Reviewer',
        reviewedAt: '2026-08-28T09:00:00.000Z',
        decision: 'approved',
      },
      editorialReview: {
        reviewer: 'Codex Accessible Corpus Editorial Reviewer',
        reviewedAt: '2026-08-28T10:00:00.000Z',
        decision: 'approved',
      },
      translationReview: {
        reviewer: 'Codex Accessible Corpus Translation Reviewer',
        reviewedAt: '2026-08-28T11:00:00.000Z',
        decision: 'approved',
      },
    });
    expect(result.evidence.find(({ clueId }) => clueId === 'old-retained-1')).toEqual(
      fixture.evidence.find(({ clueId }) => clueId === 'old-retained-1'),
    );
    expect(fixture.authoredRows).toEqual(authoredBefore);
    expect(fixture.generatedRows).toEqual(generatedBefore);
    expect(fixture.evidence).toEqual(evidenceBefore);
  });

  it('is idempotent for every authored, generated, and evidence artifact', () => {
    const fixture = applyFixture();
    const first = applyAccessibleCorpus(fixture);

    const second = applyAccessibleCorpus({
      ...fixture,
      authoredRows: first.authoredRows,
      generatedRows: first.generatedRows,
      evidence: first.evidence,
    });

    expect(second.authoredRows).toEqual(first.authoredRows);
    expect(second.generatedRows).toEqual(first.generatedRows);
    expect(second.evidence).toEqual(first.evidence);
    expect(second.replacedClueIds).toEqual([
      'built-in-history-accessible-corpus-001',
      'built-in-history-accessible-corpus-002',
      'built-in-history-accessible-corpus-003',
      'built-in-history-accessible-corpus-004',
      'built-in-history-accessible-corpus-005',
      'built-in-history-accessible-corpus-006',
      'built-in-history-accessible-corpus-007',
      'built-in-history-accessible-corpus-008',
      'built-in-history-accessible-corpus-009',
      'built-in-history-accessible-corpus-010',
    ]);
  });

  it('rejects a target absent from the authored and generated inventories', () => {
    const fixture = applyFixture();
    const keep = (row: Readonly<Record<string, string>>) => row.category_set_id !== 'target-b';
    expect(() => applyAccessibleCorpus({
      ...fixture,
      authoredRows: fixture.authoredRows.filter(keep),
      generatedRows: fixture.generatedRows.filter(keep),
    })).toThrowError('Missing target rows: target-b');
  });

  it('rejects a target slot without exactly tiers 1 through 5', () => {
    const fixture = applyFixture();
    const duplicateTier = (row: Readonly<Record<string, string>>) =>
      row.clue_id === 'old-target-a-3' ? { ...row, tier: '2' } : row;
    expect(() => applyAccessibleCorpus({
      ...fixture,
      authoredRows: fixture.authoredRows.map(duplicateTier),
      generatedRows: fixture.generatedRows.map(duplicateTier),
    })).toThrowError('Target target-a must contain tiers 1,2,3,4,5; found 1,2,2,4,5');
  });

  it('rejects a target clue without exactly one valid removed evidence record', () => {
    const fixture = applyFixture();
    expect(() => applyAccessibleCorpus({
      ...fixture,
      evidence: fixture.evidence.filter(({ clueId }) => clueId !== 'old-target-a-1'),
    })).toThrowError('Missing evidence for target clue: old-target-a-1');
  });

  it('rejects OpenTDB evidence without a transferable inspiration', () => {
    const fixture = applyFixture();
    const evidence = fixture.evidence.map((record) => record.clueId === 'old-target-a-2'
      ? { ...record, inspiration: null }
      : record) as readonly ContentEvidence[];
    expect(() => applyAccessibleCorpus({ ...fixture, evidence })).toThrowError(
      'OpenTDB evidence old-target-a-2 has no valid inspiration',
    );
  });

  it('rejects reusing one OpenTDB candidate for two replacement facts', () => {
    const fixture = applyFixture();
    const evidence = fixture.evidence.map((record) => record.clueId === 'old-target-b-4'
      ? {
          ...record,
          inspiration: {
            system: 'OpenTDB' as const,
            candidateId: 'candidate-a-2',
            license: 'CC-BY-SA-4.0' as const,
          },
        }
      : record);
    expect(() => applyAccessibleCorpus({ ...fixture, evidence })).toThrowError(
      'OpenTDB candidate reused: candidate-a-2',
    );
  });

  it('rejects accessible categories assigned to the wrong batch', () => {
    const fixture = applyFixture();
    const categories = fixture.categories.map((item) => item.categorySetId === 'target-b'
      ? { ...item, batchId: '02-geography' }
      : item);
    expect(() => applyAccessibleCorpus({ ...fixture, categories })).toThrowError(
      'Accessible categories must belong to one batch',
    );
  });

  it('rejects any authored/generated structural inventory change', () => {
    const fixture = applyFixture();
    const generatedRows = fixture.generatedRows.map((row, index) =>
      index === 0 ? { ...row, round: 'round-two' } : row);
    expect(() => applyAccessibleCorpus({ ...fixture, generatedRows })).toThrowError(
      'Authored/generated inventory differs at row 0',
    );
  });

  it('rejects a replacement clue ID that collides with a retained clue', () => {
    const fixture = applyFixture();
    const collision = 'built-in-history-accessible-corpus-001';
    const replaceId = (row: Readonly<Record<string, string>>) =>
      row.clue_id === 'old-untouched-hard-1' ? { ...row, clue_id: collision } : row;
    const evidence = fixture.evidence.map((record) => record.clueId === 'old-untouched-hard-1'
      ? { ...record, clueId: collision }
      : record);
    expect(() => applyAccessibleCorpus({
      ...fixture,
      authoredRows: fixture.authoredRows.map(replaceId),
      generatedRows: fixture.generatedRows.map(replaceId),
      evidence,
    })).toThrowError(`Replacement clue ID collides with retained clue: ${collision}`);
  });

  it('rejects a replacement fact key that collides with retained evidence', () => {
    const fixture = applyFixture();
    const factKey = 'accessible-corpus:target-a-question-1';
    const evidence = fixture.evidence.map((record) => record.clueId === 'old-retained-1'
      ? { ...record, factKey }
      : record);
    expect(() => applyAccessibleCorpus({ ...fixture, evidence })).toThrowError(
      `Replacement fact key collides with retained evidence: ${factKey}`,
    );
  });
});

describe('applyAccessibleCorpus staging and publishing', () => {
  it('stages all 36 transformed artifacts without changing accepted files', () => {
    const fixture = stagingFixture();
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);

    const result = stageAccessibleCorpus(fixture);

    expect(result.artifactPaths).toHaveLength(36);
    expect(result.replacedClueIds).toHaveLength(60);
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
    for (const batchId of ACCEPTED_BATCHES) {
      const authoredPath = resolve(fixture.outputRoot, `authored/${batchId}.csv`);
      const generatedPath = resolve(fixture.outputRoot, `generated/${batchId}.en-et.csv`);
      const evidencePath = resolve(fixture.outputRoot, `evidence/${batchId}.jsonl`);
      expect(existsSync(authoredPath)).toBe(true);
      expect(existsSync(generatedPath)).toBe(true);
      expect(existsSync(evidencePath)).toBe(true);
      const stagedRows = parse(readFileSync(generatedPath, 'utf8'), {
        columns: true,
        skip_empty_lines: true,
      }) as Array<Record<string, string>>;
      expect(stagedRows.map(({ clue_id }) => clue_id)).toEqual([
        `built-in-${batchId}-accessible-corpus-001`,
        `built-in-${batchId}-accessible-corpus-002`,
        `built-in-${batchId}-accessible-corpus-003`,
        `built-in-${batchId}-accessible-corpus-004`,
        `built-in-${batchId}-accessible-corpus-005`,
      ]);
    }
  });

  it('writes no staged artifacts when any of the twelve batch transforms fails', () => {
    const fixture = stagingFixture();
    const lastBatch = ACCEPTED_BATCHES.at(-1)!;
    for (const kind of ['authored', 'generated'] as const) {
      const path = kind === 'authored'
        ? resolve(fixture.acceptedRoot, `content/authored/${lastBatch}.csv`)
        : resolve(fixture.acceptedRoot, `content/generated/${lastBatch}.en-et.csv`);
      const rows = parse(readFileSync(path, 'utf8'), {
        columns: true,
        skip_empty_lines: true,
      }) as Array<Record<string, string>>;
      writeApplyRows(path, rows.slice(0, 4));
    }

    expect(() => stageAccessibleCorpus(fixture)).toThrowError(
      `Target target-${lastBatch} must contain tiers 1,2,3,4,5; found 1,2,3,4`,
    );
    expect(existsSync(fixture.outputRoot)).toBe(false);
  });

  it('rejects malformed accepted-variant escapes before staging replacement content', () => {
    const fixture = stagingFixture();
    const path = resolve(fixture.acceptedRoot, 'content/generated/01-history.en-et.csv');
    const rows = parse(readFileSync(path, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
    }) as Array<Record<string, string>>;
    rows[0] = { ...rows[0]!, accepted_variants_en: 'broken\\q' };
    writeApplyRows(path, rows);

    expect(() => stageAccessibleCorpus(fixture)).toThrowError(
      'Invalid accepted variants in accepted CSV artifact',
    );
    expect(existsSync(fixture.outputRoot)).toBe(false);
  });

  it('rejects a staging root whose artifacts overlap accepted destinations', () => {
    const fixture = stagingFixture();
    const overlapping = { ...fixture, outputRoot: resolve(fixture.acceptedRoot, 'content') };
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);

    expect(() => stageAccessibleCorpus(overlapping)).toThrowError(
      'Staged artifact overlaps accepted destination',
    );
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
  });

  it('rejects a category whose batch differs from its target ledger before staging writes', () => {
    const fixture = stagingFixture();
    const categorySetId = 'target-12-mythology-religion-philosophy';
    const categories = fixture.categories.map((item) => item.categorySetId === categorySetId
      ? { ...item, batchId: '99-unknown' }
      : item);

    expect(() => stageAccessibleCorpus({ ...fixture, categories })).toThrowError(
      `Category ${categorySetId} has batch 99-unknown; expected 12-mythology-religion-philosophy`,
    );
    expect(existsSync(fixture.outputRoot)).toBe(false);
  });

  it('publishes all 36 staged artifacts and leaves unrelated accepted content untouched', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);

    publishAccessibleCorpusStage({
      ...fixture,
      dependencies: { createTemporaryId: () => 'success' },
    });

    for (const path of acceptedArtifactPaths()) {
      expect(readFileSync(resolve(fixture.acceptedRoot, path), 'utf8')).toBe(
        readFileSync(resolve(fixture.outputRoot, path.replace(/^content\//u, '')), 'utf8'),
      );
    }
    expect(readFileSync(resolve(fixture.acceptedRoot, 'content/unrelated.txt'), 'utf8')).toBe(
      'leave me alone',
    );
  });

  it('does not touch accepted files for header-only staged CSV and empty evidence', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    writeApplyRows(resolve(fixture.outputRoot, 'authored/01-history.csv'), []);
    writeApplyRows(resolve(fixture.outputRoot, 'generated/01-history.en-et.csv'), []);
    writeFileSync(resolve(fixture.outputRoot, 'evidence/01-history.jsonl'), '');

    expect(() => publishAccessibleCorpusStage({ ...fixture })).toThrowError();
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
  });

  it.each(['unrelated content', 'wrong category structure'] as const)(
    'does not touch accepted files for same-count staged %s',
    (corruption) => {
      const fixture = stagingFixture();
      stageAccessibleCorpus(fixture);
      const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
      for (const kind of ['authored', 'generated'] as const) {
        const path = kind === 'authored'
          ? resolve(fixture.outputRoot, 'authored/01-history.csv')
          : resolve(fixture.outputRoot, 'generated/01-history.en-et.csv');
        const rows = parse(readFileSync(path, 'utf8'), {
          columns: true,
          skip_empty_lines: true,
        }) as Array<Record<string, string>>;
        rows[0] = corruption === 'unrelated content'
          ? {
              ...rows[0]!,
              clue_en: 'This staged clue is unrelated to the reviewed accessible corpus.',
              clue_et: 'See lavastatud küsimus ei kuulu kontrollitud ligipääsetavasse korpusesse.',
            }
          : { ...rows[0]!, category_set_id: 'unrelated-category' };
        writeApplyRows(path, rows);
      }

      expect(() => publishAccessibleCorpusStage({ ...fixture })).toThrowError(
        'Staged artifact does not match expected transform',
      );
      expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
    },
  );

  it('does not touch accepted files when any staged artifact is missing', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    unlinkSync(resolve(fixture.outputRoot, 'evidence/12-mythology-religion-philosophy.jsonl'));

    expect(() => publishAccessibleCorpusStage({
      ...fixture,
    })).toThrowError('Missing staged artifact');
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
  });

  it('does not touch accepted files when staged CSV variants are malformed', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    const path = resolve(fixture.outputRoot, 'generated/01-history.en-et.csv');
    const rows = parse(readFileSync(path, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
    }) as Array<Record<string, string>>;
    rows[0] = { ...rows[0]!, accepted_variants_en: 'broken\\q' };
    writeApplyRows(path, rows);

    expect(() => publishAccessibleCorpusStage({
      ...fixture,
    })).toThrowError('Invalid accepted variants in staged CSV artifact');
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
  });

  it('rolls every accepted artifact back when a replacement fails', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    let replacements = 0;

    expect(() => publishAccessibleCorpusStage({
      ...fixture,
      dependencies: {
        createTemporaryId: () => 'rollback',
        rename: (source, destination) => {
          if (source.endsWith('.tmp')) {
            replacements += 1;
            if (replacements === 10) throw new Error('injected replacement failure');
          }
          renameSync(source, destination);
        },
      },
    })).toThrowError('injected replacement failure');
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
  });

  it('rejects a partial-batch CLI option', () => {
    expect(parseAccessibleCorpusArgs(['--output-root', 'custom-stage', '--publish'])).toEqual({
      outputRoot: 'custom-stage',
      publish: true,
    });
    expect(() => parseAccessibleCorpusArgs(['--batch', '01-history'])).toThrowError(
      'Unknown argument: --batch',
    );
  });

  it('fails clearly until Task 8 supplies buildAccessibleCorpus', () => {
    expect(() => loadAccessibleCorpus(() => ({}))).toThrowError(
      'accessibility/bank.ts must export a callable buildAccessibleCorpus',
    );
  });
});
