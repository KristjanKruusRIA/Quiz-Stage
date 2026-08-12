import { describe, expect, it, vi } from 'vitest';
import {
  WindowManager,
  type DisplayPort,
  type DisplaySnapshot,
  type ManagedWindow,
  type WindowFactory,
} from '../../../src/main/windows/windowManager';

const hostDisplay: DisplaySnapshot = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1280, height: 720 },
  workArea: { x: 0, y: 0, width: 1280, height: 680 },
};
const publicDisplay: DisplaySnapshot = {
  id: 2,
  bounds: { x: 1280, y: 0, width: 1920, height: 1080 },
  workArea: { x: 1280, y: 0, width: 1920, height: 1040 },
};

function harness(confirmResult = true) {
  let displays = [hostDisplay, publicDisplay];
  const displayListeners = new Map<string, Set<(display: DisplaySnapshot) => void>>();
  const displayPort: DisplayPort = {
    getAllDisplays: () => displays,
    getPrimaryDisplay: () => displays[0]!,
    on: (event, listener) => {
      const listeners = displayListeners.get(event) ?? new Set();
      listeners.add(listener);
      displayListeners.set(event, listeners);
    },
    removeListener: (event, listener) => displayListeners.get(event)?.delete(listener),
  };
  const windows: Array<ManagedWindow & { bounds: DisplaySnapshot['bounds']; fullscreen: boolean }> = [];
  const closedListeners: Array<() => void> = [];
  const destroyed: boolean[] = [];
  const factory: WindowFactory = (options) => {
    const index = windows.length;
    destroyed[index] = false;
    const windowState = {
      bounds: {
        x: options.x ?? 0,
        y: options.y ?? 0,
        width: options.width,
        height: options.height,
      },
      fullscreen: options.fullscreen ?? false,
    };
    const window: ManagedWindow & { bounds: DisplaySnapshot['bounds']; fullscreen: boolean } = {
      get bounds() { return windowState.bounds; },
      set bounds(value) { windowState.bounds = value; },
      get fullscreen() { return windowState.fullscreen; },
      set fullscreen(value) { windowState.fullscreen = value; },
      webContents: {
        id: index + 1,
        on: vi.fn(),
        setWindowOpenHandler: vi.fn(),
        send: vi.fn(),
        isDestroyed: () => destroyed[index],
      },
      loadURL: vi.fn(),
      loadFile: vi.fn(),
      on: (_event: 'closed', listener: () => void) => { closedListeners[index] = listener; },
      isDestroyed: () => destroyed[index],
      getBounds: () => ({ ...windowState.bounds }),
      setBounds: vi.fn((bounds: DisplaySnapshot['bounds']) => { windowState.bounds = { ...bounds }; }),
      setFullScreen: vi.fn((fullscreen: boolean) => { windowState.fullscreen = fullscreen; }),
      show: vi.fn(),
    };
    windows.push(window);
    return window;
  };
  const confirmPublicRecovery = vi.fn(async () => confirmResult);
  const manager = new WindowManager({
    createWindow: factory,
    preloadPath: 'preload.js',
    rendererHtmlPath: 'index.html',
    displayPort,
    confirmPublicRecovery,
  });
  return {
    manager,
    windows,
    confirmPublicRecovery,
    removeDisplay: (display: DisplaySnapshot) => {
      displays = displays.filter((candidate) => candidate.id !== display.id);
      for (const listener of displayListeners.get('display-removed') ?? []) listener(display);
    },
    metrics: (display: DisplaySnapshot) => {
      for (const listener of displayListeners.get('display-metrics-changed') ?? []) listener(display);
    },
    close: (index: number) => {
      destroyed[index] = true;
      closedListeners[index]?.();
    },
    destroy: (index: number) => { destroyed[index] = true; },
  };
}

describe('display recovery', () => {
  it('asks the live host once and moves the public window only after confirmation without mutating game state', async () => {
    const h = harness(true);
    h.manager.create('dual');
    const state = { phase: 'final-clue', scores: { one: 1200 }, activeClue: { id: 'private-clue' } };
    const before = JSON.stringify(state);

    h.removeDisplay(publicDisplay);
    h.metrics(hostDisplay);
    expect(h.windows[1]!.setBounds).not.toHaveBeenCalled();
    await Promise.resolve();
    await Promise.resolve();

    expect(h.confirmPublicRecovery).toHaveBeenCalledTimes(1);
    expect(h.confirmPublicRecovery).toHaveBeenCalledWith(h.windows[0]);
    expect(h.windows[1]!.setBounds).toHaveBeenCalledWith(hostDisplay.bounds);
    expect(h.windows[1]!.setFullScreen).toHaveBeenCalledWith(true);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('leaves the public window untouched after decline and permits a later retry', async () => {
    const h = harness(false);
    h.manager.create('dual');

    h.removeDisplay(publicDisplay);
    await Promise.resolve();
    await Promise.resolve();
    expect(h.windows[1]!.setBounds).not.toHaveBeenCalled();

    h.metrics(hostDisplay);
    await Promise.resolve();
    await Promise.resolve();
    expect(h.confirmPublicRecovery).toHaveBeenCalledTimes(2);
  });

  it('recreates an already destroyed public surface on the remaining display after acceptance', async () => {
    const h = harness(true);
    h.manager.create('dual');
    h.destroy(1);

    h.removeDisplay(publicDisplay);
    await Promise.resolve();
    await Promise.resolve();

    expect(h.windows).toHaveLength(3);
    expect(h.manager.getWindows().publicWindow).toBe(h.windows[2]);
    expect(h.windows[2]!.bounds).toEqual(hostDisplay.bounds);
    expect(h.windows[2]!.fullscreen).toBe(true);
  });

  it('moves a host from a removed display without prompting or recreating the public window', async () => {
    const h = harness(true);
    h.manager.create('dual');
    h.windows[0]!.bounds = { ...publicDisplay.bounds };
    h.windows[1]!.bounds = { ...hostDisplay.bounds };

    h.removeDisplay(publicDisplay);
    await Promise.resolve();

    expect(h.windows[0]!.setBounds).toHaveBeenCalledWith(hostDisplay.workArea);
    expect(h.confirmPublicRecovery).not.toHaveBeenCalled();
    expect(h.manager.getWindows().publicWindow).toBe(h.windows[1]);
  });

  it('does not prompt or recreate during a simultaneous close or after disposal', async () => {
    const h = harness(true);
    h.manager.create('dual');
    h.close(1);
    h.removeDisplay(publicDisplay);
    h.manager.dispose();
    await Promise.resolve();
    await Promise.resolve();

    expect(h.confirmPublicRecovery).not.toHaveBeenCalled();
    expect(h.windows).toHaveLength(2);
  });
});
