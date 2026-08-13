# Task 8 report: evidence-bound runtime citations and seed verification

## Assumptions and scope

- The production-content-recovery plan's Global Constraints, Shared Contracts, and Task 8 brief are authoritative.
- The supplied repository instructions are authoritative because no `E:\git\jeopardy\AGENTS.md` file exists.
- Existing v1 custom CSV import/export, editor overrides, persisted rows, and coordinator citation display must remain unchanged. Only the production seed builder emits v2.
- The committed filler corpus and missing `content/evidence` directory remain Task 22 work. Task 8 must fail closed rather than create fallback citations or weaken release validation.
- Existing dirty changes in `package.json`, `scripts/content/buildSeed.ts`, `scripts/content/validate.ts`, and `tests/integration/content/productionSeed.test.ts` belong to other work and were preserved unstaged except for exact Task 8 hunks.

## Implementation

- Added exported strict `StoredSourceV1` and `StoredSourceV2` schemas/types plus the discriminated `StoredSource` union. Parsing, serialization, and display accept both versions; incomplete, extra-field, or malformed v2 values fail closed.
- Production builds require one or more evidence patterns and read them before CSV input, output-path validation, temporary SQLite allocation, or report publication.
- Release validation receives the exact pre-read evidence map. Each CSV clue consumes exactly one evidence record, and every evidence record must be consumed.
- Production SQLite citations are always v2. `title`, `url`, `license`, `retrievedAt`, and `sourceId` come from `supportingSource`; `factualVerifiedAt` comes from `factualReview.reviewedAt`; `translationStatus` comes from the already validated CSV row. Candidate inspiration metadata is never serialized as the factual citation.
- Build and verify CLIs accept repeatable `--evidence`. `verify:content` passes `content/evidence/*.jsonl` exactly.
- Verify preflights evidence before validation-report staging, preserves an existing report on evidence/validation failure, and checks every SQLite clue against its exact v2 evidence citation before accepting the seed.
- CSV file ordering, migration ordering, stable row insertion, and evidence-manifest ordering use UTF-16 code-unit comparisons. The deterministic migration timestamp is fixed at `0`.

## TDD evidence

### RED

Command:

```powershell
npm run test:run -- tests/unit/content/sourceCitation.test.ts tests/integration/content/productionSeed.test.ts
```

Initial result: 5 failures. The focused failures showed that v2 parsed as `null`, build and verify checked missing CSV before missing evidence, the build CLI rejected `--evidence`, and an evidence-backed production build could not proceed. The fifth failure was the expected pre-existing filler-corpus release gate.

A later focused RED for evidence-aware SQLite verification failed with `TypeError: inspectSeed is not a function`; it turned green after exact v2/evidence inspection was implemented.

### GREEN

Task 8 focused selection:

```powershell
npx vitest run --configLoader runner tests/unit/content/sourceCitation.test.ts tests/integration/content/productionSeed.test.ts -t "stored source citations|evidence-bound production seed infrastructure"
```

Result: 2 files passed, 16 tests passed, 2 unrelated filler acceptance tests skipped.

Infrastructure gate:

```powershell
npm run test:run -- tests/unit/content tests/unit/game/boardSelector.test.ts tests/integration/content/csvRoundTrip.test.ts
```

Result: 15 files passed, 216 tests passed.

Additional gates:

```powershell
npm run typecheck
npx eslint src/shared/content/sourceCitation.ts scripts/content/buildSeed.ts scripts/content/verifySeed.ts scripts/content/validate.ts tests/unit/content/sourceCitation.test.ts tests/integration/content/productionSeed.test.ts
```

Result: both exited `0`. The targeted `csvRoundTrip.test.ts` is included in the 216-test infrastructure run and retains explicit v1 import/export behavior.

## Determinism and adversarial coverage

- A synthetic valid 6,150-row release corpus builds twice from identical CSV/evidence bytes. The SQLite bytes and SHA-256 hashes are identical.
- All 6,150 stored citations are v2. A literal sample assertion proves every field's evidence/CSV origin, with distinct supporting-source and OpenTDB-candidate IDs.
- Verification rejects a seed after one citation is tampered back to v1.
- Missing, malformed, duplicate, alias, orphan, batch-mismatched, and unapproved evidence cases leave pre-existing seed/report bytes unchanged and leave no Task 8 temporary SQLite/report files.
- Repeatable evidence arguments are exercised through both the build and verify entry points.

## Intentional production red

The full prescribed citation/production command currently reports 17 passing tests and one failure: `production seed > matches the release inventory thresholds...` sees `validation.blocking === true`. This is the permitted filler-corpus failure until Task 22 replaces and publishes accepted evidence-backed content.

`npm run verify:content` currently exits `2` because `content/evidence/*.jsonl` matches no files. The release inventory SHA-256 was identical before and after (`AA2347D305C54AB3992DC15818661163A7C799E03D0E1015016388C9A913D00D`), proving the missing-evidence gate did not mutate it.

## WIP isolation and commit

- Commit: `3f000c9 feat(content): bind production seed to reviewed evidence`
- The commit contains seven files and a surgical `validate.ts` seam allowing verify to reuse its preloaded evidence map.
- Unrelated packaging scripts/dependencies, the existing cross-volume seed-copy fallback, the production-test timeout, and validator report/formatting edits remain unstaged in the shared workspace.
- No reset, stash, discard, broad staging, or amend was used.

## Remaining concern

Release readiness is intentionally blocked until Tasks 9-22 provide accepted evidence/content and rebuild the committed production seed. No v1 production fallback exists.
