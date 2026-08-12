### Task 9: Implement Home and New Match setup

**Files:**
- Create: `src/renderer/api/desktopApi.ts`
- Modify: `src/renderer/App.tsx`
- Create: `src/renderer/features/home/HomeScreen.tsx`
- Create: `src/renderer/features/setup/SetupScreen.tsx`
- Create: `src/renderer/features/setup/TeamEditor.tsx`
- Create: `src/renderer/styles/tokens.css`
- Create: `src/renderer/styles/global.css`
- Test: `tests/unit/renderer/HomeScreen.test.tsx`
- Test: `tests/unit/renderer/SetupScreen.test.tsx`

**Interfaces:**
- Consumes: preload `window.quizStage`, `gameConfigSchema`, and content-availability response.
- Produces: a validated `GameConfig` submitted through `desktopApi.startMatch(config)`.

- [ ] **Step 1: Install renderer-test dependencies**

Run:

```powershell
npm install --save-dev --save-exact @testing-library/react@16.3.2 @testing-library/user-event@14.6.3 @testing-library/jest-dom@7.0.1 jsdom@30.0.1
```

Configure a `jsdom` Vitest project for renderer tests and a typed mock desktop API.

- [ ] **Step 2: Write failing setup tests**

Tests must add/remove teams to the 2/8 limits, reject duplicate/empty names, select language/difficulty/timer/packs/display mode, show exact availability shortages, and submit this payload:

```ts
expect(api.startMatch).toHaveBeenCalledWith(expect.objectContaining({
  language: 'et', difficulty: 'hard', clueSeconds: 15,
  teams: expect.arrayContaining([expect.objectContaining({ name: 'Alpha' })]),
}));
```

- [ ] **Step 3: Run the tests and observe failure**

Run: `npm run test:run -- tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/SetupScreen.test.tsx`

Expected: FAIL because the screens do not exist.

- [ ] **Step 4: Implement minimal accessible setup screens**

Use native form controls and visible labels. Generate stable team IDs with `crypto.randomUUID()`. Always render team numbers alongside colors. Disable Start until local schema validation and main-process availability both succeed.

- [ ] **Step 5: Verify setup behavior**

Run:

```powershell
npm run test:run -- tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/SetupScreen.test.tsx
npm run lint
npm run typecheck
```

Expected: all tests pass with no accessibility-query fallback to test IDs for labeled inputs.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json vitest.config.ts src/renderer tests/unit/renderer
git commit -m "feat(ui): add home and match setup"
```

