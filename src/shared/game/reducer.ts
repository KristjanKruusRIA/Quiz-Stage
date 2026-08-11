import type { GameCommand } from './commands';
import type { Clue, GameState, GameTimer, Round } from './types';

export class GameRuleError extends Error {
  readonly name = 'GameRuleError';

  constructor(readonly code: string, message: string) {
    super(message);
  }
}

export function reduceGameState(state: GameState, command: GameCommand): GameState {
  switch (command.type) {
    case 'SelectClue':
      return selectClue(state, command.clueId);
    case 'LockTeam':
      return lockTeam(state, command.teamId, command.at);
    case 'JudgeResponse':
      return judgeResponse(state, command.correct, command.at);
    case 'RevealResponse':
      return revealResponse(state);
    default:
      throw new GameRuleError('UNSUPPORTED_COMMAND', `${command.type} is not available during ordinary play`);
  }
}

function selectClue(state: GameState, clueId: string): GameState {
  const boardRound = boardRoundForPhase(state.phase);
  if (boardRound === null) {
    throw new GameRuleError('INVALID_PHASE', 'A clue can only be selected from an active board');
  }
  if (state.usedClueIds.includes(clueId)) {
    throw new GameRuleError('CLUE_USED', 'The selected clue has already been used');
  }
  if (state.dailyDoubleClueIds.includes(clueId)) {
    throw new GameRuleError('DAILY_DOUBLE_UNAVAILABLE', 'Daily Double play is not available yet');
  }

  const clue = findClue(state, clueId);
  if (clue.round !== boardRound) {
    throw new GameRuleError('INVALID_CLUE', 'The selected clue does not belong to the active board');
  }

  return {
    ...state,
    phase: 'ordinary-clue',
    activeClue: { clueId, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
    timer: {
      durationMs: state.config.clueSeconds * 1000,
      remainingMs: state.config.clueSeconds * 1000,
      startedAt: null,
      status: 'running',
    },
  };
}

function lockTeam(state: GameState, teamId: string, at: number): GameState {
  const activeClue = requireUnrevealedActiveClue(state);
  if (activeClue.lockedTeamId !== null) {
    throw new GameRuleError('TEAM_ALREADY_LOCKED', 'Judge the locked team before locking another team');
  }
  if (!state.config.teams.some((team) => team.id === teamId)) {
    throw new GameRuleError('UNKNOWN_TEAM', 'The selected team is not in this match');
  }
  if (activeClue.lockedOutTeamIds.includes(teamId)) {
    throw new GameRuleError('TEAM_LOCKED_OUT', 'The selected team is locked out for this clue');
  }
  if (state.timer.status !== 'running') {
    throw new GameRuleError('TIMER_NOT_RUNNING', 'A team can only be locked while the clue timer is running');
  }

  return {
    ...state,
    activeClue: { ...activeClue, lockedTeamId: teamId },
    timer: pauseTimer(state.timer, at),
  };
}

function judgeResponse(state: GameState, correct: boolean, at: number): GameState {
  const activeClue = requireUnrevealedActiveClue(state);
  if (activeClue.lockedTeamId === null) {
    throw new GameRuleError('NO_LOCKED_TEAM', 'Lock a team before judging a response');
  }

  const clue = findClue(state, activeClue.clueId);
  const teamId = activeClue.lockedTeamId;
  const scores = { ...state.scores, [teamId]: state.scores[teamId] + (correct ? clue.value : -clue.value) };

  if (correct) {
    return completeClue({
      ...state,
      scores,
      controllingTeamId: teamId,
      activeClue: { ...activeClue, lockedTeamId: null, responseRevealed: true },
      timer: { ...state.timer, startedAt: null, status: 'paused' },
    }, clue);
  }

  const lockedOutTeamIds = [...activeClue.lockedOutTeamIds, teamId];
  const allTeamsLocked = lockedOutTeamIds.length === state.config.teams.length;
  return allTeamsLocked
    ? completeClue({
      ...state,
      scores,
      activeClue: { ...activeClue, lockedTeamId: null, lockedOutTeamIds, responseRevealed: true },
      timer: { ...state.timer, startedAt: null, status: 'paused' },
    }, clue)
    : {
      ...state,
      scores,
      activeClue: { ...activeClue, lockedTeamId: null, lockedOutTeamIds },
      timer: { ...state.timer, startedAt: at, status: 'running' },
    };
}

function revealResponse(state: GameState): GameState {
  const activeClue = requireUnrevealedActiveClue(state);
  if (activeClue.lockedTeamId !== null) {
    throw new GameRuleError('TEAM_ALREADY_LOCKED', 'Judge the locked team before revealing the response');
  }
  const clue = findClue(state, activeClue.clueId);
  return completeClue({
    ...state,
    activeClue: { ...activeClue, responseRevealed: true },
    timer: { ...state.timer, startedAt: null, status: 'paused' },
  }, clue);
}

function completeClue(state: GameState, clue: Clue): GameState {
  const usedClueIds = [...state.usedClueIds, clue.id];
  const roundComplete = state.boards
    .find((board) => board.round === clue.round)
    ?.categories.every((category) => category.clues.every((candidate) => usedClueIds.includes(candidate.id))) ?? false;

  if (clue.round === 'round-one' && roundComplete) {
    return {
      ...state,
      phase: 'round-two-board',
      usedClueIds,
      controllingTeamId: lowestScoringTeam(state),
    };
  }
  if (clue.round === 'round-two' && roundComplete) {
    return { ...state, phase: 'final-category', usedClueIds };
  }
  return { ...state, phase: clue.round === 'round-one' ? 'round-one-board' : 'round-two-board', usedClueIds };
}

function boardRoundForPhase(phase: GameState['phase']): Extract<Round, 'round-one' | 'round-two'> | null {
  if (phase === 'round-one-board') return 'round-one';
  if (phase === 'round-two-board') return 'round-two';
  return null;
}

function requireUnrevealedActiveClue(state: GameState) {
  if (state.phase !== 'ordinary-clue' || state.activeClue === null || state.activeClue.responseRevealed) {
    throw new GameRuleError('INVALID_PHASE', 'This command requires an unanswered ordinary clue');
  }
  return state.activeClue;
}

function findClue(state: GameState, clueId: string): Clue {
  const clue = state.boards
    .flatMap((board) => board.categories)
    .flatMap((category) => category.clues)
    .find((candidate) => candidate.id === clueId);
  if (clue === undefined) {
    throw new GameRuleError('UNKNOWN_CLUE', 'The selected clue is not on this match board');
  }
  return clue;
}

function pauseTimer(timer: GameTimer, at: number): GameTimer {
  if (timer.startedAt === null) {
    return { ...timer, status: 'paused' };
  }
  if (at < timer.startedAt) {
    throw new GameRuleError('INVALID_TIMESTAMP', 'Timer commands must move forward in time');
  }
  const remainingMs = Math.max(0, timer.remainingMs - (at - timer.startedAt));
  return { ...timer, remainingMs, startedAt: null, status: remainingMs === 0 ? 'expired' : 'paused' };
}

function lowestScoringTeam(state: GameState): string {
  const lowestScore = Math.min(...state.config.teams.map((team) => state.scores[team.id]));
  const candidates = state.config.teams.filter((team) => state.scores[team.id] === lowestScore);
  return candidates[seededIndex(`${state.seed}:round-two`, candidates.length)].id;
}

export function seededIndex(seed: string, size: number): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % size;
}
