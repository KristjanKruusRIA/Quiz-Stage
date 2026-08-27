import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { globSync } from 'glob';

interface DirectoryEntry {
  name: string;
  isDirectory: () => boolean;
}

function extractZip(zipPath: string, stageDirectory: string): string {
  const archive = zipPath.replaceAll("'", "''");
  const destination = stageDirectory.replaceAll("'", "''");
  execFileSync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `Expand-Archive -LiteralPath '${archive}' -DestinationPath '${destination}' -Force`,
  ]);
  const entries = readdirSync(stageDirectory, { withFileTypes: true }) as unknown as DirectoryEntry[];
  const directories = entries.filter((entry) => entry.isDirectory());
  return directories.length === 1 ? path.join(stageDirectory, directories[0]?.name ?? '') : stageDirectory;
}

function addPortableArtifacts(applicationRoot: string): void {
  const resourceRoot = path.join(applicationRoot, 'resources');
  mkdirSync(resourceRoot, { recursive: true });
  writeFileSync(path.join(resourceRoot, 'portable.flag'), '', { encoding: 'utf8' });
  const userDataRoot = path.join(applicationRoot, 'UserData');
  mkdirSync(userDataRoot, { recursive: true });
  writeFileSync(path.join(userDataRoot, '.keep'), '', { encoding: 'utf8' });
}

export function makePortable(root = process.cwd()): string {
  if (process.platform !== 'win32') throw new Error('PORTABLE_REQUIRES_WIN32');

  const zipOutput = path.join(root, 'out', 'make', 'zip', 'win32', 'x64');
  const portableOutput = path.join(root, 'out', 'make', 'portable');
  const portableArchive = path.join(portableOutput, 'QuizStage-win32-x64.zip');
  execFileSync(process.execPath, [
    path.join(root, 'node_modules', '@electron-forge', 'cli', 'dist', 'electron-forge.js'),
    'make',
    '--platform=win32',
    '--arch=x64',
    '--targets=@electron-forge/maker-zip',
  ], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, QUIZ_STAGE_PACKAGE_PROFILE: 'portable' },
  });

  const zipCandidates = globSync(path.join(zipOutput, '*.zip'), { windowsPathsNoEscape: true });
  if (zipCandidates.length !== 1) throw new Error('FORGE_ARTIFACT_NOT_UNIQUE:windows-x64:portable');
  const stageDirectory = mkdtempSync(path.join(tmpdir(), 'quiz-stage-portable-extracted-'));
  rmSync(stageDirectory, { recursive: true, force: true });
  try {
    const applicationRoot = extractZip(zipCandidates[0]!, stageDirectory);
    addPortableArtifacts(applicationRoot);
    mkdirSync(portableOutput, { recursive: true });
    rmSync(portableArchive, { force: true });
    const source = path.join(applicationRoot, '*').replaceAll("'", "''");
    const destination = portableArchive.replaceAll("'", "''");
    execFileSync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Compress-Archive -Path '${source}' -DestinationPath '${destination}' -CompressionLevel Optimal -Force`,
    ]);
  } finally {
    rmSync(stageDirectory, { recursive: true, force: true });
  }
  return portableArchive;
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  makePortable();
}
