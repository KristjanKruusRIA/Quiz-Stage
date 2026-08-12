### Task 5: Build deterministic balanced board selection

**Files:**
- Create: `src/shared/game/boardSelector.ts`
- Create: `tests/fixtures/contentFactory.ts`
- Test: `tests/unit/game/boardSelector.test.ts`

**Interfaces:**
- Consumes: `Clue`, `Board`, and `GameConfig` from Task 2.
- Produces: `selectMatchContent(input: SelectionInput): SelectedMatchContent`, `selectNextTiebreakerClue(input, excludedIds, tieIndex): FinalClue`, and deterministic `createSeededRandom(seed): () => number`.

- [ ] **Step 1: Write failing selection tests**

```ts
it('selects 12 unique names, balanced macro topics, and one Final', () => {
  const result = selectMatchContent(selectionInput({ seed: 'fixed-seed' }));
  expect(new Set(result.categorySets.map((set) => set.name.en)).size).toBe(12);
  for (const board of [result.roundOne, result.roundTwo]) {
    expect(maxMacroTopicCount(board)).toBeLessThanOrEqual(2);
  }
  expect(result.final.difficulty).toBe('medium');
});

it('prefers unseen then least-recently used sets', () => {
  const result = selectMatchContent(selectionInputWithHistory());
  expect(result.categorySets.map((set) => set.id)).toEqual(expectedLeastRecentIds);
});
```

Add shortage tests that return exact `roundOneMissing`, `roundTwoMissing`, and `finalMissing` counts without partially creating a match.

Add a tiebreaker test proving each tie index deterministically selects a previously unused Final-eligible clue and persists that selected clue before it is shown.

- [ ] **Step 2: Run the test and observe failure**

Run: `npm run test:run -- tests/unit/game/boardSelector.test.ts`

Expected: FAIL because `selectMatchContent` is missing.

- [ ] **Step 3: Implement filtering, ranking, and seeded choice**

Filter by enabled pack, language completeness, match difficulty, round, exactly five tiers, and enabled status. Rank unseen sets first, then ascending `lastSeenAt`, and seeded-shuffle only equal-ranked candidates. Place one/two Daily Doubles after board selection and omit their IDs from `PublicGameView` until opened.

- [ ] **Step 4: Verify deterministic behavior and invariants**

Run: `npm run test:run -- tests/unit/game/boardSelector.test.ts --reporter=verbose`

Expected: PASS; running twice with the same seed produces byte-equivalent selected content.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/game/boardSelector.ts tests/fixtures/contentFactory.ts tests/unit/game/boardSelector.test.ts
git commit -m "feat(game): select balanced deterministic boards"
```

