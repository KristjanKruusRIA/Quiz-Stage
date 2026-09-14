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
    const publicProjection = { public: true, phase: 'ordinary-clue', board: null };
    subscriptions.get('public')?.(publicProjection, 1);
    expect(hostWindow.webContents.send).not.toHaveBeenCalled();
    expect(publicWindow.webContents.send).not.toHaveBeenCalled();

    readyListeners.get(IPC_CHANNELS.hostReady)?.({ sender: hostWindow.webContents });
    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: publicWindow.webContents });
    subscriptions.get('host')?.({ private: true }, 2);
    subscriptions.get('public')?.(publicProjection, 2);
    expect(hostWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.hostState,
      { revision: 2, view: { private: true } },
    );
    expect(publicWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 2, view: publicProjection, presentation: null },
    );

    publicDestroyed = true;
    expect(() => subscriptions.get('public')?.({ public: 'newer', phase: 'ordinary-clue', board: null }, 3)).not.toThrow();
    expect(publicWindow.webContents.send).toHaveBeenCalledTimes(1);

    dispose();
    expect(removed).toEqual([IPC_CHANNELS.dispatch, IPC_CHANNELS.topicReveal]);
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
    const hostView = {
      private: true,
      state: { id: 'match-1', boards: [], phase: 'round-one-board', usedClueIds: [], activeClue: null },
      recovery: null,
    };
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
      { revision: 7, view: publicView, presentation: null },
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

  it('retains an intro for a replacement public window when delivery fails', () => {
    const subscriptions = new Map<string, (view: never, revision: number) => void>();
    const readyListeners = new Map<string, (event: { sender: { id: number } }) => void>();
    const ipcMain: IpcMainPort = {
      handle: vi.fn(), removeHandler: vi.fn(), removeListener: vi.fn(),
      on: (channel, listener) => readyListeners.set(channel, listener),
    };
    const hostWindow = { webContents: { id: 1, send: vi.fn(), isDestroyed: () => false } };
    const failingSend = vi.fn();
    failingSend.mockImplementationOnce(() => { throw new Error('window closed during send'); });
    let publicWindow = {
      webContents: {
        id: 2,
        send: failingSend,
        isDestroyed: () => false,
      },
    };
    let hostUpdate: unknown = null;
    let publicUpdate: unknown = null;
    const coordinator = {
      dispatch: vi.fn(),
      subscribe: vi.fn((surface: string, listener: (view: never, revision: number) => void) => {
        subscriptions.set(surface, listener);
        return vi.fn();
      }),
      getHostStateUpdate: vi.fn(() => hostUpdate),
      getPublicStateUpdate: vi.fn(() => publicUpdate),
    };
    registerIpc({
      ipcMain,
      coordinator: coordinator as never,
      getWindows: () => ({ hostWindow, publicWindow }),
    });

    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: publicWindow.webContents });
    const roundOne = {
      phase: 'round-one-board',
      board: {
        id: 'board-one',
        round: 'round-one',
        categories: [{ clues: [{ selected: false }] }],
      },
    };
    hostUpdate = { revision: 1, view: { state: { id: 'match-1' }, recovery: null } };
    publicUpdate = { revision: 1, view: roundOne };
    expect(() => subscriptions.get('public')?.(roundOne as never, 1)).toThrow('window closed during send');

    const replacementWindow = { webContents: { id: 3, send: vi.fn(), isDestroyed: () => false } };
    publicWindow = replacementWindow;
    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: replacementWindow.webContents });
    expect(replacementWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 1, view: roundOne, presentation: 'round-intro' },
    );
  });

  it('sends each round and Final presentation once without replaying it for undo or window recovery', () => {
    const subscriptions = new Map<string, (view: never, revision: number) => void>();
    const readyListeners = new Map<string, (event: { sender: { id: number } }) => void>();
    const ipcMain: IpcMainPort = {
      handle: vi.fn(), removeHandler: vi.fn(), removeListener: vi.fn(),
      on: (channel, listener) => readyListeners.set(channel, listener),
    };
    const hostWindow = { webContents: { id: 1, send: vi.fn(), isDestroyed: () => false } };
    let publicWindow = { webContents: { id: 2, send: vi.fn(), isDestroyed: () => false } };
    let hostUpdate: unknown = null;
    let publicUpdate: unknown = null;
    const coordinator = {
      dispatch: vi.fn(),
      subscribe: vi.fn((surface: string, listener: (view: never, revision: number) => void) => {
        subscriptions.set(surface, listener);
        return vi.fn();
      }),
      getHostStateUpdate: vi.fn(() => hostUpdate),
      getPublicStateUpdate: vi.fn(() => publicUpdate),
    };
    registerIpc({
      ipcMain,
      coordinator: coordinator as never,
      getWindows: () => ({ hostWindow, publicWindow }),
    });
    const board = (id: string, round: 'round-one' | 'round-two') => ({
      phase: round === 'round-one' ? 'round-one-board' : 'round-two-board',
      board: { id, round, categories: [{ clues: [{ selected: false }] }] },
    });
    let matchId = 'match-1';
    const publish = (view: unknown, revision: number) => {
      hostUpdate = { revision, view: { state: { id: matchId }, recovery: null } };
      publicUpdate = { revision, view };
      subscriptions.get('public')?.(view as never, revision);
    };

    const roundOne = board('board-one', 'round-one');
    publish(roundOne, 1);
    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: publicWindow.webContents });
    expect(publicWindow.webContents.send).toHaveBeenLastCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 1, view: roundOne, presentation: 'round-intro' },
    );

    publish({ phase: 'ordinary-clue', board: null }, 2);
    publish(roundOne, 3);
    expect(publicWindow.webContents.send).toHaveBeenLastCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 3, view: roundOne, presentation: null },
    );

    const recoveredWindow = { webContents: { id: 3, send: vi.fn(), isDestroyed: () => false } };
    publicWindow = recoveredWindow;
    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: recoveredWindow.webContents });
    expect(recoveredWindow.webContents.send).toHaveBeenCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 3, view: roundOne, presentation: null },
    );

    const roundTwo = board('board-two', 'round-two');
    publish(roundTwo, 4);
    expect(recoveredWindow.webContents.send).toHaveBeenLastCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 4, view: roundTwo, presentation: 'round-intro' },
    );

    const finalCategory = { phase: 'final-category', board: null };
    const finalWindow = { webContents: { id: 4, send: vi.fn(), isDestroyed: () => false } };
    publicWindow = finalWindow;
    publish(finalCategory, 5);
    const finalWagers = { phase: 'final-wagers', board: null };
    publish(finalWagers, 6);
    expect(finalWindow.webContents.send).not.toHaveBeenCalled();
    readyListeners.get(IPC_CHANNELS.publicReady)?.({ sender: finalWindow.webContents });
    expect(finalWindow.webContents.send).toHaveBeenLastCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 6, view: finalWagers, presentation: 'final-intro' },
    );

    publish(roundTwo, 7);
    publish(finalCategory, 8);
    expect(finalWindow.webContents.send).toHaveBeenLastCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 8, view: finalCategory, presentation: null },
    );

    matchId = 'match-2';
    const nextOpening = board('next-board-one', 'round-one');
    publish(nextOpening, 9);
    expect(finalWindow.webContents.send).toHaveBeenLastCalledWith(
      IPC_CHANNELS.publicState,
      { revision: 9, view: nextOpening, presentation: 'round-intro' },
    );
  });
});
