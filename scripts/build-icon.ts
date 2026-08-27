import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pngToIco from 'png-to-ico';
import { PNG } from 'pngjs';

export const WINDOWS_ICON_SIZES = [16, 24, 32, 48, 64, 128, 256] as const;

export function iconSourcePath(root: string): string {
  return join(root, 'resources', 'media', 'icon-source.png');
}

function resizeSquare(source: PNG, size: number): Buffer {
  const target = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y += 1) {
    const sourceY = Math.min(source.height - 1, Math.floor((y + 0.5) * source.height / size));
    for (let x = 0; x < size; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor((x + 0.5) * source.width / size));
      const sourceOffset = (sourceY * source.width + sourceX) * 4;
      const targetOffset = (y * size + x) * 4;
      source.data.copy(target.data, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }
  return PNG.sync.write(target);
}

export async function buildWindowsIcon(sourcePath: string, outputPath: string): Promise<Buffer> {
  const source = PNG.sync.read(readFileSync(sourcePath));
  if (source.width !== source.height) throw new Error('Icon source must be square');
  const icon = await pngToIco(WINDOWS_ICON_SIZES.map((size) => resizeSquare(source, size)));
  writeFileSync(outputPath, icon);
  return icon;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const root = join(dirname(scriptPath), '..');
  buildWindowsIcon(iconSourcePath(root), join(root, 'resources', 'media', 'icon.ico')).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
