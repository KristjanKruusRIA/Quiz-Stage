import { APP_VERSION } from '../appMeta';

export const GAME_STATE_VERSION = APP_VERSION;

export type Language = 'en' | 'et';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type DisplayMode = 'single' | 'dual';
export type Round = 'round-one' | 'round-two' | 'final' | 'tiebreaker';

export interface Team {
  id: string;
  name: string;
  color: string;
}

export interface GameConfig {
  language: Language;
  difficulty: Difficulty;
  clueSeconds: number;
  teams: Team[];
  packIds: string[];
  displayMode: DisplayMode;
}

export interface LocalizedText {
  en: string;
  et?: string;
}

export interface Clue {
  id: string;
  categoryId: string;
  round: Round;
  tier: number;
  value: number;
  prompt: LocalizedText;
  response: LocalizedText;
  explanation: LocalizedText;
  source: string;
  acceptedResponses?: LocalizedText;
}

export interface Category {
  id: string;
  name: LocalizedText;
  macroTopic: string;
  clues: Clue[];
}

export interface Board {
  id: string;
  round: Extract<Round, 'round-one' | 'round-two'>;
  categories: Category[];
}

export type GamePhase =
  | 'round-one-board'
  | 'ordinary-clue'
  | 'round-two-board'
  | 'daily-double-wager'
  | 'daily-double-clue'
  | 'final-category'
  | 'final-wagers'
  | 'final-clue'
  | 'final-reveal'
  | 'tiebreaker'
  | 'complete';

export interface ActiveClue {
  clueId: string;
  lockedOutTeamIds: string[];
  responseRevealed: boolean;
}

export interface GameState {
  appVersion: typeof GAME_STATE_VERSION;
  id: string;
  config: GameConfig;
  phase: GamePhase;
  boards: Board[];
  finalClue: Clue | null;
  scores: Record<string, number>;
  controllingTeamId: string | null;
  activeClue: ActiveClue | null;
  usedClueIds: string[];
  finalWagers: Record<string, number>;
}

export interface HostGameView {
  appVersion: typeof APP_VERSION;
  state: GameState;
}

export interface PublicTeamScore {
  id: string;
  name: string;
  color: string;
  score: number;
}

export interface PublicClueTile {
  id: string;
  value: number;
  selected: boolean;
}

export interface PublicBoard {
  id: string;
  round: Board['round'];
  categories: Array<{
    id: string;
    name: string;
    clues: PublicClueTile[];
  }>;
}

export type PublicActiveClue =
  | {
      id: string;
      prompt: string;
      responseRevealed: false;
    }
  | {
      id: string;
      prompt: string;
      responseRevealed: true;
      response: string;
      explanation: string;
    };

export interface PublicGameView {
  appVersion: typeof APP_VERSION;
  phase: GamePhase;
  teams: PublicTeamScore[];
  board: PublicBoard | null;
  activeClue: PublicActiveClue | null;
}
