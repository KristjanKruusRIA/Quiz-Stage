import { _electron as electron, expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test.beforeAll(() => {
  execFileSync(process.execPath, ['node_modules/@electron-forge/cli/dist/electron-forge.js', 'package', '--platform=win32', '--arch=x64'], {
    cwd: process.cwd(), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' },
  });
  cpSync(path.join(process.cwd(), 'resources', 'media'), path.join(process.cwd(), '.vite', 'build', 'resources', 'media'), { recursive: true });
  const content = path.join(process.cwd(), '.vite', 'build', 'resources', 'content');
  mkdirSync(content, { recursive: true });
  copyFileSync(path.join(process.cwd(), 'resources', 'content', 'dev-seed.sqlite'), path.join(content, 'dev-seed.sqlite'));
});

test('persists audio settings and serves bundled fallback through the pathless protocol', async () => {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-audio-e2e-'));
  const media = path.join(userData, 'media');
  mkdirSync(media);
  writeFileSync(path.join(media, 'opening.wav'), 'malformed personal replacement');
  const launch = () => electron.launch({
    cwd: process.cwd(),
    executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-network-guard'],
  });
  let application = await launch();
  try {
    let page = await application.firstWindow();
    await page.getByRole('button', { name: 'Settings' }).click();
    const master = page.getByRole('slider', { name: 'Master volume' });
    await master.fill('0.42');
    await expect(master).toHaveValue('0.42');
    const response = await page.evaluate(async () => {
      const value = await fetch('quiz-stage-media://asset/opening');
      const bytes = new Uint8Array(await value.arrayBuffer());
      const audio = new Audio('quiz-stage-media://asset/opening');
      const duration = await new Promise<number>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration), { once: true });
        audio.addEventListener('error', () => reject(new Error('audio metadata failed')), { once: true });
        audio.load();
      });
      return { ok: value.ok, mime: value.headers.get('content-type'), riff: String.fromCharCode(...bytes.slice(0, 4)), duration };
    });
    expect(response).toMatchObject({ ok: true, mime: 'audio/wav', riff: 'RIFF' });
    expect(response.duration).toBeCloseTo(2.5, 1);
    await expect(page.getByRole('alert')).toContainText('original placeholder');
    await application.close();

    application = await launch();
    page = await application.firstWindow();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.42');
  } finally {
    await application.close().catch(() => undefined);
    rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
