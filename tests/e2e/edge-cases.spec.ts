import { expect, test } from '@playwright/test';
import BetterSqlite3 from 'better-sqlite3';
import { copyFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { GameCommand } from '../../src/shared/game/commands';
import type { HostGameView } from '../../src/shared/game/types';
import type { MatchHistoryEntry } from '../../src/shared/ipc/contracts';
import { closeFastMatch, launchFastMatch } from './helpers/fastMatch';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

type HostApi = {
  dispatch(command: GameCommand): Promise<HostGameView>;
  subscribeToState(listener: (view: HostGameView) => void): () => void;
  listHistory(): Promise<MatchHistoryEntry[]>;
};

test('skips Final for nonpositive teams and resolves after ten successive tiebreakers', async () => {
  const match = await launchFastMatch({ teams: 2, difficulty: 'hard', language: 'en', displayMode: 'single' });
  try {
    const result = await match.host.evaluate(async () => {
      const api = window.quizStage as unknown as HostApi;
      let unsubscribe: () => void = () => undefined;
      let view = await new Promise<HostGameView>((resolve) => {
        unsubscribe = api.subscribeToState((current) => { unsubscribe(); resolve(current); });
      });
      const clueIds = [...view.state.boards]
        .sort((left, right) => left.round.localeCompare(right.round))
        .flatMap((board) => board.categories.flatMap((category) => category.clues.map((clue) => clue.id)));
      const firstTeamId = view.state.config.teams[0]!.id;
      for (const [index, clueId] of clueIds.entries()) {
        view = await api.dispatch({ type: 'SelectClue', clueId });
        if (view.state.phase === 'daily-double-wager') {
          view = await api.dispatch({ type: 'SubmitDailyDoubleWager', wager: 5 });
        }
        const teamId = view.state.phase === 'daily-double-clue'
          ? view.state.controllingTeamId!
          : firstTeamId;
        view = await api.dispatch({ type: 'LockTeam', teamId, at: Date.now() });
        view = await api.dispatch({ type: 'JudgeResponse', correct: true, at: Date.now() });
        if (index === clueIds.length - 1) {
          for (const team of view.state.config.teams) {
            view = await api.dispatch({
              type: 'AdjustScore',
              teamId: team.id,
              score: 0,
              reason: 'Exercise nonpositive Final boundary',
            });
          }
        }
        view = await api.dispatch({ type: 'AdvanceAfterReveal' });
      }
      const skippedFinal = view.state.phase === 'tiebreaker'
        && view.state.finalEligibleTeamIds.length === 0;
      for (let round = 0; round < 10; round += 1) {
        for (const teamId of view.state.tiebreakerTeamIds) {
          view = await api.dispatch({ type: 'LockTeam', teamId, at: Date.now() });
          view = await api.dispatch({ type: 'JudgeResponse', correct: false, at: Date.now() });
        }
      }
      const tiebreakerNumberAfterTen = view.state.suddenDeathClueNumber;
      const usedTiebreakersAfterTen = view.state.usedTiebreakerClueIds.length;
      view = await api.dispatch({ type: 'LockTeam', teamId: firstTeamId, at: Date.now() });
      view = await api.dispatch({ type: 'JudgeResponse', correct: true, at: Date.now() });
      const history = await api.listHistory();
      return {
        skippedFinal,
        phase: view.state.phase,
        winnerTeamId: view.state.winnerTeamId,
        tiebreakerNumberAfterTen,
        usedTiebreakersAfterTen,
        completionState: history.find((entry) => entry.id === view.state.id)?.completionState ?? null,
      };
    });

    expect(result).toEqual({
      skippedFinal: true,
      phase: 'complete',
      winnerTeamId: expect.any(String),
      tiebreakerNumberAfterTen: 11,
      usedTiebreakersAfterTen: 11,
      completionState: 'complete',
    });
  } finally {
    await closeFastMatch(match);
  }
});

test('rejects invalid wagers and clue reports, and undoes an incorrect judgment', async () => {
  const match = await launchFastMatch({ teams: 2, difficulty: 'medium', language: 'en', displayMode: 'single' });
  try {
    const result = await match.host.evaluate(async () => {
      const api = window.quizStage as unknown as HostApi;
      let unsubscribe: () => void = () => undefined;
      let view = await new Promise<HostGameView>((resolve) => {
        unsubscribe = api.subscribeToState((current) => { unsubscribe(); resolve(current); });
      });
      const roundOneClues = view.state.boards
        .find((board) => board.round === 'round-one')!
        .categories.flatMap((category) => category.clues);
      const ordinary = roundOneClues.find((clue) => !view.state.dailyDoubleClueIds.includes(clue.id))!;
      const dailyDouble = roundOneClues.find((clue) => view.state.dailyDoubleClueIds.includes(clue.id))!;
      view = await api.dispatch({ type: 'SelectClue', clueId: ordinary.id });
      let invalidReportRejected = false;
      try {
        await api.dispatch({ type: 'ReportClue', clueId: dailyDouble.id, reason: 'Wrong active clue' });
      } catch { invalidReportRejected = true; }
      const teamId = view.state.config.teams[0]!.id;
      view = await api.dispatch({ type: 'LockTeam', teamId, at: Date.now() });
      view = await api.dispatch({ type: 'JudgeResponse', correct: false, at: Date.now() });
      const incorrectScore = view.state.scores[teamId];
      view = await api.dispatch({ type: 'UndoLast' });
      const restoredScore = view.state.scores[teamId];
      view = await api.dispatch({ type: 'JudgeResponse', correct: true, at: Date.now() });
      view = await api.dispatch({ type: 'AdvanceAfterReveal' });
      view = await api.dispatch({
        type: 'AdjustScore', teamId, score: 1_234, reason: 'Documented host correction',
      });
      view = await api.dispatch({ type: 'SelectClue', clueId: dailyDouble.id });
      let belowMinimumRejected = false;
      let aboveMaximumRejected = false;
      try { await api.dispatch({ type: 'SubmitDailyDoubleWager', wager: 4 }); } catch { belowMinimumRejected = true; }
      try { await api.dispatch({ type: 'SubmitDailyDoubleWager', wager: 99_999 }); } catch { aboveMaximumRejected = true; }
      view = await api.dispatch({ type: 'SubmitDailyDoubleWager', wager: 5 });
      return {
        invalidReportRejected,
        belowMinimumRejected,
        aboveMaximumRejected,
        incorrectScore,
        restoredScore,
        adjustedScore: view.state.scores[teamId],
        dailyDoubleWager: view.state.dailyDoubleWager,
      };
    });

    expect(result).toEqual({
      invalidReportRejected: true,
      belowMinimumRejected: true,
      aboveMaximumRejected: true,
      incorrectScore: expect.any(Number),
      restoredScore: 0,
      adjustedScore: 1_234,
      dailyDoubleWager: 5,
    });
    expect(result.incorrectScore).toBeLessThan(0);
  } finally {
    await closeFastMatch(match);
  }
});

test('expires a clue timer and allows the host to reveal the unanswered response', async () => {
  const match = await launchFastMatch({
    teams: 2, difficulty: 'easy', language: 'en', displayMode: 'single', clueSeconds: 30,
  });
  try {
    await match.host.evaluate(async () => {
      const api = window.quizStage as unknown as HostApi;
      let unsubscribe: () => void = () => undefined;
      const view = await new Promise<HostGameView>((resolve) => {
        unsubscribe = api.subscribeToState((current) => { unsubscribe(); resolve(current); });
      });
      const clue = view.state.boards
        .find((board) => board.round === 'round-one')!
        .categories.flatMap((category) => category.clues)
        .find((candidate) => !view.state.dailyDoubleClueIds.includes(candidate.id))!;
      await api.dispatch({ type: 'SelectClue', clueId: clue.id });
    });
    await expect(match.host.getByRole('timer')).toHaveText('0');
    const result = await match.host.evaluate(async () => {
      const api = window.quizStage as unknown as HostApi;
      const view = await api.dispatch({ type: 'RevealResponse' });
      return { phase: view.state.phase, responseRevealed: view.state.activeClue?.responseRevealed };
    });
    expect(result).toEqual({ phase: 'clue-reveal', responseRevealed: true });
  } finally {
    await closeFastMatch(match);
  }
});

test('keeps host-only response details out of the public view', async () => {
  const match = await launchFastMatch({ teams: 8, difficulty: 'hard', language: 'et', displayMode: 'dual' });
  try {
    await expect.poll(() => match.application.windows().length).toBe(2);
    const publicWindow = match.application.windows().find((window) => window !== match.host);
    expect(publicWindow).toBeDefined();
    await match.host.locator('.public-board button:not([disabled])').first().click();
    const wager = match.host.getByRole('spinbutton', { name: 'Duubli panus' });
    if (await wager.isVisible()) {
      await wager.fill('5');
      await match.host.getByRole('button', { name: 'Kinnita panus' }).click();
    }
    await expect(match.host.getByRole('region', { name: 'Privaatsed vihjeandmed' })).toBeVisible();
    await expect(publicWindow!.getByRole('region', { name: 'Privaatsed vihjeandmed' })).toHaveCount(0);
    await expect(publicWindow!.locator('.public-response')).toHaveCount(0);
  } finally {
    await closeFastMatch(match);
  }
});

test('migrates a previous-schema database and preserves a recovery backup', async () => {
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-migration-e2e-'));
  const databasePath = path.join(userData, 'quiz-stage.sqlite');
  copyFileSync(path.join(process.cwd(), 'resources', 'content', 'dev-seed.sqlite'), databasePath);
  const previous = new BetterSqlite3(databasePath);
  previous.exec('DROP TABLE category_set_overrides; DELETE FROM schema_version WHERE version = 2;');
  previous.close();

  let match: Awaited<ReturnType<typeof launchFastMatch>> | undefined;
  try {
    match = await launchFastMatch(
      { teams: 2, difficulty: 'easy', language: 'en', displayMode: 'single' },
      userData,
    );
    const migrated = new BetterSqlite3(databasePath, { readonly: true });
    expect(migrated.prepare('SELECT MAX(version) FROM schema_version').pluck().get()).toBe(2);
    expect(migrated.prepare("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'category_set_overrides'").pluck().get()).toBe(1);
    migrated.close();

    const backups = readdirSync(path.join(userData, 'backups')).filter((file) => file.endsWith('.bak'));
    expect(backups).toHaveLength(1);
    const backup = new BetterSqlite3(path.join(userData, 'backups', backups[0]!), { readonly: true });
    expect(backup.prepare('SELECT MAX(version) FROM schema_version').pluck().get()).toBe(1);
    expect(backup.prepare("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'category_set_overrides'").pluck().get()).toBe(0);
    backup.close();
  } finally {
    if (match !== undefined) await closeFastMatch(match);
    else rmSync(userData, { recursive: true, force: true });
  }
});
