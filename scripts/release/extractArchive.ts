import { execFileSync } from 'node:child_process';
import { lstatSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

type ArchivePlatform = 'win32' | 'darwin' | 'linux';

export interface ArchiveCommand {
  executable: string;
  args: string[];
  env?: Record<string, string>;
}

export interface OwnedPackageTemporaryDirectory {
  path: string;
  dev: number;
  ino: number;
}

export function validatedPackageTemporaryDirectory(destination: string): string {
  let resolvedDestination: string;
  try {
    if (!lstatSync(destination).isDirectory()) throw new Error('NOT_A_DIRECTORY');
    resolvedDestination = realpathSync(destination);
  } catch {
    throw new Error(`UNSAFE_PACKAGE_TEMP_DIRECTORY:${destination}`);
  }
  const resolvedTemporaryRoot = realpathSync(tmpdir());
  const relativeDestination = path.relative(resolvedTemporaryRoot, resolvedDestination);
  const isBeneathTemporaryRoot = relativeDestination !== ''
    && !relativeDestination.startsWith(`..${path.sep}`)
    && relativeDestination !== '..'
    && !path.isAbsolute(relativeDestination);
  const hasExpectedPrefix = path.basename(resolvedDestination).startsWith('quiz-stage-package-');

  if (!isBeneathTemporaryRoot || !hasExpectedPrefix) {
    throw new Error(`UNSAFE_PACKAGE_TEMP_DIRECTORY:${destination}`);
  }
  return resolvedDestination;
}

export function createPackageTemporaryDirectory(prefix: string): OwnedPackageTemporaryDirectory {
  if (!prefix.startsWith('quiz-stage-package-')) {
    throw new Error(`UNSAFE_PACKAGE_TEMP_PREFIX:${prefix}`);
  }
  const created = mkdtempSync(path.join(tmpdir(), prefix));
  const resolved = validatedPackageTemporaryDirectory(created);
  const stats = lstatSync(resolved);
  return { path: resolved, dev: stats.dev, ino: stats.ino };
}

export function removePackageTemporaryDirectory(owned: OwnedPackageTemporaryDirectory): void {
  let stats;
  try {
    stats = lstatSync(owned.path);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  const resolved = validatedPackageTemporaryDirectory(owned.path);
  if (
    stats.isSymbolicLink()
    || stats.dev !== owned.dev
    || stats.ino !== owned.ino
    || resolved !== owned.path
  ) {
    throw new Error(`PACKAGE_TEMP_DIRECTORY_IDENTITY_CHANGED:${owned.path}`);
  }
  rmSync(resolved, { recursive: true, force: true });
}

export function archiveExtractionCommand(
  platform: ArchivePlatform,
  archive: string,
  destination: string,
): ArchiveCommand {
  const safeDestination = validatedPackageTemporaryDirectory(destination);
  if (platform === 'win32') {
    return {
      executable: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Expand-Archive -LiteralPath $env:QUIZ_STAGE_ARCHIVE_PATH -DestinationPath $env:QUIZ_STAGE_EXTRACTION_DESTINATION -Force',
      ],
      env: {
        QUIZ_STAGE_ARCHIVE_PATH: archive,
        QUIZ_STAGE_EXTRACTION_DESTINATION: safeDestination,
      },
    };
  }

  return {
    executable: 'unzip',
    args: ['-q', archive, '-d', safeDestination],
  };
}

export function extractArchive(platform: ArchivePlatform, archive: string, destination: string): void {
  const command = archiveExtractionCommand(platform, archive, destination);
  execFileSync(command.executable, command.args, {
    stdio: 'inherit',
    ...(command.env === undefined ? {} : { env: { ...process.env, ...command.env } }),
  });
}
