import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/channels';
import type { GameCommand } from '../shared/game/commands';
import {
  contentAvailabilitySchema,
  audioSettingsSchema,
  gameCommandSchema,
  gameConfigSchema,
  hostGameViewSchema,
  matchConfigurationPreviewSchema,
  hasResumableMatchSchema,
  hostStateUpdateSchema,
  matchHistorySchema,
  publicStateUpdateSchema,
  topicRevealSchema,
  rerollConfiguredTopicRequestSchema,
  setupOptionsSchema,
  startConfiguredMatchRequestSchema,
  type HostQuizStageApi,
  type PublicQuizStageApi,
  type QuizStageApi,
} from '../shared/ipc/contracts';
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
} from '../shared/content/editor';
import { contentReportRecordSchema } from '../shared/content/schema';
import { z } from 'zod';
import { audioSettingsInputSchema, mediaStatusEventSchema, mediaWarningSchema } from '../shared/media/contracts';
import { appearanceSettingsSchema } from '../shared/settings/appearance';

export interface PreloadIpcPort {
  invoke(channel: string, value: unknown): Promise<unknown>;
  on(channel: string, listener: (event: unknown, value: unknown) => void): unknown;
  removeListener(channel: string, listener: (event: unknown, value: unknown) => void): unknown;
  send(channel: string): void;
}

export function createQuizStageApi(surface: 'host', ipc: PreloadIpcPort): HostQuizStageApi;
export function createQuizStageApi(surface: 'public', ipc: PreloadIpcPort): PublicQuizStageApi;
export function createQuizStageApi(surface: 'host' | 'public', ipc: PreloadIpcPort): QuizStageApi {
  const subscribeToHostState: HostQuizStageApi['subscribeToState'] = (listener) => {
    let latestRevision = -1;
    const wrapped = (_event: unknown, value: unknown) => {
      const update = hostStateUpdateSchema.parse(value);
      if (update.revision <= latestRevision) return;
      latestRevision = update.revision;
      listener(update.view);
    };
    ipc.on(IPC_CHANNELS.hostState, wrapped);
    ipc.send(IPC_CHANNELS.hostReady);
    return () => ipc.removeListener(IPC_CHANNELS.hostState, wrapped);
  };
  const subscribeToPublicState: PublicQuizStageApi['subscribeToState'] = (listener) => {
    let latestRevision = -1;
    let latestTopicCount = -1;
    const wrapped = (_event: unknown, value: unknown) => {
      const update = publicStateUpdateSchema.parse(value);
      const count = update.topicReveal?.count ?? -1;
      if (update.revision < latestRevision || (update.revision === latestRevision && count <= latestTopicCount)) return;
      latestRevision = update.revision;
      latestTopicCount = count;
      listener(update.view, update.presentation, update.topicReveal);
    };
    ipc.on(IPC_CHANNELS.publicState, wrapped);
    ipc.send(IPC_CHANNELS.publicReady);
    return () => ipc.removeListener(IPC_CHANNELS.publicState, wrapped);
  };
  const subscribeToAppearance = (listener: (settings: import('../shared/settings/appearance').AppearanceSettings) => void, onError?: () => void) => {
    let latestRevision = -1;
    let active = true;
    const deliver = (value: unknown) => {
      const settings = appearanceSettingsSchema.parse(value);
      if (!active || settings.revision <= latestRevision) return;
      latestRevision = settings.revision;
      listener(settings);
    };
    const wrapped = (_event: unknown, value: unknown) => deliver(value);
    ipc.on(IPC_CHANNELS.appearanceSettingsChanged, wrapped);
    void ipc.invoke(IPC_CHANNELS.appearanceSettingsGet, undefined).then(deliver).catch(() => {
      if (active && latestRevision < 0) onError?.();
    });
    return () => { active = false; ipc.removeListener(IPC_CHANNELS.appearanceSettingsChanged, wrapped); };
  };
  if (surface === 'public') return { subscribeToState: subscribeToPublicState, subscribeToAppearance };
  const resolvedSchema = z.strictObject({ resolved: z.boolean() });
  const deletedSchema = z.strictObject({ packId: z.string().min(1) });
  return {
    publishTopicReveal: async (reveal) => { await ipc.invoke(IPC_CHANNELS.topicReveal, topicRevealSchema.parse(reveal)); },
    subscribeToAppearance,
    subscribeToMediaWarnings: (listener) => {
      const liveKeys = new Set<string>();
      let active = true;
      const wrapped = (_event: unknown, value: unknown) => {
        const status = mediaStatusEventSchema.parse(value);
        liveKeys.add(status.assetKey);
        try { listener(status); } catch { /* renderer subscriber failures are isolated */ }
      };
      ipc.on(IPC_CHANNELS.mediaWarning, wrapped);
      void ipc.invoke(IPC_CHANNELS.mediaWarningsGet, undefined).then((value) => {
        if (!active) return;
        for (const warning of z.array(mediaWarningSchema).parse(value)) {
          if (liveKeys.has(warning.assetKey)) continue;
          try { listener({ status: 'warning', ...warning }); } catch { /* renderer subscriber failures are isolated */ }
        }
      }, () => undefined);
      return () => { active = false; ipc.removeListener(IPC_CHANNELS.mediaWarning, wrapped); };
    },
    dispatch: async (command: GameCommand) => hostGameViewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.dispatch, gameCommandSchema.parse(command)),
    ),
    startMatch: async (config) => hostGameViewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.startMatch, gameConfigSchema.parse(config)),
    ),
    configureMatch: async (config) => matchConfigurationPreviewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.configureMatch, gameConfigSchema.parse(config)),
    ),
    rerollConfiguredTopic: async (input) => matchConfigurationPreviewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.rerollConfiguredTopic, rerollConfiguredTopicRequestSchema.parse(input)),
    ),
    startConfiguredMatch: async (draftId) => hostGameViewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.startConfiguredMatch, startConfiguredMatchRequestSchema.parse({ draftId })),
    ),
    checkContentAvailability: async (config) => contentAvailabilitySchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentAvailability, gameConfigSchema.parse(config)),
    ),
    getSetupOptions: async () => setupOptionsSchema.parse(
      await ipc.invoke(IPC_CHANNELS.setupOptions, undefined),
    ),
    hasResumableMatch: async () => hasResumableMatchSchema.parse(
      await ipc.invoke(IPC_CHANNELS.hasResumableMatch, undefined),
    ),
    resumeMatch: async () => {
      const value = await ipc.invoke(IPC_CHANNELS.resumeMatch, undefined);
      return value === null ? null : hostGameViewSchema.parse(value);
    },
    listHistory: async () => matchHistorySchema.parse(
      await ipc.invoke(IPC_CHANNELS.listHistory, undefined),
    ),
    saveAndQuit: async () => {
      z.undefined().parse(await ipc.invoke(IPC_CHANNELS.saveAndQuit, undefined));
    },
    getAudioSettings: async () => audioSettingsSchema.parse(
      await ipc.invoke(IPC_CHANNELS.audioSettingsGet, undefined),
    ),
    updateAudioSettings: async (settings) => audioSettingsSchema.parse(
      await ipc.invoke(IPC_CHANNELS.audioSettingsUpdate, audioSettingsInputSchema.parse(settings)),
    ),
    getAppearanceSettings: async () => appearanceSettingsSchema.parse(
      await ipc.invoke(IPC_CHANNELS.appearanceSettingsGet, undefined),
    ),
    updateAppearanceSettings: async (settings) => appearanceSettingsSchema.parse(
      await ipc.invoke(IPC_CHANNELS.appearanceSettingsUpdate, appearanceSettingsSchema.parse(settings)),
    ),
    listContent: async () => editorLibrarySchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentList, undefined),
    ),
    saveCategorySet: async (input) => editorCategorySetSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentSaveCategory, saveCategorySetRequestSchema.parse(input)),
    ),
    saveFinalClue: async (input) => editorFinalClueSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentSaveFinal, saveFinalClueRequestSchema.parse(input)),
    ),
    createContentPack: async (input) => editorPackSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentCreatePack, createContentPackRequestSchema.parse(input)),
    ),
    deleteContentPack: async (input) => deletedSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentDeletePack, deleteContentPackRequestSchema.parse(input)),
    ),
    reportContentClue: async (input) => contentReportRecordSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentReportClue, reportContentClueRequestSchema.parse(input)),
    ),
    resolveContentReport: async (input) => resolvedSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentResolveReport, contentClueActionSchema.parse(input)),
    ),
    previewContentImport: async () => contentImportPreviewSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentImportPreview, undefined),
    ),
    commitContentImport: async (input) => contentImportResultSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentImportCommit, contentImportCommitRequestSchema.parse(input)),
    ),
    discardContentImport: async (input) => z.strictObject({ discarded: z.boolean() }).parse(
      await ipc.invoke(IPC_CHANNELS.contentImportDiscard, contentImportDiscardRequestSchema.parse(input)),
    ),
    exportContentPack: async (input) => contentExportResultSchema.parse(
      await ipc.invoke(IPC_CHANNELS.contentExport, contentExportRequestSchema.parse(input)),
    ),
    subscribeToState: subscribeToHostState,
  };
}

const surface = process.argv.includes('--surface=host') ? 'host' : 'public';
contextBridge.exposeInMainWorld('quizStage', surface === 'host'
  ? createQuizStageApi('host', ipcRenderer)
  : createQuizStageApi('public', ipcRenderer));
