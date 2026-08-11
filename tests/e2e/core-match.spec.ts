import { _electron as electron, expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test.beforeAll(() => {
  execFileSync(process.execPath, ['node_modules/@electron-forge/cli/dist/electron-forge.js', 'package', '--platform=win32', '--arch=x64'], {
    cwd: process.cwd(), stdio: 'inherit',
  });
  const fixtureResource = path.join(process.cwd(), '.vite', 'build', 'resources', 'content');
  mkdirSync(fixtureResource, { recursive: true });
  copyFileSync(path.join(process.cwd(), 'resources', 'content', 'dev-seed.sqlite'), path.join(fixtureResource, 'dev-seed.sqlite'));
});

test('plays all 60 fixture board clues, three Daily Doubles, Final, and a winner offline', async () => {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-e2e-'));
  const app = await electron.launch({
    cwd: process.cwd(),
    executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`],
  });
  const page = await app.firstWindow();
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      externalRequests.push(url.href);
    }
  });

  await page.getByRole('button', { name: 'New Match' }).click();
  await page.getByRole('radio', { name: 'English' }).check();
  await page.getByRole('radio', { name: 'Medium' }).check();
  await page.getByRole('combobox', { name: 'Clue time' }).selectOption('5');
  await expect(page.getByRole('button', { name: 'Start match' })).toBeEnabled();
  await page.getByRole('button', { name: 'Start match' }).click();

  let dailyDoubles = 0;
  for (let clueNumber = 1; clueNumber <= 60; clueNumber += 1) {
    const tile = page.locator('.public-board button:not([disabled])').first();
    await expect(tile).toBeEnabled();
    await tile.click();
    const wager = page.getByRole('spinbutton', { name: 'Daily Double wager' });
    if (await wager.isVisible()) {
      dailyDoubles += 1;
      await wager.fill('5');
      await page.getByRole('button', { name: 'Commit wager' }).click();
    }
    await page.getByRole('region', { name: 'Team controls' }).locator('button:not([disabled])').first().click();
    await page.getByRole('button', { name: 'Correct', exact: true }).click();
  }
  expect(dailyDoubles).toBe(3);

  for (const input of await page.getByRole('spinbutton', { name: /Final wager for/ }).all()) {
    if (await input.isEnabled()) {
      await input.fill('0');
      await input.locator('xpath=ancestor::form').getByRole('button').click();
    }
  }
  await expect(page.locator('.public-clue .clue-prompt')).not.toBeEmpty();
  await page.getByRole('button', { name: 'Pause timer' }).click();
  await page.getByRole('button', { name: 'Resume timer' }).click();
  await page.evaluate(() => {
    const original = Date.now();
    Date.now = () => original + 31_000;
  });
  await page.getByRole('button', { name: 'Pause timer' }).click();
  while (await page.getByRole('button', { name: /Reveal .* correct/ }).count()) {
    await page.getByRole('button', { name: /Reveal .* correct/ }).first().click();
  }

  await expect(page.getByRole('heading', { name: / wins/ })).toBeVisible();
  expect(externalRequests).toEqual([]);
  await app.close();
});
