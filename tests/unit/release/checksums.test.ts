import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checksumLines, writeReleaseChecksums } from '../../../scripts/write-release-checksums';
import { releaseTargetForId, type ReleaseTarget } from '../../../scripts/release/targets';

const roots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'quiz-stage-checksums-'));
  roots.push(root);
  return root;
}

function createFile(filePath: string, contents: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function hash(contents: string): string {
  return createHash('sha256').update(contents).digest('hex');
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('release checksums', () => {
  it('writes lowercase SHA-256 lines sorted by basename', () => {
    const root = temporaryRoot();
    const first = path.join(root, 'first.zip');
    const second = path.join(root, 'second.deb');
    createFile(first, 'first');
    createFile(second, 'second');

    expect(checksumLines([second, first])).toEqual([
      `${hash('first')}  first.zip`,
      `${hash('second')}  second.deb`,
    ]);
  });

  it('writes only the exact target artifacts with sorted relative paths', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    const installer = path.join(packageRoot, 'installer', 'QuizStageSetup.exe');
    const portable = path.join(packageRoot, 'portable', 'QuizStage-win32-x64.zip');
    createFile(installer, 'installer');
    createFile(portable, 'portable');
    createFile(path.join(packageRoot, 'portable', 'QuizStage-darwin-arm64.zip'), 'other-target');
    createFile(path.join(packageRoot, 'release-checksums-windows-x64.txt'), 'stale checksum');

    const destination = writeReleaseChecksums(releaseTargetForId('windows-x64'), packageRoot);

    expect(destination).toBe(path.join(packageRoot, 'release-checksums-windows-x64.txt'));
    expect(readFileSync(destination, 'utf8')).toBe(
      `${hash('installer')}  installer/QuizStageSetup.exe\n${hash('portable')}  portable/QuizStage-win32-x64.zip\n`,
    );
  });

  it('fails closed when an expected artifact is missing', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    createFile(path.join(packageRoot, 'portable', 'QuizStage-win32-x64.zip'), 'portable');

    expect(() => writeReleaseChecksums(releaseTargetForId('windows-x64'), packageRoot)).toThrow(
      'RELEASE_ARTIFACT_NOT_FOUND:windows-x64:installer/QuizStageSetup.exe',
    );
  });

  it('fails closed when a target declares duplicate expected artifacts', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    const target = releaseTargetForId('windows-x64');
    const duplicateTarget: ReleaseTarget = {
      ...target,
      artifacts: [target.artifacts[0]!, target.artifacts[0]!],
    };

    expect(() => writeReleaseChecksums(duplicateTarget, packageRoot)).toThrow(
      'DUPLICATE_RELEASE_ARTIFACT:windows-x64:installer/QuizStageSetup.exe',
    );
  });

  it('rejects an expected artifact that resolves outside the package root', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    createFile(path.join(root, 'out', 'outside.exe'), 'outside');
    const target: ReleaseTarget = {
      ...releaseTargetForId('windows-x64'),
      artifacts: [{ kind: 'installer', relativePath: '../outside.exe' }],
    };

    expect(() => writeReleaseChecksums(target, packageRoot)).toThrow(
      'RELEASE_ARTIFACT_OUTSIDE_PACKAGE_ROOT:windows-x64:../outside.exe',
    );
  });

  it('keeps the Windows alias and PowerShell wrapper on the shared TypeScript command', () => {
    const wrapper = readFileSync(path.join(process.cwd(), 'scripts', 'write-release-checksums.ps1'), 'utf8');
    const packageJson = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['release:checksums']).toBe(
      'tsx scripts/write-release-checksums.ts --target windows-x64 --package-root out/make',
    );
    expect(wrapper).toContain('write-release-checksums.ts');
    expect(wrapper).toContain('exit $LASTEXITCODE');
    expect(wrapper).not.toContain('Get-FileHash');
  });
});
