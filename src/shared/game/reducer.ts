import type { GameCommand } from './commands';
import type { ActiveClue, Clue, GameState, GameTimer, Round, Team } from './types';

type BoardRound = Extract<Round, 'round-one' | 'round-two'>;

export class GameRuleError extends Error {
  readonly name = 'GameRuleError';

  constructor(readonly code: string, message: string) {
    super(message);
  }
}

export function maxDailyDoubleWager(score: number, round: BoardRound): number {
  return Math.max(score, round === 'round-one' ? 1000 : 2000);
}

export function finalEligibleTeams(state: GameState): Team[] {
  return state.config.teams.filter((team) => state.scores[team.id] > 0);
}

export function applyFinalJudgment(score: number, wager: number, correct: boolean): number {
  return score + (correct ? wager : -wager);
}

export function reduceGameState(state: GameState, command: GameCommand): GameState {
  switch (command.type) {
    case 'SelectClue':
      return selectClue(state, command.clueId);
    case 'LockTeam':
      return lockTeam(state, command.teamId, command.at);
    case 'JudgeResponse':
      return judgeResponse(state, command.correct, command.at);
    case 'SubmitDailyDoubleWager':
      return submitDailyDoubleWager(state, command.wager);
    case 'SubmitFinalWager':
      return submitFinalWager(state, command.teamId, command.wager);
    case 'RevealFinalTeam':
      return revealFinalTeam(state, command.teamId, command.correct);
    case 'PauseTimer':
      return pauseActiveTimer(state, command.at);
    case 'ResumeTimer':
      return resumeActiveTimer(state, command.at);
    case 'ResetTimer':
      return resetActiveTimer(state, command.at);
    case 'RevealResponse':
      return revealResponse(state);
    case 'AdvanceAfterReveal':
      return advanceAfterReveal(state);
    case 'ReopenClue':
      return reopenClue(state);
    case 'EndIncompleteMatch':
      return endIncompleteMatch(state);
    case 'AdjustScore':
      return adjustScore(state, command.teamId, command.score, command.reason);
    case 'ReportClue':
      return reportClue(state, command.clueId, command.reason);
    case 'UndoLast':
      throw new GameRuleError('UNDO_REQUIRES_HISTORY', 'Undo is applied by the event-aware game engine');
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
  if (state.disabledClueIds.includes(clueId)) {
    throw new GameRuleError('CLUE_DISABLED', 'The selected clue was disabled by the host');
  }

  const clue = findClue(state, clueId);
  if (clue.round !== boardRound) {
    throw new GameRuleError('INVALID_CLUE', 'The selected clue does not belong to the active board');
  }

  const activeClue: ActiveClue = { clueId, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false };
  const durationMs = state.config.clueSeconds * 1000;
  if (state.dailyDoubleClueIds.includes(clueId)) {
    return {
      ...state,
      phase: 'daily-double-wager',
      activeClue,
      dailyDoubleWager: null,
      lastClosedClueId: null,
      lastClosedPhase: null,
      lastClosedControllingTeamId: null,
      timer: { durationMs, remainingMs: durationMs, startedAt: null, status: 'idle' },
    };
  }

  return {
    ...state,
    phase: 'ordinary-clue',
    activeClue,
    lastClosedClueId: null,
    lastClosedPhase: null,
    lastClosedControllingTeamId: null,
    timer: { durationMs, remainingMs: durationMs, startedAt: null, status: 'running' },
  };
}

function lockTeam(state: GameState, teamId: string, at: number): GameState {
  const activeClue = requireLockableClue(state);
  requireKnownTeam(state, teamId);
  if (activeClue.lockedTeamId !== null) {
    throw new GameRuleError('TEAM_ALREADY_LOCKED', 'Judge the locked team before locking another team');
  }
  if (activeClue.lockedOutTeamIds.includes(teamId)) {
    throw new GameRuleError('TEAM_LOCKED_OUT', 'The selected team is locked out for this clue');
  }
  if (state.phase === 'daily-double-clue' && teamId !== state.controllingTeamId) {
    throw new GameRuleError('DAILY_DOUBLE_TEAM_ONLY', 'Only the team that selected the Daily Double may respond');
  }
  if (state.phase === 'tiebreaker' && !state.tiebreakerTeamIds.includes(teamId)) {
    throw new GameRuleError('TIEBREAKER_TEAM_ONLY', 'Only tied teams may respond to sudden death');
  }
  if (state.timer.status !== 'running') {
    throw new GameRuleError('TIMER_NOT_RUNNING', 'A team can only be locked while the clue timer is running');
  }

  return { ...state, activeClue: { ...activeClue, lockedTeamId: teamId }, timer: pauseTimer(state.timer, at) };
}

function judgeResponse(state: GameState, correct: boolean, at: number): GameState {
  if (state.phase === 'daily-double-clue') return judgeDailyDouble(state, correct);
  if (state.phase === 'tiebreaker') return judgeTiebreaker(state, correct, at);

  const activeClue = requireUnrevealedOrdinaryClue(state);
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
      timer: resumeRemainingTimer(state.timer, at),
    };
}

function submitDailyDoubleWager(state: GameState, wager: number): GameState {
  if (state.phase !== 'daily-double-wager' || state.activeClue === null || state.controllingTeamId === null) {
    throw new GameRuleError('INVALID_PHASE', 'A Daily Double wager requires a selected Daily Double');
  }
  const clue = findClue(state, state.activeClue.clueId);
  const maximum = maxDailyDoubleWager(state.scores[state.controllingTeamId], clue.round as BoardRound);
  if (!Number.isInteger(wager) || wager < 5 || wager > maximum) {
    throw new GameRuleError('INVALID_WAGER', `Daily Double wager must be an integer from 5 through ${maximum}`);
  }
  const durationMs = state.config.clueSeconds * 1000;
  return {
    ...state,
    phase: 'daily-double-clue',
    dailyDoubleWager: wager,
    timer: { durationMs, remainingMs: durationMs, startedAt: null, status: 'running' },
  };
}

function judgeDailyDouble(state: GameState, correct: boolean): GameState {
  const activeClue = state.activeClue;
  if (activeClue === null || activeClue.lockedTeamId === null || state.controllingTeamId === null || state.dailyDoubleWager === null) {
    throw new GameRuleError('NO_LOCKED_TEAM', 'Lock the selecting team before judging the Daily Double');
  }
  const clue = findClue(state, activeClue.clueId);
  const teamId = state.controllingTeamId;
  const scores = { ...state.scores, [teamId]: state.scores[teamId] + (correct ? state.dailyDoubleWager : -state.dailyDoubleWager) };
  return completeClue({
    ...state,
    scores,
    activeClue: { ...activeClue, lockedTeamId: null, responseRevealed: true },
    timer: { ...state.timer, startedAt: null, status: 'paused' },
  }, clue);
}

function submitFinalWager(state: GameState, teamId: string, wager: number): GameState {
  if (state.phase !== 'final-category' && state.phase !== 'final-wagers') {
    throw new GameRuleError('INVALID_PHASE', 'Final wagers are only accepted after the Final category is shown');
  }
  requireKnownTeam(state, teamId);
  const eligibleIds = state.finalEligibleTeamIds.length > 0
    ? state.finalEligibleTeamIds
    : finalEligibleTeams(state).map((team) => team.id);
  if (!eligibleIds.includes(teamId)) {
    throw new GameRuleError('FINAL_TEAM_INELIGIBLE', 'Only teams with a positive score may wager in Final');
  }
  if (teamId in state.finalWagers) {
    throw new GameRuleError('WAGER_ALREADY_COMMITTED', 'A Final wager cannot be replaced after it is committed');
  }
  if (!Number.isInteger(wager) || wager < 0 || wager > state.scores[teamId]) {
    throw new GameRuleError('INVALID_WAGER', `Final wager must be an integer from 0 through ${state.scores[teamId]}`);
  }

  const finalRevealOrder = state.finalRevealOrder.length > 0 ? state.finalRevealOrder : sortByScore(state, eligibleIds);
  const finalWagers = { ...state.finalWagers, [teamId]: wager };
  const allCommitted = eligibleIds.every((id) => id in finalWagers);
  if (allCommitted && state.finalClue === null) {
    throw new GameRuleError('FINAL_CLUE_REQUIRED', 'A canonical Final clue is required before Final can begin');
  }
  return {
    ...state,
    phase: allCommitted ? 'final-clue' : 'final-wagers',
    finalEligibleTeamIds: eligibleIds,
    finalRevealOrder,
    finalWagers,
    activeClue: allCommitted && state.finalClue !== null ? {
      clueId: state.finalClue.id,
      lockedOutTeamIds: [],
      lockedTeamId: null,
      responseRevealed: false,
    } : null,
    timer: allCommitted
      ? { durationMs: 30_000, remainingMs: 30_000, startedAt: null, status: 'running' }
      : state.timer,
  };
}

function revealFinalTeam(state: GameState, teamId: string, correct: boolean): GameState {
  if (state.phase !== 'final-clue' && state.phase !== 'final-reveal') {
    throw new GameRuleError('INVALID_PHASE', 'Final teams can only be revealed after the Final clue');
  }
  if (state.phase === 'final-clue' && state.timer.status !== 'expired') {
    throw new GameRuleError('FINAL_TIMER_RUNNING', 'Final teams cannot be revealed before the fixed timer expires');
  }
  const nextTeamId = state.finalRevealOrder[state.finalRevealedTeamIds.length];
  if (teamId !== nextTeamId) {
    throw new GameRuleError('INVALID_REVEAL_ORDER', 'Final teams must be revealed from lowest to highest pre-Final score');
  }
  const wager = state.finalWagers[teamId];
  if (wager === undefined) {
    throw new GameRuleError('MISSING_WAGER', 'The revealed team has no committed Final wager');
  }
  const scores = { ...state.scores, [teamId]: applyFinalJudgment(state.scores[teamId], wager, correct) };
  const finalActiveClue = state.activeClue ?? (state.finalClue === null ? null : {
    clueId: state.finalClue.id,
    lockedOutTeamIds: [],
    lockedTeamId: null,
    responseRevealed: false,
  });
  if (finalActiveClue === null) {
    throw new GameRuleError('FINAL_CLUE_REQUIRED', 'A canonical Final clue is required before Final can be revealed');
  }
  const finalRevealedTeamIds = [...state.finalRevealedTeamIds, teamId];
  const finalJudgments = { ...state.finalJudgments, [teamId]: correct };
  const revealedState = {
    ...state,
    phase: 'final-reveal' as const,
    scores,
    finalRevealedTeamIds,
    finalJudgments,
    activeClue: { ...finalActiveClue, responseRevealed: true },
    timer: { ...state.timer, startedAt: null, status: 'paused' as const },
  };
  return finalRevealedTeamIds.length === state.finalRevealOrder.length
    ? resolveWinnerOrTiebreaker(revealedState, state.finalEligibleTeamIds)
    : revealedState;
}

function judgeTiebreaker(state: GameState, correct: boolean, at: number): GameState {
  const activeClue = state.activeClue;
  if (activeClue === null || activeClue.lockedTeamId === null) {
    throw new GameRuleError('NO_LOCKED_TEAM', 'Lock a tied team before judging sudden death');
  }
  const teamId = activeClue.lockedTeamId;
  if (correct) {
    return {
      ...state,
      phase: 'complete',
      winnerTeamId: teamId,
      activeClue: { ...activeClue, lockedTeamId: null, responseRevealed: true },
      timer: { ...state.timer, startedAt: null, status: 'paused' },
    };
  }

  const lockedOutTeamIds = [...activeClue.lockedOutTeamIds, teamId];
  if (lockedOutTeamIds.length === state.tiebreakerTeamIds.length) {
    return startTiebreaker(state, state.tiebreakerTeamIds, state.suddenDeathClueNumber + 1);
  }
  return {
    ...state,
    activeClue: { ...activeClue, lockedTeamId: null, lockedOutTeamIds },
    timer: resumeRemainingTimer(state.timer, at),
  };
}

function revealResponse(state: GameState): GameState {
  if (state.phase === 'daily-double-clue') {
    if (state.timer.status !== 'expired' || state.activeClue === null) {
      throw new GameRuleError('INVALID_PHASE', 'A Daily Double may be revealed without judgment only after time expires');
    }
    if (state.activeClue.lockedTeamId !== null) {
      throw new GameRuleError('TEAM_ALREADY_LOCKED', 'Judge the locked team before revealing the response');
    }
    const clue = findClue(state, state.activeClue.clueId);
    return completeClue({
      ...state,
      activeClue: { ...state.activeClue, responseRevealed: true },
    }, clue);
  }
  if (state.phase === 'tiebreaker') {
    if (state.activeClue?.lockedTeamId !== null) {
      throw new GameRuleError('TEAM_ALREADY_LOCKED', 'Judge the locked team before revealing the response');
    }
    return startTiebreaker(state, state.tiebreakerTeamIds, state.suddenDeathClueNumber + 1);
  }
  const activeClue = requireUnrevealedOrdinaryClue(state);
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
  const usedClueIds = state.usedClueIds.includes(clue.id) ? state.usedClueIds : [...state.usedClueIds, clue.id];
  const completedState = {
    ...state,
    phase: 'clue-reveal' as const,
    usedClueIds,
    dailyDoubleWager: null,
    lastClosedClueId: clue.id,
    lastClosedPhase: clue.round === 'round-one' ? 'round-one-board' as const : 'round-two-board' as const,
    lastClosedControllingTeamId: state.controllingTeamId,
  };
  return completedState;
}

function advanceAfterReveal(state: GameState): GameState {
  if (
    state.phase !== 'clue-reveal'
    || state.activeClue === null
    || !state.activeClue.responseRevealed
    || state.lastClosedClueId !== state.activeClue.clueId
  ) {
    throw new GameRuleError('REVEAL_REQUIRED', 'A revealed closed clue is required before continuing');
  }
  return advanceClosedClue(state, findClue(state, state.lastClosedClueId));
}

function advanceClosedClue(state: GameState, clue: Clue): GameState {
  const roundComplete = state.boards
    .find((board) => board.round === clue.round)
    ?.categories.every((category) => category.clues.every((candidate) => state.usedClueIds.includes(candidate.id))) ?? false;

  if (clue.round === 'round-one' && roundComplete) {
    return { ...state, phase: 'round-two-board', controllingTeamId: lowestScoringTeam(state), activeClue: null };
  }
  if (clue.round === 'round-two' && roundComplete) {
    return beginFinalOrResolve(state);
  }
  return { ...state, phase: clue.round === 'round-one' ? 'round-one-board' : 'round-two-board', activeClue: null };
}

function beginFinalOrResolve(state: GameState): GameState {
  const eligibleIds = finalEligibleTeams(state).map((team) => team.id);
  if (eligibleIds.length === 0) {
    return resolveWinnerOrTiebreaker(state, state.config.teams.map((team) => team.id));
  }
  return {
    ...state,
    phase: 'final-category',
    activeClue: null,
    finalEligibleTeamIds: eligibleIds,
    finalRevealOrder: sortByScore(state, eligibleIds),
    finalRevealedTeamIds: [],
    finalJudgments: {},
    finalWagers: {},
    timer: idleTimer(state.config.clueSeconds * 1000),
  };
}

function resolveWinnerOrTiebreaker(state: GameState, participantIds: string[]): GameState {
  const highestScore = Math.max(...participantIds.map((id) => state.scores[id]));
  const leaders = participantIds.filter((id) => state.scores[id] === highestScore);
  if (leaders.length === 1) {
    return {
      ...state,
      phase: 'complete',
      winnerTeamId: leaders[0],
      activeClue: state.phase === 'final-reveal' ? state.activeClue : null,
      timer: idleTimer(state.config.clueSeconds * 1000),
    };
  }
  return startTiebreaker(state, leaders, 1);
}

function startTiebreaker(state: GameState, teamIds: string[], clueNumber: number): GameState {
  const clue = state.tiebreakerClues[state.usedTiebreakerClueIds.length];
  if (clue === undefined || clue.round !== 'tiebreaker') {
    throw new GameRuleError('TIEBREAKER_CLUE_REQUIRED', 'A preselected canonical tiebreaker clue is required');
  }
  const durationMs = state.config.clueSeconds * 1000;
  return {
    ...state,
    phase: 'tiebreaker',
    tiebreakerTeamIds: teamIds,
    suddenDeathClueNumber: clueNumber,
    winnerTeamId: null,
    usedTiebreakerClueIds: [...state.usedTiebreakerClueIds, clue.id],
    activeClue: {
      clueId: clue.id,
      lockedOutTeamIds: [],
      lockedTeamId: null,
      responseRevealed: false,
    },
    timer: { durationMs, remainingMs: durationMs, startedAt: null, status: 'running' },
  };
}

function pauseActiveTimer(state: GameState, at: number): GameState {
  requireTimedPhase(state);
  if (state.timer.status !== 'running') {
    throw new GameRuleError('TIMER_NOT_RUNNING', 'Only a running timer may be paused');
  }
  return { ...state, timer: pauseTimer(state.timer, at) };
}

function resumeActiveTimer(state: GameState, at: number): GameState {
  requireTimedPhase(state);
  if (state.timer.status !== 'paused' || state.timer.remainingMs === 0) {
    throw new GameRuleError('TIMER_NOT_PAUSED', 'Only a paused timer with time remaining may be resumed');
  }
  return { ...state, timer: { ...state.timer, startedAt: at, status: 'running' } };
}

function resetActiveTimer(state: GameState, at: number): GameState {
  requireTimedPhase(state);
  if (state.timer.startedAt !== null && at < state.timer.startedAt) {
    throw new GameRuleError('INVALID_TIMESTAMP', 'Timer commands must move forward in time');
  }
  return { ...state, timer: { ...state.timer, remainingMs: state.timer.durationMs, startedAt: at, status: 'running' } };
}

function reopenClue(state: GameState): GameState {
  if (
    !['round-one-board', 'round-two-board', 'final-category'].includes(state.phase)
    || state.lastClosedClueId === null
    || state.lastClosedPhase === null
  ) {
    throw new GameRuleError('CLUE_NOT_REOPENABLE', 'Only the most recently closed clue may be reopened before another selection');
  }
  return {
    ...state,
    phase: state.lastClosedPhase,
    controllingTeamId: state.lastClosedControllingTeamId,
    activeClue: null,
    usedClueIds: state.usedClueIds.filter((id) => id !== state.lastClosedClueId),
    lastClosedClueId: null,
    lastClosedPhase: null,
    lastClosedControllingTeamId: null,
    finalEligibleTeamIds: [],
    finalWagers: {},
    finalRevealOrder: [],
    finalRevealedTeamIds: [],
    finalJudgments: {},
    tiebreakerTeamIds: [],
    usedTiebreakerClueIds: [],
    suddenDeathClueNumber: 0,
    winnerTeamId: null,
    timer: idleTimer(state.config.clueSeconds * 1000),
  };
}

function endIncompleteMatch(state: GameState): GameState {
  if (state.phase === 'complete') {
    throw new GameRuleError('MATCH_ALREADY_COMPLETE', 'A completed match cannot be ended as incomplete');
  }
  return {
    ...state,
    phase: 'complete',
    endedIncomplete: true,
    winnerTeamId: null,
    timer: { ...state.timer, startedAt: null, status: 'paused' },
  };
}

function adjustScore(state: GameState, teamId: string, score: number, reason: string): GameState {
  requireIncompleteMatch(state);
  requireKnownTeam(state, teamId);
  if (!reason.trim()) {
    throw new GameRuleError('ADJUSTMENT_REASON_REQUIRED', 'A score adjustment requires a reason');
  }
  return { ...state, scores: { ...state.scores, [teamId]: score } };
}

function reportClue(state: GameState, clueId: string, reason: string): GameState {
  requireIncompleteMatch(state);
  if (!reason.trim()) {
    throw new GameRuleError('REPORT_REASON_REQUIRED', 'Reporting a clue requires a reason');
  }
  const clue = findClue(state, clueId);
  const disabledClueIds = state.disabledClueIds.includes(clueId) ? state.disabledClueIds : [...state.disabledClueIds, clueId];
  if (state.phase === 'tiebreaker' && state.activeClue?.clueId === clueId && clue.round === 'tiebreaker') {
    return startTiebreaker(
      { ...state, disabledClueIds },
      state.tiebreakerTeamIds,
      state.suddenDeathClueNumber + 1,
    );
  }
  const activeClue = state.activeClue?.clueId === clueId
    ? { ...state.activeClue, lockedTeamId: null, responseRevealed: false }
    : { clueId, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false };
  const reportedState = completeClue({
    ...state,
    disabledClueIds,
    activeClue,
    timer: { ...state.timer, startedAt: null, status: 'paused' },
  }, clue);
  return advanceClosedClue(reportedState, clue);
}

function boardRoundForPhase(phase: GameState['phase']): BoardRound | null {
  if (phase === 'round-one-board') return 'round-one';
  if (phase === 'round-two-board') return 'round-two';
  return null;
}

function requireUnrevealedOrdinaryClue(state: GameState): ActiveClue {
  if (state.phase !== 'ordinary-clue' || state.activeClue === null || state.activeClue.responseRevealed) {
    throw new GameRuleError('INVALID_PHASE', 'This command requires an unanswered ordinary clue');
  }
  return state.activeClue;
}

function requireLockableClue(state: GameState): ActiveClue {
  if (
    !['ordinary-clue', 'daily-double-clue', 'tiebreaker'].includes(state.phase)
    || state.activeClue === null
    || state.activeClue.responseRevealed
  ) {
    throw new GameRuleError('INVALID_PHASE', 'This command requires an unanswered timed clue');
  }
  return state.activeClue;
}

function requireTimedPhase(state: GameState): void {
  if (!['ordinary-clue', 'daily-double-clue', 'final-clue', 'tiebreaker'].includes(state.phase)) {
    throw new GameRuleError('INVALID_PHASE', 'This command requires an active timed clue');
  }
}

function requireKnownTeam(state: GameState, teamId: string): void {
  if (!state.config.teams.some((team) => team.id === teamId)) {
    throw new GameRuleError('UNKNOWN_TEAM', 'The selected team is not in this match');
  }
}

function requireIncompleteMatch(state: GameState): void {
  if (state.phase === 'complete') {
    throw new GameRuleError('MATCH_COMPLETE', 'A completed match cannot be changed');
  }
}

function findClue(state: GameState, clueId: string): Clue {
  const clue = [
    ...state.boards.flatMap((board) => board.categories).flatMap((category) => category.clues),
    ...(state.finalClue === null ? [] : [state.finalClue]),
    ...state.tiebreakerClues,
  ].find((candidate) => candidate.id === clueId);
  if (clue === undefined) {
    throw new GameRuleError('UNKNOWN_CLUE', 'The selected clue is not part of this match');
  }
  return clue;
}

function pauseTimer(timer: GameTimer, at: number): GameTimer {
  if (timer.startedAt === null) return { ...timer, status: 'paused' };
  if (at < timer.startedAt) {
    throw new GameRuleError('INVALID_TIMESTAMP', 'Timer commands must move forward in time');
  }
  const remainingMs = Math.max(0, timer.remainingMs - (at - timer.startedAt));
  return { ...timer, remainingMs, startedAt: null, status: remainingMs === 0 ? 'expired' : 'paused' };
}

function resumeRemainingTimer(timer: GameTimer, at: number): GameTimer {
  return timer.remainingMs === 0
    ? { ...timer, startedAt: null, status: 'expired' }
    : { ...timer, startedAt: at, status: 'running' };
}

function idleTimer(durationMs: number): GameTimer {
  return { durationMs, remainingMs: durationMs, startedAt: null, status: 'idle' };
}

function sortByScore(state: GameState, teamIds: string[]): string[] {
  const configOrder = new Map(state.config.teams.map((team, index) => [team.id, index]));
  return [...teamIds].sort((left, right) => state.scores[left] - state.scores[right]
    || (configOrder.get(left) ?? 0) - (configOrder.get(right) ?? 0));
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
