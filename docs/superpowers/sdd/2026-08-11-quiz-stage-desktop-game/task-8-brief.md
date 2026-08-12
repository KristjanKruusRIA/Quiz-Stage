### Task 8: Make the main process authoritative and synchronize both windows

**Files:**
- Create: `src/main/application.ts`
- Create: `src/main/coordinator/gameCoordinator.ts`
- Create: `src/main/ipc/channels.ts`
- Create: `src/main/ipc/registerIpc.ts`
- Create: `src/main/ipc/validateSender.ts`
- Create: `src/main/windows/windowManager.ts`
- Modify: `src/main/main.ts`
- Modify: `src/preload/preload.ts`
- Create: `src/shared/game/views.ts`
- Modify: `src/shared/ipc/contracts.ts`
- Test: `tests/unit/game/views.test.ts`
- Test: `tests/integration/ipc/registerIpc.test.ts`
- Test: `tests/integration/windows/windowManager.test.ts`

**Interfaces:**
- Consumes: game engine, repositories, content service, and IPC schemas.
- Produces: `GameCoordinator.startMatch`, `GameCoordinator.dispatch`, `GameCoordinator.subscribe`; `toHostGameView`, `toPublicGameView`; and preload API `window.quizStage`.

- [ ] **Step 1: Write redaction and sender-validation tests**

```ts
it('redacts an unrevealed response and Daily Double from public state', () => {
  const view = toPublicGameView(fixtureStateWithHiddenAnswer());
  expect(JSON.stringify(view)).not.toContain('Heisenberg');
  expect(JSON.stringify(view)).not.toContain('daily-double');
});

it('rejects commands from the public webContents sender', async () => {
  await expect(invokeAs(publicSender, validCommand)).rejects.toThrow('HOST_SENDER_REQUIRED');
});
```

- [ ] **Step 2: Run focused tests and observe failure**

Run: `npm run test:run -- tests/unit/game/views.test.ts tests/integration/ipc tests/integration/windows`

Expected: FAIL on missing projections, coordinator, and window manager.

- [ ] **Step 3: Implement the coordinator and projections**

`dispatch` must validate the command, apply it, persist events plus snapshot in one transaction, and only then publish a host projection and a separately constructed public projection. Never clone host state and delete fields afterward.

- [ ] **Step 4: Implement dual/single window creation and preload surface checks**

Pass `--surface=host` or `--surface=public` as an additional argument. Expose `dispatch` only for the host surface; expose `subscribeToState` to both. In main IPC handlers, independently verify `event.sender.id === hostWindow.webContents.id`.

- [ ] **Step 5: Verify synchronization and security**

Run:

```powershell
npm run test:run -- tests/unit/game/views.test.ts tests/integration/ipc tests/integration/windows
npm run lint
npm run typecheck
```

Expected: all commands exit 0 and redaction tests prove unrevealed data is absent.

- [ ] **Step 6: Commit**

```powershell
git add src/main src/preload src/shared tests/unit/game/views.test.ts tests/integration/ipc tests/integration/windows
git commit -m "feat(desktop): synchronize secure host and public views"
```

