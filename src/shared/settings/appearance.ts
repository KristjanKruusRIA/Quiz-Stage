import { z } from 'zod';

export const appearanceSettingsSchema = z.strictObject({ reducedMotion: z.boolean() });
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
export const defaultAppearanceSettings: AppearanceSettings = Object.freeze({ reducedMotion: false });
