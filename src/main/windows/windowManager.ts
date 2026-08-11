import type { DisplayMode } from '../../shared/game/types';
import { blockNavigationAndWindows, type WindowSecurityPort } from '../windowSecurity';

export interface ManagedWebContents extends WindowSecurityPort {
  id: number;
  send(channel: string, value: unknown): void;
  isDestroyed(): boolean;
}

export interface ManagedWindow {
  webContents: ManagedWebContents;
  loadURL(url: string): Promise<unknown> | void;
  loadFile(path: string): Promise<unknown> | void;
  on(event: 'closed', listener: () => void): unknown;
  isDestroyed(): boolean;
}

interface ManagedWindowOptions {
  width: number;
  height: number;
  webPreferences: {
    contextIsolation: true;
    nodeIntegration: false;
    preload: string;
    sandbox: true;
    webSecurity: true;
    additionalArguments: string[];
  };
}

export type WindowFactory = (options: ManagedWindowOptions) => ManagedWindow;

export interface ManagedWindows {
  hostWindow: ManagedWindow | null;
  publicWindow: ManagedWindow | null;
}

interface WindowManagerOptions {
  createWindow: WindowFactory;
  preloadPath: string;
  rendererHtmlPath: string;
  devServerUrl?: string;
}

export class WindowManager {
  private hostWindow: ManagedWindow | null = null;
  private publicWindow: ManagedWindow | null = null;
  private displayMode: DisplayMode = 'single';
  private shuttingDown = false;
  private readonly recoveryPending = new Set<'host' | 'public'>();

  constructor(private readonly options: WindowManagerOptions) {}

  create(displayMode: DisplayMode): ManagedWindows {
    if (this.shuttingDown) return this.getWindows();
    this.displayMode = displayMode;
    this.clearDestroyedReferences();
    this.hostWindow ??= this.createSurface('host');
    if (displayMode === 'dual') this.publicWindow ??= this.createSurface('public');
    return this.getWindows();
  }

  dispose(): void {
    this.shuttingDown = true;
    this.recoveryPending.clear();
  }

  getWindows(): ManagedWindows {
    this.clearDestroyedReferences();
    return { hostWindow: this.hostWindow, publicWindow: this.publicWindow };
  }

  private createSurface(surface: 'host' | 'public'): ManagedWindow {
    const window = this.options.createWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: this.options.preloadPath,
        sandbox: true,
        webSecurity: true,
        additionalArguments: [`--surface=${surface}`],
      },
    });
    window.on('closed', () => {
      if (surface === 'host' && this.hostWindow === window) {
        this.hostWindow = null;
        this.scheduleRecovery(surface);
      }
      if (surface === 'public' && this.publicWindow === window) {
        this.publicWindow = null;
        this.scheduleRecovery(surface);
      }
    });
    blockNavigationAndWindows(window.webContents);
    if (this.options.devServerUrl === undefined) {
      void window.loadFile(this.options.rendererHtmlPath);
    } else {
      void window.loadURL(this.options.devServerUrl);
    }
    return window;
  }

  private scheduleRecovery(surface: 'host' | 'public'): void {
    if (this.shuttingDown || (surface === 'public' && this.displayMode !== 'dual')) return;
    if (this.recoveryPending.has(surface)) return;
    this.recoveryPending.add(surface);
    queueMicrotask(() => {
      this.recoveryPending.delete(surface);
      if (this.shuttingDown || (surface === 'public' && this.displayMode !== 'dual')) return;
      this.create(this.displayMode);
    });
  }

  private clearDestroyedReferences(): void {
    if (this.hostWindow?.isDestroyed() || this.hostWindow?.webContents.isDestroyed()) {
      this.hostWindow = null;
      this.scheduleRecovery('host');
    }
    if (this.publicWindow?.isDestroyed() || this.publicWindow?.webContents.isDestroyed()) {
      this.publicWindow = null;
      this.scheduleRecovery('public');
    }
  }
}
