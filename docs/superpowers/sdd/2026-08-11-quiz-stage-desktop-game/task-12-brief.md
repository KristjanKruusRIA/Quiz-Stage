### Task 12: Add local content overrides and clue reporting

**Files:**
- Modify: `src/main/content/contentRepository.ts`
- Modify: `src/main/content/contentService.ts`
- Modify: `src/main/coordinator/gameCoordinator.ts`
- Modify: `src/shared/content/schema.ts`
- Create: `src/shared/content/validation.ts`
- Test: `tests/integration/content/overrides.test.ts`
- Test: `tests/integration/content/reportClue.test.ts`

**Interfaces:**
- Consumes: `ReportClue` command, content tables, and board eligibility rules.
- Produces: `ContentRepository.saveOverride`, `reportClue`, `resolveReport`, `listReported`, and merged reads where a local override wins over a bundled record.

- [ ] **Step 1: Write failing override/report tests**

```ts
it('disables a reported clue for future selection but not the current match', () => {
  coordinator.dispatch({ type: 'ReportClue', clueId, reason: 'Incorrect date' });
  expect(coordinator.hostView().activeClue?.id).toBe(clueId);
  expect(contentService.isEligible(clueId)).toBe(false);
});

it('keeps a bundled correction across seed upgrades', () => {
  repository.saveOverride(correctedClue);
  repository.replaceBundledSeed(newSeed);
  expect(repository.getClue(correctedClue.id)?.response.en).toBe('Corrected');
});
```

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/integration/content/overrides.test.ts tests/integration/content/reportClue.test.ts`

Expected: FAIL because overrides/reports are not implemented.

- [ ] **Step 3: Implement merged content reads and reports**

Store user changes as field-complete override JSON keyed by stable clue ID. Disable reports immediately in the same transaction as the report record. Re-enable only after an explicit corrected override or Resolve Without Change action.

- [ ] **Step 4: Verify board selection respects reports**

Run: `npm run test:run -- tests/integration/content tests/unit/game/boardSelector.test.ts`

Expected: all pass; reported IDs never appear in newly selected boards.

- [ ] **Step 5: Commit**

```powershell
git add src/main/content src/main/coordinator src/shared/content tests/integration/content
git commit -m "feat(content): preserve overrides and report bad clues"
```

