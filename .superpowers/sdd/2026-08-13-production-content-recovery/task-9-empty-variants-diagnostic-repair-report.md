# Task 9 empty-variants diagnostic repair

Status: complete and verified. This repair changes only translation diagnostics for the legitimate case where both accepted-variant fields are empty. Translation correction and semantic review remain paused.

## Contract and root cause

An authored clue may legitimately have no accepted variants. When both `accepted_variants_en` and `accepted_variants_et` are empty, diagnostics must emit neither `BLANK_TRANSLATION` nor `VARIANT_DRIFT`, and must create no exception. A nonempty English variant with missing or drifted Estonian variants remains blocking.

`splitEscapedItems('')` returns `['']`, and `extractPairs` previously forced at least one accepted-variant pair. `diagnosePair` then interpreted the synthetic empty Estonian item as a missing translation.

## RED

The regression builds two production-shaped rows: a legitimate both-empty variants row and a blocking control with English `Alternative` and empty Estonian variants.

Command:

```powershell
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts -t "skips absent variants while keeping missing Estonian variants blocking"
```

Result: exit 1. Vitest ran the six-test file and the new test failed in 39 ms because the legitimate row contained:

```text
{
  "clueId": "no-variants",
  "code": "BLANK_TRANSLATION",
  "field": "accepted_variants_en",
  "message": "accepted_variants is blank in Estonian",
  "severity": "error"
}
```

The command also displayed npm’s warning that `-t` was forwarded as a normal argument; this did not obscure the exact failing assertion, and all six tests executed.

## Minimal fix

`extractPairs` now skips accepted-variant pair construction only when both raw fields are exactly empty. Nonempty English values, empty Estonian values, count drift, and content drift continue through the existing logic unchanged.

## GREEN

Targeted regression:

```powershell
npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts -t "skips absent variants while keeping missing Estonian variants blocking"
```

Result: exit 0; one test passed and five were skipped.

Focused diagnostic and batch verification:

```powershell
npx vitest run --configLoader runner tests/unit/content/translationDiagnostics.test.ts tests/unit/content/verifyBatch.test.ts
```

Result: exit 0; two files and 32 tests passed.

Focused production-validator translation gates:

```powershell
npx vitest run --configLoader runner tests/unit/content/productionValidator.test.ts -t "translation"
```

Result: exit 0; five tests passed and 46 were skipped.

Static checks:

```powershell
npm run typecheck
npx eslint scripts/content/translationDiagnostics.ts
```

Result: both exited 0.

A read-only diagnostic pass over the existing 500-row machine draft reported 1,393 issues and 1,271 exceptions, down by exactly the 289 synthetic empty-variant findings. `BLANK_TRANSLATION` is absent and the explicit count of accepted-variant blank issues is zero. The remaining blocking counts are unchanged: `ANSWER_DRIFT` 3, `NUMBER_DRIFT` 41, `VARIANT_DRIFT` 155, `SUSPICIOUS_PROPER_NOUN_CHANGE` 1,020, and `UNCHANGED_TRANSLATION` 174.

## Shared-worktree observations

An initial combined gate also included the entire production-validator file and focused ESLint on the pre-existing test file. It found two unrelated existing shared-WIP problems: the report-publication test `keeps nested placement as the default even for report-shaped payloads` fails against unstaged changes in `scripts/content/validate.ts`, and line 213 of `translationDiagnostics.test.ts` has a pre-existing unused `oppositeEnglish` binding. Neither is caused by or changed in this repair. The scoped production ESLint, typecheck, translation validator tests, and verifyBatch tests pass.

No generated CSV, evidence, accepted content, review artifact, approval, waiver, or exception record was edited.
