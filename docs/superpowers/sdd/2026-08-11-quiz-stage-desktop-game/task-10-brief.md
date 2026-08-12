### Task 10: Deliver the complete fixture-backed match UI

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/renderer/features/game/GameSurface.tsx`
- Create: `src/renderer/features/game/PublicBoard.tsx`
- Create: `src/renderer/features/game/PublicClue.tsx`
- Create: `src/renderer/features/game/PublicFinal.tsx`
- Create: `src/renderer/features/game/HostConsole.tsx`
- Create: `src/renderer/features/game/HostTeamControls.tsx`
- Create: `src/renderer/features/game/useGameShortcuts.ts`
- Create: `src/renderer/features/game/useDisplayedTimer.ts`
- Create: `src/renderer/styles/game.css`
- Create: `playwright.config.ts`
- Test: `tests/unit/renderer/game/PublicBoard.test.tsx`
- Test: `tests/unit/renderer/game/HostConsole.test.tsx`
- Test: `tests/unit/renderer/game/FinalFlow.test.tsx`
- Test: `tests/unit/renderer/game/shortcuts.test.tsx`
- Test: `tests/e2e/core-match.spec.ts`

**Interfaces:**
- Consumes: host/public projections and `desktopApi.dispatch(command)`.
- Produces: every player/host screen needed to complete a fixture-backed match and shortcut mapping `1–8`, `C`, `X`, `Space`, `R`, `U`/`Ctrl+Z`, and `M`.

- [ ] **Step 1: Write failing component tests**

Install the pinned E2E runner first:

```powershell
npm install --save-dev --save-exact @playwright/test@1.62.1
npx playwright install chromium
```

Assert that public tiles expose category/value but not answers, clue screens render the active timer, host console shows canonical response/source, incorrect judgment leaves other teams enabled, Daily Double accepts only valid wagers, single-screen Final wager entry replaces public content with a neutral waiting screen, Final reveals in required order, and shortcuts do nothing while an input owns focus.

- [ ] **Step 2: Write the failing full-match E2E test**

Use Playwright’s Electron launcher to start a two-team English medium match, play all Round One and Double Round tiles through a deterministic fixture, complete Daily Doubles and Final, and assert the winner screen. Listen to all requests and fail if a non-local URL is requested.

- [ ] **Step 3: Run tests and observe failure**

Run:

```powershell
npm run test:run -- tests/unit/renderer/game
npx playwright test tests/e2e/core-match.spec.ts
```

Expected: both commands fail because gameplay components are absent.

- [ ] **Step 4: Implement the minimal complete host/public flow**

Render by `GamePhase`, use CSS Grid for the 6×5 board, derive the displayed timer from authoritative timestamps, and dispatch only intent commands. Public components accept `PublicGameView`; host components accept `HostGameView` so TypeScript prevents accidental answer leakage.

- [ ] **Step 5: Verify Milestone 1**

Run:

```powershell
npm run lint
npm run typecheck
npm run test:run
npm run build
npx playwright test tests/e2e/core-match.spec.ts
```

Expected: all commands exit 0 and E2E completes one entire fixture-backed match without an external request.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json src/renderer playwright.config.ts tests/unit/renderer/game tests/e2e/core-match.spec.ts
git commit -m "feat(ui): complete fixture-backed classic match"
```

## Milestone 2: Durable desktop product

