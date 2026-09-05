import { describe, expect, it } from 'vitest';
import { applyGameCommand, createGame, tickTimer, type SelectedBoards } from '../../../src/shared/game/engine';
import { GameRuleError } from '../../../src/shared/game/reducer';
import { gameCommandSchema } from '../../../src/shared/ipc/contracts';
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

  it('holds every English narrated clue timer idle, then starts it at narration completion', () => {
    const narratedConfig = { ...config, speechEnabled: true };
    const ordinary = applyGameCommand(
      createGame(narratedConfig, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      1_000,
    );
    expect(ordinary.state.timer).toMatchObject({ status: 'idle', startedAt: null });
    expect(applyGameCommand(ordinary.state, {
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: ordinary.state.eventSequence,
    } as never, 1_500).state.timer).toMatchObject({ status: 'running', startedAt: 1_500 });

    const dailyBase = createGame(narratedConfig, { ...selectedBoards, dailyDoubleClueIds: ['clue'] }, 0);
    const dailyWager = applyGameCommand(dailyBase, { type: 'SelectClue', clueId: 'clue' }, 1_000).state;
    const daily = applyGameCommand(dailyWager, { type: 'SubmitDailyDoubleWager', wager: 5 }, 2_000);
    expect(daily.state.timer).toMatchObject({ status: 'idle', startedAt: null });
    expect(applyGameCommand(daily.state, {
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: daily.state.eventSequence,
    } as never, 2_250).state.timer).toMatchObject({ status: 'running', startedAt: 2_250 });

    const finalBase = {
      ...createGame(narratedConfig, selectedBoards, 0),
      phase: 'final-category' as const,
      scores: { t1: 100, t2: 100 },
      finalEligibleTeamIds: ['t1', 't2'],
    };
    const firstWager = applyGameCommand(finalBase, { type: 'SubmitFinalWager', teamId: 't1', wager: 0 }, 2_500).state;
    const final = applyGameCommand(firstWager, { type: 'SubmitFinalWager', teamId: 't2', wager: 0 }, 3_000);
    expect(final.state.timer).toMatchObject({ status: 'idle', startedAt: null });
    expect(applyGameCommand(final.state, {
      type: 'StartNarratedClueTimer', clueId: 'final', narrationSequence: final.state.eventSequence,
    } as never, 3_250).state.timer).toMatchObject({ status: 'running', startedAt: 3_250 });

    const tieBase = {
      ...final.state,
      timer: { durationMs: 30_000, remainingMs: 0, startedAt: null, status: 'expired' as const },
    };
    const firstReveal = applyGameCommand(tieBase, { type: 'RevealFinalTeam', teamId: 't1', correct: true }, 3_500).state;
    const tie = applyGameCommand(firstReveal, { type: 'RevealFinalTeam', teamId: 't2', correct: true }, 4_000);
    expect(tie.state.timer).toMatchObject({ status: 'idle', startedAt: null });
    expect(applyGameCommand(tie.state, {
      type: 'StartNarratedClueTimer', clueId: 'tie', narrationSequence: tie.state.eventSequence,
    } as never, 4_250).state.timer).toMatchObject({ status: 'running', startedAt: 4_250 });
  });

  it('starts a narrated clue timer at the authoritative occurrence time without adding an undo action', () => {
    const narratedConfig = { ...config, speechEnabled: true };
    const opened = applyGameCommand(
      createGame(narratedConfig, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      1_000,
    ).state;

    const started = applyGameCommand(opened, {
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: opened.eventSequence,
    } as never, 2_000);

    expect(started.state.timer).toMatchObject({ status: 'running', startedAt: 2_000 });
    expect(started.state.undoStack).toHaveLength(opened.undoStack.length);
    expect(applyGameCommand(started.state, { type: 'UndoLast' }, 2_500).state.phase).toBe('round-one-board');
  });

  it('rejects locking, revealing, or resetting an idle narrated timer', () => {
    const opened = applyGameCommand(
      createGame({ ...config, speechEnabled: true }, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      1_000,
    ).state;

    expect(() => applyGameCommand(opened, { type: 'LockTeam', teamId: 't1', at: 1_100 })).toThrow(GameRuleError);
    expect(() => applyGameCommand(opened, { type: 'RevealResponse' }, 1_100)).toThrow(GameRuleError);
    expect(() => applyGameCommand(opened, { type: 'ResetTimer', at: 1_100 })).toThrow(GameRuleError);
  });

  it('accepts only an identified narrated-clue timer start command', () => {
    expect(gameCommandSchema.safeParse({
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: 1,
    }).success).toBe(true);
    expect(gameCommandSchema.safeParse({ type: 'StartNarratedClueTimer', clueId: 'clue' }).success).toBe(false);
    expect(gameCommandSchema.safeParse({ type: 'StartNarratedClueTimer' }).success).toBe(false);
  });

  it('rejects narration starts outside the pending English active clue', () => {
    const pending = applyGameCommand(
      createGame({ ...config, speechEnabled: true }, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      1_000,
    ).state;
    expect(() => applyGameCommand(pending, {
      type: 'StartNarratedClueTimer', clueId: 'other', narrationSequence: pending.eventSequence,
    } as never, 2_000)).toThrow(GameRuleError);

    const started = applyGameCommand(pending, {
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: pending.eventSequence,
    } as never, 2_000).state;
    expect(() => applyGameCommand(started, {
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: pending.eventSequence,
    } as never, 2_100)).toThrow(GameRuleError);

    const Estonian = applyGameCommand(
      createGame({ ...config, language: 'et', speechEnabled: true }, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      3_000,
    ).state;
    expect(Estonian.timer.status).toBe('running');
    expect(() => applyGameCommand(Estonian, {
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: Estonian.eventSequence,
    } as never, 3_100)).toThrow(GameRuleError);
  });

  it('rejects a stale narration completion after undo and reselecting the same clue', () => {
    const narratedConfig = { ...config, speechEnabled: true };
    const first = applyGameCommand(
      createGame(narratedConfig, selectedBoards, 0),
      { type: 'SelectClue', clueId: 'clue' },
      1_000,
    ).state;
    const board = applyGameCommand(first, { type: 'UndoLast' }, 1_500).state;
    const second = applyGameCommand(board, { type: 'SelectClue', clueId: 'clue' }, 2_000).state;

    expect(second.eventSequence).not.toBe(first.eventSequence);
    expect(() => applyGameCommand(second, {
      type: 'StartNarratedClueTimer', clueId: 'clue', narrationSequence: first.eventSequence,
    } as never, 2_500)).toThrow(GameRuleError);
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
