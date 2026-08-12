### Task 3: Implement ordinary clue and round transitions

**Files:**
- Create: `src/shared/game/reducer.ts`
- Create: `src/shared/game/engine.ts`
- Test: `tests/unit/game/ordinaryPlay.test.ts`
- Test: `tests/unit/game/roundTransitions.test.ts`

**Interfaces:**
- Consumes: domain types and `GameCommand` from Task 2.
- Produces: `createGame(config, selectedBoards, now): GameState` and `applyGameCommand(state, command): { state: GameState; events: GameEvent[] }`.

- [ ] **Step 1: Write failing ordinary-play tests**

Cover these exact assertions:

```ts
it('adds value and transfers control after a correct response', () => {
  const opened = selectFixtureClue(game, 'r1-c1-600');
  const locked = command(opened, { type: 'LockTeam', teamId: 't2', at: 1000 });
  const judged = command(locked, { type: 'JudgeResponse', correct: true, at: 1100 });
  expect(scoreOf(judged, 't2')).toBe(600);
  expect(judged.controllingTeamId).toBe('t2');
});

it('subtracts value, locks the team out, and preserves remaining time', () => {
  const judged = openLockAndJudge(game, 'r1-c1-400', 't1', false);
  expect(scoreOf(judged, 't1')).toBe(-400);
  expect(judged.activeClue?.lockedOutTeamIds).toContain('t1');
  expect(judged.timer.remainingMs).toBeGreaterThan(0);
});
```

Add round tests for the 200–1,000 and 400–2,000 value ladders, random initial control, and lowest-score Round Two control.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `npm run test:run -- tests/unit/game/ordinaryPlay.test.ts tests/unit/game/roundTransitions.test.ts`

Expected: FAIL because the engine functions do not exist.

- [ ] **Step 3: Implement the smallest state machine that passes**

Use explicit phases:

```ts
export type GamePhase =
  | 'round-one-board' | 'ordinary-clue' | 'round-two-board'
  | 'daily-double-wager' | 'daily-double-clue'
  | 'final-category' | 'final-wagers' | 'final-clue'
  | 'final-reveal' | 'tiebreaker' | 'complete';
```

Reject illegal commands with a typed `GameRuleError`; never silently coerce a command into another phase.

- [ ] **Step 4: Verify ordinary play and both round transitions**

Run: `npm run test:run -- tests/unit/game/ordinaryPlay.test.ts tests/unit/game/roundTransitions.test.ts`

Expected: all tests pass; add explicit coverage for no-correct-answer control retention and all-teams-locked response reveal.

- [ ] **Step 5: Run checks and commit**

```powershell
npm run lint
npm run typecheck
npm run test:run -- tests/unit/game
git add src/shared/game tests/unit/game
git commit -m "feat(game): add ordinary play and round flow"
```

