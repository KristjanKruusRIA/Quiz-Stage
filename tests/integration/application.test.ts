import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApplication } from '../../src/main/application';
import { openDatabase } from '../../src/main/persistence/database';
import type { GameConfig } from '../../src/shared/game/types';

describe('main application composition', () => {
  let directory: string | undefined;

  afterEach(() => {
    if (directory !== undefined) rmSync(directory, { recursive: true, force: true });
  });

  it('starts an offline match through the real content and persistence services', async () => {
    directory = mkdtempSync(join(tmpdir(), 'quiz-stage-application-'));
    const databasePath = join(directory, 'quiz.sqlite');
    copyFileSync(join(process.cwd(), 'resources/content/dev-seed.sqlite'), databasePath);
    const database = openDatabase({ filePath: databasePath });
    const application = createApplication(database, { now: () => 100, createSeed: () => 'application-seed' });

    const config: GameConfig = {
      language: 'en', difficulty: 'medium', clueSeconds: 15, displayMode: 'single', packIds: ['dev-library'],
      teams: [
        { id: 'a', name: 'Alpha', color: '#E3B341' },
        { id: 'b', name: 'Beta', color: '#50A7F5' },
      ],
    };

    expect(application.getSetupOptions('dual')).toEqual({
      packs: [{ id: 'dev-library', name: 'Quiz Stage Development Library', enabled: true, selectedByDefault: true }],
      automaticDisplayMode: 'dual',
    });
    expect(application.checkContentAvailability(config)).toEqual({ ok: true });
    const view = await application.startMatch(config);

    expect(view.state.boards).toHaveLength(2);
    expect(application.repository.loadResumable()?.state).toEqual(view.state);
    application.close();
  });

  it('marks only the built-in Adult pack as opt-in in setup options', () => {
    directory = mkdtempSync(join(tmpdir(), 'quiz-stage-application-'));
    const databasePath = join(directory, 'quiz.sqlite');
    copyFileSync(join(process.cwd(), 'resources/content/dev-seed.sqlite'), databasePath);
    const database = openDatabase({ filePath: databasePath });
    database.prepare(`
      INSERT INTO content_packs (id, name, version, source, enabled) VALUES
        ('built-in-adult', 'Adult (Mature) / T\u00e4iskasvanutele', '1', 'bundled', 1),
        ('built-in-estonia', 'Estonia / Eesti', '1', 'bundled', 1),
        ('custom-pack', 'Custom Pack', '1', 'custom-editor', 1)
    `).run();
    const application = createApplication(database, { now: () => 100, createSeed: () => 'application-seed' });

    expect(application.getSetupOptions('dual').packs).toEqual([
      { id: 'built-in-adult', name: 'Adult (Mature) / T\u00e4iskasvanutele', enabled: true, selectedByDefault: false },
      { id: 'built-in-estonia', name: 'Estonia / Eesti', enabled: true, selectedByDefault: true },
      { id: 'custom-pack', name: 'Custom Pack', enabled: true, selectedByDefault: true },
      { id: 'dev-library', name: 'Quiz Stage Development Library', enabled: true, selectedByDefault: true },
    ]);
    application.close();
  });

  it('cancels an authoritative timer before closing persistence', async () => {
    directory = mkdtempSync(join(tmpdir(), 'quiz-stage-application-'));
    const databasePath = join(directory, 'quiz.sqlite');
    copyFileSync(join(process.cwd(), 'resources/content/dev-seed.sqlite'), databasePath);
    const database = openDatabase({ filePath: databasePath });
    const callbacks = new Map<number, () => void>();
    const clearTimeout = vi.fn((handle: unknown) => {
      if (typeof handle === 'number') callbacks.delete(handle);
    });
    const application = createApplication(database, {
      now: () => 100,
      createSeed: () => 'shutdown-seed',
      setTimeout: (callback) => { callbacks.set(1, callback); return 1; },
      clearTimeout,
    });
    const config: GameConfig = {
      language: 'en', difficulty: 'medium', clueSeconds: 15, displayMode: 'single', packIds: ['dev-library'],
      teams: [
        { id: 'a', name: 'Alpha', color: '#E3B341' },
        { id: 'b', name: 'Beta', color: '#50A7F5' },
      ],
    };
    const view = await application.startMatch(config);
    const clueId = view.state.boards[0].categories.flatMap((category) => category.clues)
      .find((clue) => !view.state.dailyDoubleClueIds.includes(clue.id))!.id;
    await application.coordinator.dispatch({ type: 'SelectClue', clueId });
    expect(callbacks).toHaveLength(1);

    application.close();

    expect(clearTimeout).toHaveBeenCalledWith(1);
    expect(callbacks).toHaveLength(0);
  });
});
