import type { HostGameView, PublicGameView } from '../../shared/game/types';
import type { DisplayMode, GameConfig } from '../../shared/game/types';
import {
  audioSettingsSchema,
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
import { audioSettingsInputSchema, mediaWarningSchema, type MediaWarning } from '../../shared/media/contracts';
import { IPC_CHANNELS } from './channels';
import { validateHostSender } from './validateSender';
import type { AudioSettings } from '../../shared/media/contracts';
import type { CsvPackWorkflow } from '../content/csvPacks';
import type { ContentEditorService } from '../content/contentEditorService';
import {
  contentClueActionSchema,
  contentExportRequestSchema,
  contentExportResultSchema,
  contentImportCommitRequestSchema,
  contentImportDiscardRequestSchema,
  contentImportPreviewSchema,
  contentImportResultSchema,
  createContentPackRequestSchema,
  deleteContentPackRequestSchema,
  editorCategorySetSchema,
  editorFinalClueSchema,
  editorLibrarySchema,
  editorPackSchema,
  reportContentClueRequestSchema,
  saveCategorySetRequestSchema,
  saveFinalClueRequestSchema,
} from '../../shared/content/editor';
import { contentReportRecordSchema } from '../../shared/content/schema';
import { z } from 'zod';
import { appearanceSettingsSchema, type AppearanceSettings } from '../../shared/settings/appearance';

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
  previewFile(path: string, ownerId?: number): ReturnType<CsvPackWorkflow['previewFile']>;
  importPreview(input: Parameters<CsvPackWorkflow['importPreview']>[0], ownerId?: number): ReturnType<CsvPackWorkflow['importPreview']>;
  discardPreview?(previewId: string, ownerId?: number): boolean;
  discardOwner?(ownerId: number): void;
  dispose?(): void;
  exportToFile(packId: string, destination: string): ReturnType<CsvPackWorkflow['exportToFile']>;
}

interface ContentEditorPort {
  list(): ReturnType<ContentEditorService['list']>;
  saveCategorySet(input: unknown): ReturnType<ContentEditorService['saveCategorySet']>;
  saveFinalClue(input: unknown): ReturnType<ContentEditorService['saveFinalClue']>;
  createPack(input: unknown): ReturnType<ContentEditorService['createPack']>;
  deletePack(input: unknown): ReturnType<ContentEditorService['deletePack']>;
  reportClue(input: unknown): ReturnType<ContentEditorService['reportClue']>;
  resolveReport(input: unknown): ReturnType<ContentEditorService['resolveReport']>;
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
  contentEditor?: ContentEditorPort;
  audioSettings?: {
    read(): AudioSettings;
    save(input: unknown): AudioSettings;
  };
  appearanceSettings?: { read(): AppearanceSettings; save(input: unknown): AppearanceSettings };
  mediaWarnings?: { activeWarnings(): MediaWarning[] };
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
  contentEditor,
  audioSettings,
  appearanceSettings,
  mediaWarnings,
  csvDialogs,
  getAutomaticDisplayMode,
  applyDisplayMode,
  getWindows,
}: RegisterIpcOptions): () => void {
  let activeHostId: number | null = null;
  const requireHost = (senderId: number) => {
    const hostWindow = getWindows().hostWindow;
    if (hostWindow === null || hostWindow.webContents.isDestroyed()) throw new Error('HOST_SENDER_REQUIRED');
    validateHostSender(senderId, hostWindow.webContents.id);
    if (activeHostId !== null && activeHostId !== senderId) contentCsv?.discardOwner?.(activeHostId);
    activeHostId = senderId;
  };
  const requireCurrentSurface = (senderId: number) => {
    const { hostWindow, publicWindow } = getWindows();
    if ([hostWindow, publicWindow].some((window) => window !== null && !window.webContents.isDestroyed() && window.webContents.id === senderId)) return;
    throw new Error('CURRENT_SURFACE_REQUIRED');
  };
  ipcMain.handle(IPC_CHANNELS.dispatch, async (event, command) => {
    requireHost(event.sender.id);
    return coordinator.dispatch(command);
  });

  const audioChannels: string[] = [];
  if (audioSettings !== undefined) {
    ipcMain.handle(IPC_CHANNELS.audioSettingsGet, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      return audioSettingsSchema.parse(audioSettings.read());
    });
    ipcMain.handle(IPC_CHANNELS.audioSettingsUpdate, async (event, input) => {
      requireHost(event.sender.id);
      return audioSettingsSchema.parse(audioSettings.save(audioSettingsInputSchema.parse(input)));
    });
    audioChannels.push(IPC_CHANNELS.audioSettingsGet, IPC_CHANNELS.audioSettingsUpdate);
  }
  if (appearanceSettings !== undefined) {
    ipcMain.handle(IPC_CHANNELS.appearanceSettingsGet, async (event, input) => {
      requireCurrentSurface(event.sender.id); noArgsSchema.parse(input); return appearanceSettingsSchema.parse(appearanceSettings.read());
    });
    ipcMain.handle(IPC_CHANNELS.appearanceSettingsUpdate, async (event, input) => {
      requireHost(event.sender.id);
      const saved = appearanceSettingsSchema.parse(appearanceSettings.save(appearanceSettingsSchema.parse(input)));
      for (const window of [getWindows().hostWindow, getWindows().publicWindow]) {
        if (window !== null && !window.webContents.isDestroyed()) window.webContents.send(IPC_CHANNELS.appearanceSettingsChanged, saved);
      }
      return saved;
    });
    audioChannels.push(IPC_CHANNELS.appearanceSettingsGet, IPC_CHANNELS.appearanceSettingsUpdate);
  }
  if (mediaWarnings !== undefined) {
    ipcMain.handle(IPC_CHANNELS.mediaWarningsGet, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      return mediaWarnings.activeWarnings().map((warning) => mediaWarningSchema.parse(warning));
    });
    audioChannels.push(IPC_CHANNELS.mediaWarningsGet);
  }

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
    ipcMain.handle(IPC_CHANNELS.contentImportPreview, async (event, input) => {
      requireHost(event.sender.id);
      noArgsSchema.parse(input);
      const path = await csvDialogs.chooseImportFile();
      requireHost(event.sender.id);
      if (path === null) return contentImportPreviewSchema.parse({ cancelled: true as const });
      return contentImportPreviewSchema.parse({ cancelled: false as const, ...contentCsv.previewFile(path, event.sender.id) });
    });
    ipcMain.handle(IPC_CHANNELS.contentImportCommit, async (event, input) => {
      requireHost(event.sender.id);
      return contentImportResultSchema.parse(contentCsv.importPreview(contentImportCommitRequestSchema.parse(input), event.sender.id));
    });
    ipcMain.handle(IPC_CHANNELS.contentImportDiscard, async (event, input) => {
      requireHost(event.sender.id);
      const { previewId } = contentImportDiscardRequestSchema.parse(input);
      return z.strictObject({ discarded: z.boolean() }).parse({ discarded: contentCsv.discardPreview?.(previewId, event.sender.id) ?? false });
    });
    ipcMain.handle(IPC_CHANNELS.contentExport, async (event, input) => {
      requireHost(event.sender.id);
      const { packId } = contentExportRequestSchema.parse(input);
      const path = await csvDialogs.chooseExportFile(packId);
      requireHost(event.sender.id);
      if (path === null) return contentExportResultSchema.parse({ cancelled: true as const });
      return contentExportResultSchema.parse({ cancelled: false as const, ...contentCsv.exportToFile(packId, path) });
    });
    csvChannels.push(
      IPC_CHANNELS.contentImportPreview,
      IPC_CHANNELS.contentImportCommit,
      IPC_CHANNELS.contentImportDiscard,
      IPC_CHANNELS.contentExport,
    );
  }

  const editorChannels: string[] = [];
  if (contentEditor !== undefined) {
    const resolvedSchema = z.strictObject({ resolved: z.boolean() });
    const deletedSchema = z.strictObject({ packId: z.string().min(1) });
    const addEditorHandler = (channel: string, handler: (input: unknown) => unknown) => {
      ipcMain.handle(channel, async (event, input) => {
        requireHost(event.sender.id);
        return handler(input);
      });
      editorChannels.push(channel);
    };
    addEditorHandler(IPC_CHANNELS.contentList, (input) => {
      noArgsSchema.parse(input);
      return editorLibrarySchema.parse(contentEditor.list());
    });
    addEditorHandler(IPC_CHANNELS.contentSaveCategory, (input) => editorCategorySetSchema.parse(
      contentEditor.saveCategorySet(saveCategorySetRequestSchema.parse(input)),
    ));
    addEditorHandler(IPC_CHANNELS.contentSaveFinal, (input) => editorFinalClueSchema.parse(
      contentEditor.saveFinalClue(saveFinalClueRequestSchema.parse(input)),
    ));
    addEditorHandler(IPC_CHANNELS.contentCreatePack, (input) => editorPackSchema.parse(
      contentEditor.createPack(createContentPackRequestSchema.parse(input)),
    ));
    addEditorHandler(IPC_CHANNELS.contentDeletePack, (input) => deletedSchema.parse(
      contentEditor.deletePack(deleteContentPackRequestSchema.parse(input)),
    ));
    addEditorHandler(IPC_CHANNELS.contentReportClue, (input) => contentReportRecordSchema.parse(
      contentEditor.reportClue(reportContentClueRequestSchema.parse(input)),
    ));
    addEditorHandler(IPC_CHANNELS.contentResolveReport, (input) => resolvedSchema.parse(
      contentEditor.resolveReport(contentClueActionSchema.parse(input)),
    ));
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
    for (const channel of audioChannels) ipcMain.removeHandler(channel);
    for (const channel of setupChannels) ipcMain.removeHandler(channel);
    for (const channel of matchAccessChannels) ipcMain.removeHandler(channel);
    for (const channel of csvChannels) ipcMain.removeHandler(channel);
    for (const channel of editorChannels) ipcMain.removeHandler(channel);
    ipcMain.removeListener(IPC_CHANNELS.hostReady, bootstrapHost);
    ipcMain.removeListener(IPC_CHANNELS.publicReady, bootstrapPublic);
    unsubscribeHost();
    unsubscribePublic();
    contentCsv?.dispose?.();
  };
}
