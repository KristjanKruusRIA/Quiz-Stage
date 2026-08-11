import { ContentRepository } from './content/contentRepository';
import { ContentService } from './content/contentService';
import { GameCoordinator } from './coordinator/gameCoordinator';
import type { DatabaseConnection } from './persistence/database';
import { MatchRepository } from './persistence/matchRepository';
import type { DisplayMode, GameConfig } from '../shared/game/types';

interface ApplicationOptions {
  now?: () => number;
  createSeed?: () => string;
}

export function createApplication(database: DatabaseConnection, options: ApplicationOptions = {}) {
  const repository = new MatchRepository(database);
  const contentRepository = new ContentRepository(database);
  const contentService = new ContentService(contentRepository);
  const coordinator = new GameCoordinator({
    repository,
    contentService,
    now: options.now,
    createSeed: options.createSeed,
  });

  return {
    coordinator,
    repository,
    startMatch: (config: GameConfig) => coordinator.startMatch(config),
    checkContentAvailability: (config: GameConfig) => contentService.checkAvailability(config),
    getSetupOptions: (automaticDisplayMode: DisplayMode) => ({
      packs: contentRepository.loadLibrary().packs
        .filter((pack) => pack.enabled)
        .map(({ id, name, enabled }) => ({ id, name, enabled })),
      automaticDisplayMode,
    }),
    close: () => database.close(),
  };
}
