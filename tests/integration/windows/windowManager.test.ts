import { describe, expect, it, vi } from 'vitest';
import { WindowManager, type ManagedWindow, type WindowFactory } from '../../../src/main/windows/windowManager';

function harness() {
  const options: unknown[] = [];
  let nextId = 1;
  const windows: ManagedWindow[] = [];
  const closeListeners: Array<() => void> = [];
  const destroyed: boolean[] = [];
  const factory: WindowFactory = (windowOptions) => {
    const index = windows.length;
    options.push(windowOptions);
    destroyed[index] = false;
    const window: ManagedWindow = {
      webContents: {
        id: nextId++,
        on: vi.fn(),
        setWindowOpenHandler: vi.fn(),
        send: vi.fn(),
        isDestroyed: () => destroyed[index],
      },
      loadURL: vi.fn(async () => undefined),
      loadFile: vi.fn(async () => undefined),
      on: (_event, listener) => { closeListeners[index] = listener; },
      isDestroyed: () => destroyed[index],
    };
    windows.push(window);
    return window;
  };
  const manager = new WindowManager({
    createWindow: factory,
    preloadPath: 'C:/app/preload.js',
    rendererHtmlPath: 'C:/app/index.html',
  });
  return {
    manager,
    options,
    windows,
    close: (index: number) => {
      destroyed[index] = true;
      closeListeners[index]?.();
    },
  };
}

describe('WindowManager', () => {
  it('creates one secure host window in single-display mode', () => {
    const { manager, options, windows } = harness();
    const result = manager.create('single');

    expect(result).toEqual({ hostWindow: windows[0], publicWindow: null });
    expect(options).toEqual([expect.objectContaining({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: 'C:/app/preload.js',
        sandbox: true,
        webSecurity: true,
        additionalArguments: ['--surface=host'],
      },
    })]);
    expect(windows[0].loadFile).toHaveBeenCalledWith('C:/app/index.html');
  });

  it('creates independently surfaced host and public windows in dual-display mode', () => {
    const { manager, options, windows } = harness();
    const result = manager.create('dual');

    expect(result).toEqual({ hostWindow: windows[0], publicWindow: windows[1] });
    expect(options).toHaveLength(2);
    expect(options).toEqual([
      expect.objectContaining({ webPreferences: expect.objectContaining({ additionalArguments: ['--surface=host'] }) }),
      expect.objectContaining({ webPreferences: expect.objectContaining({ additionalArguments: ['--surface=public'] }) }),
    ]);
    expect(windows[0].webContents.setWindowOpenHandler).toHaveBeenCalled();
    expect(windows[1].webContents.setWindowOpenHandler).toHaveBeenCalled();
  });

  it('clears closed surface references and recreates only the missing dual window', () => {
    const { manager, windows, close } = harness();
    const first = manager.create('dual');

    close(0);
    expect(manager.getWindows()).toEqual({ hostWindow: null, publicWindow: first.publicWindow });
    const afterHostClose = manager.create('dual');
    expect(afterHostClose).toEqual({ hostWindow: windows[2], publicWindow: first.publicWindow });

    close(1);
    expect(manager.getWindows()).toEqual({ hostWindow: windows[2], publicWindow: null });
    const afterPublicClose = manager.create('dual');
    expect(afterPublicClose).toEqual({ hostWindow: windows[2], publicWindow: windows[3] });
    expect(windows).toHaveLength(4);
  });
});
