# All-difficulty content expansion verification

The production library adds exactly 1,000 English/Estonian questions at each difficulty in 600 new five-question categories. Each difficulty has 100 new categories in each board round. The 12 core packs each gain 250 questions. Final questions and the Adult and Estonia packs retain their original content.

| Content | Before | Added | After |
| --- | ---: | ---: | ---: |
| Easy board questions | 3,535 | 1,000 | 4,535 |
| Medium board questions | 2,335 | 1,000 | 3,335 |
| Hard board questions | 2,330 | 1,000 | 3,330 |
| Board categories | 1,640 | 600 | 2,240 |
| Final questions | 174 | 0 | 174 |
| All questions | 8,374 | 3,000 | 11,374 |

Each accepted review manifest in `reviews/` records the actual independent factual, editorial and translation approvals for its 250 additions and binds those decisions to exact authored, generated and evidence artifact hashes. The existing 7,399 translation decisions remain unchanged; 5,381 new field-specific decisions are bound to these manifests. The production validator recognizes the equivalent per-question warning IDs only after verifying those bindings. Missing translations, numeric changes and other non-waivable defects remain blocking.

Two fresh production seed builds produced identical SHA-256:

`84b547f39a9f8392541cdc0d9591fd7bdedc3d70ef02b30786043223d5a4a70e`

Independent readback verifies all 8,374 original authored/generated/evidence records against the committed baseline and every original SQLite clue row and 1,814 category rows against the pre-build snapshot. SQLite `quick_check` returns `ok`, with no foreign-key violations. Release validation reports zero errors.

All 2,862 distinct supporting-source URLs used by the additions passed live checks. Whole-library source checking passes 10,798 of 10,803 URLs; five unavailable URLs belong exclusively to unchanged original questions. `verify:content` therefore exits 1 at its source gate. The seed hash, inventory, citations and integrity are separately verified by production seed tests and direct readback.

Integration tests verify complete matches using only the additions at all three difficulties in both languages. Seed synchronization runs twice over an existing database and preserves custom content, match history and a disabled built-in pack. Real development Electron UI checks using isolated production database copies verify English Easy and Estonian Hard boards: each selects six new categories and 30 new clues per round, opens a matching new question, and shows its expected localized prompt without renderer errors. All QA process trees close; the pre-existing Forge process remains running.

The deterministic production seed suite passes all 15 tests with a process-local 4 GiB Node heap. The historical Easy translation exception suite passes all six tests with its sealed 8,374-row corpus and 6,961/438 decision counts unchanged. Historical authoring fixtures pass all 75 tests after excluding this later expansion from their completed-phase transforms; their original assertions remain intact. Final lint, TypeScript and diff whitespace checks pass after these repairs. An independent whole-change review reports no Critical, Important or Minor findings.

The final complete Vitest run covers 133 files and 1,433 tests: **1,415 passed, ten failed and eight skipped**, with no pending assertions or heap failures. All ten failures are `EPERM` during symbolic-link fixture creation on this Windows VM, across seed-builder, offline-renderer, CLI, evidence, validator, publisher, media and checksum tests. Their assertions remain unchanged. Every expansion, production-seed, loading-performance, upgrade and historical-content assertion passes. The final readback after the suite confirms the seed still has the same hash, exact counts, preserved originals and valid integrity. This task leaves the Windows symlink permission setting unchanged.

Evidence logs, JSON results and runtime screenshots are under the ignored work directory `content/work/2026-10-all-difficulty-expansion/`. The tracked review manifests, preservation baseline, production artifacts and regression tests provide reproducible verification. Packaged installer smoke testing is outside this content-only task.
