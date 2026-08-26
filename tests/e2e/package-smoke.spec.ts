import { chromium, expect, test, type Browser, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { packagedResourcesDirectory } from '../../scripts/release/packageLayout';
import { releaseTargetFor } from '../../scripts/release/targets';
import { openDatabase } from '../../src/main/persistence/database';

const packagedSmokeEnabled = process.env.QUIZ_STAGE_PACKAGED_EXECUTABLE !== undefined;
test.setTimeout(300_000);

function packagedExecutable(): string {
  const executable = process.env.QUIZ_STAGE_PACKAGED_EXECUTABLE;
  if (executable === undefined || executable.trim() === '') throw new Error('QUIZ_STAGE_PACKAGED_EXECUTABLE is not set');
  return executable;
}

function packagedUserData(executable: string): string {
  const target = releaseTargetFor(process.platform, process.arch);
  const portableMarker = path.join(packagedResourcesDirectory(executable, target), 'portable.flag');
  if (target.forgePlatform === 'win32' && existsSync(portableMarker)) {
    return path.join(path.dirname(executable), 'UserData');
  }
  return process.env.QUIZ_STAGE_PACKAGED_USER_DATA?.trim() || mkdtempSync(path.join(tmpdir(), 'quiz-stage-package-smoke-'));
}

async function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        server.close();
        reject(new Error('PACKAGE_SMOKE_PORT_UNAVAILABLE'));
        return;
      }
      server.close((error) => error === undefined ? resolve(address.port) : reject(error));
    });
  });
}

async function launchPackaged(executable: string, userData: string): Promise<{ browser: Browser; page: Page; process: ChildProcess }> {
  const port = await availablePort();
  const process = spawn(executable, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    '--quiz-stage-e2e-clock',
    '--quiz-stage-e2e-network-guard',
  ], { cwd: path.dirname(executable), stdio: 'ignore', windowsHide: true });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (process.exitCode !== null) throw new Error(`PACKAGED_APP_EXITED:${process.exitCode}`);
    try {
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      const page = browser.contexts().flatMap((context) => context.pages()).at(-1);
      if (page !== undefined) return { browser, page, process };
      await browser.close();
    } catch { /* Chromium has not exposed the CDP endpoint yet. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  process.kill();
  throw new Error('PACKAGED_APP_CDP_TIMEOUT');
}

async function stopPackaged(process: ChildProcess): Promise<void> {
  if (process.exitCode !== null) return;
  const exited = new Promise<void>((resolve) => process.once('exit', () => resolve()));
  process.kill();
  const stopped = await Promise.race([
    exited.then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  if (!stopped && process.exitCode === null) {
    process.kill('SIGKILL');
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5_000))]);
  }
}

async function playTileCorrect(page: Page): Promise<void> {
  const tile = page.locator('.public-board button:not([disabled])').first();
  await expect(tile).toBeEnabled();
  await tile.click();
  const wager = page.getByRole('spinbutton', { name: 'Daily Double wager' });
  if (await wager.isVisible()) {
    await wager.fill('5');
    await page.getByRole('button', { name: 'Commit wager' }).click();
  }
  await page.getByRole('region', { name: 'Team controls' }).locator('button:not([disabled])').first().click();
  await page.getByRole('button', { name: 'Correct', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

if (packagedSmokeEnabled) test('runs a complete two-team win sequence without external requests', async () => {
  const executable = packagedExecutable();
  const userData = packagedUserData(executable);
  const shouldCleanupUserData = process.env.QUIZ_STAGE_PACKAGED_USER_DATA === undefined;
  let browser: Browser | null = null;
  let applicationProcess: ChildProcess | null = null;
  const externalRequests: string[] = [];

  try {
    const launched = await launchPackaged(executable, userData);
    browser = launched.browser;
    applicationProcess = launched.process;
    const page = launched.page;
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        externalRequests.push(url.href);
      }
    });

    await page.getByRole('button', { name: 'New Match' }).click();
    await page.getByRole('radio', { name: 'English' }).check();
    await page.getByRole('radio', { name: 'Medium' }).check();
    await page.getByRole('combobox', { name: 'Clue time' }).selectOption('5');
    const startButton = page.getByRole('button', { name: 'Start match' });
    await expect.poll(async () => ({
      enabled: await startButton.isEnabled(),
      alerts: await page.getByRole('alert').allTextContents(),
    }), { message: 'Packaged content must support an English/Medium match', timeout: 30_000 }).toEqual({
      enabled: true,
      alerts: [],
    });
    await startButton.click();

    for (let clueNumber = 1; clueNumber <= 60; clueNumber += 1) {
      if (clueNumber === 31) await expect(page.getByRole('grid', { name: 'Double Round board' })).toBeVisible();
      await playTileCorrect(page);
    }

    for (const input of await page.getByRole('spinbutton', { name: /Final wager for/ }).all()) {
      if (await input.isVisible()) {
        await input.fill('0');
        await input.locator('xpath=ancestor::form').getByRole('button').click();
      }
    }
    await expect(page.getByRole('timer')).toHaveText('0', { timeout: 35_000 });
    while (await page.getByRole('button', { name: /Reveal .* correct/ }).count()) {
      await page.getByRole('button', { name: /Reveal .* correct/ }).first().click();
    }

    await expect(page.getByRole('heading', { name: /wins/ })).toBeVisible();
    await page.getByRole('button', { name: 'Back to Home' }).click();
    await page.getByRole('button', { name: 'Match History' }).click();
    await expect(page.getByRole('heading', { name: 'Match History' })).toBeVisible();
    await expect(page.getByText('Complete')).toBeVisible();

    const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
    try {
      const completeMatchCount = database.prepare('SELECT COUNT(*) FROM matches WHERE completed_at IS NOT NULL').pluck().get() as number;
      expect(completeMatchCount).toBeGreaterThanOrEqual(1);
    } finally {
      database.close();
    }

    expect(externalRequests).toEqual([]);
  } finally {
    await browser?.close().catch(() => undefined);
    if (applicationProcess !== null) await stopPackaged(applicationProcess);
    if (shouldCleanupUserData) rmSync(userData, { recursive: true, force: true });
  }
});
