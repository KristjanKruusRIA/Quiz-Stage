import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyGameCommand } from '../../../src/shared/game/engine';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { migrateDatabase } from '../../../src/main/persistence/migrations';
import { MatchRepository } from '../../../src/main/persistence/matchRepository';
import { gameState } from '../../unit/renderer/game/fixtures';

describe('MatchRepository recovery', () => {
  let directory: string;
  let database: DatabaseConnection;
  let repository: MatchRepository;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'quiz-stage-recovery-'));
    database = openDatabase({ filePath: join(directory, 'quiz.sqlite') });
    migrateDatabase(database, join(directory, 'backups'));
    repository = new MatchRepository(database);
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  function game(matchId: string) {
    return { ...gameState(), id: matchId };
  }

  it('recovers the newest valid snapshot with deterministic empty recovery metadata', () => {
    const initial = game('match-1');
    repository.persistTransition(initial.id, [], initial);

    expect(repository.recoverLatest()).toEqual(expect.objectContaining({
      matchId: 'match-1',
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequence: null,
      skippedInvalidSnapshotSequences: [],
      replayIssue: null,
    }));
  });

  it('falls back from corrupt newer snapshots and replays only the validated contiguous later prefix', () => {
    const initial = game('match-1');
    repository.persistTransition(initial.id, [], initial);
    const selected = applyGameCommand(initial, {
      type: 'SelectClue', clueId: initial.boards[0].categories[0].clues[0].id,
    }, 200);
    repository.persistTransition(initial.id, selected.events, selected.state);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{"prompt":"must never be surfaced"}', initial.id, 2);

    const recovered = repository.recoverLatest();

    expect(recovered).toEqual(expect.objectContaining({
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequence: 2,
      skippedInvalidSnapshotSequences: [2],
      eventSequence: 0,
      events: selected.events,
      replayIssue: null,
    }));
  });

  it.each([0, 2])('skips a snapshot whose row cursor %s disagrees with its embedded cursor', (cursor) => {
    const initial = game('match-cursor');
    repository.persistTransition(initial.id, [], initial);
    const clue = initial.boards[0].categories.flatMap((category) => category.clues)
      .find((candidate) => !initial.dailyDoubleClueIds.includes(candidate.id))!;
    const selected = applyGameCommand(initial, {
      type: 'SelectClue', clueId: clue.id,
    }, 200);
    repository.persistTransition(initial.id, selected.events, selected.state);
    const revealed = applyGameCommand(selected.state, { type: 'RevealResponse' }, 300);
    repository.persistTransition(initial.id, revealed.events, revealed.state);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{}', initial.id, 3);
    database.prepare('UPDATE match_snapshots SET event_sequence = ? WHERE match_id = ? AND sequence = ?')
      .run(cursor, initial.id, 2);

    const recovered = repository.recoverLatest();

    expect(recovered).toEqual(expect.objectContaining({
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequences: [3, 2],
      eventSequence: 0,
      events: [...selected.events, ...revealed.events],
      replayIssue: null,
    }));
  });

  it('rolls back terminal events, snapshot, and completion metadata when the atomic completion update fails', () => {
    const initial = game('match-atomic-failure');
    repository.persistTransition(initial.id, [], initial);
    const ended = applyGameCommand(initial, { type: 'EndIncompleteMatch' }, 400);
    database.exec(`
      CREATE TRIGGER fail_atomic_completion
      BEFORE UPDATE OF completed_at ON matches
      WHEN NEW.completed_at IS NOT NULL
      BEGIN
        SELECT RAISE(ABORT, 'forced atomic completion failure');
      END;
    `);

    expect(() => repository.persistTransition(initial.id, ended.events, ended.state, 400))
      .toThrow(/forced atomic completion failure/);

    expect(database.prepare('SELECT COUNT(*) FROM match_events WHERE match_id = ?').pluck().get(initial.id)).toBe(0);
    expect(database.prepare('SELECT COUNT(*) FROM match_snapshots WHERE match_id = ?').pluck().get(initial.id)).toBe(1);
    expect(database.prepare('SELECT completed_at FROM matches WHERE id = ?').pluck().get(initial.id)).toBeNull();
    expect(repository.recoverLatest()?.state).toEqual(initial);
    expect(repository.listHistory()).toEqual([]);
  });

  it('reconciles legacy terminal metadata, skips that entire match, and resumes the next valid match', () => {
    const older = game('older-incomplete');
    const legacyTerminal = game('newer-legacy-terminal');
    repository.persistTransition(older.id, [], older);
    repository.persistTransition(legacyTerminal.id, [], legacyTerminal);
    const ended = applyGameCommand(legacyTerminal, { type: 'EndIncompleteMatch' }, 500);
    repository.persistTransition(legacyTerminal.id, ended.events, ended.state, 500);
    database.prepare('UPDATE matches SET completed_at = NULL, ended_incomplete = 0 WHERE id = ?')
      .run(legacyTerminal.id);

    expect(repository.recoverLatest()?.matchId).toBe(older.id);
    expect(repository.listHistory()).toEqual([
      expect.objectContaining({
        id: legacyTerminal.id,
        completedAt: expect.any(Number),
        completionState: 'incomplete',
      }),
    ]);
  });

  it('reconciles and excludes a legacy normally completed match from resume', () => {
    const initial = game('legacy-winner');
    const complete = {
      ...initial,
      phase: 'complete' as const,
      winnerTeamId: 'team-1',
      timer: { ...initial.timer, startedAt: null, status: 'paused' as const },
    };
    repository.persistTransition(initial.id, [], complete, 600);
    database.prepare('UPDATE matches SET completed_at = NULL, winner_team_id = NULL WHERE id = ?')
      .run(initial.id);

    expect(repository.recoverLatest()).toBeNull();
    expect(repository.listHistory()).toEqual([
      expect.objectContaining({
        id: initial.id,
        completionState: 'complete',
        winnerTeamId: 'team-1',
      }),
    ]);
  });

  it('chooses the latest incomplete match with a valid snapshot and never offers completed matches', () => {
    const older = game('z-older');
    const newer = game('a-newer');
    repository.persistTransition(older.id, [], older);
    repository.persistTransition(newer.id, [], newer);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ?').run('{}', newer.id);

    expect(repository.recoverLatest()?.matchId).toBe('z-older');

    const ended = applyGameCommand(older, { type: 'EndIncompleteMatch' }, 300);
    repository.persistTransition(older.id, ended.events, ended.state, 400);
    expect(repository.recoverLatest()).toBeNull();
  });
});
