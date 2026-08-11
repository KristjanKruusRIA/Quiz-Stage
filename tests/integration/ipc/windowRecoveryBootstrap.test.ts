import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: vi.fn() },
  ipcRenderer: { invoke: vi.fn(), on: vi.fn(), removeListener: vi.fn(), send: vi.fn() },
}));

import { GameCoordinator, type CoordinatorContentService, type CoordinatorMatchRepository } from '../../../src/main/coordinator/gameCoordinator';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';
import { WindowManager, type ManagedWindow, type WindowFactory } from '../../../src/main/windows/windowManager';
import { createQuizStageApi, type PreloadIpcPort } from '../../../src/preload/preload';
import { selectMatchContent } from '../../../src/shared/game/boardSelector';
import type { HostGameView, PublicGameView } from '../../../src/shared/game/types';
import { selectionInput } from '../../fixtures/contentFactory';

interface MainEvent {
  sender: {
    id: number;
    send(channel: string, value: unknown): void;
  };
}

function coordinatorHarness() {
  const input = selectionInput({ config: { ...selectionInput().config, displayMode: 'dual' } });
  const selected = selectMatchContent(input);
  if (!selected.ok) throw new Error('fixture selection failed');
  const repository: CoordinatorMatchRepository = {
    persistTransition: vi.fn(),
    loadResumable: vi.fn(() => null),
    recoverLatest: vi.fn(() => null),
    completeMatch: vi.fn(),
  };
  const contentService: CoordinatorContentService = {
    selectForMatch: vi.fn(() => selected),
    selectNextTiebreaker: vi.fn(() => ({ ...input.finalClues[1], round: 'tiebreaker' as const })),
  };
  return {
    config: input.config,
    coordinator: new GameCoordinator({ repository, contentService, now: () => 42, createSeed: () => 'seed' }),
    futureTiebreaker: input.finalClues[1],
  };
}

function desktopHarness(coordinator: GameCoordinator) {
  const handlers = new Map<string, (event: MainEvent, value: unknown) => unknown>();
  const readyListeners = new Map<string, (event: MainEvent) => void>();
  const ipcMain = {
    handle: (channel: string, handler: (event: MainEvent, value: unknown) => unknown) => handlers.set(channel, handler),
    removeHandler: (channel: string) => handlers.delete(channel),
    on: (channel: string, listener: (event: MainEvent) => void) => readyListeners.set(channel, listener),
    removeListener: (channel: string) => readyListeners.delete(channel),
  } as unknown as IpcMainPort;
  const records: Array<{
    surface: 'host' | 'public';
    window: ManagedWindow;
    close(): void;
    rendererIpc: PreloadIpcPort;
  }> = [];
  let nextId = 1;
  const factory: WindowFactory = (options) => {
    const surface = options.webPreferences.additionalArguments[0] === '--surface=host' ? 'host' : 'public';
    const rendererListeners = new Map<string, Set<(event: unknown, value: unknown) => void>>();
    let closeListener: () => void = () => undefined;
    let destroyed = false;
    const webContents = {
      id: nextId++,
      on: vi.fn(),
      setWindowOpenHandler: vi.fn(),
      isDestroyed: () => destroyed,
      send: (channel: string, value: unknown) => {
        for (const listener of rendererListeners.get(channel) ?? []) listener({}, value);
      },
    };
    const window: ManagedWindow = {
      webContents,
      loadURL: vi.fn(),
      loadFile: vi.fn(),
      on: (_event, listener) => { closeListener = listener; },
      isDestroyed: () => destroyed,
    };
    const rendererIpc = {
      invoke: async (channel: string, value: unknown) => handlers.get(channel)?.({ sender: webContents }, value),
      on: (channel: string, listener: (event: unknown, value: unknown) => void) => {
        const listeners = rendererListeners.get(channel) ?? new Set();
        listeners.add(listener);
        rendererListeners.set(channel, listeners);
      },
      removeListener: (channel: string, listener: (event: unknown, value: unknown) => void) => {
        rendererListeners.get(channel)?.delete(listener);
      },
      send: (channel: string) => readyListeners.get(channel)?.({ sender: webContents }),
    } as PreloadIpcPort;
    records.push({
      surface,
      window,
      close: () => {
        destroyed = true;
        closeListener();
      },
      rendererIpc,
    });
    return window;
  };
  const manager = new WindowManager({
    createWindow: factory,
    preloadPath: 'C:/app/preload.js',
    rendererHtmlPath: 'C:/app/index.html',
  });
  manager.create('dual');
  const disposeIpc = registerIpc({ ipcMain, coordinator, getWindows: () => manager.getWindows() });
  return { manager, records, disposeIpc };
}

describe('recovered window state bootstrap', () => {
  it('delivers each replacement its current surface projection without another host command', async () => {
    const { config, coordinator, futureTiebreaker } = coordinatorHarness();
    const desktop = desktopHarness(coordinator);
    await coordinator.startMatch(config);
    const before = coordinator.getHostView()!;
    const dailyDoubleId = before.state.dailyDoubleClueIds.find((id) =>
      before.state.boards[0].categories.some((category) => category.clues.some((clue) => clue.id === id)),
    );
    if (dailyDoubleId === undefined) throw new Error('round-one Daily Double fixture missing');
    await coordinator.dispatch({ type: 'SelectClue', clueId: dailyDoubleId });
    const expectedHost = coordinator.getHostView()!;
    const hiddenClue = expectedHost.state.boards[0].categories
      .flatMap((category) => category.clues)
      .find((clue) => clue.id === dailyDoubleId)!;

    desktop.records[0].close();
    await Promise.resolve();
    const replacementHost = desktop.records[2];
    const hostStates: HostGameView[] = [];
    createQuizStageApi('host', replacementHost.rendererIpc).subscribeToState((view) => {
      hostStates.push(view as HostGameView);
    });

    desktop.records[1].close();
    await Promise.resolve();
    const replacementPublic = desktop.records[3];
    const publicStates: PublicGameView[] = [];
    createQuizStageApi('public', replacementPublic.rendererIpc).subscribeToState((view) => {
      publicStates.push(view as PublicGameView);
    });

    expect.soft(hostStates).toEqual([expectedHost]);
    expect.soft(publicStates).toEqual([coordinator.getPublicView()]);
    expect.soft(JSON.stringify(hostStates)).toContain(hiddenClue.response.en);
    const publicJson = JSON.stringify(publicStates);
    expect.soft(publicJson).not.toContain('daily-double');
    expect.soft(publicJson).not.toContain(hiddenClue.prompt.en);
    expect.soft(publicJson).not.toContain(hiddenClue.response.en);
    expect.soft(publicJson).not.toContain(hiddenClue.explanation.en);
    expect.soft(publicJson).not.toContain(expectedHost.state.finalClue!.response.en);
    expect.soft(publicJson).not.toContain(futureTiebreaker.prompt.en);
    expect.soft(publicJson).not.toContain(futureTiebreaker.response.en);
    desktop.disposeIpc();
    desktop.manager.dispose();
  });
});
