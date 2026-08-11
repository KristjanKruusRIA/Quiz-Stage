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
  finalClue: {
    id: 'final', categoryId: 'final-category', categoryName: { en: 'Final' }, round: 'final', tier: 0, value: 0,
    prompt: { en: 'Final prompt' }, response: { en: 'Final response' }, explanation: { en: 'Final explanation' }, source: 'Source',
  },
  tiebreakerClues: [{
    id: 'tie', categoryId: 'tie-category', round: 'tiebreaker', tier: 0, value: 0,
    prompt: { en: 'Tie prompt' }, response: { en: 'Tie response' }, explanation: { en: 'Tie explanation' }, source: 'Source',
  }],
};

function apply(state: ReturnType<typeof createGame>, command: Parameters<typeof applyGameCommand>[1]) {
  return applyGameCommand(state, command).state;
}

describe('game timers', () => {
  it('anchors a timestamp-free timed transition at its authoritative occurrence time', () => {
    const transition = applyGameCommand(
      createGame(config, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      1_000,
    );

    expect(transition.events[0].at).toBe(1_000);
    expect(transition.state.timer).toMatchObject({ status: 'running', startedAt: 1_000 });
  });

  it('keeps legacy zero-time transitions resumable instead of inventing a replay timestamp', () => {
    const transition = applyGameCommand(
      createGame(config, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      0,
    );

    expect(transition.events[0].at).toBe(0);
    expect(transition.state.timer).toMatchObject({ status: 'running', startedAt: null });
  });

  it('anchors Daily Double, Final, and tiebreaker timers at their live transition time', () => {
    const dailyBase = createGame(config, { ...selectedBoards, dailyDoubleClueIds: ['clue'] }, 0);
    const dailyWager = applyGameCommand(dailyBase, { type: 'SelectClue', clueId: 'clue' }, 1_000).state;
    const dailyClue = applyGameCommand(dailyWager, { type: 'SubmitDailyDoubleWager', wager: 5 }, 2_000);
    expect(dailyClue.state.timer).toMatchObject({ status: 'running', startedAt: 2_000 });
    expect(dailyClue.events[0].at).toBe(2_000);

    const finalBase = {
      ...createGame(config, selectedBoards, 0),
      phase: 'final-category' as const,
      scores: { t1: 100, t2: 100 },
      finalEligibleTeamIds: ['t1', 't2'],
    };
    const firstWager = applyGameCommand(finalBase, { type: 'SubmitFinalWager', teamId: 't1', wager: 0 }, 2_500).state;
    const finalClue = applyGameCommand(firstWager, { type: 'SubmitFinalWager', teamId: 't2', wager: 0 }, 3_000);
    expect(finalClue.state.timer).toMatchObject({ status: 'running', startedAt: 3_000 });
    expect(finalClue.events[0].at).toBe(3_000);

    const tieBase = {
      ...finalClue.state,
      timer: { durationMs: 30_000, remainingMs: 0, startedAt: null, status: 'expired' as const },
    };
    const firstReveal = applyGameCommand(tieBase, { type: 'RevealFinalTeam', teamId: 't1', correct: true }, 3_500).state;
    const tie = applyGameCommand(firstReveal, { type: 'RevealFinalTeam', teamId: 't2', correct: true }, 4_000);
    expect(tie.state).toMatchObject({ phase: 'tiebreaker', timer: { status: 'running', startedAt: 4_000 } });
    expect(tie.events[0].at).toBe(4_000);
  });

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
    const sequenceBeforeExpiry = opened.eventSequence;

    expect(tickTimer(opened, 1_000)).toEqual([]);
    expect(tickTimer(opened, 15_999)).toEqual([]);
    expect(tickTimer(opened, 16_000)).toHaveLength(1);
    expect(opened.timer).toMatchObject({ remainingMs: 0, startedAt: null, status: 'expired' });
    expect(opened.eventSequence).toBe(sequenceBeforeExpiry + 1);
    expect(tickTimer(opened, 20_000)).toEqual([]);
  });

  it('rejects timer commands outside an active timed clue', () => {
    const game = createGame(config, selectedBoards, 0);
    expect(() => apply(game, { type: 'PauseTimer', at: 1 })).toThrow(GameRuleError);
    expect(() => apply(game, { type: 'ResetTimer', at: 1 })).toThrow(GameRuleError);
  });

  it.each([16_000, 16_001])('expires instead of locking a team at or past the deadline (%i)', (at) => {
    const opened = apply(createGame(config, selectedBoards, 0), { type: 'SelectClue', clueId: 'clue' });
    tickTimer(opened, 1_000);

    const lateLock = applyGameCommand(opened, { type: 'LockTeam', teamId: 't1', at });
    expect(lateLock.state.activeClue?.lockedTeamId).toBeNull();
    expect(lateLock.state.timer.status).toBe('expired');
    expect(lateLock.events).toHaveLength(1);
    expect(lateLock.events[0].type).toBe('TimerExpired');
    expect(tickTimer(lateLock.state, at + 1)).toEqual([]);
  });

  it('rejects resetting before the current timer anchor', () => {
    const opened = apply(createGame(config, selectedBoards, 0), { type: 'SelectClue', clueId: 'clue' });
    tickTimer(opened, 1_000);
    expect(() => apply(opened, { type: 'ResetTimer', at: 999 })).toThrow(GameRuleError);
  });
});
