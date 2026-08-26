import { createHash } from 'node:crypto';
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const hashTest = vi.hoisted(() => ({ forbiddenPath: '' }));

vi.mock('node:fs', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs')>();
  return {
    ...fs,
    readFileSync: (...args: Parameters<typeof fs.readFileSync>) => {
      if (args[0] === hashTest.forbiddenPath) throw new Error('WHOLE_FILE_READ_FORBIDDEN');
      return fs.readFileSync(...args);
    },
  };
});
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

  it('writes only exact target artifacts sorted by basename rather than directory', () => {
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
      `${hash('portable')}  portable/QuizStage-win32-x64.zip\n${hash('installer')}  installer/QuizStageSetup.exe\n`,
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
    createFile(path.join(packageRoot, 'installer', 'QuizStageSetup.exe'), 'installer');
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
    mkdirSync(packageRoot, { recursive: true });
    createFile(path.join(root, 'out', 'outside.exe'), 'outside');
    const target: ReleaseTarget = {
      ...releaseTargetForId('windows-x64'),
      artifacts: [{ kind: 'installer', relativePath: '../outside.exe' }],
    };

    expect(() => writeReleaseChecksums(target, packageRoot)).toThrow(
      'RELEASE_ARTIFACT_OUTSIDE_PACKAGE_ROOT:windows-x64:../outside.exe',
    );
  });

  it('rejects a symbolic-link artifact whose canonical path escapes the package root', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    const outside = path.join(root, 'outside.exe');
    const installer = path.join(packageRoot, 'installer', 'QuizStageSetup.exe');
    createFile(outside, 'outside');
    mkdirSync(path.dirname(installer), { recursive: true });
    symlinkSync(outside, installer, 'file');
    createFile(path.join(packageRoot, 'portable', 'QuizStage-win32-x64.zip'), 'portable');

    expect(() => writeReleaseChecksums(releaseTargetForId('windows-x64'), packageRoot)).toThrow(
      'RELEASE_ARTIFACT_OUTSIDE_PACKAGE_ROOT:windows-x64:installer/QuizStageSetup.exe',
    );
  });

  it.each([
    'portable/./QuizStage-win32-x64.zip',
    'portable\\QuizStage-win32-x64.zip',
  ])('rejects duplicate expected artifacts after resolving %s aliases', (alias) => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    const artifactPath = path.join(packageRoot, 'portable', 'QuizStage-win32-x64.zip');
    createFile(artifactPath, 'portable');
    const target: ReleaseTarget = {
      ...releaseTargetForId('windows-x64'),
      artifacts: [
        { kind: 'installer', relativePath: 'portable/QuizStage-win32-x64.zip' },
        { kind: 'portable', relativePath: alias },
      ],
    };

    expect(() => writeReleaseChecksums(target, packageRoot)).toThrow(
      'DUPLICATE_RELEASE_ARTIFACT:windows-x64:portable/QuizStage-win32-x64.zip',
    );
  });

  it('rejects the generated checksum file and leaves it unchanged across repeated calls', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    const destination = path.join(packageRoot, 'release-checksums-windows-x64.txt');
    createFile(destination, 'previous checksum\n');
    const target: ReleaseTarget = {
      ...releaseTargetForId('windows-x64'),
      artifacts: [{ kind: 'installer', relativePath: 'release-checksums-windows-x64.txt' }],
    };

    const write = () => writeReleaseChecksums(target, packageRoot);
    expect(write).toThrow('RELEASE_ARTIFACT_IS_CHECKSUM_FILE:windows-x64:release-checksums-windows-x64.txt');
    expect(write).toThrow('RELEASE_ARTIFACT_IS_CHECKSUM_FILE:windows-x64:release-checksums-windows-x64.txt');
    expect(readFileSync(destination, 'utf8')).toBe('previous checksum\n');
  });

  it.skipIf(process.platform !== 'win32')('rejects an existing checksum file through a Windows case-variant alias without changing it', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    const destination = path.join(packageRoot, 'release-checksums-windows-x64.txt');
    const caseVariant = path.join(packageRoot, 'RELEASE-CHECKSUMS-Windows-X64.TXT');
    createFile(caseVariant, 'previous checksum\n');
    const original = readFileSync(caseVariant);
    const target: ReleaseTarget = {
      ...releaseTargetForId('windows-x64'),
      artifacts: [{ kind: 'installer', relativePath: path.basename(caseVariant) }],
    };

    const errors: unknown[] = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        writeReleaseChecksums(target, packageRoot);
      } catch (error) {
        errors.push(error);
      }
    }

    expect.soft(errors).toHaveLength(2);
    expect.soft(errors[0]).toMatchObject({
      message: 'RELEASE_ARTIFACT_IS_CHECKSUM_FILE:windows-x64:RELEASE-CHECKSUMS-Windows-X64.TXT',
    });
    expect.soft(errors[1]).toMatchObject({
      message: 'RELEASE_ARTIFACT_IS_CHECKSUM_FILE:windows-x64:RELEASE-CHECKSUMS-Windows-X64.TXT',
    });
    expect.soft(readFileSync(caseVariant)).toEqual(original);
    expect(readFileSync(destination)).toEqual(original);
  });

  it('rejects an absent generated checksum file before creating it', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    mkdirSync(packageRoot, { recursive: true });
    const destination = path.join(packageRoot, 'release-checksums-windows-x64.txt');
    const target: ReleaseTarget = {
      ...releaseTargetForId('windows-x64'),
      artifacts: [{ kind: 'installer', relativePath: 'release-checksums-windows-x64.txt' }],
    };

    const write = () => writeReleaseChecksums(target, packageRoot);
    expect(write).toThrow('RELEASE_ARTIFACT_IS_CHECKSUM_FILE:windows-x64:release-checksums-windows-x64.txt');
    expect(write).toThrow('RELEASE_ARTIFACT_IS_CHECKSUM_FILE:windows-x64:release-checksums-windows-x64.txt');
    expect(existsSync(destination)).toBe(false);
  });

  it('rejects a symbolic-link checksum destination without changing its outside target', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    createFile(path.join(packageRoot, 'installer', 'QuizStageSetup.exe'), 'installer');
    createFile(path.join(packageRoot, 'portable', 'QuizStage-win32-x64.zip'), 'portable');
    const sentinel = path.join(root, 'outside-sentinel.txt');
    const destination = path.join(packageRoot, 'release-checksums-windows-x64.txt');
    createFile(sentinel, 'sentinel\n');
    symlinkSync(sentinel, destination, 'file');

    let received: unknown;
    try {
      writeReleaseChecksums(releaseTargetForId('windows-x64'), packageRoot);
    } catch (error) {
      received = error;
    }

    expect(received).toMatchObject({ message: 'RELEASE_CHECKSUM_DESTINATION_IS_SYMLINK:windows-x64' });
    expect(readFileSync(sentinel, 'utf8')).toBe('sentinel\n');
  });

  it('rejects a hard-linked checksum destination without changing its outside target', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    createFile(path.join(packageRoot, 'installer', 'QuizStageSetup.exe'), 'installer');
    createFile(path.join(packageRoot, 'portable', 'QuizStage-win32-x64.zip'), 'portable');
    const sentinel = path.join(root, 'outside-sentinel.txt');
    const destination = path.join(packageRoot, 'release-checksums-windows-x64.txt');
    createFile(sentinel, 'sentinel\n');
    linkSync(sentinel, destination);
    const original = readFileSync(sentinel);

    let received: unknown;
    try {
      writeReleaseChecksums(releaseTargetForId('windows-x64'), packageRoot);
    } catch (error) {
      received = error;
    }

    expect.soft(received).toMatchObject({ message: 'RELEASE_CHECKSUM_DESTINATION_IS_HARD_LINK:windows-x64' });
    expect.soft(readFileSync(sentinel)).toEqual(original);
    expect(readFileSync(destination)).toEqual(original);
  });

  it('rejects a checksum destination hard-linked to an expected artifact without rewriting either path', () => {
    const root = temporaryRoot();
    const packageRoot = path.join(root, 'out', 'make');
    createFile(path.join(packageRoot, 'installer', 'QuizStageSetup.exe'), 'installer');
    const portable = path.join(packageRoot, 'portable', 'QuizStage-win32-x64.zip');
    const destination = path.join(packageRoot, 'release-checksums-windows-x64.txt');
    createFile(portable, 'portable');
    linkSync(portable, destination);
    const original = readFileSync(portable);

    let received: unknown;
    try {
      writeReleaseChecksums(releaseTargetForId('windows-x64'), packageRoot);
    } catch (error) {
      received = error;
    }

    expect.soft(received).toMatchObject({ message: 'RELEASE_CHECKSUM_DESTINATION_IS_HARD_LINK:windows-x64' });
    expect.soft(readFileSync(portable)).toEqual(original);
    expect(readFileSync(destination)).toEqual(original);
  });

  it('hashes multi-chunk binary artifacts without reading the whole file', () => {
    const root = temporaryRoot();
    const artifact = path.join(root, 'large.zip');
    const contents = Buffer.alloc(3 * 64 * 1024 + 17);
    for (let index = 0; index < contents.length; index += 1) contents[index] = index % 251;
    writeFileSync(artifact, contents);
    hashTest.forbiddenPath = artifact;

    try {
      expect(checksumLines([artifact])).toEqual([`${createHash('sha256').update(contents).digest('hex')}  large.zip`]);
    } finally {
      hashTest.forbiddenPath = '';
    }
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
