import type { ChildProcess } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolvePackagedExecutable } from '../../../scripts/release/packageLayout';
import { releaseTargetForId, type ReleaseTarget } from '../../../scripts/release/targets';
import {
  parseUpgradeArguments,
  verifyUpgrade,
  type VerifyUpgradeOptions,
} from '../../../scripts/verify-upgrade';

const temporaryDirectories: string[] = [];

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(path.join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function copiedFixture(): string {
  const fixtureRoot = path.join(temporaryDirectory('quiz-stage-upgrade-test-fixture-'), 'UserData');
  cpSync(path.join(process.cwd(), 'tests', 'fixtures', 'previous-version', 'UserData'), fixtureRoot, {
    recursive: true,
  });
  return fixtureRoot;
}

function archiveFile(): string {
  const archive = path.join(temporaryDirectory('quiz-stage-upgrade-test-archive-'), 'package.zip');
  writeFileSync(archive, 'test archive');
  return archive;
}

function writeExtractedApplication(destination: string, target: ReleaseTarget): string {
  const applicationPath = target.forgePlatform === 'darwin'
    ? path.join(destination, 'Quiz Stage.app')
    : destination;
  const executable = resolvePackagedExecutable(applicationPath, target);
  mkdirSync(path.dirname(executable), { recursive: true });
  writeFileSync(executable, 'test executable');
  return executable;
}

function runningChild(exitCode: number | null = null): ChildProcess {
  return {
    exitCode,
    signalCode: null,
  } as ChildProcess;
}

function workflowOptions(
  target: ReleaseTarget,
  fixtureRoot: string,
  overrides: Partial<VerifyUpgradeOptions> = {},
): VerifyUpgradeOptions {
  return {
    target,
    archive: archiveFile(),
    root: process.cwd(),
    fixtureRoot,
    extractPackage: (_platform, _archive, destination) => {
      writeExtractedApplication(destination, target);
    },
    stopApplication: async () => undefined,
    runDataCheck: () => undefined,
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('upgrade verification arguments', () => {
  it('accepts exactly one target and archive', () => {
    expect(parseUpgradeArguments([
      '--target',
      'macos-arm64',
      '--archive',
      'out/make/portable/QuizStage-darwin-arm64.zip',
    ])).toEqual({
      target: expect.objectContaining({ id: 'macos-arm64' }),
      archive: path.resolve('out/make/portable/QuizStage-darwin-arm64.zip'),
    });
  });

  it('accepts npm 11 positional forwarding only for the verify-upgrade lifecycle', () => {
    expect(parseUpgradeArguments([
      'windows-x64',
      'out/make/portable/QuizStage-win32-x64.zip',
    ], 'verify-upgrade')).toEqual({
      target: expect.objectContaining({ id: 'windows-x64' }),
      archive: path.resolve('out/make/portable/QuizStage-win32-x64.zip'),
    });

    expect(() => parseUpgradeArguments(['windows-x64', 'package.zip']))
      .toThrow('EXPECTED_UPGRADE_ARGUMENTS');
  });
});

describe('package upgrade verification', () => {
  it.each([
    'windows-x64',
    'macos-arm64',
    'macos-x64',
    'ubuntu-x64',
  ] as const)('passes migrated %s data and its one backup to the data checker', async (targetId) => {
    const target = releaseTargetForId(targetId);
    const fixtureRoot = copiedFixture();
    const fixtureDatabaseBefore = readFileSync(path.join(fixtureRoot, 'quiz-stage.sqlite'));
    const fixtureMediaBefore = readFileSync(path.join(fixtureRoot, 'media', 'logo.png'));
    let checked = false;

    await verifyUpgrade(workflowOptions(target, fixtureRoot, {
      spawnApplication: (executable, args) => {
        const userDataArgument = args.find((argument) => argument.startsWith('--user-data-dir='));
        expect(args).toEqual([
          expect.stringMatching(/^--user-data-dir=/),
          '--quiz-stage-e2e-network-guard',
        ]);
        const userDataDirectory = userDataArgument!.slice('--user-data-dir='.length);
        expect(existsSync(path.join(userDataDirectory, 'quiz-stage.sqlite'))).toBe(true);
        expect(existsSync(path.join(userDataDirectory, 'media', 'logo.png'))).toBe(true);
        if (target.forgePlatform === 'win32') {
          expect(userDataDirectory).toBe(path.join(path.dirname(executable), 'UserData'));
        } else {
          expect(userDataDirectory).not.toBe(path.join(path.dirname(executable), 'UserData'));
        }
        const backupDirectory = path.join(userDataDirectory, 'backups');
        mkdirSync(backupDirectory, { recursive: true });
        copyFileSync(
          path.join(userDataDirectory, 'quiz-stage.sqlite'),
          path.join(backupDirectory, 'pre-migration.bak'),
        );
        return runningChild();
      },
      runDataCheck: (databasePath, backupPath, sourceFixture) => {
        expect(databasePath).toBe(path.join(path.dirname(path.dirname(backupPath)), 'quiz-stage.sqlite'));
        expect(path.basename(backupPath)).toBe('pre-migration.bak');
        expect(sourceFixture).toBe(fixtureRoot);
        expect(readFileSync(backupPath)).toEqual(readFileSync(databasePath));
        checked = true;
      },
    }));

    expect(checked).toBe(true);
    expect(readFileSync(path.join(fixtureRoot, 'quiz-stage.sqlite'))).toEqual(fixtureDatabaseBefore);
    expect(readFileSync(path.join(fixtureRoot, 'media', 'logo.png'))).toEqual(fixtureMediaBefore);
  });

  it('rejects when no migration backup appears within ten seconds', async () => {
    vi.useFakeTimers();
    const target = releaseTargetForId('windows-x64');
    const verification = verifyUpgrade(workflowOptions(target, copiedFixture(), {
      spawnApplication: () => runningChild(),
    }));
    const rejection = expect(verification).rejects.toThrow('UPGRADE_BACKUP_TIMEOUT');

    await vi.advanceTimersByTimeAsync(10_000);

    await rejection;
  });

  it('rejects when the packaged application exits before creating a backup', async () => {
    const target = releaseTargetForId('ubuntu-x64');

    await expect(verifyUpgrade(workflowOptions(target, copiedFixture(), {
      spawnApplication: () => runningChild(23),
    }))).rejects.toThrow('PACKAGED_APP_EXITED:23');
  });

  it('rejects when migration creates more than one backup', async () => {
    const target = releaseTargetForId('macos-x64');

    await expect(verifyUpgrade(workflowOptions(target, copiedFixture(), {
      spawnApplication: (_executable, args) => {
        const userDataDirectory = args[0]!.slice('--user-data-dir='.length);
        const backupDirectory = path.join(userDataDirectory, 'backups');
        mkdirSync(backupDirectory, { recursive: true });
        writeFileSync(path.join(backupDirectory, 'one.bak'), 'one');
        writeFileSync(path.join(backupDirectory, 'two.bak'), 'two');
        return runningChild();
      },
    }))).rejects.toThrow('UPGRADE_BACKUP_NOT_UNIQUE:2');
  });

  it('rejects when the source fixture is mutated during verification', async () => {
    const target = releaseTargetForId('windows-x64');
    const fixtureRoot = copiedFixture();

    await expect(verifyUpgrade(workflowOptions(target, fixtureRoot, {
      spawnApplication: (_executable, args) => {
        const userDataDirectory = args[0]!.slice('--user-data-dir='.length);
        const backupDirectory = path.join(userDataDirectory, 'backups');
        mkdirSync(backupDirectory, { recursive: true });
        copyFileSync(
          path.join(userDataDirectory, 'quiz-stage.sqlite'),
          path.join(backupDirectory, 'pre-migration.bak'),
        );
        writeFileSync(path.join(fixtureRoot, 'media', 'logo.png'), 'mutated');
        return runningChild();
      },
    }))).rejects.toThrow('COMMITTED_UPGRADE_FIXTURE_CHANGED');
  });
});
