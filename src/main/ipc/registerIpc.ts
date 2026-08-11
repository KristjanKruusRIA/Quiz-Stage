import type { HostGameView, PublicGameView } from '../../shared/game/types';
import type { DisplayMode, GameConfig } from '../../shared/game/types';
import {
  contentAvailabilitySchema,
  gameConfigSchema,
  hostGameViewSchema,
  hasResumableMatchSchema,
  matchHistorySchema,
  noArgsSchema,
  setupOptionsSchema,
  type HostStateUpdate,
  type PublicStateUpdate,
} from '../../shared/ipc/contracts';
import { IPC_CHANNELS } from './channels';
import { validateHostSender } from './validateSender';
import { z } from 'zod';
import { contentIdSchema } from '../../shared/content/schema';
import { CSV_COLUMNS } from '../../shared/content/csvColumns';
import type { CsvPackWorkflow } from '../content/csvPacks';

export interface IpcMainPort {
  handle(channel: string, handler: (event: { sender: { id: number } }, value: unknown) => unknown): void;
  removeHandler(channel: string): void;
  on(channel: string, listener: (event: { sender: { id: number } }) => void): void;
  removeListener(channel: string, listener: (event: { sender: { id: number } }) => void): void;
}

interface CoordinatorPort {
  dispatch(input: unknown): Promise<unknown>;
  subscribe(surface: 'host', subscriber: (view: HostGameView, revision: number) => void): () => void;
  subscribe(surface: 'public', subscriber: (view: PublicGameView, revision: number) => void): () => void;
  getHostStateUpdate(): HostStateUpdate | null;
  getPublicStateUpdate(): PublicStateUpdate | null;
}

export interface CsvDialogPort {
  chooseImportFile(): Promise<string | null>;
  chooseExportFile(packId: string): Promise<string | null>;
}

interface ContentCsvPort {
  previewFile(path: string): ReturnType<CsvPackWorkflow['previewFile']>;
  importPreview(input: Parameters<CsvPackWorkflow['importPreview']>[0]): ReturnType<CsvPackWorkflow['importPreview']>;
  exportToFile(packId: string, destination: string): ReturnType<CsvPackWorkflow['exportToFile']>;
}

interface RegisterIpcOptions {
  ipcMain: IpcMainPort;
  coordinator: CoordinatorPort;
  setup?: {
    startMatch(config: GameConfig): Promise<unknown>;
    checkContentAvailability(config: GameConfig): unknown;
    getSetupOptions(automaticDisplayMode: DisplayMode): unknown;
  };
  matchAccess?: {
    hasResumableMatch(): unknown;
    resumeMatch(): Promise<unknown>;
    listHistory(): unknown;
  };
  contentCsv?: ContentCsvPort;
  csvDialogs?: CsvDialogPort;
  getAutomaticDisplayMode?: () => DisplayMode;
  applyDisplayMode?: (displayMode: DisplayMode) => void;
  getWindows: () => {
    hostWindow: WindowPort | null;
    publicWindow: WindowPort | null;
  };
}

interface WindowPort {
  webContents: {
    id: number;
    send(channel: string, value: unknown): void;
    isDestroyed(): boolean;
  };
}

export function registerIpc({
  ipcMain,
  coordinator,
  setup,
  matchAccess,
  contentCsv,
  csvDialogs,
  getAutomaticDisplayMode,
  applyDisplayMode,
  getWindows,
}: RegisterIpcOptions): () => void {
  const requireHost = (senderId: number) => {
    const hostWindow = getWindows().hostWindow;
    if (hostWindow === null || hostWindow.webContents.isDestroyed()) throw new Error('HOST_SENDER_REQUIRED');
    validateHostSender(senderId, hostWindow.webContents.id);
  };
  ipcMain.handle(IPC_CHANNELS.dispatch, async (event, command) => {
    requireHost(event.sender.id);
    return coordinator.dispatch(command);
  });

  const setupChannels: string[] = [];
  if (setup !== undefined && getAutomaticDisplayMode !== undefined) {
    ipcMain.handle(IPC_CHANNELS.startMatch, async (event, input) => {
      requireHost(event.sender.id);
      const config = gameConfigSchema.parse(input);
      const view = hostGameViewSchema.parse(await setup.startMatch(config));
      applyDisplayMode?.(config.displayMode);
      return view;
    });
    ipcMain.handle(IPC_CHANNELS.contentAvailability, async (event, input) => {
      requireHost(event.sender.id);
      return contentAvailabilitySchema.parse(await setup.checkContentAvailability(gameConfigSchema.parse(input)));
    });
    ipcMain.handle(IPC_CHANNELS.setupOptions, async (event) => {
      requireHost(event.sender.id);
      return setupOptionsSchema.parse(await setup.getSetupOptions(getAutomaticDisplayMode()));
    });
    setupChannels.push(IPC_CHANNELS.startMatch, IPC_CHANNELS.contentAvailability, IPC_CHANNELS.setupOptions);
  }

  const matchAccessChannels: string[] = [];
  if (matchAccess !== undefined) {
    ipcMain.handle(IPC_CHANNELS.hasResumableMatch, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      return hasResumableMatchSchema.parse(await matchAccess.hasResumableMatch());
    });
    ipcMain.handle(IPC_CHANNELS.resumeMatch, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      const value = await matchAccess.resumeMatch();
      if (value === null) return null;
      const view = hostGameViewSchema.parse(value);
      applyDisplayMode?.(view.state.config.displayMode);
      return view;
    });
    ipcMain.handle(IPC_CHANNELS.listHistory, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      return matchHistorySchema.parse(await matchAccess.listHistory());
    });
    matchAccessChannels.push(
      IPC_CHANNELS.hasResumableMatch,
      IPC_CHANNELS.resumeMatch,
      IPC_CHANNELS.listHistory,
    );
  }

  const csvChannels: string[] = [];
  if (contentCsv !== undefined && csvDialogs !== undefined) {
    const issueSchema = z.strictObject({
      code: z.string().min(1),
      message: z.string().min(1),
      row: z.number().int().positive().optional(),
      column: z.enum(CSV_COLUMNS).optional(),
    });
    const previewSchema = z.strictObject({
      previewId: contentIdSchema,
      packId: z.string(),
      packName: z.string(),
      rowCount: z.number().int().positive(),
      conflict: z.boolean(),
      issues: z.array(issueSchema),
    });
    const importRequestSchema = z.strictObject({
      previewId: contentIdSchema,
      conflict: z.enum(['replace-existing', 'keep-both']).optional(),
    });
    const importResultSchema = z.strictObject({
      packId: contentIdSchema,
      replaced: z.boolean(),
      keptBoth: z.boolean(),
      rowCount: z.number().int().positive(),
    });
    const exportRequestSchema = z.strictObject({ packId: contentIdSchema });
    const exportResultSchema = z.strictObject({
      packId: contentIdSchema,
      rowCount: z.number().int().positive(),
      bytes: z.number().int().positive(),
    });

    ipcMain.handle(IPC_CHANNELS.contentImportPreview, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      const path = await csvDialogs.chooseImportFile();
      if (path === null) return { cancelled: true as const };
      return { cancelled: false as const, ...previewSchema.parse(contentCsv.previewFile(path)) };
    });
    ipcMain.handle(IPC_CHANNELS.contentImportCommit, async (event, input) => {
      requireHost(event.sender.id);
      return importResultSchema.parse(contentCsv.importPreview(importRequestSchema.parse(input)));
    });
    ipcMain.handle(IPC_CHANNELS.contentExport, async (event, input) => {
      requireHost(event.sender.id);
      const { packId } = exportRequestSchema.parse(input);
      const path = await csvDialogs.chooseExportFile(packId);
      if (path === null) return { cancelled: true as const };
      return { cancelled: false as const, ...exportResultSchema.parse(contentCsv.exportToFile(packId, path)) };
    });
    csvChannels.push(
      IPC_CHANNELS.contentImportPreview,
      IPC_CHANNELS.contentImportCommit,
      IPC_CHANNELS.contentExport,
    );
  }

  let readyHostWebContentsId: number | null = null;
  let readyPublicWebContentsId: number | null = null;
  const unsubscribeHost = coordinator.subscribe('host', (view, revision) => {
    const hostWindow = getWindows().hostWindow;
    if (
      hostWindow !== null
      && !hostWindow.webContents.isDestroyed()
      && hostWindow.webContents.id === readyHostWebContentsId
    ) {
      hostWindow.webContents.send(IPC_CHANNELS.hostState, { revision, view });
    }
  });
  const unsubscribePublic = coordinator.subscribe('public', (view, revision) => {
    const publicWindow = getWindows().publicWindow;
    if (
      publicWindow !== null
      && !publicWindow.webContents.isDestroyed()
      && publicWindow.webContents.id === readyPublicWebContentsId
    ) {
      publicWindow.webContents.send(IPC_CHANNELS.publicState, { revision, view });
    }
  });

  const bootstrapHost = (event: { sender: { id: number } }) => {
    const hostWindow = getWindows().hostWindow;
    if (
      hostWindow === null
      || hostWindow.webContents.isDestroyed()
      || event.sender.id !== hostWindow.webContents.id
    ) return;
    readyHostWebContentsId = hostWindow.webContents.id;
    const update = coordinator.getHostStateUpdate();
    if (update !== null) hostWindow.webContents.send(IPC_CHANNELS.hostState, update);
  };
  const bootstrapPublic = (event: { sender: { id: number } }) => {
    const publicWindow = getWindows().publicWindow;
    if (
      publicWindow === null
      || publicWindow.webContents.isDestroyed()
      || event.sender.id !== publicWindow.webContents.id
    ) return;
    readyPublicWebContentsId = publicWindow.webContents.id;
    const update = coordinator.getPublicStateUpdate();
    if (update !== null) publicWindow.webContents.send(IPC_CHANNELS.publicState, update);
  };
  ipcMain.on(IPC_CHANNELS.hostReady, bootstrapHost);
  ipcMain.on(IPC_CHANNELS.publicReady, bootstrapPublic);

  return () => {
    ipcMain.removeHandler(IPC_CHANNELS.dispatch);
    for (const channel of setupChannels) ipcMain.removeHandler(channel);
    for (const channel of matchAccessChannels) ipcMain.removeHandler(channel);
    for (const channel of csvChannels) ipcMain.removeHandler(channel);
    ipcMain.removeListener(IPC_CHANNELS.hostReady, bootstrapHost);
    ipcMain.removeListener(IPC_CHANNELS.publicReady, bootstrapPublic);
    unsubscribeHost();
    unsubscribePublic();
  };
}
