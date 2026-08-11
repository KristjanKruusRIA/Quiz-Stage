import { describe, expect, it } from 'vitest';
import { applyGameCommand, createGame, tickTimer, type SelectedBoards } from '../../../src/shared/game/engine';
import { GameRuleError } from '../../../src/shared/game/reducer';
import type { GameConfig } from '../../../src/shared/game/types';

const config: GameConfig = {
  language: 'en', difficulty: 'easy', clueSeconds: 15,
  teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
  packIds: ['bundled'], displayMode: 'single',
};

const selectedBoards: SelectedBoards = {
  seed: 'timer-seed', dailyDoubleClueIds: [],
  boards: [{
    id: 'r1', round: 'round-one', categories: [{
      id: 'cat', name: { en: 'Category' }, macroTopic: 'topic', clues: [{
        id: 'clue', categoryId: 'cat', round: 'round-one', tier: 1, value: 200,
        prompt: { en: 'Prompt' }, response: { en: 'Response' }, explanation: { en: 'Explanation' }, source: 'Source',
      }],
    }],
  }],
};

function apply(state: ReturnType<typeof createGame>, command: Parameters<typeof applyGameCommand>[1]) {
  return applyGameCommand(state, command).state;
}

describe('game timers', () => {
  it('subtracts only running time across pause and resume', () => {
    const opened = apply(createGame(config, selectedBoards, 0), { type: 'SelectClue', clueId: 'clue' });
    expect(tickTimer(opened, 1_000)).toEqual([]);
    expect(opened.timer.startedAt).toBe(1_000);
    const paused = apply(opened, { type: 'PauseTimer', at: 5_000 });
    const resumed = apply(paused, { type: 'ResumeTimer', at: 10_000 });
    const pausedAgain = apply(resumed, { type: 'PauseTimer', at: 12_000 });

    expect(paused.timer.remainingMs).toBe(11_000);
    expect(pausedAgain.timer).toMatchObject({ remainingMs: 9_000, startedAt: null, status: 'paused' });
  });

  it('resets the active timer to its full configured duration', () => {
    const opened = apply(createGame(config, selectedBoards, 0), { type: 'SelectClue', clueId: 'clue' });
    const paused = apply(opened, { type: 'PauseTimer', at: 4_000 });
    const reset = apply(paused, { type: 'ResetTimer', at: 8_000 });

    expect(reset.timer).toEqual({ durationMs: 15_000, remainingMs: 15_000, startedAt: 8_000, status: 'running' });
  });

  it('emits expiry once and records the expired timer state', () => {
    const opened = apply(createGame(config, selectedBoards, 0), { type: 'SelectClue', clueId: 'clue' });

    expect(tickTimer(opened, 1_000)).toEqual([]);
    expect(tickTimer(opened, 15_999)).toEqual([]);
    expect(tickTimer(opened, 16_000)).toHaveLength(1);
    expect(opened.timer).toMatchObject({ remainingMs: 0, startedAt: null, status: 'expired' });
    expect(tickTimer(opened, 20_000)).toEqual([]);
  });

  it('rejects timer commands outside an active timed clue', () => {
    const game = createGame(config, selectedBoards, 0);
    expect(() => apply(game, { type: 'PauseTimer', at: 1 })).toThrow(GameRuleError);
    expect(() => apply(game, { type: 'ResetTimer', at: 1 })).toThrow(GameRuleError);
  });
});
