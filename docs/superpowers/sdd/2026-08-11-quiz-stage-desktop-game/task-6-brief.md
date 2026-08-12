### Task 6: Add SQLite migrations and repositories

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/main/persistence/database.ts`
- Create: `src/main/persistence/migrations.ts`
- Create: `src/main/persistence/sql/001_initial.sql`
- Create: `src/main/persistence/matchRepository.ts`
- Test: `tests/integration/persistence/database.test.ts`
- Test: `tests/integration/persistence/matchRepository.test.ts`

**Interfaces:**
- Consumes: `GameState` and `GameEvent` from Tasks 2–4.
- Produces: `openDatabase(options): DatabaseConnection`, `migrateDatabase(db, backupDirectory): void`, and `MatchRepository` methods `persistTransition`, `loadResumable`, `completeMatch`, and `listHistory`.

- [ ] **Step 1: Install the pinned SQLite dependency**

Run:

```powershell
npm install --save-exact better-sqlite3@13.0.3
npm install --save-dev --save-exact @types/better-sqlite3@9.6.0 @electron-forge/plugin-auto-unpack-natives@7.11.2
```

Add Forge’s auto-unpack-natives plugin and keep database access in the main process only.

- [ ] **Step 2: Write failing migration and atomic-save tests**

```ts
it('creates schema version 1 in a new database', () => {
  const db = openTestDatabase();
  migrateDatabase(db, backupDir);
  expect(readSchemaVersion(db)).toBe(1);
});

it('commits events and snapshot in one transaction', () => {
  repository.persistTransition(matchId, events, state);
  expect(repository.loadResumable()?.state.phase).toBe(state.phase);
  expect(repository.readEvents(matchId)).toHaveLength(events.length);
});
```

Add a forced-insert-failure test proving neither events nor snapshot commit.

Add a migration test proving a timestamped backup is created before schema change and the prior database remains readable after a forced migration failure.

- [ ] **Step 3: Run the tests and observe failure**

Run: `npm run test:run -- tests/integration/persistence`

Expected: FAIL because the database layer does not exist.

- [ ] **Step 4: Implement schema versioning and repositories**

`001_initial.sql` must create `schema_version`, `matches`, `match_events`, `match_snapshots`, `settings`, `content_packs`, `category_sets`, `clues`, `content_overrides`, `content_reports`, and `seen_clues`. Enable foreign keys and WAL mode. Serialize state/event JSON only after Zod validation.

- [ ] **Step 5: Verify native-module packaging and persistence**

Run:

```powershell
npm run test:run -- tests/integration/persistence
npm run build
npx electron-forge package --platform win32 --arch x64
```

Expected: tests pass and the packaged application contains an unpacked working `better-sqlite3` binary.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json forge.config.ts src/main/persistence tests/integration/persistence
git commit -m "feat(persistence): add transactional SQLite storage"
```

