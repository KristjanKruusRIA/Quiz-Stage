import { z } from 'zod';

export const AUDIO_ASSET_KEYS = [
  'opening',
  'round-transition',
  'daily-double',
  'final-tension',
  'correct-applause',
  'incorrect-crowd',
  'time-expired',
  'winner',
] as const;

export type AudioAssetKey = typeof AUDIO_ASSET_KEYS[number];
export type AudioChannel = 'music' | 'effects' | 'crowd';
export const audioAssetKeySchema = z.enum(AUDIO_ASSET_KEYS);
export const mediaWarningReasonSchema = z.enum(['invalid-extension', 'unsafe-file', 'unreadable', 'too-large', 'malformed-wav', 'missing-bundled', 'invalid-bundled']);
export type MediaWarningReason = z.infer<typeof mediaWarningReasonSchema>;
export const mediaWarningSchema = z.strictObject({ assetKey: audioAssetKeySchema, reason: mediaWarningReasonSchema });
export type MediaWarning = z.infer<typeof mediaWarningSchema>;

export const audioSettingsInputSchema = z.strictObject({
  master: z.number().finite(),
  music: z.number().finite(),
  effects: z.number().finite(),
  crowd: z.number().finite(),
  muted: z.boolean(),
});

export const audioSettingsSchema = audioSettingsInputSchema.extend({
  master: z.number().finite().min(0).max(1),
  music: z.number().finite().min(0).max(1),
  effects: z.number().finite().min(0).max(1),
  crowd: z.number().finite().min(0).max(1),
});

export type AudioSettings = z.infer<typeof audioSettingsSchema>;

export const defaultAudioSettings: AudioSettings = Object.freeze({
  master: 0.8,
  music: 0.7,
  effects: 0.8,
  crowd: 0.8,
  muted: false,
});

export const mediaManifestEntrySchema = z.strictObject({
  file: z.string().regex(/^audio\/[a-z-]+\.wav$/),
  mime: z.literal('audio/wav'),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  durationMs: z.number().int().positive(),
  channel: z.enum(['music', 'effects', 'crowd']),
});

export const mediaManifestSchema = z.strictObject({
  version: z.literal(1),
  assets: z.record(audioAssetKeySchema, mediaManifestEntrySchema),
}).superRefine((manifest, context) => {
  const keys = Object.keys(manifest.assets);
  if (keys.length !== AUDIO_ASSET_KEYS.length || AUDIO_ASSET_KEYS.some((key) => !(key in manifest.assets))) {
    context.addIssue({ code: 'custom', message: 'Manifest must contain exactly the supported media keys' });
  }
});

export type MediaManifest = z.infer<typeof mediaManifestSchema>;

export function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function normalizeAudioSettings(input: unknown): AudioSettings {
  const parsed = audioSettingsInputSchema.parse(input);
  return {
    master: clampVolume(parsed.master),
    music: clampVolume(parsed.music),
    effects: clampVolume(parsed.effects),
    crowd: clampVolume(parsed.crowd),
    muted: parsed.muted,
  };
}

export function effectiveAudioGain(settings: AudioSettings, channel: AudioChannel): number {
  if (settings.muted) return 0;
  return clampVolume(settings.master) * clampVolume(settings[channel]);
}

export function mediaAssetUrl(key: AudioAssetKey): string {
  return `quiz-stage-media://asset/${key}`;
}

export function audioChannelForAsset(key: AudioAssetKey): AudioChannel {
  if (key === 'opening' || key === 'round-transition' || key === 'final-tension') return 'music';
  if (key === 'correct-applause' || key === 'incorrect-crowd') return 'crowd';
  return 'effects';
}
