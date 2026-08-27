# Accessible Easy Corpus Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 1,600 remaining legacy easy clues in the original twelve packs, give all 400 easy category sets meaningful bilingual themes, and prove the resulting easy tier is broadly playable, source-backed, structurally unchanged, and compatible with the separate Adult/Estonia work.

**Architecture:** Add a task-specific accessibility pipeline beside the existing 400-question pass. Stable ledgers identify the 320 replacement sets and all 400 title changes; four independent typed banks supply the new clues; a pure apply function validates and transforms in-memory CSV/evidence records before a narrow CLI writes accepted artifacts. Shared tests enforce the contract before parallel authoring begins, and canonical release artifacts remain untouched until the Adult/Estonia branch has been integrated.

**Tech Stack:** TypeScript 6, Node.js 24, Vitest 4, CSV, JSONL evidence, Zod-backed evidence parsing, SQLite verification via the existing content pipeline, PowerShell.

**Spec:** `docs/superpowers/specs/2026-08-28-accessible-easy-corpus-overhaul-design.md`

## Global Constraints

- Preserve the current 6,000 board clues, 1,200 board sets, 400 easy sets, 400 medium sets, 400 hard sets, and 150 Finals during pre-integration work.
- Replace exactly 1,600 legacy easy clue IDs in exactly 320 stable category-set IDs; retain the existing 400 accessible clue facts and IDs unless a separately evidenced defect is found.
- Retitle all 400 easy sets with unique, natural English and Estonian names that describe one coherent theme.
- Preserve pack ID, pack name, content kind, round, difficulty, category-set ID, tier, value semantics, enabled state, row order, and every medium, hard, and Final row byte-for-byte.
- Preserve exactly 100 OpenTDB-inspired evidence records in each original batch by transferring removed inspiration records one-to-one; never fabricate or duplicate an inspiration record.
- Give every category exactly five tiers and five distinct canonical `subjectKey` values.
- Keep tiers 1–3 at household-to-ordinary-pub-trivia level; tiers 4–5 may be more specific but must still use widely recognizable answers.
- Reject raw infobox residue, non-iconic exact dates/numbers, arbitrary measurements/rankings, minor credits or personnel, long answer lists, yes/no prompts, answer leaks, unstable facts, and unsupported origin/national claims.
- Require natural bilingual wording, specific compatible sources, unique fact keys, factual/editorial approval, and reviewed Estonian translations.
- Do not edit `scripts/content/accessibleEasy.ts`, `tests/unit/content/accessibleEasy.test.ts`, Adult/Estonia-owned infrastructure, batches 13–15, the canonical source cache, release inventory, or production seed before branch integration.
- Use `content/work/accessible-easy-overhaul/` for task-local generated reports, cache, seed, snapshots, and review output; do not commit this directory.
- Each authoring agent edits only its assigned bank module. The primary agent owns shared contracts, tests, ledgers, integration, accepted artifacts, and verification.

---

## Shared Contracts

Create these exact public shapes in `scripts/content/accessibility/types.ts`:

```ts
export type LocalizedText = Readonly<{ en: string; et: string }>;

export type AccessibleCategory = Readonly<{
  categorySetId: string;
  batchId: string;
  name: LocalizedText;
  questions: readonly AccessibleQuestion[];
}>;

export type AccessibleQuestion = Readonly<{
  key: string;
  tier: 1 | 2 | 3 | 4 | 5;
  subjectKey: string;
  clue: LocalizedText;
  response: LocalizedText;
  acceptedVariants: Readonly<{ en: readonly string[]; et: readonly string[] }>;
  explanation: LocalizedText;
  source: Readonly<{
    sourceId: string;
    title: string;
    url: string;
    license: string;
    retrievedAt: string;
  }>;
}>;

export type CategoryTitle = Readonly<{
  categorySetId: string;
  batchId: string;
  name: LocalizedText;
}>;

export type AccessibilityReason =
  | 'source-prefix'
  | 'infobox-residue'
  | 'exact-date-or-number'
  | 'numeric-answer'
  | 'long-answer'
  | 'multi-item-answer'
  | 'binary-question'
  | 'generic-category-title';

export type AccessibilityAudit = Readonly<{
  clueReasons: ReadonlyMap<string, readonly AccessibilityReason[]>;
  categoryReasons: ReadonlyMap<string, readonly AccessibilityReason[]>;
  counts: Readonly<Record<AccessibilityReason, number>>;
}>;
```

`scripts/content/accessibility/apply.ts` exports:

```ts
export function applyAccessibleCorpus(input: Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  targetCategorySetIds: ReadonlySet<string>;
  titles: readonly CategoryTitle[];
  categories: readonly AccessibleCategory[];
}>): Readonly<{
  authoredRows: readonly Record<string, string>[];
  generatedRows: readonly Record<string, string>[];
  evidence: readonly ContentEvidence[];
  replacedClueIds: readonly string[];
}>;
```

The function is pure. It must validate the complete proposed result before returning and must not read or write files.

---

### Task 1: Lock the audit contract with failing tests

**Files:**
- Create: `tests/unit/content/accessibilityAudit.test.ts`
- Create: `scripts/content/accessibility/types.ts`
- Create: `scripts/content/accessibility/audit.ts`

- [ ] **Step 1: Write representative failing audit tests**

Test one fixture for every `AccessibilityReason`, including a source-title prefix, infobox parenthesis/date residue, a non-iconic exact-date prompt, a numeric answer, a 40-character answer, a comma/semicolon list answer, a yes/no prompt, and a generic title. Add accessible counterexamples such as `Who painted the Mona Lisa?`, `What is the capital of Finland?`, and the iconic year `When did the Berlin Wall fall?` so detection is not merely number matching.

- [ ] **Step 2: Observe the intended red state**

Run: `npm run test:run -- tests/unit/content/accessibilityAudit.test.ts`

Expected: FAIL because `auditAccessibility` and the shared types do not exist.

- [ ] **Step 3: Implement deterministic signal detection**

Implement `auditAccessibility(rows)` in `audit.ts`. Normalize whitespace only for inspection, attach reasons to stable clue/category IDs, return sorted maps and exact counts, and do not mutate rows. Keep heuristics focused on the approved contract; do not turn the audit into a general natural-language classifier.

- [ ] **Step 4: Prove the focused contract green**

Run: `npm run test:run -- tests/unit/content/accessibilityAudit.test.ts`

Expected: PASS with each bad fixture receiving only its intended reasons and the accessible fixtures remaining unflagged for those reasons.

- [ ] **Step 5: Commit the audit slice**

```powershell
git add scripts/content/accessibility/types.ts scripts/content/accessibility/audit.ts tests/unit/content/accessibilityAudit.test.ts
git commit -m "test(content): define easy accessibility audit"
```

### Task 2: Lock stable targets, titles, and bank validation with failing tests

**Files:**
- Create: `tests/unit/content/accessibleCorpus.test.ts`
- Create: `scripts/content/accessibility/targets.ts`
- Create: `scripts/content/accessibility/categoryNames.ts`
- Create: `scripts/content/accessibility/bank.ts`

- [ ] **Step 1: Write the structural red tests**

Assert that the accepted 01–12 artifacts yield exactly 400 easy set IDs; the target ledger contains exactly 320 of them; the other 80 are the existing accessible sets; and allocation is `26/26/26/26/33/25/25/25/25/25/25/33`. Assert 400 title entries, exact coverage of easy IDs, globally unique normalized English and Estonian names, matching batch IDs, no empty names, and no generic filler title tokens from the spec.

Add bank validation tests using complete five-question fixture categories. They reject a wrong expected category count, missing tier, duplicate tier, duplicate question key, duplicate clue/answer pair, duplicate fact key, duplicate subject in one category, missing bilingual field, answer leak, binary prompt, unstable-source shape, and a category not present in the supplied target ledger.

- [ ] **Step 2: Observe the structural red state**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts`

Expected: FAIL because target/title ledgers and bank aggregation do not exist.

- [ ] **Step 3: Generate and freeze the stable target ledger**

In `targets.ts`, export `ACCESSIBLE_EASY_SET_IDS`, `LEGACY_EASY_TARGETS`, and `LEGACY_EASY_TARGET_IDS`. Derive their literal values once from the current accepted CSVs, then store and validate them as stable data. The runtime apply path must never choose targets by row position or by detecting currently generic text.

- [ ] **Step 4: Author the complete bilingual title ledger**

In `categoryNames.ts`, export exactly 400 `CategoryTitle` values. Give each set one concrete theme and ensure its five clues will fit that theme. Existing 80 accessible sets retain their clues but receive names based on their actual subjects; replacement-set titles define the themes the four banks must fill.

- [ ] **Step 5: Implement bank aggregation and validation**

In `bank.ts`, export `validateAccessibleCorpus(categories, expectedTargets)`. Validate and sort supplied categories by target-ledger order, and fail with stable diagnostics before returning if any shared contract is violated. Task 8 adds `buildAccessibleCorpus()` and the four production-bank imports after every lane exists, so the shared-contract commit stays green without weakening the final 1,600-clue assertion.

- [ ] **Step 6: Prove the ledger and fixture-bank contracts green**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts`

Expected: PASS for target/title ledgers and every valid/invalid fixture-bank case.

- [ ] **Step 7: Commit the shared ledgers**

```powershell
git add scripts/content/accessibility/targets.ts scripts/content/accessibility/categoryNames.ts scripts/content/accessibility/bank.ts tests/unit/content/accessibleCorpus.test.ts
git commit -m "test(content): lock accessible corpus ledgers"
```

### Task 3: Build the pure apply and narrow staging pipeline test-first

**Files:**
- Create: `scripts/content/accessibility/apply.ts`
- Create: `scripts/content/applyAccessibleCorpus.ts`
- Modify: `tests/unit/content/accessibleCorpus.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Add failing transformation tests**

Use minimal in-memory authored/generated/evidence fixtures with two target sets and one retained set. Assert stable slot preservation, deterministic replacement clue IDs, title changes on target and retained easy sets, exact accepted-variant serialization, exact one-to-one transfer of removed OpenTDB inspirations, unchanged non-target rows, unchanged non-inspiration evidence, sorted deterministic evidence, and idempotent results on a second application.

Add abort tests for a missing target, wrong tier count, missing removed evidence, insufficient or duplicate inspiration transfer, duplicate final clue/fact, wrong batch, and any inventory change.

- [ ] **Step 2: Observe the transformation red state**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts -t "applyAccessibleCorpus"`

Expected: FAIL because `applyAccessibleCorpus` does not exist.

- [ ] **Step 3: Implement the pure transformation**

Create deterministic clue IDs in the form `built-in-<pack>-accessible-corpus-<three-digit-sequence>`. Preserve each target row's structural columns while replacing only content/source fields. For authored rows, leave `category_name_et` consistent with the repository's authored-file convention; for generated rows, write both localized names. Build new version-1 evidence with unique fact/subject keys and approved review records, carrying each removed inspiration object exactly once when its original target evidence was OpenTDB-inspired.

- [ ] **Step 4: Implement staging before publishing**

`applyAccessibleCorpus.ts` accepts `--output-root <path>` and defaults to `content/work/accessible-easy-overhaul/staged`; it reads accepted 01–12 artifacts, applies the pure function batch-by-batch, and writes a complete staged authored/generated/evidence tree. Add an explicit `--publish` flag that atomically replaces only `content/authored/01`–`12`, `content/generated/01`–`12`, and `content/evidence/01`–`12` after all twelve batches validate. Do not expose a partial-batch publish mode.

- [ ] **Step 5: Ignore task-local verification artifacts**

Add only `content/work/accessible-easy-overhaul/` to `.gitignore` if the parent `content/work/` pattern does not already cover it.

- [ ] **Step 6: Prove transformation behavior green**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts -t "applyAccessibleCorpus"`

Expected: PASS, including idempotency and exact inspiration preservation.

- [ ] **Step 7: Commit the pipeline slice**

```powershell
git add .gitignore scripts/content/accessibility/apply.ts scripts/content/applyAccessibleCorpus.ts tests/unit/content/accessibleCorpus.test.ts
git commit -m "feat(content): add accessible corpus staging pipeline"
```

### Task 4: Author Art and Mythology bank (parallel lane A)

**Files:**
- Create: `scripts/content/accessibility/banks/artMythology.ts`

**Allocation:** Art & Architecture `33 sets / 165 clues`; Mythology, Religion & Philosophy `33 / 165`; total `66 / 330`.

- [ ] **Step 1: Read only the assigned target/title slices and shared types**

Use the literal target order and titles for batches `05-art-architecture` and `12-mythology-religion-philosophy`. Do not edit shared files or accepted CSV/JSONL artifacts.

- [ ] **Step 2: Author 66 complete themed categories**

Cover recognizable paintings, artists, styles, landmarks, architecture, design, sculpture, Greek/Roman/Norse/Baltic myth, widely known world-religion history and vocabulary, and introductory philosophy. Attribute beliefs to their traditions. Avoid specialist iconography, obscure minor deities, denominational edge cases, dimensions, auction values, and museum inventory facts.

- [ ] **Step 3: Validate the assigned bank**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts -t "Art and Mythology"`

Expected: PASS with 330 questions, 66 target sets, five tiers and subjects per set, complete bilingual/source fields, and no local duplicate fact or clue/answer pair.

- [ ] **Step 4: Commit only the lane file**

```powershell
git add scripts/content/accessibility/banks/artMythology.ts
git commit -m "content(easy): author art and mythology bank"
```

### Task 5: Author Society, Technology, Music, and Sports bank (parallel lane B)

**Files:**
- Create: `scripts/content/accessibility/banks/societyTechnologyCulture.ts`

**Allocation:** Music `25/125`; Sports & Games `25/125`; Technology & Inventions `25/125`; Politics, Economics & Society `25/125`; total `100/500`.

- [ ] **Step 1: Read only the assigned target/title slices and shared types**

Use batches `06`, `08`, `10`, and `11`. Do not edit shared files or accepted artifacts.

- [ ] **Step 2: Author 100 complete themed categories**

Emphasize household 1990s–2010s pop/rock and globally famous music, common instruments, familiar sports rules/events/athletes, classic board and video games, everyday devices and internet concepts, landmark inventions, basic civic institutions, currencies, and introductory economics. Date changing claims. Do not quote lyrics, ask current officeholders/rankings, or depend on minor chart placements, match statistics, model numbers, or patent dates.

- [ ] **Step 3: Validate the assigned bank**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts -t "Society Technology Culture"`

Expected: PASS with 500 questions and all assigned structural/editorial checks green.

- [ ] **Step 4: Commit only the lane file**

```powershell
git add scripts/content/accessibility/banks/societyTechnologyCulture.ts
git commit -m "content(easy): author society technology and culture bank"
```

### Task 6: Author Geography, Science, and Food bank (parallel lane C)

**Files:**
- Create: `scripts/content/accessibility/banks/geographyScienceFood.ts`

**Allocation:** Geography `26/130`; Science & Nature `26/130`; Food & Drink `25/125`; total `77/385`.

- [ ] **Step 1: Read only the assigned target/title slices and shared types**

Use batches `02`, `03`, and `09`. Do not edit shared files or accepted artifacts.

- [ ] **Step 2: Author 77 complete themed categories**

Cover capitals and country recognition, landmarks, seas/rivers/continents, Baltic/Nordic geography, everyday physics/chemistry/biology, the human body, weather, space, familiar animals/plants, common dishes/ingredients/techniques, and international food recognition. Avoid coordinates, heights, nutrition grams, contested dish origins, fragile records, and scientific trivia requiring arbitrary constants.

- [ ] **Step 3: Validate the assigned bank**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts -t "Geography Science Food"`

Expected: PASS with 385 questions and all assigned structural/editorial checks green.

- [ ] **Step 4: Commit only the lane file**

```powershell
git add scripts/content/accessibility/banks/geographyScienceFood.ts
git commit -m "content(easy): author geography science and food bank"
```

### Task 7: Author History, Literature, and Screen bank (parallel lane D)

**Files:**
- Create: `scripts/content/accessibility/banks/historyLiteratureScreen.ts`

**Allocation:** History `26/130`; Literature & Language `26/130`; Film & Television `25/125`; total `77/385`.

- [ ] **Step 1: Read only the assigned target/title slices and shared types**

Use batches `01`, `04`, and `07`. Do not edit shared files or accepted artifacts.

- [ ] **Step 2: Author 77 complete themed categories**

Cover landmark eras/events/figures, broad European and world history, familiar Estonian/Baltic touchpoints, classic and popular books/authors/characters, basic language knowledge, globally famous films/series/animation, and mainstream 1990s–2010s screen culture. Use iconic dates sparingly and avoid minor cast, episode titles, crew credits, publication metadata, and dialogue quotation.

- [ ] **Step 3: Validate the assigned bank**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts -t "History Literature Screen"`

Expected: PASS with 385 questions and all assigned structural/editorial checks green.

- [ ] **Step 4: Commit only the lane file**

```powershell
git add scripts/content/accessibility/banks/historyLiteratureScreen.ts
git commit -m "content(easy): author history literature and screen bank"
```

### Task 8: Integrate and review the complete 2,000-clue easy tier

**Files:**
- Modify: `scripts/content/accessibility/bank.ts`
- Modify: `scripts/content/accessibility/categoryNames.ts`
- Modify: the four `scripts/content/accessibility/banks/*.ts` files only where review finds a concrete defect
- Modify: `tests/unit/content/accessibleCorpus.test.ts`

- [ ] **Step 1: Run the complete bank contract**

Run: `npm run test:run -- tests/unit/content/accessibleCorpus.test.ts`

Expected: PASS with exactly 320 categories, 1,600 new questions, the approved per-pack allocation, 400 title entries, unique global keys/facts/clue-answer pairs, and five unique subjects per category.

- [ ] **Step 2: Run a deterministic global review report**

Add assertions or a task-local report for the final 2,000 easy clues: normalized duplicate clue/answer pairs, duplicate fact keys, answer leaks in clue/title, repeated subjects within a set, binary prompts, long/list answers, date/number metadata patterns, untranslated identical prose outside proper nouns, and banned generic titles. Review every flagged line and change only confirmed defects.

- [ ] **Step 3: Perform bilingual editorial sampling across every category**

Review all 400 titles and at least the tier-1 and tier-5 clue from every category, plus every automatically flagged clue. Confirm the Estonian is idiomatic, answers use customary Estonian forms, accepted variants cover common English/Estonian alternatives, and tier progression is fair.

- [ ] **Step 4: Re-run all focused tests and type checking**

```powershell
npm run test:run -- tests/unit/content/accessibilityAudit.test.ts tests/unit/content/accessibleCorpus.test.ts tests/unit/content/accessibleEasy.test.ts
npm run typecheck
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit integration corrections**

```powershell
git add scripts/content/accessibility tests/unit/content/accessibilityAudit.test.ts tests/unit/content/accessibleCorpus.test.ts
git commit -m "content(easy): integrate accessible corpus banks"
```

### Task 9: Stage, inspect, and publish original batches 01–12

**Files:**
- Modify: `content/authored/01-history.csv` through `12-mythology-religion-philosophy.csv`
- Modify: `content/generated/01-history.en-et.csv` through `12-mythology-religion-philosophy.en-et.csv`
- Modify: `content/evidence/01-history.jsonl` through `12-mythology-religion-philosophy.jsonl`

- [ ] **Step 1: Produce a clean staged tree**

Run: `npx tsx scripts/content/applyAccessibleCorpus.ts --output-root content/work/accessible-easy-overhaul/staged`

Expected: exit `0`; twelve complete authored, generated, and evidence artifacts are written under the staging root; accepted files remain unchanged.

- [ ] **Step 2: Compare staged structure with accepted structure**

Verify exact row counts/order/structural fields, 1,600 replaced IDs, 400 retained accessible IDs, zero legacy easy IDs, all 400 title changes, unchanged medium/hard/Final hashes, and exactly 100 OpenTDB evidence records per original batch. Fail on any unexpected diff.

- [ ] **Step 3: Validate staged artifacts with task-local outputs**

```powershell
npm run content:validate -- --input "content/work/accessible-easy-overhaul/staged/generated/*.en-et.csv" --evidence "content/work/accessible-easy-overhaul/staged/evidence/*.jsonl" --mode release --report content/work/accessible-easy-overhaul/release-inventory.json
npm run content:source-check -- --input "content/work/accessible-easy-overhaul/staged/generated/*.en-et.csv" --report content/work/accessible-easy-overhaul/release-inventory.json --source-cache content/work/accessible-easy-overhaul/source-check-cache.json
```

Expected: both exit `0` with 6,000 board clues, 1,200 sets, 2,000 easy clues, and no blocking evidence/source/content issue.

- [ ] **Step 4: Publish atomically after staged validation**

Run: `npx tsx scripts/content/applyAccessibleCorpus.ts --output-root content/work/accessible-easy-overhaul/staged --publish`

Expected: exit `0` after replacing only the 36 accepted 01–12 artifacts.

- [ ] **Step 5: Re-run accepted-file focused tests**

Run: `npm run test:run -- tests/unit/content/accessibilityAudit.test.ts tests/unit/content/accessibleCorpus.test.ts tests/unit/content/accessibleEasy.test.ts`

Expected: PASS from the accepted artifacts.

- [ ] **Step 6: Commit accepted corpus artifacts**

```powershell
git add content/authored/0*.csv content/authored/1[0-2]-*.csv content/generated/0*.csv content/generated/1[0-2]-*.csv content/evidence/0*.jsonl content/evidence/1[0-2]-*.jsonl
git commit -m "content(easy): publish accessible original corpus"
```

### Task 10: Prove the pre-integration 6,000-board-clue result

**Files:** No committed canonical report/cache/seed changes.

- [ ] **Step 1: Run the complete content test surface**

```powershell
npm run test:run -- tests/unit/content tests/integration/content
npm run typecheck
npm run lint
```

Expected: every command exits `0`. If a repository-wide failure is unrelated, capture its exact output and prove the changed content surface with a focused rerun; do not label an in-scope failure unrelated.

- [ ] **Step 2: Validate and source-check accepted 01–13 inputs into task-local outputs**

```powershell
npm run content:validate -- --input "content/generated/0*.en-et.csv" "content/generated/1[0-3]-*.en-et.csv" --evidence "content/evidence/0*.jsonl" "content/evidence/1[0-3]-*.jsonl" --mode release --report content/work/accessible-easy-overhaul/release-inventory.json
npm run content:source-check -- --input "content/generated/0*.en-et.csv" "content/generated/1[0-3]-*.en-et.csv" --report content/work/accessible-easy-overhaul/release-inventory.json --source-cache content/work/accessible-easy-overhaul/source-check-cache.json
```

Expected: exit `0`, exact 6,000/1,200/150 inventory, exact difficulty/round allocation, and 100 OpenTDB-inspired clues in each original batch.

- [ ] **Step 3: Build twice and compare task-local seed hashes**

```powershell
npm run content:build-seed -- --input "content/generated/0*.en-et.csv" "content/generated/1[0-3]-*.en-et.csv" --evidence "content/evidence/0*.jsonl" "content/evidence/1[0-3]-*.jsonl" --output content/work/accessible-easy-overhaul/seed.sqlite --report content/work/accessible-easy-overhaul/release-inventory.json
$accessibleSeedHash1 = (Get-FileHash -Algorithm SHA256 -LiteralPath 'content/work/accessible-easy-overhaul/seed.sqlite').Hash
npm run content:build-seed -- --input "content/generated/0*.en-et.csv" "content/generated/1[0-3]-*.en-et.csv" --evidence "content/evidence/0*.jsonl" "content/evidence/1[0-3]-*.jsonl" --output content/work/accessible-easy-overhaul/seed.sqlite --report content/work/accessible-easy-overhaul/release-inventory.json
$accessibleSeedHash2 = (Get-FileHash -Algorithm SHA256 -LiteralPath 'content/work/accessible-easy-overhaul/seed.sqlite').Hash
if ($accessibleSeedHash1 -ne $accessibleSeedHash2) { throw "Task-local seed hashes differ" }
```

Expected: both builds exit `0` and hashes match.

- [ ] **Step 4: Verify task-local SQLite readback**

Run the existing seed verifier against `content/work/accessible-easy-overhaul/seed.sqlite` and the task-local report/cache paths. Assert `integrity_check=ok`, exact inventory, one English/Estonian easy clue per pack/tier edge, and parseable source citations.

- [ ] **Step 5: Inspect the final working-tree diff**

```powershell
git status --short
git diff --check
git diff --stat HEAD~1 HEAD
```

Expected: no uncommitted generated artifact, no canonical cache/report/seed change, and only the planned accessibility code/tests/docs plus 36 original content artifacts in the completed commit range.

### Task 11: Reconcile after Adult/Estonia integration and run canonical acceptance

**Prerequisite:** The `feat/adult-estonia-content` branch has completed its Adult accessibility findings, Estonia `500/500` authoring/review, accepted 15-pack inventory, and its own tests. Integrate that branch before this task; do not overwrite its dirty source cache or `.learnings` content.

**Files:**
- Modify only if required by the integrated schema: `scripts/content/accessibility/apply.ts`, `tests/unit/content/accessibleCorpus.test.ts`
- Rebuild through integrated commands: `content/reports/source-check-cache.json`, `content/reports/release-inventory.json`, `resources/content/seed.sqlite`

- [ ] **Step 1: Rebase or merge and resolve ownership deliberately**

Keep the Adult/Estonia versions of production batch definitions, release thresholds, evidence schema, validators, seed builders, Adult runtime/setup code, and batches 13–15. Keep this branch's title/target ledgers, four banks, apply pipeline, tests, and original 01–12 data content. Reconcile the new evidence produced for 01–12 to the final integrated schema without reducing review requirements.

- [ ] **Step 2: Re-run the accessible corpus contracts on the combined tree**

```powershell
npm run test:run -- tests/unit/content/accessibilityAudit.test.ts tests/unit/content/accessibleCorpus.test.ts tests/unit/content/accessibleEasy.test.ts
npm run typecheck
```

Expected: all exit `0`; original 400 retained accessible clues and exact OpenTDB quotas still hold.

- [ ] **Step 3: Build the canonical integrated inventory once**

Run the integrated release validator and source checker over all accepted generated/evidence artifacts, writing the canonical `release-inventory.json` and `source-check-cache.json` only after the combined in-memory/staged validation passes.

Expected: 7,000 board clues, 1,400 board sets, 174 Finals, 15 built-in packs, exact per-pack/difficulty/round allocations, zero cross-pack duplicate facts/clue-answer pairs, and no blocking source/evidence/translation issue.

- [ ] **Step 4: Build twice and verify the canonical seed**

Run `npm run content:build-seed` twice for `resources/content/seed.sqlite`, compare SHA-256 hashes, then run `npm run verify:content` and the integrated production-seed tests.

Expected: identical hashes, SQLite integrity/readback pass, Adult unchecked by default and excluded when unchecked, Estonia default-selected, and original easy content available in both languages.

- [ ] **Step 5: Run full application and packaged acceptance**

```powershell
npm run verify:product
npm run test:e2e
npm run make:installer
npm run make:portable
pwsh -NoProfile -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both
pwsh -NoProfile -File scripts/verify-upgrade.ps1 -PackageRoot out/make
```

Expected: all commands exit `0`; packaged installer and portable app show the integrated content with no runtime network dependency or leftover Quiz Stage process/data residue from smoke runs.

- [ ] **Step 6: Commit only verified integrated artifacts and compatibility fixes**

```powershell
git add content/reports/source-check-cache.json content/reports/release-inventory.json resources/content/seed.sqlite scripts/content/accessibility/apply.ts tests/unit/content/accessibleCorpus.test.ts
git commit -m "content(seed): integrate accessible and Estonia corpora"
```

Omit `apply.ts` and its test from the commit if no schema compatibility change was required.

## Completion Gate

Do not mark this plan complete until Tasks 1–10 pass on the original corpus and Task 11 passes after Adult/Estonia integration. Completion means all 1,600 legacy easy clues are gone, all 400 easy categories have meaningful bilingual themes, the 2,000-clue easy tier satisfies the approved accessibility and evidence contract, the combined 7,000-board-clue/174-Final seed is deterministic and verified, and packaged acceptance exercises the integrated result.
