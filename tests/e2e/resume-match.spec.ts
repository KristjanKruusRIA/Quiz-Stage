import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { openDatabase } from '../../src/main/persistence/database';
import { gameStateSchema } from '../../src/shared/ipc/contracts';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

function launch(userData: string) {
  return electron.launch({
    cwd: process.cwd(),
    executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock'],
  });
}

function watchExternalRequests(application: ElectronApplication, requests: string[]) {
  application.context().on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      requests.push(url.href);
    }
  });
}

async function playCurrentTileCorrect(page: Page) {
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

test('recovers an interrupted Round One match through Resume and records its completed history', async () => {
  const userDataRoot = path.join(process.cwd(), 'test-results', 'user-data');
  mkdirSync(userDataRoot, { recursive: true });
  const userData = mkdtempSync(path.join(userDataRoot, 'quiz-stage-resume-e2e-'));
  const externalRequests: string[] = [];
  let application: ElectronApplication | null = null;
  try {
    application = await launch(userData);
    watchExternalRequests(application, externalRequests);
    let page = await application.firstWindow();
    await page.getByRole('button', { name: 'New Match' }).click();
    await page.getByRole('radio', { name: 'English' }).check();
    await page.getByRole('radio', { name: 'Medium' }).check();
    await page.getByRole('combobox', { name: 'Clue time' }).selectOption('5');
    await expect(page.getByRole('button', { name: 'Start match' })).toBeEnabled();
    await page.getByRole('button', { name: 'Start match' }).click();
    await expect(page.getByRole('grid', { name: 'Round One board' })).toBeVisible();
    await playCurrentTileCorrect(page);

    const boardBefore = await page.locator('.public-board button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
    const scoresBefore = await page.locator('.scoreboard').innerText();
    await expect(page.getByRole('timer')).toHaveCount(0);

    const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
    const row = database.prepare(`
      SELECT snapshots.state_json
      FROM match_snapshots AS snapshots
      JOIN matches ON matches.id = snapshots.match_id
      WHERE matches.completed_at IS NULL
      ORDER BY matches.updated_at DESC, snapshots.sequence DESC
      LIMIT 1
    `).get() as { state_json: string };
    const saved = gameStateSchema.parse(JSON.parse(row.state_json));
    database.close();
    expect(saved.timer).toMatchObject({ status: 'paused', startedAt: null });
    expect(saved.usedClueIds).toHaveLength(1);

    const child = application.process();
    if (child.pid === undefined) throw new Error('Electron process ID is unavailable');
    execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    application = null;

    application = await launch(userData);
    watchExternalRequests(application, externalRequests);
    page = await application.firstWindow();
    const resume = page.getByRole('button', { name: 'Resume Match' });
    await expect(resume).toBeEnabled();
    await resume.click();
    await expect(page.getByRole('grid', { name: 'Round One board' })).toBeVisible();

    expect(await page.locator('.public-board button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))).toEqual(boardBefore);
    expect(await page.locator('.scoreboard').innerText()).toBe(scoresBefore);
    await expect(page.getByRole('timer')).toHaveCount(0);

    for (let clueNumber = 2; clueNumber <= 60; clueNumber += 1) {
      if (clueNumber === 31) await expect(page.getByRole('grid', { name: 'Double Round board' })).toBeVisible();
      await playCurrentTileCorrect(page);
    }
    for (const input of await page.getByRole('spinbutton', { name: /Final wager for/ }).all()) {
      if (await input.isEnabled()) {
        await input.fill('0');
        await input.locator('xpath=ancestor::form').getByRole('button').click();
      }
    }
    await expect(page.getByRole('timer')).toHaveText('0');
    while (await page.getByRole('button', { name: /Reveal .* correct/ }).count()) {
      await page.getByRole('button', { name: /Reveal .* correct/ }).first().click();
    }
    await expect(page.getByRole('heading', { name: / wins/ })).toBeVisible();
    await page.getByRole('button', { name: 'Back to Home' }).click();
    await expect(page.getByRole('button', { name: 'Resume Match' })).toBeDisabled();
    await page.getByRole('button', { name: 'Match History' }).click();
    await expect(page.getByRole('heading', { name: 'Match History' })).toBeVisible();
    await expect(page.getByText(saved.seed)).toBeVisible();
    await expect(page.getByText('Complete')).toBeVisible();
    await expect(page.getByText(/1\. Team 1 —/)).toBeVisible();
    expect(externalRequests).toEqual([]);
  } finally {
    await application?.close().catch(() => undefined);
    rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
