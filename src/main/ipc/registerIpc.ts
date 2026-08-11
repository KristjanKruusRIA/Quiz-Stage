import type { HostGameView, PublicGameView } from '../../shared/game/types';
import type { HostStateUpdate, PublicStateUpdate } from '../../shared/ipc/contracts';
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

export function registerIpc({ ipcMain, coordinator, getWindows }: RegisterIpcOptions): () => void {
  ipcMain.handle(IPC_CHANNELS.dispatch, async (event, command) => {
    const hostWindow = getWindows().hostWindow;
    if (hostWindow === null || hostWindow.webContents.isDestroyed()) throw new Error('HOST_SENDER_REQUIRED');
    validateHostSender(event.sender.id, hostWindow.webContents.id);
    return coordinator.dispatch(command);
  });

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
    ipcMain.removeListener(IPC_CHANNELS.hostReady, bootstrapHost);
    ipcMain.removeListener(IPC_CHANNELS.publicReady, bootstrapPublic);
    unsubscribeHost();
    unsubscribePublic();
  };
}
