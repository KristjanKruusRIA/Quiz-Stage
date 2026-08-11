import { describe, expect, it } from 'vitest';
import { applyGameCommand, createCompensatingEvent, createGame, type SelectedBoards } from '../../../src/shared/game/engine';
import type { GameEvent } from '../../../src/shared/game/events';
import { GameRuleError } from '../../../src/shared/game/reducer';
import { gameStateSchema } from '../../../src/shared/ipc/contracts';
import type { GameConfig, GameState } from '../../../src/shared/game/types';

const config: GameConfig = {
  language: 'en', difficulty: 'easy', clueSeconds: 15,
  teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
  packIds: ['bundled'], displayMode: 'single',
};

const clues = [200, 400].map((value, index) => ({
  id: `clue-${value}`, categoryId: 'cat', round: 'round-one' as const, tier: index + 1, value,
  prompt: { en: 'Prompt' }, response: { en: 'Response' }, explanation: { en: 'Explanation' }, source: 'Source',
}));
const selectedBoards: SelectedBoards = {
  seed: 'recovery-seed', dailyDoubleClueIds: [],
  boards: [{ id: 'r1', round: 'round-one', categories: [{ id: 'cat', name: { en: 'Category' }, macroTopic: 'topic', clues }] }],
};

const boundaryBoards: SelectedBoards = {
  seed: 'boundary-seed', dailyDoubleClueIds: [], finalClue: {
    ...clues[0], id: 'final', round: 'final',
  },
  boards: [
    { id: 'r1', round: 'round-one', categories: [{ id: 'r1-cat', name: { en: 'R1' }, macroTopic: 'r1', clues: [{ ...clues[0], id: 'last-r1', categoryId: 'r1-cat' }] }] },
    { id: 'r2', round: 'round-two', categories: [{ id: 'r2-cat', name: { en: 'R2' }, macroTopic: 'r2', clues: [{ ...clues[1], id: 'last-r2', categoryId: 'r2-cat', round: 'round-two' }] }] },
  ],
};

function apply(state: GameState, command: Parameters<typeof applyGameCommand>[1]) {
  return applyGameCommand(state, command);
}

describe('host recovery actions', () => {
  it('requires a nonblank reason to adjust a known team score', () => {
    const game = createGame(config, selectedBoards, 0);
    expect(() => apply(game, { type: 'AdjustScore', teamId: 't1', score: -50, reason: '  ' })).toThrow(GameRuleError);
    expect(() => apply(game, { type: 'AdjustScore', teamId: 'missing', score: 50, reason: 'Correction' })).toThrow(GameRuleError);
    expect(apply(game, { type: 'AdjustScore', teamId: 't1', score: -50, reason: 'Host correction' }).state.scores.t1).toBe(-50);
  });

  it('reopens only the most recently closed clue before another clue is selected', () => {
    let state = createGame(config, selectedBoards, 0);
    state = apply(state, { type: 'SelectClue', clueId: 'clue-200' }).state;
    state = apply(state, { type: 'RevealResponse' }).state;
    expect(apply(state, { type: 'ReopenClue' }).state.usedClueIds).toEqual([]);

    state = apply(state, { type: 'SelectClue', clueId: 'clue-400' }).state;
    expect(() => apply(state, { type: 'ReopenClue' })).toThrow(GameRuleError);
  });

  it('ends and saves an explicitly incomplete match', () => {
    const ended = apply(createGame(config, selectedBoards, 0), { type: 'EndIncompleteMatch' });
    expect(ended.state).toMatchObject({ phase: 'complete', endedIncomplete: true, winnerTeamId: null });
    expect(ended.events[0].type).toBe('MatchEnded');
  });

  it('makes an incomplete ending terminal even when older undo frames exist', () => {
    const game = createGame(config, selectedBoards, 0);
    const selected = apply(game, { type: 'SelectClue', clueId: 'clue-200' });
    const ended = apply(selected.state, { type: 'EndIncompleteMatch' });

    expect(ended.state.undoStack).toEqual([]);
    expect(() => apply(ended.state, { type: 'UndoLast' })).toThrow(GameRuleError);
    const history = [...selected.events, ...ended.events];
    expect(history).toHaveLength(2);
    expect(() => createCompensatingEvent(history)).toThrow(GameRuleError);
  });

  it('reopens the last Round One clue into the Round One board', () => {
    let state = createGame(config, boundaryBoards, 0);
    const controlBeforeClose = state.controllingTeamId;
    state = apply(state, { type: 'SelectClue', clueId: 'last-r1' }).state;
    state = apply(state, { type: 'RevealResponse' }).state;
    expect(state.phase).toBe('round-two-board');

    state = apply(state, { type: 'ReopenClue' }).state;
    expect(state.phase).toBe('round-one-board');
    expect(state.controllingTeamId).toBe(controlBeforeClose);
    expect(state.usedClueIds).not.toContain('last-r1');
  });

  it('reopens the last Double Round clue out of Final', () => {
    let state: GameState = {
      ...createGame(config, boundaryBoards, 0),
      phase: 'round-two-board',
      scores: { t1: 100, t2: 50 },
      controllingTeamId: 't1',
      usedClueIds: ['last-r1'],
    };
    state = apply(state, { type: 'SelectClue', clueId: 'last-r2' }).state;
    state = apply(state, { type: 'RevealResponse' }).state;
    expect(state.phase).toBe('final-category');

    state = apply(state, { type: 'ReopenClue' }).state;
    expect(state.phase).toBe('round-two-board');
    expect(state.controllingTeamId).toBe('t1');
    expect(state.finalEligibleTeamIds).toEqual([]);
    expect(state.finalJudgments).toEqual({});
    expect(state.usedClueIds).not.toContain('last-r2');
  });

  it('undoes the most recent reversible host action with an appended compensating event', () => {
    const game = createGame(config, selectedBoards, 0);
    const selected = apply(game, { type: 'SelectClue', clueId: 'clue-200' });
    const locked = apply(selected.state, { type: 'LockTeam', teamId: 't1', at: 1000 });
    const undoneLock = apply(locked.state, { type: 'UndoLast' });

    expect(undoneLock.state.phase).toBe('ordinary-clue');
    expect(undoneLock.state.activeClue?.lockedTeamId).toBeNull();
    expect(undoneLock.events[0]).toMatchObject({ type: 'ActionUndone', eventId: locked.events[0].id });

    const undoneSelection = apply(undoneLock.state, { type: 'UndoLast' });
    expect(undoneSelection.state.phase).toBe('round-one-board');
    expect(undoneSelection.events[0]).toMatchObject({ type: 'ActionUndone', eventId: selected.events[0].id });
  });

  it('finds the latest not-yet-undone reversible event without deleting history', () => {
    const events: GameEvent[] = [
      { id: 'select', matchId: 'match', at: 0, type: 'CommandApplied', command: { type: 'SelectClue', clueId: 'clue-200' } },
      { id: 'lock', matchId: 'match', at: 1000, type: 'CommandApplied', command: { type: 'LockTeam', teamId: 't1', at: 1000 } },
      { id: 'undo-lock', matchId: 'match', at: 1000, type: 'ActionUndone', eventId: 'lock' },
    ];

    const compensation = createCompensatingEvent(events);
    expect(compensation).toMatchObject({ type: 'ActionUndone', eventId: 'select' });
    expect(events).toHaveLength(3);
  });

  it('persists compact undo frames in the strict canonical state schema', () => {
    const game = createGame(config, selectedBoards, 0);
    const selected = apply(game, { type: 'SelectClue', clueId: 'clue-200' }).state;

    expect(gameStateSchema.safeParse(selected).success).toBe(true);
    expect(Object.keys(selected.undoStack[0].state)).not.toContain('config');

    const invalidFrame = {
      ...selected,
      undoStack: [{
        ...selected.undoStack[0],
        state: { ...selected.undoStack[0].state, config: selected.config },
      }],
    };
    expect(gameStateSchema.safeParse(invalidFrame).success).toBe(false);
  });

  it('loads a pre-fix snapshot whose undo frame predates the new nested fields', () => {
    const game = createGame(config, selectedBoards, 0);
    const selected = apply(game, { type: 'SelectClue', clueId: 'clue-200' }).state;
    const previousSnapshot = JSON.parse(JSON.stringify(selected)) as Record<string, unknown>;
    delete previousSnapshot.tiebreakerClues;
    delete previousSnapshot.usedTiebreakerClueIds;
    delete previousSnapshot.lastClosedPhase;
    delete previousSnapshot.lastClosedControllingTeamId;
    delete previousSnapshot.finalJudgments;
    const frameState = (previousSnapshot.undoStack as Array<{ state: Record<string, unknown> }>)[0].state;
    delete frameState.usedTiebreakerClueIds;
    delete frameState.lastClosedPhase;
    delete frameState.lastClosedControllingTeamId;
    delete frameState.finalJudgments;

    const result = gameStateSchema.safeParse(previousSnapshot);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.undoStack[0].state).toMatchObject({
        usedTiebreakerClueIds: [],
        lastClosedPhase: null,
        lastClosedControllingTeamId: null,
        finalJudgments: {},
      });
    }
  });

  it('requires a reason and closes a reported bad clue so the board can finish', () => {
    let state = createGame(config, selectedBoards, 0);
    expect(() => apply(state, { type: 'ReportClue', clueId: 'clue-200', reason: ' ' })).toThrow(GameRuleError);

    state = apply(state, { type: 'ReportClue', clueId: 'clue-200', reason: 'Duplicate clue' }).state;
    expect(state.disabledClueIds).toContain('clue-200');
    expect(state.usedClueIds).toContain('clue-200');

    state = apply(state, { type: 'SelectClue', clueId: 'clue-400' }).state;
    state = apply(state, { type: 'RevealResponse' }).state;
    expect(state.phase).toBe('round-two-board');
  });

  it('rejects score adjustment and clue reporting after completion', () => {
    const ended = apply(createGame(config, selectedBoards, 0), { type: 'EndIncompleteMatch' }).state;
    expect(() => apply(ended, { type: 'AdjustScore', teamId: 't1', score: 10, reason: 'Late change' })).toThrow(GameRuleError);
    expect(() => apply(ended, { type: 'ReportClue', clueId: 'clue-200', reason: 'Late report' })).toThrow(GameRuleError);
  });
});
