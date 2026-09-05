import { describe, expect, it } from 'vitest';

import type {
  EasyExpansionBatchContract,
  EasyExpansionCategory,
} from '../../../scripts/content/easyExpansion/types';
import { validateEasyExpansionBank } from '../../../scripts/content/easyExpansion/validateBank';

const SUBJECTS = ['atlas', 'beacon', 'comet', 'delta', 'ember'] as const;

const HISTORY_CONTRACT: EasyExpansionBatchContract = Object.freeze({
  batchId: '01-history',
  packId: 'built-in-history',
  allowedMacroTopics: Object.freeze(['ancient', 'social']),
  existingMacroTopicCounts: Object.freeze({ ancient: 0, social: 0 }),
  maxSetsPerMacroTopic: 15,
});

function category(index: number): EasyExpansionCategory {
  const suffix = 101 + index;
  const categoryToken = String.fromCharCode('A'.charCodeAt(0) + index);
  return Object.freeze({
    categorySetId: `built-in-history-set-${suffix}`,
    batchId: HISTORY_CONTRACT.batchId,
    packId: HISTORY_CONTRACT.packId,
    difficulty: 'easy',
    round: index < 10 ? 'round-one' : 'round-two',
    macroTopic: index < 10 ? 'ancient' : 'social',
    name: Object.freeze({
      en: `Familiar History ${categoryToken}`,
      et: `Tuttav ajalugu ${categoryToken}`,
    }),
    questions: Object.freeze(SUBJECTS.map((subject, questionIndex) => {
      const tier = (questionIndex + 1) as 1 | 2 | 3 | 4 | 5;
      return Object.freeze({
        clueId: `built-in-history-easy-expansion-${(index * 5 + tier).toString().padStart(3, '0')}`,
        key: `history-${categoryToken.toLocaleLowerCase('en')}-${subject}`,
        factKey: `history:easy-expansion:${categoryToken.toLocaleLowerCase('en')}:${subject}`,
        tier,
        subjectKey: `fixture:${categoryToken.toLocaleLowerCase('en')}-${subject}`,
        clue: Object.freeze({
          en: `This general-knowledge clue describes the ${subject} subject in group ${categoryToken}.`,
          et: `See üldteadmiste vihje kirjeldab rühma ${categoryToken} teemat ${subject}.`,
        }),
        response: Object.freeze({
          en: `${subject} answer ${categoryToken}`,
          et: `${subject} vastus ${categoryToken}`,
        }),
        acceptedVariants: Object.freeze({
          en: Object.freeze([]),
          et: Object.freeze([]),
        }),
        explanation: Object.freeze({
          en: `The ${subject} explanation supports the intended answer for group ${categoryToken}.`,
          et: `${subject} selgitus toetab rühma ${categoryToken} õiget vastust.`,
        }),
        source: Object.freeze({
          sourceId: `fixture-${categoryToken.toLocaleLowerCase('en')}-${subject}`,
          title: `Reference ${categoryToken} ${subject}`,
          url: `https://example.com/${categoryToken.toLocaleLowerCase('en')}/${subject}`,
          license: 'CC-BY-4.0',
          retrievedAt: '2026-09-05',
        }),
      });
    })),
  });
}

function bank(): readonly EasyExpansionCategory[] {
  return Object.freeze(Array.from({ length: 20 }, (_, index) => category(index)));
}

function replaceCategory(
  categories: readonly EasyExpansionCategory[],
  index: number,
  replacement: EasyExpansionCategory,
): readonly EasyExpansionCategory[] {
  return categories.map((item, itemIndex) => itemIndex === index ? replacement : item);
}

describe('validateEasyExpansionBank', () => {
  it('accepts exactly twenty canonical sets and returns them in set order', () => {
    const categories = bank();
    const ordered = validateEasyExpansionBank([...categories].reverse(), HISTORY_CONTRACT);

    expect(ordered).toHaveLength(20);
    expect(ordered.flatMap(({ questions }) => questions)).toHaveLength(100);
    expect(ordered.map(({ categorySetId }) => categorySetId)).toEqual(
      Array.from({ length: 20 }, (_, index) => `built-in-history-set-${101 + index}`),
    );
    expect(ordered.filter(({ round }) => round === 'round-one')).toHaveLength(10);
    expect(ordered.filter(({ round }) => round === 'round-two')).toHaveLength(10);
  });

  it('rejects missing, extra, duplicate, and non-canonical category IDs', () => {
    const categories = bank();
    expect(() => validateEasyExpansionBank(categories.slice(0, 19), HISTORY_CONTRACT))
      .toThrowError(/20 easy expansion categories/u);
    expect(() => validateEasyExpansionBank([...categories, category(0)], HISTORY_CONTRACT))
      .toThrowError(/20 easy expansion categories/u);
    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 1, categories[0]!),
      HISTORY_CONTRACT,
    )).toThrowError(/duplicate easy expansion category/iu);
    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, {
        ...categories[0]!,
        categorySetId: 'built-in-history-set-100',
      }),
      HISTORY_CONTRACT,
    )).toThrowError(/not present in the Phase B set range/u);
  });

  it.each([
    ['batch', { batchId: '02-geography' }, /batch 02-geography/u],
    ['pack', { packId: 'built-in-geography' }, /pack built-in-geography/u],
    ['difficulty', { difficulty: 'medium' }, /difficulty medium/u],
    ['round', { round: 'round-two' }, /round round-two/u],
    ['macro topic', { macroTopic: 'modern' }, /macro topic modern/u],
  ] as const)('rejects a category with the wrong %s', (_label, patch, message) => {
    const categories = bank();
    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...categories[0]!, ...patch } as EasyExpansionCategory),
      HISTORY_CONTRACT,
    )).toThrowError(message);
  });

  it('rejects a macro-topic allocation that would exceed the production cap', () => {
    expect(() => validateEasyExpansionBank(bank(), {
      ...HISTORY_CONTRACT,
      existingMacroTopicCounts: { ancient: 6, social: 0 },
    })).toThrowError(/macro topic ancient would contain 16 sets; maximum is 15/iu);
  });

  it.each([
    ['negative baseline count', { existingMacroTopicCounts: { ancient: -1, social: 0 } }],
    ['non-finite baseline count', { existingMacroTopicCounts: { ancient: Number.NaN, social: 0 } }],
    ['non-positive cap', { maxSetsPerMacroTopic: 0 }],
    ['non-finite cap', { maxSetsPerMacroTopic: Number.POSITIVE_INFINITY }],
  ] as const)('rejects a malformed numeric contract: %s', (_label, patch) => {
    expect(() => validateEasyExpansionBank(bank(), {
      ...HISTORY_CONTRACT,
      ...patch,
    })).toThrowError(/non-negative integer|positive integer/u);
  });

  it('requires five questions in tier order with distinct subjects and four answer entities', () => {
    const categories = bank();
    const first = categories[0]!;
    expect(() => validateEasyExpansionBank(replaceCategory(categories, 0, {
      ...first,
      questions: first.questions.slice(0, 4),
    }), HISTORY_CONTRACT)).toThrowError(/tiers 1,2,3,4,5/u);

    expect(() => validateEasyExpansionBank(replaceCategory(categories, 0, {
      ...first,
      questions: [first.questions[1]!, first.questions[0]!, ...first.questions.slice(2)],
    }), HISTORY_CONTRACT)).toThrowError(/ordered tiers 1,2,3,4,5/u);

    expect(() => validateEasyExpansionBank(replaceCategory(categories, 0, {
      ...first,
      questions: first.questions.map((question, index) => index === 1
        ? { ...question, subjectKey: first.questions[0]!.subjectKey }
        : question),
    }), HISTORY_CONTRACT)).toThrowError(/duplicate subject key/u);

    expect(() => validateEasyExpansionBank(replaceCategory(categories, 0, {
      ...first,
      questions: first.questions.map((question, index) => index > 2
        ? { ...question, response: first.questions[0]!.response }
        : question),
    }), HISTORY_CONTRACT)).toThrowError(/at least four distinct answer entities/u);
  });

  it('accepts exactly four answer entities without treating one repeated answer as a defect', () => {
    const categories = bank();
    const first = categories[0]!;
    const questions = first.questions.map((question, index) => index === 4
      ? { ...question, response: first.questions[0]!.response }
      : question);

    expect(validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...first, questions }),
      HISTORY_CONTRACT,
    )).toHaveLength(20);
  });

  it.each([
    ['English primaries', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      response: { ...question.response, en: 'Omega' },
      acceptedVariants: { en: [], et: [] },
    })],
    ['Estonian primaries', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      response: { ...question.response, et: 'Oomega' },
      acceptedVariants: { en: [], et: [] },
    })],
  ] as const)('does not count different translations as distinct answer entities when %s repeat', (
    _label,
    mutate,
  ) => {
    const categories = bank();
    const first = categories[0]!;

    expect(() => validateEasyExpansionBank(replaceCategory(categories, 0, {
      ...first,
      questions: first.questions.map(mutate),
    }), HISTORY_CONTRACT)).toThrowError(/at least four distinct answer entities/u);
  });

  it('collapses overlapping accepted aliases when counting answer entities', () => {
    const categories = bank();
    const first = categories[0]!;
    const questions = first.questions.map((question, index) => ({
      ...question,
      acceptedVariants: index < 2
        ? { en: ['shared alias one'], et: ['ühine alias üks'] }
        : index < 4
          ? { en: ['shared alias two'], et: ['ühine alias kaks'] }
          : question.acceptedVariants,
    }));

    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...first, questions }),
      HISTORY_CONTRACT,
    )).toThrowError(/at least four distinct answer entities/u);
  });

  it('requires the exact dedicated clue-ID sequence', () => {
    const categories = bank();
    const first = categories[0]!;
    const questions = first.questions.map((question, index) => index === 0
      ? { ...question, clueId: 'built-in-history-easy-expansion-999' }
      : question);

    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...first, questions }),
      HISTORY_CONTRACT,
    )).toThrowError(
      /clue ID built-in-history-easy-expansion-999; expected built-in-history-easy-expansion-001/u,
    );
  });

  it.each([
    ['question key', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      key: '',
    }), /empty (?:question )?key/u],
    ['fact key', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      factKey: '',
    }), /empty fact key/u],
    ['subject key', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      subjectKey: 'Fixture Subject',
    }), /(?:invalid|non-canonical) subject key/u],
    ['Estonian clue', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      clue: { ...question.clue, et: '' },
    }), /empty Estonian clue/u],
    ['source URL', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      source: { ...question.source, url: 'http://example.com/not-https' },
    }), /invalid source/u],
    ['source home URL', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      source: { ...question.source, url: 'https://example.com/' },
    }), /invalid source/u],
    ['set-shaped subject key', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      subjectKey: 'set:fixture-subject',
    }), /set-shaped subject key/u],
    ['missing accepted variants', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      acceptedVariants: undefined,
    } as unknown as EasyExpansionCategory['questions'][number]),
    /must provide English and Estonian accepted-variant arrays/u],
  ] as const)('rejects an invalid %s', (_label, mutate, message) => {
    const categories = bank();
    const first = categories[0]!;
    const questions = first.questions.map((question, index) => index === 0
      ? mutate(question)
      : question);
    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...first, questions }),
      HISTORY_CONTRACT,
    )).toThrowError(message);
  });

  it('rejects an accepted-variant leak in either the clue or category title', () => {
    const categories = bank();
    const first = categories[0]!;
    const questions = first.questions.map((question, index) => index === 0
      ? {
          ...question,
          clue: { ...question.clue, en: 'Name the familiar Atlas landmark.' },
          acceptedVariants: { en: ['Atlas landmark'], et: ['Atlase maamärk'] },
        }
      : question);

    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...first, questions }),
      HISTORY_CONTRACT,
    )).toThrowError(/leaks its English accepted variant in the clue/u);
  });

  it.each([
    ['source-prefix', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      clue: { ...question.clue, en: `${question.source.title}: copied heading text` },
    })],
    ['infobox-residue', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      clue: { ...question.clue, en: 'Name this figure (born 1 January 1900).' },
    })],
    ['exact-date-or-number', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      clue: { ...question.clue, en: 'On what exact date did this happen?' },
    })],
    ['long-answer', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      response: {
        en: 'An unnecessarily long answer that exceeds forty characters',
        et: 'Tarbetult pikk vastus, mis ületab neljakümne tähemärgi piiri',
      },
    })],
    ['multi-item-answer', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      response: { en: 'Alpha, Beta', et: 'Alfa, beeta' },
    })],
    ['binary-question', (question: EasyExpansionCategory['questions'][number]) => ({
      ...question,
      clue: { ...question.clue, et: 'Kasutas see valitseja lahingus mõõka?' },
    })],
  ] as const)('rejects the accessibility signal %s', (reason, mutate) => {
    const categories = bank();
    const first = categories[0]!;
    const questions = first.questions.map((question, index) => index === 0
      ? mutate(question)
      : question);

    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...first, questions } as EasyExpansionCategory),
      HISTORY_CONTRACT,
    )).toThrowError(new RegExp(reason, 'u'));
  });

  it.each([
    'Mis täpsel kuupäeval toimus see tuntud sündmus?',
    'Millisel täpsel kuupäeval toimus see tuntud sündmus?',
  ])('rejects an Estonian arbitrary exact-date prompt: %s', (clueEt) => {
    const categories = bank();
    const first = categories[0]!;
    const questions = first.questions.map((question, index) => index === 0
      ? { ...question, clue: { ...question.clue, et: clueEt } }
      : question);

    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, { ...first, questions }),
      HISTORY_CONTRACT,
    )).toThrowError(/exact-date-or-number/u);
  });

  it.each([
    ['generic title', (categoryItem: EasyExpansionCategory) => ({
      ...categoryItem,
      name: { en: 'Quick Mix', et: 'Kiire segu' },
    }), /generic English category title/u],
    ['binary prompt', (categoryItem: EasyExpansionCategory) => ({
      ...categoryItem,
      questions: categoryItem.questions.map((question, index) => index === 0
        ? { ...question, clue: { ...question.clue, en: 'Is this answer correct?' } }
        : question),
    }), /(?:binary or multiple-choice|binary-or-multiple-choice)/u],
    ['answer leak', (categoryItem: EasyExpansionCategory) => ({
      ...categoryItem,
      questions: categoryItem.questions.map((question, index) => index === 0
        ? { ...question, clue: { ...question.clue, en: `Name ${question.response.en}.` } }
        : question),
    }), /(?:answer-leak|leaks its English response)/u],
    ['unstable fact', (categoryItem: EasyExpansionCategory) => ({
      ...categoryItem,
      questions: categoryItem.questions.map((question, index) => index === 0
        ? { ...question, clue: { ...question.clue, en: 'Who is currently the president?' } }
        : question),
    }), /(?:undated-changing-fact|unstable fact without an explicit date)/u],
    ['accessibility-generic title', (categoryItem: EasyExpansionCategory) => ({
      ...categoryItem,
      name: { en: 'General Knowledge', et: 'Üldteadmised' },
    }), /generic-category-title/u],
  ] as const)('rejects a %s playability defect', (_label, mutate, message) => {
    const categories = bank();
    expect(() => validateEasyExpansionBank(
      replaceCategory(categories, 0, mutate(categories[0]!)),
      HISTORY_CONTRACT,
    )).toThrowError(message);
  });

  it('rejects a three-use repeated answer concentration while allowing one local pair', () => {
    const categories = bank();
    const repeated = { en: 'Shared answer', et: 'Ühine vastus' };
    const concentrated = categories.map((categoryItem, categoryIndex) => categoryIndex < 3
      ? {
          ...categoryItem,
          questions: categoryItem.questions.map((question, questionIndex) => questionIndex === 0
            ? { ...question, response: repeated }
            : question),
        }
      : categoryItem);

    expect(() => validateEasyExpansionBank(concentrated, HISTORY_CONTRACT))
      .toThrowError(/repeated-answer/u);
  });

  it('rejects duplicate bilingual titles, question keys, fact keys, and clue-answer pairs', () => {
    const categories = bank();
    const first = categories[0]!;
    const second = categories[1]!;
    expect(() => validateEasyExpansionBank(replaceCategory(categories, 1, {
      ...second,
      name: first.name,
    }), HISTORY_CONTRACT)).toThrowError(/duplicate English category title/iu);

    for (const [field, message] of [
      ['key', /duplicate question key/iu],
      ['factKey', /duplicate fact key/iu],
    ] as const) {
      expect(() => validateEasyExpansionBank(replaceCategory(categories, 1, {
        ...second,
        questions: second.questions.map((question, index) => index === 0
          ? { ...question, [field]: first.questions[0]![field] }
          : question),
      }), HISTORY_CONTRACT)).toThrowError(message);
    }

    expect(() => validateEasyExpansionBank(replaceCategory(categories, 1, {
      ...second,
      questions: second.questions.map((question, index) => index === 0
        ? {
            ...question,
            clue: first.questions[0]!.clue,
            response: first.questions[0]!.response,
          }
        : question),
    }), HISTORY_CONTRACT)).toThrowError(/duplicate clue\/answer pair.*English/iu);
  });
});
