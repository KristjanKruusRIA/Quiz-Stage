import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';

describe('main IPC registration', () => {
  it('rejects a valid command from the public sender and accepts it from the independently verified host sender', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, value: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
    };
    const coordinator = {
      dispatch: vi.fn(async () => ({ kind: 'host' })),
      subscribe: vi.fn(() => () => undefined),
    };
    const hostWindow = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    const publicWindow = { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } };
    let windows = { hostWindow, publicWindow };
    registerIpc({ ipcMain, coordinator, getWindows: () => windows });
    const invoke = handlers.get(IPC_CHANNELS.dispatch)!;
    const command = { type: 'SelectClue', clueId: 'clue-1' };

    await expect(invoke({ sender: { id: 20 } }, command)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(invoke({ sender: { id: 10 } }, command)).resolves.toEqual({ kind: 'host' });
    const replacementHost = { webContents: { id: 30, send: vi.fn(), isDestroyed: () => false } };
    windows = { hostWindow: replacementHost, publicWindow };
    await expect(invoke({ sender: { id: 10 } }, command)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(invoke({ sender: { id: 30 } }, command)).resolves.toEqual({ kind: 'host' });
    expect(coordinator.dispatch).toHaveBeenCalledTimes(2);
  });

  it('routes independently projected state to its intended window and cleans listeners up', () => {
    const subscriptions = new Map<string, (view: unknown) => void>();
    const unsubscribers = [vi.fn(), vi.fn()];
    const coordinator = {
      dispatch: vi.fn(),
      subscribe: vi.fn((surface: string, listener: (view: unknown) => void) => {
        subscriptions.set(surface, listener);
        return unsubscribers[surface === 'host' ? 0 : 1];
      }),
    };
    const removed: string[] = [];
    const ipcMain: IpcMainPort = { handle: vi.fn(), removeHandler: (channel) => removed.push(channel) };
    const hostWindow = { webContents: { id: 1, send: vi.fn(), isDestroyed: () => false } };
    let publicDestroyed = false;
    const publicWindow = { webContents: { id: 2, send: vi.fn(), isDestroyed: () => publicDestroyed } };
    const dispose = registerIpc({ ipcMain, coordinator, getWindows: () => ({ hostWindow, publicWindow }) });

    subscriptions.get('host')?.({ private: true });
    subscriptions.get('public')?.({ public: true });
    expect(hostWindow.webContents.send).toHaveBeenCalledWith(IPC_CHANNELS.hostState, { private: true });
    expect(publicWindow.webContents.send).toHaveBeenCalledWith(IPC_CHANNELS.publicState, { public: true });

    publicDestroyed = true;
    expect(() => subscriptions.get('public')?.({ public: 'newer' })).not.toThrow();
    expect(publicWindow.webContents.send).toHaveBeenCalledTimes(1);

    dispose();
    expect(removed).toEqual([IPC_CHANNELS.dispatch]);
    expect(unsubscribers[0]).toHaveBeenCalledOnce();
    expect(unsubscribers[1]).toHaveBeenCalledOnce();
  });
});
