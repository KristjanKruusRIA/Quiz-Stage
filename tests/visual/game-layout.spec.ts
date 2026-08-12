import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { electronExecutablePath, prepareE2eApplication } from '../e2e/productHarness';

test.beforeAll(prepareE2eApplication);

async function launch(teamCount: 2 | 8, longEstonianNames = false): Promise<{ app: ElectronApplication; page: Page }> {
  const userData = mkdtempSync(path.join(tmpdir(), `quiz-stage-visual-${teamCount}-`));
  const app = await electron.launch({ cwd: process.cwd(), executablePath: electronExecutablePath(), args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`] });
  const page = await app.firstWindow();
  await page.getByRole('button', { name: 'New Match' }).click();
  for (let count = 2; count < teamCount; count += 1) await page.getByRole('button', { name: 'Add team' }).click();
  if (longEstonianNames) {
    await page.getByRole('radio', { name: 'Estonian' }).click();
    const names = page.locator('.team-editor input[type="text"]');
    for (let index = 0; index < teamCount; index += 1) {
      await names.nth(index).fill(`Pikk võistkonnanimi number ${index + 1} xxxx`.slice(0, 32));
    }
  }
  await page.getByRole('button', { name: longEstonianNames ? 'Alusta mängu' : 'Start match' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
  return { app, page };
}

for (const teamCount of [2, 8] as const) {
  test(`${teamCount} teams fit at 720p, 1080p, and 4K`, async ({}, testInfo) => {
    const { app, page } = await launch(teamCount);
    for (const size of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
      await page.setViewportSize(size);
      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const board = document.querySelector('.public-board')!;
        const categories = [...document.querySelectorAll('.board-header-row h2')];
        const scores = [...document.querySelectorAll('.scoreboard li')];
        const controls = [...document.querySelectorAll('.host-console button:not([disabled])')];
        const inViewport = (element: Element) => { const r = element.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; };
        return {
          documentOverflowX: root.scrollWidth > root.clientWidth,
          documentOverflowY: root.scrollHeight > root.clientHeight,
          board: inViewport(board),
          categories: categories.every(inViewport),
          scores: scores.every(inViewport),
          controls: controls.every((element) => element.getBoundingClientRect().width > 0),
          categoryFont: Number.parseFloat(getComputedStyle(categories[0]!).fontSize),
          scoreFont: Number.parseFloat(getComputedStyle(scores[0]!).fontSize),
        };
      });
      expect(layout).toEqual(expect.objectContaining({ documentOverflowX: false, documentOverflowY: false, board: true, categories: true, scores: true, controls: true }));
      expect(layout.categoryFont).toBeGreaterThanOrEqual(size.width === 3840 ? 24 : 10);
      expect(layout.scoreFont).toBeGreaterThanOrEqual(size.width === 3840 ? 20 : 10);
      await page.screenshot({ path: testInfo.outputPath(`board-${teamCount}-${size.width}x${size.height}.png`), fullPage: true });
    }
    await app.close();
  });
}

test('eight maximum-length Estonian names and signed scores fit board and clue phases at 720p and 4K', async ({}, testInfo) => {
  const { app, page } = await launch(8, true);
  await page.locator('.host-console input:not([type="number"]):not([type="checkbox"])').first().fill('Visuaalne kontroll');
  const scoreInputs = page.locator('.host-console input[name="score"]');
  for (let index = 0; index < 8; index += 1) {
    await scoreInputs.nth(index).fill(index % 2 === 0 ? '999999' : '-999999');
    await scoreInputs.nth(index).press('Enter');
  }

  for (const size of [{ width: 1280, height: 720 }, { width: 3840, height: 2160 }]) {
    await page.setViewportSize(size);
    await page.getByRole('button', { name: / punkti$/ }).first().focus();
    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const cards = [...document.querySelectorAll('.scoreboard li')];
      const rectangles = cards.map((element) => element.getBoundingClientRect());
      const focus = document.activeElement?.getBoundingClientRect();
      return {
        overflowX: root.scrollWidth > root.clientWidth,
        overflowY: root.scrollHeight > root.clientHeight,
        cardContentFits: cards.every((element) => element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1),
        cardOverlap: rectangles.some((left, index) => rectangles.slice(index + 1).some((right) => left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top)),
        focusClipped: focus === undefined || focus.left < 3 || focus.top < 3 || focus.right > innerWidth - 3 || focus.bottom > innerHeight - 3,
      };
    });
    expect(layout).toEqual({ overflowX: false, overflowY: false, cardContentFits: true, cardOverlap: false, focusClipped: false });
    await page.screenshot({ path: testInfo.outputPath(`long-et-board-8-${size.width}x${size.height}.png`), fullPage: true });
  }

  await page.getByRole('button', { name: / punkti$/ }).first().press('Space');
  const wager = page.getByRole('spinbutton', { name: 'Duubli panus' });
  await expect.poll(async () => await wager.isVisible() || await page.locator('.public-clue').isVisible()).toBe(true);
  if (await wager.isVisible()) {
    await wager.fill('5');
    await page.getByRole('button', { name: 'Kinnita panus' }).click();
  }
  await expect(page.locator('.public-clue')).toBeVisible();
  for (const size of [{ width: 1280, height: 720 }, { width: 3840, height: 2160 }]) {
    await page.setViewportSize(size);
    const phaseLayout = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      clipped: [...document.querySelectorAll('.scoreboard li, .public-clue, .host-console button:not([disabled])')]
        .some((element) => element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1),
    }));
    expect(phaseLayout).toEqual({ overflowX: false, overflowY: false, clipped: false });
    await page.screenshot({ path: testInfo.outputPath(`long-et-clue-8-${size.width}x${size.height}.png`), fullPage: true });
  }
  await app.close();
});
