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
});
