### Task 19: Create the production content validator and release inventory gate

**Files:**
- Create: `scripts/content/validate.ts`
- Create: `scripts/content/readCsv.ts`
- Create: `scripts/content/releaseThresholds.ts`
- Create: `scripts/content/sourceCheck.ts`
- Create: `content/reports/.gitkeep`
- Modify: `package.json`
- Test: `tests/unit/content/productionValidator.test.ts`
- Test: `tests/fixtures/content-invalid/missing-tier.csv`
- Test: `tests/fixtures/content-invalid/duplicate-id.csv`
- Test: `tests/fixtures/content-invalid/duplicate-text.csv`
- Test: `tests/fixtures/content-invalid/duplicate-category.csv`
- Test: `tests/fixtures/content-invalid/invalid-round.csv`
- Test: `tests/fixtures/content-invalid/missing-source.csv`
- Test: `tests/fixtures/content-invalid/undated-changing-fact.csv`
- Test: `tests/fixtures/content-invalid/missing-translation.csv`
- Test: `tests/fixtures/content-invalid/number-drift.csv`
- Test: `tests/fixtures/content-invalid/release-shortage.csv`

**Interfaces:**
- Consumes: shared content schema and `CSV_COLUMNS`.
- Produces: CLI `npm run content:validate -- --input <glob> --mode batch|release [--allow-missing-et] --report <path>` and `npm run content:source-check -- --input <file>` with exit 0 only when no blocking issue exists.

- [ ] **Step 1: Install the pinned build-time glob dependency**

Run: `npm install --save-dev --save-exact glob@13.0.6`

Expected: package and lockfile contain `glob` only as a development dependency.

- [ ] **Step 2: Write failing validator tests**

Fixtures must independently trigger: missing tier, duplicate ID, duplicate normalized clue, duplicate category name, invalid difficulty/round, missing source, time-sensitive wording without an explicit date, missing translation, number mismatch between languages, 12-category shortage, and each release inventory shortage.

```ts
expect(validateRelease(validRecords).summary).toEqual({
  boardClues: 6000, categorySets: 1200, distinctCategoryNames: 1200,
  finalClues: 150, easySets: 400, mediumSets: 400, hardSets: 400,
});
```

- [ ] **Step 3: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/content/productionValidator.test.ts`

Expected: FAIL because the production validator does not exist.

- [ ] **Step 4: Implement deterministic validation**

Sort every issue by file, row, code, and message. Treat the approved release thresholds as constants. Add warning codes for unchanged translations and suspicious proper-noun changes; warnings do not affect exit code unless promoted in `--mode release` by an unreviewed exception. Report writes must atomically merge a `validation` property into an existing JSON report rather than erase other report sections.

`sourceCheck.ts` must validate HTTPS URLs, reject official-show clue-archive hosts, cache successful checks by URL, use a descriptive User-Agent with bounded concurrency/backoff, and support Wikidata entity batching. It records status and retrieval time without copying page text.

- [ ] **Step 5: Verify machine-readable reports**

Run:

```powershell
npm run test:run -- tests/unit/content/productionValidator.test.ts
npm run content:validate -- --input "tests/fixtures/content-invalid/*.csv" --mode batch --report content/reports/invalid-fixture.json
```

Expected: the test passes; the CLI exits nonzero and the report contains every expected issue code in stable order.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json scripts/content content/reports/.gitkeep tests/unit/content/productionValidator.test.ts tests/fixtures/content-invalid
git commit -m "build(content): enforce production inventory gates"
```

