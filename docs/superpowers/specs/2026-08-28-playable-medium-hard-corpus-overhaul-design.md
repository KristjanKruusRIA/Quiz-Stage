# Playable Medium and Hard Corpus Overhaul Design

**Date:** 2026-08-28

**Status:** Approved in chat; written for implementation review

## 1. Purpose

Quiz Stage will replace the complete medium and hard slices of the original twelve topic packs with broad, fair general-knowledge trivia. The result should be fun for a general Estonian player in their thirties without requiring specialist knowledge of infobox fields, minor credits, exact measurements, or obscure biography metadata.

This is the second corpus-quality pass. The accepted 2,000-clue easy tier remains unchanged except for separately verified factual or translation defects. A later expansion will add 1,200 new easy clues after the Adult/Estonia branch has landed, so shared release thresholds and the production catalog are changed only once.

## 2. Evidence and decision

The accepted original-pack corpus currently contains 4,000 medium/hard clues in 800 five-clue sets. A complete audit found:

- all 800 category titles are generic filler such as `Mix`, `Medley`, `Tour`, `Grab Bag`, `Roundup`, `Sampler`, `Potpourri`, `Challenge`, `Quiz`, or `Odds & Ends`;
- the underlying categories mix unrelated subjects rather than presenting announceable themes;
- 1,348 clues match obvious database or metadata patterns, including 889 `associated with` prompts, 85 `how many` prompts, 270 year/date prompts, and 181 raw-field prompts;
- at least 592 clues are already flagged by the earlier accessibility audit, despite that audit being tuned primarily for easy content;
- repeated-subject fanout, repeated answers, source-heading leaks, arbitrary numbers, minor personnel, and literal translations occur in every pack; and
- difficulty is driven by metadata obscurity rather than clue construction, so some hard clues are easier than medium clues while other hard clues are effectively unanswerable.

The defects are structural across all twelve packs. Selective repair would preserve thousands of random, incoherent, or unfair clues. The approved approach is therefore a one-for-one replacement of the entire medium/hard slice.

## 3. Scope and inventory

### 3.1 Phase A: approved immediate work

- Replace all 4,000 medium/hard clues in the original twelve packs.
- Replace all 800 medium/hard bilingual category titles with meaningful themes.
- Preserve category-set IDs, batch IDs, pack IDs, round, difficulty, tier, enabled state, and row order.
- Preserve exactly 6,000 board clues, 1,200 board sets, and 2,000 clues per difficulty before Adult/Estonia integration.
- Preserve each original batch's exact 100-clue OpenTDB-inspired evidence quota and existing easy allocation.
- Leave all 2,000 accepted easy clues and 400 easy titles unchanged unless verification finds an actual defect.

| Packs | Medium sets/clues | Hard sets/clues | Total replacement clues |
|---|---:|---:|---:|
| 01–04 | 132 / 660 | 132 / 660 | 1,320 |
| 05–08 | 136 / 680 | 132 / 660 | 1,340 |
| 09–12 | 132 / 660 | 136 / 680 | 1,340 |
| **Total** | **400 / 2,000** | **400 / 2,000** | **4,000** |

### 3.2 Phase B: approved deferred work

After `feat/adult-estonia-content` is integrated, add 1,200 new easy clues: 20 new five-clue easy sets in each of the twelve original packs. Assuming the Adult and Estonia packs land with their planned 1,000 board clues, this raises the combined board corpus from 7,000 to 8,200 clues.

Phase B receives its own implementation plan after the integrated catalog, evidence schema, thresholds, and seed contract are current. It must not be staged as unpublished accepted content on this branch.

### 3.3 Out of scope for Phase A

- Adult, Estonia, or Final clue authoring or repair.
- Net-new category sets or inventory-threshold changes.
- Runtime, setup, database-schema, or pack-selection changes.
- Canonical release inventory, source cache, or production seed changes while the Adult/Estonia worktree owns them.
- Hosted release workflow execution.

## 4. Player experience contract

### 4.1 Categories

Every category has one concrete theme that a host can announce before revealing a clue. Its five clues cover five distinct primary subjects within that theme. A set may not fan out five metadata questions about one person, work, place, organization, dish, event, or franchise.

English and Estonian category titles must be natural, specific, globally unique within the 1,200-set original-pack corpus, and free of generic filler used merely to distinguish generated sets.

### 4.2 Medium difficulty

Medium clues target ordinary pub-trivia knowledge. A player should normally recognize the answer from broad exposure plus two useful cues. Tier progression may add indirectness or require connecting familiar facts, but the response itself remains recognizable.

Examples of fair medium knowledge include a major historical event from its consequences, a European city from two landmarks, a scientific concept from an everyday effect, a famous work from plot and creator, or a sport from distinctive rules.

### 4.3 Hard difficulty

Hard clues target canonical secondary knowledge rather than arbitrary metadata. They may require a less obvious connection, a more specific work or event, or synthesis of multiple cues, but the response should still be meaningful to a strong general-trivia player.

Hardness must never come from exact coordinates, capacities, nutrition grams, registry identifiers, raw relationship fields, minor credits, obscure relatives, arbitrary dates, or an answer that only a source-page reader could know.

### 4.4 Writing and answer rules

Clues must:

- stand alone without source-page headings or category-name restatement;
- contain enough discriminating information for one intended response;
- avoid yes/no, multiple-choice, and `what is associated with` templates;
- avoid unstable current facts unless explicitly and appropriately dated;
- avoid exact dates or numbers unless the value is culturally or conceptually significant;
- avoid long lists when a short recognizable response is possible;
- avoid leaking the answer in the clue or category title;
- use accepted variants for common English/Estonian names, titles, spellings, abbreviations, and transliterations; and
- use natural Estonian written as quiz copy rather than literal database translation.

## 5. Topic boundaries

Each pack uses broad, distinct topic families. Representative directions are:

- History: European and world turning points, social history, diplomacy, decolonisation, Baltic and Nordic history.
- Geography: European cities, borders, seas and river systems, landscapes, maps, migration, Baltic physical geography.
- Science & Nature: genetics, immunity, energy, materials, ecology, astronomy, landmark experiments, climate systems.
- Literature & Language: major works and movements, theatre and adaptation, language families, word formation, Baltic and Nordic writing.
- Art & Architecture: recognizable works and styles, public art, restoration, design, landmark buildings, Baltic creators.
- Music: landmark albums and artists, genres, instruments, covers, collaboration, recording innovation, Baltic music.
- Film & Television: plots and characters, adaptations, movements, effects, cult classics, global formats, Nordic screen.
- Sports & Games: rules, formats, rivalries, Olympic traditions, strategy, design, Estonian and Baltic milestones.
- Food & Drink: techniques, preservation, fermentation, crops, trade, dining customs, culinary science, protected names.
- Technology & Inventions: computing, networks, electronics, materials, energy, measurement, aerospace, medical and civil engineering.
- Politics, Economics & Society: constitutional design, elections, economic ideas, labour, migration, diplomacy, civil society, media literacy.
- Mythology, Religion & Philosophy: world traditions, ritual calendars, reform, epistemology, metaphysics, aesthetics, major schools and thought experiments.

Adult-owned subjects—including nightlife, vice law, sexual content, adult media, erotic art, and related regulation—remain outside these lanes.

## 6. Source and evidence contract

Every replacement clue has:

- a specific source that directly supports the assertion and has a compatible license;
- a stable fact assertion matching clue, response, and explanation;
- a canonical primary `subjectKey` shared across the corpus when the subject recurs;
- factual and editorial approval;
- reviewed natural Estonian; and
- OpenTDB inspiration transferred one-for-one where the removed slot carried it.

The final 6,000-clue corpus is checked globally for duplicate facts, clue/answer pairs, answer leakage, repeated subjects within a category, suspicious answer reuse, temporal ambiguity, numeric/metadata prompts, and source support. Passing schema validation alone is not evidence of playability.

## 7. Implementation architecture

Phase A uses new task-specific modules under `scripts/content/playability/`. It does not modify the stable easy pipeline or Adult/Estonia-owned shared infrastructure.

- `types.ts`: bilingual category/question/source and audit contracts.
- `targets.ts`: literal, stable medium/hard set ledger and per-pack allocation.
- `audit.ts`: deterministic playability signals over accepted rows.
- `validateBank.ts`: pure structural, editorial, bilingual, source, and duplicate checks.
- `banks/packs01to04.ts`: 1,320 replacement clues.
- `banks/packs05to08.ts`: 1,340 replacement clues.
- `banks/packs09to12.ts`: 1,340 replacement clues.
- `bank.ts`: combines the three disjoint banks and runs global validation.
- `apply.ts`: pure in-memory authored/generated/evidence transformation.
- `scripts/content/applyPlayableCorpus.ts`: stages or atomically publishes all original-pack artifacts.

The three banks own disjoint pack IDs and no shared file. Shared contracts and failing tests are completed before parallel authoring starts.

## 8. Data flow and failure behavior

1. Read accepted authored, generated, and evidence artifacts for batches 01–12.
2. Resolve targets from the stable category-set ledger, never from row position or current clue wording.
3. Validate that each expected set has exactly five stable tier slots and that all easy rows are non-targets.
4. Map each authored category to one stable set, then apply the matching bilingual replacement category to authored, generated, and evidence rows.
5. Generate deterministic replacement clue IDs while preserving all structural slot fields.
6. Transfer removed inspiration records exactly once and create complete evidence for every new clue.
7. Validate the complete 6,000-clue in-memory result before writing.
8. Write a full staged tree by default; publish only with an explicit flag after all twelve batches pass.

The operation aborts before accepted-file writes for missing or extra targets, wrong tier counts, duplicate IDs/facts/clue-answer pairs, category subject reuse, answer leaks, incomplete bilingual fields, incomplete evidence, quota drift, non-target mutation, or inventory drift.

## 9. Adult/Estonia coordination

Phase A may modify only its new playability modules/tests and accepted artifacts for batches 01–12. It must not modify:

- `.worktrees/adult-estonia-content/**`;
- `content/work/14-adult/**` or `content/work/15-estonia/**`;
- accepted or future artifacts for batches 13–15;
- `scripts/content/productionBatches.ts`, `releaseThresholds.ts`, `evidence.ts`, `validate.ts`, `verifyBatch.ts`, `buildSeed.ts`, or `verifySeed.ts`;
- Adult setup/runtime files;
- `content/reports/source-check-cache.json` or `release-inventory.json`; or
- `resources/content/seed.sqlite`.

Task-local reports, source cache, snapshots, and seed use `content/work/playable-corpus-overhaul/`, which is already covered by the ignored `content/work/` boundary. The Adult/Estonia branch is integrated before Phase B and before canonical combined-release artifacts are rebuilt.

## 10. Verification and success criteria

Phase A is complete only when fresh evidence proves:

- exactly 4,000 replacement clues across exactly 800 stable medium/hard sets;
- exactly 2,000 medium and 2,000 hard clues, with unchanged easy rows;
- zero generic medium/hard category titles;
- five tiers and five distinct canonical subjects in every replacement set;
- no raw metadata templates, binary prompts, answer leaks, arbitrary exact values, or undated changing facts;
- exact per-batch and per-difficulty OpenTDB inspiration composition;
- complete reviewed English/Estonian content and direct source support;
- no duplicate fact keys or normalized clue/answer pairs across all accepted content;
- deterministic staging and idempotent reapplication;
- task-local validation, source checking, seed build, and SQLite readback;
- focused tests, the full content test surface, type checking, and scoped lint; and
- an independent adversarial review of each authoring lane followed by a final global audit.

After Adult/Estonia integration, canonical release verification must additionally prove the integrated 7,000-clue baseline before Phase B begins. Phase B then adds exactly 1,200 easy clues and updates the final catalog, thresholds, reports, and seed once.
