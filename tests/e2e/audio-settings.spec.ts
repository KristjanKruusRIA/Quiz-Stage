import { _electron as electron, expect, test, type Page } from '@playwright/test';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AUDIO_ASSET_SPEC } from '../../src/shared/media/contracts';
import type { HostGameView } from '../../src/shared/game/types';
import { electronExecutablePath, prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

type SpeechProbeWindow = Window & {
  quizStageSpeechProbe?: {
    texts: string[];
    finish: () => void;
  };
};

function installSpeechProbe() {
  const probeWindow = window as SpeechProbeWindow;
  let current: { onend: (() => void) | null } | null = null;
  const probe = {
    texts: [] as string[],
    finish: () => {
      const utterance = current;
      current = null;
      utterance?.onend?.();
    },
  };
  class ProbeUtterance {
    lang = '';
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(readonly text: string) {}
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: ProbeUtterance });
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak: (utterance: ProbeUtterance) => {
        probe.texts.push(utterance.text);
        current = utterance;
      },
      cancel: () => { current = null; },
      getVoices: () => [{ name: 'E2E English', lang: 'en-US', localService: true }],
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
  probeWindow.quizStageSpeechProbe = probe;
}

async function currentHostView(page: Page): Promise<HostGameView> {
  return page.evaluate(() => new Promise<HostGameView>((resolve) => {
    let unsubscribe: () => void = () => undefined;
    unsubscribe = (window.quizStage as unknown as {
      subscribeToState(listener: (view: HostGameView) => void): () => void;
    }).subscribeToState((view) => {
      unsubscribe();
      resolve(view);
    });
  }));
}

test('persists audio settings and serves bundled fallback through the pathless protocol', async () => {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-audio-e2e-'));
  const media = path.join(userData, 'media');
  mkdirSync(media);
  writeFileSync(path.join(media, 'opening.wav'), 'malformed personal replacement');
  writeFileSync(path.join(media, 'winner.wav'), 'malformed personal replacement');
  const launch = () => electron.launch({
    cwd: process.cwd(),
    executablePath: electronExecutablePath(),
    args: [path.join(process.cwd(), '.vite', 'build', 'main.js'), `--user-data-dir=${userData}`, '--quiz-stage-e2e-network-guard'],
  });
  let application = await launch();
  try {
    let page = await application.firstWindow();
    await page.getByRole('button', { name: 'Settings' }).click();
    const master = page.getByRole('slider', { name: 'Master volume' });
    await master.fill('0.42');
    await expect(master).toHaveValue('0.42');
    const speech = page.getByRole('checkbox', { name: 'Read English topics and clues aloud' });
    await speech.check();
    await expect(speech).toBeChecked();
    const response = await page.evaluate(async () => {
      const value = await fetch('quiz-stage-media://asset/opening');
      await fetch('quiz-stage-media://asset/winner');
      const head = await fetch('quiz-stage-media://asset/opening', { method: 'HEAD' });
      const rejectedMethod = await fetch('quiz-stage-media://asset/opening', { method: 'POST' });
      const bytes = new Uint8Array(await value.arrayBuffer());
      const invalidRange = await fetch('quiz-stage-media://asset/opening', { headers: { Range: `bytes=${bytes.length}-` } });
      const audio = new Audio('quiz-stage-media://asset/opening');
      const duration = await new Promise<number>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration), { once: true });
        audio.addEventListener('error', () => reject(new Error('audio metadata failed')), { once: true });
        audio.load();
      });
      return {
        ok: value.ok,
        mime: value.headers.get('content-type'),
        riff: String.fromCharCode(...bytes.slice(0, 4)),
        duration,
        head: { status: head.status, length: head.headers.get('content-length'), bytes: (await head.arrayBuffer()).byteLength },
        range: { status: invalidRange.status, accept: invalidRange.headers.get('accept-ranges'), length: invalidRange.headers.get('content-length'), mime: invalidRange.headers.get('content-type') },
        method: { status: rejectedMethod.status, allow: rejectedMethod.headers.get('allow') },
      };
    });
    expect(response).toMatchObject({
      ok: true, mime: 'audio/wav', riff: 'RIFF',
      head: { status: 200, bytes: 0 },
      range: { status: 416, accept: 'bytes', length: '0', mime: 'audio/wav' },
      method: { status: 405, allow: 'GET, HEAD' },
    });
    expect(response.duration).toBeCloseTo(AUDIO_ASSET_SPEC.opening.durationMs / 1_000, 1);
    await expect(page.getByRole('alert', { name: 'Opening audio' })).toContainText('bundled audio');
    await expect(page.getByRole('alert', { name: 'Winner audio' })).toContainText('bundled audio');
    copyFileSync(path.join(process.cwd(), 'resources', 'media', 'audio', 'opening.wav'), path.join(media, 'opening.wav'));
    await page.evaluate(() => fetch('quiz-stage-media://asset/opening').then((result) => result.arrayBuffer()));
    await expect(page.getByRole('alert', { name: 'Opening audio' })).toHaveCount(0);
    await expect(page.getByRole('alert', { name: 'Winner audio' })).toBeVisible();
    await application.close();

    application = await launch();
    page = await application.firstWindow();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.42');
    await expect(page.getByRole('checkbox', { name: 'Read English topics and clues aloud' })).toBeChecked();

    await application.context().addInitScript(installSpeechProbe);
    await page.evaluate(installSpeechProbe);
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('button', { name: 'New Match' }).click();
    await page.getByRole('radio', { name: 'English' }).check();
    await page.getByRole('radio', { name: 'Dual screen' }).check();
    await page.getByRole('button', { name: 'Start match' }).click();
    await expect(page.getByRole('grid', { name: 'Round One board' })).toBeVisible();

    await expect.poll(() => application.windows().length).toBe(2);
    const publicPage = application.windows().find((candidate) => candidate !== page)!;
    await publicPage.waitForLoadState('domcontentloaded');
    const boardView = await currentHostView(page);
    const board = boardView.state.boards.find((candidate) => candidate.round === 'round-one')!;
    for (let index = 0; index < board.categories.length; index += 1) {
      const name = board.categories[index].name.en!;
      await expect(page.getByRole('columnheader', { name, exact: true })).toBeVisible({ timeout: 10_000 });
      await expect(publicPage.getByRole('columnheader', { name, exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() =>
        (window as SpeechProbeWindow).quizStageSpeechProbe?.texts.at(-1))).toBe(name);
      if (index + 1 < board.categories.length) {
        await page.waitForTimeout(500);
        await expect(page.getByRole('columnheader', { name: board.categories[index + 1].name.en!, exact: true })).toHaveCount(0);
        await expect(publicPage.getByRole('columnheader', { name: board.categories[index + 1].name.en!, exact: true })).toHaveCount(0);
      }
      await page.evaluate(() => (window as SpeechProbeWindow).quizStageSpeechProbe?.finish());
    }
    expect(await publicPage.evaluate(() =>
      (window as SpeechProbeWindow).quizStageSpeechProbe?.texts ?? [])).toEqual([]);

    let tileIndex = -1;
    for (let clueIndex = 0; clueIndex < 5 && tileIndex === -1; clueIndex += 1) {
      for (let categoryIndex = 0; categoryIndex < board.categories.length; categoryIndex += 1) {
        const clueId = board.categories[categoryIndex]!.clues[clueIndex]!.id;
        if (!boardView.state.dailyDoubleClueIds.includes(clueId)) {
          tileIndex = clueIndex * board.categories.length + categoryIndex;
          break;
        }
      }
    }
    expect(tileIndex).toBeGreaterThanOrEqual(0);
    await page.locator('.public-board button').nth(tileIndex).click();
    const prompt = await page.locator('.clue-prompt').textContent();
    await expect.poll(() => page.evaluate(() =>
      (window as SpeechProbeWindow).quizStageSpeechProbe?.texts.at(-1))).toBe(prompt);

    const pending = await currentHostView(page);
    expect(pending.state.timer).toMatchObject({
      durationMs: pending.state.timer.durationMs,
      remainingMs: pending.state.timer.durationMs,
      startedAt: null,
      status: 'idle',
    });
    expect(pending.state.timer.narrationSequence).toEqual(expect.any(Number));
    await expect(page.getByRole('button', { name: /^Lock / }).first()).toBeDisabled();
    await page.evaluate(() => (window as SpeechProbeWindow).quizStageSpeechProbe?.finish());
    await expect.poll(async () => (await currentHostView(page)).state.timer.status).toBe('running');
    expect((await currentHostView(page)).state.timer.startedAt).toEqual(expect.any(Number));
    await expect(page.getByRole('button', { name: /^Lock / }).first()).toBeEnabled();

    const narrationBeforeReveal = await page.evaluate(() =>
      [...((window as SpeechProbeWindow).quizStageSpeechProbe?.texts ?? [])]);
    await page.getByRole('button', { name: /^Lock / }).first().click();
    await page.getByRole('button', { name: 'Correct', exact: true }).click();
    await expect(page.locator('.public-response')).toBeVisible();
    await page.waitForTimeout(250);
    expect(await page.evaluate(() =>
      (window as SpeechProbeWindow).quizStageSpeechProbe?.texts ?? [])).toEqual(narrationBeforeReveal);
    expect(await publicPage.evaluate(() =>
      (window as SpeechProbeWindow).quizStageSpeechProbe?.texts ?? [])).toEqual([]);
  } finally {
    await application.close().catch(() => undefined);
    rmSync(userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
