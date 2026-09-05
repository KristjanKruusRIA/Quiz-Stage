# Accessible Easy Expansion Design

**Date:** 2026-09-05

**Status:** Approved direction; written from the integrated 15-pack release

## 1. Purpose

Quiz Stage will add 1,200 new easy board clues to the original twelve topic packs. The expansion is aimed at a typical general-knowledge player in their thirties in Estonia: familiar international pop culture, low-level geography and history, school science, everyday technology, mainstream sport, food, language, art, and major myths or ideas.

This is a light entertainment game. Easy content should reward broad cultural exposure, not specialist study. A category such as `Street Food Around the World` may include shawarma as one recognizable answer; a category that asks five narrow questions about shawarma's origin, terminology, or preparation fails this design even if every fact is correct.

## 2. Integrated baseline

The accepted release at the start of Phase B contains:

- 15 built-in packs;
- 7,000 board clues in 1,400 five-clue category sets;
- 2,335 easy clues in 467 sets;
- 2,335 medium clues in 467 sets;
- 2,330 hard clues in 466 sets;
- 174 Final clues, split 58 per difficulty; and
- 7,174 evidence records with globally unique fact keys.

The Adult and Estonia packs are already integrated. The medium/hard overhaul and Windows package-content repair are already on `develop`. Existing accepted content is the immutable baseline for this additive phase.

## 3. Scope and exact final inventory

### 3.1 In scope

- Add exactly 20 new easy sets and 100 new easy clues to each original pack `01` through `12`.
- Give each pack ten new Round One sets and ten new Round Two sets.
- Preserve every existing accepted row and stable ID; additions are append-only.
- Merge each completed pack's reviewed bank, cumulative tests, and SHA-bound review manifest directly to `develop`.
- Keep the accepted CSV/evidence/report artifacts and canonical 7,000-clue seed unchanged while the twelve banks accumulate, then publish all 1,200 additions in one atomic cutover.
- Keep Adult, Estonia, Finals, Medium, and Hard content unchanged.

### 3.2 Final inventory

| Measure | Baseline | Addition | Final |
|---|---:|---:|---:|
| Board clues | 7,000 | 1,200 | 8,200 |
| Board category sets | 1,400 | 240 | 1,640 |
| Easy clues | 2,335 | 1,200 | 3,535 |
| Easy sets | 467 | 240 | 707 |
| Easy Round One sets | 234 | 120 | 354 |
| Easy Round Two sets | 233 | 120 | 353 |
| Medium clues / sets | 2,335 / 467 | 0 | 2,335 / 467 |
| Hard clues / sets | 2,330 / 466 | 0 | 2,330 / 466 |
| Final clues | 174 | 0 | 174 |
| Built-in packs | 15 | 0 | 15 |

Each expanded original pack ends with 600 board clues in 120 sets. Adult and Estonia remain at 500 board clues in 100 sets each.

### 3.3 Out of scope

- Rewriting existing Easy, Medium, Hard, Adult, Estonia, or Final clues except through a separately approved defect fix.
- New runtime selection behavior, database migrations, pack types, or settings.
- Linux packaging or Linux acceptance. This phase is verified for Windows only.
- Increasing or redistributing the existing 100 OpenTDB-inspired evidence records per original pack.
- Treating a reviewed bank merge as a shipped content release before the final cutover.

## 4. Player experience contract

### 4.1 Broad, announceable categories

Every category has one clear umbrella that a host can announce before revealing clues. The five clues cover five distinct primary subjects and at least four distinct answer entities. No category may be five variations on one person, work, place, dish, organization, event, franchise, or technical term.

Good directions include `Famous World Landmarks`, `Films Everyone Knows`, `90s and 00s Hits`, `Everyday Science`, `Capital Cities`, `Classic Games`, and `Food Around the World`. Generic filler such as `Mix`, `Medley`, `Grab Bag`, `Sampler`, `Quiz`, `Tour`, or `Challenge` is not a theme.

The category title must be natural, bilingual, descriptive, and globally unique across all accepted board sets. It must not leak a response.

### 4.2 Easy tier progression

- Tier 1: household knowledge stated directly.
- Tier 2: a familiar fact with one useful association.
- Tier 3: ordinary pub-trivia knowledge.
- Tier 4: a somewhat more specific clue about a widely recognizable answer.
- Tier 5: a fair stretch for a general player, still easier than the accepted Medium corpus.

Difficulty may increase through specificity or indirectness. It may not increase through an obscure answer, minor personnel, arbitrary metadata, exact measurements, or facts that only a source-page reader would know.

### 4.3 Writing rules

Every clue must:

- stand alone and point to one intended short response;
- offer enough useful information without embedding the answer;
- use natural quiz-copy English and idiomatic Estonian;
- use established Estonian names and translated titles where they exist;
- include common English/Estonian spellings, titles, abbreviations, or transliterations as accepted variants;
- avoid yes/no and multiple-choice wording;
- avoid raw database labels, source headings, parenthetical residue, and awkward calques;
- avoid undated current officeholders, rankings, prices, records, or other changing facts;
- avoid arbitrary exact dates, counts, coordinates, dimensions, and statistics; and
- avoid unsupported cultural, national, invention, or origin claims.

## 5. Topic lanes

The 20 new categories in each pack remain broad and use underrepresented subthemes so no production subtheme exceeds the existing cap of 15 sets.

- History: famous eras, events, people, inventions in context, and everyday social history.
- Geography: capitals, countries, flags, landmarks, seas, rivers, mountains, and map basics.
- Science & Nature: school science, the body, animals, plants, weather, space, and familiar discoveries.
- Literature & Language: famous works, authors, characters, words, idioms, and writing systems.
- Art & Architecture: famous works, artists, buildings, styles, museums, and design icons.
- Music: mainstream pop and rock, familiar classical music, instruments, songs, albums, and performers.
- Film & Television: famous films, series, characters, animation, adaptations, and screen genres.
- Sports & Games: major rules, events, athletes, Olympic basics, classic games, and widely known video games.
- Food & Drink: dishes, ingredients, cuisines, techniques, baking, and non-alcoholic drinks.
- Technology & Inventions: everyday devices, the internet, transport, communication, computing, and familiar inventions.
- Politics, Economics & Society: basic civics, currencies, international organizations, law, education, and everyday economics, without current-office trivia.
- Mythology, Religion & Philosophy: major stories, gods, symbols, world traditions, famous thinkers, and basic ideas rather than doctrinal minutiae.

Adult-owned subjects remain in the Adult pack. Deep Estonia-specific coverage remains in the Estonia pack, although familiar Estonian, Baltic, or Nordic touchpoints may appear where they fit ordinary international trivia.

## 6. Stable identity and data contract

Every original pack uses these new category-set suffixes:

- `set-101` through `set-110`: Round One;
- `set-111` through `set-120`: Round Two.

The range is collision-free in all twelve packs. Packs `01` through `03` intentionally leave `set-100` unused so every Phase B pack has the same mapping.

New clues use a dedicated pack-scoped namespace, `built-in-<topic-family>-easy-expansion-001` through `-100`, ordered by category and tier. `<topic-family>` is the pack ID without the leading `built-in-`; for example, History uses `built-in-history-easy-expansion-001` and Science & Nature uses `built-in-science-nature-easy-expansion-001`. This avoids coupling new IDs to the historical accessible-corpus numbering differences between packs.

Each authored/generated row uses the existing 25-column CSV contract. Every new evidence record uses the integrated version 1 evidence schema. New rows use `origin: "compatibleOpen"` and `inspiration: null` unless a clue is genuinely derived from OpenTDB. Existing OpenTDB inspiration records remain unchanged.

## 7. Implementation architecture

Phase B gets a separate additive pipeline under `scripts/content/easyExpansion/`; the proven Easy replacement and Medium/Hard replacement pipelines remain unchanged.

- `types.ts`: additive category and question contracts fixed to `difficulty: 'easy'`.
- `validateBank.ts`: structural, bilingual, playability, source, and duplicate validation.
- `banks/<batch>.ts`: one 20-category bank per original pack.
- `bank.ts`: cumulative view of every Phase B bank already on the branch.
- `apply.ts`: pure append-only transformation of one accepted pack.
- `scripts/content/applyEasyExpansion.ts`: narrow pack-selecting CLI that stages candidate authored, generated, and evidence artifacts.
- `scripts/content/verifyEasyExpansion.ts`: task-local verifier using a provisional 600-row/120-set batch definition without changing the accepted production catalog.
- `content/reports/easy-expansion-baseline-record-hashes.json`: a committed, deterministic manifest binding all 7,174 accepted baseline records and canonical artifact hashes to source commit `5323a546f4d03460dae7c934703dbcfd8468031f`.
- `docs/superpowers/sdd/2026-09-05-accessible-easy-expansion/reviews/<batch>.json`: one committed review manifest per completed pack, bound to the bank and projected-artifact hashes.

The apply operation must preserve every baseline logical field and evidence value, reject every collision, emit deterministic files, and be idempotent when run against a pack that already contains the exact additions. It aborts before accepted-file writes on any validation failure.

The validator reuses existing accessibility and cross-tier checks where their contracts match. It does not broaden the Medium/Hard bank type to admit Easy categories.

## 8. Evidence and collision contract

Every new clue requires:

- a specific HTTPS source that directly supports the answer and explanation;
- a globally unique `factKey` and canonical `subjectKey`;
- an assertion exactly matching `response_en — explanation_en`;
- separate author, factual reviewer, and editorial reviewer identities;
- review timestamps later than authoring;
- complete, reviewed Estonian; and
- a compatible source license and retrieval date.

Before a pack is complete, its 100 clues are checked against all 7,174 baseline clues and every Phase B pack already merged to `develop`. Checks cover fact keys, normalized clue/answer pairs, answer aliases, category titles, source-heading leakage, subject concentration, repeated subjects inside a set, and suspicious cross-tier overlap. Collision candidates require individual review; blanket waivers are not permitted.

## 9. Per-pack integration and final cutover

Pack authoring may occur in parallel, but integration is serialized. Immediately before review and integration, a pack branch is refreshed onto current `origin/develop` and rechecked against all previously merged Phase B banks.

A pack is not finished until all of the following are true:

1. Its bank contains exactly 20 categories and 100 clues, split 10/10 by round.
2. Its projected accepted quartet has exactly 600 board rows and 120 sets while all original logical records remain field-for-field unchanged.
3. Focused and cumulative collision, content, type, lint, and diff checks pass.
4. Complete task-local source checking and deterministic projection pass.
5. A non-author reviews all 100 clues for factual accuracy, category breadth, Easy fairness, source entailment, English, and Estonian, ending at 0 Critical / 0 Important / 0 Minor findings.
6. A committed review manifest records the current base SHA, bank SHA-256, projected artifact hashes, reviewer identities, reviewed counts, source and collision dispositions, and zeroed final findings.
7. An allowlist proves the commit changes only that bank, cumulative registration/tests, and its review manifest. Accepted content, `productionBatches.ts`, release thresholds, canonical reports/cache, seed, Adult, Estonia, and Finals remain unchanged.
8. The completed commit is pushed directly to `origin/develop`, and the remote SHA is confirmed.

Here, “finished pack” means authoring-complete, source-checked, independently reviewed, reproducibly projectable, and safely merged. It does not mean runtime-published. This distinction preserves the previously approved one-time catalog/threshold/report/cache/seed update and keeps `develop` green at the verified 7,000-clue baseline throughout authoring.

After all twelve pack banks are on `develop`, one final cutover applies all banks to clean accepted inputs, makes board-clue counts explicit per production batch so only packs `01` through `12` become 600 while Adult and Estonia remain 500, updates all twelve Easy round distributions and final 8,200-clue thresholds, verifies and publishes all affected accepted artifacts, regenerates the canonical source cache and release inventory, and rebuilds the canonical seed once. No partial accepted corpus is pushed.

## 10. Windows verification

Every pack bank receives proportionate verification before its push:

- focused Easy-expansion and affected-pack tests;
- cumulative collision and cross-tier gates;
- TypeScript typecheck, scoped lint, and `git diff --check`;
- complete source checks in an ignored task-local cache;
- deterministic task-local 600-row projection, provisional verification, and hash comparison;
- baseline-manifest and changed-file allowlist checks; and
- `content:verify-seed` against task-local copies of the canonical report/cache, proving the unchanged 7,000-clue baseline without rewriting canonical files.

The final cutover receives the production batch, validator, seed, and bundled-content synchronization tests. It adds a targeted packaged Easy-ID assertion plus an old-database synchronization/upgrade assertion, then runs the complete Windows release suite: full unit/integration tests, full product E2E matrix, packaged artifact inspection, installer and portable smoke, and upgrade verification.

## 11. Completion condition

Phase B is complete only when all twelve reviewed bank commits are on `origin/develop`, the atomic cutover is also on `origin/develop`, the final 8,200-clue/1,640-set canonical seed is deterministic and verified, every new category satisfies the broad Easy contract, every new clue is source-backed and bilingual, existing records remain unchanged, all independent reviews end at 0/0/0, and the final Windows package acceptance passes.
