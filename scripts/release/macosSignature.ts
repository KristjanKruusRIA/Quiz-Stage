import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { ReleaseTarget } from './targets';

interface PackageResult {
  platform: string;
  outputPaths: string[];
}

export type CommandRunner = (command: string, args: string[]) => void;

const runCommand: CommandRunner = (command, args) => {
  execFileSync(command, args, { stdio: 'pipe' });
};

// Electron Packager renames the bundle and rewrites Info.plist after the fuses plugin
// re-signs it, leaving a stale ad-hoc signature that Gatekeeper reports as "damaged".
export function resignMacosApplication(
  packageResult: PackageResult,
  target: ReleaseTarget,
  run: CommandRunner = runCommand,
): void {
  if (packageResult.platform !== 'darwin' || target.forgePlatform !== 'darwin') return;

  for (const outputPath of packageResult.outputPaths) {
    const bundles = readdirSync(outputPath).filter((entry) => entry.endsWith('.app'));
    if (bundles.length !== 1) throw new Error(`MACOS_APPLICATION_BUNDLE_MISSING:${outputPath}`);
    const bundle = path.join(outputPath, bundles[0]);
    run('codesign', ['--sign', '-', '--force', '--deep', bundle]);
    run('codesign', ['--verify', '--deep', '--strict', bundle]);
  }
}
