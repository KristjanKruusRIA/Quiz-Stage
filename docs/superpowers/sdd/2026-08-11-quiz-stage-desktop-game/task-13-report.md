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

## Fix round 1: hardened import and export boundaries

### Confirmed findings and fixes

- Fresh imports now check pack, category, board clue, and Final identities against all three persisted ID namespaces inside the existing immediate transaction. Incoming IDs also cannot be reused across pack/category/clue namespaces. Only a same-pack Replace Existing may retain identities already owned by that custom pack; create uses plain `INSERT` statements and cannot update a conflicting row.
- Replace Existing retains the prior stable clue/category scope and now rejects cross-pack or cross-namespace identities before any base-table write. Keep Both continues to allocate every pack/category/board/Final ID against the global namespace and rewrites all references in memory before its transaction writes.
- Export now parses, validates, and compares its normalized in-memory output before creating a temporary file. Bundled legacy source strings lack authoritative URL/license/retrieval metadata, so bundled export fails closed with an actionable validation error and does not create, replace, or truncate a destination.
- A Task 12 display-source override changes only the exported source title when the base clue has structured CSV metadata; URL, license, retrieval date, and translation status continue to come from that authoritative base metadata.
- Import-preview and export IPC re-authorize the current host immediately after their asynchronous file dialogs resolve, including cancellation, before any selected-path I/O.
- Accepted-variant decoding permits only `\;` and `\\`; dangling and unknown escapes are validation errors rather than lossy transformations.
- Synchronous CSV work is bounded to 16 MiB per file, 10,000 data rows, 128 Ki characters per record, and 32 Ki characters per field. The selected file is checked by path and opened descriptor before bounded chunked reading, and the parser independently enforces the same byte cap.
- Export prefixes every data cell with one apostrophe and import removes that layer only from a fully encoded row. This prevents emitted cells from beginning with `=`, `+`, `-`, or `@`, while preserving formula-looking domain text and every original leading-apostrophe combination exactly on re-import.
- No renderer UI, preload/shared bridge, public-window capability, arbitrary renderer path, network behavior, schema migration, or bundled seed content changed.

### Fix-round TDD evidence

The first corrected focused RED exercised production paths and produced 10 expected failures with 26 existing passes: six fresh/Final identity-collision imports succeeded, legacy export published invalid CSV, an ordinary source-title override lost structured metadata, a replaced host resumed import I/O after its dialog, and `\q` was accepted as a variant escape. A second RED added three failures for absent caps and formula neutralization, and a final RED covered incoming cross-namespace ID reuse.

Focused GREEN after the fixes:

```text
npx vitest --configLoader runner tests/unit/content/csvValidation.test.ts tests/integration/content/csvRoundTrip.test.ts
Test Files 2 passed (2)
Tests 41 passed (41)
exit 0
```

### Fix-round verification

```text
Affected content/IPC/privacy/persistence/coordinator/game/application suite:
Test Files 28 passed (28)
Tests 236 passed (236)
exit 0

npm run test:run
Test Files 42 passed (42)
Tests 292 passed (292)
exit 0

npm run lint
exit 0

npm run typecheck
exit 0

npm run build
Electron Forge packaged x64 on win32
exit 0

npm run make:portable
ZIP maker completed for win32/x64
exit 0
```

Packaged production checks:

```text
quiz-stage-desktop-game-win32-x64-0.1.0.zip: 155740128 bytes
dev-seed.sqlite: 188416 bytes
SHA-256: CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
SQLite integrity_check: ok
Inventory: 183 clues, 36 board category sets, 3 Finals
better-sqlite3 win32-x64.node: 1989632 bytes
csv-parse@7.0.2 and csv-stringify@6.8.3 confirmed at depth 0
```

## Fix round 2: reject unsafe CSV input

### Confirmed findings and fixes

- Export now strictly decodes and validates stored accepted responses for both the base clue and an ordinary Task 12 override before selecting which value is exported. Unknown escapes, dangling escapes, non-string language values, and unexpected language keys fail with the clue ID and storage origin before any temporary or destination write. Valid `\;` and `\\` values remain byte-for-byte reversible through export and re-import.
- Bounded file bytes are decoded with a fatal UTF-8 decoder. Invalid bytes, overlong encodings, surrogate encodings, and truncated multibyte sequences fail before preview creation; one valid leading BOM and valid multibyte Estonian data remain accepted, while the existing interior-BOM rejection remains intact.
- The 10,000-data-row cap is enforced inside `csv-parse` through its record callback. The parser throws on data record 10,001 and never reaches a deliberately malformed trailing sentinel; quoted multiline fields still count as one record. Field length remains a separate 32 Ki-character check in that callback.
- The parser's 128 Ki record-buffer cap is now named and reported as bytes, matching `csv-parse`'s `CSV_MAX_RECORD_SIZE` contract, while the independent field limit continues to measure decoded JavaScript characters.
- Selected import paths are validated before open, compared with the opened descriptor, and revalidated after open by device/inode identity. A path changed to a different file or symbolic link is rejected before reading. The injectable seam is a narrow main-process filesystem port used only to deterministically exercise the swap; it is not exposed through IPC, preload, renderer, or shared APIs.
- Formula neutralization/decoding, collision checks, transactions, current-host authorization, source-metadata handling, bundled seed content, and all Task 12 override/report constraints remain unchanged.

### Fix-round TDD evidence

The focused RED produced nine expected failures with 42 existing passes: three invalid stored-variant exports published, four malformed UTF-8 inputs reached preview parsing, the 10,001st row continued into a malformed tail instead of aborting, and a simulated path-to-symlink swap read the original path because the filesystem seam was ignored. Valid escaped variants and valid multibyte Estonian controls already passed.

Focused GREEN:

```text
npx vitest --configLoader runner tests/unit/content/csvValidation.test.ts tests/integration/content/csvRoundTrip.test.ts
Test Files 2 passed (2)
Tests 51 passed (51)
exit 0
```

### Fix-round verification

```text
Affected content/IPC/privacy/persistence/coordinator/game/application suite:
Test Files 28 passed (28)
Tests 246 passed (246)
exit 0

npm run test:run
Test Files 42 passed (42)
Tests 302 passed (302)
exit 0

npm run lint
exit 0

npm run typecheck
exit 0

npm run build
Electron Forge packaged x64 on win32
exit 0

npm run make:portable
ZIP maker completed for win32/x64
exit 0
```

Packaged production checks:

```text
quiz-stage-desktop-game-win32-x64-0.1.0.zip: 155740491 bytes
dev-seed.sqlite: 188416 bytes
SHA-256: CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
SQLite integrity_check: ok
Inventory: 183 clues, 36 board category sets, 3 Finals
better-sqlite3 win32-x64.node: 1989632 bytes
csv-parse@7.0.2 and csv-stringify@6.8.3 confirmed at depth 0
```
