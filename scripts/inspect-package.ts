import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { extractFile, listPackage } from '@electron/asar';
import {
  FuseV1Options,
  getCurrentFuseWire,
} from '@electron/fuses';
import { globSync } from 'glob';

const fuseState = {
  disabled: '0'.charCodeAt(0),
  enabled: '1'.charCodeAt(0),
} as const;

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function packagedExecutable(): string {
  const requested = argumentValue('--app');
  if (requested !== undefined) {
    const resolved = path.resolve(requested);
    if (resolved.toLowerCase().endsWith('.exe')) return resolved;
    const matches = globSync('*.exe', { cwd: resolved, absolute: true, nodir: true });
    if (matches.length === 1) return matches[0];
    throw new Error('PACKAGED_EXECUTABLE_NOT_UNIQUE');
  }
  const matches = globSync('out/*-win32-x64/*.exe', { absolute: true, nodir: true })
    .filter((candidate) => !candidate.toLowerCase().endsWith('squirrel.exe'));
  if (matches.length !== 1) throw new Error('PACKAGED_EXECUTABLE_NOT_UNIQUE');
  return matches[0];
}

function assertFuse(
  wire: Awaited<ReturnType<typeof getCurrentFuseWire>>,
  option: FuseV1Options,
  expected: number,
): void {
  if (wire[option] !== expected) {
    throw new Error(`INVALID_FUSE:${FuseV1Options[option]}`);
  }
}

function rendererEntryName(entry: string): string {
  return entry.replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

function assertOfflineRenderer(archivePath: string): { files: number; html: string } {
  const entries = listPackage(archivePath, { isPack: false })
    .map((archiveEntry) => ({
      archiveEntry: archiveEntry.replace(/^[/\\]+/, ''),
      name: rendererEntryName(archiveEntry),
    }))
    .filter((entry) => entry.name.startsWith('.vite/renderer/'));
  const htmlEntry = entries.find((entry) => entry.name.endsWith('/index.html'));
  if (htmlEntry === undefined) throw new Error('PACKAGED_RENDERER_MISSING');
  const textEntries = entries.filter((entry) => /\.(?:css|html|js)$/i.test(entry.name));
  for (const entry of textEntries) {
    const source = extractFile(archivePath, entry.archiveEntry).toString('utf8');
    if (/<(?:script|link|img)\b[^>]+(?:src|href)=["']https?:\/\//i.test(source)) {
      throw new Error(`REMOTE_RENDERER_ASSET:${entry.name}`);
    }
    if (/\b(?:fetch|WebSocket|EventSource)\s*\(\s*["']https?:\/\//i.test(source)) {
      throw new Error(`REMOTE_RENDERER_RUNTIME:${entry.name}`);
    }
  }
  return { files: entries.length, html: htmlEntry.name };
}

async function main(): Promise<void> {
  const executablePath = packagedExecutable();
  if (!existsSync(executablePath) || !statSync(executablePath).isFile()) {
    throw new Error('PACKAGED_EXECUTABLE_MISSING');
  }
  const archivePath = path.join(path.dirname(executablePath), 'resources', 'app.asar');
  if (!existsSync(archivePath) || !statSync(archivePath).isFile()) {
    throw new Error('PACKAGED_ASAR_MISSING');
  }
  const wire = await getCurrentFuseWire(executablePath);
  assertFuse(wire, FuseV1Options.RunAsNode, fuseState.disabled);
  assertFuse(wire, FuseV1Options.EnableNodeOptionsEnvironmentVariable, fuseState.disabled);
  assertFuse(wire, FuseV1Options.EnableNodeCliInspectArguments, fuseState.disabled);
  assertFuse(wire, FuseV1Options.EnableEmbeddedAsarIntegrityValidation, fuseState.enabled);
  assertFuse(wire, FuseV1Options.OnlyLoadAppFromAsar, fuseState.enabled);
  const renderer = assertOfflineRenderer(archivePath);
  console.log(JSON.stringify({
    executablePath,
    archivePath,
    renderer,
    fuses: {
      RunAsNode: 'disabled',
      EnableNodeOptionsEnvironmentVariable: 'disabled',
      EnableNodeCliInspectArguments: 'disabled',
      EnableEmbeddedAsarIntegrityValidation: 'enabled',
      OnlyLoadAppFromAsar: 'enabled',
    },
  }, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
