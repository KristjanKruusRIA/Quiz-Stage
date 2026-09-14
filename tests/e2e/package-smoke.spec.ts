import { chromium, expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import type { ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { packagedResourcesDirectory } from '../../scripts/release/packageLayout';
import {
  spawnPackagedProcess,
  stopPackagedProcess,
  waitForPackagedConnection,
} from '../../scripts/release/packagedProcess';
import { releaseTargetFor } from '../../scripts/release/targets';
import { openDatabase } from '../../src/main/persistence/database';
import { gameStateSchema } from '../../src/shared/ipc/contracts';

const packagedSmokeEnabled = process.env.QUIZ_STAGE_PACKAGED_EXECUTABLE !== undefined;
const useDomPointerActivation = process.platform === 'darwin' && process.arch === 'x64';
test.setTimeout(300_000);
test.use({ trace: 'off', screenshot: 'off' });

function reportPackagedSmokeProgress(phase: string, detail?: number): void {
  console.log(`PACKAGED_SMOKE_PROGRESS:${phase}${detail === undefined ? '' : `:${detail}`}`);
}

type PackagedSpeechProbeWindow = Window & { quizStagePackagedSpeechTexts?: string[] };

function installPackagedSpeechProbe() {
  const probeWindow = window as PackagedSpeechProbeWindow;
  const texts: string[] = [];
  class ProbeUtterance {
    lang = '';
    voice: unknown = null;
    volume = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(readonly text: string) {}
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: ProbeUtterance });
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak: (utterance: ProbeUtterance) => {
        texts.push(utterance.text);
        window.setTimeout(() => utterance.onend?.(), 0);
      },
      cancel: () => undefined,
      getVoices: () => [{ name: 'Packaged English', lang: 'en-US', localService: true }],
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
  probeWindow.quizStagePackagedSpeechTexts = texts;
}

async function activateInitialControl(control: Locator): Promise<void> {
  await expect(control).toBeVisible({ timeout: 30_000 });
  await expect(control).toBeEnabled({ timeout: 30_000 });
  if (useDomPointerActivation) {
    await control.evaluate((element) => (element as HTMLElement).click());
    return;
  }
  await control.click();
}

async function activateControl(control: Locator): Promise<void> {
  await expect(control).toBeVisible({ timeout: 30_000 });
  await expect(control).toBeEnabled({ timeout: 30_000 });
  await control.click();
}

async function activateRadio(radio: Locator): Promise<void> {
  await expect(radio).toBeVisible({ timeout: 30_000 });
  await expect(radio).toBeEnabled({ timeout: 30_000 });
  await radio.check();
  await expect(radio).toBeChecked({ timeout: 30_000 });
}

function packagedExecutable(): string {
  const executable = process.env.QUIZ_STAGE_PACKAGED_EXECUTABLE;
  if (executable === undefined || executable.trim() === '') throw new Error('QUIZ_STAGE_PACKAGED_EXECUTABLE is not set');
  return executable;
}

function packagedUserData(executable: string): string {
  const target = releaseTargetFor(process.platform, process.arch);
  const portableMarker = path.join(packagedResourcesDirectory(executable, target), 'portable.flag');
  if (target.forgePlatform === 'win32' && existsSync(portableMarker)) {
    return path.join(path.dirname(executable), 'UserData');
  }
  return process.env.QUIZ_STAGE_PACKAGED_USER_DATA?.trim() || mkdtempSync(path.join(tmpdir(), 'quiz-stage-package-smoke-'));
}

function assertExpectedPackagedClue(userData: string): void {
  const expectedClueId = process.env.QUIZ_STAGE_PACKAGED_EXPECTED_CLUE_ID?.trim();
  if (expectedClueId === undefined || expectedClueId === '') return;

  const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
  try {
    const clueCount = database.prepare('SELECT COUNT(*) FROM clues WHERE id = ?').pluck().get(expectedClueId);
    expect(clueCount).toBe(1);
  } finally {
    database.close();
  }
}

async function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        server.close();
        reject(new Error('PACKAGE_SMOKE_PORT_UNAVAILABLE'));
        return;
      }
      server.close((error) => error === undefined ? resolve(address.port) : reject(error));
    });
  });
}

async function launchPackaged(executable: string, userData: string): Promise<{ browser: Browser; page: Page; process: ChildProcess }> {
  const port = await availablePort();
  const applicationProcess = spawnPackagedProcess(executable, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    '--quiz-stage-e2e-clock',
    '--quiz-stage-e2e-network-guard',
  ], {
    cwd: path.dirname(executable),
    detached: process.platform !== 'win32',
    stdio: 'ignore',
    windowsHide: true,
  });
  const connected = await waitForPackagedConnection(applicationProcess, async () => {
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const page = browser.contexts().flatMap((context) => context.pages()).at(-1);
    if (page === undefined) {
      await browser.close();
      throw new Error('PACKAGED_PAGE_NOT_READY');
    }
    return { browser, page };
  }, { attempts: 300 });
  return { ...connected, process: applicationProcess };
}

async function playTileCorrect(page: Page): Promise<void> {
  const tile = page.locator('.public-board button:not([disabled])').first();
  await activateControl(tile);
  const wager = page.getByRole('spinbutton', { name: 'Daily Double wager' });
  const teamControl = page.getByRole('region', { name: 'Team controls' }).locator('button:not([disabled])').first();
  await expect(wager.or(teamControl).first()).toBeVisible({ timeout: 30_000 });
  if (await wager.isVisible()) {
    await wager.fill('5');
    await activateControl(page.getByRole('button', { name: 'Commit wager' }));
  }
  await activateControl(teamControl);
  await activateControl(page.getByRole('button', { name: 'Correct', exact: true }));
  await activateControl(page.getByRole('button', { name: 'Continue' }));
}

function newestPackagedSnapshot(userData: string) {
  const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
  try {
    const row = database.prepare(`
      SELECT snapshots.state_json
      FROM match_snapshots AS snapshots
      JOIN matches ON matches.id = snapshots.match_id
      ORDER BY matches.updated_at DESC, snapshots.sequence DESC
      LIMIT 1
    `).get() as { state_json: string } | undefined;
    return row === undefined ? null : gameStateSchema.parse(JSON.parse(row.state_json));
  } finally {
    database.close();
  }
}

if (packagedSmokeEnabled) test('runs a complete two-team win sequence without external requests', async () => {
  const executable = packagedExecutable();
  const userData = packagedUserData(executable);
  const shouldCleanupUserData = process.env.QUIZ_STAGE_PACKAGED_USER_DATA === undefined;
  let browser: Browser | null = null;
  let applicationProcess: ChildProcess | null = null;
  const externalRequests: string[] = [];

  try {
    reportPackagedSmokeProgress('launch');
    const launched = await launchPackaged(executable, userData);
    browser = launched.browser;
    applicationProcess = launched.process;
    const page = launched.page;
    page.setDefaultTimeout(30_000);
    reportPackagedSmokeProgress('connected');
    assertExpectedPackagedClue(userData);
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        externalRequests.push(url.href);
      }
    });
    await page.evaluate(installPackagedSpeechProbe);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false');
    await expect.poll(() => page.locator('.home-screen > header').evaluate((element) =>
      getComputedStyle(element).animationDuration)).toBe('0.42s');

    await activateInitialControl(page.getByRole('button', { name: 'Settings' }));
    const reducedMotion = page.getByRole('checkbox', { name: 'Reduce motion' });
    await expect(reducedMotion).not.toBeChecked();
    await reducedMotion.check();
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
    await expect.poll(() => page.getByRole('button', { name: 'Back' }).evaluate((element) => {
      const value = getComputedStyle(element).transitionDuration.split(',')[0]!;
      return value.endsWith('ms') ? Number.parseFloat(value) / 1_000 : Number.parseFloat(value);
    })).toBeLessThanOrEqual(0.000_001);
    await reducedMotion.uncheck();
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false');
    await expect.poll(() => page.getByRole('button', { name: 'Back' }).evaluate((element) => {
      const value = getComputedStyle(element).transitionDuration.split(',')[0]!;
      return value.endsWith('ms') ? Number.parseFloat(value) / 1_000 : Number.parseFloat(value);
    })).toBeCloseTo(0.14, 2);

    await page.getByRole('checkbox', { name: 'Read English topics and clues aloud' }).check();
    await activateControl(page.getByRole('button', { name: 'Back' }));

    reportPackagedSmokeProgress('match-setup');
    await activateInitialControl(page.getByRole('button', { name: 'New Match' }));
    await activateRadio(page.getByRole('radio', { name: 'English' }));
    await activateRadio(page.getByRole('radio', { name: 'Medium' }));
    await page.getByRole('combobox', { name: 'Clue time' }).selectOption('5');
    const adultPack = page.getByRole('checkbox', { name: 'Adult (Mature) / Täiskasvanutele' });
    const estoniaPack = page.getByRole('checkbox', { name: 'Estonia / Eesti' });
    await expect(adultPack).not.toBeChecked();
    await expect(estoniaPack).toBeChecked();
    let startButton = page.getByRole('button', { name: 'Start match' });
    await expect.poll(async () => ({
      enabled: await startButton.isEnabled(),
      alerts: await page.locator('[role="alert"]:not([aria-label])').allTextContents(),
    }), { message: 'Packaged content must support an English/Medium match', timeout: 30_000 }).toEqual({
      enabled: true,
      alerts: [],
    });
    await activateControl(startButton);

    await expect.poll(() => newestPackagedSnapshot(userData), {
      message: 'The first packaged match snapshot must be persisted', timeout: 30_000,
    }).not.toBeNull();
    const firstState = newestPackagedSnapshot(userData);
    expect(firstState).not.toBeNull();
    expect(firstState!.config.speechEnabled).toBe(true);
    expect(firstState!.config.packIds).toContain('built-in-estonia');
    expect(firstState!.config.packIds).not.toContain('built-in-adult');
    const firstSelectedIds = [
      ...firstState!.boards.flatMap((board) => board.categories.flatMap((category) => [
        category.id, ...category.clues.map((clue) => clue.id),
      ])),
      ...(firstState!.finalClue === null ? [] : [firstState!.finalClue.id]),
    ];
    expect(firstSelectedIds.filter((id) => id.startsWith('built-in-adult-'))).toEqual([]);

    await activateControl(page.getByRole('checkbox', { name: 'I understand this ends the current match' }));
    await activateControl(page.getByRole('button', { name: 'End match incomplete' }));
    await activateControl(page.getByRole('button', { name: 'Back to Home' }));
    await activateControl(page.getByRole('button', { name: 'New Match' }));
    await activateRadio(page.getByRole('radio', { name: 'English' }));
    await activateRadio(page.getByRole('radio', { name: 'Medium' }));
    await page.getByRole('combobox', { name: 'Clue time' }).selectOption('5');
    await page.getByRole('checkbox', { name: 'Adult (Mature) / Täiskasvanutele' }).check();
    await expect(page.getByRole('checkbox', { name: 'Adult (Mature) / Täiskasvanutele' })).toBeChecked();
    startButton = page.getByRole('button', { name: 'Start match' });
    await expect.poll(async () => ({
      enabled: await startButton.isEnabled(),
      alerts: await page.locator('[role="alert"]:not([aria-label])').allTextContents(),
    }), { message: 'Packaged Adult content must become available', timeout: 30_000 }).toEqual({
      enabled: true,
      alerts: [],
    });
    await activateControl(startButton);
    await expect.poll(() => newestPackagedSnapshot(userData)?.config.packIds.includes('built-in-adult') ?? false, {
      message: 'The second packaged match must persist Adult selection', timeout: 30_000,
    }).toBe(true);
    await expect.poll(() => page.evaluate(() =>
      (window as PackagedSpeechProbeWindow).quizStagePackagedSpeechTexts?.length ?? 0), {
      message: 'The packaged host must narrate the English board categories', timeout: 30_000,
    }).toBeGreaterThan(0);

    for (let clueNumber = 1; clueNumber <= 60; clueNumber += 1) {
      if (clueNumber === 31) await expect(page.getByRole('grid', { name: 'Double Round board' })).toBeVisible();
      await playTileCorrect(page);
      if (clueNumber % 10 === 0) reportPackagedSmokeProgress('clues', clueNumber);
    }

    reportPackagedSmokeProgress('final');
    for (const input of await page.getByRole('spinbutton', { name: /Final wager for/ }).all()) {
      if (await input.isVisible()) {
        await input.fill('0');
        await activateControl(input.locator('xpath=ancestor::form').getByRole('button'));
      }
    }
    await expect(page.getByRole('timer')).toHaveText('0', { timeout: 35_000 });
    while (await page.getByRole('button', { name: /Reveal .* correct/ }).count()) {
      const reveal = page.getByRole('button', { name: /Reveal .* correct/ }).first();
      const revealName = await reveal.innerText();
      await activateControl(reveal);
      await expect(page.getByRole('button', { name: revealName, exact: true })).toHaveCount(0);
    }

    expect(await page.evaluate(() =>
      (window as PackagedSpeechProbeWindow).quizStagePackagedSpeechTexts?.length ?? 0)).toBeGreaterThan(60);

    await expect(page.getByRole('heading', { name: /wins/ })).toBeVisible();
    await activateControl(page.getByRole('button', { name: 'Back to Home' }));
    await activateControl(page.getByRole('button', { name: 'Match History' }));
    await expect(page.getByRole('heading', { name: 'Match History' })).toBeVisible();
    await expect(page.getByText('Complete', { exact: true })).toBeVisible();
    await expect(page.getByText('Incomplete', { exact: true })).toBeVisible();

    reportPackagedSmokeProgress('persistence');
    const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
    try {
      const completeMatchCount = database.prepare('SELECT COUNT(*) FROM matches WHERE completed_at IS NOT NULL').pluck().get() as number;
      const incompleteMatchCount = database.prepare('SELECT COUNT(*) FROM matches WHERE ended_incomplete = 1').pluck().get() as number;
      expect(completeMatchCount).toBeGreaterThanOrEqual(1);
      expect(incompleteMatchCount).toBeGreaterThanOrEqual(1);
    } finally {
      database.close();
    }

    expect(externalRequests).toEqual([]);
    reportPackagedSmokeProgress('complete');
  } catch (error: unknown) {
    console.error('PACKAGED_SMOKE_ORIGINAL_ERROR', error);
    throw error;
  } finally {
    if (applicationProcess !== null) await stopPackagedProcess(applicationProcess);
    await browser?.close().catch(() => undefined);
    if (shouldCleanupUserData) rmSync(userData, { recursive: true, force: true });
  }
});
