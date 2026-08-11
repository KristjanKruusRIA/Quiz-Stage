import { describe, expect, it } from 'vitest';
import { createGame, type SelectedBoards } from '../../../src/shared/game/engine';
import type { GameState } from '../../../src/shared/game/types';
import { toHostGameView, toPublicGameView } from '../../../src/shared/game/views';

const hiddenResponse = 'Heisenberg';
const hiddenDailyDoubleId = 'daily-double-secret';
const futureTiebreakerResponse = 'future-tiebreaker-response';
const unrevealedFinalWager = 777;

function hiddenAnswerState(): GameState {
  const clue = {
    id: hiddenDailyDoubleId,
    categoryId: 'science',
    round: 'round-one' as const,
    tier: 1,
    value: 200,
    prompt: { en: 'This physicist formulated an uncertainty principle' },
    response: { en: hiddenResponse },
    explanation: { en: 'It bears his name' },
    source: 'private-source',
  };
  const selected: SelectedBoards = {
    seed: 'view-seed',
    boards: [{
      id: 'round-one',
      round: 'round-one',
      categories: [{ id: 'science', name: { en: 'Science' }, macroTopic: 'science', clues: [clue] }],
    }],
    dailyDoubleClueIds: [hiddenDailyDoubleId],
    finalClue: {
      ...clue, id: 'final-private', round: 'final', tier: 0, value: 0,
      categoryName: { en: 'Final category', et: 'Finaalkategooria' },
    },
    tiebreakerClues: [{
      ...clue,
      id: 'future-tiebreaker',
      round: 'tiebreaker',
      response: { en: futureTiebreakerResponse },
      source: 'future-private-source',
    }],
  };
  const state = createGame({
    language: 'en', difficulty: 'medium', clueSeconds: 15, displayMode: 'dual', packIds: ['pack'],
    teams: [
      { id: 'a', name: 'Alpha', color: '#E3B341' },
      { id: 'b', name: 'Beta', color: '#50A7F5' },
    ],
  }, selected, 1);
  return {
    ...state,
    phase: 'daily-double-wager',
    activeClue: { clueId: hiddenDailyDoubleId, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
  };
}

describe('game view projections', () => {
  it('constructs independent host and public projections from private canonical state', () => {
    const state = hiddenAnswerState();
    const host = toHostGameView(state, null);
    const publicView = toPublicGameView(state);

    expect(host.state).not.toBe(state);
    expect(publicView).not.toHaveProperty('state');
    expect(publicView.teams).toEqual([
      { id: 'a', name: 'Alpha', color: '#E3B341', score: 0 },
      { id: 'b', name: 'Beta', color: '#50A7F5', score: 0 },
    ]);
  });

  it('redacts an unrevealed response, Daily Double identity, and future tiebreaker content', () => {
    const serialized = JSON.stringify(toPublicGameView(hiddenAnswerState()));

    expect(serialized).not.toContain('daily-double');
    expect(serialized).not.toContain(hiddenResponse);
    expect(serialized).not.toContain('uncertainty principle');
    expect(serialized).not.toContain(hiddenDailyDoubleId);
    expect(serialized).not.toContain(futureTiebreakerResponse);
    expect(serialized).not.toContain('future-private-source');
  });

  it('reveals only the active response after the canonical reveal flag is set', () => {
    const state = hiddenAnswerState();
    state.phase = 'clue-reveal';
    state.activeClue = { ...state.activeClue!, responseRevealed: true };

    const serialized = JSON.stringify(toPublicGameView(state));
    expect(serialized).not.toContain('daily-double');
    expect(serialized).toContain(hiddenResponse);
    expect(serialized).not.toContain(futureTiebreakerResponse);
  });

  it('projects only safe independent public gameplay facts', () => {
    const state = hiddenAnswerState();
    state.phase = 'tiebreaker';
    state.tiebreakerTeamIds = ['a', 'b'];
    state.timer = { durationMs: 15_000, remainingMs: 9_000, startedAt: 1_000, status: 'running' };
    const publicView = toPublicGameView(state);

    expect(publicView).toMatchObject({
      displayMode: 'dual', controllingTeamId: null, winnerTeamId: null,
      tiebreakerTeamIds: ['a', 'b'], timer: state.timer,
    });
    expect(publicView.timer).not.toBe(state.timer);
    expect(publicView.tiebreakerTeamIds).not.toBe(state.tiebreakerTeamIds);
  });

  it('never exposes unrevealed Final wagers, judgments, responses, or private recovery state', () => {
    const state = hiddenAnswerState();
    state.phase = 'final-wagers';
    state.finalEligibleTeamIds = ['a', 'b'];
    state.finalWagers = { a: 100, b: unrevealedFinalWager };
    state.finalRevealOrder = ['b', 'a'];
    state.finalRevealedTeamIds = ['a'];
    state.finalJudgments = { a: false };
    state.activeClue = null;
    state.undoStack = [{ eventId: 'private-undo', state: {
      phase: state.phase, scores: state.scores, controllingTeamId: state.controllingTeamId,
      activeClue: state.activeClue, timer: state.timer, usedClueIds: state.usedClueIds,
      dailyDoubleWager: state.dailyDoubleWager, finalEligibleTeamIds: state.finalEligibleTeamIds,
      finalWagers: state.finalWagers, finalRevealOrder: state.finalRevealOrder,
      finalRevealedTeamIds: [], tiebreakerTeamIds: [], usedTiebreakerClueIds: [], suddenDeathClueNumber: 0,
      finalJudgments: {},
      winnerTeamId: null, endedIncomplete: false, lastClosedClueId: null, lastClosedPhase: null,
      lastClosedControllingTeamId: null, disabledClueIds: [],
    } }];

    const serialized = JSON.stringify(toPublicGameView(state));
    expect(serialized).toContain('Final category');
    expect(toPublicGameView(state).final?.revealed).toEqual([{ teamId: 'a', wager: 100, correct: false }]);
    expect(serialized).not.toContain(String(unrevealedFinalWager));
    expect(serialized).not.toContain('private-seed');
    expect(serialized).not.toContain('private-undo');
    expect(serialized).not.toContain('future-tiebreaker');
    expect(serialized).not.toContain('replayIssue');
  });

  it('reveals the canonical Final response only after the first authoritative team reveal', () => {
    const state = hiddenAnswerState();
    state.phase = 'final-clue';
    state.finalEligibleTeamIds = ['a'];
    state.finalWagers = { a: 100 };
    state.activeClue = { clueId: 'final-private', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false };
    expect(JSON.stringify(toPublicGameView(state))).not.toContain(hiddenResponse);

    state.phase = 'final-reveal';
    state.finalRevealedTeamIds = ['a'];
    state.finalJudgments = { a: true };
    state.activeClue = { ...state.activeClue, responseRevealed: true };
    expect(JSON.stringify(toPublicGameView(state))).toContain(hiddenResponse);
  });
});
