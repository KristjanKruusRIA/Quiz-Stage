import { describe, expect, it } from 'vitest';
import { applyGameCommand, createGame, type SelectedBoards } from '../../../src/shared/game/engine';
import type { GameConfig, Round } from '../../../src/shared/game/types';

const config: GameConfig = {
  language: 'en',
  difficulty: 'medium',
  clueSeconds: 15,
  teams: [
    { id: 't1', name: 'Alpha', color: '#E3B341' },
    { id: 't2', name: 'Beta', color: '#50A7F5' },
  ],
  packIds: ['bundled'],
  displayMode: 'dual',
};

function makeBoard(round: Extract<Round, 'round-one' | 'round-two'>) {
  const values = round === 'round-one' ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];
  return {
    id: round,
    round,
    categories: Array.from({ length: 6 }, (_, categoryIndex) => ({
      id: `${round}-c${categoryIndex + 1}`,
      name: { en: `Category ${categoryIndex + 1}` },
      macroTopic: `topic-${categoryIndex + 1}`,
      clues: values.map((value, tierIndex) => ({
        id: `${round}-c${categoryIndex + 1}-${value}`,
        categoryId: `${round}-c${categoryIndex + 1}`,
        round,
        tier: tierIndex + 1,
        value,
        prompt: { en: `Prompt ${value}` },
        response: { en: `Response ${value}` },
        explanation: { en: `Explanation ${value}` },
        source: 'Fixture source',
      })),
    })),
  };
}

const selectedBoards: SelectedBoards = {
  seed: 'round-flow-seed',
  boards: [makeBoard('round-one'), makeBoard('round-two')],
  dailyDoubleClueIds: [],
};

function playCorrect(state: ReturnType<typeof createGame>, clueId: string, teamId: string, at: number) {
  const opened = applyGameCommand(state, { type: 'SelectClue', clueId }).state;
  const locked = applyGameCommand(opened, { type: 'LockTeam', teamId, at }).state;
  return applyGameCommand(locked, { type: 'JudgeResponse', correct: true, at: at + 1 }).state;
}

function playEveryClueCorrect(state: ReturnType<typeof createGame>, boardIndex: number, teamId: string, firstAt: number) {
  let nextState = state;
  let at = firstAt;
  for (const category of state.boards[boardIndex].categories) {
    for (const clue of category.clues) {
      nextState = playCorrect(nextState, clue.id, teamId, at);
      at += 1000;
    }
  }
  return nextState;
}

function revealEveryClue(state: ReturnType<typeof createGame>, boardIndex: number) {
  let nextState = state;
  for (const category of state.boards[boardIndex].categories) {
    for (const clue of category.clues) {
      const opened = applyGameCommand(nextState, { type: 'SelectClue', clueId: clue.id }).state;
      nextState = applyGameCommand(opened, { type: 'RevealResponse' }).state;
    }
  }
  return nextState;
}

describe('round transitions', () => {
  it('uses the 200 through 1,000 Round One value ladder', () => {
    const game = createGame(config, selectedBoards, 0);

    expect(game.boards[0].categories).toHaveLength(6);
    expect(game.boards[0].categories.every((category) => category.clues.length === 5)).toBe(true);
    expect(game.boards[0].categories[0].clues.map((clue) => clue.value)).toEqual([200, 400, 600, 800, 1000]);
  });

  it('uses the 400 through 2,000 Round Two value ladder', () => {
    const game = createGame(config, selectedBoards, 0);

    expect(game.boards[1].categories).toHaveLength(6);
    expect(game.boards[1].categories.every((category) => category.clues.length === 5)).toBe(true);
    expect(game.boards[1].categories[0].clues.map((clue) => clue.value)).toEqual([400, 800, 1200, 1600, 2000]);
  });

  it('selects initial control deterministically from the seeded teams', () => {
    const game = createGame(config, selectedBoards, 0);

    expect(['t1', 't2']).toContain(game.controllingTeamId);
    expect(createGame(config, selectedBoards, 0).controllingTeamId).toBe(game.controllingTeamId);
  });

  it('gives Round Two control to the lowest-scoring team', () => {
    const game = playEveryClueCorrect(createGame(config, selectedBoards, 0), 0, 't1', 1000);

    expect(game.phase).toBe('round-two-board');
    expect(game.controllingTeamId).toBe('t2');
  });

  it('breaks a tied-lowest Round Two start with the persisted seed', () => {
    const game = revealEveryClue(createGame(config, selectedBoards, 0), 0);

    expect(game.scores).toEqual({ t1: 0, t2: 0 });
    expect(game.phase).toBe('round-two-board');
    expect(game.controllingTeamId).toBe('t2');
  });

  it('moves to the Final category after every Double Round clue resolves', () => {
    const afterRoundOne = playEveryClueCorrect(createGame(config, selectedBoards, 0), 0, 't1', 1000);
    const afterRoundTwo = playEveryClueCorrect(afterRoundOne, 1, 't1', 100000);

    expect(afterRoundTwo.phase).toBe('final-category');
    expect(afterRoundTwo.usedClueIds).toHaveLength(60);
  });
});
