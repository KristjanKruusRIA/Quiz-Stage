import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { describe, expect, it } from 'vitest';
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
} from '../../../scripts/content/accessibility/types';

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
