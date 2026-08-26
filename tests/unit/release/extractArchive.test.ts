import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  archiveExtractionCommand,
  createPackageTemporaryDirectory,
  removePackageTemporaryDirectory,
} from '../../../scripts/release/extractArchive';
import {
  createPackageTemporaryDirectories,
  parsePortableSmokeArguments,
  validatedPackagedExecutable,
} from '../../../scripts/smoke-portable';

const temporaryDirectories: string[] = [];

function packageTemporaryDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'quiz-stage-package-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('archive extraction commands', () => {
  it('uses PowerShell Expand-Archive on Windows without interpolating paths', () => {
    const destination = packageTemporaryDirectory();
    const archive = path.join(tmpdir(), "Quiz Stage's package.zip");

    expect(archiveExtractionCommand('win32', archive, destination)).toEqual({
      executable: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Expand-Archive -LiteralPath $env:QUIZ_STAGE_ARCHIVE_PATH -DestinationPath $env:QUIZ_STAGE_EXTRACTION_DESTINATION -Force',
      ],
      env: {
        QUIZ_STAGE_ARCHIVE_PATH: archive,
        QUIZ_STAGE_EXTRACTION_DESTINATION: destination,
      },
    });
  });

  it.each(['darwin', 'linux'] as const)('uses quiet unzip arguments on %s', (platform) => {
    const destination = packageTemporaryDirectory();
    const archive = path.join(tmpdir(), 'Quiz Stage package.zip');

    expect(archiveExtractionCommand(platform, archive, destination)).toEqual({
      executable: 'unzip',
      args: ['-q', archive, '-d', destination],
    });
  });

  it('refuses a destination that was not created by the caller', () => {
    const destination = path.join(tmpdir(), `quiz-stage-package-missing-${process.pid}`);

    expect(() => archiveExtractionCommand('linux', 'package.zip', destination))
      .toThrow('UNSAFE_PACKAGE_TEMP_DIRECTORY');
  });

  it('refuses a temporary destination without the package prefix', () => {
    const destination = mkdtempSync(path.join(tmpdir(), 'unrelated-'));
    temporaryDirectories.push(destination);

    expect(() => archiveExtractionCommand('linux', 'package.zip', destination))
      .toThrow('UNSAFE_PACKAGE_TEMP_DIRECTORY');
  });
});

describe('portable smoke arguments', () => {
  it('accepts exactly one target and one archive path', () => {
    const parsed = parsePortableSmokeArguments([
      '--target',
      'windows-x64',
      '--archive',
      'out/make/portable/Quiz Stage-win32-x64.zip',
    ]);

    expect(parsed).toEqual({
      target: expect.objectContaining({ id: 'windows-x64' }),
      archive: path.resolve('out/make/portable/Quiz Stage-win32-x64.zip'),
    });
  });

  it.each([
    { args: [] },
    { args: ['--target', 'windows-x64'] },
    { args: ['windows-x64', 'package.zip'] },
    { args: ['--target', 'windows-x64', '--archive', 'package.zip', '--extra'] },
    { args: ['--archive', 'package.zip', '--target', 'windows-x64'] },
  ])('rejects malformed arguments: $args', ({ args }) => {
    expect(() => parsePortableSmokeArguments(args)).toThrow('EXPECTED_PORTABLE_SMOKE_ARGUMENTS');
  });

  it('retains named arguments through npm without deprecated config warnings', () => {
    const npmCli = process.env.npm_execpath;
    expect(npmCli).toBeDefined();
    const result = spawnSync(process.execPath, [
      npmCli!,
      'run',
      'smoke:portable',
      '--',
      '--',
      '--target',
      'definitely-invalid',
      '--archive',
      'definitely-missing.zip',
    ], { cwd: process.cwd(), encoding: 'utf8' });
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('UNKNOWN_RELEASE_TARGET:definitely-invalid');
    expect(output).not.toContain('Unknown cli config');
  }, 15_000);
});

describe('portable executable containment', () => {
  it('rejects an executable reached through a symlink outside the extraction directory', () => {
    const extractionDirectory = packageTemporaryDirectory();
    const outsideDirectory = packageTemporaryDirectory();
    const outsideExecutable = path.join(outsideDirectory, 'quiz-stage');
    writeFileSync(outsideExecutable, 'outside');
    const linkedDirectory = path.join(extractionDirectory, 'linked-application');
    mkdirSync(path.dirname(linkedDirectory), { recursive: true });
    symlinkSync(outsideDirectory, linkedDirectory, process.platform === 'win32' ? 'junction' : 'dir');

    expect(() => validatedPackagedExecutable(
      extractionDirectory,
      path.join(linkedDirectory, 'quiz-stage'),
    )).toThrow('UNSAFE_PACKAGED_EXECUTABLE');
  });
});

describe('owned package temporary directories', () => {
  it('refuses to remove a replacement at an owned pathname', () => {
    const owned = createPackageTemporaryDirectory('quiz-stage-package-test-owned-');
    const original = `${owned.path}-original`;
    renameSync(owned.path, original);
    mkdirSync(owned.path);
    temporaryDirectories.push(owned.path, original);

    expect(() => removePackageTemporaryDirectory(owned))
      .toThrow('PACKAGE_TEMP_DIRECTORY_IDENTITY_CHANGED');
    expect(existsSync(owned.path)).toBe(true);
  });

  it('removes the first directory when creation of the second fails', () => {
    let firstDirectory: string | undefined;
    let creationCount = 0;

    expect(() => createPackageTemporaryDirectories((prefix) => {
      creationCount += 1;
      if (creationCount === 2) throw new Error('SECOND_TEMP_DIRECTORY_FAILED');
      const owned = createPackageTemporaryDirectory(prefix);
      firstDirectory = owned.path;
      return owned;
    })).toThrow('SECOND_TEMP_DIRECTORY_FAILED');

    expect(firstDirectory).toBeDefined();
    expect(existsSync(firstDirectory!)).toBe(false);
  });
});
