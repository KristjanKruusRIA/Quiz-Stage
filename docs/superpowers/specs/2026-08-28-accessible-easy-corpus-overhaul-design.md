# Accessible Easy Corpus Overhaul Design

**Date:** 2026-08-28

**Status:** Approved in chat; written for implementation review

## 1. Purpose

Quiz Stage will replace every remaining legacy easy board clue in the original twelve topic packs with accessible, broadly playable trivia. The overhaul keeps the board inventory and difficulty allocation stable while removing infobox residue, niche metadata, awkward generated phrasing, and categories whose titles do not tell players what kind of knowledge to expect.

The intended audience is a general-knowledge player in their thirties in Estonia. The content is not an Estonia-only quiz: it emphasizes international household knowledge, mainstream 1990s–2010s culture, low-level geography and history, everyday science and technology, familiar sports and games, food, language, art, and mythology. Light Baltic and Nordic material is welcome, but deep Estonia coverage belongs to the separate `15-estonia` pack already being authored in the `adult-estonia-content` worktree.

## 2. Current evidence and baseline

The current accepted seed contains:

- 6,000 board clues in 1,200 five-clue category sets;
- 2,000 easy board clues in 400 easy sets;
- 400 accessible replacements in 80 easy sets across ten packs;
- 1,600 legacy easy clues in 320 easy sets;
- no accessible replacements in Art & Architecture or Mythology, Religion & Philosophy; and
- generic generated titles on all 400 easy sets, including names such as `Quick Mix`, `Curious Grab Bag`, and `Everyday Sampler`.

The corpus audit found materially worse accessibility signals in the 1,600 legacy clues than in the 400 replacements: 296 numeric answers, 164 exact-date or exact-number prompts, 71 answers of at least 40 characters, 57 multi-item list answers, 37 infobox/date artifacts, 19 binary questions, and a mechanical source-title prefix on every legacy clue.

The design therefore treats the complete easy tier as the unit of work. Replacing only another arbitrary slice would leave the same user-facing problem in place.

## 3. Scope and exact inventory

### 3.1 In scope

- Replace all 1,600 remaining legacy easy clues one-for-one.
- Preserve all 320 target category-set IDs, their pack IDs, rounds, difficulty, and five tier slots.
- Retain the already accepted facts and clue IDs for the existing 400 accessible clues unless verification finds an actual factual or language defect.
- Replace the English and Estonian title of every one of the 400 easy category sets with a unique, meaningful, coherent theme.
- Preserve exactly 6,000 board clues, 1,200 board sets, 400 easy sets, 400 medium sets, and 400 hard sets before the Adult/Estonia branch is integrated.
- Preserve exactly 100 OpenTDB-inspired evidence records in each of the original twelve board batches.

### 3.2 Out of scope

- Medium and hard clue replacement in this phase.
- Adult, Estonia, or Final clue authoring.
- Runtime changes, setup changes, database migrations, pack-selection changes, or new content-pack types.
- Changes to the release inventory owned by the Adult/Estonia worktree before integration.
- Triggering the hosted release workflow.

### 3.3 Exact replacement allocation

| Original pack | Legacy easy sets | New clues |
|---|---:|---:|
| History | 26 | 130 |
| Geography | 26 | 130 |
| Science & Nature | 26 | 130 |
| Literature & Language | 26 | 130 |
| Art & Architecture | 33 | 165 |
| Music | 25 | 125 |
| Film & Television | 25 | 125 |
| Sports & Games | 25 | 125 |
| Food & Drink | 25 | 125 |
| Technology & Inventions | 25 | 125 |
| Politics, Economics & Society | 25 | 125 |
| Mythology, Religion & Philosophy | 33 | 165 |
| **Total** | **320** | **1,600** |

## 4. Player experience contract

### 4.1 Category design

Every easy category has one useful theme that a host can announce and players can understand before seeing a clue. Examples include `World Landmarks`, `Films Everyone Knows`, `90s and 00s Hits`, `Everyday Science`, `Famous Inventions`, `Food Around the World`, and `Gods and Heroes`.

Each category contains exactly five distinct primary subjects. A category may have a coherent umbrella without asking five questions about the same person, dish, franchise, country, or work. Evidence uses the same canonical `subjectKey` whenever the same primary subject appears elsewhere, so subject diversity and reuse remain measurable.

The final combined easy tier must contain zero category titles using generic filler terms such as `Mix`, `Medley`, `Sampler`, `Grab Bag`, `Odds & Ends`, `Potpourri`, `Roundup`, `Tour`, `Quiz`, or `Challenge` merely to distinguish generated sets.

### 4.2 Difficulty within an easy category

- Tier 1: household knowledge or a very direct clue.
- Tier 2: widely recognizable knowledge with one additional association.
- Tier 3: ordinary pub-trivia knowledge.
- Tier 4: a more specific clue about a familiar subject.
- Tier 5: the hardest clue in the category, but still fair to a general audience.

Tiers 4 and 5 become harder through clue specificity and indirectness, not through obscure answers, minor personnel, exact metadata, or arbitrary numbers.

### 4.3 Writing and answer rules

Clues must be answerable without seeing a source-title prefix. English and Estonian must read as natural quiz writing, not as translated database labels.

The easy tier excludes:

- raw infobox fields or parenthetical database residue;
- exact release, patent, opening, birth, death, or discontinuation dates unless the date itself is culturally iconic;
- height, weight, coordinates, nutrition grams, rankings, changing statistics, or arbitrary measurements;
- minor cast, production credits, season venues, runners-up, and similar metadata;
- long enumerations where a short familiar answer is possible;
- true/false or yes/no prompts;
- answers leaked in the clue or category title;
- unstable current facts without a dated frame; and
- unsupported national, cultural, or origin claims.

Accepted variants are added where Estonian and English commonly use different titles, spellings, transliterations, abbreviations, or popular names.

## 5. Source, evidence, and review contract

Every new clue has:

- a specific supporting source with a compatible license;
- a stable fact assertion matching the clue, answer, and explanation;
- factual approval;
- editorial approval;
- reviewed Estonian translation; and
- a canonical primary `subjectKey` distinct from the other four subjects in its category.

Existing cached authoritative or compatible open sources are preferred when they support the exact assertion, reducing source-cache churn. Source reuse must never be used to justify a weaker or only indirectly supported fact.

Before publication, the complete 2,000-clue easy tier is checked globally for duplicate clue/answer pairs, repeated fact keys, answer leaks, and repeated primary subjects within a category.

## 6. Implementation architecture

The overhaul uses new task-specific modules and does not extend the existing 400-question `accessibleEasy.ts` file.

### 6.1 New modules

- `scripts/content/accessibility/types.ts` owns the category, question, source, and replacement-ledger interfaces.
- `scripts/content/accessibility/audit.ts` owns deterministic accessibility signals and produces a read-only audit result with clue and category reasons.
- `scripts/content/accessibility/categoryNames.ts` maps all 400 easy category-set IDs to unique bilingual thematic names.
- `scripts/content/accessibility/banks/artMythology.ts` owns 330 questions.
- `scripts/content/accessibility/banks/societyTechnologyCulture.ts` owns 500 questions across politics, technology, music, and sports.
- `scripts/content/accessibility/banks/geographyScienceFood.ts` owns 385 questions.
- `scripts/content/accessibility/banks/historyLiteratureScreen.ts` owns 385 questions.
- `scripts/content/accessibility/bank.ts` combines and validates the four independent banks.
- `scripts/content/accessibility/apply.ts` applies a validated bank to in-memory authored, generated, and evidence artifacts.
- `scripts/content/applyAccessibleCorpus.ts` is the narrow command-line entry point for staging and publishing the original twelve batches.

### 6.2 Tests

- `tests/unit/content/accessibilityAudit.test.ts` proves the audit detects representative metadata, exact-date, long-answer, binary, and template artifacts without flagging representative accessible clues.
- `tests/unit/content/accessibleCorpus.test.ts` proves exact bank counts, allocation, unique titles, five-subject diversity, target selection, slot preservation, quota preservation, duplicate rejection, and idempotent reruns.

### 6.3 Data flow

1. Read accepted authored, generated, and evidence files for batches `01` through `12`.
2. Identify the 320 legacy easy category sets by their stable category-set IDs; never select targets by current file position alone.
3. Validate that every expected target has exactly five tier slots and that every non-target row is unchanged.
4. Apply the 320 new categories and retitle the 80 existing accessible categories.
5. Preserve pack ID, pack name, content kind, round, difficulty, category-set ID, tier, value semantics, enabled state, and row count.
6. Preserve or reassign OpenTDB inspiration evidence so each original batch retains exactly its required 100 inspired clues.
7. Validate the complete in-memory result before writing any accepted artifact.
8. Write the twelve authored, generated, and evidence artifacts deterministically.

The apply operation aborts before accepted-file writes if a target is missing, a set has the wrong number of tiers, a title is duplicated, a category repeats a subject, a clue/fact duplicates another accepted clue, an evidence record is incomplete, an OpenTDB quota cannot be retained, or any inventory count changes.

## 7. Parallel execution

After the shared interfaces and failing tests establish the contract, four independent authoring lanes proceed in parallel:

1. Art and mythology: 330 clues.
2. Politics, technology, music, and sports: 500 clues.
3. Geography, science, and food: 385 clues.
4. History, literature, and film/television: 385 clues.

Each lane writes only its assigned bank module. The primary agent owns shared types, tests, the category-name ledger, integration, conflict resolution, and final review. No two agents edit the same content module.

## 8. Adult/Estonia worktree coordination

The `feat/adult-estonia-content` worktree owns:

- `13-finals`, `14-adult`, and future `15-estonia` artifacts;
- production-batch and exact-release inventory definitions;
- the Adult evidence-policy schema;
- validator, verifier, and seed-builder changes;
- Adult setup/runtime contracts and tests; and
- the canonical source cache, release inventory, and production seed while its work is ongoing.

This overhaul therefore does not modify:

- `scripts/content/accessibleEasy.ts` or its existing test;
- `scripts/content/productionBatches.ts`;
- `scripts/content/releaseThresholds.ts`;
- `scripts/content/evidence.ts`;
- `scripts/content/validate.ts`;
- `scripts/content/verifyBatch.ts`;
- `scripts/content/buildSeed.ts`;
- `scripts/content/verifySeed.ts`;
- `content/**/13-finals*`, `14-adult*`, or `15-estonia*`;
- Adult setup/runtime files; or
- canonical `content/reports/source-check-cache.json`, `content/reports/release-inventory.json`, and `resources/content/seed.sqlite` before integration.

Development verification uses task-local report, source-cache, and seed paths under an ignored temporary directory. The Adult/Estonia branch is integrated first. This overhaul is then rebased or merged, evidence compatibility is rechecked against the final schema, and one canonical release report, cache, and seed are rebuilt from the combined accepted artifacts.

## 9. Verification strategy

### 9.1 Test-first contract

Implementation begins with failing tests for the audit, the exact 1,600-question allocation, the 320 target-set ledger, all 400 titles, idempotency, and OpenTDB preservation. Production logic is added only after each failure is observed for the intended reason.

### 9.2 Pre-integration verification

The current 6,000-board-clue branch must prove, using task-local outputs:

- 6,000 board clues and 1,200 board sets;
- exactly 2,000 easy clues in 400 easy sets;
- exactly 1,600 new replacement clue IDs and 400 retained accessible clue IDs;
- zero legacy easy clue IDs;
- zero banned generic easy-category titles;
- five tiers and five distinct subjects in every easy set;
- unchanged medium, hard, and Final rows;
- exact per-batch OpenTDB composition;
- complete bilingual evidence and source checks;
- deterministic output across two clean runs; and
- SQLite readback from a task-local seed.

Focused tests, the full content test surface, type checking, scoped lint, and diff checks must pass. Any unrelated repository-wide failure is isolated and reported with a focused rerun.

### 9.3 Post-integration verification

After the Adult/Estonia worktree is complete and integrated, canonical verification must prove:

- 7,000 board clues and 1,400 board sets;
- 174 Finals and 15 built-in packs;
- exact easy, medium, hard, round, pack, and Final allocations from the integrated catalog;
- no duplicate facts or clue/answer pairs across original, Adult, Estonia, and Final content;
- Adult remains unchecked by default and contributes neither board nor Final candidates when unchecked;
- Estonia behaves as a normal default-selected pack;
- deterministic canonical seed generation;
- exact SQLite readback;
- full content validation and source checking;
- complete unit and integration tests; and
- relevant local packaged-application acceptance.

The hosted release workflow remains out of scope.

## 10. Delivery order

1. Add failing audit and bank-contract tests.
2. Add shared types, the stable target ledger, and the 400-title ledger.
3. Author the four independent content banks in parallel.
4. Integrate, run duplicate and language review, and stage all twelve original batches.
5. Run complete task-local 6,000-clue verification without modifying shared canonical release artifacts.
6. Wait for and integrate the completed Adult/Estonia branch.
7. Reconcile the evidence schema, publish the original twelve updated batches, and rebuild shared artifacts once.
8. Run full canonical 7,000-board-clue release and packaged acceptance.

## 11. Completion condition

The overhaul is complete only when all 1,600 legacy easy clues have been replaced, all 400 easy categories have meaningful bilingual names, every easy category satisfies the five-subject and writing contract, the original twelve packs preserve their inventories and evidence quotas, the Adult/Estonia work is integrated without lost changes, and the combined canonical release passes every post-integration check in section 9.3.
