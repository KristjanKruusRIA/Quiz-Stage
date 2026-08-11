import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';
import { registerIpc, type IpcMainPort } from '../../../src/main/ipc/registerIpc';
import { selectMatchContent } from '../../../src/shared/game/boardSelector';
import { createGame } from '../../../src/shared/game/engine';
import { toHostGameView } from '../../../src/shared/game/views';
import { selectionInput } from '../../fixtures/contentFactory';

const config = {
  language: 'en' as const,
  difficulty: 'medium' as const,
  clueSeconds: 15,
  teams: [
    { id: 'a', name: 'Alpha', color: '#E3B341' },
    { id: 'b', name: 'Beta', color: '#50A7F5' },
  ],
  packIds: ['enabled-pack'],
  displayMode: 'single' as const,
};

describe('setup IPC registration', () => {
  it('authorizes every setup method against the current host and forwards validated values', async () => {
    const selected = selectMatchContent(selectionInput({ config }));
    if (!selected.ok) throw new Error('Expected fixture content');
    const canonicalClue = (clue: typeof selected.finalClue) => ({
      id: clue.id,
      categoryId: clue.categoryId,
      round: clue.round,
      tier: clue.tier,
      value: clue.value,
      prompt: clue.prompt,
      response: clue.response,
      explanation: clue.explanation,
      source: clue.source,
      ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: clue.acceptedResponses }),
    });
    const selectedBoards = {
      seed: selected.seed,
      boards: selected.boards.map((board) => ({
        ...board,
        categories: board.categories.map((category) => ({
          id: category.id,
          name: category.name,
          macroTopic: category.macroTopic,
          clues: category.clues.map((clue) => ({
            id: clue.id,
            categoryId: clue.categoryId,
            round: clue.round,
            tier: clue.tier,
            value: clue.value,
            prompt: clue.prompt,
            response: clue.response,
            explanation: clue.explanation,
            source: clue.source,
            ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: clue.acceptedResponses }),
          })),
        })),
      })) as typeof selected.boards,
      finalClue: canonicalClue(selected.finalClue),
      dailyDoubleClueIds: selected.dailyDoubleClueIds,
      tiebreakerClues: [],
    };
    const startedView = toHostGameView(createGame(config, selectedBoards, 1), null);
    const handlers = new Map<string, (event: { sender: { id: number } }, value: unknown) => unknown>();
    const removed: string[] = [];
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: (channel) => removed.push(channel),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    const coordinator = {
      dispatch: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
      getHostStateUpdate: vi.fn(() => null),
      getPublicStateUpdate: vi.fn(() => null),
    };
    const setup = {
      startMatch: vi.fn(async () => startedView),
      checkContentAvailability: vi.fn(() => ({ ok: true })),
      getSetupOptions: vi.fn((automaticDisplayMode: 'single' | 'dual') => ({
        packs: [{ id: 'pack', name: 'Pack', enabled: true }],
        automaticDisplayMode,
      })),
    };
    const oldHost = { webContents: { id: 10, send: vi.fn(), isDestroyed: () => false } };
    const publicWindow = { webContents: { id: 20, send: vi.fn(), isDestroyed: () => false } };
    let hostWindow = oldHost;
    const dispose = registerIpc({
      ipcMain,
      coordinator,
      setup,
      getAutomaticDisplayMode: () => 'dual',
      getWindows: () => ({ hostWindow, publicWindow }),
    });

    for (const channel of [IPC_CHANNELS.startMatch, IPC_CHANNELS.contentAvailability, IPC_CHANNELS.setupOptions]) {
      await expect(handlers.get(channel)!({ sender: { id: 20 } }, config)).rejects.toThrow('HOST_SENDER_REQUIRED');
    }
    hostWindow = { webContents: { id: 30, send: vi.fn(), isDestroyed: () => false } };
    await expect(handlers.get(IPC_CHANNELS.startMatch)!({ sender: { id: 10 } }, config))
      .rejects.toThrow('HOST_SENDER_REQUIRED');
    await expect(handlers.get(IPC_CHANNELS.contentAvailability)!({ sender: { id: 30 } }, config))
      .resolves.toEqual({ ok: true });
    await expect(handlers.get(IPC_CHANNELS.setupOptions)!({ sender: { id: 30 } }, undefined))
      .resolves.toEqual({
        packs: [{ id: 'pack', name: 'Pack', enabled: true }],
        automaticDisplayMode: 'dual',
      });
    await expect(handlers.get(IPC_CHANNELS.startMatch)!({ sender: { id: 30 } }, config))
      .resolves.toEqual(startedView);
    expect(setup.checkContentAvailability).toHaveBeenCalledWith(config);
    expect(setup.startMatch).toHaveBeenCalledWith(config);
    expect(setup.getSetupOptions).toHaveBeenCalledWith('dual');

    dispose();
    expect(removed).toEqual(expect.arrayContaining([
      IPC_CHANNELS.dispatch,
      IPC_CHANNELS.startMatch,
      IPC_CHANNELS.contentAvailability,
      IPC_CHANNELS.setupOptions,
    ]));
  });

  it('rejects invalid configuration before calling the authoritative setup port', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, value: unknown) => unknown>();
    const ipcMain: IpcMainPort = {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    const setup = {
      startMatch: vi.fn(),
      checkContentAvailability: vi.fn(),
      getSetupOptions: vi.fn(),
    };
    const hostWindow = { webContents: { id: 1, send: vi.fn(), isDestroyed: () => false } };
    registerIpc({
      ipcMain,
      coordinator: {
        dispatch: vi.fn(), subscribe: vi.fn(() => () => undefined),
        getHostStateUpdate: vi.fn(() => null), getPublicStateUpdate: vi.fn(() => null),
      },
      setup,
      getAutomaticDisplayMode: () => 'single',
      getWindows: () => ({ hostWindow, publicWindow: null }),
    });

    await expect(handlers.get(IPC_CHANNELS.startMatch)!({ sender: { id: 1 } }, { ...config, teams: [] }))
      .rejects.toThrow();
    expect(setup.startMatch).not.toHaveBeenCalled();
  });
});
