import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { stringify } from 'csv-stringify/sync';
import { parsePackCsv, validatePack } from '../../src/main/content/csvPacks';
import { openDatabase } from '../../src/main/persistence/database';
import { CSV_COLUMNS } from '../../src/shared/content/csvColumns';
import type { GameEvent } from '../../src/shared/game/events';
import type { GameState } from '../../src/shared/game/types';
import { gameStateSchema } from '../../src/shared/ipc/contracts';
import { electronExecutablePath, prepareE2eApplication, terminateExactProcessTree } from './productHarness';

const PACK_NAME = 'Durable Estonian Pack';
const PACK_ID = 'durable-estonian-pack';
const REPORT_NOTE = 'Durable report note';
const SCORE_REASON = 'Durable score correction';
const CORRECTED_SUFFIX = ' parandatud';
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

function writePackFixture(destination: string): Row[] {
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
  return rows;
}

interface PersistedMatch {
  id: string;
  completedAt: number | null;
  eventSequence: number;
  state: GameState;
}

function readLatestMatch(userData: string): PersistedMatch {
  const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
  try {
    const row = database.prepare(`
      SELECT matches.id, matches.completed_at, snapshots.event_sequence, snapshots.state_json
      FROM matches JOIN match_snapshots AS snapshots ON snapshots.match_id = matches.id
      ORDER BY matches.updated_at DESC, snapshots.sequence DESC LIMIT 1
    `).get() as { id: string; completed_at: number | null; event_sequence: number; state_json: string };
    return {
      id: row.id,
      completedAt: row.completed_at,
      eventSequence: row.event_sequence,
      state: gameStateSchema.parse(JSON.parse(row.state_json)),
    };
  } finally {
    database.close();
  }
}

function readEvents(userData: string, matchId: string): Array<{ sequence: number; event: GameEvent }> {
  const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
  try {
    return (database.prepare(`
      SELECT sequence, event_json FROM match_events WHERE match_id = ? ORDER BY sequence
    `).all(matchId) as Array<{ sequence: number; event_json: string }>).map((row) => ({
      sequence: row.sequence,
      event: JSON.parse(row.event_json) as GameEvent,
    }));
  } finally {
    database.close();
  }
}

function readReport(userData: string, note: string): { clueId: string; matchId: string; resolvedAt: number | null } {
  const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
  try {
    const row = database.prepare(`
      SELECT clue_id, match_id, resolved_at FROM content_reports WHERE note = ?
    `).get(note) as { clue_id: string; match_id: string; resolved_at: number | null };
    return { clueId: row.clue_id, matchId: row.match_id, resolvedAt: row.resolved_at };
  } finally {
    database.close();
  }
}

interface PackIdentity {
  id: string;
  categoryIds: string[];
  clueIds: string[];
}

function readCustomPackIdentities(userData: string): PackIdentity[] {
  const database = openDatabase({ filePath: path.join(userData, 'quiz-stage.sqlite'), readonly: true });
  try {
    const packs = database.prepare(`
      SELECT id FROM content_packs WHERE name = ? AND source = 'custom-csv' ORDER BY id
    `).pluck().all(PACK_NAME) as string[];
    return packs.map((id) => ({
      id,
      categoryIds: database.prepare('SELECT id FROM category_sets WHERE pack_id = ? ORDER BY id').pluck().all(id) as string[],
      clueIds: database.prepare(`
        SELECT clues.id FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id
        WHERE category_sets.pack_id = ? ORDER BY clues.id
      `).pluck().all(id) as string[],
    }));
  } finally {
    database.close();
  }
}

function launch(userData: string): Promise<ElectronApplication> {
  return electron.launch({
    cwd: process.cwd(),
    executablePath: electronExecutablePath(),
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
  const clue = host.locator('.public-clue .clue-prompt');
  await expect.poll(async () => (await wager.isVisible()) || (await clue.isVisible())).toBe(true);
  if (await wager.isVisible()) {
    await wager.fill('5');
    await host.getByRole('button', { name: 'Kinnita panus' }).click();
  }
}

async function selectNextClue(host: Page): Promise<void> {
  const tile = host.locator('.public-board button:not([disabled])').first();
  await expect(tile).toBeEnabled({ timeout: 60_000 });
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
  const fixtureRows = writePackFixture(fixtureCsv);
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
    await expect(publicWindow.getByRole('grid', { name: 'Esimese vooru mängulaud' })).toBeVisible({ timeout: 10_000 });

    await selectNextClue(host);
    let persisted = readLatestMatch(userData);
    const firstClueId = persisted.state.activeClue?.clueId;
    if (firstClueId === undefined) throw new Error('Selected clue was not persisted');
    const firstClue = fixtureRows.find((row) => row.clue_id === firstClueId);
    if (firstClue === undefined) throw new Error(`Selected fixture clue is missing: ${firstClueId}`);
    const promptBeforeReport = await host.locator('.public-clue .clue-prompt').innerText();
    expect(promptBeforeReport).toBe(firstClue.clue_et);
    const privateDetails = host.getByRole('region', { name: 'Privaatsed vihjeandmed' });
    const englishOriginal = host.getByRole('region', { name: 'Ingliskeelne originaal' });
    await expect(privateDetails).toContainText(firstClue.response_et);
    await expect(privateDetails).toContainText(firstClue.explanation_et);
    await expect(privateDetails).toContainText(firstClue.source_title);
    await expect(englishOriginal).toContainText(firstClue.clue_en);
    await expect(englishOriginal).toContainText(firstClue.response_en);
    await expect(englishOriginal).toContainText(firstClue.explanation_en);
    for (const privateText of [firstClue.clue_en, firstClue.response_en, firstClue.explanation_en, firstClue.response_et, firstClue.explanation_et, firstClue.source_title]) {
      await expect(publicWindow.locator('body')).not.toContainText(privateText);
    }
    await host.getByLabel('Vihjest teatamise põhjus').fill(REPORT_NOTE);
    await host.getByRole('button', { name: 'Teata praegusest vihjest' }).click();
    await expect(host.getByRole('grid')).toBeVisible();
    await expect.poll(() => readReport(userData, REPORT_NOTE)).toEqual({
      clueId: firstClueId,
      matchId: persisted.id,
      resolvedAt: null,
    });
    persisted = readLatestMatch(userData);
    expect(persisted.state.activeClue).toBeNull();
    expect(persisted.state.usedClueIds).toContain(firstClueId);

    const firstTeam = teamNames[0]!;
    await host.getByLabel('Punktiparanduse põhjus').fill(SCORE_REASON);
    await host.getByLabel(`Võistkonna ${firstTeam} punktid`).fill('1234');
    await host.getByRole('button', { name: `Määra võistkonna ${firstTeam} punktid` }).click();
    await expect(host.locator('.scoreboard')).toContainText('1234');
    await expect.poll(() => readEvents(userData, persisted.id).some(({ event }) => event.type === 'CommandApplied'
      && event.command.type === 'AdjustScore'
      && event.command.teamId === persisted.state.config.teams[0]?.id
      && event.command.score === 1234
      && event.command.reason === SCORE_REASON)).toBe(true);
    await expect(publicWindow.locator('body')).not.toContainText(SCORE_REASON);
    await expect(publicWindow.locator('body')).not.toContainText(REPORT_NOTE);

    await selectNextClue(host);
    const lockedTeamButton = host.getByRole('region', { name: 'Võistkondade juhtnupud' }).locator('button:not([disabled])').first();
    await lockedTeamButton.click();
    const beforeJudgment = readLatestMatch(userData);
    const judgedTeamId = beforeJudgment.state.activeClue?.lockedTeamId;
    if (judgedTeamId == null) throw new Error('Locked team was not persisted');
    await host.getByRole('button', { name: 'Õige', exact: true }).click();
    await expect(host.locator('.public-response p')).toHaveCount(3);
    const afterJudgment = readLatestMatch(userData);
    const judgedClue = beforeJudgment.state.boards
      .flatMap((board) => board.categories.flatMap((category) => category.clues))
      .find((clue) => clue.id === beforeJudgment.state.activeClue?.clueId);
    if (judgedClue === undefined) throw new Error('Judged clue value was not persisted');
    const judgedScoreDelta = beforeJudgment.state.dailyDoubleWager ?? judgedClue.value;
    expect(afterJudgment.state.scores[judgedTeamId]).toBe(beforeJudgment.state.scores[judgedTeamId] + judgedScoreDelta);
    const judgmentEvent = [...readEvents(userData, persisted.id)].reverse().find(({ event }) => event.type === 'CommandApplied'
      && event.command.type === 'JudgeResponse');
    if (judgmentEvent === undefined) throw new Error('Judgment event was not persisted');
    await host.getByRole('button', { name: 'Võta tagasi' }).click();
    await expect(host.getByRole('button', { name: 'Õige', exact: true })).toBeEnabled();
    const afterUndo = readLatestMatch(userData);
    expect(afterUndo.state.scores).toEqual(beforeJudgment.state.scores);
    expect(afterUndo.eventSequence).toBeGreaterThan(afterJudgment.eventSequence);
    const undoEvent = readEvents(userData, persisted.id).at(-1)?.event;
    expect(undoEvent).toMatchObject({ type: 'ActionUndone', eventId: judgmentEvent.event.id });
    await host.getByRole('button', { name: 'Õige', exact: true }).click();
    await expect(host.locator('.public-response p')).toHaveCount(3);
    const afterRejudgment = readLatestMatch(userData);
    expect(afterRejudgment.state.scores[judgedTeamId]).toBe(afterJudgment.state.scores[judgedTeamId]);
    expect(afterRejudgment.eventSequence).toBeGreaterThan(afterUndo.eventSequence);
    await continueAfterReveal(host);

    await selectNextClue(host);
    const resumedPrompt = await host.locator('.public-clue .clue-prompt').innerText();
    const beforePause = readLatestMatch(userData);
    const resumedClueId = beforePause.state.activeClue?.clueId;
    if (resumedClueId === undefined) throw new Error('Recovery clue was not persisted');
    const recoveryClue = fixtureRows.find((row) => row.clue_id === resumedClueId);
    if (recoveryClue === undefined) throw new Error(`Recovery fixture clue is missing: ${resumedClueId}`);
    expect(resumedPrompt).toBe(recoveryClue.clue_et);
    await host.getByRole('button', { name: 'Peata taimer' }).click();
    await expect(host.getByRole('button', { name: 'Jätka taimerit' })).toBeEnabled();
    const beforeCrash = readLatestMatch(userData);
    expect(beforeCrash.state.activeClue?.clueId).toBe(resumedClueId);
    expect(beforeCrash.state.timer).toMatchObject({ status: 'paused', startedAt: null });
    const timerBeforeCrash = structuredClone(beforeCrash.state.timer);
    const scoresBeforeCrash = await host.locator('.scoreboard').innerText();
    const rootProcess = application.process();
    if (rootProcess.pid === undefined) throw new Error('Electron process ID is unavailable');
    terminateExactProcessTree(rootProcess.pid);
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
    const recovered = readLatestMatch(userData);
    expect(recovered.id).toBe(beforeCrash.id);
    expect(recovered.state.activeClue?.clueId).toBe(resumedClueId);
    expect(recovered.state.timer).toEqual(timerBeforeCrash);
    expect(recovered.state.scores).toEqual(beforeCrash.state.scores);
    const recoveredEvents = readEvents(userData, recovered.id);
    expect(recoveredEvents.some(({ event }) => event.type === 'CommandApplied'
      && event.command.type === 'AdjustScore'
      && event.command.reason === SCORE_REASON)).toBe(true);
    expect(recoveredEvents.some(({ event }) => event.type === 'ActionUndone'
      && event.eventId === judgmentEvent.event.id)).toBe(true);
    expect(readReport(userData, REPORT_NOTE)).toEqual({ clueId: firstClueId, matchId: recovered.id, resolvedAt: null });
    const recoveredPrivate = host.getByRole('region', { name: 'Privaatsed vihjeandmed' });
    const recoveredEnglish = host.getByRole('region', { name: 'Ingliskeelne originaal' });
    await expect(recoveredPrivate).toContainText(recoveryClue.response_et);
    await expect(recoveredPrivate).toContainText(recoveryClue.explanation_et);
    await expect(recoveredPrivate).toContainText(recoveryClue.source_title);
    await expect(recoveredEnglish).toContainText(recoveryClue.clue_en);
    await expect(recoveredEnglish).toContainText(recoveryClue.response_en);
    await expect(recoveredEnglish).toContainText(recoveryClue.explanation_en);
    for (const privateText of [recoveryClue.clue_en, recoveryClue.response_en, recoveryClue.explanation_en, recoveryClue.response_et, recoveryClue.explanation_et, recoveryClue.source_title]) {
      await expect(publicWindow.locator('body')).not.toContainText(privateText);
    }
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
    const completedMatch = readLatestMatch(userData);
    expect(completedMatch.completedAt).not.toBeNull();
    expect(completedMatch.state.phase).toBe('complete');
    expect(completedMatch.state.config).toMatchObject({
      language: 'et', difficulty: 'hard', displayMode: 'dual', packIds: [PACK_ID],
    });
    expect(completedMatch.state.seed.trim()).not.toBe('');
    const orderedStandings = completedMatch.state.config.teams
      .map((team, teamIndex) => ({ team, teamIndex, score: completedMatch.state.scores[team.id] }))
      .sort((left, right) => right.score - left.score || left.teamIndex - right.teamIndex);
    let lastRank = 1;
    const expectedStandingText = orderedStandings.map(({ team, score }, index) => {
      if (index === 0 || orderedStandings[index - 1]?.score !== score) lastRank = index + 1;
      return `${new Intl.NumberFormat('en-GB').format(lastRank)}. ${team.name} — ${new Intl.NumberFormat('en-GB').format(score)}`;
    });
    await host.getByRole('button', { name: 'Tagasi avalehele' }).click();
    await expect(host.getByRole('button', { name: 'Resume Match' })).toBeDisabled();
    await host.getByRole('button', { name: 'Match History' }).click();
    await expect(host.getByRole('heading', { name: 'Match History' })).toBeVisible();
    await expect(host.getByText('Complete')).toBeVisible();
    await expect(host.getByText(PACK_ID)).toBeVisible();
    const historyEntry = host.locator('.history-list article').first();
    expect(await historyEntry.locator('ol li').allInnerTexts()).toEqual(expectedStandingText);
    const seed = await host.locator('dt', { hasText: 'Seed' }).locator('xpath=..').locator('dd').innerText();
    expect(seed.trim()).toBe(completedMatch.state.seed);
    await expect(historyEntry.getByText('Complete', { exact: true })).toBeVisible();
    await expect(historyEntry.getByText(PACK_ID, { exact: true })).toBeVisible();

    await host.getByRole('button', { name: 'Back' }).click();
    await host.getByRole('button', { name: 'New Match' }).click();
    await host.getByRole('radio', { name: 'Hard' }).check();
    const reportedPackGroup = host.getByRole('group', { name: 'Content packs' });
    for (const checkbox of await reportedPackGroup.getByRole('checkbox').all()) {
      const name = await checkbox.locator('xpath=..').innerText();
      if (name.includes(PACK_NAME)) await checkbox.check(); else await checkbox.uncheck();
    }
    await expect(host.getByRole('alert').filter({ hasText: 'Round One: 1 category set missing.' })).toBeVisible();
    await expect(host.getByRole('button', { name: 'Start match' })).toBeDisabled();
    await host.getByRole('button', { name: 'Back' }).click();
    await host.getByRole('button', { name: 'Content Library' }).click();
    await expect(host.getByText(REPORT_NOTE)).toBeVisible();
    await expect(host.getByText(firstClueId, { exact: true })).toBeVisible();
    const tier = Number(firstClue.tier);
    await host.getByRole('button', { name: `Edit reported clue ${firstClue.category_name_en}` }).click();
    await host.getByLabel(`Tier ${tier} clue — English`).fill(`${firstClue.clue_en}${CORRECTED_SUFFIX}`);
    await host.getByLabel(`Tier ${tier} clue — Estonian`).fill(`${firstClue.clue_et}${CORRECTED_SUFFIX}`);
    await host.getByRole('checkbox', { name: `Tier ${tier} enabled` }).check();
    await host.getByRole('button', { name: 'Save category set' }).click();
    await expect(host.getByRole('heading', { name: 'Content Library' })).toBeVisible();
    await expect(host.getByText(REPORT_NOTE)).toHaveCount(0);
    await expect.poll(() => readReport(userData, REPORT_NOTE).resolvedAt).not.toBeNull();
    const packRegion = host.getByRole('region', { name: PACK_NAME });
    await chooseExport(application, exportedCsv);
    await packRegion.getByRole('button', { name: 'Export CSV' }).click();
    await expect.poll(() => existsSync(exportedCsv)).toBe(true);
    const parsedExport = parsePackCsv(readFileSync(exportedCsv, 'utf8'));
    expect(validatePack(parsedExport)).toEqual([]);
    expect(parsedExport.rows).toHaveLength(61);
    const expectedExportRows = fixtureRows.map((row) => row.clue_id === firstClueId
      ? { ...row, clue_en: `${row.clue_en}${CORRECTED_SUFFIX}`, clue_et: `${row.clue_et}${CORRECTED_SUFFIX}` }
      : row);
    expect(parsedExport.rows.map((row) => Object.fromEntries(CSV_COLUMNS.map((column) => [column, row[column]]))))
      .toEqual(expectedExportRows);
    expect(parsedExport.rows.find((row) => row.clue_id === firstClueId)?.enabled).toBe('true');
    expect(parsedExport.rows.find((row) => row.clue_id === 'durable-final')).toMatchObject({
      category_name_en: 'English durable Final', category_name_et: 'Eesti püsiv finaal',
      clue_en: 'English durable Final prompt', clue_et: 'Eesti püsiv finaalvihje',
      response_en: 'English durable Final answer', response_et: 'Eesti püsiv finaalvastus',
      explanation_en: 'English durable Final explanation', explanation_et: 'Eesti püsiv finaalselgitus',
      source_title: 'Durable source', source_url: 'https://example.com/durable/final',
      source_license: 'CC0-1.0', source_retrieved_at: '2026-08-12', translation_status: 'reviewed', enabled: 'true',
    });
    await chooseFile(application, exportedCsv);
    await host.getByRole('button', { name: 'Import CSV' }).click();
    await expect(host.getByRole('heading', { name: `Import preview: ${PACK_NAME}` })).toBeVisible();
    await host.getByRole('radio', { name: 'Keep both' }).check();
    await host.getByRole('button', { name: 'Import pack' }).click();
    await expect(host.getByRole('heading', { name: PACK_NAME })).toHaveCount(2);
    const importedPacks = readCustomPackIdentities(userData);
    expect(importedPacks).toHaveLength(2);
    const originalPack = importedPacks.find((pack) => pack.id === PACK_ID);
    const keptPack = importedPacks.find((pack) => pack.id !== PACK_ID);
    if (originalPack === undefined || keptPack === undefined) throw new Error('Keep Both did not preserve and rewrite pack identities');
    expect(keptPack.categoryIds).toHaveLength(13);
    expect(keptPack.clueIds).toHaveLength(61);
    expect(new Set([...originalPack.categoryIds, ...keptPack.categoryIds]).size).toBe(26);
    expect(new Set([...originalPack.clueIds, ...keptPack.clueIds]).size).toBe(122);

    await host.getByRole('button', { name: 'Back to Home' }).click();
    await host.getByRole('button', { name: 'New Match' }).click();
    await host.getByRole('radio', { name: 'Hard' }).check();
    const availablePackGroup = host.getByRole('group', { name: 'Content packs' });
    for (const checkbox of await availablePackGroup.getByRole('checkbox').all()) await checkbox.uncheck();
    await availablePackGroup.locator(`input[type="checkbox"][value="${keptPack.id}"]`).check();
    await host.getByRole('radio', { name: 'Estonian' }).check();
    await expect(host.getByRole('button', { name: 'Alusta mängu' })).toBeEnabled();
    await host.getByRole('button', { name: 'Alusta mängu' }).click();
    await expect(host.getByRole('grid', { name: 'Esimese vooru mängulaud' })).toBeVisible();
    const keptMatch = readLatestMatch(userData);
    expect(keptMatch.state.config).toMatchObject({ language: 'et', difficulty: 'hard', packIds: [keptPack.id] });
    const selectedBoardClueIds = keptMatch.state.boards.flatMap((board) => board.categories.flatMap((category) => category.clues.map((clue) => clue.id)));
    expect(selectedBoardClueIds).toHaveLength(60);
    expect(selectedBoardClueIds.every((id) => keptPack.clueIds.includes(id))).toBe(true);
    await selectNextClue(host);
    await expect(host.locator('.public-clue .clue-prompt')).toContainText('Eesti püsiv vihje');

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
