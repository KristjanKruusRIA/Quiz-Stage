import type { GameCommand } from './commands';
import type { GameEvent } from './events';
import type { GameState } from './types';

export interface GameTransition {
  state: GameState;
  events: GameEvent[];
}

export interface GameInputGateway {
  submit(command: GameCommand): Promise<GameTransition>;
}
