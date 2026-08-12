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
    expect(repository.read()).toEqual({ reducedMotion: false });
    expect(repository.save({ reducedMotion: true })).toEqual({ reducedMotion: true });
    expect(new AppearanceSettingsRepository(db).read()).toEqual({ reducedMotion: true });
    expect(() => repository.save({ reducedMotion: false, privateData: 'no' })).toThrow();
    expect(repository.read()).toEqual({ reducedMotion: true });
  });
});
