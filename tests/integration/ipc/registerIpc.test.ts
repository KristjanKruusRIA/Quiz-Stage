import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';

describe('main IPC registration', () => {
  it('allows only the current host to request an orderly save-and-quit', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, value: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: vi.fn(), on: vi.fn(), removeListener: vi.fn(),
    };
    const quit = vi.fn();
    const hostWindow = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    const publicWindow = { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } };
    registerIpc({
      ipcMain,
      coordinator: {
        dispatch: vi.fn(), subscribe: vi.fn(() => () => undefined),
        getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
      },
      getWindows: () => ({ hostWindow, publicWindow }),
      quit,
    });

    const invoke = handlers.get(IPC_CHANNELS.saveAndQuit)!;
    await expect(invoke({ sender: { id: 20 } }, undefined)).rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(invoke({ sender: { id: 10 } }, undefined)).resolves.toBeUndefined();
    expect(quit).toHaveBeenCalledOnce();
  });

  it('rejects a valid command from the public sender and accepts it from the independently verified host sender', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, value: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => handlers.delete(channel),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    const coordinator = {
      dispatch: vi.fn(async () => ({ kind: 'host' })),
      subscribe: vi.fn(() => () => undefined),
      getHostStateUpdate: vi.fn(() => null),
      getPublicStateUpdate: vi.fn(() => null),
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
    const subscriptions = new Map<string, (view: unknown, revision: number) => void>();
    const unsubscribers = [vi.fn(), vi.fn()];
    const coordinator = {
      dispatch: vi.fn(),
      subscribe: vi.fn((surface: string, listener: (view: unknown, revision: number) => void) => {
        subscriptions.set(surface, listener);
        return unsubscribers[surface === 'host' ? 0 : 1];
      }),
      getHostStateUpdate: vi.fn(() => null),
      getPublicStateUpdate: vi.fn(() => null),
    };
    const removed: string[] = [];
    const readyListeners = new Map<string, (event: { sender: { id: number } }) => void>();
    const removedReady: string[] = [];
    const ipcMain: IpcMainPort = {
      handle: vi.fn(),
      removeHandler: (channel) => removed.push(channel),
      on: (channel, listener) => readyListeners.set(channel, listener),
      removeListener: (channel, listener) => {
        expect(listener).toBe(readyListeners.get(channel));
        removedReady.push(channel);
      },
    };
    const hostWindow = { webContents: { id: 1, send: vi.fn(), isDestroyed: () => false } };
    let publicDestroyed = false;
    const publicWindow = { webContents: { id: 2, send: vi.fn(), isDestroyed: () => publicDestroyed } };
    const dispose = registerIpc({ ipcMain, coordinator, getWindows: () => ({ hostWindow, publicWindow }) });

    subscriptions.get('host')?.({ private: true }, 1);
    subscriptions.get('public')?.({ public: true }, 1);
    expect(hostWindow.webContents.send).not.toHaveBeenCalled();
    expect(publicWindow.webContents.send).not.toHaveBeenCalled();

    readyListeners.get(IPC_CHANNELS.hostReady)?.({ sender: hostWindow.webContents });
    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: publicWindow.webContents });
    subscriptions.get('host')?.({ private: true }, 2);
    subscriptions.get('public')?.({ public: true }, 2);
    expect(hostWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.hostState,
      { revision: 2, view: { private: true } },
    );
    expect(publicWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 2, view: { public: true } },
    );

    publicDestroyed = true;
    expect(() => subscriptions.get('public')?.({ public: 'newer' }, 3)).not.toThrow();
    expect(publicWindow.webContents.send).toHaveBeenCalledTimes(1);

    dispose();
    expect(removed).toEqual([IPC_CHANNELS.dispatch]);
    expect(removedReady).toEqual([IPC_CHANNELS.hostReady, IPC_CHANNELS.publicReady]);
    expect(unsubscribers[0]).toHaveBeenCalledOnce();
    expect(unsubscribers[1]).toHaveBeenCalledOnce();
  });

  it('bootstraps only the current authorized surface with its current projection', () => {
    const readyListeners = new Map<string, (event: { sender: { id: number; send(channel: string, value: unknown): void } }) => void>();
    const ipcMain = {
      handle: vi.fn(),
      removeHandler: vi.fn(),
      on: (channel: string, listener: (event: { sender: { id: number; send(channel: string, value: unknown): void } }) => void) => {
        readyListeners.set(channel, listener);
      },
      removeListener: vi.fn(),
    };
    const hostView = { private: true };
    const publicView = { public: true };
    const coordinator = {
      dispatch: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
      getHostStateUpdate: vi.fn(() => ({ revision: 7, view: hostView })),
      getPublicStateUpdate: vi.fn(() => ({ revision: 7, view: publicView })),
    };
    const hostWindow = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    const publicWindow = { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } };
    let windows = { hostWindow, publicWindow };
    registerIpc({ ipcMain, coordinator: coordinator as never, getWindows: () => windows });

    expect(() => readyListeners.get(IPC_CHANNELS.hostReady)?.({ sender: publicWindow.webContents })).not.toThrow();
    expect(publicWindow.webContents.send).not.toHaveBeenCalled();
    readyListeners.get(IPC_CHANNELS.hostReady)?.({ sender: hostWindow.webContents });
    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: publicWindow.webContents });

    expect(hostWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.hostState,
      { revision: 7, view: hostView },
    );
    expect(publicWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 7, view: publicView },
    );
    expect(publicWindow.webContents.send).not.toHaveBeenCalledWith(IPC_CHANNELS.hostState, expect.anything());

    const replacementHost = { webContents: { id: 30, send: vi.fn(), isDestroyed: () => false } };
    windows = { hostWindow: replacementHost, publicWindow };
    readyListeners.get(IPC_CHANNELS.hostReady)?.({ sender: hostWindow.webContents });
    expect(hostWindow.webContents.send).toHaveBeenCalledTimes(1);
    readyListeners.get(IPC_CHANNELS.hostReady)?.({ sender: replacementHost.webContents });
    expect(replacementHost.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.hostState,
      { revision: 7, view: hostView },
    );
  });
});
