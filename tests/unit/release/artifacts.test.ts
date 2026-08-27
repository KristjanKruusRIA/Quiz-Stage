import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildMacosIcon } from '../../../scripts/build-macos-icon';
import { assertHostMatchesTarget, forgeMakeArguments, parseReleaseTarget } from '../../../scripts/make-platform';
import { electronArchiveCommand, prepareElectronArchive } from '../../../scripts/prepare-electron-zip';
import { findForgeArtifact, normalizeArtifacts, normalizedArtifactPath } from '../../../scripts/release/artifacts';
import { releaseTargetForId } from '../../../scripts/release/targets';

const roots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'quiz-stage-artifacts-'));
  roots.push(root);
  return root;
}

function createFile(filePath: string, contents = path.basename(filePath)): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('release artifact normalization', () => {
  it('normalizes every Windows output without changing the portable contract', () => {
    const root = temporaryRoot();
    const target = releaseTargetForId('windows-x64');
    createFile(path.join(root, 'out', 'make', 'squirrel.windows', 'x64', 'QuizStageSetup.exe'), 'installer');
    createFile(path.join(root, 'out', 'make', 'portable', 'QuizStage-win32-x64.zip'), 'portable');

    expect(normalizeArtifacts(root, target)).toEqual([
      path.join(root, 'out', 'make', 'installer', 'QuizStageSetup.exe'),
      path.join(root, 'out', 'make', 'portable', 'QuizStage-win32-x64.zip'),
    ]);
    expect(readFileSync(path.join(root, 'out', 'make', 'installer', 'QuizStageSetup.exe'), 'utf8')).toBe('installer');
    expect(readFileSync(path.join(root, 'out', 'make', 'portable', 'QuizStage-win32-x64.zip'), 'utf8')).toBe('portable');
  });

  it.each([
    ['macos-arm64', 'arm64', 'Quiz Stage-arm64-0.1.0.zip', 'QuizStage-darwin-arm64.zip'],
    ['macos-x64', 'x64', 'Quiz Stage-x64-0.1.0.zip', 'QuizStage-darwin-x64.zip'],
  ] as const)('normalizes the %s portable output', (targetId, arch, forgeName, normalizedName) => {
    const root = temporaryRoot();
    const target = releaseTargetForId(targetId);
    createFile(path.join(root, 'out', 'make', 'zip', 'darwin', arch, forgeName));

    expect(normalizeArtifacts(root, target)).toEqual([
      path.join(root, 'out', 'make', 'portable', normalizedName),
    ]);
    expect(normalizedArtifactPath(root, target, target.artifacts[0]!)).toBe(
      path.join(root, 'out', 'make', 'portable', normalizedName),
    );
    expect(readFileSync(path.join(root, 'out', 'make', 'portable', normalizedName), 'utf8')).toBe(forgeName);
  });

  it('normalizes every Ubuntu output', () => {
    const root = temporaryRoot();
    const target = releaseTargetForId('ubuntu-x64');
    createFile(path.join(root, 'out', 'make', 'deb', 'x64', 'quiz-stage_0.1.0_amd64.deb'), 'installer');
    createFile(path.join(root, 'out', 'make', 'zip', 'linux', 'x64', 'Quiz Stage-linux-x64-0.1.0.zip'), 'portable');

    expect(normalizeArtifacts(root, target)).toEqual([
      path.join(root, 'out', 'make', 'installer', 'quiz-stage_0.1.0_amd64.deb'),
      path.join(root, 'out', 'make', 'portable', 'QuizStage-linux-x64.zip'),
    ]);
    expect(normalizedArtifactPath(root, target, target.artifacts[0]!)).toMatch(
      /out[\\/]make[\\/]installer[\\/]quiz-stage_0\.1\.0_amd64\.deb$/,
    );
    expect(readFileSync(path.join(root, 'out', 'make', 'installer', 'quiz-stage_0.1.0_amd64.deb'), 'utf8')).toBe('installer');
    expect(readFileSync(path.join(root, 'out', 'make', 'portable', 'QuizStage-linux-x64.zip'), 'utf8')).toBe('portable');
  });

  it('rejects duplicate Forge candidates', () => {
    const root = temporaryRoot();
    const target = releaseTargetForId('macos-arm64');
    createFile(path.join(root, 'out', 'make', 'zip', 'darwin', 'arm64', 'first.zip'));
    createFile(path.join(root, 'out', 'make', 'zip', 'darwin', 'arm64', 'second.zip'));

    expect(() => findForgeArtifact(root, target, target.artifacts[0]!)).toThrow('FORGE_ARTIFACT_NOT_UNIQUE');
  });

  it('rejects a matching directory instead of copying it as an artifact', () => {
    const root = temporaryRoot();
    const target = releaseTargetForId('macos-x64');
    mkdirSync(path.join(root, 'out', 'make', 'zip', 'darwin', 'x64', 'not-a-file.zip'), { recursive: true });

    expect(() => findForgeArtifact(root, target, target.artifacts[0]!)).toThrow('FORGE_ARTIFACT_NOT_FILE');
  });
});

describe('Electron archive commands', () => {
  it('uses PowerShell compression on Windows', () => {
    expect(electronArchiveCommand('win32', 'C:\\runtime', 'C:\\cache\\electron.zip')).toEqual({
      executable: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        "Get-ChildItem -LiteralPath 'C:\\runtime' | Compress-Archive -DestinationPath 'C:\\cache\\electron.zip' -CompressionLevel Optimal -Force",
      ],
    });
  });

  it.each(['darwin', 'linux'] as const)('uses zip from the runtime directory on %s', (platform) => {
    expect(electronArchiveCommand(platform, '/runtime', '/cache/electron.zip')).toEqual({
      executable: 'zip',
      args: ['-qry', '/cache/electron.zip', '.'],
      cwd: '/runtime',
    });
  });

  it('keys the local archive by Electron version, host platform, and architecture', () => {
    const root = temporaryRoot();
    mkdirSync(path.join(root, 'node_modules', 'electron', 'dist'), { recursive: true });
    createFile(path.join(root, 'node_modules', 'electron', 'package.json'), '{"version":"43.3.0"}');
    const archivePath = path.join(root, '.cache', 'electron-zips', 'electron-v43.3.0-darwin-arm64.zip');
    createFile(archivePath);

    expect(prepareElectronArchive(root, 'darwin', 'arm64')).toBe(archivePath);
  });
});

describe('macOS icon building', () => {
  it('rejects non-macOS hosts before invoking native tools', () => {
    expect(() => buildMacosIcon('/project', 'win32')).toThrow('MACOS_ICON_REQUIRES_DARWIN');
  });
});

describe('platform build command', () => {
  it('parses exactly one validated target', () => {
    expect(parseReleaseTarget(['--target', 'ubuntu-x64']).id).toBe('ubuntu-x64');
    expect(() => parseReleaseTarget([])).toThrow('EXPECTED_SINGLE_RELEASE_TARGET');
    expect(() => parseReleaseTarget(['--target', 'not-a-target'])).toThrow('UNKNOWN_RELEASE_TARGET:not-a-target');
  });

  it('rejects a target that does not match the current host', () => {
    const target = releaseTargetForId('macos-arm64');

    expect(() => assertHostMatchesTarget(target, 'darwin', 'arm64')).not.toThrow();
    expect(() => assertHostMatchesTarget(target, 'darwin', 'x64')).toThrow(
      'HOST_TARGET_MISMATCH:darwin:x64:macos-arm64',
    );
  });

  it('passes explicit platform, architecture, and makers to Forge', () => {
    expect(forgeMakeArguments(releaseTargetForId('ubuntu-x64'))).toEqual([
      'make',
      '--platform=linux',
      '--arch=x64',
      '--targets=@electron-forge/maker-deb,@electron-forge/maker-zip',
    ]);
  });
});
