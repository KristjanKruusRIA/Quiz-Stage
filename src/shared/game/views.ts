import { APP_VERSION } from '../appMeta';
import type {
  Board,
  Clue,
  GameState,
  HostGameView,
  LocalizedText,
  PublicBoard,
  PublicGameView,
  RecoveryIssue,
} from './types';

export function toHostGameView(state: GameState, replayIssue: RecoveryIssue | null): HostGameView {
  return {
    appVersion: APP_VERSION,
    state: structuredClone(state),
    replayIssue: replayIssue === null ? null : { ...replayIssue },
  };
}

export function toPublicGameView(state: GameState): PublicGameView {
  const language = state.config.language;
  const activeClue = state.activeClue === null ? null : findClue(state, state.activeClue.clueId);
  const board = activeBoard(state);
  const showActiveClue = state.phase === 'ordinary-clue'
    || state.phase === 'daily-double-clue'
    || state.phase === 'final-clue'
    || state.phase === 'final-reveal'
    || state.phase === 'tiebreaker'
    || (state.phase === 'complete' && state.winnerTeamId !== null && state.activeClue?.responseRevealed === true);

  return {
    appVersion: APP_VERSION,
    phase: publicPhase(state),
    displayMode: state.config.displayMode,
    teams: state.config.teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      score: state.scores[team.id],
    })),
    board: board === null ? null : toPublicBoard(board, state, language),
    timer: { ...state.timer },
    controllingTeamId: ['round-one-board', 'ordinary-clue', 'round-two-board', 'daily-double-wager', 'daily-double-clue'].includes(state.phase)
      ? state.controllingTeamId : null,
    winnerTeamId: state.phase === 'complete' ? state.winnerTeamId : null,
    tiebreakerTeamIds: state.phase === 'tiebreaker' ? [...state.tiebreakerTeamIds] : [],
    final: publicFinal(state, language),
    activeClue: !showActiveClue || activeClue === null || state.activeClue === null
      ? null
      : state.activeClue.responseRevealed
      ? {
          id: 'active-clue',
          prompt: localize(activeClue.prompt, language),
          responseRevealed: true,
          response: localize(activeClue.response, language),
          explanation: localize(activeClue.explanation, language),
        }
      : {
          id: 'active-clue',
          prompt: localize(activeClue.prompt, language),
          responseRevealed: false,
        },
  };
}

function publicFinal(state: GameState, language: GameState['config']['language']): PublicGameView['final'] {
  if (
    state.endedIncomplete
    ||
    state.finalClue === null
    || state.finalEligibleTeamIds.length === 0
    || !['final-category', 'final-wagers', 'final-clue', 'final-reveal', 'complete'].includes(state.phase)
  ) return null;
  return {
    category: state.finalClue.categoryName === undefined
      ? language === 'et' ? 'Finaal' : 'Final'
      : localize(state.finalClue.categoryName, language),
    eligibleTeamIds: [...state.finalEligibleTeamIds],
    revealed: state.finalRevealedTeamIds.flatMap((teamId) => {
      const wager = state.finalWagers[teamId];
      const correct = state.finalJudgments[teamId];
      return wager === undefined || correct === undefined ? [] : [{ teamId, wager, correct }];
    }),
  };
}

function publicPhase(state: GameState): PublicGameView['phase'] {
  return state.phase === 'daily-double-wager' || state.phase === 'daily-double-clue'
    ? 'ordinary-clue'
    : state.phase;
}

function activeBoard(state: GameState): Board | null {
  if (state.phase === 'round-one-board') return state.boards.find((board) => board.round === 'round-one') ?? null;
  if (state.phase === 'round-two-board') return state.boards.find((board) => board.round === 'round-two') ?? null;
  return null;
}

function toPublicBoard(board: Board, state: GameState, language: GameState['config']['language']): PublicBoard {
  return {
    id: board.id,
    round: board.round,
    categories: board.categories.map((category, categoryIndex) => ({
      id: `${board.id}:category:${categoryIndex}`,
      name: localize(category.name, language),
      clues: category.clues.map((clue, clueIndex) => ({
        id: `${board.id}:tile:${categoryIndex}:${clueIndex}`,
        value: clue.value,
        selected: state.usedClueIds.includes(clue.id) || state.activeClue?.clueId === clue.id,
      })),
    })),
  };
}

function findClue(state: GameState, clueId: string): Clue | null {
  for (const board of state.boards) {
    for (const category of board.categories) {
      const clue = category.clues.find((candidate) => candidate.id === clueId);
      if (clue !== undefined) return clue;
    }
  }
  if (state.finalClue?.id === clueId) return state.finalClue;
  return state.tiebreakerClues.find((clue) => clue.id === clueId) ?? null;
}

function localize(text: LocalizedText, language: GameState['config']['language']): string {
  return text[language] ?? text.en;
}
