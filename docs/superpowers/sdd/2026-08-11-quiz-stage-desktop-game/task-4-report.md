# Task 4 report

## Status

COMPLETE. Implemented timers, Daily Doubles, Final, repeated sudden death, and reversible host recovery actions. Commit: `84f0341 feat(game): implement classic wagers and recovery rules`.

## Files

- `src/shared/game/types.ts`: canonical Final/recovery state plus compact persisted undo frames.
- `src/shared/game/events.ts`: reviewed; existing strict event union already represented the required compensating and terminal events, so no change was necessary.
- `src/shared/game/reducer.ts`: complete timer, Daily Double, Final, tiebreaker, and host-recovery transitions.
- `src/shared/game/engine.ts`: deterministic event IDs, undo frame capture/restore, `tickTimer`, `createCompensatingEvent`, and rule helpers.
- `src/shared/ipc/contracts.ts`: strict persisted schemas and legacy defaults for every new canonical state field and compact undo frame.
- `tests/unit/game/timers.test.ts`
- `tests/unit/game/dailyDouble.test.ts`
- `tests/unit/game/final.test.ts`
- `tests/unit/game/recoveryActions.test.ts`

## RED evidence

Command:

`npm run test:run -- tests/unit/game/timers.test.ts tests/unit/game/dailyDouble.test.ts tests/unit/game/final.test.ts tests/unit/game/recoveryActions.test.ts`

Initial output: exit 1; 4 files failed; 21 tests failed and 2 passed. Failures were the expected missing `tickTimer`, `maxDailyDoubleWager`, `finalEligibleTeams`, `applyFinalJudgment`, `createCompensatingEvent`, Daily Double rejection, and unsupported advanced commands.

Additional strict-schema RED:

`npm run test:run -- tests/unit/game/recoveryActions.test.ts`

Output: exit 1; canonical state containing a compact undo frame was rejected before the schema implementation.

Additional self-review RED runs caught once-only expiry, timestamp anchoring, no-answer sudden death, and reported-clue board completion before their fixes.

## GREEN evidence

- Focused advanced suites: exit 0; 4 files passed, 24 tests passed.
- `npm run lint`: exit 0; ESLint reported no errors or warnings.
- `npm run typecheck`: exit 0; `tsc --noEmit` reported no errors.
- `npm run test:run -- tests/unit/game`: exit 0; 7 files passed, 43 tests passed.
- `npm run test:run`: exit 0; 9 files passed, 45 tests passed.
- `git diff --cached --check`: exit 0; no whitespace errors.
- Post-commit `git status --short`: no output; worktree clean.

## Self-review

- Event history: every accepted reversible command stores a compact pre-action frame keyed to the emitted event ID; `UndoLast` restores/pops only the latest frame and emits `ActionUndone` without deleting history. Event sequence numbers are not rewound by undo.
- Wagers: Daily Double minimum 5 and inclusive maximum use the greater of score/round ceiling, including negative scores. Final wagers accept only integers from 0 through each positive team's pre-Final score.
- Final privacy: wagers and undo frames remain only in `GameState`; `PublicGameView` exposes neither private Final wagers nor hidden Daily Double IDs.
- Final eligibility: zero and negative scores are excluded. No-eligible-team matches resolve the Double Round high score or enter sudden death on a tie.
- Reveal/ties: Final order is persisted from lowest to highest pre-Final score. Sudden death restricts locks to tied leaders and opens further clues after all incorrect responses or no response.
- Timers: selection remains timestamp-free; the first `tickTimer` anchors `startedAt`. Pause/resume arithmetic preserves remaining time, reset uses the active timer's full duration, Final uses 30 seconds, and expiry mutates the timer to `expired` before returning its once-only event.
- Recovery: reopening is limited to the last closed clue and becomes unavailable on another selection; score adjustments and clue reports require nonblank reasons; bad clues close without blocking board completion; incomplete endings persist an explicit terminal state/event.
- Compatibility: the pre-existing tied-lowest seeded Round Two behavior and ordinary scoring/control tests remain green. New strict state fields receive defaults when older snapshots are loaded.
- Scope: no renderer interval, networking, database, UI, audio playback, or unrelated feature was added.

## Concerns

None. The binding compact-frame undo architecture was applied without recursive/full `GameState` snapshots, and the strict public/private boundary remains unchanged.

## Fix Round 1

### Reviewed base

`84f034108aa999a8c7113334b561aa1f034e9861`

### Root causes and fixes

1. `LockTeam` checked only the persisted timer status, then `pauseTimer` discovered expiry after accepting the lock. The engine now ticks at the lock timestamp first; at/past-deadline locks return the single authoritative `TimerExpired` event, persist `expired`, and never lock or score. Reset also rejects timestamps before the active anchor.
2. `RevealResponse` had no Daily Double timeout branch. An expired, unlocked Daily Double now closes without score change and preserves selecting-team control within the round.
3. Non-reversible command bookkeeping retained the prior undo stack. `EndIncompleteMatch` now clears compact frames, `UndoLast` rejects complete states, and standalone compensation rejects histories containing `MatchEnded`; history remains append-only.
4. Sudden death synthesized clue IDs. `SelectedBoards` now accepts an optional ordered list of already-selected canonical tiebreaker clues, `GameState` persists the full private clue content and used IDs, `startTiebreaker` activates only supplied canonical IDs, and `findClue` resolves them. No sourcing/selection algorithm or new command was added, and future responses remain outside `PublicGameView`.
5. Reopen stored only a clue ID and kept the post-close phase/control. Minimal persisted close context now restores the prior round board and controlling team, including the last Round One clue after entering Round Two and the last Double Round clue after entering Final.
6. Final reveal ignored timer state. The first reveal now requires the fixed timer to be `expired`; running or paused early states are rejected.
7. `AdjustScore` and `ReportClue` had no terminal guard. Both now reject complete matches.

### RED evidence

Command:

`npm run test:run -- tests/unit/game/timers.test.ts tests/unit/game/dailyDouble.test.ts tests/unit/game/final.test.ts tests/unit/game/recoveryActions.test.ts`

Output before fixes: exit 1; 4 files failed; 10 tests failed and 25 passed. Failures reproduced late lock acceptance, missing Daily Double timeout closure, stale terminal undo, incorrect boundary reopen phases, early Final reveal, terminal mutations, non-monotonic reset, and missing canonical tiebreaker state.

Additional adversarial RED: paused-early Final reveal was accepted, and `createCompensatingEvent` still targeted an older command after `MatchEnded`; both focused tests failed before their fixes.

### GREEN and verification evidence

- Timers focused: 7/7 passed.
- Daily Double focused: 7/7 passed.
- Final focused: 10/10 passed.
- Recovery focused: 11/11 passed.
- Combined reviewed suites: 4 files, 35/35 passed.
- `npm run lint`: exit 0; no errors or warnings.
- `npm run typecheck`: exit 0; no TypeScript errors.
- `npm run test:run -- tests/unit/game`: exit 0; 7 files, 52/52 passed.
- `npm run test:run`: exit 0; 9 files, 54/54 passed.

### Fix Round 1 concerns

None. The tiebreaker seam consumes already-selected clues in the supplied order and intentionally errors if content selection has not provided another canonical clue; Task 5 retains sourcing and ordering ownership.

## Fix Round 2

### Reviewed base

`5cf9b30a26bc500d2bbee745a5e84f65e7d97e14`

### Root causes and fixes

1. Round 1 added safe defaults only to the top-level state schema. The same fields remained mandatory inside strict persisted undo frames, so a snapshot written by the previous Task 4 head failed validation. `usedTiebreakerClueIds`, `lastClosedPhase`, and `lastClosedControllingTeamId` now carry the same nested defaults (`[]`, `null`, and `null`). A realistic prior snapshot with both top-level and nested Round 1 fields absent validates and materializes those defaults.
2. Active clue reporting always called generic `completeClue`, whose fallback treats every non-Round-One clue as Round Two. `ReportClue` now handles the active canonical tiebreaker before board completion logic: it disables the bad clue and advances through the existing supplied-order `startTiebreaker` seam without changing scores. If no next canonical clue exists, `TIEBREAKER_CLUE_REQUIRED` is thrown before any state is returned or mutated.

### RED evidence

Command:

`npm run test:run -- tests/unit/game/recoveryActions.test.ts tests/unit/game/final.test.ts`

Output before fixes: exit 1; 2 files failed; 3 tests failed and 21 passed. The old nested frame was rejected, active tiebreaker reporting entered `round-two-board`, and exhausted supplied content did not throw.

### GREEN and verification evidence

- Recovery focused: 12/12 passed.
- Final focused: 12/12 passed.
- Combined affected suites: 2 files, 24/24 passed.
- `npm run lint`: exit 0; no errors or warnings.
- `npm run typecheck`: exit 0; no TypeScript errors.
- `npm run test:run -- tests/unit/game`: exit 0; 7 files, 55/55 passed.
- `npm run test:run`: exit 0; 9 files, 57/57 passed.

### Fix Round 2 concerns

None. The schema change is limited to backward-compatible defaults for fields introduced after the prior snapshot shape, and the reporting branch reuses the existing canonical tiebreaker advancement/error contract.
