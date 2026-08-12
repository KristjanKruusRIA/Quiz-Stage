import type { DatabaseConnection } from './database';
import { appearanceSettingsSchema, defaultAppearanceSettings, type AppearanceSettings } from '../../shared/settings/appearance';

const APPEARANCE_SETTINGS_KEY = 'appearance';

export class AppearanceSettingsRepository {
  constructor(private readonly database: DatabaseConnection, private readonly now = () => Date.now()) {}
  read(): AppearanceSettings {
    const row = this.database.prepare('SELECT value_json FROM settings WHERE key = ?').get(APPEARANCE_SETTINGS_KEY) as { value_json: string } | undefined;
    if (row === undefined) return { ...defaultAppearanceSettings };
    try {
      const stored: unknown = JSON.parse(row.value_json);
      if (typeof stored === 'object' && stored !== null && !('version' in stored)) {
        return appearanceSettingsSchema.parse({ version: 1, reducedMotion: Reflect.get(stored, 'reducedMotion'), revision: Reflect.get(stored, 'revision') ?? 0 });
      }
      return appearanceSettingsSchema.parse(stored);
    }
    catch { return { ...defaultAppearanceSettings }; }
  }
  save(input: unknown): AppearanceSettings {
    const requested = appearanceSettingsSchema.parse(input);
    const current = this.read();
    if (requested.revision !== current.revision) throw new Error('APPEARANCE_REVISION_CONFLICT');
    const settings = { version: 1 as const, reducedMotion: requested.reducedMotion, revision: current.revision + 1 };
    this.database.prepare(`
      INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(APPEARANCE_SETTINGS_KEY, JSON.stringify(settings), this.now());
    return settings;
  }
}
