import { ContentRepository } from './content/contentRepository';
import { ContentService } from './content/contentService';
import { GameCoordinator } from './coordinator/gameCoordinator';
import type { DatabaseConnection } from './persistence/database';
import { MatchRepository } from './persistence/matchRepository';

interface ApplicationOptions {
  now?: () => number;
  createSeed?: () => string;
}

export function createApplication(database: DatabaseConnection, options: ApplicationOptions = {}) {
  const repository = new MatchRepository(database);
  const contentService = new ContentService(new ContentRepository(database));
  const coordinator = new GameCoordinator({
    repository,
    contentService,
    now: options.now,
    createSeed: options.createSeed,
  });

  return {
    coordinator,
    repository,
    close: () => database.close(),
  };
}
