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
