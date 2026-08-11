import type { GameEvent } from '../../shared/game/events';
import type { GameState, RecoveryIssue, Team } from '../../shared/game/types';
import { gameEventSchema, gameStateSchema } from '../../shared/ipc/contracts';
import type { DatabaseConnection } from './database';

export interface ResumableMatch {
  matchId: string;
  snapshotSequence: number;
  eventSequence: number;
  state: GameState;
  events: GameEvent[];
  replayIssue: ReplayIssue | null;
}

export interface RecoveredMatch extends ResumableMatch {
  recoveredFromSnapshotSequence: number;
  skippedInvalidSnapshotSequence: number | null;
  skippedInvalidSnapshotSequences: number[];
}

export type ReplayIssue = RecoveryIssue;

export interface MatchStanding {
  teamId: string;
  name: string;
  color: string;
  score: number;
  rank: number;
}

export interface MatchHistoryEntry {
  id: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  completionState: 'complete' | 'incomplete';
  language: GameState['config']['language'];
  difficulty: GameState['config']['difficulty'];
  packIds: string[];
  seed: string;
  teams: Team[];
  standings: MatchStanding[];
  winnerTeamId: string | null;
}

interface SnapshotRow {
  match_id: string;
  sequence: number;
  event_sequence: number;
  created_at: number;
  state_json: string;
}

interface EventRow {
  id: string;
  match_id: string;
  sequence: number;
  occurred_at: number;
  event_type: string;
  event_json: string;
}

interface ReplayEvents {
  events: GameEvent[];
  replayIssue: ReplayIssue | null;
}

interface HistoryRow extends SnapshotRow {
  started_at: number;
  completed_at: number;
}

export class MatchRepository {
  constructor(private readonly database: DatabaseConnection) {}

  persistTransition(matchId: string, events: GameEvent[], state: GameState, completedAt?: number): void {
    const validatedState = gameStateSchema.parse(state) as GameState;
    const validatedEvents = events.map((event) => gameEventSchema.parse(event) as GameEvent);
    if (validatedState.id !== matchId) throw new Error('Snapshot match ID does not match the transition match ID');
    if (validatedEvents.some((event) => event.matchId !== matchId)) {
      throw new Error('Event match ID does not match the transition match ID');
    }
    if (validatedState.phase === 'complete') {
      if (typeof completedAt !== 'number' || !Number.isInteger(completedAt) || completedAt < 0) {
        throw new Error('A terminal transition requires a nonnegative integer completion time');
      }
    } else if (completedAt !== undefined) {
      throw new Error('Only a terminal transition can include a completion time');
    }

    const stateJson = JSON.stringify(validatedState);
    const eventRows = validatedEvents.map((event) => ({
      event,
      json: JSON.stringify(event),
    }));
    const occurredAt = eventRows.map(({ event }) => event.at);
    const startedAt = occurredAt.length === 0 ? Date.now() : Math.min(...occurredAt);

    this.database.transaction(() => {
      const previousPersistenceTime = this.database.prepare(
        'SELECT COALESCE(MAX(updated_at), 0) FROM matches',
      ).pluck().get() as number;
      const persistedAt = Math.max(Date.now(), previousPersistenceTime + 1);
      this.database.prepare(`
        INSERT INTO matches (id, started_at, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at
      `).run(matchId, startedAt, persistedAt);

      let eventSequence = this.nextSequence('match_events', matchId);
      const insertEvent = this.database.prepare(`
        INSERT INTO match_events (id, match_id, sequence, occurred_at, event_type, event_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const { event, json } of eventRows) {
        insertEvent.run(event.id, matchId, eventSequence++, event.at, event.type, json);
      }

      const snapshotSequence = this.nextSequence('match_snapshots', matchId);
      this.database.prepare(`
        INSERT INTO match_snapshots (match_id, sequence, event_sequence, created_at, state_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(matchId, snapshotSequence, eventSequence - 1, persistedAt, stateJson);

      if (validatedState.phase === 'complete') {
        const result = this.database.prepare(`
          UPDATE matches
          SET completed_at = ?, ended_incomplete = ?, winner_team_id = ?
          WHERE id = ? AND completed_at IS NULL
        `).run(completedAt, validatedState.endedIncomplete ? 1 : 0, validatedState.winnerTeamId, matchId);
        if (result.changes !== 1) throw new Error(`Match ${matchId} is missing or already complete`);
      }
    })();
  }

  readEvents(matchId: string): GameEvent[] {
    const rows = this.database.prepare(
      'SELECT event_json FROM match_events WHERE match_id = ? ORDER BY sequence ASC',
    ).all(matchId) as Array<{ event_json: string }>;
    return rows.map(({ event_json }) => {
      const event = gameEventSchema.parse(JSON.parse(event_json)) as GameEvent;
      if (event.matchId !== matchId) throw new Error('Persisted event match ID does not match its row');
      return event;
    });
  }

  loadResumable(): ResumableMatch | null {
    return this.recoverLatest();
  }

  recoverLatest(): RecoveredMatch | null {
    const rows = this.database.prepare(`
      SELECT snapshots.match_id, snapshots.sequence, snapshots.event_sequence,
             snapshots.created_at, snapshots.state_json
      FROM match_snapshots AS snapshots
      JOIN matches ON matches.id = snapshots.match_id
      WHERE matches.completed_at IS NULL
      ORDER BY matches.updated_at DESC, snapshots.sequence DESC, snapshots.match_id DESC
    `).all() as SnapshotRow[];

    let candidateMatchId: string | null = null;
    let skipCandidateMatch = false;
    let skippedInvalidSnapshotSequences: number[] = [];
    for (const row of rows) {
      if (candidateMatchId !== row.match_id) {
        candidateMatchId = row.match_id;
        skipCandidateMatch = false;
        skippedInvalidSnapshotSequences = [];
      }
      if (skipCandidateMatch) continue;
      const state = this.parseSnapshot(row);
      const replay = state === null ? null : this.readEventsAfter(row);
      if (state !== null && replay !== null) {
        if (state.phase === 'complete') {
          this.completeMatch(row.match_id, row.created_at);
          skipCandidateMatch = true;
          continue;
        }
        return {
          matchId: row.match_id,
          snapshotSequence: row.sequence,
          recoveredFromSnapshotSequence: row.sequence,
          skippedInvalidSnapshotSequence: skippedInvalidSnapshotSequences[0] ?? null,
          skippedInvalidSnapshotSequences: [...skippedInvalidSnapshotSequences],
          eventSequence: row.event_sequence,
          state,
          ...replay,
        };
      }
      skippedInvalidSnapshotSequences.push(row.sequence);
    }
    return null;
  }

  completeMatch(matchId: string, completedAt = Date.now(), recoveredState?: GameState): void {
    if (!Number.isInteger(completedAt) || completedAt < 0) throw new Error('Completion time must be a nonnegative integer');
    if (recoveredState !== undefined) {
      const state = gameStateSchema.parse(recoveredState) as GameState;
      if (state.id !== matchId) throw new Error('Recovered state match ID does not match the completed match ID');
      if (state.phase !== 'complete') throw new Error('Only a complete recovered state can be reconciled');
      const stateJson = JSON.stringify(state);
      this.database.transaction(() => {
        const latestEventSequence = this.database.prepare(
          'SELECT COALESCE(MAX(sequence), 0) FROM match_events WHERE match_id = ?',
        ).pluck().get(matchId) as number;
        if (state.eventSequence !== latestEventSequence) {
          throw new Error('Recovered state cursor does not match the persisted event cursor');
        }
        const previousPersistenceTime = this.database.prepare(
          'SELECT COALESCE(MAX(updated_at), 0) FROM matches',
        ).pluck().get() as number;
        const persistedAt = Math.max(Date.now(), previousPersistenceTime + 1);
        this.database.prepare(`
          INSERT INTO match_snapshots (match_id, sequence, event_sequence, created_at, state_json)
          VALUES (?, ?, ?, ?, ?)
        `).run(matchId, this.nextSequence('match_snapshots', matchId), state.eventSequence, persistedAt, stateJson);
        const result = this.database.prepare(`
          UPDATE matches
          SET completed_at = ?, ended_incomplete = ?, winner_team_id = ?, updated_at = ?
          WHERE id = ? AND completed_at IS NULL
        `).run(completedAt, state.endedIncomplete ? 1 : 0, state.winnerTeamId, persistedAt, matchId);
        if (result.changes !== 1) throw new Error(`Match ${matchId} is missing or already complete`);
      })();
      return;
    }
    const snapshot = this.latestValidSnapshot(matchId);
    if (snapshot === null) throw new Error(`Match ${matchId} has no valid snapshot`);
    if (snapshot.state.phase !== 'complete') throw new Error('Only a complete game state can be added to match history');

    const result = this.database.prepare(`
      UPDATE matches
      SET completed_at = ?, ended_incomplete = ?, winner_team_id = ?
      WHERE id = ? AND completed_at IS NULL
    `).run(completedAt, snapshot.state.endedIncomplete ? 1 : 0, snapshot.state.winnerTeamId, matchId);
    if (result.changes !== 1) throw new Error(`Match ${matchId} is missing or already complete`);
  }

  listHistory(): MatchHistoryEntry[] {
    const rows = this.database.prepare(`
      SELECT matches.id AS match_id, matches.started_at, matches.completed_at,
             snapshots.sequence, snapshots.event_sequence, snapshots.created_at, snapshots.state_json
      FROM matches
      JOIN match_snapshots AS snapshots ON snapshots.match_id = matches.id
      WHERE matches.completed_at IS NOT NULL
        AND snapshots.sequence = (
          SELECT MAX(latest.sequence) FROM match_snapshots AS latest WHERE latest.match_id = matches.id
        )
      ORDER BY matches.completed_at DESC, matches.id DESC
    `).all() as HistoryRow[];

    const history: MatchHistoryEntry[] = [];
    for (const row of rows) {
      const state = this.parseSnapshot(row);
      if (state === null) continue;
      history.push({
        id: row.match_id,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        durationMs: Math.max(0, row.completed_at - row.started_at),
        completionState: state.endedIncomplete ? 'incomplete' : 'complete',
        language: state.config.language,
        difficulty: state.config.difficulty,
        packIds: state.config.packIds,
        seed: state.seed,
        teams: state.config.teams,
        standings: standings(state),
        winnerTeamId: state.winnerTeamId,
      });
    }
    return history;
  }

  private latestValidSnapshot(matchId: string): ResumableMatch | null {
    const rows = this.database.prepare(`
      SELECT match_id, sequence, event_sequence, created_at, state_json
      FROM match_snapshots
      WHERE match_id = ?
      ORDER BY sequence DESC
    `).all(matchId) as SnapshotRow[];
    for (const row of rows) {
      const state = this.parseSnapshot(row);
      if (state !== null) {
        return {
          matchId,
          snapshotSequence: row.sequence,
          eventSequence: row.event_sequence,
          state,
          events: [],
          replayIssue: null,
        };
      }
    }
    return null;
  }

  private parseSnapshot(row: SnapshotRow): GameState | null {
    try {
      const state = gameStateSchema.parse(JSON.parse(row.state_json)) as GameState;
      return state.id === row.match_id && state.eventSequence === row.event_sequence ? state : null;
    } catch {
      return null;
    }
  }

  private readEventsAfter(snapshot: SnapshotRow): ReplayEvents | null {
    if (!Number.isInteger(snapshot.event_sequence) || snapshot.event_sequence < 0) return null;
    const rows = this.database.prepare(`
      SELECT id, match_id, sequence, occurred_at, event_type, event_json
      FROM match_events
      WHERE match_id = ? AND sequence > ?
      ORDER BY sequence ASC
    `).all(snapshot.match_id, snapshot.event_sequence) as EventRow[];
    const validLaterEvents: GameEvent[] = [];
    let expectedSequence = snapshot.event_sequence + 1;
    for (const row of rows) {
      if (row.sequence !== expectedSequence) {
        return { events: validLaterEvents, replayIssue: { sequence: expectedSequence, reason: 'missing-sequence' } };
      }
      let event: GameEvent;
      try {
        event = gameEventSchema.parse(JSON.parse(row.event_json)) as GameEvent;
      } catch {
        return { events: validLaterEvents, replayIssue: { sequence: expectedSequence, reason: 'invalid-event' } };
      }
      if (row.match_id !== snapshot.match_id || event.matchId !== snapshot.match_id) {
        return { events: validLaterEvents, replayIssue: { sequence: expectedSequence, reason: 'match-mismatch' } };
      }
      if (row.id !== event.id || row.occurred_at !== event.at || row.event_type !== event.type) {
        return { events: validLaterEvents, replayIssue: { sequence: expectedSequence, reason: 'row-mismatch' } };
      }
      validLaterEvents.push(event);
      expectedSequence += 1;
    }
    return { events: validLaterEvents, replayIssue: null };
  }

  private nextSequence(table: 'match_events' | 'match_snapshots', matchId: string): number {
    const current = this.database.prepare(
      `SELECT COALESCE(MAX(sequence), 0) FROM ${table} WHERE match_id = ?`,
    ).pluck().get(matchId) as number;
    return current + 1;
  }
}

function standings(state: GameState): MatchStanding[] {
  const ordered = state.config.teams
    .map((team, teamIndex) => ({ team, teamIndex, score: state.scores[team.id] }))
    .sort((left, right) => right.score - left.score || left.teamIndex - right.teamIndex);
  const ranked: MatchStanding[] = [];
  for (const [index, { team, score }] of ordered.entries()) {
    ranked.push({
      teamId: team.id,
      name: team.name,
      color: team.color,
      score,
      rank: index > 0 && ordered[index - 1].score === score ? ranked[index - 1].rank : index + 1,
    });
  }
  return ranked;
}
