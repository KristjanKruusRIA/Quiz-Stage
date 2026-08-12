# Task 7 report: development seed and content service

## Status

Implemented the validated, offline development content library, SQL repository mapping, deterministic selection service, transactional fixture importer, and committed SQLite development resource.

Controller decision: the task brief named `resources/content/dev-seed.sqlite` as a produced interface but omitted `resources/` from its exact staging example. The controller explicitly selected option A: generate and commit the SQLite resource in addition to the listed paths so development/tests have the offline resource reproducibly.

## Files

- `package.json`: added `content:build-dev-seed`.
- `src/shared/content/schema.ts`: Zod schemas for localized text, persisted packs/category sets/clues/Finals, plus strict development inventory and bilingual completeness checks.
- `src/main/content/contentRepository.ts`: owns SQL queries, row/JSON mapping, Zod validation, source preservation, and `MAX(seen_at)` aggregation for board category sets and Finals.
- `src/main/content/contentService.ts`: maps repository records into selector inputs and exposes `checkAvailability(config)` and `selectForMatch(config, seed)`.
- `scripts/content/build-dev-seed.ts`: validates the fixture, deletes only the resolved explicit output file, runs ordered SQL migrations, imports all content in one transaction, normalizes SQLite journal/file state, and prints inventory.
- `tests/fixtures/dev-content.json`: one development pack, 36 category sets (12 per difficulty; 6 per board round), five clues per set, 3 Finals, complete English/Estonian text, and source metadata.
- `tests/integration/content/contentService.test.ts`: availability, deterministic selection, exact Estonian shortage, history aggregation, fixture completeness, and persisted-row validation.
- `resources/content/dev-seed.sqlite`: deterministic offline development/test database (188,416 bytes).

## RED / GREEN evidence

Initial required RED:

```text
npm run test:run -- tests/integration/content/contentService.test.ts
FAIL: Cannot find module '../../../src/main/content/contentRepository'
Test Files 1 failed (1), exit 1
```

Additional TDD REDs:

- Missing Estonian fixture translation was initially accepted (`expected [Function] to throw`). Added fixture-only bilingual completeness validation.
- Invalid persisted pack metadata was initially not validated (`expected [Function] to throw`). Added pack-row SQL mapping and Zod validation before selection.

Final focused GREEN:

```text
npm run test:run -- tests/integration/content/contentService.test.ts
Test Files 1 passed (1)
Tests 5 passed (5)
exit 0
```

## Seed build and inventory

```text
npm run content:build-dev-seed
183 clues, 36 category sets, 3 Finals
exit 0
```

Direct database verification:

```json
{"integrity":"ok","clues":183,"categorySets":36,"finals":3,"etMissing":0}
```

The SQL database contains 36 board category-set rows plus 3 internal Final category rows; the reported category-set count intentionally measures selectable board sets, while the 3 Finals are reported separately. All 180 board clues plus 3 Finals preserve a non-empty source string and complete English/Estonian prompt, response, and explanation text.

## Deterministic rebuild evidence

Two consecutive clean replacements of the explicit output produced byte-equivalent database files:

```text
first=CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
second=CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
```

Determinism comes from validated input, ID-sorted inserts, stable localized JSON key ordering, fixed migration timestamps, a truncated WAL, DELETE journal mode, and final `VACUUM`.

## Final verification

```text
npm run test:run -- tests/integration/content/contentService.test.ts
1 file passed; 5 tests passed; exit 0

npm run test:run
13 files passed; 90 tests passed; exit 0

npm run lint
exit 0

npm run typecheck
exit 0

git diff --cached --check
exit 0
```

## Self-review

- Scope is limited to the development library/service/seed requested; there is no network ingestion, editing/import UI, production library, overrides/reports behavior, or renderer database access.
- SQL and JSON mapping remain in `ContentRepository`; `ContentService` only assembles validated selector input and delegates to Task 5's pure selector, preserving its shortage object unchanged.
- The generated SQLite resource is consumed read-only by focused integration tests. Tests copy it before simulating missing translations or history.
- Public API was reduced during review: selector-input assembly remains private to `ContentService`; repository `loadLibrary()` is the persisted-content boundary.
- No unrelated files were changed.

## Concerns

- `forge.config.ts` currently packages only `.vite` output and the native SQLite dependency, so this task deliberately guarantees the committed seed for development/tests as scoped by the brief. Wiring the seed into a packaged production application belongs to later main-process/application integration work.
- The development questions are deterministic fixture content, not production-quality quiz material; the requested production 6,000-clue corpus remains out of scope.

## Commit

`6f3efd0 feat(content): add validated development library`

## Fix round 1: atomic and path-safe seed publication

### Findings addressed

1. Replaced direct final-path deletion/building with a unique sibling temporary SQLite database. The builder closes and normalizes the complete database before `renameSync` publishes it. Its `finally` block removes the exact temporary database and WAL/SHM sidecars, while a failed migration/import leaves an existing good seed byte-for-byte unchanged.
2. Anchored the default fixture, migrations directory, and output path to the repository location derived from `import.meta.url`, independent of `process.cwd()`. Explicit targets now reject filesystem roots, non-`.sqlite` paths, directories/symlinks, fixture aliases, and existing non-SQLite files before any modification.
3. Added direct builder integration coverage for failed replacement preservation/cleanup, failed transactional import with no partial publication, unsafe target rejection/non-modification, foreign-CWD CLI execution, inventory, and byte-equivalent rebuilds.

### RED evidence

```text
npm run test:run -- tests/integration/content/devSeedBuilder.test.ts
FAIL preserves the previous seed and cleans temporary files when a replacement build fails
Expected prior SHA-256 caf759b9...75fdc
Received partial replacement SHA-256 73083d1e...930c5
exit 1
```

The original implementation deleted the good output before the invalid fixture reached its deliberate late foreign-key failure. The initial binary-buffer assertion also caused Vitest to spend excessive time rendering a large diff; the test was corrected to compare independently calculated SHA-256 strings, after which the behavioral RED completed normally.

### GREEN and deterministic evidence

```text
npm run test:run -- tests/integration/content/devSeedBuilder.test.ts
1 file passed; 5 tests passed; exit 0

npm run test:run -- tests/integration/content
2 files passed; 10 tests passed; exit 0

npm run content:build-dev-seed
183 clues, 36 category sets, 3 Finals
before=CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
after=CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
```

### Full verification

```text
npm run test:run
14 files passed; 95 tests passed; exit 0

npm run lint
exit 0

npm run typecheck
exit 0
```

### Fix-round self-review

- Publication touches only the caller's validated explicit `.sqlite` target; cleanup touches only the builder-created unique sibling temp file and its two SQLite sidecars.
- Fixture parsing and all migration/import/checkpoint/journal/VACUUM work complete before the final path is replaced.
- The invalid fixture fails after earlier rows have been attempted inside the real transaction, and tests verify neither a partial final database nor temp artifact remains.
- Existing non-SQLite targets and fixture aliases remain unchanged after rejection.
- No repository-CWD assumption remains in default resource discovery.

Fix-round commit: `5d760af fix(content): publish development seed atomically`.

## Fix round 2: reject dangling output symlinks

### RED

Added a Windows-backed regression that creates a dangling file symlink at the requested `.sqlite` destination. With the prior `existsSync` preflight, the link appeared absent, the builder returned successfully, and the expected unsafe-target exception was missing:

```text
npm run test:run -- tests/integration/content/devSeedBuilder.test.ts
FAIL rejects a dangling destination symlink without following or replacing it
AssertionError: expected [Function] to throw an error
exit 1
```

### Fix

The output preflight now calls `lstatSync(outputPath, { throwIfNoEntry: false })` exactly once before any following operation. An undefined result is the only absent-target case; every symlink is rejected from the no-follow stat, including a dangling symlink. Fixture real-path comparison remains after the regular-file check.

### GREEN

```text
npx vitest run --configLoader runner tests/integration/content/devSeedBuilder.test.ts -t "dangling destination symlink"
1 test passed; 5 skipped; exit 0

npm run test:run -- tests/integration/content
2 files passed; 11 tests passed; exit 0

npm run test:run
14 files passed; 96 tests passed; exit 0

npm run lint
exit 0

npm run typecheck
exit 0
```

Default seed rebuild remained byte-equivalent and retained the inventory:

```text
183 clues, 36 category sets, 3 Finals
before=CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
after=CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC
```

Fix-round self-review: 19 changed lines across the builder and its focused integration test; no content, schema, repository, service, or generated resource changes.

Fix-round 2 commit: `2b1d25a fix(content): reject dangling seed symlinks`.
