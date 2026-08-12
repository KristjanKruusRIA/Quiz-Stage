import { _electron as electron, expect, test, type Page } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

async function tabTo(page: Page, role: string, name: RegExp | string) {
  for (let attempt = 0; attempt < 250; attempt += 1) {
    await page.keyboard.press(attempt === 0 ? 'Tab' : 'Tab');
    const match = await page.evaluate(({ role, source, flags }) => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return false;
      const accessible = active.getAttribute('aria-label') ?? active.closest('label')?.textContent?.trim() ?? active.textContent?.trim() ?? '';
      return (role === 'button' ? active.tagName === 'BUTTON' : role === 'spinbutton' ? active instanceof HTMLInputElement && active.type === 'number' : true)
        && new RegExp(source, flags).test(accessible);
    }, { role, source: typeof name === 'string' ? `^${name}$` : name.source, flags: typeof name === 'string' ? '' : name.flags });
    if (match) return;
  }
  throw new Error(`Keyboard focus did not reach ${String(name)}`);
}

test('plays a complete match with keyboard input and visible focus only', async () => {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-keyboard-'));
  const app = await electron.launch({ cwd: process.cwd(), executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'), args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock'] });
  const page = await app.firstWindow();
  await tabTo(page, 'button', 'New Match'); await page.keyboard.press('Enter');
  await tabTo(page, 'button', 'Start match');
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAccessibleName('Start match');
  await expect(page.locator(':focus')).toHaveCSS('outline-style', 'solid'); await page.keyboard.press('Space');
  await expect(page.getByRole('grid')).toBeVisible();
  let nativeButtonFlowCovered = false;
  let timerSurfaceFlowCovered = false;
  for (let clue = 1; clue <= 60; clue += 1) {
    await tabTo(page, 'button', / for /); await page.keyboard.press(clue % 2 === 0 ? 'Space' : 'Enter');
    const wager = page.getByRole('spinbutton', { name: 'Daily Double wager' });
    const lockableTeam = page.getByRole('region', { name: 'Team controls' }).locator('button:not([disabled])').first();
    await expect.poll(async () => await wager.isVisible() || await lockableTeam.count() > 0).toBe(true);
    const dailyDouble = await wager.isVisible();
    if (dailyDouble) {
      await tabTo(page, 'spinbutton', 'Daily Double wager');
      await expect(page.locator(':focus')).toHaveCSS('outline-style', 'solid');
      await tabTo(page, 'button', 'Commit wager'); await page.keyboard.press('Space');
      await expect(page.getByRole('spinbutton', { name: 'Daily Double wager' })).toHaveCount(0);
    }
    await expect(lockableTeam).toBeEnabled();
    if (!timerSurfaceFlowCovered) {
      await page.locator('body').press('Space');
      await expect(page.getByRole('button', { name: 'Resume timer' })).toBeEnabled();
      await page.locator('body').press('Space');
      await expect(page.getByRole('button', { name: 'Pause timer' })).toBeEnabled();
      timerSurfaceFlowCovered = true;
    }
    if (!nativeButtonFlowCovered && !dailyDouble) {
      await tabTo(page, 'button', /^Lock /); await page.keyboard.press('Space');
      await tabTo(page, 'button', 'Correct'); await page.keyboard.press('Space');
      await expect(page.locator('.public-response p')).toHaveCount(3);
      await tabTo(page, 'button', 'Continue'); await page.keyboard.press('Space');
      await expect(page.getByRole('grid')).toBeVisible();
      await tabTo(page, 'button', 'Undo'); await page.keyboard.press('Space');
      await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
      await tabTo(page, 'button', 'Continue'); await page.keyboard.press('Space');
      nativeButtonFlowCovered = true;
      continue;
    }
    const lockButtons = page.getByRole('region', { name: 'Team controls' }).getByRole('button');
    const lockIndex = await lockButtons.evaluateAll((buttons) => buttons.findIndex((button) => !(button as HTMLButtonElement).disabled));
    expect(lockIndex).toBeGreaterThanOrEqual(0);
    await page.keyboard.press(String(lockIndex + 1));
    await expect(page.getByRole('button', { name: 'Correct', exact: true })).toBeEnabled();
    await page.keyboard.press('c');
    await expect(page.locator('.public-response p')).toHaveCount(3);
    await page.keyboard.press('r');
    await expect(page.getByRole('grid')).toHaveCount(clue === 60 ? 0 : 1);
    if (clue === 30) await expect(page.getByRole('grid', { name: 'Double Round board' })).toBeVisible();
  }
  const uncommittedFinalWagers = page.getByRole('region', { name: 'Final wagers' }).locator('input[type="number"]:not([disabled])');
  while (await uncommittedFinalWagers.count()) {
    const before = await uncommittedFinalWagers.count();
    await tabTo(page, 'spinbutton', /Final wager for/); await page.keyboard.press('Control+A'); await page.keyboard.type('0');
    await tabTo(page, 'button', /Commit .* wager/); await page.keyboard.press('Space');
    await expect(uncommittedFinalWagers).toHaveCount(before - 1);
  }
  await expect(page.getByRole('timer')).toHaveText('0');
  const availableFinalReveal = page.locator('button:not([disabled])').filter({ hasText: /^Reveal .* correct$/ });
  while (await availableFinalReveal.count()) {
    const revealedName = (await availableFinalReveal.first().textContent())!;
    await tabTo(page, 'button', /Reveal .* correct/); await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: revealedName, exact: true })).toHaveCount(0);
  }
  expect(nativeButtonFlowCovered).toBe(true);
  expect(timerSurfaceFlowCovered).toBe(true);
  await expect(page.getByRole('heading', { name: / wins/ })).toBeVisible();
  await app.close();
});
