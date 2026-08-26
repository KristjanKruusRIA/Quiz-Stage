import { describe, expect, it, vi } from 'vitest';
import { WindowManager, type ManagedWindow, type WindowFactory } from '../../../src/main/windows/windowManager';

function harness(rendererUrl?: string) {
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
    ...(rendererUrl === undefined ? {} : { rendererUrl }),
  });
  return {
    manager,
    options,
    windows,
    close: (index: number) => {
      destroyed[index] = true;
      closeListeners[index]?.();
    },
    destroy: (index: number) => { destroyed[index] = true; },
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

  it('loads the privileged renderer URL when packaged', () => {
    const { manager, windows } = harness('app://renderer/index.html');
    manager.create('single');

    expect(windows[0].loadURL).toHaveBeenCalledWith('app://renderer/index.html');
    expect(windows[0].loadFile).not.toHaveBeenCalled();
  });

  it('automatically recreates a closed host while preserving the live public window', async () => {
    const { manager, windows, close } = harness();
    const first = manager.create('dual');

    close(0);
    await Promise.resolve();

    const afterHostClose = manager.getWindows();
    expect(afterHostClose).toEqual({ hostWindow: windows[2], publicWindow: first.publicWindow });
    expect(windows).toHaveLength(3);
  });

  it('automatically recreates a closed public window while preserving the live host', async () => {
    const { manager, windows, close } = harness();
    const first = manager.create('dual');

    close(1);
    await Promise.resolve();

    const afterPublicClose = manager.getWindows();
    expect(afterPublicClose).toEqual({ hostWindow: first.hostWindow, publicWindow: windows[2] });
    expect(windows).toHaveLength(3);
  });

  it('recreates both surfaces once when both dual windows close together', async () => {
    const { manager, windows, close } = harness();
    manager.create('dual');

    close(0);
    close(1);
    await Promise.resolve();

    expect(manager.getWindows()).toEqual({ hostWindow: windows[2], publicWindow: windows[3] });
    expect(windows).toHaveLength(4);
  });

  it('recovers a destroyed surface discovered by a live window lookup', async () => {
    const { manager, windows, destroy } = harness();
    const first = manager.create('dual');

    destroy(0);
    expect(manager.getWindows()).toEqual({ hostWindow: null, publicWindow: first.publicWindow });
    await Promise.resolve();

    expect(manager.getWindows()).toEqual({ hostWindow: windows[2], publicWindow: first.publicWindow });
    expect(windows).toHaveLength(3);
  });

  it('does not recreate closed windows after shutdown begins', async () => {
    const { manager, windows, close } = harness();
    manager.create('dual');

    manager.dispose();
    close(0);
    close(1);
    await Promise.resolve();

    expect(manager.getWindows()).toEqual({ hostWindow: null, publicWindow: null });
    expect(windows).toHaveLength(2);
  });
});
