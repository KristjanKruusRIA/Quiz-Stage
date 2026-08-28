import { _electron as electron, expect, test } from '@playwright/test';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AUDIO_ASSET_SPEC } from '../../src/shared/media/contracts';
import { electronExecutablePath, prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

test('persists audio settings and serves bundled fallback through the pathless protocol', async () => {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-audio-e2e-'));
  const media = path.join(userData, 'media');
  mkdirSync(media);
  writeFileSync(path.join(media, 'opening.wav'), 'malformed personal replacement');
  writeFileSync(path.join(media, 'winner.wav'), 'malformed personal replacement');
  const launch = () => electron.launch({
    cwd: process.cwd(),
    executablePath: electronExecutablePath(),
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
      await fetch('quiz-stage-media://asset/winner');
      const head = await fetch('quiz-stage-media://asset/opening', { method: 'HEAD' });
      const rejectedMethod = await fetch('quiz-stage-media://asset/opening', { method: 'POST' });
      const bytes = new Uint8Array(await value.arrayBuffer());
      const invalidRange = await fetch('quiz-stage-media://asset/opening', { headers: { Range: `bytes=${bytes.length}-` } });
      const audio = new Audio('quiz-stage-media://asset/opening');
      const duration = await new Promise<number>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration), { once: true });
        audio.addEventListener('error', () => reject(new Error('audio metadata failed')), { once: true });
        audio.load();
      });
      return {
        ok: value.ok,
        mime: value.headers.get('content-type'),
        riff: String.fromCharCode(...bytes.slice(0, 4)),
        duration,
        head: { status: head.status, length: head.headers.get('content-length'), bytes: (await head.arrayBuffer()).byteLength },
        range: { status: invalidRange.status, accept: invalidRange.headers.get('accept-ranges'), length: invalidRange.headers.get('content-length'), mime: invalidRange.headers.get('content-type') },
        method: { status: rejectedMethod.status, allow: rejectedMethod.headers.get('allow') },
      };
    });
    expect(response).toMatchObject({
      ok: true, mime: 'audio/wav', riff: 'RIFF',
      head: { status: 200, bytes: 0 },
      range: { status: 416, accept: 'bytes', length: '0', mime: 'audio/wav' },
      method: { status: 405, allow: 'GET, HEAD' },
    });
    expect(response.duration).toBeCloseTo(AUDIO_ASSET_SPEC.opening.durationMs / 1_000, 1);
    await expect(page.getByRole('alert', { name: 'Opening audio' })).toContainText('bundled audio');
    await expect(page.getByRole('alert', { name: 'Winner audio' })).toContainText('bundled audio');
    copyFileSync(path.join(process.cwd(), 'resources', 'media', 'audio', 'opening.wav'), path.join(media, 'opening.wav'));
    await page.evaluate(() => fetch('quiz-stage-media://asset/opening').then((result) => result.arrayBuffer()));
    await expect(page.getByRole('alert', { name: 'Opening audio' })).toHaveCount(0);
    await expect(page.getByRole('alert', { name: 'Winner audio' })).toBeVisible();
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
