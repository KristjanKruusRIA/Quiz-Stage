# All-Difficulty Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add exactly 1,000 independently reviewed bilingual questions at each difficulty while preserving the accepted corpus.

**Architecture:** Append new authored/generated/evidence records through the existing batch verifier and atomic publisher. Extend the catalog's data allocation and subtheme vocabulary, then rebuild the production SQLite seed without changing runtime selection.

**Tech Stack:** TypeScript, CSV, JSONL, SQLite, Vitest, existing content CLIs.

**Spec:** `docs/superpowers/specs/2026-10-09-all-difficulty-expansion-design.md`

## Global Constraints

- Exactly 3,000 additions, 1,000 per difficulty, in 600 categories with five questions each.
- Preserve all 8,374 existing authored/generated/evidence records and IDs.
- English and Estonian complete; independent factual/editorial/translation review.
- Subtheme cap remains 15; no dependency or gameplay changes.

## Review Focus

- Renamed paraphrases of existing facts must be rejected, even with new IDs.
- Every question's citation must support its exact intended answer.
- Estonian wording must preserve answer specificity and natural grammar.
- All new topics must be selectable in both rounds and languages at the assigned difficulty.
- Existing user data must survive built-in seed synchronization.

### Task 1: Preserve baseline and pin acceptance

Files: create `content/reports/all-difficulty-expansion-baseline-record-hashes.json`, `tests/unit/content/allDifficultyExpansion.test.ts`; update `tests/unit/content/productionBatches.test.ts`.

- [x] Capture logical hashes of all accepted authored/generated/evidence records and freeze per-pack slot metadata in ignored work files.
- [x] Write assertions for exact 1,000-per-difficulty additions, 100 new sets per round/difficulty, preserved old records, bilingual completeness and five distinct subjects.
- [x] Run focused tests and observe the requested quantity failures before content exists.
- [x] Update catalog vocabulary/allocation in `scripts/content/productionBatches.ts` and inventory in `scripts/content/releaseThresholds.ts`; verify catalog tests pass.

### Task 2: Author and independently review additions

Interfaces: fixed slot metadata in `content/work/2026-10-all-difficulty-expansion/slots/*.json`; draft JSON structure in that workspace's `AUTHORING.md`.

- [x] Three disjoint author agents produce 250 questions in each of their four assigned packs.
- [x] Independent reviewers read every question, actual supporting sources and existing-fact collisions; return artifact-bound factual/editorial/translation decisions.
- [x] Repair rejected questions and obtain approval of final artifacts.

### Task 3: Accept and verify the production corpus

Files: append core pack CSVs/JSONL; update batch reports, release inventory and `resources/content/seed.sqlite`.

- [x] Stage complete merged batches, preserving all baseline records byte-equivalent logically.
- [x] Run `content:verify-batch` with live source checks and `content:publish-batch` for all 12 packs.
- [x] Build the seed twice and verify determinism, exact counts, old record hashes, new category selection and SQLite integrity.
- [x] Run `verify:content`, content tests, lint and typecheck; investigate only failures caused by this expansion.
- [x] Verify runtime selection from a fresh production database and synchronization into an existing user-data fixture, then obtain a fresh whole-change review.

Execution is already authorized by the user's request and exact count clarification. No additional approval gate is needed for reversible local content work.

Final evidence: `docs/superpowers/sdd/2026-10-09-all-difficulty-expansion/verification.md`. All expansion checks pass. The complete suite has 1,415 passing tests, eight skipped and ten Windows symlink-permission failures; whole-library source checking retains five unavailable URLs on unchanged original questions.
