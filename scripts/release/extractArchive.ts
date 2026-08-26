import { execFileSync } from 'node:child_process';
import { lstatSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

type ArchivePlatform = 'win32' | 'darwin' | 'linux';

export interface ArchiveCommand {
  executable: string;
  args: string[];
  env?: Record<string, string>;
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
