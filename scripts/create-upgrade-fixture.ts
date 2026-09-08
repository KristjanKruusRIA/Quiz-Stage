import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

const ROOT = process.cwd();
const FIXTURE_ROOT = resolve(ROOT, 'tests', 'fixtures', 'previous-version');
const USER_DATA_ROOT = resolve(FIXTURE_ROOT, 'UserData');
const DATABASE_PATH = resolve(USER_DATA_ROOT, 'quiz-stage.sqlite');
const MEDIA_ROOT = resolve(USER_DATA_ROOT, 'media');
const LOGO_PATH = resolve(MEDIA_ROOT, 'logo.png');
const BASELINE_SCHEMA = readFileSync(resolve(ROOT, 'src', 'main', 'persistence', 'sql', '001_initial.sql'), 'utf8');

const BASE_TIMESTAMP = 1_700_000_000_000;
const FIXTURE_PACK_ID = 'previous-version-pack';
const ROUND_ONE_CATEGORY_SET_ID = 'previous-version-round-one-category';
const ROUND_ONE_CLUE_ID = 'previous-version-round-one-clue-100';
const COMPLETED_MATCH_ID = 'previous-version-match-complete';
const AUTOSAVE_MATCH_ID = 'previous-version-match-autosave';
const EXPANSION_CLUE_ID = 'built-in-history-easy-expansion-001';

interface MatchState {
  stateJson: string;
  eventSequence: number;
  snapshotSequence: number;
  events: Array<{
    id: string;
    at: number;
    type: string;
    command?: unknown;
  }>;
}

function seedId(prefix: string, index: number): string {
  return `${prefix}-${index.toString().padStart(3, '0')}`;
}

function teamConfig() {
  return {
    language: 'en',
    difficulty: 'easy',
    clueSeconds: 20,
    displayMode: 'single' as const,
    packIds: [FIXTURE_PACK_ID],
    teams: [
      { id: 'team-a', name: 'Team A', color: '#1f77b4' },
      { id: 'team-b', name: 'Team B', color: '#ff7f0e' },
    ],
  };
}

function matchState(
  matchId: string,
  phase: 'complete' | 'round-one-board',
  at: number,
  winnerTeamId: string | null,
  completed?: boolean,
): MatchState {
  const eventSequence = completed ? 2 : 1;
  const eventPrefix = `${matchId}-event`;
  const events = completed
    ? [
      { id: seedId(eventPrefix, 1), at: at + 1, type: 'CommandApplied' },
      { id: seedId(eventPrefix, 2), at: at + 2, type: 'MatchEnded' },
    ]
    : [{ id: seedId(eventPrefix, 1), at: at + 1, type: 'CommandApplied' }];

  return {
    eventSequence,
    snapshotSequence: completed ? 1 : 1,
    stateJson: JSON.stringify({
      appVersion: '0.1.0',
      id: matchId,
      config: {
        ...teamConfig(),
      },
      seed: 'previous-version-fixture',
      phase,
      boards: [],
      finalClue: null,
      scores: {
        'team-a': phase === 'complete' ? 120 : 20,
        'team-b': 0,
      },
      controllingTeamId: phase === 'complete' ? null : 'team-a',
      activeClue: null,
      usedClueIds: [],
      dailyDoubleClueIds: [ROUND_ONE_CLUE_ID],
      dailyDoubleWager: null,
      finalWagers: {},
      finalEligibleTeamIds: [],
      finalRevealOrder: [],
      finalRevealedTeamIds: [],
      finalJudgments: {},
      tiebreakerClues: [],
      tiebreakerTeamIds: [],
      usedTiebreakerClueIds: [],
      suddenDeathClueNumber: 0,
      winnerTeamId,
      endedIncomplete: !completed,
      lastClosedClueId: null,
      lastClosedPhase: null,
      lastClosedControllingTeamId: null,
      disabledClueIds: [],
      eventSequence,
      undoStack: [],
      ...(phase === 'round-one-board' ? {
        timer: {
          durationMs: teamConfig().clueSeconds * 1000,
          remainingMs: teamConfig().clueSeconds * 1000,
          startedAt: null,
          status: 'idle',
        },
      } : {}),
      ...(completed ? { eventSequence } : {}),
    }),
    events: events.map((event) => ({
      ...event,
      command: event.type === 'CommandApplied'
        ? { type: 'SelectClue', clueId: ROUND_ONE_CLUE_ID }
        : undefined,
    })),
  };
}

function writeLogoFixture(): void {
  const logoBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2fYwAAAABJRU5ErkJggg==',
    'base64',
  );
  mkdirSync(MEDIA_ROOT, { recursive: true });
  writeFileSync(LOGO_PATH, logoBytes);
}

function createMatchRows(database: Database.Database, at: number): void {
  const matchInsert = database.prepare(`
    INSERT INTO matches (id, started_at, updated_at, completed_at, ended_incomplete, winner_team_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const eventInsert = database.prepare(`
    INSERT INTO match_events (id, match_id, sequence, occurred_at, event_type, event_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const snapshotInsert = database.prepare(`
    INSERT INTO match_snapshots (match_id, sequence, event_sequence, created_at, state_json)
    VALUES (?, ?, ?, ?, ?)
  `);

  const completedMatch = matchState(COMPLETED_MATCH_ID, 'complete', at, 'team-a', true);
  matchInsert.run(COMPLETED_MATCH_ID, at, at + 2, at + 3_000, 0, 'team-a');
  for (const [index, event] of completedMatch.events.entries()) {
    eventInsert.run(event.id, COMPLETED_MATCH_ID, index + 1, event.at, event.type, JSON.stringify({
      id: event.id,
      matchId: COMPLETED_MATCH_ID,
      at: event.at,
      type: event.type,
      ...(event.command === undefined ? {} : { command: event.command }),
    }));
  }
  snapshotInsert.run(COMPLETED_MATCH_ID, completedMatch.snapshotSequence, completedMatch.eventSequence, at + 10, completedMatch.stateJson);

  const autosaveMatch = matchState(AUTOSAVE_MATCH_ID, 'round-one-board', at + 10_000, null, false);
  matchInsert.run(AUTOSAVE_MATCH_ID, at + 10_000, at + 10_000 + 2, null, 1, null);
  for (const [index, event] of autosaveMatch.events.entries()) {
    eventInsert.run(event.id, AUTOSAVE_MATCH_ID, index + 1, event.at, event.type, JSON.stringify({
      id: event.id,
      matchId: AUTOSAVE_MATCH_ID,
      at: event.at,
      type: event.type,
      ...(event.command === undefined ? {} : { command: event.command }),
    }));
  }
  snapshotInsert.run(AUTOSAVE_MATCH_ID, autosaveMatch.snapshotSequence, autosaveMatch.eventSequence, at + 10_000 + 10, autosaveMatch.stateJson);
}

function main(): void {
  const databaseRoot = resolve(USER_DATA_ROOT);
  rmSync(databaseRoot, { recursive: true, force: true });
  mkdirSync(databaseRoot, { recursive: true });

  const database = new Database(DATABASE_PATH);
  database.exec(BASELINE_SCHEMA);
  database.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(1, BASE_TIMESTAMP);

  database.prepare(`
    INSERT INTO content_packs (id, name, version, source, enabled)
    VALUES (?, ?, ?, ?, ?)
  `).run(FIXTURE_PACK_ID, 'Previous version pack', '0.0.5', 'local-fixture', 1);

  database.prepare(`
    INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    ROUND_ONE_CATEGORY_SET_ID,
    FIXTURE_PACK_ID,
    'round-one',
    'easy',
    JSON.stringify({ en: 'Previous Category' }),
    'fixture',
    1,
  );

  database.prepare(`
    INSERT INTO clues (
      id, category_set_id, round, tier, value,
      prompt_json, response_json, explanation_json, accepted_responses_json, source, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ROUND_ONE_CLUE_ID,
    ROUND_ONE_CATEGORY_SET_ID,
    'round-one',
    1,
    100,
    JSON.stringify({ en: 'Previous fixture prompt' }),
    JSON.stringify({ en: 'Previous fixture response' }),
    JSON.stringify({ en: 'Previous fixture explanation' }),
    null,
    'previous-version-fixture',
    1,
  );

  database.prepare(`
    INSERT INTO content_overrides (clue_id, override_json, updated_at)
    VALUES (?, ?, ?)
  `).run(ROUND_ONE_CLUE_ID, JSON.stringify({
    id: ROUND_ONE_CLUE_ID,
    categoryId: ROUND_ONE_CATEGORY_SET_ID,
    round: 'round-one',
    tier: 1,
    value: 100,
    source: 'previous-version-fixture',
    enabled: true,
    prompt: {
      en: 'Override prompt for migration test',
      et: 'Migratsiooniküsimuse vihje',
    },
    response: {
      en: 'Override response for migration test',
      et: 'Migratsiooniküsimuse vastus',
    },
    explanation: {
      en: 'Override explanation for migration test',
      et: 'Migratsiooniküsimuse selgitus',
    },
    acceptedResponses: {
      en: 'Override accepted response for migration test',
      et: 'Migratsiooniküsimuse vastuvõetav vastus',
    },
  }), BASE_TIMESTAMP + 1);

  createMatchRows(database, BASE_TIMESTAMP + 5_000);

  database.prepare(`
    INSERT INTO content_reports (clue_id, match_id, note, created_at, resolved_at)
    VALUES (?, ?, ?, ?, NULL)
  `).run(ROUND_ONE_CLUE_ID, COMPLETED_MATCH_ID, 'Fixture report for migration coverage', BASE_TIMESTAMP + 2);

  database.prepare(`
    INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run('audio', JSON.stringify({
    master: 0.5,
    music: 0.6,
    effects: 0.7,
    crowd: 0.8,
    muted: true,
  }), BASE_TIMESTAMP + 3);
  database.prepare(`
    INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run('appearance', JSON.stringify({
    version: 1,
    reducedMotion: true,
    revision: 0,
  }), BASE_TIMESTAMP + 4);

  const expansionClueCount = Number(
    database.prepare('SELECT COUNT(*) FROM clues WHERE id = ?').pluck().get(EXPANSION_CLUE_ID),
  );
  if (expansionClueCount !== 0) {
    database.close();
    throw new Error(`Previous-version fixture contains new clue: ${EXPANSION_CLUE_ID}`);
  }

  writeLogoFixture();
  database.close();
}

main();
