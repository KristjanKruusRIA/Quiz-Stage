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
export const AUDIO_ASSET_SPEC = {
  opening: { file: 'audio/opening.wav', durationMs: 2_500, channel: 'music' },
  'round-transition': { file: 'audio/round-transition.wav', durationMs: 1_800, channel: 'music' },
  'daily-double': { file: 'audio/daily-double.wav', durationMs: 900, channel: 'effects' },
  'final-tension': { file: 'audio/final-tension.wav', durationMs: 5_000, channel: 'music' },
  'correct-applause': { file: 'audio/correct-applause.wav', durationMs: 1_800, channel: 'crowd' },
  'incorrect-crowd': { file: 'audio/incorrect-crowd.wav', durationMs: 1_400, channel: 'crowd' },
  'time-expired': { file: 'audio/time-expired.wav', durationMs: 600, channel: 'effects' },
  winner: { file: 'audio/winner.wav', durationMs: 2_500, channel: 'effects' },
} as const satisfies Record<AudioAssetKey, { file: `audio/${string}.wav`; durationMs: number; channel: AudioChannel }>;
export const audioAssetKeySchema = z.enum(AUDIO_ASSET_KEYS);
export const mediaWarningReasonSchema = z.enum(['invalid-extension', 'unsafe-file', 'unreadable', 'too-large', 'malformed-wav', 'missing-bundled', 'invalid-bundled']);
export type MediaWarningReason = z.infer<typeof mediaWarningReasonSchema>;
export const mediaWarningSchema = z.strictObject({ assetKey: audioAssetKeySchema, reason: mediaWarningReasonSchema });
export type MediaWarning = z.infer<typeof mediaWarningSchema>;
export const mediaStatusEventSchema = z.discriminatedUnion('status', [
  mediaWarningSchema.extend({ status: z.literal('warning') }),
  z.strictObject({ status: z.literal('recovered'), assetKey: audioAssetKeySchema }),
]);
export type MediaStatusEvent = z.infer<typeof mediaStatusEventSchema>;

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

export const mediaBrandingSchema = z.strictObject({
  appName: z.string().trim().min(1),
  logo: z.string().regex(/^images\/[A-Za-z0-9._-]+\.png$/).optional(),
});

export const mediaManifestSchema = z.strictObject({
  version: z.literal(1),
  assets: z.record(audioAssetKeySchema, mediaManifestEntrySchema),
  branding: mediaBrandingSchema.optional(),
}).superRefine((manifest, context) => {
  const keys = Object.keys(manifest.assets);
  if (keys.length !== AUDIO_ASSET_KEYS.length || AUDIO_ASSET_KEYS.some((key) => !(key in manifest.assets))) {
    context.addIssue({ code: 'custom', message: 'Manifest must contain exactly the supported media keys' });
  }
  for (const key of AUDIO_ASSET_KEYS) {
    const entry = manifest.assets[key];
    const expected = AUDIO_ASSET_SPEC[key];
    if (entry !== undefined && (entry.file !== expected.file || entry.durationMs !== expected.durationMs || entry.channel !== expected.channel)) {
      context.addIssue({ code: 'custom', path: ['assets', key], message: 'Manifest asset metadata does not match the static contract' });
    }
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
