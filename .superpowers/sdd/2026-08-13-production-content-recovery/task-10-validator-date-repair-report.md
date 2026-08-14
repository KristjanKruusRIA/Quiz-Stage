# Task 10 validator Month-Year repair

Date: 2026-08-14

## Scope and evidence pins

- Starting revision: `28442864379364f7cf73a3b5f6cf21d3b4654e18`.
- Diagnosis: `content/work/02-geography/reviews/undated-validator-diagnosis.json`, SHA-256 `61099c8a1c852a6743d20f9f863d7ae851b68d874758a7d7245dc4e3cfe06908`.
- Triage: `content/work/02-geography/reviews/undated-changing-fact-triage.json`, SHA-256 `ab3b84035d5ab08ce1a416da0e28923107be394f6b3e2c7247b5f3b8cf421de7`.
- Corpus input: `authored.csv` SHA-256 `ef12cfe9a371ce5e794baeaa558f7ff8636c24136b5dd53f8a294a3187f06319`; `evidence.jsonl` SHA-256 `01ef1f11f8dea2fd9cef0bbc9d464e72dfd77e4553ef1d5e3309ece3fef96f62`.

The defect was limited to `EXPLICIT_DATE`: it recognized a bare year, ISO date, or `Month D, YYYY`, but not reader-visible `Month YYYY`. `CHANGING_FACT` and provenance handling were intentionally unchanged.

## RED

Command:

```text
npx vitest run tests/unit/content/productionValidator.test.ts -t "reader-visible dates|reader-visible month-year" --reporter=dot
```

Result: exit 1; 1 failed, 1 passed, 52 skipped. The real `validateProductionContent` path emitted `UNDATED_CHANGING_FACT` for both CSV row 2 (`As of August 2026`) and row 3 (`In July 2026`). The characterization test already passed for undated changing claims despite `source_retrieved_at` or an `oldid` URL, and for the existing `As of 2026` and `On August 14, 2026` formats.

## Minimal fix and GREEN

Only the `EXPLICIT_DATE` grammar was changed. It now accepts a complete English month followed by either `YYYY` or `D, YYYY`; bare years and ISO dates remain accepted.

```text
npx vitest run tests/unit/content/productionValidator.test.ts -t "reader-visible dates|reader-visible month-year" --reporter=dot
```

Exit 0: 2 passed, 52 skipped.

```text
npx vitest run tests/unit/content/productionValidator.test.ts --reporter=dot
```

The date tests passed. The file result was 53 passed and 1 unrelated pre-existing failure in `keeps nested placement as the default even for report-shaped payloads`, caused by the unstaged dirty report-placement heuristic in `validate.ts`. That unrelated hunk was neither changed nor staged by this repair.

```text
npm run typecheck
npx eslint scripts/content/validate.ts tests/unit/content/productionValidator.test.ts
```

Both exited 0.

An isolated detached snapshot of the repair commit (with only a `node_modules` junction) ran the complete production-validator file at 54/54 passing and focused ESLint at exit 0. Exact-revision `npm run typecheck` remains blocked by four inherited errors outside this repair: two nullable-value errors in `scripts/content/mapWikidataCandidates.ts` and two pre-existing errors in `tests/unit/content/translationDiagnostics.test.ts`. The dirty main worktree contains unrelated fixes for those files and therefore typechecks at exit 0; neither version was staged here.

## Corpus replay

Command:

```text
npm run content:validate -- --input content/work/02-geography/authored.csv --evidence content/work/02-geography/evidence.jsonl --batch 02-geography --mode batch --allow-missing-et --report content/work/02-geography/english-approved-validation.json
```

The command exited 1 as expected because the corpus still contains genuine content blockers. The exact `UNDATED_CHANGING_FACT` count fell from 48 to 23, matching the diagnosis; it did not fall to zero. Remaining CSV rows are `24,51,161,183,190,219,236,251,266,273,274,300,305,381,386,402,413,433,434,438,440,456,493`. The report contains 500 board clues, 100 category sets, 500 expected `MISSING_TRANSLATION` issues recorded as 500 exceptions, no other issue code, and `blocking=true` due solely to those 23 changing-fact rows. Replay report SHA-256: `fe978c084f6778d32340517c42db605c52f1a16c515c1910b4ee5de86e29661a`.

No content, evidence, approval, translation, or accepted artifact was edited by this repair.
