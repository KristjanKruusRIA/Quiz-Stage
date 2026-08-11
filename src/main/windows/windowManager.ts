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

  constructor(private readonly options: WindowManagerOptions) {}

  create(displayMode: DisplayMode): ManagedWindows {
    this.clearDestroyedReferences();
    this.hostWindow ??= this.createSurface('host');
    if (displayMode === 'dual') this.publicWindow ??= this.createSurface('public');
    return this.getWindows();
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
      if (surface === 'host' && this.hostWindow === window) this.hostWindow = null;
      if (surface === 'public' && this.publicWindow === window) this.publicWindow = null;
    });
    blockNavigationAndWindows(window.webContents);
    if (this.options.devServerUrl === undefined) {
      void window.loadFile(this.options.rendererHtmlPath);
    } else {
      void window.loadURL(this.options.devServerUrl);
    }
    return window;
  }

  private clearDestroyedReferences(): void {
    if (this.hostWindow?.isDestroyed() || this.hostWindow?.webContents.isDestroyed()) this.hostWindow = null;
    if (this.publicWindow?.isDestroyed() || this.publicWindow?.webContents.isDestroyed()) this.publicWindow = null;
  }
}
