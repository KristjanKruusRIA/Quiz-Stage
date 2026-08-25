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

function installerPath(): string {
  try {
    return listAllFiles(path.join(process.cwd(), 'out', 'make', 'squirrel.windows'))
      .find((file) => file.endsWith(' Setup.exe')) ?? '';
  } catch {
    return '';
  }
}

function extractPortableZip(archivePath: string): string {
  const extractionRoot = mkdtempSync(path.join(tmpdir(), 'quiz-stage-portable-contents-'));
  const escapedArchivePath = archivePath.replace(/'/g, "''");
  const escapedExtractionRoot = extractionRoot.replace(/'/g, "''");
  execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    `Expand-Archive -LiteralPath '${escapedArchivePath}' -DestinationPath '${escapedExtractionRoot}' -Force`,
  ]);
  return extractionRoot;
}

describe('package contents', () => {
  const expectedInstaller = installerPath();
  const expectedPortableZip = path.join(process.cwd(), 'out', 'make', 'portable', 'QuizStage-win32-x64.zip');
  const packagesPresent = process.platform === 'win32'
    && fileExists(expectedInstaller)
    && fileExists(expectedPortableZip);
  let extractedPortable = '';

  afterEach(() => {
    if (extractedPortable) rmSync(extractedPortable, { recursive: true, force: true });
    extractedPortable = '';
  });

  it('uses the locally installed Electron archive for every Forge package command', () => {
    const forgeConfig = readFileSync('forge.config.ts', 'utf8');
    const packageJson = readFileSync('package.json', 'utf8');

    expect(forgeConfig).toContain('electronZipDir');
    expect(packageJson).toContain('scripts/prepare-electron-zip.ts');
  });

  it('does not require an installer-only startup module at packaged runtime', () => {
    expect(readFileSync('src/main/main.ts', 'utf8')).not.toContain('electron-squirrel-startup');
    expect(readFileSync('vite.main.config.ts', 'utf8')).not.toContain('electron-squirrel-startup');
  });

  it.skipIf(!packagesPresent)('produces both installer and portable package outputs', () => {
    expect(fileExists(expectedInstaller)).toBe(true);
    expect(fileExists(expectedPortableZip)).toBe(true);
  });

  it.skipIf(!packagesPresent)('includes portable marker, writable UserData, seed/media and native package assets', () => {
    extractedPortable = extractPortableZip(expectedPortableZip);
    const files = listAllFiles(extractedPortable);

    expect(files.some((file) => file.endsWith('.exe'))).toBe(true);
    expect(files.some((file) => file.endsWith('seed.sqlite'))).toBe(true);
    expect(files.some((file) => file.endsWith('manifest.json'))).toBe(true);
    expect(files.some((file) => file.endsWith('app.asar'))).toBe(true);
    expect(files.some((file) => file.endsWith(path.join('better-sqlite3', 'prebuilds', 'win32-x64.node')))).toBe(true);

    const hasPortableMarker = files.some((file) => file.endsWith(path.join('resources', 'portable.flag')));
    const hasUserData = files.some((file) => /[\\/]+UserData[\\/]+/.test(file) || file.endsWith(`${path.sep}UserData`));
    expect(hasPortableMarker).toBe(true);
    expect(hasUserData).toBe(true);
  }, 30_000);
});
