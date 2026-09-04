import { describe, expect, it } from 'vitest';
import { publicGameViewSchema } from '../../../src/shared/ipc/contracts';
import { publicView } from '../renderer/game/fixtures';

describe('publicGameViewSchema privacy semantics', () => {
  it('requires an exact six-category by five-clue board', () => {
    const valid = publicView();
    expect(publicGameViewSchema.safeParse(valid).success).toBe(true);
    expect(publicGameViewSchema.safeParse({ ...valid, board: { ...valid.board!, categories: valid.board!.categories.slice(0, 5) } }).success).toBe(false);
    expect(publicGameViewSchema.safeParse({
      ...valid,
      board: { ...valid.board!, categories: valid.board!.categories.map((category, index) => index === 0
        ? { ...category, clues: category.clues.slice(0, 4) }
        : category) },
    }).success).toBe(false);
  });

  it('rejects a Round One projection carrying revealed response or Final judgment data', () => {
    const valid = publicView();
    expect(publicGameViewSchema.safeParse({
      ...valid,
      activeClue: { id: 'active-clue', prompt: 'Private prompt', responseRevealed: true, response: 'Answer', explanation: 'Why' },
      final: { category: 'Final', eligibleTeamIds: ['team-1'], revealed: [{ teamId: 'team-1', wager: 500, correct: true }] },
    }).success).toBe(false);
  });

  it('rejects unknown, duplicate, or premature public team facts', () => {
    const valid = publicView();
    expect(publicGameViewSchema.safeParse({ ...valid, controllingTeamId: 'unknown-team' }).success).toBe(false);
    expect(publicGameViewSchema.safeParse({ ...valid, tiebreakerTeamIds: ['team-1', 'team-1'] }).success).toBe(false);
    expect(publicGameViewSchema.safeParse({ ...valid, winnerTeamId: 'team-1' }).success).toBe(false);
  });

  it('rejects revealed ordinary clues and requires complete reveal content in clue-reveal', () => {
    const hiddenOrdinary = publicView({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: true },
    });
    const ordinary = {
      ...hiddenOrdinary,
      activeClue: { id: 'active-clue', prompt: 'Prompt', responseRevealed: true as const, response: 'Response', explanation: 'Explanation', source: 'Source' },
    };
    expect(publicGameViewSchema.safeParse(ordinary).success).toBe(false);
    expect(publicGameViewSchema.safeParse({ ...ordinary, phase: 'clue-reveal' }).success).toBe(true);
    expect(publicGameViewSchema.safeParse({
      ...ordinary,
      phase: 'clue-reveal',
      activeClue: { ...ordinary.activeClue!, source: undefined },
    }).success).toBe(false);
  });

  it('accepts redacted Daily Double wager and clue projections but rejects private shapes', () => {
    const wager = publicView({
      phase: 'daily-double-wager',
      activeClue: { clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
    });
    expect(wager.phase).toBe('daily-double-wager');
    expect(publicGameViewSchema.safeParse(wager).success).toBe(true);

    const clue = publicView({
      phase: 'daily-double-clue',
      activeClue: { clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
    });
    expect(clue.phase).toBe('daily-double-clue');
    expect(publicGameViewSchema.safeParse(clue).success).toBe(true);
    expect(publicGameViewSchema.safeParse({ ...clue, activeClue: null }).success).toBe(false);
    expect(publicGameViewSchema.safeParse({
      ...wager,
      activeClue: { id: 'active-clue', prompt: 'Hidden before wager', responseRevealed: false },
    }).success).toBe(false);
  });
});
