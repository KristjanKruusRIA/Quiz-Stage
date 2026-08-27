# Quiz Stage Adult and Estonia Content Topics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add complete, reviewed Adult and Estonia built-in content packs, keep Adult opt-in per game, finish the expanded Final batch first, and prove the exact 7,174-clue production inventory locally without triggering GitHub release.

**Architecture:** Extend the existing production-batch catalog so quotas, pack display names, exact board allocations, and per-topic Final ownership are data rather than validator constants. Keep one validation, publication, and seed path; add an explicit Adult-policy review attestation to evidence; and expose a separate setup default-selection flag without changing database enabled semantics. Publish the 174-clue Final batch atomically before Adult and Estonia board batches, then rebuild and inspect one deterministic production seed.

**Tech Stack:** Electron 43.3.0, TypeScript 6.0.3, React 19, Zod 4, SQLite through better-sqlite3 13.0.3, Vitest 4.1.10, Playwright 1.62.1, Electron Forge 7.11.2, PowerShell 7

**Spec:** docs/superpowers/specs/2026-08-27-adult-estonia-content-topics-design.md

## Global Constraints

- Preserve batch IDs 01-history through 13-finals and every existing stable content ID.
- Append board batches 14-adult and 15-estonia; do not renumber any accepted artifact.
- Adult uses pack ID built-in-adult and display name Adult (Mature) / Täiskasvanutele.
- Estonia uses pack ID built-in-estonia and display name Estonia / Eesti.
- Each new board pack contains exactly 100 category sets and 500 clues, with one complete tier 1-5 set per category.
- Adult distribution is Easy 17/16, Medium 17/17, Hard 16/17 across Round One/Double Round.
- Estonia distribution is Easy 17/17, Medium 16/17, Hard 17/16 across Round One/Double Round.
- The release contains exactly 1,400 board sets, 7,000 board clues, 174 Finals, 7,174 clues, and 15 built-in packs.
- Final difficulty totals are exactly 58 Easy, 58 Medium, and 58 Hard.
- Existing twelve board batches retain an exact OpenTDB-inspired quota of 100 clues each; Adult, Estonia, and Finals retain an exact quota of zero.
- Existing 150 Final rows remain byte-for-byte line-equivalent and keep built-in-finals; the 12 Adult and 12 Estonia Finals use their topic pack IDs.
- Adult content is factual, mature, non-graphic, neutral, and reviewed against the policy boundary in the spec. It excludes explicit narration, sexualized minors, coercion or exploitation glorification, personal medical advice, humiliation, private sexual-life gossip, and shock-only trivia.
- Adult is enabled and visible but selectedByDefault false on every new setup. Every other enabled pack, including Estonia and custom packs, is selectedByDefault true.
- Do not add a database migration or persistent Adult preference.
- Use the existing content/work, content/authored, content/generated, content/evidence, content/reports, publisher, and seed-builder boundaries.
- A failed verification or publication must not replace accepted artifacts or leave a stale passing report.
- Finish and publish the complete 174-row 13-finals batch before beginning 14-adult; finish Adult before beginning 15-estonia.
- Do not dispatch, rerun, or otherwise trigger the GitHub release workflow. Do not run gh workflow run, create a release tag, or claim refreshed macOS or Ubuntu artifacts.
- Local validation, Windows packaging, and packaged smoke checks are allowed. Keep all documentation and evidence under docs/superpowers.

## File map

- scripts/content/productionBatches.ts owns batch IDs, pack identity, per-batch source quotas, board distributions, and per-topic Final allocations.
- scripts/content/releaseThresholds.ts owns exact release and difficulty/round inventory requirements.
- scripts/content/validate.ts binds each row to its batch, checks pack identity, evidence, allocation, duplicates, and exact release counts.
- scripts/content/evidence.ts owns the optional-on-old-records but required-for-Adult policy review attestation.
- scripts/content/buildSeed.ts and scripts/content/verifySeed.ts produce and read back the exact seed inventory.
- scripts/content/verifyBatch.ts parses batch reports containing the expanded ReleaseSummary.
- src/shared/ipc/contracts.ts carries selectedByDefault across IPC.
- src/main/application.ts assigns the per-game default without changing database enabled state.
- src/renderer/features/setup/SetupScreen.tsx initializes checkboxes from selectedByDefault.
- tests/unit/content and tests/integration/content prove catalog, validator, publisher, seed, and deterministic inventory behavior.
- tests/unit/renderer, tests/integration/ipc, and tests/integration/application.test.ts prove setup contract propagation.
- tests/unit/game/boardSelector.test.ts proves pack filtering already excludes both board and Final content.
- tests/e2e/package-smoke.spec.ts proves the production package presents and persists the Adult unchecked and checked setup paths.
- content/authored, content/generated, content/evidence, and content/reports receive only atomically published accepted artifacts.
- resources/content/seed.sqlite is the rebuilt deterministic production seed.
- docs/superpowers/sdd/2026-08-27-adult-estonia-content/acceptance.md records only fresh final evidence.

---

### Task 1: Make the production catalog own all new allocations

**Files:**
- Modify: scripts/content/productionBatches.ts:1-100
- Modify: tests/unit/content/productionBatches.test.ts:1-130

**Interfaces:**
- Produces: FinalTopicAllocation, ProductionBatchDefinition.packName, ProductionBatchDefinition.finalTopicAllocations, PRODUCTION_BATCHES with 14 board batches, and FINAL_BATCH with 174 Finals.
- Consumes: the unchanged BatchDistribution and acceptedBatchPaths interfaces.
- Later tasks treat FINAL_BATCH.finalTopicAllocations as the only authority for Final topic, pack, display-name, and difficulty counts.

- [ ] **Step 1: Write the failing catalog tests**

Replace the old 12-topic and 150-Final expectations with exact assertions equivalent to:

~~~ts
const expectedNewTopics = [
  {
    id: '14-adult',
    packId: 'built-in-adult',
    packName: 'Adult (Mature) / Täiskasvanutele',
    topicFamily: 'adult',
    requiredOpenTdbClues: 0,
    distribution: {
      easy: { roundOne: 17, roundTwo: 16 },
      medium: { roundOne: 17, roundTwo: 17 },
      hard: { roundOne: 16, roundTwo: 17 },
    },
  },
  {
    id: '15-estonia',
    packId: 'built-in-estonia',
    packName: 'Estonia / Eesti',
    topicFamily: 'estonia',
    requiredOpenTdbClues: 0,
    distribution: {
      easy: { roundOne: 17, roundTwo: 17 },
      medium: { roundOne: 16, roundTwo: 17 },
      hard: { roundOne: 17, roundTwo: 16 },
    },
  },
] as const;

expect(PRODUCTION_BATCHES).toHaveLength(14);
expect(PRODUCTION_BATCHES.slice(0, 12).map((batch) => batch.id)).toEqual([
  '01-history', '02-geography', '03-science-nature', '04-literature-language',
  '05-art-architecture', '06-music', '07-film-television', '08-sports-games',
  '09-food-drink', '10-technology-inventions', '11-politics-economics-society',
  '12-mythology-religion-philosophy',
]);
for (const expected of expectedNewTopics) {
  expect(getProductionBatch(expected.id)).toMatchObject(expected);
}
expect(PRODUCTION_BATCHES.slice(0, 12).every((batch) => batch.requiredOpenTdbClues === 100)).toBe(true);
expect(PRODUCTION_BATCHES.slice(12).every((batch) => batch.requiredOpenTdbClues === 0)).toBe(true);
expect(PRODUCTION_BATCHES.reduce((sum, batch) => sum + batch.boardClues, 0)).toBe(7_000);
~~~

Add an exact Final allocation assertion:

~~~ts
expect(FINAL_BATCH.finalClues).toBe(174);
expect(FINAL_BATCH.finalTopicAllocations).toEqual({
  history: { packId: 'built-in-finals', packName: 'Finals Pack', easy: 5, medium: 4, hard: 4 },
  geography: { packId: 'built-in-finals', packName: 'Finals Pack', easy: 5, medium: 4, hard: 4 },
  'science-nature': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 5, hard: 4 },
  'literature-language': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 5, hard: 4 },
  'art-architecture': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 5 },
  music: { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 5 },
  'film-television': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'sports-games': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'food-drink': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'technology-inventions': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'politics-economics-society': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  'mythology-religion-philosophy': { packId: 'built-in-finals', packName: 'Finals Pack', easy: 4, medium: 4, hard: 4 },
  adult: { packId: 'built-in-adult', packName: 'Adult (Mature) / Täiskasvanutele', easy: 4, medium: 4, hard: 4 },
  estonia: { packId: 'built-in-estonia', packName: 'Estonia / Eesti', easy: 4, medium: 4, hard: 4 },
});
~~~

Also assert Object.isFrozen for each allocation object and for FINAL_BATCH.finalTopicAllocations.

- [ ] **Step 2: Run the catalog tests and verify RED**

Run: npx vitest run tests/unit/content/productionBatches.test.ts --configLoader runner

Expected: FAIL because the catalog still has 12 board topics, hard-codes the 100-clue quota, and has no Final allocation map.

- [ ] **Step 3: Add the catalog types and new topic definitions**

Add these exact public shapes:

~~~ts
export type FinalTopicAllocation = Readonly<{
  packId: string;
  packName: string;
  easy: number;
  medium: number;
  hard: number;
}>;

export type ProductionBatchDefinition = Readonly<{
  id: string;
  packId: string;
  packName: string;
  topicFamily: string;
  subthemes: readonly string[];
  maxSetsPerSubtheme: number;
  requiredOpenTdbClues: number;
  distribution: BatchDistribution | null;
  finalTopicAllocations: Readonly<Record<string, FinalTopicAllocation>> | null;
  boardClues: number;
  finalClues: number;
}>;
~~~

Extend each topic definition tuple with packName and requiredOpenTdbClues. Preserve the existing twelve names from accepted CSVs. Append:

~~~ts
[
  '14-adult',
  'built-in-adult',
  'Adult (Mature) / Täiskasvanutele',
  'adult',
  [
    'sexology-reproductive-health-history',
    'relationships-partnership-customs',
    'sexuality-identity-society',
    'nightlife-adult-social-culture',
    'censorship-obscenity-law',
    'erotic-art-literature-film-history',
    'sex-work-history-regulation',
    'adult-entertainment-history',
    'vice-moral-regulation',
    'landmark-research-terminology',
  ],
  0,
],
[
  '15-estonia',
  'built-in-estonia',
  'Estonia / Eesti',
  'estonia',
  [
    'history-statehood',
    'geography-regions',
    'towns-landmarks',
    'language-literature',
    'folklore-traditions',
    'music-performing-arts',
    'art-architecture',
    'science-technology',
    'government-civics',
    'nature-environment',
    'sports',
    'food-everyday-culture',
  ],
  0,
],
~~~

Add the two approved DISTRIBUTIONS entries. In the mapper, copy packName and requiredOpenTdbClues from the tuple and set finalTopicAllocations: null. Build the frozen 14-entry Final allocation object shown in Step 1, set FINAL_BATCH.packName to Finals Pack, derive FINAL_BATCH.subthemes from its keys, and set finalClues to 174.

- [ ] **Step 4: Run catalog tests and type checking**

Run: npx vitest run tests/unit/content/productionBatches.test.ts --configLoader runner

Expected: PASS.

Run: npm run typecheck

Expected: PASS; adding catalog fields must not require duplicate validators or runtime branches.

- [ ] **Step 5: Commit the catalog**

~~~bash
git add scripts/content/productionBatches.ts tests/unit/content/productionBatches.test.ts
git commit -m "feat(content): add Adult and Estonia batch definitions"
~~~

---

### Task 2: Enforce data-driven Final ownership and exact release inventory

**Files:**
- Modify: scripts/content/releaseThresholds.ts:1-17
- Modify: scripts/content/validate.ts:109-120, 192-196, 274-346, 394-460, 497-616
- Modify: scripts/content/verifyBatch.ts:87-91
- Modify: tests/unit/content/productionValidator.test.ts:140-215, 759-818, 872-887

**Interfaces:**
- Consumes: ProductionBatchDefinition.finalTopicAllocations from Task 1.
- Produces: exact RELEASE_THRESHOLDS, nested RELEASE_COMPOSITION_THRESHOLDS, row-to-batch resolution by content kind, PACK_IDENTITY_MISMATCH, and shortage/excess release codes.
- Later seed tasks consume ReleaseSummary.builtInPacks and the exact release constants.

- [ ] **Step 1: Rewrite the synthetic Final generator from the catalog**

Replace the 150-row round-robin finalBatchRows helper with:

~~~ts
function finalBatchRows(): Row[] {
  const rows: Row[] = [];
  for (const [macroTopic, allocation] of Object.entries(FINAL_BATCH.finalTopicAllocations!)) {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (let index = 0; index < allocation[difficulty]; index += 1) {
        const number = rows.length + 1;
        rows.push(row({
          clue_id: 'final-clue-' + number,
          category_set_id: 'final-set-' + number,
          pack_id: allocation.packId,
          pack_name: allocation.packName,
          content_kind: 'final',
          round: 'final',
          tier: '0',
          difficulty,
          macro_topic: macroTopic,
          category_name_en: 'Final Category ' + number,
          category_name_et: 'Finaalkategooria ' + number,
        }));
      }
    }
  }
  return rows;
}
~~~

Update exact release expectations to:

~~~ts
expect(result.summary).toEqual({
  boardClues: 7_000,
  categorySets: 1_400,
  distinctCategoryNames: 1_400,
  finalClues: 174,
  easySets: 467,
  mediumSets: 467,
  hardSets: 466,
  builtInPacks: 15,
});
~~~

- [ ] **Step 2: Add failing validator cases**

Add tests that:

1. Change one Adult Final pack ID to built-in-finals and expect BATCH_ALLOCATION.
2. Change one Adult Final difficulty and expect BATCH_ALLOCATION.
3. Give an Adult Final evidence batchId of 14-adult in release mode and expect SOURCE_MISMATCH; then use 13-finals and expect no SOURCE_MISMATCH.
4. Change the pack_name on one built-in-adult row and expect PACK_IDENTITY_MISMATCH.
5. Add one unique extra board category set and its five evidence records to an exact corpus and expect RELEASE_BOARD_CLUES_EXCESS and RELEASE_CATEGORY_SETS_EXCESS.
6. Remove one row from each exact difficulty/round cell in isolated cases and expect the corresponding SHORTAGE code.
7. Assert the exact corpus has 2,335/2,335/2,330 board clues by difficulty, 234/233 Easy sets, 233/234 Medium sets, 233/233 Hard sets, and 58 Finals per difficulty.

- [ ] **Step 3: Run validator tests and verify RED**

Run: npx vitest run tests/unit/content/productionValidator.test.ts --configLoader runner

Expected: FAIL because Final allocation is hard-coded to one pack and 50 per difficulty, release checks are minimum-only, and pack names are not cross-file identities.

- [ ] **Step 4: Define exact release requirements**

Replace the release constants with:

~~~ts
export const RELEASE_THRESHOLDS = {
  boardClues: 7_000,
  categorySets: 1_400,
  distinctCategoryNames: 1_400,
  finalClues: 174,
  easySets: 467,
  mediumSets: 467,
  hardSets: 466,
  builtInPacks: 15,
} as const;

export const RELEASE_COMPOSITION_THRESHOLDS = {
  boardClues: { easy: 2_335, medium: 2_335, hard: 2_330 },
  categorySets: {
    easy: { roundOne: 234, roundTwo: 233 },
    medium: { roundOne: 233, roundTwo: 234 },
    hard: { roundOne: 233, roundTwo: 233 },
  },
  finalClues: { easy: 58, medium: 58, hard: 58 },
} as const;
~~~

Add builtInPacks to verifyBatch.ts summarySchema so strict parsing accepts both batch and release summaries.

- [ ] **Step 5: Resolve evidence batches by row kind**

Replace batchForPack with:

~~~ts
function batchForRow(row: ParsedCsvRow): ProductionBatchDefinition | undefined {
  if (row.content_kind === 'final') return FINAL_BATCH;
  return PRODUCTION_BATCHES.find((batch) => batch.packId === row.pack_id);
}
~~~

Use options.batch ?? batchForRow(row) when binding evidence. This is required because built-in-adult and built-in-estonia identify board batches for board rows but 13-finals for Final rows.

- [ ] **Step 6: Enforce pack identity and Final allocation**

Track the first name for every pack ID while iterating located rows:

~~~ts
const packNames = new Map<string, string>();
for (const item of located) {
  const priorName = packNames.get(item.row.pack_id);
  if (priorName !== undefined && priorName !== item.row.pack_name) {
    add({
      file: item.file,
      row: item.row.rowNumber,
      code: 'PACK_IDENTITY_MISMATCH',
      severity: 'error',
      message: 'Pack ' + item.row.pack_id + ' uses both ' + priorName + ' and ' + item.row.pack_name,
    });
  } else {
    packNames.set(item.row.pack_id, item.row.pack_name);
  }
}
~~~

Add PACK_IDENTITY_MISMATCH to NON_WAIVABLE_CODES. For board batches require both batch.packId and batch.packName. For FINAL_BATCH, require every row to resolve through:

~~~ts
const allocation = batch.finalTopicAllocations?.[row.macro_topic];
const rowMatchesAllocation = allocation !== undefined
  && row.pack_id === allocation.packId
  && row.pack_name === allocation.packName;
~~~

For each Final allocation, require exactly allocation.easy, allocation.medium, and allocation.hard rows. Remove the literal 50 and 12-or-13 logic.

- [ ] **Step 7: Make every release count exact**

Add builtInPacks to the summary from distinct located pack IDs beginning with built-in-. For every top-level and difficulty/round count:

- actual below expected emits the existing SHORTAGE suffix;
- actual above expected emits EXCESS;
- actual equal expected emits nothing;
- the message says requires exactly N; found M.

Do not make exact inventory errors reviewable exceptions.

- [ ] **Step 8: Run validator, batch-report, and type tests**

Run: npx vitest run tests/unit/content/productionValidator.test.ts tests/unit/content/verifyBatch.test.ts --configLoader runner

Expected: PASS with the synthetic 7,000/1,400/174 corpus non-blocking.

Run: npm run typecheck

Expected: PASS.

- [ ] **Step 9: Commit exact validation**

~~~bash
git add scripts/content/releaseThresholds.ts scripts/content/validate.ts scripts/content/verifyBatch.ts tests/unit/content/productionValidator.test.ts tests/unit/content/verifyBatch.test.ts
git commit -m "feat(content): enforce exact expanded inventory"
~~~

---

### Task 3: Require explicit Adult policy approval in evidence

**Files:**
- Modify: scripts/content/evidence.ts:23-85
- Modify: scripts/content/validate.ts:109-120, 394-444
- Modify: tests/unit/content/productionValidator.test.ts:50-140, 680-790
- Modify: tests/unit/content/verifyBatch.test.ts:45-95

**Interfaces:**
- Produces: ContentEvidence.adultPolicyReview with policy literal adult-mature-non-graphic-v1.
- Consumes: built-in-adult pack identity from Task 1.
- Adult board and Final rows must carry this approval; old evidence files may omit it and parse as null.

- [ ] **Step 1: Add failing evidence and validator tests**

Add these cases:

~~~ts
expect(contentEvidenceSchema.parse(existingNonAdultEvidence).adultPolicyReview).toBeNull();

const missing = validateAdultRow({ ...adultEvidence, adultPolicyReview: null });
expect(missing.issues).toEqual(expect.arrayContaining([
  expect.objectContaining({ code: 'ADULT_POLICY_REVIEW_MISSING', severity: 'error' }),
]));

expect(() => contentEvidenceSchema.parse({
  ...adultEvidence,
  adultPolicyReview: {
    policy: 'adult-mature-non-graphic-v1',
    reviewer: adultEvidence.authoring.author,
    reviewedAt: '2026-08-27T12:00:00.000Z',
    decision: 'approved',
  },
})).toThrow(/author/i);
~~~

Also prove an Adult Final in batch 13-finals accepts the policy review and a non-Adult clue does not require one.

- [ ] **Step 2: Run evidence tests and verify RED**

Run: npx vitest run tests/unit/content/productionValidator.test.ts tests/unit/content/verifyBatch.test.ts --configLoader runner

Expected: FAIL because ContentEvidence has no Adult policy review field.

- [ ] **Step 3: Extend the evidence schema compatibly**

Define:

~~~ts
const adultPolicyReviewSchema = reviewDecisionSchema.extend({
  policy: z.literal('adult-mature-non-graphic-v1'),
}).strict();
~~~

Add this field to contentEvidenceSchema:

~~~ts
adultPolicyReview: adultPolicyReviewSchema.nullable().default(null),
~~~

Include adultPolicyReview in the author-independence and review-after-authoring checks. The default keeps every accepted non-Adult JSONL record valid without rewriting it.

- [ ] **Step 4: Enforce the approval on Adult rows**

After parsing and binding evidence, add ADULT_POLICY_REVIEW_MISSING when row.pack_id is built-in-adult and evidence.adultPolicyReview is null. Add this code to NON_WAIVABLE_CODES. Do not use a keyword blocklist as a substitute for semantic review.

Update synthetic evidence helpers so non-Adult records use null and Adult records use:

~~~ts
adultPolicyReview: {
  policy: 'adult-mature-non-graphic-v1',
  reviewer: 'Independent Adult Policy Reviewer',
  reviewedAt: '2026-08-27T13:00:00.000Z',
  decision: 'approved',
  notes: 'Reviewed against the approved mature, factual, non-graphic boundary.',
},
~~~

- [ ] **Step 5: Run tests and commit**

Run: npx vitest run tests/unit/content/productionValidator.test.ts tests/unit/content/verifyBatch.test.ts --configLoader runner

Expected: PASS.

~~~bash
git add scripts/content/evidence.ts scripts/content/validate.ts tests/unit/content/productionValidator.test.ts tests/unit/content/verifyBatch.test.ts
git commit -m "feat(content): require Adult policy review"
~~~

---

### Task 4: Carry per-game default selection through setup

**Files:**
- Modify: src/shared/ipc/contracts.ts:420-445
- Modify: src/main/application.ts:45-60
- Modify: src/renderer/features/setup/SetupScreen.tsx:106-115
- Modify: tests/unit/game/contracts.test.ts
- Modify: tests/integration/application.test.ts:15-40
- Modify: tests/unit/renderer/SetupScreen.test.tsx:1-175
- Modify: tests/unit/renderer/HomeScreen.test.tsx:15-30
- Modify: tests/unit/renderer/i18n.test.tsx:20-35
- Modify: tests/integration/ipc/setupIpc.test.ts:75-115
- Modify: tests/integration/ipc/preload.test.ts:260-295
- Modify: tests/integration/security/ipcFuzz.test.ts:30-45
- Modify: tests/unit/game/boardSelector.test.ts:32-150

**Interfaces:**
- Produces: SetupOptions.packs[number].selectedByDefault: boolean.
- Consumes: enabled continues to mean available; built-in-adult is the only false default.
- Board selection remains unchanged and consumes GameConfig.packIds.

- [ ] **Step 1: Add failing contract and setup tests**

Require selectedByDefault in the strict schema:

~~~ts
expect(setupOptionsSchema.safeParse({
  packs: [{ id: 'built-in-adult', name: 'Adult (Mature) / Täiskasvanutele', enabled: true }],
  automaticDisplayMode: 'single',
}).success).toBe(false);
~~~

Add a SetupScreen test with only these returned packs:

~~~ts
[
  {
    id: 'built-in-adult',
    name: 'Adult (Mature) / Täiskasvanutele',
    enabled: true,
    selectedByDefault: false,
  },
  {
    id: 'built-in-estonia',
    name: 'Estonia / Eesti',
    enabled: true,
    selectedByDefault: true,
  },
  {
    id: 'built-in-finals',
    name: 'Finals Pack',
    enabled: true,
    selectedByDefault: true,
  },
]
~~~

Assert Adult is visible and unchecked, Estonia and Finals are checked, the first availability call excludes built-in-adult, and checking Adult causes the next call and submitted GameConfig to include it. Uncheck Estonia and assert the next availability request excludes built-in-estonia without changing Adult or Finals; then recheck Estonia before the submit assertion.

- [ ] **Step 2: Add a main-composition failing test**

In the copied development database, insert enabled built-in-adult, built-in-estonia, and custom-pack rows before createApplication. Assert:

~~~ts
expect(application.getSetupOptions('dual').packs).toEqual([
  {
    id: 'built-in-adult',
    name: 'Adult (Mature) / Täiskasvanutele',
    enabled: true,
    selectedByDefault: false,
  },
  {
    id: 'built-in-estonia',
    name: 'Estonia / Eesti',
    enabled: true,
    selectedByDefault: true,
  },
  {
    id: 'custom-pack',
    name: 'Custom Pack',
    enabled: true,
    selectedByDefault: true,
  },
  {
    id: 'dev-library',
    name: 'Quiz Stage Development Library',
    enabled: true,
    selectedByDefault: true,
  },
]);
~~~

The custom-pack assertion proves the rule applies to custom packs rather than only the built-ins in the seed.

- [ ] **Step 3: Run setup tests and verify RED**

Run: npx vitest run tests/unit/game/contracts.test.ts tests/unit/renderer/SetupScreen.test.tsx tests/integration/application.test.ts --configLoader runner

Expected: FAIL because selectedByDefault is absent and SetupScreen selects every enabled pack.

- [ ] **Step 4: Implement the minimal contract and runtime mapping**

Add selectedByDefault: z.boolean() to each setup pack. In application.ts use one local constant:

~~~ts
const ADULT_PACK_ID = 'built-in-adult';
~~~

Map:

~~~ts
.map(({ id, name, enabled }) => ({
  id,
  name,
  enabled,
  selectedByDefault: id !== ADULT_PACK_ID,
}))
~~~

Initialize the renderer with:

~~~ts
setPackIds(value.packs
  .filter((pack) => pack.enabled && pack.selectedByDefault)
  .map((pack) => pack.id));
~~~

Add selectedByDefault: true to existing non-Adult test fixtures and IPC/preload mocks. Do not add database state.

- [ ] **Step 5: Add the pack-filter characterization test**

Construct 12 Estonia sets plus one Estonia Final and 12 Adult sets plus one Adult Final. With only built-in-estonia in GameConfig.packIds, assert every selected category and the Final use built-in-estonia. With only built-in-adult, assert every selected category and the Final use built-in-adult.

Run: npx vitest run tests/unit/game/boardSelector.test.ts --configLoader runner

Expected: PASS without production selector changes, proving the existing pack filter prevents Adult board and Final leakage.

- [ ] **Step 6: Run all setup boundaries and commit**

Run: npx vitest run tests/unit/game/contracts.test.ts tests/unit/renderer/SetupScreen.test.tsx tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/i18n.test.tsx tests/integration/application.test.ts tests/integration/ipc/setupIpc.test.ts tests/integration/ipc/preload.test.ts tests/integration/security/ipcFuzz.test.ts tests/unit/game/boardSelector.test.ts --configLoader runner

Expected: PASS.

~~~bash
git add src/shared/ipc/contracts.ts src/main/application.ts src/renderer/features/setup/SetupScreen.tsx tests/unit/game/contracts.test.ts tests/integration/application.test.ts tests/unit/renderer/SetupScreen.test.tsx tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/i18n.test.tsx tests/integration/ipc/setupIpc.test.ts tests/integration/ipc/preload.test.ts tests/integration/security/ipcFuzz.test.ts tests/unit/game/boardSelector.test.ts
git commit -m "feat(setup): make Adult content opt in"
~~~

---

### Task 5: Read back the exact seed, including all 15 packs

**Files:**
- Modify: scripts/content/buildSeed.ts:39-56, 333-352
- Modify: scripts/content/verifySeed.ts:100-155, 180-225
- Modify: tests/integration/content/productionSeed.test.ts:17-55, 112-205, 225-245, 540-615

**Interfaces:**
- Consumes: ReleaseSummary.builtInPacks and FINAL_BATCH.finalTopicAllocations.
- Produces: SeedInventory.builtInPacks and exact report comparison.
- The productionSeed fixture creates the full synthetic 14-board-topic/174-Final corpus from catalog data.

- [ ] **Step 1: Update the synthetic seed fixture and write failing assertions**

Generate Final rows from FINAL_BATCH.finalTopicAllocations exactly as in Task 2, including each allocation's packName and Adult policy review. Assert:

~~~ts
expect(summary).toEqual({
  boardClues: 7_000,
  categorySets: 1_400,
  distinctCategoryNames: 1_400,
  finalClues: 174,
  easySets: 467,
  mediumSets: 467,
  hardSets: 466,
  builtInPacks: 15,
});
~~~

Query the built seed and assert:

~~~ts
expect(database.prepare(
  "SELECT COUNT(*) FROM content_packs WHERE id LIKE 'built-in-%'",
).pluck().get()).toBe(15);

expect(packInventory('built-in-adult')).toEqual({
  boardSets: 100, boardClues: 500, finalClues: 12,
});
expect(packInventory('built-in-estonia')).toEqual({
  boardSets: 100, boardClues: 500, finalClues: 12,
});
expect(packInventory('built-in-finals')).toEqual({
  boardSets: 0, boardClues: 0, finalClues: 150,
});
~~~

Add a report-reader case where boardClues is 7,001 and expect an exact-inventory error rather than acceptance.

- [ ] **Step 2: Run the production-seed tests and verify RED**

Run: npx vitest run tests/integration/content/productionSeed.test.ts --configLoader runner

Expected: FAIL because seed inventories omit builtInPacks and readReleaseInventoryReport accepts values above minimum.

- [ ] **Step 3: Extend build and verification inventory**

Add builtInPacks: number to both SeedInventory interfaces and use:

~~~sql
SELECT COUNT(*) FROM content_packs WHERE id LIKE 'built-in-%'
~~~

Change readReleaseInventoryReport from summary[key] < expected to summary[key] !== expected and report:

~~~ts
throw new Error(
  'Release inventory report does not match exact inventory for '
  + key + ': ' + summary[key] + ' != ' + expected,
);
~~~

Keep ensureSeedInventoryMatchesReport exact. Do not add a second seed inspector.

- [ ] **Step 4: Prove selection against the built synthetic seed**

Load content through ContentRepository. For each new pack independently, create an Easy English GameConfig containing only that pack. Assert selectMatchContent succeeds, returns 12 category sets and one Final, and every selected record uses the requested pack. This proves Adult and Estonia each have enough content without relying on the other 13 packs.

- [ ] **Step 5: Run seed, validator, and type tests**

Run: npx vitest run tests/integration/content/productionSeed.test.ts tests/unit/content/productionValidator.test.ts --configLoader runner

Expected: PASS.

Run: npm run typecheck

Expected: PASS.

Run: npm run verify:content

Expected at this stage: non-zero because accepted 13-finals still has 150 records and accepted 14-adult/15-estonia files do not yet exist. The only release blockers should be the expected 13-finals/14-adult/15-estonia allocation and exact-inventory shortage codes. Investigate any duplicate, source, translation, schema, policy, or pack-identity error before content authoring.

- [ ] **Step 6: Commit seed verification**

~~~bash
git add scripts/content/buildSeed.ts scripts/content/verifySeed.ts tests/integration/content/productionSeed.test.ts
git commit -m "test(content): verify exact expanded seed inventory"
~~~

---

### Task 6: Finish, verify, and publish the 174-clue Final batch

**Files:**
- Modify through atomic publisher: content/authored/13-finals.csv
- Modify through atomic publisher: content/generated/13-finals.en-et.csv
- Modify through atomic publisher: content/evidence/13-finals.jsonl
- Modify through atomic publisher: content/reports/13-finals.json
- Modify if refreshed by source checks: content/reports/source-check-cache.json
- Work only, ignored: content/work/13-finals/authored.csv
- Work only, ignored: content/work/13-finals/generated.en-et.csv
- Work only, ignored: content/work/13-finals/evidence.jsonl
- Work only, ignored: content/work/13-finals/report.json

**Interfaces:**
- Consumes: FINAL_BATCH's 14-topic allocation, Adult policy review, and existing atomic verify/publish commands.
- Produces: accepted 13-finals artifacts with the original 150 records plus 12 Adult and 12 Estonia Finals.
- Task 7 must not start until the accepted report is freshly passing for 174 rows.

- [ ] **Step 1: Stage the currently accepted Final artifacts**

Create content/work/13-finals and copy:

~~~powershell
Copy-Item -LiteralPath content/authored/13-finals.csv -Destination content/work/13-finals/authored.csv
Copy-Item -LiteralPath content/generated/13-finals.en-et.csv -Destination content/work/13-finals/generated.en-et.csv
Copy-Item -LiteralPath content/evidence/13-finals.jsonl -Destination content/work/13-finals/evidence.jsonl
~~~

Do not copy the old passing report. The next report must cover 174 rows.

- [ ] **Step 2: Author the 24 new English Final records**

Append exactly these stable ranges:

- Adult category sets built-in-adult-final-set-0001 through built-in-adult-final-set-0012.
- Adult clues built-in-adult-final-0001 through built-in-adult-final-0012.
- Estonia category sets built-in-estonia-final-set-0001 through built-in-estonia-final-set-0012.
- Estonia clues built-in-estonia-final-0001 through built-in-estonia-final-0012.

Use pack names exactly as specified globally, content_kind final, round final, tier 0, enabled true, and four rows per difficulty for each topic. Adult macro_topic is adult; Estonia macro_topic is estonia. Give every row a unique category name, fact, answer, explanation, specific HTTPS source, retrieval date, license, and fact key. New authored rows have blank Estonian fields and translation_status untranslated.

- [ ] **Step 3: Create complete independent evidence**

For all 24 rows use batchId 13-finals, origin wikidata or compatibleOpen, inspiration null, and distinct authoring, factual-review, and editorial-review identities. Adult Final evidence additionally carries adultPolicyReview with policy adult-mature-non-graphic-v1. Verify Adult content against every exclusion in the spec and Estonia claims against dated/attributed-source rules.

- [ ] **Step 4: Translate and semantically review all 24 rows**

Append reviewed Estonian category, clue, response, accepted variants when present, and explanation fields to generated.en-et.csv. Set translation_status reviewed and add a later independent translationReview to each evidence record. Preserve names, dates, quantities, and answer scope; use natural Estonian rather than English word order.

- [ ] **Step 5: Prove the accepted 150 rows are unchanged in work**

Compare the first 151 CSV lines, including the header, in each staged CSV against its accepted source. Compare the first 150 JSONL evidence lines against accepted evidence. Expected: no difference. Also assert the only new clue-ID prefixes are built-in-adult-final- and built-in-estonia-final-.

- [ ] **Step 6: Verify the full Final batch**

Run:

~~~powershell
npm run content:verify-batch -- --batch 13-finals --work-root content/work --source-cache content/reports/source-check-cache.json
~~~

Expected: exit 0; report kind verification; blocking false; generated summary finalClues 174; exactly 58 rows per difficulty; exact Final topic/pack allocation; zero OpenTDB evidence; no source, duplicate, translation, policy, or pack-identity errors.

- [ ] **Step 7: Publish atomically and reverify accepted artifacts**

Run:

~~~powershell
npm run content:publish-batch -- --batch 13-finals --work-root content/work --accepted-root .
npm run content:verify-batch -- --batch 13-finals --work-root content/work --source-cache content/reports/source-check-cache.json
~~~

Expected: publisher exits 0 and accepted files match the passing report hashes. Re-run the original-150 line comparison against the accepted files.

- [ ] **Step 8: Commit the complete Final batch**

~~~bash
git add content/authored/13-finals.csv content/generated/13-finals.en-et.csv content/evidence/13-finals.jsonl content/reports/13-finals.json content/reports/source-check-cache.json
git commit -m "feat(content): add Adult and Estonia Finals"
~~~

---

### Task 7: Author, review, verify, and publish the Adult board batch

**Files:**
- Create through atomic publisher: content/authored/14-adult.csv
- Create through atomic publisher: content/generated/14-adult.en-et.csv
- Create through atomic publisher: content/evidence/14-adult.jsonl
- Create through atomic publisher: content/reports/14-adult.json
- Modify if refreshed by source checks: content/reports/source-check-cache.json
- Work only, ignored: content/work/14-adult/authored.csv
- Work only, ignored: content/work/14-adult/generated.en-et.csv
- Work only, ignored: content/work/14-adult/evidence.jsonl
- Work only, ignored: content/work/14-adult/report.json

**Interfaces:**
- Consumes: batch 14-adult, Adult policy evidence, and the accepted 174-row Final batch.
- Produces: 100 reviewed bilingual Adult category sets and 500 reviewed bilingual Adult board clues.
- Task 8 must not start until the accepted 14-adult report is freshly passing.

- [ ] **Step 1: Create canonical work artifacts**

Create the three work files with the canonical CSV header:

~~~text
clue_id,pack_id,pack_name,category_set_id,content_kind,round,tier,difficulty,macro_topic,category_name_en,category_name_et,clue_en,clue_et,response_en,response_et,accepted_variants_en,accepted_variants_et,explanation_en,explanation_et,source_title,source_url,source_license,source_retrieved_at,translation_status,enabled
~~~

Use category IDs built-in-adult-set-001 through built-in-adult-set-100. For set N and tier T, use clue number (N - 1) * 5 + T, formatted as built-in-adult-clue-0001 through built-in-adult-clue-0500.

- [ ] **Step 2: Apply the exact round/difficulty ledger**

Use these immutable set ranges:

| Set range | Difficulty | Round |
|---|---|---|
| 001-017 | easy | round-one |
| 018-033 | easy | round-two |
| 034-050 | medium | round-one |
| 051-067 | medium | round-two |
| 068-083 | hard | round-one |
| 084-100 | hard | round-two |

Every set has exactly five rows with tiers 1, 2, 3, 4, 5.

- [ ] **Step 3: Apply the exact subtheme ledger**

Assign ten sets to each subtheme in catalog order:

| Set range | Subtheme |
|---|---|
| 001-010 | sexology-reproductive-health-history |
| 011-020 | relationships-partnership-customs |
| 021-030 | sexuality-identity-society |
| 031-040 | nightlife-adult-social-culture |
| 041-050 | censorship-obscenity-law |
| 051-060 | erotic-art-literature-film-history |
| 061-070 | sex-work-history-regulation |
| 071-080 | adult-entertainment-history |
| 081-090 | vice-moral-regulation |
| 091-100 | landmark-research-terminology |

- [ ] **Step 4: Author and review English content in ten ledger slices**

Complete set ranges 001-010, 011-020, 021-030, 031-040, 041-050, 051-060, 061-070, 071-080, 081-090, and 091-100 in order. After each slice, verify:

- ten unique, coherent category names;
- five escalating but answerable tiers per category;
- 50 distinct facts and fact keys;
- no duplicated or near-duplicated clue wording against accepted board and Final content;
- original wording rather than source paraphrase too close to the source;
- a specific supporting source per clue;
- no OpenTDB inspiration;
- separate authoring, factual, editorial, and Adult-policy approval;
- neutral clinical/legal/historical language and every Adult exclusion in the spec.

Changing claims include an explicit date, edition, case, or jurisdiction. Living people appear only for sourced public professional facts.

- [ ] **Step 5: Translate and review in the same ten slices**

For each completed slice, add all Estonian fields, set translation_status reviewed, and add translationReview later than authoring. Check dates, numbers, named entities, accepted variants, terminology, and answer breadth against English. Do not mark a slice reviewed until all 50 records have semantic approval.

- [ ] **Step 6: Run local structural checks before network verification**

Assert exactly:

- 500 CSV rows and 500 one-to-one evidence records;
- 100 category IDs and 100 unique English category names;
- 17/16, 17/17, 16/17 set allocation;
- ten sets per subtheme;
- zero OpenTDB evidence;
- 500 non-null Adult policy approvals;
- no clue or category ID outside the declared ranges.

- [ ] **Step 7: Verify and publish the batch**

Run:

~~~powershell
npm run content:verify-batch -- --batch 14-adult --work-root content/work --source-cache content/reports/source-check-cache.json
npm run content:publish-batch -- --batch 14-adult --work-root content/work --accepted-root .
~~~

Expected: both commands exit 0; report blocking false; authored and generated summaries show 500 board clues, 100 sets, and zero Finals; every source check succeeds; no unresolved evidence, translation, sample, policy, duplicate, or allocation issue remains.

- [ ] **Step 8: Commit the Adult batch**

~~~bash
git add content/authored/14-adult.csv content/generated/14-adult.en-et.csv content/evidence/14-adult.jsonl content/reports/14-adult.json content/reports/source-check-cache.json
git commit -m "feat(content): add reviewed Adult board pack"
~~~

---

### Task 8: Author, review, verify, and publish the Estonia board batch

**Files:**
- Create through atomic publisher: content/authored/15-estonia.csv
- Create through atomic publisher: content/generated/15-estonia.en-et.csv
- Create through atomic publisher: content/evidence/15-estonia.jsonl
- Create through atomic publisher: content/reports/15-estonia.json
- Modify if refreshed by source checks: content/reports/source-check-cache.json
- Work only, ignored: content/work/15-estonia/authored.csv
- Work only, ignored: content/work/15-estonia/generated.en-et.csv
- Work only, ignored: content/work/15-estonia/evidence.jsonl
- Work only, ignored: content/work/15-estonia/report.json

**Interfaces:**
- Consumes: batch 15-estonia and accepted Final/Adult batches.
- Produces: 100 reviewed bilingual Estonia category sets and 500 reviewed bilingual Estonia board clues.

- [ ] **Step 1: Create canonical work artifacts and IDs**

Use the same canonical CSV header as Task 7. Use category IDs built-in-estonia-set-001 through built-in-estonia-set-100 and clue IDs built-in-estonia-clue-0001 through built-in-estonia-clue-0500, with the same set/tier formula.

- [ ] **Step 2: Apply the exact round/difficulty ledger**

| Set range | Difficulty | Round |
|---|---|---|
| 001-017 | easy | round-one |
| 018-034 | easy | round-two |
| 035-050 | medium | round-one |
| 051-067 | medium | round-two |
| 068-084 | hard | round-one |
| 085-100 | hard | round-two |

- [ ] **Step 3: Apply the exact subtheme ledger**

| Set range | Subtheme |
|---|---|
| 001-009 | history-statehood |
| 010-018 | geography-regions |
| 019-027 | towns-landmarks |
| 028-036 | language-literature |
| 037-044 | folklore-traditions |
| 045-052 | music-performing-arts |
| 053-060 | art-architecture |
| 061-068 | science-technology |
| 069-076 | government-civics |
| 077-084 | nature-environment |
| 085-092 | sports |
| 093-100 | food-everyday-culture |

- [ ] **Step 4: Author and independently review English content in ten-set slices**

Complete 001-010 through 091-100 in ascending ten-set slices. Each slice must have unique categories, five coherent tiers, distinct facts and fact keys, original wording, specific sources, factual approval, editorial approval, and zero OpenTDB inspiration.

Prefer official Estonian institutions, Statistics Estonia, Riigi Teataja, archives, museums, the Estonian Language Institute, universities, and stable compatible open references. Date changing statistics, officeholders, laws, rankings, and records. Attribute disputed historical or cultural claims. Reject unsupported nationalist framing, tourism-copy generalizations, and facts that are merely Baltic rather than meaningfully Estonian.

- [ ] **Step 5: Verify Estonian-only sources before translation**

For every Estonian-only primary source, record editorial-review notes that the reviewer checked the English assertion against the source meaning. Do this before translationReview. Do not substitute an English secondary source when the primary source materially narrows the claim.

- [ ] **Step 6: Translate and semantically review all 500 rows**

Write natural Estonian category, clue, response, accepted variants when present, and explanation fields. Mark reviewed only after checking numbers, dates, cases, diacritics, official Estonian names, answer scope, and English/Estonian semantic equivalence.

- [ ] **Step 7: Verify the exact local structure**

Assert exactly 500 rows, 500 evidence records, 100 sets, 100 unique category names, the approved 17/17, 16/17, 17/16 distribution, four subthemes with nine sets, eight subthemes with eight sets, zero OpenTDB evidence, and no IDs outside the declared ranges.

- [ ] **Step 8: Verify and publish the batch**

Run:

~~~powershell
npm run content:verify-batch -- --batch 15-estonia --work-root content/work --source-cache content/reports/source-check-cache.json
npm run content:publish-batch -- --batch 15-estonia --work-root content/work --accepted-root .
~~~

Expected: both commands exit 0; report blocking false; authored and generated summaries show 500 board clues and 100 sets; all evidence, translation, source, duplicate, pack-identity, subtheme, and allocation gates pass.

- [ ] **Step 9: Commit the Estonia batch**

~~~bash
git add content/authored/15-estonia.csv content/generated/15-estonia.en-et.csv content/evidence/15-estonia.jsonl content/reports/15-estonia.json content/reports/source-check-cache.json
git commit -m "feat(content): add reviewed Estonia board pack"
~~~

---

### Task 9: Rebuild the deterministic seed and run local final acceptance

**Files:**
- Modify: resources/content/seed.sqlite
- Modify: content/reports/release-inventory.json
- Modify: content/reports/source-check-cache.json
- Modify: tests/e2e/package-smoke.spec.ts:78-150
- Create after fresh checks: docs/superpowers/sdd/2026-08-27-adult-estonia-content/acceptance.md

**Interfaces:**
- Consumes: all three freshly passing batch reports and all accepted 01-15 artifacts.
- Produces: deterministic production seed, exact SQLite/readback evidence, packaged Adult setup evidence, and the canonical acceptance record.

- [ ] **Step 1: Run the full accepted-corpus validator and source checker**

Run:

~~~powershell
npm run content:validate -- --input content/generated/*.en-et.csv --evidence content/evidence/*.jsonl --mode release --report content/reports/release-inventory.json
npm run content:source-check -- --input content/generated/*.en-et.csv --cache content/reports/source-check-cache.json
~~~

Expected: both exit 0; no blocking issues; exact summary 7,000 board clues, 1,400 sets, 1,400 names, 174 Finals, 467/467/466 sets, and 15 built-in packs.

- [ ] **Step 2: Prove two seed builds are deterministic**

Create two ignored temporary seed/report pairs. Seed each temporary report from the current release report so reviewed translation exception IDs remain available:

~~~powershell
New-Item -ItemType Directory -Force .tmp | Out-Null
Copy-Item -LiteralPath content/reports/release-inventory.json -Destination .tmp/adult-estonia-report-a.json
Copy-Item -LiteralPath content/reports/release-inventory.json -Destination .tmp/adult-estonia-report-b.json
~~~

Build both with:

~~~powershell
npm run content:build-seed -- --input content/generated/*.en-et.csv --evidence content/evidence/*.jsonl --output .tmp/adult-estonia-seed-a.sqlite --report .tmp/adult-estonia-report-a.json
npm run content:build-seed -- --input content/generated/*.en-et.csv --evidence content/evidence/*.jsonl --output .tmp/adult-estonia-seed-b.sqlite --report .tmp/adult-estonia-report-b.json
~~~

Expected: the two SQLite SHA-256 hashes, input manifest hashes, row counts, and inventories are identical. A generatedAt timestamp may differ and is not part of the deterministic seed assertion.

- [ ] **Step 3: Build and verify the accepted production seed**

Run:

~~~powershell
npm run content:build-seed -- --input content/generated/*.en-et.csv --evidence content/evidence/*.jsonl --output resources/content/seed.sqlite --report content/reports/release-inventory.json
npm run verify:content
~~~

Expected: exit 0; resources/content/seed.sqlite hash matches release-inventory output.sha256; report validation and SQLite inventory match exactly.

- [ ] **Step 4: Run exact SQLite readback**

Run the productionSeed integration test and independently query:

- 15 built-in content_packs;
- built-in-adult: 100 board sets, 500 board clues, 12 Finals;
- built-in-estonia: 100 board sets, 500 board clues, 12 Finals;
- built-in-finals: 150 Finals;
- board difficulty sets 467/467/466;
- board difficulty clues 2,335/2,335/2,330;
- difficulty/round cells 234/233, 233/234, 233/233;
- Finals 58/58/58;
- total clues 7,174.

Run: npx vitest run tests/integration/content/productionSeed.test.ts --configLoader runner

Expected: PASS.

- [ ] **Step 5: Extend packaged smoke for both setup paths**

Before the existing complete match sequence:

1. Open New Match and assert Adult (Mature) / Täiskasvanutele is visible and unchecked.
2. Assert Estonia / Eesti is checked and the start button becomes enabled without Adult.
3. Start the first match with Adult unchecked.
4. Read the newest snapshot state_json and assert config.packIds excludes built-in-adult and no selected board category ID, board clue ID, or Final clue ID begins with built-in-adult-.
5. End that match incomplete through the confirmation checkbox and End match incomplete button.
6. Return home, create another match, check Adult, wait for availability, and start.
7. Read the newest snapshot and assert config.packIds includes built-in-adult.
8. Continue the existing complete-match package smoke and cleanup checks.

The unit selector test from Task 4 and single-pack productionSeed tests from Task 5 prove the checked pack supplies both board and Final candidates; packaged smoke proves the production UI persists both choices.

- [ ] **Step 6: Run complete local application verification**

Run:

~~~powershell
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:product-e2e
npm run test:e2e
~~~

Expected: every command exits 0 with no skipped product-gate tests.

- [ ] **Step 7: Run local Windows package acceptance only**

Run:

~~~powershell
npm run make:installer
npm run make:portable
npm run release:checksums
pwsh -NoProfile -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both
pwsh -NoProfile -File scripts/verify-upgrade.ps1 -PackageRoot out/make
~~~

Expected: installer and portable package smoke pass, including the Adult setup assertions, and cleanup leaves no package process tree or test user-data residue. This is local Windows evidence only.

- [ ] **Step 8: Record canonical fresh evidence**

Create docs/superpowers/sdd/2026-08-27-adult-estonia-content/acceptance.md containing:

- the accepted commit SHA;
- hashes and blocking:false status for 13-finals, 14-adult, and 15-estonia reports;
- exact release summary and per-pack SQLite query output;
- the two deterministic temporary seed hashes;
- the accepted resources/content/seed.sqlite hash;
- exact commands, timestamps, and exit codes for verify:content, verify:product, test:e2e, installer/portable smoke, and upgrade verification;
- explicit confirmation that Adult was unchecked initially, excluded from the first packaged match, checked explicitly for the second, and present in the second persisted config;
- explicit statement that no GitHub release workflow was triggered and macOS/Ubuntu artifacts were not refreshed or claimed.

Do not copy an older passing report into this document.

- [ ] **Step 9: Review the final diff and commit acceptance**

Run:

~~~powershell
git status --short
git diff --check
git diff --stat
git log --oneline --decorate -12
~~~

Confirm every changed line traces to catalog, validation, setup, content, seed, packaged acceptance, or evidence. Confirm .github/workflows files and release tags are untouched.

~~~bash
git add resources/content/seed.sqlite content/reports/release-inventory.json content/reports/source-check-cache.json tests/e2e/package-smoke.spec.ts docs/superpowers/sdd/2026-08-27-adult-estonia-content/acceptance.md
git commit -m "test(content): accept Adult and Estonia release inventory"
~~~

- [ ] **Step 10: Run the final clean-tree gate**

Run:

~~~powershell
npm run verify:content
npm run verify:product
git status --short
~~~

Expected: both gates exit 0 and git status is clean. Do not dispatch GitHub Actions after this result.
