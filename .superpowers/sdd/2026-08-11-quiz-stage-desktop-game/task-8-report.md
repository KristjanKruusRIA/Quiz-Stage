# Task 8 report: authoritative main-process synchronization

## Status

Implemented the authoritative Electron main-process coordinator, independently constructed host/public projections, sender-validated IPC, host-only dispatch preload surface, secure single/dual windows, offline application composition, validated recovery replay, and persist-before-display canonical tiebreaker selection.

## Files

- `src/main/application.ts`: composes the content repository/service, match repository, and authoritative coordinator over one main-process database connection.
- `src/main/coordinator/gameCoordinator.ts`: validates setup/commands, selects content, applies the engine, atomically persists before publishing, safely resumes a validated contiguous replay prefix, marks terminal snapshots complete, and persists each selected canonical tiebreaker before retrying the transition that displays it.
- `src/main/ipc/{channels,registerIpc,validateSender}.ts`: fixed channels, independent `event.sender.id` verification against the host window, projection routing, and listener disposal.
- `src/main/windows/windowManager.ts`: secure host/public BrowserWindow creation with `--surface=host|public` and single/dual mode.
- `src/main/main.ts`: offline seed initialization, migrations, recovery, window creation, IPC registration, and lifecycle cleanup.
- `src/preload/preload.ts`: host-only `dispatch` and host/public `subscribeToState`, selected only from the main-supplied surface argument.
- `src/shared/game/views.ts`: separately constructs host and public views; public tile/clue IDs are opaque and future tiebreaker content, private wagers, source data, hidden responses, Daily Double identity, and pre-wager clue text never enter the public projection.
- `src/shared/game/types.ts`, `src/shared/ipc/contracts.ts`, and `src/main/persistence/matchRepository.ts`: recovery metadata/view/API contracts plus strict canonical Final/tiebreaker persistence compatibility.
- `src/main/content/contentService.ts`: narrow authoritative next-tiebreaker selection seam over the existing pure selector.
- `forge.config.ts`: packages the committed offline development seed alongside the existing native SQLite allowlist.
- Focused tests under `tests/unit/game/views.test.ts`, `tests/integration/{application,coordinator,ipc,windows}`.

## RED evidence

Initial focused command:

```text
npm run test:run -- tests/unit/game/views.test.ts tests/integration/coordinator/gameCoordinator.test.ts tests/integration/ipc tests/integration/windows
```

Result: 5/5 suites failed with the expected missing Task 8 modules (`views`, coordinator, IPC, preload API, and window manager); no tests imported.

Additional focused RED regressions caught:

- Real application composition reached persistence and rejected selector-only metadata plus Final tier/value data, proving selected content had to be converted to the strict canonical state shape.
- Public Daily Double wager state exposed clue prompt text before the wager.
- First tiebreaker selection used index 1 instead of the selector's zero-based index 0 contract.
- A timer tick mutated the current private state before a forced persistence failure.
- Terminal dispatch persisted and published without marking the match complete in between.

Each regression was observed failing before its production correction.

## GREEN verification

```text
npm run test:run -- tests/unit/game/views.test.ts tests/integration/coordinator/gameCoordinator.test.ts tests/integration/ipc tests/integration/windows tests/integration/application.test.ts
Test Files 6 passed (6); Tests 17 passed (17); exit 0

npm run test:run
Test Files 20 passed (20); Tests 113 passed (113); exit 0

npm run lint
eslint .; exit 0

npm run typecheck
tsc --noEmit; exit 0

npm run build
Electron Forge packaged x64 on win32; exit 0

PACKAGED_SEED_OK bytes=188416
PACKAGED_NATIVE_OK bytes=1989632

git diff --check
exit 0
```

## Self-review

- Privacy: public state is constructed directly from private canonical state, never cloned from the host view. It excludes canonical clue IDs, all source/accepted-response data, future tiebreaker clues, Daily Double positions, wagers, undo frames, and recovery metadata. Daily Double clue text remains hidden until the wager is committed; response/explanation appear only when `responseRevealed` is canonical true.
- Transactions/order: setup, ordinary transitions, and terminal transitions publish only after repository persistence succeeds. Engine execution uses a clone so engine timer mutation cannot alter current state on rollback. Completion is marked after the terminal snapshot transaction and before publish.
- Tiebreakers: the coordinator catches only the engine's exact `TIEBREAKER_CLUE_REQUIRED` seam, selects with the persisted seed and zero-based tie index, excludes every already selected/used canonical clue ID, strips selector metadata, persists an eventless augmented snapshot, then retries and persists the display transition. A failure after augmentation leaves the authoritative current state equal to the safely persisted pre-display snapshot.
- Recovery: `loadResumable` remains the validation/contiguity boundary. The coordinator clones the snapshot, applies only the returned prefix through authoritative engine semantics, verifies each reproduced event byte shape, stops on semantic divergence, and exposes the original or derived issue only to the host projection.
- IPC/windows: renderer arguments never influence sender authorization. Main compares the actual sender webContents ID to the current host window ID. Public preload has no dispatch method. Both state listeners have exact unsubscribe/dispose paths. Existing context isolation, disabled Node integration, sandbox, web security, navigation blocking, and window-open denial are preserved for both surfaces.
- Runtime: application/database/content remain main-process-only and use the packaged offline seed; no HTTP, socket, fetch, or other runtime network path was added.

## Concerns

None. The current main entry creates a single host surface when no resumable match exists and restores the persisted single/dual display mode when a match is resumed; later setup UI can call the coordinator start seam and apply its chosen display mode without changing the security contracts added here.

## Fix round 1: privacy, publication, recovery, lifecycle, and preload validation

### Verified root causes

1. The public projection redacted clue fields during the wager but copied the private `daily-double-*` phase unchanged, directly leaking Daily Double status.
2. Publication invoked mutable listener sets synchronously without an isolation or monotonicity boundary. A listener exception escaped after commit, while a reentrant dispatch published a newer view inside an older publication whose remaining listeners then received stale state.
3. The window manager returned one-time local references. Closed windows were never cleared, main recreated only when every BrowserWindow was gone, and IPC captured the original windows instead of authorizing/sending against current live surfaces.
4. Recovery cloned only once before the replay loop. A schema-valid but semantically mismatched `LockTeam` event let `tickTimer` mutate that shared recovery candidate before reproduced-event validation threw.
5. Preload trusted `unknown` IPC values through TypeScript casts. It neither distinguished host/public state shapes at runtime nor validated the host dispatch result.

### RED evidence

The focused fix-round command initially produced 10 expected failures across all five suites:

```text
npm run test:run -- tests/unit/game/views.test.ts tests/integration/coordinator/gameCoordinator.test.ts tests/integration/windows/windowManager.test.ts tests/integration/ipc
Test Files 5 failed (5); Tests 10 failed | 12 passed; exit 1
```

The failures demonstrated public JSON containing `daily-double-wager`/`daily-double-clue`, a committed dispatch rejecting with `renderer listener failed`, stale host order `[2, 1]`, recovery changing `timer.startedAt` from `null` to `100`, missing lifecycle/current-window behavior, host data crossing the public preload channel, and an invalid dispatch result resolving.

### Fixes

- Introduced a public-only phase type and map both private Daily Double phases to the safe `ordinary-clue` presentation. Pre-wager prompt/response/ID and all future content remain absent.
- Added queued, snapshotted publication. A reentrant commit invalidates the in-progress older delivery and restarts from the newest canonical state; listener errors are isolated without enclosing engine or persistence work.
- Made `WindowManager` own live per-surface references, clear them on close/destroy, and recreate only missing surfaces. IPC resolves the current windows for every authorization/send, rejects missing/destroyed host senders, and skips missing/destroyed displays.
- Clone the last valid recovery state independently for every replay attempt, adopting the candidate only after authoritative event reproduction succeeds.
- Added strict host/public view schemas. Preload validates commands, dispatch results, and every subscription value before crossing the context bridge; public schema rejects host/private shapes.

### GREEN verification

```text
npm run test:run -- tests/unit/game/views.test.ts tests/integration/coordinator/gameCoordinator.test.ts tests/integration/windows/windowManager.test.ts tests/integration/ipc
Test Files 5 passed (5); Tests 22 passed (22); exit 0

npm run test:run
Test Files 20 passed (20); Tests 119 passed (119); exit 0

npm run lint
eslint .; exit 0

npm run typecheck
tsc --noEmit; exit 0

npm run build
Electron Forge packaged x64 on win32; exit 0

npx electron-forge package --platform win32 --arch x64
Electron Forge packaged x64 on win32; exit 0

PACKAGED_SEED_OK bytes=188416
PACKAGED_NATIVE_OK bytes=1989632
```

### Fix-round self-review

- Privacy bypass review: neither public phase nor strict public schema contains a Daily Double variant. Wager state has no active clue; committed DD clue state presents as an ordinary clue and still obeys canonical response reveal. Host-only recovery and private game fields remain structurally rejected by the public schema.
- Publication ordering: persistence/engine failures still escape before state adoption or publication. Only subscriber failures are isolated. Reentrant publication aborts the older listener snapshot at the first newer commit and gives every remaining host/public subscriber the newest projection.
- Lifecycle/authentication: host authorization reads the live host webContents ID on each call, so a replaced host invalidates the old sender immediately. Closing host/public clears only that reference; the other display continues, destroyed public sends are non-fatal, and recreated windows retain all Task 1 security settings.
- Recovery: a failed replay candidate is discarded byte-for-byte, while prior validated prefix state and deterministic `replayIssue` remain authoritative.
- Boundary validation: subscription cleanup still removes the exact wrapped listener. Valid host dispatch and valid public subscription paths remain accepted; malformed results and cross-surface state are rejected before user listeners receive them.

## Fix round 2: automatic partial-window recovery

### RED evidence

The dual-window lifecycle test previously called `WindowManager.create()` manually after each close, masking that Windows emits no application `activate` event to restore a missing surface. Replacing that manual step with automatic recovery expectations produced the intended three failures:

```text
npm run test:run -- tests/integration/windows/windowManager.test.ts
Test Files 1 failed (1); Tests 3 failed | 2 passed; exit 1
```

The failures showed a closed host remaining `null` while public stayed live, a closed public surface remaining `null` while host stayed live, and the absence of a shutdown lifecycle guard.

An additional destroy-before-`closed` regression then failed 1/7 focused tests, proving that a live IPC lookup could clear a destroyed reference before the close callback and suppress recovery. Recovery is therefore scheduled from both the close callback and destroyed-reference cleanup through the same deduplicated path.

### Fix

`WindowManager` now retains the intended display mode and schedules missing-surface recovery in a microtask after a close. Recovery reuses the normal secure surface factory, preserves the unaffected surface, and coalesces per-surface requests so simultaneous closes create one replacement pair without loops or duplicates. `dispose()` permanently disables recovery, and main calls it during `before-quit` before dropping the manager reference or closing application resources.

### GREEN verification

```text
npm run test:run -- tests/integration/windows/windowManager.test.ts tests/integration/ipc/registerIpc.test.ts
Test Files 2 passed (2); Tests 9 passed (9); exit 0

npm run test:run
Test Files 20 passed (20); Tests 123 passed (123); exit 0

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

### Fix-round self-review

- Runtime recovery: a host close in dual mode restores the authoritative host without replacing the live public window; a public close restores only the display while the coordinator remains untouched. Simultaneous closes create exactly two replacements.
- Shutdown: `before-quit` disposes the manager before Electron closes windows. Already queued recovery callbacks and later close notifications both observe the guard and cannot create new windows during teardown.
- Authorization/subscriptions: IPC still resolves current manager references for every sender check and publish, so the former host ID becomes unauthorized and replacements receive existing coordinator publications without re-registering listeners.
- Security/offline packaging: every replacement goes through the existing sandboxed, context-isolated, navigation-blocked factory with its explicit surface argument. The packaged seed and Windows x64 SQLite native prebuild remain present; no network path was added.
