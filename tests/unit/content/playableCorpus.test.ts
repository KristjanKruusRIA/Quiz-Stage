import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { afterEach, describe, expect, it } from 'vitest';
import { applyPlayableCorpus } from '../../../scripts/content/playability/apply';
import {
  loadPlayableCorpus,
  parsePlayableCorpusArgs,
  publishPlayableCorpusStage,
  stagePlayableCorpus,
} from '../../../scripts/content/applyPlayableCorpus';
import type { ContentEvidence } from '../../../scripts/content/evidence';
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

type ApplyFixture = Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  targets: readonly PlayableTarget[];
  categories: readonly PlayableCategory[];
}>;

function applyRow(
  categorySetId: string,
  tier: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  packId = 'built-in-history',
): Record<string, string> {
  return {
    clue_id: `old-${categorySetId}-${tier}`,
    pack_id: packId,
    pack_name: 'Fixture Pack',
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
    source_url: 'https://example.com/old/source',
    source_license: 'CC-BY-4.0',
    source_retrieved_at: '2026-08-01',
    translation_status: 'reviewed',
    enabled: 'true',
  };
}

function applyEvidence(
  row: Readonly<Record<string, string>>,
  batchId = '01-history',
  candidateId?: string,
): ContentEvidence {
  return {
    version: 1,
    clueId: row.clue_id!,
    batchId,
    factKey: `old-fact:${row.clue_id}`,
    subjectKey: `old-subject:${row.clue_id}`,
    assertion: `Old assertion for ${row.clue_id}`,
    origin: candidateId === undefined ? 'compatibleOpen' : 'openTdbInspired',
    authoring: { author: 'Original Author', authoredAt: '2026-08-01T08:00:00.000Z' },
    supportingSource: {
      sourceId: `old-source:${row.clue_id}`,
      title: 'Old source',
      url: 'https://example.com/old/source',
      license: 'CC-BY-4.0',
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
    adultPolicyReview: null,
  };
}

function applyFixture(): ApplyFixture {
  const targets = [target('target-a'), target('target-b', 'hard')];
  const targetA = category(targets[0]!);
  const first = firstQuestion(targetA);
  const categories = [
    category(targets[1]!),
    {
      ...targetA,
      questions: [
        {
          ...first,
          acceptedVariants: {
            en: ['Alias; one', 'Back\\slash'],
            et: ['Alias; üks', 'Kald\\kriips'],
          },
        },
        ...targetA.questions.slice(1),
      ],
    },
  ];
  const rows = [
    applyRow('target-b', 5, 'hard'),
    applyRow('retained-easy', 1, 'easy'),
    applyRow('target-a', 3),
    applyRow('target-b', 1, 'hard'),
    applyRow('target-a', 1),
    applyRow('target-a', 2),
    applyRow('target-a', 4),
    applyRow('target-a', 5),
    applyRow('retained-easy', 2, 'easy'),
    applyRow('retained-easy', 3, 'easy'),
    applyRow('retained-easy', 4, 'easy'),
    applyRow('retained-easy', 5, 'easy'),
    applyRow('target-b', 2, 'hard'),
    applyRow('target-b', 3, 'hard'),
    applyRow('target-b', 4, 'hard'),
  ];
  return {
    authoredRows: rows.map((row) => ({ ...row, category_name_et: '' })),
    generatedRows: rows.map((row) => ({ ...row })),
    evidence: rows.map((row) => applyEvidence(
      row,
      '01-history',
      row.clue_id === 'old-target-a-2'
        ? 'candidate-a-2'
        : row.clue_id === 'old-target-b-4' ? 'candidate-b-4' : undefined,
    )),
    targets,
    categories,
  };
}

type StagingFixture = Readonly<{
  acceptedRoot: string;
  outputRoot: string;
  categories: readonly PlayableCategory[];
  targets: readonly PlayableTarget[];
}>;

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'playable-corpus-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeRows(path: string, rows: readonly Record<string, string>[]): void {
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
  const categories: PlayableCategory[] = [];
  const targets: PlayableTarget[] = [];
  for (const batchId of ACCEPTED_BATCHES) {
    const slug = batchId.replace(/^\d+-/u, '');
    const packId = `built-in-${slug}`;
    const batchTargets = PLAYABLE_TARGETS.filter((targetItem) => targetItem.batchId === batchId);
    targets.push(...batchTargets);
    categories.push(...batchTargets.map(category));
    const targetRows = batchTargets.flatMap((targetItem) =>
      [1, 2, 3, 4, 5].map((tier) => applyRow(
        targetItem.categorySetId,
        tier,
        targetItem.difficulty,
        targetItem.packId,
      )));
    const easyRows = [1, 2, 3, 4, 5].map((tier) => applyRow(
      `${packId}-easy`,
      tier,
      'easy',
      packId,
    ));
    const rows = [...targetRows, ...easyRows];
    writeRows(
      resolve(acceptedRoot, `content/authored/${batchId}.csv`),
      rows.map((row) => ({ ...row, category_name_et: '' })),
    );
    writeRows(resolve(acceptedRoot, `content/generated/${batchId}.en-et.csv`), rows);
    mkdirSync(resolve(acceptedRoot, 'content/evidence'), { recursive: true });
    const targetIds = new Set<string>(batchTargets.map(({ categorySetId }) => categorySetId));
    const evidence = rows.map((row) => applyEvidence(
      row,
      batchId,
      targetIds.has(row.category_set_id) && row.tier === '1'
        ? `candidate-${row.category_set_id}`
        : undefined,
    ));
    writeFileSync(
      resolve(acceptedRoot, `content/evidence/${batchId}.jsonl`),
      evidence.map((record) => `${JSON.stringify(record)}\n`).join(''),
    );
  }
  return { acceptedRoot, outputRoot, categories, targets };
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
    'Who is the current U.S. president?',
    'Name the current U.S. president.',
  ])('rejects an undated current role with a dotted modifier: %s', (clue) => {
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

  it.each([
    ['reviewed current-role wording', 'As of 2024, who is the current U.S. president?'],
    ['explicit current-time cue', 'As of 2024, who is currently the U.S. president?'],
  ])('accepts a leading as-of preamble before an abbreviation with %s', (_kind, clue) => {
    const expected = target('target-a');
    const base = category(expected);
    const changed = replaceQuestion(base, 0, {
      ...firstQuestion(base),
      clue: {
        en: clue,
        et: 'Milline ametikoht on siin kirjeldatud?',
      },
      response: { en: 'Jane Citizen', et: 'Jane Citizen' },
    });

    expect(validatePlayableCorpus([changed], [expected])).toEqual([changed]);
  });

  it.each([
    [
      'English',
      'As of 2024, according to the official register, who is the current president?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian',
      'Which officeholder is described?',
      '2024. aasta seisuga, ametliku registri järgi, kes on praegune president?',
    ],
  ])('accepts a leading %s as-of preamble before an intervening phrase', (_language, en, et) => {
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
      'As of 1900, staffing was ten. Who is currently the CEO?',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian',
      'Which officeholder is described?',
      '1900. aasta seisuga oli töötajaid kümme. Kes on praegu tegevjuht?',
    ],
  ])('does not let a leading %s date preamble cross a sentence boundary', (_language, en, et) => {
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
      'English opening quote',
      'As of 1900, staffing was ten. “Who is currently the CEO?”',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'English opening bracket',
      'As of 1900, staffing was ten. [Who is currently the CEO?]',
      'Milline ametikoht on siin kirjeldatud?',
    ],
    [
      'Estonian opening quote',
      'Which officeholder is described?',
      '1900. aasta seisuga, töötajaid oli kümme. „Kes on praegu tegevjuht?”',
    ],
    [
      'Estonian opening bracket',
      'Which officeholder is described?',
      '1900. aasta seisuga, töötajaid oli kümme. (Kes on praegu tegevjuht?)',
    ],
  ])('does not let a leading date cross an %s', (_kind, en, et) => {
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

describe('applyPlayableCorpus', () => {
  it('preserves target slots while replacing bilingual content and inspiration deterministically', () => {
    const fixture = applyFixture();
    const authoredBefore = structuredClone(fixture.authoredRows);
    const generatedBefore = structuredClone(fixture.generatedRows);
    const evidenceBefore = structuredClone(fixture.evidence);

    const result = applyPlayableCorpus(fixture);

    expect(result.replacedClueIds).toEqual([
      'old-target-a-1', 'old-target-a-2', 'old-target-a-3', 'old-target-a-4',
      'old-target-a-5', 'old-target-b-1', 'old-target-b-2', 'old-target-b-3',
      'old-target-b-4', 'old-target-b-5',
    ]);
    expect(result.authoredRows).toHaveLength(fixture.authoredRows.length);
    expect(result.generatedRows).toHaveLength(fixture.generatedRows.length);
    const targetA1Index = fixture.generatedRows.findIndex((row) =>
      row.category_set_id === 'target-a' && row.tier === '1');
    expect(result.generatedRows[targetA1Index]).toEqual({
      ...fixture.generatedRows[targetA1Index],
      clue_id: 'built-in-history-playable-corpus-001',
      category_name_en: 'Knowledge theme target-a',
      category_name_et: 'Teadmisteema target-a',
      clue_en: 'Which landmark matches clue 1 for target-a?',
      clue_et: 'Milline vaatamisväärsus sobib vihjega 1 kategoorias target-a?',
      response_en: 'Answer target-a 1',
      response_et: 'Vastus target-a 1',
      accepted_variants_en: 'Alias\\; one;Back\\\\slash',
      accepted_variants_et: 'Alias\\; üks;Kald\\\\kriips',
      explanation_en: 'This explains fact 1 for target-a.',
      explanation_et: 'See selgitab fakti 1 kategoorias target-a.',
      source_title: 'Reference target-a 1',
      source_url: 'https://example.com/target-a/1',
      source_license: 'CC-BY-4.0',
      source_retrieved_at: '2026-08-28',
      translation_status: 'reviewed',
    });
    expect(result.authoredRows[targetA1Index]).toEqual({
      ...result.generatedRows[targetA1Index],
      category_name_et: '',
    });

    const retainedIndexes = fixture.generatedRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.difficulty === 'easy')
      .map(({ index }) => index);
    for (const index of retainedIndexes) {
      expect(result.generatedRows[index]).toEqual(fixture.generatedRows[index]);
      expect(result.authoredRows[index]).toEqual(fixture.authoredRows[index]);
    }
    for (const index of fixture.generatedRows.keys()) {
      for (const field of [
        'pack_id', 'pack_name', 'category_set_id', 'content_kind', 'round', 'tier',
        'difficulty', 'macro_topic', 'enabled',
      ]) {
        expect(result.generatedRows[index]![field]).toBe(fixture.generatedRows[index]![field]);
      }
    }

    expect(result.evidence.map(({ clueId }) => clueId)).toEqual([
      'built-in-history-playable-corpus-001',
      'built-in-history-playable-corpus-002',
      'built-in-history-playable-corpus-003',
      'built-in-history-playable-corpus-004',
      'built-in-history-playable-corpus-005',
      'built-in-history-playable-corpus-006',
      'built-in-history-playable-corpus-007',
      'built-in-history-playable-corpus-008',
      'built-in-history-playable-corpus-009',
      'built-in-history-playable-corpus-010',
      'old-retained-easy-1',
      'old-retained-easy-2',
      'old-retained-easy-3',
      'old-retained-easy-4',
      'old-retained-easy-5',
    ]);
    expect(result.evidence.find(({ clueId }) =>
      clueId === 'built-in-history-playable-corpus-002')).toMatchObject({
        clueId: 'built-in-history-playable-corpus-002',
        batchId: '01-history',
        factKey: 'target-a:fact:2',
        subjectKey: 'landmark:fixture-a-2',
        origin: 'openTdbInspired',
        inspiration: {
          system: 'OpenTDB',
          candidateId: 'candidate-a-2',
          license: 'CC-BY-SA-4.0',
        },
      });
    expect(fixture.authoredRows).toEqual(authoredBefore);
    expect(fixture.generatedRows).toEqual(generatedBefore);
    expect(fixture.evidence).toEqual(evidenceBefore);
  });

  it('is idempotent and keeps replacement IDs in target-ledger order', () => {
    const fixture = applyFixture();
    const first = applyPlayableCorpus(fixture);

    const second = applyPlayableCorpus({
      ...fixture,
      authoredRows: first.authoredRows,
      generatedRows: first.generatedRows,
      evidence: first.evidence,
    });

    expect(second.authoredRows).toEqual(first.authoredRows);
    expect(second.generatedRows).toEqual(first.generatedRows);
    expect(second.evidence).toEqual(first.evidence);
    expect(second.replacedClueIds).toEqual([
      'built-in-history-playable-corpus-001',
      'built-in-history-playable-corpus-002',
      'built-in-history-playable-corpus-003',
      'built-in-history-playable-corpus-004',
      'built-in-history-playable-corpus-005',
      'built-in-history-playable-corpus-006',
      'built-in-history-playable-corpus-007',
      'built-in-history-playable-corpus-008',
      'built-in-history-playable-corpus-009',
      'built-in-history-playable-corpus-010',
    ]);
  });

  it('rejects missing and extra replacement categories', () => {
    const fixture = applyFixture();
    expect(() => applyPlayableCorpus({
      ...fixture,
      categories: fixture.categories.slice(0, 1),
    })).toThrowError('Expected 2 playable categories; found 1');

    expect(() => applyPlayableCorpus({
      ...fixture,
      categories: [fixture.categories[0]!, category(target('target-extra'))],
    })).toThrowError('Category target-extra is not present in the target ledger');
  });

  it('rejects target rows without exactly one stable slot for tiers one through five', () => {
    const fixture = applyFixture();
    const duplicateTier = (row: Readonly<Record<string, string>>) =>
      row.clue_id === 'old-target-a-3' ? { ...row, tier: '2' } : row;
    expect(() => applyPlayableCorpus({
      ...fixture,
      authoredRows: fixture.authoredRows.map(duplicateTier),
      generatedRows: fixture.generatedRows.map(duplicateTier),
    })).toThrowError('Target target-a must contain tiers 1,2,3,4,5; found 1,2,2,4,5');
  });

  it.each(['missing', 'extra'] as const)('rejects %s evidence inventory', (kind) => {
    const fixture = applyFixture();
    const evidence = kind === 'missing'
      ? fixture.evidence.filter(({ clueId }) => clueId !== 'old-retained-easy-1')
      : [
          ...fixture.evidence,
          { ...fixture.evidence[0]!, clueId: 'orphan-evidence', factKey: 'orphan-fact' },
        ];
    expect(() => applyPlayableCorpus({ ...fixture, evidence })).toThrowError(
      kind === 'missing'
        ? 'Missing evidence for input clue: old-retained-easy-1'
        : 'Evidence has no input clue: orphan-evidence',
    );
  });

  it('rejects per-difficulty OpenTDB inspiration quota drift', () => {
    const fixture = applyFixture();
    const evidence = fixture.evidence.map((record) => record.clueId === 'old-target-a-2'
      ? { ...record, origin: 'compatibleOpen' as const, inspiration: null }
      : record);

    expect(() => applyPlayableCorpus({ ...fixture, evidence })).toThrowError(
      'Expected 1 OpenTDB-inspired medium target clues; found 0',
    );
  });

  it('rejects duplicate input clue IDs and OpenTDB inspiration ownership', () => {
    const fixture = applyFixture();
    const duplicateId = (row: Readonly<Record<string, string>>) =>
      row.clue_id === 'old-retained-easy-1' ? { ...row, clue_id: 'old-target-a-1' } : row;
    expect(() => applyPlayableCorpus({
      ...fixture,
      authoredRows: fixture.authoredRows.map(duplicateId),
      generatedRows: fixture.generatedRows.map(duplicateId),
    })).toThrowError('Duplicate input clue ID: old-target-a-1');

    const duplicateInspiration = fixture.evidence.map((record) =>
      record.clueId === 'old-target-b-4' && record.inspiration !== null
        ? {
            ...record,
            inspiration: { ...record.inspiration, candidateId: 'candidate-a-2' },
          }
        : record);
    expect(() => applyPlayableCorpus({ ...fixture, evidence: duplicateInspiration }))
      .toThrowError('OpenTDB candidate reused: candidate-a-2');
  });

  it('rejects authored/generated structural inventory drift', () => {
    const fixture = applyFixture();
    const generatedRows = fixture.generatedRows.map((row, index) =>
      index === 0 ? { ...row, round: 'round-one' } : row);
    expect(() => applyPlayableCorpus({ ...fixture, generatedRows })).toThrowError(
      'Authored/generated inventory differs at row 0',
    );
  });
});

describe('playable corpus staging and publishing', () => {
  it('stages the complete 12-batch, 36-artifact tree without accepted writes', () => {
    const fixture = stagingFixture();
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);

    const result = stagePlayableCorpus(fixture);

    expect(result.artifactPaths).toHaveLength(36);
    expect(result.replacedClueIds).toHaveLength(4_000);
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
    for (const batchId of ACCEPTED_BATCHES) {
      const stagedPath = resolve(fixture.outputRoot, `generated/${batchId}.en-et.csv`);
      expect(existsSync(stagedPath)).toBe(true);
      const rows = parse(readFileSync(stagedPath, 'utf8'), {
        columns: true,
        skip_empty_lines: true,
      }) as Array<Record<string, string>>;
      const batchTargets = PLAYABLE_TARGETS.filter((targetItem) => targetItem.batchId === batchId);
      const targetIds = new Set<string>(batchTargets.map(({ categorySetId }) => categorySetId));
      const expectedIds = batchTargets.flatMap((targetItem, targetIndex) =>
        [1, 2, 3, 4, 5].map((tier) =>
          `${targetItem.packId}-playable-corpus-${(targetIndex * 5 + tier).toString().padStart(3, '0')}`));
      expect(rows.filter((row) => targetIds.has(row.category_set_id)).map(({ clue_id }) => clue_id))
        .toEqual(expectedIds);
    }
  }, 20_000);

  it('rejects a coherent partial ledger before staging any filesystem output', () => {
    const fixture = stagingFixture();
    const removed = fixture.targets.at(-1)!;

    expect(() => stagePlayableCorpus({
      ...fixture,
      targets: fixture.targets.slice(0, -1),
      categories: fixture.categories.filter((item) =>
        item.categorySetId !== removed.categorySetId),
    })).toThrowError('Expected 800 canonical playable targets; found 799');
    expect(existsSync(fixture.outputRoot)).toBe(false);
  });

  it.each([
    ['reordered', (fixture: StagingFixture) => ({
      ...fixture,
      targets: [fixture.targets[1]!, fixture.targets[0]!, ...fixture.targets.slice(2)],
    })],
    ['extra', (fixture: StagingFixture) => {
      const extra = target('built-in-history-extra');
      return {
        ...fixture,
        targets: [...fixture.targets, extra],
        categories: [...fixture.categories, category(extra)],
      };
    }],
    ['difficulty-mismatched', (fixture: StagingFixture) => {
      const changed = { ...fixture.targets[0]!, difficulty: 'medium' as const };
      return {
        ...fixture,
        targets: [changed, ...fixture.targets.slice(1)],
        categories: fixture.categories.map((item) =>
          item.categorySetId === changed.categorySetId ? { ...item, difficulty: 'medium' as const } : item),
      };
    }],
    ['batch-mismatched', (fixture: StagingFixture) => {
      const changed = { ...fixture.targets[0]!, batchId: '02-geography' };
      return {
        ...fixture,
        targets: [changed, ...fixture.targets.slice(1)],
        categories: fixture.categories.map((item) =>
          item.categorySetId === changed.categorySetId ? { ...item, batchId: '02-geography' } : item),
      };
    }],
    ['pack-mismatched', (fixture: StagingFixture) => {
      const changed = { ...fixture.targets[0]!, packId: 'built-in-geography' };
      return {
        ...fixture,
        targets: [changed, ...fixture.targets.slice(1)],
        categories: fixture.categories.map((item) =>
          item.categorySetId === changed.categorySetId
            ? { ...item, packId: 'built-in-geography' }
            : item),
      };
    }],
  ] as const)('rejects a %s filesystem target ledger before writes', (_kind, mutate) => {
    const fixture = stagingFixture();

    expect(() => stagePlayableCorpus(mutate(fixture))).toThrowError(
      /(?:Expected 800 canonical playable targets|Playable staging targets must exactly match the canonical ledger)/u,
    );
    expect(existsSync(fixture.outputRoot)).toBe(false);
  });

  it('writes no staged artifact when a later batch fails validation', () => {
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
      writeRows(path, rows.map((row) =>
        row.difficulty === 'medium' && row.tier === '5' ? { ...row, tier: '4' } : row));
    }

    expect(() => stagePlayableCorpus(fixture)).toThrowError(/must contain tiers 1,2,3,4,5/u);
    expect(existsSync(fixture.outputRoot)).toBe(false);
  });

  it('publishes all 36 staged artifacts only after complete validation', () => {
    const fixture = stagingFixture();
    stagePlayableCorpus(fixture);

    publishPlayableCorpusStage(fixture);

    for (const path of acceptedArtifactPaths()) {
      expect(readFileSync(resolve(fixture.acceptedRoot, path), 'utf8')).toBe(
        readFileSync(resolve(fixture.outputRoot, path.replace(/^content\//u, '')), 'utf8'),
      );
    }
  }, 20_000);

  it('rejects a real output-root alias to accepted content before any accepted write', () => {
    const fixture = stagingFixture();
    const aliasContainer = temporaryDirectory();
    const outputAlias = resolve(aliasContainer, 'accepted-content-alias');
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    symlinkSync(
      resolve(fixture.acceptedRoot, 'content'),
      outputAlias,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    let failure: unknown;

    try {
      stagePlayableCorpus({ ...fixture, outputRoot: outputAlias });
    } catch (error) {
      failure = error;
    } finally {
      rmSync(outputAlias, { recursive: true, force: true });
    }

    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toMatch(/overlaps accepted destination/u);
  });

  it('aborts before accepted writes when staged non-target content mutates', () => {
    const fixture = stagingFixture();
    stagePlayableCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    const path = resolve(fixture.outputRoot, 'generated/01-history.en-et.csv');
    const rows = parse(readFileSync(path, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
    }) as Array<Record<string, string>>;
    const easyIndex = rows.findIndex(({ difficulty }) => difficulty === 'easy');
    rows[easyIndex] = { ...rows[easyIndex]!, clue_en: 'Mutated non-target clue.' };
    writeRows(path, rows);

    expect(() => publishPlayableCorpusStage(fixture)).toThrowError(
      'Staged artifact does not match expected transform',
    );
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
  }, 20_000);

  it('rolls back every accepted rename and removes publisher residue after replacement failure', () => {
    const fixture = stagingFixture();
    stagePlayableCorpus(fixture);
    const acceptedBefore = acceptedArtifactBytes(fixture.acceptedRoot);
    let replacements = 0;

    expect(() => publishPlayableCorpusStage({
      ...fixture,
      dependencies: {
        createTemporaryId: () => 'round-one-rollback',
        rename: (source, destination) => {
          if (source.endsWith('.tmp')) {
            replacements += 1;
            if (replacements === 2) throw new Error('injected replacement failure');
          }
          renameSync(source, destination);
        },
      },
    })).toThrowError('injected replacement failure');

    expect(replacements).toBe(2);
    expect(acceptedArtifactBytes(fixture.acceptedRoot)).toEqual(acceptedBefore);
    expect((readdirSync(fixture.acceptedRoot, { recursive: true }) as string[])
      .filter((path) => path.includes('round-one-rollback'))).toEqual([]);
  }, 20_000);

  it('defaults to ignored staging and exposes no partial-batch publication option', () => {
    expect(parsePlayableCorpusArgs([])).toEqual({
      outputRoot: 'content/work/playable-corpus-overhaul/staged',
      publish: false,
    });
    expect(parsePlayableCorpusArgs(['--output-root', 'custom-stage', '--publish'])).toEqual({
      outputRoot: 'custom-stage',
      publish: true,
    });
    expect(() => parsePlayableCorpusArgs(['--batch', '01-history'])).toThrowError(
      'Unknown argument: --batch',
    );
  });

  it('fails clearly until the complete playable bank module is supplied', () => {
    expect(() => loadPlayableCorpus(() => ({}))).toThrowError(
      'playability/bank.ts must export a callable buildPlayableCorpus',
    );
  });
});
