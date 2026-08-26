import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  lstatSync,
  realpathSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  createPackageTemporaryDirectory,
  extractArchive,
  removePackageTemporaryDirectory,
  type OwnedPackageTemporaryDirectory,
} from './release/extractArchive';
import {
  extractedApplicationPath,
  packagedResourcesDirectory,
  resolvePackagedExecutable,
} from './release/packageLayout';
import { releaseTargetForId, type ReleaseTarget } from './release/targets';

export interface PortableSmokeArguments {
  target: ReleaseTarget;
  archive: string;
}

export function parsePortableSmokeArguments(args: string[]): PortableSmokeArguments {
  const namedArgs = args[0] === '--' ? args.slice(1) : args;
  if (
    namedArgs.length !== 4
    || namedArgs[0] !== '--target'
    || namedArgs[1] === undefined
    || namedArgs[2] !== '--archive'
    || namedArgs[3] === undefined
  ) {
    throw new Error('EXPECTED_PORTABLE_SMOKE_ARGUMENTS');
  }
  return {
    target: releaseTargetForId(namedArgs[1]),
    archive: path.resolve(namedArgs[3]),
  };
}

export function validatedPackagedExecutable(extractionDirectory: string, executable: string): string {
  let executableStats;
  try {
    executableStats = lstatSync(executable);
  } catch {
    throw new Error(`PACKAGED_EXECUTABLE_MISSING:${executable}`);
  }
  const extractionRoot = realpathSync(extractionDirectory);
  const resolvedExecutable = realpathSync(executable);
  const relativeExecutable = path.relative(extractionRoot, resolvedExecutable);
  const isContained = relativeExecutable !== ''
    && relativeExecutable !== '..'
    && !relativeExecutable.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relativeExecutable);
  if (executableStats.isSymbolicLink() || !executableStats.isFile() || !isContained) {
    throw new Error(`UNSAFE_PACKAGED_EXECUTABLE:${executable}`);
  }
  return resolvedExecutable;
}

export function createPackageTemporaryDirectories(
  createDirectory: (prefix: string) => OwnedPackageTemporaryDirectory = createPackageTemporaryDirectory,
): { extraction: OwnedPackageTemporaryDirectory; userData: OwnedPackageTemporaryDirectory } {
  const extraction = createDirectory('quiz-stage-package-smoke-extract-');
  try {
    return {
      extraction,
      userData: createDirectory('quiz-stage-package-smoke-user-data-'),
    };
  } catch (error: unknown) {
    removePackageTemporaryDirectory(extraction);
    throw error;
  }
}

export function smokePortable(
  request: PortableSmokeArguments,
  root = process.cwd(),
  platform: NodeJS.Platform = process.platform,
  arch = process.arch,
): void {
  if (request.target.forgePlatform !== platform || request.target.forgeArch !== arch) {
    throw new Error(`HOST_TARGET_MISMATCH:${platform}:${arch}:${request.target.id}`);
  }
  if (!existsSync(request.archive) || !statSync(request.archive).isFile()) {
    throw new Error(`PORTABLE_ARCHIVE_MISSING:${request.archive}`);
  }

  const temporaryDirectories = createPackageTemporaryDirectories();
  const extractionDirectory = temporaryDirectories.extraction.path;
  const userDataDirectory = temporaryDirectories.userData.path;
  try {
    extractArchive(request.target.forgePlatform, request.archive, extractionDirectory);
    const applicationPath = extractedApplicationPath(extractionDirectory, request.target);
    const executable = validatedPackagedExecutable(
      extractionDirectory,
      resolvePackagedExecutable(applicationPath, request.target),
    );
    if (request.target.forgePlatform === 'win32') {
      const marker = path.join(packagedResourcesDirectory(executable, request.target), 'portable.flag');
      if (!existsSync(marker) || !statSync(marker).isFile()) throw new Error('PORTABLE_MARKER_MISSING');
    } else {
      chmodSync(executable, 0o755);
    }

    execFileSync(process.execPath, [
      path.join(root, 'node_modules', '@playwright', 'test', 'cli.js'),
      'test',
      'tests/e2e/package-smoke.spec.ts',
    ], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        QUIZ_STAGE_PACKAGED_EXECUTABLE: executable,
        QUIZ_STAGE_PACKAGED_USER_DATA: userDataDirectory,
      },
    });
  } finally {
    removePackageTemporaryDirectory(temporaryDirectories.userData);
    removePackageTemporaryDirectory(temporaryDirectories.extraction);
  }
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    smokePortable(parsePortableSmokeArguments(process.argv.slice(2)));
  } catch (error: unknown) {
    console.error(error);
    process.exitCode = 1;
  }
}
