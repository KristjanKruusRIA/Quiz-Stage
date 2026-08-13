# Quiz Stage Production Content Recovery Design

**Status:** Approved design; pending written-spec review

**Date:** 2026-08-13

**Parent design:** `docs/superpowers/specs/2026-08-11-jeopardy-desktop-game-design.md`

**Parent plan:** `docs/superpowers/plans/2026-08-11-quiz-stage-desktop-game.md`

## 1. Purpose

The committed Tasks 23–35 corpus is a draft inventory made from numbered topic shells, generic answers, and unrelated or generic source links. It satisfies row counts but does not satisfy the parent design's requirement for source-backed production clues. Those tasks are reopened.

This design defines the recovery path for Tasks 23–36. It does not reduce the approved inventory, change the topic allocation, or relax any release gate. Release hardening remains downstream of a genuinely production-ready content library.

## 2. Production definition

A record is production content only when all of the following are true:

1. It asks a meaningful question about a distinct, verifiable fact.
2. It has a specific, unambiguous canonical answer and useful accepted variants where needed.
3. Its explanation states why the answer is correct rather than repeating the clue or answer.
4. Its source URL identifies the specific entity, document, or page supporting the fact. A database home page is not evidence.
5. Its source license, retrieval date, source identifier, and factual-verification status are recorded.
6. Its wording is original and reads as an individually meaningful clue.
7. Its Estonian fields communicate the same fact, answer, numbers, names, and qualifiers as the English fields.
8. It belongs to a coherent five-clue category set whose tiers intentionally progress in difficulty.

Production content must not contain:

- Numbered topic, category, clue, response, or explanation shells.
- Generic answers such as “the generated answer” or invented stand-ins.
- Facts fabricated to fill an allocation.
- A repeated parameter-substitution template used to manufacture nominally distinct records.
- Duplicate facts, near-duplicate clue wording, or a Final clue that merely rephrases a board clue.
- Generic or unrelated citations.
- Unsupported current facts without an explicit date or period.
- Translations that are blank, unchanged filler, or materially different from the English fact.

Shared grammatical forms are acceptable only when they are natural for the subject and the resulting clues remain substantively and editorially distinct. If fewer than 6,150 records qualify, the release fails instead of padding the corpus.

## 3. Required inventory and allocation

The parent plan's allocation remains exact:

- Twelve topic batches.
- Exactly 100 category sets and 500 board clues per topic batch.
- Exactly five clues at tiers 1–5 in every category set.
- Exactly 6,000 board clues and 1,200 category sets overall.
- Exactly 400 category sets per difficulty.
- Exactly 200 category sets for each difficulty/round pair.
- Exactly 1,200 globally distinct English category names, preserving the parent plan's stronger per-set uniqueness rule.
- Exactly 150 Final/tiebreaker clues: 50 Easy, 50 Medium, and 50 Hard.
- Exactly 100 OpenTDB-inspired clues per topic batch, for 1,200 overall. Each requires independent factual verification against a compatible factual source.
- The other 400 clues per topic batch use Wikidata or another compatible open factual source with original wording.

The per-topic Easy/Medium/Hard and Round One/Double Round counts remain those in the parent plan's Production batch allocation table.

## 4. Content pipeline

### 4.1 Candidate acquisition

OpenTDB and Wikidata fetchers write immutable candidate caches only. Candidate records retain their source IDs, raw fact or question, retrieval time, and license. Fetchers never write authored CSV files, generated translations, validation reports, or the production seed.

OpenTDB material is inspiration, not standalone factual evidence. Before an adaptation is accepted, its factual claim must be matched to an independent compatible source. Wikidata candidates retain the exact entity, property, value, and entity-specific URL used to support the authored fact.

### 4.2 Evidence records

Every authored clue has a build-time evidence record keyed by stable clue ID. It records:

- Candidate/source IDs and the normalized factual assertion.
- Specific supporting URL, license, and retrieval date.
- Factual verification status and review timestamp.
- The decision from a review pass separate from the authoring pass for answer correctness, wording, explanation, and category fit.
- For OpenTDB adaptations, both the inspiration candidate and independent factual source.

Evidence records are deterministic build artifacts and are not required at runtime. The runtime source citation still exposes the specific source needed by the host.

### 4.3 English authoring

Each topic batch is authored and reviewed independently. The authoring step converts accepted evidence into a coherent category set with original category, clue, answer, variants, and explanation text. It does not mass-stamp facts into one generic sentence frame.

Difficulty is an editorial property of the complete set. Tier 1 must be broadly accessible relative to that set, and Tier 5 must demand materially more specific knowledge. Difficulty cannot be assigned solely from source order or an arbitrary item index.

Final clues use distinct facts and broader synthesis than ordinary board clues. They must not copy or lightly paraphrase a board record.

### 4.4 Estonian translation

The approved Helsinki-NLP model may create the first Estonian draft. Machine output remains marked `machine`; only a fluent Estonian reviewer may change it to `reviewed`. Automated diagnostics compare numbers, stable identifiers, proper nouns, answer variants, and named entities. A semantic review pass separate from translation checks that the question, answer, explanation, and qualifiers retain the English meaning. Uncertain translations are rejected for correction rather than accepted to complete inventory.

### 4.5 Publication

A batch is published only after its authored CSV, bilingual CSV, evidence records, translation diagnostics, content validation, and source checks all pass. Publication is atomic: a failed batch leaves the previous accepted artifacts intact.

The production seed is built only after all thirteen batches pass independently and the combined release validator passes. Seed creation remains deterministic and offline from committed inputs.

## 5. Validation gates

The production validator must independently reject:

- Placeholder and numbered-shell patterns.
- Missing or unreviewed factual evidence.
- Generic, unrelated, insecure, or unavailable source URLs.
- Duplicate factual signatures across the corpus.
- Exact and near-duplicate clue wording.
- Missing tiers, incoherent set metadata, repeated global category names, or allocation drift.
- Board/Final fact reuse.
- Blank, unchanged, numerically divergent, or proper-noun-divergent translations.
- Unsupported time-sensitive wording.
- Any inventory, difficulty, round, OpenTDB-composition, or Final shortage.

Review decisions do not waive factual, source, duplicate, allocation, or placeholder errors. Narrow exceptions may document a legitimate unchanged proper name or identifier, but cannot make filler content acceptable.

Near-duplicate detection removes punctuation, stable identifiers, and numeric values, then compares normalized five-word shingles. A Jaccard similarity of 0.80 or greater is blocking. Normalized equality is blocking for texts shorter than five words. A blocked record must be rewritten; review cannot waive this gate.

## 6. Failure handling

Candidate fetch failures are resumable and do not modify accepted content. Invalid candidates are quarantined with a reason. Authoring, translation, evidence, and validation failures identify the exact clue and field. No stage silently drops a failed row and replaces it with a generated shell.

Source checks use cached successful results where permitted, bounded retries, and explicit failures. The release gate never treats a network timeout as proof that a source is valid. Once sources have been verified and committed, application runtime remains fully offline.

## 7. Verification strategy

Automated tests must prove:

- Candidate caches cannot publish directly to release artifacts.
- Every accepted clue has a specific evidence record and source URL.
- OpenTDB adaptations have an independent factual source.
- Placeholder, duplicate-fact, near-duplicate wording, generic-source, unsupported-answer, and Board/Final reuse fixtures fail.
- Translation number, name, answer, and qualifier drift fail.
- Exact per-batch and combined allocations pass without exceptions.
- Two consecutive seed builds from identical inputs have identical hashes.
- SQLite integrity and the 300 deterministic selection trials pass with the approved maximum of two categories per macro-topic on a board.
- The packaged application selects and displays real bilingual content without runtime network access.

The semantic batch review records a decision for every clue plus counts, stratified sample excerpts, and unresolved issues. A batch with any unresolved blocking issue cannot contribute to the release inventory.

## 8. Delivery order

1. Strengthen the validator and evidence schema with failing fixtures first.
2. Repair candidate ingestion and add the missing evidence-to-authoring boundary.
3. Replace topic batches 01–12 one at a time, preserving the exact allocation table.
4. Replace the 150 Final clues and verify no board-fact reuse.
5. Rebuild and verify the production seed twice.
6. Resume release-hardening Tasks 37–43 only after Task 36 passes from committed inputs.

## 9. Completion condition

Tasks 23–36 are complete only when all 6,150 bilingual records have accepted evidence and separate semantic-review decisions, every independent batch gate and the combined release gate exit zero, the seed is reproducible, and a stratified inspection of records read back from the built database confirms meaningful source-backed content. Counts, file presence, or a green test that ignores content-quality errors are not completion evidence.
