import { describe, expect, it, vi } from 'vitest';
vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: vi.fn() },
  ipcRenderer: { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn(), send: vi.fn() },
}));
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';
import { createQuizStageApi, type PreloadIpcPort } from '../../../src/preload/preload';
import { defaultAudioSettings } from '../../../src/shared/media/contracts';

describe('audio settings IPC', () => {
  it('strictly authorizes host reads/writes and never adds settings methods to public preload', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, value: unknown) => unknown>();
    const ipcMain: IpcMainPort = { handle: (channel, handler) => handlers.set(channel, handler), removeHandler: vi.fn(), on: vi.fn(), removeListener: vi.fn() };
    const audioSettings = { read: vi.fn(() => defaultAudioSettings), save: vi.fn((value) => value) };
    const coordinator = { dispatch: vi.fn(), subscribe: vi.fn(() => vi.fn()), getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null) };
    const hostWindow = { webContents: { id: 1, send: vi.fn(), isDestroyed: () => false } };
    const publicWindow = { webContents: { id: 2, send: vi.fn(), isDestroyed: () => false } };
    const mediaWarnings = { activeWarnings: vi.fn(() => [{ assetKey: 'opening' as const, reason: 'malformed-wav' as const }]) };
    registerIpc({ ipcMain, coordinator, audioSettings, mediaWarnings, getWindows: () => ({ hostWindow, publicWindow }) });

    await expect(handlers.get(IPC_CHANNELS.audioSettingsGet)!({ sender: { id: 2 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(handlers.get(IPC_CHANNELS.audioSettingsGet)!({ sender: { id: 1 } }, { extra: true })).rejects.toThrow();
    await expect(handlers.get(IPC_CHANNELS.audioSettingsUpdate)!({ sender: { id: 1 } }, { ...defaultAudioSettings, extra: true })).rejects.toThrow();
    await expect(handlers.get(IPC_CHANNELS.audioSettingsUpdate)!({ sender: { id: 1 } }, { ...defaultAudioSettings, master: 0.4 })).resolves.toEqual({ ...defaultAudioSettings, master: 0.4 });
    await expect(handlers.get(IPC_CHANNELS.mediaWarningsGet)!({ sender: { id: 2 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(handlers.get(IPC_CHANNELS.mediaWarningsGet)!({ sender: { id: 1 } }, undefined)).resolves.toEqual([
      { assetKey: 'opening', reason: 'malformed-wav' },
    ]);

    const ipc: PreloadIpcPort = { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn(), send: vi.fn() };
    expect(createQuizStageApi('public', ipc)).not.toHaveProperty('getAudioSettings');
    expect(createQuizStageApi('public', ipc)).not.toHaveProperty('updateAudioSettings');
  });

  it('delivers strict keyed warning/recovery events and bootstraps active warnings to host only', async () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(async (channel) => channel === IPC_CHANNELS.mediaWarningsGet
        ? [{ assetKey: 'winner', reason: 'unsafe-file' }]
        : defaultAudioSettings),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const listener = vi.fn();
    const host = createQuizStageApi('host', ipc);
    host.subscribeToMediaWarnings(listener);
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith({ status: 'warning', assetKey: 'winner', reason: 'unsafe-file' }));
    wrapped?.({}, { status: 'warning', assetKey: 'opening', reason: 'malformed-wav' });
    wrapped?.({}, { status: 'recovered', assetKey: 'opening' });
    expect(listener).toHaveBeenCalledWith({ status: 'warning', assetKey: 'opening', reason: 'malformed-wav' });
    expect(listener).toHaveBeenCalledWith({ status: 'recovered', assetKey: 'opening' });
    expect(createQuizStageApi('public', ipc)).not.toHaveProperty('subscribeToMediaWarnings');
    expect(() => wrapped?.({}, { status: 'recovered', assetKey: 'opening', path: 'C:/secret' })).toThrow();
  });

  it('does not replay a stale warning snapshot after a live recovery or unsubscribe', async () => {
    let wrapped: ((event: unknown, value: unknown) => void) | undefined;
    let resolveSnapshot!: (value: unknown) => void;
    const snapshot = new Promise((resolve) => { resolveSnapshot = resolve; });
    const ipc: PreloadIpcPort = {
      invoke: vi.fn(() => snapshot),
      on: vi.fn((_channel, listener) => { wrapped = listener; }),
      removeListener: vi.fn(),
      send: vi.fn(),
    };
    const first = vi.fn();
    createQuizStageApi('host', ipc).subscribeToMediaWarnings(first);
    wrapped?.({}, { status: 'recovered', assetKey: 'opening' });
    resolveSnapshot([{ assetKey: 'opening', reason: 'malformed-wav' }]);
    await Promise.resolve(); await Promise.resolve();
    expect(first).toHaveBeenCalledTimes(1);

    const second = vi.fn();
    const unsubscribe = createQuizStageApi('host', ipc).subscribeToMediaWarnings(second);
    unsubscribe();
    await Promise.resolve();
    expect(second).not.toHaveBeenCalled();
  });
});
