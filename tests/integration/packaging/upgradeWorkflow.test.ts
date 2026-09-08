import { spawnSync, type ChildProcess } from 'node:child_process';
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
import { syncBundledContent } from '../../../src/main/content/bundledContentSync';
import { openDatabase } from '../../../src/main/persistence/database';
import { migrateDatabase } from '../../../src/main/persistence/migrations';

const temporaryDirectories: string[] = [];
const expectedExpansionClueId = 'built-in-history-easy-expansion-001';

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

function migratedFixture(fixtureRoot: string, syncProductionContent: boolean): {
  backupPath: string;
  databasePath: string;
} {
  const databasePath = path.join(fixtureRoot, 'quiz-stage.sqlite');
  const backupDirectory = path.join(fixtureRoot, 'backups');
  const migrationTime = new Date('2026-09-08T12:00:00.000Z');
  const database = openDatabase({ filePath: databasePath });
  try {
    migrateDatabase(database, backupDirectory, { now: () => migrationTime });
    if (syncProductionContent) {
      const seedPath = path.resolve('resources', 'content', 'seed.sqlite');
      syncBundledContent(database, seedPath);
      syncBundledContent(database, seedPath);
    }
  } finally {
    database.close();
  }
  return {
    backupPath: path.join(backupDirectory, 'quiz-stage.sqlite.20260908T120000000Z.bak'),
    databasePath,
  };
}

function runUpgradeDataCheck(databasePath: string, backupPath: string, fixtureRoot: string) {
  return spawnSync(process.execPath, [
    path.resolve('node_modules', 'tsx', 'dist', 'cli.mjs'),
    path.resolve('scripts', 'verify-upgrade-data.ts'),
    databasePath,
    backupPath,
    fixtureRoot,
  ], { cwd: process.cwd(), encoding: 'utf8' });
}

function archiveFile(): string {
  const archive = path.join(temporaryDirectory('quiz-stage-upgrade-test-archive-'), 'package.zip');
  writeFileSync(archive, 'test archive');
  return archive;
}

function writeExtractedApplication(destination: string, target: ReleaseTarget): string {
  const applicationPath = target.forgePlatform === 'darwin'
    ? path.join(destination, 'Quiz Stage.app')
    : target.forgePlatform === 'linux'
      ? path.join(destination, `Quiz Stage-linux-${target.forgeArch}`)
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
  it.each([
    [
      '--target',
      'macos-arm64',
      '--archive',
      'out/make/portable/QuizStage-darwin-arm64.zip',
    ],
    [
      '--',
      '--target',
      'macos-arm64',
      '--archive',
      'out/make/portable/QuizStage-darwin-arm64.zip',
    ],
  ])('accepts one target and archive after at most one sentinel: %j', (...args) => {
    expect(parseUpgradeArguments(args)).toEqual({
      target: expect.objectContaining({ id: 'macos-arm64' }),
      archive: path.resolve('out/make/portable/QuizStage-darwin-arm64.zip'),
    });
  });

  it('rejects positional arguments even during the npm lifecycle', () => {
    const previousLifecycleEvent = process.env.npm_lifecycle_event;
    process.env.npm_lifecycle_event = 'verify-upgrade';
    try {
      expect(() => parseUpgradeArguments(['windows-x64', 'package.zip']))
        .toThrow('EXPECTED_UPGRADE_ARGUMENTS');
    } finally {
      if (previousLifecycleEvent === undefined) delete process.env.npm_lifecycle_event;
      else process.env.npm_lifecycle_event = previousLifecycleEvent;
    }
  });

  it('retains named arguments through npm without deprecated config warnings', () => {
    const npmCli = process.env.npm_execpath;
    expect(npmCli).toBeDefined();
    const result = spawnSync(process.execPath, [
      npmCli!,
      'run',
      'verify-upgrade',
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

describe('package upgrade verification', () => {
  it('keeps a bounded extended retry window for transient workspace locks', () => {
    const source = readFileSync('scripts/verify-upgrade.ts', 'utf8');

    expect(source).toContain(
      'rmSync(resolved, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 });',
    );
  });

  it('runs the Linux package from the Maker ZIP top-level directory', async () => {
    const target = releaseTargetForId('ubuntu-x64');
    let expectedExecutable = '';
    let spawnedExecutable = '';

    await verifyUpgrade(workflowOptions(target, copiedFixture(), {
      extractPackage: (_platform, _archive, destination) => {
        expectedExecutable = writeExtractedApplication(destination, target);
      },
      spawnApplication: (executable, args) => {
        spawnedExecutable = executable;
        const userDataDirectory = args[0]!.slice('--user-data-dir='.length);
        const backupDirectory = path.join(userDataDirectory, 'backups');
        mkdirSync(backupDirectory, { recursive: true });
        copyFileSync(
          path.join(userDataDirectory, 'quiz-stage.sqlite'),
          path.join(backupDirectory, 'pre-migration.bak'),
        );
        return runningChild();
      },
    }));

    expect(spawnedExecutable).toBe(expectedExecutable);
    expect(path.basename(path.dirname(spawnedExecutable))).toBe('Quiz Stage-linux-x64');
  });

  it('rejects ambiguous Linux Maker ZIP top-level directories', async () => {
    const target = releaseTargetForId('ubuntu-x64');

    await expect(verifyUpgrade(workflowOptions(target, copiedFixture(), {
      extractPackage: (_platform, _archive, destination) => {
        writeExtractedApplication(destination, target);
        const duplicate = path.join(destination, 'Duplicate-linux-x64');
        const executable = resolvePackagedExecutable(duplicate, target);
        mkdirSync(path.dirname(executable), { recursive: true });
        writeFileSync(executable, 'duplicate executable');
      },
    }))).rejects.toThrow('PACKAGED_APPLICATION_NOT_UNIQUE');
  });

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

  it('rejects a migrated database that never synchronized the easy expansion', () => {
    const fixtureRoot = copiedFixture();
    const { databasePath, backupPath } = migratedFixture(fixtureRoot, false);

    const result = runUpgradeDataCheck(databasePath, backupPath, fixtureRoot);

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(`Expansion clue missing after migration: ${expectedExpansionClueId}`);
  });

  it('accepts the easy expansion after repeatable bundled-content synchronization', () => {
    const fixtureRoot = copiedFixture();
    const { databasePath, backupPath } = migratedFixture(fixtureRoot, true);

    const result = runUpgradeDataCheck(databasePath, backupPath, fixtureRoot);

    expect(result.status).toBe(0);
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

  it('rejects when stopping the application creates a second backup', async () => {
    const target = releaseTargetForId('windows-x64');
    let backupDirectory = '';
    let dataChecked = false;

    await expect(verifyUpgrade(workflowOptions(target, copiedFixture(), {
      spawnApplication: (_executable, args) => {
        const userDataDirectory = args[0]!.slice('--user-data-dir='.length);
        backupDirectory = path.join(userDataDirectory, 'backups');
        mkdirSync(backupDirectory, { recursive: true });
        writeFileSync(path.join(backupDirectory, 'one.bak'), 'one');
        return runningChild();
      },
      stopApplication: async () => {
        writeFileSync(path.join(backupDirectory, 'two.bak'), 'two');
      },
      runDataCheck: () => {
        dataChecked = true;
      },
    }))).rejects.toThrow('UPGRADE_BACKUP_NOT_UNIQUE:2');

    expect(dataChecked).toBe(false);
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
