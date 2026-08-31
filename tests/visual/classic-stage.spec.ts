import { _electron as electron, expect, test, type ElectronApplication, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { electronExecutablePath, prepareE2eApplication } from '../e2e/productHarness';

test.beforeAll(prepareE2eApplication);
test.setTimeout(300_000);

const sizes = [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
] as const;

async function launch(): Promise<{ app: ElectronApplication; page: Page; userData: string }> {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-classic-stage-'));
  const mediaDirectory = path.join(userData, 'media');
  mkdirSync(mediaDirectory);
  writeFileSync(path.join(mediaDirectory, 'opening.wav'), 'malformed personal replacement');
  const app = await electron.launch({
    cwd: process.cwd(),
    executablePath: electronExecutablePath(),
    args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock'],
  });
  return { app, page: await app.firstWindow(), userData };
}

async function captureMatrix(page: Page, testInfo: TestInfo, name: string) {
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.evaluate(async () => { await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))); });
    const layout = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      clipped: [...document.querySelectorAll('.public-board, .board-header-row h2, .board-row button, .scoreboard li, .public-clue, .public-final, .winner-screen, .final-waiting, .host-console button:not([disabled]), .host-console input')]
        .filter((element) => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
        .map((element) => ({
          element: `${element.tagName.toLowerCase()}.${element.className}`,
          text: element.textContent?.trim().slice(0, 160),
          client: [element.clientWidth, element.clientHeight],
          scroll: [element.scrollWidth, element.scrollHeight],
        })),
    }));
    expect(layout.overflowX).toBe(false);
    expect(layout.overflowY).toBe(false);
    expect(layout.clipped).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`${name}-${size.width}x${size.height}.png`), fullPage: true });
  }
}

test('Classic Stage branding remains readable from 720p through 4K', async ({}, testInfo) => {
  const { app, page, userData } = await launch();
  try {
    const logo = page.locator('.brand-logo');
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

    for (const size of sizes) {
      await page.setViewportSize(size);
      const home = await page.evaluate(() => {
        const root = document.documentElement;
        const bodyStyle = getComputedStyle(document.body);
        const logoElement = document.querySelector('.brand-logo')!;
        const action = document.querySelector('.primary-action')!;
        const actionStyle = getComputedStyle(action);
        const rgb = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
        const luminance = (value: string) => {
          const channels = rgb(value).map((channel) => channel / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
          return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
        };
        const foreground = luminance(actionStyle.color);
        const background = luminance(actionStyle.backgroundColor);
        const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
        const rect = logoElement.getBoundingClientRect();
        return {
          background: bodyStyle.backgroundImage,
          contrast,
          logoInViewport: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
          overflowX: root.scrollWidth > root.clientWidth,
          overflowY: root.scrollHeight > root.clientHeight,
        };
      });
      expect(home.background).toContain('quiz-stage-media://branding/stage-background');
      expect(home.contrast).toBeGreaterThanOrEqual(4.5);
      expect(home).toEqual(expect.objectContaining({ logoInViewport: true, overflowX: false, overflowY: false }));
      await page.screenshot({ path: testInfo.outputPath(`home-${size.width}x${size.height}.png`), fullPage: true });
    }

    await page.getByRole('button', { name: 'New Match' }).click();
    await page.getByRole('button', { name: 'Start match' }).click();
    await expect(page.getByRole('grid')).toBeVisible();
    for (const size of sizes) {
      await page.setViewportSize(size);
      const board = await page.evaluate(() => {
        const root = document.documentElement;
        const surface = document.querySelector('.game-surface')!;
        const surfaceStyle = getComputedStyle(surface);
        const cells = [...document.querySelectorAll('.board-row button')];
        return {
          background: surfaceStyle.backgroundImage,
          cellCount: cells.length,
          clippedCells: cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1 || cell.scrollHeight > cell.clientHeight + 1).length,
          overflowX: root.scrollWidth > root.clientWidth,
          overflowY: root.scrollHeight > root.clientHeight,
        };
      });
      expect(board).toEqual(expect.objectContaining({ cellCount: 30, clippedCells: 0, overflowX: false, overflowY: false }));
      expect(board.background).toContain('quiz-stage-media://branding/stage-background');
      await page.screenshot({ path: testInfo.outputPath(`board-${size.width}x${size.height}.png`), fullPage: true });
    }

    let capturedOrdinaryClue = false;
    let capturedDailyDouble = false;
    for (let clueNumber = 1; clueNumber <= 60; clueNumber += 1) {
      const tile = page.locator('.public-board button:not([disabled])').first();
      await expect(tile).toBeEnabled();
      await tile.click();
      const wager = page.getByRole('spinbutton', { name: 'Daily Double wager' });
      if (await wager.isVisible()) {
        if (!capturedDailyDouble) {
          await captureMatrix(page, testInfo, 'daily-double');
          capturedDailyDouble = true;
        }
        await wager.fill('5');
        await page.getByRole('button', { name: 'Commit wager' }).click();
      } else if (!capturedOrdinaryClue) {
        await expect(page.locator('.public-clue .clue-prompt')).toBeVisible();
        const contrast = await page.locator('.public-clue').evaluate((surface) => {
          const rgb = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
          const luminance = (value: string) => {
            const channels = rgb(value).map((channel) => channel / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
            return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
          };
          const foreground = luminance(getComputedStyle(surface.querySelector('.clue-prompt')!).color);
          const background = luminance(getComputedStyle(surface).backgroundColor);
          return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
        });
        expect(contrast).toBeGreaterThanOrEqual(4.5);
        await captureMatrix(page, testInfo, 'ordinary-clue');
        capturedOrdinaryClue = true;
      }
      await page.getByRole('region', { name: 'Team controls' }).locator('button:not([disabled])').first().click();
      await page.getByRole('button', { name: 'Correct', exact: true }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    expect(capturedOrdinaryClue).toBe(true);
    expect(capturedDailyDouble).toBe(true);

    await expect(page.getByRole('heading', { name: 'Final category' })).toBeVisible();
    await captureMatrix(page, testInfo, 'final-category');
    for (const input of await page.getByRole('spinbutton', { name: /Final wager for/ }).all()) {
      if (await input.isEnabled()) {
        await input.fill('0');
        await input.locator('xpath=ancestor::form').getByRole('button').click();
      }
    }
    await expect(page.locator('.public-clue .clue-prompt')).not.toBeEmpty();
    await expect(page.getByRole('timer')).toHaveText('0');
    await captureMatrix(page, testInfo, 'final-clue');
    while (await page.getByRole('button', { name: /Reveal .* correct/ }).count()) {
      await page.getByRole('button', { name: /Reveal .* correct/ }).first().click();
    }
    await expect(page.locator('.winner-screen')).toBeVisible();
    await captureMatrix(page, testInfo, 'winner');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const motion = await page.locator('.winner-screen').evaluate((element) => {
      const style = getComputedStyle(element);
      const seconds = (value: string) => value.endsWith('ms') ? Number.parseFloat(value) / 1_000 : Number.parseFloat(value);
      return { animationDuration: seconds(style.animationDuration), transitionDuration: seconds(style.transitionDuration) };
    });
    expect(motion.animationDuration).toBeLessThanOrEqual(0.000_001);
    expect(motion.transitionDuration).toBeLessThanOrEqual(0.000_001);
  } finally {
    await app.close().catch(() => undefined);
    rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test('eight-team host console remains usable from 720p through 4K', async ({}, testInfo) => {
  const { app, page, userData } = await launch();
  try {
    await page.getByRole('button', { name: 'New Match' }).click();
    for (let count = 2; count < 8; count += 1) await page.getByRole('button', { name: 'Add team' }).click();
    await page.getByRole('button', { name: 'Start match' }).click();
    await expect(page.getByRole('grid')).toBeVisible();
    await expect(page.locator('.scoreboard li')).toHaveCount(8);
    await captureMatrix(page, testInfo, 'host-console-8-teams');
  } finally {
    await app.close().catch(() => undefined);
    rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
