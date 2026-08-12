### Task 4: Add timers, Daily Doubles, Final, ties, and reversible host actions

**Files:**
- Modify: `src/shared/game/types.ts`
- Modify: `src/shared/game/events.ts`
- Modify: `src/shared/game/reducer.ts`
- Modify: `src/shared/game/engine.ts`
- Test: `tests/unit/game/timers.test.ts`
- Test: `tests/unit/game/dailyDouble.test.ts`
- Test: `tests/unit/game/final.test.ts`
- Test: `tests/unit/game/recoveryActions.test.ts`

**Interfaces:**
- Consumes: `applyGameCommand` and `GameState` from Task 3.
- Produces: `createCompensatingEvent(events): GameEvent`, `tickTimer(state, now): GameEvent[]`, and complete classic-match transitions.

- [ ] **Step 1: Write failing advanced-rule tests**

Tests must prove:

```ts
expect(maxDailyDoubleWager(scoreMinus400, 'round-one')).toBe(1000);
expect(maxDailyDoubleWager(score2400, 'round-one')).toBe(2400);
expect(finalEligibleTeams(state).map((t) => t.id)).toEqual(['positive-only']);
expect(applyFinalJudgment(1200, 1000, false)).toBe(200);
```

Also test timer pause arithmetic with a fake `now`, 30-second Final duration, lowest-to-highest reveal order, repeated sudden-death clues, required score-adjustment reasons, undo as a compensating event, timer reset, reopening only the most recently closed clue before another selection, and saving an explicitly ended incomplete match.

- [ ] **Step 2: Run tests and observe rule failures**

Run: `npm run test:run -- tests/unit/game/timers.test.ts tests/unit/game/dailyDouble.test.ts tests/unit/game/final.test.ts tests/unit/game/recoveryActions.test.ts`

Expected: FAIL on missing functions and unsupported phases.

- [ ] **Step 3: Implement exact rules from design Sections 8 and 9**

Represent timers as data, not renderer intervals:

```ts
export interface GameTimer {
  durationMs: number;
  remainingMs: number;
  startedAt: number | null;
  status: 'idle' | 'running' | 'paused' | 'expired';
}
```

`tickTimer` emits `TimerExpired` once. `UndoLast` may reverse only the last reversible host action and appends `ActionUndone`; it never deletes prior events.

- [ ] **Step 4: Verify the complete rules engine**

Run: `npm run test:run -- tests/unit/game`

Expected: PASS with explicit tests for wager minimum/maximum boundaries, negative scores, zero-score Final exclusion, tied lowest-score Round Two selection, and no Final-eligible teams.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/game tests/unit/game
git commit -m "feat(game): implement classic wagers and recovery rules"
```

