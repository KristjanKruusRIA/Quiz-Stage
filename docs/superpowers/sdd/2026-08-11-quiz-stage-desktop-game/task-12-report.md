# Task 12 report: durable clue overrides and reporting

## Status

Implemented field-complete bilingual local clue overrides, durable unresolved reports, merged content reads, future-selection exclusion, explicit resolution, and coordinator-level atomic reporting without widening renderer, preload, IPC, public-state, filesystem, or network access.

## Semantics and Task 10 compatibility

- An unresolved `content_reports` row is the future-selection block. Reporting never changes the bundled `clues.enabled` row and never rewrites an already-selected canonical clue object.
- Task 10 remains authoritative for live match flow: supported board reports close/advance the current clue, tiebreaker reports advance to another canonical clue, and all Final phases reject reporting before any durable report is created.
- “Current match continues” therefore means the existing match retains its selected canonical clue content and can continue under Task 10 progression; it does not reopen or hold `activeClue` in conflict with Task 10.
- A local override is strict, field-complete content JSON keyed by the stable clue ID. English and Estonian content are both required. Structural bundled identity cannot change.
- Saving an enabled corrected override resolves outstanding reports in the same transaction. Saving a disabled override leaves reports unresolved. Resolve Without Change resolves outstanding reports without creating an override.
- Repeated unresolved reports and repeated resolutions are idempotent. A later report can be created after the earlier report is resolved.

## Implementation

- `src/shared/content/schema.ts` defines strict stable content IDs, bilingual override schemas, and strict report input/record schemas.
- `src/shared/content/validation.ts` enforces immutable bundled board/Final identity while allowing editable localized content, source, accepted responses, category name, and enabled state.
- `src/main/content/contentRepository.ts` validates all writes and stored JSON, merges overrides over current bundled rows, masks reported clues from eligibility, and owns transactional save/report/resolve/list operations.
- `src/main/content/contentService.ts` keeps selection on merged repository reads and exposes report, resolve, eligibility, and transaction contracts.
- `src/main/coordinator/gameCoordinator.ts` runs accepted `ReportClue` persistence and the existing match transition inside one production SQLite transaction. A content or match-persistence failure leaves both durable report state and authoritative in-memory match state unchanged.
- Existing coordinator test doubles were extended only for the new required main-process contracts.

## TDD evidence

Initial required RED:

```text
npm run test:run -- tests/integration/content/overrides.test.ts tests/integration/content/reportClue.test.ts
Test Files 2 failed (2)
Tests 9 failed (9)
exit 1
```

Every failure named a missing Task 12 contract (`saveOverride`, `getClue`, report/resolve/list/eligibility, or service reporting).

Focused GREEN:

```text
npm run test:run -- tests/integration/content/overrides.test.ts tests/integration/content/reportClue.test.ts
Test Files 2 passed (2)
Tests 9 passed (9)
exit 0
```

Expanded affected GREEN:

```text
npm run test:run -- tests/integration/content tests/unit/game/boardSelector.test.ts tests/integration/coordinator tests/integration/persistence tests/unit/game
Test Files 18 passed (18)
Tests 162 passed (162)
exit 0
```

Coverage includes upgrade/restart override precedence, strict bilingual and structural validation, corrected override resolution, Resolve Without Change, idempotency, report/match rollback, board and Final/tiebreaker exclusion, current-match canonical clue immutability, Task 10 progression, Final rejection, and public projection non-leakage.

## Verification

```text
npm run test:run
Test Files 40 passed (40)
Tests 242 passed (242)
exit 0

npm run lint
exit 0

npm run typecheck
exit 0

npm run build
Electron Forge packaged x64 on win32
exit 0
```

## Self-review

- No migration was needed: Task 6 already created `content_overrides` and `content_reports`, and the development seed contains both tables.
- Overrides survive bundled-row changes because their field-complete JSON remains separate and merged reads always prefer it for the stable clue ID.
- Reports suppress `enabled` only in merged internal content reads; no report note, report metadata, unresolved flag, override JSON, accepted response, or private state was added to public projections.
- All SQL values are bound parameters. Stored override/report data is validated on both write and read paths.
- The production transaction is shared with the existing nested MatchRepository transaction; the real SQLite rollback regression proves a failed snapshot write removes the report and preserves the live match.
- No TSX files changed, so no React-specific review was required.

## Concern

Task 12 intentionally adds no editor or IPC surface. The repository/service contracts are ready for the later approved content editor task, which must retain host-only authorization and strict IPC parsing when it exposes them.

## Fix round 1: atomic tiebreaker reports and stable base lookup

### Findings addressed

1. Removed the separately committed tiebreaker-augmentation snapshot. Replacement selection remains canonical and deterministic in coordinator memory, then the replacement clue, `ReportClue` event/final snapshot, and unresolved content report commit inside the existing shared SQLite transaction before one adoption/publication. The same single-snapshot rule now applies whenever a command needs a newly sourced tiebreaker, while retaining the rule that persistence completes before display.
2. Replaced override/get lookup through selection-filtered library loaders with a direct strict base-row lookup by stable clue ID. The lookup joins the base clue, category, pack, history, override, and report state without filtering disabled parents. It validates board/Final structure and computes effective eligibility separately, so corrections remain possible behind disabled packs/categories but cannot re-enable those parents or enter board/Final/tiebreaker selection.
3. Made the missing-base policy explicit: a deleted base row returns `null` and rejects a later override as unknown; an existing override keeps its base row protected by the original `ON DELETE RESTRICT` foreign key.

### RED evidence

```text
npm run test:run -- tests/integration/content/overrides.test.ts tests/integration/content/reportClue.test.ts
Test Files 2 failed (2)
Tests 5 failed | 10 passed
exit 1
```

- Disabled-pack board and disabled-category Final overrides failed as `Unknown bundled clue`.
- Forced early content-report and late reported-snapshot failures each left two snapshots instead of one.
- Successful tiebreaker reporting left three snapshots instead of the required two total snapshots (initial plus one atomic report transition).

### GREEN and rollback evidence

The real production-database tests install two SQLite abort triggers: one before the report insert and one before the final reported-state snapshot. Both prove byte-equivalent coordinator state, zero report/event/snapshot additions, and restart recovery of the exact pre-command state. The success path proves one event, one new snapshot, one publication, no replacement reuse, and restart equality with the published state.

```text
Focused reviewed suite: 2 files; 15 tests passed
Affected content/selector/coordinator/persistence/game: 18 files; 168 tests passed
npm run test:run: 40 files; 248 tests passed
npm run lint: exit 0
npm run typecheck: exit 0
npm run build: Electron Forge packaged x64 on win32; exit 0
```

### Fix-round self-review

- Tiebreaker sourcing, exclusion order, canonical copying, score behavior, event cursor, timer anchoring, report privacy, and host/public publication ordering remain unchanged.
- No intermediate replacement snapshot is durable. The final self-sufficient snapshot contains the exact replacement clue and report result before publication.
- Disabled pack/category state participates only in effective eligibility. An enabled corrected override clears its report but still returns `enabled: false` while either parent is disabled.
- Selection loaders retain their prior filtering/balancing behavior; the new direct lookup is used only for stable record identity/get/edit operations.
- No migration, renderer, preload, IPC, public projection, filesystem scope, or network path changed.

## Fix round 2: serialized tiebreaker replacement selection

### Finding addressed

Replacement eligibility was previously read before the coordinator opened the report transaction. A second SQLite connection could therefore commit a report for the selected replacement in the read-to-transaction gap, after which the coordinator durably adopted that now-ineligible clue. Report-command preparation now runs inside the existing synchronous content transaction, and `ContentRepository.runTransaction` uses `BEGIN IMMEDIATE` so the write reservation is acquired before replacement selection. The selection read, cloned-state augmentation, unresolved current report, command event, and snapshot consequently share one SQLite ordering and rollback boundary.

The ordering is explicit across instances: a report committed before `BEGIN IMMEDIATE` is visible to selection and excluded; after `BEGIN IMMEDIATE`, another report/resolve/override transaction cannot commit until the coordinator transaction ends (or receives `SQLITE_BUSY` under a zero busy timeout). A writer retry after commit affects future eligibility without rewriting the already-current canonical match clue.

### RED and GREEN evidence

The deterministic regression uses two production connections to the same WAL database. Its selection interleaving hook obtains the real selected clue, then makes the second repository attempt a report before returning it to the coordinator. Before the fix, the competing report committed and the observed error code was `null` instead of `SQLITE_BUSY`:

```text
npm run test:run -- tests/integration/content/reportClue.test.ts
Test Files 1 failed (1)
Tests 1 failed | 10 passed
exit 1
```

After the fix, the competing write receives `SQLITE_BUSY`; retrying after the coordinator commit succeeds while the current and restarted match remain exactly equal to the published canonical state. A separate two-connection case proves a report committed before the coordinator transaction causes deterministic selection of a different eligible clue. Selection failure, transition rejection, report failure, and late snapshot failure leave no report/event/snapshot additions and recover the exact pre-command state.

```text
Focused concurrency/report suite: 1 file; 12 tests passed
Affected content/selector/coordinator/persistence/game: 18 files; 171 tests passed
npm run test:run: 40 files; 251 tests passed
npm run lint: exit 0
npm run typecheck: exit 0
npm run build: Electron Forge packaged x64 on win32; exit 0
Packaged dev-seed.sqlite: 188416 bytes
Packaged better-sqlite3 win32-x64.node: 1989632 bytes
```

### Fix-round self-review

- The coordinator callback remains synchronous; no async work was introduced inside better-sqlite3 transactions.
- Nested report and match repository transactions remain savepoint-scoped on the same production connection, while the outer immediate transaction owns cross-connection ordering.
- Tiebreaker ranking, exclusion order, canonical copying, non-reuse, Task 10 live progression, report privacy, event sequencing, snapshot count, restart recovery, and post-commit publication remain unchanged.
- All content writers already use the same repository transaction function, so report, resolution, and corrected-override commits observe the same immediate-writer serialization.
- No migration, renderer, preload, IPC, public projection, filesystem scope, or network path changed.
