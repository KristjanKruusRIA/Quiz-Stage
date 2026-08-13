# Task 5 report: translation diagnostics and semantic approval

## Status

Implemented and committed on `codex/finish-quiz-stage`.

## Implementation

- Added the pure callable `diagnoseTranslations(inputs)` with the required `TranslationDiagnosticInput` contract. The CLI still parses CSV inputs, publishes `{ translation: report }`, and returns non-zero only for blocking reports.
- Added blocking `ANSWER_DRIFT`, `VARIANT_DRIFT`, and `QUALIFIER_DRIFT` diagnostics. The qualifier detector uses only the brief's fixed opposite-pair vocabulary, Unicode-letter tokenization, and detects both translation directions without flagging a pair that correctly contains both opposites.
- Kept stable identifiers and URLs exempt from answer/variant equality drift.
- Bound trusted validator evidence to CSV review state: release requires both a reviewed CSV row and non-null schema-approved translation review; batch rejects either disagreement while allowing a `machine` row with null review.
- `contentEvidenceSchema.translationReview` remains nullable; no evidence-schema duplication or schema tightening was made.

## TDD evidence

### RED

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts
FAIL: TypeError: diagnoseTranslations is not a function
```

```text
npm run test:run -- tests/unit/content/productionValidator.test.ts
FAIL: requires CSV translation status and evidence review to agree before trusting evidence
```

An additional qualifier-pair regression was RED before the detector was adjusted to avoid treating a correctly translated north-and-south pair as drift.

### GREEN

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts tests/unit/content/evidence.test.ts tests/unit/content/productionValidator.test.ts
Test Files  3 passed (3)
Tests  64 passed (64)
Exit code: 0
```

The same focused command was rerun after the cleanup commit with the same 64/64 passing result.

## Files

- `scripts/content/translationDiagnostics.ts`
- `scripts/content/validate.ts` (only the translation-status/evidence-agreement trust-boundary hunks)
- `tests/unit/content/translationDiagnostics.test.ts`
- `tests/unit/content/productionValidator.test.ts`

`scripts/content/evidence.ts` and `tests/unit/content/evidence.test.ts` were inspected and left unchanged because `translationReview` was already nullable with direct coverage.

## Commits

- `5579cee feat(content): enforce bilingual semantic review`
- `93444aa test(content): clean diagnostic callable fixture` (separate one-line whitespace cleanup; created rather than amending per workflow)

## Self-review

- Rechecked the required callable shape, report purity, fixed vocabulary, stable-ID exemptions, release/batch agreement behavior, and evidence exclusion path.
- `git show --check` is clean for the cleanup commit. The focused test gate is green.
- Existing unrelated unstaged work remains present, including pre-existing changes in `scripts/content/validate.ts` and `tests/unit/content/translationDiagnostics.test.ts`; it was not reset, stashed, or included in the task commits.

## Concerns

- The known full-suite baseline remains outside this task: packaging contents timeout and production seed corpus recovery. No full-suite claim is made.

## Fix round 1/5

### Implementation

- Tightened `VARIANT_DRIFT`: the exception now applies only when the normalized same-index items are the *same* stable identifier. Different `Q`/`P` identifiers and different URLs are blocking.
- Narrowed `ANSWER_DRIFT` to response numeric drift or conflicting stable identifiers. Literal natural-language answer translations no longer cause it.
- Retained the exact qualifier dictionary: the base vocabulary plus only `põhjas`, `lõunas`, `idas`, and `läänes`; no additional morphology was added.
- Added `clueId` as the final public issue ordering tie-breaker.
- Added batch regressions for `machine + null`, `machine + approved review`, and `reviewed + null`; disagreement is asserted excluded from duplicate-fact ownership and OpenTDB composition.

### RED

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts
FAIL: natural-language-answer unexpectedly contained ANSWER_DRIFT
FAIL: otherwise identical public issues differed by caller input order
```

The batch-state regression is retained as independent coverage for the pre-existing Task 5 trust-boundary behavior.

### GREEN

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts tests/unit/content/evidence.test.ts tests/unit/content/productionValidator.test.ts
Test Files  3 passed (3)
Tests  67 passed (67)
Exit code: 0
```

This command was run after commit `35331df`.

### Files

- `scripts/content/translationDiagnostics.ts`
- `tests/unit/content/translationDiagnostics.test.ts`
- `tests/unit/content/productionValidator.test.ts`

### Commit

- `35331df fix(content): tighten translation diagnostics`

### Self-review

- Verified the cumulative Task 5 range with `git diff --check 31ca4e5a52ea732b220124a2d908063f6c4230c0..HEAD` and verified the new commit with `git show --check`.
- Confirmed Task 5 selective staging: pre-existing unstaged WIP in `scripts/content/validate.ts` and `tests/unit/content/translationDiagnostics.test.ts` remains outside `35331df`.

### Determinism follow-up

The requested final tie-break is code-unit ordering, not locale collation. A new RED case used composed `ä` and decomposed `a\u0308` clue IDs:

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts
FAIL: otherwise identical public issues differed by caller input order
```

`stableIssueSort` now uses an explicit code-unit comparator for `clueId`; the regression asserts both caller-order independence and `a\u0308` before `ä`.

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts tests/unit/content/evidence.test.ts tests/unit/content/productionValidator.test.ts
Test Files  3 passed (3)
Tests  67 passed (67)
Exit code: 0
```

- Commit: `81b0f13 fix(content): order translation diagnostics by code unit`
- Files: `scripts/content/translationDiagnostics.ts`, `tests/unit/content/translationDiagnostics.test.ts`
- Self-review: `git diff --check 31ca4e5a52ea732b220124a2d908063f6c4230c0..HEAD` and `git show --check 81b0f13` passed; unrelated WIP remains unstaged.

## Fix round 2/5

### RED

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts
FAIL: equal-number-prose-answer unexpectedly contained ANSWER_DRIFT
```

### Implementation

- Removed the broad whole-text digit condition from `isStableIdentifier`.
- Added explicit extraction and comparison of URL, `Q`/`P` entity-ID, and all-caps acronym tokens for the narrowed `ANSWER_DRIFT` branch.
- Equal-number translated prose remains covered as non-blocking; existing regressions retain unequal canonical-number, stable-ID, and URL coverage.

### GREEN

```text
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts tests/unit/content/evidence.test.ts tests/unit/content/productionValidator.test.ts
Test Files  3 passed (3)
Tests  67 passed (67)
Exit code: 0
```

### Files and self-review

- `scripts/content/translationDiagnostics.ts`
- `tests/unit/content/translationDiagnostics.test.ts`
- `task-5-report.md`

Verified the exact focused gate and `git diff --check`; selective staging excludes unrelated WIP.
