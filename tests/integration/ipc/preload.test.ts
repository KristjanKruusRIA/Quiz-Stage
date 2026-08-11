import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: vi.fn() },
  ipcRenderer: { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn() },
}));

import { createQuizStageApi, type PreloadIpcPort } from '../../../src/preload/preload';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';

describe('preload quizStage surface', () => {
  it('exposes dispatch only to the host and subscriptions to both surfaces', async () => {
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async () => ({ ok: true })),
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
    wrapped?.({}, { phase: 'round-one-board' });
    unsubscribe();

    expect(listener).toHaveBeenCalledWith({ phase: 'round-one-board' });
    expect(ipc.removeListener).toHaveBeenCalledWith(IPC_CHANNELS.publicState, wrapped);
  });
});
