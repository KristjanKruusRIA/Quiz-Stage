# Task 10 Geography production-content recovery report

Date: 2026-08-20

## Scope and outcome

Task 10 replaced the accepted `02-geography` filler batch with 100 independently authored, reviewed, bilingual Geography category sets containing 500 board clues. The final corpus has exactly 100 OpenTDB-inspired rows and 400 compatible-open rows, 10 subthemes with 10 sets each, and the required allocation: Easy 17/17, Medium 16/17, Hard 17/16 across rounds one/two.

The atomic publisher replaced the accepted authored/generated/evidence/report quartet from the verified work batch. The prescribed post-publication validation and source-check commands then refreshed the accepted report and merged the accepted source cache; those checks did not alter accepted authored, generated, or evidence bytes. The five final accepted paths were committed as `665c0ee1fcbef2d8c84e059f00e553c228b472dc` (`content(geography): replace filler with reviewed production clues`). Final verification is nonblocking, all 188 distinct sources pass, all 500 evidence records contain three distinct approvals, and an independent scan found zero filler, placeholder, or template content. No waivers were used.

## Accepted RED and worklist

The accepted-state validation RED is pinned by `content/work/02-geography/accepted-red-checkpoint.json` (SHA-256 `2d8aa39d7f2d7ad25ba6a6cc0c31b8857d653389a2eed2fd1931a48162f722f9`). The exact accepted validation command exited 1 because `content/evidence/02-geography.jsonl` did not exist. Hash readback proved the command did not change accepted authored/generated content or the source cache; it changed only the specified red report.

The exact worklist command initially failed under npm 11/PowerShell because npm stripped `--batch` and `--output`, leaving positional values. Strict TDD added npm-subprocess coverage and the minimal shared argument restoration in commit `28442864379364f7cf73a3b5f6cf21d3b4654e18` (`fix(content): support npm worklist arguments`). The repaired literal command was:

```powershell
npm run content:build-worklist -- --batch 02-geography --output content/work/02-geography/worklist.jsonl
```

It deterministically produced 3,000 rows, SHA-256 `1e864bad41d5402236333758eaa4bec68b41f9748126964d5442cb4d52afffbb`. The repair's detached verification passed the six CLI-compatibility tests and nine candidate-path tests; its report is `task-10-worklist-cli-repair-report.md`.

## Candidate and source supply

`candidate-supply-audit.json` (SHA-256 `967d2f53b3f097abc411f0a817d057427817ca69ec2abdda902ba915f4a6ba0b`) found 178 unused Geography OpenTDB candidates in the immutable 2,500-row pool: 54 easy, 85 medium, 39 hard; 30 boolean and 148 multiple-choice. None overlapped the 100 History inspirations, and no duplicate-key, core-field, or license defects were found. The pool was sufficient, so no live acquisition was needed. Exactly 100 distinct, directly related candidates were selected, one per set; the other 400 facts were bound to specific compatible-open pages.

## English authoring and review

`Codex Geography Author` authored all 500 rows. `structure-diagnostics.json` (SHA-256 `3167c2be18f23b95b3c8c02d1f527c351867facf108c04883f17b80cce378a9a`) records 100 sets, 500 facts, 100 inspirations, 400 compatible-open facts, exact allocation, and no structural issues or warnings. The ten subthemes are borders, cities, countries-capitals, human-geography, islands, landmarks, maps-coordinates, mountains, physical-geography, and rivers-lakes, with 10 sets each. Each set has a manually authored calibration note and five answer-specific tier rationales.

The initial 28-set increment was deliberately frozen and independently reviewed through seven factual/editorial rounds before expansion. Its final clean artifacts were factual increment R7 `9dae76f54558de8281ce02ddce431114562d1cc0bc7af46f455f0854d45762f8` (140/140 rows, 50/50 sources, 28/28 candidates) and editorial increment R7 `97f45dd66ddb7fb30379320f156b2073239fcd9e0d63331d19dbf180997ff342` (140/140 rows and 28/28 sets).

The complete draft then passed iterative factual/editorial correction. Early full-corpus review artifacts intentionally recorded failures rather than approvals: factual R1 found 123 correction rows and editorial R1 found 57 row and 59 set blockers; later rounds closed source completeness, candidate fit, standalone wording, category leakage, explanation utility, and progression defects. A failed final sample/full audit exposed further source-scope problems, so the prior approvals and translation were marked stale and a new source-scope sequence was completed. Its correction inventory included 53 rows in source-scope R1, then narrower union and calibration rounds through R10.

The final English approvals are:

- Factual/source review: `content/work/02-geography/reviews/factual-source-scope-round-10.json`, SHA-256 `e62ff9925178cd17f6c1ad2df1ba513edbbea452312b46e167e9d5d1f6e81f23`; reviewer `Codex Geography Factual Reviewer`, reviewed `2026-08-20T16:01:25.239Z`, 500/500 approved, 188 distinct sources, 100/100 immutable candidate mappings.
- Editorial review: `content/work/02-geography/reviews/editorial-source-scope-round-10.json`, SHA-256 `3bbefff7ba4cd2868bea23e493c0d6f5ebf8d23f487144c8cc18a001792510fa`; reviewer `Codex Geography Editorial Reviewer`, reviewed `2026-08-20T15:55:11.039Z`, 500/500 rows, 100/100 sets, 217 accepted variants, 500 tier rationales, and 100 calibration notes approved.

The final authored artifact is SHA-256 `cff81c0fdf37df1cbf9841f86042eca845dd4c7227318a9dc8750d4aa6bd3b76`.

## Reader-visible date validation

The English pass proved that the production validator did not recognize reader-visible `Month YYYY`, while metadata dates correctly did not qualify. Three strict-TDD commits repaired only explicit-date recognition:

- `edca17a25b5fb31dd095e05ecb1ad77b567511da` recognized complete Month-Year claims and reduced the pinned Geography `UNDATED_CHANGING_FACT` inventory from 48 to exactly 23.
- `f6dd6c0901a1a289ee50eac45db4925a49c89df9` rejected malformed lexical days and date-fragment suffixes.
- `8cfdba25714683abd2f82dfa858f006b29f056fa` added calendar-aware validation for supported full and ISO dates while preserving valid leap dates.

The genuine residual content rows were then source-bound or rewritten. Final English validation has `UNDATED_CHANGING_FACT=0`. The TDD record is `task-10-validator-date-repair-report.md`; intermediate 48 and 23 counts were expected diagnostic stages, not final passes.

## Estonian translation and semantic review

The pinned Helsinki model command used `Helsinki-NLP/opus-mt-en-et`, batch size 16, CPU-only execution, and an explicit Task 10 checkpoint/cache. It completed in 389.766 seconds and produced raw machine draft SHA-256 `f36d8c2b4a6284e8ffbd1733709ee7cfa7dfde0000769a5b6e1df0b5e63f0ec7`. Raw diagnostics correctly blocked on 24 errors (2 answer, 18 number, 1 qualifier, 3 variant); no issue was waived.

The correction-only translation editor inspected all 500 rows and all 2,500 Estonian fields. Its first full corrected draft was `c890d52a39a43d6ac62d36c7cccd99477c965335e2104c58ee8bd151776b0166`, with zero blocking diagnostics and 1,390 warnings preserved for semantic adjudication. Independent semantic rounds then corrected 143 rows/160 fields/1 variant/14 categories in R1, 10 remaining rows in R2, and one explanation in R3. The resulting R4 approval (`48648aab969006396b8dde52d4b6b73955de2a024081dc89c8737a722d9553aa`) was valid for that snapshot but became stale when the later English source-scope corrections changed 123 rows.

The final delta process compared the stale reviewed translation with the final English artifact. It updated 204 authoritative cells across 123 rows, manually revised all 185 paired Estonian fields, and proved zero Estonian drift where English was unchanged. The fresh machine-status draft was `07e9b2f672d1c04f47d0e2ca3d107c1eaca1c8cb17e596dbb1905c2edb51d781`, with zero diagnostic errors and 1,413 warnings queued for review.

Fresh full semantic review is pinned by `translation-semantic-final-round-1.json`, SHA-256 `9970daa21819943beee96bcf452d186e7d64d9e6d991f5a5681c4d4c1dbdd5b8`. `Codex Estonian Semantic Reviewer` approved all 500 rows, 2,500 fields, 217 decoded variants, 100 categories, and all 1,413 warning adjudications at `2026-08-20T16:30:02.626Z`, with no findings. Approval materialization changed exactly 500 translation statuses and 500 `translationReview` objects with no other field drift. The final reviewed generated artifact is SHA-256 `811e75bc4c07a7a4c0c56e8f507c504d14df6a7824a3ec123a4667be1030d9e7`.

## Final bilingual/source sample

The first final sample was rejected and corrected. The independent R2 sample is `final-bilingual-source-sample-round-2.json`, SHA-256 `8661d210d2dd2cfc37b7daf503d23d72e7754f528982dba647ffcb943c11a73a`. `Codex Geography Bilingual Source Sampler` approved 50/50 clues, including five from every subtheme and at least five from every difficulty/round cell. All 17 bound sample sources fetched successfully, all six pinned `oldid` revisions matched, and all 13 prior R1 failures were resolved. The artifact explicitly authorizes publication.

## Atomic publication and final verification

The final three work inputs were copied into a clean detached worktree at `8cfdba25714683abd2f82dfa858f006b29f056fa`. The following four recovery-plan commands were run literally and each exited 0:

```powershell
npm run content:verify-batch -- --batch 02-geography --work-root content/work --source-cache content/reports/source-check-cache.json
npm run content:publish-batch -- --batch 02-geography --work-root content/work
npm run content:validate -- --input content/generated/02-geography.en-et.csv --evidence content/evidence/02-geography.jsonl --batch 02-geography --mode batch --report content/reports/02-geography.json
npm run content:source-check -- --input content/generated/02-geography.en-et.csv --report content/reports/02-geography.json --source-cache content/reports/source-check-cache.json
```

The work-only verification report/cache were SHA-256 `67f959714547168cfca24c4406b32881603c86d4c452cf8aac3f1d13b85b169d` and `ab5a72d665af22eea3a0f797fff7dc0f381a954e7e9e11c007c7b2409a0f9e80`. The post-publication validation and source-check commands produced the different final accepted report/cache hashes listed below while preserving the report's hash-bound verification fields, nested validation, and retained sample.

The final report is `kind=verification`, `blocking=false`, with 500 clues, 100 sets, exact allocation, zero errors, and 188/188 source responses at HTTP 200. Its retained verification sample covers six cells and 30 clues. All 500 evidence rows carry approvals from the three distinct identities above. The report records 500 expected authored `MISSING_TRANSLATION` exceptions under `--allow-missing-et`. Translation diagnostics contain 1,413 warning findings (`SUSPICIOUS_PROPER_NOUN_CHANGE=1341`, `UNCHANGED_TRANSLATION=72`), all independently adjudicated by the semantic reviewer, plus 1,172 corresponding pending-warning exception/bookkeeping records (`1104` and `68`). These records are not waivers; no waiver was used.

Final accepted SHA-256 values:

- `content/authored/02-geography.csv`: `cff81c0fdf37df1cbf9841f86042eca845dd4c7227318a9dc8750d4aa6bd3b76`
- `content/generated/02-geography.en-et.csv`: `811e75bc4c07a7a4c0c56e8f507c504d14df6a7824a3ec123a4667be1030d9e7`
- `content/evidence/02-geography.jsonl`: `77958cddea1c5ac229a032332cc7c3626c6d8dd03e7b43750f3b58ee9faf4f8c`
- `content/reports/02-geography.json`: `2718b67efcbe457bf258898be8820b870532306e25ef2b36ad513cf066438497`
- `content/reports/source-check-cache.json`: `494797cbda82e1e6a23b03e9705c6fe878757f13f0386cf2958b005e75ea4611`

Commit `665c0ee1fcbef2d8c84e059f00e553c228b472dc` has parent `8cfdba25714683abd2f82dfa858f006b29f056fa` and contains exactly those five accepted paths. The primary checkout's `codex/finish-quiz-stage` branch was fast-forwarded only after target-path and index revalidation; the detached worktree was unregistered and removed. Independent post-publication factual/publication and specification/quality reviews were both clean with no findings and authorized this closure.

## Concerns and closure

The clean publication worktree used `npm ci --ignore-scripts`, which exited 0 without changing the lockfile. npm reported 27 inherited audit findings (3 low, 23 high, 1 critical); they predate and are outside the Task 10 content scope. No Task 10 content, verification, source, review, publication, or commit blocker remains.
