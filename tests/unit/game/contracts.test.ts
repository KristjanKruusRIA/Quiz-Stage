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
      usedClueIds: [],
      finalWagers: {},
      seed: 'fixed-seed',
      dailyDoubleClueIds: ['r1-c1-600'],
    });

    expect(result.success).toBe(true);
  });
});
