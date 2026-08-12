import type { GameCommand } from '../../shared/game/commands';
import type { GameConfig, HostGameView, PublicGameView } from '../../shared/game/types';
import type {
  ContentAvailabilityResponse,
  MatchHistoryEntry,
  QuizStageApi,
  SetupOptions,
  HostQuizStageApi,
} from '../../shared/ipc/contracts';
import type {
  ContentExportResult, ContentImportPreview, ContentImportResult, EditorCategorySet,
  EditorFinalClue, EditorLibrary, EditorPack, SaveCategorySetRequest, SaveFinalClueRequest,
} from '../../shared/content/editor';
import type { ContentReportRecord } from '../../shared/content/schema';
import type { AudioSettings, MediaWarning } from '../../shared/media/contracts';

export type HostDesktopApi = {
      surface: 'host';
      getSetupOptions(): Promise<SetupOptions>;
      checkContentAvailability(config: GameConfig): Promise<ContentAvailabilityResponse>;
      startMatch(config: GameConfig): Promise<void>;
      hasResumableMatch(): Promise<boolean>;
      resumeMatch(): Promise<HostGameView | null>;
      listHistory(): Promise<MatchHistoryEntry[]>;
      getAudioSettings?: () => Promise<AudioSettings>;
      updateAudioSettings?: (settings: AudioSettings) => Promise<AudioSettings>;
      subscribeToMediaWarnings?: (listener: (warning: MediaWarning) => void) => () => void;
      dispatch(command: GameCommand): Promise<HostGameView>;
      listContent?: () => Promise<EditorLibrary>;
      saveCategorySet?: (input: SaveCategorySetRequest) => Promise<EditorCategorySet>;
      saveFinalClue?: (input: SaveFinalClueRequest) => Promise<EditorFinalClue>;
      createContentPack?: (input: unknown) => Promise<EditorPack>;
      deleteContentPack?: (input: unknown) => Promise<{ packId: string }>;
      reportContentClue?: (input: unknown) => Promise<ContentReportRecord>;
      resolveContentReport?: (input: unknown) => Promise<{ resolved: boolean }>;
      previewContentImport?: () => Promise<ContentImportPreview>;
      commitContentImport?: (input: unknown) => Promise<ContentImportResult>;
      discardContentImport?: (input: unknown) => Promise<{ discarded: boolean }>;
      exportContentPack?: (input: unknown) => Promise<ContentExportResult>;
      subscribeToState?: (listener: (view: HostGameView) => void) => () => void;
    };

export type PublicDesktopApi = {
  surface: 'public';
  subscribeToState(listener: (view: PublicGameView) => void): () => void;
};

export type DesktopApi = PublicDesktopApi | HostDesktopApi;

export function createDesktopApi(bridge: QuizStageApi): DesktopApi {
  if (!('dispatch' in bridge)) return {
    surface: 'public',
    subscribeToState: (listener) => bridge.subscribeToState((view) => {
      if (!('state' in view)) listener(view);
    }),
  };
  const hostBridge: HostQuizStageApi = bridge;
  const {
    startMatch,
    dispatch,
    checkContentAvailability,
    getSetupOptions,
    hasResumableMatch,
    resumeMatch,
    listHistory,
    getAudioSettings,
    updateAudioSettings,
    subscribeToMediaWarnings,
  } = hostBridge;

  return {
    surface: 'host',
    getSetupOptions: () => getSetupOptions(),
    checkContentAvailability: (config) => checkContentAvailability(config),
    hasResumableMatch: () => hasResumableMatch(),
    resumeMatch: () => resumeMatch(),
    listHistory: () => listHistory(),
    getAudioSettings: () => getAudioSettings(),
    updateAudioSettings: (settings) => updateAudioSettings(settings),
    subscribeToMediaWarnings: (listener) => subscribeToMediaWarnings(listener),
    listContent: () => hostBridge.listContent(),
    saveCategorySet: (input) => hostBridge.saveCategorySet(input),
    saveFinalClue: (input) => hostBridge.saveFinalClue(input),
    createContentPack: (input) => hostBridge.createContentPack(input),
    deleteContentPack: (input) => hostBridge.deleteContentPack(input),
    reportContentClue: (input) => hostBridge.reportContentClue(input),
    resolveContentReport: (input) => hostBridge.resolveContentReport(input),
    previewContentImport: () => hostBridge.previewContentImport(),
    commitContentImport: (input) => hostBridge.commitContentImport(input),
    discardContentImport: (input) => hostBridge.discardContentImport(input),
    exportContentPack: (input) => hostBridge.exportContentPack(input),
    dispatch: (command) => dispatch(command),
    startMatch: async (config) => {
      await startMatch(config);
    },
    subscribeToState: (listener) => bridge.subscribeToState((view) => {
      if ('state' in view) listener(view);
    }),
  };
}

export function getDesktopApi(): DesktopApi {
  return createDesktopApi(window.quizStage);
}
