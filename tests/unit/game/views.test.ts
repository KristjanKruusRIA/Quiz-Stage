import { describe, expect, it } from 'vitest';
import { createGame, type SelectedBoards } from '../../../src/shared/game/engine';
import type { GameState } from '../../../src/shared/game/types';
import { toHostGameView, toPublicGameView } from '../../../src/shared/game/views';

const hiddenResponse = 'Heisenberg';
const hiddenDailyDoubleId = 'daily-double-secret';
const futureTiebreakerResponse = 'future-tiebreaker-response';

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

    expect(serialized).not.toContain(hiddenResponse);
    expect(serialized).not.toContain('uncertainty principle');
    expect(serialized).not.toContain(hiddenDailyDoubleId);
    expect(serialized).not.toContain(futureTiebreakerResponse);
    expect(serialized).not.toContain('future-private-source');
  });

  it('reveals only the active response after the canonical reveal flag is set', () => {
    const state = hiddenAnswerState();
    state.phase = 'daily-double-clue';
    state.activeClue = { ...state.activeClue!, responseRevealed: true };

    const serialized = JSON.stringify(toPublicGameView(state));
    expect(serialized).toContain(hiddenResponse);
    expect(serialized).not.toContain(futureTiebreakerResponse);
  });
});
