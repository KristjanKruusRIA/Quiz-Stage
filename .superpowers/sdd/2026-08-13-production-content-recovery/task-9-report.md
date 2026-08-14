# Task 9 report: reviewed History production batch

## Scope and outcome

- Replaced the accepted `built-in-history` filler batch with 500 reviewed bilingual board clues in exactly 100 coherent five-clue sets.
- Final allocation is Easy `17/17`, Medium `17/16`, Hard `16/17` for Round One/Double Round.
- Final origin composition is exactly 100 independently sourced OpenTDB-inspired rows and 400 compatible-open rows, with 500 unique clue IDs and 500 unique fact keys.
- All 500 rows have separate factual, editorial, and Estonian semantic approvals. The final source gate is 110/110.
- The accepted corpus contains zero filler, placeholder, numbered-shell, or parameter-substitution template content. No validation, translation, source, or editorial waivers were used.
- Accepted content was changed only by the atomic publisher and committed as `dfb623c51b97f6a2839dcdeca67812bab65b5bb5` (`content(history): replace filler with reviewed production clues`).

## Accepted RED

The accepted History batch was validated without overwriting its authoritative accepted report; output went to `content/work/01-history/accepted-red-report.json`. That immutable RED artifact has SHA-256 `c15b09fada7d46df01394fa6c9568d3a1c449bbf211aeb0222fdb44d59a4c4c4`, `blocking=true`, 500 rows, 100 sets, and 63,250 errors: 62,250 `NEAR_DUPLICATE_CLUE`, 500 `NUMBER_DRIFT`, and 500 `PLACEHOLDER_CONTENT`. It contained zero exceptions. This proved that the old count-complete batch was not production content before any accepted file was changed.

Pre-publication accepted baselines were:

| Artifact | SHA-256 |
| --- | --- |
| `content/authored/01-history.csv` | `8799a490e7b560ff8111675f7049b56dc07e03114b1473228525a1c7987bee80` |
| `content/generated/01-history.en-et.csv` | `43d849cf85507e10d0bb08665ad0b406d049d4a92cf769bd13bbf4764abe1c8e` |
| `content/evidence/01-history.jsonl` | absent |
| `content/reports/01-history.json` | `9f0eb1a624622c5fcee3e20dbe4c4f0b068242796a52d8ffac48b29c56739b38` |
| `content/reports/source-check-cache.json` | absent |

## Candidate acquisition and worklist

Initial guarded live acquisition exposed infrastructure defects and stopped authoring. The pre-repair OpenTDB command failed with `OpenTDB response was not valid JSON` because the whole live JSON envelope was incorrectly base64-decoded. The Wikidata command aborted at 30 seconds after appending 500 partial rows under the old non-atomic behavior. Accepted content was untouched.

The live-fetch repair chain was `5d0b47c` (`fix(content): align candidate fetchers with live APIs`), `1f07cd1` (`fix(content): clean OpenTDB response contract`), and `c065a68` (`fix(content): preserve OpenTDB resume candidates`). Independent review found and then closed the finite-target resume-loss defect. The final focused gate passed 33/33 with typecheck and ESLint clean; bounded live smokes passed. Full evidence is in `task-6-live-fetch-repair-report.md`.

Successful bounded acquisition commands were:

```powershell
npx tsx scripts/content/fetchOpenTdb.ts --output content/imports/opentdb-candidates.jsonl --checkpoint content/imports/opentdb-checkpoint.json --target 2500 --delay-ms 5000 --max-attempts 5
npx tsx scripts/content/fetchWikidata.ts --output content/imports/wikidata-candidates.jsonl --cache content/imports/wikidata-cache.json --recipes historical-events --target 1000 --page-size 100 --delay-ms 1000 --max-attempts 5
npx tsx scripts/content/fetchWikidata.ts --output content/imports/wikidata-candidates.jsonl --cache content/imports/wikidata-cache.json --recipes historical-events --target 500 --page-size 500 --delay-ms 1000 --max-attempts 5
```

The OpenTDB run exited 0 with 2,500 candidates, one skipped row, and no token exhaustion. The 100-row Wikidata probe exited 0, then the final atomic run exited 0 with 500 candidates and zero skipped rows. OpenTDB candidate metadata records `CC-BY-SA-4.0`; Wikidata records `CC0-1.0`.

| Candidate/work artifact | Count | SHA-256 | Retrieval |
| --- | ---: | --- | --- |
| `content/imports/opentdb-candidates.jsonl` | 2,500 | `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c` | `2026-08-13T18:33:52.973Z` |
| `content/imports/opentdb-checkpoint.json` | n/a | `b332ece99c641b945821edbe01729d367a4aed2983cc2c0d93c17207206cd6aa` | `2026-08-13T18:33:52.973Z` |
| `content/imports/wikidata-candidates.jsonl` | 500 | `96c3a9af4ec9ec837593c41dc35f9ed4f591a22176dbe81d12a7660723beeb37` | `2026-08-13T18:39:57.909Z` |
| `content/imports/wikidata-cache.json` | 500 cached candidates | `aced26b82d768c683697dcc77df10e8bd092613846fa3a5f4f13027893bcb5ae` | `2026-08-13T18:39:57.909Z` |
| `content/work/01-history/worklist.jsonl` | 3,000 | `1e15bed2e3ba9910ed6991b9d1399eb957e22bc26e96799cc35e08ba5360a681` | derived from the pinned imports |
| `content/work/01-history/opentdb-history-candidates.tsv` | 196 | `d141f517ddc31a6c4453819584a65adf96d914ae51055edf9991c06d8c1b4a07` | curated History subset |

Of the 500 Wikidata rows, 152 raw entity labels were not usable as authored facts. They were not padded or templated. The final 400-row compatible-open quota uses only genuinely supported mapped rows and specific compatible-open pages, with origins recorded accurately. Each of the 100 OpenTDB inspirations has a distinct candidate ID and a directly related proposition independently verified by the row's specific supporting source; the OpenTDB home page is never used as factual evidence.

## English authorship and independent review

Authoring remained under `content/work/01-history`. The final English authored CSV is SHA-256 `5d6577db30d7d4e678f0b368a1a7940acefc4e3d0c17703eb234890812094449`. The author identity is `Codex Task 9 English Author`, authored at `2026-08-13T21:02:00.000Z`.

Every rejection was preserved and corrected in a new round. The detailed row findings, proposed corrections, calibration notes, and ledgers are in `content/work/01-history/reviews/{factual,editorial}-round-1..11.json` and `content/work/01-history/correction-ledger-round-1..10.json`.

| Round | Factual result | Editorial result |
| ---: | --- | --- |
| 1 | 61 rows required correction; OpenTDB mapping 73/100 | 73 clue revisions and all 100 sets required calibration work |
| 2 | 22 rows required correction; mapping 99/100 | 19 rows required correction |
| 3 | 8 rows required correction; mapping 100/100 | 5 rows required correction |
| 4 | 5 rows required correction | 2 row findings across 16 rejected sets |
| 5 | 2 rows required correction; mapping 98/100 | 2 row findings across 3 sets |
| 6 | 1 row required correction; mapping 99/100 | 7 row findings across 5 sets |
| 7 | 3 rows required correction; mapping 98/100 | 15 category findings across 15 sets |
| 8 | approved 500/500; mapping 100/100 | 28 findings across 23 sets |
| 9 | approved 500/500 | 9 findings across 9 sets |
| 10 | approved 500/500 | 11 findings across 10 sets |
| 11 | approved 500/500, 110 pages, 100 mappings, 500 unique fact keys | approved 500 clues, 500 explanations, 100 sets, 500 tier rationales, and 100 difficulty/round/subtheme judgments |

Final approval pins:

- Factual R11: SHA-256 `d4d582e5d68ddb72b54d35a4629e8e42d2fac9bb1dfff34d2eedfc2d56ec9e8b`; reviewer `Codex History Factual Reviewer`; reviewed at `2026-08-13T22:33:46.214Z`; verdict `approved`.
- Editorial R11: SHA-256 `b7e76510cc75e73cb41d518b5d97b353bb74952997b9c29833122be436a0c795`; reviewer `Codex History Editorial Reviewer`; reviewed at `2026-08-13T22:34:22.579Z`; verdict `approved`.

The final distribution uses ten subthemes, with no subtheme above 15 sets: ancient 12, archaeological 1, cultural 12, early-modern 12, economic 3, medieval 11, military 14, modern 15, political 12, and social 8. Set-level manual notes name the actual five answers, explain the knowledge progression, and justify difficulty and round assignment; the authoring tooling validates/serializes those notes rather than composing template rationales.

## Estonian translation and semantic review

The machine draft used the pinned CPU model and command below. It exited 0 in 384.302 seconds with 500 rows and SHA-256 `107919d67b7d06ed1d5ede2dd8337f37b83cac0b14b651c50ef251eccbd89359`.

```powershell
content/work/01-history/.venv-translate/Scripts/python.exe scripts/content/translate_en_et.py --input content/work/01-history/authored.csv --output content/work/01-history/generated.en-et.csv --model Helsinki-NLP/opus-mt-en-et --checkpoint content/work/01-history/translation-machine.checkpoint.json --batch-size 16 --cache-dir content/work/01-history/.cache/translation
```

Infrastructure issues proven during translation were repaired under strict TDD and independently re-reviewed:

- `d23161b` and `d0455b7`: correct empty/malformed accepted-variant output serialization; Python 2/2 and translation diagnostics 5/5.
- `71e619f`: do not manufacture blank issues for legitimately empty variant lists; 289 synthetic blank findings removed.
- `bf28597`, `9b8beea`, and `b090430`: complete-token numeric handling, cross-language variants, stable identifiers, acronym warning visibility, and exact URL case; detached focused gate 98/98 and the corrected corpus had zero blockers.
- `521675b`: production validator complete-token numeric units; validator 52/52 and diagnostics 7/7; ten false `NUMBER_DRIFT` errors became zero.
- `d2f4db2`: Node 24 DNS `all:true` lookup callback support; source tests 5/5, verify-batch 26/26, and live History source gate 110/110.
- `cdf0bc9` and `ee8b523`: npm 11/PowerShell argument reconstruction, safe `--source-cache`, atomic report/cache publication, and symlink/junction hardening; final detached gate 90/90 plus source/evidence 19/19. The initial review findings on cache ancestor swaps and report authorization atomicity were closed.

The translation editor inspected all 500 rows and all five Estonian fields, preserved all non-Estonian cells, and recorded every remaining warning in `translation-editor-audit.json`. Status stayed `machine` and translation approvals stayed null until independent semantic approval.

Semantic review evidence:

| Round | Coverage | Verdict and action |
| ---: | --- | --- |
| 1 | 500 rows, 2,500 fields, 261 variants, 100 sets, 1,267 warnings | `changes_required`; 131 rows/135 fields/5 variants/1 category plus two warning-required response corrections were mapped and corrected |
| 2 | same corpus dimensions, 1,268 warnings | three findings; exactly three Estonian cells corrected |
| 3 | 500 rows, 2,500 fields, 261 variants, 100 sets, 1,268 warnings | `approved`; zero remaining corrections/failures |

Final semantic R3 artifact SHA-256 is `06bab510799f38e03ef2918ea651d787f12563bd7546ca076206bcbfec5fbf1a`. Reviewer `Codex Estonian Semantic Reviewer` approved at `2026-08-14T01:12:53.337448Z`. Approval materialization changed exactly 500 `translation_status` values from `machine` to `reviewed` and 500 null `translationReview` fields to that recorded decision, without changing any text or other evidence field.

The remaining automated diagnostics are warnings only: 1,111 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 157 `UNCHANGED_TRANSLATION`. All 1,268 were independently adjudicated in R3. The accepted/generated validation also reports 255 proper-noun and 134 unchanged-translation warnings; authored validation has 500 intentional `MISSING_TRANSLATION` warnings because the authored artifact is English-only. There are zero unresolved errors and no waivers.

## Manual bilingual/source sample

`content/work/01-history/reviews/final-bilingual-source-sample.json` has SHA-256 `d7159614bb33632973f3a498e625dc533876c9aa5fc92e0ed5e9aac838621318`. `Codex History Bilingual Source Sampler` reviewed it at `2026-08-14T02:01:12.908Z` and recorded reviewer representation accurately as an AI bilingual sampler, not a native/human reviewer.

The sample passed 50/50 unique clues, covers all ten subthemes with at least five samples each, covers all six difficulty/round cells with at least five samples each, and checked 41 distinct source pages. Fetch failures: 0. Corrections required: 0.

## Atomic publication and final verification

Publication ran in a clean detached worktree at exact infrastructure revision `ee8b523e1e88ace4815c9df504924f3e3b4cc96c`. Only the three pinned approved work artifacts were copied into that worktree. All four required commands were run literally and exited `0`:

```powershell
npm run content:verify-batch -- --batch 01-history --work-root content/work --source-cache content/reports/source-check-cache.json
npm run content:publish-batch -- --batch 01-history --work-root content/work
npm run content:validate -- --input content/generated/01-history.en-et.csv --evidence content/evidence/01-history.jsonl --batch 01-history --mode batch --report content/reports/01-history.json
npm run content:source-check -- --input content/generated/01-history.en-et.csv --report content/reports/01-history.json --source-cache content/reports/source-check-cache.json
```

The final report is `kind=verification`, `blocking=false`, retains its hash-bound verification fields and nested accepted validation, and records 500 clues, 100 sets, exact allocation, zero errors, and zero filler/template/placeholder issues. The source cache is a regular non-link JSON file with 110 entries; all 110 distinct HTTPS sources returned HTTP 200 with requested URL equal to final URL. Post-publication checks did not alter the accepted authored, generated, or evidence bytes.

| Final accepted artifact | SHA-256 |
| --- | --- |
| `content/authored/01-history.csv` | `5d6577db30d7d4e678f0b368a1a7940acefc4e3d0c17703eb234890812094449` |
| `content/generated/01-history.en-et.csv` | `db36eb0d32df98d12b16c42064ad34c7083925e5c36bd2f1e7930274307a2aba` |
| `content/evidence/01-history.jsonl` | `07c3b3f158bceaf44aad41d896840cf4480dc53e7f5843782cdf6a887fbfacbf` |
| `content/reports/01-history.json` | `3ae29d0eca6526a23f3abf7afec9fee6d2e67462f93ac5ff99e8a01a27d776b6` |
| `content/reports/source-check-cache.json` | `9ec072ba6f50fb402e0a66a882e02491bbfc7f13a99d696ba01c7243d341de05` |

The evidence file contains 500 factual approvals, 500 editorial approvals, and 500 translation approvals. The three reviewer identities are pairwise distinct and all review timestamps are later than authoring.

Only the five accepted paths above were staged in the publication worktree. Commit `dfb623c51b97f6a2839dcdeca67812bab65b5bb5` was fast-forwarded onto `codex/finish-quiz-stage`; the temporary worktree was removed. Independent final specification review and independent final quality/factual review both returned approved verdicts with no findings.

## Environment caveats and closure

- Native `npm ci` in the clean publication worktree could not compile inherited `better-sqlite3` under Node 24 because ClangCL was unavailable. `npm ci --ignore-scripts` installed the exact locked dependencies; the four content-only publication commands do not require the native addon and all exited 0. The inherited audit inventory was 27 vulnerabilities (3 low, 23 high, 1 critical); it was not introduced or changed by Task 9.
- Exact clean repair snapshots and their parents had the same four inherited typecheck errors in `mapWikidataCandidates.ts` and `translationDiagnostics.test.ts`. The dirty shared worktree's unrelated WIP fixes those errors. Task 9 repair files introduced no typecheck regression; this report does not claim a green exact whole-repository typecheck where one did not exist.
- The validator numeric review retained one deferred minor about additional explicit unit-boundary test coverage. It did not affect the reviewed History corpus or any final gate.

Task 9 is complete. The final History definition of production has no filler: 500/500 source-supported clues, 500/500 independent factual/editorial/semantic approvals, 110/110 checked sources, zero blocking issues, zero placeholder/template content, and no waivers.
