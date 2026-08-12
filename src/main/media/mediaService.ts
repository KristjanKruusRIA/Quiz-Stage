import { createHash } from 'node:crypto';
import {
  closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync,
} from 'node:fs';
import { basename, extname, join, parse, resolve, sep } from 'node:path';
import {
  AUDIO_ASSET_KEYS,
  audioAssetKeySchema,
  mediaManifestSchema,
  type AudioAssetKey,
  type MediaManifest,
  type MediaWarning,
  type MediaWarningReason,
} from '../../shared/media/contracts';

const MAX_OVERRIDE_BYTES = 10 * 1024 * 1024;
export interface ResolvedMedia { key: AudioAssetKey; source: 'override' | 'bundled'; mime: 'audio/wav'; bytes: Buffer }

interface MediaServiceOptions {
  bundledDirectory: string;
  overrideDirectory: string;
  onWarning?: (warning: MediaWarning) => void;
  onRecovery?: (key: AudioAssetKey) => void;
}

export class MediaService {
  private readonly manifest: MediaManifest;
  private readonly warnings = new Map<AudioAssetKey, MediaWarningReason>();

  constructor(private readonly options: MediaServiceOptions) {
    this.manifest = mediaManifestSchema.parse(JSON.parse(readFileSync(join(options.bundledDirectory, 'manifest.json'), 'utf8')));
  }

  resolve(input: unknown): ResolvedMedia {
    const key = audioAssetKeySchema.parse(input);
    const override = this.readOverride(key);
    if (override !== null) {
      this.recover(key);
      return { key, source: 'override', mime: 'audio/wav', bytes: override };
    }
    const entry = this.manifest.assets[key];
    const expectedPath = resolve(this.options.bundledDirectory, entry.file);
    const bundledRoot = `${resolve(this.options.bundledDirectory)}${sep}`;
    if (!expectedPath.startsWith(bundledRoot)) return this.failBundled(key, 'invalid-bundled');
    try {
      const bytes = readFileSync(expectedPath);
      if (!isValidWav(bytes) || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) {
        return this.failBundled(key, 'invalid-bundled');
      }
      return { key, source: 'bundled', mime: 'audio/wav', bytes };
    } catch {
      return this.failBundled(key, 'missing-bundled');
    }
  }

  activeWarnings(): MediaWarning[] {
    return [...this.warnings].map(([assetKey, reason]) => ({ assetKey, reason }));
  }

  private failBundled(key: AudioAssetKey, reason: MediaWarningReason): never {
    this.warn(key, reason);
    throw new Error('MEDIA_UNAVAILABLE');
  }

  private readOverride(key: AudioAssetKey): Buffer | null {
    let names: string[];
    try { names = readdirSync(this.options.overrideDirectory); } catch { return null; }
    const candidates = names.filter((name) => parse(name).name.toLowerCase() === key);
    if (candidates.length === 0) return null;
    const wavNames = candidates.filter((name) => extname(name).toLowerCase() === '.wav');
    if (wavNames.length !== 1) { this.warn(key, wavNames.length === 0 ? 'invalid-extension' : 'unsafe-file'); return null; }
    const candidate = join(this.options.overrideDirectory, wavNames[0]);
    let descriptor: number | null = null;
    try {
      const entry = lstatSync(candidate);
      if (!entry.isFile() || entry.isSymbolicLink() || entry.nlink !== 1) { this.warn(key, 'unsafe-file'); return null; }
      const canonicalRoot = realpathSync(this.options.overrideDirectory);
      const canonicalCandidate = realpathSync(candidate);
      if (!canonicalCandidate.startsWith(`${canonicalRoot}${sep}`) || basename(canonicalCandidate) !== basename(candidate)) {
        this.warn(key, 'unsafe-file'); return null;
      }
      descriptor = openSync(candidate, constants.O_RDONLY);
      const opened = fstatSync(descriptor);
      if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== entry.dev || opened.ino !== entry.ino || opened.size > MAX_OVERRIDE_BYTES) {
        this.warn(key, opened.size > MAX_OVERRIDE_BYTES ? 'too-large' : 'unsafe-file'); return null;
      }
      const bytes = readFileSync(descriptor);
      if (!isValidWav(bytes)) { this.warn(key, 'malformed-wav'); return null; }
      return bytes;
    } catch {
      this.warn(key, 'unreadable');
      return null;
    } finally {
      if (descriptor !== null) closeSync(descriptor);
    }
  }

  private warn(assetKey: AudioAssetKey, reason: MediaWarningReason): void {
    if (this.warnings.has(assetKey)) return;
    this.warnings.set(assetKey, reason);
    try { this.options.onWarning?.({ assetKey, reason }); } catch { /* warning delivery must not block fallback */ }
  }

  private recover(key: AudioAssetKey): void {
    if (!this.warnings.delete(key)) return;
    try { this.options.onRecovery?.(key); } catch { /* recovery delivery must not block playback */ }
  }
}

export function isValidWav(bytes: Buffer): boolean {
  if (bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') return false;
  if (bytes.readUInt32LE(4) !== bytes.length - 8) return false;
  if (bytes.toString('ascii', 12, 16) !== 'fmt ' || bytes.readUInt32LE(16) !== 16 || bytes.readUInt16LE(20) !== 1) return false;
  const channels = bytes.readUInt16LE(22);
  const sampleRate = bytes.readUInt32LE(24);
  const byteRate = bytes.readUInt32LE(28);
  const blockAlign = bytes.readUInt16LE(32);
  const bitsPerSample = bytes.readUInt16LE(34);
  if ((channels !== 1 && channels !== 2) || sampleRate < 8_000 || sampleRate > 192_000 || bitsPerSample !== 16) return false;
  if (blockAlign !== channels * bitsPerSample / 8 || byteRate !== sampleRate * blockAlign) return false;
  if (bytes.toString('ascii', 36, 40) !== 'data') return false;
  const dataSize = bytes.readUInt32LE(40);
  return dataSize > 0 && dataSize === bytes.length - 44 && dataSize % blockAlign === 0;
}

export function supportedMediaKeys(): readonly AudioAssetKey[] { return AUDIO_ASSET_KEYS; }

export function parseMediaByteRange(rangeHeader: string | null, size: number): { start: number; end: number } | null {
  if (rangeHeader === null) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match || size <= 0 || (match[1] === '' && match[2] === '')) throw new Error('INVALID_MEDIA_RANGE');
  const first = match[1] === '' ? null : Number(match[1]);
  const last = match[2] === '' ? null : Number(match[2]);
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last))) {
    throw new Error('INVALID_MEDIA_RANGE');
  }
  if (first === null) {
    if (last === null || last <= 0) throw new Error('INVALID_MEDIA_RANGE');
    return { start: Math.max(0, size - last), end: size - 1 };
  }
  if (first >= size) throw new Error('INVALID_MEDIA_RANGE');
  const end = last === null ? size - 1 : Math.min(last, size - 1);
  if (end < first) throw new Error('INVALID_MEDIA_RANGE');
  return { start: first, end };
}

export function parseMediaRequest(requestUrl: string): AudioAssetKey {
  if (!/^quiz-stage-media:\/\/asset\/[a-z-]+$/.test(requestUrl)) throw new Error('INVALID_MEDIA_REQUEST');
  let url: URL;
  try { url = new URL(requestUrl); } catch { throw new Error('INVALID_MEDIA_REQUEST'); }
  if (url.protocol !== 'quiz-stage-media:' || url.hostname !== 'asset' || url.search !== '' || url.hash !== '') {
    throw new Error('INVALID_MEDIA_REQUEST');
  }
  const path = decodeURIComponent(url.pathname);
  if (!/^\/[a-z-]+$/.test(path)) throw new Error('INVALID_MEDIA_REQUEST');
  try { return audioAssetKeySchema.parse(path.slice(1)); } catch { throw new Error('INVALID_MEDIA_REQUEST'); }
}
