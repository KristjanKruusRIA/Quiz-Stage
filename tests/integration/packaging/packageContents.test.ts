import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { expectedNativeModuleSuffix, packagedResourcesDirectory } from '../../../scripts/release/packageLayout';
import { normalizedArtifactPath } from '../../../scripts/release/artifacts';
import { releaseTargetFor } from '../../../scripts/release/targets';
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
  if (process.platform === 'win32') {
    const escapedArchivePath = archivePath.replace(/'/g, "''");
    const escapedExtractionRoot = extractionRoot.replace(/'/g, "''");
    execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      `Expand-Archive -LiteralPath '${escapedArchivePath}' -DestinationPath '${escapedExtractionRoot}' -Force`,
    ]);
  } else {
    execFileSync('unzip', ['-q', archivePath, '-d', extractionRoot]);
  }
  return extractionRoot;
}

function packagedExecutable(root: string, executableName: string): string {
  const matches = listAllFiles(root).filter((file) => path.basename(file) === executableName);
  if (matches.length !== 1) throw new Error('PACKAGED_EXECUTABLE_NOT_UNIQUE');
  return matches[0]!;
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
  const target = releaseTargetFor(process.platform, process.arch);
  const portable = target.artifacts.find((artifact) => artifact.kind === 'portable');
  if (portable === undefined) throw new Error('PORTABLE_ARTIFACT_MISSING');
  const portableArchive = normalizedArtifactPath(process.cwd(), target, portable);
  const packagePayloadPresent = fileExists(portableArchive);
  const expectedInstaller = path.join(process.cwd(), 'out', 'make', 'installer', 'QuizStageSetup.exe');
  const expectedInstallerPayload = installerPayloadPath();
  const expectedPortableZip = path.join(process.cwd(), 'out', 'make', 'portable', 'QuizStage-win32-x64.zip');
  const windowsPackagePayloadsPresent = process.platform === 'win32'
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

  it('points the Debian launcher at the packaged Linux executable', () => {
    const forgeConfig = readFileSync('forge.config.ts', 'utf8');

    expect(forgeConfig).toContain("bin: 'quiz-stage'");
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

  it('keeps the bundled audio attribution notice beside the media manifest', () => {
    expect(fileExists(path.join(process.cwd(), 'resources', 'media', 'THIRD_PARTY_NOTICES.md'))).toBe(true);
  });

  it.skipIf(!windowsPackagePayloadsPresent)('produces both Windows installer and portable package outputs', () => {
    expect(fileExists(expectedInstaller)).toBe(true);
    expect(fileExists(expectedPortableZip)).toBe(true);
  });

  it.skipIf(!packagePayloadPresent)('inspects the current platform portable package layout', () => {
    extractedPortable = extractArchive(portableArchive, 'quiz-stage-portable-contents-');
    const executablePath = packagedExecutable(
      extractedPortable,
      target.forgePlatform === 'win32' ? `${target.executableName}.exe` : target.executableName,
    );
    const resourcesPath = packagedResourcesDirectory(executablePath, target);
    const files = listAllFiles(extractedPortable);
    const report = JSON.parse(execFileSync(process.execPath, [
      path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      path.join(process.cwd(), 'scripts', 'inspect-package.ts'),
      '--target', target.id,
      '--app', executablePath,
    ], { encoding: 'utf8' })) as { target: string; executablePath: string; archivePath: string };

    expect(report.target).toBe(target.id);
    expect(report.executablePath).toBe(executablePath);
    expect(report.archivePath).toBe(path.join(resourcesPath, 'app.asar'));
    expect(files).toContain(path.join(resourcesPath, 'seed.sqlite'));
    expect(files).toContain(path.join(resourcesPath, 'media', 'manifest.json'));
    expect(files).toContain(path.join(resourcesPath, 'app.asar'));
    expect(files).toContain(path.join(
      resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'better-sqlite3',
      expectedNativeModuleSuffix(target),
    ));
    expectLicensedMedia(files);

    const portableFlag = path.join(resourcesPath, 'portable.flag');
    const portableUserData = path.join(path.dirname(executablePath), 'UserData', '.keep');
    expect(files.includes(portableFlag)).toBe(target.id === 'windows-x64');
    expect(files.includes(portableUserData)).toBe(target.id === 'windows-x64');
  }, 120_000);

  it.skipIf(!windowsPackagePayloadsPresent)('separates Windows installer and portable markers while retaining required assets', () => {
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
