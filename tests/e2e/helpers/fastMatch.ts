import { _electron as electron, expect, type ElectronApplication, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { electronExecutablePath } from '../productHarness';
import type { GameCommand } from '../../../src/shared/game/commands';
import type { HostGameView } from '../../../src/shared/game/types';
import type { MatchHistoryEntry } from '../../../src/shared/ipc/contracts';

export interface FastMatchOptions {
  teams: 2 | 8;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'et';
  displayMode: 'single' | 'dual';
  clueSeconds?: 30;
}

export interface FastMatch {
  application: ElectronApplication;
  host: Page;
  userData: string;
}

export interface CompletedFastMatch {
  phase: HostGameView['state']['phase'];
  usedClues: number;
  dailyDoubles: number;
  winnerTeamId: string | null;
  completionState: MatchHistoryEntry['completionState'] | null;
}

const labels = {
  en: {
    newMatch: 'New Match', addTeam: 'Add team', start: 'Start match',
    difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    display: { single: 'Single screen', dual: 'Dual screen' },
    clueTime: 'Clue time',
    language: 'English',
  },
  et: {
    newMatch: 'Uus mäng', addTeam: 'Lisa võistkond', start: 'Alusta mängu',
    difficulty: { easy: 'Lihtne', medium: 'Keskmine', hard: 'Raske' },
    display: { single: 'Üks ekraan', dual: 'Kaks ekraani' },
    clueTime: 'Vihje aeg',
    language: 'Estonian',
  },
} as const;

export async function launchFastMatch(options: FastMatchOptions, existingUserData?: string): Promise<FastMatch> {
  const copy = labels[options.language];
  const userData = existingUserData ?? mkdtempSync(path.join(tmpdir(), 'quiz-stage-fast-match-'));
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
  if (options.clueSeconds !== undefined) {
    await host.getByRole('combobox', { name: copy.clueTime }).selectOption(String(options.clueSeconds));
  }
  await expect(host.getByRole('button', { name: copy.start })).toBeEnabled();
  await host.getByRole('button', { name: copy.start }).click();
  await expect(host.getByRole('grid')).toBeVisible();
  return { application, host, userData };
}

export async function completeFastMatch(match: FastMatch): Promise<CompletedFastMatch> {
  return match.host.evaluate(async () => {
    type HostApi = {
      dispatch(command: GameCommand): Promise<HostGameView>;
      subscribeToState(listener: (view: HostGameView) => void): () => void;
      listHistory(): Promise<MatchHistoryEntry[]>;
    };
    const api = window.quizStage as unknown as HostApi;
    const waitForState = (predicate: (view: HostGameView) => boolean) => new Promise<HostGameView>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        unsubscribe();
        reject(new Error('FAST_MATCH_STATE_TIMEOUT'));
      }, 5_000);
      let unsubscribe: () => void = () => undefined;
      unsubscribe = api.subscribeToState((view) => {
        if (!predicate(view)) return;
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(view);
      });
    });

    let view = await waitForState(() => true);
    const clueIds = [...view.state.boards]
      .sort((left, right) => left.round.localeCompare(right.round))
      .flatMap((board) => board.categories.flatMap((category) => category.clues.map((clue) => clue.id)));
    let dailyDoubles = 0;
    for (const clueId of clueIds) {
      view = await api.dispatch({ type: 'SelectClue', clueId });
      if (view.state.phase === 'daily-double-wager') {
        dailyDoubles += 1;
        view = await api.dispatch({ type: 'SubmitDailyDoubleWager', wager: 5 });
      }
      const teamId = view.state.phase === 'daily-double-clue'
        ? view.state.controllingTeamId
        : view.state.config.teams[0]?.id;
      if (teamId === null || teamId === undefined) throw new Error('FAST_MATCH_TEAM_REQUIRED');
      view = await api.dispatch({ type: 'LockTeam', teamId, at: Date.now() });
      view = await api.dispatch({ type: 'JudgeResponse', correct: true, at: Date.now() });
      view = await api.dispatch({ type: 'AdvanceAfterReveal' });
    }

    const eligibleTeamIds = view.state.config.teams
      .filter((team) => view.state.scores[team.id] > 0)
      .map((team) => team.id);
    for (const teamId of eligibleTeamIds) {
      view = await api.dispatch({ type: 'SubmitFinalWager', teamId, wager: 0 });
    }
    view = await waitForState((candidate) => candidate.state.timer.status === 'expired');
    for (const teamId of view.state.finalRevealOrder) {
      view = await api.dispatch({ type: 'RevealFinalTeam', teamId, correct: true });
    }

    const history = await api.listHistory();
    const persisted = history.find((entry) => entry.id === view.state.id) ?? null;
    return {
      phase: view.state.phase,
      usedClues: view.state.usedClueIds.length,
      dailyDoubles,
      winnerTeamId: view.state.winnerTeamId,
      completionState: persisted?.completionState ?? null,
    };
  });
}

export async function closeFastMatch(match: FastMatch): Promise<void> {
  await match.application.close().catch(() => undefined);
  rmSync(match.userData, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
