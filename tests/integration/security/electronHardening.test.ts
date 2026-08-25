import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  registerAppProtocol,
  resolveAppProtocolPath,
} from '../../../src/main/security/contentPolicy';
import {
  exportDiagnosticsAfterUserChoice,
  initializeLocalLogger,
} from '../../../src/main/diagnostics/localLogger';

describe('Electron hardening', () => {
  it('pins ASAR, the security dependencies, and all required production fuses', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const forgeConfig = readFileSync('forge.config.ts', 'utf8');

    expect(packageJson.dependencies['electron-log']).toBe('5.4.4');
    expect(packageJson.devDependencies['@electron/fuses']).toBe('2.1.3');
    expect(packageJson.devDependencies['@electron-forge/plugin-fuses']).toBe('7.11.2');
    expect(forgeConfig).toContain('asar: true');
    expect(forgeConfig).toContain('[FuseV1Options.RunAsNode]: false');
    expect(forgeConfig).toContain('[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false');
    expect(forgeConfig).toContain('[FuseV1Options.EnableNodeCliInspectArguments]: false');
    expect(forgeConfig).toContain('[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true');
    expect(forgeConfig).toContain('[FuseV1Options.OnlyLoadAppFromAsar]: true');
    expect(existsSync('scripts/inspect-package.ts')).toBe(true);
  });

  it('uses sandboxed isolated windows, a privileged app protocol, and no external navigation', () => {
    const main = readFileSync('src/main/main.ts', 'utf8');
    const windows = readFileSync('src/main/windows/windowManager.ts', 'utf8');
    const navigation = readFileSync('src/main/windowSecurity.ts', 'utf8');

    expect(windows).toContain('contextIsolation: true');
    expect(windows).toContain('nodeIntegration: false');
    expect(windows).toContain('sandbox: true');
    expect(windows).toContain('webSecurity: true');
    expect(windows).toContain("loadURL(this.options.rendererUrl)");
    expect(navigation).toContain("webContents.on('will-navigate'");
    expect(navigation).toContain("action: 'deny'");
    expect(main).toContain("scheme: 'app'");
    expect(main).toMatch(/registerAppProtocol\(\s*protocol/);
    expect(main).toContain("rendererUrl: 'app://renderer/index.html'");
  });

  it('resolves only owned renderer files through app://renderer', async () => {
    const fixture = mkdtempSync(path.join(tmpdir(), 'quiz-stage-app-protocol-'));
    const rendererRoot = path.join(fixture, 'renderer');
    const outside = path.join(fixture, 'outside.txt');
    mkdirSync(rendererRoot);
    writeFileSync(path.join(rendererRoot, 'index.html'), '<main>Quiz Stage</main>');
    writeFileSync(outside, 'private');
    try {
      expect(resolveAppProtocolPath(rendererRoot, 'app://renderer/index.html'))
        .toBe(path.join(rendererRoot, 'index.html'));
      for (const url of [
        'https://renderer/index.html',
        'app://other/index.html',
        'app://renderer/%2e%2e/outside.txt',
        'app://renderer/index.html?source=https://example.com',
      ]) expect(() => resolveAppProtocolPath(rendererRoot, url)).toThrow('INVALID_APP_PROTOCOL_REQUEST');

      let handler: ((request: { url: string }) => Promise<unknown>) | undefined;
      const protocol = {
        handle: vi.fn((_scheme: string, next: (request: { url: string }) => Promise<unknown>) => { handler = next; }),
        unhandle: vi.fn(),
      };
      const loadFile = vi.fn(async (filePath: string) => filePath);
      const dispose = registerAppProtocol(protocol, rendererRoot, loadFile);
      expect(protocol.handle).toHaveBeenCalledWith('app', expect.any(Function));
      await expect(handler?.({ url: 'app://renderer/index.html' })).resolves.toBe(path.join(rendererRoot, 'index.html'));
      dispose();
      expect(protocol.unhandle).toHaveBeenCalledWith('app');
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('keeps CSP local-only and has no production network-server dependency', () => {
    const html = readFileSync('src/renderer/index.html', 'utf8');
    const policy = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1];
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies: Record<string, string> };
    const forbiddenDependencies = ['express', 'fastify', 'http-server', 'socket.io', 'ws'];
    const mainSources = [
      readFileSync('src/main/main.ts', 'utf8'),
      readFileSync('src/main/application.ts', 'utf8'),
    ].join('\n');

    expect(policy).toBe("default-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' quiz-stage-media:; media-src 'self' quiz-stage-media:; font-src 'self'; connect-src 'self' quiz-stage-media:");
    for (const dependency of forbiddenDependencies) expect(packageJson.dependencies).not.toHaveProperty(dependency);
    expect(mainSources).not.toMatch(/\bcreateServer\s*\(|\.listen\s*\(/);
  });

  it('exports only redacted logs, schema version, and app version after a user chooses a file', async () => {
    const fixture = mkdtempSync(path.join(tmpdir(), 'quiz-stage-diagnostics-'));
    const outputPath = path.join(fixture, 'export', 'diagnostics.json');
    try {
      const logger = initializeLocalLogger({
        logDirectory: path.join(fixture, 'logs'),
        maxSize: 256,
        maxFiles: 3,
      });
      for (let index = 0; index < 60; index += 1) {
        logger.recordGameCommand({ type: 'SelectClue', clueId: `clue-${index}-${'x'.repeat(200)}` });
      }
      logger.recordGameCommand({
        type: 'ReportClue',
        clueId: 'clue-0042',
        reason: 'FULL SECRET CLUE TEXT',
      });

      const cancelled = await exportDiagnosticsAfterUserChoice(
        async () => null,
        logger,
        { appVersion: '1.2.3', schemaVersion: 7 },
      );
      expect(cancelled).toBeNull();

      const exported = await exportDiagnosticsAfterUserChoice(
        async () => outputPath,
        logger,
        { appVersion: '1.2.3', schemaVersion: 7 },
      );
      expect(exported).toBe(outputPath);
      const payload = JSON.parse(readFileSync(outputPath, 'utf8')) as Record<string, unknown>;
      expect(Object.keys(payload).sort()).toEqual(['appVersion', 'logs', 'schemaVersion']);
      expect(payload).toMatchObject({ appVersion: '1.2.3', schemaVersion: 7 });
      expect(payload.logs).toHaveLength(3);
      const serialized = JSON.stringify(payload);
      expect(serialized).toContain('clue-0042');
      expect(serialized).not.toContain('FULL SECRET CLUE TEXT');

      const loggerSource = readFileSync('src/main/diagnostics/localLogger.ts', 'utf8');
      expect(loggerSource).toContain('const DEFAULT_MAX_SIZE = 1 * 1024 * 1024');
      expect(loggerSource).toContain('const DEFAULT_MAX_FILES = 3');
      expect(loggerSource).not.toContain('buildDefaultExportPath');
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});
