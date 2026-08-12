### Task 11: Add autosave recovery, Resume, and Match History

**Files:**
- Modify: `src/main/persistence/matchRepository.ts`
- Modify: `src/main/coordinator/gameCoordinator.ts`
- Modify: `src/shared/ipc/contracts.ts`
- Modify: `src/renderer/features/home/HomeScreen.tsx`
- Create: `src/renderer/features/history/HistoryScreen.tsx`
- Create: `src/renderer/features/history/RecoveryNotice.tsx`
- Test: `tests/integration/persistence/recovery.test.ts`
- Test: `tests/unit/renderer/HistoryScreen.test.tsx`
- Test: `tests/e2e/resume-match.spec.ts`

**Interfaces:**
- Consumes: atomic event/snapshot persistence and coordinator dispatch.
- Produces: `GameCoordinator.resumeLatest()`, `MatchRepository.recoverLatest()`, `desktopApi.listHistory()`, and `desktopApi.resumeMatch()`.

- [ ] **Step 1: Write failing recovery tests**

Test a valid latest snapshot, a corrupt latest snapshot with valid predecessor, and a completed match that is not offered for resume:

```ts
expect(repository.recoverLatest()).toEqual(expect.objectContaining({
  recoveredFromSnapshotSequence: 41,
  skippedInvalidSnapshotSequence: 42,
}));
```

History tests must render date, completion state, language, difficulty, teams, standings, duration, pack IDs, and seed without creating persistent team identities.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/integration/persistence/recovery.test.ts tests/unit/renderer/HistoryScreen.test.tsx`

Expected: FAIL on missing recovery and history interfaces.

- [ ] **Step 3: Implement recovery and history**

Validate every loaded JSON snapshot with `gameStateSchema`; walk snapshots newest-to-oldest until one is valid; replay only later events that pass `gameEventSchema`. Return a recovery notice describing skipped data without exposing clue text in logs.

- [ ] **Step 4: Verify process-restart resume E2E**

Run: `npx playwright test tests/e2e/resume-match.spec.ts`

Expected: E2E kills the app during Round One, relaunches it, resumes the same seed/board/scores, completes the match, and finds it in History.

- [ ] **Step 5: Commit**

```powershell
git add src/main src/shared/ipc src/renderer/features/home src/renderer/features/history tests/integration/persistence/recovery.test.ts tests/unit/renderer/HistoryScreen.test.tsx tests/e2e/resume-match.spec.ts
git commit -m "feat(persistence): recover matches and show history"
```

