# Task 6 report: SQLite migrations and repositories

## Status

Implemented the pinned `better-sqlite3` persistence foundation, transactional migration and match storage, integration coverage, and Forge native-module packaging. SQLite remains confined to `src/main`; no renderer or preload database API was added.

## Files

- Modified `package.json` and `package-lock.json`: exact `better-sqlite3@13.0.3`, `@types/better-sqlite3@9.6.0`, and `@electron-forge/plugin-auto-unpack-natives@7.11.2` pins.
- Modified `forge.config.ts`: auto-unpack plugin plus a narrow Vite packager allowlist for the native dependency.
- Modified `vite.main.config.ts`: externalizes `better-sqlite3` for the main-process bundle.
- Added `src/main/persistence/database.ts`: absolute path handling, directory creation, foreign keys, WAL, and read-only opens.
- Added `src/main/persistence/migrations.ts` and `src/main/persistence/sql/001_initial.sql`: version 1 migration, pre-migration checkpoint/backup, transactional application, all required tables, indexes, and foreign keys.
- Added `src/main/persistence/sql.d.ts`: typed Vite raw SQL import used by both tests and packaged builds.
- Added `src/main/persistence/matchRepository.ts`: validated atomic transitions, resumable snapshots, completion, event reads, and history.
- Added `tests/integration/persistence/database.test.ts` and `matchRepository.test.ts`.

## TDD evidence

### Initial RED

Command:

```powershell
npm run test:run -- tests/integration/persistence
```

Observed exit 1. Both suites failed during import with the expected missing-module errors for `src/main/persistence/migrations` and `src/main/persistence/database`; no production persistence code existed yet.

### Focused failures found during GREEN/self-review

- First implementation run: 7/8 passed; history test showed the second tied team had `rank: undefined`. Root cause was reading `rank` from the unranked sorted input. The ranked result is now accumulated explicitly.
- Resume-order review test: RED reproduced `z-older-match` being returned instead of later-persisted `a-newer-match` when both engine events had timestamp `0`. Root cause was treating event time as persistence order. The transaction now assigns a database-wide monotonic persistence timestamp.

### Final focused GREEN

Command and result:

```text
npm run test:run -- tests/integration/persistence
Test Files  2 passed (2)
Tests       9 passed (9)
Duration    965ms
exit 0
```

Coverage includes schema version/tables/pragmas/foreign keys, timestamped backup and forced migration rollback/readability, atomic event/snapshot commit, forced snapshot failure rollback, validation before writes and after reads, compact undo/tiebreaker round-trip, corrupt-newer snapshot fallback, tied-event resume ordering, completion, and history.

## Final verification

```text
npm run test:run
Test Files  12 passed (12)
Tests       77 passed (77)
exit 0

npm run lint
eslint .
exit 0

npm run typecheck
tsc --noEmit
exit 0

git diff --check
exit 0
```

Build command and result:

```text
npm run build
Preparing native dependencies: 1 / 1
Packaging for x64 on win32
exit 0
```

Explicit package command and result:

```text
npx electron-forge package --platform win32 --arch x64
Preparing native dependencies: 1 / 1
Packaging for x64 on win32
exit 0
```

## Native binary verification

The first package command exited zero but contained no native binary. Investigation of the installed Forge Vite plugin showed its default ignore callback retains only `/.vite`, so the native dependency never reached the auto-unpack hook. The final Forge configuration keeps only `/.vite`, the `node_modules` parent, and `node_modules/better-sqlite3`; the auto-unpack plugin then extracts native files.

Final file and runtime check:

```text
UNPACKED_NATIVE_OK path=...\resources\app.asar.unpacked\node_modules\better-sqlite3\prebuilds\win32-x64.node bytes=1989632
PACKAGED_SQLITE_OK sqlite=3.53.4 arch=x64 electron=43.3.0 modules=148
exit 0
```

The runtime check used the packaged `quiz-stage-desktop-game.exe` with `ELECTRON_RUN_AS_NODE=1`, required `better-sqlite3` from packaged `app.asar`, opened `:memory:`, executed `SELECT sqlite_version()`, and closed the database. This verifies ABI/load compatibility, not merely file presence.

## Self-review

- Transactions: migration SQL plus version insert share one transaction; match upsert, all events, and snapshot share one transaction. A trigger-forced snapshot error leaves all three tables unchanged.
- Migration recovery: WAL is checkpointed, the database file is synchronously copied to a UTC-timestamped backup, then migration begins. A conflicting legacy table forces failure while both source and backup retain readable legacy data and schema version 0.
- Paths: writable database paths are resolved, parent directories are created, read-only opens require an existing file, and backup directories are created without renderer-provided access.
- Validation: canonical strict Zod state/event schemas run before `JSON.stringify`; loaded snapshots and events are parsed and validated again. Row/match IDs are cross-checked.
- SQL parameterization: all external IDs, timestamps, event metadata, and JSON use bound parameters. The only interpolated identifier is an internal two-value table-name union.
- Resume/history: snapshots are append-only with independent sequences; latest valid resumable data wins, corrupt rows are skipped, completed matches are excluded, and history derives validated configuration/standings without persistent team identities.
- Native/process boundary: repository/database imports exist only under `src/main`; renderer and preload contain no SQLite access. Vite externalization, the narrow packager allowlist, and auto-unpack cooperate in the final package.

## Concerns

- `npm install` reported 25 dependency audit findings (3 low, 21 high, 1 critical). No broad dependency upgrades or audit fixes were attempted because the task requires exact pins and surgical scope.
- Auto-unpack extracts all platform prebuilds shipped by `better-sqlite3`, not only win32-x64. The verified win32-x64 binary works; pruning vendor prebuilds would be a separate packaging-size decision.

## Fix Round 1

Reviewed base: `2d4157a95382953de131d4492aeefd61e8890977`.

### Recovery event cursor

RED command:

```text
npm run test:run -- tests/integration/persistence/matchRepository.test.ts
Tests 1 failed | 7 passed
expected eventSequence 1; received undefined
exit 1
```

The regression persists a one-event transition, a zero-event transition, and a two-event transition, corrupts the newest snapshot, then requires snapshot 2/state 2 with cursor 1 and exactly event sequences 2–3 for replay. `match_snapshots.event_sequence` is now written in the same transaction as its events/state. `loadResumable` checks contiguous database sequences and match IDs, validates later event JSON, and returns `{ state, eventSequence, events }`.

GREEN:

```text
npm run test:run -- tests/integration/persistence/matchRepository.test.ts
Tests 8 passed (8)
exit 0
```

### Complete WAL checkpoint gate

RED command:

```text
npm run test:run -- tests/integration/persistence/database.test.ts
Tests 1 failed | 2 passed
expected migrateDatabase to throw; it migrated despite { busy: 1, log: 2, checkpointed: 1 }
exit 1
```

`migrateDatabase` now accepts a narrow checkpoint seam for deterministic testing and inspects the real FULL checkpoint result by default. Any result other than one row with `busy === 0` and `checkpointed === log` aborts before backup-directory creation, file copy, or migration.

GREEN at this step: database tests 3/3.

### Collision-safe timestamped backups

RED command:

```text
npm run test:run -- tests/integration/persistence/database.test.ts
Tests 1 failed | 3 passed
expected the fixed-clock base and -1 names; the clock seam was ignored
exit 1
```

Backup copies now use `COPYFILE_EXCL`. A deterministic retry keeps the timestamped base name and adds `-1`, `-2`, and so on only on `EEXIST`. The fixed-clock regression migrates two distinct `quiz.sqlite` files into one backup directory and reopens both backups to prove their original `first`/`second` contents survive.

GREEN at this step: database tests 4/4.

### User-authored clue-data preservation

RED command:

```text
npm run test:run -- tests/integration/persistence/database.test.ts
Tests 1 failed | 4 passed
expected clue deletion to fail; CASCADE deleted the clue and dependent user rows
exit 1
```

The three clue foreign keys in `content_overrides`, `content_reports`, and `seen_clues` now use `ON DELETE RESTRICT`. The behavior test proves direct clue deletion, category cascade deletion, and pack cascade deletion all fail while each user-data table retains its row. Replace Existing/soft-delete workflow was not added.

GREEN:

```text
npm run test:run -- tests/integration/persistence/database.test.ts
Tests 5 passed (5)
exit 0
```

### Fix Round 1 final verification

```text
npm run test:run -- tests/integration/persistence
Test Files 2 passed (2); Tests 13 passed (13); exit 0

npm run test:run
Test Files 12 passed (12); Tests 81 passed (81); exit 0

npm run lint
eslint .; exit 0

npm run typecheck
tsc --noEmit; exit 0

git diff --check
exit 0

npm run build
Preparing native dependencies: 1 / 1; Packaging for x64 on win32; exit 0

npx electron-forge package --platform win32 --arch x64
Preparing native dependencies: 1 / 1; Packaging for x64 on win32; exit 0

UNPACKED_NATIVE_OK ...\better-sqlite3\prebuilds\win32-x64.node bytes=1989632
PACKAGED_SQLITE_OK sqlite=3.53.4 arch=x64 electron=43.3.0 modules=148
exit 0
```

Fix-round self-review: the cursor and snapshot are atomic; cursor `0` and zero/multi-event transitions are distinct; fallback replay returns only later schema-valid same-match events; checkpoint failure precedes copying; exclusive backup naming cannot overwrite; user-authored clue data blocks all three parent-deletion paths; SQL remains parameterized and SQLite remains main-process-only. Reviewer-ledgered tier/value checks and selection indexes remain intentionally unchanged.

## Fix Round 2

Reviewed base: `c99d4161d27caf233a52d71fbb2da12a9ac74c98`.

The remaining recovery issue was that invalid or wrong-match later events were skipped while subsequent valid events crossed the broken replay boundary. A missing sequence caused `loadResumable` to reject the otherwise valid snapshot rather than return a safe prefix and recovery metadata.

### RED

Command and result:

```text
npm run test:run -- tests/integration/persistence/matchRepository.test.ts
Tests 4 failed | 7 passed
exit 1
```

Observed failures:

- Valid contiguous later events were returned, but no `replayIssue: null` contract existed.
- Invalid JSON at sequence 2 was silently skipped and valid sequence 3 was returned.
- A schema-valid wrong-match payload at sequence 2 was silently skipped and valid same-match sequence 3 was returned.
- Deleting sequence 2 made `loadResumable` return no snapshot/events instead of the valid snapshot, empty replay prefix, and gap metadata.

### GREEN implementation

`loadResumable` now returns `replayIssue: { sequence, reason } | null`. Starting at `snapshot.eventSequence + 1`, replay rows are checked in strict order. It returns immediately at the first:

- missing sequence (`missing-sequence`),
- invalid JSON/schema (`invalid-event`),
- wrong-match row/payload (`match-mismatch`), or
- row ID/time/type versus payload mismatch (`row-mismatch`).

Only events validated before that boundary are returned. Later rows never cross it. The valid snapshot is preserved for Task 8, and the metadata is deterministic and remains in the main-process repository interface.

Focused result:

```text
npm run test:run -- tests/integration/persistence/matchRepository.test.ts
Tests 11 passed (11)
exit 0
```

### Fix Round 2 final verification

```text
npm run test:run -- tests/integration/persistence
Test Files 2 passed (2); Tests 16 passed (16); exit 0

npm run test:run
Test Files 12 passed (12); Tests 84 passed (84); exit 0

npm run lint
eslint .; exit 0

npm run typecheck
tsc --noEmit; exit 0

git diff --check
exit 0
```

Fix-round self-review: the replay scan is a deterministic prefix parser, sequence gaps no longer discard a valid snapshot, invalid/mismatched events stop rather than skip, row/payload metadata is cross-checked, and valid contiguous zero/one/multi-event behavior remains unchanged. No migration, Forge, dependency, renderer, preload, or native-package files changed, so native packaging was not rerun per the round instructions.

## Fix Round 3

Reviewed base: `d7b528c908593885c5ebfe89f620e532dd561e57`.

### RED

```text
npm run test:run -- tests/integration/persistence/matchRepository.test.ts
Tests 1 failed | 11 passed
expected eventSequence 1; received undefined because loadResumable returned no snapshot
exit 1
```

The regression persists a valid snapshot with cursor 1, deletes every event row represented by that cursor, and requires the snapshot state with `events: []` and `replayIssue: null`.

### GREEN

The historical `MAX(sequence)` gate was removed. A schema-valid snapshot no longer depends on retained event rows at or before its cursor. Replay still queries only rows after `snapshot.eventSequence`, requires the first later row to be cursor + 1, and preserves all invalid/wrong-match/row-mismatch/gap boundaries from Fix Round 2.

```text
npm run test:run -- tests/integration/persistence/matchRepository.test.ts
Tests 12 passed (12); exit 0

npm run test:run -- tests/integration/persistence
Test Files 2 passed (2); Tests 17 passed (17); exit 0

npm run test:run
Test Files 12 passed (12); Tests 85 passed (85); exit 0

npm run lint
eslint .; exit 0

npm run typecheck
tsc --noEmit; exit 0

git diff --check
exit 0
```

Fix-round self-review: snapshots are self-sufficient through their cursor; pruning historical rows returns an empty clean replay; a later sequence above cursor + 1 still reports `missing-sequence`; invalid/mismatched later rows still stop the prefix. No packaging files changed, so packaging/native verification was not rerun per scope.
