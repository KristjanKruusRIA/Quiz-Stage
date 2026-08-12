import { z } from 'zod';

export const appearanceSettingsInputSchema = z.strictObject({ version: z.literal(1), reducedMotion: z.boolean(), revision: z.number().int().nonnegative() });
export const appearanceSettingsSchema = appearanceSettingsInputSchema;
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
export const defaultAppearanceSettings: AppearanceSettings = Object.freeze({ version: 1, reducedMotion: false, revision: 0 });
