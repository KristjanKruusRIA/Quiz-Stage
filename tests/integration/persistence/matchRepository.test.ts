import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGame, applyGameCommand, type SelectedBoards } from '../../../src/shared/game/engine';
import type { GameEvent } from '../../../src/shared/game/events';
import type { GameConfig, GameState } from '../../../src/shared/game/types';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { migrateDatabase } from '../../../src/main/persistence/migrations';
import { MatchRepository } from '../../../src/main/persistence/matchRepository';

const config: GameConfig = {
  language: 'en',
  difficulty: 'easy',
  clueSeconds: 15,
  teams: [
    { id: 't1', name: 'Alpha', color: '#E3B341' },
    { id: 't2', name: 'Beta', color: '#50A7F5' },
  ],
  packIds: ['bundled'],
  displayMode: 'single',
};

const clue = {
  id: 'clue-1', categoryId: 'cat-1', round: 'round-one' as const, tier: 1, value: 200,
  prompt: { en: 'Prompt' }, response: { en: 'Response' }, explanation: { en: 'Explanation' }, source: 'Source',
};
const selectedBoards: SelectedBoards = {
  seed: 'persistence-seed',
  dailyDoubleClueIds: [],
  tiebreakerClues: [{ ...clue, id: 'tiebreaker-1', round: 'tiebreaker' }],
  boards: [{
    id: 'round-one',
    round: 'round-one',
    categories: [{ id: 'cat-1', name: { en: 'Category' }, macroTopic: 'topic', clues: [clue] }],
  }],
};

describe('MatchRepository', () => {
  let directory: string;
  let database: DatabaseConnection;
  let repository: MatchRepository;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'quiz-stage-repository-'));
    database = openDatabase({ filePath: join(directory, 'quiz.sqlite') });
    migrateDatabase(database, join(directory, 'backups'));
    repository = new MatchRepository(database);
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  function selectedTransition(matchId = 'match-1') {
    const initial = { ...createGame(config, selectedBoards, 0), id: matchId };
    return applyGameCommand(initial, { type: 'SelectClue', clueId: clue.id });
  }

  function persistCorruptNewestSnapshotWithLaterEvents() {
    const selected = selectedTransition();
    repository.persistTransition('match-1', selected.events, selected.state);
    repository.persistTransition('match-1', [], selected.state);
    repository.persistTransition('match-1', [
      { id: 'later-timer', matchId: 'match-1', at: 100, type: 'TimerExpired' },
      { id: 'later-undo', matchId: 'match-1', at: 101, type: 'ActionUndone', eventId: selected.events[0].id },
    ], selected.state);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{"invalid":true}', 'match-1', 3);
    return selected;
  }

  it('commits validated events and a snapshot in one transaction', () => {
    const transition = selectedTransition();

    repository.persistTransition('match-1', transition.events, transition.state);

    expect(repository.loadResumable()?.state).toEqual(transition.state);
    expect(repository.readEvents('match-1')).toEqual(transition.events);
    expect(repository.loadResumable()?.state.undoStack[0].state).not.toHaveProperty('config');
    expect(repository.loadResumable()?.state.tiebreakerClues).toEqual(selectedBoards.tiebreakerClues);
  });

  it('rolls back the match, events, and snapshot when a snapshot insert fails', () => {
    const transition = selectedTransition();
    database.exec(`
      CREATE TRIGGER force_snapshot_failure
      BEFORE INSERT ON match_snapshots
      BEGIN
        SELECT RAISE(ABORT, 'forced snapshot failure');
      END;
    `);

    expect(() => repository.persistTransition('match-1', transition.events, transition.state))
      .toThrow(/forced snapshot failure/);

    expect(database.prepare('SELECT COUNT(*) FROM matches').pluck().get()).toBe(0);
    expect(database.prepare('SELECT COUNT(*) FROM match_events').pluck().get()).toBe(0);
    expect(database.prepare('SELECT COUNT(*) FROM match_snapshots').pluck().get()).toBe(0);
  });

  it('rejects invalid state and event JSON before writing', () => {
    const transition = selectedTransition();
    const invalidState = { ...transition.state, unexpected: true } as GameState;
    const invalidEvent = { ...transition.events[0], unexpected: true } as unknown as GameEvent;

    expect(() => repository.persistTransition('match-1', transition.events, invalidState)).toThrow();
    expect(() => repository.persistTransition('match-1', [invalidEvent], transition.state)).toThrow();
    expect(database.prepare('SELECT COUNT(*) FROM matches').pluck().get()).toBe(0);
  });

  it('loads the latest resumable valid snapshot and skips corrupt newer data', () => {
    const older = selectedTransition('older-match');
    const newer = selectedTransition('newer-match');
    const olderEvent: GameEvent = { id: 'older-event', matchId: 'older-match', at: 100, type: 'TimerExpired' };
    const newerEvent: GameEvent = { id: 'newer-event', matchId: 'newer-match', at: 200, type: 'TimerExpired' };
    repository.persistTransition('older-match', [olderEvent], older.state);
    repository.persistTransition('newer-match', [newerEvent], newer.state);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ?')
      .run('{"invalid":true}', 'newer-match');

    expect(repository.loadResumable()?.state.id).toBe('older-match');
  });

  it('returns precisely the later events when the newest snapshot is corrupt', () => {
    const selected = persistCorruptNewestSnapshotWithLaterEvents();

    const resumed = repository.loadResumable();

    expect(resumed?.snapshotSequence).toBe(2);
    expect(resumed?.eventSequence).toBe(1);
    expect(resumed?.state).toEqual(selected.state);
    expect(resumed?.events).toEqual([
      { id: 'later-timer', matchId: 'match-1', at: 100, type: 'TimerExpired' },
      { id: 'later-undo', matchId: 'match-1', at: 101, type: 'ActionUndone', eventId: selected.events[0].id },
    ]);
    expect(resumed?.replayIssue).toBeNull();
  });

  it('stops replay before an invalid event and does not return a later valid event', () => {
    persistCorruptNewestSnapshotWithLaterEvents();
    database.prepare('UPDATE match_events SET event_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{"type":"unknown"}', 'match-1', 2);

    const resumed = repository.loadResumable();

    expect(resumed?.events).toEqual([]);
    expect(resumed?.replayIssue).toEqual({ sequence: 2, reason: 'invalid-event' });
  });

  it('stops replay before a wrong-match payload and does not return a later same-match event', () => {
    persistCorruptNewestSnapshotWithLaterEvents();
    database.prepare('UPDATE match_events SET event_json = ? WHERE match_id = ? AND sequence = ?')
      .run(JSON.stringify({ id: 'later-timer', matchId: 'other-match', at: 100, type: 'TimerExpired' }), 'match-1', 2);

    const resumed = repository.loadResumable();

    expect(resumed?.events).toEqual([]);
    expect(resumed?.replayIssue).toEqual({ sequence: 2, reason: 'match-mismatch' });
  });

  it('stops replay at a missing event sequence and does not return events beyond the gap', () => {
    persistCorruptNewestSnapshotWithLaterEvents();
    database.prepare('DELETE FROM match_events WHERE match_id = ? AND sequence = ?').run('match-1', 2);

    const resumed = repository.loadResumable();

    expect(resumed?.events).toEqual([]);
    expect(resumed?.replayIssue).toEqual({ sequence: 2, reason: 'missing-sequence' });
  });

  it('loads a valid snapshot after events represented by its cursor are pruned', () => {
    const selected = selectedTransition();
    repository.persistTransition('match-1', selected.events, selected.state);
    database.prepare('DELETE FROM match_events WHERE match_id = ? AND sequence <= ?').run('match-1', 1);

    const resumed = repository.loadResumable();

    expect(resumed?.eventSequence).toBe(1);
    expect(resumed?.state).toEqual(selected.state);
    expect(resumed?.events).toEqual([]);
    expect(resumed?.replayIssue).toBeNull();
  });

  it('orders resumable matches by persistence even when engine event timestamps tie', () => {
    const older = selectedTransition('z-older-match');
    const newer = selectedTransition('a-newer-match');
    repository.persistTransition('z-older-match', older.events, older.state);
    repository.persistTransition('a-newer-match', newer.events, newer.state);

    expect(repository.loadResumable()?.state.id).toBe('a-newer-match');
  });

  it('validates persisted event JSON again when reading', () => {
    const transition = selectedTransition();
    repository.persistTransition('match-1', transition.events, transition.state);
    database.prepare('UPDATE match_events SET event_json = ? WHERE match_id = ?')
      .run('{"type":"unknown"}', 'match-1');

    expect(() => repository.readEvents('match-1')).toThrow();
  });

  it('completes matches, excludes them from resume, and lists validated history', () => {
    const initial = { ...createGame(config, selectedBoards, 0), id: 'match-1' };
    const ended = applyGameCommand(initial, { type: 'EndIncompleteMatch' });
    repository.persistTransition('match-1', ended.events, ended.state, 5_000);

    expect(repository.loadResumable()).toBeNull();
    expect(repository.listHistory()).toEqual([expect.objectContaining({
      id: 'match-1',
      completedAt: 5_000,
      completionState: 'incomplete',
      language: 'en',
      difficulty: 'easy',
      packIds: ['bundled'],
      seed: 'persistence-seed',
      teams: config.teams,
      standings: [
        { teamId: 't1', name: 'Alpha', color: '#E3B341', score: 0, rank: 1 },
        { teamId: 't2', name: 'Beta', color: '#50A7F5', score: 0, rank: 1 },
      ],
    })]);
  });
});
