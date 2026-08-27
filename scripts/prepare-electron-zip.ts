import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export interface ElectronArchiveCommand {
  executable: string;
  args: string[];
  cwd?: string;
}

export function electronArchiveCommand(
  platform: NodeJS.Platform,
  runtimeDirectory: string,
  archivePath: string,
): ElectronArchiveCommand {
  if (platform === 'win32') {
    const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
    return {
      executable: 'powershell.exe',
      args: [
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command',
        `Get-ChildItem -LiteralPath ${literal(runtimeDirectory)} | Compress-Archive -DestinationPath ${literal(archivePath)} -CompressionLevel Optimal -Force`,
      ],
    };
  }
  if (platform === 'darwin' || platform === 'linux') {
    return {
      executable: 'zip',
      args: ['-qry', archivePath, '.'],
      cwd: runtimeDirectory,
    };
  }
  throw new Error(`UNSUPPORTED_ELECTRON_ARCHIVE_PLATFORM:${platform}`);
}

export function prepareElectronArchive(
  root = process.cwd(),
  platform: NodeJS.Platform = process.platform,
  arch = process.arch,
): string {
  const runtimeDirectory = path.join(root, 'node_modules', 'electron', 'dist');
  const electronVersion = (JSON.parse(readFileSync(
    path.join(root, 'node_modules', 'electron', 'package.json'),
    'utf8',
  )) as { version: string }).version;
  const archiveDirectory = path.join(root, '.cache', 'electron-zips');
  const archivePath = path.join(archiveDirectory, `electron-v${electronVersion}-${platform}-${arch}.zip`);

  if (!existsSync(runtimeDirectory)) throw new Error(`LOCAL_ELECTRON_RUNTIME_MISSING:${runtimeDirectory}`);
  if (!existsSync(archivePath)) {
    mkdirSync(archiveDirectory, { recursive: true });
    const command = electronArchiveCommand(platform, runtimeDirectory, archivePath);
    execFileSync(command.executable, command.args, {
      ...(command.cwd === undefined ? {} : { cwd: command.cwd }),
      stdio: 'inherit',
    });
  }
  if (!existsSync(archivePath)) throw new Error(`LOCAL_ELECTRON_ARCHIVE_MISSING:${archivePath}`);
  return archivePath;
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  prepareElectronArchive();
}
