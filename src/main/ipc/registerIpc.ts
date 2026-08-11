import type { HostGameView, PublicGameView } from '../../shared/game/types';
import { IPC_CHANNELS } from './channels';
import { validateHostSender } from './validateSender';

export interface IpcMainPort {
  handle(channel: string, handler: (event: { sender: { id: number } }, value: unknown) => unknown): void;
  removeHandler(channel: string): void;
}

interface CoordinatorPort {
  dispatch(input: unknown): Promise<unknown>;
  subscribe(surface: 'host', subscriber: (view: HostGameView) => void): () => void;
  subscribe(surface: 'public', subscriber: (view: PublicGameView) => void): () => void;
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

  const unsubscribeHost = coordinator.subscribe('host', (view) => {
    const hostWindow = getWindows().hostWindow;
    if (hostWindow !== null && !hostWindow.webContents.isDestroyed()) {
      hostWindow.webContents.send(IPC_CHANNELS.hostState, view);
    }
  });
  const unsubscribePublic = coordinator.subscribe('public', (view) => {
    const publicWindow = getWindows().publicWindow;
    if (publicWindow !== null && !publicWindow.webContents.isDestroyed()) {
      publicWindow.webContents.send(IPC_CHANNELS.publicState, view);
    }
  });

  return () => {
    ipcMain.removeHandler(IPC_CHANNELS.dispatch);
    unsubscribeHost();
    unsubscribePublic();
  };
}
