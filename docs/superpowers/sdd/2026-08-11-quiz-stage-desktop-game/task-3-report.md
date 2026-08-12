# Task 3 report: ordinary clue and round transitions

## Implementation

- Added `createGame(config, selectedBoards, now)` with an explicit, fixture-friendly selected-board input containing only the seed, boards, hidden Daily Double IDs, and optional Final clue.
- Added an ordinary-play reducer and engine transition wrapper. The implemented command surface is limited to `SelectClue`, `LockTeam`, `JudgeResponse`, and `RevealResponse`; every other command and every illegal ordinary-play transition throws `GameRuleError`.
- Implemented correct/incorrect scoring, team lockout, response reveal after all teams are locked out, correct-response control transfer, no-correct-answer control retention, and Round One/Two progression.
- Added persisted `GameTimer` state and `ActiveClue.lockedTeamId`, with matching strict IPC-state validation and backward-compatible defaults for pre-field snapshots. Timer completion/expiration and host timer controls remain for Task 4.

## Files

- `src/shared/game/engine.ts`
- `src/shared/game/reducer.ts`
- `src/shared/game/types.ts`
- `src/shared/ipc/contracts.ts`
- `tests/unit/game/ordinaryPlay.test.ts`
- `tests/unit/game/roundTransitions.test.ts`
- `tests/unit/game/contracts.test.ts`

## RED

Command:

```powershell
npm run test:run -- tests/unit/game/ordinaryPlay.test.ts tests/unit/game/roundTransitions.test.ts
```

Output (exit 1):

```text
FAIL  tests/unit/game/ordinaryPlay.test.ts
FAIL  tests/unit/game/roundTransitions.test.ts
Error: Cannot find module '../../../src/shared/game/engine'
Test Files  2 failed (2)
Tests  no tests
```

The expected failure was caused by the missing engine module.

## GREEN

Command:

```powershell
npm run test:run -- tests/unit/game/ordinaryPlay.test.ts tests/unit/game/roundTransitions.test.ts
```

Output (exit 0):

```text
Test Files  2 passed (2)
Tests  9 passed (9)
```

## Mutation check

The phase guard for selecting a second clue was temporarily changed to return the unchanged state instead of throwing. The focused ordinary-play test failed as intended:

```text
FAIL  ordinary clue play > rejects selecting a second clue before the active clue resolves
AssertionError: expected function to throw an error, but it didn't
Test Files  1 failed (1)
Tests  1 failed | 4 passed (5)
```

The guard was restored before final verification.

## Review fixes

An independent read-only review identified three in-scope issues. They were addressed before final verification:

- Ordinary-play event IDs now include the pre-transition clue state plus the concrete command/timestamp, and a regression test proves two successive `LockTeam` actions receive distinct IDs.
- The strict persisted schema accepts same-version snapshots from before these two new fields, defaulting a missing `lockedTeamId` to `null` and a missing timer to the configured full clue duration.
- Round fixtures now model both complete six-category, five-clue boards; the Round One transition plays all 30 clues before asserting Round Two control.

The reviewer also noted that exact first-lock elapsed-time arithmetic is impossible with the intentionally unchanged Task 2 `SelectClue` shape, which has no timestamp. The parent decision was to retain that exact shape and defer `startedAt`/elapsed/tick semantics to Task 4. This task therefore initializes the persisted timer to its configured full duration and preserves a positive remaining duration after an incorrect judgment, as required by the task brief.

The two review-fix tests were first observed failing:

```text
FAIL  loads a prior snapshot with the new timer and active-lock defaults
FAIL  emits distinct event IDs for successive ordinary-play commands
Test Files  2 failed | 1 passed (3)
Tests  2 failed | 12 passed (14)
```

After the fixes, the same focused command passed with 14 tests.

## Verification

```powershell
npm run lint
```

```text
> eslint .
```

Exit 0.

```powershell
npm run typecheck
```

```text
> tsc --noEmit
```

Exit 0.

```powershell
npm run test:run -- tests/unit/game
```

```text
Test Files  3 passed (3)
Tests  14 passed (14)
```

Exit 0.

`git diff --check` exited 0; it emitted only existing line-ending conversion warnings for three edited tracked files.

## Self-review

- `SelectClue` is legal only in the active board phase, targets an unused clue in that board, and refuses Daily Doubles until the later task owns their flow.
- `LockTeam` requires an unlocked eligible team and a running timer; `JudgeResponse` requires the currently locked team. Commands are never reinterpreted as another phase action.
- Correct answers add the clue value and transfer control. Incorrect answers subtract the same value, persist lockout, and restart the timer with the remaining duration. A no-answer reveal and all-team lockout preserve prior board control.
- Completing every Round One clue moves to Round Two and deterministically selects among the lowest-scoring teams with the persisted seed. Completing Round Two moves to the Final-category phase without implementing Final play.
- The timer and active-lock fields are canonical `GameState` data. Strict schema output always includes them while legacy same-version snapshot input is defaulted safely.
- An independent review was completed; all three in-scope findings were fixed, while the timestamp limitation was explicitly deferred by parent decision to Task 4.
- No Daily Double, Final, undo, persistence, networking, or UI behavior was implemented.

## Concerns

No unresolved concerns. The timer has only the full-duration state seam and incorrect-judgment preservation required here; `startedAt` arithmetic, ticking, expiration, reset, and host controls remain explicitly deferred to Task 4 by the explicit parent decision.

## Fix Round 1

### Implementation

- Added a tied-lowest Round Two test that resolves all Round One clues without score changes and asserts the persisted `round-flow-seed` selects `t2` deterministically.
- Added a complete Double Round regression that resolves all 60 board clues and asserts the engine enters `final-category` only after the final Double Round clue.
- Added the timer invariant `remainingMs <= durationMs` to the persisted timer schema and a rejection test for an impossible snapshot.

### RED

The new persisted-timer regression exposed the missing invariant:

```powershell
npm run test:run -- tests/unit/game/roundTransitions.test.ts tests/unit/game/contracts.test.ts
```

```text
FAIL  IPC contracts > rejects persisted timer state with more remaining time than its duration
AssertionError: expected true to be false
Test Files  1 failed | 1 passed (2)
Tests  1 failed | 10 passed (11)
```

The tied-lowest and Double Round transition logic already existed but lacked coverage. Each new regression was independently mutation-tested:

```powershell
npm run test:run -- tests/unit/game/roundTransitions.test.ts
```

With seeded tie-breaking temporarily replaced by first-candidate selection:

```text
FAIL  breaks a tied-lowest Round Two start with the persisted seed
Expected: "t2"
Received: "t1"
Test Files  1 failed (1)
Tests  1 failed | 5 passed (6)
```

With the completed Double Round temporarily left in `round-two-board`:

```text
FAIL  moves to the Final category after every Double Round clue resolves
Expected: "final-category"
Received: "round-two-board"
Test Files  1 failed (1)
Tests  1 failed | 5 passed (6)
```

Both mutations were restored immediately.

### GREEN and final verification

```powershell
npm run test:run -- tests/unit/game/roundTransitions.test.ts tests/unit/game/contracts.test.ts
```

```text
Test Files  2 passed (2)
Tests  11 passed (11)
```

```powershell
npm run lint
```

```text
> eslint .
```

Exit 0.

```powershell
npm run typecheck
```

```text
> tsc --noEmit
```

Exit 0.

```powershell
npm run test:run -- tests/unit/game
```

```text
Test Files  3 passed (3)
Tests  17 passed (17)
```

Exit 0.

`git diff --check` exited 0; it emitted only line-ending conversion warnings for edited tracked files.

### Fix Round 1 self-review

- The tie regression uses a tied score state and a literal expected controller selected by the persisted seed, so replacing the seed-based tie-break with candidate order fails it.
- The Double Round regression traverses every one of its 30 tiles and asserts both the Final entry phase and all 60 used board clues, so an early or missing final transition fails it.
- The timer comparison lives on the strict timer schema itself and preserves the legacy default path, so valid legacy snapshots still receive a full configured timer while explicit impossible timer state is rejected.
