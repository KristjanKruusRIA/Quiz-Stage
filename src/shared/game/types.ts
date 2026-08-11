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
  lockedTeamId: string | null;
  responseRevealed: boolean;
}

export interface GameTimer {
  durationMs: number;
  remainingMs: number;
  startedAt: number | null;
  status: 'idle' | 'running' | 'paused' | 'expired';
}

export interface UndoMutableState {
  phase: GamePhase;
  scores: Record<string, number>;
  controllingTeamId: string | null;
  activeClue: ActiveClue | null;
  timer: GameTimer;
  usedClueIds: string[];
  dailyDoubleWager: number | null;
  finalEligibleTeamIds: string[];
  finalWagers: Record<string, number>;
  finalRevealOrder: string[];
  finalRevealedTeamIds: string[];
  tiebreakerTeamIds: string[];
  usedTiebreakerClueIds: string[];
  suddenDeathClueNumber: number;
  winnerTeamId: string | null;
  endedIncomplete: boolean;
  lastClosedClueId: string | null;
  lastClosedPhase: Extract<GamePhase, 'round-one-board' | 'round-two-board'> | null;
  lastClosedControllingTeamId: string | null;
  disabledClueIds: string[];
}

export interface UndoFrame {
  eventId: string;
  state: UndoMutableState;
}

export interface GameState {
  appVersion: typeof GAME_STATE_VERSION;
  id: string;
  config: GameConfig;
  seed: string;
  phase: GamePhase;
  boards: Board[];
  finalClue: Clue | null;
  scores: Record<string, number>;
  controllingTeamId: string | null;
  activeClue: ActiveClue | null;
  timer: GameTimer;
  usedClueIds: string[];
  dailyDoubleClueIds: string[];
  dailyDoubleWager: number | null;
  finalWagers: Record<string, number>;
  finalEligibleTeamIds: string[];
  finalRevealOrder: string[];
  finalRevealedTeamIds: string[];
  tiebreakerClues: Clue[];
  tiebreakerTeamIds: string[];
  usedTiebreakerClueIds: string[];
  suddenDeathClueNumber: number;
  winnerTeamId: string | null;
  endedIncomplete: boolean;
  lastClosedClueId: string | null;
  lastClosedPhase: Extract<GamePhase, 'round-one-board' | 'round-two-board'> | null;
  lastClosedControllingTeamId: string | null;
  disabledClueIds: string[];
  eventSequence: number;
  undoStack: UndoFrame[];
}

export interface HostGameView {
  appVersion: typeof APP_VERSION;
  state: GameState;
  replayIssue: RecoveryIssue | null;
}

export interface RecoveryIssue {
  sequence: number;
  reason: 'missing-sequence' | 'invalid-event' | 'match-mismatch' | 'row-mismatch';
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

export type PublicGamePhase = Exclude<GamePhase, 'daily-double-wager' | 'daily-double-clue'>;

export interface PublicGameView {
  appVersion: typeof APP_VERSION;
  phase: PublicGamePhase;
  teams: PublicTeamScore[];
  board: PublicBoard | null;
  activeClue: PublicActiveClue | null;
}
