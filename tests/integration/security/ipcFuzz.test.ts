import { describe, expect, it } from 'vitest';
import { registerIpc } from '../../../src/main/ipc/registerIpc';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';

describe('IPC payload boundary', () => {
  it('rejects an oversized host command before it reaches the coordinator', async () => {
    const handlers = new Map<string, (event: { sender: { id: number } }, input: unknown) => Promise<unknown>>();
    let dispatched = false;
    const ipcMain = {
      handle: (channel: string, handler: (event: { sender: { id: number } }, input: unknown) => Promise<unknown>) => {
        handlers.set(channel, handler);
      },
      on: () => undefined,
      removeHandler: () => undefined,
      removeListener: () => undefined,
    };
    const hostWindow = {
      webContents: { id: 7, isDestroyed: () => false, send: () => undefined },
    };
    registerIpc({
      ipcMain: ipcMain as never,
      coordinator: {
        dispatch: async () => { dispatched = true; return {}; },
        subscribe: () => () => undefined,
        getHostStateUpdate: () => null,
        getPublicStateUpdate: () => null,
      } as never,
      getWindows: () => ({ hostWindow, publicWindow: null }) as never,
    });

    const dispatch = handlers.get(IPC_CHANNELS.dispatch);
    expect(dispatch).toBeDefined();
    await expect(dispatch!({ sender: { id: 7 } }, 'x'.repeat(1_048_577))).rejects.toThrow('IPC_PAYLOAD_TOO_LARGE');
    expect(dispatched).toBe(false);
  });
});
