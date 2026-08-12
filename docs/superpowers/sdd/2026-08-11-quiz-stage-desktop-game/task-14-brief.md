### Task 14: Build the bilingual Content Library editor

**Files:**
- Create: `src/renderer/features/content/ContentLibraryScreen.tsx`
- Create: `src/renderer/features/content/PackList.tsx`
- Create: `src/renderer/features/content/CategorySetEditor.tsx`
- Create: `src/renderer/features/content/FinalClueEditor.tsx`
- Create: `src/renderer/features/content/ImportPreview.tsx`
- Create: `src/renderer/features/content/ValidationPanel.tsx`
- Modify: `src/renderer/api/desktopApi.ts`
- Test: `tests/unit/renderer/content/ContentLibraryScreen.test.tsx`
- Test: `tests/unit/renderer/content/CategorySetEditor.test.tsx`
- Test: `tests/unit/renderer/content/ImportPreview.test.tsx`
- Test: `tests/e2e/content-editor.spec.ts`

**Interfaces:**
- Consumes: content CRUD, reports, import/export, and validation issues from Tasks 12–13.
- Produces: side-by-side English/Estonian editing, category-set completeness UI, report resolution, and import/export flows.

- [ ] **Step 1: Write failing editor tests**

Tests must prove bundled edits save as overrides, custom packs edit directly, reported clues sort first, missing Estonian fields block Estonian eligibility but not English eligibility, five tiers are visible together, and invalid imports show every row-level error before a write.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/renderer/content`

Expected: FAIL because editor components do not exist.

- [ ] **Step 3: Implement focused editor screens**

Keep one category set per edit form. Display source URL/license and translation status beside the clue. Save through schema-validated main-process commands; never persist draft state directly from React.

- [ ] **Step 4: Verify editor E2E**

Run: `npx playwright test tests/e2e/content-editor.spec.ts`

Expected: create a custom pack, add a complete five-tier bilingual set, export it, delete it, re-import it, report/correct/re-enable one clue, and confirm it becomes selectable.

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/features/content src/renderer/api tests/unit/renderer/content tests/e2e/content-editor.spec.ts
git commit -m "feat(ui): add bilingual content editor"
```

