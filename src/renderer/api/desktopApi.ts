import type { GameCommand } from '../../shared/game/commands';
import type { GameConfig, HostGameView, PublicGameView } from '../../shared/game/types';
import type {
  ContentAvailabilityResponse,
  MatchHistoryEntry,
  QuizStageApi,
  SetupOptions,
} from '../../shared/ipc/contracts';

export type HostDesktopApi = {
      surface: 'host';
      getSetupOptions(): Promise<SetupOptions>;
      checkContentAvailability(config: GameConfig): Promise<ContentAvailabilityResponse>;
      startMatch(config: GameConfig): Promise<void>;
      hasResumableMatch(): Promise<boolean>;
      resumeMatch(): Promise<HostGameView | null>;
      listHistory(): Promise<MatchHistoryEntry[]>;
      dispatch(command: GameCommand): Promise<HostGameView>;
      subscribeToState?: (listener: (view: HostGameView) => void) => () => void;
    };

export type PublicDesktopApi = {
  surface: 'public';
  subscribeToState(listener: (view: PublicGameView) => void): () => void;
};

export type DesktopApi = PublicDesktopApi | HostDesktopApi;

export function createDesktopApi(bridge: QuizStageApi): DesktopApi {
  const {
    startMatch,
    dispatch,
    checkContentAvailability,
    getSetupOptions,
    hasResumableMatch,
    resumeMatch,
    listHistory,
  } = bridge;
  if (
    startMatch === undefined
    || dispatch === undefined
    || checkContentAvailability === undefined
    || getSetupOptions === undefined
    || hasResumableMatch === undefined
    || resumeMatch === undefined
    || listHistory === undefined
  ) return {
    surface: 'public',
    subscribeToState: (listener) => bridge.subscribeToState((view) => {
      if (!('state' in view)) listener(view);
    }),
  };

  return {
    surface: 'host',
    getSetupOptions: () => getSetupOptions(),
    checkContentAvailability: (config) => checkContentAvailability(config),
    hasResumableMatch: () => hasResumableMatch(),
    resumeMatch: () => resumeMatch(),
    listHistory: () => listHistory(),
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
