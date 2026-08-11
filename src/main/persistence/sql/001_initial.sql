CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  ended_incomplete INTEGER NOT NULL DEFAULT 0 CHECK (ended_incomplete IN (0, 1)),
  winner_team_id TEXT
);

CREATE TABLE match_events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  occurred_at INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_json TEXT NOT NULL,
  UNIQUE (match_id, sequence)
);

CREATE TABLE match_snapshots (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  state_json TEXT NOT NULL,
  PRIMARY KEY (match_id, sequence)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE content_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  source TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE TABLE category_sets (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
  round TEXT NOT NULL CHECK (round IN ('round-one', 'round-two', 'final', 'tiebreaker')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  name_json TEXT NOT NULL,
  macro_topic TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE TABLE clues (
  id TEXT PRIMARY KEY,
  category_set_id TEXT NOT NULL REFERENCES category_sets(id) ON DELETE CASCADE,
  round TEXT NOT NULL CHECK (round IN ('round-one', 'round-two', 'final', 'tiebreaker')),
  tier INTEGER NOT NULL,
  value INTEGER NOT NULL,
  prompt_json TEXT NOT NULL,
  response_json TEXT NOT NULL,
  explanation_json TEXT NOT NULL,
  accepted_responses_json TEXT,
  source TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE TABLE content_overrides (
  clue_id TEXT PRIMARY KEY REFERENCES clues(id) ON DELETE CASCADE,
  override_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE content_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clue_id TEXT NOT NULL REFERENCES clues(id) ON DELETE CASCADE,
  match_id TEXT REFERENCES matches(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);

CREATE TABLE seen_clues (
  clue_id TEXT NOT NULL REFERENCES clues(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (clue_id, match_id)
);

CREATE INDEX match_events_match_sequence ON match_events(match_id, sequence);
CREATE INDEX match_snapshots_created ON match_snapshots(match_id, sequence DESC);
CREATE INDEX matches_resumable ON matches(completed_at, updated_at DESC);
