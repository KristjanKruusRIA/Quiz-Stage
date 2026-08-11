import { describe, expect, it } from 'vitest';
import { applyGameCommand, createGame, type SelectedBoards } from '../../../src/shared/game/engine';
import { GameRuleError } from '../../../src/shared/game/reducer';
import type { GameConfig, Round } from '../../../src/shared/game/types';

const config: GameConfig = {
  language: 'en',
  difficulty: 'easy',
  clueSeconds: 15,
  teams: [
    { id: 't1', name: 'Alpha', color: '#E3B341' },
    { id: 't2', name: 'Beta', color: '#50A7F5' },
  ],
  packIds: ['bundled'],
  displayMode: 'single',
};

const selectedBoards: SelectedBoards = {
  seed: 'fixed-seed',
  boards: [board('round-one'), board('round-two')],
  dailyDoubleClueIds: [],
};

const game = createGame(config, selectedBoards, 0);

function board(round: Extract<Round, 'round-one' | 'round-two'>) {
  const values = round === 'round-one' ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];
  return {
    id: round,
    round,
    categories: [{
      id: `${round}-c1`,
      name: { en: 'Category' },
      macroTopic: 'topic',
      clues: values.map((value, index) => ({
        id: `${round === 'round-one' ? 'r1' : 'r2'}-c1-${value}`,
        categoryId: `${round}-c1`,
        round,
        tier: index + 1,
        value,
        prompt: { en: `Prompt ${value}` },
        response: { en: `Response ${value}` },
        explanation: { en: `Explanation ${value}` },
        source: 'Fixture source',
      })),
    }],
  };
}

function command(state: typeof game, input: Parameters<typeof applyGameCommand>[1]) {
  return applyGameCommand(state, input).state;
}

function selectFixtureClue(state: typeof game, clueId: string) {
  return command(state, { type: 'SelectClue', clueId });
}

function openLockAndJudge(state: typeof game, clueId: string, teamId: string, correct: boolean) {
  return command(
    command(selectFixtureClue(state, clueId), { type: 'LockTeam', teamId, at: 1000 }),
    { type: 'JudgeResponse', correct, at: 1100 },
  );
}

function scoreOf(state: typeof game, teamId: string) {
  return state.scores[teamId];
}

describe('ordinary clue play', () => {
  it('adds value and transfers control after a correct response', () => {
    const opened = selectFixtureClue(game, 'r1-c1-600');
    const locked = command(opened, { type: 'LockTeam', teamId: 't2', at: 1000 });
    const judged = command(locked, { type: 'JudgeResponse', correct: true, at: 1100 });

    expect(scoreOf(judged, 't2')).toBe(600);
    expect(judged.controllingTeamId).toBe('t2');
    expect(judged).toMatchObject({ phase: 'clue-reveal', activeClue: { responseRevealed: true } });

    const advanced = command(judged, { type: 'AdvanceAfterReveal' });
    expect(advanced.phase).toBe('round-one-board');
  });

  it('subtracts value, locks the team out, and preserves remaining time', () => {
    const judged = openLockAndJudge(game, 'r1-c1-400', 't1', false);

    expect(scoreOf(judged, 't1')).toBe(-400);
    expect(judged.activeClue?.lockedOutTeamIds).toContain('t1');
    expect(judged.timer.remainingMs).toBeGreaterThan(0);
  });

  it('retains board control when no team answers correctly', () => {
    const initialControl = game.controllingTeamId;
    const revealed = command(selectFixtureClue(game, 'r1-c1-200'), { type: 'RevealResponse' });

    expect(revealed.controllingTeamId).toBe(initialControl);
    expect(revealed.activeClue?.responseRevealed).toBe(true);
  });

  it('reveals the response after every team is locked out', () => {
    const opened = selectFixtureClue(game, 'r1-c1-800');
    const t1Incorrect = command(
      command(opened, { type: 'LockTeam', teamId: 't1', at: 1000 }),
      { type: 'JudgeResponse', correct: false, at: 1100 },
    );
    const allLocked = command(
      command(t1Incorrect, { type: 'LockTeam', teamId: 't2', at: 1200 }),
      { type: 'JudgeResponse', correct: false, at: 1300 },
    );

    expect(allLocked.activeClue?.responseRevealed).toBe(true);
    expect(allLocked.phase).toBe('clue-reveal');
  });

  it('rejects selecting a second clue before the active clue resolves', () => {
    const opened = selectFixtureClue(game, 'r1-c1-200');

    expect(() => command(opened, { type: 'SelectClue', clueId: 'r1-c1-400' })).toThrow(GameRuleError);
  });

  it('emits distinct event IDs for successive ordinary-play commands', () => {
    const selected = applyGameCommand(game, { type: 'SelectClue', clueId: 'r1-c1-200' });
    const firstLock = applyGameCommand(selected.state, { type: 'LockTeam', teamId: 't1', at: 1000 });
    const firstJudgment = applyGameCommand(firstLock.state, { type: 'JudgeResponse', correct: false, at: 1100 });
    const secondLock = applyGameCommand(firstJudgment.state, { type: 'LockTeam', teamId: 't2', at: 1200 });

    expect(new Set([
      selected.events[0].id,
      firstLock.events[0].id,
      firstJudgment.events[0].id,
      secondLock.events[0].id,
    ]).size).toBe(4);
  });
});
