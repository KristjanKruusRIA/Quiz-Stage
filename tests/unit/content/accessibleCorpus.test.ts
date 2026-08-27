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
import { applyAccessibleCorpus } from '../../../scripts/content/accessibility/apply';
import { validateAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
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

function normalized(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/\p{P}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  targetCategorySetIds: ReadonlySet<string>;
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
  const targetCategorySetIds = new Set<string>();
  for (const batchId of ACCEPTED_BATCHES) {
    const categorySetId = `target-${batchId}`;
    const accessibleCategory = category(categorySetId, batchId);
    categories.push(accessibleCategory);
    titles.push({ categorySetId, batchId, name: accessibleCategory.name });
    targetCategorySetIds.add(categorySetId);
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
  return { acceptedRoot, outputRoot, categories, titles, targetCategorySetIds };
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
        expect(normalized(title.name.en), `${title.categorySetId} English: ${response.en}`)
          .not.toContain(normalized(response.en));
        expect(normalized(title.name.et), `${title.categorySetId} Estonian: ${response.et}`)
          .not.toContain(normalized(response.et));
      }
    }
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

  it('publishes all 36 staged artifacts and leaves unrelated accepted content untouched', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);

    publishAccessibleCorpusStage({
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
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

  it('does not touch accepted files when any staged artifact is missing', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    unlinkSync(resolve(fixture.outputRoot, 'evidence/12-mythology-religion-philosophy.jsonl'));

    expect(() => publishAccessibleCorpusStage({
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
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
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
    })).toThrowError('Invalid accepted variants in staged CSV artifact');
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
  });

  it('rolls every accepted artifact back when a replacement fails', () => {
    const fixture = stagingFixture();
    stageAccessibleCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    let replacements = 0;

    expect(() => publishAccessibleCorpusStage({
      acceptedRoot: fixture.acceptedRoot,
      outputRoot: fixture.outputRoot,
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
