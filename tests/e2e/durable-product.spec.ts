import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { CSV_COLUMNS } from '../../src/shared/content/csvColumns';
import { prepareE2eApplication } from './productHarness';

const PACK_NAME = 'Durable Estonian Pack';
const PACK_ID = 'durable-estonian-pack';
const REPORT_NOTE = 'Durable report note';
const SCORE_REASON = 'Durable score correction';
type Row = Record<(typeof CSV_COLUMNS)[number], string>;

test.beforeAll(prepareE2eApplication);

function contentRow(overrides: Partial<Row>): Row {
  return {
    clue_id: '', pack_id: PACK_ID, pack_name: PACK_NAME, category_set_id: '', content_kind: 'board',
    round: 'round-one', tier: '', difficulty: 'hard', macro_topic: '', category_name_en: '', category_name_et: '',
    clue_en: '', clue_et: '', response_en: '', response_et: '', accepted_variants_en: '', accepted_variants_et: '',
    explanation_en: '', explanation_et: '', source_title: 'Durable source', source_url: 'https://example.com/durable',
    source_license: 'CC0-1.0', source_retrieved_at: '2026-08-12', translation_status: 'reviewed', enabled: 'true',
    ...overrides,
  };
}

function writePackFixture(destination: string): void {
  const rows: Row[] = [];
  for (const round of ['round-one', 'round-two'] as const) {
    for (let category = 1; category <= 6; category += 1) {
      for (let tier = 1; tier <= 5; tier += 1) {
        const shortRound = round === 'round-one' ? 'r1' : 'r2';
        rows.push(contentRow({
          clue_id: `durable-${shortRound}-${category}-${tier}`,
          category_set_id: `durable-${shortRound}-${category}`,
          round,
          tier: String(tier),
          macro_topic: `durable-topic-${category}`,
          category_name_en: `English category ${shortRound} ${category}`,
          category_name_et: `Eesti kategooria ${shortRound} ${category}`,
          clue_en: `English durable prompt ${shortRound} ${category}-${tier}`,
          clue_et: `Eesti püsiv vihje ${shortRound} ${category}-${tier}`,
          response_en: `English answer ${shortRound} ${category}-${tier}`,
          response_et: `Eesti vastus ${shortRound} ${category}-${tier}`,
          accepted_variants_en: `English alias ${shortRound} ${category}-${tier}`,
          accepted_variants_et: `Eesti variant ${shortRound} ${category}-${tier}`,
          explanation_en: `English explanation ${shortRound} ${category}-${tier}`,
          explanation_et: `Eesti selgitus ${shortRound} ${category}-${tier}`,
          source_url: `https://example.com/durable/${shortRound}/${category}/${tier}`,
        }));
      }
    }
  }
  rows.push(contentRow({
    clue_id: 'durable-final', category_set_id: 'durable-final-category', content_kind: 'final', round: 'final', tier: '0',
    macro_topic: 'durable-final-topic', category_name_en: 'English durable Final', category_name_et: 'Eesti püsiv finaal',
    clue_en: 'English durable Final prompt', clue_et: 'Eesti püsiv finaalvihje',
    response_en: 'English durable Final answer', response_et: 'Eesti püsiv finaalvastus',
    accepted_variants_en: 'English durable Final alias', accepted_variants_et: 'Eesti püsiv finaalvariant',
    explanation_en: 'English durable Final explanation', explanation_et: 'Eesti püsiv finaalselgitus',
    source_url: 'https://example.com/durable/final',
  }));
  writeFileSync(destination, `\uFEFF${stringify(rows, { header: true, columns: CSV_COLUMNS, record_delimiter: 'windows' })}`, 'utf8');
}

function launch(userData: string): Promise<ElectronApplication> {
  return electron.launch({
    cwd: process.cwd(),
    executablePath: path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-clock', '--quiz-stage-e2e-network-guard'],
  });
}

function watchPage(page: Page, errors: string[]): void {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
}

async function chooseFile(application: ElectronApplication, source: string): Promise<void> {
  await application.evaluate(async ({ dialog }, filePath) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [filePath], bookmarks: [] });
  }, source);
}

async function chooseExport(application: ElectronApplication, destination: string): Promise<void> {
  await application.evaluate(async ({ dialog }, filePath) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath, bookmark: '' });
  }, destination);
}

async function commitDailyDoubleIfNeeded(host: Page): Promise<void> {
  const wager = host.getByRole('spinbutton', { name: 'Duubli panus' });
  if (await wager.isVisible()) {
    await wager.fill('5');
    await host.getByRole('button', { name: 'Kinnita panus' }).click();
  }
}

async function selectNextClue(host: Page): Promise<void> {
  const tile = host.locator('.public-board button:not([disabled])').first();
  await expect(tile).toBeEnabled();
  await tile.click();
  await commitDailyDoubleIfNeeded(host);
  await expect(host.locator('.public-clue .clue-prompt')).toBeVisible();
}

async function judgeCurrentCorrect(host: Page): Promise<void> {
  const team = host.getByRole('region', { name: 'Võistkondade juhtnupud' }).locator('button:not([disabled])').first();
  await expect(team).toBeEnabled();
  await team.click();
  await host.getByRole('button', { name: 'Õige', exact: true }).click();
  await expect(host.locator('.public-response p')).toHaveCount(3);
}

async function continueAfterReveal(host: Page): Promise<void> {
  await host.getByRole('button', { name: 'Jätka', exact: true }).click();
}

test('survives a private Estonian eight-team match, restart, completion, history, and pack round trip', async () => {
  const resultRoot = path.join(process.cwd(), 'test-results', 'durable-product');
  mkdirSync(resultRoot, { recursive: true });
  const isolated = mkdtempSync(path.join(resultRoot, 'run-'));
  const userData = path.join(isolated, 'user-data');
  const fixtureCsv = path.join(isolated, 'fixture.csv');
  const exportedCsv = path.join(isolated, 'exported.csv');
  writePackFixture(fixtureCsv);
  const observedRequests: string[] = [];
  const runtimeErrors: string[] = [];
  let application: ElectronApplication | null = null;
  try {
    application = await launch(userData);
    application.on('window', (page) => watchPage(page, runtimeErrors));
    const context = application.context();
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
        observedRequests.push(url.href);
        await route.abort();
        return;
      }
      await route.continue();
    });
    let host = await application.firstWindow();
    watchPage(host, runtimeErrors);

    await host.getByRole('button', { name: 'Content Library' }).click();
    await chooseFile(application, fixtureCsv);
    await host.getByRole('button', { name: 'Import CSV' }).click();
    await expect(host.getByRole('heading', { name: `Import preview: ${PACK_NAME}` })).toBeVisible();
    await expect(host.getByText('All rows are valid.')).toBeVisible();
    await host.getByRole('button', { name: 'Import pack' }).click();
    await expect(host.getByRole('heading', { name: PACK_NAME })).toBeVisible();
    await host.getByRole('button', { name: 'Back to Home' }).click();
    await host.getByRole('button', { name: 'New Match' }).click();
    for (let count = 2; count < 8; count += 1) await host.getByRole('button', { name: 'Add team' }).click();
    await host.getByRole('radio', { name: 'Estonian' }).check();
    const teamNames = await host.locator('.team-editor input[type="text"]').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
    expect(teamNames).toHaveLength(8);
    expect(new Set(teamNames).size).toBe(8);
    await host.getByRole('radio', { name: 'Raske' }).check();
    await host.getByRole('radio', { name: 'Kaks ekraani' }).check();
    await host.getByRole('combobox', { name: 'Vihje aeg' }).selectOption('5');
    const packFieldset = host.getByRole('group', { name: 'Sisupaketid' });
    for (const checkbox of await packFieldset.getByRole('checkbox').all()) {
      const name = await checkbox.locator('xpath=..').innerText();
      if (name.includes(PACK_NAME)) await checkbox.check(); else await checkbox.uncheck();
    }
    await expect(host.getByRole('button', { name: 'Alusta mängu' })).toBeEnabled();
    await host.getByRole('button', { name: 'Alusta mängu' }).click();
    await expect.poll(() => application!.windows().length).toBe(2);
    let publicWindow = application.windows().find((page) => page !== host)!;
    watchPage(publicWindow, runtimeErrors);
    await expect(host.getByRole('grid', { name: 'Esimese vooru mängulaud' })).toBeVisible();
    await expect(publicWindow.getByRole('grid', { name: 'Esimese vooru mängulaud' })).toBeVisible();

    await selectNextClue(host);
    const promptBeforeReport = await host.locator('.public-clue .clue-prompt').innerText();
    expect(promptBeforeReport).toMatch(/^Eesti püsiv vihje/);
    const privateDetails = host.getByRole('region', { name: 'Privaatsed vihjeandmed' });
    await expect(privateDetails).toContainText('Eesti vastus');
    await expect(host.getByRole('region', { name: 'Ingliskeelne originaal' })).toContainText('English durable prompt');
    await expect(publicWindow.locator('body')).not.toContainText('English durable');
    await expect(publicWindow.locator('body')).not.toContainText('Eesti vastus');
    await expect(publicWindow.locator('body')).not.toContainText('Eesti selgitus');
    await expect(publicWindow.locator('body')).not.toContainText('Durable source');
    await host.getByLabel('Vihjest teatamise põhjus').fill(REPORT_NOTE);
    await host.getByRole('button', { name: 'Teata praegusest vihjest' }).click();
    await expect(host.getByRole('grid')).toBeVisible();

    const firstTeam = teamNames[0]!;
    await host.getByLabel('Punktiparanduse põhjus').fill(SCORE_REASON);
    await host.getByLabel(`Võistkonna ${firstTeam} punktid`).fill('1234');
    await host.getByRole('button', { name: `Määra võistkonna ${firstTeam} punktid` }).click();
    await expect(host.locator('.scoreboard')).toContainText('1234');
    await expect(publicWindow.locator('body')).not.toContainText(SCORE_REASON);
    await expect(publicWindow.locator('body')).not.toContainText(REPORT_NOTE);

    await selectNextClue(host);
    await judgeCurrentCorrect(host);
    await host.getByRole('button', { name: 'Võta tagasi' }).click();
    await expect(host.getByRole('button', { name: 'Õige', exact: true })).toBeEnabled();
    await host.getByRole('button', { name: 'Õige', exact: true }).click();
    await expect(host.locator('.public-response p')).toHaveCount(3);
    await continueAfterReveal(host);

    await selectNextClue(host);
    const resumedPrompt = await host.locator('.public-clue .clue-prompt').innerText();
    await host.getByRole('button', { name: 'Peata taimer' }).click();
    await expect(host.getByRole('button', { name: 'Jätka taimerit' })).toBeEnabled();
    const scoresBeforeCrash = await host.locator('.scoreboard').innerText();
    const rootProcess = application.process();
    if (rootProcess.pid === undefined) throw new Error('Electron process ID is unavailable');
    execFileSync('taskkill.exe', ['/PID', String(rootProcess.pid), '/T', '/F'], { stdio: 'ignore' });
    application = null;

    application = await launch(userData);
    application.on('window', (page) => watchPage(page, runtimeErrors));
    host = await application.firstWindow();
    watchPage(host, runtimeErrors);
    await expect(host.getByRole('button', { name: 'Resume Match' })).toBeEnabled();
    await host.getByRole('button', { name: 'Resume Match' }).click();
    await expect.poll(() => application!.windows().length).toBe(2);
    publicWindow = application.windows().find((page) => page !== host)!;
    watchPage(publicWindow, runtimeErrors);
    await expect(host.locator('.public-clue .clue-prompt')).toHaveText(resumedPrompt);
    await expect(publicWindow.locator('.clue-prompt')).toHaveText(resumedPrompt);
    await expect(host.getByRole('button', { name: 'Jätka taimerit' })).toBeEnabled();
    await expect.poll(() => host.locator('.scoreboard').innerText()).toBe(scoresBeforeCrash);
    await expect(host.getByRole('region', { name: 'Privaatsed vihjeandmed' })).toContainText('Eesti vastus');
    await expect(publicWindow.locator('body')).not.toContainText('English durable');
    await expect(publicWindow.locator('body')).not.toContainText('Eesti vastus');
    await expect(publicWindow.locator('body')).not.toContainText('Eesti selgitus');
    await expect(publicWindow.locator('body')).not.toContainText('Durable source');
    await expect(publicWindow.locator('body')).not.toContainText(REPORT_NOTE);
    await expect(publicWindow.locator('body')).not.toContainText(SCORE_REASON);
    await host.getByRole('button', { name: 'Jätka taimerit' }).click();
    await judgeCurrentCorrect(host);
    await continueAfterReveal(host);

    for (let completed = 3; completed < 60; completed += 1) {
      if (completed === 30) await expect(host.getByRole('grid', { name: 'Topeltvooru mängulaud' })).toBeVisible();
      await selectNextClue(host);
      await judgeCurrentCorrect(host);
      await continueAfterReveal(host);
    }
    const finalWagers = host.getByRole('region', { name: 'Finaalipanused' }).locator('input[type="number"]:not([disabled])');
    while (await finalWagers.count()) {
      const before = await finalWagers.count();
      const input = finalWagers.first();
      await input.fill('0');
      await input.locator('xpath=ancestor::form').getByRole('button').click();
      await expect(finalWagers).toHaveCount(before - 1);
    }
    await expect(host.getByRole('timer')).toHaveText('0');
    while (await host.getByRole('button', { name: /Avalda .* õige/ }).count()) {
      await host.getByRole('button', { name: /Avalda .* õige/ }).first().click();
    }
    await expect(host.getByRole('heading', { name: / võidab/ })).toBeVisible();
    await host.getByRole('button', { name: 'Tagasi avalehele' }).click();
    await expect(host.getByRole('button', { name: 'Resume Match' })).toBeDisabled();
    await host.getByRole('button', { name: 'Match History' }).click();
    await expect(host.getByRole('heading', { name: 'Match History' })).toBeVisible();
    await expect(host.getByText('Complete')).toBeVisible();
    await expect(host.getByText(PACK_ID)).toBeVisible();
    await expect(host.getByText(new RegExp(`1\\. ${firstTeam} —`))).toBeVisible();
    const seed = await host.locator('dt', { hasText: 'Seed' }).locator('xpath=..').locator('dd').innerText();
    expect(seed.trim()).not.toBe('');

    await host.getByRole('button', { name: 'Back' }).click();
    await host.getByRole('button', { name: 'Content Library' }).click();
    await expect(host.getByText(REPORT_NOTE)).toBeVisible();
    const packRegion = host.getByRole('region', { name: PACK_NAME });
    await chooseExport(application, exportedCsv);
    await packRegion.getByRole('button', { name: 'Export CSV' }).click();
    await expect.poll(() => existsSync(exportedCsv)).toBe(true);
    await chooseFile(application, exportedCsv);
    await host.getByRole('button', { name: 'Import CSV' }).click();
    await expect(host.getByRole('heading', { name: `Import preview: ${PACK_NAME}` })).toBeVisible();
    await host.getByRole('radio', { name: 'Keep both' }).check();
    await host.getByRole('button', { name: 'Import pack' }).click();
    await expect(host.getByRole('heading', { name: PACK_NAME })).toHaveCount(2);

    expect(observedRequests).toEqual([]);
    expect(await application.evaluate(() =>
      (globalThis as typeof globalThis & { __quizStageExternalRequests?: string[] }).__quizStageExternalRequests,
    )).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  } finally {
    await application?.close().catch(() => undefined);
    rmSync(isolated, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    expect(existsSync(isolated)).toBe(false);
  }
});
