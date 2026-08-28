import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  PLAYABLE_TARGET_IDS,
  PLAYABLE_TARGETS,
  type PlayableTarget,
} from '../../../scripts/content/playability/targets';
import type {
  PlayableCategory,
  PlayableQuestion,
} from '../../../scripts/content/playability/types';
import { validatePlayableCorpus } from '../../../scripts/content/playability/validateBank';

const EXPECTED_ALLOCATION = {
  '01-history:hard': 33,
  '01-history:medium': 33,
  '02-geography:hard': 33,
  '02-geography:medium': 33,
  '03-science-nature:hard': 33,
  '03-science-nature:medium': 33,
  '04-literature-language:hard': 33,
  '04-literature-language:medium': 33,
  '05-art-architecture:hard': 33,
  '05-art-architecture:medium': 34,
  '06-music:hard': 33,
  '06-music:medium': 34,
  '07-film-television:hard': 33,
  '07-film-television:medium': 34,
  '08-sports-games:hard': 33,
  '08-sports-games:medium': 34,
  '09-food-drink:hard': 34,
  '09-food-drink:medium': 33,
  '10-technology-inventions:hard': 34,
  '10-technology-inventions:medium': 33,
  '11-politics-economics-society:hard': 34,
  '11-politics-economics-society:medium': 33,
  '12-mythology-religion-philosophy:hard': 34,
  '12-mythology-religion-philosophy:medium': 33,
} as const;

function target(
  categorySetId: string,
  difficulty: 'medium' | 'hard' = 'medium',
): PlayableTarget {
  return {
    categorySetId,
    batchId: '01-history',
    packId: 'built-in-history',
    difficulty,
  };
}

function question(categorySetId: string, tier: 1 | 2 | 3 | 4 | 5): PlayableQuestion {
  return {
    key: `${categorySetId}:question:${tier}`,
    factKey: `${categorySetId}:fact:${tier}`,
    tier,
    subjectKey: `landmark:fixture-${categorySetId.slice(-1)}-${tier}`,
    clue: {
      en: `Which landmark matches clue ${tier} for ${categorySetId}?`,
      et: `Milline vaatamisväärsus sobib vihjega ${tier} kategoorias ${categorySetId}?`,
    },
    response: {
      en: `Answer ${categorySetId} ${tier}`,
      et: `Vastus ${categorySetId} ${tier}`,
    },
    acceptedVariants: { en: [], et: [] },
    explanation: {
      en: `This explains fact ${tier} for ${categorySetId}.`,
      et: `See selgitab fakti ${tier} kategoorias ${categorySetId}.`,
    },
    source: {
      sourceId: `source:${categorySetId}:${tier}`,
      title: `Reference ${categorySetId} ${tier}`,
      url: `https://example.com/${categorySetId}/${tier}`,
      license: 'CC-BY-4.0',
      retrievedAt: '2026-08-28',
    },
  };
}

function category(playableTarget: PlayableTarget): PlayableCategory {
  return {
    ...playableTarget,
    name: {
      en: `Knowledge theme ${playableTarget.categorySetId}`,
      et: `Teadmisteema ${playableTarget.categorySetId}`,
    },
    questions: ([1, 2, 3, 4, 5] as const).map((tier) => (
      question(playableTarget.categorySetId, tier)
    )),
  };
}

function replaceQuestion(
  playableCategory: PlayableCategory,
  index: number,
  replacement: PlayableQuestion,
): PlayableCategory {
  const questions = [...playableCategory.questions];
  questions[index] = replacement;
  return { ...playableCategory, questions };
}

function firstQuestion(playableCategory: PlayableCategory): PlayableQuestion {
  return playableCategory.questions[0]!;
}

describe('playable medium/hard target ledger', () => {
  it('locks all 800 accepted set identities without runtime CSV discovery', () => {
    const serialized = PLAYABLE_TARGETS.map((entry) => [
      entry.categorySetId,
      entry.batchId,
      entry.packId,
      entry.difficulty,
    ].join('|')).join('\n');

    expect(PLAYABLE_TARGETS).toHaveLength(800);
    expect(PLAYABLE_TARGET_IDS).toHaveLength(800);
    expect(PLAYABLE_TARGET_IDS).toEqual(PLAYABLE_TARGETS.map(({ categorySetId }) => categorySetId));
    expect(new Set(PLAYABLE_TARGET_IDS).size).toBe(800);
    expect(createHash('sha256').update(serialized).digest('hex')).toBe(
      '78b9a8624f4e9c3fcb2cc476462746d34841de6ce9dc0cfbb5fd4defa14b366b',
    );
    expect(PLAYABLE_TARGETS.slice(0, 3)).toEqual([
      {
        categorySetId: 'built-in-history-set-002',
        batchId: '01-history',
        packId: 'built-in-history',
        difficulty: 'hard',
      },
      {
        categorySetId: 'built-in-history-set-006',
        batchId: '01-history',
        packId: 'built-in-history',
        difficulty: 'hard',
      },
      {
        categorySetId: 'built-in-history-set-009',
        batchId: '01-history',
        packId: 'built-in-history',
        difficulty: 'hard',
      },
    ]);
    expect(PLAYABLE_TARGETS.slice(-3)).toEqual([
      {
        categorySetId: 'built-in-mythology-religion-philosophy-set-098',
        batchId: '12-mythology-religion-philosophy',
        packId: 'built-in-mythology-religion-philosophy',
        difficulty: 'hard',
      },
      {
        categorySetId: 'built-in-mythology-religion-philosophy-set-099',
        batchId: '12-mythology-religion-philosophy',
        packId: 'built-in-mythology-religion-philosophy',
        difficulty: 'hard',
      },
      {
        categorySetId: 'built-in-mythology-religion-philosophy-set-100',
        batchId: '12-mythology-religion-philosophy',
        packId: 'built-in-mythology-religion-philosophy',
        difficulty: 'hard',
      },
    ]);
  });

  it('locks the exact per-pack difficulty allocation and 4,000 replacement slots', () => {
    const allocation = Object.fromEntries(Object.keys(EXPECTED_ALLOCATION).map((key) => [
      key,
      PLAYABLE_TARGETS.filter((entry) => `${entry.batchId}:${entry.difficulty}` === key).length,
    ]));

    expect(allocation).toEqual(EXPECTED_ALLOCATION);
    expect(PLAYABLE_TARGETS.filter(({ difficulty }) => difficulty === 'medium')).toHaveLength(400);
    expect(PLAYABLE_TARGETS.filter(({ difficulty }) => difficulty === 'hard')).toHaveLength(400);
    expect(PLAYABLE_TARGETS.length * 5).toBe(4_000);
  });
});

describe('validatePlayableCorpus', () => {
  it('returns a complete valid bank in stable target-ledger order', () => {
    const targets = [target('target-a'), target('target-b', 'hard')];
    const categories = targets.map(category).reverse();

    expect(validatePlayableCorpus(categories, targets).map(({ categorySetId }) => categorySetId))
      .toEqual(['target-a', 'target-b']);
  });

  it('rejects a missing target category instead of accepting a partial bank', () => {
    expect(() => validatePlayableCorpus(
      [category(target('target-a'))],
      [target('target-a'), target('target-b')],
    )).toThrowError(/Expected 2 playable categories; found 1/u);
  });

  it('rejects duplicate and non-target category IDs', () => {
    const targets = [target('target-a'), target('target-b')];
    expect(() => validatePlayableCorpus(
      [category(targets[0]!), category(targets[0]!)],
      targets,
    )).toThrowError(/Duplicate playable category: target-a/u);
    expect(() => validatePlayableCorpus(
      [category(targets[0]!), category(target('target-extra'))],
      targets,
    )).toThrowError(/Category target-extra is not present in the target ledger/u);
  });

  it('rejects duplicate target IDs before using an ambiguous ledger', () => {
    const repeated = target('target-a');
    expect(() => validatePlayableCorpus(
      [category(repeated), category(target('target-b'))],
      [repeated, repeated],
    )).toThrowError(/Duplicate target category: target-a/u);
  });

  it.each([
    ['batch', { batchId: '02-geography' }],
    ['pack', { packId: 'built-in-geography' }],
    ['difficulty', { difficulty: 'hard' as const }],
  ])('rejects a category with the wrong target %s', (_label, mismatch) => {
    const expected = target('target-a');
    expect(() => validatePlayableCorpus(
      [{ ...category(expected), ...mismatch }],
      [expected],
    )).toThrowError(/does not match its target ledger identity/u);
  });

  it.each([
    [[1, 2, 3, 4] as const, 'found 1,2,3,4'],
    [[1, 2, 3, 4, 4] as const, 'found 1,2,3,4,4'],
  ])('rejects a category without exactly one of every tier: %s', (tiers, found) => {
    const expected = target('target-a');
    const playableCategory = {
      ...category(expected),
      questions: tiers.map((tier, index) => ({
        ...question(expected.categorySetId, tier),
        key: `tier-fixture:${index}`,
        factKey: `tier-fact:${index}`,
        subjectKey: `tier-subject:${index}`,
      })),
    };

    expect(() => validatePlayableCorpus([playableCategory], [expected]))
      .toThrowError(`Category target-a must contain tiers 1,2,3,4,5; ${found}`);
  });

  it('rejects empty and duplicate question, fact, and subject identities', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const second = base.questions[1]!;

    for (const [field, value, message] of [
      ['key', '', /question with an empty key/u],
      ['factKey', '', /has an empty fact key/u],
      ['subjectKey', '', /has an empty subject key/u],
      ['key', first.key, /Duplicate question key/u],
      ['factKey', first.factKey, /Duplicate fact key/u],
      ['subjectKey', first.subjectKey, /duplicate subject key/u],
    ] as const) {
      const changed = replaceQuestion(base, 1, { ...second, [field]: value });
      expect(() => validatePlayableCorpus([changed], [expected]), `${field}:${value}`)
        .toThrowError(message);
    }
  });

  it.each([
    ['non-canonical alias', 'landmark:fixture_A_2', /non-canonical subject key/u],
    ['missing namespace', 'ada-lovelace', /invalid subject key/u],
    ['generic category namespace', 'category:target-a', /set-shaped subject key/u],
    ['generic set namespace', 'set:002', /set-shaped subject key/u],
    ['generic bank namespace', 'bank:002', /set-shaped subject key/u],
    ['digits-only subject slug', 'person:002', /digits-only subject key/u],
    ['embedded category-set ID', 'landmark:target-a-2', /set-shaped subject key/u],
  ])('rejects a %s instead of counting it as a distinct subject', (_kind, subjectKey, message) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 1, {
      ...base.questions[1]!,
      subjectKey,
    });

    expect(() => validatePlayableCorpus([changed], [expected])).toThrowError(message);
  });

  it('allows a canonical subject key with meaningful namespace and slug', () => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 1, {
      ...base.questions[1]!,
      subjectKey: 'person:ada-lovelace',
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it.each(['element:118', 'year:1969', 'mission:11'])(
    'allows the meaningful numeric subject key %s',
    (subjectKey) => {
      const expected = target('target-a');
      const base = category(expected);
      const changed = replaceQuestion(base, 1, {
        ...base.questions[1]!,
        subjectKey,
      });

      expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
    },
  );

  it('rejects normalized duplicate titles in either language across categories', () => {
    const targets = [target('target-a'), target('target-b')];
    const first = category(targets[0]!);
    const second = category(targets[1]!);

    expect(() => validatePlayableCorpus([
      first,
      { ...second, name: { ...second.name, en: `  ${first.name.en.toUpperCase()}! ` } },
    ], targets)).toThrowError(/Duplicate English category title/u);
    expect(() => validatePlayableCorpus([
      first,
      { ...second, name: { ...second.name, et: `  ${first.name.et.toUpperCase()}! ` } },
    ], targets)).toThrowError(/Duplicate Estonian category title/u);
  });

  it.each([
    'Mix',
    'Medley',
    'Tour',
    'Grab Bag',
    'Roundup',
    'Sampler',
    'Potpourri',
    'Challenge',
    'Quiz',
    'Odds & Ends',
  ])('rejects the generic filler title %s even with a pack prefix and numeric suffix', (filler) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = {
      ...base,
      name: { ...base.name, en: `History: ${filler} 12` },
    };

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/generic English category title/u);
  });

  it.each(['Varia', 'Mitmesugust'])(
    'rejects the generic Estonian filler title %s',
    (filler) => {
      const expected = target('target-a');
      const base = category(expected);
      const changed = { ...base, name: { ...base.name, et: filler } };

      expect(() => validatePlayableCorpus([changed], [expected]))
        .toThrowError(/generic Estonian category title/u);
    },
  );

  it('allows a meaningful one-word title', () => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = { ...base, name: { en: 'Volcanoes', et: 'Vulkaanid' } };

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('rejects duplicate question and fact keys across categories', () => {
    const targets = [target('target-a'), target('target-b')];
    const first = category(targets[0]!);
    const second = category(targets[1]!);
    const firstItem = firstQuestion(first);
    const secondItem = firstQuestion(second);

    expect(() => validatePlayableCorpus([
      first,
      replaceQuestion(second, 0, { ...secondItem, key: firstItem.key }),
    ], targets)).toThrowError(/Duplicate question key/u);
    expect(() => validatePlayableCorpus([
      first,
      replaceQuestion(second, 0, { ...secondItem, factKey: firstItem.factKey }),
    ], targets)).toThrowError(/Duplicate fact key/u);
  });

  it.each([
    ['English category title', (item: PlayableCategory) => ({ ...item, name: { ...item.name, en: ' ' } })],
    ['Estonian category title', (item: PlayableCategory) => ({ ...item, name: { ...item.name, et: ' ' } })],
    ['English clue', (item: PlayableCategory) => replaceQuestion(item, 0, {
      ...firstQuestion(item), clue: { ...firstQuestion(item).clue, en: ' ' },
    })],
    ['symbol-only English clue', (item: PlayableCategory) => replaceQuestion(item, 0, {
      ...firstQuestion(item), clue: { ...firstQuestion(item).clue, en: '+++' },
    })],
    ['Estonian response', (item: PlayableCategory) => replaceQuestion(item, 0, {
      ...firstQuestion(item), response: { ...firstQuestion(item).response, et: ' ' },
    })],
    ['English explanation', (item: PlayableCategory) => replaceQuestion(item, 0, {
      ...firstQuestion(item), explanation: { ...firstQuestion(item).explanation, en: ' ' },
    })],
  ])('rejects an empty bilingual %s field', (_field, mutate) => {
    const expected = target('target-a');
    expect(() => validatePlayableCorpus([mutate(category(expected))], [expected]))
      .toThrowError(/empty (?:English|Estonian)/u);
  });

  it('requires complete, non-empty bilingual accepted-variant arrays', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);

    expect(() => validatePlayableCorpus([replaceQuestion(base, 0, {
      ...first,
      acceptedVariants: { en: ['Alias'], et: [] },
    })], [expected])).toThrowError(/must provide bilingual accepted variants/u);
    expect(() => validatePlayableCorpus([replaceQuestion(base, 0, {
      ...first,
      acceptedVariants: { en: [' '], et: ['Alias'] },
    })], [expected])).toThrowError(/empty English accepted variant/u);
  });

  it.each([
    ['source ID', { sourceId: '' }],
    ['title', { title: '' }],
    ['license', { license: '' }],
    ['HTTPS URL', { url: 'http://example.com/source' }],
    ['calendar date', { retrievedAt: '2026-02-30' }],
  ])('rejects an invalid source %s', (_field, sourceChange) => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const changed = replaceQuestion(base, 0, {
      ...first,
      source: { ...first.source, ...sourceChange },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/has an invalid source/u);
  });

  it.each([
    ['root URL', 'https://example.com/'],
    ['root URL with tracking parameters', 'https://example.com/?source=quiz'],
    ['generic home path', 'https://example.com/home'],
    ['generic index path', 'https://example.com/index.html'],
    ['generic HTML home filename', 'https://example.com/home.html'],
    ['generic HTML homepage filename', 'https://example.com/homepage.html'],
    ['generic PHP index filename', 'https://example.com/index.php'],
    ['generic ASPX default filename', 'https://example.com/default.aspx'],
  ])('rejects a structurally generic source %s', (_kind, url) => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const changed = replaceQuestion(base, 0, {
      ...first,
      source: { ...first.source, url },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/has an invalid source/u);
  });

  it('allows a deep HTTPS source URL with a query and fragment', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const changed = replaceQuestion(base, 0, {
      ...first,
      source: {
        ...first.source,
        url: 'https://example.com/articles/prague?language=en#history',
      },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('allows a deep source whose final filename happens to be index.php', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const changed = replaceQuestion(base, 0, {
      ...first,
      source: {
        ...first.source,
        url: 'https://example.com/archive/index.php?article=prague',
      },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it.each([
    ['English clue', { clue: { en: 'Which city is Prague?', et: 'Millist pealinna kirjeldab vihje?' }, response: { en: 'Prague', et: 'Praha' } }],
    ['Estonian clue', { clue: { en: 'Which capital is described?', et: 'Milline linn on Praha?' }, response: { en: 'Prague', et: 'Praha' } }],
  ])('rejects an answer leaked in the %s', (_field, text) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, { ...firstQuestion(base), ...text });
    expect(() => validatePlayableCorpus([changed], [expected])).toThrowError(/leaks its/u);
  });

  it.each([
    ['English title', { name: { en: 'Cities including Prague', et: 'Euroopa pealinnad' }, response: { en: 'Prague', et: 'Praha' } }],
    ['Estonian title', { name: { en: 'European capitals', et: 'Linnad, sealhulgas Praha' }, response: { en: 'Prague', et: 'Praha' } }],
  ])('rejects an answer leaked in the %s', (_field, fixture) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(
      { ...base, name: fixture.name },
      0,
      { ...firstQuestion(base), response: fixture.response },
    );
    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/leaks its .* response in the category title/u);
  });

  it('rejects accepted answer variants leaked in either the clue or category title', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const answer = {
      response: { en: 'United States of America', et: 'Ameerika Ühendriigid' },
      acceptedVariants: { en: ['USA'], et: ['USA'] },
    } as const;
    const clueLeak = replaceQuestion(base, 0, {
      ...first,
      ...answer,
      clue: {
        en: 'Which country is abbreviated USA?',
        et: 'Millist riiki kirjeldab see lühend?',
      },
    });
    const titleLeak = replaceQuestion(
      { ...base, name: { en: 'American Abbreviations', et: 'USA ajalugu' } },
      0,
      { ...first, ...answer },
    );

    expect(() => validatePlayableCorpus([clueLeak], [expected]))
      .toThrowError(/leaks its English accepted variant in the clue/u);
    expect(() => validatePlayableCorpus([titleLeak], [expected]))
      .toThrowError(/leaks its Estonian accepted variant in the category title/u);
  });

  it.each([
    ['C++', 'Which language added classes to C and became a major systems language?'],
    ['C#', 'Which Microsoft language drew syntax and ideas from C for the .NET platform?'],
  ])('does not reduce the fair technical answer %s to the language C', (response, clue) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en: clue, et: 'Milline programmeerimiskeel on siin kirjeldatud?' },
      response: { en: response, et: response },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it.each([
    ['English binary', { en: 'Is basalt an igneous rock?', et: 'Milline kivim on basalt?' }],
    ['English multiple choice', { en: 'Which of these is igneous: basalt or marble?', et: 'Milline kivim on basalt?' }],
    ['Estonian binary', { en: 'Which kind of rock is basalt?', et: 'Kas basalt on tardkivim?' }],
    ['Estonian multiple choice', { en: 'Which kind of rock is basalt?', et: 'Milline neist on tardkivim: basalt või marmor?' }],
  ])('rejects a %s prompt', (_kind, clue) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue,
      response: { en: 'Igneous rock', et: 'Tardkivim' },
    });
    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/binary or multiple-choice/u);
  });

  it.each([
    [
      'English comparative choice',
      { en: 'Which is larger, the Baltic Sea or Lake Peipus?', et: 'Milline veekogu on suurem?' },
      { en: 'The Baltic Sea', et: 'Läänemeri' },
    ],
    [
      'Estonian kumb choice',
      { en: 'Which body of water is larger?', et: 'Kumb on suurem, Läänemeri või Peipsi järv?' },
      { en: 'The Baltic Sea', et: 'Läänemeri' },
    ],
    [
      'Estonian verb-first yes/no',
      { en: 'Name Estonia’s relationship to the European Union.', et: 'Kuulub Eesti Euroopa Liitu?' },
      { en: 'Membership', et: 'Jah' },
    ],
  ])('rejects a common %s prompt form', (_kind, clue, response) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue,
      response,
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/binary or multiple-choice/u);
  });

  it.each([
    [
      'English true/false instruction',
      { en: 'Answer true or false: basalt is an igneous rock.', et: 'Millist kivimit kirjeldatakse?' },
      { en: 'True', et: 'Tõene' },
    ],
    [
      'Estonian yes/no instruction',
      { en: 'Identify the requested response format.', et: 'Vasta jah või ei: basalt on tardkivim.' },
      { en: 'Yes', et: 'Jah' },
    ],
  ])('rejects an imperative %s', (_kind, clue, response) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue,
      response,
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/binary or multiple-choice/u);
  });

  it.each([
    [
      'Asub',
      'Asub Pariisis ja valmis 1889. aastal. Mis ehitis see on?',
      'The Eiffel Tower',
      'Eiffeli torn',
    ],
    [
      'Sisaldab',
      'Sisaldab 14 rida ja kindla riimiskeemi. Mis luulevorm see on?',
      'A sonnet',
      'Sonett',
    ],
    [
      'Tähendab',
      'Tähendab eluslooduse mitmekesisust. Mis termin see on?',
      'Biodiversity',
      'Elurikkus',
    ],
  ])('allows open-answer Estonian prose beginning with %s', (_verb, et, enResponse, etResponse) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en: 'Which subject is described?', et },
      response: { en: enResponse, et: etResponse },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('allows an or-construction that describes a concept instead of offering answer choices', () => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Which logical term names a statement that is either true or false?',
        et: 'Milline loogikatermin tähistab väidet, mis on kas tõene või väär?',
      },
      response: { en: 'Proposition', et: 'Propositsioon' },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('allows current as a stable noun rather than a current-time cue', () => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Which ocean current warms Western Europe?',
        et: 'Milline hoovus soojendab Lääne-Euroopat?',
      },
      response: { en: 'The Gulf Stream', et: 'Golfi hoovus' },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('allows an ocean-current superlative as stable natural-world trivia', () => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Which ocean current has the highest volume flow?',
        et: 'Millisel ookeanihoovusel on suurim vooluhulk?',
      },
      response: {
        en: 'The Antarctic Circumpolar Current',
        et: 'Antarktika ringhoovus',
      },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('rejects undated changing facts and accepts an explicit as-of date', () => {
    const expected = target('target-a');
    const base = category(expected);
    const undated = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Who is currently the president of Exampleland?',
        et: 'Kes on praegu Näitemaa president?',
      },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });
    const dated = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'As of 2024, who is the president of Exampleland?',
        et: 'Kes on 2024. aasta seisuga Näitemaa president?',
      },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(() => validatePlayableCorpus([undated], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
    expect(validatePlayableCorpus([dated], [expected])).toEqual([dated]);
  });

  it.each([
    [
      'English',
      'As of 2024; who is the current president of Exampleland?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian',
      'Which officeholder is described?',
      '2024. aasta seisuga; kes on Näitemaa praegune president?',
    ],
  ])('accepts a pure %s as-of preamble before a semicolon', (_language, en, et) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en, et },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('rejects an undated changing relation even without a current-time keyword', () => {
    const expected = target('target-a');
    const base = category(expected);
    const undated = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Which country has the largest population?',
        et: 'Millisel riigil on suurim rahvaarv?',
      },
      response: { en: 'India', et: 'India' },
    });

    expect(() => validatePlayableCorpus([undated], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
  });

  it.each([
    ['tallest building', 'Which building is the tallest in the world?', 'Burj Khalifa'],
    ['current record holder', 'Who is the current record holder in the men’s 100 metres?', 'Example Sprinter'],
    ['current world record holder', 'Who is the current world record holder in the men’s 100 metres?', 'Example Sprinter'],
    ['current Formula One world champion', 'Who is the current Formula One world champion?', 'Example Driver'],
  ])('rejects an undated changing %s superlative', (_kind, clue, response) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en: clue, et: 'Millist ajas muutuvat fakti siin küsitakse?' },
      response: { en: response, et: 'Näidisvastus' },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
  });

  it('accepts dated role phrasing beyond the as-of form in both languages', () => {
    const expected = target('target-a');
    const base = category(expected);
    const dated = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Who is the president of Exampleland in 2024?',
        et: 'Kes on Näitemaa president 2024. aastal?',
      },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(validatePlayableCorpus([dated], [expected])).toEqual([dated]);
  });

  it.each([
    [
      'English',
      'Who is the president of Exampleland on January 1, 2024?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian',
      'Which officeholder is described?',
      'Kes on Näitemaa president 1. jaanuaril 2024?',
    ],
  ])('accepts a changing role framed by an explicit %s calendar date', (_language, en, et) => {
    const expected = target('target-a');
    const base = category(expected);
    const dated = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en, et },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(validatePlayableCorpus([dated], [expected])).toEqual([dated]);
  });

  it.each([
    [
      'English impossible day',
      'Who is the president of Exampleland on February 31, 2024?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'English non-leap day',
      'Who is the president of Exampleland on February 29, 2023?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian impossible day',
      'Which officeholder is described?',
      'Kes on Näitemaa president 31. veebruaril 2024?',
    ],
    [
      'Estonian non-leap day',
      'Which officeholder is described?',
      'Kes on Näitemaa president 29. veebruaril 2023?',
    ],
  ])('rejects a changing role framed by an %s', (_kind, en, et) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en, et },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
  });

  it.each([
    [
      'English',
      'Who is the president of Exampleland on February 29, 2024?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian',
      'Which officeholder is described?',
      'Kes on Näitemaa president 29. veebruaril 2024?',
    ],
  ])('accepts a changing role on a valid %s leap day', (_language, en, et) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en, et },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it('does not let an unrelated calendar date frame a current officeholder', () => {
    const expected = target('target-a');
    const base = category(expected);
    const undatedCurrentRole = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Founded on January 1, 1900, who is currently the chief executive of Example Company?',
        et: 'Kes on 1. jaanuaril 1900 asutatud Näidisettevõtte praegune tegevjuht?',
      },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(() => validatePlayableCorpus([undatedCurrentRole], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
  });

  it.each([
    [
      'English',
      'Staffing was recorded as of 1900; who is currently the CEO of Example Company?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian',
      'Which officeholder is described?',
      'Töötajate arv fikseeriti 1900. aasta seisuga; kes on praegu Näidisettevõtte tegevjuht?',
    ],
  ])('does not let an unrelated as-of date frame a current %s officeholder', (_language, en, et) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en, et },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
  });

  it.each([
    ['sentence and Name starter', 'Staffing was recorded as of 1900. Name the current CEO of Example Company.'],
    ['comma and Identify starter', 'Staffing was recorded as of 1900, Identify the current CEO of Example Company.'],
    ['dash and Identify starter', 'Staffing was recorded as of 1900 — Identify the current CEO of Example Company.'],
  ])('does not let unrelated dated prose cross a %s', (_kind, clue) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: { en: clue, et: 'Milline ametikoht on siin kirjeldatud?' },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
  });

  it('does not let an unrelated historic year date a current officeholder', () => {
    const expected = target('target-a');
    const base = category(expected);
    const undatedCurrentRole = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Founded in 1900, who is currently the chief executive of Example Company?',
        et: 'Kes on 1900. aastal asutatud Näidisettevõtte praegune tegevjuht?',
      },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(() => validatePlayableCorpus([undatedCurrentRole], [expected]))
      .toThrowError(/asks about an unstable fact without an explicit date/u);
  });

  it('allows a stable natural-world superlative outside the changing-fact patterns', () => {
    const expected = target('target-a');
    const base = category(expected);
    const stable = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: 'Which mountain is the tallest above sea level?',
        et: 'Milline mägi on merepinnast mõõdetuna kõrgeim?',
      },
      response: { en: 'Mount Everest', et: 'Mount Everest' },
    });

    expect(validatePlayableCorpus([stable], [expected])).toEqual([stable]);
  });

  it('rejects the same normalized clue/answer pair within one category', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const second = base.questions[1]!;
    const changed = replaceQuestion(base, 1, {
      ...second,
      clue: { en: first.clue.en.toUpperCase(), et: first.clue.et.toUpperCase() },
      response: { en: `${first.response.en}!`, et: `${first.response.et}!` },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/Duplicate clue\/answer pair within category target-a/u);
  });

  it('rejects the same normalized clue/answer pair across categories', () => {
    const targets = [target('target-a'), target('target-b')];
    const first = category(targets[0]!);
    const second = category(targets[1]!);
    const firstItem = firstQuestion(first);
    const secondItem = firstQuestion(second);
    const duplicate = replaceQuestion(second, 0, {
      ...secondItem,
      clue: firstItem.clue,
      response: firstItem.response,
    });

    expect(() => validatePlayableCorpus([first, duplicate], targets))
      .toThrowError(/Duplicate clue\/answer pair across categories/u);
  });

  it('rejects a local English duplicate even when the Estonian wording differs', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const second = base.questions[1]!;
    const changed = replaceQuestion(base, 1, {
      ...second,
      clue: { ...second.clue, en: first.clue.en.toUpperCase() },
      response: { ...second.response, en: `${first.response.en}!` },
    });

    expect(() => validatePlayableCorpus([changed], [expected]))
      .toThrowError(/Duplicate clue\/answer pair within category target-a \(English\)/u);
  });

  it('rejects a global Estonian duplicate even when the English wording differs', () => {
    const targets = [target('target-a'), target('target-b')];
    const first = category(targets[0]!);
    const second = category(targets[1]!);
    const firstItem = firstQuestion(first);
    const secondItem = firstQuestion(second);
    const duplicate = replaceQuestion(second, 0, {
      ...secondItem,
      clue: { ...secondItem.clue, et: firstItem.clue.et.toUpperCase() },
      response: { ...secondItem.response, et: `${firstItem.response.et}!` },
    });

    expect(() => validatePlayableCorpus([first, duplicate], targets))
      .toThrowError(/Duplicate clue\/answer pair across categories \(Estonian\)/u);
  });

  it('allows a repeated response when each language supplies a distinct clue', () => {
    const expected = target('target-a');
    const base = category(expected);
    const first = firstQuestion(base);
    const second = base.questions[1]!;
    const changed = replaceQuestion(base, 1, {
      ...second,
      response: first.response,
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });
});
