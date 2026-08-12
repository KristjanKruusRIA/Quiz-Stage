import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  AUDIO_ASSET_KEYS,
  AUDIO_ASSET_SPEC,
  type AudioAssetKey,
  type MediaManifest,
} from '../src/shared/media/contracts';

const SAMPLE_RATE = 44_100;

const definitions: Record<AudioAssetKey, { frequencies: number[]; noise: number }> = {
  opening: { frequencies: [220, 277.18, 329.63], noise: 0 },
  'round-transition': { frequencies: [293.66, 369.99, 440], noise: 0 },
  'daily-double': { frequencies: [392, 523.25, 783.99], noise: 0 },
  'final-tension': { frequencies: [110, 138.59, 164.81], noise: 0.02 },
  'correct-applause': { frequencies: [659.25, 783.99], noise: 0.16 },
  'incorrect-crowd': { frequencies: [196, 174.61], noise: 0.12 },
  'time-expired': { frequencies: [880, 440], noise: 0 },
  winner: { frequencies: [523.25, 659.25, 783.99, 1046.5], noise: 0.04 },
};

function wavFor(key: AudioAssetKey): Buffer {
  const definition = definitions[key];
  const sampleCount = Math.round(SAMPLE_RATE * AUDIO_ASSET_SPEC[key].durationMs / 1_000);
  const dataSize = sampleCount * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + dataSize, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22); wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(dataSize, 40);
  let random = AUDIO_ASSET_KEYS.indexOf(key) + 1;
  let filteredNoise = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const edge = Math.min(1, index / (SAMPLE_RATE * 0.04), (sampleCount - index - 1) / (SAMPLE_RATE * 0.08));
    let signal = 0;
    for (let tone = 0; tone < definition.frequencies.length; tone += 1) {
      const pulse = Math.floor(time * 4 + tone) % 2 === 0 ? 1 : 0.45;
      signal += Math.sin(2 * Math.PI * definition.frequencies[tone] * time) * pulse;
    }
    signal /= definition.frequencies.length;
    random = (random * 1_664_525 + 1_013_904_223) >>> 0;
    const white = random / 0xffff_ffff * 2 - 1;
    filteredNoise = filteredNoise * 0.78 + white * 0.22;
    const sample = Math.round(Math.max(-1, Math.min(1, (signal * 0.36 + filteredNoise * definition.noise) * edge)) * 32_767);
    wav.writeInt16LE(sample, 44 + index * 2);
  }
  return wav;
}

export function generatePlaceholderAudio(outputDirectory = resolve('resources/media')): MediaManifest {
  const audioDirectory = join(outputDirectory, 'audio');
  mkdirSync(audioDirectory, { recursive: true });
  const assets = {} as MediaManifest['assets'];
  for (const key of AUDIO_ASSET_KEYS) {
    const bytes = wavFor(key);
    const { file, durationMs, channel } = AUDIO_ASSET_SPEC[key];
    writeFileSync(join(outputDirectory, file), bytes);
    assets[key] = {
      file,
      mime: 'audio/wav',
      sha256: createHash('sha256').update(bytes).digest('hex'),
      durationMs,
      channel,
    };
  }
  const manifest: MediaManifest = { version: 1, assets };
  writeFileSync(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

if (typeof require !== 'undefined' && require.main === module) generatePlaceholderAudio();
