### Task 13: Implement transactional CSV import and export

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/main/content/csvPacks.ts`
- Create: `src/shared/content/csvColumns.ts`
- Modify: `src/main/ipc/registerIpc.ts`
- Test: `tests/unit/content/csvValidation.test.ts`
- Test: `tests/integration/content/csvRoundTrip.test.ts`

**Interfaces:**
- Consumes: content schemas, validation, repository transactions, and Electron file dialogs.
- Produces: `parsePackCsv(text): ParsedPack`, `validatePack(pack): ValidationIssue[]`, `importPack(options)`, and `exportPack(packId, destination)`.

- [ ] **Step 1: Install pinned CSV libraries**

Run:

```powershell
npm install --save-exact csv-parse@6.8.3 csv-stringify@7.0.2
```

- [ ] **Step 2: Write failing RFC 4180 and transaction tests**

Define the exact ordered columns in `csvColumns.ts`:

```ts
export const CSV_COLUMNS = [
  'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind',
  'round', 'tier', 'difficulty', 'macro_topic', 'category_name_en',
  'category_name_et', 'clue_en', 'clue_et', 'response_en', 'response_et',
  'accepted_variants_en', 'accepted_variants_et', 'explanation_en',
  'explanation_et', 'source_title', 'source_url', 'source_license',
  'source_retrieved_at', 'translation_status', 'enabled',
] as const;
```

Tests must cover quoted commas/newlines, UTF-8 BOM, semicolon variant escaping, duplicate normalized clue text, incomplete five-tier sets, English-only custom packs, Replace Existing, Keep Both, and rollback after one invalid row.

- [ ] **Step 3: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/content/csvValidation.test.ts tests/integration/content/csvRoundTrip.test.ts`

Expected: FAIL because the parser/importer does not exist.

- [ ] **Step 4: Implement parse → validate → preview → commit**

Never write during parse/preview. `Keep Both` generates a new pack ID and rewrites every imported row’s pack ID in memory before one transaction. Export must re-import to byte-equivalent domain records after normalized ordering.

- [ ] **Step 5: Verify round trip and commit**

```powershell
npm run test:run -- tests/unit/content tests/integration/content/csvRoundTrip.test.ts
npm run lint
npm run typecheck
git add package.json package-lock.json src/main/content src/main/ipc src/shared/content tests/unit/content tests/integration/content/csvRoundTrip.test.ts
git commit -m "feat(content): import and export validated CSV packs"
```

