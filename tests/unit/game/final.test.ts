import { describe, expect, it } from 'vitest';
import {
  applyFinalJudgment,
  applyGameCommand,
  createGame,
  finalEligibleTeams,
  tickTimer,
  type SelectedBoards,
} from '../../../src/shared/game/engine';
import { GameRuleError } from '../../../src/shared/game/reducer';
import type { GameConfig, GameState } from '../../../src/shared/game/types';

const config: GameConfig = {
  language: 'en', difficulty: 'hard', clueSeconds: 15,
  teams: [
    { id: 'positive-only', name: 'Positive', color: '#E3B341' },
    { id: 'zero', name: 'Zero', color: '#50A7F5' },
    { id: 'negative', name: 'Negative', color: '#EF6F6C' },
  ],
  packIds: ['bundled'], displayMode: 'single',
};

const clue = {
  id: 'r2-clue', categoryId: 'cat', round: 'round-two' as const, tier: 1, value: 400,
  prompt: { en: 'Prompt' }, response: { en: 'Response' }, explanation: { en: 'Explanation' }, source: 'Source',
};

const finalClue = { ...clue, id: 'final', round: 'final' as const };
const tiebreakerClues = [1, 2, 3].map((number) => ({
  ...clue,
  id: `tiebreaker-${number}`,
  round: 'tiebreaker' as const,
  prompt: { en: `Tiebreaker prompt ${number}` },
  response: { en: `Tiebreaker response ${number}` },
  explanation: { en: `Tiebreaker explanation ${number}` },
  source: `Tiebreaker source ${number}`,
}));
const selectedBoards: SelectedBoards = {
  seed: 'final-seed', dailyDoubleClueIds: [], finalClue, tiebreakerClues,
  boards: [{ id: 'r2', round: 'round-two', categories: [{ id: 'cat', name: { en: 'Category' }, macroTopic: 'topic', clues: [clue] }] }],
};

function baseFinalState(scores: Record<string, number>): GameState {
  return { ...createGame(config, selectedBoards, 0), phase: 'final-category', scores };
}

function apply(state: GameState, command: Parameters<typeof applyGameCommand>[1]) {
  return applyGameCommand(state, command).state;
}

describe('Final', () => {
  it('includes only teams with positive scores', () => {
    const state = baseFinalState({ 'positive-only': 100, zero: 0, negative: -100 });
    expect(finalEligibleTeams(state).map((team) => team.id)).toEqual(['positive-only']);
  });

  it('applies correct and incorrect wagers arithmetically', () => {
    expect(applyFinalJudgment(1200, 1000, false)).toBe(200);
    expect(applyFinalJudgment(1200, 1000, true)).toBe(2200);
  });

  it('accepts Final wagers from zero through the eligible team score', () => {
    const state = baseFinalState({ 'positive-only': 1000, zero: 0, negative: -100 });
    expect(apply(state, { type: 'SubmitFinalWager', teamId: 'positive-only', wager: 0 }).finalWagers).toEqual({ 'positive-only': 0 });

    const fresh = baseFinalState({ 'positive-only': 1000, zero: 0, negative: -100 });
    expect(apply(fresh, { type: 'SubmitFinalWager', teamId: 'positive-only', wager: 1000 }).finalWagers).toEqual({ 'positive-only': 1000 });
  });

  it('rejects wagers from an ineligible team and outside the inclusive range', () => {
    const state = baseFinalState({ 'positive-only': 1000, zero: 0, negative: -100 });
    expect(() => apply(state, { type: 'SubmitFinalWager', teamId: 'zero', wager: 0 })).toThrow(GameRuleError);
    expect(() => apply(state, { type: 'SubmitFinalWager', teamId: 'positive-only', wager: -1 })).toThrow(GameRuleError);
    expect(() => apply(state, { type: 'SubmitFinalWager', teamId: 'positive-only', wager: 1001 })).toThrow(GameRuleError);
  });

  it('starts a fixed 30-second clock after all wagers are committed', () => {
    const state = baseFinalState({ 'positive-only': 1000, zero: 0, negative: -100 });
    const wagered = apply(state, { type: 'SubmitFinalWager', teamId: 'positive-only', wager: 500 });
    expect(wagered.phase).toBe('final-clue');
    expect(wagered.timer).toEqual({ durationMs: 30_000, remainingMs: 30_000, startedAt: null, status: 'running' });
  });

  it('rejects an early Final reveal and accepts it after the fixed clock expires', () => {
    const state = baseFinalState({ 'positive-only': 1000, zero: 0, negative: -100 });
    const wagered = apply(state, { type: 'SubmitFinalWager', teamId: 'positive-only', wager: 500 });
    expect(() => apply(wagered, { type: 'RevealFinalTeam', teamId: 'positive-only', correct: true })).toThrow(GameRuleError);

    tickTimer(wagered, 1_000);
    const paused = apply(wagered, { type: 'PauseTimer', at: 2_000 });
    expect(() => apply(paused, { type: 'RevealFinalTeam', teamId: 'positive-only', correct: true })).toThrow(GameRuleError);
    expect(tickTimer(wagered, 31_000)[0].type).toBe('TimerExpired');
    expect(apply(wagered, { type: 'RevealFinalTeam', teamId: 'positive-only', correct: true }).scores['positive-only']).toBe(1500);
  });

  it('enforces lowest-to-highest pre-Final reveal order', () => {
    let state = baseFinalState({ 'positive-only': 3000, zero: 1000, negative: 2000 });
    state = apply(state, { type: 'SubmitFinalWager', teamId: 'positive-only', wager: 1000 });
    state = apply(state, { type: 'SubmitFinalWager', teamId: 'zero', wager: 1000 });
    state = apply(state, { type: 'SubmitFinalWager', teamId: 'negative', wager: 1000 });
    tickTimer(state, 1_000);
    tickTimer(state, 31_000);

    expect(() => apply(state, { type: 'RevealFinalTeam', teamId: 'positive-only', correct: true })).toThrow(GameRuleError);
    state = apply(state, { type: 'RevealFinalTeam', teamId: 'zero', correct: false });
    state = apply(state, { type: 'RevealFinalTeam', teamId: 'negative', correct: true });
    state = apply(state, { type: 'RevealFinalTeam', teamId: 'positive-only', correct: false });

    expect(state.phase).toBe('complete');
    expect(state.winnerTeamId).toBe('negative');
  });

  it('skips Final when nobody is eligible and selects the unique high score', () => {
    let state: GameState = { ...createGame(config, selectedBoards, 0), phase: 'round-two-board', scores: { 'positive-only': 0, zero: -100, negative: -200 } };
    state = apply(state, { type: 'SelectClue', clueId: 'r2-clue' });
    state = apply(state, { type: 'RevealResponse' });

    expect(state.phase).toBe('complete');
    expect(state.winnerTeamId).toBe('positive-only');
  });

  it('uses repeated sudden-death clues until a tied team answers correctly', () => {
    let state: GameState = { ...createGame(config, selectedBoards, 0), phase: 'round-two-board', scores: { 'positive-only': 0, zero: 0, negative: -100 } };
    state = apply(state, { type: 'SelectClue', clueId: 'r2-clue' });
    state = apply(state, { type: 'RevealResponse' });
    expect(state.phase).toBe('tiebreaker');
    expect(state.activeClue?.clueId).toBe('tiebreaker-1');
    expect(state.tiebreakerClues.find((candidate) => candidate.id === state.activeClue?.clueId)).toMatchObject({
      prompt: { en: 'Tiebreaker prompt 1' },
      response: { en: 'Tiebreaker response 1' },
      explanation: { en: 'Tiebreaker explanation 1' },
      source: 'Tiebreaker source 1',
    });

    const firstClueId = state.activeClue?.clueId;
    state = apply(state, { type: 'LockTeam', teamId: 'positive-only', at: 1000 });
    state = apply(state, { type: 'JudgeResponse', correct: false, at: 1100 });
    state = apply(state, { type: 'LockTeam', teamId: 'zero', at: 1200 });
    state = apply(state, { type: 'JudgeResponse', correct: false, at: 1300 });
    expect(state.phase).toBe('tiebreaker');
    expect(state.activeClue?.clueId).toBe('tiebreaker-2');
    expect(state.activeClue?.clueId).not.toBe(firstClueId);
    expect(state.usedTiebreakerClueIds).toEqual(['tiebreaker-1', 'tiebreaker-2']);

    state = apply(state, { type: 'LockTeam', teamId: 'zero', at: 1400 });
    state = apply(state, { type: 'JudgeResponse', correct: true, at: 1500 });
    expect(state.phase).toBe('complete');
    expect(state.winnerTeamId).toBe('zero');
  });

  it('opens another sudden-death clue when nobody answers', () => {
    let state: GameState = { ...createGame(config, selectedBoards, 0), phase: 'round-two-board', scores: { 'positive-only': 0, zero: 0, negative: -100 } };
    state = apply(state, { type: 'SelectClue', clueId: 'r2-clue' });
    state = apply(state, { type: 'RevealResponse' });
    const firstClueId = state.activeClue?.clueId;

    state = apply(state, { type: 'RevealResponse' });
    expect(state.phase).toBe('tiebreaker');
    expect(state.activeClue?.clueId).not.toBe(firstClueId);
  });
});
