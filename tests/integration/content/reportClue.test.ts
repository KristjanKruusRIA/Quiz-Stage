import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApplication } from '../../../src/main/application';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { ContentService } from '../../../src/main/content/contentService';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
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
});
