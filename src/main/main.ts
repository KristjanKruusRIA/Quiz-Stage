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
import { WindowManager, type ManagedWindow } from './windows/windowManager';
import { shouldInstallE2eNetworkGuard } from './e2eNetworkGuard';
import { MediaService, parseMediaByteRange, parseMediaRequest } from './media/mediaService';
import { bundledMediaDirectory, mediaOverrideDirectory } from './media/mediaPaths';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let application: ReturnType<typeof createApplication> | null = null;
let windowManager: WindowManager | null = null;
let disposeIpc: (() => void) | null = null;
const e2eExternalRequests: string[] = [];

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
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*', 'https://*/*'] },
    (details, callback) => {
      const url = new URL(details.url);
      const external = !['127.0.0.1', 'localhost'].includes(url.hostname);
      if (external) e2eExternalRequests.push(url.href);
      callback({ cancel: external });
    },
  );
}

async function createWindows(): Promise<void> {
  if (application === null) return;
  const displayMode = application.coordinator.getHostView()?.state.config.displayMode ?? 'single';
  windowManager ??= new WindowManager({
    createWindow: (options) => new BrowserWindow(options) as unknown as ManagedWindow,
    preloadPath: path.join(__dirname, 'preload.js'),
    rendererHtmlPath: path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    ...(MAIN_WINDOW_VITE_DEV_SERVER_URL ? { devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL } : {}),
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
  const userDataDirectory = app.getPath('userData');
  const databasePath = path.join(userDataDirectory, 'quiz-stage.sqlite');
  const databaseEntry = lstatSync(databasePath, { throwIfNoEntry: false });
  if (databaseEntry === undefined) {
    mkdirSync(userDataDirectory, { recursive: true });
    const seedPath = app.isPackaged
      ? path.join(process.resourcesPath, 'dev-seed.sqlite')
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
  const media = new MediaService({
    bundledDirectory: mediaDirectory,
    overrideDirectory: mediaOverrideDirectory({ userDataDirectory, executablePath: app.getPath('exe'), portable }),
    onWarning: (warning) => windowManager?.getWindows().hostWindow?.webContents.send(IPC_CHANNELS.mediaWarning, warning),
  });
  protocol.handle('quiz-stage-media', (request) => {
    try {
      const resolved = media.resolve(parseMediaRequest(request.url));
      let range;
      try {
        range = parseMediaByteRange(request.headers.get('Range'), resolved.bytes.length);
      } catch {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${resolved.bytes.length}` } });
      }
      const bytes = range === null ? resolved.bytes : resolved.bytes.subarray(range.start, range.end + 1);
      const headers: Record<string, string> = {
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'Content-Length': String(bytes.length),
        'Content-Type': resolved.mime,
      };
      if (range !== null) headers['Content-Range'] = `bytes ${range.start}-${range.end}/${resolved.bytes.length}`;
      return new Response(new Uint8Array(bytes), { status: range === null ? 200 : 206, headers });
    } catch {
      return new Response(null, { status: 404 });
    }
  });
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
    windowManager?.dispose();
    windowManager = null;
    application?.close();
    application = null;
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
