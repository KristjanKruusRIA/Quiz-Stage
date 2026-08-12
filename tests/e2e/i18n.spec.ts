import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

test('runs an Estonian dual-screen clue with a host-only English comparison', async () => {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-i18n-e2e-'));
  let application: ElectronApplication | null = null;
  try {
    application = await electron.launch({
      cwd: process.cwd(),
      executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'),
      args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock', '--quiz-stage-e2e-network-guard'],
    });
    const host = await application.firstWindow();
    await expect(host.locator('html')).toHaveAttribute('lang', 'en');
    await host.getByRole('button', { name: 'New Match' }).click();
    await host.getByRole('radio', { name: 'Estonian' }).check();
    await expect(host.locator('html')).toHaveAttribute('lang', 'et');
    await host.getByRole('radio', { name: 'Kaks ekraani' }).check();
    await expect(host.getByRole('button', { name: 'Alusta mängu' })).toBeEnabled();
    await host.getByRole('button', { name: 'Alusta mängu' }).click();

    await expect.poll(() => application!.windows().length).toBe(2);
    const publicWindow = application.windows().find((window) => window !== host)!;
    await expect(host.getByRole('grid', { name: 'Esimese vooru mängulaud' })).toBeVisible();
    await expect(publicWindow.getByRole('grid', { name: 'Esimese vooru mängulaud' })).toBeVisible();
    await expect(host.locator('html')).toHaveAttribute('lang', 'et');
    await expect(publicWindow.locator('html')).toHaveAttribute('lang', 'et');

    await host.locator('.public-board button:not([disabled])').first().click();
    const wager = host.getByRole('spinbutton', { name: 'Duubli panus' });
    if (await wager.isVisible()) {
      await wager.fill('5');
      await host.getByRole('button', { name: 'Kinnita panus' }).click();
    }

    const publicPrompt = publicWindow.locator('.clue-prompt');
    await expect(publicPrompt).toBeVisible();
    const englishOriginal = host.getByRole('region', { name: 'Ingliskeelne originaal' });
    await expect(englishOriginal).toBeVisible();
    const englishPrompt = (await englishOriginal.locator('p').nth(0).innerText()).replace(/^Ingliskeelne vihje:\s*/, '');
    const englishResponse = (await englishOriginal.locator('p').nth(1).innerText()).replace(/^Ingliskeelne vastus:\s*/, '');
    expect(await publicPrompt.innerText()).not.toBe(englishPrompt);
    await expect(publicWindow.getByRole('region', { name: 'Ingliskeelne originaal' })).toHaveCount(0);
    await expect(publicWindow.locator('.public-response')).toHaveCount(0);
    await expect(publicWindow.locator('body')).not.toContainText(englishPrompt);
    await expect(publicWindow.locator('body')).not.toContainText(englishResponse);
    expect(await application.evaluate(() =>
      (globalThis as typeof globalThis & { __quizStageExternalRequests?: string[] }).__quizStageExternalRequests,
    )).toEqual([]);
  } finally {
    if (application !== null) await application.close();
    rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
