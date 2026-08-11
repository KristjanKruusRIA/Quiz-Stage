import { describe, expect, it } from 'vitest';
import { applyGameCommand, createGame, maxDailyDoubleWager, type SelectedBoards } from '../../../src/shared/game/engine';
import { GameRuleError } from '../../../src/shared/game/reducer';
import type { GameConfig } from '../../../src/shared/game/types';

const config: GameConfig = {
  language: 'en', difficulty: 'medium', clueSeconds: 15,
  teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
  packIds: ['bundled'], displayMode: 'dual',
};

const selectedBoards: SelectedBoards = {
  seed: 'daily-double-seed', dailyDoubleClueIds: ['dd'],
  boards: [{
    id: 'r1', round: 'round-one', categories: [{
      id: 'cat', name: { en: 'Category' }, macroTopic: 'topic', clues: [{
        id: 'dd', categoryId: 'cat', round: 'round-one', tier: 2, value: 400,
        prompt: { en: 'Prompt' }, response: { en: 'Response' }, explanation: { en: 'Explanation' }, source: 'Source',
      }],
    }],
  }],
};

function apply(state: ReturnType<typeof createGame>, command: Parameters<typeof applyGameCommand>[1]) {
  return applyGameCommand(state, command).state;
}

function dailyDoubleGame(score = 0) {
  const game = createGame(config, selectedBoards, 0);
  const controllingTeamId = game.controllingTeamId as string;
  return { game: { ...game, scores: { ...game.scores, [controllingTeamId]: score } }, controllingTeamId };
}

describe('Daily Double', () => {
  it('uses the round ceiling for a negative score and the score when higher', () => {
    expect(maxDailyDoubleWager(-400, 'round-one')).toBe(1000);
    expect(maxDailyDoubleWager(2400, 'round-one')).toBe(2400);
    expect(maxDailyDoubleWager(0, 'round-two')).toBe(2000);
  });

  it.each([5, 1000])('accepts the inclusive wager boundary %i', (wager) => {
    const { game } = dailyDoubleGame();
    const selected = apply(game, { type: 'SelectClue', clueId: 'dd' });
    const wagered = apply(selected, { type: 'SubmitDailyDoubleWager', wager });

    expect(wagered.phase).toBe('daily-double-clue');
    expect(wagered.dailyDoubleWager).toBe(wager);
  });

  it.each([4, 1001])('rejects an out-of-range wager %i', (wager) => {
    const { game } = dailyDoubleGame();
    const selected = apply(game, { type: 'SelectClue', clueId: 'dd' });

    expect(() => apply(selected, { type: 'SubmitDailyDoubleWager', wager })).toThrow(GameRuleError);
  });

  it('allows only the selecting team to respond and retains its control after an incorrect answer', () => {
    const { game, controllingTeamId } = dailyDoubleGame(200);
    const otherTeamId = controllingTeamId === 't1' ? 't2' : 't1';
    const selected = apply(game, { type: 'SelectClue', clueId: 'dd' });
    const wagered = apply(selected, { type: 'SubmitDailyDoubleWager', wager: 500 });

    expect(() => apply(wagered, { type: 'LockTeam', teamId: otherTeamId, at: 1000 })).toThrow(GameRuleError);

    const locked = apply(wagered, { type: 'LockTeam', teamId: controllingTeamId, at: 1000 });
    const judged = apply(locked, { type: 'JudgeResponse', correct: false, at: 1100 });
    expect(judged.scores[controllingTeamId]).toBe(-300);
    expect(judged.controllingTeamId).toBe(controllingTeamId);
  });
});
