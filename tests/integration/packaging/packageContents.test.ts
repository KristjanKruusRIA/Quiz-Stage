import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

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

  it('selects native package and runtime icons for each platform', () => {
    const forgeConfig = readFileSync('forge.config.ts', 'utf8');
    const main = readFileSync('src/main/main.ts', 'utf8');

    expect(forgeConfig).toContain("'.cache', 'icons', 'QuizStage.icns'");
    expect(forgeConfig).toContain("'resources', 'media', 'icon.ico'");
    expect(forgeConfig).toContain("'resources', 'media', 'icon-source.png'");
    expect(main).toContain("path.join(process.resourcesPath, 'media', 'icon-source.png')");
  });

  it('exposes the native platform build entry points', () => {
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;

    expect(scripts['make:platform']).toBe('tsx scripts/make-platform.ts');
    expect(scripts['make:macos-arm64']).toBe('npm run make:platform -- --target macos-arm64');
    expect(scripts['make:macos-x64']).toBe('npm run make:platform -- --target macos-x64');
    expect(scripts['make:ubuntu-x64']).toBe('npm run make:platform -- --target ubuntu-x64');
    expect(scripts['make:installer']).toContain('scripts/make-installer.ts');
    expect(scripts['make:portable']).toContain('scripts/make-portable.ts');
  });

  it('does not require an installer-only startup module at packaged runtime', () => {
    expect(readFileSync('src/main/main.ts', 'utf8')).not.toContain('electron-squirrel-startup');
    expect(readFileSync('vite.main.config.ts', 'utf8')).not.toContain('electron-squirrel-startup');
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
    }

    expect(installerFiles.some((file) => file.endsWith(path.join('resources', 'portable.flag')))).toBe(false);
    expect(portableFiles).toContain(path.join(extractedPortable, 'Quiz Stage.exe'));
    expect(portableFiles).toContain(path.join(extractedPortable, 'resources', 'portable.flag'));
    expect(portableFiles).toContain(path.join(extractedPortable, 'UserData', '.keep'));
  }, 120_000);
});
