import { APP_VERSION } from '../appMeta';
import type { GameCommand } from './commands';
import type { GameEvent } from './events';
import {
  GameRuleError,
  reduceGameState,
  seededIndex,
} from './reducer';
import type { Board, Clue, GameConfig, GameState, UndoMutableState } from './types';

export { applyFinalJudgment, finalEligibleTeams, maxDailyDoubleWager } from './reducer';

export interface SelectedBoards {
  seed: string;
  boards: Board[];
  dailyDoubleClueIds: string[];
  finalClue?: Clue | null;
  tiebreakerClues?: Clue[];
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
    dailyDoubleWager: null,
    finalWagers: {},
    finalEligibleTeamIds: [],
    finalRevealOrder: [],
    finalRevealedTeamIds: [],
    tiebreakerClues: selectedBoards.tiebreakerClues ?? [],
    tiebreakerTeamIds: [],
    usedTiebreakerClueIds: [],
    suddenDeathClueNumber: 0,
    winnerTeamId: null,
    endedIncomplete: false,
    lastClosedClueId: null,
    lastClosedPhase: null,
    lastClosedControllingTeamId: null,
    disabledClueIds: [],
    eventSequence: 0,
    undoStack: [],
  };
}

export function applyGameCommand(state: GameState, command: GameCommand): { state: GameState; events: GameEvent[] } {
  const at = 'at' in command ? command.at : 0;
  const eventId = commandEventId(state, command, at);

  if (command.type === 'LockTeam') {
    const expiryEvents = tickTimer(state, command.at);
    if (expiryEvents.length > 0) return { state, events: expiryEvents };
  }

  if (command.type === 'UndoLast') {
    if (state.phase === 'complete') {
      throw new GameRuleError('MATCH_COMPLETE', 'A completed match cannot be changed');
    }
    const frame = state.undoStack.at(-1);
    if (frame === undefined) {
      throw new GameRuleError('NOTHING_TO_UNDO', 'There is no reversible host action to undo');
    }
    const nextState = {
      ...state,
      ...cloneMutableState(frame.state),
      eventSequence: state.eventSequence + 1,
      undoStack: state.undoStack.slice(0, -1),
    };
    return {
      state: nextState,
      events: [{ id: eventId, matchId: state.id, at, type: 'ActionUndone', eventId: frame.eventId }],
    };
  }

  const reducedState = reduceGameState(state, command);
  const nextState: GameState = {
    ...reducedState,
    eventSequence: state.eventSequence + 1,
    undoStack: command.type === 'EndIncompleteMatch'
      ? []
      : isReversibleCommand(command)
      ? [...state.undoStack, { eventId, state: captureMutableState(state) }]
      : state.undoStack,
  };

  const event: GameEvent = command.type === 'EndIncompleteMatch'
    ? { id: eventId, matchId: state.id, at, type: 'MatchEnded' }
    : { id: eventId, matchId: state.id, at, type: 'CommandApplied', command };
  return { state: nextState, events: [event] };
}

export function tickTimer(state: GameState, now: number): GameEvent[] {
  const { timer } = state;
  if (timer.status !== 'running') return [];
  if (timer.startedAt === null) {
    state.timer = { ...timer, startedAt: now };
    return [];
  }
  if (now < timer.startedAt) {
    throw new GameRuleError('INVALID_TIMESTAMP', 'Timer ticks must move forward in time');
  }
  if (now - timer.startedAt < timer.remainingMs) return [];
  state.timer = { ...timer, remainingMs: 0, startedAt: null, status: 'expired' };
  return [{
    id: `${state.id}:${state.eventSequence}:TimerExpired:${now}`,
    matchId: state.id,
    at: now,
    type: 'TimerExpired',
  }];
}

export function createCompensatingEvent(events: readonly GameEvent[]): GameEvent {
  if (events.some((event) => event.type === 'MatchEnded')) {
    throw new GameRuleError('MATCH_COMPLETE', 'A completed match cannot be changed');
  }
  const undoneEventIds = new Set(events.flatMap((event) => event.type === 'ActionUndone' ? [event.eventId] : []));
  let target: Extract<GameEvent, { type: 'CommandApplied' }> | undefined;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type === 'CommandApplied' && isReversibleCommand(event.command) && !undoneEventIds.has(event.id)) {
      target = event;
      break;
    }
  }
  if (target === undefined) {
    throw new GameRuleError('NOTHING_TO_UNDO', 'There is no reversible host action to undo');
  }
  return {
    id: `${target.matchId}:${events.length}:UndoLast:${target.at}`,
    matchId: target.matchId,
    at: target.at,
    type: 'ActionUndone',
    eventId: target.id,
  };
}

function commandEventId(state: GameState, command: GameCommand, at: number): string {
  return `${state.id}:${state.eventSequence}:${command.type}:${at}:${JSON.stringify(command)}`;
}

function isReversibleCommand(command: GameCommand): boolean {
  return command.type !== 'UndoLast' && command.type !== 'EndIncompleteMatch';
}

function captureMutableState(state: GameState): UndoMutableState {
  return cloneMutableState(state);
}

function cloneMutableState(state: UndoMutableState): UndoMutableState {
  return {
    phase: state.phase,
    scores: { ...state.scores },
    controllingTeamId: state.controllingTeamId,
    activeClue: state.activeClue === null
      ? null
      : { ...state.activeClue, lockedOutTeamIds: [...state.activeClue.lockedOutTeamIds] },
    timer: { ...state.timer },
    usedClueIds: [...state.usedClueIds],
    dailyDoubleWager: state.dailyDoubleWager,
    finalEligibleTeamIds: [...state.finalEligibleTeamIds],
    finalWagers: { ...state.finalWagers },
    finalRevealOrder: [...state.finalRevealOrder],
    finalRevealedTeamIds: [...state.finalRevealedTeamIds],
    tiebreakerTeamIds: [...state.tiebreakerTeamIds],
    usedTiebreakerClueIds: [...state.usedTiebreakerClueIds],
    suddenDeathClueNumber: state.suddenDeathClueNumber,
    winnerTeamId: state.winnerTeamId,
    endedIncomplete: state.endedIncomplete,
    lastClosedClueId: state.lastClosedClueId,
    lastClosedPhase: state.lastClosedPhase,
    lastClosedControllingTeamId: state.lastClosedControllingTeamId,
    disabledClueIds: [...state.disabledClueIds],
  };
}
