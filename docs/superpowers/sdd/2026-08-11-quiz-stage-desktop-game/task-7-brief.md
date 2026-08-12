### Task 7: Build a development seed and content service

**Files:**
- Modify: `package.json`
- Create: `src/main/content/contentRepository.ts`
- Create: `src/main/content/contentService.ts`
- Create: `src/shared/content/schema.ts`
- Create: `scripts/content/build-dev-seed.ts`
- Create: `tests/fixtures/dev-content.json`
- Test: `tests/integration/content/contentService.test.ts`

**Interfaces:**
- Consumes: `selectMatchContent`, database connection, and content domain records.
- Produces: `ContentRepository`, `ContentService.checkAvailability(config)`, `ContentService.selectForMatch(config, seed)`, and a deterministic `resources/content/dev-seed.sqlite` for development/tests.

- [ ] **Step 1: Write failing service tests**

Create fixture data containing exactly 12 category sets and one Final per difficulty, five tiers per set, both languages, and source metadata. Assert:

```ts
expect(service.checkAvailability(mediumEnglish).ok).toBe(true);
expect(service.selectForMatch(mediumEnglish, 'seed').roundOne.categories).toHaveLength(6);
expect(service.checkAvailability(estonianWithMissingTranslation)).toEqual({
  ok: false, roundOneMissing: 1, roundTwoMissing: 0, finalMissing: 0,
});
```

- [ ] **Step 2: Run the tests and observe failure**

Run: `npm run test:run -- tests/integration/content/contentService.test.ts`

Expected: FAIL because content services and the seed do not exist.

- [ ] **Step 3: Implement schema, seed builder, and read service**

Use one `LocalizedText` object for `en` and `et`, validate all persisted records with Zod, and keep SQL row mapping inside `contentRepository.ts`. `build-dev-seed.ts` must delete only its explicit output file, create a new database, run migrations, and import the fixture transactionally.

- [ ] **Step 4: Build and verify the dev seed**

Run:

```powershell
npm run content:build-dev-seed
npm run test:run -- tests/integration/content/contentService.test.ts
```

Expected: the seed script reports `183 clues, 36 category sets, 3 Finals`; tests pass.

- [ ] **Step 5: Commit**

```powershell
git add package.json src/main/content src/shared/content scripts/content tests/fixtures/dev-content.json tests/integration/content
git commit -m "feat(content): add validated development library"
```

