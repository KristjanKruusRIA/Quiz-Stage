import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { archiveExtractionCommand } from '../../../scripts/release/extractArchive';
import {
  parsePortableSmokeArguments,
  portableSmokeCliArguments,
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
    { args: ['--target', 'windows-x64', '--archive', 'package.zip', '--extra'] },
    { args: ['--archive', 'package.zip', '--target', 'windows-x64'] },
  ])('rejects malformed arguments: $args', ({ args }) => {
    expect(() => parsePortableSmokeArguments(args)).toThrow('EXPECTED_PORTABLE_SMOKE_ARGUMENTS');
  });

  it('restores named arguments consumed by npm 11 for the smoke lifecycle only', () => {
    const positional = ['windows-x64', 'out/make/portable/Quiz Stage-win32-x64.zip'];

    expect(portableSmokeCliArguments(positional, 'smoke:portable')).toEqual([
      '--target',
      positional[0],
      '--archive',
      positional[1],
    ]);
    expect(portableSmokeCliArguments(positional, undefined)).toEqual(positional);
  });
});
