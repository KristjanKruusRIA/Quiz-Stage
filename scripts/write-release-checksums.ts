import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { releaseTargetForId, type ReleaseTarget } from './release/targets';

function comparePaths(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function hashFile(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function checksumLinesForPaths(files: readonly { filePath: string; displayPath: string }[]): string[] {
  return [...files]
    .sort((left, right) => comparePaths(left.displayPath, right.displayPath))
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

function assertUniqueArtifacts(target: ReleaseTarget): void {
  const expectedPaths = new Set<string>();
  for (const artifact of target.artifacts) {
    if (expectedPaths.has(artifact.relativePath)) {
      throw new Error(`DUPLICATE_RELEASE_ARTIFACT:${target.id}:${artifact.relativePath}`);
    }
    expectedPaths.add(artifact.relativePath);
  }
}

export function writeReleaseChecksums(target: ReleaseTarget, packageRoot: string): string {
  const resolvedPackageRoot = path.resolve(packageRoot);
  assertUniqueArtifacts(target);

  const files = target.artifacts.map((artifact) => {
    const filePath = path.resolve(resolvedPackageRoot, artifact.relativePath);
    if (!isWithin(resolvedPackageRoot, filePath)) {
      throw new Error(`RELEASE_ARTIFACT_OUTSIDE_PACKAGE_ROOT:${target.id}:${artifact.relativePath}`);
    }
    if (!existsSync(filePath)) {
      throw new Error(`RELEASE_ARTIFACT_NOT_FOUND:${target.id}:${artifact.relativePath}`);
    }
    if (!statSync(filePath).isFile()) {
      throw new Error(`RELEASE_ARTIFACT_NOT_FILE:${target.id}:${artifact.relativePath}`);
    }
    return { filePath, displayPath: artifact.relativePath.replaceAll('\\', '/') };
  });

  const destination = path.join(resolvedPackageRoot, `release-checksums-${target.id}.txt`);
  if (!isWithin(resolvedPackageRoot, destination)) {
    throw new Error(`RELEASE_CHECKSUM_DESTINATION_OUTSIDE_PACKAGE_ROOT:${target.id}`);
  }
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
