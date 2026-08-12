### Task 17: Complete display recovery, accessibility, and responsive layouts

**Files:**
- Modify: `src/main/windows/windowManager.ts`
- Modify: `src/renderer/styles/tokens.css`
- Modify: `src/renderer/styles/global.css`
- Modify: `src/renderer/styles/game.css`
- Modify: `src/renderer/features/game/PublicBoard.tsx`
- Modify: `src/renderer/features/game/PublicClue.tsx`
- Modify: `src/renderer/features/game/PublicFinal.tsx`
- Modify: `src/renderer/features/game/HostConsole.tsx`
- Modify: `src/renderer/features/game/HostTeamControls.tsx`
- Create: `tests/unit/windows/displayRecovery.test.ts`
- Create: `tests/visual/game-layout.spec.ts`
- Create: `tests/e2e/keyboard-only.spec.ts`

**Interfaces:**
- Consumes: host/public windows, Settings reduced-motion flag, and game components.
- Produces: display reassignment without state mutation, 720p/1080p/4K layouts, visible focus, scalable clue text, and keyboard-complete play.

- [ ] **Step 1: Write failing display and accessibility tests**

Simulate removal of the public display and assert the host remains open, the public window moves only after confirmation, and `GameState` is byte-identical. Test 2-team and 8-team boards at 1280×720, 1920×1080, and 3840×2160 with no gameplay scrollbar or clipped score.

- [ ] **Step 2: Run tests and observe failure**

Run:

```powershell
npm run test:run -- tests/unit/windows/displayRecovery.test.ts
npx playwright test tests/visual/game-layout.spec.ts tests/e2e/keyboard-only.spec.ts
```

Expected: FAIL on missing recovery behavior and layout assertions.

- [ ] **Step 3: Implement responsive and accessible behavior**

Use CSS `clamp()` for category/clue/score type, grid min/max constraints for team cards, `:focus-visible`, `prefers-reduced-motion`, and an explicit reduced-motion class. Every interactive host control needs a label, focus order, and keyboard equivalent.

- [ ] **Step 4: Verify all target resolutions and keyboard flow**

Run the commands from Step 2 again.

Expected: six visual layout cases and the full keyboard-only match pass.

- [ ] **Step 5: Commit**

```powershell
git add src/main/windows src/renderer/styles src/renderer/features/game tests/unit/windows tests/visual tests/e2e/keyboard-only.spec.ts
git commit -m "feat(ui): harden displays and accessibility"
```

