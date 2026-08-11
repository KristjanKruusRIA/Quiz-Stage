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
  windows: {
    hostWindow: { webContents: { id: number; send(channel: string, value: unknown): void } };
    publicWindow: { webContents: { send(channel: string, value: unknown): void } } | null;
  };
}

export function registerIpc({ ipcMain, coordinator, windows }: RegisterIpcOptions): () => void {
  ipcMain.handle(IPC_CHANNELS.dispatch, async (event, command) => {
    validateHostSender(event.sender.id, windows.hostWindow.webContents.id);
    return coordinator.dispatch(command);
  });

  const unsubscribeHost = coordinator.subscribe('host', (view) => {
    windows.hostWindow.webContents.send(IPC_CHANNELS.hostState, view);
  });
  const unsubscribePublic = coordinator.subscribe('public', (view) => {
    windows.publicWindow?.webContents.send(IPC_CHANNELS.publicState, view);
  });

  return () => {
    ipcMain.removeHandler(IPC_CHANNELS.dispatch);
    unsubscribeHost();
    unsubscribePublic();
  };
}
