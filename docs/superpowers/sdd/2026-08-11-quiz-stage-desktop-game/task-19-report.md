# Task 19 report: production content validator and release inventory gate

## Status

Implemented the offline deterministic production CSV validator, batch/release inventory policies, machine-readable atomic report merge, and an explicitly invoked, SSRF-resistant source checker with injected network/time/cache seams. No renderer, preload, runtime app, database, or packaged-network behavior changed.

## Policy decisions

- Task 19's newer exact test contract is authoritative for `distinctCategoryNames: 1200`, while the validator also enforces the release design's per-difficulty board clues, per-difficulty/round sets, and per-difficulty Finals.
- `--allow-missing-et` is valid only for batch authoring. It changes only `MISSING_TRANSLATION` to a warning and records the machine exception ID `missing-et:<clue-id>`. Release mode rejects the flag before reading or publishing.
- Batch warnings never block. In release mode, `UNCHANGED_TRANSLATION` and `SUSPICIOUS_PROPER_NOUN_CHANGE` are errors unless the existing report's translation section contains the exact machine exception ID, `status: reviewed`, and a nonblank reviewer reason.
- `content:source-check` is the only new command that uses the network. Unit/repository gates use fake fetch/DNS/clock/sleep and never call live sources; application build and `verify:product` remain offline.

## Implementation

- `scripts/content/readCsv.ts` resolves input globs in stable absolute order, deduplicates them, rejects no-match/symlink/non-file/change-during-read inputs, uses fatal UTF-8 decoding, and delegates CSV grammar to the existing `parsePackCsv`.
- `scripts/content/validate.ts` reuses the existing `validatePack`, `CSV_COLUMNS`, shared Zod content schemas, and structured source codec. It adds cross-file/global ID and normalized-content checks, board/Final composition, round/tier/value/difficulty/macro consistency, source/provenance/date policy, translation status/completeness diagnostics, robust localized numeric comparison, time-sensitive wording checks, stable issues, and release thresholds.
- Validation report publication preserves sibling report properties, uses a unique sibling `wx` temporary file plus atomic rename, rejects symlink ancestors/destinations, and preserves the previous file on failure.
- `scripts/content/sourceCheck.ts` requires HTTPS without credentials, rejects official clue archives and local/private/link-local/reserved addresses, revalidates every redirect, uses a safe connection-time DNS lookup, bounded concurrency/timeout/retries/backoff, a descriptive User-Agent, status-only results, successful versioned expiring cache entries, and bounded official Wikidata API entity batches.
- `glob@13.0.6` is exact and dev-only. `package-lock.json` resolves the top-level package to exactly 13.0.6.

## TDD evidence

Initial RED:

```text
npm run test:run -- tests/unit/content/productionValidator.test.ts
FAIL: Cannot find module '../../../scripts/content/validate'
Test Files 1 failed; exit 1
```

Focused GREEN after incremental root-cause fixes:

```text
npm run test:run -- tests/unit/content/productionValidator.test.ts
Test Files 1 passed
Tests 27 passed
exit 0
```

The focused suite independently covers every requested invalid fixture, cross-file/global duplicates, stable byte output, exact 6,000/1,200/150 valid release inventory, every aggregate and composition shortage, batch/release exceptions, numeric locale formatting, CLI args/globs/BOM/no-match, atomic merge/collision/symlink/failure preservation, redirect/private/DNS safety, retries/cache/expiry/User-Agent/concurrency, and Wikidata batch/URL caps.

## CLI evidence

The documented invalid-fixture command exits 1 and publishes a blocking report with 45 stable issues. Required codes include `MISSING_TIER`, `DUPLICATE_ID`, `DUPLICATE_CLUE_TEXT`, `DUPLICATE_CATEGORY_NAME`, `INVALID_ROUND`, `MISSING_SOURCE`, `UNDATED_CHANGING_FACT`, `MISSING_TRANSLATION`, and `NUMBER_DRIFT`.

The synthetic valid release CLI is exercised as a subprocess by the focused suite and exits 0 with:

```json
{"boardClues":6000,"categorySets":1200,"distinctCategoryNames":1200,"finalClues":150,"easySets":400,"mediumSets":400,"hardSets":400}
```

## Verification

```text
npm ls glob --depth=0
glob@13.0.6

Existing CSV/content regression selection
4 files passed; 68 tests passed

npm run test:run
66 files passed; 516 tests passed

npm run lint
exit 0

npm run typecheck
exit 0

npm run build
Electron Forge packaged win32/x64; exit 0
```

## Self-review

- No renderer file changed. Runtime application startup/build/verification does not invoke either content CLI.
- Source response bodies are destroyed and never copied into results or cache; reports contain only URL/status/retrieval metadata.
- Validation completes all reads/parsing/checks before the sole optional report write.
- The invalid fixture report generated during verification is not committed; only `content/reports/.gitkeep` reserves the directory.
- No live source URL was used in tests or final verification.
