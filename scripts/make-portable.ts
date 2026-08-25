import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const PORTABLE_OUT = path.join(ROOT, 'out', 'make', 'portable');
const ZIP_OUT = path.join(ROOT, 'out', 'make', 'zip', 'win32', 'x64');
const PORTABLE_ARCHIVE = path.join(PORTABLE_OUT, 'QuizStage-win32-x64.zip');

interface DirectoryEntry {
  name: string;
  isDirectory: () => boolean;
}

function requireWindows(): void {
  if (process.platform !== 'win32') {
    throw new Error('Portable packaging is implemented for win32 only');
  }
}

function runForgeZipBuild(): string {
  execSync('npx electron-forge make --targets=@electron-forge/maker-zip --platform=win32 --arch=x64', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, QUIZ_STAGE_PACKAGE_PROFILE: 'portable' },
  });

  const zipCandidates = readdirSync(ZIP_OUT)
    .filter((entry) => entry.endsWith('.zip'))
    .sort()
    .map((entry) => path.join(ZIP_OUT, entry));
  if (zipCandidates.length === 0) throw new Error('PORTABLE_ZIP_MISSING');
  return zipCandidates.at(-1)!;
}

function extractZip(zipPath: string, stageDirectory: string): string {
  const command = [
    'Expand-Archive',
    `-Path "${zipPath}"`,
    `-DestinationPath "${stageDirectory}"`,
    '-Force',
  ].join(' ');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`);
  const entries = readdirSync(stageDirectory, { withFileTypes: true }) as unknown as DirectoryEntry[];
  const directories = entries.filter((entry) => entry.isDirectory());
  return directories.length === 1 ? path.join(stageDirectory, directories[0]?.name ?? '') : stageDirectory;
}

function rezipPortable(root: string): void {
  const command = [
    'Compress-Archive',
    `-Path "${root}"`,
    `-DestinationPath "${PORTABLE_ARCHIVE}"`,
    '-CompressionLevel Optimal',
    '-Force',
  ].join(' ');
  mkdirSync(PORTABLE_OUT, { recursive: true });
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`);
}

function addPortableArtifacts(applicationRoot: string): void {
  const resourceRoot = path.join(applicationRoot, 'resources');
  mkdirSync(resourceRoot, { recursive: true });
  const markerPath = path.join(resourceRoot, 'portable.flag');
  writeFileSync(markerPath, '', { encoding: 'utf8' });
  const userDataRoot = path.join(applicationRoot, 'UserData');
  mkdirSync(userDataRoot, { recursive: true });
  writeFileSync(path.join(userDataRoot, '.keep'), '', { encoding: 'utf8' });
}

function main(): void {
  requireWindows();
  const zipPath = runForgeZipBuild();
  const stageDirectory = mkdtempSync(path.join(tmpdir(), 'quiz-stage-portable-extracted-'));
  rmSync(stageDirectory, { recursive: true, force: true });
  const applicationRoot = extractZip(zipPath, stageDirectory);
  addPortableArtifacts(applicationRoot);
  rmSync(PORTABLE_ARCHIVE, { force: true });
  rezipPortable(applicationRoot);
}

main();
