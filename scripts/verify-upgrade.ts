import { createHash } from 'node:crypto';
import {
  execFileSync,
  type ChildProcess,
  type SpawnOptions,
} from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { extractArchive } from './release/extractArchive';
import { spawnPackagedProcess, stopPackagedProcess } from './release/packagedProcess';
import { extractedApplicationPath, resolvePackagedExecutable } from './release/packageLayout';
import { releaseTargetForId, type ReleaseTarget } from './release/targets';
import { validatedPackagedExecutable } from './smoke-portable';

const backupTimeoutMs = 10_000;
const backupPollIntervalMs = 100;

export interface UpgradeArguments {
  target: ReleaseTarget;
  archive: string;
}

export interface VerifyUpgradeOptions extends UpgradeArguments {
  root?: string;
  fixtureRoot?: string;
  extractPackage?: typeof extractArchive;
  spawnApplication?: (executable: string, args: string[], options: SpawnOptions) => ChildProcess;
  stopApplication?: (child: ChildProcess) => Promise<void>;
  runDataCheck?: (databasePath: string, backupPath: string, fixtureRoot: string) => void;
}

interface OwnedUpgradeWorkspace {
  path: string;
  dev: number;
  ino: number;
}

interface FixtureHashes {
  database: string;
  media: string;
}

export function parseUpgradeArguments(args: string[]): UpgradeArguments {
  const normalizedArgs = args[0] === '--' ? args.slice(1) : args;
  if (
    normalizedArgs.length !== 4
    || normalizedArgs[0] !== '--target'
    || normalizedArgs[1] === undefined
    || normalizedArgs[2] !== '--archive'
    || normalizedArgs[3] === undefined
  ) {
    throw new Error('EXPECTED_UPGRADE_ARGUMENTS');
  }
  return {
    target: releaseTargetForId(normalizedArgs[1]),
    archive: path.resolve(normalizedArgs[3]),
  };
}

function createUpgradeWorkspace(): OwnedUpgradeWorkspace {
  const created = realpathSync(mkdtempSync(path.join(tmpdir(), 'quiz-stage-upgrade-check-')));
  const stats = lstatSync(created);
  return { path: created, dev: stats.dev, ino: stats.ino };
}

function removeUpgradeWorkspace(owned: OwnedUpgradeWorkspace): void {
  const stats = lstatSync(owned.path);
  const resolved = realpathSync(owned.path);
  const temporaryRoot = realpathSync(tmpdir());
  const relative = path.relative(temporaryRoot, resolved);
  const isTemporaryChild = relative !== ''
    && relative !== '..'
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative);
  if (
    stats.isSymbolicLink()
    || stats.dev !== owned.dev
    || stats.ino !== owned.ino
    || !isTemporaryChild
    || !path.basename(resolved).startsWith('quiz-stage-upgrade-check-')
  ) {
    throw new Error(`UNSAFE_UPGRADE_WORKSPACE:${owned.path}`);
  }
  rmSync(resolved, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 });
}

function fixtureHashes(fixtureRoot: string): FixtureHashes {
  return {
    database: createHash('sha256')
      .update(readFileSync(path.join(fixtureRoot, 'quiz-stage.sqlite')))
      .digest('hex'),
    media: createHash('sha256')
      .update(readFileSync(path.join(fixtureRoot, 'media', 'logo.png')))
      .digest('hex'),
  };
}

function assertFixtureUnchanged(fixtureRoot: string, expected: FixtureHashes): void {
  let actual: FixtureHashes;
  try {
    actual = fixtureHashes(fixtureRoot);
  } catch {
    throw new Error('COMMITTED_UPGRADE_FIXTURE_CHANGED');
  }
  if (actual.database !== expected.database || actual.media !== expected.media) {
    throw new Error('COMMITTED_UPGRADE_FIXTURE_CHANGED');
  }
}

function copyFixtureContents(fixtureRoot: string, userDataDirectory: string): void {
  mkdirSync(userDataDirectory, { recursive: true });
  for (const entry of readdirSync(fixtureRoot)) {
    cpSync(path.join(fixtureRoot, entry), path.join(userDataDirectory, entry), { recursive: true });
  }
}

function backupPaths(backupDirectory: string): string[] {
  return existsSync(backupDirectory)
    ? readdirSync(backupDirectory)
      .filter((name) => name.endsWith('.bak'))
      .map((name) => path.join(backupDirectory, name))
    : [];
}

async function waitForBackup(child: ChildProcess, backupDirectory: string): Promise<void> {
  const deadline = Date.now() + backupTimeoutMs;
  while (true) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`PACKAGED_APP_EXITED:${child.exitCode ?? child.signalCode ?? 'unknown'}`);
    }
    const backups = backupPaths(backupDirectory);
    if (backups.length > 1) throw new Error(`UPGRADE_BACKUP_NOT_UNIQUE:${backups.length}`);
    if (backups.length === 1) return;
    if (Date.now() >= deadline) throw new Error(`UPGRADE_BACKUP_TIMEOUT:${backupDirectory}`);
    await new Promise((resolve) => setTimeout(resolve, backupPollIntervalMs));
  }
}

function runUpgradeDataCheck(
  root: string,
  databasePath: string,
  backupPath: string,
  fixtureRoot: string,
): void {
  execFileSync(process.execPath, [
    path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    path.join(root, 'scripts', 'verify-upgrade-data.ts'),
    databasePath,
    backupPath,
    fixtureRoot,
  ], { cwd: root, stdio: 'inherit' });
}

export async function verifyUpgrade(options: VerifyUpgradeOptions): Promise<void> {
  const root = options.root ?? process.cwd();
  const fixtureRoot = options.fixtureRoot
    ?? path.join(root, 'tests', 'fixtures', 'previous-version', 'UserData');
  if (!existsSync(options.archive) || !statSync(options.archive).isFile()) {
    throw new Error(`PORTABLE_ARCHIVE_MISSING:${options.archive}`);
  }
  if (!existsSync(fixtureRoot) || !statSync(fixtureRoot).isDirectory()) {
    throw new Error(`UPGRADE_FIXTURE_MISSING:${fixtureRoot}`);
  }

  const expectedFixtureHashes = fixtureHashes(fixtureRoot);
  const workspace = createUpgradeWorkspace();
  try {
    const extractionDirectory = path.join(workspace.path, 'quiz-stage-package-extract');
    mkdirSync(extractionDirectory);
    (options.extractPackage ?? extractArchive)(
      options.target.forgePlatform,
      options.archive,
      extractionDirectory,
    );
    const applicationPath = extractedApplicationPath(extractionDirectory, options.target);
    const executable = validatedPackagedExecutable(
      extractionDirectory,
      resolvePackagedExecutable(applicationPath, options.target),
    );
    if (options.target.forgePlatform !== 'win32') chmodSync(executable, 0o755);

    const userDataDirectory = options.target.forgePlatform === 'win32'
      ? path.join(path.dirname(executable), 'UserData')
      : path.join(workspace.path, 'UserData');
    copyFixtureContents(fixtureRoot, userDataDirectory);
    const databasePath = path.join(userDataDirectory, 'quiz-stage.sqlite');
    const backupDirectory = path.join(userDataDirectory, 'backups');
    const spawnApplication = options.spawnApplication ?? spawnPackagedProcess;
    const stopApplication = options.stopApplication ?? stopPackagedProcess;
    const child = spawnApplication(executable, [
      `--user-data-dir=${userDataDirectory}`,
      '--quiz-stage-e2e-network-guard',
    ], {
      cwd: path.dirname(executable),
      env: process.env,
      stdio: 'ignore',
      windowsHide: true,
    });

    try {
      await waitForBackup(child, backupDirectory);
    } finally {
      await stopApplication(child);
    }

    const backups = backupPaths(backupDirectory);
    if (backups.length !== 1) throw new Error(`UPGRADE_BACKUP_NOT_UNIQUE:${backups.length}`);
    const backupPath = backups[0]!;

    const runDataCheck = options.runDataCheck
      ?? ((database, backup, fixture) => runUpgradeDataCheck(root, database, backup, fixture));
    runDataCheck(databasePath, backupPath, fixtureRoot);
  } finally {
    removeUpgradeWorkspace(workspace);
    assertFixtureUnchanged(fixtureRoot, expectedFixtureHashes);
  }
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  verifyUpgrade(parseUpgradeArguments(process.argv.slice(2))).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
