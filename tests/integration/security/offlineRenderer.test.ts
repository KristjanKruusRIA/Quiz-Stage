import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { registerOfflineRendererPolicy } from '../../../src/main/offlineRenderer';

type BeforeRequestListener = (
  details: { url: string; resourceType: string },
  callback: (response: { cancel: boolean }) => void,
) => void;

function harness(options: Parameters<typeof registerOfflineRendererPolicy>[1]) {
  let listener: BeforeRequestListener | null = null;
  const onBeforeRequest = vi.fn((
    filter: { urls: string[] },
    next: BeforeRequestListener | null,
  ) => {
    expect(filter).toEqual({ urls: ['<all_urls>'] });
    listener = next;
  });
  const dispose = registerOfflineRendererPolicy({ webRequest: { onBeforeRequest } }, options);
  const request = (url: string, resourceType = 'xhr') => {
    let cancelled: boolean | undefined;
    listener?.({ url, resourceType }, (response) => { cancelled = response.cancel; });
    return cancelled;
  };
  return { dispose, onBeforeRequest, request };
}

const rendererRoot = path.resolve('src', 'renderer');
const rendererFile = pathToFileURL(path.join(rendererRoot, 'index.html')).href;

describe('offline renderer session policy', () => {
  it('canonicalizes a packaged-shaped renderer root and rejects junction escapes and broken links', () => {
    const fixture = mkdtempSync(path.join(tmpdir(), 'quiz-stage-offline-policy-'));
    try {
      const root = path.join(fixture, 'resources', 'app.asar', '.vite', 'renderer', 'main_window');
      const outside = path.join(fixture, 'outside');
      mkdirSync(root, { recursive: true });
      mkdirSync(outside);
      writeFileSync(path.join(root, 'index.html'), '<main>owned</main>');
      writeFileSync(path.join(outside, 'secret.html'), 'must-not-load');
      const escape = path.join(root, 'escape');
      symlinkSync(outside, escape, process.platform === 'win32' ? 'junction' : 'dir');
      const broken = path.join(root, 'broken.html');
      symlinkSync(path.join(outside, 'missing.html'), broken, 'file');
      const blocked = vi.fn();
      const policy = harness({ isPackaged: true, rendererRoot: root, onBlockedRequest: blocked });

      expect(policy.request(pathToFileURL(path.join(root, 'index.html')).href, 'mainFrame')).toBe(false);
      expect(policy.request(pathToFileURL(path.join(escape, 'secret.html')).href, 'script')).toBe(true);
      expect(policy.request(pathToFileURL(broken).href, 'script')).toBe(true);
      expect(readFileSync(path.join(outside, 'secret.html'), 'utf8')).toBe('must-not-load');
      expect(blocked).toHaveBeenCalledTimes(2);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('rejects missing renderer roots, UNC/device paths, encoded traversal, and case lookalikes', () => {
    expect(() => harness({ isPackaged: true, rendererRoot: path.join(tmpdir(), 'missing-renderer-root') }))
      .toThrow('INVALID_RENDERER_ROOT');
    const policy = harness({ isPackaged: true, rendererRoot });
    for (const url of [
      'file://server/share/app.js',
      'file:///\\\\?\\C:\\private\\app.js',
      `${rendererFile}/%2e%2e/%2e%2e/private.js`,
      rendererFile.replace('renderer', 'renderer-lookalike'),
    ]) expect(policy.request(url, 'script')).toBe(true);
  });
  it('allows only owned packaged renderer resources and the pathless media protocol in production', () => {
    const policy = harness({ isPackaged: true, rendererRoot });

    expect(policy.request(rendererFile, 'mainFrame')).toBe(false);
    expect(policy.request(pathToFileURL(path.join(rendererRoot, 'main.tsx')).href, 'script')).toBe(false);
    expect(policy.request('quiz-stage-media://asset/opening', 'media')).toBe(false);
    expect(policy.request('quiz-stage-media://branding/logo', 'image')).toBe(false);
    expect(policy.request('quiz-stage-media://branding/stage-background', 'image')).toBe(false);

    for (const [url, type] of [
      ['https://example.com/main', 'mainFrame'],
      ['http://example.com/renderer', 'xhr'],
      ['wss://example.com/public', 'webSocket'],
      ['ws://localhost:5173/preload', 'webSocket'],
      ['file:///C:/Windows/System32/drivers/etc/hosts', 'xhr'],
      ['data:text/html,private', 'mainFrame'],
      ['blob:https://example.com/private', 'xhr'],
      ['quiz-stage-media://asset/opening?path=C:/private', 'media'],
      ['quiz-stage-media://other/opening', 'media'],
      ['quiz-stage-media://branding/icon-source', 'image'],
      ['quiz-stage-media://branding/logo?path=C:/private', 'image'],
    ] as const) {
      expect(policy.request(url, type)).toBe(true);
    }
  });

  it('allows only the exact configured Vite localhost origin in development', () => {
    const policy = harness({
      isPackaged: false,
      rendererRoot,
      devServerUrl: 'http://localhost:5173',
    });

    expect(policy.request('http://localhost:5173/')).toBe(false);
    expect(policy.request('http://localhost:5173/@vite/client', 'script')).toBe(false);
    expect(policy.request('ws://localhost:5173/?token=local', 'webSocket')).toBe(false);
    for (const url of [
      'http://localhost:5174/',
      'http://localhost.evil.example:5173/',
      'http://127.0.0.1:5173/',
      'http://user@localhost:5173/',
      'https://localhost:5173/',
      'wss://localhost:5173/',
    ]) expect(policy.request(url)).toBe(true);
  });

  it.each([
    '',
    'https://localhost:5173',
    'http://localhost',
    'http://localhost:0',
    'http://localhost:65536',
    'http://localhost.evil.example:5173',
    'http://user@localhost:5173',
    'http://[::1]:5173',
  ])('rejects malformed or non-exact development origin %j', (devServerUrl) => {
    expect(() => registerOfflineRendererPolicy(
      { webRequest: { onBeforeRequest: vi.fn() } },
      { isPackaged: false, rendererRoot, devServerUrl },
    )).toThrow('INVALID_VITE_DEV_SERVER_URL');
  });

  it('removes the production request guard on teardown', () => {
    const policy = harness({ isPackaged: true, rendererRoot });
    policy.dispose();
    expect(policy.onBeforeRequest).toHaveBeenLastCalledWith({ urls: ['<all_urls>'] }, null);
  });

  it('audits only blocked requests when an unpackaged E2E observer is supplied', () => {
    const blocked = vi.fn();
    const policy = harness({ isPackaged: true, rendererRoot, onBlockedRequest: blocked });

    expect(policy.request(rendererFile, 'mainFrame')).toBe(false);
    expect(policy.request('https://example.com/private', 'xhr')).toBe(true);
    expect(blocked).toHaveBeenCalledOnce();
    expect(blocked).toHaveBeenCalledWith('https://example.com/private', 'xhr');
  });

  it('keeps CSP local-only without data, blob, HTTP, or websocket sources', () => {
    const html = readFileSync(path.join(process.cwd(), 'src', 'renderer', 'index.html'), 'utf8');
    const value = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1];

    expect(value).toBe("default-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' quiz-stage-media:; media-src 'self' quiz-stage-media:; font-src 'self'; connect-src 'self' quiz-stage-media:");
  });
});
