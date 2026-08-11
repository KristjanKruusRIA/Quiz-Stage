import { describe, expect, it, vi } from 'vitest';
import { registerIpc } from '../../../src/main/ipc/registerIpc';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';

describe('recovery and history IPC', () => {
  it('registers strict host-only no-argument handlers and removes them on dispose', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, value: unknown) => unknown>();
    const removed: string[] = [];
    const ipcMain = {
      handle: (channel: string, handler: (event: { sender: { id: number } }, value: unknown) => unknown) => handlers.set(channel, handler),
      removeHandler: (channel: string) => removed.push(channel),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    const hostWindow = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    let currentHostWindow = hostWindow;
    const matchAccess = {
      hasResumableMatch: vi.fn(() => true),
      resumeMatch: vi.fn(async () => ({ state: { config: { displayMode: 'single' } } })),
      listHistory: vi.fn(() => []),
    };
    const dispose = registerIpc({
      ipcMain,
      coordinator: {
        dispatch: vi.fn(), subscribe: vi.fn(() => vi.fn()),
        getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
      } as never,
      matchAccess,
      getWindows: () => ({ hostWindow: currentHostWindow, publicWindow: null }),
    } as never);

    for (const channel of [IPC_CHANNELS.hasResumableMatch, IPC_CHANNELS.resumeMatch, IPC_CHANNELS.listHistory]) {
      expect(handlers.has(channel)).toBe(true);
      await expect(handlers.get(channel)?.({ sender: { id: 11 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
      await expect(handlers.get(channel)?.({ sender: { id: 10 } }, { spoof: true })).rejects.toThrow();
    }
    await expect(handlers.get(IPC_CHANNELS.hasResumableMatch)?.({ sender: { id: 10 } }, undefined)).resolves.toBe(true);
    await expect(handlers.get(IPC_CHANNELS.listHistory)?.({ sender: { id: 10 } }, undefined)).resolves.toEqual([]);
    currentHostWindow = { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } };
    await expect(handlers.get(IPC_CHANNELS.hasResumableMatch)?.({ sender: { id: 10 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(handlers.get(IPC_CHANNELS.hasResumableMatch)?.({ sender: { id: 20 } }, undefined)).resolves.toBe(true);

    dispose();
    expect(removed).toEqual(expect.arrayContaining([
      IPC_CHANNELS.hasResumableMatch, IPC_CHANNELS.resumeMatch, IPC_CHANNELS.listHistory,
    ]));
  });
});
