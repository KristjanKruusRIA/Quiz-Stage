import { describe, expect, it } from 'vitest';
import {
  AUDIO_ASSET_KEYS,
  audioSettingsSchema,
  defaultAudioSettings,
  effectiveAudioGain,
  mediaAssetUrl,
} from '../../../src/shared/media/contracts';

describe('media contracts', () => {
  it('owns exactly the eight documented pathless WAV asset keys', () => {
    expect(AUDIO_ASSET_KEYS).toEqual([
      'opening', 'round-transition', 'daily-double', 'final-tension',
      'correct-applause', 'incorrect-crowd', 'time-expired', 'winner',
    ]);
    for (const key of AUDIO_ASSET_KEYS) expect(mediaAssetUrl(key)).toBe(`quiz-stage-media://asset/${key}`);
  });

  it('strictly validates finite settings and clamps effective gain', () => {
    expect(audioSettingsSchema.parse(defaultAudioSettings)).toEqual(defaultAudioSettings);
    expect(() => audioSettingsSchema.parse({ ...defaultAudioSettings, master: Number.NaN })).toThrow();
    expect(() => audioSettingsSchema.parse({ ...defaultAudioSettings, extra: true })).toThrow();
    expect(effectiveAudioGain({ ...defaultAudioSettings, master: 0.5, music: 0.4 }, 'music')).toBe(0.2);
    expect(effectiveAudioGain({ ...defaultAudioSettings, master: 2, effects: -1 }, 'effects')).toBe(0);
    expect(effectiveAudioGain({ ...defaultAudioSettings, muted: true }, 'crowd')).toBe(0);
  });
});
