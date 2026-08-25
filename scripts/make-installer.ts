import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const vendorDirectory = path.join(root, 'node_modules', 'electron-winstaller', 'vendor');
const squirrelTemp = path.join(root, '.cache', 'squirrel-temp');
const helpers = [
  ['7z-x64.exe', '7z.exe'],
  ['7z-x64.dll', '7z.dll'],
] as const;

mkdirSync(squirrelTemp, { recursive: true });
for (const [source, target] of helpers) {
  const sourcePath = path.join(vendorDirectory, source);
  if (!existsSync(sourcePath)) throw new Error(`SQUIRREL_HELPER_MISSING:${source}`);
  copyFileSync(sourcePath, path.join(vendorDirectory, target));
}

execFileSync(process.execPath, [path.join(root, 'node_modules', '@electron-forge', 'cli', 'dist', 'electron-forge.js'), 'make', '--targets=@electron-forge/maker-squirrel'], {
  cwd: root,
  env: { ...process.env, SQUIRREL_TEMP: squirrelTemp },
  stdio: 'inherit',
});
