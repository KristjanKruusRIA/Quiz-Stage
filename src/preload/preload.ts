import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/channels';
import type { GameCommand } from '../shared/game/commands';
import type { HostGameView, PublicGameView } from '../shared/game/types';
import {
  contentAvailabilitySchema,
  gameCommandSchema,
  gameConfigSchema,
  hostGameViewSchema,
  hasResumableMatchSchema,
  hostStateUpdateSchema,
  matchHistorySchema,
  publicStateUpdateSchema,
  setupOptionsSchema,
  type QuizStageApi,
} from '../shared/ipc/contracts';

export interface PreloadIpcPort {
  invoke(channel: string, value: unknown): Promise<unknown>;
  on(channel: string, listener: (event: unknown, value: unknown) => void): unknown;
  removeListener(channel: string, listener: (event: unknown, value: unknown) => void): unknown;
  send(channel: string): void;
}

export function createQuizStageApi(surface: 'host' | 'public', ipc: PreloadIpcPort): QuizStageApi {
  const stateChannel = surface === 'host' ? IPC_CHANNELS.hostState : IPC_CHANNELS.publicState;
  const readyChannel = surface === 'host' ? IPC_CHANNELS.hostReady : IPC_CHANNELS.publicReady;
  const stateUpdateSchema = surface === 'host' ? hostStateUpdateSchema : publicStateUpdateSchema;
  const subscribeToState = (listener: (view: HostGameView | PublicGameView) => void) => {
    let latestRevision = -1;
    const wrapped = (_event: unknown, value: unknown) => {
      const update = stateUpdateSchema.parse(value);
      if (update.revision <= latestRevision) return;
      latestRevision = update.revision;
      listener(update.view);
    };
    ipc.on(stateChannel, wrapped);
    ipc.send(readyChannel);
    return () => ipc.removeListener(stateChannel, wrapped);
  };
  if (surface === 'public') return { subscribeToState };
  return {
    dispatch: async (command: GameCommand) => hostGameViewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.dispatch, gameCommandSchema.parse(command)),
    ),
    startMatch: async (config) => hostGameViewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.startMatch, gameConfigSchema.parse(config)),
    ),
    checkContentAvailability: async (config) => contentAvailabilitySchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentAvailability, gameConfigSchema.parse(config)),
    ),
    getSetupOptions: async () => setupOptionsSchema.parse(
      await ipc.invoke(IPC_CHANNELS.setupOptions, undefined),
    ),
    hasResumableMatch: async () => hasResumableMatchSchema.parse(
      await ipc.invoke(IPC_CHANNELS.hasResumableMatch, undefined),
    ),
    resumeMatch: async () => {
      const value = await ipc.invoke(IPC_CHANNELS.resumeMatch, undefined);
      return value === null ? null : hostGameViewSchema.parse(value);
    },
    listHistory: async () => matchHistorySchema.parse(
      await ipc.invoke(IPC_CHANNELS.listHistory, undefined),
    ),
    subscribeToState,
  };
}

const surface = process.argv.includes('--surface=host') ? 'host' : 'public';
contextBridge.exposeInMainWorld('quizStage', createQuizStageApi(surface, ipcRenderer));
