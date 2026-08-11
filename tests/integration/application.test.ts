import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApplication } from '../../src/main/application';
import { openDatabase } from '../../src/main/persistence/database';

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

    const view = await application.coordinator.startMatch({
      language: 'en', difficulty: 'medium', clueSeconds: 15, displayMode: 'single', packIds: ['dev-library'],
      teams: [
        { id: 'a', name: 'Alpha', color: '#E3B341' },
        { id: 'b', name: 'Beta', color: '#50A7F5' },
      ],
    });

    expect(view.state.boards).toHaveLength(2);
    expect(application.repository.loadResumable()?.state).toEqual(view.state);
    application.close();
  });
});
