import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findForgeArtifact, normalizedArtifactPath } from './release/artifacts';
import { releaseTargetForId } from './release/targets';

export function makeInstaller(root = process.cwd()): string {
  if (process.platform !== 'win32') throw new Error('INSTALLER_REQUIRES_WIN32');

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

  execFileSync(process.execPath, [
    path.join(root, 'node_modules', '@electron-forge', 'cli', 'dist', 'electron-forge.js'),
    'make',
    '--platform=win32',
    '--arch=x64',
    '--targets=@electron-forge/maker-squirrel',
  ], {
    cwd: root,
    env: { ...process.env, QUIZ_STAGE_PACKAGE_PROFILE: 'installer', SQUIRREL_TEMP: squirrelTemp },
    stdio: 'inherit',
  });

  const target = releaseTargetForId('windows-x64');
  const artifact = target.artifacts[0]!;
  const source = findForgeArtifact(root, target, artifact);
  const destination = normalizedArtifactPath(root, target, artifact);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  return destination;
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  makeInstaller();
}
