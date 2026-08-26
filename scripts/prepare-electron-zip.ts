import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const runtimeDirectory = path.join(root, 'node_modules', 'electron', 'dist');
const electronVersion = (JSON.parse(readFileSync(path.join(root, 'node_modules', 'electron', 'package.json'), 'utf8')) as { version: string }).version;
const archiveDirectory = path.join(root, '.cache', 'electron-zips');
const archivePath = path.join(archiveDirectory, `electron-v${electronVersion}-win32-x64.zip`);

if (!existsSync(runtimeDirectory)) throw new Error(`LOCAL_ELECTRON_RUNTIME_MISSING:${runtimeDirectory}`);
if (!existsSync(archivePath)) {
  mkdirSync(archiveDirectory, { recursive: true });
  const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
  execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command',
    `Get-ChildItem -LiteralPath ${literal(runtimeDirectory)} | Compress-Archive -DestinationPath ${literal(archivePath)} -CompressionLevel Optimal -Force`,
  ], { stdio: 'inherit' });
}
if (!existsSync(archivePath)) throw new Error(`LOCAL_ELECTRON_ARCHIVE_MISSING:${archivePath}`);
