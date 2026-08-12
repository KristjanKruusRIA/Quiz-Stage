# Task 2 report: game domain and IPC-safe contracts

## Implementation

- Added transport-neutral game domain models: setup configuration, content boards and clues, persisted game state, host view, and a public view whose active-clue union exposes a response only after `responseRevealed: true` and never exposes a source or private wagers.
- Added the exact intent-only `GameCommand` discriminated union. The Zod command schema uses strict variants, so computed renderer fields (including score deltas) cannot be smuggled onto an otherwise valid command.
- Added persisted event contracts, all four requested Zod schemas, and `GameInputGateway.submit(command): Promise<GameTransition>` with the same `{ state, events }` result used by the authoritative engine contract.
- Used `APP_VERSION` as the literal persisted-state and view version boundary.

## Files

- `src/shared/game/types.ts`
- `src/shared/game/commands.ts`
- `src/shared/game/events.ts`
- `src/shared/game/inputGateway.ts`
- `src/shared/ipc/contracts.ts`
- `tests/unit/game/contracts.test.ts`

## RED

Command:

```powershell
npm run test:run -- tests/unit/game/contracts.test.ts
```

Output (exit 1):

```text
FAIL  tests/unit/game/contracts.test.ts
Error: Cannot find module '../../../src/shared/ipc/contracts'
Test Files  1 failed (1)
Tests  no tests
```

The expected failure was caused by the missing contract module.

## GREEN

Command:

```powershell
npm run test:run -- tests/unit/game/contracts.test.ts
```

Output (exit 0):

```text
Test Files  1 passed (1)
Tests  2 passed (2)
```

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
Test Files  1 passed (1)
Tests  2 passed (2)
```

Exit 0.

`git diff --check` completed with exit 0.

## Self-review

- Confirmed the only accepted command variants are the 15 specified host/user intents; `AwardPoints` is not an accepted variant.
- Confirmed every command variant is a strict object, preventing extra renderer-owned scoring fields from being accepted and stripped.
- Confirmed `GameState` retains canonical response and source fields, while `PublicGameView` contains independently shaped display types and its unrevealed active-clue branch has no response, explanation, or source field.
- Confirmed no network, socket, HTTP, service-discovery, join-code, or transport implementation was added.

## Concerns

None. `GameInputGateway` is intentionally asynchronous to accommodate both Electron IPC and a later transport adapter while retaining the shared `GameTransition` shape.

## Fix Round 1

### Implementation

- Added canonical `GameState.seed: string` and `GameState.dailyDoubleClueIds: string[]` fields, with matching required entries in `gameStateSchema`.
- Kept both fields out of `PublicGameView` and the public board types.
- Replaced the score-delta test with an otherwise valid `SelectClue` command that carries an extra `delta` field, proving strict command validation rather than merely rejecting an unknown command name.

### RED: persisted selection data

Command:

```powershell
npm run test:run -- tests/unit/game/contracts.test.ts
```

Output (exit 1):

```text
FAIL  tests/unit/game/contracts.test.ts > IPC contracts > persists the random seed and hidden Daily Double positions
AssertionError: expected false to be true
Test Files  1 failed (1)
Tests  1 failed | 2 passed (3)
```

The complete state fixture was rejected because the pre-fix strict state schema did not accept `seed` or `dailyDoubleClueIds`.

### RED: strict-command regression mutation check

With only `SelectClue` temporarily changed from `z.strictObject` to `z.object`, the focused command regression failed as expected:

```powershell
npm run test:run -- tests/unit/game/contracts.test.ts
```

Output (exit 1):

```text
FAIL  tests/unit/game/contracts.test.ts > IPC contracts > rejects an extra renderer-supplied score delta on a valid command
AssertionError: expected true to be false
Test Files  1 failed (1)
Tests  1 failed | 2 passed (3)
```

The strict schema was restored immediately after this mutation check.

### GREEN and final verification

```powershell
npm run test:run -- tests/unit/game/contracts.test.ts
```

```text
Test Files  1 passed (1)
Tests  3 passed (3)
```

Exit 0.

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
Test Files  1 passed (1)
Tests  3 passed (3)
```

Exit 0.

### Fix self-review

- Verified `seed` and `dailyDoubleClueIds` are required persisted-state fields and cannot be supplied as unknown public-view data because `PublicGameView` has no structural path to either field.
- Verified a valid command with an extra computed `delta` fails when the `SelectClue` variant is strict and succeeds under the deliberate non-strict mutation.
- Kept actual Electron IPC/preload sender validation out of this fix; that boundary remains deferred to Task 8 as directed.
