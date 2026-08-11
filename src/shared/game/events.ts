import type { GameCommand } from './commands';

export type GameEvent =
  | { id: string; matchId: string; at: number; type: 'CommandApplied'; command: GameCommand }
  | { id: string; matchId: string; at: number; type: 'TimerExpired' }
  | { id: string; matchId: string; at: number; type: 'ActionUndone'; eventId: string }
  | { id: string; matchId: string; at: number; type: 'MatchEnded' };
