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
  getBounds?(): DisplayBounds;
  setBounds?(bounds: DisplayBounds): void;
  setFullScreen?(fullscreen: boolean): void;
  show?(): void;
}

interface ManagedWindowOptions {
  width: number;
  height: number;
  x?: number;
  y?: number;
  fullscreen?: boolean;
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

export interface DisplayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DisplaySnapshot {
  id: number;
  bounds: DisplayBounds;
  workArea: DisplayBounds;
}

type DisplayEvent = 'display-removed' | 'display-metrics-changed';

export interface DisplayPort {
  getAllDisplays(): DisplaySnapshot[];
  getPrimaryDisplay(): DisplaySnapshot;
  on(event: DisplayEvent, listener: (display: DisplaySnapshot) => void): void;
  removeListener(event: DisplayEvent, listener: (display: DisplaySnapshot) => void): void;
}

interface WindowManagerOptions {
  createWindow: WindowFactory;
  preloadPath: string;
  rendererHtmlPath: string;
  rendererUrl?: string;
  devServerUrl?: string;
  displayPort?: DisplayPort;
  confirmPublicRecovery?: (hostWindow: ManagedWindow) => Promise<boolean>;
}

export class WindowManager {
  private hostWindow: ManagedWindow | null = null;
  private publicWindow: ManagedWindow | null = null;
  private displayMode: DisplayMode = 'single';
  private shuttingDown = false;
  private readonly recoveryPending = new Set<'host' | 'public'>();
  private displayRecoveryPending = false;
  private readonly onDisplayRemoved = (display: DisplaySnapshot) => { this.handleDisplayChange(display); };
  private readonly onDisplayMetricsChanged = (display: DisplaySnapshot) => { this.handleDisplayChange(display); };

  constructor(private readonly options: WindowManagerOptions) {
    options.displayPort?.on('display-removed', this.onDisplayRemoved);
    options.displayPort?.on('display-metrics-changed', this.onDisplayMetricsChanged);
  }

  create(displayMode: DisplayMode): ManagedWindows {
    if (this.shuttingDown) return this.getWindows();
    this.displayMode = displayMode;
    this.clearDestroyedReferences();
    this.hostWindow ??= this.createSurface('host', this.hostTarget());
    if (displayMode === 'dual') this.publicWindow ??= this.createSurface('public', this.publicTarget());
    return this.getWindows();
  }

  dispose(): void {
    this.shuttingDown = true;
    this.recoveryPending.clear();
    this.displayRecoveryPending = false;
    this.options.displayPort?.removeListener('display-removed', this.onDisplayRemoved);
    this.options.displayPort?.removeListener('display-metrics-changed', this.onDisplayMetricsChanged);
  }

  getWindows(): ManagedWindows {
    this.clearDestroyedReferences();
    return { hostWindow: this.hostWindow, publicWindow: this.publicWindow };
  }

  private createSurface(surface: 'host' | 'public', target?: DisplayBounds): ManagedWindow {
    const window = this.options.createWindow({
      width: target?.width ?? 1280,
      height: target?.height ?? 720,
      ...(target === undefined ? {} : { x: target.x, y: target.y }),
      ...(surface === 'public' && target !== undefined ? { fullscreen: true } : {}),
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
    if (this.options.devServerUrl !== undefined) {
      void window.loadURL(this.options.devServerUrl);
    } else if (this.options.rendererUrl !== undefined) {
      void window.loadURL(this.options.rendererUrl);
    } else {
      void window.loadFile(this.options.rendererHtmlPath);
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

  private hostTarget(): DisplayBounds | undefined {
    return this.options.displayPort?.getPrimaryDisplay().workArea;
  }

  private publicTarget(): DisplayBounds | undefined {
    const displays = this.options.displayPort?.getAllDisplays();
    if (displays === undefined || displays.length === 0) return undefined;
    const primaryId = this.options.displayPort?.getPrimaryDisplay().id;
    return (displays.find((display) => display.id !== primaryId) ?? displays[0])?.bounds;
  }

  private handleDisplayChange(changedDisplay: DisplaySnapshot): void {
    if (this.shuttingDown || this.options.displayPort === undefined) return;
    const displays = this.options.displayPort.getAllDisplays();
    if (displays.length === 0) return;
    const host = this.hostWindow;
    const publicWindow = this.publicWindow;
    const hostAffected = host !== null && !host.isDestroyed()
      && this.windowMatchesDisplay(host, changedDisplay)
      && !this.windowMatchesAnyDisplay(host, displays);
    const publicAffected = publicWindow !== null
      && !this.windowMatchesAnyDisplay(publicWindow, displays)
      && (this.windowMatchesDisplay(publicWindow, changedDisplay) || displays.length > 0);

    if (hostAffected) {
      const target = this.options.displayPort.getPrimaryDisplay().workArea;
      host.setFullScreen?.(false);
      host.setBounds?.(target);
      host.show?.();
    }
    if (publicAffected) this.requestPublicRecovery();
  }

  private requestPublicRecovery(): void {
    if (this.displayRecoveryPending || this.shuttingDown || this.displayMode !== 'dual') return;
    const host = this.hostWindow;
    const publicWindow = this.publicWindow;
    const publicWebContentsId = publicWindow?.webContents.id;
    const confirm = this.options.confirmPublicRecovery;
    if (host === null || host.isDestroyed() || publicWindow === null || confirm === undefined) return;
    this.displayRecoveryPending = true;
    void confirm(host).then((accepted) => {
      this.displayRecoveryPending = false;
      if (!accepted || this.shuttingDown || this.displayMode !== 'dual') return;
      if (this.publicWindow !== publicWindow || publicWindow.isDestroyed()
        || publicWindow.webContents.isDestroyed() || publicWindow.webContents.id !== publicWebContentsId) return;
      if (this.windowMatchesAnyDisplay(publicWindow, this.options.displayPort?.getAllDisplays() ?? [])) return;
      const target = this.publicTarget();
      if (target === undefined) return;
      publicWindow.setFullScreen?.(false);
      publicWindow.setBounds?.(target);
      publicWindow.setFullScreen?.(true);
      publicWindow.show?.();
    }).catch(() => { this.displayRecoveryPending = false; });
  }

  private windowMatchesAnyDisplay(window: ManagedWindow, displays: DisplaySnapshot[]): boolean {
    return displays.some((display) => this.windowMatchesDisplay(window, display));
  }

  private windowMatchesDisplay(window: ManagedWindow, display: DisplaySnapshot): boolean {
    const bounds = window.getBounds?.();
    if (bounds === undefined) return false;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    return centerX >= display.bounds.x
      && centerX < display.bounds.x + display.bounds.width
      && centerY >= display.bounds.y
      && centerY < display.bounds.y + display.bounds.height;
  }
}
