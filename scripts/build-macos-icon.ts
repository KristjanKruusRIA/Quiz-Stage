import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { iconSourcePath } from './build-icon';

const iconsetFiles = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
] as const;

export function buildMacosIcon(
  root = process.cwd(),
  platform: NodeJS.Platform = process.platform,
): string {
  if (platform !== 'darwin') throw new Error('MACOS_ICON_REQUIRES_DARWIN');

  const sourcePath = iconSourcePath(root);
  const iconDirectory = path.join(root, '.cache', 'icons');
  const iconsetDirectory = path.join(iconDirectory, 'QuizStage.iconset');
  const outputPath = path.join(iconDirectory, 'QuizStage.icns');
  mkdirSync(iconsetDirectory, { recursive: true });

  for (const [fileName, size] of iconsetFiles) {
    execFileSync('sips', [
      '-z', String(size), String(size), sourcePath,
      '--out', path.join(iconsetDirectory, fileName),
    ], { stdio: 'inherit' });
  }
  execFileSync('iconutil', ['-c', 'icns', iconsetDirectory, '-o', outputPath], { stdio: 'inherit' });
  return outputPath;
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  buildMacosIcon();
}
