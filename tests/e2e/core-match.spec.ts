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
    args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock'],
  });
  const page = await app.firstWindow();
  const externalRequests: string[] = [];
  app.context().on('request', (request) => {
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
  const tileIdentities = new Set<string>();
  await expect(page.getByRole('grid', { name: 'Round One board' })).toBeVisible();
  for (let clueNumber = 1; clueNumber <= 60; clueNumber += 1) {
    if (clueNumber === 31) await expect(page.getByRole('grid', { name: 'Double Round board' })).toBeVisible();
    const tile = page.locator('.public-board button:not([disabled])').first();
    await expect(tile).toBeEnabled();
    const identity = await tile.getAttribute('aria-label');
    expect(identity).not.toBeNull();
    tileIdentities.add(identity!);
    await tile.click();
    const wager = page.getByRole('spinbutton', { name: 'Daily Double wager' });
    if (await wager.isVisible()) {
      dailyDoubles += 1;
      await wager.fill('5');
      await page.getByRole('button', { name: 'Commit wager' }).click();
    }
    await page.getByRole('region', { name: 'Team controls' }).locator('button:not([disabled])').first().click();
    await page.getByRole('button', { name: 'Correct', exact: true }).click();
    await expect(page.locator('.public-response p')).toHaveCount(3);
    if (clueNumber === 30 || clueNumber === 60) {
      await expect(page.getByRole('grid')).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  expect(dailyDoubles).toBe(3);
  expect(tileIdentities.size).toBe(60);

  for (const input of await page.getByRole('spinbutton', { name: /Final wager for/ }).all()) {
    if (await input.isEnabled()) {
      await input.fill('0');
      await input.locator('xpath=ancestor::form').getByRole('button').click();
    }
  }
  await expect(page.locator('.public-clue .clue-prompt')).not.toBeEmpty();
  await expect(page.getByRole('timer')).toHaveText('0');
  while (await page.getByRole('button', { name: /Reveal .* correct/ }).count()) {
    await page.getByRole('button', { name: /Reveal .* correct/ }).first().click();
  }

  await expect(page.getByRole('heading', { name: / wins/ })).toBeVisible();
  expect(externalRequests).toEqual([]);
  await app.close();
});
