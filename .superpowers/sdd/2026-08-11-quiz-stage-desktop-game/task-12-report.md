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
