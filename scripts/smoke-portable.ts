import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  extractArchive,
  validatedPackageTemporaryDirectory,
} from './release/extractArchive';
import {
  packagedResourcesDirectory,
  resolvePackagedExecutable,
} from './release/packageLayout';
import { releaseTargetForId, type ReleaseTarget } from './release/targets';

export interface PortableSmokeArguments {
  target: ReleaseTarget;
  archive: string;
}

export function portableSmokeCliArguments(args: string[], lifecycleEvent: string | undefined): string[] {
  if (lifecycleEvent === 'smoke:portable' && args.length === 2) {
    return ['--target', args[0]!, '--archive', args[1]!];
  }
  return args;
}

export function parsePortableSmokeArguments(args: string[]): PortableSmokeArguments {
  if (
    args.length !== 4
    || args[0] !== '--target'
    || args[1] === undefined
    || args[2] !== '--archive'
    || args[3] === undefined
  ) {
    throw new Error('EXPECTED_PORTABLE_SMOKE_ARGUMENTS');
  }
  return {
    target: releaseTargetForId(args[1]),
    archive: path.resolve(args[3]),
  };
}

function extractedApplicationPath(extractionDirectory: string, target: ReleaseTarget): string {
  if (target.forgePlatform !== 'darwin') return extractionDirectory;

  const applications = readdirSync(extractionDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('.app'));
  if (applications.length !== 1) throw new Error('PACKAGED_APPLICATION_NOT_UNIQUE');
  return path.join(extractionDirectory, applications[0]!.name);
}

function removePackageTemporaryDirectory(directory: string): void {
  if (!existsSync(directory)) return;
  rmSync(validatedPackageTemporaryDirectory(directory), { recursive: true, force: true });
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

  const extractionDirectory = mkdtempSync(path.join(tmpdir(), 'quiz-stage-package-smoke-extract-'));
  const userDataDirectory = mkdtempSync(path.join(tmpdir(), 'quiz-stage-package-smoke-user-data-'));
  try {
    extractArchive(request.target.forgePlatform, request.archive, extractionDirectory);
    const applicationPath = extractedApplicationPath(extractionDirectory, request.target);
    const executable = resolvePackagedExecutable(applicationPath, request.target);
    if (!existsSync(executable) || !statSync(executable).isFile()) {
      throw new Error(`PACKAGED_EXECUTABLE_MISSING:${executable}`);
    }
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
    removePackageTemporaryDirectory(userDataDirectory);
    removePackageTemporaryDirectory(extractionDirectory);
  }
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = portableSmokeCliArguments(process.argv.slice(2), process.env.npm_lifecycle_event);
    smokePortable(parsePortableSmokeArguments(args));
  } catch (error: unknown) {
    console.error(error);
    process.exitCode = 1;
  }
}
