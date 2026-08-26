import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AUDIO_ASSET_KEYS, mediaManifestSchema } from '../../../src/shared/media/contracts';

function fileExists(candidate: string): boolean {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function listAllFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listAllFiles(entryPath);
    return [entryPath];
  });
}

function installerPayloadPath(): string {
  try {
    return listAllFiles(path.join(process.cwd(), 'out', 'make', 'squirrel.windows'))
      .find((file) => file.endsWith('-full.nupkg')) ?? '';
  } catch {
    return '';
  }
}

function extractArchive(archivePath: string, prefix: string): string {
  const extractionRoot = mkdtempSync(path.join(tmpdir(), prefix));
  const escapedArchivePath = archivePath.replace(/'/g, "''");
  const escapedExtractionRoot = extractionRoot.replace(/'/g, "''");
  execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    `Expand-Archive -LiteralPath '${escapedArchivePath}' -DestinationPath '${escapedExtractionRoot}' -Force`,
  ]);
  return extractionRoot;
}

function applicationExecutables(files: string[]): string[] {
  return files.filter((file) => {
    const executable = path.basename(file).toLowerCase();
    return executable.endsWith('.exe')
      && executable !== 'squirrel.exe'
      && !executable.endsWith('_executionstub.exe');
  });
}

function expectLicensedMedia(files: string[]): void {
  const manifestPath = files.find((file) => file.endsWith(path.join('media', 'manifest.json')));
  expect(manifestPath).toBeDefined();
  if (manifestPath === undefined) return;

  const mediaDirectory = path.dirname(manifestPath);
  const manifest = mediaManifestSchema.parse(JSON.parse(readFileSync(manifestPath, 'utf8')));
  expect(files).toContain(path.join(mediaDirectory, 'THIRD_PARTY_NOTICES.md'));
  for (const key of AUDIO_ASSET_KEYS) {
    const entry = manifest.assets[key];
    const digest = createHash('sha256').update(readFileSync(path.join(mediaDirectory, entry.file))).digest('hex');
    expect(digest).toBe(entry.sha256);
  }
}

describe('package contents', () => {
  const expectedInstaller = path.join(process.cwd(), 'out', 'make', 'installer', 'QuizStageSetup.exe');
  const expectedInstallerPayload = installerPayloadPath();
  const expectedPortableZip = path.join(process.cwd(), 'out', 'make', 'portable', 'QuizStage-win32-x64.zip');
  const packagePayloadsPresent = process.platform === 'win32'
    && fileExists(expectedInstallerPayload) && fileExists(expectedPortableZip);
  let extractedPortable = '';
  let extractedInstaller = '';

  afterEach(() => {
    if (extractedPortable) rmSync(extractedPortable, { recursive: true, force: true });
    if (extractedInstaller) rmSync(extractedInstaller, { recursive: true, force: true });
    extractedPortable = '';
    extractedInstaller = '';
  });

  it('uses the locally installed Electron archive for every Forge package command', () => {
    const forgeConfig = readFileSync('forge.config.ts', 'utf8');
    const packageJson = readFileSync('package.json', 'utf8');

    expect(forgeConfig).toContain('electronZipDir');
    expect(packageJson).toContain('scripts/prepare-electron-zip.ts');
    expect(JSON.parse(packageJson).scripts.build).toContain('prepare-electron-zip.ts');
    expect(packageJson).toContain('"productName": "Quiz Stage"');
  });

  it('does not require an installer-only startup module at packaged runtime', () => {
    expect(readFileSync('src/main/main.ts', 'utf8')).not.toContain('electron-squirrel-startup');
    expect(readFileSync('vite.main.config.ts', 'utf8')).not.toContain('electron-squirrel-startup');
  });

  it('keeps the bundled audio attribution notice beside the media manifest', () => {
    expect(fileExists(path.join(process.cwd(), 'resources', 'media', 'THIRD_PARTY_NOTICES.md'))).toBe(true);
  });

  it.skipIf(!packagePayloadsPresent)('produces both installer and portable package outputs', () => {
    expect(fileExists(expectedInstaller)).toBe(true);
    expect(fileExists(expectedPortableZip)).toBe(true);
  });

  it.skipIf(!packagePayloadsPresent)('separates installer and portable markers while retaining required assets', () => {
    extractedInstaller = extractArchive(expectedInstallerPayload, 'quiz-stage-installer-contents-');
    extractedPortable = extractArchive(expectedPortableZip, 'quiz-stage-portable-contents-');
    const installerFiles = listAllFiles(extractedInstaller);
    const portableFiles = listAllFiles(extractedPortable);

    for (const files of [installerFiles, portableFiles]) {
      const executables = applicationExecutables(files);
      expect(executables).toHaveLength(1);
      expect(path.basename(executables[0] ?? '')).toBe('Quiz Stage.exe');
      expect(files.some((file) => file.endsWith('seed.sqlite'))).toBe(true);
      expect(files.some((file) => file.endsWith('manifest.json'))).toBe(true);
      expect(files.some((file) => file.endsWith('app.asar'))).toBe(true);
      expect(files.some((file) => file.endsWith(path.join('better-sqlite3', 'prebuilds', 'win32-x64.node')))).toBe(true);
      expectLicensedMedia(files);
    }

    expect(installerFiles.some((file) => file.endsWith(path.join('resources', 'portable.flag')))).toBe(false);
    expect(portableFiles).toContain(path.join(extractedPortable, 'Quiz Stage.exe'));
    expect(portableFiles).toContain(path.join(extractedPortable, 'resources', 'portable.flag'));
    expect(portableFiles).toContain(path.join(extractedPortable, 'UserData', '.keep'));
  }, 120_000);
});
