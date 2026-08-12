import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generatePlaceholderAudio } from '../../../scripts/generate-placeholder-audio';

describe('placeholder audio generation', () => {
  it('generates byte-identical valid mono 16-bit PCM WAV files and exact hashes', () => {
    const first = mkdtempSync(join(tmpdir(), 'quiz-stage-media-a-'));
    const second = mkdtempSync(join(tmpdir(), 'quiz-stage-media-b-'));
    const firstManifest = generatePlaceholderAudio(first);
    const secondManifest = generatePlaceholderAudio(second);

    expect(Object.keys(firstManifest.assets)).toEqual([
      'opening', 'round-transition', 'daily-double', 'final-tension',
      'correct-applause', 'incorrect-crowd', 'time-expired', 'winner',
    ]);
    expect(secondManifest).toEqual(firstManifest);
    for (const entry of Object.values(firstManifest.assets)) {
      const a = readFileSync(join(first, entry.file));
      const b = readFileSync(join(second, entry.file));
      expect(a.equals(b)).toBe(true);
      expect(a.subarray(0, 4).toString()).toBe('RIFF');
      expect(a.subarray(8, 12).toString()).toBe('WAVE');
      expect(a.readUInt16LE(20)).toBe(1);
      expect(a.readUInt16LE(22)).toBe(1);
      expect(a.readUInt32LE(24)).toBe(44_100);
      expect(a.readUInt16LE(34)).toBe(16);
      expect(a.readUInt32LE(40)).toBe(a.length - 44);
      expect(a.length).toBeGreaterThanOrEqual(44 + entry.durationMs * 44.1 * 2 - 2);
      expect(a.length).toBeLessThanOrEqual(44 + entry.durationMs * 44.1 * 2 + 2);
      let minimum = 32_767; let maximum = -32_768;
      for (let offset = 44; offset < a.length; offset += 2) {
        const sample = a.readInt16LE(offset);
        minimum = Math.min(minimum, sample); maximum = Math.max(maximum, sample);
      }
      expect(minimum).toBeGreaterThanOrEqual(-32_768);
      expect(maximum).toBeLessThanOrEqual(32_767);
      expect(createHash('sha256').update(a).digest('hex')).toBe(entry.sha256);
    }
  });
});
