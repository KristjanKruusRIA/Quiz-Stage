# Task 21 report: Add source-backed Wikidata candidate recipes

## Status
Completed in `build(content): fetch CC0 Wikidata candidates` with source recipes used for source-backed candidate enrichment.

## Implementation
- Added `scripts/content/fetchWikidata.ts`, `scripts/content/mapWikidataCandidates.ts`, and `scripts/content/wikidataRecipes.ts`.
- Added Wikidata fixtures in `tests/fixtures/wikidata/*` and `content/THIRD_PARTY_NOTICES.md` updates.
- Added focused unit coverage in `tests/unit/content/wikidataImport.test.ts`.

## Verification
- Tracked in commit `aa7eb556` and `tests/unit/content/wikidataImport.test.ts`.
