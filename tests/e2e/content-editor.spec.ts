import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';

test.beforeAll(() => {
  execFileSync(process.execPath, ['node_modules/@electron-forge/cli/dist/electron-forge.js', 'package', '--platform=win32', '--arch=x64'], {
    cwd: process.cwd(), stdio: 'inherit',
  });
  const fixtureResource = path.join(process.cwd(), '.vite', 'build', 'resources', 'content');
  mkdirSync(fixtureResource, { recursive: true });
  copyFileSync(path.join(process.cwd(), 'resources', 'content', 'dev-seed.sqlite'), path.join(fixtureResource, 'dev-seed.sqlite'));
});

test('creates, exports, deletes, imports, reports, corrects, and re-enables bilingual content', async () => {
  const root = path.join(process.cwd(), 'test-results', 'content-editor');
  mkdirSync(root, { recursive: true });
  const isolated = mkdtempSync(path.join(root, 'profile-'));
  const userData = path.join(isolated, 'user-data');
  const exported = path.join(isolated, 'roundtrip.csv');
  let application: ElectronApplication | null = null;
  try {
    application = await electron.launch({
      cwd: process.cwd(),
      executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'),
      args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock'],
    });
    const host = await application.firstWindow();
    await host.getByRole('button', { name: 'Content Library' }).click();
    await expect(host.getByRole('heading', { name: 'Content Library' })).toBeVisible();

    await host.getByLabel('Custom pack name').fill('E2E Bilingual Pack');
    await host.getByRole('button', { name: 'Create custom pack' }).click();
    await expect(host.getByRole('heading', { name: 'E2E Bilingual Pack' })).toBeVisible();
    const packRegion = host.getByRole('region', { name: 'E2E Bilingual Pack' });
    await packRegion.getByRole('button', { name: 'Add category set' }).click();
    await host.getByLabel('Category name — English').fill('E2E Space');
    await host.getByLabel('Category name — Estonian').fill('E2E Kosmos');
    await host.getByLabel('Macro-topic').fill('science');
    for (let tier = 1; tier <= 5; tier += 1) {
      await host.getByLabel(`Tier ${tier} clue — English`).fill(`English clue ${tier}`);
      await host.getByLabel(`Tier ${tier} clue — Estonian`).fill(`Eesti vihje ${tier}`);
      await host.getByLabel(`Tier ${tier} response — English`).fill(`English response ${tier}`);
      await host.getByLabel(`Tier ${tier} response — Estonian`).fill(`Eesti vastus ${tier}`);
      await host.getByLabel(`Tier ${tier} explanation — English`).fill(`English explanation ${tier}`);
      await host.getByLabel(`Tier ${tier} explanation — Estonian`).fill(`Eesti selgitus ${tier}`);
      await host.getByLabel(`Tier ${tier} source title`).fill('Open E2E facts');
      await host.getByLabel(`Tier ${tier} source URL`).fill(`https://example.com/e2e/${tier}`);
      await host.getByLabel(`Tier ${tier} source license`).fill('CC BY 4.0');
      await host.getByLabel(`Tier ${tier} retrieval date`).fill('2026-08-12');
      await host.getByLabel(`Tier ${tier} translation status`).selectOption('reviewed');
    }
    await host.getByRole('button', { name: 'Save category set' }).click();
    await expect(packRegion.getByText('EN eligible · ET eligible')).toBeVisible();

    await application.evaluate(async ({ dialog }, destination) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: destination, bookmark: '' });
    }, exported);
    await packRegion.getByRole('button', { name: 'Export CSV' }).click();
    await expect.poll(() => existsSync(exported)).toBe(true);

    host.once('dialog', (dialog) => void dialog.accept());
    await packRegion.getByRole('button', { name: 'Delete pack' }).click();
    await expect(host.getByRole('heading', { name: 'E2E Bilingual Pack' })).toHaveCount(0);

    await application.evaluate(async ({ dialog }, source) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [source], bookmarks: [] });
    }, exported);
    await host.getByRole('button', { name: 'Import CSV' }).click();
    await expect(host.getByRole('heading', { name: /Import preview/ })).toBeVisible();
    await expect(host.getByRole('list', { name: 'Import validation issues' })).toHaveCount(0);
    await host.getByRole('button', { name: 'Import pack' }).click();
    await expect(host.getByRole('heading', { name: 'E2E Bilingual Pack' })).toBeVisible();

    await packRegion.getByRole('button', { name: 'Edit category set E2E Space' }).click();
    await host.getByLabel('Report note for tier 1').fill('Verified correction needed');
    await host.getByRole('button', { name: 'Report tier 1' }).click();
    await expect(host.getByText('Verified correction needed')).toBeVisible();
    await host.getByRole('button', { name: 'Edit reported clue E2E Space' }).click();
    await host.getByLabel('Tier 1 clue — English').fill('Corrected English clue 1');
    await host.getByRole('button', { name: 'Save category set' }).click();
    await expect(host.getByText('No unresolved reports.')).toBeVisible();
    await expect(packRegion.getByText('EN eligible · ET eligible')).toBeVisible();

    await host.getByRole('button', { name: 'Back to Home' }).click();
    await host.getByRole('button', { name: 'New Match' }).click();
    await expect(host.getByRole('checkbox', { name: 'E2E Bilingual Pack' })).toBeVisible();
  } finally {
    if (application !== null) await application.close();
    rmSync(isolated, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
