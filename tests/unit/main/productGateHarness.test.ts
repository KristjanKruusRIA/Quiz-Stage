import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  createProductBuildStamp,
  electronExecutablePath,
  forgePackageArguments,
  packagedExecutablePath,
  packagedResourcesPath,
  terminateExactProcessTree,
  validateProductBuildStamp,
} from '../../../tests/e2e/productHarness';

describe('product gate harness', () => {
  it.each([
    ['win32', 'x64', ['package', '--platform=win32', '--arch=x64']],
    ['linux', 'arm64', ['package', '--platform=linux', '--arch=arm64']],
    ['darwin', 'x64', ['package', '--platform=darwin', '--arch=x64']],
  ] as const)('targets the current Forge platform and architecture', (platform, arch, expected) => {
    expect(forgePackageArguments(platform, arch)).toEqual(expected);
  });

  it.each([
    ['win32', 'C:\\repo\\node_modules\\electron\\dist\\electron.exe'],
    ['linux', '/repo/node_modules/electron/dist/electron'],
    ['darwin', '/repo/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'],
  ] as const)('resolves the Electron executable on %s', (platform, expected) => {
    const root = platform === 'win32' ? 'C:\\repo' : '/repo';
    expect(electronExecutablePath(root, platform)).toBe(expected);
  });

  it.each([
    ['win32', 'x64', 'C:\\repo\\out\\quiz-stage-desktop-game-win32-x64\\quiz-stage-desktop-game.exe', 'C:\\repo\\out\\quiz-stage-desktop-game-win32-x64\\resources\\app.asar'],
    ['linux', 'arm64', '/repo/out/quiz-stage-desktop-game-linux-arm64/quiz-stage-desktop-game', '/repo/out/quiz-stage-desktop-game-linux-arm64/resources/app.asar'],
    ['darwin', 'x64', '/repo/out/quiz-stage-desktop-game-darwin-x64/quiz-stage-desktop-game.app/Contents/MacOS/quiz-stage-desktop-game', '/repo/out/quiz-stage-desktop-game-darwin-x64/quiz-stage-desktop-game.app/Contents/Resources/app.asar'],
  ] as const)('resolves packaged executable and application archive on %s', (platform, arch, executable, resources) => {
    const root = platform === 'win32' ? 'C:\\repo' : '/repo';
    expect(packagedExecutablePath(root, platform, arch)).toBe(executable);
    expect(packagedResourcesPath(root, platform, arch)).toBe(resources);
  });

  it('uses only the exact Windows PID tree or exact POSIX process group', () => {
    const exec = vi.fn();
    const kill = vi.fn();
    terminateExactProcessTree(123, 'win32', { execFileSync: exec, kill });
    expect(exec).toHaveBeenCalledWith('taskkill.exe', ['/PID', '123', '/T', '/F'], { stdio: 'ignore' });
    expect(kill).not.toHaveBeenCalled();
    terminateExactProcessTree(456, 'linux', { execFileSync: exec, kill });
    terminateExactProcessTree(789, 'darwin', { execFileSync: exec, kill });
    expect(kill).toHaveBeenNthCalledWith(1, -456, 'SIGKILL');
    expect(kill).toHaveBeenNthCalledWith(2, -789, 'SIGKILL');
  });

  it('rejects inherited, mismatched, and stale build stamps', () => {
    const fixture = mkdtempSync(path.join(tmpdir(), 'quiz-stage-product-stamp-'));
    try {
      const source = path.join(fixture, 'source.ts');
      const output = path.join(fixture, 'main.js');
      const executable = path.join(fixture, 'electron.exe');
      const stampPath = path.join(fixture, 'stamp.json');
      writeFileSync(source, 'source-a');
      writeFileSync(output, 'output-a');
      writeFileSync(executable, 'package-a');
      createProductBuildStamp({ stampPath, token: 'nonce-a', sourcePaths: [source], outputPaths: [output], executablePath: executable });

      expect(validateProductBuildStamp({ stampPath, token: 'nonce-a', sourcePaths: [source], outputPaths: [output], executablePath: executable })).toBe(true);
      expect(validateProductBuildStamp({ stampPath, token: 'forged', sourcePaths: [source], outputPaths: [output], executablePath: executable })).toBe(false);
      writeFileSync(source, 'source-b');
      expect(validateProductBuildStamp({ stampPath, token: 'nonce-a', sourcePaths: [source], outputPaths: [output], executablePath: executable })).toBe(false);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});
