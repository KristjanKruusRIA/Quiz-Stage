# Accessible Easy Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for implementation and `superpowers:verification-before-completion` before every pack integration. Authoring may be parallel; integration to `develop` is serialized.

**Goal:** Add 1,200 broadly playable, bilingual Easy clues in 240 new categories across the twelve original packs, merging every completed and independently reviewed 100-clue bank directly to `develop`, then publishing all twelve banks in one verified Windows cutover.

**Architecture:** A new `easyExpansion` module owns additive bank contracts, validation, and a pure one-pack append transform. Each pack branch verifies a task-local 600-row projection and merges only its bank, cumulative tests, and SHA-bound review manifest. Accepted content and canonical release artifacts remain at 7,000 clues until one atomic 8,200-clue cutover. Existing Easy and Medium/Hard replacement pipelines are not modified.

**Spec:** `docs/superpowers/specs/2026-09-05-accessible-easy-expansion-design.md`

## Global constraints

- Add exactly 20 Easy sets / 100 clues per original pack, with 10 sets in each round.
- Use `set-101..120` for every pack and `built-in-<topic-family>-easy-expansion-001..100` for clue IDs, where `<topic-family>` is the existing pack ID without `built-in-`.
- Preserve all 7,174 baseline accepted records and stable IDs; Phase B is append-only.
- Give every set five ordered tiers, five distinct canonical subjects, at least four distinct answer entities, and one broad announceable bilingual theme.
- Target general knowledge for an Estonian thirty-something; reject specialist minutiae, one-item five-fact categories, arbitrary metadata, unstable trivia, and awkward translation.
- Require direct HTTPS support, compatible licensing, complete integrated evidence, and separate factual/editorial review.
- Keep each original pack's existing 100 OpenTDB-inspired records unchanged.
- Keep every subtheme at or below the existing 15-set cap.
- Do not change Adult, Estonia, Finals, Medium, or Hard content.
- Verify Windows only; Linux packaging is out of scope.
- Do not stage `.learnings/ERRORS.md` or `.learnings/LEARNINGS.md` in product commits.
- A pack is not finished until independent 0/0/0 review, deterministic task-local projection, direct push to `origin/develop`, and remote-SHA confirmation.
- Per-pack merges are authoring-complete banks, not runtime publication; accepted artifacts and the seed change once at final cutover.

## Task 1: Commit the current-state Phase B contract

**Files:**
- Create `docs/superpowers/specs/2026-09-05-accessible-easy-expansion-design.md`
- Create `docs/superpowers/plans/2026-09-05-accessible-easy-expansion.md`

- [ ] Check both documents against the integrated 15-pack catalog and accepted release artifacts.
- [ ] Independently review inventory, ID ranges, incremental-release semantics, and completion gates.
- [ ] Run `git diff --check` and a Markdown-link/path sanity check.
- [ ] Commit only the two documents and push the verified commit directly to `origin/develop`.
- [ ] Confirm `git ls-remote origin refs/heads/develop` equals the pushed commit.

## Task 2: Lock the additive bank contract test-first

**Files:**
- Create `scripts/content/easyExpansion/types.ts`
- Create `scripts/content/easyExpansion/validateBank.ts`
- Create `scripts/content/easyExpansion/createBaselineManifest.ts`
- Create `content/reports/easy-expansion-baseline-record-hashes.json`
- Create `tests/unit/content/easyExpansion.test.ts`

- [ ] Write failing fixtures for wrong batch/difficulty/round, missing tiers, duplicate IDs, duplicate category names, repeated subjects, fewer than four answer entities, answer leakage, binary prompts, unstable facts, incomplete bilingual fields, invalid source metadata, and subtheme-cap overflow.
- [ ] Write passing fixtures for broad categories with fair tier progression, natural bilingual text, variants, and direct sources.
- [ ] Observe the intended missing-module or missing-behavior failure.
- [ ] Implement the smallest immutable types and pure validation needed to pass.
- [ ] Reuse existing accessibility reason codes and cross-tier normalization where contracts match.
- [ ] Generate a sorted manifest for all 7,174 baseline stable IDs using canonical logical-record SHA-256 hashes, plus accepted-artifact hashes and source commit `5323a546f4d03460dae7c934703dbcfd8468031f`.
- [ ] Lock the current canonical hashes: release inventory `c1eb0c3d7dbf404c6c30740360c60cbddf04021f83141608ca3793a351f2a7b5`, source cache `6ae35fe70f2f9f8dcfafe5e3bc590a41ff33d5d8088cdf4a61790f04a899213d`, and seed `0a94337640f8a4f1a063193717947b584ef29ed57304da1e94294babafd9daa3`.
- [ ] Run the focused test, typecheck, scoped lint, and `git diff --check`.
- [ ] Commit the shared contract and push it to `develop` after review so all pack lanes start from one base.

## Task 3: Build the pure one-pack append pipeline test-first

**Files:**
- Create `scripts/content/easyExpansion/apply.ts`
- Create `scripts/content/easyExpansion/bank.ts`
- Create `scripts/content/applyEasyExpansion.ts`
- Create `scripts/content/verifyEasyExpansion.ts`
- Modify `tests/unit/content/easyExpansion.test.ts`

- [ ] Add failing tests that project one pack from 500 to 600 rows and 100 to 120 sets.
- [ ] Prove all original authored/generated rows and evidence records are field-for-field unchanged.
- [ ] Prove exact 20/100 additions, complete 25-column output, matching evidence, deterministic ordering, and idempotent reruns.
- [ ] Add abort tests for existing clue/set/fact/title collisions, cumulative accepted-corpus collisions, non-target mutation, wrong OpenTDB quota, and partial publication.
- [ ] Implement a pure transform plus a CLI requiring `--batch` and using `content/work/easy-expansion` as its default root, with each batch staged below that root.
- [ ] Stage `authored.csv`, `generated.en-et.csv`, and `evidence.jsonl`; accepted files are written only through the existing verified batch publisher.
- [ ] Implement a task-local verifier that delegates to the existing validation/source logic with an immutable provisional definition of 600 rows, 120 sets, and the selected pack's Easy distribution increased by 10/10; it must not edit `productionBatches.ts` or accepted artifacts.
- [ ] Run focused tests, content pipeline tests, typecheck, lint, and diff checks.
- [ ] Independently review and push the foundation commit to `develop`.

## Task 4: Extend cumulative collision and baseline-preservation coverage

**Files:**
- Modify `tests/unit/content/crossTierCorpusGate.test.ts`
- Modify `tests/unit/content/enabledAuthorityCollisionTestUtils.ts`
- Modify `tests/unit/content/enabledAuthorityCollisionTestUtils.test.ts`
- Modify `tests/unit/content/easyExpansion.test.ts`

- [ ] Make global collision tests include all Phase B banks present on the branch.
- [ ] Make the committed baseline manifest fail on any altered or missing accepted baseline record while permitting registered Phase B additions only in task-local projections.
- [ ] Prove category-title, fact-key, clue/answer, alias, subject, and cross-tier collisions are rejected cumulatively.
- [ ] Observe the focused failures before production changes, then implement only the required test support.
- [ ] Run focused tests, typecheck, lint, and diff checks.
- [ ] Review and push this foundation commit to `develop`.

## Task 5: Execute the per-pack author-review-integrate loop

Run this task once for each batch, serialized for integration in this order:

1. `01-history`
2. `02-geography`
3. `03-science-nature`
4. `04-literature-language`
5. `05-art-architecture`
6. `06-music`
7. `07-film-television`
8. `08-sports-games`
9. `09-food-drink`
10. `10-technology-inventions`
11. `11-politics-economics-society`
12. `12-mythology-religion-philosophy`

Authoring may start in parallel, but a pack does not enter final review from a stale base. Rebase or recreate its worktree from current `origin/develop`, then rerun all cumulative gates before integration.

### 5A. Author exactly one pack

**Files:**
- Create `scripts/content/easyExpansion/banks/<batch>.ts`
- Modify `scripts/content/easyExpansion/bank.ts`
- Modify focused fixtures only where the new bank must be registered

- [ ] Author 20 broad bilingual categories and 100 clues using allowed, under-cap subthemes.
- [ ] Use sets `101..110` for Round One and `111..120` for Round Two.
- [ ] Use clue suffixes `001..100` in category/tier order.
- [ ] Give every set five distinct subjects and at least four distinct answer entities.
- [ ] Check tier 5 against accepted Medium clues; it must remain recognizably Easy.
- [ ] Use one direct supporting source per clue and complete integrated evidence fields.
- [ ] Run the bank validator and inspect every warning, not only blocking errors.

### 5B. Check against the complete current corpus

- [ ] Compare fact keys, normalized clue/answer pairs, aliases, titles, source headings, and subject keys against all accepted evidence plus all Phase B banks on current `develop`.
- [ ] Review every collision candidate individually and repair or document the non-collision.
- [ ] Confirm no subtheme exceeds 15 sets and the existing 100 OpenTDB inspiration records are unchanged.
- [ ] Apply twice to clean inputs and compare staged hashes.
- [ ] Confirm the projected pack has 600 rows / 120 sets and its original 500 logical rows are field-for-field identical.

### 5C. Independent four-lens review

- [ ] Fetch and rebase onto current `origin/develop`, rerun the cumulative collision/projection gates, and only then finalize the review manifest's `baseCommit`.
- [ ] Bind the review to the bank and staged-artifact SHA-256 hashes.
- [ ] A non-author reviews all 100 clues for factual correctness and source entailment.
- [ ] A non-author reviews category breadth, answer uniqueness, Easy fairness, and tier progression.
- [ ] A fluent reviewer checks every Estonian category, clue, response, variant, and explanation for idiomatic wording and established names.
- [ ] A release reviewer checks evidence, inventory, IDs, append-only preservation, and cumulative collisions.
- [ ] Repair confirmed findings, regenerate hashes, and repeat until the final severity count is 0 Critical / 0 Important / 0 Minor.
- [ ] Commit `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/<batch>.json` with `version`, `batchId`, `baseCommit`, `bankSha256`, three projected-artifact hashes, reviewer identities, reviewed clue/category/source counts, collision dispositions, and final severity counts.

### 5D. Verify and merge the completed bank

**Files:**
- Create `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/<batch>.json`

- [ ] Run `npx tsx scripts/content/applyEasyExpansion.ts --batch <batch> --output-root content/work/easy-expansion` twice from clean inputs and compare the three projected artifact hashes.
- [ ] Run `npx tsx scripts/content/verifyEasyExpansion.ts --batch <batch> --work-root content/work/easy-expansion --source-cache content/work/easy-expansion/source-check-cache.json` against the provisional 600-row batch definition.
- [ ] Run `npm run test:run -- tests/unit/content/easyExpansion.test.ts tests/unit/content/crossTierCorpusGate.test.ts tests/unit/content/enabledAuthorityCollisionTestUtils.test.ts`.
- [ ] Copy the canonical release report and source cache into `content/work/easy-expansion/baseline-verification/`, then run `npm run content:verify-seed -- --input "content/generated/*.en-et.csv" --evidence "content/evidence/*.jsonl" --report content/work/easy-expansion/baseline-verification/release-inventory.json --seed resources/content/seed.sqlite --source-cache content/work/easy-expansion/baseline-verification/source-check-cache.json`; canonical files must not be written.
- [ ] Run `npm run typecheck`, `npx eslint scripts/content/easyExpansion tests/unit/content/easyExpansion.test.ts tests/unit/content/crossTierCorpusGate.test.ts tests/unit/content/enabledAuthorityCollisionTestUtils.ts tests/unit/content/enabledAuthorityCollisionTestUtils.test.ts`, and `git diff --check`.
- [ ] Confirm the accepted release inventory, source cache, and seed still match the locked baseline hashes.
- [ ] Inspect an allowlist proving only the pack bank, `bank.ts`, cumulative tests, and its review manifest changed.
- [ ] Commit the completed pack as `content(trivia): add easy <pack-name> bank`.
- [ ] Fast-forward from the latest `origin/develop`; if it moved after review, refresh, regenerate the manifest and projected hashes, and repeat all cumulative checks and the final review before pushing.
- [ ] Push `HEAD:develop` immediately.
- [ ] Confirm the remote `develop` SHA exactly equals local `HEAD` and record it in the ignored durable progress ledger beside the 0/0/0 result.

Only after the remote SHA is confirmed may the pack be called finished or may the next completed pack be integrated. The merged bank is not yet present in accepted CSVs or the runtime seed.

## Task 6: Atomic publication and final Windows acceptance

- [ ] Prove all twelve bank files contain exactly 240 categories / 1,200 clues.
- [ ] From a clean branch at current `origin/develop`, stage all twelve projected authored/generated/evidence triples under `content/work/easy-expansion` and compare two complete runs byte-for-byte.
- [ ] Require each staged authored/generated/evidence SHA-256 to equal the corresponding SHA sealed in its committed per-pack review manifest before any accepted file is written.
- [ ] Write failing final-inventory and synchronization assertions first in `tests/unit/content/productionBatches.test.ts`, `tests/unit/content/productionValidator.test.ts`, `tests/unit/content/verifyBatch.test.ts`, `tests/integration/content/productionSeed.test.ts`, and `tests/integration/content/bundledContentSync.test.ts`; run them and observe failures against the 7,000-clue baseline.
- [ ] Write failing deterministic packaged-ID and upgrade assertions in `tests/e2e/package-smoke.spec.ts`, `scripts/smoke-package.ps1`, `scripts/create-upgrade-fixture.ts`, `scripts/verify-upgrade-data.ts`, and `tests/integration/packaging/upgradeWorkflow.test.ts`. Add an `-ExpectedClueId` smoke parameter. The packaged check queries the synchronized database for exact ID `built-in-history-easy-expansion-001`; it must not depend on random board selection.
- [ ] Refactor `scripts/content/productionBatches.ts` so board-clue counts are explicit per batch (or conditionally derived by original-pack membership), then set only packs `01` through `12` to 600 while Adult and Estonia remain 500; add 10/10 to each original pack's Easy round distribution.
- [ ] Update `scripts/content/releaseThresholds.ts` to 8,200 board clues, 1,640 sets/names, 707 Easy sets, 3,535 Easy clues, and Easy rounds 354/353.
- [ ] Update exact expectations in `tests/unit/content/productionBatches.test.ts`, `tests/unit/content/productionValidator.test.ts`, `tests/unit/content/verifyBatch.test.ts`, `tests/integration/content/productionSeed.test.ts`, and the `history`, `geography`, `science`, `literature`, `music`, `sports`, `food`, and `technology` playable-pack tests before invoking batch verification.
- [ ] Verify all twelve staged batches with `npm run content:verify-batch -- --batch <batch> --work-root content/work/easy-expansion --source-cache content/work/easy-expansion/source-check-cache.json`.
- [ ] Publish all twelve accepted quartets in one working-tree cutover; do not commit or push a partial set.
- [ ] Prove final totals: 8,200 board clues, 1,640 sets/names, 3,535 Easy clues, 707 Easy sets, Easy rounds 354/353, unchanged Medium/Hard, 174 Finals, and 15 packs.
- [ ] Prove every original pack has 600 rows / 120 sets and Adult/Estonia remain 500/100.
- [ ] Verify every original logical-record hash against `content/reports/easy-expansion-baseline-record-hashes.json` and prove all 1,200 additions have complete one-to-one evidence.
- [ ] Run complete live source checking and manually resolve every source or entailment failure.
- [ ] Build two clean task-local seed/report pairs with `npm run content:build-seed -- --input "content/generated/*.en-et.csv" --evidence "content/evidence/*.jsonl" --output <temp-seed> --report <temp-report>` and require equal seed hashes.
- [ ] Run one final canonical `npm run content:build-seed -- --input "content/generated/*.en-et.csv" --evidence "content/evidence/*.jsonl" --output resources/content/seed.sqlite --report content/reports/release-inventory.json`; require its seed hash to equal both task-local builds.
- [ ] Run `npm run verify:content` to verify the canonical seed/report and publish the final canonical source cache.
- [ ] Make the concrete new-ID assertions green in `tests/integration/content/bundledContentSync.test.ts` and `tests/integration/content/productionSeed.test.ts`; prove insertion into an existing database, preserved user data/tombstones, and idempotent synchronization.
- [ ] Run the full content test surface, full Vitest suite, typecheck, and lint; the canonical `verify:content` gate is the preceding step and must remain green afterward.
- [ ] Run SQLite integrity, foreign-key, inventory, evidence, and bilingual sample checks against the canonical seed.
- [ ] Clear inherited `ELECTRON_RUN_AS_NODE`, run `npm run build`, and inspect the Windows artifact with `npm run security:inspect-package -- --target windows-x64`.
- [ ] Run all 46 product E2E tests and the complete 24-combination match matrix.
- [ ] Run `npm run make:installer` and `npm run make:portable`, then make the exact-ID package assertion green with `pwsh -NoProfile -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both -ExpectedClueId built-in-history-easy-expansion-001`.
- [ ] Run `npm run verify-upgrade -- -- --target windows-x64 --archive out/make/portable/QuizStage-win32-x64.zip` and require the old-database Phase B insertion plus repeated cleanup checks.
- [ ] Obtain a final independent global review ending at 0 Critical / 0 Important / 0 Minor.
- [ ] Commit the complete cutover as `content(trivia): publish accessible easy expansion`; push directly to `develop` and confirm the remote SHA.

## Completion gate

Do not mark the overall goal complete until all twelve reviewed bank commits and the atomic cutover commit are present on `origin/develop`, every per-pack integration satisfied its gate, the final canonical seed and report match the 8,200-clue inventory, and the complete Windows package acceptance passes.
