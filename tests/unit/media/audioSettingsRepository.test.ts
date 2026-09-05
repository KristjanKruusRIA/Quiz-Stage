import { describe, expect, it } from 'vitest';
import { openDatabase } from '../../../src/main/persistence/database';
import { AudioSettingsRepository } from '../../../src/main/persistence/audioSettingsRepository';
import { defaultAudioSettings } from '../../../src/shared/media/contracts';

function database() {
  const db = openDatabase({ filePath: ':memory:' });
  db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at INTEGER NOT NULL)');
  return db;
}

describe('AudioSettingsRepository', () => {
  it('persists strict clamped settings across repository restarts', () => {
    const db = database();
    new AudioSettingsRepository(db).save({ master: 2, music: -1, effects: 0.6, crowd: 0.7, muted: true });
    expect(new AudioSettingsRepository(db).read()).toEqual({ master: 1, music: 0, effects: 0.6, crowd: 0.7, muted: true, speechEnabled: false });
  });

  it('rejects NaN and extra fields without replacing the prior value', () => {
    const db = database(); const repository = new AudioSettingsRepository(db);
    repository.save(defaultAudioSettings);
    expect(() => repository.save({ ...defaultAudioSettings, master: Number.NaN })).toThrow();
    expect(() => repository.save({ ...defaultAudioSettings, extra: true } as never)).toThrow();
    expect(repository.read()).toEqual(defaultAudioSettings);
  });

  it('recovers safely from malformed persisted JSON and serializes complete writes', () => {
    const db = database();
    db.prepare('INSERT INTO settings VALUES (?, ?, ?)').run('audio', '{bad', 0);
    const repository = new AudioSettingsRepository(db);
    expect(repository.read()).toEqual(defaultAudioSettings);
    repository.save({ ...defaultAudioSettings, master: 0.2 });
    repository.save({ ...defaultAudioSettings, music: 0.3 });
    expect(repository.read()).toEqual({ ...defaultAudioSettings, music: 0.3 });
  });

  it('hydrates speech as disabled from legacy persisted settings', () => {
    const db = database();
    db.prepare('INSERT INTO settings VALUES (?, ?, ?)').run('audio', JSON.stringify({
      master: 0.4, music: 0.3, effects: 0.2, crowd: 0.1, muted: true,
    }), 0);

    expect(new AudioSettingsRepository(db).read()).toEqual({
      master: 0.4, music: 0.3, effects: 0.2, crowd: 0.1, muted: true, speechEnabled: false,
    });
  });
});
