import { describe, expect, it, vi } from 'vitest';
import { registerIpc } from '../../../src/main/ipc/registerIpc';
import { IPC_CHANNELS } from '../../../src/main/ipc/channels';

type Event = { sender: { id: number } };
type Handler = (event: Event, input: unknown) => Promise<unknown>;
type Listener = (event: Event, input: unknown) => void;

function createHarness() {
  const handlers = new Map<string, Handler>();
  const listeners = new Map<string, Listener>();
  const dispatch = vi.fn(async () => ({}));
  const recordGameCommand = vi.fn();
  const ipcMain = {
    handle: (channel: string, handler: Handler) => { handlers.set(channel, handler); },
    on: (channel: string, listener: Listener) => { listeners.set(channel, listener); },
    removeHandler: () => undefined,
    removeListener: () => undefined,
  };
  const hostWindow = {
    webContents: { id: 7, isDestroyed: () => false, send: vi.fn() },
  };
  const publicWindow = {
    webContents: { id: 8, isDestroyed: () => false, send: vi.fn() },
  };
  registerIpc({
    ipcMain: ipcMain as never,
    coordinator: {
      dispatch,
      subscribe: () => () => undefined,
      getHostStateUpdate: () => null,
      getPublicStateUpdate: () => null,
    } as never,
    setup: {
      startMatch: async () => ({}),
      checkContentAvailability: async () => ({}),
      getSetupOptions: async () => ({ packs: [], automaticDisplayMode: 'single' }),
    },
    diagnostics: { recordGameCommand },
    getAutomaticDisplayMode: () => 'single',
    getWindows: () => ({ hostWindow, publicWindow }) as never,
  });
  return { handlers, listeners, dispatch, recordGameCommand, hostWindow, publicWindow };
}

describe('IPC payload and sender boundaries', () => {
  it('rejects oversized and cyclic payloads before dispatch', async () => {
    const { handlers, dispatch } = createHarness();
    const handler = handlers.get(IPC_CHANNELS.dispatch)!;
    await expect(handler({ sender: { id: 7 } }, 'x'.repeat(1_048_577)))
      .rejects.toThrow('IPC_PAYLOAD_TOO_LARGE');
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    await expect(handler({ sender: { id: 7 } }, cyclic)).rejects.toThrow('INVALID_IPC_PAYLOAD');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('rejects a malformed command before logging or dispatch', async () => {
    const { handlers, dispatch, recordGameCommand } = createHarness();
    await expect(handlers.get(IPC_CHANNELS.dispatch)!({ sender: { id: 7 } }, {
      type: 'SelectClue',
      clueId: '',
    })).rejects.toThrow();
    expect(recordGameCommand).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('rejects non-host senders and logs only a validated command', async () => {
    const { handlers, dispatch, recordGameCommand } = createHarness();
    const command = { type: 'ReportClue', clueId: 'clue-9', reason: 'private host note' };
    await expect(handlers.get(IPC_CHANNELS.dispatch)!({ sender: { id: 8 } }, command))
      .rejects.toThrow('HOST_SENDER_REQUIRED');
    expect(dispatch).not.toHaveBeenCalled();

    await handlers.get(IPC_CHANNELS.dispatch)!({ sender: { id: 7 } }, command);
    expect(recordGameCommand).toHaveBeenCalledWith(command);
    expect(dispatch).toHaveBeenCalledWith(command);
  });

  it('validates no-argument handlers instead of ignoring their payload', async () => {
    const { handlers } = createHarness();
    await expect(handlers.get(IPC_CHANNELS.setupOptions)!({ sender: { id: 7 } }, { unexpected: true }))
      .rejects.toThrow();
  });

  it('validates ready-event payloads before bootstrapping either surface', () => {
    const { listeners, hostWindow, publicWindow } = createHarness();
    expect(() => listeners.get(IPC_CHANNELS.hostReady)!({ sender: { id: 7 } }, { unexpected: true }))
      .toThrow();
    expect(() => listeners.get(IPC_CHANNELS.publicReady)!({ sender: { id: 8 } }, 'x'.repeat(1_048_577)))
      .toThrow('IPC_PAYLOAD_TOO_LARGE');
    expect(hostWindow.webContents.send).not.toHaveBeenCalled();
    expect(publicWindow.webContents.send).not.toHaveBeenCalled();
  });
});
