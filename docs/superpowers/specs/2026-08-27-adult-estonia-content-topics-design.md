# Quiz Stage Adult and Estonia Content Topics Design

**Status:** Approved

**Date:** 2026-08-27

**Parent design:** `docs/superpowers/specs/2026-08-11-jeopardy-desktop-game-design.md`

**Production-content design:** `docs/superpowers/specs/2026-08-13-production-content-recovery-design.md`

## 1. Purpose

Quiz Stage will add Adult and Estonia as full-sized built-in board topics. Each topic receives the same 100-category-set and 500-clue inventory as an existing topic, plus 12 Final clues. Adult is mature but non-graphic content and requires an explicit per-game opt-in. Estonia is an ordinary built-in topic selected by default.

The change extends the existing production-content pipeline. It does not create an extension-pack system, renumber existing batches, migrate existing stable content IDs, or create a parallel validator or seed path.

## 2. Catalog and inventory

The existing `13-finals` identifier and paths remain unchanged. Two board batches are appended:

- `14-adult`, pack ID `built-in-adult`, topic family `adult`.
- `15-estonia`, pack ID `built-in-estonia`, topic family `estonia`.

The resulting exact release inventory is:

- Fourteen board-topic batches.
- Exactly 100 category sets and 500 board clues per topic.
- Exactly 1,400 category sets and 7,000 board clues overall.
- Exactly five clues at tiers 1-5 in every category set.
- Exactly 174 Final clues: 58 Easy, 58 Medium, and 58 Hard.
- Exactly 7,174 clues across boards and Finals.
- Fifteen unique built-in packs in the production seed: fourteen topic packs and `built-in-finals`.

The new board allocations are:

| Topic | Easy R1 | Easy R2 | Medium R1 | Medium R2 | Hard R1 | Hard R2 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Adult | 17 | 16 | 17 | 17 | 16 | 17 | 100 |
| Estonia | 17 | 17 | 16 | 17 | 17 | 16 | 100 |

Combined with the existing twelve topics, the final board distribution is:

- Easy: 467 sets.
- Medium: 467 sets.
- Hard: 466 sets.
- Round One: 700 sets.
- Double Round: 700 sets.
- Every difficulty/round cell contains 233 or 234 sets, the closest mathematically possible balance.

Each new topic contributes exactly 12 Finals: four Easy, four Medium, and four Hard. The existing 150 Final records and their stable IDs remain unchanged.

## 3. Adult topic boundary

The Adult pack is mature, factual, and non-graphic. It covers at least eight of these subthemes, with no more than 15 category sets assigned to one subtheme:

- Sexology and reproductive-health history.
- Relationships and partnership customs.
- Sexuality, identity, and society.
- Nightlife and adult social culture.
- Censorship and obscenity law.
- Erotic art, literature, and film history.
- Sex-work history and regulation.
- Adult-entertainment history.
- Vice and moral regulation.
- Landmark research and terminology.

Adult content must not contain:

- Explicit descriptions or imagery.
- Pornographic narration or material whose primary appeal is sexual stimulation.
- Sexualized minors or youth-framed sexual material.
- Glorification of coercion, exploitation, or non-consensual conduct.
- Personal medical advice or diagnosis.
- Humiliating treatment of individuals or groups.
- Clues whose primary value is shock rather than knowledge.

Clinical subjects use neutral clinical terms. Law, identity, sex work, and historical moral regulation are described without advocacy or stigmatizing language. Living people appear only for relevant, well-sourced public professional facts; private sexual-life trivia is excluded.

## 4. Estonia topic boundary

The Estonia pack covers at least ten of these subthemes, with no more than 15 category sets assigned to one subtheme:

- History and statehood.
- Geography and regions.
- Towns and landmarks.
- Language and literature.
- Folklore and traditions.
- Music and performing arts.
- Art and architecture.
- Science and technology.
- Government and civics.
- Nature and environment.
- Sports.
- Food and everyday culture.

Changing statistics, officeholders, legal rules, records, and rankings include a date, census, edition, or event. Disputed historical or cultural claims use explicit attribution. The pack avoids unsupported nationalist framing, tourism-copy generalizations, and generic Baltic facts that are not meaningfully about Estonia.

## 5. Sources and review

Both topics retain the production-content requirements already applied to the accepted corpus:

1. Every clue states a distinct, verifiable fact with an unambiguous answer.
2. Every clue has a specific supporting source, retrieval date, license information, and unique fact key.
3. The clue, answer, accepted variants, and explanation use original wording.
4. Factual and editorial approvals are separate from authoring.
5. Estonian translation diagnostics and semantic approval are separate from English authoring and factual review.
6. Global exact-duplicate, near-duplicate, and board/Final fact-reuse gates apply across all 7,174 clues.

Preferred Adult evidence includes public-health institutions, statutes and court records, peer-reviewed research, museums, and university archives. Preferred Estonia evidence includes official Estonian institutions, Statistics Estonia, legislation, archives, museums, language authorities, and reputable open reference datasets. An Estonian-only primary source requires a reviewer to verify that the English assertion preserves its meaning before translation review begins.

The original twelve board batches retain exactly 100 OpenTDB-inspired clues each. Adult and Estonia require zero. The committed 2,500-question OpenTDB candidate cache contains only two genuinely Estonia-specific candidates and approximately one usable Adult candidate after manual relevance review, so a 100-clue quota would force off-topic or padded material. All 1,000 new board clues instead use independently selected Wikidata or compatible factual sources. The overall release therefore retains 1,200 OpenTDB-inspired board clues and contains 5,800 other independently sourced board clues.

Final clues continue to have no OpenTDB quota.

## 6. Final batch ownership

`13-finals` remains one authoring, evidence, translation, verification, and publication batch. It grows atomically from 150 to 174 records.

- The existing 150 Finals retain pack ID `built-in-finals`.
- The 12 Adult Finals use pack ID `built-in-adult`.
- The 12 Estonia Finals use pack ID `built-in-estonia`.

This pack association makes topic selection control the new Finals without adding a runtime macro-topic filter. An unchecked Adult pack contributes neither board categories nor Finals. Unchecking Estonia likewise excludes its board categories and its 12 new Finals. Existing Final behavior remains unchanged.

The batch catalog owns the allowed Final pack mapping, exact per-difficulty counts, and exact per-topic counts. Validator logic must read those definitions instead of retaining hard-coded assumptions of one pack, 150 records, 50 records per difficulty, or only twelve topic families.

## 7. Adult opt-in behavior

Both new packs remain enabled in the content database. Database `enabled` continues to mean that a pack is available for selection; it is not overloaded to mean selected by default.

The setup-options contract gains a `selectedByDefault` boolean for every available pack:

- `built-in-adult`: `false`.
- Every other available pack, including existing built-ins, `built-in-finals`,
  `built-in-estonia`, and custom packs: `true`.

The setup screen renders every available pack and initializes game configuration from `selectedByDefault`. Adult is displayed as `Adult (Mature) / Täiskasvanutele` and starts unchecked on every new setup. The user must check it explicitly for that game. No database migration or persistent global preference is introduced.

## 8. Pipeline and failure handling

The new topic work uses the existing artifact boundaries:

- Unpublished work under `content/work/14-adult` and `content/work/15-estonia`.
- Accepted English CSVs under `content/authored`.
- Accepted reviewed bilingual CSVs under `content/generated`.
- Evidence under `content/evidence`.
- Verification reports under `content/reports`.

The production batch definition becomes data-driven enough to represent per-batch OpenTDB quotas and the Final batch's per-topic pack and difficulty allocation. The existing validator, verifier, atomic publisher, seed builder, and release inventory are extended rather than duplicated.

A failed batch verification or publication attempt must leave the prior accepted artifacts and report unpublishable or intact according to the existing atomic-publication contract. No failed attempt may leave a stale passing report paired with changed artifacts. Combined release artifacts and the production seed are rebuilt only after all three changed batches pass independently.

## 9. Verification strategy

Tests and gates must prove:

- The catalog contains 14 topics and preserves all existing batch IDs.
- Adult and Estonia each contain exactly 100 sets and 500 clues with the approved allocation.
- The combined board inventory is exactly 1,400 sets and 7,000 clues with the approved balance.
- The existing twelve OpenTDB quotas remain 100 and the new quotas are zero.
- The Final batch contains exactly 174 records, 58 per difficulty, and 12 per new topic with four per difficulty.
- Existing Finals keep `built-in-finals`; new Finals use their topic pack IDs.
- Adult is visible and mature-labelled but not selected initially.
- Selecting Adult adds its board and Final candidates; leaving it unchecked excludes both.
- Estonia is selected initially and can be unchecked normally.
- Pack names and identities remain consistent across `13-finals`, `14-adult`, and `15-estonia` artifacts.
- Every new fact has accepted evidence, source checks, factual/editorial approval, and reviewed Estonian content.
- Duplicate and near-duplicate gates include the complete old and new corpus.
- Two production-seed builds from identical accepted inputs have identical hashes.
- SQLite readback proves 15 unique packs and the exact per-pack, round, difficulty, and Final counts.
- The complete unit, integration, Electron end-to-end, and relevant local packaged-application checks pass with the new seed.

The local packaged check must verify the Adult unchecked and checked setup paths. macOS and Ubuntu packages cannot be claimed as refreshed unless they are later built and tested on suitable hosts.

## 10. Delivery order

Work proceeds in this order:

1. Add failing catalog, validator, setup-contract, selection, and seed-inventory tests.
2. Implement the structural catalog, validation, runtime setup, and release-inventory support.
3. Preserve the accepted 150 Finals, add the 24 new Finals, and complete every review and source gate for the full 174-record `13-finals` batch.
4. Publish and verify `13-finals` atomically. Do not begin a new board-content package until this succeeds.
5. Author, translate, review, publish, and verify all 500 Adult board clues.
6. Author, translate, review, publish, and verify all 500 Estonia board clues.
7. Run the combined release validator, source checker, deterministic seed comparison, SQLite readback, application tests, and relevant local packaged acceptance.
8. Update canonical `docs/superpowers` evidence only for work actually completed.

This order implements the user's requirement to finish the Final round before other content packages once content work resumes.

## 11. GitHub release constraint

Do not dispatch, rerun, or otherwise trigger the GitHub release workflow as part of this work. It is currently known not to work reliably. Local validation, seed construction, application tests, and supported local packaging may proceed.

The absence of a new GitHub workflow run is intentional, not a passing release result. Completion of this content goal must not claim newly verified macOS or Ubuntu distributables. A future explicit request can repair and run the release workflow after this content work is complete.

## 12. Completion condition

The Adult and Estonia topic goal is complete only when:

- The approved runtime and catalog behavior is implemented and tested.
- The complete 174-clue Final batch passes and is accepted before either new board batch.
- Adult and Estonia each have 500 meaningful bilingual board clues and 12 meaningful bilingual Finals with complete evidence and review.
- The combined validator and source checker pass the exact 7,174-clue inventory.
- The production seed is deterministic and its SQLite readback matches every approved allocation.
- Adult is demonstrably unchecked by default, clearly mature-labelled, selectable, and unable to leak board or Final content when unchecked.
- Estonia is demonstrably selected by default and behaves as a normal selectable built-in topic.
- Local application and relevant packaged checks pass.
- No GitHub release workflow has been triggered.

File presence, row counts without content-quality evidence, or an earlier passing report that does not cover the expanded inventory is not completion evidence.
