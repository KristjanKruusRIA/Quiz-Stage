# Playable Medium and Hard Corpus Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Use isolated worktrees for parallel content lanes and review each lane before integration.

**Goal:** Replace all 4,000 medium/hard clues and all 800 medium/hard category titles in the original twelve packs with broad, fair, bilingual general-knowledge trivia while preserving every board slot, easy clue, evidence quota, and Adult/Estonia-owned file.

**Architecture:** New `scripts/content/playability/` modules define a stable target ledger, deterministic audit, three disjoint typed content banks, global validation, and a pure transformation. A narrow CLI stages all twelve batches and publishes them atomically only after global validation. Task-local verification avoids the canonical cache, release inventory, and production seed until Adult/Estonia integration.

**Spec:** `docs/superpowers/specs/2026-08-28-playable-medium-hard-corpus-overhaul-design.md`

## Global constraints

- Replace exactly 4,000 clues in exactly 800 stable medium/hard category sets.
- Preserve all 2,000 easy rows byte-for-byte unless an independently verified defect is explicitly added to scope.
- Preserve pack, batch, set, difficulty, round, tier, enabled state, values, and row order.
- Preserve each original batch's exact 100-clue OpenTDB-inspired quota and existing easy/medium/hard distribution.
- Give every set a unique, meaningful bilingual title and five distinct canonical subjects.
- Use broad fair medium knowledge and canonical secondary hard knowledge; reject arbitrary metadata as a difficulty mechanism.
- Require direct compatible sources, complete evidence, factual/editorial approval, and natural reviewed Estonian.
- Never edit the Adult/Estonia worktree, batches 13–15, shared catalog/threshold/validator/evidence/seed infrastructure, canonical cache, release inventory, or production seed.
- Use only `content/work/playable-corpus-overhaul/` for task-local verification artifacts.

## Task 1: Lock the audit contract test-first

**Files:**
- Create `scripts/content/playability/types.ts`
- Create `scripts/content/playability/audit.ts`
- Create `tests/unit/content/playabilityAudit.test.ts`

- [ ] Write fixtures proving detection of source-heading prefixes, raw-field prompts, `associated with`, arbitrary exact dates/numbers, minor-credit prompts, binary/multiple-choice wording, answer leaks, changing facts without a date, generic titles, repeated answers, and incoherent source fanout.
- [ ] Add fair medium/hard counterexamples so signals are not simple keyword rejection.
- [ ] Run the focused test and observe the intended missing-module failure.
- [ ] Implement deterministic read-only audit signals with stable reason codes and diagnostics.
- [ ] Run the focused test green and commit `test(content): define corpus playability audit`.

## Task 2: Lock target and bank contracts test-first

**Files:**
- Create `scripts/content/playability/targets.ts`
- Create `scripts/content/playability/validateBank.ts`
- Create `tests/unit/content/playableCorpus.test.ts`

- [ ] Derive and freeze the literal 800-set target ledger from accepted batches 01–12.
- [ ] Test exact allocation: packs 01–04 each 33 medium/33 hard; 05–08 each 34 medium/33 hard; 09–12 each 33 medium/34 hard.
- [ ] Test exact five tiers, unique category IDs/titles/question keys/fact keys, five distinct subjects, bilingual completeness, source shape, answer leakage, binary/multiple-choice rejection, unstable-fact dating, and local/global duplicate rejection.
- [ ] Observe the structural red state, implement the smallest pure validator, run green, and commit `test(content): lock playable corpus contract`.

## Task 3: Build the pure apply and staging pipeline test-first

**Files:**
- Create `scripts/content/playability/apply.ts`
- Create `scripts/content/applyPlayableCorpus.ts`
- Modify `tests/unit/content/playableCorpus.test.ts`

- [ ] Add in-memory transformation tests for deterministic IDs, exact slot preservation, bilingual titles/content, accepted variants, evidence replacement, one-to-one inspiration transfer, unchanged easy/non-target rows, deterministic ordering, and idempotent reruns.
- [ ] Add abort tests for missing/extra targets, wrong tier counts, incomplete evidence, quota drift, duplicates, non-target mutation, and inventory drift.
- [ ] Observe the intended red state and implement the pure transformation.
- [ ] Implement `--output-root` staging with default `content/work/playable-corpus-overhaul/staged` and an explicit all-batches-only `--publish` flag.
- [ ] Run focused tests green and commit `feat(content): add playable corpus staging pipeline`.

## Task 4: Author packs 01–04 in an isolated lane

**File:** `scripts/content/playability/banks/packs01to04.ts`

**Allocation:** 264 sets / 1,320 clues across History, Geography, Science & Nature, and Literature & Language.

- [ ] Create an isolated worktree from the shared-contract commit.
- [ ] Author 33 medium and 33 hard themed categories per pack using the approved topic boundaries.
- [ ] Preserve the required 33 medium and 33 hard OpenTDB inspiration transfers per pack.
- [ ] Run lane validation and focused tests.
- [ ] Commit only the assigned bank file and return the commit plus a self-review report.

## Task 5: Author packs 05–08 in an isolated lane

**File:** `scripts/content/playability/banks/packs05to08.ts`

**Allocation:** 268 sets / 1,340 clues across Art & Architecture, Music, Film & Television, and Sports & Games.

- [ ] Create an isolated worktree from the shared-contract commit.
- [ ] Author 34 medium and 33 hard themed categories per pack using the approved topic boundaries.
- [ ] Preserve the required 34 medium and 33 hard OpenTDB inspiration transfers per pack.
- [ ] Run lane validation and focused tests.
- [ ] Commit only the assigned bank file and return the commit plus a self-review report.

## Task 6: Author packs 09–12 in an isolated lane

**File:** `scripts/content/playability/banks/packs09to12.ts`

**Allocation:** 268 sets / 1,340 clues across Food & Drink, Technology & Inventions, Politics/Economics/Society, and Mythology/Religion/Philosophy.

- [ ] Create an isolated worktree from the shared-contract commit.
- [ ] Author 33 medium and 34 hard themed categories per pack using the approved topic boundaries and explicit Adult-subject exclusions.
- [ ] Preserve the required 33 medium and 34 hard OpenTDB inspiration transfers per pack.
- [ ] Run lane validation and focused tests.
- [ ] Commit only the assigned bank file and return the commit plus a self-review report.

## Task 7: Review and repair each lane before integration

- [ ] Assign a reviewer who did not author the lane to inspect theme coherence, difficulty fairness, bilingual naturalness, source support, answer variants, subject keys, duplicate risk, and Adult overlap.
- [ ] Author fixes every confirmed finding in the lane worktree and reruns lane tests.
- [ ] Reviewer rechecks the repaired commit.
- [ ] Record compact review evidence under the task-local work directory, not `docs/superpowers`.

## Task 8: Integrate all banks and lock global validation

**Files:**
- Create `scripts/content/playability/bank.ts`
- Modify `tests/unit/content/playableCorpus.test.ts`

- [ ] Cherry-pick the three reviewed lane commits onto the primary branch.
- [ ] Combine banks in stable target-ledger order and validate exactly 800 categories / 4,000 clues.
- [ ] Add global tests against all accepted easy clues and all proposed medium/hard clues for duplicate facts, clue/answer pairs, answer leaks, normalized answer concentration, repeated category subjects, generic titles, and banned metadata patterns.
- [ ] Run focused tests green and commit `content(trivia): integrate playable medium and hard banks`.

## Task 9: Stage, inspect, and publish accepted artifacts

**Files:**
- Modify only matching batch 01–12 files under `content/authored/`, `content/generated/`, and `content/evidence/`.

- [ ] Stage the complete transformed tree under the task-local output root.
- [ ] Compare row counts, IDs, structural fields, easy-row hashes, evidence quotas, and deterministic rerun hashes with the accepted tree.
- [ ] Run the audit over all 6,000 staged clues and inspect every remaining signal manually.
- [ ] Repair confirmed content defects in the owning bank, restage, and repeat until clean.
- [ ] Publish all 36 accepted artifacts atomically and commit `content(trivia): publish playable medium and hard corpus`.

## Task 10: Full Phase A verification

- [ ] Run playability-focused tests and all existing content unit/integration tests.
- [ ] Run type checking and lint while explicitly excluding live sibling worktrees from lint traversal.
- [ ] Run task-local release validation and complete source checks without writing canonical reports/cache.
- [ ] Build a task-local seed twice, compare hashes, and verify exact SQLite readback.
- [ ] Verify 6,000 board clues, 1,200 sets, 2,000 per difficulty, 100 inspired clues per original batch, unchanged easy hashes, and zero changes in the Adult worktree.
- [ ] Run independent final adversarial review and repair confirmed findings.
- [ ] Use `superpowers:verification-before-completion` before reporting Phase A complete.

## Task 11: Integrate Adult/Estonia before Phase B

- [ ] Confirm `feat/adult-estonia-content` is complete, clean, and independently verified.
- [ ] Follow `superpowers:finishing-a-development-branch` to select and perform the user-approved integration path.
- [ ] Reconcile any evidence-schema or accepted-artifact conflicts without discarding either corpus.
- [ ] Rebuild canonical 7,000-clue release artifacts once and run full application/package acceptance.

## Task 12: Plan and execute the approved easy expansion

- [ ] Write a current-state Phase B spec/plan for 20 new easy sets per original pack, using the integrated 15-pack catalog and final evidence schema.
- [ ] Add exactly 1,200 accessible easy clues and 240 meaningful categories without changing existing clue slots.
- [ ] Update final catalog/thresholds/reports/seed once for the 8,200-clue board corpus.
- [ ] Run full source, content, runtime, seed, and packaged-application verification before declaring the overall goal complete.
