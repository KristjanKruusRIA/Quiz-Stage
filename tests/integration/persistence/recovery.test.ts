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

  it('chooses the latest incomplete match with a valid snapshot and never offers completed matches', () => {
    const older = game('z-older');
    const newer = game('a-newer');
    repository.persistTransition(older.id, [], older);
    repository.persistTransition(newer.id, [], newer);
    database.prepare('UPDATE match_snapshots SET state_json = ? WHERE match_id = ?').run('{}', newer.id);

    expect(repository.recoverLatest()?.matchId).toBe('z-older');

    const ended = applyGameCommand(older, { type: 'EndIncompleteMatch' }, 300);
    repository.persistTransition(older.id, ended.events, ended.state);
    repository.completeMatch(older.id, 400);
    expect(repository.recoverLatest()).toBeNull();
  });
});
