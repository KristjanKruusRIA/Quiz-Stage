# Task 11 Science and Nature production-content recovery report

Date: 2026-08-21

## Scope and outcome

Task 11 replaced the accepted `03-science-nature` filler batch with 100 independently authored, reviewed, bilingual Science and Nature category sets containing 500 board clues. The final corpus has exactly 100 distinct OpenTDB-inspired rows and 400 compatible-open rows, nine registered subthemes capped at 15 sets, and the required allocation: Easy 17/17, Medium 17/16, Hard 16/17 across rounds one/two.

The atomic publisher copied the verified authored, generated, and evidence inputs into accepted paths, then rebuilt the accepted verification report and merged the shared source cache. The five accepted paths were committed as `7c6ecfd7c0148ab11bb167580529970d76f30d25` (`content(science): replace filler with reviewed production clues`). Final verification is `kind=verification`, `blocking=false`; all 113 distinct sources pass, all 500 evidence rows contain three distinct approvals, the final 70-row bilingual/source sample authorizes publication, and filler/collision scans are clean. No waiver was used.

## Accepted RED and worklist

The accepted-state RED is pinned by `accepted-red-checkpoint.json`, SHA-256 `bce5a31ff18edc6fc8814642ee41f847113b214bea325519cd95856dda310038`. The accepted validator exited 2 because `content/evidence/03-science-nature.jsonl` was absent. Hash readback proved accepted authored `eb90252f5037d210faa3c49a09418009f5ed9f4b5012a0ddaa9a4c1e1a661c5e`, generated `c8a4483f0c72b64bd47f43857092c78f86d5216e8eedb8e3fd4041c2a96586bd`, and report `709c70d24e6f5e047ea7556ab43077d4ae5292960095b507296266b3fabdfced` were unchanged; accepted evidence remained absent.

The literal worklist command was:

```powershell
npm run content:build-worklist -- --batch 03-science-nature --output content/work/03-science-nature/worklist.jsonl
```

It deterministically produced 3,000 rows, SHA-256 `477379e94afecb93bdfb3da33702e02ca0817689c9204022342883ed9e216b38`.

## Candidate and source supply

The immutable 2,500-row OpenTDB pool is SHA-256 `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`. `candidate-supply-audit.json`, SHA-256 `03834fdc85cc12f306e8513e92dbb3779db35855b6ce66d4a27a65127221db1c`, excluded the 200 candidates already used by accepted History and Geography and found 156 unused Science and Nature candidates: 47 easy, 66 medium, and 43 hard. Exactly 100 distinct candidates were selected, one directly related candidate per set; the remaining 400 facts were bound to specific compatible HTTPS sources.

Drafting checkpoints materialized 25, 50, 75, and 100 complete five-clue sets and reran deterministic structure, candidate, source, uniqueness, and readback checks at each boundary. The final structure diagnostic, SHA-256 `9ad35ccd1d0e7037f01b8ec11bb49c395b898229b893d3017150dd05cdee749b`, records 100 sets, 500 facts, 100 direct inspirations, 400 compatible-open facts, exact allocation, null pre-review fields, and no structural issue. Registered subtheme counts are animals 10, astronomy 15, biology 15, chemistry 13, earth-science 10, medicine-history 15, physics 13, plants 5, and weather-climate 4. No row gives personal medical advice or an undated mutable record.

## English authoring, correction, and review

`Codex Science and Nature Author` authored the English corpus, 500 fact-specific tier rationales, and 100 set-level calibration notes. Independent factual and editorial reviews were fail-closed; correction ledgers used exact prior-value assertions, deterministic output hashes, recurrence guards, and `unmapped=0`. The correction sequence was:

- R1 materialized all 51 factual findings and 268 editorial rows across 99 sets, fixing contradictions, ambiguity, duplicate facts, title/cross-tier leaks, thin explanations, and generic rationales.
- R2 materialized 26 factual rows/27 findings and 160 editorial rows across 88 sets, repairing seven candidate semantic mappings, invalid variants, duplicates, leaks, explanations, and calibration.
- R3 materialized 15 factual rows/17 findings and 51 editorial rows across 54 sets, repairing stale variants, source identity, duplicate/leak recurrence, standalone construction, and progression.
- R4 materialized 83 editorial rows across 72 sets, removing invalid variants, title and cross-tier leaks, inverse pairs, thin explanations, templated rationales, and mechanical progressions while tracking factual projection drift.
- R5 materialized four factual and 211 editorial rows across 95 sets, narrowing source claims and replacing 198 terse/formulaic rationale shells plus affected notes and progressions.
- R6 materialized two factual and 238 editorial rows across 97 sets. It replaced 233 phrase-bank/terse rationales and 40 note shells with fact-specific player-knowledge judgments; manual readback covered all 500 rationales and 100 notes.
- R7 materialized 19 residual rows across 22 sets and nine families, closing ambiguity, leaks, an inverse duplicate, title clues, thin explanations, stale rationales, note shells, nonmonotonicity, and an invalid variant.
- R8 materialized one factual and seven editorial rows across five sets, narrowing the Newton namesake claim and fixing a metre leak, two thin explanations, set progression, and awkward wording.
- The first R9 approval materialization correctly failed the pretranslation gate on `BATCH_ALLOCATION`: six `human-anatomy` sets and one `spaceflight` set were not registered production taxonomy values. Those approvals were invalidated.
- The taxonomy correction mapped sets 058-063 to `medicine-history` and set 086 to `astronomy`. R10 then found that labels alone were semantically insufficient, so 35 rows across those seven sets were rebuilt around source-bound history-of-medicine and astronomy facts while preserving every immutable direct candidate.
- R11 materialized 21 rows across those seven sets, eliminating cross-set repetition, leaks, and an X-ray duplicate; set 086 became a coherent Chandra X-ray Observatory sequence retaining Columbia as the direct historical endpoint.
- R12 narrowed the MRI row to its exact bound-source claims and materialized 12 editorial rows across four sets, removing eight leaks and reordering set 086 so Columbia is an accessible early tier followed by specialist Chandra facts.
- R13 re-reviewed the complete frozen corpus and approved all 500 factual rows, 500 editorial rows, 100 sets, 249 decoded accepted variants, and all 100 immutable direct candidate mappings.

Final English approvals are factual R13 `c6833c13f657955ff7f6a000f09b93991ffcb959a2936c54d30a211af399cde8` by `Codex Science and Nature Factual Reviewer` at `2026-08-21T01:15:32.099Z`, and editorial R13 `8849517608f8519b228060b6750db0da2a3c4a38eca7a0278a0880326a7457b2` by `Codex Science and Nature Editorial Reviewer` at `2026-08-21T01:09:07Z`. They approve 500/500 rows, 113 sources, 100/100 mappings, exact allocation and taxonomy, 500 explanations/rationales, and 100 notes/categories. The final authored artifact is SHA-256 `02e82d232b4a5740148429c15e8ebeb530f75e3af2ff5cf9f83589951f0067f2`.

The R13 English approval materializer produced evidence SHA-256 `c7d1c334fc02b42d889a77a349fd7d15dc9191000e8d889c31c8694fbd9efba5` with factual/editorial approvals and 500 null translation reviews. Shared validation with `--allow-missing-et` exited 0, `blocking=false`, with exactly the expected 500 `MISSING_TRANSLATION` issues/exceptions and no other code.

## Estonian translation and semantic review

The machine pass used a task-local regular copy of the verified Helsinki-NLP/opus-mt-en-et interpreter/model cache: Python 3.12.6, Torch 2.11.0 CPU, Transformers 4.57.6, batch size 16. The source and copy manifests matched, with no junction or symbolic link. Translation completed in 342.324 seconds and produced raw SHA-256 `6f5ddc3b9bcdd21bed1fcccd26df2c02f61851d273f53c4171632e9df8fa82e1`. Raw diagnostics, SHA-256 `2c96b2a63edb233efe9c90483a2a355f73243db9cef2d9cfb7047ff0f49b4f5e`, correctly blocked on 34 errors: seven answer, 16 number, and 11 variant findings.

The correction-only editor inspected all 500 rows, 2,500 paired Estonian fields, 249 decoded variants, and 100 category sets, materializing explicit corrections in 458 rows. The editor-pass artifact was SHA-256 `d810b278113859642bbb6032ec3c3f40a41a9aa1544b7d19c24487d478b2b66a`; diagnostics then had zero errors and 715 enumerated, non-approved warnings.

Independent semantic correction proceeded without waivers:

- R1 (`409e54e9a2bc22e682871af2ebe1c390548c83f56c9623f2bf8f2c4fbdc44e16`) reviewed 334 fields across 247 rows/93 sets plus six confirmed warnings, with source-faithful deviations where proposals would lose meaning or variants.
- R2 (`732677b4c6bb5a6f28366e740ca99ea33ca7cf363b05e6f9446e4fec4a3c5cf2`) reviewed 58 fields across 56 rows/46 sets and resolved all 20 residual mappings and three failed deviations.
- R3 (`70ccec97d0b1b95bc64608c1efc88fffb6b93678982dfa9ab5c00c0d43181bb2`) corrected exactly clue 0005's SI metre denominator wording and clue 0309's natural dissection construction.
- R4 (`6834612c4fc54ce1483c7fa86484ac9932d296e09dba1b4a22dfca9bb0f3fc3a`) approved that 500-row snapshot, but the later final sample made it stale.
- Sample R1 (`9cf2b987a4bd814c9baa85a3daa69709f3c02396e993e1dd3ba9e178f5b25ea5`) passed 69/70 and rejected unattested `varretamm` in clue 0479. The targeted repair changed only its three Estonian cells: the clue explicitly asks for the English common name, the response is `pedunculate oak`, and the explanation naturally preserves `Quercus robur` and the long fruit-stalk meaning. The other 2,497 Estonian fields and every English/source field remained byte-identical.
- R5 (`f1a96df3cf1d934b1458f74161ff1503a958893fb948c84951947656940e99aa`) by `Codex Estonian Semantic Reviewer` at `2026-08-21T04:10:24.304Z` approved all 500 rows, 2,500 fields, 249 variants, 100 categories, and all 709 residual warnings. Approval materialization changed only 500 statuses and 500 translation-review objects.

The 709 translation diagnostics are expected reviewed warnings, not waivers: 632 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 77 `UNCHANGED_TRANSLATION`. Diagnostics contain 615 associated bookkeeping exceptions (538 and 77 respectively), all reconciled by R5. Final diagnostics have zero errors and `blocking=false`.

## Final bilingual/source sample

The independent final sample R2 is `final-bilingual-source-sample-round-2.json`, SHA-256 `1ae1ca5fdd958d5ae079a820ec7c5491e52ea3d8c9469fc781dc6dd544b7a3fd`. `Codex Science and Nature Bilingual Source Sampler` approved 70/70 deterministic clues at `2026-08-21T04:25:24.124Z`: at least five from every active subtheme and difficulty/round cell, including all 35 taxonomy-rebuilt rows. All 27 distinct sample sources fetched, all 13 pinned `oldid` revisions matched, and every row passed English/source support, Estonian meaning/naturalness, evidence binding, license/title/revision, and distinct-review identity/time checks. It explicitly records that clue 0479 is resolved without English/source drift and authorizes publication.

## Atomic publication and final verification

Prepublication shared validation exited 0 with `blocking=false`. Two deterministic work-root `content:verify-batch` runs also exited 0 with 113/113 sources, all six cells retained in the 30-clue verification sample, exact allocation/composition/bindings, and no blocker. The final work report/cache were SHA-256 `44fc2a9f4f71ee49262c0d097141ef3057a3deee6f1cb39d5d8f8040dc4b4d6a` and `d07ac1f28026387346f64e054e73cda046a3fed96bc6e8be2b2197dfb4a0ce19`.

The approved work inputs were copied into a clean detached worktree at parent `5a6bb909ec456a2a551f5c7cebc5367205751f52`. The following four commands were run in order and each exited 0:

```powershell
npm run content:verify-batch -- --batch 03-science-nature --work-root content/work --source-cache content/reports/source-check-cache.json
npm run content:publish-batch -- --batch 03-science-nature --work-root content/work --accepted-root .
npm run content:validate -- --input content/generated/03-science-nature.en-et.csv --evidence content/evidence/03-science-nature.jsonl --batch 03-science-nature --mode batch --report content/reports/03-science-nature.json
npm run content:source-check -- --input content/generated/03-science-nature.en-et.csv --report content/reports/03-science-nature.json --source-cache content/reports/source-check-cache.json
```

The accepted report is `kind=verification`, `blocking=false`, with 500 clues, 100 sets, exact Easy 17/17, Medium 17/16, Hard 16/17 allocation, 113/113 HTTP 200 source results, and the six-cell/30-clue sample retained. Its expected unresolved inventory is 1,332 reviewed/nonblocking records: 500 authored `MISSING_TRANSLATION`, 123 generated warnings (61 proper-name, 62 unchanged-translation), and the 709 fully adjudicated translation warnings above. The 500 authored and 615 diagnostic exceptions are expected bookkeeping, not waivers.

The authored/generated/evidence trio retained the exact approved hydrated Windows worktree bytes through publication. The report and shared cache were then regenerated by the postpublication validation and source-check commands, so their hashes below identify those postpublication outputs. All five SHA-256 values are hashes of the validated hydrated Windows worktree bytes where Git checkout newline conversion applies; they are not assertions that the corresponding Git blobs have identical line endings.

Final accepted hydrated-worktree SHA-256 values:

- `content/authored/03-science-nature.csv`: `02e82d232b4a5740148429c15e8ebeb530f75e3af2ff5cf9f83589951f0067f2`
- `content/generated/03-science-nature.en-et.csv`: `9caa3a0425f2411cdb6ebe918fa6fa4c79eb8f3787f2044afa1db1c1610e37bc`
- `content/evidence/03-science-nature.jsonl`: `3ead329b2d386044bc1b8fffb6eb16e95a2c073da897fc80dc4b5c6cd573e401`
- `content/reports/03-science-nature.json`: `20f34c7c0ef7c6b5a33e151296947f757602b41d60c7bbe05bfe2b5fb61127e6`
- `content/reports/source-check-cache.json`: `4e023fccaf6e558d05535cec3f9e16a30480f08d54bbabd2e3a45b1e8e75b104`

With `core.autocrlf=true`, the accepted generated CSV is CRLF in the validated Windows worktree and has SHA-256 `9caa3a0425f2411cdb6ebe918fa6fa4c79eb8f3787f2044afa1db1c1610e37bc`; its committed Git blob is normalized LF and has SHA-256 `da8a6b00769c35e83b2adf34d10c83433aee27842dbe62e7f1d1e271eb602bfc`. This is Git newline normalization, not an intended content mutation.

The final cache contains 411 regular entries: 298 prior entries preserved byte-for-byte plus the 113 accepted Science and Nature results. Bilingual filler scanning covered 5,000 cells with zero matches; cross-batch clue, fact, candidate, assertion, and clue-text collisions were all zero. Commit `7c6ecfd7c0148ab11bb167580529970d76f30d25` has parent `5a6bb909ec456a2a551f5c7cebc5367205751f52` and contains exactly the five accepted paths. The primary branch was fast-forwarded only after target/index revalidation, and the detached worktree was removed.

## Concerns and closure

The system drive was full during publication preparation, so the detached E: worktree used task-local `TEMP`, `TMP`, and npm cache directories and a regular, non-linked `node_modules`. `npm ci --ignore-scripts` exited 0 without dependency-file changes and reported 27 inherited audit findings (3 low, 23 high, 1 critical), outside this content task.

An initial detached source-check invocation exposed npm 11 positional normalization when the final two flags were presented in a different order. The final-report shape gate caught the swapped destinations before staging; that detached attempt was discarded, exact baselines were restored, and the full four-command sequence above was rerun in the declared order. No failed-attempt bytes reached the shared checkout or commit.

Task 11 has no remaining content, review, translation, source, verification, publication, or commit blocker. This closes only the Science and Nature production-content batch; it does not claim Task 12 or whole-application/release completion.
