import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: vi.fn() },
  ipcRenderer: { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn(), send: vi.fn() },
}));

import { createQuizStageApi, type PreloadIpcPort } from '../../../src/preload/preload';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
  return { promise, resolve, reject };
}

const publicView = {
  appVersion: '0.1.0' as const,
  language: 'en' as const,
  phase: 'ordinary-clue' as const,
  displayMode: 'single' as const,
  teams: [
    { id: 'a', name: 'Alpha', color: '#E3B341', score: 0 },
    { id: 'b', name: 'Beta', color: '#50A7F5', score: 0 },
  ],
  board: null,
  activeClue: null,
  timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' as const },
  controllingTeamId: 'a', winnerTeamId: null, tiebreakerTeamIds: [], final: null,
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
    finalRevealOrder: [], finalRevealedTeamIds: [], finalJudgments: {}, tiebreakerClues: [], tiebreakerTeamIds: [],
    usedTiebreakerClueIds: [], suddenDeathClueNumber: 0, winnerTeamId: null, endedIncomplete: false,
    lastClosedClueId: null, lastClosedPhase: null, lastClosedControllingTeamId: null, disabledClueIds: [],
    eventSequence: 0, undoStack: [],
  },
  replayIssue: null,
  recovery: null,
};

describe('preload quizStage surface', () => {
  it('exposes dispatch only to the host and subscriptions to both surfaces', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async (channel) => channel === IPC_CHANNELS.saveAndQuit ? undefined : hostView),
      on: vi.fn(),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const host = createQuizStageApi('host', ipc);
    const publicApi = createQuizStageApi('public', ipc);

    expect(host.dispatch).toBeTypeOf('function');
    expect(publicApi).not.toHaveProperty('dispatch');
    expect(host.hasResumableMatch).toBeTypeOf('function');
    expect(host.resumeMatch).toBeTypeOf('function');
    expect(host.listHistory).toBeTypeOf('function');
    expect(host.saveAndQuit).toBeTypeOf('function');
    expect(publicApi).not.toHaveProperty('hasResumableMatch');
    expect(publicApi).not.toHaveProperty('resumeMatch');
    expect(publicApi).not.toHaveProperty('listHistory');
    expect(publicApi).not.toHaveProperty('saveAndQuit');
    expect(host.listContent).toBeTypeOf('function');
    expect(host.previewContentImport).toBeTypeOf('function');
    expect(publicApi).not.toHaveProperty('listContent');
    expect(publicApi).not.toHaveProperty('previewContentImport');
    expect(host.subscribeToState).toBeTypeOf('function');
    expect(publicApi.subscribeToState).toBeTypeOf('function');
    expect(publicApi.subscribeToAppearance).toBeTypeOf('function');
    expect(publicApi).not.toHaveProperty('updateAppearanceSettings');

    await host.dispatch!({ type: 'SelectClue', clueId: 'c1' });
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.dispatch, { type: 'SelectClue', clueId: 'c1' });
    await host.saveAndQuit();
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.saveAndQuit, undefined);
  });

  it('strictly parses no-argument recovery and history responses', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async (channel) => {
        if (channel === IPC_CHANNELS.hasResumableMatch) return true;
        if (channel === IPC_CHANNELS.resumeMatch) return hostView;
        if (channel === IPC_CHANNELS.listHistory) return [];
        throw new Error(`Unexpected channel: ${channel}`);
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const host = createQuizStageApi('host', ipc);

    await expect(host.hasResumableMatch!()).resolves.toBe(true);
    await expect(host.resumeMatch!()).resolves.toEqual(hostView);
    await expect(host.listHistory!()).resolves.toEqual([]);
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.hasResumableMatch, undefined);
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.resumeMatch, undefined);
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.listHistory, undefined);

    vi.mocked(ipc.invoke).mockResolvedValueOnce([{ id: 'invalid-history' }]);
    await expect(host.listHistory!()).rejects.toThrow();
  });

  it('returns an unsubscribe callback that removes exactly its wrapped listener', () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const listener = vi.fn();
    const api = createQuizStageApi('public', ipc);
    const unsubscribe = api.subscribeToState(listener);
    wrapped?.({}, { revision: 1, view: publicView });
    unsubscribe();

    expect(listener).toHaveBeenCalledWith(publicView);
    expect(ipc.removeListener).toHaveBeenCalledWith(IPC_CHANNELS.publicState, wrapped);
  });

  it('registers the state listener before announcing surface readiness', () => {
    const order: string[] = [];
    const ipc = {
      invoke: vi.fn(),
      on: vi.fn(() => { order.push('listen'); }),
      removeListener: vi.fn(),
      send: vi.fn(() => { order.push('ready'); }),
    };

    createQuizStageApi('public', ipc).subscribeToState(vi.fn());

    expect(order).toEqual(['listen', 'ready']);
    expect(ipc.send).toHaveBeenCalledWith(IPC_CHANNELS.publicReady);
  });

  it('does not deliver an older bootstrap after a newer live projection', () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc = {
      invoke: vi.fn(),
      on: vi.fn((_channel: string, listener: (event: unknown, value: unknown) => void) => { wrapped = listener; }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const listener = vi.fn();
    createQuizStageApi('host', ipc).subscribeToState(listener);
    const newer = structuredClone(hostView);
    newer.state.eventSequence = 2;
    const older = structuredClone(hostView);
    older.state.eventSequence = 1;

    wrapped?.({}, { revision: 2, view: newer });
    wrapped?.({}, { revision: 1, view: older });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(newer);
  });

  it('does not deliver an older appearance bootstrap after a newer public live update', async () => {
    const bootstrap = deferred<unknown>();
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(() => bootstrap.promise),
      on: vi.fn((channel, listener) => {
        if (channel === IPC_CHANNELS.appearanceSettingsChanged) wrapped = listener;
      }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const listener = vi.fn();
    createQuizStageApi('public', ipc).subscribeToAppearance(listener);

    wrapped?.({}, { version: 1, reducedMotion: true, revision: 2 });
    bootstrap.resolve({ version: 1, reducedMotion: false, revision: 1 });
    await bootstrap.promise;
    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ version: 1, reducedMotion: true, revision: 2 });
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.appearanceSettingsGet, undefined);
  });

  it('tears down an appearance subscription before a delayed bootstrap can publish', async () => {
    const bootstrap = deferred<unknown>();
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(() => bootstrap.promise),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const listener = vi.fn();
    const unsubscribe = createQuizStageApi('public', ipc).subscribeToAppearance(listener);
    unsubscribe();
    wrapped?.({}, { version: 1, reducedMotion: true, revision: 2 });
    bootstrap.resolve({ version: 1, reducedMotion: false, revision: 1 });
    await bootstrap.promise;
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
    expect(ipc.removeListener).toHaveBeenCalledWith(IPC_CHANNELS.appearanceSettingsChanged, wrapped);
  });

  it('rejects host-shaped data on the public channel before invoking the listener', () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const listener = vi.fn();
    createQuizStageApi('public', ipc).subscribeToState(listener);

    expect(() => wrapped?.({}, { revision: 1, view: hostView })).toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects phase-incoherent private response and Final judgment probes on the public channel', () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const listener = vi.fn();
    createQuizStageApi('public', ipc).subscribeToState(listener);
    const probe = {
      ...publicView,
      phase: 'round-one-board',
      activeClue: { id: 'active-clue', prompt: 'Private prompt', responseRevealed: true, response: 'Private answer', explanation: 'Private explanation' },
      final: { category: 'Future Final', eligibleTeamIds: ['a'], revealed: [{ teamId: 'a', wager: 500, correct: true }] },
    };

    expect(() => wrapped?.({}, { revision: 1, view: probe })).toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects an invalid host dispatch result instead of returning cast data', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async () => ({ appVersion: '0.1.0', state: { id: 'incomplete' }, replayIssue: null })),
      on: vi.fn(),
      removeListener: vi.fn(),
      send: vi.fn(),
    };

    await expect(createQuizStageApi('host', ipc).dispatch!({ type: 'SelectClue', clueId: 'c1' })).rejects.toThrow();
  });

  it('exposes strictly validated setup and start methods only to the host', async () => {
    const config = hostView.state.config;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async (channel) => {
        if (channel === IPC_CHANNELS.setupOptions) {
          return {
            packs: [{ id: 'pack', name: 'Pack', enabled: true }],
            automaticDisplayMode: 'dual',
          };
        }
        if (channel === IPC_CHANNELS.contentAvailability) return { ok: true };
        if (channel === IPC_CHANNELS.startMatch) return hostView;
        throw new Error(`Unexpected channel: ${channel}`);
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const host = createQuizStageApi('host', ipc);
    const publicApi = createQuizStageApi('public', ipc);

    expect(publicApi).not.toHaveProperty('startMatch');
    expect(publicApi).not.toHaveProperty('checkContentAvailability');
    expect(publicApi).not.toHaveProperty('getSetupOptions');
    await expect(host.getSetupOptions!()).resolves.toEqual({
      packs: [{ id: 'pack', name: 'Pack', enabled: true }],
      automaticDisplayMode: 'dual',
    });
    await expect(host.checkContentAvailability!(config)).resolves.toEqual({ ok: true });
    await expect(host.startMatch!(config)).resolves.toEqual(hostView);
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.contentAvailability, config);
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.startMatch, config);
  });

  it('rejects malformed setup boundary responses before renderer use', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async () => ({ ok: false, roundOneMissing: -1 })),
      on: vi.fn(),
      removeListener: vi.fn(),
      send: vi.fn(),
    };

    await expect(
      createQuizStageApi('host', ipc).checkContentAvailability!(hostView.state.config),
    ).rejects.toThrow();
  });

  it('strictly rejects extra editor response fields and never sends renderer paths', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async (channel) => {
        if (channel === IPC_CHANNELS.contentList) return { packs: [], reports: [], extra: true };
        if (channel === IPC_CHANNELS.contentImportPreview) return { cancelled: true };
        throw new Error(`Unexpected channel: ${channel}`);
      }),
      on: vi.fn(), removeListener: vi.fn(), send: vi.fn(),
    };
    const host = createQuizStageApi('host', ipc);

    await expect(host.listContent()).rejects.toThrow();
    await expect(host.previewContentImport()).resolves.toEqual({ cancelled: true });
    expect(ipc.invoke).toHaveBeenCalledWith(IPC_CHANNELS.contentImportPreview, undefined);
  });
});
