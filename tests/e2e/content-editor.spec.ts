import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { electronExecutablePath, prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

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
      executablePath: electronExecutablePath(),
      args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock', '--quiz-stage-e2e-network-guard'],
    });
    const externalRequests: string[] = [];
    await application.context().route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if ((url.protocol === 'http:' || url.protocol === 'https:') && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
        externalRequests.push(url.href); await route.abort(); return;
      }
      await route.continue();
    });
    const host = await application.firstWindow();
    await host.getByRole('button', { name: 'Content Library' }).click();
    await expect(host.getByRole('heading', { name: 'Content Library' })).toBeVisible();

    await host.getByLabel('Custom pack name').fill('E2E Bilingual Pack');
    await host.getByRole('button', { name: 'Create custom pack' }).click();
    await expect(host.getByRole('heading', { name: 'E2E Bilingual Pack' })).toBeVisible();
    const packRegion = host.getByRole('region', { name: 'E2E Bilingual Pack' });
    const addCategory = async (round: 'round-one' | 'round-two', index: number) => {
      await packRegion.getByRole('button', { name: 'Add category set' }).click();
      if (round === 'round-two') await host.getByLabel('Round').selectOption('round-two');
      await host.getByLabel('Category name — English').fill(`E2E ${round === 'round-one' ? 'R1' : 'R2'} ${index}`);
      await host.getByLabel('Category name — Estonian').fill(`E2E ET ${round === 'round-one' ? 'R1' : 'R2'} ${index}`);
      await host.getByLabel('Macro-topic').fill(`topic-${index % 3}`);
      for (let tier = 1; tier <= 5; tier += 1) {
      await host.getByLabel(`Tier ${tier} clue — English`).fill(`English ${round} clue ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} clue — Estonian`).fill(`Eesti ${round} vihje ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} response — English`).fill(`English response ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} response — Estonian`).fill(`Eesti vastus ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} explanation — English`).fill(`English explanation ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} explanation — Estonian`).fill(`Eesti selgitus ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} accepted responses — English`).fill(`Alias ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} accepted responses — Estonian`).fill(`Variant ${index}-${tier}`);
      await host.getByLabel(`Tier ${tier} source title`).fill('Open E2E facts');
      await host.getByLabel(`Tier ${tier} source URL`).fill(`https://example.com/e2e/${round}/${index}/${tier}`);
      await host.getByLabel(`Tier ${tier} source license`).fill('CC BY 4.0');
      await host.getByLabel(`Tier ${tier} retrieval date`).fill('2026-08-12');
      await host.getByLabel(`Tier ${tier} translation status`).selectOption('reviewed');
      }
      await host.getByRole('button', { name: 'Save category set' }).click();
    };
    for (let index = 1; index <= 6; index += 1) await addCategory('round-one', index);
    for (let index = 1; index <= 6; index += 1) await addCategory('round-two', index);
    await packRegion.getByRole('button', { name: 'Add Final clue' }).click();
    await host.getByLabel('Final category — English').fill('E2E Final');
    await host.getByLabel('Final category — Estonian').fill('E2E Finaal');
    await host.getByLabel('Final clue — English').fill('English Final clue');
    await host.getByLabel('Final clue — Estonian').fill('Eesti finaalvihje');
    await host.getByLabel('Final response — English').fill('Final response');
    await host.getByLabel('Final response — Estonian').fill('Finaalvastus');
    await host.getByLabel('Final explanation — English').fill('Final explanation');
    await host.getByLabel('Final explanation — Estonian').fill('Finaalselgitus');
    await host.getByLabel('Final accepted responses — English').fill('Final alias');
    await host.getByLabel('Final accepted responses — Estonian').fill('Finaalvariant');
    await host.getByLabel('Macro-topic').fill('final-topic');
    await host.getByLabel('Final source title').fill('Open E2E facts');
    await host.getByLabel('Final source URL').fill('https://example.com/e2e/final');
    await host.getByLabel('Final source license').fill('CC BY 4.0');
    await host.getByLabel('Final retrieval date').fill('2026-08-12');
    await host.getByLabel('Final translation status').selectOption('reviewed');
    await host.getByRole('button', { name: 'Save Final clue' }).click();
    await expect(packRegion.getByText('EN eligible · ET eligible').first()).toBeVisible();

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

    await packRegion.getByRole('button', { name: 'Edit category set E2E R1 1' }).click();
    await host.getByLabel('Report note for tier 1').fill('Verified correction needed');
    await host.getByRole('button', { name: 'Report tier 1' }).click();
    await expect(host.getByText('Verified correction needed')).toBeVisible();
    await host.getByRole('button', { name: 'Edit reported clue E2E R1 1' }).click();
    await host.getByLabel('Tier 1 clue — English').fill('Corrected English clue 1');
    await host.getByRole('button', { name: 'Save category set' }).click();
    await expect(host.getByText('No unresolved reports.')).toBeVisible();
    await expect(packRegion.getByText('EN eligible · ET eligible').first()).toBeVisible();

    await host.getByRole('button', { name: 'Back to Home' }).click();
    await host.getByRole('button', { name: 'New Match' }).click();
    const customPack = host.getByRole('checkbox', { name: 'E2E Bilingual Pack' });
    await expect(customPack).toBeVisible();
    for (const checkbox of await host.getByRole('checkbox').all()) {
      if (checkbox !== customPack && await checkbox.isChecked()) await checkbox.uncheck();
    }
    if (!await customPack.isChecked()) await customPack.check();
    await host.getByRole('radio', { name: 'English' }).check();
    await host.getByRole('radio', { name: 'Easy' }).check();
    await expect(host.getByRole('button', { name: 'Start match' })).toBeEnabled();
    await host.getByRole('button', { name: 'Start match' }).click();
    await expect(host.getByRole('grid', { name: 'Round One board' })).toBeVisible();
    await host.getByRole('button', { name: 'E2E R1 1 for 200' }).click();
    const correctedPrompt = host.locator('.public-clue .clue-prompt');
    const dailyDoubleWager = host.getByRole('spinbutton', { name: 'Daily Double wager' });
    await expect(correctedPrompt.or(dailyDoubleWager)).toBeVisible();
    if (await dailyDoubleWager.isVisible()) {
      await dailyDoubleWager.fill('5');
      await host.getByRole('button', { name: 'Commit wager' }).click();
    }
    await expect(correctedPrompt).toHaveText('Corrected English clue 1');
    expect(externalRequests).toEqual([]);
    expect(await application.evaluate(() =>
      (globalThis as typeof globalThis & { __quizStageExternalRequests?: string[] }).__quizStageExternalRequests,
    )).toEqual([]);
  } finally {
    if (application !== null) await application.close();
    rmSync(isolated, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
