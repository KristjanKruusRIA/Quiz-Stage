import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: vi.fn() },
  ipcRenderer: { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn() },
}));

import { createQuizStageApi, type PreloadIpcPort } from '../../../src/preload/preload';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';

const publicView = {
  appVersion: '0.1.0' as const,
  phase: 'round-one-board' as const,
  teams: [
    { id: 'a', name: 'Alpha', color: '#E3B341', score: 0 },
    { id: 'b', name: 'Beta', color: '#50A7F5', score: 0 },
  ],
  board: null,
  activeClue: null,
};

const hostView = {
  appVersion: '0.1.0' as const,
  state: {
    appVersion: '0.1.0' as const,
    id: 'match-1',
    config: {
      language: 'en' as const, difficulty: 'easy' as const, clueSeconds: 15, displayMode: 'single' as const,
      packIds: ['pack'],
      teams: [
        { id: 'a', name: 'Alpha', color: '#E3B341' },
        { id: 'b', name: 'Beta', color: '#50A7F5' },
      ],
    },
    seed: 'seed', phase: 'round-one-board' as const, boards: [], finalClue: null,
    scores: { a: 0, b: 0 }, controllingTeamId: 'a', activeClue: null,
    timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' as const },
    usedClueIds: [], dailyDoubleClueIds: [], dailyDoubleWager: null, finalWagers: {}, finalEligibleTeamIds: [],
    finalRevealOrder: [], finalRevealedTeamIds: [], tiebreakerClues: [], tiebreakerTeamIds: [],
    usedTiebreakerClueIds: [], suddenDeathClueNumber: 0, winnerTeamId: null, endedIncomplete: false,
    lastClosedClueId: null, lastClosedPhase: null, lastClosedControllingTeamId: null, disabledClueIds: [],
    eventSequence: 0, undoStack: [],
  },
  replayIssue: null,
};

describe('preload quizStage surface', () => {
  it('exposes dispatch only to the host and subscriptions to both surfaces', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async () => hostView),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    const host = createQuizStageApi('host', ipc);
    const publicApi = createQuizStageApi('public', ipc);

    expect(host.dispatch).toBeTypeOf('function');
    expect(publicApi).not.toHaveProperty('dispatch');
    expect(host.subscribeToState).toBeTypeOf('function');
    expect(publicApi.subscribeToState).toBeTypeOf('function');

    await host.dispatch!({ type: 'SelectClue', clueId: 'c1' });
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.dispatch, { type: 'SelectClue', clueId: 'c1' });
  });

  it('returns an unsubscribe callback that removes exactly its wrapped listener', () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
    };
    const listener = vi.fn();
    const api = createQuizStageApi('public', ipc);
    const unsubscribe = api.subscribeToState(listener);
    wrapped?.({}, publicView);
    unsubscribe();

    expect(listener).toHaveBeenCalledWith(publicView);
    expect(ipc.removeListener).toHaveBeenCalledWith(IPC_CHANNELS.publicState, wrapped);
  });

  it('rejects host-shaped data on the public channel before invoking the listener', () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
    };
    const listener = vi.fn();
    createQuizStageApi('public', ipc).subscribeToState(listener);

    expect(() => wrapped?.({}, hostView)).toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects an invalid host dispatch result instead of returning cast data', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async () => ({ appVersion: '0.1.0', state: { id: 'incomplete' }, replayIssue: null })),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    await expect(createQuizStageApi('host', ipc).dispatch!({ type: 'SelectClue', clueId: 'c1' })).rejects.toThrow();
  });
});
