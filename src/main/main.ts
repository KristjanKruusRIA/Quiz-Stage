import { app, BrowserWindow, ipcMain } from 'electron';
import squirrelStartup from 'electron-squirrel-startup';
import { constants, copyFileSync, lstatSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createApplication } from './application';
import { registerIpc } from './ipc/registerIpc';
import { openDatabase } from './persistence/database';
import { migrateDatabase } from './persistence/migrations';
import { WindowManager, type ManagedWindow, type ManagedWindows } from './windows/windowManager';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let application: ReturnType<typeof createApplication> | null = null;
let windows: ManagedWindows | null = null;
let disposeIpc: (() => void) | null = null;

async function createWindows(): Promise<void> {
  if (application === null) return;
  const displayMode = application.coordinator.getHostView()?.state.config.displayMode ?? 'single';
  const manager = new WindowManager({
    createWindow: (options) => new BrowserWindow(options) as unknown as ManagedWindow,
    preloadPath: path.join(__dirname, 'preload.js'),
    rendererHtmlPath: path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    ...(MAIN_WINDOW_VITE_DEV_SERVER_URL ? { devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL } : {}),
  });
  disposeIpc?.();
  windows = manager.create(displayMode);
  disposeIpc = registerIpc({ ipcMain, coordinator: application.coordinator, windows });
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
  application = createApplication(database);
  await application.coordinator.resume();
  await createWindows();
}

if (squirrelStartup) {
  app.quit();
} else {
  app.whenReady().then(initialize);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindows();
  });

  app.on('before-quit', () => {
    disposeIpc?.();
    disposeIpc = null;
    windows = null;
    application?.close();
    application = null;
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
