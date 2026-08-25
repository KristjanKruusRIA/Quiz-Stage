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
import { generatePlaceholderAudio } from '../../../scripts/generate-placeholder-audio';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

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
    const manifest = generatePlaceholderAudio(mkdtempSync(join(tmpdir(), 'quiz-stage-manifest-')));
    expect(mediaManifestSchema.parse(manifest)).toEqual(manifest);
    for (const tamper of [
      { file: 'audio/winner.wav' },
      { channel: 'effects' as const },
      { durationMs: 2_499 },
    ]) {
      const changed = structuredClone(manifest);
      Object.assign(changed.assets.opening, tamper);
      expect(() => mediaManifestSchema.parse(changed)).toThrow();
    }
  });
});
