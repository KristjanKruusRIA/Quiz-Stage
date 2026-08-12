import { describe, expect, it } from 'vitest';
import { openDatabase } from '../../../src/main/persistence/database';
import { AppearanceSettingsRepository } from '../../../src/main/persistence/appearanceSettingsRepository';

function database() {
  const db = openDatabase({ filePath: ':memory:' });
  db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at INTEGER NOT NULL)');
  return db;
}

describe('AppearanceSettingsRepository', () => {
  it('persists the strict reduced-motion preference and rejects contract widening', () => {
    const db = database();
    const repository = new AppearanceSettingsRepository(db);
    expect(repository.read()).toEqual({ version: 1, reducedMotion: false, revision: 0 });
    expect(repository.save({ version: 1, reducedMotion: true, revision: 0 })).toEqual({ version: 1, reducedMotion: true, revision: 1 });
    expect(new AppearanceSettingsRepository(db).read()).toEqual({ version: 1, reducedMotion: true, revision: 1 });
    expect(() => repository.save({ reducedMotion: false, privateData: 'no' })).toThrow();
    expect(repository.read()).toEqual({ version: 1, reducedMotion: true, revision: 1 });
  });

  it('loads the legacy unversioned reduced-motion preference without losing it', () => {
    const db = database();
    db.prepare('INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)')
      .run('appearance', JSON.stringify({ reducedMotion: true }), 1);

    expect(new AppearanceSettingsRepository(db).read()).toEqual({ version: 1, reducedMotion: true, revision: 0 });
  });
});
