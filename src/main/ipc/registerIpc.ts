import type { HostGameView, PublicGameView } from '../../shared/game/types';
import type { DisplayMode, GameConfig } from '../../shared/game/types';
import {
  contentAvailabilitySchema,
  gameConfigSchema,
  hostGameViewSchema,
  hasResumableMatchSchema,
  matchHistorySchema,
  noArgsSchema,
  setupOptionsSchema,
  type HostStateUpdate,
  type PublicStateUpdate,
} from '../../shared/ipc/contracts';
import { IPC_CHANNELS } from './channels';
import { validateHostSender } from './validateSender';

export interface IpcMainPort {
  handle(channel: string, handler: (event: { sender: { id: number } }, value: unknown) => unknown): void;
  removeHandler(channel: string): void;
  on(channel: string, listener: (event: { sender: { id: number } }) => void): void;
  removeListener(channel: string, listener: (event: { sender: { id: number } }) => void): void;
}

interface CoordinatorPort {
  dispatch(input: unknown): Promise<unknown>;
  subscribe(surface: 'host', subscriber: (view: HostGameView, revision: number) => void): () => void;
  subscribe(surface: 'public', subscriber: (view: PublicGameView, revision: number) => void): () => void;
  getHostStateUpdate(): HostStateUpdate | null;
  getPublicStateUpdate(): PublicStateUpdate | null;
}

interface RegisterIpcOptions {
  ipcMain: IpcMainPort;
  coordinator: CoordinatorPort;
  setup?: {
    startMatch(config: GameConfig): Promise<unknown>;
    checkContentAvailability(config: GameConfig): unknown;
    getSetupOptions(automaticDisplayMode: DisplayMode): unknown;
  };
  matchAccess?: {
    hasResumableMatch(): unknown;
    resumeMatch(): Promise<unknown>;
    listHistory(): unknown;
  };
  getAutomaticDisplayMode?: () => DisplayMode;
  applyDisplayMode?: (displayMode: DisplayMode) => void;
  getWindows: () => {
    hostWindow: WindowPort | null;
    publicWindow: WindowPort | null;
  };
}

interface WindowPort {
  webContents: {
    id: number;
    send(channel: string, value: unknown): void;
    isDestroyed(): boolean;
  };
}

export function registerIpc({
  ipcMain,
  coordinator,
  setup,
  matchAccess,
  getAutomaticDisplayMode,
  applyDisplayMode,
  getWindows,
}: RegisterIpcOptions): () => void {
  const requireHost = (senderId: number) => {
    const hostWindow = getWindows().hostWindow;
    if (hostWindow === null || hostWindow.webContents.isDestroyed()) throw new Error('HOST_SENDER_REQUIRED');
    validateHostSender(senderId, hostWindow.webContents.id);
  };
  ipcMain.handle(IPC_CHANNELS.dispatch, async (event, command) => {
    requireHost(event.sender.id);
    return coordinator.dispatch(command);
  });

  const setupChannels: string[] = [];
  if (setup !== undefined && getAutomaticDisplayMode !== undefined) {
    ipcMain.handle(IPC_CHANNELS.startMatch, async (event, input) => {
      requireHost(event.sender.id);
      const config = gameConfigSchema.parse(input);
      const view = hostGameViewSchema.parse(await setup.startMatch(config));
      applyDisplayMode?.(config.displayMode);
      return view;
    });
    ipcMain.handle(IPC_CHANNELS.contentAvailability, async (event, input) => {
      requireHost(event.sender.id);
      return contentAvailabilitySchema.parse(await setup.checkContentAvailability(gameConfigSchema.parse(input)));
    });
    ipcMain.handle(IPC_CHANNELS.setupOptions, async (event) => {
      requireHost(event.sender.id);
      return setupOptionsSchema.parse(await setup.getSetupOptions(getAutomaticDisplayMode()));
    });
    setupChannels.push(IPC_CHANNELS.startMatch, IPC_CHANNELS.contentAvailability, IPC_CHANNELS.setupOptions);
  }

  const matchAccessChannels: string[] = [];
  if (matchAccess !== undefined) {
    ipcMain.handle(IPC_CHANNELS.hasResumableMatch, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      return hasResumableMatchSchema.parse(await matchAccess.hasResumableMatch());
    });
    ipcMain.handle(IPC_CHANNELS.resumeMatch, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      const value = await matchAccess.resumeMatch();
      if (value === null) return null;
      const view = hostGameViewSchema.parse(value);
      applyDisplayMode?.(view.state.config.displayMode);
      return view;
    });
    ipcMain.handle(IPC_CHANNELS.listHistory, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      return matchHistorySchema.parse(await matchAccess.listHistory());
    });
    matchAccessChannels.push(
      IPC_CHANNELS.hasResumableMatch,
      IPC_CHANNELS.resumeMatch,
      IPC_CHANNELS.listHistory,
    );
  }

  let readyHostWebContentsId: number | null = null;
  let readyPublicWebContentsId: number | null = null;
  const unsubscribeHost = coordinator.subscribe('host', (view, revision) => {
    const hostWindow = getWindows().hostWindow;
    if (
      hostWindow !== null
      && !hostWindow.webContents.isDestroyed()
      && hostWindow.webContents.id === readyHostWebContentsId
    ) {
      hostWindow.webContents.send(IPC_CHANNELS.hostState, { revision, view });
    }
  });
  const unsubscribePublic = coordinator.subscribe('public', (view, revision) => {
    const publicWindow = getWindows().publicWindow;
    if (
      publicWindow !== null
      && !publicWindow.webContents.isDestroyed()
      && publicWindow.webContents.id === readyPublicWebContentsId
    ) {
      publicWindow.webContents.send(IPC_CHANNELS.publicState, { revision, view });
    }
  });

  const bootstrapHost = (event: { sender: { id: number } }) => {
    const hostWindow = getWindows().hostWindow;
    if (
      hostWindow === null
      || hostWindow.webContents.isDestroyed()
      || event.sender.id !== hostWindow.webContents.id
    ) return;
    readyHostWebContentsId = hostWindow.webContents.id;
    const update = coordinator.getHostStateUpdate();
    if (update !== null) hostWindow.webContents.send(IPC_CHANNELS.hostState, update);
  };
  const bootstrapPublic = (event: { sender: { id: number } }) => {
    const publicWindow = getWindows().publicWindow;
    if (
      publicWindow === null
      || publicWindow.webContents.isDestroyed()
      || event.sender.id !== publicWindow.webContents.id
    ) return;
    readyPublicWebContentsId = publicWindow.webContents.id;
    const update = coordinator.getPublicStateUpdate();
    if (update !== null) publicWindow.webContents.send(IPC_CHANNELS.publicState, update);
  };
  ipcMain.on(IPC_CHANNELS.hostReady, bootstrapHost);
  ipcMain.on(IPC_CHANNELS.publicReady, bootstrapPublic);

  return () => {
    ipcMain.removeHandler(IPC_CHANNELS.dispatch);
    for (const channel of setupChannels) ipcMain.removeHandler(channel);
    for (const channel of matchAccessChannels) ipcMain.removeHandler(channel);
    ipcMain.removeListener(IPC_CHANNELS.hostReady, bootstrapHost);
    ipcMain.removeListener(IPC_CHANNELS.publicReady, bootstrapPublic);
    unsubscribeHost();
    unsubscribePublic();
  };
}
