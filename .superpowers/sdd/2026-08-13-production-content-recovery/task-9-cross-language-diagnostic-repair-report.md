# Task 9 cross-language diagnostic repair

- Completed at: `2026-08-14T00:04:26.6481648Z`
- Scope: translation diagnostic infrastructure only; no content, evidence, review status, or approval changes
- Pinned corrected CSV: `content/work/01-history/generated.en-et.csv`
- Pinned SHA-256: `56ad6969947f35566e24dd8afff9efd6a71d5b69cf5781ea92278b50f0012425`

## Root causes

1. `canonicalNumbers` allowed a unit alternative to match the initial of a following word. The repair requires a complete suffix-token boundary, including rejecting dot-letter continuation in abbreviations such as `m.a.j.`, while retaining standalone unit comparison.
2. `diagnoseVariantDrift` compared translated accepted-variant surfaces. Accepted variants are cross-language alternatives, so the automated gate now compares decoded item count, canonical numbers, and truly stable identifiers (HTTP(S) URLs and Wikidata-style `Q`/`P` identifiers). Localized acronyms remain semantic-review material rather than stable identifiers.

## Strict TDD evidence

Initial RED:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Result: exit 1; 7 tests, 2 failed, 5 passed.
- Failures: natural translated variants emitted `VARIANT_DRIFT`; `8 May` / `8. mail` emitted `NUMBER_DRIFT`.

Localized-acronym RED after the pinned corpus exposed the uncovered branch:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Result: exit 1; 7 tests, 1 failed, 6 passed.
- Failure: translated `US`/`USA`, `PRC`/`HRV`, and `WWII`/`II` alternatives emitted `VARIANT_DRIFT`.

Dotted-abbreviation RED after the pinned corpus narrowed the final two blockers:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Result: exit 1; 7 tests, 1 failed, 6 passed.
- Failure: `AD 79;79 AD` / `79 pKr;79 m.a.j.` emitted `VARIANT_DRIFT` because `m` was parsed as a metre unit.

Final focused GREEN:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Result: exit 0; 7 tests passed.
- The matrix retains blocking checks for `8 m` versus `8 l`, actual numeric changes, item-count changes, conflicting Wikidata identifiers, and conflicting URLs.

## Pinned corpus result

Before repair, the editor checkpoint recorded 1,378 issues: 158 blockers (`ANSWER_DRIFT=1`, `NUMBER_DRIFT=8`, `VARIANT_DRIFT=149`) and 1,220 warnings.

Read-only command after repair:

`npx tsx scripts/content/translationDiagnostics.ts --input content/work/01-history/generated.en-et.csv --report $env:TEMP/jeopardy-task9-diagnostic-repair/corpus-after.json`

- Result: exit 0; 500 rows checked; `blocking=false`.
- Blocking issues: 0.
- Warnings retained for independent review: `SUSPICIOUS_PROPER_NOUN_CHANGE=1061`, `UNCHANGED_TRANSLATION=159` (1,220 total).
- The input hash was rechecked immediately before the command and matched the pinned SHA-256.

## Worktree verification before commit

- Four focused suites in the shared dirty worktree: 97 passed, 1 failed. The sole failure is the pre-existing, unrelated `scripts/content/validate.ts` report-placement heuristic conflicting with `productionValidator.test.ts` (`keeps nested placement as the default even for report-shaped payloads`). That file is outside this repair and was not changed or staged.
- `npm run typecheck`: exit 0.
- `npx eslint scripts/content/translationDiagnostics.ts`: exit 0.
- Linting the whole touched test file also reports one inherited `oppositeEnglish` unused-variable error on an unchanged line; this repair does not absorb that unrelated cleanup.
- `git diff --check -- scripts/content/translationDiagnostics.ts tests/unit/content/translationDiagnostics.test.ts`: exit 0.

Exact-commit verification is reported in the Task 9 handoff after the selective commit; it is intentionally run from a detached clean worktree so unrelated shared-worktree changes cannot affect the result.

## Owned files

- `scripts/content/translationDiagnostics.ts`
- owned regression hunks in `tests/unit/content/translationDiagnostics.test.ts`
- this report

No diagnostic exception, semantic waiver, content edit, translation status change, or approval was introduced.

## Fix round 1: strict identifier presence and acronym review

- Completed at: `2026-08-14T00:18:12Z`
- Parent repair commit: `bf28597252d8b01fe4a2a4f03cffbfda14004cc6`
- Scope remained diagnostic infrastructure only; the pinned CSV SHA-256 remained `56ad6969947f35566e24dd8afff9efd6a71d5b69cf5781ea92278b50f0012425`.

Reviewer findings were reproduced against the real diagnostic entry point:

1. One-sided URL/Q/P identifier loss or addition passed because stable-token comparison required both sides to contain a token.
2. `isStableIdentifier` classified every all-caps acronym as stable, suppressing the proper-noun warning even for unsupported substitutions such as `NATO` to `UN`.

Strict RED commands:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Identifier RED: exit 1; 7 tests, 1 failed. `url-variant-loss` emitted no `VARIANT_DRIFT`.
- Acronym RED after moving that independent assertion first: exit 1; 7 tests, 1 failed. `unsupported-acronym-substitution` emitted no `SUSPICIOUS_PROPER_NOUN_CHANGE`.
- An earlier invocation failed during runner startup because the shared ignored `node_modules` directory had been emptied. It was not counted as RED evidence; dependencies were restored with `npm install --ignore-scripts --no-audit --no-fund` before the behavioral REDs.

Minimum production repair:

- Stable URL and Q/P token arrays must now agree exactly, including zero-versus-one token presence.
- Arbitrary all-caps acronyms are no longer treated as stable identifiers. Literal-equal acronyms remain naturally clean; changed or removed English acronyms enter the existing `SUSPICIOUS_PROPER_NOUN_CHANGE` semantic-review warning path.
- No localization dictionary or semantic equivalence heuristic was added.

Focused GREEN:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Result: exit 0; 7 tests passed.
- Added coverage includes URL and Q/P change/loss/addition, `NATO` to `UN`, acronym loss, literal-equal acronym, `e.m.a.`, localized decimal/thousands separators, reordered dates, and retained real number/unit drift.
- The minor numeric cases were already handled correctly; they required tests only, not further production logic.

Pinned corpus command:

`npx tsx scripts/content/translationDiagnostics.ts --input content/work/01-history/generated.en-et.csv --report $env:TEMP/jeopardy-task9-diagnostic-repair-r1/corpus-after.json`

- Result: exit 0; 500 rows checked; `blocking=false`; zero blockers.
- Warnings: `SUSPICIOUS_PROPER_NOUN_CHANGE=1108`, `UNCHANGED_TRANSLATION=159`, total 1,267.
- The 47-warning increase consists solely of newly visible acronym review items (notably era abbreviations, localized state/organization abbreviations, and Roman numeral forms). These remain pending for independent semantic review; no warning was waived.

Shared-worktree verification retained the known isolation caveats:

- Four focused suites: 97 passed, 1 unrelated `validate.ts` placement failure.
- `npm run typecheck`: exit 0 in the shared worktree, where unrelated WIP fixes base type errors.
- `npx eslint scripts/content/translationDiagnostics.ts`: exit 0.
- Test-file lint: the same inherited unchanged `oppositeEnglish` unused-variable error.
- Owned diff check: exit 0.

Exact-commit clean-snapshot results are supplied in the fix-round handoff after selective commit.

## Fix round 2: case-sensitive URL identity

- Completed at: `2026-08-14T00:24:57.4957163Z`
- Parent repair commit: `9b8beea4f57dc98f30dc9b6f4484fbe3a1b3778f`
- Scope remained diagnostic infrastructure only; the pinned CSV SHA-256 remained `56ad6969947f35566e24dd8afff9efd6a71d5b69cf5781ea92278b50f0012425`.

Root cause: `stableIdentifierTokens` sent extracted URLs and Q/P identifiers through `normalizeText`, which lowercased both. That made case-sensitive URL path or query changes compare equal in accepted variants and canonical responses.

Strict behavioral REDs used the real diagnostic entry point:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Variant RED: exit 1; 7 tests, 1 failed. `https://example.com/Archive?item=Alpha` versus `https://example.com/archive?item=alpha` emitted no `VARIANT_DRIFT`.
- Response RED after independently moving that assertion first: exit 1; 7 tests, 1 failed. Query-value case change emitted no `ANSWER_DRIFT`.
- A preceding invocation failed during runner startup after another shared dependency-tree removal. It was not counted as RED evidence; dependencies were restored before both behavioral runs.

Minimum production repair: extracted URL tokens now retain exact spelling and case. Q/P entity identifiers alone still pass through lowercase normalization, preserving `Q123`/`q123` equivalence. Exact-string deduplication and deterministic code-unit sorting remain in place; no URL canonicalization was introduced.

Focused GREEN:

`npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts`

- Result: exit 0; 7 tests passed.
- Coverage includes URL path/query case changes in accepted variants and canonical responses plus Q/P case equivalence.

Pinned corpus command:

`npx tsx scripts/content/translationDiagnostics.ts --input content/work/01-history/generated.en-et.csv --report $env:TEMP/jeopardy-task9-diagnostic-repair-r2/corpus-after.json`

- Result: exit 0; 500 rows checked; `blocking=false`; zero blockers.
- Warnings unchanged from fix round 1: `SUSPICIOUS_PROPER_NOUN_CHANGE=1108`, `UNCHANGED_TRANSLATION=159`, total 1,267.
- `npx eslint scripts/content/translationDiagnostics.ts`: exit 0.
- Owned diff check: exit 0.

Exact-commit 98-test verification is supplied in the fix-round handoff after selective commit.
