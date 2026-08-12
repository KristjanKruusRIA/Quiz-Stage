### Task 2: Define the game domain and IPC-safe contracts

**Files:**
- Create: `src/shared/game/types.ts`
- Create: `src/shared/game/commands.ts`
- Create: `src/shared/game/events.ts`
- Create: `src/shared/game/inputGateway.ts`
- Create: `src/shared/ipc/contracts.ts`
- Test: `tests/unit/game/contracts.test.ts`

**Interfaces:**
- Consumes: `APP_VERSION` from Task 1.
- Produces: `GameConfig`, `Team`, `Clue`, `Board`, `GameState`, `GameCommand`, `GameEvent`, `HostGameView`, `PublicGameView`, transport-neutral `GameInputGateway.submit(command)`, and Zod schemas `gameCommandSchema`, `gameConfigSchema`, `gameStateSchema`, and `gameEventSchema`.

- [ ] **Step 1: Write failing contract tests**

```ts
// tests/unit/game/contracts.test.ts
import { describe, expect, it } from 'vitest';
import { gameCommandSchema, gameConfigSchema } from '../../../src/shared/ipc/contracts';

describe('IPC contracts', () => {
  it('accepts 2-8 unique teams and one match difficulty', () => {
    const result = gameConfigSchema.safeParse({
      language: 'et', difficulty: 'hard', clueSeconds: 15,
      teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
      packIds: ['bundled'], displayMode: 'single',
    });
    expect(result.success).toBe(true);
  });

  it('rejects renderer-supplied score deltas', () => {
    expect(gameCommandSchema.safeParse({ type: 'AwardPoints', teamId: 't1', delta: 99999 }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and observe the expected failure**

Run: `npm run test:run -- tests/unit/game/contracts.test.ts`

Expected: FAIL because the contract modules do not exist.

- [ ] **Step 3: Implement discriminated domain types and schemas**

Define command variants only for user intent:

```ts
export type GameCommand =
  | { type: 'SelectClue'; clueId: string }
  | { type: 'LockTeam'; teamId: string; at: number }
  | { type: 'JudgeResponse'; correct: boolean; at: number }
  | { type: 'SubmitDailyDoubleWager'; wager: number }
  | { type: 'SubmitFinalWager'; teamId: string; wager: number }
  | { type: 'RevealFinalTeam'; teamId: string; correct: boolean }
  | { type: 'PauseTimer'; at: number }
  | { type: 'ResumeTimer'; at: number }
  | { type: 'ResetTimer'; at: number }
  | { type: 'RevealResponse' }
  | { type: 'UndoLast' }
  | { type: 'ReopenClue' }
  | { type: 'EndIncompleteMatch' }
  | { type: 'AdjustScore'; teamId: string; score: number; reason: string }
  | { type: 'ReportClue'; clueId: string; reason: string };
```

Keep canonical responses and source fields in `GameState`; omit them from unrevealed `PublicGameView` by type.

Define `GameInputGateway` as an interface that accepts validated `GameCommand` values and returns a transition result. Implement no socket, HTTP server, service discovery, join code, or networking dependency.

- [ ] **Step 4: Verify contract behavior**

Run: `npm run test:run -- tests/unit/game/contracts.test.ts`

Expected: PASS with both cases green.

- [ ] **Step 5: Run repository checks and commit**

```powershell
npm run lint
npm run typecheck
git add src/shared tests/unit/game/contracts.test.ts
git commit -m "feat(game): define domain and IPC contracts"
```

