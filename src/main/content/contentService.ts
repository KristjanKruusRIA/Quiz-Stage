import {
  selectMatchContent,
  type SelectedMatchContent,
  type SelectionInput,
  type SelectionShortage,
} from '../../shared/game/boardSelector';
import type { GameConfig } from '../../shared/game/types';
import type { ContentRepository } from './contentRepository';

export type ContentAvailability = { ok: true } | SelectionShortage;

export class ContentService {
  constructor(private readonly repository: ContentRepository) {}

  checkAvailability(config: GameConfig): ContentAvailability {
    const selected = selectMatchContent(this.loadSelectionInput(config, 'availability'));
    return selected.ok ? { ok: true } : selected;
  }

  selectForMatch(config: GameConfig, seed: string): SelectedMatchContent {
    return selectMatchContent(this.loadSelectionInput(config, seed));
  }

  private loadSelectionInput(config: GameConfig, seed: string): SelectionInput {
    const library = this.repository.loadLibrary();
    return {
      config,
      seed,
      categorySets: library.categorySets.map((set) => ({ ...set })),
      finalClues: library.finalClues.map((clue) => ({ ...clue })),
    };
  }
}
