import { APP_VERSION } from '../appMeta';
import type { GameCommand } from './commands';
import type { GameEvent } from './events';
import { reduceGameState, seededIndex } from './reducer';
import type { Board, Clue, GameConfig, GameState } from './types';

export interface SelectedBoards {
  seed: string;
  boards: Board[];
  dailyDoubleClueIds: string[];
  finalClue?: Clue | null;
}

export function createGame(config: GameConfig, selectedBoards: SelectedBoards, now: number): GameState {
  const controllingTeamId = config.teams[seededIndex(selectedBoards.seed, config.teams.length)].id;
  const durationMs = config.clueSeconds * 1000;

  return {
    appVersion: APP_VERSION,
    id: `match-${now}`,
    config,
    seed: selectedBoards.seed,
    phase: 'round-one-board',
    boards: selectedBoards.boards,
    finalClue: selectedBoards.finalClue ?? null,
    scores: Object.fromEntries(config.teams.map((team) => [team.id, 0])),
    controllingTeamId,
    activeClue: null,
    timer: { durationMs, remainingMs: durationMs, startedAt: null, status: 'idle' },
    usedClueIds: [],
    dailyDoubleClueIds: selectedBoards.dailyDoubleClueIds,
    finalWagers: {},
  };
}

export function applyGameCommand(state: GameState, command: GameCommand): { state: GameState; events: GameEvent[] } {
  const nextState = reduceGameState(state, command);
  const at = 'at' in command ? command.at : 0;
  return {
    state: nextState,
    events: [{
      id: `${state.id}:${state.usedClueIds.length}:${state.activeClue?.lockedOutTeamIds.length ?? 0}:${command.type}:${at}:${JSON.stringify(command)}`,
      matchId: state.id,
      at,
      type: 'CommandApplied',
      command,
    }],
  };
}
