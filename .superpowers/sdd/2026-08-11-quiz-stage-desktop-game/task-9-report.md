# Task 9 report: Home and New Match setup

## Status

Implemented the accessible host Home/New Match flow, responsive setup form, authoritative content-availability gate, strict host-only setup/start bridge, concrete automatic display resolution, and neutral public/no-gameplay placeholders.

## Authorized Task 8 boundary extension

Task 8 exposed only `dispatch` and `subscribeToState`; it had no renderer start, availability, pack, or display-discovery seam. Before changing those out-of-brief files, Task 9 reported `NEEDS_CONTEXT` with the proposed contract. The root task explicitly authorized the minimal extension.

The extension adds only current-host-authorized `startMatch`, `checkContentAvailability`, and `getSetupOptions` IPC methods. Arguments and results are strict Zod-parsed in main and preload. Public preload exposes none of them. Application composition exposes narrow setup methods rather than raw repositories/services, while Electron display count stays behind the read-only `automaticDisplayMode` function.

## Files

- `src/renderer/api/desktopApi.ts`: mockable adapter over the real strict `window.quizStage` bridge.
- `src/renderer/App.tsx`: host Home/Setup routing, resumed-match subscription routing, and neutral public/later-gameplay states.
- `src/renderer/features/home/HomeScreen.tsx`: New Match plus clearly disabled later-task entries.
- `src/renderer/features/setup/{SetupScreen,TeamEditor}.tsx`: accessible 2–8 team setup, stable UUIDs, English/Estonian controls, difficulty/timer/packs/display choices, local schema validation, race-safe authoritative availability, exact shortages, and one validated start submission.
- `src/renderer/styles/{tokens,global}.css`: minimal responsive tokens, layout, and visible keyboard focus.
- `src/shared/ipc/contracts.ts`, `src/main/ipc/*`, `src/preload/preload.ts`, `src/main/{application,displayMode,main}.ts`: strict host-only setup/start contract, enabled pack summaries, automatic display resolution, and selected-mode window application.
- `vitest.config.ts`, `tests/unit/renderer/setup.ts`, and exact renderer test dependencies: isolated node and jsdom Vitest projects.
- Focused renderer, preload, IPC, application, and display-mode tests under `tests/unit` and `tests/integration`.

## RED evidence

Initial renderer command:

```text
npm run test:run -- tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/SetupScreen.test.tsx
Test Files 2 failed (2); both failed on missing HomeScreen/SetupScreen modules; exit 1
```

The bridge-focused RED run then failed on the missing display helper, missing application setup methods, absent IPC handlers, and absent preload methods. A later host-state regression failed because App remained on Home after the authoritative subscription emitted an active match.

During GREEN, the shortage test caught a transient pre-options pack alert and incorrect singular wording (`1 category sets`); both production behaviors were corrected before proceeding.

## GREEN verification

```text
npm run test:run -- tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/SetupScreen.test.tsx
Test Files 2 passed (2); Tests 8 passed (8); exit 0

npm run test:run
Test Files 25 passed (25); Tests 140 passed (140); exit 0

npm run lint
eslint .; exit 0

npm run typecheck
tsc --noEmit; exit 0

npm run build
Electron Forge packaged x64 on win32; exit 0

PACKAGED_SEED_OK bytes=188416
PACKAGED_NATIVE_OK win32-x64.node bytes=1989632

git diff --check
exit 0
```

## Self-review

- Validation and boundaries: the same `gameConfigSchema` produces the candidate checked by main and the exact config submitted to start. Empty/trimmed case-insensitive duplicate names, duplicate colors, zero packs, team bounds, timer steps, and concrete `DisplayMode` remain invalid locally and again at both IPC boundaries.
- Availability races: each check is keyed to the complete validated config and canceled on dependency change. Stale success/shortage responses cannot render or enable Start for a newer or invalid candidate.
- Team identity: IDs are generated once with `crypto.randomUUID()` and preserved across edits; numbered fieldsets/labels remain visible independently of the color swatch. Remove is disabled at two and Add at eight.
- Localization: selecting Estonian changes visible setup labels/messages and submits `language: 'et'`; authoritative availability therefore checks Estonian content completeness. Difficulty, timer, packs, and resolved automatic display mode all submit exactly once.
- Privacy and authority: public bridge/surface has no setup, start, dispatch, or host-state access and remains a neutral waiting screen. Every main setup request re-resolves the current host sender, so public, destroyed, and replaced hosts cannot invoke it.
- React review: async work is confined to external bridge effects, stale effects clean up, derived validity is not duplicated in state, static components remain module-level, and only the small existing React/Zod boundary is bundled.

## Concerns

`npm install` reports pre-existing transitive audit findings (3 low, 21 high, 1 critical). Task 9 did not run an unrelated dependency upgrade or audit fix.

## Fix round 1: add-after-remove colors and start failure handling

### RED evidence

```text
npm run test:run -- tests/unit/renderer/SetupScreen.test.tsx
Test Files 1 failed (1); Tests 4 failed | 5 passed; Errors 2; exit 1
```

The regressions proved that add/remove/add selected `#57C785` twice, both persistence and `CONTENT_SHORTAGE` start failures escaped as unhandled rejections without an alert, and a deliberately reentrant form submission invoked `startMatch` twice before React committed the disabled state.

### Fix

- New teams now receive a fresh UUID, the first currently unused palette color, and an unused default team name. Existing team colors and identities are never rewritten.
- Submit uses a synchronous in-flight ref before calling the desktop API, closing the reentrant gap while retaining the visible submitting state.
- Rejected starts remain on Setup and re-check authoritative availability. A refreshed shortage replaces the previous availability result and renders its exact counts; an available or failed refresh renders concise English/Estonian guidance without exception details. Config-keyed errors disappear on meaningful edits and every new attempt clears the prior error.

### GREEN verification

```text
npm run test:run -- tests/unit/renderer/SetupScreen.test.tsx
Test Files 1 passed (1); Tests 9 passed (9); exit 0

npm run test:run
Test Files 25 passed (25); Tests 144 passed (144); exit 0

npm run typecheck
tsc --noEmit; exit 0

npm run build
Electron Forge packaged x64 on win32; exit 0
```

The final lint, package artifact, and diff/working-tree evidence was re-run at the commit gate after the test-only lint correction.
