# Task 13 report: transactional CSV pack import and export

## Status

Implemented strict RFC 4180 CSV parsing, aggregate pack validation, read-only previews, one-transaction imports, conflict handling, deterministic atomic exports, and internal host-only file-dialog IPC without exposing a preload, renderer, filesystem, database, shell, or network API.

## Dependency decision

The approved plan requested `csv-parse@6.8.3` and `csv-stringify@7.0.2`. The official npm registry rejected that command with `ETARGET`: those versions are published under the opposite package names. The controller independently verified the registry and authorized the corrected exact pins:

- `csv-parse@7.0.2`
- `csv-stringify@6.8.3`

Both are production dependencies and `npm ls csv-parse csv-stringify --depth=0` confirms those exact versions.

## Implementation

- `src/shared/content/csvColumns.ts` defines the exact 25-column order from the approved plan.
- `src/main/content/csvPacks.ts` owns parsing, validation, normalized records, preview snapshots, import transactions, identity conflict handling, persistence mapping, and export publication.
- Parsing accepts CRLF or LF, canonicalizes embedded line endings in memory, strips a BOM only at byte/text start, rejects an interior BOM and non-exact headers, and treats formula-looking cells as strings.
- Accepted variants use semicolon separation with `\;` for a literal semicolon and `\\` for a literal backslash. Dangling escapes, empty entries, and Estonian-only variants are rejected.
- Validation reports all row-level issues for required values, IDs, enums, booleans, HTTP(S) URLs, real ISO dates, translations, duplicate IDs, normalized clue text, normalized category names, category metadata, five-tier board completeness, and Final shape.
- English-only custom content is valid. `machine` and `reviewed` rows require the complete Estonian fields; missing Estonian content remains absent in persistence and therefore cannot satisfy Estonian selection.
- Preview reads and validates without writes. Commit revalidates the full in-memory snapshot and rechecks live conflicts inside the repository's `BEGIN IMMEDIATE` transaction.
- Replace Existing is limited to an existing `custom-csv` pack. Stable clue/category identity cannot change; retained Task 12 overrides and reports remain attached. Removal of a clue protected by an override, report, or history fails the foreign-key operation and rolls the whole replacement back. Existing pack/category enabled state is preserved.
- Keep Both creates collision-free pack, category, board clue, and Final IDs and rewrites every corresponding reference in memory before the single transaction.
- Export queries disabled as well as enabled pack rows, applies persisted content overrides, sorts normalized records deterministically, writes UTF-8 BOM plus CRLF RFC 4180 output, and publishes through a unique sibling temporary file. Failed writes leave no destination or temporary artifact.
- Main-process IPC opens explicit CSV dialogs, accepts no renderer-provided path, authorizes the current host sender for every call, strictly parses all requests/results, and returns cancellation without reads, writes, or commits. No preload or shared public API was added; Task 14 owns the editor bridge/UI.
- The bundled development seed and Task 12 report/override behavior are unchanged.

## TDD evidence

Initial required RED:

```text
npm run test:run -- tests/unit/content/csvValidation.test.ts tests/integration/content/csvRoundTrip.test.ts
Test Files 2 failed (2)
Cannot find module '../../../src/main/content/csvPacks'
exit 1
```

Additional RED/GREEN cycles covered the missing host-only IPC handlers, malformed semicolon/backslash variants, and commit-time revalidation of a mutated preview. Each failed for the named missing behavior before the minimal production change.

Final focused GREEN:

```text
npm run test:run -- tests/unit/content tests/integration/content/csvRoundTrip.test.ts
Test Files 2 passed (2)
Tests 26 passed (26)
exit 0
```

## Verification

```text
Affected content/IPC/persistence/coordinator/game/application/privacy suite:
Test Files 27 passed (27)
Tests 217 passed (217)
exit 0

npm run test:run
Test Files 42 passed (42)
Tests 277 passed (277)
exit 0

npm run lint
exit 0

npm run typecheck
exit 0

npm run build
Electron Forge packaged x64 on win32
exit 0
```

Packaged production checks:

```text
dev-seed.sqlite: 188416 bytes
SHA-256: CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
SQLite integrity_check: ok
Inventory: 183 clues, 36 board category sets, 3 Finals
better-sqlite3 win32-x64.node: 1989632 bytes
```

## Self-review

- CSV files are data only; no cell is evaluated, rendered as HTML, or sent to a network service.
- Parse and preview do not mutate SQLite. All base-table writes, deletions, conflict checks, and identity rewrites commit or roll back together under the repository transaction.
- SQL values are bound parameters. The only interpolated SQL fragments are closed internal table/column/owner predicates, never CSV or renderer input.
- Direct filesystem paths exist only in the main process after an explicit Electron dialog or in the direct main-process service used by integration tests.
- Export ordering, newline form, encoding, escaped variants, and structured source metadata are deterministic; re-import produces byte-equivalent normalized custom-pack records.
- No migration, seed content, renderer UI, preload bridge, public projection, media, match state, or network path changed.
