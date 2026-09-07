import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';

describe('content loading performance', () => {
  let database: DatabaseConnection | undefined;

  afterEach(() => {
    database?.close();
    database = undefined;
  });

  it('loads the shipped content library within the setup latency budget', () => {
    database = openDatabase({ filePath: resolve('resources/content/seed.sqlite'), readonly: true });

    const startedAt = performance.now();
    const library = new ContentRepository(database).loadLibrary();
    const elapsedMs = performance.now() - startedAt;

    expect(library.packs).toHaveLength(15);
    expect(library.categorySets).toHaveLength(1_400);
    expect(library.finalClues).toHaveLength(174);
    expect(elapsedMs).toBeLessThan(2_000);
  }, 15_000);
});
