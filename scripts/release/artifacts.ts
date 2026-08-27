import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import type { ReleaseArtifact, ReleaseTarget } from './targets';

export function normalizedArtifactPath(
  root: string,
  _target: ReleaseTarget,
  artifact: ReleaseArtifact,
): string {
  return path.join(root, 'out', 'make', artifact.relativePath);
}

function forgeArtifactPattern(root: string, target: ReleaseTarget, artifact: ReleaseArtifact): string {
  if (target.id === 'windows-x64') {
    return artifact.kind === 'installer'
      ? path.join(root, 'out', 'make', 'squirrel.windows', 'x64', 'QuizStageSetup.exe')
      : normalizedArtifactPath(root, target, artifact);
  }
  if (target.forgePlatform === 'darwin') {
    return path.join(root, 'out', 'make', 'zip', 'darwin', target.forgeArch, '*.zip');
  }
  return artifact.kind === 'installer'
    ? path.join(root, 'out', 'make', 'deb', 'x64', '*.deb')
    : path.join(root, 'out', 'make', 'zip', 'linux', 'x64', '*.zip');
}

export function findForgeArtifact(
  root: string,
  target: ReleaseTarget,
  artifact: ReleaseArtifact,
): string {
  const candidates = globSync(forgeArtifactPattern(root, target, artifact), {
    windowsPathsNoEscape: true,
  });
  if (candidates.length !== 1) {
    throw new Error(`FORGE_ARTIFACT_NOT_UNIQUE:${target.id}:${artifact.kind}`);
  }
  const candidate = candidates[0]!;
  if (!statSync(candidate).isFile()) {
    throw new Error(`FORGE_ARTIFACT_NOT_FILE:${candidate}`);
  }
  return candidate;
}

export function normalizeArtifacts(root: string, target: ReleaseTarget): string[] {
  const artifacts = target.artifacts.map((artifact) => ({
    source: findForgeArtifact(root, target, artifact),
    destination: normalizedArtifactPath(root, target, artifact),
  }));

  for (const { source, destination } of artifacts) {
    if (source === destination) continue;
    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }
  return artifacts.map(({ destination }) => destination);
}
