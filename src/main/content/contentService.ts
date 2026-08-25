import {
  selectNextTiebreakerClue,
  selectMatchContent,
  type FinalClue,
  type SelectedMatchContent,
  type SelectionInput,
  type SelectionShortage,
} from '../../shared/game/boardSelector';
import type { GameConfig } from '../../shared/game/types';
import type { ContentReportInput, ContentReportRecord } from '../../shared/content/schema';
import type { PersistedContentLibrary } from './contentRepository';
import type { ContentRepository } from './contentRepository';

export type ContentAvailability = { ok: true } | SelectionShortage;

export class ContentService {
  constructor(private readonly repository: ContentRepository) {}
  private cachedLibrary: PersistedContentLibrary | null = null;

  checkAvailability(config: GameConfig): ContentAvailability {
    const selected = selectMatchContent(this.loadSelectionInput(config, 'availability'));
    return selected.ok ? { ok: true } : selected;
  }

  selectForMatch(config: GameConfig, seed: string): SelectedMatchContent {
    return selectMatchContent(this.loadSelectionInput(config, seed));
  }

  selectNextTiebreaker(
    config: GameConfig,
    seed: string,
    excludedIds: readonly string[],
    tieIndex: number,
  ): FinalClue {
    return selectNextTiebreakerClue(this.loadSelectionInput(config, seed), excludedIds, tieIndex);
  }

  reportClue(input: ContentReportInput): ContentReportRecord {
    this.invalidateSelectionCache();
    return this.repository.reportClue(input);
  }

  resolveReport(clueId: string, resolvedAt?: number): boolean {
    this.invalidateSelectionCache();
    return this.repository.resolveReport(clueId, resolvedAt);
  }

  isEligible(clueId: string): boolean {
    return this.repository.isEligible(clueId);
  }

  runTransaction<T>(action: () => T): T {
    this.invalidateSelectionCache();
    return this.repository.runTransaction(action);
  }

  private loadSelectionInput(config: GameConfig, seed: string): SelectionInput {
    const library = this.loadSelectionLibrary();
    return {
      config,
      seed,
      categorySets: library.categorySets.map((set) => ({ ...set })),
      finalClues: library.finalClues.map((clue) => ({ ...clue })),
    };
  }

  private loadSelectionLibrary(): PersistedContentLibrary {
    if (this.cachedLibrary !== null) return this.cachedLibrary;
    const loaded = this.repository.loadLibrary();
    this.cachedLibrary = loaded;
    return loaded;
  }

  invalidateSelectionCache(): void {
    this.cachedLibrary = null;
  }
}
