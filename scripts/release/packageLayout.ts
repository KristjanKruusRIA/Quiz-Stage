import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { ReleaseTarget } from './targets';

function executableName(target: ReleaseTarget, name: string): string {
  return target.forgePlatform === 'win32'
    ? `${name}.exe`
    : name;
}

export function extractedApplicationPath(extractionDirectory: string, target: ReleaseTarget): string {
  if (target.forgePlatform === 'win32') return extractionDirectory;

  const expectedSuffix = target.forgePlatform === 'darwin'
    ? '.app'
    : `-${target.forgePlatform}-${target.forgeArch}`;
  const applications = readdirSync(extractionDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(expectedSuffix));
  if (applications.length !== 1) throw new Error('PACKAGED_APPLICATION_NOT_UNIQUE');
  return path.join(extractionDirectory, applications[0]!.name);
}

function resolveNamedExecutable(inputPath: string, target: ReleaseTarget, name: string): string {
  const applicationPath = path.normalize(inputPath);
  const expectedExecutable = executableName(target, name);
  if (path.basename(applicationPath) === expectedExecutable) return applicationPath;

  const publicExecutable = executableName(target, target.executableName);
  const applicationBinary = executableName(target, target.applicationExecutableName);
  if ([publicExecutable, applicationBinary].includes(path.basename(applicationPath))) {
    return path.join(path.dirname(applicationPath), expectedExecutable);
  }

  if (target.forgePlatform === 'darwin' && applicationPath.toLowerCase().endsWith('.app')) {
    return path.join(applicationPath, 'Contents', 'MacOS', expectedExecutable);
  }

  return path.join(applicationPath, expectedExecutable);
}

export function resolvePackagedExecutable(inputPath: string, target: ReleaseTarget): string {
  return resolveNamedExecutable(inputPath, target, target.executableName);
}

export function resolvePackagedApplicationBinary(inputPath: string, target: ReleaseTarget): string {
  return resolveNamedExecutable(inputPath, target, target.applicationExecutableName);
}

export function packagedResourcesDirectory(executablePath: string, target: ReleaseTarget): string {
  return target.forgePlatform === 'darwin'
    ? path.join(path.dirname(path.dirname(executablePath)), 'Resources')
    : path.join(path.dirname(executablePath), 'resources');
}

export function expectedNativeModuleSuffix(target: ReleaseTarget): string {
  return `prebuilds/${target.forgePlatform}-${target.forgeArch}.node`;
}
