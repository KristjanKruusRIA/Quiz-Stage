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
  const board = activeBoard(state, activeClue);

  return {
    appVersion: APP_VERSION,
    phase: state.phase,
    teams: state.config.teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      score: state.scores[team.id],
    })),
    board: board === null ? null : toPublicBoard(board, state, language),
    activeClue: activeClue === null || state.activeClue === null || state.phase === 'daily-double-wager'
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

function activeBoard(state: GameState, activeClue: Clue | null): Board | null {
  if (state.phase === 'round-one-board') return state.boards.find((board) => board.round === 'round-one') ?? null;
  if (state.phase === 'round-two-board') return state.boards.find((board) => board.round === 'round-two') ?? null;
  if (activeClue?.round === 'round-one' || activeClue?.round === 'round-two') {
    return state.boards.find((board) => board.round === activeClue.round) ?? null;
  }
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
