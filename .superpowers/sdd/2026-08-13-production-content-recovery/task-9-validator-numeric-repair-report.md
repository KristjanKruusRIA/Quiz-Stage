# Task 9 production-validator numeric repair

Date: 2026-08-14
Implementer role: Codex Task 9 History author/coordinator
Parent revision: `b09043082c5b3fbc877b3a1af75007f0cfc52b99`
Candidate staged code tree: `beb7993e9aa67f71c86173fff95b20e640303db3`

## Scope and root cause

The production validator's numeric matcher allowed an optional unit suffix without a complete-token boundary. It therefore consumed `M` from `8 May`, `l` from `Apollo 11 lunar module`, `M` from `20 March`, and `m` from `79 m.a.j.` as units. This diverged from the reviewed boundary already present in `translationDiagnostics.ts` and produced ten false `NUMBER_DRIFT` errors in the approved History corpus.

The production change is one regex boundary: `(?![\p{L}\p{N}]|\.\p{L})` after the optional unit. No shared refactor, content exception, or diagnostic waiver was added. The unrelated dirty report-placement heuristic in `scripts/content/validate.ts` was not staged.

## Strict TDD evidence

RED command:

```text
npx vitest run tests/unit/content/productionValidator.test.ts -t "treats numeric units as complete tokens across localized dates and era notation"
```

RED result: exit 1, 1 failed / 51 skipped. The hand-derived expectation was real drifts at CSV rows `[9, 10]`; current logic returned `[2, 3, 4, 5, 9, 10]`. Rows 2-5 were May, lunar, March, and `m.a.j.` false positives. The `e.m.a.`, reordered-date, and localized decimal/thousands cases were already clean.

GREEN command: same focused command after the one-line production change.

GREEN result: exit 0, 1 passed / 51 skipped.

The regression matrix covers:

- `8 May` / `8. mail`
- `Apollo 11 lunar module` / `Apollo 11 kuumoodul`
- `20 March` / `20. märtsil`
- `m.a.j.` and `e.m.a.` era forms
- reordered `November 11, 1918` / `11. novembril 1918`
- localized `1,234.5` / `1 234,5`
- retained real unit drift `8 m` / `8 l`
- retained real number drift `11` / `12`

## Focused and parity verification

Main shared worktree:

- Focused new regression: 1/1 passed.
- TranslationDiagnostics parity test `does not parse the initial of a following word as a numeric unit`: 1/1 passed.
- Full production-validator file: 51/52; sole failure was `keeps nested placement as the default even for report-shaped payloads`, caused by the explicitly excluded dirty report-placement hunk.
- `npm run typecheck`: exit 0.
- `npx eslint scripts/content/validate.ts tests/unit/content/productionValidator.test.ts`: exit 0.

Clean candidate staged code tree (`cfb12ac943310d16219605c84fb9c3d50272a52e`, tree `beb7993e9aa67f71c86173fff95b20e640303db3`):

- `npx vitest run tests/unit/content/productionValidator.test.ts`: 52/52 passed.
- `npx vitest run tests/unit/content/translationDiagnostics.test.ts`: 7/7 passed.
- Focused ESLint on production and test files: exit 0.
- `npm run typecheck`: four inherited errors in `mapWikidataCandidates.ts` and `translationDiagnostics.test.ts`.

Clean parent revision:

- Production-validator file: 51/51 passed.
- Typecheck produced the exact same four errors as the candidate:
  - `mapWikidataCandidates.ts:99:46` TS2345
  - `mapWikidataCandidates.ts:114:7` TS2322
  - `translationDiagnostics.test.ts:460:9` TS1117
  - `translationDiagnostics.test.ts:494:65` TS2339

Thus the candidate introduces no typecheck regression. Both clean test runs emit the inherited Vite warning about CommonJS `vitest.config.ts`; it does not affect exit status.

## Approved-corpus evidence

Required pins were rechecked immediately before validation:

- `generated.en-et.csv`: `db36eb0d32df98d12b16c42064ad34c7083925e5c36bd2f1e7930274307a2aba`
- `evidence.jsonl`: `07c3b3f158bceaf44aad41d896840cf4480dc53e7f5843782cdf6a887fbfacbf`

Command:

```text
npx tsx scripts/content/validate.ts --input content/work/01-history/generated.en-et.csv --evidence content/work/01-history/evidence.jsonl --batch 01-history --mode batch --report content/work/01-history/generated-validation.semantic-approved.numeric-repair.json
```

Result: exit 0, blocking false, 500 board clues, 100 category sets, exact E/M/H counts unchanged, and `NUMBER_DRIFT` reduced from 10 to 0. Remaining warnings were 255 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 134 `UNCHANGED_TRANSLATION`; no exceptions were added. Report SHA-256: `038bf7a1d30be72a20c72a4f34ab5cf24e725c4f57e9313bcaf60af0f62c8b9e`.

`verifyBatch` was rerun. Authored validation, generated validation, translation diagnostics, evidence, and samples were non-blocking; generated `NUMBER_DRIFT` was zero. The overall report remained blocking solely because all 110 external source requests returned `SOURCE_REQUEST_FAILED`, which is out of scope for this numeric repair. Report SHA-256: `81147818b0f9293879f12a388094f7cb1c8119644b52408eafebd2b1913df693`.

## Staged scope

- Numeric-boundary hunk only in `scripts/content/validate.ts`
- Regression test only in `tests/unit/content/productionValidator.test.ts`
- This report

No content, evidence, translation status, approval, accepted artifact, report-placement heuristic, or unrelated test hunk is included.
