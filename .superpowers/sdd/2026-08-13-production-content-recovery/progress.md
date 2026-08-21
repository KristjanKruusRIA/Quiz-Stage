# SDD ledger — plan: docs/superpowers/plans/2026-08-13-production-content-recovery.md

Workspace: E:/git/jeopardy on branch codex/finish-quiz-stage.
Isolation ruling: continue in the existing feature branch checkout because the required Tasks 36 and 39–43 work is uncommitted in this checkout; creating a new linked worktree from HEAD would omit that authoritative WIP.
Plan checkpoint: 6600642 docs(content): plan no-filler production recovery.
Pre-flight review: no unresolved contradiction changes the approved design. The evidence contract was corrected before dispatch to record author and authoring time so separate reviews are provable. The strict production-seed regression may remain red until the corpus replacement completes; the goal explicitly permits temporary rough edges while moving toward the full verified state.
Baseline: `npm run test:run` — 540/541 passed; pre-existing timeout in `tests/integration/packaging/packageContents.test.ts:75` after 30 seconds. No content/selector unit failure at baseline.
Task 1: fix round 1/5 (3 addressed, 0 open — restored blocking assertion; proved reviewed IDs cannot waive filler; removed orphan helper; commits c13e81c..56dc839)
Task 1: complete (commits 6600642..56dc839, review clean)
Task 2: fix round 1/5 (3 addressed, 1 open — exported review type; hardened descriptor read; expanded branch coverage; total-order test oracle remained; commits bca11a4..e0ebda4)
Task 2: fix round 2/5 (1 addressed, 0 open — replaced locale-sensitive oracle with literal order; commits e0ebda4..17c7e59)
Task 2: complete (commits 70968ed..17c7e59, review clean)
Task 3: fix round 1/5 (2 addressed, 0 open — deep-froze catalog; covered all 13 accepted paths; commits 57cb161..dfc1a55)
Task 3: complete (commits 17c7e59..dfc1a55, review clean)
Task 4: pre-dispatch plan conflict — the nine-token `This painter...` / `Which painter...` example has 5 shingles each, 4 shared, 6 in the union, so five-word-shingle Jaccard is 0.667 rather than the mandated >=0.80. Awaiting human ruling on whether the approved algorithm/threshold or the short example governs.
Task 4: human ruling — preserve the approved five-word-shingle Jaccard algorithm and >=0.80 threshold; lengthen the example to 14 tokens so one leading-word difference yields 9 shared / 11 union = 0.818.
Task 4: minor (deferred): `BOARD_FINAL_FACT_REUSE` is emitted only for the first occurrence of the second content kind; final review should decide whether every later cross-kind repeat needs both codes.
Task 4: minor (deferred): board/Final reuse fixture combines two packs in one CSV and therefore also produces an unrelated multi-pack validation error; final review should decide whether to split the fixture across two inputs.
Task 4: cross-task check for Task 8 — `buildProductionSeed` still calls release validation without evidence and is expected to remain blocked until the evidence-aware seed integration task.
Task 4: fix round 1/5 (3 addressed, 0 open — schema-validated evidence maps; prevented alias composition spoofing; corrected Unicode number/symbol normalization; commits d9b063e..31ca4e5)
Task 4: complete (commits 264aa86..31ca4e5, review clean; 2 deferred minors)
Task 5: human ruling — restrict automated `ANSWER_DRIFT` to conflicting canonical numbers or stable identifiers; natural-language translation equivalence is proved by proper-name diagnostics plus mandatory fluent semantic review.
Task 5: human ruling — allow only the four compass locatives `põhjas`, `lõunas`, `idas`, and `läänes` alongside the fixed Estonian base tokens.
Task 5: fix round 1/5 (5 addressed, 1 open — stable-ID scope, batch review states, narrowed answer drift, fixed qualifier vocabulary/field coverage, and clue-ID ordering were implemented; equal-number translated prose was still misclassified as an identifier; commits 93444aa..81b0f13)
Task 5: fix round 2/5 (1 addressed, 0 open — identifier-token extraction now permits equal-number translated prose while retaining conflicting-number and unequal-ID blocking; commit cbf002b)
Task 5: complete (commits 31ca4e5..cbf002b, review clean; focused gate 67/67)
Task 6: fix round 1/5 opened (2 Important — anchor trusted roots to the repository rather than caller CWD; revalidate paths immediately before post-network filesystem mutations; source answers in `rawFact` clarified as immutable candidate material rather than authored output)
Task 6: fix round 1/5 (2 addressed, 1 open — candidate/work roots and post-await cache/checkpoint/output writes are anchored and revalidated; legal-notice writes remain CWD-relative and unguarded; commits a162cf2..258e14c)
Task 6: fix round 2/5 (1 addressed, 0 open — both legal-notice writers are repository-anchored and revalidated at the write boundary; commits 9771ed3..9354074)
Task 6: complete (commits cbf002b..9354074, review clean; focused gate 25/25, typecheck and ESLint clean)
Task 7: review opened 7 Important findings: incomplete passing-report semantics, report double-read race, rollback backup loss, deletion of unowned temp/backup paths, unsafe report symlink writes, stale passing report after fatal verification, and authored-review false blocking.
Task 7: plan conflict — a missing/unreadable artifact cannot satisfy the mandated full report shape (three hashes plus both validation results), yet an old passing report must be invalidated safely. Awaiting human ruling between a discriminated minimal blocking preflight-failure report (recommended) and removing the stale report then throwing.
Task 7: human ruling — use a strict discriminated, atomically written, non-publishable `preflight-failure` report so no failed verification attempt can leave an older passing report publishable.
Task 7: fix round 1/5 (6 addressed, 1 open — passing-report semantics, exact report bytes, rollback/ownership, preflight invalidation, and authored reviews fixed; report containment still needs revalidation after async source checks; commits 3a4e54b..c15d1e6)
Task 7: fix round 2/5 (1 addressed, 0 open — report containment is revalidated at staging and rename after async source checks; commits bf2b9c0..33344f5)
Task 7: review adjudication — the residual same-privilege OS race between adjacent synchronous path validation/mutation syscalls is outside the approved portable Node contract; no native handle-relative API was requested, and the async junction-swap gap is closed.
Task 7: complete (commits 9354074..33344f5, review clean; detached focused gate 75/75 and ESLint clean)
Task 8: review opened 1 Critical and 1 Important finding — committed seed reports were nested under `validation` and depended on excluded heuristic WIP; verify mutated the real report before source/SQLite citation gates.
Task 8: contract ruling — retain nested validation publication by default and add an explicit typed top-level release-report publication mode for seed build/verify; no shape-sniffing heuristic. Publish verification output only after all validation, source, hash, inventory, and v2 citation gates pass.
Task 8: fix round 1/5 (2 addressed, 0 open — explicit report placement removes dirty-WIP dependency; verification publishes only after all source/seed/v2 gates; commits d888194..b545b05)
Task 8: complete (commits 33344f5..b545b05, review clean; infrastructure 218/218, detached changed-file gates 56 unit + 11 integration with 2 intentional filler skips)
Task 9: complete (commits c065a68..dfb623c, independent specification and quality/factual reviews clean; 500 clues/100 sets, exact E 17/17 M 17/16 H 16/17, 500/500 factual/editorial/translation approvals, 110/110 sources, zero filler/placeholder/template content, no waivers)
Task 6 live-fetch repair: review opened 1 High finding — an OpenTDB target smaller than the 50-row server page persisted an advanced token and skipped unpublished remainder rows on resume.
Task 6 live-fetch repair: fix round 1/5 (1 addressed, 0 open — finite requests now use the exact remaining amount, target/resume loses no rows; commit c065a68)
Task 6 live-fetch repair: complete (commits b545b05..c065a68, review clean; focused gate 33/33, typecheck and ESLint clean, bounded live smokes passed)
Task 9 translation-runtime repair: fix round 1/5 (1 addressed, 0 open — malformed accepted-variant serialization now has a real production-path regression; commit d0455b7)
Task 9 translation-runtime repair: complete (commits c065a68..d0455b7, review clean; Python 2/2 and translation diagnostics 5/5)
Task 9 empty-variants diagnostic repair: complete (commits d0455b7..71e619f, review clean; focused translation/verification gates passed and 289 synthetic blank issues removed)
Task 9 cross-language diagnostic repair: fix round 1/5 (2 Important addressed, 1 new Important open — strict one-sided URL/Q/P checks and acronym warning visibility added; URL case still normalized; commit 9b8beea)
Task 9 cross-language diagnostic repair: fix round 2/5 (1 addressed, 0 open — exact URL path/query case retained while Q/P IDs remain case-insensitive; commit b090430)
Task 9 cross-language diagnostic repair: complete (commits 71e619f..b090430, review clean; detached focused gate 98/98, corrected 500-row corpus has zero blockers)
Task 9 validator numeric repair: minor (deferred): productionValidator regression covers word-initial and dotted-era boundaries but not the explicit numeric boundary or a no-space supported-unit form.
Task 9 validator numeric repair: complete (commits b090430..521675b, review clean; exact validator 52/52 and diagnostics 7/7, approved corpus NUMBER_DRIFT 10→0)
Task 9 Node24 source-check repair: complete (commits 521675b..d2f4db2, review clean; source tests 5/5, verifyBatch 26/26, live History source gate 110/110 and batch blocking=false)
Task 10: complete (commits 2844286..665c0ee, independent factual/publication and specification/quality reviews clean; accepted authored cff81c0f, generated 811e75bc, evidence 77958cdd, report 2718b67e, source cache 494797cb; 500 clues/100 sets, exact E 17/17 M 16/17 H 17/16, 188/188 sources, zero filler/placeholder/template content, no waivers)
Task 11: complete (commit 7c6ecfd, final factual/editorial/Estonian/sample reviews clean and publication-authorized; accepted authored 02e82d23, generated 9caa3a04, evidence 3ead329b, report 20f34c7c, source cache 4e023fcc; 500 clues/100 sets, exact E 17/17 M 17/16 H 16/17, 113/113 sources, zero filler/collisions, no waivers)
Task 12: complete (commits 8e990fa, 3cc6ba6; final factual/editorial/Estonian/sample reviews and postpublication chronology audits clean; accepted authored 0b7178eb, generated 7fe39037, evidence 320bf1e3, report acbe6577, source cache 16e26160; 500 clues/100 sets, exact E 17/17 M 16/17 H 17/16, 117/117 sources, zero filler/collisions, no waivers)
