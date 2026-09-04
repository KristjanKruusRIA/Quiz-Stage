import { chromium, expect, test, type Browser, type Page } from '@playwright/test';
import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  spawnPackagedProcess,
  stopPackagedProcess,
  waitForPackagedConnection,
} from '../../scripts/release/packagedProcess';
import type { GameCommand } from '../../src/shared/game/commands';
import type { HostGameView } from '../../src/shared/game/types';
import { mediaAssetUrl, type AudioAssetKey } from '../../src/shared/media/contracts';
import { packagedExecutablePath, prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);
test.setTimeout(300_000);

type HostApi = {
  dispatch(command: GameCommand): Promise<HostGameView>;
  subscribeToState(listener: (view: HostGameView) => void): () => void;
};

interface PackagedMatch {
  browser: Browser;
  host: Page;
  process: ChildProcess;
  userData: string;
}

async function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        server.close();
        reject(new Error('SPECIAL_ROUND_PORT_UNAVAILABLE'));
        return;
      }
      server.close((error) => error === undefined ? resolve(address.port) : reject(error));
    });
  });
}

function pages(match: Pick<PackagedMatch, 'browser'>): Page[] {
  return match.browser.contexts().flatMap((context) => context.pages());
}

async function launchPackagedMatch(): Promise<PackagedMatch> {
  const executable = packagedExecutablePath();
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-special-round-'));
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
  let browser: Browser | null = null;
  try {
    const connected = await waitForPackagedConnection(applicationProcess, async () => {
      const candidate = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      const host = candidate.contexts().flatMap((context) => context.pages()).at(-1);
      if (host === undefined) {
        await candidate.close();
        throw new Error('SPECIAL_ROUND_PACKAGED_PAGE_NOT_READY');
      }
      return { browser: candidate, host };
    }, { attempts: 300 });
    browser = connected.browser;
    const host = connected.host;
    host.setDefaultTimeout(30_000);
    await host.getByRole('button', { name: 'New Match' }).click();
    await host.getByRole('radio', { name: 'English' }).check();
    await host.getByRole('radio', { name: 'Medium' }).check();
    await host.getByRole('radio', { name: 'Dual screen' }).check();
    const start = host.getByRole('button', { name: 'Start match' });
    await expect(start).toBeEnabled({ timeout: 30_000 });
    return { browser, host, process: applicationProcess, userData };
  } catch (error: unknown) {
    await stopPackagedProcess(applicationProcess).catch(() => undefined);
    await browser?.close().catch(() => undefined);
    rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    throw error;
  }
}

async function closePackagedMatch(match: PackagedMatch): Promise<void> {
  await stopPackagedProcess(match.process);
  await match.browser.close().catch(() => undefined);
  rmSync(match.userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}

type AudioProbeEntry = {
  src: string;
  loop: boolean;
  phase: HostGameView['state']['phase'] | null;
  status: 'pending' | 'fulfilled' | 'rejected';
};
type AudioProbeWindow = Window & {
  quizStageAudioPhase?: HostGameView['state']['phase'];
  quizStageAudioProbe?: AudioProbeEntry[];
};
type CategoryProbeWindow = Window & {
  quizStageCategoryObserver?: MutationObserver;
  quizStageCategoryRevealCounts?: number[];
};

async function installAudioProbe(host: Page): Promise<void> {
  await host.evaluate(() => {
    const probeWindow = window as AudioProbeWindow;
    const originalPlay = HTMLMediaElement.prototype.play;
    probeWindow.quizStageAudioProbe = [];
    (window.quizStage as unknown as HostApi).subscribeToState((view) => {
      probeWindow.quizStageAudioPhase = view.state.phase;
    });
    HTMLMediaElement.prototype.play = function play() {
      const entry: AudioProbeEntry = {
        src: this.src,
        loop: this.loop,
        phase: probeWindow.quizStageAudioPhase ?? null,
        status: 'pending',
      };
      probeWindow.quizStageAudioProbe?.push(entry);
      return originalPlay.call(this).then(() => {
        entry.status = 'fulfilled';
      }, (error: unknown) => {
        entry.status = 'rejected';
        throw error;
      });
    };
  });
}

async function expectAudioCue(
  host: Page,
  key: AudioAssetKey,
  loop: boolean,
  phase: HostGameView['state']['phase'],
): Promise<void> {
  const src = mediaAssetUrl(key);
  await expect.poll(() => host.evaluate(({ expectedSrc, expectedLoop, expectedPhase }) =>
    ((window as AudioProbeWindow).quizStageAudioProbe ?? [])
      .some((entry) => entry.src === expectedSrc && entry.loop === expectedLoop
        && entry.phase === expectedPhase && entry.status === 'fulfilled'),
  { expectedSrc: src, expectedLoop: loop, expectedPhase: phase })).toBe(true);
}

async function installCategoryRevealProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    const probeWindow = window as CategoryProbeWindow;
    probeWindow.quizStageCategoryObserver?.disconnect();
    probeWindow.quizStageCategoryRevealCounts = [];
    const record = () => {
      const count = [...document.querySelectorAll('.board-header-row h2')]
        .filter((heading) => (heading.textContent ?? '').trim() !== '').length;
      const counts = probeWindow.quizStageCategoryRevealCounts!;
      if (count > 0 && counts.at(-1) !== count) counts.push(count);
    };
    probeWindow.quizStageCategoryObserver = new MutationObserver(record);
    probeWindow.quizStageCategoryObserver.observe(document.body, {
      childList: true, characterData: true, subtree: true,
    });
    record();
  });
}

async function expectCategoryRevealSequence(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() =>
    (window as CategoryProbeWindow).quizStageCategoryRevealCounts ?? [])).toEqual([1, 2, 3, 4, 5, 6]);
}

async function expectFullPlayerCard(page: Page, selector: string): Promise<void> {
  await expect.poll(async () => {
    const box = await page.locator(selector).boundingBox();
    return box !== null && box.width >= 1_900 && box.height >= 1_060;
  }).toBe(true);
  await expectNoViewportOverflow(page);
}

async function expectNoViewportOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => ({
    viewportHeight: document.documentElement.clientHeight === window.innerHeight,
    viewportWidth: document.documentElement.clientWidth === window.innerWidth,
    horizontal: document.documentElement.scrollWidth <= window.innerWidth,
    vertical: document.documentElement.scrollHeight <= window.innerHeight,
  }))).toEqual({ viewportHeight: true, viewportWidth: true, horizontal: true, vertical: true });
}

async function currentView(host: Page): Promise<HostGameView> {
  return host.evaluate(() => new Promise<HostGameView>((resolve) => {
    let unsubscribe: () => void = () => undefined;
    unsubscribe = (window.quizStage as unknown as HostApi).subscribeToState((view) => {
      unsubscribe();
      resolve(view);
    });
  }));
}

async function advanceToPhase(host: Page, target: 'round-two-board' | 'final-category'): Promise<void> {
  await host.evaluate(async (targetPhase) => {
    const api = window.quizStage as unknown as HostApi;
    const nextView = () => new Promise<HostGameView>((resolve) => {
      let unsubscribe: () => void = () => undefined;
      unsubscribe = api.subscribeToState((view) => {
        unsubscribe();
        resolve(view);
      });
    });
    let view = await nextView();
    const answerCurrentClue = async () => {
      const teamId = view.state.phase === 'daily-double-clue'
        ? view.state.controllingTeamId
        : view.state.config.teams[0]?.id;
      if (teamId === null || teamId === undefined) throw new Error('SPECIAL_ROUND_TEAM_REQUIRED');
      view = await api.dispatch({ type: 'LockTeam', teamId, at: Date.now() });
      view = await api.dispatch({ type: 'JudgeResponse', correct: true, at: Date.now() });
      view = await api.dispatch({ type: 'AdvanceAfterReveal' });
    };

    if (view.state.phase === 'daily-double-clue' || view.state.phase === 'ordinary-clue') {
      await answerCurrentClue();
    }
    const rounds = targetPhase === 'round-two-board' ? ['round-one'] : ['round-one', 'round-two'];
    const clueIds = view.state.boards.filter((board) => rounds.includes(board.round)).flatMap((board) =>
      board.categories.flatMap((category) => category.clues.map((clue) => clue.id)));
    for (const clueId of clueIds.filter((id) => !view.state.usedClueIds.includes(id))) {
      view = await api.dispatch({ type: 'SelectClue', clueId });
      if (view.state.phase === 'daily-double-wager') {
        view = await api.dispatch({ type: 'SubmitDailyDoubleWager', wager: 5 });
      }
      await answerCurrentClue();
      if (view.state.phase === targetPhase) break;
    }
    if (view.state.phase !== targetPhase) throw new Error(`SPECIAL_ROUND_TARGET_REQUIRED:${targetPhase}:${view.state.phase}`);
  }, target);
}

test('gives the player automatic opening, round, Daily Double, and Final presentations while the host keeps controls', async ({}, testInfo) => {
  const match = await launchPackagedMatch();
  try {
    expect(match.host.url()).toBe('app://renderer/index.html');
    await installAudioProbe(match.host);
    await match.host.getByRole('button', { name: 'Start match' }).click();
    const hostRoundOne = match.host.getByRole('grid', { name: 'Round One board' });
    await expect(hostRoundOne).toBeVisible({ timeout: 30_000 });
    await expect(hostRoundOne.getByRole('button').first()).toBeEnabled();
    await expect.poll(() => pages(match).length).toBe(2);
    const publicWindow = pages(match).find((window) => window !== match.host);
    expect(publicWindow).toBeDefined();
    await publicWindow!.setViewportSize({ width: 1920, height: 1080 });

    await expect(publicWindow!.getByRole('img', { name: 'Quiz Stage' })).toBeVisible();
    await expect(publicWindow!.getByRole('grid')).toHaveCount(0);
    await expect(publicWindow!.locator('.scoreboard')).toHaveCount(0);
    await installCategoryRevealProbe(publicWindow!);
    await expectAudioCue(match.host, 'opening', true, 'round-one-board');
    await expectFullPlayerCard(publicWindow!, '.opening-logo-screen');
    await publicWindow!.screenshot({ path: testInfo.outputPath('opening-logo.png') });

    await expectCategoryRevealSequence(publicWindow!);
    await expect(publicWindow!.getByRole('grid', { name: 'Round One board' })).toBeVisible();
    await expectNoViewportOverflow(publicWindow!);
    await publicWindow!.screenshot({ path: testInfo.outputPath('round-one-board.png') });

    const initial = await currentView(match.host);
    await match.host.evaluate(async (clueId) => {
      await (window.quizStage as unknown as HostApi).dispatch({ type: 'SelectClue', clueId });
    }, initial.state.dailyDoubleClueIds[0]!);

    await expect(publicWindow!.getByRole('heading', { name: 'Daily Double' })).toBeVisible();
    await expect(match.host.getByRole('heading', { name: 'Daily Double' })).toHaveCount(0);
    await expect(match.host.getByRole('spinbutton', { name: 'Daily Double wager' })).toBeVisible();
    await expect(publicWindow!.locator('.scoreboard')).toHaveCount(0);
    expect(await publicWindow!.locator('.daily-double-screen').evaluate((element) => {
      const style = getComputedStyle(element);
      return { name: style.animationName, duration: style.animationDuration };
    })).toEqual({ name: 'special-round-arrival', duration: '0.72s' });
    await expectAudioCue(match.host, 'daily-double', false, 'daily-double-wager');
    await expectFullPlayerCard(publicWindow!, '.daily-double-screen');
    await publicWindow!.screenshot({ path: testInfo.outputPath('daily-double.png') });

    await match.host.getByRole('spinbutton', { name: 'Daily Double wager' }).fill('5');
    await match.host.getByRole('button', { name: 'Commit wager' }).click();
    await expect(publicWindow!.locator('.public-clue .clue-prompt')).toBeVisible();

    await advanceToPhase(match.host, 'round-two-board');
    await expect(match.host.getByRole('grid', { name: 'Double Round board' })).toBeVisible();
    await expect(publicWindow!.getByRole('heading', { level: 1, name: 'Double Round' })).toBeVisible();
    await expect(publicWindow!.getByRole('grid')).toHaveCount(0);
    await expect(publicWindow!.locator('.scoreboard')).toHaveCount(0);
    await installCategoryRevealProbe(publicWindow!);
    await expectAudioCue(match.host, 'round-transition', false, 'round-two-board');
    await expectFullPlayerCard(publicWindow!, '.round-two-intro-screen');
    await publicWindow!.screenshot({ path: testInfo.outputPath('round-two-intro.png') });

    await expectCategoryRevealSequence(publicWindow!);
    await expect(publicWindow!.getByRole('grid', { name: 'Double Round board' })).toBeVisible();
    await expectNoViewportOverflow(publicWindow!);
    await publicWindow!.screenshot({ path: testInfo.outputPath('round-two-board.png') });

    await advanceToPhase(match.host, 'final-category');
    await expect(publicWindow!.getByRole('heading', { level: 1, name: 'Final', exact: true })).toBeVisible();
    await expect(match.host.getByRole('heading', { level: 1, name: 'Final', exact: true })).toHaveCount(0);
    await expect(match.host.getByRole('heading', { name: 'Final category' })).toBeVisible();
    expect(await publicWindow!.locator('.final-intro-screen').evaluate((element) => {
      const style = getComputedStyle(element);
      return { name: style.animationName, duration: style.animationDuration };
    })).toEqual({ name: 'special-round-arrival', duration: '0.72s' });
    await expectAudioCue(match.host, 'round-transition', false, 'final-category');
    await expectFullPlayerCard(publicWindow!, '.final-intro-screen');
    await publicWindow!.screenshot({ path: testInfo.outputPath('final-intro.png') });

    await expect(publicWindow!.getByRole('heading', { name: 'Final category' })).toBeVisible({ timeout: 5_000 });
    const finalCategory = await match.host.locator('.final-category-screen > p').innerText();
    expect(finalCategory.trim()).not.toBe('');
    await expect(publicWindow!.locator('.final-category-screen > p')).toHaveText(finalCategory);
    await publicWindow!.screenshot({ path: testInfo.outputPath('final-category.png') });
    await expectFullPlayerCard(publicWindow!, '.final-category-screen');

    const finalView = await currentView(match.host);
    for (const teamId of finalView.state.finalEligibleTeamIds) {
      await match.host.evaluate(async (id) => {
        await (window.quizStage as unknown as HostApi).dispatch({ type: 'SubmitFinalWager', teamId: id, wager: 0 });
      }, teamId);
    }
    await expect(publicWindow!.locator('.public-final .clue-prompt')).toBeVisible();
    await expectAudioCue(match.host, 'final-tension', true, 'final-clue');
  } finally {
    await closePackagedMatch(match);
  }
});
