import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApplication } from '../../../src/main/application';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { ContentService } from '../../../src/main/content/contentService';
import { GameCoordinator } from '../../../src/main/coordinator/gameCoordinator';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { MatchRepository } from '../../../src/main/persistence/matchRepository';
import { applyGameCommand, createGame, type SelectedBoards } from '../../../src/shared/game/engine';
import type { Clue, GameState } from '../../../src/shared/game/types';
import type { GameConfig } from '../../../src/shared/game/types';

const seedPath = resolve('resources/content/dev-seed.sqlite');
const config: GameConfig = {
  language: 'en', difficulty: 'medium', clueSeconds: 15, displayMode: 'single', packIds: ['dev-library'],
  teams: [
    { id: 'a', name: 'Alpha', color: '#E3B341' },
    { id: 'b', name: 'Beta', color: '#50A7F5' },
  ],
};

describe('clue reporting', () => {
  const directories: string[] = [];
  const connections: DatabaseConnection[] = [];

  afterEach(() => {
    for (const connection of connections.splice(0)) {
      if (connection.open) connection.close();
    }
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  function openCopy(): { database: DatabaseConnection; repository: ContentRepository; service: ContentService } {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-reports-'));
    directories.push(directory);
    const databasePath = join(directory, 'content.sqlite');
    copyFileSync(seedPath, databasePath);
    const database = openDatabase({ filePath: databasePath });
    connections.push(database);
    const repository = new ContentRepository(database);
    return { database, repository, service: new ContentService(repository) };
  }

  function canonicalClue(clue: Clue): Clue {
    return {
      id: clue.id,
      categoryId: clue.categoryId,
      round: clue.round,
      tier: clue.tier,
      value: clue.value,
      prompt: { ...clue.prompt },
      response: { ...clue.response },
      explanation: { ...clue.explanation },
      source: clue.source,
      ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: { ...clue.acceptedResponses } }),
      ...(clue.categoryName === undefined ? {} : { categoryName: { ...clue.categoryName } }),
    };
  }

  function insertAdditionalMediumFinal(database: DatabaseConnection, suffix: string): void {
    const row = database.prepare(`
      SELECT category_sets.pack_id, category_sets.difficulty, category_sets.name_json,
             clues.prompt_json, clues.response_json, clues.explanation_json,
             clues.accepted_responses_json, clues.source
      FROM clues
      JOIN category_sets ON category_sets.id = clues.category_set_id
      WHERE category_sets.round = 'final' AND category_sets.difficulty = 'medium'
      ORDER BY clues.id
      LIMIT 1
    `).get() as {
      pack_id: string;
      difficulty: string;
      name_json: string;
      prompt_json: string;
      response_json: string;
      explanation_json: string;
      accepted_responses_json: string | null;
      source: string;
    };
    const categoryId = `medium-final-extra-${suffix}`;
    const clueId = `${categoryId}-clue`;
    database.prepare(`
      INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
      VALUES (?, ?, 'final', ?, ?, 'final', 1)
    `).run(categoryId, row.pack_id, row.difficulty, row.name_json);
    database.prepare(`
      INSERT INTO clues (
        id, category_set_id, round, tier, value, prompt_json, response_json,
        explanation_json, accepted_responses_json, source, enabled
      ) VALUES (?, ?, 'final', 0, 0, ?, ?, ?, ?, ?, 1)
    `).run(
      clueId,
      categoryId,
      row.prompt_json,
      JSON.stringify({ en: `Extra response ${suffix}`, et: `Lisavastus ${suffix}` }),
      row.explanation_json,
      row.accepted_responses_json,
      row.source,
    );
  }

  function tiebreakerDependencies() {
    const { database, repository: contentRepository, service } = openCopy();
    insertAdditionalMediumFinal(database, 'one');
    insertAdditionalMediumFinal(database, 'two');
    const selected = service.selectForMatch(config, 'tiebreaker-report-seed');
    if (!selected.ok) throw new Error('Expected complete match content');
    const boardIds = selected.boards.flatMap((board) =>
      board.categories.flatMap((category) => category.clues.map((clue) => clue.id)));
    const firstTiebreaker = service.selectNextTiebreaker(
      config,
      selected.seed,
      [...boardIds, selected.finalClue.id],
      0,
    );
    const selectedBoards: SelectedBoards = {
      seed: selected.seed,
      dailyDoubleClueIds: [...selected.dailyDoubleClueIds],
      boards: selected.boards.map((board) => ({
        id: board.id,
        round: board.round,
        categories: board.categories.map((category) => ({
          id: category.id,
          name: { ...category.name },
          macroTopic: category.macroTopic,
          clues: category.clues.map(canonicalClue),
        })),
      })),
      finalClue: canonicalClue(selected.finalClue),
      tiebreakerClues: [canonicalClue(firstTiebreaker)],
    };
    let state = createGame(config, selectedBoards, 1);
    const finalBoardClue = state.boards[1].categories[0].clues[0];
    state = {
      ...state,
      phase: 'round-two-board',
      scores: { a: 0, b: 0 },
      usedClueIds: boardIds.filter((id) => id !== finalBoardClue.id),
    };
    state = applyGameCommand(state, { type: 'SelectClue', clueId: finalBoardClue.id }, 10).state;
    state = applyGameCommand(state, { type: 'RevealResponse' }, 11).state;
    state = applyGameCommand(state, { type: 'AdvanceAfterReveal' }, 12).state;
    const persistedState: GameState = { ...state, eventSequence: 0, undoStack: [] };
    const matchRepository = new MatchRepository(database);
    matchRepository.persistTransition(persistedState.id, [], persistedState);
    const coordinator = new GameCoordinator({
      repository: matchRepository,
      contentService: service,
      now: () => 1_000,
      setTimeout: () => 1,
      clearTimeout: () => undefined,
    });
    return {
      database,
      contentRepository,
      coordinator,
      matchRepository,
      initialState: persistedState,
      reportedClueId: firstTiebreaker.id,
    };
  }

  it('atomically records one unresolved report and disables future selection without mutating the bundled row', () => {
    const { database, repository } = openCopy();
    const clue = repository.loadLibrary().categorySets.find((set) => set.difficulty === 'medium')!.clues[0];
    const first = repository.reportClue({ clueId: clue.id, matchId: null, note: 'Incorrect date', createdAt: 100 });
    const repeated = repository.reportClue({ clueId: clue.id, matchId: null, note: 'Repeated note', createdAt: 200 });

    expect(repeated).toEqual(first);
    expect(repository.listReported()).toEqual([first]);
    expect(repository.isEligible(clue.id)).toBe(false);
    expect(database.prepare('SELECT enabled FROM clues WHERE id = ?').pluck().get(clue.id)).toBe(1);
    expect(database.prepare('SELECT COUNT(*) FROM content_reports').pluck().get()).toBe(1);
  });

  it('Resolve Without Change is idempotent and restores an otherwise-enabled clue after restart', () => {
    const { database, repository } = openCopy();
    const clue = repository.loadLibrary().categorySets.find((set) => set.difficulty === 'medium')!.clues[0];
    repository.reportClue({ clueId: clue.id, matchId: null, note: 'Incorrect date', createdAt: 100 });

    expect(repository.resolveReport(clue.id, 300)).toBe(true);
    expect(repository.resolveReport(clue.id, 400)).toBe(false);
    expect(repository.isEligible(clue.id)).toBe(true);
    expect(repository.listReported()).toEqual([]);
    expect(database.prepare('SELECT resolved_at FROM content_reports WHERE clue_id = ?').pluck().get(clue.id)).toBe(300);
  });

  it('excludes reported board and Final clues from new boards and tiebreaker selection', () => {
    const { repository, service } = openCopy();
    const library = repository.loadLibrary();
    const boardClue = library.categorySets.find((set) =>
      set.difficulty === 'medium' && set.round === 'round-one')!.clues[0];
    const finalClue = library.finalClues.find((clue) => clue.difficulty === 'medium')!;

    service.reportClue({ clueId: boardClue.id, matchId: null, note: 'Bad board clue', createdAt: 100 });
    expect(service.checkAvailability(config)).toEqual({
      ok: false, roundOneMissing: 1, roundTwoMissing: 0, finalMissing: 0,
    });
    service.resolveReport(boardClue.id, 150);
    service.reportClue({ clueId: finalClue.id, matchId: null, note: 'Bad Final clue', createdAt: 200 });
    expect(service.checkAvailability(config)).toEqual({
      ok: false, roundOneMissing: 0, roundTwoMissing: 0, finalMissing: 1,
    });
    expect(() => service.selectNextTiebreaker(config, 'seed', [], 0)).toThrow(
      'No unused Final-eligible clue is available for the tiebreaker',
    );
  });

  it('keeps current match clue content immutable while preserving Task 10 report progression', async () => {
    const { database, repository } = openCopy();
    const application = createApplication(database, { now: () => 100, createSeed: () => 'report-seed' });
    const started = await application.startMatch(config);
    const clue = started.state.boards[0].categories.flatMap((category) => category.clues)
      .find((candidate) => !started.state.dailyDoubleClueIds.includes(candidate.id))!;
    const canonicalBefore = structuredClone(clue);
    await application.coordinator.dispatch({ type: 'SelectClue', clueId: clue.id });
    const publicUpdates: string[] = [];
    application.coordinator.subscribe('public', (view) => publicUpdates.push(JSON.stringify(view)));
    publicUpdates.length = 0;

    const reported = await application.coordinator.dispatch({
      type: 'ReportClue', clueId: clue.id, reason: 'PRIVATE REPORT NOTE 8817',
    });

    expect(reported.state.activeClue).toBeNull();
    expect(reported.state.boards.flatMap((board) => board.categories)
      .flatMap((category) => category.clues).find((candidate) => candidate.id === clue.id)).toEqual(canonicalBefore);
    expect(repository.isEligible(clue.id)).toBe(false);
    expect(repository.listReported()).toMatchObject([{ clueId: clue.id, matchId: reported.state.id }]);
    expect(publicUpdates).toHaveLength(1);
    expect(publicUpdates[0]).not.toContain('PRIVATE REPORT NOTE 8817');
    expect(publicUpdates[0]).not.toContain('contentReports');
    application.close();
  });

  it('rolls back the durable report when match transition persistence fails', async () => {
    const { database, repository } = openCopy();
    const application = createApplication(database, { now: () => 100, createSeed: () => 'rollback-seed' });
    const started = await application.startMatch(config);
    const clue = started.state.boards[0].categories.flatMap((category) => category.clues)
      .find((candidate) => !started.state.dailyDoubleClueIds.includes(candidate.id))!;
    await application.coordinator.dispatch({ type: 'SelectClue', clueId: clue.id });
    const before = application.coordinator.getHostView();
    vi.spyOn(application.repository, 'persistTransition').mockImplementationOnce(() => {
      throw new Error('snapshot write failed');
    });

    await expect(application.coordinator.dispatch({
      type: 'ReportClue', clueId: clue.id, reason: 'Incorrect date',
    })).rejects.toThrow('snapshot write failed');

    expect(application.coordinator.getHostView()).toEqual(before);
    expect(repository.isEligible(clue.id)).toBe(true);
    expect(repository.listReported()).toEqual([]);
    application.close();
  });

  it('keeps Final reporting rejected without creating a content report', async () => {
    const { database, repository } = openCopy();
    const application = createApplication(database, { now: () => 100, createSeed: () => 'final-report-seed' });
    await application.startMatch(config);
    const finalClueId = application.coordinator.getHostView()!.state.finalClue!.id;

    await expect(application.coordinator.dispatch({
      type: 'ReportClue', clueId: finalClueId, reason: 'No Final replacement policy',
    })).rejects.toThrowError(expect.objectContaining({ code: 'NO_ACTIVE_CLUE' }));
    expect(repository.listReported()).toEqual([]);
    application.close();
  });

  it.each([
    {
      failure: 'early content report write',
      installFailure(database: DatabaseConnection, clueId: string) {
        database.exec(`
          CREATE TRIGGER fail_tiebreaker_report
          BEFORE INSERT ON content_reports
          WHEN NEW.clue_id = '${clueId}'
          BEGIN SELECT RAISE(ABORT, 'forced content report failure'); END
        `);
      },
      message: 'forced content report failure',
    },
    {
      failure: 'late reported-state snapshot write',
      installFailure(database: DatabaseConnection, clueId: string) {
        database.exec(`
          CREATE TRIGGER fail_tiebreaker_snapshot
          BEFORE INSERT ON match_snapshots
          WHEN instr(NEW.state_json, '"disabledClueIds":["${clueId}"]') > 0
          BEGIN SELECT RAISE(ABORT, 'forced reported snapshot failure'); END
        `);
      },
      message: 'forced reported snapshot failure',
    },
  ])('rolls back tiebreaker augmentation, report, event, and snapshot after $failure', async ({
    installFailure,
    message,
  }) => {
    const { database, contentRepository, coordinator, matchRepository, reportedClueId } = tiebreakerDependencies();
    await coordinator.resume();
    const before = coordinator.getHostView()!;
    const snapshotCount = database.prepare('SELECT COUNT(*) FROM match_snapshots WHERE match_id = ?')
      .pluck().get(before.state.id);
    const eventCount = database.prepare('SELECT COUNT(*) FROM match_events WHERE match_id = ?')
      .pluck().get(before.state.id);
    installFailure(database, reportedClueId);

    await expect(coordinator.dispatch({
      type: 'ReportClue', clueId: reportedClueId, reason: 'Ambiguous tiebreaker',
    })).rejects.toThrow(message);

    expect(coordinator.getHostView()).toEqual(before);
    expect(contentRepository.listReported()).toEqual([]);
    expect(database.prepare('SELECT COUNT(*) FROM match_snapshots WHERE match_id = ?').pluck().get(before.state.id))
      .toBe(snapshotCount);
    expect(database.prepare('SELECT COUNT(*) FROM match_events WHERE match_id = ?').pluck().get(before.state.id))
      .toBe(eventCount);
    const restart = new GameCoordinator({
      repository: matchRepository,
      contentService: new ContentService(contentRepository),
      now: () => 2_000,
      setTimeout: () => 1,
      clearTimeout: () => undefined,
    });
    expect((await restart.resume())?.state).toEqual(before.state);
  });

  it('commits one tiebreaker report snapshot atomically and recovers the exact published state', async () => {
    const { database, contentRepository, coordinator, matchRepository, reportedClueId } = tiebreakerDependencies();
    await coordinator.resume();
    const before = coordinator.getHostView()!;
    const snapshotCount = database.prepare('SELECT COUNT(*) FROM match_snapshots WHERE match_id = ?')
      .pluck().get(before.state.id) as number;
    const published: GameState[] = [];
    coordinator.subscribe('host', (view) => published.push(view.state));
    published.length = 0;

    const reported = await coordinator.dispatch({
      type: 'ReportClue', clueId: reportedClueId, reason: 'Ambiguous tiebreaker',
    });

    expect(reported.state.activeClue?.clueId).not.toBe(reportedClueId);
    expect(reported.state.disabledClueIds).toContain(reportedClueId);
    expect(contentRepository.listReported()).toMatchObject([{ clueId: reportedClueId }]);
    expect(database.prepare('SELECT COUNT(*) FROM match_snapshots WHERE match_id = ?').pluck().get(before.state.id))
      .toBe(snapshotCount + 1);
    expect(database.prepare('SELECT COUNT(*) FROM match_events WHERE match_id = ?').pluck().get(before.state.id))
      .toBe(1);
    expect(published).toEqual([reported.state]);
    coordinator.dispose();
    const restart = new GameCoordinator({
      repository: matchRepository,
      contentService: new ContentService(contentRepository),
      now: () => 2_000,
      setTimeout: () => 1,
      clearTimeout: () => undefined,
    });
    expect((await restart.resume())?.state).toEqual(reported.state);
  });
});
