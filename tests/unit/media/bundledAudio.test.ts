import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { isValidWav, MediaService } from '../../../src/main/media/mediaService';
import { AUDIO_ASSET_KEYS, mediaManifestSchema } from '../../../src/shared/media/contracts';

const SYNTHESIZED_PLACEHOLDER_HASHES = new Set([
  '389a858a5b16d072909329fa877ba01410c23ced80f36042c61a28b3f533c128',
  '2db3c813c9661040380f076293b5db513b3886874e7706b8d48d519964630f84',
  'e0456acf47d745695560ddd7ea0992778255974d5e2b03b9d758f024e105f4bf',
  'd25b0d90a387391197a5e0f8bf910e5ac8a19318b3a1bad6d3b45cf9217cbaf6',
  '3463996f282b1a9125cb54b237a81edeae26a33b724174a3b9bad327a9c82ff0',
  'a7e2ebb22d7f8b89fe4996deed43bd7becd4b96197ade6c2cf1616343b8af13d',
  '68a6ae8f1b4793e5ea1a165011fb755cdf0169fc62639247ce8212194733eb8f',
  'fb989aa0895145007efb2ad3e5c2ddcc3ce9ccaa3c3069f1efde653d004ada58',
]);

const EXPECTED_SOURCES = {
  'round-transition': { title: 'Stinger 3.wav', creator: 'AudioPapkin', sourcePage: 'https://freesound.org/people/AudioPapkin/sounds/441342/', license: 'CC0-1.0' },
  'daily-double': { title: 'SFX Thrilling Build-Up and Hit 4 (Made at Paradise AIR).wav', creator: 'RutgerMuller', sourcePage: 'https://freesound.org/people/RutgerMuller/sounds/367667/', license: 'CC0-1.0' },
  'final-tension': { title: 'tention-mounts-ticking-clock-loop-dread.ogg', creator: 'Gerent', sourcePage: 'https://freesound.org/people/Gerent/sounds/558256/', license: 'CC0-1.0' },
  'correct-applause': { title: 'Small Crowd Applause with cheer in a Small Room 02.wav', creator: 'AudioSea', sourcePage: 'https://freesound.org/people/AudioSea/sounds/581617/', license: 'CC-BY-4.0' },
  'incorrect-crowd': { title: 'crowdbooing_01.wav', creator: 'xtrgamr', sourcePage: 'https://freesound.org/people/xtrgamr/sounds/239595/', license: 'CC-BY-4.0' },
  'countdown-tick': { title: 'single-tick.wav', creator: 'DeltaCode', sourcePage: 'https://freesound.org/people/DeltaCode/sounds/668355/', license: 'CC0-1.0' },
  'time-expired': { title: 'buzzer.wav', creator: 'hypocore', sourcePage: 'https://freesound.org/people/hypocore/sounds/164090/', license: 'CC0-1.0' },
  winner: { title: 'Game Success Fanfare', creator: 'el_boss', sourcePage: 'https://freesound.org/people/el_boss/sounds/677859/', license: 'CC0-1.0' },
} as const;

describe('bundled audio', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  it('ships valid real clips instead of the synthesized placeholders', () => {
    const bundledDirectory = join(process.cwd(), 'resources', 'media');
    const overrideDirectory = mkdtempSync(join(tmpdir(), 'quiz-stage-empty-media-'));
    temporaryDirectories.push(overrideDirectory);
    const manifest = mediaManifestSchema.parse(JSON.parse(readFileSync(join(bundledDirectory, 'manifest.json'), 'utf8')));
    const service = new MediaService({ bundledDirectory, overrideDirectory });

    expect(Object.keys(manifest.assets)).toEqual(AUDIO_ASSET_KEYS);
    for (const key of AUDIO_ASSET_KEYS) {
      const resolved = service.resolve(key);
      const digest = createHash('sha256').update(resolved.bytes).digest('hex');
      expect(resolved.source).toBe('bundled');
      expect(isValidWav(resolved.bytes)).toBe(true);
      const durationMs = Math.round((resolved.bytes.readUInt32LE(40) / resolved.bytes.readUInt32LE(28)) * 1_000);
      expect(durationMs).toBe(manifest.assets[key].durationMs);
      expect(digest).toBe(manifest.assets[key].sha256);
      expect(SYNTHESIZED_PLACEHOLDER_HASHES).not.toContain(digest);
    }
  });

  it('records redistribution provenance for every bundled clip', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'resources', 'media', 'manifest.json'), 'utf8')) as {
      assets: Record<string, { source?: Record<string, unknown> }>;
    };

    for (const key of AUDIO_ASSET_KEYS.filter((key) => key !== 'opening')) {
      const source = manifest.assets[key].source;
      expect(source).toMatchObject(EXPECTED_SOURCES[key]);
      expect(source?.downloadUrl).toMatch(/^https:\/\/cdn\.freesound\.org\/previews\/.+-hq\.mp3$/);
      expect(source?.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\/(?:publicdomain\/zero\/1\.0|licenses\/by\/4\.0)\/$/);
      expect(source?.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(source?.modifications).toBe('Converted from MP3 preview to PCM WAV; sample rate, bit depth, channels, and loudness normalized.');
    }
  });

  it('records the opening theme as user-provided for private use', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'resources', 'media', 'manifest.json'), 'utf8')) as {
      assets: Record<string, { source?: Record<string, unknown> }>;
    };

    expect(manifest.assets.opening.source).toEqual({
      kind: 'private-use',
      title: 'Jeopardy theme song',
      creator: 'Unknown',
      providedFileSha256: '27dec23808ecf0f63ce9eed03c52e3fead354ff8be13d1e0530ebaaf7b5403bb',
      modifications: 'Converted from the user-provided MP3 to PCM WAV; sample rate, bit depth, and channels normalized.',
    });
  });
});
