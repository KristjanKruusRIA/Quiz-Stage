# Task 6 report: immutable candidates and unpublished worklists

## Status

Implemented and committed on `codex/finish-quiz-stage`.

## Assumptions

- Candidate/cache/checkpoint roots are repository-relative `content/imports`; unpublished authoring output is repository-relative `content/work`.
- `rawFact` is assessment material, not authored clue prose: decoded OpenTDB question plus answer, or Wikidata entity/property/normalized value with stable IDs.
- The existing stable source ID is also the `candidateId`. Existing provenance field names remain backward compatible; OpenTDB additionally exposes the required `license` and `inspirationOnly` fields.
- Existing `sourceRecipe`, normalized value/fact key, entity URL, fetched time, and `sourceLicense: 'CC0-1.0'` already satisfy the Wikidata provenance contract, so `wikidataRecipes.ts` required no change.

## Implementation

- Added shared candidate/work path guards with resolved containment checks and rejection of traversal, prefix collisions, existing symlink targets, and symlinked ancestors.
- Applied candidate guards to OpenTDB output/checkpoint and Wikidata output/cache before network requests or filesystem mutations.
- Added stable `candidateId` to both candidate formats and explicit OpenTDB inspiration-only/license provenance.
- Added atomic, deterministic worklist construction through `getProductionBatch`, with exact unpublished row shape, `selected: false`, and UTF-16 code-unit ordering by origin, candidate ID, and fact key.
- Added only the requested `content:build-worklist` package script. No authored clue content, approvals, CSVs, seed data, or accepted-content artifacts were generated.

## TDD evidence

### RED

```text
npm run test:run -- tests/unit/content/candidatePaths.test.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts
Test Files  3 failed (3)
Tests       4 failed | 7 passed (11)
```

The intended failures were missing path/worklist modules, missing candidate provenance, and unsafe output/cache paths reaching the mocked network. An additional focused RED proved an unsafe OpenTDB checkpoint reached the network before the guard was applied.

### GREEN

```text
npm run test:run -- tests/unit/content/candidatePaths.test.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts
Test Files  3 passed (3)
Tests       18 passed (18)
Exit code: 0
```

```text
npm run typecheck
Exit code: 0
```

```text
npx eslint scripts/content/candidatePaths.ts scripts/content/buildAuthoringWorklist.ts scripts/content/fetchOpenTdb.ts scripts/content/adaptOpenTdb.ts scripts/content/fetchWikidata.ts scripts/content/mapWikidataCandidates.ts tests/unit/content/candidatePaths.test.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts
Exit code: 0
```

```text
git diff --cached --check
Exit code: 0
```

## Files and staged hunks

- Fully staged new files: `scripts/content/candidatePaths.ts`, `scripts/content/buildAuthoringWorklist.ts`, `tests/unit/content/candidatePaths.test.ts`.
- Fully staged Task 6-only files: `scripts/content/adaptOpenTdb.ts`, `tests/unit/content/openTdbImport.test.ts`.
- Index-only selected hunks: the single `package.json` command; path-guard imports/calls in both fetchers; `candidateId` mapping hunks in `mapWikidataCandidates.ts`; Task 6 imports/setup/provenance/cache-guard hunks in `wikidataImport.test.ts`.
- Inspected and intentionally unchanged: `scripts/content/wikidataRecipes.ts`.

## Commit

- `0904220c5c90f9106eaae77d8958e69ef2fa7d86 feat(content): isolate immutable authoring candidates`
- `git show --check 0904220` passed.

## Self-review and concerns

- Rechecked every brief bullet: all fetch destinations are candidate-only, all guard calls precede side effects, accepted content is untouched, provenance is complete, batch lookup is authoritative, candidate inputs remain byte-identical, output is atomic and byte-deterministic, and every row is unselected/unapproved.
- Existing retry, rate-limit, resume/deduplication, cache/checkpoint, timeout, pagination, and atomic-write logic was not replaced. Focused regression tests stayed green.
- Pre-existing dirty WIP in `package.json`, both fetchers, the Wikidata mapper, and `wikidataImport.test.ts` remains unstaged and was not reset, stashed, or included. Other repository WIP remains untouched.
- No public-contract ambiguity remains. No full-suite claim is made beyond the requested focused tests, typecheck, and focused ESLint.
