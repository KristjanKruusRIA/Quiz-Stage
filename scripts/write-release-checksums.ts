import { createHash } from 'node:crypto';
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { releaseTargetForId, type ReleaseTarget } from './release/targets';

function comparePaths(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function hashFile(filePath: string): string {
  const descriptor = openSync(filePath, 'r');
  const hash = createHash('sha256');
  const buffer = Buffer.allocUnsafe(64 * 1024);

  try {
    for (let bytesRead = readSync(descriptor, buffer, 0, buffer.length, null); bytesRead > 0; bytesRead = readSync(descriptor, buffer, 0, buffer.length, null)) {
      hash.update(buffer.subarray(0, bytesRead));
    }
    return hash.digest('hex');
  } finally {
    closeSync(descriptor);
  }
}

function checksumLinesForPaths(files: readonly { filePath: string; displayPath: string }[]): string[] {
  return [...files]
    .sort((left, right) => (
      comparePaths(path.basename(left.displayPath), path.basename(right.displayPath))
      || comparePaths(left.displayPath, right.displayPath)
    ))
    .map(({ filePath, displayPath }) => `${hashFile(filePath)}  ${displayPath}`);
}

export function checksumLines(files: readonly string[]): string[] {
  return checksumLinesForPaths(files.map((filePath) => ({
    filePath,
    displayPath: path.basename(filePath),
  })));
}

function isWithin(root: string, candidate: string): boolean {
  const relativePath = path.relative(root, candidate);
  return relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

export function writeReleaseChecksums(target: ReleaseTarget, packageRoot: string): string {
  const resolvedPackageRoot = path.resolve(packageRoot);
  const canonicalPackageRoot = realpathSync.native(resolvedPackageRoot);
  const destination = path.join(resolvedPackageRoot, `release-checksums-${target.id}.txt`);
  if (lstatSync(destination, { throwIfNoEntry: false })?.isSymbolicLink()) {
    throw new Error(`RELEASE_CHECKSUM_DESTINATION_IS_SYMLINK:${target.id}`);
  }
  const canonicalDestination = path.join(
    realpathSync.native(path.dirname(destination)),
    path.basename(destination),
  );
  if (!isWithin(canonicalPackageRoot, canonicalDestination)) {
    throw new Error(`RELEASE_CHECKSUM_DESTINATION_OUTSIDE_PACKAGE_ROOT:${target.id}`);
  }

  const expectedPaths = new Set<string>();
  const files = target.artifacts.map((artifact) => {
    const filePath = path.resolve(resolvedPackageRoot, artifact.relativePath.replaceAll('\\', path.sep));
    if (!isWithin(resolvedPackageRoot, filePath)) {
      throw new Error(`RELEASE_ARTIFACT_OUTSIDE_PACKAGE_ROOT:${target.id}:${artifact.relativePath}`);
    }
    const declaredDisplayPath = path.relative(resolvedPackageRoot, filePath).replaceAll('\\', '/');
    if (filePath === destination) {
      throw new Error(`RELEASE_ARTIFACT_IS_CHECKSUM_FILE:${target.id}:${declaredDisplayPath}`);
    }
    if (!existsSync(filePath)) {
      throw new Error(`RELEASE_ARTIFACT_NOT_FOUND:${target.id}:${artifact.relativePath}`);
    }
    const canonicalFilePath = realpathSync.native(filePath);
    if (!isWithin(canonicalPackageRoot, canonicalFilePath)) {
      throw new Error(`RELEASE_ARTIFACT_OUTSIDE_PACKAGE_ROOT:${target.id}:${artifact.relativePath}`);
    }
    const displayPath = path.relative(canonicalPackageRoot, canonicalFilePath).replaceAll('\\', '/');
    if (expectedPaths.has(canonicalFilePath)) {
      throw new Error(`DUPLICATE_RELEASE_ARTIFACT:${target.id}:${displayPath}`);
    }
    if (canonicalFilePath === canonicalDestination) {
      throw new Error(`RELEASE_ARTIFACT_IS_CHECKSUM_FILE:${target.id}:${displayPath}`);
    }
    if (!statSync(canonicalFilePath).isFile()) {
      throw new Error(`RELEASE_ARTIFACT_NOT_FILE:${target.id}:${artifact.relativePath}`);
    }
    expectedPaths.add(canonicalFilePath);
    return { filePath: canonicalFilePath, displayPath };
  });

  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${checksumLinesForPaths(files).join('\n')}\n`, 'utf8');
  return destination;
}

function parseOptions(args: string[]): { target: ReleaseTarget; packageRoot: string } {
  if (args.length !== 4 || args[0] !== '--target' || args[2] !== '--package-root') {
    throw new Error('EXPECTED_RELEASE_CHECKSUM_OPTIONS');
  }
  return { target: releaseTargetForId(args[1]!), packageRoot: args[3]! };
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const { target, packageRoot } = parseOptions(process.argv.slice(2));
  console.log(writeReleaseChecksums(target, packageRoot));
}
