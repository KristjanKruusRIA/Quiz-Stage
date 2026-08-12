import type { DatabaseConnection } from './database';
import {
  audioSettingsSchema,
  defaultAudioSettings,
  normalizeAudioSettings,
  type AudioSettings,
} from '../../shared/media/contracts';

const AUDIO_SETTINGS_KEY = 'audio';

export class AudioSettingsRepository {
  constructor(private readonly database: DatabaseConnection, private readonly now = () => Date.now()) {}

  read(): AudioSettings {
    const row = this.database.prepare('SELECT value_json FROM settings WHERE key = ?').get(AUDIO_SETTINGS_KEY) as { value_json: string } | undefined;
    if (row === undefined) return { ...defaultAudioSettings };
    try {
      return audioSettingsSchema.parse(JSON.parse(row.value_json));
    } catch {
      return { ...defaultAudioSettings };
    }
  }

  save(input: unknown): AudioSettings {
    const settings = normalizeAudioSettings(input);
    this.database.prepare(`
      INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(AUDIO_SETTINGS_KEY, JSON.stringify(settings), this.now());
    return settings;
  }
}
