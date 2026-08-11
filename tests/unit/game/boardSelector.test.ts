import { describe, expect, it } from 'vitest';
import {
  createSeededRandom,
  selectMatchContent,
  selectNextTiebreakerClue,
  type SelectedMatch,
} from '../../../src/shared/game/boardSelector';
import { createGame, type SelectedBoards } from '../../../src/shared/game/engine';
import {
  categorySet,
  finalClue,
  gameConfig,
  selectableClue,
  selectionInput,
} from '../../fixtures/contentFactory';

function requireMatch(result: ReturnType<typeof selectMatchContent>): SelectedMatch {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected complete match content');
  return result;
}

function maxMacroTopicCount(match: SelectedMatch, boardIndex: number): number {
  const counts = match.boards[boardIndex].categories.reduce<Record<string, number>>((result, category) => {
    result[category.macroTopic] = (result[category.macroTopic] ?? 0) + 1;
    return result;
  }, {});
  return Math.max(...Object.values(counts));
}

function namedSet(
  id: string,
  round: 'round-one' | 'round-two',
  name: string,
  macroTopic = `topic-${name}`,
) {
  return categorySet(id, round, { name: { en: name, et: name }, macroTopic });
}

describe('deterministic board selection', () => {
  it('produces repeatable random values for the same persisted seed', () => {
    const first = createSeededRandom('persisted-seed');
    const second = createSeededRandom('persisted-seed');

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('selects twelve unique names, balanced macro topics, one Final, and three distinct Daily Doubles', () => {
    const result = requireMatch(selectMatchContent(selectionInput()));

    expect(new Set(result.categorySets.map((set) => set.name.en)).size).toBe(12);
    expect(result.roundOne.categories).toHaveLength(6);
    expect(result.roundTwo.categories).toHaveLength(6);
    expect(maxMacroTopicCount(result, 0)).toBeLessThanOrEqual(2);
    expect(maxMacroTopicCount(result, 1)).toBeLessThanOrEqual(2);
    expect(result.final.difficulty).toBe('medium');
    expect(result.finalClue).toEqual(result.final);
    expect(result.dailyDoubleClueIds).toHaveLength(3);
    expect(new Set(result.dailyDoubleClueIds).size).toBe(3);
    expect(result.roundOne.categories.flatMap((category) => category.clues).map((clue) => clue.id))
      .toContain(result.dailyDoubleClueIds[0]);
    for (const clueId of result.dailyDoubleClueIds.slice(1)) {
      expect(result.roundTwo.categories.flatMap((category) => category.clues).map((clue) => clue.id)).toContain(clueId);
    }
  });

  it('prefers unseen sets, then least-recently used sets, without shuffling unequal ranks', () => {
    const rankedRoundOne = [
      categorySet('unseen', 'round-one', { lastSeenAt: null }),
      categorySet('oldest', 'round-one', { lastSeenAt: 10 }),
      categorySet('older', 'round-one', { lastSeenAt: 20 }),
      categorySet('newer', 'round-one', { lastSeenAt: 30 }),
      categorySet('newest', 'round-one', { lastSeenAt: 40 }),
      categorySet('latest', 'round-one', { lastSeenAt: 50 }),
      categorySet('excluded-by-rank', 'round-one', { lastSeenAt: 60 }),
    ].map((set, index) => ({ ...set, macroTopic: `rank-topic-${index}` }));
    const roundTwo = Array.from({ length: 6 }, (_, index) =>
      categorySet(`round-two-${index}`, 'round-two', { macroTopic: `round-two-topic-${index}` }),
    );
    const result = requireMatch(selectMatchContent(selectionInput({ categorySets: [...rankedRoundOne, ...roundTwo] })));

    expect(result.roundOne.categories.map((set) => set.id)).toEqual([
      'unseen', 'oldest', 'older', 'newer', 'newest', 'latest',
    ]);
  });

  it('applies Round Two ranking independently when names also occur in Round One', () => {
    const roundOne = [
      { ...namedSet('r1-high-name', 'round-one', 'High overlap'), lastSeenAt: null },
      { ...namedSet('r1-low-name', 'round-one', 'Low overlap'), lastSeenAt: 10 },
      ...Array.from({ length: 5 }, (_, index) => ({
        ...namedSet(`r1-required-${index}`, 'round-one', `Round One ${index}`),
        lastSeenAt: 20 + index,
      })),
    ];
    const roundTwo = [
      { ...namedSet('r2-high', 'round-two', 'High overlap'), lastSeenAt: null },
      ...Array.from({ length: 5 }, (_, index) => ({
        ...namedSet(`r2-required-${index}`, 'round-two', `Round Two ${index}`),
        lastSeenAt: 10 + index,
      })),
      { ...namedSet('r2-low', 'round-two', 'Low overlap'), lastSeenAt: 60 },
    ];

    const result = requireMatch(selectMatchContent(selectionInput({ categorySets: [...roundOne, ...roundTwo] })));

    expect(result.roundTwo.categories.map((category) => category.id)).toContain('r2-high');
    expect(result.roundTwo.categories.map((category) => category.id)).not.toContain('r2-low');
  });

  it('filters disabled packs and content, wrong difficulty and round, incomplete language, and malformed tiers', () => {
    const validRoundOne = Array.from({ length: 5 }, (_, index) => categorySet(`valid-r1-${index}`, 'round-one'));
    const validRoundTwo = Array.from({ length: 4 }, (_, index) => categorySet(`valid-r2-${index}`, 'round-two'));
    const invalid = [
      categorySet('disabled-set', 'round-one', { enabled: false }),
      categorySet('disabled-pack', 'round-one', { packId: 'disabled-pack' }),
      categorySet('wrong-difficulty', 'round-one', { difficulty: 'hard' }),
      categorySet('disabled-clue', 'round-one', {
        clues: [1, 2, 3, 4, 5].map((tier) => selectableClue('disabled-clue', 'round-one', tier, { enabled: tier !== 5 })),
      }),
      categorySet('duplicate-tier', 'round-two', {
        clues: [1, 2, 3, 4, 4].map((tier, index) =>
          selectableClue('duplicate-tier', 'round-two', tier, { id: `duplicate-tier-${index}` }),
        ),
      }),
      categorySet('missing-estonian', 'round-two', { name: { en: 'English only' } }),
    ];

    const result = selectMatchContent(selectionInput({
      config: gameConfig({ language: 'et' }),
      categorySets: [...validRoundOne, ...validRoundTwo, ...invalid],
      finalClues: [finalClue('missing-et-final', 'medium', { categoryName: { en: 'English only' } })],
    }));

    expect(result).toEqual({ ok: false, roundOneMissing: 1, roundTwoMissing: 2, finalMissing: 1 });
    expect(result).not.toHaveProperty('boards');
    expect(result).not.toHaveProperty('dailyDoubleClueIds');
  });

  it('returns exact atomic shortages rather than a partial match', () => {
    const result = selectMatchContent(selectionInput({
      categorySets: [
        ...Array.from({ length: 3 }, (_, index) => categorySet(`short-r1-${index}`, 'round-one')),
        ...Array.from({ length: 5 }, (_, index) => categorySet(`short-r2-${index}`, 'round-two')),
      ],
      finalClues: [],
    }));

    expect(result).toEqual({ ok: false, roundOneMissing: 3, roundTwoMissing: 1, finalMissing: 1 });
  });

  it('reports jointly feasible shortages when category names overlap across rounds', () => {
    const result = selectMatchContent(selectionInput({
      categorySets: [
        ...['A', 'B', 'C', 'D', 'E'].map((name) => namedSet(`r1-${name}`, 'round-one', name)),
        ...['A', 'B', 'C', 'D', 'E', 'F'].map((name) => namedSet(`r2-${name}`, 'round-two', name)),
      ],
    }));

    expect(result).toEqual({ ok: false, roundOneMissing: 1, roundTwoMissing: 5, finalMissing: 0 });
    expect(result).not.toHaveProperty('boards');
  });

  it('computes joint shortage counts under both macro caps and cross-round name conflicts', () => {
    const result = selectMatchContent(selectionInput({
      categorySets: [
        ...['A', 'B', 'C'].map((name) => namedSet(`r1-${name}`, 'round-one', name, 'shared-one')),
        ...['D', 'E'].map((name) => namedSet(`r1-${name}`, 'round-one', name, 'shared-two')),
        ...['A', 'B', 'C', 'D', 'E', 'F'].map((name) => namedSet(`r2-${name}`, 'round-two', name)),
      ],
    }));

    expect(result).toEqual({ ok: false, roundOneMissing: 2, roundTwoMissing: 4, finalMissing: 0 });
  });

  it('bounds exact allocation work for hundreds of distinct names and macro options', () => {
    const candidates = Array.from({ length: 150 }, (_, nameIndex) =>
      (['round-one', 'round-two'] as const).flatMap((round) =>
        [0, 1].map((macroVariant) => namedSet(
          `stress-${round}-${nameIndex}-${macroVariant}`,
          round,
          `Distinct ${nameIndex}`,
          `topic-${(nameIndex + macroVariant) % 30}`,
        )),
      )).flat();
    const diagnostics = {
      targetChecks: 0,
      maxAugmentationsPerCheck: 0,
      maxEdgeScansPerCheck: 0,
      nodeCount: 0,
      directedEdgeCount: 0,
    };
    const result = selectMatchContent(selectionInput({ categorySets: candidates }), diagnostics);

    expect(result.ok).toBe(true);
    expect(diagnostics.targetChecks).toBeGreaterThan(0);
    expect(diagnostics.targetChecks).toBeLessThanOrEqual(8);
    expect(diagnostics.maxAugmentationsPerCheck).toBeLessThanOrEqual(12);
    expect(diagnostics.maxEdgeScansPerCheck).toBeLessThanOrEqual(
      12 * diagnostics.nodeCount * diagnostics.directedEdgeCount,
    );
  });

  it('returns byte-equivalent selected content for byte-equivalent input and seed', () => {
    const input = selectionInput({ seed: 'byte-stable-seed' });

    expect(JSON.stringify(selectMatchContent(input))).toBe(JSON.stringify(selectMatchContent(input)));
  });

  it('selects unused deterministic tiebreakers and supports persisting each canonical clue before display', () => {
    const input = selectionInput({ finalClues: [finalClue('tie-a'), finalClue('tie-b'), finalClue('tie-c')] });
    const first = selectNextTiebreakerClue(input, [], 0);
    const firstAgain = selectNextTiebreakerClue(input, [], 0);
    const second = selectNextTiebreakerClue(input, [first.id], 1);

    expect(firstAgain).toEqual(first);
    expect(first.round).toBe('tiebreaker');
    expect(second.round).toBe('tiebreaker');
    expect(second.id).not.toBe(first.id);

    const selected = requireMatch(selectMatchContent(input));
    const persisted: SelectedBoards = { ...selected, tiebreakerClues: [first, second] };
    const game = createGame(input.config, persisted, 1_723_000_000_000);
    expect(game.activeClue).toBeNull();
    expect(game.tiebreakerClues.map((clue) => clue.id)).toEqual([first.id, second.id]);
    expect(game.usedTiebreakerClueIds).toEqual([]);
  });
});
