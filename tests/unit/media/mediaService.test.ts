import { cpSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isValidWav, MediaService, parseBrandingRequest, parseMediaByteRange, parseMediaRequest } from '../../../src/main/media/mediaService';

const temporaryRoots: string[] = [];

function temporaryRoot(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
}

function fixture() {
  const root = temporaryRoot('quiz-stage-service-');
  const bundled = join(process.cwd(), 'resources', 'media');
  const overrides = join(root, 'overrides');
  mkdirSync(overrides);
  return { root, bundled, overrides };
}

describe('MediaService', () => {
  afterEach(() => {
    for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('parses bounded, open-ended, and suffix media byte ranges', () => {
    expect(parseMediaByteRange(null, 100)).toBeNull();
    expect(parseMediaByteRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
    expect(parseMediaByteRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
    expect(parseMediaByteRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
  });

  it.each(['bytes=100-', 'bytes=20-10', 'bytes=0-1,5-6', 'items=0-9'])('rejects an invalid media byte range: %s', (range) => {
    expect(() => parseMediaByteRange(range, 100)).toThrow('INVALID_MEDIA_RANGE');
  });

  it('accepts only the exact pathless custom-protocol asset URL shape', () => {
    expect(parseMediaRequest('quiz-stage-media://asset/opening')).toBe('opening');
    for (const url of ['file:///secret.wav', 'quiz-stage-media://asset/../opening', 'quiz-stage-media://asset/opening?path=C:/secret', 'quiz-stage-media://other/opening']) {
      expect(() => parseMediaRequest(url)).toThrow('INVALID_MEDIA_REQUEST');
    }
  });

  it('serves only hash-verified bundled branding images through exact URLs', () => {
    const root = temporaryRoot('quiz-stage-branding-service-');
    const bundled = join(root, 'bundled');
    const overrides = join(root, 'overrides');
    const sourceMedia = join(process.cwd(), 'resources', 'media');
    mkdirSync(bundled);
    for (const file of ['manifest.json', 'logo.png', 'classic-stage-background.png']) {
      cpSync(join(sourceMedia, file), join(bundled, file));
    }
    mkdirSync(overrides);
    const service = new MediaService({ bundledDirectory: bundled, overrideDirectory: overrides });

    expect(parseBrandingRequest('quiz-stage-media://branding/logo')).toBe('logo');
    expect(parseBrandingRequest('quiz-stage-media://branding/stage-background')).toBe('stage-background');
    expect(service.resolveBranding('logo')).toMatchObject({ key: 'logo', source: 'bundled', mime: 'image/png' });
    expect(service.resolveBranding('stage-background').bytes.length).toBeGreaterThan(0);
    for (const url of [
      'quiz-stage-media://branding/icon-source',
      'quiz-stage-media://branding/../logo',
      'quiz-stage-media://branding/logo?path=C:/secret',
      'quiz-stage-media://asset/logo',
    ]) expect(() => parseBrandingRequest(url)).toThrow('INVALID_BRANDING_REQUEST');

    writeFileSync(join(bundled, 'logo.png'), 'tampered');
    expect(() => service.resolveBranding('logo')).toThrow('BRANDING_UNAVAILABLE');
  });
  it('uses independently validated case-insensitive WAV overrides and falls back per key', () => {
    const { bundled, overrides } = fixture();
    writeFileSync(join(overrides, 'opening.WAV'), readFileSync(join(bundled, 'audio', 'winner.wav')));
    writeFileSync(join(overrides, 'winner.mp3'), 'not audio');
    const warnings = vi.fn();
    const service = new MediaService({ bundledDirectory: bundled, overrideDirectory: overrides, onWarning: warnings });

    expect(service.resolve('opening')).toMatchObject({ key: 'opening', source: 'override', mime: 'audio/wav' });
    expect(service.resolve('winner')).toMatchObject({ key: 'winner', source: 'bundled', mime: 'audio/wav' });
    expect(service.resolve('daily-double')).toMatchObject({ key: 'daily-double', source: 'bundled' });
    expect(warnings).toHaveBeenCalledWith({ assetKey: 'winner', reason: 'invalid-extension' });
  });

  it.each([
    ['directory', (path: string) => mkdirSync(path)],
    ['malformed', (path: string) => writeFileSync(path, 'RIFF bad')],
    ['large', (path: string) => writeFileSync(path, Buffer.alloc(10 * 1024 * 1024 + 1))],
  ])('rejects a %s override without affecting another key', (_name, create) => {
    const { bundled, overrides } = fixture();
    create(join(overrides, 'opening.wav'));
    writeFileSync(join(overrides, 'winner.wav'), readFileSync(join(bundled, 'audio', 'winner.wav')));
    const service = new MediaService({ bundledDirectory: bundled, overrideDirectory: overrides });
    expect(service.resolve('opening').source).toBe('bundled');
    expect(service.resolve('winner').source).toBe('override');
  });

  it('rejects symlinks and hard links outside the owned directory', () => {
    const { root, bundled, overrides } = fixture();
    const external = join(root, 'external.wav');
    writeFileSync(external, readFileSync(join(bundled, 'audio', 'opening.wav')));
    symlinkSync(external, join(overrides, 'opening.wav'));
    linkSync(external, join(overrides, 'winner.wav'));
    const service = new MediaService({ bundledDirectory: bundled, overrideDirectory: overrides });
    expect(service.resolve('opening').source).toBe('bundled');
    expect(service.resolve('winner').source).toBe('bundled');
  });

  it('deduplicates warnings and clears the warning after a valid recovery', () => {
    const { bundled, overrides } = fixture();
    writeFileSync(join(overrides, 'opening.wav'), 'bad');
    const warnings = vi.fn();
    const recoveries = vi.fn();
    const service = new MediaService({ bundledDirectory: bundled, overrideDirectory: overrides, onWarning: warnings, onRecovery: recoveries });
    service.resolve('opening'); service.resolve('opening');
    expect(warnings).toHaveBeenCalledTimes(1);
    writeFileSync(join(overrides, 'opening.wav'), readFileSync(join(bundled, 'audio', 'opening.wav')));
    expect(service.resolve('opening').source).toBe('override');
    expect(recoveries).toHaveBeenCalledWith('opening');
  });

  it('retains independent warning snapshots and isolates warning/recovery subscriber exceptions', () => {
    const { bundled, overrides } = fixture();
    writeFileSync(join(overrides, 'opening.wav'), 'bad');
    writeFileSync(join(overrides, 'winner.wav'), 'bad');
    const service = new MediaService({
      bundledDirectory: bundled,
      overrideDirectory: overrides,
      onWarning: () => { throw new Error('subscriber failed'); },
      onRecovery: () => { throw new Error('subscriber failed'); },
    });
    expect(service.resolve('opening').source).toBe('bundled');
    expect(service.resolve('winner').source).toBe('bundled');
    expect(service.activeWarnings().map((warning) => warning.assetKey)).toEqual(['opening', 'winner']);
    writeFileSync(join(overrides, 'opening.wav'), readFileSync(join(bundled, 'audio', 'opening.wav')));
    expect(service.resolve('opening').source).toBe('override');
    expect(service.activeWarnings().map((warning) => warning.assetKey)).toEqual(['winner']);
  });

  it('rejects internally inconsistent PCM and RIFF length fields', () => {
    const { bundled } = fixture();
    const original = readFileSync(join(bundled, 'audio', 'opening.wav'));
    for (const mutate of [
      (wav: Buffer) => wav.writeUInt32LE(wav.length, 4),
      (wav: Buffer) => wav.writeUInt32LE(1, 28),
      (wav: Buffer) => wav.writeUInt16LE(wav.readUInt16LE(32) + 1, 32),
      (wav: Buffer) => wav.writeUInt32LE(wav.length - 45, 40),
    ]) {
      const changed = Buffer.from(original); mutate(changed);
      expect(isValidWav(changed)).toBe(false);
    }
  });

  it('does not expose raw paths or raw errors in warnings', () => {
    const { bundled, overrides } = fixture();
    writeFileSync(join(overrides, 'opening.wav'), 'bad');
    const warning = vi.fn();
    new MediaService({ bundledDirectory: bundled, overrideDirectory: overrides, onWarning: warning }).resolve('opening');
    expect(JSON.stringify(warning.mock.calls)).not.toContain(overrides);
  });
});
