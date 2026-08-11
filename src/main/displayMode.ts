import type { DisplayMode } from '../shared/game/types';

export function automaticDisplayMode(displayCount: number): DisplayMode {
  return displayCount >= 2 ? 'dual' : 'single';
}
