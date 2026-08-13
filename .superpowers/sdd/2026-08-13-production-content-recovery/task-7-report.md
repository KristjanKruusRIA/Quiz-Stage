# Task 7 report: hash-bound batch gate and atomic publisher

## Status

Implemented and committed on `codex/finish-quiz-stage`.

## Assumptions

- `workRoot` is the parent of `<batchId>`; verification reads `authored.csv`, `generated.en-et.csv`, and `evidence.jsonl`, then writes `<workRoot>/<batchId>/report.json`.
- `acceptedRoot` is the repository-like root above `content/authored`, `content/generated`, `content/evidence`, and `content/reports`.
- The deterministic report intentionally has no verification wall-clock field. Source timestamps are supplied by the injected/cache-backed source checker.
- Publisher rename injection is limited to forward backup/replacement renames. Rollback uses the real same-filesystem rename so an injected forward failure cannot also sabotage restoration.

## Implementation

- Added exported `VerifyBatchOptions`, `BatchVerificationReport`, and `verifyBatch`.
- The gate reads evidence through the Task 2 reader, hashes final exact artifact bytes, runs authored and generated batch validation, translation diagnostics, exact composition/review checks, and one source check per distinct trusted supporting URL.
- Reports include strict version/batch/hash binding, both validation results, diagnostics, UTF-16 code-unit sorted source results and unresolved issues, and deterministic clue-ID samples for every required allocation cell.
- Added exported `PublishBatchOptions`, `PublishBatchDependencies`, and `publishBatch`.
- Publication strict-parses and semantically rechecks the report, verifies batch and all three hashes, rejects unsafe paths/symlinks, stages the quartet before mutation, backs up every prior accepted file, publishes the report last, and restores the complete old quartet after any forward rename failure.
- Changed source URL and Wikidata entity sorting from locale collation to explicit UTF-16 code-unit total ordering without changing SSRF, redirect, retry, concurrency, or cache behavior.
- Added only `content:verify-batch` and `content:publish-batch` package commands.

## TDD evidence

Initial RED:

```text
npm run test:run -- tests/unit/content/verifyBatch.test.ts
Test Files  1 failed (1)
Tests       no tests
Cannot find module '../../../scripts/content/publishBatch'
```

Expanded RED:

```text
Test Files  1 failed (1)
Tests       10 failed | 1 passed (11)
```

The valid-gate assertion failed because blank accepted-variant pairs are blocking under the existing diagnostics contract; downstream stale-hash and rollback cases consequently stopped at the blocking report. The fixture was corrected rather than production diagnostics.

Code-unit ordering RED:

```text
Test Files  1 failed (1)
expected decomposed a-diaeresis URL before composed diaeresis URL
```

Strict semantic report RED:

```text
Test Files  1 failed (1)
Tests       1 failed | 14 passed (15)
promise resolved instead of rejecting a nested blocking validation
```

Final GREEN:

```text
npm run test:run -- tests/unit/content/verifyBatch.test.ts tests/unit/content/productionValidator.test.ts
Test Files  2 passed (2)
Tests       63 passed (63)
Exit code: 0
```

```text
npm run typecheck
Exit code: 0
```

```text
npx eslint scripts/content/verifyBatch.ts scripts/content/publishBatch.ts scripts/content/sourceCheck.ts tests/unit/content/verifyBatch.test.ts
Exit code: 0
```

```text
git diff --cached --check
Exit code: 0
```

## Failure-injection proof

- Eight table-driven cases fail each forward rename phase: four existing-file backup renames, followed by authored, generated, evidence, and last-report replacement renames.
- Every case asserts byte-identical restoration of all four prior accepted files and absence of publisher-owned `.tmp`/`.bak` files.
- A separate stale-hash case changes authored bytes after verification and proves all accepted bytes remain unchanged.
- A source failure uses injected DNS/fetch/time dependencies with one attempt and no live network, produces a blocking report, and cannot publish.
- A forged schema-valid report with `blocking: false` but a nested blocking validation is rejected without accepted mutation.

## Staged files and hunks

- Fully staged Task 7 files: `scripts/content/verifyBatch.ts`, `scripts/content/publishBatch.ts`, and `tests/unit/content/verifyBatch.test.ts`.
- Fully staged Task 7-only `scripts/content/sourceCheck.ts` comparator hunk.
- Index-only staged the two requested `package.json` scripts. All unrelated package/release/packaging WIP remained unstaged.

## Commit

- `4a125fa feat(content): gate and atomically publish batches`

## Self-review and concerns

- Rechecked the work trio, trusted/batch-bound evidence, both batch validators, translation gate, source deduplication/injection/cache path, exact composition/approvals, deterministic samples/order/hashes, strict report semantics, path guards, quartet staging, backup order, report-last publication, and rollback cleanup.
- Verification writes only the unpublished work report and never writes accepted artifacts. Blocking/stale/malformed reports return before publisher staging.
- No live network was used in unit tests.
- No full-suite claim is made; the requested focused gate, typecheck, focused lint, staged whitespace check, and post-commit checks are the authority for this task.
- The repository remains intentionally dirty with unrelated pre-existing WIP, which was not reset, stashed, or committed.

## Fix round 1/5: boundary hardening

### Scope and assumptions

- The approved `preflight-failure` report is the only result for missing, unreadable, or unparseable work inputs. It is strict, blocking, atomically replaces a stale passing report, and is never publishable.
- A passing report is not trusted merely because its hashes match. Publication revalidates the exact staged bytes and requires coherent validation modes, nonblocking summaries, diagnostics, evidence, allocation samples, and source results.
- Rollback restore failures are observable and recoverable: every original is independently attempted, successfully restored backups are removed, and any backup whose restore fails is retained.

### TDD evidence

Focused RED before implementation:

```text
npm run test:run -- tests/unit/content/verifyBatch.test.ts tests/unit/content/productionValidator.test.ts
Test Files  2 failed (2)
Tests       9 failed | 63 passed (72)
```

The nine failures covered stale-report invalidation, malformed evidence, report symlink containment, report-byte swapping, forged passing-report semantics, rollback restore failure, pre-existing temporary and backup collisions, and reviewed authored evidence with missing Estonian text.

Focused GREEN at the committed revision:

```text
npm run test:run -- tests/unit/content/verifyBatch.test.ts tests/unit/content/productionValidator.test.ts
Test Files  2 passed (2)
Tests       74 passed (74)
Exit code: 0
```

```text
npx eslint scripts/content/evidence.ts scripts/content/publishBatch.ts scripts/content/validate.ts scripts/content/verifyBatch.ts tests/unit/content/productionValidator.test.ts tests/unit/content/verifyBatch.test.ts
Exit code: 0
```

Clean detached-revision typecheck is not green, but the same unrelated diagnostics occur at both `3a4e54b` and `c64d071`: `buildSeed.ts`, `fetchOpenTdb.ts`, `mapWikidataCandidates.ts`, and `translationDiagnostics.test.ts`. Task 7's focused files add no typecheck diagnostic.

### Failure and adversarial proof

- Missing authored, unreadable generated, and malformed evidence inputs each replace a stale passing report with the exact minimal preflight-failure union member.
- An exclusive report-temp collision leaves both the stale report and the pre-existing collision untouched; report symlink targets are rejected and remain byte-identical.
- Publication uses the one report read it validated and staged, proven by swapping the source report immediately after that read.
- Forged reports are rejected for wrong validation mode, malformed/duplicate/short/extra allocation samples, and incoherent source status, code, timestamp, or final URL.
- Forward failure after partial replacement independently attempts restoration of all four originals. An injected authored restore failure leaves its owned backup recoverable while the other three originals are restored, and the aggregate error identifies rollback failure.
- Pre-existing publisher temporary and backup collisions are preserved exactly and prevent accepted mutation.
- Reviewed authored evidence remains reviewed when the authored row legitimately omits Estonian text under the batch exception.
- All source-path regressions use injected dependencies and no live network.

### Staged files and commit

- Fully staged: `scripts/content/evidence.ts`, `scripts/content/publishBatch.ts`, `scripts/content/verifyBatch.ts`, `tests/unit/content/productionValidator.test.ts`, and `tests/unit/content/verifyBatch.test.ts`.
- Index-only staged: the reviewed-authored conditional in `scripts/content/validate.ts`; unrelated dirty hunks in that file remained unstaged.
- `git diff --cached --check` passed before commit.
- Implementation commit: `c64d071 fix(content): harden batch publication recovery`.

### Self-review

- Rechecked all seven findings against code and focused regressions: strict report semantics, exact-byte parsing, exhaustive rollback, ownership-aware cleanup, safe atomic report publication, fatal preflight invalidation, and preserved authored review evidence.
- Accepted artifacts remain untouched by verification. A failed safe report invalidation throws before publication is possible.
- The unrelated dirty worktree was neither reset nor included in the implementation commit.

## Fix round 2/5: report-parent swap race

### Review finding and TDD

The verifier initially checked the report path only before reading and validating the work artifacts. An injected source check could rename the real batch directory and replace it with a junction while `verifyBatch` was awaiting network work, causing atomic report staging and replacement to follow the junction outside `workRoot`.

Focused RED against `c15d1e6`:

```text
npx vitest run --configLoader runner tests/unit/content/verifyBatch.test.ts -t "batch directory swapped"
Test Files  1 failed (1)
Tests       1 failed | 25 passed (26)
AssertionError: promise resolved instead of rejecting
```

The regression swaps `<workRoot>/01-history` to an outside junction inside the injected source fetch, then requires verification to reject while the outside `report.json` sentinel and outside directory listing remain unchanged.

### Implementation

- Revalidate lexical containment, symlink/junction-free ancestors, the batch-directory type, and report-destination type immediately before each exclusive temporary-file staging attempt.
- Revalidate the same invariants immediately before the temporary-to-report rename.
- Route both full verification and `preflight-failure` reports through the hardened writer.
- Record the exclusively created temporary's device/inode identity. Cleanup unlinks it only while the report path remains safe and the identity still matches, so a swapped parent cannot redirect cleanup outside `workRoot`.

### GREEN and isolated evidence

Dirty-worktree verification:

```text
npm run test:run -- tests/unit/content/verifyBatch.test.ts tests/unit/content/productionValidator.test.ts
Test Files  2 passed (2)
Tests       75 passed (75)
Exit code: 0

npm run typecheck
Exit code: 0

npx eslint scripts/content/verifyBatch.ts tests/unit/content/verifyBatch.test.ts
Exit code: 0
```

Detached worktree at implementation commit `bf2b9c0` with independent lockfile-installed dependencies:

```text
Test Files  2 passed (2)
Tests       75 passed (75)
Focused ESLint exit code: 0
```

The implementation commit contains only `scripts/content/verifyBatch.ts` and `tests/unit/content/verifyBatch.test.ts`; `git diff --cached --check` passed before commit.

During verification-worktree setup, cleanup of a shared junction removed the derived main-worktree `node_modules` contents. Dependencies were restored with `npm ci --ignore-scripts`; the pre-existing `package-lock.json` SHA-256 remained exactly `1152DCAA9D6F5E86449B424866C40920423320222C4FAAD0E6E0228FC240B4E5`, and no source or unrelated WIP was changed. Detached verification was then rerun using an independent, non-linked dependency directory.

### Commit

- `bf2b9c0 fix(content): revalidate batch report path`
