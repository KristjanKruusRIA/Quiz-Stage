import type { DisplayMode } from '../../shared/game/types';
import { blockNavigationAndWindows, type WindowSecurityPort } from '../windowSecurity';

export interface ManagedWebContents extends WindowSecurityPort {
  id: number;
  send(channel: string, value: unknown): void;
}

export interface ManagedWindow {
  webContents: ManagedWebContents;
  loadURL(url: string): Promise<unknown> | void;
  loadFile(path: string): Promise<unknown> | void;
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
  hostWindow: ManagedWindow;
  publicWindow: ManagedWindow | null;
}

interface WindowManagerOptions {
  createWindow: WindowFactory;
  preloadPath: string;
  rendererHtmlPath: string;
  devServerUrl?: string;
}

export class WindowManager {
  constructor(private readonly options: WindowManagerOptions) {}

  create(displayMode: DisplayMode): ManagedWindows {
    const hostWindow = this.createSurface('host');
    const publicWindow = displayMode === 'dual' ? this.createSurface('public') : null;
    return { hostWindow, publicWindow };
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
    blockNavigationAndWindows(window.webContents);
    if (this.options.devServerUrl === undefined) {
      void window.loadFile(this.options.rendererHtmlPath);
    } else {
      void window.loadURL(this.options.devServerUrl);
    }
    return window;
  }
}
