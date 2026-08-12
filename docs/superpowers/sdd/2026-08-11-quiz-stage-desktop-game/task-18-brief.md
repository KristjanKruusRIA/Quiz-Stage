### Task 18: Verify the durable-product milestone

**Files:**
- Create: `tests/e2e/durable-product.spec.ts`
- Create: `tests/integration/security/offlineRenderer.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: all Milestone 1–2 features.
- Produces: `npm run verify:product`, the gate required before production content work.

- [ ] **Step 1: Add a failing cross-feature scenario**

The scenario must create an Estonian custom pack, start an 8-team hard match in dual-window simulation, report one clue, adjust a score with a reason, undo a later judgment, kill/restart/resume, complete Final, verify History, and export/re-import the pack.

- [ ] **Step 2: Add the offline renderer assertion**

Intercept Electron session requests and fail on any URL whose scheme is not the packaged custom protocol or Vite’s localhost development URL when `NODE_ENV !== 'production'`.

- [ ] **Step 3: Run the cross-feature scenario**

Run: `npx playwright test tests/e2e/durable-product.spec.ts`

Expected: PASS. If any assertion fails, stop the milestone gate, make only the smallest correction supported by that failure, rerun the single case, then rerun the complete scenario.

- [ ] **Step 4: Run the full milestone gate**

Define `verify:product` as lint + typecheck + all unit/integration tests + build + Milestone 1–2 E2E. Run: `npm run verify:product`.

Expected: exit 0 with no skipped tests and no unexpected network request.

- [ ] **Step 5: Commit**

```powershell
git add package.json src tests/e2e/durable-product.spec.ts tests/integration/security
git commit -m "test: verify durable offline game product"
```

## Milestone 3: Production bilingual content

