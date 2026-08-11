import { describe, expect, it } from 'vitest';
import { gameCommandSchema, gameConfigSchema, gameStateSchema } from '../../../src/shared/ipc/contracts';

describe('IPC contracts', () => {
  it('accepts 2-8 unique teams and one match difficulty', () => {
    const result = gameConfigSchema.safeParse({
      language: 'et', difficulty: 'hard', clueSeconds: 15,
      teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
      packIds: ['bundled'], displayMode: 'single',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an extra renderer-supplied score delta on a valid command', () => {
    expect(gameCommandSchema.safeParse({ type: 'SelectClue', clueId: 'c1', delta: 99999 }).success).toBe(false);
  });

  it('persists the random seed and hidden Daily Double positions', () => {
    const result = gameStateSchema.safeParse({
      appVersion: '0.1.0',
      id: 'match-1',
      config: {
        language: 'en', difficulty: 'easy', clueSeconds: 15,
        teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
        packIds: ['bundled'], displayMode: 'single',
      },
      phase: 'round-one-board',
      boards: [],
      finalClue: null,
      scores: { t1: 0, t2: 0 },
      controllingTeamId: 't1',
      activeClue: null,
      timer: { durationMs: 15000, remainingMs: 15000, startedAt: null, status: 'idle' },
      usedClueIds: [],
      finalWagers: {},
      seed: 'fixed-seed',
      dailyDoubleClueIds: ['r1-c1-600'],
    });

    expect(result.success).toBe(true);
  });

  it('loads a prior snapshot with the new timer and active-lock defaults', () => {
    const result = gameStateSchema.safeParse({
      appVersion: '0.1.0',
      id: 'match-legacy',
      config: {
        language: 'en', difficulty: 'easy', clueSeconds: 15,
        teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
        packIds: ['bundled'], displayMode: 'single',
      },
      phase: 'ordinary-clue',
      boards: [],
      finalClue: null,
      scores: { t1: 0, t2: 0 },
      controllingTeamId: 't1',
      activeClue: { clueId: 'legacy-clue', lockedOutTeamIds: [], responseRevealed: false },
      usedClueIds: [],
      finalWagers: {},
      seed: 'fixed-seed',
      dailyDoubleClueIds: ['r1-c1-600'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timer).toEqual({ durationMs: 15000, remainingMs: 15000, startedAt: null, status: 'idle' });
      expect(result.data.activeClue?.lockedTeamId).toBeNull();
    }
  });

  it('rejects persisted timer state with more remaining time than its duration', () => {
    const result = gameStateSchema.safeParse({
      appVersion: '0.1.0',
      id: 'match-invalid-timer',
      config: {
        language: 'en', difficulty: 'easy', clueSeconds: 15,
        teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
        packIds: ['bundled'], displayMode: 'single',
      },
      phase: 'round-one-board',
      boards: [],
      finalClue: null,
      scores: { t1: 0, t2: 0 },
      controllingTeamId: 't1',
      activeClue: null,
      timer: { durationMs: 15000, remainingMs: 15001, startedAt: null, status: 'idle' },
      usedClueIds: [],
      finalWagers: {},
      seed: 'fixed-seed',
      dailyDoubleClueIds: [],
    });

    expect(result.success).toBe(false);
  });
});
