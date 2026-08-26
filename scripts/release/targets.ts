export type ReleaseTargetId = 'windows-x64' | 'macos-arm64' | 'macos-x64' | 'ubuntu-x64';
export type PackageProfile = 'all' | 'installer' | 'portable';
export type MakerName = 'squirrel' | 'zip' | 'deb';

export interface ReleaseArtifact {
  kind: 'installer' | 'portable';
  relativePath: string;
}

export interface ReleaseTarget {
  id: ReleaseTargetId;
  forgePlatform: 'win32' | 'darwin' | 'linux';
  forgeArch: 'x64' | 'arm64';
  executableName: string;
  applicationExecutableName: string;
  artifacts: readonly ReleaseArtifact[];
}

function target(
  id: ReleaseTargetId,
  forgePlatform: ReleaseTarget['forgePlatform'],
  forgeArch: ReleaseTarget['forgeArch'],
  executableName: string,
  applicationExecutableName: string,
  artifacts: ReleaseArtifact[],
): ReleaseTarget {
  return Object.freeze({
    id,
    forgePlatform,
    forgeArch,
    executableName,
    applicationExecutableName,
    artifacts: Object.freeze(artifacts.map((artifact) => Object.freeze(artifact))),
  });
}

const targets = [
  target('windows-x64', 'win32', 'x64', 'Quiz Stage', 'Quiz Stage', [
    { kind: 'installer', relativePath: 'installer/QuizStageSetup.exe' },
    { kind: 'portable', relativePath: 'portable/QuizStage-win32-x64.zip' },
  ]),
  target('macos-arm64', 'darwin', 'arm64', 'Quiz Stage', 'Quiz Stage', [
    { kind: 'portable', relativePath: 'portable/QuizStage-darwin-arm64.zip' },
  ]),
  target('macos-x64', 'darwin', 'x64', 'Quiz Stage', 'Quiz Stage', [
    { kind: 'portable', relativePath: 'portable/QuizStage-darwin-x64.zip' },
  ]),
  target('ubuntu-x64', 'linux', 'x64', 'quiz-stage', 'quiz-stage-bin', [
    { kind: 'installer', relativePath: 'installer/quiz-stage_0.1.0_amd64.deb' },
    { kind: 'portable', relativePath: 'portable/QuizStage-linux-x64.zip' },
  ]),
] as const;

const makersByTarget: Record<ReleaseTargetId, readonly MakerName[]> = {
  'windows-x64': ['squirrel', 'zip'],
  'macos-arm64': ['zip'],
  'macos-x64': ['zip'],
  'ubuntu-x64': ['deb', 'zip'],
};

export function releaseTargetFor(platform: NodeJS.Platform, arch: string): ReleaseTarget {
  const releaseTarget = targets.find((target) => target.forgePlatform === platform && target.forgeArch === arch);
  if (!releaseTarget) throw new Error(`UNSUPPORTED_RELEASE_TARGET:${platform}:${arch}`);
  return releaseTarget;
}

export function releaseTargetForId(id: string): ReleaseTarget {
  const releaseTarget = targets.find((target) => target.id === id);
  if (!releaseTarget) throw new Error(`UNKNOWN_RELEASE_TARGET:${id}`);
  return releaseTarget;
}

export function makerNamesFor(target: ReleaseTarget, profile: PackageProfile): MakerName[] {
  const makers = makersByTarget[target.id];
  if (profile === 'all') return [...makers];

  return makers.filter((maker) => (
    profile === 'installer' ? maker === 'squirrel' || maker === 'deb' : maker === 'zip'
  ));
}
