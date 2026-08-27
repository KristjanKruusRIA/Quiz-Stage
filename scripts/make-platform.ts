import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildMacosIcon } from './build-macos-icon';
import { makeInstaller } from './make-installer';
import { makePortable } from './make-portable';
import { prepareElectronArchive } from './prepare-electron-zip';
import { normalizeArtifacts } from './release/artifacts';
import {
  makerNamesFor,
  releaseTargetForId,
  type MakerName,
  type ReleaseTarget,
} from './release/targets';

const makerPackages: Record<MakerName, string> = {
  squirrel: '@electron-forge/maker-squirrel',
  zip: '@electron-forge/maker-zip',
  deb: '@electron-forge/maker-deb',
};

export function parseReleaseTarget(args: string[]): ReleaseTarget {
  if (args.length !== 2 || args[0] !== '--target' || args[1] === undefined) {
    throw new Error('EXPECTED_SINGLE_RELEASE_TARGET');
  }
  return releaseTargetForId(args[1]);
}

export function assertHostMatchesTarget(
  target: ReleaseTarget,
  platform: NodeJS.Platform = process.platform,
  arch = process.arch,
): void {
  if (target.forgePlatform !== platform || target.forgeArch !== arch) {
    throw new Error(`HOST_TARGET_MISMATCH:${platform}:${arch}:${target.id}`);
  }
}

export function forgeMakeArguments(target: ReleaseTarget): string[] {
  const makers = makerNamesFor(target, 'all').map((maker) => makerPackages[maker]);
  return [
    'make',
    `--platform=${target.forgePlatform}`,
    `--arch=${target.forgeArch}`,
    `--targets=${makers.join(',')}`,
  ];
}

export function makePlatform(target: ReleaseTarget, root = process.cwd()): string[] {
  assertHostMatchesTarget(target);
  if (target.forgePlatform === 'darwin') buildMacosIcon(root);
  prepareElectronArchive(root);

  if (target.id === 'windows-x64') {
    makeInstaller(root);
    makePortable(root);
  } else {
    execFileSync(process.execPath, [
      path.join(root, 'node_modules', '@electron-forge', 'cli', 'dist', 'electron-forge.js'),
      ...forgeMakeArguments(target),
    ], { cwd: root, stdio: 'inherit' });
  }
  return normalizeArtifacts(root, target);
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const target = parseReleaseTarget(process.argv.slice(2));
  console.log(JSON.stringify(makePlatform(target)));
}
