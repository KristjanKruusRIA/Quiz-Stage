import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test.beforeAll(() => {
  execFileSync(process.execPath, ['node_modules/@electron-forge/cli/dist/electron-forge.js', 'package', '--platform=win32', '--arch=x64'], { cwd: process.cwd(), stdio: 'inherit' });
  const target = path.join(process.cwd(), '.vite', 'build', 'resources', 'content');
  mkdirSync(target, { recursive: true });
  copyFileSync(path.join(process.cwd(), 'resources', 'content', 'dev-seed.sqlite'), path.join(target, 'dev-seed.sqlite'));
});

async function launch(teamCount: 2 | 8): Promise<{ app: ElectronApplication; page: Page }> {
  const userData = mkdtempSync(path.join(tmpdir(), `quiz-stage-visual-${teamCount}-`));
  const app = await electron.launch({ cwd: process.cwd(), executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'), args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`] });
  const page = await app.firstWindow();
  await page.getByRole('button', { name: 'New Match' }).click();
  for (let count = 2; count < teamCount; count += 1) await page.getByRole('button', { name: 'Add team' }).click();
  await page.getByRole('button', { name: 'Start match' }).click();
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
