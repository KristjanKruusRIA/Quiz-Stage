import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];
const resolverScript = path.join(process.cwd(), 'scripts', 'resolve-installer-executable.ps1');
const smokeScript = path.join(process.cwd(), 'scripts', 'smoke-package.ps1');

function temporaryInstallRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'quiz-stage-installer-resolution-'));
  temporaryDirectories.push(root);
  return root;
}

function createExecutable(root: string, relativePath: string): string {
  const executable = path.join(root, relativePath);
  mkdirSync(path.dirname(executable), { recursive: true });
  writeFileSync(executable, 'fixture');
  return executable;
}

function resolveExecutable(installRoot: string, releasePackageName: string) {
  return spawnSync('pwsh', [
    '-NoProfile',
    '-NonInteractive',
    '-File', resolverScript,
    '-InstallRoot', installRoot,
    '-ReleasePackageName', releasePackageName,
  ], { encoding: 'utf8' });
}

describe('installer executable resolution', () => {
  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  it('selects the executable matching the release package version', () => {
    const installRoot = temporaryInstallRoot();
    createExecutable(installRoot, 'Quiz Stage.exe');
    createExecutable(installRoot, path.join('app-0.0.9', 'Quiz Stage.exe'));
    const expected = createExecutable(installRoot, path.join('app-0.1.0', 'Quiz Stage.exe'));

    const result = resolveExecutable(installRoot, 'QuizStage-0.1.0-full.nupkg');

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(expected);
  });

  it('rejects a root launcher when the versioned application is missing', () => {
    const installRoot = temporaryInstallRoot();
    createExecutable(installRoot, 'Quiz Stage.exe');

    const result = resolveExecutable(installRoot, 'QuizStage-0.1.0-full.nupkg');

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(path.join('app-0.1.0', 'Quiz Stage.exe'));
  });

  it('rejects ambiguous Squirrel release packages before running an installer', () => {
    const packageRoot = temporaryInstallRoot();
    createExecutable(packageRoot, path.join('installer', 'QuizStageSetup.exe'));
    createExecutable(packageRoot, path.join('squirrel.windows', 'x64', 'QuizStage-0.0.9-full.nupkg'));
    createExecutable(packageRoot, path.join('squirrel.windows', 'x64', 'QuizStage-0.1.0-full.nupkg'));

    const result = spawnSync('pwsh', [
      '-NoProfile',
      '-NonInteractive',
      '-File', smokeScript,
      '-PackageRoot', packageRoot,
      '-Mode', 'Installer',
    ], { encoding: 'utf8' });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Expected exactly one Squirrel release package');
  });
});
