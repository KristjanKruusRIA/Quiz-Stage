# Task 12 Literature and Language production-content recovery report

Date: 2026-08-21

## Scope and outcome

Task 12 replaced the accepted `04-literature-language` filler batch with 100 independently authored, reviewed, bilingual Literature and Language category sets containing 500 board clues. Exactly 100 rows directly preserve distinct immutable OpenTDB candidate mappings and 400 rows use compatible-open sources. The accepted allocation is Easy 17/17, Medium 16/17, Hard 17/16 across rounds one/two. Final verification is `kind=verification`, `blocking=false`, with 117/117 sources, 500 factual/editorial/translation approvals, a six-cell 30-clue verification sample, zero filler or cross-batch collisions, and no waiver.

Publication required two commits because the first independent final sample approved a factual-review timestamp that had not yet occurred. Controller rulings required the repository-canonical paths and preserved the first publication commit in history. A later corrective commit changed only evidence chronology and its verification-report projection after fresh independent postpublication review.

## Accepted RED, worklist, and candidates

The accepted-state RED checkpoint is `accepted-red-checkpoint.json`, SHA-256 `7ba65b8df4d18d3e9506f68851afcb1807a00217298e782608fea362db704f27`. Accepted evidence was absent; direct validation exited 2. A probe then exited 1 with the expected filler-state blockers, including 500 missing-evidence, 500 placeholder, 500 number-drift, allocation/composition/source failures, and the repeated near-duplicate surface. Readback proved the pre-existing accepted authored, generated, and report files were unchanged.

The deterministic worklist contained 3,000 rows, SHA-256 `e057b4fd0b31819993054ce2973235843769455564b045828aeca409d7f6d568`. The immutable 2,500-row OpenTDB pool is SHA-256 `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`. Candidate audit `56a96492471ddd4687d1573ffe0737cd7508c08f1ae7788d271926a417c89478` excluded the 300 candidates already used by accepted History, Geography, and Science and selected 100 distinct candidates from 2,200 unused rows. Every selected candidate was bound directly to one inspired fact without changing its candidate identity; the other 400 rows were bound to specific compatible HTTPS sources.

## English authoring, correction, and review

The English corpus was built deterministically as 100 five-clue sets with registered taxonomy, exact allocation, unique clue/fact/assertion/source identities, 100 direct candidate mappings, fact-specific explanations and rationales, and set-level progression notes. Factual and editorial reviews were fail-closed. Every correction layer used exact prior-value assertions, exhaustive ledgers, recurrence guards, `unmapped=0`, and deterministic rebuilds.

The principal English correction chain was:

- R1 materialized all 37 factual rows and 212 editorial rows across 96 sets, repairing source scope, seven non-direct mappings, variants, duplicates/inverses, leaks, standalone construction, explanations, rationales, notes, progression, and difficulty.
- R2 materialized 18 factual rows plus 130 editorial rows across 87 sets, closing invalid variants, subject/source mismatches, standalone recurrences, leaks, duplicate facts, thin explanations, workflow rationales, stale notes, and progression/difficulty findings.
- R3 materialized 49 editorial rows across 38 sets and eight families, including later-tier leaks, duplicate/inverse responses, standalone clues, explanations, rationales, notes, and progression.
- R4 materialized 12 rows across nine sets, closing eight leaks, two inverse groups, two standalone failures, and one stale rationale.
- R5 materialized 28 rows across 21 sets and eight families, including semantic/category leaks, a self-answering clue, invalid variants, inverse pairs, a standalone clue, a note mismatch, and progression.
- R6 materialized 12 row exceptions across ten sets, repairing five later-tier paths, five category leaks, a near-duplicate stem, and a set-progression contradiction.
- R7 materialized 27 rows across 29 set findings, closing residual leaks, duplicates, standalone wording, rationale/note/progression/category-scope findings, and response naturalness.
- R8 materialized six row exceptions across seven set findings, removing three category leaks, a Camorr duplicate, nonmonotonicity, a stale note, and a clue echo/grammar defect.

Later full reviews and the first final-source sample exposed three bound-source blockers: clue 0252 overstated *The Scarlet Letter* as American/dark Romanticism rather than the supported Romantic and Historical genres; clue 0352 lacked support for singular mass-noun grammar; clue 0355 presented an undocumented compass backronym. Those English and corresponding Estonian projections were corrected and all prior approvals were invalidated. Factual R10 then approved the corrected sources, while editorial R10 required a nonleaking set 051 category/genre calibration and standalone Dorset wording for clue 0041. Editorial R11 found one remaining set 051 calibration `factKey`; the deterministic R11 correction changed only movement to genre. Factual R11 (`2fb55620bc7bf6142ddaab2987ba82061c60d2b6a76d4eebcf7a5ba2d2ce1d89`) approved all 500 rows, and editorial R12 (`1682dd4f38a4836c3433b7437e932b1b5ba4ad6f29d28972514aac800277d12b`) approved all 500 rows and 100 sets.

## Estonian translation and semantic review

The exact Helsinki-NLP/opus-mt-en-et CPU workflow ran with batch size 16 in a task-local E: environment and produced the 500-row raw machine draft, SHA-256 `4c8fa18a82095be7e57fb01d58b2b2ec6c358a7c4438f4b22eb112db499b443c`. The Estonian editor inspected all 500 rows, all 2,500 category/clue/response/variant/explanation fields, all 179 decoded alternatives, and all 100 sets. Its deterministic correction map produced edited SHA-256 `a8c774c34a4de9356c3c5666f6a31c066234d903cb83da283bf1f71b2e0542ed` while preserving all 19 non-Estonian fields.

Independent semantic correction proceeded without approval shortcuts:

- R1 (`dc21098aa29e3a77a345e15d2a7034753d5b105e7a20865e90d8b97f0d538dbf`) materialized 142 fields across 124 rows/65 sets and reconciled warning identities ordinally.
- R2 (`746c9db6cd26c66121b34c8db59c67eea65456af6e624e32007594f8103f7eb3`) corrected three fields in rows 0166, 0168, and 0205.
- R3 (`18e16e6783bcbebff6241e20f688f417817175cbd23ff1a18fb0b75df386bbe8`) approved all 500 rows, 2,500 fields, 179 variants, and 100 sets before the final source-sample corrections invalidated that snapshot.
- R4 (`7b7c84ed4eacd3bdbe8827945b13874bd1f0182e46f1ccccf58210bbdf35352c`) approved the bilingual source-safe corrections to rows 0252, 0352, and 0355.
- R5 (`b23d0a6546f3dfb07da910d50b51bb3d22699e8bd46ce155964d22fbbf9af992`) approved the final 500-row snapshot after the clue 0041 and set 051 editorial corrections.

Final diagnostics contain 1,153 reviewed warnings: 981 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 172 `UNCHANGED_TRANSLATION`. All warning occurrences were mapped and reconciled; diagnostics have zero errors and `blocking=false`. The 954 bookkeeping exceptions are expected diagnostic associations, not waivers. Translation status is reviewed on all 500 rows, with 500 approved translation-review objects and no semantic approval represented by a waiver.

## Final samples, initial publication, and chronology repair

Final bilingual/source sample R1 (`5b8a3e7af31cef88a107a0c746a8ed1eff6500b5772f8b5e037373cefbcb5a20`) rejected exactly clues 0252, 0352, and 0355 for the source-scope failures described above. Their narrow English, Estonian, evidence, and source-safe corrections were independently re-reviewed. Subsequent editorial rounds also closed clue 0041 and set 051. Final sample R2 (`f13bb2dcded654defa454b740154ae9bee2e55826bd0935252443e13adaa5ebb`) approved 50/50 deterministic bilingual/source rows and authorized publication.

Per controller ruling, publication used the canonical repository paths, not obsolete aliases. Commit `8e990faa7a2af464ffb77102d7e35d6df2295362` (`content(literature): replace filler with reviewed production clues`) contains exactly:

- `content/authored/04-literature-language.csv`
- `content/generated/04-literature-language.en-et.csv`
- `content/evidence/04-literature-language.jsonl`
- `content/reports/04-literature-language.json`
- `content/reports/source-check-cache.json`

Postpublication audit found that the R11 factual approval embedded in that evidence used `reviewedAt=2026-08-21T19:30:00.000Z`, later than the initial commit at `2026-08-21T18:53:38Z`. The approval content was clean, but the future timestamp made the chronology invalid and had been missed by sample R2. History was preserved rather than rewriting `8e990faa`.

Fresh independent factual R12 (`520e90edfe7a7124b2ff84fee8e2adbeb375f5fe62a4e91f517961f0ec3530b5`) reviewed all 500 rows and 117 sources at live time `2026-08-21T19:21:18.543Z`. A deterministic materializer changed only the 500 factual-review identity/time blocks; non-factual drift was zero. The strict live-time chain is:

1. Factual R12: `2026-08-21T19:21:18.543Z`.
2. Chronology materialization: `2026-08-21T19:26:02.140Z`.
3. Prepublication checkpoint: `2026-08-21T19:36:23.779Z`.
4. Independent final sample R3 (`3d4b1d0b3031cfefffb2bbc56b2c3175b9684438c4e5d2c65f1ac92bdb422987`), approved 50/50 at `2026-08-21T19:44:36.279Z`.
5. Corrective commit: `2026-08-21T19:55:38Z`.

Commit `3cc6ba6190e95537156c0ac7d06d1fc3df45af19` (`content(literature): correct review chronology`) has parent `8e990faa7a2af464ffb77102d7e35d6df2295362` and contains exactly `content/evidence/04-literature-language.jsonl` and `content/reports/04-literature-language.json`. Both final independent postpublication audits—factual R12 and bilingual/source sample R3—are clean.

## Final verification and hashes

The accepted report retains 500 clues, 100 sets, exact Easy 17/17, Medium 16/17, Hard 17/16 allocation, 117/117 successful sources, all 500 approvals for each review role with four distinct identities including the author, the 1,153 mapped nonblocking warnings, zero errors, and five sampled clues in every difficulty/round cell. Filler and cross-batch clue, fact, candidate, assertion, source, and clue-text collision scans are all zero. The shared cache is an exact 411-entry prior cache plus 117 Literature and Language entries, for 528 total; chronology correction changed no source entry.

Final accepted working-tree SHA-256 values:

- `content/authored/04-literature-language.csv`: `0b7178ebd1130461f18f553c636a92fd1645cfc0facfb5e6121ab1c662c78803`
- `content/generated/04-literature-language.en-et.csv`: `7fe39037544e2e06b35cc92951233f0260130505797bc12899f079a172aee789`
- `content/evidence/04-literature-language.jsonl`: `320bf1e37808bb1f10837e49a20d8f6fe19bcc5b27b80d961a4068aa22a1b9b7`
- `content/reports/04-literature-language.json`: `acbe6577777135cba1bdcacf33efda1c7cabc5ffab61366f7fcdf1d88ea2b198`
- `content/reports/source-check-cache.json`: `16e261600eec8e91db205c90e94aea8172d3f6e511e59b77c75b96ff690b5ea2`

These are hashes of the current hydrated Windows working-tree bytes. With `core.autocrlf=true`, Git compares normalized content and the committed blob bytes need not have the same SHA-256. At `3cc6ba6`, normalized Git-blob SHA-256 values are authored `d09b582859f7c2d718068a973883e3f64d9fec6fb4693f514a6fab0dfb2f2b2b`, generated `c37f3b0547378594e3ac7cfc0843e6021a5a986529ac5b7940c55af3eef1875a`, evidence `320bf1e37808bb1f10837e49a20d8f6fe19bcc5b27b80d961a4068aa22a1b9b7`, report `acbe6577777135cba1bdcacf33efda1c7cabc5ffab61366f7fcdf1d88ea2b198`, and cache `e9b4c904266ecf630394d8799a0e6c8076ca3ab3c329549b501b46fa762ed49b`. This is newline normalization, not semantic mutation; no claim is made that checkout restores a particular newline style.

## Concerns and closure

Publication and correction used isolated detached E: worktrees with task-local temporary and npm-cache directories. The detached repository worktrees were removed. A policy-blocked task-local diagnostic scratch directory may remain outside the repository with security-test-created reparse fixtures whose targets were verified to stay inside that scratch tree; it has no repository, index, accepted-content, or release-state effect.

Task 12 has no remaining content, English-review, translation-review, source, chronology, verification, publication, or commit blocker. This closes only the Literature and Language production-content batch and does not start Task 13 or claim whole-release completion.
