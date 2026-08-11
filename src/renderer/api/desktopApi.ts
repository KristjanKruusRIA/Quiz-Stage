import type { GameConfig, HostGameView } from '../../shared/game/types';
import type {
  ContentAvailabilityResponse,
  QuizStageApi,
  SetupOptions,
} from '../../shared/ipc/contracts';

export type HostDesktopApi = {
      surface: 'host';
      getSetupOptions(): Promise<SetupOptions>;
      checkContentAvailability(config: GameConfig): Promise<ContentAvailabilityResponse>;
      startMatch(config: GameConfig): Promise<void>;
      subscribeToState?: (listener: (view: HostGameView) => void) => () => void;
    };

export type DesktopApi = { surface: 'public' } | HostDesktopApi;

export function createDesktopApi(bridge: QuizStageApi): DesktopApi {
  if (
    bridge.startMatch === undefined
    || bridge.checkContentAvailability === undefined
    || bridge.getSetupOptions === undefined
  ) return { surface: 'public' };

  return {
    surface: 'host',
    getSetupOptions: () => bridge.getSetupOptions!(),
    checkContentAvailability: (config) => bridge.checkContentAvailability!(config),
    startMatch: async (config) => {
      await bridge.startMatch!(config);
    },
    subscribeToState: (listener) => bridge.subscribeToState((view) => {
      if ('state' in view) listener(view);
    }),
  };
}

export function getDesktopApi(): DesktopApi {
  return createDesktopApi(window.quizStage);
}
