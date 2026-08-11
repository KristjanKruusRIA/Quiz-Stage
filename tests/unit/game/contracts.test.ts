import { describe, expect, it } from 'vitest';
import { gameCommandSchema, gameConfigSchema } from '../../../src/shared/ipc/contracts';

describe('IPC contracts', () => {
  it('accepts 2-8 unique teams and one match difficulty', () => {
    const result = gameConfigSchema.safeParse({
      language: 'et', difficulty: 'hard', clueSeconds: 15,
      teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
      packIds: ['bundled'], displayMode: 'single',
    });
    expect(result.success).toBe(true);
  });

  it('rejects renderer-supplied score deltas', () => {
    expect(gameCommandSchema.safeParse({ type: 'AwardPoints', teamId: 't1', delta: 99999 }).success).toBe(false);
  });
});
