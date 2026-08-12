import { app, BrowserWindow, dialog, ipcMain, protocol, screen, session } from 'electron';
import squirrelStartup from 'electron-squirrel-startup';
import { constants, copyFileSync, lstatSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createApplication } from './application';
import { acceleratedE2eTimerOptions } from './e2eTimerOptions';
import { automaticDisplayMode } from './displayMode';
import { registerIpc } from './ipc/registerIpc';
import { IPC_CHANNELS } from './ipc/channels';
import { openDatabase } from './persistence/database';
import { migrateDatabase } from './persistence/migrations';
import { WindowManager, type DisplaySnapshot, type ManagedWindow } from './windows/windowManager';
import { shouldInstallE2eNetworkGuard } from './e2eNetworkGuard';
import { MediaService } from './media/mediaService';
import { bundledMediaDirectory, mediaOverrideDirectory } from './media/mediaPaths';
import { registerMediaProtocol } from './media/mediaProtocol';
import type { MediaStatusEvent } from '../shared/media/contracts';
import { registerOfflineRendererPolicy } from './offlineRenderer';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let application: ReturnType<typeof createApplication> | null = null;
let windowManager: WindowManager | null = null;
let disposeIpc: (() => void) | null = null;
let disposeMediaProtocol: (() => void) | null = null;
let disposeOfflineRendererPolicy: (() => void) | null = null;
let mediaService: MediaService | null = null;
const e2eExternalRequests: string[] = [];
const displayListeners = new Map<(display: DisplaySnapshot) => void, (_event: Electron.Event, display: Electron.Display) => void>();

protocol.registerSchemesAsPrivileged([{
  scheme: 'quiz-stage-media',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
}]);

function installE2eNetworkGuard(): void {
  if (!shouldInstallE2eNetworkGuard({
    requested: process.argv.includes('--quiz-stage-e2e-network-guard'),
    isPackaged: app.isPackaged,
  })) return;
  Object.assign(globalThis, { __quizStageExternalRequests: e2eExternalRequests });
}

async function createWindows(): Promise<void> {
  if (application === null) return;
  const displayMode = application.coordinator.getHostView()?.state.config.displayMode ?? 'single';
  windowManager ??= new WindowManager({
    createWindow: (options) => new BrowserWindow(options) as unknown as ManagedWindow,
    preloadPath: path.join(__dirname, 'preload.js'),
    rendererHtmlPath: path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    ...(MAIN_WINDOW_VITE_DEV_SERVER_URL ? { devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL } : {}),
    displayPort: {
      getAllDisplays: () => screen.getAllDisplays(),
      getPrimaryDisplay: () => screen.getPrimaryDisplay(),
      on: (event, listener) => {
        const wrapped = (_event: Electron.Event, display: Electron.Display) => listener(display);
        displayListeners.set(listener, wrapped);
        if (event === 'display-removed') screen.on('display-removed', wrapped);
        else screen.on('display-metrics-changed', wrapped);
      },
      removeListener: (event, listener) => {
        const wrapped = displayListeners.get(listener);
        if (wrapped !== undefined) {
          if (event === 'display-removed') screen.removeListener('display-removed', wrapped);
          else screen.removeListener('display-metrics-changed', wrapped);
        }
        displayListeners.delete(listener);
      },
    },
    confirmPublicRecovery: async (hostWindow) => {
      if (hostWindow.isDestroyed() || application === null) return false;
      const language = application.coordinator.getHostView()?.state.config.language ?? 'en';
      const copy = language === 'et'
        ? { title: 'Avalik ekraan eemaldati', message: 'Avalik ekraan ei ole enam saadaval.', detail: 'Kas liigutada avalik vaade allesjäänud ekraanile?', yes: 'Liiguta avalik vaade', no: 'Mitte praegu' }
        : { title: 'Public display removed', message: 'The public display is no longer available.', detail: 'Move the public view to a remaining display?', yes: 'Move public view', no: 'Not now' };
      const result = await dialog.showMessageBox(hostWindow as unknown as BrowserWindow, {
        type: 'question', title: copy.title, message: copy.message, detail: copy.detail,
        buttons: [copy.yes, copy.no], defaultId: 0, cancelId: 1, noLink: true,
      });
      return result.response === 0;
    },
  });
  windowManager.create(displayMode);
  disposeIpc ??= registerIpc({
    ipcMain,
    coordinator: application.coordinator,
    setup: application,
    matchAccess: application,
    contentCsv: application.contentCsv,
    contentEditor: application.contentEditor,
    audioSettings: application.audioSettings,
    appearanceSettings: application.appearanceSettings,
    ...(mediaService === null ? {} : { mediaWarnings: mediaService }),
    csvDialogs: {
      chooseImportFile: async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name: 'CSV packs', extensions: ['csv'] }],
        });
        return result.canceled ? null : result.filePaths[0] ?? null;
      },
      chooseExportFile: async (packId) => {
        const result = await dialog.showSaveDialog({
          defaultPath: `${packId}.csv`,
          filters: [{ name: 'CSV packs', extensions: ['csv'] }],
        });
        return result.canceled ? null : result.filePath ?? null;
      },
    },
    getAutomaticDisplayMode: () => automaticDisplayMode(screen.getAllDisplays().length),
    applyDisplayMode: (displayMode) => windowManager?.create(displayMode),
    getWindows: () => windowManager?.getWindows() ?? { hostWindow: null, publicWindow: null },
  });
}

async function initialize(): Promise<void> {
  const rendererRoot = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`);
  disposeOfflineRendererPolicy = registerOfflineRendererPolicy(session.defaultSession, {
    isPackaged: app.isPackaged,
    rendererRoot,
    ...(MAIN_WINDOW_VITE_DEV_SERVER_URL ? { devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL } : {}),
    ...(shouldInstallE2eNetworkGuard({
      requested: process.argv.includes('--quiz-stage-e2e-network-guard'),
      isPackaged: app.isPackaged,
    }) ? { onBlockedRequest: (url: string) => e2eExternalRequests.push(url) } : {}),
  });
  const userDataDirectory = app.getPath('userData');
  const databasePath = path.join(userDataDirectory, 'quiz-stage.sqlite');
  const databaseEntry = lstatSync(databasePath, { throwIfNoEntry: false });
  if (databaseEntry === undefined) {
    mkdirSync(userDataDirectory, { recursive: true });
    const seedPath = app.isPackaged
      ? path.join(process.resourcesPath, 'seed.sqlite')
      : path.join(app.getAppPath(), 'resources', 'content', 'dev-seed.sqlite');
    copyFileSync(seedPath, databasePath, constants.COPYFILE_EXCL);
  }
  const database = openDatabase({ filePath: databasePath });
  migrateDatabase(database, path.join(userDataDirectory, 'backups'));
  application = createApplication(database, acceleratedE2eTimerOptions(
    process.argv.includes('--quiz-stage-e2e-clock'),
    app.isPackaged,
  ));
  const mediaDirectory = bundledMediaDirectory({
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    workingDirectory: process.cwd(),
  });
  const portable = app.isPackaged && lstatSync(path.join(process.resourcesPath, 'portable.flag'), { throwIfNoEntry: false })?.isFile() === true;
  const sendMediaStatus = (event: MediaStatusEvent) => {
    const webContents = windowManager?.getWindows().hostWindow?.webContents;
    if (webContents === undefined || webContents.isDestroyed()) return;
    try { webContents.send(IPC_CHANNELS.mediaWarning, event); } catch { /* window teardown must not block media */ }
  };
  mediaService = new MediaService({
    bundledDirectory: mediaDirectory,
    overrideDirectory: mediaOverrideDirectory({ userDataDirectory, executablePath: app.getPath('exe'), portable }),
    onWarning: (warning) => sendMediaStatus({ status: 'warning', ...warning }),
    onRecovery: (assetKey) => sendMediaStatus({ status: 'recovered', assetKey }),
  });
  disposeMediaProtocol = registerMediaProtocol(protocol, mediaService);
  await createWindows();
}

if (squirrelStartup) {
  app.quit();
} else {
  app.whenReady().then(() => {
    installE2eNetworkGuard();
    return initialize();
  });

  app.on('activate', () => {
    void createWindows();
  });

  app.on('before-quit', () => {
    disposeIpc?.();
    disposeIpc = null;
    disposeMediaProtocol?.();
    disposeMediaProtocol = null;
    disposeOfflineRendererPolicy?.();
    disposeOfflineRendererPolicy = null;
    mediaService = null;
    windowManager?.dispose();
    windowManager = null;
    application?.close();
    application = null;
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
