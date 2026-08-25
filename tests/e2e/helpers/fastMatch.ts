import { _electron as electron, expect, type ElectronApplication, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { electronExecutablePath } from '../productHarness';

export interface FastMatchOptions {
  teams: 2 | 8;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'et';
  displayMode: 'single' | 'dual';
}

export interface FastMatch {
  application: ElectronApplication;
  host: Page;
  userData: string;
}

const labels = {
  en: {
    newMatch: 'New Match', addTeam: 'Add team', start: 'Start match',
    difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    display: { single: 'Single screen', dual: 'Dual screen' },
    language: 'English',
  },
  et: {
    newMatch: 'Uus mäng', addTeam: 'Lisa võistkond', start: 'Alusta mängu',
    difficulty: { easy: 'Lihtne', medium: 'Keskmine', hard: 'Raske' },
    display: { single: 'Üks ekraan', dual: 'Kaks ekraani' },
    language: 'Estonian',
  },
} as const;

export async function launchFastMatch(options: FastMatchOptions): Promise<FastMatch> {
  const copy = labels[options.language];
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-fast-match-'));
  const application = await electron.launch({
    cwd: process.cwd(),
    executablePath: electronExecutablePath(),
    args: [
      path.join(process.cwd(), '.vite', 'build', 'main.js'),
      `--user-data-dir=${userData}`,
      '--quiz-stage-e2e-clock',
      '--quiz-stage-e2e-network-guard',
    ],
  });
  const host = await application.firstWindow();
  await host.getByRole('button', { name: labels.en.newMatch }).click();
  await host.getByRole('radio', { name: copy.language }).check();
  if (options.teams === 8) {
    for (let team = 2; team < 8; team += 1) await host.getByRole('button', { name: copy.addTeam }).click();
  }
  await host.getByRole('radio', { name: copy.difficulty[options.difficulty] }).check();
  await host.getByRole('radio', { name: copy.display[options.displayMode] }).check();
  await expect(host.getByRole('button', { name: copy.start })).toBeEnabled();
  await host.getByRole('button', { name: copy.start }).click();
  await expect(host.getByRole('grid')).toBeVisible();
  return { application, host, userData };
}

export async function closeFastMatch(match: FastMatch): Promise<void> {
  await match.application.close().catch(() => undefined);
  rmSync(match.userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
