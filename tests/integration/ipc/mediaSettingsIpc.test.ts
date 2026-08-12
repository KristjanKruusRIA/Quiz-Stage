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
    registerIpc({ ipcMain, coordinator, audioSettings, getWindows: () => ({ hostWindow, publicWindow }) });

    await expect(handlers.get(IPC_CHANNELS.audioSettingsGet)!({ sender: { id: 2 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(handlers.get(IPC_CHANNELS.audioSettingsGet)!({ sender: { id: 1 } }, { extra: true })).rejects.toThrow();
    await expect(handlers.get(IPC_CHANNELS.audioSettingsUpdate)!({ sender: { id: 1 } }, { ...defaultAudioSettings, extra: true })).rejects.toThrow();
    await expect(handlers.get(IPC_CHANNELS.audioSettingsUpdate)!({ sender: { id: 1 } }, { ...defaultAudioSettings, master: 0.4 })).resolves.toEqual({ ...defaultAudioSettings, master: 0.4 });

    const ipc: PreloadIpcPort = { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn(), send: vi.fn() };
    expect(createQuizStageApi('public', ipc)).not.toHaveProperty('getAudioSettings');
    expect(createQuizStageApi('public', ipc)).not.toHaveProperty('updateAudioSettings');
  });
});
