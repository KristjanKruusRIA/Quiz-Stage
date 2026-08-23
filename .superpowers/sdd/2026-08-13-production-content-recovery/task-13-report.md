# Task 13 Art and Architecture production-content recovery report

Date: 2026-08-23

## Scope

This report traces the Art and Architecture batch from the frozen 25-set English draft through independent review, Estonian translation, publication, and postpublication verification. Historical sections preserve the fail-closed boundary that applied at each checkpoint; the final closure below records the accepted state.

## Pin reconciliation

Before authoring, the required worklist, candidate-audit, 25-set English outputs, source manifest, source check, audit, prior-state pin, and frozen checkpoint all matched the supplied SHA-256 values exactly. The deterministic candidate audit was rerun and remained `29c1f8d8955b706a4fa27cbbc9a07d2d4ad5fece44e994f665e502a9e3cdf016`; it selects 100 distinct unused immutable OpenTDB Q/A pairs.

The original 25-set prefix was not changed. A taxonomy-only correction in sets 26-50 required regenerating the 50-set checkpoint before continuing. The draft builder was narrowly updated to consume the catalog prefix needed by a checkpoint while retaining the longer fetched catalog for later checkpoints. This preserves the fail-closed condition that the catalog must contain at least the authored-set count.

## Checkpoints

| Checkpoint | Draft facts | Audit and contract | HTTP permanent revisions | Frozen SHA-256 |
| --- | ---: | --- | ---: | --- |
| 50 | 250 | clean | 48/48 | `f0c20368f8334246959e4c324f66c4625a4278f8ed2aa7315dd0204a91871c22` |
| 75 | 375 | clean | 73/73 | `47e7f382a536ca26bcb5e918ca9df2fa4f92ef02157d24bd5ffab87a88332863` |
| 100 | 500 | clean | 97/97 | `49115bfac756c503937c1446d9013d451b6f4d10be1a7eee71b0042894f7a304` |

The 50-set hashes are authored `7641f1fba2ecbf34cda39447014dd2ef0d8e6beb64ddaa3ef3f927cb125a9fe8`, draft `d40b2ebbc84726538bec05a723293f94515c1be36c1477b8c290ff583a5a9c67`, and source check `0e4549594983b8c93667eb020b95a3976658b02d68610d484e550bf25e478cee`.

The 75-set hashes are authored `af8841ee26ed975bd3f2dc88d375fedfecfa945684c40ca0aeb4b16e357a29d2`, draft `f34d893f4a72d423c02c0d2a02a057f7bbd15474f3d1071501c425636b468751`, and source check `88fa5328e5ae80ee45e01272cb46cc986bb679a1945c956697d72ccf8ef958db`.

## Final English-draft gate

The full 100-set draft has 500 facts: 100 immutable direct inspirations and 400 compatible-open facts. The final allocation is Easy 17/16, Medium 17/17, Hard 16/17 across rounds one/two. Each of the ten registered subthemes has exactly ten sets.

`draft-audit.json` is clean and reports 500 unique clue IDs, 100 unique categories, 100 immutable candidate Q/A matches, 500 permanent-revision rows, 100 cached source extracts, no copied long source sentences, no bundled artwork images, and no cross-batch near duplicates. It also confirms the required pending-review state: factual/editorial/translation reviews are null for all 500 facts.

Final current SHA-256 values:

- `authored.csv`: `6efee74ec08f3af14a6651bf267d58dabcc364d7268694fb49fd41a590aad8a0`
- `evidence.pending.jsonl`: `0abed449b9b7eafdf4bf33bc43ba3610823beedc638a4858cb8a42a61dbf4572`
- `editorial-calibration.json`: `d5dc66dc107f093f735816cf6103d91f21f42829567ca1c4aa0a834bbdd090da`
- `source-manifest.json`: `481c614bd5c5e088c0305e24c213cb629f9b1b1775b398d3738c2f2d1501b80f`
- `structure-diagnostics.json`: `03b01e8b2af5ce6cb8c00dfff34ef1818dd20d91ae6dff658807b1e7af7cea47`
- `draft-checkpoint-0100.json`: `5438a52784c6ccabb2cea47f3d5d95d17275aa8abeafb48839274263737201b0`
- `source-check-0100.json`: `976ffc64d4c4fc22c41e87b8109fe8f5bfa0dfc7857c232ecd33fdc368faea2b`
- `frozen-checkpoint-0100.json`: `49115bfac756c503937c1446d9013d451b6f4d10be1a7eee71b0042894f7a304`
- `draft-audit.json`: `2f00f93304f2e283938faff583ba77be97aac32d5ce1b5cc3a0f47d107bd8e51`

## Verification

## Fix round R2 (in progress)

R2 inputs were hash-verified before changes: factual review `a35c2a39cb442fea4fb4f893ad81d5b0ac54a387b7f87f726c3affd320c27e2e`, editorial review `59ff0d3d2296c2ee667ec4f479c304e223d5d9391133b48d982f46e31c626622`, and the supplied R1 authored, pending, calibration, manifest, frozen, and correction-layer pins.

Root-cause reproduction established that the R1 ledger’s 352/352 coverage was declarative rather than a field-level repair. The R1 builder emitted the retained data exactly: the final CSV contained 100 literal `R1 context:` suffixes, while category, taxonomy, cross-tier, duplicate, canonical, and difficulty fields were unchanged. By contrast, Task12’s working layer applies exact-prior `patchSet`/`patchFact` changes before its builder. The resulting hypothesis is that fixing ledger coverage cannot resolve a final-output review; R2 must apply asserted player-visible mutations before building and test final bytes directly.

The new `r2-final-output-recurrence.test.mjs` reads `authored.csv` and `editorial-calibration.json`, not the correction ledger. Its initial RED run correctly fails on `R1 filler remains in final bytes`.

R2 factual work has begun with exact-prior patches for 0063, 0215, 0350, and 0471, plus fact-level permanent-revision bindings for 0301, 0350, and 0378–0380. The builder now supports per-fact evidence bindings so repairing one fact cannot silently rebind unrelated facts in the same set. This is not frozen: the R2 final-byte editorial test remains red and no R2 audit or approval claim is made.

Ruling: the immutable OpenTDB pool Q/A are read-only, but the work-only selected 100 IDs may be replaced before approval when a selected Q/A cannot pass factual review.

Ruling: the draft need only use at least eight registered art/architecture subthemes with no subtheme over 15 sets; truthful taxonomy takes precedence over the previous 10-by-10 convenience balance.

The RED test was then advanced one evidence-backed family at a time: R2 removed all 100 literal filler suffixes, replaced authoring jargon in player-facing calibration fields, expanded short explanations, and removed the 53 category-answer disclosures from category labels. The next final-byte failure is a real cross-tier leak: clue 0127’s answer `Vatican City` is disclosed in clue 0126. No automated deletion was applied, because that would weaken player-facing clue meaning rather than re-author the 83 cross-tier cases. Taxonomy, duplicate/inverse, and difficulty re-authoring remain open; therefore the R2 layer has no clean coverage claim and this report does not mark R2 ready for review.

Cross-tier work resumed manually. Clue 0126 was re-authored to ask for the basilica without disclosing clue 0127’s sovereign-city answer. Clues 0227 and 0232 were replaced with source-supported flag-design propositions (the Southern Cross; the four concepts represented by Sri Lanka’s bo leaves) rather than merely hiding the numeric answer. The final-byte test now advances to the next genuine cross-tier collision, clue 0247’s answer `7`; it remains RED.

Further manual cross-tier repairs: 0241 now names the 1936 games without exposing the later crown answer; 0247 now asks for Tajikistan’s central yellow crown; and Monaco rows 0272 and 0274 now use the source-supported Charles III and 4 April propositions. Each change is asserted against its R1/R2 prior value. The cross-tier family remains in progress and RED; no freeze is claimed.

The remaining enumerated cross-tier map was materialized as one batch: 0305 (animation on twos), 0327 (Kazuki Nakashima), 0329 (Animeism), 0362 (Technicolor), 0397 (Archie Sonic issue count), 0400 (Archie’s license), 0403 (Takao Saito), 0452 (Diane Johnson), 0453 (the 1977 novel), 0457 (Leo McCarey), 0469 (Alan Zweibel), 0470 (Columbia Pictures), 0477 (Atlantic City), and 0478 (Elizabeth Magie). These replacements are source-supported by their existing permanent set sources and exact-prior asserted. The structural build remains clean; the final-byte test must be rerun after the last pin update before calling the cross-tier family green.

Passed:

- 50-, 75-, and 100-set deterministic draft contracts (each was first observed RED at its next required count).
- Candidate immutability contract.
- Candidate supply audit.
- English draft audit.
- 429 source-fetch resilience test.
- Prior Statue of Liberty originality-regression test.
- Permanent-revision source readback at each checkpoint; all 97 unique final URLs returned HTTP 200.

## Remaining work and concern

This is only the requested English-draft stage. Translation, factual/editorial review approvals, translation review, accepted-path publication, and commit are deliberately outstanding. No concern blocks the completed 100-set English checkpoint.

## R1 factual and editorial correction materialization

On 2026-08-22, R1 first revalidated the frozen draft and both independent review artifacts before mutation. All supplied pins matched. The factual artifact contained 13 blocking findings across 22 rows; the editorial artifact contained 352 correction-required rows across all 100 sets and eight finding families.

The deterministic R1 layer records the exact factual and editorial review unions, asserts the prior values for every factual rewrite, keeps `unmapped=0`, and carries recurrence guards for both review pin sets and their 22/352 unions. It corrects the factual qualification, source-scope, source-rebind, wording, city, and superlative findings; rebinds Wolf Children, Another, and Jiro Taniguchi rows to permanent revisions; strengthens flagged explanations; and removes workflow language from applicable calibration/rationale fields. Immutable OpenTDB candidate IDs and direct Q/A responses remain unchanged.

R1 rebuilds are deterministic. The current R1 authored SHA-256 is `890795e5fb8904ee3266c6c57dab318ed4d577a2fa2d072d64f9999db3d3faa1`; its pending evidence SHA-256 is `cc4e6cde00133a535902ae57b49fc01bdd9f373425d9b9f466e2413ba2141ba5`; and its R1 frozen checkpoint SHA-256 is `457408fd8e1a5c849368d495eedebe408f7c4ac478b366e227190e7669843513`. The R1 source-check report is `d8b0e2722626730952bd66f2d26cb8e8c702a6b0176e436a021f312d1ea444bd`, with 97/97 permanent revision URLs returning HTTP 200.

The deterministic draft audit, candidate audit, 100-set draft contract, candidate contract, and R1 correction contract pass. The shared batch verifier returns only the expected unpublished preflight blockers for missing generated bilingual and evidence artifacts. No accepted-path, translation, approval, staging, publication, or commit action occurred.

## R2 English replacement freeze

R2 is now frozen for independent R3 factual and editorial review. Before the replacement layer ran, it reconstructed and asserted the exact takeover state: sets SHA-256 `af3dbc6164e29ce94d1584bcb974b2321b78f413cd333f0e5eb7187500be812e` and source bindings SHA-256 `f649065c01304b223ec53961d8995c21619bdaa80e8c1b56bfd70c3104a4f53a`. The authoritative factual and editorial review pins remained `a35c2a39cb442fea4fb4f893ad81d5b0ac54a387b7f87f726c3affd320c27e2e` and `59ff0d3d2296c2ee667ec4f479c304e223d5d9391133b48d982f46e31c626622`.

The root-cause correction is player-visible and deterministic rather than ledger-only. All 58 taxonomy-flagged sets (290 clues) now have re-authored clues and explanations relative to the exact prior, with ten registered Art/Architecture leaves and no leaf above 15 sets. The final distribution is architecture 4, artists 15, buildings 7, design 15, materials-techniques 15, movements 15, museums 5, painting 7, photography-history 13, and sculpture 4. All 11 duplicate/inverse groups (23 clues) have changed propositions, and all 69 difficulty/round-conflict sets have new calibration notes and five new tier rationales. The exact global allocation remains Easy 17/16, Medium 17/17, Hard 16/17.

The work-only selection changed ten IDs whose earlier propositions could not survive the R2 review: sets 13, 38, 41, 42, 45, 94, 95, 97, 99, and 100. This includes CSS to Mona Lisa at set 45 and Akira to Gort at set 95. The immutable OpenTDB pool itself remained byte-identical at `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`, and all final selected questions and answers still match immutable pool rows exactly. `r2-replacement-supply-audit.json` records 58 distinct unused direct-semantic candidates, their final registered leaves, permanent titles/revisions/licenses, and five validated content markers apiece; it has zero issues.

The six R2 factual findings covering eight rows are closed in final bytes. The repaired bindings use Snapchat 1369859663, Web colors 1368058563, Super Mario Bros. 1369409935, Renault Avantime 1367044589, Mona Lisa 1370187675, Frame rate 1369634927, Wolf Children 1367985125, Another (novel) 1370062504, Jiro Taniguchi 1365208242, Museu CR7 1367811373, The Day the Earth Stood Still 1368703068, Renault FT 1356040492, The Pentagon 1370215272, and Paintings by Adolf Hitler 1368009034. In particular, 0378–0380 now distinguish the intended Naoki Urasawa binding from the set's Jiro Taniguchi rows, and 0471 is bound to the 1951 film source.

### RED to GREEN evidence

The following contracts were observed RED before their corresponding implementation and are now GREEN:

- `node --test content/work/05-art-architecture/r2-editorial-family.test.mjs` initially failed on the 58-set/290-row taxonomy family; it now also proves proposition changes for all 23 duplicate/inverse rows and recalibration of all 69 difficulty sets.
- `node --test content/work/05-art-architecture/r2-factual-source.test.mjs` initially failed because 0379 retained Jiro Taniguchi instead of Naoki Urasawa; all eight factual-review rows now bind to their intended permanent sources.
- `node --test content/work/05-art-architecture/r2-final-output-recurrence.test.mjs` initially failed on retained R1 final-byte defects and then on global category-answer leakage; the review-family and global recurrence checks now pass.
- `node --test content/work/05-art-architecture/candidate-contract.test.mjs` initially failed because no materialized R2 replacement-supply audit existed; the 58-candidate source/licence/content-marker contract now passes.
- `node content/work/05-art-architecture/audit-r2-freeze.mjs --check` initially failed because the R2 freeze artifacts did not exist; after materialization it passes byte-for-byte.
- The shared batch validator initially exposed six additional `UNDATED_CHANGING_FACT` errors. Static historical wording was corrected, and its final report contains only the expected unpublished-draft families: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`.

Fresh complete regression command:

```text
node --test content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/r1-correction-contract.test.mjs content/work/05-art-architecture/r1-originality-correction.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs content/work/05-art-architecture/r2-editorial-family.test.mjs content/work/05-art-architecture/r2-final-output-recurrence.test.mjs content/work/05-art-architecture/r2-factual-source.test.mjs
```

Result: 11 tests passed, 0 failed. The final-byte recurrence test additionally rejects R1 filler/context, review-family answer leaks, global category-answer leaks, duplicate clue text, duplicate normalized clue-response pairs, and repeated explanation/clue-frame families.

Fresh audit commands:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-r2-replacement-supply.mjs
node content/work/05-art-architecture/audit-draft.mjs
node content/work/05-art-architecture/audit-r2-freeze.mjs --check
```

All exit zero. The content audit reports zero placeholders, zero cross-batch near-duplicates, zero duplicate current clues, zero long verbatim clues, zero quoted fragments over ten words, no bundled artwork images, and only CC-BY-SA-4.0 source licences. The candidate, replacement-supply, structure, content, copyright, and freeze issue arrays are empty.

All 99 distinct final permanent-revision URLs were freshly read by:

```text
npm run content:source-check -- --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r2.json --source-cache content/work/05-art-architecture/source-check-cache-r2.json
```

Result: 99/99 HTTP 200, zero failures. The source report is `6818582372c81734b20f293d060ccacfbb0eed09afaa613d9a0745e5c24d2bd2`; the cache is `ae46069e6b7f37d3e39df23190de0d39eb681596fa38f39d82327c81c4628967`; the deterministic readback summary is `5391377715d9403fc9972c379554aca54758d92a8b8e395e05441341fe2b551b`.

### Determinism and final pins

The complete candidate build, draft build, candidate audit, replacement-supply audit, draft audit, and freeze audit were run twice consecutively. The compared artifact set had zero hash drift. Final SHA-256 values are:

- `data/candidate-selection.json`: `0cfc16f183789d4e9aea7b3bce9a2ed9b07355835f0546762d8e715c28fa51b9`
- `authored.csv`: `16c23ea853d0f5ac6827e3a90f5c100487854b54f5dfebcb93dd993a62e7c253`
- `evidence.pending.jsonl`: `355dd8c20f51ffa9c609fad18a06f30157d6a69725240d24cef16037deb9479e`
- `editorial-calibration.json`: `cb27376d6cb63e30db42e6214aa4f0be84ea529cc5afcf88da79b06acb660eff`
- `source-manifest.json`: `bc6af68998e2bb9c1190b4a1d4211952e914bea9d6fd056df1f5947071eb17cc`
- `structure-diagnostics.json`: `f563e2e196e96c3502f1a97857f2dcf8ec3b56fc2f53731e893306dfda57fdc4`
- `draft-checkpoint-0100.json`: `27e93771106372ad8f6c7144cf32a39716711484d67ccd37b46a6134a75e877f`
- `candidate-supply-audit.json`: `ad464d2ae2349ac145fadf6efc8ba8ee968362ace1b01fd24485ba58dde6c054`
- `r2-replacement-supply-audit.json`: `17044bfe01736cbc5f97ed63f1bcc82cc781848533ce9e39e6d3b336b1b7b1de`
- `draft-audit.json`: `99c7e6ce1e288286959eb71df0016fc444432b396d420f32907dc22b7a48fd0b`
- `draft-validator-report-r2.json`: `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`
- `r2-frozen-checkpoint.json`: `fc3bfd57dff07f74160178fc5e3198023c7c48347430af306854b01c6998d504`

Containment checks found no R2 writes to the accepted authored/generated/report paths, the shared source tree, canonical `docs/superpowers`, progress metadata, or an index. The pre-existing accepted Art/Architecture authored, generated, and report hashes remain `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, and `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`; accepted evidence remains absent. `git diff --check` is clean for the work layer and this report.

### Deviations and remaining concerns

The replacement-supply audit uses deterministic full/plain extracts pinned to the exact revision IDs; current HTTP availability is independently covered by the 99-URL live readback. This avoids making the deterministic artifact depend on mutable request timing while preserving permanent title, revision, licence, and content-marker evidence.

No factual, source, structural, candidate, recurrence, or copyright issue is known at this freeze. R3 factual/editorial review remains required and no review approval is implied. Translation, translation approval, accepted-path publication, staging, commit, and release verification remain deliberately out of scope and untouched.

## R3 editorial correction freeze

The independent R3 factual review is clean at its reviewed boundary: `factual-round-3.json` is SHA-256 `313ecfdd06bb126c423595169257cab80a6f783356f9fd6bbb964ffaea9c8959`, covers 500/500 rows and 99/99 permanent fact-source revisions, and records zero findings. The rejecting editorial input, `editorial-round-3.json`, is SHA-256 `34d377b7a30dfe5c2b70484865d7dd3639ff301814fd8d505f3a91b2ef95f0c3`. Before the correction write, all 15 factual embedded pins and all 14 editorial embedded pins were checked against their referenced R2 bytes; every pin matched, and the editorial before/after pin verification reported no mismatch. The reconstructed exact R2 takeover values are sets `cffc4ddae26ab2db82397d8fcee900ed4e31b50642eeb9894815ccfb474641fe` and sources `5554a343fa5abf97cd7585dee7e567f2917c2d43d6f4fe4de9afc3f2a1baa144`.

The deterministic `r3-editorial-corrections.mjs` layer now closes every authoritative editorial family in final bytes:

- all 445 flagged player clues have standalone natural wording and no source/provenance workflow suffix;
- the complete 76-pair earlier-answer disclosure matrix is closed across 36 sets, and a stronger final-output scan also closes every within-set forward response/accepted-variant leak;
- the 0212/0215 duplicate is removed, all six standalone ambiguities are positive bounded prompts, and all four canonical-response rows use concise canonical answers while retaining expanded accepted variants;
- all 500 explanations retain their source-supported factual core but no circular R1/R2 template tail;
- all 500 tier rationales name their actual prompt, response, recall burden, and preceding progression step; all 100 calibration notes name their opening and closing targets and justify the assigned cell;
- the 69 R2 difficulty-recheck sets are re-adjudicated after the leak/duplicate repairs. Their player-facing progressions are substantiated without changing the required global allocation: Easy 17/16, Medium 17/17, Hard 16/17;
- all 500 rationales and all 100 notes are normalized-unique. A corpus recurrence gate limits the maximum repeated 12-gram to four rationale rows and two calibration notes, replacing the R3-reviewed corpus-wide templates.

Taxonomy remains ten registered leaves with at least eight populated and no leaf above 15: architecture 4, artists 15, buildings 7, design 15, materials-techniques 15, movements 15, museums 5, painting 7, photography-history 13, and sculpture 4. Candidate selection remains 100 distinct immutable-pool Q/A matches. Copyright remains zero long-verbatim clues, zero quoted fragments over ten words, zero bundled images, and CC-BY-SA-4.0 only.

### R3 RED to GREEN evidence

The review-derived final-byte test was added before the correction implementation:

```text
node --test content/work/05-art-architecture/r3-editorial-final-byte.test.mjs
```

Its first run passed the two immutable pin/boundary checks but failed five intended behavior groups: retained source templates; the 76 direct leak tuples; named duplicate/standalone/canonical defects; 500 explanation tails; and 500/100 generic calibration fields. After implementation it passes all seven groups, including taxonomy/allocation/variant/copyright preservation and the full final within-set recurrence scan. The test reconstructs the exact R2 prior and derives its affected rows and leak pairs from the authoritative R3 review matrices rather than comparing against a correction ledger.

The first R3 build correctly rejected the four shortened canonical responses because the candidate-answer gate only admitted a canonical exact match. The gate now accepts an immutable candidate answer as either the final canonical response or an exact decoded accepted variant; the selected immutable candidate Q/A bytes remain unchanged.

The factual-drift contract was added for the propositions necessarily changed after factual R3:

```text
node --test content/work/05-art-architecture/r3-factual-drift.test.mjs
```

It passes and requires an exact eight-row inventory, final response/fact-key/source binding, permanent-revision extract marker, and pending review state. `audit-r3-freeze.mjs --check` was also observed RED with `r3-factual-drift.json does not match deterministic R3 freeze output` before the three R3 freeze artifacts were materialized; it is now GREEN byte-for-byte.

Fresh complete regression command:

```text
node --test content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/r1-correction-contract.test.mjs content/work/05-art-architecture/r1-originality.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs content/work/05-art-architecture/r2-editorial-family.test.mjs content/work/05-art-architecture/r2-final-output-recurrence.test.mjs content/work/05-art-architecture/r2-factual-source.test.mjs content/work/05-art-architecture/r3-editorial-final-byte.test.mjs content/work/05-art-architecture/r3-factual-drift.test.mjs
```

Result: 18 tests passed, 0 failed.

### Factual drift requiring R4 review

The editorial repair preserves all factual-R3-approved propositions except these eight source-supported replacements, which are enumerated with exact pinned extract markers in `r3-factual-drift.json` and deliberately remain unapproved:

- 0215: `Two to five players` from the pinned Ra revision (`two to five players`);
- 0222–0225: `Francis I`, `Vincenzo Peruggia`, `1914`, and `US$100 million` from the pinned Mona Lisa revision, replacing the cross-set repeated proposition family;
- 0399–0400: `Four issues` and `Mid-1992` from the pinned Archie Sonic revision, replacing repeated Archie Comics propositions;
- 0403: `October 1968` from the pinned Golgo 13 revision, replacing the repeated Takao Saito proposition.

All other 492 propositions retain the factual R3 boundary. R4 factual review must adjudicate all eight changed propositions; the R3 approval is not carried forward to them.

### Source, validator, audit, determinism, and containment evidence

Every distinct final source was freshly read after correction:

```text
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r3.json --source-cache content/work/05-art-architecture/source-check-cache-r3.json
```

Result: 99/99 permanent revisions returned HTTP 200. `source-check-r3.json` is `933d9aff2e22c3f46db5a20f8545cbc056719797a1b07eb1e107d2a74790b57b`; its cache is `026d29334683ca2fc3d4395dc4dcc703f76717ab282376ed9a535ba6372bf8d6`; the deterministic R3 readback summary is `c562ae0fb37160ffdb2cd67b9f1058109a395d7fa84b1f1f45ded936e340f35a`.

The shared validator was freshly run with:

```text
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r3.json
```

It has no content, source, taxonomy, variant, copyright, or changing-date finding. Its only findings are the expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`; report SHA-256 `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`.

The candidate build, draft build, candidate audit, 58-candidate replacement-supply audit, draft audit, validator, and R3 freeze check were run twice consecutively. Both initial-to-pass-one and pass-one-to-pass-two hash comparisons were empty. Final freeze pins are:

- `authored.csv`: `8a0f3609cd2338baba807d7626118fe04658ea1f6d459c060add90020cd19ca0`
- `evidence.pending.jsonl`: `c13950075042c64b8db30673b230568892148647ed4792eaecec8a5cb9aad04a`
- `editorial-calibration.json`: `b0095fe2cd5aea657abe662bffa916d3740ec3392581690d4532fbd0c65c3c82`
- `source-manifest.json`: `303195bfc0d1791eabb7b2c9c38cc99be93837cf01ad14866b0a283c08ad3f3e`
- `structure-diagnostics.json`: `f563e2e196e96c3502f1a97857f2dcf8ec3b56fc2f53731e893306dfda57fdc4`
- `draft-checkpoint-0100.json`: `b2b9f7cdb3684d2ae6fec12b842a58844b89e84d8666a2a083b5eb7f363d5932`
- `data/candidate-selection.json`: `0cfc16f183789d4e9aea7b3bce9a2ed9b07355835f0546762d8e715c28fa51b9`
- `candidate-supply-audit.json`: `ad464d2ae2349ac145fadf6efc8ba8ee968362ace1b01fd24485ba58dde6c054`
- `r2-replacement-supply-audit.json`: `74f0400a09266e11bcff2a479b9bcb3713e43481c629aa11de957869d9ac2849`
- `draft-audit.json`: `99c7e6ce1e288286959eb71df0016fc444432b396d420f32907dc22b7a48fd0b`
- `r3-factual-drift.json`: `5d5030a248ef0282b9fbae483850381daafaf10c95962563432ab6fb5529cd9e`
- `r3-frozen-checkpoint.json`: `cabb44c0d52e0d9e3db3d0a75e3df757a1d4238e43ffe73ba54525e76f443e03`

`r3-frozen-checkpoint.json` has an empty issue array and records passing candidate, replacement-supply, taxonomy, structure, editorial-family, recurrence, leak, duplicate, standalone/canonical, variant, content, copyright, live-source, and containment gates.

Accepted and canonical paths remain byte-identical: accepted authored `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, generated `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, report `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, canonical docs progress `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent. The immutable OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

No translation, approval, accepted/shared/docs/progress/index publication, staging, or commit occurred. The only remaining content concern is the deliberate eight-row factual drift requiring independent R4 adjudication; the full R3 correction freeze is otherwise ready for independent factual and editorial R4 review.

## R4 editorial correction freeze

R4 is frozen for independent R5 factual and editorial review. Before any correction write, the authoritative factual review matched SHA-256 `a14b10fc9a33d182e221915d3b7b71c336991b60b438bcd1a5575037e2f4abd4` and the correction-required editorial review matched `ab11db66926b3ce2c6c13c782d2ff470601e6cc6ed2a3153d1788a66faaa1fa4`. All 16 factual embedded pins and all 15 editorial embedded pins were checked before mutation; every expected and actual value matched. The factual artifact approved its reviewed R3 boundary at 500/500 rows and 99/99 permanent sources with zero findings. The exact R3 takeover reconstruction is sets `af7fa815aa2fb6e0d253980b026960edd0b0c72a0936f1f7f905df9eadaee345` and sources `5554a343fa5abf97cd7585dee7e567f2917c2d43d6f4fe4de9afc3f2a1baa144`.

The deterministic R4 layer materializes every editorial tuple in final player-facing bytes:

- 28 backward clue-answer disclosure events across 18 sets are closed: 25 exact and three morphological/accepted-variant events;
- all 43 post-answer explanation disclosure events, represented by 42 unique source-target pairs across 37 sets, are closed while retaining independent source-backed explanatory detail;
- both duplicate/inverse pairs and both repeated-canonical-response pairs are replaced, covering four rows in each family;
- all three standalone/response defects and all nine doubled true/false frames are corrected;
- all 44 thin/circular explanations have concrete supported detail, all 18 inconsistent rationale tuples carry the correct recall classification, and all five note tuples carry the correct progression classification;
- all 69 adjudicated difficulty sets use an explicit new fact order different from the exact R3 prior. The global allocation remains Easy 17/16, Medium 17/17, Hard 16/17, with ten populated registered leaves and no leaf above 15 sets;
- the 500 rationales and 100 notes remain normalized-unique, name their current targets/endpoints, and have maximum repeated 12-grams of four and one respectively.

### R4 RED to GREEN evidence

The review-derived behavior test was written against final CSV/calibration bytes before the R4 implementation:

```text
node --test content/work/05-art-architecture/r4-editorial-final-byte.test.mjs
```

Its first implementation-gate run passed only the review-pin/inventory check and failed all nine intended behavior groups: backward clue leaks, explanation leaks, duplicate/repeated responses, standalone/true-false defects, thin explanations, rationale/note classifications, 69-set order, exhaustive leak scanning, and final standalone/canonical/variant contracts. After materialization it passed 10/10. A later audit-derived RED run exposed that the new `Animating on ones` fact still carried its superseded rationale/note; the strengthened rationale/note test failed on set 61 before the calibration repair and is now green. It also gates all 500 rationale targets, all 100 note endpoints, and the four-row maximum 12-gram recurrence.

The deterministic freeze check was observed RED before materialization:

```text
node content/work/05-art-architecture/audit-r4-freeze.mjs --check
```

It failed with `r4-factual-drift.json does not match deterministic R4 freeze output`. After creating the exact drift/readback/checkpoint outputs, the same command exits zero with an empty issue array.

The complete historical/current regression command is:

```text
node --test content/work/05-art-architecture/*.test.mjs
```

Result: 29 tests passed, 0 failed. The R2/R3 final-output contracts now follow stable reviewed fact identities through R4 tier reordering instead of treating a tier-derived clue ID as a permanent proposition identity; their source, recurrence, drift, canonical, and standalone assertions were retained. Where R4 deliberately supersedes the R3 standalone wording for 0071 and 0166 to remove answer disclosures, the historical test asserts the exact stronger R4 prompt.

### Exhaustive scans and audits

The independent freeze audit performed 2,600 response/variant-to-clue comparisons and 2,600 response/variant-to-explanation comparisons across all 500 rows and 100 sets. Final blocker counts are zero forward clue disclosures, zero backward clue disclosures, and zero explanations disclosing a future answer. The reverse explanation scan records 52 references by a later post-answer explanation to an answer already shown in an earlier tier; these are non-spoiling context and are retained as informational events rather than deleted. All 28 authoritative backward-clue tuples and all 43 authoritative future-answer explanation events are independently zero.

Fresh audit commands:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-r2-replacement-supply.mjs
node content/work/05-art-architecture/audit-draft.mjs
node content/work/05-art-architecture/audit-r4-freeze.mjs --check
```

All exit zero. The final corpus has 500 unique clue IDs, 500 unique normalized clues, 500 unique assertions, 500 unique evidence fact keys/source IDs, 100 unique categories, 100 distinct immutable OpenTDB candidate mappings, and no within-set repeated canonical response. The 58-candidate replacement-supply audit, taxonomy/cap/allocation audit, source/evidence/manifest binding audit, standalone and true/false utility audit, duplicate/inverse audit, variant audit, originality audit, and copyright audit all have no issue. Copyright remains zero long-verbatim clues, zero quoted fragments over ten words, zero bundled images, and CC-BY-SA-4.0 only.

Every distinct final permanent revision was freshly read after the correction build:

```text
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r4.json --source-cache content/work/05-art-architecture/source-check-cache-r4.json
```

Result: 99/99 unique URLs returned HTTP 200, zero failures. `source-check-r4.json` is `7b094570937ca04a679200da6e03141ebeef1925c745fe004fb6984681bbfbad`; the cache is `f0580d2f97827f04395eb409784ffb0c846407b61fa58da36588d7b3114bad62`; the deterministic readback summary is `30fefc8848f67af0356c8d2bac2a02c8bf497907be21ddf327a65d6ccd6f1fcb`.

The shared validator was freshly run with:

```text
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r4.json
```

Its only findings are the expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. There is no content, source, taxonomy, variant, copyright, or changing-date finding. Report SHA-256: `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`.

### R4 factual drift requiring R5 review

`r4-factual-drift.json` enumerates every player-facing byte change by stable prior fact identity and final tier. Of 500 rows, 388 player-facing rows are byte-identical to factual R4, while 112 changed rows require independent R5 readjudication: 19 editorial clue paraphrases, 89 supporting-detail/context changes, and four new propositions. All 500 retain their prior permanent source URL; source changes are zero. The four necessary new propositions and their pinned extract markers are:

- original 0178, Orange: `585–620 nanometres`, marker `585 and 620 nanometres`;
- original 0184, emerald colourant: `Chromium`, marker `emerald, which is colored green by its chromium content`;
- original 0247, Tajikistan’s star arc: `Seven`, marker `arc of seven stars`;
- original 0305, quick animation timing: `Animating on ones`, marker `necessary to revert to animating on ones`.

Each marker validates against the bound permanent set-source extract. The drift artifact is `e3839d5a00f88507ae730c4dece9fdb7113e5fb596e6296ee0556fe3ea5e5600`. Factual R4 approval is not carried forward to any of the 112 changed player-facing rows; R5 must explicitly adjudicate the four new propositions.

### Determinism, final pins, and containment

The candidate build, draft build, candidate audit, replacement-supply audit, draft audit, validator, and R4 freeze materialization were run twice consecutively across 20 artifacts. Baseline-to-pass-one and pass-one-to-pass-two comparisons both had zero hash drift. Final SHA-256 values are:

- `data/candidate-selection.json`: `0cfc16f183789d4e9aea7b3bce9a2ed9b07355835f0546762d8e715c28fa51b9`
- `authored.csv`: `a64129c7fb4e6728f47642d709d3c90d897c250405ed52fcd52ec81387d0a8c2`
- `evidence.pending.jsonl`: `1fc334c30ccaaa7cec93725849a12d4a2e3b1acbc4d3a0f0b0da639f92e34a52`
- `editorial-calibration.json`: `10a4cd63b10c85c933b4ddedb0808a360ca9e9c7c2a2956377701f7277b9ed19`
- `source-manifest.json`: `03df2c3f4ca85a99763aebd76a7f868bdd68aed8293694df6687d78314ca586d`
- `structure-diagnostics.json`: `f563e2e196e96c3502f1a97857f2dcf8ec3b56fc2f53731e893306dfda57fdc4`
- `draft-checkpoint-0100.json`: `3ee9c7e6debc3490f83086f8d3b0682106aeb1d29270f8bb9a39be2eecb1824d`
- `candidate-supply-audit.json`: `ad464d2ae2349ac145fadf6efc8ba8ee968362ace1b01fd24485ba58dde6c054`
- `r2-replacement-supply-audit.json`: `a280c4c2c94a6967f8b6455555201b7e78677c09df732c4f1c1cbf6b9cc5501e`
- `draft-audit.json`: `99c7e6ce1e288286959eb71df0016fc444432b396d420f32907dc22b7a48fd0b`
- `r4-editorial-corrections.mjs`: `226190777a572ee11509c2260d986b6406b50e5f494deb3716683678af6115c1`
- `r4-editorial-final-byte.test.mjs`: `12f9e845d238b9c0244eb5ba766d334d5a115ebef27a443ac813cac98fea0527`
- `audit-r4-freeze.mjs`: `7800771ecd9c870b9494d9f0ad92e2237b51ae38ca6119e96031f7d0fca31164`
- `r4-factual-drift.json`: `e3839d5a00f88507ae730c4dece9fdb7113e5fb596e6296ee0556fe3ea5e5600`
- `r4-source-readback.json`: `30fefc8848f67af0356c8d2bac2a02c8bf497907be21ddf327a65d6ccd6f1fcb`
- `r4-frozen-checkpoint.json`: `a7faac885b432d86a4743accda9fd5313e0f5da167947c69a95363643323f5c9`

`r4-frozen-checkpoint.json` has an empty issue array and records the exact review/prior pins, all family counts, full leak-scan counts, source readback, expected validator blockers, factual drift, deterministic artifacts, and containment evidence.

Accepted and canonical paths remain byte-identical: accepted authored `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, generated `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, report `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and canonical docs progress `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent. The immutable OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

No translation, approval, accepted/shared/docs/progress/index publication, staging, commit, or release action occurred. The only required next gate is independent R5 factual/editorial review of this exact frozen R4 correction, including all 112 changed player-facing rows and the four new propositions.

## 2026-08-22 — R5 breaker remediation freeze awaiting fresh independent approval

This section records remediation of the exact factual and editorial breaker tuples returned by the authoritative R5 reviews. It does not claim factual or editorial approval. The resulting English corpus is frozen at `r5-frozen-checkpoint.json` solely for a fresh independent post-R5 factual/editorial review cycle.

### Fail-closed boundary and RED evidence

Before any corpus write, both authoritative review files, every supplied core pin, and all 19 editorial embedded pins were verified. The authoritative review hashes are:

- `reviews/factual-round-5.json`: `3de2b845225e1fdfe7f01146fb5fe829378eb8c3eac32717b35d8bf0efde8d36`
- `reviews/editorial-round-5.json`: `ae00d91313b2587cc803c8190b2a3b525b5c8415defc72d243a9716754343391`

The reconstructed exact R4 prior is `sets=5d1ee30b17f5a1c9fadd96ffe603222193740aa6cb6f6d585b49765e4a1cefb8` and `sources=5554a343fa5abf97cd7585dee7e567f2917c2d43d6f4fe4de9afc3f2a1baa144`. The pinned R4 freeze remained `a7faac885b432d86a4743accda9fd5313e0f5da167947c69a95363643323f5c9`; its artifact ledger proved every R5 embedded input pin, including the supplied authored, pending-evidence, calibration, manifest, drift, and freeze hashes.

Behavior-level RED was observed before the correction layer was connected:

```text
node --test content/work/05-art-architecture/r5-breaker-remediation.test.mjs
```

The initial adjudicated run had two passing boundary/baseline tests and eight expected failing behavior families: factual source/response binding, the colour/colours future-answer leak and FPS utility sequence, invalid broad variants/near-duplicate frames, exact thin explanations, rationale/note classifications, exact nonmonotonic sets, truthful taxonomy, and the exhaustive final-byte leak scan. After the final implementation, the same command passes all 10 tests. A separate deterministic-freeze RED was also observed when `node content/work/05-art-architecture/audit-r5-freeze.mjs --check` rejected the not-yet-materialized `r5-factual-drift.json`; the check passes after freeze materialization.

### Exact factual breaker remediation

- `0035`: `Kobicha` now asks a positive, standalone traditional-colour fact and binds only that fact to `Kobicha`, oldid `1288858543`. The explanation independently supplies the kelp-tea name and kimono-dye context.
- `0194`: `£60` retains the reviewed response and binds only the price fact to `List of London Monopoly locations`, oldid `1363792530`, whose table lists both brown-group properties at that price.
- `0335`: the canonical response is now the source’s literal title `Sunny Sketch`; the explanation distinguishes it from the separately licensed title `Sunshine Sketch` on `Hidamari Sketch`, oldid `1369170504`.
- `0378`: the unsupported Jiro Taniguchi proposition was not relabelled. Set 076 was truthfully replaced by a Louvre museum set bound to `Louvre`, oldid `1370474152`; original row 0378 projects to the independently supported Right Bank proposition.

The R5 factual review’s other 496 rows were treated as the protected prior. Editorial remediation necessarily changes 207 of those previously approved player-facing rows; those changed bytes are explicitly reopened rather than carrying approval forward. The final drift ledger has 211 changed rows and 289 byte-identical rows: 120 taxonomy-replacement propositions, two FPS utility replacements, nine proposition/wording changes, and 80 supporting-context changes. All four prior factual breakers are among the 211 and all 211 are marked as requiring fresh independent factual approval.

### Exact editorial breaker remediation

- `0308>0310`: the earlier RWBY explanation no longer contains colour, colours, or a morphological equivalent of the later answer.
- `0304` and the FPS teaching sequence: set 061 is genuinely replaced/reordered as `frame-rate`, `illusion`, `quick-motion`, `flicker-threshold`, `image-duration`; `Frames per second` and `2` are no longer canonical responses.
- `0400` and `0405`: the invalid broad year variants are absent; both facts are superseded by truthful taxonomy replacements rather than cosmetically edited.
- Near-duplicate frames `0198/0199` and `0327/0328` now test different, standalone angles below the R5 similarity threshold.
- All exact 109 thin explanations now contain concise independent, source-supported context; none retains its R4 confirmation-only bytes.
- All exact 18 rationale and 12 calibration-note classification mismatches now name the current endpoint and its actual burden. Maximum repeated 12-gram recurrence is three for rationales and one for notes.
- The exact ten nonmonotonic sets are materially reordered or replaced: `005`, `007`, `028`, `040`, `051`, `057`, `061`, `080`, `092`, and `098`.
- The exact 24 taxonomy-mismatched sets are genuinely reauthored under supported Art/Architecture leaves: `046–050`, `054–055`, `065`, `068`, `072`, `074–085`, `094`, and `097`. No flag, comic, manga, anime, tank, football, or CR7 subject was merely relabelled.

The truthful replacement source pins are: `046 The Beehive@1364886091`; `047 Sigiriya@1367952186`; `048 Senedd building@1367502849`; `049 Olympiastadion (Berlin)@1363187111`; `050 Crown Fountain@1336318929`; `054 The Red Studio@1361443273`; `055 Monte Carlo Casino@1365291214`; `065 Dalí Theatre and Museum@1365806124`; `068 Hasegawa Machiko Art Museum@1271718924`; `072 New Amsterdam Theatre@1370041814`; `074 Pompeii@1366729228`; `075 Kunsthal@1363327905`; `076 Louvre@1370474152`; `077 The Night Watch@1370533738`; `078 National Gallery of Art@1368982424`; `079 Walt Disney Concert Hall@1369637385`; `080 Fallingwater@1364783497`; `081 Gum arabic@1370406664`; `082 Liberty Place@1364538607`; `083 New Museum@1365429236`; `084 Naples yellow@1279359922`; `085 Sydney Opera House@1369640428`; `094 Museum of Modern Art@1356169714`; and `097 Copper in architecture@1369258424`.

Final registered-leaf allocation is `architecture=8`, `artists=15`, `buildings=14`, `design=15`, `materials-techniques=8`, `movements=2`, `museums=11`, `painting=9`, `photography-history=13`, and `sculpture=5`. All ten leaves remain populated, no leaf exceeds 15, and the six-cell 17/16/17/17/16/17 set allocation is unchanged.

### Source and candidate drift

`r5-factual-drift.json` enumerates every player-facing and source projection by stable R4 fact identity. Source bindings changed for exactly 122 rows: all 120 rows in the 24 truthful taxonomy replacements plus the fact-specific Kobicha and London Monopoly price bindings. The other 378 row-source bindings are unchanged. The final corpus has 101 distinct permanent-revision URLs.

Six candidate mappings changed because their prior answers could not truthfully inspire the replacement set; the other 94 direct mappings remain unchanged and all final IDs still come from the immutable 2,500-row OpenTDB pool:

- set 065: `opentdb:494dbdcd3f4b8c9ec952aa39f0e237bb9700dd7f` → `opentdb:d1a6f4ebd648250fdd7582dc14aa71c7c7998ae8` (`Salvador Dali`)
- set 074: `opentdb:3c94519c7b872ba931f74d1870958751052aca4b` → `opentdb:1cd21a2f8283fd293c208fa42e7eefe5935014ac` (`Italy`)
- set 076: `opentdb:1c468c861fa92be649ea780e144d9c6702f9428b` → `opentdb:55aca9f8cdf0e94326af0e367e430054c4f47a04` (`The Mona Lisa`)
- set 080: `opentdb:47bcbd1ee252a1d6143e01a6ab7e4802cd31c8a6` → `opentdb:b13647414fe6bdc55d701b3fb9284926b546e0ac` (`False`)
- set 081: `opentdb:ae261b9ccfcfe5915a507017dd5ba784c419d3c5` → `opentdb:a28d7b30b919cb0728cbd5d33a7308b028220928` (`Acacia`)
- set 097: `opentdb:61574f048f65ad348a6044361d808755a1191b94` → `opentdb:f5bf55feab867296eed078e4688af545bb0dd2b2` (`Copper`)

`r5-candidate-drift.json` contains the complete before/after candidate records and reasons. The candidate supply audit remains empty, with 100 distinct final candidates and immutable-pool SHA-256 `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

### GREEN verification, source readback, and validator

The final GREEN command set was:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
node --test content/work/05-art-architecture/r5-breaker-remediation.test.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r5.json --source-cache content/work/05-art-architecture/source-check-cache-r5.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r5.json
node content/work/05-art-architecture/audit-r5-freeze.mjs --check
```

The R5 behavior suite passes 10/10. The freeze audit independently makes 2,920 response/variant-to-clue comparisons and 2,920 response/variant-to-explanation comparisons across all 500 rows. It records zero forward clue disclosures, zero backward clue disclosures, and zero future-answer explanation disclosures. All 500 clue IDs, normalized clues, evidence fact keys, assertions, source IDs, and category names are unique; variants, standalone utility, true/false form, candidate inspiration, duplicates/inverses, taxonomy, allocation, calibration, source/evidence/manifest binding, originality, and copyright checks pass. Copyright remains zero long-verbatim clues, zero quoted fragments over ten words, zero bundled images, and CC-BY-SA-4.0 only.

The new empty source cache forced a fresh HTTP read of every distinct final source. All 101/101 permanent-revision URLs returned HTTP 200 with zero failures. `source-check-r5.json` is `37c5994037da7ad47277b7d3c5c6077751add5bbae91e901a35c87ea26cb77bd`; its cache is `19f9d77a25062c4f150a3683cec1f558f4a88a4f02b0f854c670b9977e835b0b`; deterministic readback summary `r5-source-readback.json` is `cffed194299631112aed9045322be4395a561fdd76e69ab61091638d3042832d`.

The shared validator’s only findings are the expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. There is no content, source, taxonomy, variant, duplicate, copyright, or undated-changing-fact finding. Its deterministic report is `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`.

### Determinism, frozen pins, containment, and remaining gate

Two consecutive full rebuild/audit/validator/freeze cycles were compared across 17 artifacts. Baseline-to-cycle-one and cycle-one-to-cycle-two were both byte-identical. Final SHA-256 values are:

- `authored.csv`: `8a84ca0fcad950d2ebd00b0ba68ee1955adb7b31d9dff360d71b8653c3b5554a`
- `evidence.pending.jsonl`: `96882d4521dc558873dee5884a9c46e9b7d36130d93d3c8c02636e9f6b339da5`
- `editorial-calibration.json`: `4567f453da64b1ee82c81dcf88431d709afbd0b9328f9ec66b3545059d89c47a`
- `source-manifest.json`: `c080c5bdd046524f50b839a6fc266d15ac26beccbabb22574bd643af519cd527`
- `data/candidate-selection.json`: `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`
- `candidate-supply-audit.json`: `c7734c636405a3a9dc67d80e392dfb48cc6149a4f5ab0955992a0505f634936c`
- `draft-audit.json`: `d714d7d7d75e5dc65e549310edf556955b66bf921faac6f92acd05438a28253f`
- `r5-breaker-corrections.mjs`: `d8a361814fda8de9b21561dcaf5e8ae7aec6326d4af49e800ab521a90a921aec`
- `r5-breaker-remediation.test.mjs`: `7b3518d17597c6ed7470bd567787b6a901e3ebd48bc1e8b8ab1c770e29502938`
- `audit-r5-freeze.mjs`: `4934b535f6fa271ba0337442e3100f54cf38d5ed6f04f1f6936883f98881f721`
- `r5-factual-drift.json`: `e18fcaf36c8718bd111aac5ffaa52c5e64c980885a05330d1272721a62117826`
- `r5-candidate-drift.json`: `49c5050d3b77b238f7caccb4595e14d6a3b1a4dca0302ae685c286ef933e8e8e`
- `r5-source-readback.json`: `cffed194299631112aed9045322be4395a561fdd76e69ab61091638d3042832d`
- `r5-frozen-checkpoint.json`: `59d88a6da9627c803743dc02b955e6dff1f01f92cf091c09794c8d180936e8ad`

The frozen checkpoint has an empty issue array and explicitly records `factual=false`, `editorial=false`, `translation=false`, and `publicationAuthorized=false`. Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent.

No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The explicit review-cycle-cap ruling is the only deviation from the nominal five-round process. The remaining gate is fresh independent factual and editorial approval of this exact frozen remediation corpus, including all 211 changed player-facing rows, 122 changed source bindings, and six candidate reallocations.

The unchanged general contracts were also re-run with `node --test content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs`: 4/4 tests pass for distinct immutable inspirations, direct-semantic replacement supply, 100 complete frozen-English sets, and resilient source fetching.

## 2026-08-22 — R6 closure remediation freeze awaiting independent R7

This section records closure of the real factual and editorial tuples in the authoritative R6 reviews. It does not claim factual or editorial approval. The resulting English corpus is frozen at `r6-frozen-checkpoint.json` only for fresh independent R7 review.

### Fail-closed boundary, adjudication, and RED

Before any corpus write, both authoritative R6 files and every embedded pin were read and verified:

- `reviews/factual-round-6.json`: `8db7273caf61650046ed65bef47754037863a6a815a9e903cb3eea22286825e2`
- `reviews/editorial-round-6.json`: `45d9c6619837124233317e872fb96bfe790ba473296c3087e8cd88377f71adf8`
- reconstructed exact R5 sets: `e547a9fb9b50a1daea3993dee4cfa78db5a653ea26defe37688280b5858731db`
- reconstructed exact R5 sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- pinned R5 freeze: `59d88a6da9627c803743dc02b955e6dff1f01f92cf091c09794c8d180936e8ad`

The two reviews agree on all overlapping pins. Their combined inventory contains 33 checks across 17 distinct R5 files; every expected byte was present either as a preserved file or in the pinned R5 artifact ledger.

Factual finding `R6-002` received no corpus workaround. The ledger’s explicit adjudication was applied: `.superpowers/sdd/2026-08-13-production-content-recovery/task-13-report.md` is the Art/Architecture report, and its R5 section was already present. Only factual `R6-001`, clue `0137`, was a real corpus blocker.

Behavior-level RED was observed with:

```text
node --test content/work/05-art-architecture/r6-closure-remediation.test.mjs
```

The exact-prior run passed two boundary/baseline tests and failed the expected eight behavior families: stable Burj height; variants/canonical/standalone/date precision; the two semantic true/false pairs; category disclosures; 80 explanations; rationale/note classifications; seven nonmonotonic sets; and exhaustive final-byte contracts. After remediation, the same suite passes 10/10.

### Factual and row-contract closure

- `0137` no longer makes an undated world-superlative claim. It asks for Burj Khalifa’s stable architectural height, canonical `828 metres`, with exact equivalents `828 m`, `2,717 feet`, and `2,717 ft`, bound to `Burj Khalifa@1367809157`.
- Necessary collision prevention at `0140` preserves the distinct tip measurement as `829.8 metres`, with `829.8 m`, `2,722 feet`, and `2,722 ft`, on the same permanent revision. Neither row discloses the other measurement.
- `0065` and `0196` have no partial-person or partial-building accepted variants.
- `0141` asks only for the coaster name; canonical `The Smiler` is complete for that clue, while the two full location-qualified forms remain accepted, on `The Smiler@1369499316`.
- `0305` names Mary C. Potter and the rapid serial visual presentation experiment in the clue; its explanation identifies *Detecting meaning in RSVP at 13 ms per picture*, on `Frame rate@1369634927`.
- The prior `0061>0062` semantic answer disclosure is removed. `0062` is now the independent false proposition “Meta Platforms developed Snapchat,” with Snap Inc. context on `Snapchat@1369859663`.
- The prior `0427>0429` semantic answer disclosure is removed. `0429` is now the independent true proposition that *Psycho* was based on Robert Bloch’s 1959 novel, with Joseph Stefano adaptation context on `Psycho (1960 film)@1368981671`.
- `0221` no longer presents `1504` as a precise completion year. It asks for the alternate proposed start year alongside 1503 and explains the Louvre’s broader 1503–1506 span and remaining uncertainty, on `Mona Lisa@1370187675`.
- Exhaustive validator closure also changed `0255` from an undated “current flag” frame to the stable question “In what year was New Zealand’s national flag formally adopted?” The canonical remains `1902`, on `Flag of New Zealand@1366588754`.

No source binding changed for any of these rows.

### Exact editorial tuple closure

All 80 exact thin-explanation ordinals were replaced with concise independent context and checked against their permanent sources:

```text
0013 0018 0019 0031 0034 0037 0044 0045 0067 0068 0069 0070 0074 0088 0089 0091
0102 0103 0104 0105 0135 0143 0151 0154 0158 0159 0164 0166 0168 0171 0172 0174
0178 0183 0208 0211 0212 0252 0254 0255 0256 0257 0262 0264 0265 0279 0282 0283
0284 0285 0286 0288 0289 0291 0296 0310 0315 0316 0317 0318 0344 0348 0353 0354
0355 0365 0428 0435 0444 0445 0448 0452 0453 0457 0459 0460 0486 0490 0492 0495
```

In particular, `0252` now adds the Southern Cross’s navigation-emblem and wider flag context instead of merely repeating the response. Every exact explanation has at least 14 words and at least nine words independent of its response. Factual spot-checks made during finalization also removed an unsupported executive-producer claim at `0284` and replaced it with the pinned page’s Toho distribution and Hayao Miyazaki credit context; `0174` now uses the pinned page’s documented 1971 public-domain trademark history.

All exact rationale mismatches were regenerated against the current endpoint and actual burden:

```text
0038 0140 0174 0195 0225 0250 0305 0338 0340 0370 0375 0385 0400 0418 0457 0485
```

All exact calibration-note mismatches were regenerated against both current endpoints and their actual opening/closing burdens:

```text
039 045 050 061 068 069 074 075 077 080 097
```

Set `069` now explicitly opens on title/work identification and closes on production-studio identification for `Studio Chizu`; it no longer calls the studio a character. Maximum repeated 12-gram recurrence is three across rationales and one across notes.

The exact nonmonotonic sets were genuinely reordered, with all five fact identities retained and the global allocation unchanged:

- `001`: `artist`, `movement`, `memory-year`, `birthplace`, `late-style`
- `006`: `creator-negation`, `collection`, `sitter`, `support`, `modelling`
- `015`: `not-van-gogh`, `artist`, `survival-support`, `year`, `collection`
- `020`: `dummy-funnel`, `sinking-date`, `class`, `builder`, `funnel-use`
- `032`: `logo-animal`, `iconic-model`, `city`, `founder`, `crest-year`
- `063`: `medium`, `figures`, `creator`, `network`, `co-creator`
- `073`: `colour-film`, `illusion`, `director`, `release`, `source`

All 29 reviewed answer-disclosing category sets were renamed across all five rendered rows:

```text
010 A Monogram across Printed Sheets
011 An Anxious Figure beneath a Curving Sky
012 A Northern Master’s Cabinet Sheet
015 Peril Lit by Morning Sun
016 A Farmhouse Portrait with a Pitchfork
017 A Monumental Protest Canvas
040 Manufacturing a Classic Property Game
041 Designing an Eight-Bit Platform World
048 A Legislative Building by the Waterfront
049 A Monumental Arena in Germany
051 A Blue Ensign for a Pacific Nation
054 A Flattened Studio Interior
062 An Initialled Web Series
067 A Student’s Slice-of-Life Panels
068 A Private Museum from a Cartoonist’s Collection
072 A Broadway Theatre’s Contrasting Styles
074 A Buried Roman City’s Streets
075 A Circulation-Driven Exhibition Hall
077 A Civic Guard Group Portrait
078 A Triangular Gallery Addition
080 Cantilevers in Rural Pennsylvania
082 A Postmodern Skyline-Breaking Tower
084 A Historic Opaque Pigment
086 A Low-Budget Motel Thriller
088 A Shadow across Wisborg
089 A Buffalo Bill Investigation on Film
097 Architectural Uses of a Durable Metal
098 Rack, Tiles, and a Gridded Board
100 An Aspiring Painter before Politics
```

The exhaustive final-byte scan additionally caught and removed category answer disclosure in set `025` (`Principles for a New Domestic Form`) and set `043` (`Symbols and Disasters across Three Epochs`). Reordering-dependent frames were updated for set `063` (`Rapid-Fire Pop-Culture Parodies`) and set `073` (`Murder inside a Manhattan Penthouse`). Thus 33 category names, 165 repeated CSV category cells, and every corresponding rationale/note frame changed; the authoritative 34 flagged row occurrences are all covered.

### Exhaustive final-byte audits and drift

The freeze audit compares every canonical response and accepted variant against its category, every other clue in both directions, and every other explanation in both directions. It made 729 category comparisons, 2,916 cross-clue comparisons, and 2,916 cross-explanation comparisons. Results are zero category disclosures, zero forward clue disclosures, zero backward clue disclosures, and zero future-answer explanation disclosures. The 31 exact references from a later explanation to an already-answered earlier response are enumerated in the frozen checkpoint rather than silently discarded; sequence-aware adjudication treats them as non-leaking prior-answer context. Explicit semantic checks for both true/false pairs are also zero.

Canonical/variant completeness, standalone form, true/false utility, exact and semantic duplicates, registered taxonomy, leaf cap, source/evidence/manifest alignment, direct candidate inspiration, and copyright are green. The final leaf allocation remains `architecture=8`, `artists=15`, `buildings=14`, `design=15`, `materials-techniques=8`, `movements=2`, `museums=11`, `painting=9`, `photography-history=13`, and `sculpture=5`; no leaf exceeds 15. Copyright remains zero long-verbatim clues, zero quoted fragments over ten words, zero bundled images, and CC-BY-SA-4.0 only.

`r6-factual-drift.json` enumerates every R5 fact by stable identity, final ordinal, changed fields, source, prior R6 verdict, correction families, and next gate. Exact R6 drift is:

- 89 facts have changed player-facing fact bytes: all exact 80 explanation rows plus the nine other distinct correction rows; `0255` is already within the 80-row explanation inventory.
- 26 facts move to a different ordinal under the seven genuine reorderings; the union of byte-changed or reordered facts is 110.
- Of those 110, one is the prior factual blocker and 109 were R6-approved facts whose changed position or bytes are explicitly reopened for R7.
- 33 category names change 165 rendered category cells, enumerated separately.
- Source-binding changes are zero; all 500 fact-source bindings remain the exact R5 source set.
- Candidate changes are zero; all 100 mappings remain byte-identical at `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`.
- The immutable 2,500-row OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

The drift ledgers are `r6-factual-drift.json=b99ee79e54a1b2a662f2a4efef608e29d4a28b7d3a1f0ea52abde48d622547c4` and `r6-candidate-drift.json=efd3d76fe2d359696fcf630823efe679e8ccf7c9dbe066724b9652d4d7349623`.

### GREEN verification, fresh source readback, and validator

The final GREEN cycle used:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r6.json --source-cache content/work/05-art-architecture/source-check-cache-r6.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r6.json
node --test content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs content/work/05-art-architecture/r5-breaker-remediation.test.mjs content/work/05-art-architecture/r6-closure-remediation.test.mjs
node content/work/05-art-architecture/audit-r6-freeze.mjs --check
```

The selected current-contract suite passes 24/24, including R5 takeover preservation and all 10 R6 behavior families. Historical pre-R5 replacement tests are intentionally not a current contract because their superseded fact identities cannot project through the accepted R5 taxonomy and utility replacements.

An empty R6 cache forced a fresh read of the full final source set after source finalization. All 101/101 permanent-revision URLs returned HTTP 200 between `2026-08-22T19:50:09.753Z` and `2026-08-22T19:50:22.937Z`, with zero failures. `source-check-r6.json` is `88f7eb50e2e1a7f5ba213cf0b317db136eb4b59c8033fca5024e704cd6102a8b`; its cache is `034fdfa9809c80ee382093eeccd04b1ba4b45de972eb712827304dd805206824`; `r6-source-readback.json` is `9868a28dc0b34934b0c95fdafff14254eb4997bd2bc6dcadb13eb75cb1ae5c55`.

The shared validator exits nonzero only for the intentional unpublished-workflow gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. There is no content, factual, source, taxonomy, variant, duplicate, copyright, or `UNDATED_CHANGING_FACT` finding. Its deterministic report is `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`.

### Deterministic freeze, containment, and remaining gate

Two consecutive full candidate-build, corpus-build, audit, source-check, validator, selected-test, and freeze cycles were compared across 19 artifacts. No byte changed between cycles, and a final `audit-r6-freeze.mjs --check` passed with an empty issue array. Final SHA-256 values are:

- `authored.csv`: `21774f48a1d4cc5eb53b051b989a8b4dd64b8aa078171ccd2bab3b49e7cf0d40`
- `evidence.pending.jsonl`: `9a8ad2713c345a69938ed3a4184128a14c249184301e8873fea6c588814fc464`
- `editorial-calibration.json`: `ad70369bcf62254afdb8fcb2cbcb3fcb3c9c6bd314140817a20bf4fe1ca69153`
- `source-manifest.json`: `2f872fcf3733b0ad2b521423bf291a001d82b79f5890e8da68cb2f210cded423`
- `structure-diagnostics.json`: `64120e66fb83b472a1132aa4ba9a3f6e0570243ff689976ae2f388100c343b62`
- `draft-checkpoint-0100.json`: `65e83eb522011e02d0046a5c723867eecb6325656576049526e665e7f23a332f`
- `data/candidate-selection.json`: `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`
- `candidate-supply-audit.json`: `c7734c636405a3a9dc67d80e392dfb48cc6149a4f5ab0955992a0505f634936c`
- `draft-audit.json`: `d714d7d7d75e5dc65e549310edf556955b66bf921faac6f92acd05438a28253f`
- `build-draft.mjs`: `660a8b8b98f6e2bf3f9e23fcce9c50ffbd49d1e56ddce219d5a55c408f0d8166`
- `r6-closure-corrections.mjs`: `718144765b7705fd8d1bfc2d89ecf0b8e5a9fdc7474aac0525940c2eda033f9a`
- `r6-closure-remediation.test.mjs`: `20d4926220fe959af1b597ba8237d4449ff4c2f4f01caed1d814de16a0603ee2`
- `audit-r6-freeze.mjs`: `ec2a679a43773f85436101180a2a098d630179b46cc329230ad7a5b2fa4b8112`
- `r6-factual-drift.json`: `b99ee79e54a1b2a662f2a4efef608e29d4a28b7d3a1f0ea52abde48d622547c4`
- `r6-candidate-drift.json`: `efd3d76fe2d359696fcf630823efe679e8ccf7c9dbe066724b9652d4d7349623`
- `r6-source-readback.json`: `9868a28dc0b34934b0c95fdafff14254eb4997bd2bc6dcadb13eb75cb1ae5c55`
- `r6-frozen-checkpoint.json`: `a112527f4c579b1d8f91911a00cf987438dfd28cebd34e08106a0fbf9851d270`

Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent.

No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The only authorized persistent metadata write is this appended Task13 evidence section. The corpus remains explicitly unapproved; the sole next gate is fresh independent R7 factual and editorial adjudication of this exact frozen checkpoint, including all 89 changed fact bytes, 26 moved facts, 33 category frames, and the zero source/candidate changes.

## 2026-08-23 — R7 residual refinement freeze awaiting independent R8

This section records correction of only the residual tuples in the authoritative R7 editorial review. The authoritative R7 factual review approved the exact R6 corpus, all 500 factual rows, all 101 permanent sources, and all 100 candidate mappings. That approval is not carried onto changed R7 bytes or moved projections. The refined English corpus is frozen at `r7-frozen-checkpoint.json` solely for fresh independent R8 factual/editorial review; it is not approved or publication-authorized.

### Fail-closed boundary and behavior-level RED

Before any R7 corpus write, the two authoritative reviews and their combined 18 distinct embedded pins were verified exactly:

- `reviews/factual-round-7.json`: `d471e0ded21b9efdd18dd0d34bc99812b7a74c613f5d4741a070c351ed389523`
- `reviews/editorial-round-7.json`: `f52fa22edc6ee0f07aaf0bc0bde9b9693ae1fa6ae0a8df14c1b4d015ca05b1f4`
- reconstructed exact R6 sets: `e23909d1cc7c645d097d9e9d1247ee1e7dad7e7fdd7e14b0f608899e190cbd21`
- reconstructed exact R6 sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- pinned R6 freeze: `a112527f4c579b1d8f91911a00cf987438dfd28cebd34e08106a0fbf9851d270`
- pre-append authoritative Task13 report: `591dd79b36e4f787313af219991f967904014dff10abc857eabddd5c6a72d0ff`

The two reviews agree on every overlapping input. All 18 distinct pins were present either as exact preserved bytes or in the R6 frozen artifact ledger. The correction layer repeats these checks and fails closed before applying a change; the R7 freeze preserves the complete reviewed-prior pin map so this evidence append cannot erase the review boundary.

Behavior-level RED was established with:

```text
node --test content/work/05-art-architecture/r7-residual-refinement.test.mjs
```

The first test-only run exposed one incorrect test assumption: the combined review inventory contains 18 distinct pins, not 17. That boundary oracle was corrected before corpus implementation. The corrected exact-R6 RED run passed three immutable boundary/preservation baselines and failed the expected 69 tuple-level behaviors across 72 tests. After refinement, the same command passes 72/72. The failures covered every exact semantic pair, self-answer row, standalone row, thin explanation, rationale, note, reordered set, final-byte leak scan, and protected factual/source/candidate/taxonomy boundary rather than checking only implementation structure.

### Exact R7 editorial corrections

All eight semantic future disclosures were removed without weakening the source clue:

- `0007>0008`: the earlier explanation now adds east-facing landscape-series context and no institution/asylum answer.
- `0017>0018`: the earlier explanation adds the Niépce partnership and no plate-material answer.
- `0036>0037`: the earlier explanation adds the critical origin of the technique’s name and no later artist/perception answer.
- `0092>0093`: the earlier explanation contrasts transparent geometry with palace masonry and no entrance-function answer.
- `0186>0188`: the earlier explanation defines single-channel hexadecimal limits without enumerating the later channel triplet.
- `0308>0310`: set `062` is genuinely reordered as `creator`, `company`, `rule`, `initials`, `premiere`, placing the naming-theme answer before the initials clue.
- `0416>0420`: the clue now asks from the Mount Vesuvius origin speculation without stating the later historical distinction.
- `0419>0420`: the clue now asks for the two archaeological regions from glazed-brick/tile traces without stating that later distinction or leaking `Naples yellow` to the earlier row.

Self-answering `0405` now asks for the dichromate/pigment emulsion made water-insoluble by ultraviolet exposure; neither `gum` nor the `printing` answer stem appears in the clue. The five non-standalone or underdetermined rows now identify their subject independently: `0051` names *The Scream*, `0081` names *Guernica*, `0116` supplies the recessed-storey/ziggurat tower description, `0336` supplies the 1946–1974 ordinary-family premise, and `0486` names Scrabble.

All exact 45 thin explanations gained concise independent context on their unchanged permanent source bindings:

```text
0009 0025 0030 0050 0060 0065 0071 0079 0087 0099 0109 0111 0117 0118 0132
0133 0146 0147 0177 0179 0188 0192 0194 0195 0200 0205 0216 0280 0295 0298
0320 0326 0341 0351 0442 0451 0456 0462 0476 0480 0485 0488 0489 0493 0499
```

Each has at least 14 words and at least nine words independent of its response. The additions cover source-grounded historical, visual, material, production, game-design, or plot context, and the full semantic/variant scan confirms that none exposes a future answer.

Rationales `0315` and `0361` now name `co-creator or producer attribution` and `film-title identification`, respectively. Notes for sets `028`, `063`, `067`, and `073` name both current endpoints and the adjudicated opening/closing burdens. Maximum repeated 12-gram recurrence remains three for rationales and one for notes.

The three exact nonmonotonic sets were genuinely reordered while retaining all five approved fact identities:

- `006`: `creator-negation`, `collection`, `sitter`, `modelling`, `support`
- `032`: `logo-animal`, `iconic-model`, `founder`, `city`, `crest-year`
- `073`: `colour-film`, `director`, `illusion`, `source`, `release`

The separate semantic dependency in set `062` was also genuinely reordered as recorded above. All adjacent tiers were regenerated against the final typical-player burden, and the global 17/16/17/17/16/17 allocation is unchanged.

### Factual, source, candidate, and allocation drift

`r7-factual-drift.json` enumerates every R7-approved prior fact by stable identity, final ordinal, changed fields, correction families, unchanged permanent source, and R8 gate. Exact drift is:

- 58 facts have changed player-facing bytes: eight clue rows and 50 explanation rows. No response, fact key, accepted variant, category, or taxonomy leaf changed.
- Eleven facts move to a different ordinal across the four genuine reorderings. The union of byte-changed or moved facts is 68 because one enriched explanation also moves.
- The other 432 factual projections retain their exact player-facing bytes and ordinal. All 500 retain their exact R7-approved source binding.
- Source changes are zero; the final source set remains the same 101 permanent-revision URLs.
- Candidate changes are zero; all 100 mappings remain exact at `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`.
- The immutable 2,500-row OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.
- Registered-leaf allocation remains `architecture=8`, `artists=15`, `buildings=14`, `design=15`, `materials-techniques=8`, `movements=2`, `museums=11`, `painting=9`, `photography-history=13`, and `sculpture=5`; no leaf exceeds 15.

The drift ledgers are `r7-factual-drift.json=d2d4ad32dd3d8fa7bdb0f9932fef8d475849e7c9063056370b3dca79557c519f` and `r7-candidate-drift.json=013bb30a19b6f4aedacbcf5ddaa10fe9ea275ca3576b720b032dae8cfa76f081`.

### GREEN verification, source readback, and validator

The final GREEN cycle used:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r7.json --source-cache content/work/05-art-architecture/source-check-cache-r7.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r7.json
node --test content/work/05-art-architecture/r7-residual-refinement.test.mjs
node --test content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs
node content/work/05-art-architecture/audit-r7-freeze.mjs --check
```

The R7 suite passes 72/72 and the unchanged general contracts pass 4/4. The freeze audit reconstructs the exact R6 prior and exact R7 final projection, then makes 729 category, 2,916 cross-clue, and 2,916 cross-explanation canonical/variant comparisons with morphological normalization. It records zero category disclosures, zero forward or backward clue disclosures, and zero future-answer explanation disclosures. Thirty-six later-explanation references to already-answered responses are enumerated separately as non-leaking teaching context. All eight semantic pairs have separate manual-pattern checks with zero events.

Canonical/variant preservation and completeness, standalone/true-false utility, exact duplicates and cross-batch near-duplicates, explanations, calibration, difficulty, taxonomy, source/evidence/manifest binding, direct candidate supply, originality, and copyright are green. Copyright remains zero long-verbatim clues, zero quoted fragments over ten words, zero bundled images, and CC-BY-SA-4.0 only.

An empty R7 cache forced a fresh live read of all 101 final permanent-revision URLs after source finalization. All 101 returned HTTP 200 between `2026-08-22T20:55:29.238Z` and `2026-08-22T20:55:32.276Z`, with zero failures. `source-check-r7.json` is `9aa72e1b68e8f44939b822fdb7a7fa0a2fabf36ffb3e89c6afbf2ccce90dc1f8`; its cache is `4e2c0b10d9492f7ab61de9c4bc697b439f1d63f7f6e7bbd4fcfd5188e7aec77f`; deterministic `r7-source-readback.json` is `9566788b049fed979cc7c9ad02227ca62c2d306686a6108e328f41cb9484a528`.

The shared validator exits nonzero only for the expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. No content, factual, source, taxonomy, variant, duplicate, copyright, or undated-changing-fact issue appears. Its deterministic report is `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`.

### Deterministic freeze, containment, deviations, and remaining gate

Two consecutive full candidate-build, corpus-build, audit, cached-readback confirmation, validator, R7-test, and freeze cycles were compared across 23 artifacts. All 23 were byte-identical between cycles, and the final freeze check has an empty issue array. Final SHA-256 values are:

- `authored.csv`: `c84d9838862a2c0ca8a74b78a6055655f6cc3a29a373688640a9935630664252`
- `evidence.pending.jsonl`: `962e20fb8fa48f70a230b22ba81f59d48864de04d8061ab124c014246dd302eb`
- `editorial-calibration.json`: `a828622a61a38efc051d59eec1f581f9cdd6d1e36246a9e188b40ff8a6901306`
- `source-manifest.json`: `a35197037ce34bbbf707e5eb9b043f2c5322701f916efbff59ea9b37958c2f77`
- `structure-diagnostics.json`: `64120e66fb83b472a1132aa4ba9a3f6e0570243ff689976ae2f388100c343b62`
- `report.json`: `0862a8bc2c532e1a9f16ac0650ecb1caf0823ea714f1507d3d06b9856a994160`
- `draft-checkpoint-0100.json`: `85c81c4934da10944e4c6c51d656a031579d425b08873a88daf57753b13bda6c`
- `data/candidate-selection.json`: `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`
- `candidate-supply-audit.json`: `c7734c636405a3a9dc67d80e392dfb48cc6149a4f5ab0955992a0505f634936c`
- `draft-audit.json`: `d714d7d7d75e5dc65e549310edf556955b66bf921faac6f92acd05438a28253f`
- `build-draft.mjs`: `cf001733d1f1c8777e9b453efcd5977c65a241cc4ff21ee86bf246d15f58167f`
- `r7-residual-corrections.mjs`: `4e1cd1d31cb3470166c9b19bb9ff64486311ecef96c612e6cc893c95c0e53133`
- `r7-residual-refinement.test.mjs`: `50a3a782eebdc301a25ec39471f57e0d365ba677090ecde8aabbdd6b72b933a6`
- `audit-r7-freeze.mjs`: `8e7b1337fc1ba409a76323394e91354d4047c6d6f1976dd0a3e828e2fa6e171b`
- `r7-factual-drift.json`: `d2d4ad32dd3d8fa7bdb0f9932fef8d475849e7c9063056370b3dca79557c519f`
- `r7-candidate-drift.json`: `013bb30a19b6f4aedacbcf5ddaa10fe9ea275ca3576b720b032dae8cfa76f081`
- `r7-source-readback.json`: `9566788b049fed979cc7c9ad02227ca62c2d306686a6108e328f41cb9484a528`
- `r7-frozen-checkpoint.json`: `0b1aa3b52b92ced526b4a974f640dbced44f86759b686a7f958f108fdee4ebd1`

Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent.

There are no corpus-scope deviations and no new all-paths-guess constraint. The only test-harness deviation was the pre-implementation correction from 17 to the review files’ actual 18 distinct embedded pins; both review bytes and every pin remained immutable. No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The only authorized metadata write is this appended Task13 section. The remaining concern and sole next gate is fresh independent R8 factual/editorial review of the exact frozen checkpoint, especially the 58 changed player-facing facts and 11 moved projections; no R7 approval is claimed for those refined bytes.

## 2026-08-23 — R8 exact residual correction freeze awaiting independent R9

This section records correction of only the tuples authorized by the R8 residual ruling. The R8 factual review approved 499 rows and required correction of `0194`; the R8 editorial review required the three semantic pairs, one self-answer, one partial variant, three difficulty sets, four rationales, and two notes listed below. Neither review approval is carried onto changed bytes or moved projections. The resulting English corpus is frozen only for fresh independent R9 factual/editorial review and is not approved or publication-authorized.

### Fail-closed boundary and RED to GREEN evidence

Before the first corpus write, both authoritative review files, their exact tuple inventories, and all 25 distinct embedded pins were verified. The reviews agree on every overlapping pin:

- `reviews/factual-round-8.json`: `f2d69eaa741445fd22045c41a52c9f18ce7049891967b22c72edb5698dcb3a4b`
- `reviews/editorial-round-8.json`: `bb5ac6ffd496423393dd1ee59054d1d4b2f4baaee3bbbe051f96d74c6ab82461`
- reconstructed exact R7 sets: `c701fa4d0a62c3dce7c373e41beb7425cb59e43b711cc1119476b37af4912492`
- reconstructed exact R7 sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- pinned R7 freeze: `0b1aa3b52b92ced526b4a974f640dbced44f86759b686a7f958f108fdee4ebd1`
- pre-append authoritative Task13 report: `caad564e4cc57c3c4a2fa370c8fa0f2097256a8dab662e360ec8a875cbbe8d27`

The complete 25-pin reviewed-prior map is preserved in `r8-frozen-checkpoint.json`. The correction layer repeats the exact-prior sets, source set, reviews, R7 freeze, verdict inventories, concrete factual proposal, and embedded-pin checks before it can return a changed projection.

Behavior-level RED was observed with:

```text
node --test content/work/05-art-architecture/r8-exact-residual.test.mjs
```

Against the untouched R7 projection, the immutable boundary and baseline leak tests passed while all 16 intended correction assertions failed: factual `0194`; semantic pairs `0188>0190`, `0189>0190`, and `0404>0405`; self-answer `0122`; partial variant `0188=RGB`; sets `025`, `038`, and `081`; rationales `0030`, `0137`, `0160`, and `0221`; notes `006` and `032`; and the protected-projection assertion. After materialization, the suite passes 18/18.

The first post-build boundary run exposed a harness omission: after reviewed artifacts changed, the test consulted current bytes and a future R8 checkpoint but not the immutable R7 checkpoint that already records the reviewed hashes. The oracle was corrected to accept only those exact R7-recorded hashes; no pin or corpus assertion was weakened. The first deterministic-freeze check was also observed RED before materialization:

```text
node content/work/05-art-architecture/audit-r8-freeze.mjs --check
```

It rejected the absent `r8-factual-drift.json`. The generated freeze is now byte-for-byte GREEN under the same command.

### Exact factual and editorial corrections

Factual `0194` now uses the review’s exact source-faithful explanation: `Both brown properties carry the same £60 game value, below the £100–£120 values of the light-blue group.` It retains the bound `List of London Monopoly locations` revision `1363792530`; the unsupported rent assertion is gone.

The editorial corrections are:

- `0122` now asks which country naturalized Le Corbusier in 1930, with canonical `France` and complete variant `French`; the prompt contains neither answer form.
- `0188` asks for the three additive components without printing the acronym, retains canonical `Red, green, and blue`, removes partial `RGB`, and explains additive screen intensity without bytes, bit counts, transparency, or a future answer.
- R8-prior `0189` is replaced on the same permanent `Web colors` revision by independent `Alpha`/`Alpha channel` recall from the optional extra channel.
- R8-prior `0190` is replaced on that revision by the source-reported `4,096` colours represented by three-digit hexadecimal shorthand.
- R8-prior `0404` is replaced on the unchanged `Gum arabic` revision by the independently answerable composition `Polysaccharides and glycoproteins`; neither its clue nor explanation contains a printing stem.
- The unchanged `Gum printing` fact from R8-prior `0405` now precedes the composition endpoint, eliminating the compositional future disclosure.

The three adjudicated sets are genuinely reordered/replaced under typical-player burden while the global allocation remains exact:

- `025`: `style`, `nationality`, `principles`, `housing-work`, `birth-name`
- `038`: `components`, `prefix`, `hex-green`, `alpha`, `shorthand-palette`
- `081`: `tree`, `paint-binder`, `region`, `photo-process`, `composition`

Every adjacent rationale in those sets names both its predecessor and endpoint. Rationales `0030`, `0137`, `0160`, and `0221` now use `material or support recall`, `precise quantitative recall`, `chronological recall`, and `chronological recall`, respectively. Notes `006` and `032` retain their exact opening endpoints while correctly classifying their closing endpoints as `material or support recall` and `chronological recall`. Maximum repeated 12-gram recurrence is three for rationales and one for notes.

### Exact drift, sources, candidates, and allocation

`r8-factual-drift.json` maps every changed or moved R8-prior fact by stable identity, final ordinal, changed field, review family, source binding, and R9 gate. The exact drift is:

- six R8-prior facts change player-facing bytes: `0122`, `0188`, `0189`, `0190`, `0194`, and `0404`;
- five clues, six explanations, four responses, five variant lists, and three fact keys change;
- nine R8-prior facts move: `0123`, `0124`, `0125`, `0186`, `0188`, `0402`, `0403`, `0404`, and `0405`;
- the union of byte-changed or moved projections is exactly 13, leaving the other 487 R8 projections byte- and ordinal-identical;
- 12 members of that union were factually approved in R8 and therefore require new R9 factual review; `0194` was the single R8 factual blocker and implements its concrete proposal;
- category names, taxonomy leaves, source bindings, and candidate mappings change zero times across all 500 rows, 100 sets, 101 sources, and 100 candidates.

Source changes are zero. The Le Corbusier, Web colors, Gum arabic, and London Monopoly corrections all remain on their existing permanent revisions. Candidate mappings remain exact at `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`, and the immutable 2,500-row OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

Registered-leaf allocation remains `architecture=8`, `artists=15`, `buildings=14`, `design=15`, `materials-techniques=8`, `movements=2`, `museums=11`, `painting=9`, `photography-history=13`, and `sculpture=5`; no leaf exceeds 15. Global difficulty/round allocation remains `17/16/17/17/16/17`.

The drift artifacts are:

- `r8-factual-drift.json`: `79b927be04978bfe4bc6647d57912347a89f132f6d53efd355fc2b2b90104172`
- `r8-candidate-drift.json`: `39f62b95aedc2843bde36b8c76c7ed514917af34af0ec72684cb0a8787846399`
- `r8-source-readback.json`: `6617477300bd14cc1864a5aedd26bfb6fecc6ad703e3658d0cba37c97fe15d7a`

### Exhaustive GREEN verification and fresh source readback

The final verification cycle used:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r8.json --source-cache content/work/05-art-architecture/source-check-cache-r8.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r8.json
node --test content/work/05-art-architecture/r8-exact-residual.test.mjs
node --test content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs
node content/work/05-art-architecture/audit-r8-freeze.mjs --check
```

The exact R8 suite passes 18/18 and the unchanged general contracts pass 4/4. The freeze audit reconstructs the exact R7 prior and exact R8 final, checks all 500 player/evidence/calibration/source projections, and performs 731 category, 2,924 cross-clue, and 2,924 cross-explanation canonical/variant comparisons with morphological normalization. It finds zero category disclosures, zero forward or backward clue disclosures, and zero future-answer explanation disclosures. Thirty-seven later-explanation references to already-answered responses are recorded separately as non-leaking teaching context. Manual arithmetic/compositional checks for all three R8 semantic pairs report zero events.

Canonical/variant completeness, `RGB` precision, standalone/true-false utility, exact duplicates, cross-batch near-duplicates, independent explanation context, rationale/note targets and recurrence, final difficulty orders, taxonomy/allocation, evidence/source bindings, candidate supply, originality, and copyright are GREEN. Copyright remains zero long-verbatim clues, zero quoted fragments over ten words, zero bundled images, and CC-BY-SA-4.0 only.

An empty R8 cache forced a fresh live read of all 101 final permanent-revision URLs after the source set was finalized. All 101 returned HTTP 200 between `2026-08-22T21:30:59.041Z` and `2026-08-22T21:31:02.064Z`, with zero failures. `source-check-r8.json` is `a097157fe292638107b6712ee4e766c605c8b5c31867d07168f044d47d00034b`; its cache is `70e58f689298afc0cd42472a45941d07f26596e9fe3f2fd4540581181f3eeb82`.

The shared validator exits nonzero only for the expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. Its deterministic report remains `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`; no content, factual, source, taxonomy, variant, duplicate, copyright, or undated-changing-fact issue appears.

### Deterministic freeze, containment, deviations, and next gate

Two consecutive full candidate-build, corpus-build, audit, cached-readback, validator, R8-test, general-test, and freeze cycles were compared across 25 artifacts. All 25 were byte-identical. Final hashes are:

- final reconstructed sets: `043cd7b6b718aa0a3b17242549b6c0e0743767c9a5256c921362985d9d6fbe3f`
- unchanged reconstructed sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- `authored.csv`: `e9d48f8f9cf8464b279b79ca9ed26b49e0e3ea7bef94211de741104364c50ce7`
- `evidence.pending.jsonl`: `23e0713b036c52b08710ea1abe81c470a066548f1880816d99c45bce5d5761df`
- `editorial-calibration.json`: `5fca8b19f83f399232efa9ac5cd86da6c6bf795a5413c17e88d482c167c9512b`
- `source-manifest.json`: `27e5c32469f2b0b8598d3dbae466ca6be7f076a209b027abe55722f9a4277604`
- `structure-diagnostics.json`: `64120e66fb83b472a1132aa4ba9a3f6e0570243ff689976ae2f388100c343b62`
- `report.json`: `0862a8bc2c532e1a9f16ac0650ecb1caf0823ea714f1507d3d06b9856a994160`
- `draft-checkpoint-0100.json`: `da3b299b0cabd150138f0501ab86f000cb8a51738491d59f813e4f9e3780fbfd`
- `build-draft.mjs`: `c6ee32febcbb8b430b46248d102743dc12ccc29032aa3f949bff95e06fe4be91`
- `r8-exact-residual-corrections.mjs`: `798e2f28490a481390ef6722dad6fe9a4b1879459d9b077d0061d145f901132b`
- `r8-exact-residual.test.mjs`: `4924d0123081053fee61db228e05ac5f73bc065d30b9435b45d949c0b93f41b6`
- `audit-r8-freeze.mjs`: `f86ac1abb472c131e98164b3f7edeeef2630ca5c47396527ed8bcc0c3f05de02`
- `r8-frozen-checkpoint.json`: `be49cf41d03e61bddca49049c339b24250883e3f12ba7b450181cd7ed46c37f7`

Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent.

There are no corpus-scope deviations and no new all-paths-guess constraint. Two audit-harness corrections were necessary and are disclosed above: preservation lookup now consults the immutable R7 artifact ledger after reviewed outputs change, and the semantic audit no longer reinterprets already-reordered R7 positions as pre-R7 identities. Both strengthen identity accuracy without changing review or corpus bytes. No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The sole next gate is fresh independent R9 factual and editorial review of the exact 13-row drift union; no R8 approval is claimed for changed or moved projections.

## 2026-08-23 — R9 two-tuple micro-freeze awaiting independent R10

This section records correction of only the two response/variant-to-future-answer dependencies in the R9 editorial review. The R9 factual review approves all 500 R8 assertions, all 101 source identities, and all 100 candidate mappings; that approval is not carried onto the two changed R9 rows. The micro-corrected English corpus is frozen only for fresh independent R10 factual/editorial review and remains untranslated, unapproved, and publication-unauthorized.

### Fail-closed boundary and exact RED

Before the first write, both review files, their exact two-pair inventory, and all 26 distinct embedded pins were verified. The reviews have zero pin disagreements and every pin was present as current bytes or in the immutable R8 freeze ledger:

- `reviews/factual-round-9.json`: `b65a77aace69c0808c61f0ab7e8df6aad7f84a8faa62934b7eacf36c2593d75a`
- `reviews/editorial-round-9.json`: `5a5bfcb9f7c632d3c6256d2c6ee2f9466e17c9584695366b89d8f6026e308faf`
- reconstructed exact R8 sets: `043cd7b6b718aa0a3b17242549b6c0e0743767c9a5256c921362985d9d6fbe3f`
- reconstructed exact R8 sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- pinned R8 freeze: `be49cf41d03e61bddca49049c339b24250883e3f12ba7b450181cd7ed46c37f7`
- pre-append authoritative Task13 report: `9732bac063cff3a5230e164fe3f95a575aa40a6458edb6e5816dcc19d2db88c5`

The complete 26-pin reviewed-prior map is preserved in `r9-frozen-checkpoint.json`. The R9 correction layer repeats the exact-prior sets, source set, reviews, R8 freeze, factual approval, pair/row/variant/set inventories, and every embedded pin before returning a changed projection.

Behavior-level RED was observed with:

```text
node --test content/work/05-art-architecture/r9-two-tuple-micro.test.mjs
```

Against untouched R8 bytes, the immutable-boundary and full-preservation tests passed while exactly two tests failed: set `038` still exposed future `Green`, and set `084` still exposed future `Antimony`. After the micro-correction, the same suite passes 4/4. The deterministic freeze contract was separately observed RED before materialization when `audit-r9-freeze.mjs --check` rejected the absent `r9-factual-drift.json`; it is now GREEN byte-for-byte.

### Exact two-row correction

- R8-prior `0186` is replaced in place by the review-proposed, source-backed six-digit fact: `How many hexadecimal digits specify a standard web colour without transparency?` / `Six` / variant `6`. Its explanation states that two digits describe each of three components without naming or disclosing future `Green`. The unchanged `Web colors` revision `1368058563` explicitly supplies the six-digit fact.
- `0416` retains canonical `Naples yellow` but removes accepted variant `Antimony yellow`. Its clue now asks: `Which historic pigment takes its name from Naples and was once thought by early colour theorists to come from Mount Vesuvius?` This retains the source’s name/origin proposition while leaving `Antimony` independent at `0417`; the unchanged source is `Naples yellow` revision `1279359922`.

No fact moves. Set `038` remains `digits`, `prefix`, `hex-green`, `alpha`, `shorthand-palette`; its five rationales and note were regenerated against the new opening endpoint and adjacent burdens. Set `084` remains `pigment`, `element`, `european-use`, `ancient-regions`, `status`; because neither its order nor canonical endpoints changed, all R9-approved rationales and its note remain byte-identical. Both affected sets retain their difficulty/round slots and the global `17/16/17/17/16/17` allocation.

### Exact drift and preserved approval boundary

`r9-factual-drift.json` enumerates the complete drift:

- exactly two R9-approved prior rows change: `0186` changes fact key, clue, response, variants, and explanation; `0416` changes only clue and variants;
- zero facts move, and the other 498 player-facing projections remain byte- and ordinal-identical;
- zero categories, taxonomy leaves, source identities, or candidate mappings change;
- all 500 final facts retain their exact permanent source bindings and the final source set remains 101 URLs;
- all 100 candidates remain exact at `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`; the immutable 2,500-row OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

The drift artifacts are:

- `r9-factual-drift.json`: `b65567b7f3b3fa113e1a6a5ec4df26c817f09fc34dfaf870ddbf66f67e2d9d68`
- `r9-candidate-drift.json`: `eeb60abdb3748af3a8152c5770bacc49e2a0fcfec127fac5d5b7a7b33cd6986f`
- `r9-source-readback.json`: `01bdb52f74e574e577f0d1b543b8ba963074e070271ae92a3021df67d94982a7`

### Exhaustive GREEN verification

The final cycle used:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r9.json --source-cache content/work/05-art-architecture/source-check-cache-r9.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r9.json
node --test content/work/05-art-architecture/r9-two-tuple-micro.test.mjs
node --test content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs
node content/work/05-art-architecture/audit-r9-freeze.mjs --check
```

The R9 suite passes 4/4 and the general contracts pass 4/4. The freeze audit reconstructs exact R8 and exact R9 projections, checks all 500 player/evidence/calibration/source rows, counts 753 raw canonical/variant forms, and performs 729 category, 2,916 cross-clue, 2,916 cross-explanation, and 2,273 earlier-response/variant-to-future-response comparisons. It records zero category disclosures, zero future-answer clue disclosures, zero future-answer explanation disclosures, zero response/variant future disclosures, and zero semantic events for both reviewed pairs.

The full directional scan records one non-blocking later-clue reference: `0189>0186:six`, because the unchanged R9-approved Alpha clue says `six-place` after `Six` has already been answered. This is the direction explicitly created by the review’s six-digit replacement proposal; it supplies a prior answer, not the current or any future answer, and does not determine `Alpha`. Thirty-seven later explanations likewise reference already-answered responses and remain separately enumerated teaching context.

Canonical/variant completeness, standalone/true-false utility, duplicates and cross-batch near-duplicates, independent explanation context, rationale/note targets and recurrence, both final set orders, taxonomy/allocation, evidence/source binding, candidate supply, originality, and copyright are GREEN. Maximum repeated 12-gram recurrence remains three for rationales and one for notes. Copyright remains zero long-verbatim clues, zero quoted fragments over ten words, zero bundled images, and CC-BY-SA-4.0 only.

An empty R9 cache forced a fresh live read of all 101 final permanent-revision URLs after source finalization. All 101 returned HTTP 200 between `2026-08-22T22:05:34.254Z` and `2026-08-22T22:05:37.727Z`, with zero failures. `source-check-r9.json` is `26555c56b55f524e7810da1997ab0a6b7076dc54fb739618bfda37813441dbbf`; its cache is `9eb0bdadd328c543b04cae9f79e30d52755e68ae7576cb71be9993137caee534`.

The shared validator exits nonzero only for expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. Its deterministic report is `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`; no new content, factual, source, taxonomy, variant, duplicate, copyright, or changing-fact issue appears.

### Deterministic micro-freeze, containment, and next gate

Two consecutive full candidate-build, corpus-build, audit, cached-readback, validator, R9-test, general-test, and freeze cycles were compared across 25 artifacts. All 25 were byte-identical. Final hashes are:

- final reconstructed sets: `3f0e64c387edbd8baeb8332226baae8a99adbb748cb41ad1619a67f38b4530e2`
- unchanged reconstructed sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- `authored.csv`: `4f30dbe561ee498758c2bc881a88d73d713160a839106309930993e8ca2a2d5c`
- `evidence.pending.jsonl`: `568317c0aef662c73a1f408977e834ab5294be13bacc70095ea3ab8829cc1609`
- `editorial-calibration.json`: `d834cf852eafc647c0585abaef286f3b46d940d7c18ec08b3a30994470b89309`
- `source-manifest.json`: `1170f6ba7eee0db99b06915d994a129252a7b7bd85866b5ceb56a5e2019c866d`
- `structure-diagnostics.json`: `64120e66fb83b472a1132aa4ba9a3f6e0570243ff689976ae2f388100c343b62`
- `report.json`: `0862a8bc2c532e1a9f16ac0650ecb1caf0823ea714f1507d3d06b9856a994160`
- `draft-checkpoint-0100.json`: `4a790d1bdf9137ed6c8ecf667891215521f97afb7b4e38d13b8a3f4d002f0885`
- `build-draft.mjs`: `85e904ec2e5b9cedab4bc28cc96695d645a09cc6fb13b24383e32bcc11155143`
- `r9-two-tuple-corrections.mjs`: `2cb3a20e2ba625fc1299f9b84e315b021a7d8666b107bd0e9f02705c362fc49e`
- `r9-two-tuple-micro.test.mjs`: `c1b82ecf3bdf2068416a48a24504adca18ec034793524b5118c0fbe7c205bc01`
- `audit-r9-freeze.mjs`: `d6cc505cedb37fdfc05b08ce2cad8259bb7a773d15831956b25fa6dbcddb24c0`
- `r9-frozen-checkpoint.json`: `829f82c1716fc33389b6841c3a397b0d7d1e9796eb0f788012c6e07af3a8b8b1`

Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent.

There is no corpus-scope deviation and no new all-paths-guess constraint. The directional classification of the single later clue reference is disclosed above and preserves the exact R9-approved Alpha clue rather than expanding scope. No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The sole next gate is fresh independent R10 factual and editorial review of rows `0186` and `0416`; no R9 approval is claimed for either changed projection.

## R10 residual micro-correction freeze (2026-08-23)

The R10 factual/source review approves the complete R9 projection, while the R10 editorial review requires only the exact full-length qualifier and set-038 reorder/calibration proposal. Before the first write, both review bytes, the sole ledger ruling, the reconstructed R9 boundary, and all 26 distinct embedded pins were verified fail-closed:

- `reviews/factual-round-10.json`: `ac5e50678c11df3ab4ad09321f50b46d246c914d65cf9df9890043ed25f6dfa9`
- `reviews/editorial-round-10.json`: `16d46742fd34fd24aacf3f46fdc6db92e70f43c3341da0852a09c140d9d08c20`
- reconstructed exact R9 sets: `3f0e64c387edbd8baeb8332226baae8a99adbb748cb41ad1619a67f38b4530e2`
- reconstructed exact R9 sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- pinned R9 freeze: `829f82c1716fc33389b6841c3a397b0d7d1e9796eb0f788012c6e07af3a8b8b1`
- pre-append authoritative Task13 report: `27937b7ae24fffbdedc12ab375108836d14e35443b0464a815b7a2137f056579`

The complete reviewed-prior map is preserved in `r10-frozen-checkpoint.json`. The correction layer independently repeats the exact review hashes, R9 set/source/freeze hashes, factual approval state, editorial finding/proposal inventory, and every embedded pin before returning a changed projection.

### Exact-prior RED to GREEN

Behavior-level RED was observed against untouched R9 output with:

```text
node --test content/work/05-art-architecture/r10-residual-micro.test.mjs
```

The immutable review/boundary test passed, while exactly three behavior tests failed for the intended reasons: set `038` retained `digits,prefix`, retained its R9 calibration, and did not match the reviewed final projection. After the minimal correction, the same suite passes 4/4. The freeze contract was separately observed RED when `audit-r10-freeze.mjs --check` rejected the absent `r10-factual-drift.json`; after deterministic materialization it is GREEN byte-for-byte.

### Exact set-038 correction and drift

The prior `0186` digit-count fact now asks exactly: `How many hexadecimal digits appear in the full-length web-colour form without transparency?` Its response `Six`, variant `6`, explanation, permanent `Web colors` revision `1368058563`, and every other factual byte remain unchanged. Because clue IDs are positional, the reviewed reorder moves this fact from prior ordinal `0186` to final ordinal `0187`; the unchanged prefix fact moves from prior `0187` to final `0186`.

Set `038` is now exactly `prefix`, `digits`, `hex-green`, `alpha`, `shorthand-palette`. All five rationales and its note were regenerated around the actual progression: familiar prefix recognition, exact full-length count, concrete channel interpretation, optional-channel terminology, then exact shorthand-palette size. The set remains medium/round-one, and the global `17/16/17/17/16/17` allocation is unchanged.

`r10-factual-drift.json` enumerates the complete approved-boundary drift:

- two facts move (`0186`→`0187` digits and `0187`→`0186` prefix);
- exactly one fact changes player bytes: the digits fact changes only its clue;
- zero responses, variants, explanations, fact keys, categories, taxonomy leaves, source bindings, or candidate mappings change;
- all other 498 fact projections remain byte- and ordinal-identical;
- five rationales and one calibration note change, exactly as required.

The drift artifacts are:

- `r10-factual-drift.json`: `54cd2b1c36547eaf4acefb9dcbd09f8916c6e3685607f8fe03f0d93342334b87`
- `r10-candidate-drift.json`: `56b41b1f80cd2bce2896c13b6f097168363d8ef2e2e7ec31c0d0d858f20b051c`
- `r10-source-readback.json`: `0244688a7200932227815a37e141382aa457f1c540f16a246c6178bfcfd25b45`

All 100 immutable candidate mappings remain `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`; the 2,500-row immutable OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

### Exhaustive verification and source readback

Each deterministic cycle ran:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r10.json --source-cache content/work/05-art-architecture/source-check-cache-r10.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r10.json
node --test content/work/05-art-architecture/r10-residual-micro.test.mjs
node --test content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs
node content/work/05-art-architecture/audit-r10-freeze.mjs --check
```

The R10 suite passes 4/4 and the general contracts pass 4/4. The final audit reconstructs exact R9 and exact R10 projections; verifies all 500 player, evidence, calibration, and source rows; counts 753 raw canonical/variant forms; and performs 729 category, 2,916 cross-clue, 2,916 cross-explanation, and 2,273 earlier-response/variant-to-future-response comparisons. It records zero category disclosures, zero future-answer clue disclosures, zero future-answer explanation disclosures, zero response/variant future disclosures, and zero semantic events for either R10 finding.

The one recorded later-clue reference is now `0189>0187:six`: the unchanged Alpha clue says `six-place` after `Six` has already been answered. It is backward teaching context, not a disclosure of Alpha or a future answer. The 37 later-explanation references likewise point only to prior answers and remain separately recorded. Canonical/variant completeness, standalone and true/false utility, clue/explanation independence, duplicates and accepted-batch near-duplicates, source/evidence bindings, candidate supply, taxonomy/caps/allocation, calibration targets and recurrence, originality, and copyright are GREEN. Maximum repeated 12-gram recurrence is three for rationales and one for notes.

An empty R10 source cache forced a fresh live read of all 101 distinct final permanent-revision URLs after final source projection. All 101 returned HTTP 200 between `2026-08-22T22:31:57.474Z` and `2026-08-22T22:32:00.598Z`; zero failed. `source-check-r10.json` is `c93aac8f0f3782ebc0b97e870fdf8f76b46d44dedfd9a57750fc1a55cfd4de52`, and its cache is `1af324500533d260b9e49f5ee2b81120b79a1b14fde41374032e38cdf22a95d0`.

The shared validator exits nonzero only for expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. Its deterministic report remains `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`; there is no new content, factual, source, taxonomy, variant, duplicate, copyright, or changing-fact issue.

During audit implementation, an over-normalized diagnostic initially classified 20 approved orthographic/date/number variants as duplicate canonicals. Direct inspection showed hyphenation, punctuation, case, and numeral-format equivalents rather than duplicate list entries. The checker was narrowed to the established exact duplicate-entry contract; no corpus or variant byte changed. No other deviation or concern remains.

### Deterministic R10 freeze, containment, and next gate

Two consecutive full candidate-build, corpus-build, audit, cached-source, validator, R10-test, general-test, and freeze cycles matched across all 25 frozen artifacts. Final hashes are:

- final reconstructed sets: `d3cefb6afa5a7b1d5d5809778b6fc8016493e4a400d8df93999a828e9fc6def0`
- unchanged reconstructed sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- `authored.csv`: `3360ca86f767c8e70ee2710be78d6351b05b6fd77e6fb46c430f47306e0a8a68`
- `evidence.pending.jsonl`: `cac4123fe0490e01d79810bc29fe3a97f0f8c233a36990eda8393033d3de7a18`
- `editorial-calibration.json`: `300d709a54729946b97412017294d66ca8b76ad040403bc25fa9c74f999216cc`
- `source-manifest.json`: `ee987f6467c0936619ad0c52f5b435e3ab2c76dad09f30d8dc90b4eff28f28ca`
- `structure-diagnostics.json`: `64120e66fb83b472a1132aa4ba9a3f6e0570243ff689976ae2f388100c343b62`
- `report.json`: `0862a8bc2c532e1a9f16ac0650ecb1caf0823ea714f1507d3d06b9856a994160`
- `draft-checkpoint-0100.json`: `1ad7f415f7cccfe42daf2a46b619af134e0db24be69d1c112445597e088172aa`
- `build-draft.mjs`: `d963cdcf4d389267ec1fb84dedac80bcf844c6dead2519d9a84d7ca3bf1e0123`
- `r10-residual-micro-correction.mjs`: `ce34c3187e4885f26fa69c9235a27d664c9225bce1a4abf3d969f1ede3796957`
- `r10-residual-micro.test.mjs`: `0d10ebe78c2523d2c88749580aad6355c5806e99b8588f90c48993f749bd7b0e`
- `audit-r10-freeze.mjs`: `5c77ea0e673c508f3122de554f8e3faeb770134d8705a408dd1f393f252e249e`
- `r10-frozen-checkpoint.json`: `4ff15d93715dcbc3b860b866e11ba693d616074ec124f6234fc03a3d7f41f40c`

Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent.

There is no new all-paths-guess constraint. No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The sole next gate is fresh independent R11 factual and editorial review of prior rows `0186`/`0187` and final set `038`; no R10 approval is claimed for the changed or reordered projection.

## R11 one-row correction freeze (2026-08-23)

The R11 factual/source review approves all 500 R10 facts and 101 permanent revisions. The R11 editorial review approves the entire R10 delta but finds one unchanged contextual dependency: earlier clue `0271` supplies both opera and Monte Carlo, making the accepted `0273` opera name constructible, while the old `0273` clue is not independently determined. Before the first write, both R11 review bytes, the sole ledger ruling, the exact reconstructed R10 boundary, and all 26 distinct embedded pins were verified fail-closed:

- `reviews/factual-round-11.json`: `f9ccbd77ecf5859a4d3f5622cf2d75955f54b2aec7c98f66439d9f98258089bc`
- `reviews/editorial-round-11.json`: `0d59e303d97a70fd69f7406ad0a819ea58d00fe2b62a71a2febdc9214d99b2dd`
- reconstructed exact R10 sets: `d3cefb6afa5a7b1d5d5809778b6fc8016493e4a400d8df93999a828e9fc6def0`
- reconstructed exact R10 sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- pinned R10 freeze: `4ff15d93715dcbc3b860b866e11ba693d616074ec124f6234fc03a3d7f41f40c`
- pre-append authoritative Task13 report: `1c38f40d7697f183d137de0c1183760960703b45c48095c4fe854a1725ac34d8`

The complete reviewed-prior map is preserved in `r11-frozen-checkpoint.json`. The R11 correction layer repeats the exact review hashes, R10 set/source/freeze hashes, factual approval state, exact editorial finding/proposal inventory, and every embedded pin before returning a changed projection.

### Exact-prior RED to GREEN

Behavior-level RED was observed against untouched R10 output with:

```text
node --test content/work/05-art-architecture/r11-one-row.test.mjs
```

After correcting the test fixture to the review’s actual one-element `correctionProposals` array, the immutable review/boundary test passed and exactly three intended behavior tests failed: `0273` retained the opera-name proposition, the `0271` contextual dependency remained, and the final projection lacked `opera-architect`. No production bytes were written before this clean RED. After the one-row correction, the same suite passes 4/4. The freeze contract was separately observed RED when `audit-r11-freeze.mjs --check` rejected the absent `r11-factual-drift.json`; after deterministic materialization it is GREEN byte-for-byte.

### Exact row-0273 correction and drift

Only final row `0273` is re-authored, exactly as proposed:

- fact-key suffix: `opera-architect`
- clue: `Which architect of the Paris opera house helped expand the Monte Carlo casino in 1878–79?`
- response: `Charles Garnier`
- accepted variant: `Garnier`
- explanation: `His additions included a concert hall later named Salle Garnier, while Jules Dutrou redesigned other gaming and public spaces.`
- evidence assertion: `Charles Garnier — His 1878–79 additions included the concert hall later named Salle Garnier.`
- tier rationale: `Charles Garnier follows Casino de Monte-Carlo because identifying the architect behind its opera-hall expansion requires more specialized design-history recall.`
- set-055 note: `Medium, round two — An Opera House inside a Casino Complex moves from Monaco through Casino de Monte-Carlo and Charles Garnier to Société des Bains de Mer, before Citizens of Monaco closes on the unusual access restriction.`

The builder now projects an explicit `evidenceAssertion` when a fact supplies one and otherwise retains the prior `${response} — ${explanation}` default. Row `0273` is the only fact with that new field, so every other evidence assertion remains byte-identical.

The bound `Monte Carlo Casino` revision `1365291214` directly states that the casino was transformed and expanded in 1878–79 to designs by Jules Dutrou and Charles Garnier, identifies Garnier as architect of the Paris opera house, and attributes the later Salle Garnier concert hall to Garnier while Dutrou handled most gaming-room and public-space work. The source URL and all source identity fields remain unchanged.

`r11-factual-drift.json` enumerates the complete approved-boundary drift:

- exactly row `0273` changes fact key, clue, response, variants, explanation, evidence assertion, and tier rationale;
- exactly set `055` changes its calibration note;
- the other 499 facts, the other four set-055 facts and rationales, and the other 99 notes remain byte- and ordinal-identical;
- zero order, category, difficulty, round, taxonomy, source, or candidate changes occur;
- the source remains `Monte Carlo Casino` oldid `1365291214`, set `055` remains medium/round-two under `buildings`, and its candidate mapping remains exact.

The drift artifacts are:

- `r11-factual-drift.json`: `311221590ef895473bfcc24d94cb3f31a2bd9ffbe9123f9dfc75d1dedd7510bf`
- `r11-candidate-drift.json`: `8363e97f2e0b83551066ea49c85a6c2b8341c3c8132073cf3e190125593797c7`
- `r11-source-readback.json`: `494a19be07aa5a0897a6397171d9892fb093bf03e63f60f6ad2ee47718a3dc26`

All 100 immutable candidate mappings remain `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`; the 2,500-row immutable OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

### Exhaustive verification and source readback

Each deterministic cycle ran:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r11.json --source-cache content/work/05-art-architecture/source-check-cache-r11.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r11.json
node --test content/work/05-art-architecture/r11-one-row.test.mjs
node --test content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs
node content/work/05-art-architecture/audit-r11-freeze.mjs --check
```

The R11 suite passes 4/4 and the general contracts pass 4/4. The final audit reconstructs exact R10 and exact R11 projections; verifies all 500 player, evidence, calibration, and source rows; counts 752 raw canonical/variant forms; and performs 728 category, 2,912 cross-clue, 2,912 cross-explanation, and 2,265 earlier-response/variant-to-future-response comparisons. It records zero category disclosures, zero future-answer clue disclosures, zero future-answer explanation disclosures, zero response/variant future disclosures, and zero semantic events for `0271>0273` or the standalone `0273` contract.

The one recorded later-clue reference remains `0189>0187:six`, after `Six` has already been answered; it is backward teaching context rather than a future disclosure. The 37 later-explanation references likewise point only to prior answers. Canonical/variant completeness, standalone and true/false utility, clue/explanation independence, duplicates and accepted-batch near-duplicates, evidence/source bindings, candidate supply, taxonomy/caps/allocation, calibration targets and recurrence, originality, and copyright are GREEN. Maximum repeated 12-gram recurrence remains three for rationales and one for notes.

An empty R11 source cache forced a fresh live read of all 101 distinct final permanent-revision URLs after final source projection. All 101 returned HTTP 200 between `2026-08-22T23:02:25.252Z` and `2026-08-22T23:02:28.262Z`; zero failed. `source-check-r11.json` is `d2ecc27c1eaf625ae4177d3399e2ad996c3b506088bdef8b02f7bf6733c4318a`, and its cache is `aa8c45ea288577b671ec01fbdf93312e2efa991c69e3ab63846577f782f4665c`.

The shared validator exits nonzero only for expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. Its deterministic report remains `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`; there is no new content, factual, source, taxonomy, variant, duplicate, copyright, or changing-fact issue.

### Deterministic R11 freeze, containment, and next gate

Two consecutive full candidate-build, corpus-build, audit, cached-source, validator, R11-test, general-test, and freeze cycles matched across all 25 frozen artifacts. Final hashes are:

- final reconstructed sets: `61615ef6377de1d87389a60827c10b0a6dde62da82c01773d3c75ee6ff74f484`
- unchanged reconstructed sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- `authored.csv`: `f070a9fa6d3ddabee6d0deee8d816e6b4427f428476c223f39e6476a1d54bb2b`
- `evidence.pending.jsonl`: `ed5693b924c93e7a3ff870af4e8cc3e706c1f281f4ace0ccdc19a7c78cf72662`
- `editorial-calibration.json`: `8f482d52694935c276c2d013315827f899befeb0448da9f582082c0ff5ca9e7b`
- `source-manifest.json`: `d4c263cfa7f9e3882144ea7bbfa2b092133e7ba187f8495ef7dc446ef7c1d425`
- `structure-diagnostics.json`: `64120e66fb83b472a1132aa4ba9a3f6e0570243ff689976ae2f388100c343b62`
- `report.json`: `0862a8bc2c532e1a9f16ac0650ecb1caf0823ea714f1507d3d06b9856a994160`
- `draft-checkpoint-0100.json`: `b36b9531915c1d11530650390f670027822f764279218028ef2d1086644c9e3e`
- `build-draft.mjs`: `bc3d6c88d2b8afa54b6ad80d33613e11312d86b37788dd4304a3f7880567d987`
- `r11-one-row-correction.mjs`: `ecf2e0cf75da5a56445aac17295f79daf6474b9eeca14cee6ca4fb0917134634`
- `r11-one-row.test.mjs`: `98ecc7073b6f6163a5e0afc881458cc85b13b72f152a8d57cb4378cf5b39a60d`
- `audit-r11-freeze.mjs`: `cf454f25cd17572eee4722b1877394c771e1bb8531c99ab1bdf073a7061f63f0`
- `r11-frozen-checkpoint.json`: `fa3a15be2486aa1189472f3d85dfb5125ed346bfe980acbab9a70cb7398e3f43`

Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent.

There is no new all-paths-guess constraint and no unresolved deviation. No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The sole next gate is fresh independent R12 factual and editorial review of row `0273`; no R11 approval is claimed for the replacement projection.

## R12 one-scalar correction freeze (2026-08-23)

The R12 factual/source review approves all 500 R11 factual projections, all 101 permanent source identities, and all 100 candidate mappings. The R12 editorial review approves the Charles Garnier replacement but finds exactly one stale calibration scalar: set `055` tier 4 still names the removed `The Opéra de Monte-Carlo` response as its predecessor. Before any production write, the two R12 review bytes, the authoritative report, the exact R11 freeze, all 25 factual-review pins, all 26 editorial-review pins, and all 24 current R11 freeze artifact pins were verified fail-closed with zero mismatches:

- `reviews/factual-round-12.json`: `3816138226e242c70736b58d1541d723f03951351c149e543639b0692386f537`
- `reviews/editorial-round-12.json`: `7a570709a45a42ae58113ba670d2ff961b63ab9ad4c838bc7225ea5f42edc67b`
- exact R11 reconstructed sets: `61615ef6377de1d87389a60827c10b0a6dde62da82c01773d3c75ee6ff74f484`
- exact R11 reconstructed sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- exact R11 calibration: `8f482d52694935c276c2d013315827f899befeb0448da9f582082c0ff5ca9e7b`
- pinned R11 freeze: `fa3a15be2486aa1189472f3d85dfb5125ed346bfe980acbab9a70cb7398e3f43`
- pre-append authoritative Task13 report: `a1edb35e9e08fd9af747d7dce55c82d582208553a2aa0ceea82b30c173fc9390`

The complete 26-item reviewed-prior map is preserved in `r12-frozen-checkpoint.json`. The R12 materializer independently repeats both review hashes, the report/freeze/calibration pins, the factual approval state, the exact one-finding/one-proposal editorial boundary, every embedded pin, the `100`-set/`500`-tier coverage, and the target set/tier/fact/response identity before returning a changed calibration projection.

### Exact-prior RED to GREEN

The focused behavior suite was added against the untouched R11 output and run with:

```text
node --test content/work/05-art-architecture/r12-one-scalar.test.mjs
```

The immutable-boundary and all-preservation tests passed, while exactly one test failed: the actual tier-4 rationale was the pinned stale `The Opéra de Monte-Carlo` sentence and the expected value was the exact reviewed `Charles Garnier` sentence. The observed RED was `2/3` pass and `1/3` fail. After materialization, the identical command passes `3/3`. The freeze contract was also observed RED when `audit-r12-freeze.mjs --check` rejected the absent `r12-factual-drift.json`; after deterministic materialization it is GREEN byte-for-byte.

### Exact one-scalar correction and drift

Only `editorial-calibration.json` set `055` `tiers[3].rationale` changes:

- before: `After “The Opéra de Monte-Carlo”, “Société des Bains de Mer” advances An Opera House inside a Casino Complex; the clue now requires subject-specific identification at tier 4.`
- after: `After “Charles Garnier”, “Société des Bains de Mer” advances An Opera House inside a Casino Complex; identifying the formal operator requires more specialized organizational recall at tier 4.`

The builder applies this transformation only after reconstructing the unchanged R11 sets and generating the full calibration projection. Replacing the final scalar with the pinned prior value reconstructs the complete R11 calibration byte-for-byte at `8f482d52694935c276c2d013315827f899befeb0448da9f582082c0ff5ca9e7b`; this proves the other 499 rationales, all 100 notes, all category/candidate/slot/taxonomy fields, and all tier order/response/fact-key fields remain exact. The derived `draft-checkpoint-0100.json` changes only because its recorded calibration hash changes; its set projection remains `61615ef6377de1d87389a60827c10b0a6dde62da82c01773d3c75ee6ff74f484`.

`r12-factual-drift.json` records zero changed or reordered facts, zero player/evidence/source/category bytes, zero source changes, zero candidate changes, one calibration-rationale change, and zero note changes. The exact drift artifacts are:

- `r12-factual-drift.json`: `b31e7acf5102fa30a840d69d3a9ad1fbcab82453dda9da4db5098ed63f53c924`
- `r12-candidate-drift.json`: `68b4c4946a40dc846d4961bebfbdbb239cf43f147585ed9be7e3bd95446b26d1`
- `r12-source-readback.json`: `2531cc7ddd719544afb85e94475a14af5a472db3c6194b6e54137bc590a893aa`

All 100 candidate mappings remain `bf1c0f9110241fb43c0d50c6a0b3910d09f69510eee0e7f95f2a3771fecb675d`; the immutable 2,500-row OpenTDB pool remains `74e5cda28c4d9c7edd6dbd8acdee5e1231533670da8cc32891d48a8923c6ff2c`.

### Exhaustive verification and source readback

Each deterministic cycle ran the candidate/corpus builders, candidate/draft audits, cached source check, unpublished-stage validator, focused/general contracts, and dedicated freeze check:

```text
node content/work/05-art-architecture/build-candidate-selection.mjs
node content/work/05-art-architecture/build-draft.mjs
node content/work/05-art-architecture/audit-candidates.mjs
node content/work/05-art-architecture/audit-draft.mjs
.\node_modules\.bin\tsx.cmd scripts/content/sourceCheck.ts --input content/work/05-art-architecture/authored.csv --report content/work/05-art-architecture/source-check-r12.json --source-cache content/work/05-art-architecture/source-check-cache-r12.json
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/draft-validator-report-r12.json
node --test content/work/05-art-architecture/r12-one-scalar.test.mjs content/work/05-art-architecture/candidate-contract.test.mjs content/work/05-art-architecture/draft-contract.test.mjs content/work/05-art-architecture/source-fetch-resilience.test.mjs
node content/work/05-art-architecture/audit-r12-freeze.mjs --check
```

The focused plus general contracts pass `7/7`. The dedicated audit reconstructs the exact R11 set/source/calibration boundary; verifies all 500 player/evidence/source/calibration rows and all 100 sets; counts 752 raw canonical/variant forms; and performs 728 category, 2,912 cross-clue, 2,912 cross-explanation, and 2,265 earlier-response/variant-to-future-response comparisons. It records zero category disclosures, zero future-answer clue disclosures, zero future-answer explanation disclosures, zero response/variant future disclosures, and zero semantic events. The sole later-clue reference remains the already-approved backward `0189>0187:six` event, and the 37 later-explanation references remain prior-answer teaching context. Canonical/variant completeness, standalone and true/false utility, duplicates and accepted-batch originality, explanation independence, rationale/note target and recurrence, difficulty, taxonomy/caps/allocation, factual/source/evidence bindings, candidate supply, copyright, and no-image constraints are GREEN. Maximum repeated 12-gram recurrence remains three for rationales and one for notes.

An empty R12 source cache forced a fresh live read of all 101 distinct unchanged permanent-revision URLs. All 101 returned HTTP 200 between `2026-08-22T23:31:45.612Z` and `2026-08-22T23:31:48.667Z`; zero failed. `source-check-r12.json` is `942fe0851cf2a1dbc15fe3bf4924f86df0a220891352962c60c49f98409e9a91`, and its cache is `aaeb136bcc0addb029082a1b97c1f4b139129582085a4d8b9f839b55d6c35ed7`. The source set and every source binding remain unchanged.

The shared validator exits nonzero only for expected unpublished-stage gates: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, and `OPENTDB_COMPOSITION=1`. Its report remains `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`; no content, factual, source, taxonomy, variant, duplicate, copyright, or changing-fact blocker was introduced. A first verification wrapper returned exit `2` only because it compared JSON-serialized count objects in insertion order; the report already contained the exact three expected counts. The wrapper was corrected to compare each named count and total key count, then passed without any artifact or corpus change.

### Deterministic R12 freeze, containment, and next gate

Two consecutive complete build/audit/source/validator/test/freeze cycles matched across all 25 frozen artifacts; their aggregate hash-map digest was `428d46e269ab82ba39f909b8bc27f85965d43218a1c0ca79c250e2db1c9b4d05`. Final hashes are:

- final reconstructed sets: `61615ef6377de1d87389a60827c10b0a6dde62da82c01773d3c75ee6ff74f484`
- unchanged reconstructed sources: `48e1e16fb906de330cacc943e875772dfa05b3eb30f54f762a2c8fd566f17a15`
- `authored.csv`: `f070a9fa6d3ddabee6d0deee8d816e6b4427f428476c223f39e6476a1d54bb2b`
- `evidence.pending.jsonl`: `ed5693b924c93e7a3ff870af4e8cc3e706c1f281f4ace0ccdc19a7c78cf72662`
- `editorial-calibration.json`: `8a243395b3fd3304b75ad83039d3bc3853ec07cbcc9525ca4c1c50c4bac4e278`
- `source-manifest.json`: `d4c263cfa7f9e3882144ea7bbfa2b092133e7ba187f8495ef7dc446ef7c1d425`
- `structure-diagnostics.json`: `64120e66fb83b472a1132aa4ba9a3f6e0570243ff689976ae2f388100c343b62`
- `report.json`: `0862a8bc2c532e1a9f16ac0650ecb1caf0823ea714f1507d3d06b9856a994160`
- `draft-checkpoint-0100.json`: `7aa232b313b780d068c2f19ea4ef570e0eec895cb46a49c4f000a8918a4e5052`
- `build-draft.mjs`: `e6cd553065360fa6d200ca9ec2f572178b969030fdeefe0eb24b0a692e5456f3`
- `r12-one-scalar-materializer.mjs`: `04a728544f8ec06ef42549d061612c6136b6a779fd5aac9142b766a464435846`
- `r12-one-scalar.test.mjs`: `020ea0619d337da4c87f225ab93d9caa598300040f45ec56e28a1664729801f5`
- `audit-r12-freeze.mjs`: `0d0221591a920a76e0fdc7ce60ead94fd0bbc13f576d198178daf0f5d3b172f4`
- `r12-frozen-checkpoint.json`: `3e1a9f70a3bbc351f9dd6617c8ea3087df41f014d3e7ad8f8c40f97e1cc0bad9`

Accepted authored, generated, report, and canonical docs-progress paths remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent. The R12 ledger ruling remains a single pre-existing entry, and the git index remains untouched.

There is no new all-paths-guess constraint, source/candidate drift, or unresolved content concern. No translation, approval, publication, accepted/shared/docs/progress/index write, staging, commit, or release action occurred. The sole next gate is fresh independent R13 factual and editorial review of this exact one-scalar projection; no R13 approval is claimed.

## R13 English-review materialization — failed pretranslation gate (2026-08-23)

The two independent R13 review decisions were materialized only into reversible work evidence. This section does not claim that the pretranslation gate passed, authorize translation or publication, waive the validator failure, or change any authored, pending-evidence, accepted, shared-validator, canonical docs/progress, index, stage, or commit boundary. The materialization is sealed as failed and must be invalidated before a corrected rerun.

### Exact-prior gate and RED to GREEN

Before the first write, all ten supplied pins matched exactly: `authored.csv` `f070a9fa6d3ddabee6d0deee8d816e6b4427f428476c223f39e6476a1d54bb2b`; `evidence.pending.jsonl` `ed5693b924c93e7a3ff870af4e8cc3e706c1f281f4ace0ccdc19a7c78cf72662`; `editorial-calibration.json` `8a243395b3fd3304b75ad83039d3bc3853ec07cbcc9525ca4c1c50c4bac4e278`; `source-manifest.json` `d4c263cfa7f9e3882144ea7bbfa2b092133e7ba187f8495ef7dc446ef7c1d425`; `r12-factual-drift.json` `b31e7acf5102fa30a840d69d3a9ad1fbcab82453dda9da4db5098ed63f53c924`; `r12-frozen-checkpoint.json` `3e1a9f70a3bbc351f9dd6617c8ea3087df41f014d3e7ad8f8c40f97e1cc0bad9`; `source-check-r12.json` `942fe0851cf2a1dbc15fe3bf4924f86df0a220891352962c60c49f98409e9a91`; this report `67cfe55d627d7f04e80bbc6229d3204820a12accace661b41101e9017db3d5e9`; `reviews/factual-round-13.json` `c462c88cc316fac70bc35194aff3627445c5036c7750fb75d7545cbaef3316a4`; and `reviews/editorial-round-13.json` `29706872dffe5f9b2a8ba14e0438be93032d41150d6f5ca2c85175848f05bd67`. The factual R13 embedded ledger matched `25/25`, the editorial R13 ledger matched `26/26`, the R12 final artifact map matched `24/24`, four R12 review-pin assertions matched, and `audit-r12-freeze.mjs --check` exited `0`; total mismatches were zero.

The focused materializer test was written first and run against the untouched workspace:

```text
node --test content/work/05-art-architecture/english-approval-materialization.test.mjs
```

RED was `0/1`: Node reported `ERR_MODULE_NOT_FOUND` for the absent `materialize-r13-english-approvals.mjs`. After the minimal deterministic implementation, the same command passed `1/1`. It performs a real write followed by two `--check` executions and proves both output hashes stay byte-identical. Two additional direct checks also exited `0`:

```text
.\node_modules\.bin\tsx.cmd content/work/05-art-architecture/materialize-r13-english-approvals.mjs --check
.\node_modules\.bin\tsx.cmd content/work/05-art-architecture/materialize-r13-english-approvals.mjs --check
```

The failed-gate checkpoint received its own TDD cycle. Its first test run was RED because `build-r13-pretranslation-checkpoint.mjs` was absent; after implementation and the explicit failed-gate ruling, `node --test content/work/05-art-architecture/pretranslation-checkpoint.test.mjs` passed `1/1`, including deterministic `--check` and the exact protected-path labels.

### Review identities, chronology, and materialized counts

All 500 pending rows identify `Codex Art and Architecture Author` at exact authored time `2026-08-21T20:00:00.000Z`. The materialized factual decision uses the exact artifact identity `Codex independent factual/source reviewer R13 — task13-factual-r13-20260823T024207+0300` at `2026-08-23T02:42:07.2043872+03:00`; the editorial decision uses `Codex independent Task 13 final editorial verifier` at `2026-08-23T02:42:11.4764530+03:00`. The author and two English reviewers are pairwise distinct (`3` identities); the eventual fourth translation identity is deliberately not checked at this stage.

The real current-offset materialization timestamp is `2026-08-23T02:58:53.364+03:00`. It is later than authoring and both reviews and no later than the immediate postwrite clock. Materialization produced exactly 500 distinct rows, 500 factual `approved` decisions, 500 editorial `approved` decisions, 500 null translation reviews, zero schema failures, and zero byte-semantic drift after removing only the two English-review fields. The failed pretranslation checkpoint was frozen at `2026-08-23T02:59:59.757+03:00` with `pretranslationGatePassed=false` and `publicationAuthorized=false`.

Final work-artifact hashes before this sole report append are:

- `evidence.jsonl`: `ddbdd0a6da9f8420f8db9f1d21179dbaf04c24e955777865f0369567a29babd1`
- `materialize-r13-english-approvals.mjs`: `62972dbce36d7c8f2a665b1b6a4dc2e03802fc3c42fbcb52d557628bd61e2e75`
- `english-approval-materialization.test.mjs`: `34276200eec13c5c2dad1269ede42a99e24601177956cb85dee3152f7f1ad1b8`
- `english-approval-materialization-r13-checkpoint.json`: `45b7b26183ed647aa6c54bbf014b7b0e82810cdc828c992d5541c8d1773ce74b`
- `pretranslation-validation-r13.json`: `4ee60813b31af32595f4b355692aa2e1f0461c3e6d6f8ca89b8db9f15b036fdf`
- `build-r13-pretranslation-checkpoint.mjs`: `299c91e45cfd3a1ddb5b4efd3a2f12637823bb6cf89e4656971ebe2e63422e5c`
- `pretranslation-checkpoint.test.mjs`: `706527e325bc65eb4bf056b6237583ccb0ea10ada684facc6b91b750daa0d037`
- `r13-pretranslation-checkpoint.json`: `51e6488d5e051ea5bce05de59086ec7749023cb4c9be15c11b59164925a24ed5`

### Validator failure and verification envelope

The required validator command was run against the exact authored and materialized evidence artifacts:

```text
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --evidence content/work/05-art-architecture/evidence.jsonl --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/pretranslation-validation-r13.json
```

It exited `1` with `validation.blocking=true`. Exactly 500 `MISSING_TRANSLATION` warnings have 500 one-to-one matching exceptions, but one unexpected blocking `SOURCE_MISMATCH` occurs at CSV row 274, clue `built-in-art-architecture-clue-0273`. The pinned evidence assertion is `Charles Garnier — His 1878–79 additions included the concert hall later named Salle Garnier.`, while the shared validator currently requires the normalized `${response_en} — ${explanation_en}` projection. Changing that pinned non-review field, authored row, or shared validator was outside this materialization scope and was explicitly ruled out. The checkpoint therefore records one unexpected validator code and one blocking failure rather than claiming a waiver or pass.

Task 13 R12/general contracts pass `7/7`; the candidate and draft audits exit `0` and reproduce exact hashes `c7734c636405a3a9dc67d80e392dfb48cc6149a4f5ab0955992a0505f634936c` and `d714d7d7d75e5dc65e549310edf556955b66bf921faac6f92acd05438a28253f`; and the R12 freeze check exits `0`. The historical Task 12 R9 materializer check is no longer current because Task 12 authored bytes advanced after R9, and the current final Task 12 read-only materializer check exceeded the 124-second bound; neither changed Task 13 artifacts.

### Containment and remaining gate

Accepted authored, generated, report, and canonical docs-progress hashes remain exact at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`. Accepted evidence remains absent, work `generated.en-et.csv` remains absent, and `evidence.pending.jsonl` remains byte-identical at `ed5693b924c93e7a3ff870af4e8cc3e706c1f281f4ace0ccdc19a7c78cf72662`. No translation output, accepted/shared/canonical-progress write, waiver, publication action, staging, index change, commit, or release action occurred; the pre-append commit stayed `ac74919d7d94bdb1b78070e8c596d0dec70306b5` with zero staged paths.

The remaining gate is a separately authorized one-field pending-evidence correction for clue `0273`, followed by fresh factual and editorial reviews of that corrected exact boundary. Those fresh inputs must invalidate and replace this work evidence and both R13 checkpoints; materialization and missing-translation-only validation must then be rerun successfully before any translation or publication action.

## R13 one-assertion pretranslation repair freeze — ready for independent R14 review (2026-08-23)

The authorized ruling corrects exactly one pending-evidence field for `built-in-art-architecture-clue-0273`. The pinned R12 assertion `Charles Garnier — His 1878–79 additions included the concert hall later named Salle Garnier.` did not preserve the canonical `${response_en} — ${explanation_en}` identity required by the pretranslation validator. It is replaced exactly with `Charles Garnier — His additions included a concert hall later named Salle Garnier, while Jules Dutrou redesigned other gaming and public spaces.` The player-facing explanation already contained that wording and remains byte-identical; no clue, response, variant, fact key, source identity, candidate, calibration, category, order, or other pending row changes.

Before the first repair write, all 13 supplied current pins matched: authored `f070a9fa6d3ddabee6d0deee8d816e6b4427f428476c223f39e6476a1d54bb2b`; prior pending `ed5693b924c93e7a3ff870af4e8cc3e706c1f281f4ace0ccdc19a7c78cf72662`; calibration `8a243395b3fd3304b75ad83039d3bc3853ec07cbcc9525ca4c1c50c4bac4e278`; source manifest `d4c263cfa7f9e3882144ea7bbfa2b092133e7ba187f8495ef7dc446ef7c1d425`; R12 drift `b31e7acf5102fa30a840d69d3a9ad1fbcab82453dda9da4db5098ed63f53c924`; R12 freeze `3e1a9f70a3bbc351f9dd6617c8ea3087df41f014d3e7ad8f8c40f97e1cc0bad9`; R12 source report `942fe0851cf2a1dbc15fe3bf4924f86df0a220891352962c60c49f98409e9a91`; factual R13 `c462c88cc316fac70bc35194aff3627445c5036c7750fb75d7545cbaef3316a4`; editorial R13 `29706872dffe5f9b2a8ba14e0438be93032d41150d6f5ca2c85175848f05bd67`; failed approved evidence `ddbdd0a6da9f8420f8db9f1d21179dbaf04c24e955777865f0369567a29babd1`; failed validator `4ee60813b31af32595f4b355692aa2e1f0461c3e6d6f8ca89b8db9f15b036fdf`; failed checkpoint `51e6488d5e051ea5bce05de59086ec7749023cb4c9be15c11b59164925a24ed5`; and this pre-append authoritative report `9f116a13d0f33ba546f2e62e9aff9ea1e9ac8731edbcb657f4ffb08bdbea54c9`. Embedded ledgers were also exact: factual R13 `25/25`, editorial R13 `26/26`, R12 freeze artifacts `24/24`, R12 reviewed-prior pins `26/26`, and failed-gate artifacts `5/5`.

The focused behavior test was written against the untouched R12 projection and run with `node --test content/work/05-art-architecture/r13-one-assertion.test.mjs`. RED was `0/1`; the failure printed the old 1878–79 assertion as actual and the full Garnier/Dutrou assertion as expected. After the minimum implementation, the same real-build test passed `1/1`. `r13-one-assertion-correction.mjs` now validates the complete exact-prior 500-row JSONL hash and target identity before cloning and changing only row index `272`’s `assertion`. `build-draft.mjs` invokes this layer after R12 and writes the same corrected null-review bytes to both `evidence.pending.jsonl` and current work `evidence.jsonl`.

That current-evidence rewrite explicitly invalidates the failed R13 English approval materialization: both files are byte-identical at `425058e7a0ec2c36c8ec7aa8a8e5949afc875d5f071324c1aa1f6ee0f8ec3dfe`, with factual, editorial, and translation reviews null for all 500 rows. The failed approval materializer, approval checkpoint, validator report, checkpoint builder/test, and failed pretranslation checkpoint remain unchanged as historical evidence. Both stale `materialize-r13-english-approvals.mjs --check` and `build-r13-pretranslation-checkpoint.mjs --check` now fail closed on the new pending hash before any write.

The dedicated `audit-r13-freeze.mjs` proves the pending delta is exactly one row and one `assertion` field; reversing only that field reconstructs the complete prior pending bytes. It checks all 500 player/evidence/source/calibration projections, all 100 candidate mappings, full ordering, uniqueness/collision contracts, and the established leak matrix: 752 raw answer forms, 728 category comparisons, 2,912 cross-clue comparisons, 2,912 cross-explanation comparisons, and 2,265 earlier-response/variant-to-future-response comparisons. There are zero category, future-clue, future-explanation, or response/variant future-answer disclosures; the one later-clue and 37 later-explanation events remain the already-approved references to prior answers.

An empty R13 cache forced a fresh live read of all 101 permanent revision URLs. All 101 returned HTTP 200 between `2026-08-23T00:13:29.796Z` and `2026-08-23T00:13:32.877Z`; zero failed, and the Monte Carlo Casino oldid `1365291214` binding remains exact. Draft `--allow-missing-et` validation without approved evidence has `SOURCE_MISMATCH=0` and only the expected unpublished-stage codes: `MISSING_EVIDENCE=500`, `MISSING_TRANSLATION=500`, `OPENTDB_COMPOSITION=1`, plus 500 matching missing-translation exceptions. A direct probe that supplied the null-review work file as approved `--evidence` was rejected at the schema boundary, as expected; the established draft invocation omits unapproved evidence while the dedicated audit proves the null-review current/pending byte identity separately. No shared validator or publisher code changed.

Two complete candidate-build, draft-build, candidate/draft-audit, cached-source, draft-validator, focused/general-test, freeze-materialization, and freeze-check cycles matched across 34 compared artifacts. Each cycle had eight exit-0 gates plus the expected validator exit `1`; their aggregate hash-map digest was `c7c6ae8ff9398951ec17ea1f63ae0e4b37abb9eb72d7a1f4ae7390389cefa149`. Final repair hashes before this sole report append are:

- `build-draft.mjs`: `1bb6c64cfc4fcc4c2581d90592326c965eee4cd40c371cb68fe6daa5979d6d27`
- `r13-one-assertion-correction.mjs`: `ca60062c5d8de22059e50f2ef48514fe2887c76a00ceca3438a9b35139c00374`
- `r13-one-assertion.test.mjs`: `e554cb1b9f9708e9a7488d2bce508e2afe254b68ddaa8315ca06c2b7cdfc021e`
- `draft-checkpoint-0100.json`: `235d1e643205189ed9cb2d2e055c18bc9367afca2d27fa9cd0df7d2904f9c1d0`
- `source-check-r13.json`: `d02963b761eaf51e7263332e0c8cc0f9960a5e01de6db5fc1a91829b238aaac8`
- `source-check-cache-r13.json`: `79c94d1a9f0e404bfad1128539af05a062218a41902caa0e42c641c52b6ef092`
- `draft-validator-report-r13.json`: `79d3aaa16a3e829c6c06d7a9a1ec547151101eafb8fe5c7e314af2f9dd695860`
- `audit-r13-freeze.mjs`: `492c027251de35f428e5a9e0d8bf1224cf61df8a4e17bbcc2f22b84f372ec900`
- `r13-factual-drift.json`: `0eccb2e49cac72f785d5d092dfe044b5ab3b61a7048fcc83c815564f76fb6555`
- `r13-candidate-drift.json`: `19e5652a2f41e79f1ae43032d59e23c0d16b68f53cb1d48b9907f2853b8c6458`
- `r13-source-readback.json`: `cbc4d0029c3db701dc328c52cebefd2880bd0dc61e41308128a04244a164dd7d`
- `r13-frozen-checkpoint.json`: `fa05c6448227b49728107af9ad004d814da29f0323d97cfa8a0ef95d804d11a0`

Accepted authored, generated, report, and canonical docs-progress hashes remain exact at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`. Accepted evidence and work translation remain absent. The task-owned `E:\git\jeopardy\.tmp\task13-r13-assertion-repair-20260823` snapshots were deleted after parity verification. HEAD remains `ac74919d7d94bdb1b78070e8c596d0dec70306b5` with zero staged paths. No translation, approval, publication, waiver, accepted/shared/docs/progress/index write, staging, commit, or release action occurred.

The sole next gate is fresh independent R14 factual and editorial review of this exact corrected boundary. The historical R13 approvals must not be reused; no approval materialization, translation, publication, or release action is authorized until R14 review inputs bind the corrected pending hash.

## R14 English-review materialization — GREEN pretranslation gate (2026-08-23)

Fresh independent R14 factual and editorial approvals were materialized only into reversible Task 13 work evidence. This section records a successful English-review/pretranslation boundary and readiness for machine translation; it does not claim translation review, publication authorization, accepted-content promotion, release readiness, or a waiver.

### Exact-prior pin gate and RED to GREEN

Before the first R14 write, the historical `materialize-r13-english-approvals.mjs --check` was rerun and failed closed on the repaired pending hash `425058e7a0ec2c36c8ec7aa8a8e5949afc875d5f071324c1aa1f6ee0f8ec3dfe` versus its historical expected hash `ed5693b924c93e7a3ff870af4e8cc3e706c1f281f4ace0ccdc19a7c78cf72662`. All current R14 inputs then matched exactly: authored `f070a9fa6d3ddabee6d0deee8d816e6b4427f428476c223f39e6476a1d54bb2b`; pending and preapproval current evidence `425058e7a0ec2c36c8ec7aa8a8e5949afc875d5f071324c1aa1f6ee0f8ec3dfe`; calibration `8a243395b3fd3304b75ad83039d3bc3853ec07cbcc9525ca4c1c50c4bac4e278`; source manifest `d4c263cfa7f9e3882144ea7bbfa2b092133e7ba187f8495ef7dc446ef7c1d425`; R13 factual drift `0eccb2e49cac72f785d5d092dfe044b5ab3b61a7048fcc83c815564f76fb6555`; R13 freeze `fa05c6448227b49728107af9ad004d814da29f0323d97cfa8a0ef95d804d11a0`; R13 source report `d02963b761eaf51e7263332e0c8cc0f9960a5e01de6db5fc1a91829b238aaac8`; this pre-append report `aaefc3b55bdd605b3e2f4b38b36e1f0b9273e8960f68a7b1f0389b0689e43191`; factual R14 `57f3f60d368df4c17b3262c693ef738ce56434f8138078cbce91a048063303de`; and editorial R14 `4df6b02bc4d3f3adc64c3deabaad11fe616bcc02afbe0721431f7a3049c8eb8b`.

The materializer independently verifies the factual review's `32/32` current and `13/13` historical pins, the editorial review's `33/33` current and `13/13` historical pins, all `31/31` R13 frozen artifact pins, and all four accepted-containment pins. It reconstructs the prior pending bytes, failed R13 approved evidence, and pre-repair report boundary in memory and matches `ed5693b924c93e7a3ff870af4e8cc3e706c1f281f4ace0ccdc19a7c78cf72662`, `ddbdd0a6da9f8420f8db9f1d21179dbaf04c24e955777865f0369567a29babd1`, and `9f116a13d0f33ba546f2e62e9aff9ea1e9ac8731edbcb657f4ffb08bdbea54c9`. Historical failed R13 artifacts remain exact, including materializer `62972dbce36d7c8f2a665b1b6a4dc2e03802fc3c42fbcb52d557628bd61e2e75`, approval checkpoint `45b7b26183ed647aa6c54bbf014b7b0e82810cdc828c992d5541c8d1773ce74b`, validator `4ee60813b31af32595f4b355692aa2e1f0461c3e6d6f8ca89b8db9f15b036fdf`, and failed pretranslation checkpoint `51e6488d5e051ea5bce05de59086ec7749023cb4c9be15c11b59164925a24ed5`.

The focused behavior test was written first and run with:

```text
node --test content/work/05-art-architecture/english-approval-materialization-r14.test.mjs
```

RED was `0/1`, solely because `materialize-r14-english-approvals.mjs` was absent (`ERR_MODULE_NOT_FOUND`). After the minimal additive implementation, the same command passed `1/1`; its real write is followed by two successful `--check` executions with byte-identical output hashes. Two further direct `--check` runs also exited `0`. The R14 pretranslation checkpoint followed the same TDD boundary: RED `0/1` on the absent `build-r14-pretranslation-checkpoint.mjs`, then GREEN `1/1` from `node --test content/work/05-art-architecture/pretranslation-checkpoint-r14.test.mjs`, including a deterministic checkpoint `--check`.

### Review decisions, materialization, and chronology

All 500 rows retain author `Codex Art and Architecture Author` at `2026-08-21T20:00:00.000Z`. Factual approval uses the exact identity `Codex independent factual/source reviewer R14 — task13-factual-r14-20260823T0339366573460p0300` and artifact time `2026-08-23T03:39:36.6573460+03:00`; editorial approval uses `Codex independent Task 13 evidence-bound editorial auditor R14` and `2026-08-23T03:29:19.5099923+03:00`. The author and two reviewers are pairwise distinct (`3` identities), both reviews follow authoring, and the eventual translation reviewer remains intentionally unchecked.

The factual artifact approves `500/500` rows, requires zero corrections, records no blocking IDs, and retains four explicitly resolved/nonblocking findings without misclassifying them as blockers. The editorial artifact covers 500 rows, 100 sets, and 500 evidence assertions, has no findings or correction proposals, and all nine verdict matrices pass without correction rules.

The real current-offset final materialization time is `2026-08-23T03:52:44.154+03:00`, later than both reviews and no later than the immediate postwrite clock. `evidence.jsonl` contains 500 distinct rows, 500 factual approvals, 500 editorial approvals, 500 null translation reviews, zero schema failures, and zero non-English-review drift. Row `0273` preserves the canonical full assertion `Charles Garnier — His additions included a concert hall later named Salle Garnier, while Jules Dutrou redesigned other gaming and public spaces.` Pending evidence remains null-review and byte-identical at `425058e7a0ec2c36c8ec7aa8a8e5949afc875d5f071324c1aa1f6ee0f8ec3dfe`.

### Successful pretranslation validation and checkpoint

The unchanged shared validator was run against the exact authored and R14-approved work evidence:

```text
.\node_modules\.bin\tsx.cmd scripts/content/validate.ts --input content/work/05-art-architecture/authored.csv --evidence content/work/05-art-architecture/evidence.jsonl --batch 05-art-architecture --mode batch --allow-missing-et --report content/work/05-art-architecture/pretranslation-validation-r14.json
```

It exits `0` with `blocking=false`, exactly 500 `MISSING_TRANSLATION` warning issues, exactly 500 one-to-one matching `MISSING_TRANSLATION` exceptions, `SOURCE_MISMATCH=0`, and zero unexpected issue or exception codes. The deterministic R14 pretranslation checkpoint was frozen at `2026-08-23T03:53:08.124+03:00` with status `r14-english-reviews-materialized-ready-for-machine-translation`, `pretranslationGatePassed=true`, and `publicationAuthorized=false`; the historical failed R13 gate remains preserved.

Final R14 work-artifact hashes before this sole report append are:

- `materialize-r14-english-approvals.mjs`: `27a41495a55d23d08895839400c2c7ac7587c14e4844bb86a39eda3d95dd7dc3`
- `english-approval-materialization-r14.test.mjs`: `b8a0f29353134fd51238f1b7242d388a4e9fe5fb351d5dfac3a6a9f87a98641a`
- `evidence.jsonl`: `64f4f8bbe4639ef2277933fe4ff2d99e1fe2e603f7d9460bfbc5ca9025240742`
- `english-approval-materialization-r14-checkpoint.json`: `dc6f68b084eb24ecbb5fc427840d3e31e2a7c5fba0e6b63146a02e25df80f0e1`
- `pretranslation-validation-r14.json`: `062534ee40becb879482163a384dbd8dd1edf33ccd809aef9d4ac11325063563`
- `build-r14-pretranslation-checkpoint.mjs`: `edbba1d4e27a6965edc508cf64548f5758689864a67896537a7f562dc5d63522`
- `pretranslation-checkpoint-r14.test.mjs`: `1f5d2559edeb354a2d4363d328c1d72a7117fe60002b23cbed8c042e214f145f`
- `r14-pretranslation-checkpoint.json`: `19c11dcade0674b3b1d7c2ebccaee784da7b3a7e4040331bf37cfb058b770216`

### Tests, containment, and remaining gate

The R13 correction plus Task 13 candidate/draft/source contracts pass `5/5`; `audit-candidates.mjs`, `audit-draft.mjs`, and `audit-r13-freeze.mjs --check` exit `0`. Candidate and draft audit hashes remain `c7734c636405a3a9dc67d80e392dfb48cc6149a4f5ab0955992a0505f634936c` and `d714d7d7d75e5dc65e549310edf556955b66bf921faac6f92acd05438a28253f`. `git diff --check` passes, HEAD remains `ac74919d7d94bdb1b78070e8c596d0dec70306b5`, and the index has zero staged paths.

Accepted authored, generated, report, and canonical docs-progress bytes remain exact at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`. Accepted evidence remains absent and no work or accepted Estonian output was created. No shared validator, publisher, authored, pending, accepted, docs/progress, stage, commit, publication, or release action occurred.

The exact R14 work boundary is ready for separately authorized machine translation. Translation review remains null for all 500 rows, and translation review, publication materialization, accepted-content promotion, release validation, and commit remain future gates.

## Raw machine translation — BLOCKING semantic-editor gate (2026-08-23)

This section records only the authorized Helsinki English-to-Estonian machine draft and its unwaived raw diagnostics. It does not represent semantic correction, a diagnostic waiver, translation approval, publication authorization, accepted-content promotion, staging, or a commit.

### Exact input gate and environment provenance

Before any translation-environment or output write, the supplied current boundary matched exactly: authored `f070a9fa6d3ddabee6d0deee8d816e6b4427f428476c223f39e6476a1d54bb2b`; R14-approved evidence `64f4f8bbe4639ef2277933fe4ff2d99e1fe2e603f7d9460bfbc5ca9025240742`; null-review pending evidence `425058e7a0ec2c36c8ec7aa8a8e5949afc875d5f071324c1aa1f6ee0f8ec3dfe`; calibration `8a243395b3fd3304b75ad83039d3bc3853ec07cbcc9525ca4c1c50c4bac4e278`; source manifest `d4c263cfa7f9e3882144ea7bbfa2b092133e7ba187f8495ef7dc446ef7c1d425`; factual R14 `57f3f60d368df4c17b3262c693ef738ce56434f8138078cbce91a048063303de`; editorial R14 `4df6b02bc4d3f3adc64c3deabaad11fe616bcc02afbe0721431f7a3049c8eb8b`; English-approval materialization checkpoint `dc6f68b084eb24ecbb5fc427840d3e31e2a7c5fba0e6b63146a02e25df80f0e1`; pretranslation validator `062534ee40becb879482163a384dbd8dd1edf33ccd809aef9d4ac11325063563`; R14 pretranslation checkpoint `19c11dcade0674b3b1d7c2ebccaee784da7b3a7e4040331bf37cfb058b770216`; and this authoritative report before append `6e77a669a55286ee2ccd812850f802604ac581d474455d5f7dcd11471a9c3bf8`.

The input CSV was 500 rows by 25 columns. Approved evidence had 500 factual approvals, 500 editorial approvals, and 500 null translation reviews. Pending evidence had factual, editorial, and translation reviews null on all 500 rows. The pretranslation validator was nonblocking with exactly 500 `MISSING_TRANSLATION` issues, 500 one-to-one `MISSING_TRANSLATION` exceptions, and no other code. The R14 checkpoint's embedded current pins and `500/500/500` counts matched. Its historical report pin `aaefc3b55bdd605b3e2f4b38b36e1f0b9273e8960f68a7b1f0389b0689e43191` was independently reconstructed by cutting the current report immediately before the R14 section; the prefix matched exactly. Consequently, the historical R14 materializer correctly fails closed against the later report append, while the current machine runner binds the supplied current report hash.

The Task 13 interpreter and Helsinki model were copied byte-for-byte from the proven Task 12 environment, whose provenance points to Task 11. Task 12's after-manifest stayed `b3fcba106d17c49fea7a906abc7b3e1b4ae076a46e91b4a9cf8b86c01373e828`; Task 11's origin after-manifest stayed `eaf25dbdfe9cbb05cd22c7d4999ae669ce25e011416e9d8ca0ea4a14807badf2`. Both source trees had zero reparse points before copying. The complete source/local manifests prove:

| Tree | Files | Bytes | Content-manifest SHA-256 | Before/after |
| --- | ---: | ---: | --- | --- |
| Task 12 source interpreter | 2,527 | 71,425,909 | `8fce9072ecc53d6d7ebc1d48fa22b65136e834d13c3d05d269bb13efe48cdfa9` | exact |
| Task 13 local interpreter | 2,527 | 71,425,909 | `8fce9072ecc53d6d7ebc1d48fa22b65136e834d13c3d05d269bb13efe48cdfa9` | exact |
| Task 12 source model | 27 | 1,203,871,090 | `2a8109dddf6ee826c4ca86b161910c439199f94f496fed37412d4339704cd3bb` | exact |
| Task 13 local model | 27 | 1,203,871,090 | `2a8109dddf6ee826c4ca86b161910c439199f94f496fed37412d4339704cd3bb` | exact |

The full pre-run and post-run manifest hashes are `45d5ca215e3905c0c11c97216783b0edc81eef8056a8f1b4d735f6c554fb7267` and `2d338c3e29bdfa015a188ba0ab4ec41a9115bc82041ddf26abd8e9ece5cf6381`; every source/local file count, byte count, entry hash, and aggregate content hash is unchanged, and task-local links/junctions/reparse links remain zero. The isolated offline probe loaded `MarianTokenizer` and `MarianMTModel` from the Task 13 cache using Python `3.12.6`, torch `2.11.0+cpu`, and transformers `4.57.6`; `cudaAvailable=false`, model device was `cpu`, and the smoke input `A painting` produced `Maal.` All runtime, model, npm, torch, and temporary paths were Task 13-specific paths on `E:`. The 542 task-owned temporary files (1,537,500 bytes) were removed after verification; the reproducibility caches remain.

### Exact generation and raw diagnostic runs

The fail-closed runner rechecked all current pins, the before-manifest, shared translator `98744d1405ebad35bd5d2d369e899c4440931bee3a896d125b987b6127a6d629`, and proven Task 12 runner `b3962155db265005aeb347bee8ff35f234d581cb81f8d9b95b887c10a4bd0b37` before opening the output. It ran exactly:

```text
content/work/05-art-architecture/.venv-translate/Scripts/python.exe scripts/content/translate_en_et.py --input content/work/05-art-architecture/authored.csv --output content/work/05-art-architecture/generated.en-et.csv --model Helsinki-NLP/opus-mt-en-et --checkpoint content/work/05-art-architecture/translation-machine.checkpoint.json --batch-size 16 --cache-dir content/work/05-art-architecture/.cache/translation
```

The CPU run began `2026-08-23T01:08:04.555Z`, completed `2026-08-23T01:15:02.094Z`, took `417.539` seconds, and exited `0`. Output was present and the resumable checkpoint was absent on success. The raw diagnostic command then ran immediately, without filters or waivers:

```text
npx.cmd tsx scripts/content/translationDiagnostics.ts --input content/work/05-art-architecture/generated.en-et.csv --report content/work/05-art-architecture/translation-diagnostics.machine.json
```

It exited `1`, with `blocking=true`, 500 checked rows, 1,126 issues, and 989 pending exceptions:

| Code | Severity | Issues | Rows | Pending exceptions | Exception rows |
| --- | --- | ---: | ---: | ---: | ---: |
| `ANSWER_DRIFT` | error | 12 | 12 | 12 | 12 |
| `NUMBER_DRIFT` | error | 22 | 22 | 22 | 22 |
| `SUSPICIOUS_PROPER_NOUN_CHANGE` | warning | 905 | 468 | 773 | 468 |
| `UNCHANGED_TRANSLATION` | warning | 175 | 146 | 170 | 146 |
| `VARIANT_DRIFT` | error | 12 | 12 | 12 | 12 |

The exact issue and exception row-ID lists and per-field counts are frozen in `machine-draft-checkpoint.json`. The 12 `ANSWER_DRIFT` rows are 0013, 0067, 0101, 0179, 0208, 0229, 0324, 0360, 0370, 0385, 0418, and 0499. The 22 `NUMBER_DRIFT` rows are 0013, 0036, 0037, 0066, 0067, 0070, 0101, 0179, 0208, 0221, 0229, 0273, 0324, 0334, 0349, 0360, 0370, 0385, 0418, 0432, 0470, and 0499. The 12 `VARIANT_DRIFT` rows are 0013, 0101, 0179, 0208, 0230, 0235, 0324, 0370, 0375, 0385, 0493, and 0499. Every exception remains `status=pending`, `reviewerReason=pending-review`, with blank corrected text; none is a waiver or approval.

Frozen machine-stage hashes are:

- `generated.en-et.csv` (375,119 bytes): `1002d00fd0e6690e9e252b213e43341c48d0b257772673ead0894b1df7cdf5d3`
- `translation-machine-run.json`: `a6cabbb479b0b02eed6409aa4abbe24d3868033b7c547dc2ee5e80aef311ff19`
- `translation-diagnostics.machine.json`: `168937fcfe305c3ea81560f92021b13577c0189fae26c0463fb59d4e2b082f4f`
- `machine-draft-checkpoint.json`: `25230275bba521eaa5cca99e5dda409dd7c1ff6877472c25a1075c207c6c578f`
- `run-machine-translation.mjs`: `538e3ee9c5b5546702d6b38a372dba76ef440ff3ec3d2408ccaee631355e5152`
- `build-translation-environment-manifest.mjs`: `c6f96ac15c2f0ac2df8d53e56635e1b2e5b4d96f94a19f55c3d470067b898bb3`
- `build-machine-draft-checkpoint.mjs`: `e2461b6e42ff3011c312d8acfdfc0217b3b06c60b662d484cb98da350ff50880`

### Structural checks, contracts, warnings, and containment

The deterministic checkpoint builder was run, checked, rebuilt, and checked again; both checkpoint hashes were `25230275bba521eaa5cca99e5dda409dd7c1ff6877472c25a1075c207c6c578f`. It proves 500 authored rows, 500 generated rows, 500 approved-evidence rows, 500 pending-evidence rows, and 25 identical columns; all 19 non-Estonian columns compare equal row by row; required Estonian category, clue, response, and explanation cells are nonblank; decoded variants are 253 English and 253 Estonian with no count drift or unexpected target variants; and `translation_status=machine` on all 500 rows. Factual/editorial approvals remain `500/500`, translation review remains null `500/500`, pending remains null-review `500/500`, and the resumable checkpoint is absent.

Focused contracts passed:

- `content/work/05-art-architecture/.venv-translate/Scripts/python.exe -m unittest -v tests/unit/content/test_translate_en_et.py`: exit `0`, `2/2` tests.
- `npx.cmd vitest run tests/unit/content/translationDiagnostics.test.ts`: exit `0`, `7/7` tests in one file.
- `node content/work/05-art-architecture/build-translation-environment-manifest.mjs --after --check`: exit `0`, exact full environment.
- `node content/work/05-art-architecture/build-machine-draft-checkpoint.mjs --check`: exit `0`, deterministic structure/checkpoint.
- `git diff --check`: exit `0`; it emitted 26 LF-to-CRLF notices for pre-existing modified paths and none for Task 13, with no whitespace error. The three authored machine-stage scripts have zero trailing-whitespace lines.

Runtime warnings were preserved rather than suppressed: CUDA was not found; `sacremoses` was recommended; torchao `0.16.0` extensions were skipped for torch `2.11.0+cpu`; torch distributed redirect support is unavailable on Windows; and npm printed an available-major-version notice. These are nonblocking environment notices. The raw diagnostic errors and warnings above are blocking and remain unresolved.

Protected accepted authored, generated, report, and canonical docs-progress hashes remain exact at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; accepted evidence remains absent. Source manifest, calibration, pending evidence, approved English evidence, R14 reviews, R14 materialization, pretranslation validator, and R14 checkpoint remain at their input pins. Protected-path status is empty, the Git index has zero staged paths, and no shared translator/diagnostic/validator, accepted, canonical docs/progress, publication, or release artifact changed.

This draft is intentionally blocked. The next gate is a separately authorized semantic translation editor that must inspect all 500 rows, resolve every `ANSWER_DRIFT`, `NUMBER_DRIFT`, `VARIANT_DRIFT`, proper-name, and unchanged-translation finding without changing the English/source boundary, rerun diagnostics without waivers, and obtain independent translation review on all 500 exact final rows. No translation approval or publication action is permitted from this raw machine checkpoint.

## Estonian semantic-editor pass — complete, independent semantic review required (2026-08-23)

This section records the authorized Estonian semantic-editor correction pass only. It does not record translation approval, reviewed status, publication authorization, accepted-content promotion, staging, a commit, or a waiver.

### Frozen input and direct inspection coverage

The editor gate matched every supplied current pin before the first write: authored `f070a9fa6d3ddabee6d0deee8d816e6b4427f428476c223f39e6476a1d54bb2b`; raw generated draft `1002d00fd0e6690e9e252b213e43341c48d0b257772673ead0894b1df7cdf5d3`; approved English evidence `64f4f8bbe4639ef2277933fe4ff2d99e1fe2e603f7d9460bfbc5ca9025240742`; machine run `a6cabbb479b0b02eed6409aa4abbe24d3868033b7c547dc2ee5e80aef311ff19`; raw diagnostics `168937fcfe305c3ea81560f92021b13577c0189fae26c0463fb59d4e2b082f4f`; machine checkpoint `25230275bba521eaa5cca99e5dda409dd7c1ff6877472c25a1075c207c6c578f`; environment before `45d5ca215e3905c0c11c97216783b0edc81eef8056a8f1b4d735f6c554fb7267`; environment after `2d338c3e29bdfa015a188ba0ab4ec41a9115bc82041ddf26abd8e9ece5cf6381`; and this authoritative report before the sole append `c2642378751c40ca48c122bb05906c74688a2aa7f9c9970106719ae569e50d1e`. Embedded checkpoint pins and the raw invariants also matched. `generated.en-et.raw.csv` is an immutable read-only snapshot with the exact raw hash above.

Every one of the 500 rows was directly compared with English across `category_name_et`, `clue_et`, `response_et`, `accepted_variants_et`, and `explanation_et`: 2,500 inspected Estonian fields. The inspection also decoded and mapped all 253 Estonian alternatives and checked all 100 category names as coherent five-row repeated sets. Corrections cover grammar, morphology, meaning and qualifier preservation, negation and number fidelity, canonical answer form, alternative mapping, terminology, casing, punctuation, typography, naturalness, and proper-name/title retention where appropriate.

The deterministic exact-prior correction map and application layer materialized the required milestones:

| Through | ET fields | Decoded alternatives | Sets | Corrected rows | Changed fields | Output SHA-256 |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 100 | 500 | 37 | 20 | 100 | 337 | `b6c749981b082df065bfc20d5ba8cc0c485172da12daab93f0950359c6cfb01f` |
| 250 | 1,250 | 124 | 50 | 250 | 833 | `91d4c55da59008590a4cb1b019c545d012234d965ecf37ea7dc5f88c10a44a70` |
| 400 | 2,000 | 201 | 80 | 400 | 1,342 | `17d1018ab010c256646c8bc3151de54e5d9d09a20aad94e6dd6d4d57c85b07b1` |
| 500 | 2,500 | 253 | 100 | 500 | 1,692 | `128efd18756fd81b311757aec63508e4a7f85c6ae2b67296793cd8d5b91944d4` |

Each milestone proves 500 rows by 25 columns, all 19 non-Estonian fields unchanged row by row, zero required Estonian blanks, zero decoded-variant count drift, `translation_status=machine` on 500 rows, and 500 null `translationReview` values. Its scoped diagnostics have zero `ANSWER_DRIFT`, `NUMBER_DRIFT`, or `VARIANT_DRIFT` errors in the inspected range. Later raw rows were allowed to retain errors only until their inspection milestone.

### Final unwaived diagnostics and warning disposition

The final diagnostic run was unfiltered and unwaived. It exits `0` with `translation.blocking=false`, 500 checked rows, and zero errors: `ANSWER_DRIFT=0`, `NUMBER_DRIFT=0`, and `VARIANT_DRIFT=0`. It retains 1,072 conservative warnings and 934 pending diagnostic exceptions: 865 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 207 `UNCHANGED_TRANSLATION` warnings. These are expected heuristic flags for translated names/titles and deliberately preserved proper names or terms; they are not silently suppressed.

`translation-editor-warning-audit.json` maps all 1,072 warnings one-to-one in diagnostic order using 1,072 unique ordinal IDs. It records `mapped=1072`, `unmapped=0`, 136 duplicate raw-ID keys and 138 additional duplicate raw-ID occurrences without collapsing them, `approvals=0`, and `waivers=0`. Every entry has the explicit nonapproval disposition `pending-independent-semantic-review`.

Final structural integrity remains 500 by 25, non-Estonian drift `0`, required blanks `0`, variant-count drift `0`, machine status `500`, and non-null translation reviews `0`. The final generated, inspection, delta, editor checkpoint, diagnostic, verification, warning-audit, editor-report, and final-checkpoint hashes are respectively `128efd18756fd81b311757aec63508e4a7f85c6ae2b67296793cd8d5b91944d4`, `f281f5db7530f22a90386749b4eedd7dac7ae64c39a99a45f0cfc8d751387a8f`, `7f577581f36e25a53e4f2b0b5233625d8411bec800065ff7fab034357dda37fd`, `68d170b9eef961c514466732b78bc0d9f64aa183b69c5b41513a4713f4c29a93`, `66fe4855312ecfa186828214a71384d355f6a1dda5ac7cbb88842bb53251a35f`, `d8b60e9812851a4ed0899334f923e6efe5684531e67e25fecfec18b9391d1f34`, `6eb465e367f9ded7cca74a326cf56e288333c7c0cdd08ae1a53501933254463f`, `5b4c82d304f76978a64d7d4b9e34edc67ec34b5138a6d682938a13b7463a44c0`, and `a6333ccc378c07e24fb012f3a34f7c29142b860eff32fa1ecca73d13371987f1`.

The deterministic scripts are frozen at: input freezer `bf9277a5d6d04f34093d035f8e9a5090585314ca0496bf4fb295f3f7c6c6eb16`; correction map `f3321f78ff38c122601e3f0495a28810c1c25e81937c4e4aa005952803fbf441`; application layer `999e1e6a3a6b6532b437a143535c56808f2e1c76782fa129e2f8282d362f88be`; milestone verifier `c5b3faecb074b25aa07617717bd188dd6b93c546685f019876d808c40cca6421`; and final artifact builder `01a136216b9ffa9f29b7906462c0af6f07048a688d2131b2994a75225b5657f4`.

### Replay, contracts, containment, and remaining gate

The application, milestone verification, and final artifact builder all pass deterministic `--check` replay with changed artifacts `0`. The Task 13 translator contracts pass `2/2`, and the translation-diagnostic Vitest contracts pass `7/7` in one file. `git diff --check` exits `0`; the Task 13 editor scripts have zero trailing-whitespace lines; HEAD remains `ac74919d7d94bdb1b78070e8c596d0dec70306b5`; and the Git index has zero staged paths.

Protected accepted authored, generated, report, and canonical docs-progress hashes remain exact at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`, and `f8e1dd9d9a787d5deec2e73dcaeeacd74cf7022b3906b23115a05dd48d2385e4`; their protected-path status is empty. Accepted Task 13 evidence remains absent. Approved English evidence, pending evidence, sources, candidates, calibration, ordering, and all non-Estonian fields remain unchanged. No shared translator, diagnostic, validator, accepted path, canonical docs/progress file, approval, waiver, publication, staging, commit, or release artifact was changed.

The remaining concern is the deliberately conservative warning set, which must be evaluated by a fresh independent Estonian semantic reviewer against this exact final hash. That reviewer—not this editor pass—must decide approval for all 500 rows and materialize `translationReview` only in a separately authorized gate. Until then, the work output remains `machine`, translation review remains null on all 500 rows, and publication or accepted-content promotion is not authorized.

## Estonian semantic-review R1 corrections — materialized, independent semantic R2 required (2026-08-23)

This section records only the deterministic correction round requested by independent Estonian semantic review R1. Before the first write, all supplied artifact hashes and all review-embedded pins matched, including the semantic R1 review `29e2e5e4cd3ee24578ac1a7280064b4598211c376d038c2f5a685b4a0cb03291`, editor-final generated input `128efd18756fd81b311757aec63508e4a7f85c6ae2b67296793cd8d5b91944d4`, raw read-only snapshot `1002d00fd0e6690e9e252b213e43341c48d0b257772673ead0894b1df7cdf5d3`, approved English evidence `64f4f8bbe4639ef2277933fe4ff2d99e1fe2e603f7d9460bfbc5ca9025240742`, and this report’s pre-append hash `0b41f00d6602e599feec035f2fdb0ae9bb333515e2218b81a36bec74bf92ece8`.

The focused materialization contract first ran RED with `2/2` failures because the deterministic R1 layer did not exist and all 71 reviewed fields still held their exact pinned priors. The minimal exact-prior layer then ran GREEN at `2/2`, including a tampered-prior test that fails closed. It materializes the authoritative review union without deviation: 55 rows, 71 Estonian fields, 22 correction-required decoded alternatives, 34 affected five-row sets, and all 15 reviewed warning corrections. Repeated category labels are propagated exactly across set ordinals 48, 83, and 93. Proposal deviations, missing proposals, prior mismatches, and unmapped proposals are all zero.

The corrected output remains 500 rows by 25 columns. All 19 non-Estonian fields remain byte-for-byte equal row by row, required Estonian blanks are zero, decoded-variant count drift is zero, `translation_status=machine` remains on all 500 rows, factual/editorial approvals remain `500/500`, and `translationReview` remains null on all 500 evidence rows. No English text, source, candidate, calibration, ordering, status, or review block changed.

Fresh diagnostics were run without a filter, suppression, waiver, or approval. They exit `0` with `blocking=false` and zero errors: `ANSWER_DRIFT=0`, `NUMBER_DRIFT=0`, and `VARIANT_DRIFT=0`. The final conservative warning inventory is 1,067 warnings and 930 pending exceptions: 872 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 195 `UNCHANGED_TRANSLATION`. The ordinal audit maps all 1,067 warning occurrences, preserves duplicate raw IDs and their occurrence counters, and records `unmapped=0`, `waivers=0`, and `approvals=0`. It also links the 15 reviewed warning corrections at prior ordinals 414, 463, 726, 771, 803, 815, 817, 818, 819, 821, 835, 844, 873, 899, and 1001 to their exact correction and final resolved, persisted, or reclassified conservative-warning outcome.

The exact R1 proposals exposed three false-positive numeric diagnostics: English `Genesis` versus the conventional Estonian book name `1. Moosese` on rows 0066 and 0070, and the lexical hyphen in English `1503-or-1504` on row 0221 being parsed as a negative sign after the corrected Estonian typography removed the hyphens. The task owner explicitly authorized the narrow shared diagnostic fix. `translationDiagnostics.ts` now requires a non-letter/non-number sign boundary and recognizes the bidirectional `Genesis`/`1. Moosese` numeric equivalence; its focused regression proves both false positives clear while genuine signed-number drift still blocks. The shared diagnostic and its sole focused test hashes are `db1af37ab99b1631e2a9f256ff4890eff1860ee87d55fee50857cd0207424f75` and `3c2e32f1b79e2d07c55a39959533a2ebb4b62a49e17bf3843c70e36c3c84ad3b`. No other shared file changed for this round.

Frozen semantic-R1 hashes are:

- corrected generated output and semantic-R1 snapshot: `7abbe861d480085d89c9f48182743bbacde8701dcd43b69b11936fd8cdbc133b`
- final diagnostics: `2a139041d8a62d4e79b96d9d56f329ffb32668e89c05490781eab1b9b4f84bf7`
- correction ledger: `5119a8df3583f114257afa407c57e154e3cbf4f7715bbf2808e224b95ba6e1a8`
- correction delta: `2ac98e3c5cb316805898673916fc30f16e41974291daff4c2a6b9c9791905a61`
- materialization checkpoint: `3e187bea0dc47edd6741dc80e485cc366cf232804bdf0a76e1dbefe2301f3aa4`
- ordinal warning audit: `cb2a0a2711212e3285c20e0e971d1ea609a139f0d4a143f922f1eac19983f3f0`
- semantic-R1 report artifact: `8686b666b872eb82284a5fb4cc1e06becf8c780ea20eb2c69d124a4d5e5d21a4`
- final semantic-R1 checkpoint: `20158b9417c31361a92ee4c002add769fee1242123210597c07c69f7ca43a2d4`
- materializer, focused contract, and final builder: `c28edd7a536c5e08818423c7df1cdfc31ba3bddad13a210c2a41f154a193f074`, `5d558d8e1fa7541de6d89c991dbee6d5e4652d13420044865422fe6a4e989718`, and `440321f0e2f04266900d234d1c024000857243628d8e5433c0bc1440f409c010`

Final verification is green: the semantic-R1 Node contract passes `2/2`; the full focused translation-diagnostic Vitest file passes `8/8`; the Python translator contracts pass `2/2`; diagnostics reproduce the exact hash above; and both materialization and final-artifact builders pass deterministic `--check` with changed artifacts zero. `git diff --check` exits `0`, task-local temporary files are zero, the raw snapshot is still read-only, and the Git index has zero staged paths. Protected accepted authored, generated, and report artifacts remain at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, and `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`; no accepted evidence, publication artifact, docs/progress file, release artifact, staging, or commit was created or changed by this round.

This correction round is not translation approval. The 1,067 conservative warnings and every corrected Estonian field now require a fresh independent semantic R2 against exact output hash `7abbe861d480085d89c9f48182743bbacde8701dcd43b69b11936fd8cdbc133b`. Until that separately authorized gate, status remains `machine`, `translationReview` remains null, and accepted-content promotion and publication remain unauthorized.

## Estonian semantic-review R2 corrections — materialized, independent semantic R3 required (2026-08-23)

This section records only the deterministic correction round required by independent Estonian semantic review R2. Before the first write, all 19 supplied workspace and repository pins matched, the raw snapshot remained read-only, and all 15 embedded R2 inventory checks were exact. Key inputs were semantic R2 review `c1a8daa60a4feb9f4612fcbb20ffd3b9cfec47566e40f5182d21946fb4a3be71`, semantic-R1 generated prior `7abbe861d480085d89c9f48182743bbacde8701dcd43b69b11936fd8cdbc133b`, R1 diagnostics `2a139041d8a62d4e79b96d9d56f329ffb32668e89c05490781eab1b9b4f84bf7`, raw snapshot `1002d00fd0e6690e9e252b213e43341c48d0b257772673ead0894b1df7cdf5d3`, approved English evidence `64f4f8bbe4639ef2277933fe4ff2d99e1fe2e603f7d9460bfbc5ca9025240742`, diagnostic-support review `60cbbe0eac77c00cd4bfff4d0b02bf4f6754fda5198bd06e7d7438d6ffb3bb39`, and this authoritative report’s pre-append hash `1229ad92862b9fc1e6994551b7416e537b82ae82077d1b5c58cbd9a9544f26ff`.

The focused materialization contract ran RED with `2/2` failures because the deterministic R2 layer was absent while all 11 reviewed fields retained their exact pinned priors. The minimal exact-prior layer then ran GREEN at `2/2`, including a tampered semantic-R1-prior test that fails closed. It materializes exactly 11 rows, 11 fields, and 11 sets: clue text at rows 0147, 0245, 0399, 0401, 0443, and 0475; explanation text at rows 0250, 0340, 0449, and 0460; and response text at row 0257. Variants, repeated categories, and warning-linked fields changed zero times. Proposal deviations, missing proposals, prior mismatches, and unmapped proposals are all zero.

The R2 review rechecked all 71 R1-proposed fields: 70 pass, and row 0443 `clue_et` is the sole R1-proposed recurrence. That recurrence is included once as R2 finding `ET-R2-008` and is now the exact R2 proposal. All other ten R2 corrections arose from the 2,429 carry-forward fields. The corrected output remains 500 rows by 25 columns with all 19 non-Estonian fields unchanged row by row, unexpected Estonian drift zero, required blanks zero, exactly 253 decoded alternatives with count drift zero, and 100 coherent five-row category sets. Factual/editorial approvals remain `500/500`, `translation_status=machine` remains on all 500 rows, and `translationReview` remains null on all 500 evidence rows.

Fresh diagnostics used the committed, unchanged diagnostic implementation and were unfiltered and unwaived. They exit `0` with `blocking=false`, total errors zero, `ANSWER_DRIFT=0`, `NUMBER_DRIFT=0`, and `VARIANT_DRIFT=0`. The output retains 1,067 conservative warnings and 930 pending exceptions: 872 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 195 `UNCHANGED_TRANSLATION`. R2 adjudicated every warning as a false-positive signal, not as approval or waiver. The final ordinal audit maps all 1,067 warnings one-to-one, records 1,067 unique ordinal IDs and 930 unique raw IDs, and preserves 135 duplicate raw-ID keys plus 137 additional duplicate occurrences. Its counts are `mapped=1067`, `unmapped=0`, `correctionRequired=0`, `approvals=0`, and `waivers=0`.

Frozen semantic-R2 hashes are:

- corrected generated output and semantic-R2 snapshot: `58256f24b3a2d9f747041ec61f84aacdc2dfdb1b564a9b4579aa0459ab3ccf6e`
- final diagnostics: `2a139041d8a62d4e79b96d9d56f329ffb32668e89c05490781eab1b9b4f84bf7`
- correction ledger: `750d683c0589c2dc5247731b2bf37e2fe4b3c0c964eb2690cccf4a57fd4b782a`
- correction delta: `f5362ccc8c75754d6dd561fac49d79b26f3dc0d98c750bc09014e5cb1bef1f82`
- materialization checkpoint: `978db901ce98dc123947cc3b462144f463a54b04cacfd19f08c01e5d42d9a229`
- ordinal warning audit: `e5a8ab1e70b9229ba1533c16f26cf030c049ff8f01a104adbf0546b0f36bb0b6`
- semantic-R2 report artifact: `4b64848a8c39424b87747403486e4ecec251ec8d6b8270553f22cc47bc6c597f`
- final semantic-R2 checkpoint: `c90ce4912d71bc46fded59d9e71266d0a9c9ee5977063c97550b5623cf5228ab`
- materializer, focused contract, and final builder: `0092904947c4ac818d557cd8234a1185a780110a72f5b9d0e26a707da8ff0e55`, `8db16377115b7f18bf8d98b9c5f9384161104ace67342d956ab23740a4b06a58`, and `0954b7116cb151394c3e0ed1debac66a9b384ea1b42052a402d112399b0a3ca6`

Final verification is green: the R2 Node contract passes `2/2`; the committed translation-diagnostic Vitest file passes `8/8`; the Python translator contracts pass `2/2`; diagnostics reproduce the exact hash above; and both R2 builders pass deterministic `--check` with changed artifacts zero. No shared file differs from committed `ce5e088`. `git diff --check` exits `0`, task-local temporary files are zero, the raw snapshot remains read-only, and the Git index has zero staged paths. Protected accepted authored, generated, and report artifacts remain at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, and `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`; no accepted evidence, publication artifact, shared code, docs/progress file, release artifact, staging, or commit was created or changed by this R2 round.

This correction round is not translation approval. Independent semantic R3 must recheck all 11 exact corrected fields, especially the row 0443 recurrence, against final output hash `58256f24b3a2d9f747041ec61f84aacdc2dfdb1b564a9b4579aa0459ab3ccf6e`. Until that separately authorized gate, status remains `machine`, `translationReview` remains null, and accepted-content promotion and publication remain unauthorized.

## Final Estonian approval materialization and prepublication freeze (2026-08-23)

This section records the deterministic work-only materialization of the independently approved Estonian review and the successful prepublication gates. It does not authorize or perform accepted-content promotion, publication, release validation, staging, or a commit. The next gate is a fresh independent bilingual/source sample against the exact frozen work artifacts.

### Exact approval boundary and TDD materialization

Before the first approval write, the supplied current artifacts matched exactly: semantic-R2 generated output `58256f24b3a2d9f747041ec61f84aacdc2dfdb1b564a9b4579aa0459ab3ccf6e`; English-approved evidence `64f4f8bbe4639ef2277933fe4ff2d99e1fe2e603f7d9460bfbc5ca9025240742`; null-review pending evidence `425058e7a0ec2c36c8ec7aa8a8e5949afc875d5f071324c1aa1f6ee0f8ec3dfe`; semantic-R2 diagnostics `2a139041d8a62d4e79b96d9d56f329ffb32668e89c05490781eab1b9b4f84bf7`; semantic R3 review `5a3664fcffb264aac83e2b52820e1dff8571bf9758f592a73b08cfb2417355aa`; R2 final checkpoint `c90ce4912d71bc46fded59d9e71266d0a9c9ee5977063c97550b5623cf5228ab`; this authoritative Task 13 report `4ce1dcd69010cd1697f46180d18864db7ee07297efc6c27b96bcfda5aa870489`; and the separately labelled work verification report `0862a8bc2c532e1a9f16ac0650ecb1caf0823ea714f1507d3d06b9856a994160`. All 27 R3 embedded input pins, both environment pins, and all 25 R2 checkpoint hash entries were independently reread and matched before either approval output was opened.

The focused materialization test was written first. Its RED run was `0/1` because `materialize-final-et-approval.mjs` did not exist. After the minimal implementation and correction of the fail-closed R2 embedded-pin inventory assertion from 24 to the actual 25 entries, the real-write test passed `1/1`. It also rejects a stale reviewed generated prior and a non-null evidence prior, validates all evidence rows through the repository schema, and performs two successful byte-stable `--check` replays.

Independent semantic R3 used reviewer identity `Codex independent Estonian semantic reviewer R3 — task13-et-semantic-r3-20260823` at `2026-08-23T04:13:41.103Z`, distinct from the author, factual reviewer, and editorial reviewer and later than all three. It directly approved 500 rows, 2,500 Estonian fields, 253 decoded accepted alternatives, 100 sets/repeated categories, and all 1,067 conservative warnings. All 500 row verdicts, 2,500 field verdicts, 253 variant verdicts, and 100 set verdicts pass; all warnings are false-positive semantic signals; findings, field/set/warning proposals, remaining correction inventories, and publication authorization are zero.

The materialization at `2026-08-23T04:23:23.768Z` changes exactly `translation_status=machine` to `reviewed` on 500 generated rows and exactly `translationReview=null` to the R3 reviewer/time/approved block on 500 evidence rows. All other generated and evidence fields, row order, clue IDs, English and Estonian text, variants, sources, candidates, factual reviews, and editorial reviews remain unchanged. The author plus three reviewers are four distinct identities. Pending evidence remains byte-identical and null-review at `425058e7a0ec2c36c8ec7aa8a8e5949afc875d5f071324c1aa1f6ee0f8ec3dfe`.

Frozen approval materialization hashes are:

- generated reviewed output: `9ecfc27e4fe97b01eb32cf6c19e243ba756e7340cd78cc11ac483a8da2e2d49b`
- approved evidence: `308f1f0c6f68c16a9fe166ec9a54bdff4193654e17c331e8e7d7142d7587ab0a`
- materializer: `da998165dd9f5b412ded930331cd92f360982c580b4d542e00a6791a7ad5d086`
- focused materialization contract: `055f562252084474fa8c1f3f37f77548ea3249ecabf1aeea5999be4b00a61989`
- materialization checkpoint: `15d051ede84a9737b37849d0f809b5c8e99430f493256fe902088e99ee733de6`

### Validator parity ruling and independent review

The first fresh generated-validator run correctly exposed a shared-code parity gap rather than a content defect: `scripts/content/validate.ts` retained an older independent numeric comparator and emitted the same three false `NUMBER_DRIFT` errors for rows 0066, 0070, and 0221 that the already reviewed diagnostic comparator had resolved. The task owner ruled that approval work must pause without changing content, evidence, accepted files, or shared code while a separate TDD task fixed and independently reviewed the duplicated validator path.

The minimal parity change is committed at shared HEAD `52b93d6823117106e87952bed82f16d9a6a1734b`, direct parent `ce5e088b82a646717b4472dd427a347b08e1639c`. Its Git-blob content SHA-256 values are `69228d5d12387c84784add5e997ee13e4f1fc944f48279d50f0c94df7e89bd61` for `validate.ts` and `62efe4283713dd35b67086d1836becd802f4f16695140d9fb9d9bde988f64584` for its unit test. The independent parity review is `3399ede373580db8396246c1c70cce6f0f1bbe2ccd29809faf9e4de8b8a11613`; it approves the exact commit with no Important, Critical, or blocking finding and does not authorize publication. The pre-existing live `validate.ts` worktree patch remains preserved at patch ID `03667fa5c310f62920490c7b4eccc15ed070c17f`, and the Git index remains clean.

### Fresh diagnostics, validators, sources, and prepublication freeze

All gates were rerun after the reviewed parity commit. Fresh unfiltered diagnostics exit `0`, are byte-identical to the semantic-R2 diagnostic artifact at `2a139041d8a62d4e79b96d9d56f329ffb32668e89c05490781eab1b9b4f84bf7`, and report `blocking=false`, 500 checked rows, zero errors, 872 `SUSPICIOUS_PROPER_NOUN_CHANGE` warnings, and 195 `UNCHANGED_TRANSLATION` warnings. The approved ordinal audit `aae76ccbd6bb023e20c73b1fead501feabebbf6585e08f297084fa619f90faf7` maps all 1,067 warning occurrences to their exact R3 false-positive dispositions with `unmapped=0` and `waivers=0`.

The generated validator now exits `0` with `blocking=false`, zero errors and zero `NUMBER_DRIFT`, 153 `SUSPICIOUS_PROPER_NOUN_CHANGE` warnings, and 156 `UNCHANGED_TRANSLATION` warnings; its report hash is `0e0881221ffe37300d1fd2bab808a4cfbaf5d3406e665300c436211b94664dbb`. The authored validator exits `0` with `blocking=false`, exactly 500 `MISSING_TRANSLATION` warnings and 500 matching exceptions; its report remains `062534ee40becb879482163a384dbd8dd1edf33ccd809aef9d4ac11325063563`.

`verifyBatch` was run twice against the approved work artifacts and task-local source cache. Both runs exit `0`, remain `blocking=false`, and reproduce byte-identical report and cache hashes `3ce2bd2b1cb3cd1a8348ee0101675ec0b561c9b2c7ed07c9c2f507de01b06260` and `1fdde0cc43b0b8511b65908de7136d37f6a9072a40ceaeb9154dcd56d15d7702`. All 101 distinct sources pass, all six difficulty/round cells contain five deterministic sample clues, evidence issues are zero, sample issues are zero, and the 100-set allocation is easy `17/16`, medium `17/17`, and hard `16/17` across rounds one/two. The 1,876 preserved unresolved entries are nonblocking heuristic/authoring signals only: authored 500, generated 309, translation 1,067, source zero, evidence zero, and samples zero.

The prepublication builder followed TDD: RED was `0/1` solely because `build-final-et-prepublication.mjs` was absent, then GREEN was `1/1` with two successful deterministic `--check` replays. The work-only freeze at `2026-08-23T04:58:23.944Z` has:

- builder: `d8aedab97bd3516674d67b6ce41f5d48044e3893bbf3a5573ba4b3ef43a9a5a2`
- focused prepublication contract: `c6fb5de44fe737d7d035c05fe368671a3a15c27c2472384df18cd7635eee6a15`
- prepublication report: `e977c7caffb4bf33303d18af0aca53628299a6fc7ffce05dac78d204d97e6876`
- final prepublication checkpoint: `7f244c7db756791a34951aa0ecb36b37fdcaf8cf0ef07b727ca3aac0e53e63a6`

The exact numeric-parity regression selection passes `4/4` across the production validator and translation diagnostics. The broader two-file run passes `63/64`; its sole failure is the pre-existing live report-placement WIP test `keeps nested placement as the default even for report-shaped payloads`, unrelated to Task 13 numeric parity or approval, and this task did not alter that WIP.

### Containment and next gate

Accepted Task 13 authored, generated, and report artifacts remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, and `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`; accepted evidence remains absent and accepted-path status is clean. The pre-existing progress file was pinned at `5e3caf087cbc76479268df3ea87b0dd9b313d75fe9ac4ef5e7a28d3af4412d51` and not changed by this task. No accepted path, shared source, canonical docs/progress file, release artifact, stage, commit, publication, or release-readiness state was changed by the approval task.

Task 13 is now frozen only at the approved work-artifact prepublication boundary. A fresh independent bilingual/source sample must still approve these exact generated/evidence/prepublication hashes before a separate publication task may copy anything into accepted content or claim Task 13 completion.

## Final-sample residual corrections — frozen for independent round-15 reviews (2026-08-23)

Independent final-sample review `21c9981e6d19ffa4e87dbce15b00e2aa27a36569fe6bc62d5a2aa6adfa924af8` rejected exactly seven rows for source scope or source contradiction. The exact correction union is rows 0147, 0149, 0150, 0258, 0259, 0338, and 0339. Rows 0147 and 0149 retain their unique responses and rebind only their fact sources to permanent CC-BY-SA revision 1368781051, freshly read back with explicit support for the Tramp and the 16 April 1981 unveiling. Row 0150 narrows its explanation to John Doubleday’s supported design credit; rows 0258–0259 correct the Wisconsin label/date placement; rows 0338–0339 remove the unsupported sisters-founded premise and ask the source-supported city and ward directly.

The deterministic correction layer uses exact-prior assertions and changes no candidate ID, candidate question, candidate answer, response allocation, taxonomy, category order, row order, or accepted content. The calibration artifact remains byte-identical; only the two necessary set-030 fact-source entries change in the source manifest. English edits and faithful Estonian edits are synchronized. All 500 generated statuses are reset to `machine`; current and pending evidence are byte-identical with factual, editorial, and translation reviews null on every row.

Frozen work hashes are authored `97744ee20ef9b5c99d96bff89d87d5a4f0854d0bf3734c71366356951ed33430`, generated `f48a117d9b78dc444757f006facfadf96b768ffd720f5d48a3470b1aeb648feb`, evidence/pending `0e4c8683c008ec75c4ddde399d835c02e3277b0c1a32041fe47f838874141900`, manifest `72cca37bbcf5c259a99d0a13e1ed55e3ba3454a07a48f5e943ec217a130384aa`, correction ledger `0d457bc4123ed1f9fba597ead648b9a3d48f7b85e956b3e27e5c820c02ceb55f`, delta `3cdd7f4f6f10d5680efc7cdb034375cd65a5213967582313488338b64ead5885`, source readback `53cfa399211d98af91aee5cfb1d2d2a822d7b11ef0ca134b76ead65f362ed9de`, and freeze `aba61115e723fa057933a561bd52b1c36d1aa5ae737f705d6d143c153d38deab`. This is not approval or publication. Fresh independent factual/source, editorial, and Estonian semantic round-15 reviews must approve these exact outputs before approval can be rematerialized or any accepted path can change.

## Round-15 editorial residual correction — frozen for independent round-16 and Estonian round-5 reviews (2026-08-23)

Independent editorial round 15 `0aa0ec20673f6597cf405602a5c9ca50e863837f8488ba70f833acef1deeef9e` identified only two future-answer disclosures in set 068. The exact review tuples replace the English and Estonian explanations for rows 0338 and 0339 and synchronize their evidence assertion prose. No rationale or note scalar was proposed or changed.

The correction preserves every clue, response, accepted variant, source URL, source ID, factual binding, candidate, category, row order, allocation, taxonomy, and calibration value. Source and factual-binding drift is zero, and the set-068 category, clue, and explanation scans now contain zero future-answer disclosures. All 500 generated statuses remain `machine`; evidence and pending evidence remain byte-identical with all factual, editorial, and translation reviews null.

Frozen round-2 work hashes are authored `11d99f00f9524b5ed58b2012d8d63b116876933c8214dfb5c774beb78d51831c`, generated `e2b1c10ce556a37310b1e08274f60dcc407b41819c78030d089b23aad6239a17`, evidence/pending `598222044f75cbf25b8f034031a864aa856d629d5d0cb4b91c477d3702abe2e4`, ledger `63fe1a6aa4b1654c44e655955981748cda455b5dc3285c3310b65e267632ccbe`, delta `26f0c961b87636a2286b7e0db38beda53ac47c40d0100d5cd72b9c13b26137f3`, source audit `66116e06d6e0bc74aede0a587b8ad9e5693984eb5df778e8139b708d4b120d7e`, and freeze `7a89062e462ba4928484330a1085334e869bc0f766268e8342dcde09f16867d1`. This is neither approval nor publication. Fresh independent factual and editorial round-16 reviews and Estonian semantic round-5 review must approve these exact bytes before approval materialization or publication.

## Post-final-sample round2 approval materialization and prepublication freeze (2026-08-23)

This section records work-only approval materialization after the second final-sample correction and the successful round-2 prepublication gates. It neither promotes accepted content nor authorizes publication, release readiness, staging, or a commit. The remaining gate is a fresh independent final bilingual/source sample round 2 against the exact frozen work artifacts below.

### Fail-closed boundary and independent approvals

Before the first write, shared HEAD was exactly `52b93d6823117106e87952bed82f16d9a6a1734b` with a clean index. The live work inputs matched authored `11d99f00f9524b5ed58b2012d8d63b116876933c8214dfb5c774beb78d51831c`, machine generated `e2b1c10ce556a37310b1e08274f60dcc407b41819c78030d089b23aad6239a17`, null-review evidence and pending evidence `598222044f75cbf25b8f034031a864aa856d629d5d0cb4b91c477d3702abe2e4`, manifest `72cca37bbcf5c259a99d0a13e1ed55e3ba3454a07a48f5e943ec217a130384aa`, calibration `8a243395b3fd3304b75ad83039d3bc3853ec07cbcc9525ca4c1c50c4bac4e278`, correction freeze `7a89062e462ba4928484330a1085334e869bc0f766268e8342dcde09f16867d1`, correction checkpoint `aac2a09db61e9e9b00e2eb41faf2eba092e3fcc216e2b64707b41c57a58ca847`, full diagnostics `96925b93044b96d8b8d3a802f2f10d434a28340aa08f96c30587e70200aab93c`, and this report `ca89d29dc7f3ee4255186962c09596b4809f809ca0d63b2ba0b046a244b993d7`. The 14 explicit pins, 9 freeze output pins, 13 checkpoint pins, 14 factual-review embedded pins, 19 editorial-review embedded pins, and 19 Estonian-review embedded/environment pins were rehashed without mismatch. Freeze/delta historical priors and freeze/ledger review pins also matched.

Fresh review hashes are factual R16 `def32b276b5afb9df718fb5aba61981d6b2c4562bd64ca08ed522771439b2296`, editorial R16 `1525d1058bf9254510dcb1fbe35d2c11768c8974b07451d3f055eeb28aa79eda`, and Estonian semantic R5 `4d017da7a468aecfb7bb9ebfc9d88a31dbed36b99ad508656ca72012e4c6902b`. All three approve the exact round-2 freeze with zero findings and zero correction proposals and do not authorize publication. Their identities are mutually distinct and distinct from `Codex Art and Architecture Author`. Their exact times—factual `2026-08-23T06:28:58.695Z`, editorial `2026-08-23T06:29:53.8618022Z`, and Estonian `2026-08-23T06:30:22.417Z`—are later than authoring and the correction freeze at `2026-08-23T06:20:00.739Z`. Factual R16 approves 500 rows, 102 permanent source identities, and 100 candidate mappings; editorial R16 covers 500 rows, 100 sets, 253 decoded variants, and the two round-2 correction rows; semantic R5 passes 500 rows, 2,500 Estonian fields, 253 variants, 100 sets, and all 1,071 warnings.

The separately reviewed production-validator parity artifact remains `3399ede373580db8396246c1c70cce6f0f1bbe2ccd29809faf9e4de8b8a11613`, with no Important, Critical, or blocking finding. Committed blob hashes remain `69228d5d12387c84784add5e997ee13e4f1fc944f48279d50f0c94df7e89bd61` for `validate.ts` and `62efe4283713dd35b67086d1836becd802f4f16695140d9fb9d9bde988f64584` for its focused test. The pre-existing live validator WIP remains byte-identical and retains patch ID `03667fa5c310f62920490c7b4eccc15ed070c17f`.

### TDD materialization and exact state transitions

The new behavior test was written first. RED was `0/1` solely because `materialize-final-et-approval-round2.mjs` did not exist. GREEN was `1/1`; the real-write test also rejects a stale reviewed generated prior, rejects a non-null evidence-review prior, validates all 500 output evidence rows through the repository schema, and runs two byte-stable `--check` replays.

At `2026-08-23T06:44:01.048Z`, the materializer changes exactly `translation_status=machine` to `reviewed` on all 500 generated rows. It changes exactly the three review fields on all 500 evidence rows from null to their exact R16 factual, R16 editorial, and R5 translation reviewer/time/approved blocks. All other generated and evidence fields, row order, clue IDs, sources, candidates, English, Estonian, accepted variants, categories, allocation, and factual propositions remain unchanged. Pending evidence remains byte-identical and all three of its review fields remain null on all 500 rows.

Materialized hashes are generated `170a005c51e32a9b9e7279480276355a878da31ea9051089d9e2026376897b37`, evidence `0a306de914711804b540f943317d2ed602f8905059f4a0791c3d9a6fd26b1c89`, pending `598222044f75cbf25b8f034031a864aa856d629d5d0cb4b91c477d3702abe2e4`, materializer `53beab9374bfef875c091d7a48c944977870564b3eb643a3714bb9daf6718959`, materializer test `7fd1660192f3e7a97d01817ba061c5654c963ed474d57ae11ed60d27d84bc446`, and materialization checkpoint `857e368bf54810bc44fb01072334af799dd4eb7d14b62224c1d5e0dca9ed4df6`.

### Fresh diagnostics, validators, verification, and prepublication seal

Fresh unfiltered translation diagnostics exit `0` and reproduce `96925b93044b96d8b8d3a802f2f10d434a28340aa08f96c30587e70200aab93c`: `blocking=false`, 500 rows, zero errors, 876 suspicious-proper-noun warnings, and 195 unchanged-translation warnings. The new approved warning audit `b17f06ade9d2cd5fb24f3f34055bba78f3f1f107349fb258ebdc06550b3efcdd` maps all 1,071 warning occurrences to exact R5 false-positive dispositions with `unmapped=0` and `waivers=0`.

The generated validator exits `0` with `blocking=false`, zero errors, 155 suspicious-proper-noun warnings, and 156 unchanged-translation warnings; its report hash is `98c55693e86a9173eaa82705257033533cd6be09f4b0f8b86aaf78efbe551fbb`. The authored validator exits `0` with `blocking=false`, zero errors, 500 missing-translation warnings, and 500 matching exceptions; its report hash is `062534ee40becb879482163a384dbd8dd1edf33ccd809aef9d4ac11325063563`.

`verifyBatch` ran twice against the approved round-2 work bytes and its task-local cache. Both runs exit `0` and reproduce report `bb50c2179e3fc44ddfefbcbe544ecc62d7fbd23ec699919365668deb1671876d` and cache `f557767c2bfaffed8ca5d07ba0620406dcf93ea59ecc61f6640da4331d436404`. All 102 distinct sources pass, every one of the six difficulty/round cells contains five deterministic sample clues, and source, evidence, and sample unresolved counts are zero. Allocation remains easy `17/16`, medium `17/17`, hard `16/17` across rounds one/two. The 1,882 nonblocking heuristic/authoring entries are authored 500, generated 311, and translation 1,071.

The round-2 prepublication builder also followed TDD: RED was `0/1` because the builder was absent; GREEN was `1/1` with two deterministic `--check` replays. A later seal repeated two materializer checks and two builder checks without byte drift. Focused numeric-parity tests pass `4/4`, while the evidence and verifyBatch contracts pass `43/43`.

The work-only prepublication seal at `2026-08-23T06:51:04.941Z` has builder `722dde72ba2dd53648815e3f42e150edf00dcf7f4ea59687c76c0d5fc992f13b`, builder test `2c392d511f4fa2f1ce692163f0527768f5e181bec6aaaf60423903b10b1acf44`, prepublication report `42dfe2e3dde219e2cbf9c8d7ca9abfb150252125c9f9b11f2ad21d1af99db464`, and prepublication checkpoint `87e0baaf59244878c0199e79b18767496dc94e1cb4ba1e72ef5914386655b6d8`.

### Containment and remaining gate

Accepted Task13 authored, generated, and report artifacts remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, and `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`; accepted evidence remains absent. Progress remains `409a3dc86801da9cb09249354163fa3ab296259911991199a000c8b123c6bd1c`, and the index remains clean. This approval task did not modify accepted content, shared source or tests, canonical docs/progress, release artifacts, staging, commits, or publication state.

Task13 is frozen only at the round-2 approved work-artifact prepublication boundary. A fresh independent final bilingual/source sample round 2 must approve these exact generated, evidence, warning-audit, verification, and prepublication hashes before any separate publication task may copy accepted content or claim final publication readiness.

## Final-sample round-2 blockers corrected — frozen for factual/editorial round 17 and Estonian round 6 (2026-08-23)

Independent final-sample round 2 `2a3e4530add2f554790d3c8891cf24abd10fbd299d02b5e435c31189daa778cd` rejected exactly rows 0224, 0259, and 0342. Row 0224 keeps the canonical response `1914` but now asks for the painting’s source-supported return to the Louvre; its explanation records the exact 4 January 1914 return rather than contradicting the detailed 1913 recovery account. The existing permanent Mona Lisa revision remains bound, while the fact key and source ID change only from recovery-year to Louvre-return-year. Row 0259 replaces state-seal terminology with the source-supported state coat of arms in English and Estonian. Row 0342 applies the exact natural English film-subject proposal and retains the sample-approved faithful Estonian `Film` construction.

No candidate ID, candidate question, candidate answer, canonical response, accepted variant, category, row order, allocation, source URL, or source revision changes. Calibration changes only the row-0224 fact-key identity required by the explicit event rewrite. Fresh permanent-source readback supports the Louvre return, Wisconsin coat of arms and 1848, and the unchanged Wolf Children context. Full category, clue, explanation, future-answer, standalone, duplicate, difficulty-allocation, and naturalness scans are clean. All 500 generated statuses are reset to `machine`; evidence and pending evidence are byte-identical with all factual, editorial, and translation reviews null.

Frozen round-3 work hashes are authored `54123b10e8115c4a11e3733cb33b75ebf1c5459299c1535c4f17d7be1f9f5beb`, generated `53df065e3bb9bba4b843e11dbe82fb02cd2a75559a1c2dfc6a6123f1f7af9f80`, evidence/pending `d9fcc6151d25e209b0da5f3e7cd853fa278cc47cc4aa039635deb5f43e49c03e`, manifest `7b976e7aef7cbb8801ac8a442ad1342c84b556ebadf1cd8c192cc5a76976acfa`, calibration `d521f66aa8ca815135b8e36c3845c4fe27b73f6e9cbc29894800ba0e2adf49ad`, ledger `9facbad636762d2e72fcf8c43850ed1c9e9977bf92989a369e6f91075b70090e`, delta `8f5a77fe612526561c995439a10e82d796a676531c3924b655b05897a93a626c`, source audit `c14da3454ac0d0b053c86a20e08e1e328b65f4b0a05d1fb5536d322fc5dca350`, and freeze `708e9480547d713402029dd99be35deabe36e1d31bc26f3f1349011f1ff1753a`. This is neither approval nor publication. Fresh independent factual and editorial round-17 reviews and Estonian semantic round-6 review must approve these exact bytes before any approval materialization or publication.

## Final approval round3 materialization and prepublication freeze (2026-08-23)

This section records the work-only approval materialization after the round-3 corrections and the successful round-3 prepublication gates. It does not promote accepted content, authorize publication, claim release readiness, stage files, or create a commit. The remaining gate is a fresh independent final bilingual/source sample round 3 against the exact frozen work artifacts below.

### Fail-closed boundary and independent approvals

Before any write, shared HEAD was exactly `52b93d6823117106e87952bed82f16d9a6a1734b`. The Git index was clean, and the live round-3 inputs matched authored `54123b10e8115c4a11e3733cb33b75ebf1c5459299c1535c4f17d7be1f9f5beb`, machine generated `53df065e3bb9bba4b843e11dbe82fb02cd2a75559a1c2dfc6a6123f1f7af9f80`, null-review evidence and pending evidence `d9fcc6151d25e209b0da5f3e7cd853fa278cc47cc4aa039635deb5f43e49c03e`, manifest `7b976e7aef7cbb8801ac8a442ad1342c84b556ebadf1cd8c192cc5a76976acfa`, calibration `d521f66aa8ca815135b8e36c3845c4fe27b73f6e9cbc29894800ba0e2adf49ad`, ledger `9facbad636762d2e72fcf8c43850ed1c9e9977bf92989a369e6f91075b70090e`, delta `8f5a77fe612526561c995439a10e82d796a676531c3924b655b05897a93a626c`, source audit `c14da3454ac0d0b053c86a20e08e1e328b65f4b0a05d1fb5536d322fc5dca350`, correction freeze `708e9480547d713402029dd99be35deabe36e1d31bc26f3f1349011f1ff1753a`, correction checkpoint `6e6454d93c18f2e54674e00c162ec8e56fffd1aac41e341d017fef5800911ae9`, full diagnostics `96925b93044b96d8b8d3a802f2f10d434a28340aa08f96c30587e70200aab93c`, and this report `e20fef3e3b41fdce715cd174f148ee199a49ccb95e7cda85a3caf565ff079917`. All embedded freeze, checkpoint, review, delta-history, sample-lifecycle, parity, accepted-baseline, and report-prefix pins were rehashed without mismatch.

The round-2 final sample `2a3e4530add2f554790d3c8891cf24abd10fbd299d02b5e435c31189daa778cd` remains explicitly nonapproving and is used only as the three-row correction trigger. The fresh approving reviews are factual R17 `506a0e22062daebbf5435dea2a6c40e8d7d4138dac24591d3750cecfddc78b93`, editorial R17 `f8493e1af7129131affebc2e5308d914d52eeed700fd23bb7a21c39a6a5424eb`, and Estonian semantic R6 `f00d20b0014a413db8df41b8c736b863fd22c4413fadd3aa2a9b63d81588bb10`. Each approves the exact round-3 freeze with zero findings and zero correction proposals and does not authorize publication. Their reviewer identities are mutually distinct and distinct from `Codex Art and Architecture Author`. Their exact review times—factual `2026-08-23T07:46:47.706Z`, editorial `2026-08-23T07:47:05.6103318Z`, and Estonian `2026-08-23T07:42:52.477Z`—are later than authoring at `2026-08-21T20:00:00.000Z` and the correction freeze at `2026-08-23T07:28:02.080Z`. Factual R17 approves 500 rows, 102 permanent source identities, and 100 candidate mappings; editorial R17 covers 500 rows, 100 sets, 253 decoded variants, 100 candidate mappings, all three corrected rows, and all 17 exact logical after-scalars; Estonian R6 passes 500 rows, 2,500 fields, 253 variants, 100 sets, and all 1,071 warnings.

The separately reviewed production-validator parity artifact remains `3399ede373580db8396246c1c70cce6f0f1bbe2ccd29809faf9e4de8b8a11613`, with no Important, Critical, or blocking finding. Committed blob hashes remain `69228d5d12387c84784add5e997ee13e4f1fc944f48279d50f0c94df7e89bd61` for `validate.ts` and `62efe4283713dd35b67086d1836becd802f4f16695140d9fb9d9bde988f64584` for its focused test. The pre-existing live validator WIP remains byte-identical at `acf63cb717e6b9b7a6a9479d987df8ced60fd4c961315ab0d07a9ad1eb91043e`, and its patch ID remains `03667fa5c310f62920490c7b4eccc15ed070c17f`.

### TDD materialization and exact state transitions

The new round-3 behavior test was written first. RED was `0/1` solely because `materialize-final-et-approval-round3.mjs` did not exist. GREEN was `1/1`; the real-write test also rejects a stale reviewed generated prior, rejects non-null evidence-review priors, validates all 500 output evidence rows through the repository schema, proves zero drift outside the permitted status/review fields, and performs two byte-stable `--check` replays.

At `2026-08-23T07:58:25.319Z`, the materializer changed exactly `translation_status=machine` to `reviewed` on all 500 generated rows. It changed exactly the factual, editorial, and translation review fields on all 500 evidence rows from null to the exact R17, R17, and R6 reviewer/time/approved blocks. All other generated and evidence fields, row order, clue IDs, sources, candidates, English, Estonian, accepted variants, categories, allocation, and factual propositions remain unchanged. Pending evidence remains byte-identical and all three of its review fields remain null on all 500 rows. Reverse reconstruction reproduces the exact machine-generated and null-review priors.

Materialized hashes are generated `8ce9d7d7d2a978e6bcb56ac8b01f30c99f8c8f7f2ba4e5f2093149b825117c01`, evidence `c2c120250f4eb511fabfc9cec4d12f0ee685ea01ac9b3b1032b5968151ab5670`, pending `d9fcc6151d25e209b0da5f3e7cd853fa278cc47cc4aa039635deb5f43e49c03e`, materializer `d2df00b118549e2646cf318b05be113e98c2fcbcb571e7e6eddd930754f1672b`, materializer test `320377d1117229d21a34122aaed0c12b4ef1235007051ab8d0864d12fa36cdda`, and materialization checkpoint `9dad2f744c4f5695c941f2f8e1605daee2517850f16fe155be100283b7b2e647`.

### Fresh diagnostics, validators, verification, and prepublication seal

Fresh unfiltered translation diagnostics exit `0` and reproduce `96925b93044b96d8b8d3a802f2f10d434a28340aa08f96c30587e70200aab93c`: `blocking=false`, 500 checked rows, zero errors, 876 suspicious-proper-noun warnings, and 195 unchanged-translation warnings. The new approved warning audit `5d0ea4c7a1a6654f0055e04a680efba2c33f7f6fe36d5e5f32756f5e3e818b1d` maps all 1,071 warning occurrences to exact R6 false-positive dispositions with `unmapped=0` and `waivers=0`.

The generated validator exits `0` with `blocking=false`, zero errors, 155 suspicious-proper-noun warnings, and 156 unchanged-translation warnings; its report hash is `98c55693e86a9173eaa82705257033533cd6be09f4b0f8b86aaf78efbe551fbb`. The authored validator exits `0` with `blocking=false`, zero errors, 500 missing-translation warnings, and 500 matching exceptions; its report hash is `062534ee40becb879482163a384dbd8dd1edf33ccd809aef9d4ac11325063563`.

`verifyBatch` ran twice against the approved round-3 work bytes and task-local source cache. Both runs exit `0` and reproduce byte-identical report `ee90fde861b8ba50434b4a48ae57e12f1fd7f6465a34453d6a014a8fb5d9c7ab` and cache `90442eae499d2287b90fc118025c1ef80ed5ed7d5afc37523a75324fb80a44d1`. All 102 distinct sources pass, every one of the six difficulty/round cells contains five deterministic sample clues, and source, evidence, and sample unresolved counts are zero. Allocation remains easy `17/16`, medium `17/17`, and hard `16/17` across rounds one/two. The 1,882 preserved nonblocking heuristic/authoring entries are authored 500, generated 311, and translation 1,071.

The round-3 prepublication builder also followed TDD: RED was `0/1` because the builder did not exist; GREEN was `1/1` with two deterministic `--check` replays. The final seal repeated two materializer checks and two builder checks with byte drift zero. Focused numeric-parity tests pass `4/4`, while the evidence and `verifyBatch` contracts pass `43/43`.

The work-only prepublication seal at `2026-08-23T08:05:37.513Z` has builder `c8f20f0b508b3fbaee86f83d14f918b7f4b113df7707afc6024eb3b8ea1af2ad`, builder test `12f732242f3365e8f85cc595504950d495e78bf3fd21cfffccb059659d5cb1a6`, warning audit `5d0ea4c7a1a6654f0055e04a680efba2c33f7f6fe36d5e5f32756f5e3e818b1d`, prepublication report `772f62c98386892f34df24d55e8f63c6538d1fca01fc6e29ba154fcb8315b72a`, and prepublication checkpoint `dd628d24a0fe627075f2aa416480897d2cd56c0afc49e10cca5fb4db30413f89`.

### Containment and remaining gate

Accepted Task13 authored, generated, and report artifacts remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, and `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`; accepted evidence remains absent. The pre-existing progress file remains pinned at `c597e2f4ca1e3306ca4c9b4d00b9b2abb830941019260bc821dd1ac6ff31db5b` and was not changed by this approval task. The Git index remains clean. This task did not modify accepted content, shared source or tests, canonical docs/progress, release artifacts, staging, commits, or publication state.

Task13 is frozen only at the round-3 approved work-artifact prepublication boundary. A fresh independent final bilingual/source sample round 3 must approve these exact generated, evidence, warning-audit, verification, and prepublication hashes before any separate publication task may copy accepted content or make a final publication claim.

## Final-sample round-3 blockers corrected — frozen for factual/editorial round 18 and Estonian round 7 (2026-08-23)

Independent final-sample round 3 `eb07ecc72c2739673f70a36eaf84c8af6ce7aa30d9a4b96e31b221a7e017a011` rejected exactly rows 0256 and 0257. Row 0256 now identifies the central device as Wisconsin’s state coat of arms—not the state seal—in its English and Estonian clue, explanations, and evidence assertion while retaining the source-supported response `Blue`. Row 0257 now says in both explanations and its assertion that `Forward` appears over the crest within the state coat of arms. The permanent source revision, field and motto fact keys, source IDs, responses, and variants remain unchanged.

Fresh direct readback of permanent Wisconsin flag revision 1359176877 confirms the royal-blue field, the state coat of arms, `Forward` over the crest, and that seal-bearing flags were improper. No candidate ID, candidate question, candidate answer, canonical response, accepted variant, category, row order, allocation, fact key, source URL, source revision, manifest value, or calibration value changes. Full future-answer, standalone, duplicate, difficulty-allocation, and naturalness scans are clean. All 500 generated statuses are reset to `machine`; evidence and pending evidence are byte-identical with all factual, editorial, and translation reviews null.

Fresh gates reproduce diagnostics `96925b93044b96d8b8d3a802f2f10d434a28340aa08f96c30587e70200aab93c` with `blocking=false`, 500 checked rows, zero errors, and 1,071 conservative warnings. The two content-only validators are blocked only by the established unpublished-state evidence/composition gates. Dedicated source verification passes all 102 permanent sources twice with byte-stable report `be3332198b617ea15668d8bbf202ec42759b82aef114536c4ecfb52a18ebc571` and cache `fe6232b00327a1f60305f7a8c1ba7a81023543b625815664c939888c28b9bece`. Full `verifyBatch` runs twice and deterministically stops at the expected evidence-schema preflight `UNPARSEABLE_ARTIFACT` because factual and editorial approvals are deliberately null; its report is `bcd6b6a0cddfed54b1b123c837a2c468199dba6985d2d7a17ad7075570af421f`.

Frozen round-4 work hashes are authored `cd1a452c663f09d28673f7f8f5823c46bac9067b8854f709cfafca63a77d5479`, generated `d9af1646d22652e1b68fa40feb18098266f39dc737ba4b6af579f92bbd1b6af1`, evidence/pending `24d4012610c162b58c436cf6445219271d7e430138c7cd8a5ab0640527184f90`, manifest `7b976e7aef7cbb8801ac8a442ad1342c84b556ebadf1cd8c192cc5a76976acfa`, calibration `d521f66aa8ca815135b8e36c3845c4fe27b73f6e9cbc29894800ba0e2adf49ad`, ledger `64374a873520643df5f000b5552849eb3e35d5d2571374907b5828959fb73f72`, delta `05fe52e19dcbc05976d6a9c4185b50a2292a5372b3afa59d67de88126cbeac31`, source audit `043fa50d1b09ad29782b558834c16523fa175c47c422f4d0ce8a9a4eca998a9e`, and freeze `541c12d77cca580742e1e57c844282e899fdc9adee39ecfc527b7e262431f2dd`. This is neither approval nor publication. Fresh independent factual and editorial round-18 reviews and Estonian semantic round-7 review must approve these exact bytes before any approval materialization or publication.

## Final approval round4 materialization and prepublication freeze (2026-08-23)

This section records the work-only approval materialization after the round-4 corrections and the successful round-4 prepublication gates. It does not promote accepted content, authorize publication, claim release readiness, stage files, or create a commit. The remaining gate is a fresh independent final bilingual/source sample round 4 against the exact frozen work artifacts below.

### Fail-closed boundary and independent approvals

Before any write, shared HEAD was exactly `52b93d6823117106e87952bed82f16d9a6a1734b` with a clean Git index. The live round-4 inputs matched authored `cd1a452c663f09d28673f7f8f5823c46bac9067b8854f709cfafca63a77d5479`, machine generated `d9af1646d22652e1b68fa40feb18098266f39dc737ba4b6af579f92bbd1b6af1`, null-review evidence and pending evidence `24d4012610c162b58c436cf6445219271d7e430138c7cd8a5ab0640527184f90`, manifest `7b976e7aef7cbb8801ac8a442ad1342c84b556ebadf1cd8c192cc5a76976acfa`, calibration `d521f66aa8ca815135b8e36c3845c4fe27b73f6e9cbc29894800ba0e2adf49ad`, ledger `64374a873520643df5f000b5552849eb3e35d5d2571374907b5828959fb73f72`, delta `05fe52e19dcbc05976d6a9c4185b50a2292a5372b3afa59d67de88126cbeac31`, source audit `043fa50d1b09ad29782b558834c16523fa175c47c422f4d0ce8a9a4eca998a9e`, correction freeze `541c12d77cca580742e1e57c844282e899fdc9adee39ecfc527b7e262431f2dd`, correction checkpoint `2ddc203024d69b04a0920fcd540429f438c8863585c24950c874131d10c16c7e`, full diagnostics `96925b93044b96d8b8d3a802f2f10d434a28340aa08f96c30587e70200aab93c`, and this report `a0835a47ecee13f534fd010b91f2b5ce9b9d609c0ebc96a3a04e38282a8417ae`. All supplied, freeze, checkpoint, factual, editorial, Estonian, sample-lifecycle, parity, accepted-baseline, and report-prefix pins matched without mismatch.

The round-3 final sample `eb07ecc72c2739673f70a36eaf84c8af6ce7aa30d9a4b96e31b221a7e017a011` remains explicitly nonapproving and is used only as the two-row correction trigger. The fresh approving reviews are factual R18 `18d379f4411fe1aab621573add6600e7db368dad98eae839c34a0b7af838e361`, editorial R18 `c32d07422dab4a8c27340ca0d513d9e4144744cc5f46c3b24943badf835c02bd`, and Estonian semantic R7 `c6c2021f9cb7b53dc2ab3a994bd6f1a34e92c13364a1cb057fdc955e1b28105a`. Each approves the exact round-4 freeze with zero findings and zero correction proposals and does not authorize publication. Their identities are mutually distinct and distinct from `Codex Art and Architecture Author`. Their exact times—factual `2026-08-23T08:48:07.405Z`, editorial `2026-08-23T08:49:11.6671070Z`, and Estonian `2026-08-23T08:48:06.091Z`—are later than authoring and the correction freeze at `2026-08-23T08:32:47.551Z`. Factual R18 approves 500 rows, 102 permanent source identities, and 100 candidate mappings; editorial R18 covers 500 rows, 100 sets, 253 decoded variants, 100 candidate mappings, both corrected rows, and all 11 exact logical after-scalars; Estonian R7 passes 500 rows, 2,500 fields, 253 variants, 100 sets, and all 1,071 warnings.

The separately reviewed production-validator parity artifact remains `3399ede373580db8396246c1c70cce6f0f1bbe2ccd29809faf9e4de8b8a11613`, with no Important, Critical, or blocking finding. Committed blob hashes remain `69228d5d12387c84784add5e997ee13e4f1fc944f48279d50f0c94df7e89bd61` for `validate.ts` and `62efe4283713dd35b67086d1836becd802f4f16695140d9fb9d9bde988f64584` for its focused test. The pre-existing live validator WIP remains byte-identical at `acf63cb717e6b9b7a6a9479d987df8ced60fd4c961315ab0d07a9ad1eb91043e` with patch ID `03667fa5c310f62920490c7b4eccc15ed070c17f`.

### TDD materialization and exact state transitions

The new round-4 behavior test was written first. RED was `0/1` solely because `materialize-final-et-approval-round4.mjs` did not exist. GREEN was `1/1`; it performs a real write, rejects stale generated and evidence priors, validates all 500 output evidence rows through the repository schema, proves zero drift outside the permitted status/review fields, and performs two byte-stable `--check` replays. A later prepublication replay exposed that the embedded R18 editorial pin referred to the preapproval correction-phase `report.json`; a focused test first reproduced that exact failure, then the minimal lifecycle rule allowed only that pinned correction report and the fresh approved verification report. No content or review rule was loosened.

At `2026-08-23T09:05:11.797Z`, the materializer changed exactly `translation_status=machine` to `reviewed` on all 500 generated rows. It changed exactly the factual, editorial, and translation review fields on all 500 evidence rows from null to the exact R18, R18, and R7 reviewer/time/approved blocks. All other generated and evidence fields, row order, clue IDs, sources, candidates, English, Estonian, accepted variants, categories, allocation, and factual propositions remain unchanged. Pending evidence remains byte-identical and all three review fields remain null on all 500 rows. Reverse reconstruction reproduces the exact machine-generated and null-review priors.

Materialized hashes are generated `4b63029bba888f44c2195d02d6ffdb918b46b8fe46122df229c168b11c3640eb`, evidence `dc3c96d8b4b4ea12ec1c67c4d30369aad07e2e6a19336d1dfe537ea2b2c8e834`, pending `24d4012610c162b58c436cf6445219271d7e430138c7cd8a5ab0640527184f90`, materializer `8b01b981f96b0fcc4fe80267e88a76fa65f5ab1d9f2e7aeabd169b9f787a0bcd`, materializer test `91b2d17ac46de63803c9c736fbd1c89e183f336d8f17129aee82d94fee5fec7c`, and materialization checkpoint `d526f99f6bdbcbab76bb17bfdf2240488d3be49929fbf4796b3ae7772d5b3719`.

### Fresh diagnostics, validators, verification, and prepublication seal

Fresh unfiltered translation diagnostics exit `0` and reproduce `96925b93044b96d8b8d3a802f2f10d434a28340aa08f96c30587e70200aab93c`: `blocking=false`, 500 checked rows, zero errors, 876 suspicious-proper-noun warnings, and 195 unchanged-translation warnings. The approved warning audit `91a7ca8ffac5e0170d62199418889886e9e10aa8dc4187d3e64dfbecfed73f75` maps all 1,071 warning occurrences to exact R7 false-positive dispositions with `unmapped=0` and `waivers=0`.

The generated validator exits `0` with `blocking=false`, zero errors, 155 suspicious-proper-noun warnings, and 156 unchanged-translation warnings; its report hash is `98c55693e86a9173eaa82705257033533cd6be09f4b0f8b86aaf78efbe551fbb`. The authored validator exits `0` with `blocking=false`, zero errors, 500 missing-translation warnings, and 500 matching exceptions; its report hash is `062534ee40becb879482163a384dbd8dd1edf33ccd809aef9d4ac11325063563`.

`verifyBatch` ran twice against the approved round-4 work bytes and task-local source cache. Both runs exit `0` and reproduce byte-identical report `ad3da078114ebfcf333b72fd2d02df5e99b449b25322816a8f9033732565a861` and cache `7336b8f2e43488ba050999b94f0531e3bd0345d9b775819e75e47da0fa96491d`. All 102 distinct sources pass, every one of the six difficulty/round cells contains five deterministic sample clues, and source, evidence, and sample unresolved counts are zero. Allocation remains easy `17/16`, medium `17/17`, and hard `16/17` across rounds one/two. The 1,882 preserved nonblocking heuristic/authoring entries are authored 500, generated 311, and translation 1,071.

The round-4 prepublication builder followed TDD: RED was `0/1` because the builder did not exist; GREEN was `1/1` with two deterministic `--check` replays. The final seal repeated two materializer checks and two builder checks with byte drift zero. Focused numeric-parity tests pass `4/4`, while the evidence and `verifyBatch` contracts pass `43/43`.

The work-only prepublication seal at `2026-08-23T09:13:39.925Z` has builder `043f2986c7bcb2228d4657f52ff406af74b5671249e80fc9690144629544a79d`, builder test `66a4a5b47858ecb65434df858855a6e5a2f26321685262a1f7a896306494ad48`, warning audit `91a7ca8ffac5e0170d62199418889886e9e10aa8dc4187d3e64dfbecfed73f75`, prepublication report `caadd45c74e3536813e0ff10f0d3d39c619ac7df63cd0bc83f6ae1fe675cdd6c`, and prepublication checkpoint `ba201dcd9f981782fa4a41898af5e13c08c9ff1d80bb850a3c9b9e7b6d8eb73f`.

### Containment and remaining gate

Accepted Task13 authored, generated, and report artifacts remain byte-identical at `5216e2d1aac5aa7f0458335fecf17acc16777c5e193f66ba615e757253959601`, `b8b5bb0e271a23c6acbd18828d39c80c2a9541c5531758127cc818e2b231cde8`, and `2bc56d8cd83d3079ead0d361b15e03339a8a1219af6436a11171c8c47578a740`; accepted evidence remains absent. The task owner confirmed the current pre-existing progress boundary `49c6db6670086d90938a7c25a3286453fd15b0cd592136712ad1b4e0e34fe992`; this task pinned and did not modify it. The Git index remains clean. This task did not modify accepted content, shared source or tests, canonical docs/progress, release artifacts, staging, commits, or publication state.

Task13 is frozen only at the round-4 approved work-artifact prepublication boundary. A fresh independent final bilingual/source sample round 4 must approve these exact generated, evidence, warning-audit, verification, and prepublication hashes before any separate publication task may copy accepted content or make a final publication claim.

## Final bilingual/source sample round 4 and publication (2026-08-23)

Independent final sample round 4 is SHA-256 `8a140437745e54a598f54c64de07a1b799d837712628927ee991c0a20b87c81b`. It rehashed every current round-4 pin, selected exactly 50 rows as ten complete five-row sets, included all 16 mandatory lifecycle rows, covered every difficulty/round cell and the strict maximum nine of ten subthemes, and freshly fetched and read all 11 selected permanent-revision sources. All 50 rows and 11 sources passed English, Estonian, evidence, chronology, copyright, calibration, set-coherence, and source-support review. Findings and correction proposals were zero, and the review authorized publication of only the exact frozen artifacts.

Publication commit `d1550e8702ce2887e38b20209c5fd9e37568abd1` (`content(art): replace filler with reviewed production clues`) has parent `52b93d6823117106e87952bed82f16d9a6a1734b`, commit time `2026-08-23T12:48:20+03:00`, and exactly these five paths:

- `content/authored/05-art-architecture.csv`
- `content/generated/05-art-architecture.en-et.csv`
- `content/evidence/05-art-architecture.jsonl`
- `content/reports/05-art-architecture.json`
- `content/reports/source-check-cache.json`

Final accepted working-tree SHA-256 values are:

- authored: `cd1a452c663f09d28673f7f8f5823c46bac9067b8854f709cfafca63a77d5479`
- generated: `4b63029bba888f44c2195d02d6ffdb918b46b8fe46122df229c168b11c3640eb`
- evidence: `dc3c96d8b4b4ea12ec1c67c4d30369aad07e2e6a19336d1dfe537ea2b2c8e834`
- verification report: `2af824c7be3907f77086e1ef4aa6180abe86d180c1011c93b9dc60ec29fb8585`
- shared source cache: `cd07572b826dad26de44cc4a7e0fd928b039e8cac2ee04e433891c99c1f780b9`

## Postpublication verification

Fresh independent postpublication review found zero Critical or Important findings and authorized Task 13 completion. The accepted verification is `kind=verification`, `blocking=false`, with 500 board clues, 100 five-clue sets, 253 decoded accepted alternatives, exact Easy `17/16`, Medium `17/17`, and Hard `16/17` allocation across rounds one/two, and five sampled clues in each of the six difficulty/round cells. All 500 factual, 500 editorial, and 500 translation reviews are approved; the author and three reviewers are four distinct identities with valid chronology.

All 102 permanent sources pass. The shared source cache contains exactly 630 entries: the prior 528 plus the 102 Art and Architecture sources. Translation diagnostics contain zero errors and 1,071 conservative warnings; the final warning audit maps all 1,071 occurrences, with zero unmapped warnings and zero waivers. Filler, collision, and future-answer leak scans are zero. The copyright audit found no blocking reuse; its only observations were two attributed CC-BY-SA common/factual overlaps of 12 and 11 words.

## Ruling audit

All 16 Task 13 `Ruling:` entries remain verbatim in `progress.md`. None was parked or waived; each was resolved as follows:

1. **R5 breaker:** the unsupported and player-facing R5 tuples were reopened, corrected, and independently reviewed rather than carried into translation.
2. **R6 factual artifact-path adjudication:** the wrong alias finding was rejected after absolute-path and byte readback of this canonical report; the real factual blocker remained open until corrected.
3. **R6 closure:** the exact factual and editorial tuple union was remediated and sent through fresh R7 review.
4. **R7 residual:** only the enumerated residual tuple families were refined before fresh R8 factual-drift and editorial review.
5. **R8 residual:** the narrowed source, leak, variant, order, rationale, and note tuples were corrected before R9 review.
6. **R9 residual:** the two future-answer dependencies were removed by minimal source-faithful corrections before R10 review.
7. **R10 residual:** clue `0186` received the exact `full-length` qualifier and set 038 was reordered and recalibrated before R11 review.
8. **R11 residual:** only clue `0273` was replaced with the source-backed Charles Garnier proposition before R12 review.
9. **R12 residual:** only the stale tier-4 rationale was replaced with the exact Charles Garnier rationale before R13 review.
10. **R13 pretranslation assertion:** row `0273` received the canonical `response — explanation` evidence assertion and passed fresh R14 factual/editorial review.
11. **Estonian semantic R1 diagnostic:** the narrowly scoped numeric-equivalence repair was implemented with focused tests and independent review in `ce5e088b82a646717b4472dd427a347b08e1639c`.
12. **Final Estonian validator parity:** the production validator received the matching minimal numeric handling and independent review in `52b93d6823117106e87952bed82f16d9a6a1734b`.
13. **First final bilingual/source sample:** only the seven rejected Leicester Square, Wisconsin, and Hasegawa tuples were corrected, with all stale approvals invalidated before fresh review.
14. **Post-sample R15 editorial residual:** only the two Hasegawa future-answer disclosures and their faithful projections were corrected before fresh review.
15. **Final sample round 2:** only rows `0224`, `0259`, and `0342` were corrected for date consistency, Wisconsin terminology, and naturalness before fresh review.
16. **Final sample round 3:** a fresh round-4 implementer corrected only rows `0256` and `0257`; factual R18, editorial R18, Estonian R7, and final sample round 4 then approved the exact result.

## Concerns and closure

Task 13 has no remaining content, review, translation, source, chronology, copyright, verification, publication, or commit blocker. The two attributed common/factual source overlaps noted above are nonblocking and require no waiver. This closes only the Art and Architecture production-content batch; it does not start Task 14 or claim whole-release readiness.
