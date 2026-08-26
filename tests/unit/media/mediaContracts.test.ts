import { describe, expect, it } from 'vitest';
import {
  AUDIO_ASSET_KEYS,
  BRANDING_ASSET_KEYS,
  audioSettingsSchema,
  brandingAssetUrl,
  defaultAudioSettings,
  effectiveAudioGain,
  mediaAssetUrl,
  mediaManifestSchema,
} from '../../../src/shared/media/contracts';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

describe('media contracts', () => {
  it('owns exactly the eight documented pathless WAV asset keys', () => {
    expect(AUDIO_ASSET_KEYS).toEqual([
      'opening', 'round-transition', 'daily-double', 'final-tension',
      'correct-applause', 'incorrect-crowd', 'time-expired', 'winner',
    ]);
    for (const key of AUDIO_ASSET_KEYS) expect(mediaAssetUrl(key)).toBe(`quiz-stage-media://asset/${key}`);
  });

  it('owns exact pathless branding asset URLs', () => {
    expect(BRANDING_ASSET_KEYS).toEqual(['logo', 'stage-background']);
    for (const key of BRANDING_ASSET_KEYS) {
      expect(brandingAssetUrl(key)).toBe(`quiz-stage-media://branding/${key}`);
    }
  });

  it('strictly validates finite settings and clamps effective gain', () => {
    expect(audioSettingsSchema.parse(defaultAudioSettings)).toEqual(defaultAudioSettings);
    expect(() => audioSettingsSchema.parse({ ...defaultAudioSettings, master: Number.NaN })).toThrow();
    expect(() => audioSettingsSchema.parse({ ...defaultAudioSettings, extra: true })).toThrow();
    expect(effectiveAudioGain({ ...defaultAudioSettings, master: 0.5, music: 0.4 }, 'music')).toBe(0.2);
    expect(effectiveAudioGain({ ...defaultAudioSettings, master: 2, effects: -1 }, 'effects')).toBe(0);
    expect(effectiveAudioGain({ ...defaultAudioSettings, muted: true }, 'crowd')).toBe(0);
  });

  it('binds every manifest key to its exact filename, channel, and duration', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'resources', 'media', 'manifest.json'), 'utf8'));
    expect(mediaManifestSchema.parse(manifest)).toEqual(manifest);
    for (const tamper of [
      { file: 'audio/winner.wav' },
      { channel: 'effects' as const },
      { durationMs: 8_021 },
    ]) {
      const changed = structuredClone(manifest);
      Object.assign(changed.assets.opening, tamper);
      expect(() => mediaManifestSchema.parse(changed)).toThrow();
    }
  });

  it('binds each source license identifier to its canonical license URL', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'resources', 'media', 'manifest.json'), 'utf8'));
    manifest.assets.opening.source.licenseUrl = 'https://creativecommons.org/licenses/by/4.0/';
    expect(() => mediaManifestSchema.parse(manifest)).toThrow();
  });

  it('requires the Freesound page and preview URL to identify the same sound', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'resources', 'media', 'manifest.json'), 'utf8'));
    manifest.assets.opening.source.downloadUrl = 'https://cdn.freesound.org/previews/999/999999_6142149-hq.mp3';
    expect(() => mediaManifestSchema.parse(manifest)).toThrow();
  });
});
