CREATE TABLE category_set_overrides (
  category_set_id TEXT PRIMARY KEY REFERENCES category_sets(id) ON DELETE RESTRICT,
  override_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
