import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyGameCommand } from '../../../src/shared/game/engine';
import { GameCoordinator } from '../../../src/main/coordinator/gameCoordinator';
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

  it('materializes a replay-validated incomplete ending when the terminal snapshot is corrupt', async () => {
    const initial = game('corrupt-incomplete-terminal');
    repository.persistTransition(initial.id, [], initial);
    const ended = applyGameCommand(initial, { type: 'EndIncompleteMatch' }, 700);
    repository.persistTransition(initial.id, ended.events, ended.state, 700);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{}', initial.id, 2);
    database.prepare(`
      UPDATE matches SET completed_at = NULL, ended_incomplete = 0, winner_team_id = NULL WHERE id = ?
    `).run(initial.id);

    const recovered = repository.recoverLatest();
    expect(recovered).toEqual(expect.objectContaining({
      matchId: initial.id,
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequences: [2],
      eventSequence: 0,
      events: ended.events,
      replayIssue: null,
    }));

    const coordinator = new GameCoordinator({ repository, contentService: {} as never, now: () => 800 });
    await expect(coordinator.resumeLatest()).resolves.toBeNull();
    expect(repository.recoverLatest()).toBeNull();
    expect(repository.listHistory()).toEqual([
      expect.objectContaining({
        id: initial.id,
        completedAt: 700,
        completionState: 'incomplete',
        winnerTeamId: null,
      }),
    ]);
  });

  it('materializes a replay-validated normal winner when the terminal snapshot is corrupt', async () => {
    const initial = game('corrupt-winner-terminal');
    const beforeWinner = {
      ...initial,
      phase: 'final-clue' as const,
      scores: { 'team-1': 100, 'team-2': 0 },
      finalEligibleTeamIds: ['team-1'],
      finalRevealOrder: ['team-1'],
      finalWagers: { 'team-1': 50 },
      activeClue: {
        clueId: initial.finalClue!.id,
        lockedOutTeamIds: [],
        lockedTeamId: null,
        responseRevealed: false,
      },
      timer: { durationMs: 30_000, remainingMs: 0, startedAt: null, status: 'expired' as const },
    };
    repository.persistTransition(initial.id, [], beforeWinner);
    const won = applyGameCommand(beforeWinner, { type: 'RevealFinalTeam', teamId: 'team-1', correct: true }, 900);
    repository.persistTransition(initial.id, won.events, won.state, 900);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{}', initial.id, 2);
    database.prepare(`
      UPDATE matches SET completed_at = NULL, ended_incomplete = 0, winner_team_id = NULL WHERE id = ?
    `).run(initial.id);

    const recovered = repository.recoverLatest();
    expect(recovered).toEqual(expect.objectContaining({
      matchId: initial.id,
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequences: [2],
      eventSequence: 0,
      events: won.events,
      replayIssue: null,
    }));

    const coordinator = new GameCoordinator({ repository, contentService: {} as never, now: () => 1_000 });
    await expect(coordinator.resumeLatest()).resolves.toBeNull();
    expect(repository.recoverLatest()).toBeNull();
    expect(repository.listHistory()).toEqual([
      expect.objectContaining({
        id: initial.id,
        completedAt: 900,
        completionState: 'complete',
        winnerTeamId: 'team-1',
      }),
    ]);
  });

  it('rejects an invalid recovered terminal state without changing snapshots or completion metadata', () => {
    const initial = game('rejected-terminal-state');
    repository.persistTransition(initial.id, [], initial);
    const ended = applyGameCommand(initial, { type: 'EndIncompleteMatch' }, 1_100);
    repository.persistTransition(initial.id, ended.events, ended.state, 1_100);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{}', initial.id, 2);
    database.prepare('UPDATE matches SET completed_at = NULL, ended_incomplete = 0 WHERE id = ?').run(initial.id);

    const invalidStates = [
      { state: { ...ended.state, id: 'other-match' }, error: /match ID/ },
      { state: initial, error: /complete recovered state/ },
      { state: { ...ended.state, eventSequence: ended.state.eventSequence + 1 }, error: /cursor/ },
      { state: { ...ended.state, unexpectedPrivateField: 'must not persist' }, error: /unrecognized|unexpected/i },
    ];
    for (const invalid of invalidStates) {
      expect(() => repository.completeMatch(initial.id, 1_200, invalid.state as never)).toThrow(invalid.error);
      expect(database.prepare('SELECT COUNT(*) FROM match_snapshots WHERE match_id = ?').pluck().get(initial.id)).toBe(2);
      expect(database.prepare('SELECT completed_at FROM matches WHERE id = ?').pluck().get(initial.id)).toBeNull();
    }
    expect(repository.recoverLatest()).toEqual(expect.objectContaining({
      matchId: initial.id,
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequences: [2],
      events: ended.events,
      replayIssue: null,
    }));
    expect(repository.listHistory()).toEqual([]);
  });

  it.each(['snapshot insertion', 'completion update'])('rolls back recovered terminal %s failures', (failure) => {
    const initial = game(`reconciliation-${failure.replace(' ', '-')}`);
    repository.persistTransition(initial.id, [], initial);
    const ended = applyGameCommand(initial, { type: 'EndIncompleteMatch' }, 1_300);
    repository.persistTransition(initial.id, ended.events, ended.state, 1_300);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ? AND sequence = ?')
      .run('{}', initial.id, 2);
    database.prepare('UPDATE matches SET completed_at = NULL, ended_incomplete = 0 WHERE id = ?').run(initial.id);
    database.exec(failure === 'snapshot insertion' ? `
      CREATE TRIGGER fail_reconciliation_snapshot
      BEFORE INSERT ON match_snapshots
      WHEN NEW.match_id = '${initial.id}'
      BEGIN SELECT RAISE(ABORT, 'forced reconciliation snapshot failure'); END;
    ` : `
      CREATE TRIGGER fail_reconciliation_completion
      BEFORE UPDATE OF completed_at ON matches
      WHEN NEW.id = '${initial.id}' AND NEW.completed_at IS NOT NULL
      BEGIN SELECT RAISE(ABORT, 'forced reconciliation completion failure'); END;
    `);

    expect(() => repository.completeMatch(initial.id, 1_400, ended.state)).toThrow(/forced reconciliation/);

    expect(database.prepare('SELECT COUNT(*) FROM match_snapshots WHERE match_id = ?').pluck().get(initial.id)).toBe(2);
    expect(database.prepare('SELECT completed_at FROM matches WHERE id = ?').pluck().get(initial.id)).toBeNull();
    expect(repository.recoverLatest()).toEqual(expect.objectContaining({
      matchId: initial.id,
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequences: [2],
      events: ended.events,
    }));
    expect(repository.listHistory()).toEqual([]);
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
