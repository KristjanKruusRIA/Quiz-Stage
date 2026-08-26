import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { mediaManifestSchema } from '../../../src/shared/media/contracts';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const mediaRoot = join(repositoryRoot, 'resources', 'media');
const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

const pngAsset = (file: string, width: number, height: number) => {
  const bytes = readFileSync(join(mediaRoot, file));
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const image = PNG.sync.read(bytes);
  expect(image.width).toBe(width);
  expect(image.height).toBe(height);
  const alpha = Array.from({ length: image.width * image.height }, (_, index) => image.data[index * 4 + 3]);
  expect(alpha.some((value) => value > 0)).toBe(true);
  return { bytes, image, alpha };
};

describe('Classic Stage image assets', () => {
  it('ships the exact original PNG canvases with usable opacity and transparency', () => {
    const logo = pngAsset('logo.png', 2_048, 1_024);
    const background = pngAsset('classic-stage-background.png', 3_840, 2_160);
    const icon = pngAsset('icon-source.png', 1_024, 1_024);

    expect(logo.alpha.some((value) => value === 0)).toBe(true);
    expect(logo.alpha.some((value) => value === 255)).toBe(true);
    expect(background.alpha.every((value) => value === 255)).toBe(true);
    expect(icon.alpha.some((value) => value === 255)).toBe(true);
  });

  it('binds every branding asset to exact dimensions and SHA-256 in the media manifest', () => {
    const manifest = JSON.parse(readFileSync(join(mediaRoot, 'manifest.json'), 'utf8')) as unknown;
    expect(mediaManifestSchema.parse(manifest)).toEqual(manifest);
    const branding = (manifest as { branding: Record<string, unknown> }).branding;
    expect(branding).toMatchObject({ appName: 'Quiz Stage' });

    for (const [key, file, mime, width, height] of [
      ['logo', 'logo.png', 'image/png', 2_048, 1_024],
      ['stageBackground', 'classic-stage-background.png', 'image/png', 3_840, 2_160],
      ['iconSource', 'icon-source.png', 'image/png', 1_024, 1_024],
    ] as const) {
      expect(branding[key]).toEqual({
        file,
        mime,
        width,
        height,
        sha256: sha256(readFileSync(join(mediaRoot, file))),
      });
    }
    expect(branding.icon).toEqual({
      file: 'icon.ico',
      mime: 'image/vnd.microsoft.icon',
      sha256: sha256(readFileSync(join(mediaRoot, 'icon.ico'))),
    });
  });

  it('contains the required seven Windows icon sizes', () => {
    const icon = readFileSync(join(mediaRoot, 'icon.ico'));
    expect(icon.readUInt16LE(0)).toBe(0);
    expect(icon.readUInt16LE(2)).toBe(1);
    expect(icon.readUInt16LE(4)).toBe(7);
    const sizes = Array.from({ length: 7 }, (_, index) => {
      const width = icon.readUInt8(6 + index * 16);
      const height = icon.readUInt8(7 + index * 16);
      expect(height).toBe(width);
      return width === 0 ? 256 : width;
    });
    expect(sizes).toEqual([16, 24, 32, 48, 64, 128, 256]);
  });

  it('rebuilds the Windows icon byte-for-byte without altering its source', () => {
    const sourcePath = join(mediaRoot, 'icon-source.png');
    const iconPath = join(mediaRoot, 'icon.ico');
    const sourceBefore = sha256(readFileSync(sourcePath));
    const iconBefore = sha256(readFileSync(iconPath));
    execFileSync(process.execPath, [join(repositoryRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'), join(repositoryRoot, 'scripts', 'build-icon.ts')], {
      cwd: repositoryRoot,
      stdio: 'pipe',
    });
    expect(sha256(readFileSync(sourcePath))).toBe(sourceBefore);
    expect(sha256(readFileSync(iconPath))).toBe(iconBefore);
  });
});
