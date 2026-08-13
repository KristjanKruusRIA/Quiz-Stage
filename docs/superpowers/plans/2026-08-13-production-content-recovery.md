# Quiz Stage Production Content Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 6,150 filler records from parent-plan Tasks 23–35 with meaningful, source-backed, separately reviewed bilingual production content, then build and prove the deterministic production seed required by Task 36.

**Architecture:** Keep fetched OpenTDB and Wikidata data as immutable candidate inputs, author each topic in an unpublished work directory, and publish a batch only after a deterministic evidence index, editorial/translation reviews, validation, and source checks all pass. Extend the existing CSV validator and seed builder rather than creating a parallel runtime content system; build-time JSONL evidence feeds a backward-compatible v2 runtime citation.

**Tech Stack:** TypeScript 6, Node.js 24, Zod 4, Vitest 4, SQLite via `better-sqlite3`, Python/Helsinki-NLP translation tooling, CSV, JSONL, PowerShell verification commands.

## Global Constraints

- Production means every one of the 6,150 records is meaningful, distinct, source-backed, unambiguous, and free of numbered shells, generic answers, invented padding, or repeated parameter-substitution prose.
- Preserve exactly twelve topic batches, 100 category sets and 500 board clues per topic, five tiers per set, 6,000 board clues, 1,200 globally distinct English category names, and 150 Final clues.
- Preserve exactly 400 category sets per difficulty, 200 category sets per difficulty/round pair, and 50 Final clues per difficulty.
- Preserve exactly 100 OpenTDB-inspired clues per topic batch; each one also requires an independent compatible factual source. The other 400 clues use Wikidata or another compatible open factual source.
- A source URL must identify the specific supporting entity, document, or page; a database home page is not evidence.
- Each clue requires factual approval and a separate editorial approval. Each Estonian translation requires automated diagnostics and a separate semantic approval before release.
- Machine translation remains `machine`; only a fluent Estonian review may set `reviewed`.
- Near-duplicate detection removes punctuation, stable identifiers, and numeric values, then blocks five-word-shingle Jaccard similarity greater than or equal to `0.80`; normalized equality blocks shorter text.
- Factual, source, duplicate, allocation, and filler failures cannot be waived.
- Candidate fetch failures never modify accepted content; batch publication is atomic; application runtime remains fully offline.
- Release fails instead of padding the corpus when fewer than 6,150 records qualify.
- Board selection permits at most two categories from the same macro-topic on either board.
- Tasks 37–43 remain blocked until Task 36 passes from committed production inputs.

---

## File Structure

### New focused modules

- `scripts/content/evidence.ts` — Zod schemas and deterministic JSONL reading/indexing for per-clue factual, editorial, and translation evidence.
- `scripts/content/productionBatches.ts` — authoritative batch IDs, pack IDs, topic families, subthemes, paths, and exact difficulty/round allocations.
- `scripts/content/nearDuplicate.ts` — normalization, five-word shingles, similarity calculation, and deterministic duplicate-pair discovery.
- `scripts/content/candidatePaths.ts` — guards that constrain fetch outputs to `content/imports` and authoring work to `content/work`.
- `scripts/content/buildAuthoringWorklist.ts` — selects candidate facts into an unpublished, deterministic per-batch worklist without generating release CSV.
- `scripts/content/verifyBatch.ts` — one batch gate combining evidence, content, translation, source, composition, and review checks into a hash-bound report.
- `scripts/content/publishBatch.ts` — atomically replaces the accepted authored/generated/evidence/report quartet only when its work report is current and passing.
- `tests/unit/content/evidence.test.ts`, `nearDuplicate.test.ts`, `productionBatches.test.ts`, `candidatePaths.test.ts`, `verifyBatch.test.ts`, and `sourceCitation.test.ts` — focused contract tests.
- `tests/fixtures/content-quality/` — minimal invalid CSV/JSONL pairs for missing evidence, unrelated/generic sources, duplicate facts, near-duplicate wording, Board/Final reuse, and translation-review failures.

### Existing modules changed

- `scripts/content/validate.ts` — consume evidence and batch definitions; add non-waivable production-quality issues.
- `scripts/content/translationDiagnostics.ts` — expose diagnostics as a callable function and add name, answer, and qualifier drift checks.
- `scripts/content/fetchOpenTdb.ts`, `fetchWikidata.ts`, `mapWikidataCandidates.ts`, and `wikidataRecipes.ts` — preserve immutable candidate provenance and enforce candidate-only destinations.
- `scripts/content/sourceCheck.ts` — expose deterministic result lookup needed by the batch gate; keep bounded live checks and successful-result cache behavior.
- `scripts/content/buildSeed.ts` and `verifySeed.ts` — require the accepted evidence corpus, serialize v2 citations, and verify reproducibility.
- `src/shared/content/sourceCitation.ts` — parse v1 imported/custom citations and v2 bundled citations.
- `src/shared/game/boardSelector.ts` — restore the approved maximum of two categories per macro-topic.
- `package.json` — add worklist, batch verification, and publication commands; pass evidence to the release verifier.
- `tests/unit/content/productionValidator.test.ts`, `translationDiagnostics.test.ts`, `wikidataImport.test.ts`, `openTdbImport.test.ts`, `tests/unit/game/boardSelector.test.ts`, and `tests/integration/content/productionSeed.test.ts` — production regression coverage.
- `docs/superpowers/sdd/2026-08-11-quiz-stage-desktop-game/progress.md` and task reports 23–36 — replace false draft-completion claims with exact passing evidence.

### Accepted content artifacts

- `content/authored/01-history.csv` through `12-mythology-religion-philosophy.csv`, plus `13-finals.csv` — reviewed English source content.
- `content/generated/01-history.en-et.csv` through `12-mythology-religion-philosophy.en-et.csv`, plus `13-finals.en-et.csv` — reviewed bilingual content.
- `content/evidence/01-history.jsonl` through `12-mythology-religion-philosophy.jsonl`, plus `13-finals.jsonl` — deterministic evidence records.
- `content/reports/01-history.json` through `12-mythology-religion-philosophy.json`, plus `13-finals.json` and `release-inventory.json` — passing hash-bound reports.
- `resources/content/seed.sqlite` — deterministic offline production database.

## Shared Contracts

The infrastructure tasks establish these exact interfaces before content work begins:

```ts
export type ReviewDecision = {
  reviewer: string;
  reviewedAt: string;
  decision: 'approved';
  notes?: string;
};

export type ContentEvidence = {
  version: 1;
  clueId: string;
  batchId: string;
  factKey: string;
  assertion: string;
  origin: 'openTdbInspired' | 'wikidata' | 'compatibleOpen';
  authoring: {
    author: string;
    authoredAt: string;
  };
  supportingSource: {
    sourceId: string;
    title: string;
    url: string;
    license: string;
    retrievedAt: string;
  };
  inspiration: null | {
    system: 'OpenTDB';
    candidateId: string;
    license: 'CC-BY-SA-4.0';
  };
  factualReview: ReviewDecision;
  editorialReview: ReviewDecision;
  translationReview: ReviewDecision | null;
};

export type BatchDistribution = Readonly<{
  easy: Readonly<{ roundOne: number; roundTwo: number }>;
  medium: Readonly<{ roundOne: number; roundTwo: number }>;
  hard: Readonly<{ roundOne: number; roundTwo: number }>;
}>;

export type ProductionBatchDefinition = Readonly<{
  id: string;
  packId: string;
  topicFamily: string;
  subthemes: readonly string[];
  maxSetsPerSubtheme: number;
  requiredOpenTdbClues: number;
  distribution: BatchDistribution | null;
  boardClues: number;
  finalClues: number;
}>;
```

All batch tasks use the same publication protocol, with their own explicit paths and allocations:

1. Build an unpublished worklist from immutable candidate caches.
2. For each category set, select five distinct supported facts, record one stable fact key per fact, write original English clue/answer/explanation text, and deliberately order tiers 1–5 by required knowledge.
3. Complete factual review separately from authoring, then complete editorial review for answer uniqueness, wording, explanation, category fit, tier progression, and non-duplication.
4. Produce Estonian drafts, run automated diagnostics, correct every blocking mismatch, and record a separate fluent semantic approval for each clue.
5. Run the batch gate. A nonzero exit leaves accepted artifacts unchanged.
6. Publish atomically, rerun the gate against accepted paths, and commit only that batch's authored/generated/evidence/report artifacts.

---

### Task 1: Reinstate non-negotiable no-filler and board-diversity guardrails

**Files:**
- Modify: `scripts/content/validate.ts`
- Modify: `src/shared/game/boardSelector.ts:5`
- Modify: `tests/unit/content/productionValidator.test.ts`
- Modify: `tests/unit/game/boardSelector.test.ts`
- Modify: `tests/integration/content/productionSeed.test.ts`

**Interfaces:**
- Consumes: existing `validateProductionContent(inputs, options)` and `selectMatchContent(input, diagnostics?)`.
- Produces: non-waivable `PLACEHOLDER_CONTENT` validation and a hard `MAX_MACRO_TOPIC_PER_BOARD = 2` selection invariant.

- [ ] **Step 1: Preserve the existing placeholder regression and add strict seed/board assertions**

Keep the already-observed red/green `rejects generated placeholder records from production batches` regression. Add an assertion that release errors are never filtered by code:

```ts
expect(report.validation.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
```

Replace the three-per-topic selector expectation with:

```ts
for (const board of [selected.roundOne, selected.roundTwo]) {
  const counts = new Map<string, number>();
  for (const category of board.categories) {
    counts.set(category.macroTopic, (counts.get(category.macroTopic) ?? 0) + 1);
  }
  expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
}
```

- [ ] **Step 2: Run the focused tests and confirm the permissive WIP is exposed**

Run: `npm run test:run -- tests/unit/content/productionValidator.test.ts tests/unit/game/boardSelector.test.ts tests/integration/content/productionSeed.test.ts`

Expected: validator placeholder test passes; selector/seed coverage fails because the constant is `3` and the seed test excludes `NUMBER_DRIFT`.

- [ ] **Step 3: Apply the minimal strict implementation**

Set:

```ts
const MAX_MACRO_TOPIC_PER_BOARD = 2;
```

Remove the `issue.code !== 'NUMBER_DRIFT'` filter from the production seed test. Keep `PLACEHOLDER_CLUE` and `PLACEHOLDER_RESPONSE` as release-blocking patterns and ensure `reviewedIdsFromReport` cannot suppress `PLACEHOLDER_CONTENT`.

- [ ] **Step 4: Run focused verification**

Run: `npm run test:run -- tests/unit/content/productionValidator.test.ts tests/unit/game/boardSelector.test.ts`

Expected: PASS. The production seed test may remain red because the committed corpus is intentionally not production-ready.

- [ ] **Step 5: Commit only the guardrail files**

```powershell
git add scripts/content/validate.ts src/shared/game/boardSelector.ts tests/unit/content/productionValidator.test.ts tests/unit/game/boardSelector.test.ts tests/integration/content/productionSeed.test.ts
git commit -m "fix(content): restore production quality guardrails"
```

### Task 2: Add deterministic per-clue evidence contracts

**Files:**
- Create: `scripts/content/evidence.ts`
- Create: `tests/unit/content/evidence.test.ts`
- Create: `tests/fixtures/content-quality/evidence-valid.jsonl`
- Create: `tests/fixtures/content-quality/evidence-invalid.jsonl`

**Interfaces:**
- Consumes: `zod`, Node UTF-8 file reads, and `sourceUrlSchema`.
- Produces: `contentEvidenceSchema`, `ContentEvidence`, `readEvidenceInputs(patterns): Promise<ReadonlyMap<string, ContentEvidence>>`, and `serializeEvidence(records): string`.

- [ ] **Step 1: Write failing schema/index tests**

```ts
it('indexes sorted strict evidence and rejects duplicate clue IDs', async () => {
  const evidence = await readEvidenceInputs([fixture('evidence-valid.jsonl')]);
  expect([...evidence]).toEqual([...evidence].sort(([a], [b]) => a.localeCompare(b)));
  await expect(readEvidenceInputs([fixture('evidence-valid.jsonl'), fixture('evidence-valid.jsonl')]))
    .rejects.toThrow(/duplicate evidence.*clue/i);
});

it('requires independent evidence for OpenTDB inspiration', () => {
  expect(() => contentEvidenceSchema.parse({
    ...validEvidence,
    origin: 'openTdbInspired',
    inspiration: null,
  })).toThrow(/inspiration/i);
});
```

- [ ] **Step 2: Run the evidence tests red**

Run: `npm run test:run -- tests/unit/content/evidence.test.ts`

Expected: FAIL because `scripts/content/evidence.ts` does not exist.

- [ ] **Step 3: Implement the strict schema and deterministic JSONL index**

Use the Shared Contracts types. Enforce ISO date-time authoring/review timestamps, ISO date retrieval dates, nonempty author/reviewer names, nonempty stable IDs/assertions/fact keys, specific HTTPS URLs, and the two origin rules. Factual and editorial review must each name a reviewer other than `authoring.author`, and every review timestamp must be later than `authoring.authoredAt`:

```ts
if (record.origin === 'openTdbInspired' && record.inspiration?.system !== 'OpenTDB') {
  ctx.addIssue({ code: 'custom', path: ['inspiration'], message: 'OpenTDB inspiration is required' });
}
if (record.origin !== 'openTdbInspired' && record.inspiration !== null) {
  ctx.addIssue({ code: 'custom', path: ['inspiration'], message: 'Inspiration is only valid for OpenTDB records' });
}
if ([record.factualReview, record.editorialReview].some((review) => review.reviewer === record.authoring.author)) {
  ctx.addIssue({ code: 'custom', path: ['factualReview'], message: 'Author cannot approve factual or editorial review' });
}
```

Resolve globs deterministically, reject blank/malformed lines, reject symlink inputs, reject duplicate clue IDs, and return a map inserted in clue-ID order. `serializeEvidence` sorts by `clueId` and ends every JSONL record with `\n`.

- [ ] **Step 4: Run focused tests green**

Run: `npm run test:run -- tests/unit/content/evidence.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the evidence contract**

```powershell
git add scripts/content/evidence.ts tests/unit/content/evidence.test.ts tests/fixtures/content-quality/evidence-valid.jsonl tests/fixtures/content-quality/evidence-invalid.jsonl
git commit -m "feat(content): add production evidence contract"
```

### Task 3: Encode the exact production batch catalog

**Files:**
- Create: `scripts/content/productionBatches.ts`
- Create: `tests/unit/content/productionBatches.test.ts`

**Interfaces:**
- Consumes: no content module; this file owns `ProductionBatchDefinition` and imports no validator/build code.
- Produces: `PRODUCTION_BATCHES`, `FINAL_BATCH`, `getProductionBatch(id)`, and `acceptedBatchPaths(id)`.

- [ ] **Step 1: Write the exact allocation tests**

```ts
it('encodes all twelve 100-set batches and the exact global allocation', () => {
  expect(PRODUCTION_BATCHES).toHaveLength(12);
  expect(new Set(PRODUCTION_BATCHES.map((batch) => batch.id)).size).toBe(12);
  expect(PRODUCTION_BATCHES.every((batch) => batch.boardClues === 500)).toBe(true);
  expect(PRODUCTION_BATCHES.reduce((sum, batch) => sum + countSets(batch.distribution!), 0)).toBe(1_200);
  expect(sumByDifficultyAndRound(PRODUCTION_BATCHES)).toEqual({
    easy: { roundOne: 200, roundTwo: 200 },
    medium: { roundOne: 200, roundTwo: 200 },
    hard: { roundOne: 200, roundTwo: 200 },
  });
  expect(FINAL_BATCH.finalClues).toBe(150);
});
```

- [ ] **Step 2: Run the catalog test red**

Run: `npm run test:run -- tests/unit/content/productionBatches.test.ts`

Expected: FAIL because the catalog module does not exist.

- [ ] **Step 3: Implement the immutable definitions**

Encode these distributions as `easy/medium/hard -> roundOne/roundTwo`:

```ts
const distributions = {
  '01-history': [[17, 17], [17, 16], [16, 17]],
  '02-geography': [[17, 17], [16, 17], [17, 16]],
  '03-science-nature': [[17, 17], [17, 16], [16, 17]],
  '04-literature-language': [[17, 17], [16, 17], [17, 16]],
  '05-art-architecture': [[17, 16], [17, 17], [16, 17]],
  '06-music': [[16, 17], [17, 17], [17, 16]],
  '07-film-television': [[17, 16], [17, 17], [16, 17]],
  '08-sports-games': [[16, 17], [17, 17], [17, 16]],
  '09-food-drink': [[17, 16], [16, 17], [17, 17]],
  '10-technology-inventions': [[16, 17], [17, 16], [17, 17]],
  '11-politics-economics-society': [[17, 16], [16, 17], [17, 17]],
  '12-mythology-religion-philosophy': [[16, 17], [17, 16], [17, 17]],
} as const;
```

Each topic definition has `maxSetsPerSubtheme: 15`, `requiredOpenTdbClues: 100`, `boardClues: 500`, and the exact parent-plan subthemes listed in Tasks 9–20 below. `FINAL_BATCH` has `requiredOpenTdbClues: 0`, `distribution: null`, `boardClues: 0`, and `finalClues: 150`.

- [ ] **Step 4: Run the catalog tests green**

Run: `npm run test:run -- tests/unit/content/productionBatches.test.ts`

Expected: PASS with 1,200 sets and each global difficulty/round cell equal to 200.

- [ ] **Step 5: Commit the catalog**

```powershell
git add scripts/content/productionBatches.ts tests/unit/content/productionBatches.test.ts
git commit -m "feat(content): encode production batch allocations"
```

### Task 4: Enforce evidence, originality, source specificity, and composition

**Files:**
- Create: `scripts/content/nearDuplicate.ts`
- Modify: `scripts/content/validate.ts`
- Create: `tests/unit/content/nearDuplicate.test.ts`
- Modify: `tests/unit/content/productionValidator.test.ts`
- Create: `tests/fixtures/content-quality/generic-source.csv`
- Create: `tests/fixtures/content-quality/duplicate-fact.csv`
- Create: `tests/fixtures/content-quality/near-duplicate.csv`
- Create: `tests/fixtures/content-quality/board-final-reuse.csv`

**Interfaces:**
- Consumes: `ReadonlyMap<string, ContentEvidence>` and optional `ProductionBatchDefinition`.
- Produces: `normalizeForNearDuplicate(text): string`, `nearDuplicateSimilarity(left, right): number`, `findNearDuplicatePairs(records): readonly DuplicatePair[]`, and evidence-aware `ProductionValidationOptions`.

- [ ] **Step 1: Write exact normalization and blocking tests**

```ts
expect(normalizeForNearDuplicate('Q42: In 1969, which mission landed?'))
  .toBe('in which mission landed');
expect(nearDuplicateSimilarity(
  'This painter created the famous ceiling frescoes inside the Sistine Chapel in Vatican City',
  'Which painter created the famous ceiling frescoes inside the Sistine Chapel in Vatican City?',
)).toBeGreaterThanOrEqual(0.8);
expect(nearDuplicateSimilarity('Red Planet', 'red planet')).toBe(1);
```

Add validator cases that assert the exact codes `MISSING_EVIDENCE`, `SOURCE_MISMATCH`, `GENERIC_SOURCE`, `DUPLICATE_FACT`, `NEAR_DUPLICATE_CLUE`, `BOARD_FINAL_FACT_REUSE`, `SUBTHEME_LIMIT`, `BATCH_ALLOCATION`, and `OPENTDB_COMPOSITION`.

- [ ] **Step 2: Run focused tests red**

Run: `npm run test:run -- tests/unit/content/nearDuplicate.test.ts tests/unit/content/productionValidator.test.ts`

Expected: FAIL with missing module/codes.

- [ ] **Step 3: Implement the minimal quality gates**

Extend options exactly as follows:

```ts
export interface ProductionValidationOptions {
  mode: ValidationMode;
  allowMissingEt?: boolean;
  reviewedExceptionIds?: readonly string[];
  evidenceByClueId?: ReadonlyMap<string, ContentEvidence>;
  batch?: ProductionBatchDefinition;
}
```

Reject evidence whose `clueId`, batch, source fields, or fact assertion do not match its CSV row. Require factual/editorial approval in authored and release modes; require translation approval in release mode. Require specific paths/fragments on non-Wikidata sources and entity-specific `/wiki/Q...` URLs for Wikidata. Count exactly 100 `openTdbInspired` evidence records for each topic batch and require a non-OpenTDB supporting source for each. Reject duplicate `factKey` globally and any fact key shared by board and Final.

Normalize text with Unicode NFKC lowercase, remove punctuation, tokens matching stable identifiers (`Q\d+`, `P\d+`, UUIDs, and alphanumeric IDs containing digits), and numeric tokens. Use normalized equality below five tokens and five-token-shingle Jaccard at or above `0.80` otherwise. Sort pairs by first ID then second ID for deterministic reports.

Add all new factual/source/duplicate/allocation/filler codes to a `NON_WAIVABLE_CODES` set and reject any report exception targeting them.

- [ ] **Step 4: Add evidence CLI inputs**

Parse `--evidence <glob>` and optional `--batch <id>`. Load the evidence map once and pass `getProductionBatch(id)` to validation. Release mode requires evidence even when `--batch` is omitted.

- [ ] **Step 5: Run focused tests green**

Run: `npm run test:run -- tests/unit/content/evidence.test.ts tests/unit/content/nearDuplicate.test.ts tests/unit/content/productionBatches.test.ts tests/unit/content/productionValidator.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the quality gates**

```powershell
git add scripts/content/nearDuplicate.ts scripts/content/validate.ts tests/unit/content/nearDuplicate.test.ts tests/unit/content/productionValidator.test.ts tests/fixtures/content-quality
git commit -m "feat(content): enforce production evidence and originality"
```

### Task 5: Require translation diagnostics and semantic approval

**Files:**
- Modify: `scripts/content/translationDiagnostics.ts`
- Modify: `tests/unit/content/translationDiagnostics.test.ts`
- Modify: `scripts/content/evidence.ts`
- Modify: `tests/unit/content/evidence.test.ts`

**Interfaces:**
- Consumes: bilingual `ParsedCsvRow` records and `ContentEvidence.translationReview`.
- Produces: `diagnoseTranslations(inputs): TranslationDiagnosticReport` with number, stable-ID, proper-noun, canonical-answer, variant, and qualifier checks.

- [ ] **Step 1: Write failing drift cases**

```ts
expect(codesFor(pair({
  clueEn: 'In 1991 Estonia restored its independence from the Soviet Union.',
  clueEt: 'Eesti taastas iseseisvuse Nõukogude Liidust.',
}))).toContain('NUMBER_DRIFT');

expect(codesFor(pair({
  answerEn: 'Lake Peipus',
  answerEt: 'Võrtsjärv',
}))).toContain('ANSWER_DRIFT');

expect(codesFor(pair({
  clueEn: 'Which country borders Estonia to the south?',
  clueEt: 'Milline riik piirneb Eestiga põhjas?',
}))).toContain('QUALIFIER_DRIFT');
```

- [ ] **Step 2: Run translation tests red**

Run: `npm run test:run -- tests/unit/content/translationDiagnostics.test.ts`

Expected: FAIL for the new answer/qualifier codes.

- [ ] **Step 3: Expose the callable diagnostic and add conservative drift rules**

Export the diagnostic function, preserve the existing CLI, compare normalized canonical answers and accepted variants, and maintain a small explicit qualifier dictionary for opposites such as north/south, east/west, before/after, first/last, more/less, and largest/smallest. Proper names and stable identifiers may be documented exceptions; numbers, answers, and semantic qualifiers remain blocking.

Require a non-null approved `translationReview` for every evidence record in release mode. A `translationStatus` of `machine` cannot satisfy that requirement or serialize as reviewed.

- [ ] **Step 4: Run focused tests green**

Run: `npm run test:run -- tests/unit/content/translationDiagnostics.test.ts tests/unit/content/evidence.test.ts tests/unit/content/productionValidator.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit translation enforcement**

```powershell
git add scripts/content/translationDiagnostics.ts scripts/content/evidence.ts tests/unit/content/translationDiagnostics.test.ts tests/unit/content/evidence.test.ts
git commit -m "feat(content): enforce bilingual semantic review"
```

### Task 6: Constrain fetchers to immutable candidate inputs and build unpublished worklists

**Files:**
- Create: `scripts/content/candidatePaths.ts`
- Create: `scripts/content/buildAuthoringWorklist.ts`
- Modify: `scripts/content/fetchOpenTdb.ts`
- Modify: `scripts/content/adaptOpenTdb.ts`
- Modify: `scripts/content/fetchWikidata.ts`
- Modify: `scripts/content/mapWikidataCandidates.ts`
- Modify: `scripts/content/wikidataRecipes.ts`
- Modify: `package.json`
- Create: `tests/unit/content/candidatePaths.test.ts`
- Modify: `tests/unit/content/openTdbImport.test.ts`
- Modify: `tests/unit/content/wikidataImport.test.ts`

**Interfaces:**
- Consumes: raw OpenTDB/Wikidata API data and `ProductionBatchDefinition`.
- Produces: immutable candidate JSONL under `content/imports` and `content:build-worklist -- --batch <id>` output under `content/work/<id>/worklist.jsonl`.

- [ ] **Step 1: Write path-boundary and provenance tests**

```ts
expect(() => assertCandidateOutputPath(resolve('content/authored/01-history.csv')))
  .toThrow(/content[\\/]imports/i);
expect(() => assertWorkOutputPath(resolve('content/generated/01-history.en-et.csv')))
  .toThrow(/content[\\/]work/i);
expect(mappedWikidata).toMatchObject({ entityId: 'Q42', propertyId: 'P31' });
expect(mappedWikidata.sourceUrl).toBe('https://www.wikidata.org/wiki/Q42');
expect(adaptedOpenTdb).toMatchObject({ inspirationOnly: true, license: 'CC-BY-SA-4.0' });
```

- [ ] **Step 2: Run import/path tests red**

Run: `npm run test:run -- tests/unit/content/candidatePaths.test.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts`

Expected: FAIL until destination guards and explicit inspiration provenance exist.

- [ ] **Step 3: Implement safe destination guards and complete candidate provenance**

Use `realpath`/resolved ancestor checks and reject symlink destinations. OpenTDB candidates retain candidate ID, raw decoded question/answer/category/difficulty, fetched time, license, and `inspirationOnly: true`. Wikidata candidates retain recipe, entity ID, property ID, normalized value, fact key, source ID, entity URL, fetched time, and `CC0-1.0`.

- [ ] **Step 4: Implement deterministic worklist construction**

The command reads candidates but writes only this unpublished shape:

```ts
type AuthoringWorkItem = {
  batchId: string;
  candidateId: string;
  origin: 'openTdbInspired' | 'wikidata';
  rawFact: string;
  factKey: string | null;
  sourceId: string | null;
  sourceUrl: string | null;
  selected: false;
};
```

Sort by origin, candidate ID, and fact key. Do not output CSV rows, clue wording, answers, explanations, translations, evidence approvals, or seed data.

- [ ] **Step 5: Add the command and run focused tests green**

Add:

```json
"content:build-worklist": "tsx scripts/content/buildAuthoringWorklist.ts"
```

Run: `npm run test:run -- tests/unit/content/candidatePaths.test.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit candidate isolation**

```powershell
git add scripts/content/candidatePaths.ts scripts/content/buildAuthoringWorklist.ts scripts/content/fetchOpenTdb.ts scripts/content/adaptOpenTdb.ts scripts/content/fetchWikidata.ts scripts/content/mapWikidataCandidates.ts scripts/content/wikidataRecipes.ts package.json tests/unit/content/candidatePaths.test.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts
git commit -m "feat(content): isolate immutable authoring candidates"
```

### Task 7: Add a hash-bound batch gate and atomic publisher

**Files:**
- Create: `scripts/content/verifyBatch.ts`
- Create: `scripts/content/publishBatch.ts`
- Modify: `scripts/content/sourceCheck.ts`
- Modify: `package.json`
- Create: `tests/unit/content/verifyBatch.test.ts`

**Interfaces:**
- Consumes: work artifacts, batch definition, evidence map, translation diagnostics, validator, and source checker.
- Produces: `verifyBatch(options): Promise<BatchVerificationReport>` and `publishBatch(options): Promise<void>`.

- [ ] **Step 1: Write failing stale-report and failed-gate tests**

```ts
await expect(publishBatch({ batchId, workRoot, acceptedRoot }))
  .rejects.toThrow(/passing verification report/i);

await verifyBatch({ batchId, workRoot, sourceCache });
appendFileSync(workCsv, '\n');
await expect(publishBatch({ batchId, workRoot, acceptedRoot }))
  .rejects.toThrow(/artifact hash/i);

expect(readFileSync(acceptedCsv, 'utf8')).toBe(originalAcceptedBytes);
```

- [ ] **Step 2: Run the batch-gate test red**

Run: `npm run test:run -- tests/unit/content/verifyBatch.test.ts`

Expected: FAIL because verification/publication modules do not exist.

- [ ] **Step 3: Implement the combined gate**

`verifyBatch` must:

- read `content/work/<id>/authored.csv`, `generated.en-et.csv`, and `evidence.jsonl`;
- validate authored content in batch mode with missing Estonian allowed;
- validate generated content in batch mode with Estonian required;
- run `diagnoseTranslations` and require zero blocking issues;
- run source checks for every distinct supporting URL and require a successful current/cache result;
- require exact batch allocation/subtheme/OpenTDB composition and all three approvals;
- include five deterministic sample clues per difficulty/round cell (or 15 per Final difficulty), all unresolved issues, and SHA-256 hashes of the three work artifacts;
- write a report only after all checks finish, with `blocking: true` on failure.

- [ ] **Step 4: Implement atomic publication**

Re-read and hash all artifacts, require `blocking: false`, then write temporary files beside accepted destinations using exclusive creation and rename them into place. If any write/rename fails, remove only the publisher's own temporary files and preserve every prior accepted artifact. Publish the report last.

- [ ] **Step 5: Add commands and run tests green**

Add:

```json
"content:verify-batch": "tsx scripts/content/verifyBatch.ts",
"content:publish-batch": "tsx scripts/content/publishBatch.ts"
```

Run: `npm run test:run -- tests/unit/content/verifyBatch.test.ts tests/unit/content/productionValidator.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the batch boundary**

```powershell
git add scripts/content/verifyBatch.ts scripts/content/publishBatch.ts scripts/content/sourceCheck.ts package.json tests/unit/content/verifyBatch.test.ts
git commit -m "feat(content): gate and atomically publish batches"
```

### Task 8: Carry verified evidence into backward-compatible runtime citations and seed verification

**Files:**
- Modify: `src/shared/content/sourceCitation.ts`
- Modify: `scripts/content/buildSeed.ts`
- Modify: `scripts/content/verifySeed.ts`
- Modify: `package.json`
- Create: `tests/unit/content/sourceCitation.test.ts`
- Modify: `tests/integration/content/productionSeed.test.ts`

**Interfaces:**
- Consumes: accepted CSV plus accepted evidence map.
- Produces: v1/v2 `StoredSource`, evidence-required seed build, and evidence-aware `verify:content`.

- [ ] **Step 1: Write v1 compatibility and v2 strictness tests**

```ts
expect(parseStoredSource(JSON.stringify(v1))).toEqual(v1);
expect(parseStoredSource(JSON.stringify({
  ...v1,
  format: 'quiz-stage-csv-v2',
  sourceId: 'wikidata:Q42:P31:Q5',
  factualVerifiedAt: '2026-08-13T12:00:00.000Z',
}))).toMatchObject({ format: 'quiz-stage-csv-v2', sourceId: 'wikidata:Q42:P31:Q5' });
expect(parseStoredSource(JSON.stringify({ ...v1, format: 'quiz-stage-csv-v2' }))).toBeNull();
```

- [ ] **Step 2: Run citation/seed tests red**

Run: `npm run test:run -- tests/unit/content/sourceCitation.test.ts tests/integration/content/productionSeed.test.ts`

Expected: citation test fails because only v1 exists; production seed remains red until accepted content is replaced.

- [ ] **Step 3: Add the discriminated v1/v2 schema**

```ts
export const storedSourceV1Schema = z.strictObject({
  format: z.literal('quiz-stage-csv-v1'),
  title: z.string().trim().min(1),
  url: sourceUrlSchema,
  license: z.string().trim().min(1),
  retrievedAt: z.string().date(),
  translationStatus: z.enum(['untranslated', 'machine', 'reviewed']),
});

export const storedSourceV2Schema = storedSourceV1Schema.extend({
  format: z.literal('quiz-stage-csv-v2'),
  sourceId: z.string().trim().min(1),
  factualVerifiedAt: z.string().datetime({ offset: true }),
});

export const storedSourceSchema = z.discriminatedUnion('format', [storedSourceV1Schema, storedSourceV2Schema]);
```

- [ ] **Step 4: Require evidence during production seed build and verification**

Add `--evidence <glob>` to both CLIs. Build v2 bundled citations from the matching evidence record, using factual review time for `factualVerifiedAt`. Reject missing/mismatched evidence before creating a temporary SQLite file. Preserve v1 for custom/imported CSV pack round trips.

Set:

```json
"verify:content": "npm run content:verify-seed -- --input content/generated/*.en-et.csv --evidence content/evidence/*.jsonl --report content/reports/release-inventory.json --source-cache content/reports/source-check-cache.json"
```

- [ ] **Step 5: Run all infrastructure tests**

Run: `npm run test:run -- tests/unit/content tests/unit/game/boardSelector.test.ts tests/integration/content/csvRoundTrip.test.ts`

Expected: PASS; `productionSeed.test.ts` remains intentionally excluded until Task 22 replaces all accepted content and rebuilds the seed.

- [ ] **Step 6: Commit citation/seed integration**

```powershell
git add src/shared/content/sourceCitation.ts scripts/content/buildSeed.ts scripts/content/verifySeed.ts package.json tests/unit/content/sourceCitation.test.ts tests/integration/content/productionSeed.test.ts
git commit -m "feat(content): bind production seed to reviewed evidence"
```

---

## Content Batch Execution Rules

For Tasks 9–20, create the work directory first, never edit the accepted files directly, and use this exact command sequence after the batch-specific authoring/review work:

```powershell
npm run content:verify-batch -- --batch <batch-id> --work-root content/work --source-cache content/reports/source-check-cache.json
npm run content:publish-batch -- --batch <batch-id> --work-root content/work
npm run content:validate -- --input content/generated/<batch-id>.en-et.csv --evidence content/evidence/<batch-id>.jsonl --batch <batch-id> --mode batch --report content/reports/<batch-id>.json
npm run content:source-check -- --input content/generated/<batch-id>.en-et.csv --report content/reports/<batch-id>.json --cache content/reports/source-check-cache.json
```

Expected for every command: exit `0`, zero blocking issues, exact counts, and no reviewed exception for a non-waivable code. Each task commits only its four accepted artifacts plus any source-cache entries actually used by that batch.

### Task 9: Replace the History batch

**Files:**
- Modify: `content/authored/01-history.csv`
- Modify: `content/generated/01-history.en-et.csv`
- Create: `content/evidence/01-history.jsonl`
- Modify: `content/reports/01-history.json`

**Interfaces:**
- Consumes: accepted candidate/evidence/batch pipeline from Tasks 2–8.
- Produces: `built-in-history`, exactly 100 category sets/500 clues with E `17/17`, M `17/16`, H `16/17` for Round One/Double Round.

- [ ] **Step 1: Prove current accepted filler is red**

Run: `npm run content:validate -- --input content/generated/01-history.en-et.csv --evidence content/evidence/01-history.jsonl --batch 01-history --mode batch --report content/reports/01-history.json`

Expected: nonzero exit containing `PLACEHOLDER_CONTENT` and/or `MISSING_EVIDENCE`.

- [ ] **Step 2: Build and curate the unpublished worklist**

Run: `npm run content:build-worklist -- --batch 01-history --output content/work/01-history/worklist.jsonl`

Select exactly 100 OpenTDB inspirations plus independent factual sources and 400 Wikidata/compatible-open facts. Cover at least eight of ancient, medieval, early-modern, modern, political, social, military, economic, archaeological, and cultural history, with no more than 15 sets in one subtheme.

- [ ] **Step 3: Author and review exactly 100 coherent five-clue sets**

Write the work authored CSV and evidence JSONL using the shared publication protocol. Date every changing claim. Factual and editorial reviewer identities/timestamps must differ from the authoring event, and every fact key must be unique across all accepted and work batches.

- [ ] **Step 4: Translate, diagnose, and semantically approve all 500 clues**

Run the Helsinki translation tool into `content/work/01-history/generated.en-et.csv`, correct every number/name/answer/qualifier issue, and add 500 non-null translation approvals.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the Content Batch Execution Rules with `<batch-id>` = `01-history`, then:

```powershell
git add content/authored/01-history.csv content/generated/01-history.en-et.csv content/evidence/01-history.jsonl content/reports/01-history.json content/reports/source-check-cache.json
git commit -m "content(history): replace filler with reviewed production clues"
```

### Task 10: Replace the Geography batch

**Files:**
- Modify: `content/authored/02-geography.csv`
- Modify: `content/generated/02-geography.en-et.csv`
- Create: `content/evidence/02-geography.jsonl`
- Modify: `content/reports/02-geography.json`

**Interfaces:**
- Consumes: Tasks 2–8 production pipeline.
- Produces: `built-in-geography`, 100 sets/500 clues with E `17/17`, M `16/17`, H `17/16`.

- [ ] **Step 1: Run the accepted batch gate red**

Run the first validation command from Task 9 with `<batch-id>` = `02-geography`.

Expected: nonzero exit with filler/missing-evidence codes.

- [ ] **Step 2: Build and curate the worklist**

Run `npm run content:build-worklist -- --batch 02-geography --output content/work/02-geography/worklist.jsonl`. Select exactly 100 OpenTDB-inspired and 400 other supported facts. Cover at least eight of countries/capitals, cities, physical geography, rivers/lakes, mountains, islands, borders, maps/coordinates, human geography, and landmarks; cap every subtheme at 15 sets.

- [ ] **Step 3: Author, fact-check, and editorially approve 500 clues**

Create 100 distinct category names and coherent tier 1–5 sets. Use explicit dates/editions for changing boundaries, populations, rankings, and names.

- [ ] **Step 4: Translate and separately approve 500 Estonian records**

Write `content/work/02-geography/generated.en-et.csv`, clear all automated drift issues, and record all semantic approvals.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `02-geography`, then commit its four artifacts and used source-cache entries with `content(geography): replace filler with reviewed production clues`.

### Task 11: Replace the Science and Nature batch

**Files:** `content/authored/03-science-nature.csv`, `content/generated/03-science-nature.en-et.csv`, `content/evidence/03-science-nature.jsonl`, `content/reports/03-science-nature.json`

**Interfaces:** Produces `built-in-science-nature`, 100 sets/500 clues with E `17/17`, M `17/16`, H `16/17`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `03-science-nature`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build `content/work/03-science-nature/worklist.jsonl`; select 100 OpenTDB-inspired plus 400 other supported facts. Cover at least eight of physics, chemistry, astronomy, biology, medicine history, earth science, weather/climate, ecology, animals, and plants, capped at 15 sets. Exclude personal medical advice and undated records.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create the exact distribution, five intentional tiers per set, specific answers/explanations, and unique fact keys.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV, correct all drift, and record 500 translation approvals.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `03-science-nature`; commit its artifacts/cache with `content(science): replace filler with reviewed production clues`.

### Task 12: Replace the Literature and Language batch

**Files:** `content/authored/04-literature-language.csv`, `content/generated/04-literature-language.en-et.csv`, `content/evidence/04-literature-language.jsonl`, `content/reports/04-literature-language.json`

**Interfaces:** Produces `built-in-literature-language`, 100 sets/500 clues with E `17/17`, M `16/17`, H `17/16`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `04-literature-language`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist and select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of world literature, authors, novels, poetry, drama, literary movements, fictional characters, linguistics, etymology, and writing systems. Quote only titles or short identifying fragments and paraphrase copyrighted plot material.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Produce the exact allocation and coherent five-tier sets with 100 globally unique category names.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV, fix number/name/answer/qualifier drift, and record 500 approvals.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `04-literature-language`; commit with `content(literature): replace filler with reviewed production clues`.

### Task 13: Replace the Art and Architecture batch

**Files:** `content/authored/05-art-architecture.csv`, `content/generated/05-art-architecture.en-et.csv`, `content/evidence/05-art-architecture.jsonl`, `content/reports/05-art-architecture.json`

**Interfaces:** Produces `built-in-art-architecture`, 100 sets/500 clues with E `17/16`, M `17/17`, H `16/17`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `05-art-architecture`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of painting, sculpture, photography history, design, artists, museums, architecture, buildings, movements, and materials/techniques, capped at 15 sets. Do not add bundled artwork images.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create specific source-backed text and the exact allocation without repeating category or clue frames.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `05-art-architecture`; commit with `content(art): replace filler with reviewed production clues`.

### Task 14: Replace the Music batch

**Files:** `content/authored/06-music.csv`, `content/generated/06-music.en-et.csv`, `content/evidence/06-music.jsonl`, `content/reports/06-music.json`

**Interfaces:** Produces `built-in-music`, 100 sets/500 clues with E `16/17`, M `17/17`, H `17/16`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `06-music`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of classical, jazz, rock, pop, folk/world music, composers, performers, albums, instruments, and music theory/history. Do not reproduce lyrics.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Produce the exact allocation with original, non-lyrical wording and unique fact keys.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `06-music`; commit with `content(music): replace filler with reviewed production clues`.

### Task 15: Replace the Film and Television batch

**Files:** `content/authored/07-film-television.csv`, `content/generated/07-film-television.en-et.csv`, `content/evidence/07-film-television.jsonl`, `content/reports/07-film-television.json`

**Interfaces:** Produces `built-in-film-television`, 100 sets/500 clues with E `17/16`, M `17/17`, H `16/17`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `07-film-television`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of world cinema, directors, actors, explicitly dated awards, genres, animation, television history, series, production craft, and screen adaptations. Do not quote scripts/dialogue beyond titles.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create exact allocation and unique, dated, source-specific clues without dialogue copying.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `07-film-television`; commit with `content(screen): replace filler with reviewed production clues`.

### Task 16: Replace the Sports and Games batch

**Files:** `content/authored/08-sports-games.csv`, `content/generated/08-sports-games.en-et.csv`, `content/evidence/08-sports-games.jsonl`, `content/reports/08-sports-games.json`

**Interfaces:** Produces `built-in-sports-games`, 100 sets/500 clues with E `16/17`, M `17/17`, H `17/16`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `08-sports-games`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of association football, basketball, athletics, winter sports, racket sports, motorsport, Olympics, traditional sports, board/card games, and video-game history. Every record/officeholder clue names its date or event.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create exact allocation, explicit time context, distinct facts, and coherent tier progression.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `08-sports-games`; commit with `content(sports): replace filler with reviewed production clues`.

### Task 17: Replace the Food and Drink batch

**Files:** `content/authored/09-food-drink.csv`, `content/generated/09-food-drink.en-et.csv`, `content/evidence/09-food-drink.jsonl`, `content/reports/09-food-drink.json`

**Interfaces:** Produces `built-in-food-drink`, 100 sets/500 clues with E `17/16`, M `16/17`, H `17/17`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `09-food-drink`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of world cuisines, ingredients, dishes, cooking techniques, baking, non-alcoholic drinks, wine/beer/spirits history, food geography, culinary figures, and food science. Exclude health claims.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create exact allocation, culturally precise wording, unambiguous answers, and unique facts.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `09-food-drink`; commit with `content(food): replace filler with reviewed production clues`.

### Task 18: Replace the Technology and Inventions batch

**Files:** `content/authored/10-technology-inventions.csv`, `content/generated/10-technology-inventions.en-et.csv`, `content/evidence/10-technology-inventions.jsonl`, `content/reports/10-technology-inventions.json`

**Interfaces:** Produces `built-in-technology-inventions`, 100 sets/500 clues with E `16/17`, M `17/16`, H `17/17`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `10-technology-inventions`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of computing history, communications, transportation, engineering, materials, energy, space technology, inventors, standards/units, and everyday devices. Date all changing technology claims.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create exact allocation, original wording, dated claims, and distinct fact keys.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `10-technology-inventions`; commit with `content(technology): replace filler with reviewed production clues`.

### Task 19: Replace the Politics, Economics, and Society batch

**Files:** `content/authored/11-politics-economics-society.csv`, `content/generated/11-politics-economics-society.en-et.csv`, `content/evidence/11-politics-economics-society.jsonl`, `content/reports/11-politics-economics-society.json`

**Interfaces:** Produces `built-in-politics-economics-society`, 100 sets/500 clues with E `17/16`, M `16/17`, H `17/17`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `11-politics-economics-society`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of political systems, constitutions, historical leaders with dates, international institutions, economics vocabulary/history, currencies with dated context, law/courts, sociology, education, and demographics with census year. Keep wording neutral and factual.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create exact allocation, date every mutable claim, and avoid advocacy or unsupported interpretation.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews while preserving neutral qualifiers.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `11-politics-economics-society`; commit with `content(society): replace filler with reviewed production clues`.

### Task 20: Replace the Mythology, Religion, and Philosophy batch

**Files:** `content/authored/12-mythology-religion-philosophy.csv`, `content/generated/12-mythology-religion-philosophy.en-et.csv`, `content/evidence/12-mythology-religion-philosophy.jsonl`, `content/reports/12-mythology-religion-philosophy.json`

**Interfaces:** Produces `built-in-mythology-religion-philosophy`, 100 sets/500 clues with E `16/17`, M `17/16`, H `17/17`.

- [ ] **Step 1: Run the accepted batch gate red**

Validate `12-mythology-religion-philosophy`; expect filler/missing-evidence failure.

- [ ] **Step 2: Curate exact source composition and subthemes**

Build its worklist; select 100 OpenTDB-inspired plus 400 other facts. Cover at least eight of Greek/Roman, Norse, Egyptian, Baltic/Finnic, Asian, African, and American mythologies; world-religion history/texts/practices; ancient, early-modern, and modern philosophy. Use neutral attribution such as “In X tradition” and do not adjudicate belief claims as facts.

- [ ] **Step 3: Author and separately fact/editorial-review all records**

Create exact allocation, tradition-specific attribution, unique facts, and coherent difficulty progression.

- [ ] **Step 4: Translate, diagnose, and semantically approve all records**

Produce the work bilingual CSV and 500 approved translation reviews while preserving attribution and qualifiers.

- [ ] **Step 5: Verify, publish, reverify, and commit**

Run the shared commands for `12-mythology-religion-philosophy`; commit with `content(mythology): replace filler with reviewed production clues`.

### Task 21: Replace the 150 Final clues

**Files:**
- Modify: `content/authored/13-finals.csv`
- Modify: `content/generated/13-finals.en-et.csv`
- Create: `content/evidence/13-finals.jsonl`
- Modify: `content/reports/13-finals.json`

**Interfaces:**
- Consumes: all accepted board fact keys from Tasks 9–20.
- Produces: `built-in-finals`, exactly 150 bilingual Final/tiebreaker clues: 50 Easy, 50 Medium, 50 Hard.

- [ ] **Step 1: Run the accepted Final gate red**

Run: `npm run content:validate -- --input content/generated/13-finals.en-et.csv --evidence content/evidence/13-finals.jsonl --batch 13-finals --mode batch --report content/reports/13-finals.json`

Expected: nonzero exit with filler/missing-evidence failures.

- [ ] **Step 2: Curate 150 distinct supported Final facts**

Create 12 or 13 Finals for each of the twelve macro-topic families, totaling exactly 150. Use 50 facts per difficulty, no OpenTDB quota, no board fact key, and no clue wording that reaches the near-duplicate threshold against any board clue.

- [ ] **Step 3: Author and separately fact/editorial-review every Final**

Every row has `content_kind=final`, `round=final`, empty tier/category-set ID, a globally unique category name, one unambiguous canonical answer, useful variants, explanatory text, and a specific supporting source.

- [ ] **Step 4: Translate, diagnose, and semantically approve every Final**

Produce `content/work/13-finals/generated.en-et.csv`, fix every automated mismatch, and record 150 translation approvals.

- [ ] **Step 5: Verify, publish, and commit**

Run the shared batch commands with `13-finals`, then:

```powershell
git add content/authored/13-finals.csv content/generated/13-finals.en-et.csv content/evidence/13-finals.jsonl content/reports/13-finals.json content/reports/source-check-cache.json
git commit -m "content(finals): replace filler with reviewed production clues"
```

### Task 22: Build and prove the deterministic production seed

**Files:**
- Modify: `content/reports/release-inventory.json`
- Modify: `resources/content/seed.sqlite`
- Modify: `tests/integration/content/productionSeed.test.ts`
- Modify: `tests/e2e/durable-product.spec.ts`

**Interfaces:**
- Consumes: all 13 accepted CSV/evidence/report artifacts.
- Produces: release inventory, reproducible SQLite seed, 300 deterministic selection trials, and exact Task 36 evidence.

- [ ] **Step 1: Run the combined release gate**

```powershell
npm run content:validate -- --input "content/generated/*.en-et.csv" --evidence "content/evidence/*.jsonl" --mode release --report content/reports/release-inventory.json
npm run content:source-check -- --input "content/generated/*.en-et.csv" --report content/reports/release-inventory.json --cache content/reports/source-check-cache.json
```

Expected: both exit `0`; summary is exactly 6,000 board clues, 1,200 sets, 1,200 distinct category names, 150 Finals, 400 sets/difficulty, 200 sets/difficulty/round, 50 Finals/difficulty, and 1,200 OpenTDB-inspired clues with independent evidence.

- [ ] **Step 2: Build twice and compare hashes**

```powershell
npm run content:build-seed -- --input "content/generated/*.en-et.csv" --evidence "content/evidence/*.jsonl" --output resources/content/seed.sqlite --report content/reports/release-inventory.json
$first = (Get-FileHash -Algorithm SHA256 -LiteralPath 'resources/content/seed.sqlite').Hash
npm run content:build-seed -- --input "content/generated/*.en-et.csv" --evidence "content/evidence/*.jsonl" --output resources/content/seed.sqlite --report content/reports/release-inventory.json
$second = (Get-FileHash -Algorithm SHA256 -LiteralPath 'resources/content/seed.sqlite').Hash
if ($first -ne $second) { throw "Seed hashes differ: $first vs $second" }
```

Expected: both builds exit `0`; hashes are identical.

- [ ] **Step 3: Run strict seed and content verification**

Run: `npm run verify:content`

Expected: exit `0` with no ignored `NUMBER_DRIFT` or other blocking issue.

Run: `npm run test:run -- tests/integration/content/productionSeed.test.ts tests/unit/game/boardSelector.test.ts`

Expected: PASS, SQLite `integrity_check=ok`, 100 seeds at each difficulty produce two six-category boards plus a Final, and neither board contains more than two categories from one macro-topic.

- [ ] **Step 4: Perform stratified database readback**

Extend the integration test to read at least one clue from every topic/difficulty/round cell and 15 Finals (five/difficulty), parse each stored citation, and assert non-placeholder English/Estonian clue, answer, explanation, `quiz-stage-csv-v2`, specific HTTPS source, source ID, and factual verification time.

Run: `npm run test:run -- tests/integration/content/productionSeed.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify real bilingual content in the offline application flow**

Extend the durable product test to start matches in English and Estonian from the production seed, open at least one clue in each language, assert that category/clue/answer text does not match the forbidden filler expressions, and fail on every HTTP(S), WebSocket, or EventSource request after launch.

Run: `npm run test:e2e -- tests/e2e/durable-product.spec.ts`

Expected: PASS with real bilingual clue text and zero runtime network requests.

- [ ] **Step 6: Commit Task 36 artifacts**

```powershell
git add resources/content/seed.sqlite content/reports/release-inventory.json content/reports/source-check-cache.json tests/integration/content/productionSeed.test.ts tests/e2e/durable-product.spec.ts
git commit -m "content(seed): build verified production database"
```

### Task 23: Correct Tasks 23–36 progress evidence and reopen the parent release plan

**Files:**
- Modify: `docs/superpowers/sdd/2026-08-11-quiz-stage-desktop-game/progress.md`
- Modify: `docs/superpowers/sdd/2026-08-11-quiz-stage-desktop-game/task-23-report.md` through `task-36-report.md`
- Modify: `docs/release-acceptance.md`

**Interfaces:**
- Consumes: passing batch reports, release report, seed hashes, SQLite/readback test output, and current git commits.
- Produces: accurate completion evidence for parent Tasks 23–36 and an explicit go/no-go for Task 37.

- [ ] **Step 1: Audit every reopened task against current artifacts**

For Tasks 23–35, record batch commit, artifact hashes, exact inventory/composition, zero blocking issues, factual/editorial/translation approval counts, source-check result, and sample-review result. For Task 36, record both seed hashes, release summary, SQLite integrity, and 300-selection result. Do not copy the earlier draft-completion claims.

- [ ] **Step 2: Run the complete content regression suite**

```powershell
npm run lint
npm run typecheck
npm run test:run -- tests/unit/content tests/integration/content tests/unit/game/boardSelector.test.ts
npm run verify:content
```

Expected: every command exits `0` with no skipped production gate and no exception for filler, source, fact, duplicate, allocation, or translation errors.

- [ ] **Step 3: Scan accepted artifacts and reports for prohibited text**

```powershell
$forbidden = 'topic [0-9]+ tier [0-9]+ asks|final clue [0-9]+|generated answer|answer for .* topic [0-9]+|T' + 'BD|T' + 'ODO'
rg -n -i $forbidden content/authored content/generated content/evidence content/reports
```

Expected: no matches.

- [ ] **Step 4: Mark Tasks 23–36 complete only from the verified evidence**

Update the ledger reports with actual command outputs, dates, commits, and hashes. Set Task 37 as the next task only if Steps 1–3 all pass; otherwise leave Task 36 in progress with the exact failing command and issue codes.

- [ ] **Step 5: Commit the corrected ledger**

```powershell
git add docs/superpowers/sdd/2026-08-11-quiz-stage-desktop-game/progress.md docs/superpowers/sdd/2026-08-11-quiz-stage-desktop-game/task-*-report.md docs/release-acceptance.md
git commit -m "docs(progress): verify production content recovery"
```

After this commit, resume parent-plan Tasks 37–43 using `docs/superpowers/plans/2026-08-11-quiz-stage-desktop-game.md`. Do not alter their scope or count earlier WIP as completion without rerunning each task's named acceptance commands.

The full application goal remains incomplete until parent Task 43 also proves the packaged installer and portable application display this production corpus without runtime network access.
