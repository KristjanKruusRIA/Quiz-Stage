# Task 11 report: autosave recovery, Resume, and Match History

## Status

Implemented explicit durable autosave recovery through Home, host-only Resume, and read-only Match History. Startup no longer silently adopts an incomplete match. The authoritative main process validates recovery, replays only the repository-approved contiguous prefix, publishes the recovered host/public projections, and retains the existing timer anchor/scheduler guarantees.

## Semantics

- An interrupted match with `matches.completed_at IS NULL` is resumable.
- `EndIncompleteMatch` remains terminal: it persists canonical `phase=complete`, sets `endedIncomplete=true`, and is marked completed. It appears in History as `Incomplete` and is never offered by Resume.
- A naturally completed match appears in History as `Complete` and is never offered by Resume.
- Multiple interrupted matches are ordered by the repository's database-wide monotonic persistence time, snapshot sequence, and match ID. The newest match with a valid snapshot wins deterministically.

## Recovery and authority

- `MatchRepository.recoverLatest()` walks incomplete snapshots newest-to-oldest, parses every candidate with strict `gameStateSchema`, retains Task 6's self-sufficient snapshot cursor/pruning behavior, and delegates later rows to the unchanged strict contiguous-prefix event parser.
- Recovery returns `recoveredFromSnapshotSequence`, the brief-compatible newest skipped sequence, the complete ordered `skippedInvalidSnapshotSequences`, and `replayIssue`. Invalid snapshots, gaps, malformed events, match mismatches, and row/payload mismatches never allow later rows to cross the boundary.
- `GameCoordinator.resumeLatest()` clones the validated snapshot, replays each repository-approved event through authoritative engine semantics, adopts only the last reproduced state, and reports semantic divergence as an event recovery issue. Legacy running timers with a null anchor are anchored and durably snapshotted before adoption; the Task 10 scheduler/retry/disposal path is reused unchanged.
- Recovery metadata is host-only. Public projections and public preload contain no recovery, seed, private response, source, or history API.

## IPC and renderer

- Added strict host-only, current-sender `hasResumableMatch`, `resumeMatch`, and `listHistory` handlers with `undefined` argument parsing, strict response schemas, exact handler cleanup, and replacement-window authorization.
- Home keeps Resume disabled until the current host API returns a resumable summary. API-owned availability state, effect cancellation, and navigation generations prevent old windows, old APIs, or late Resume results from replacing current navigation.
- Resume routes the returned/subscribed `HostGameView` into the existing `GameSurface`. Completing or ending a match exposes Back to Home; Home and History then re-read authoritative persistence.
- History renders saved date, complete/incomplete state, language, difficulty, duration, pack IDs, seed, and per-match team ranks/names/scores. It has accessible Back, loading, empty, and error states and no reusable team identity/profile concept.
- `RecoveryNotice` renders only snapshot/event sequence metadata. It never renders stored question, response, explanation, or source data.

## TDD evidence

Initial focused RED:

```text
npm run test:run -- tests/integration/persistence/recovery.test.ts tests/integration/coordinator/recovery.test.ts tests/integration/ipc/recoveryHistory.test.ts tests/unit/renderer/HistoryScreen.test.tsx tests/unit/renderer/RecoveryNavigation.test.tsx
Test Files 5 failed (5); Tests 7 failed (7); exit 1
```

The expected failures were missing `recoverLatest`, `resumeLatest`, recovery/history IPC, history components, and host navigation. A selector fixture initially failed strict state parsing before reaching the missing method; it was corrected to the canonical fixture and rerun, producing three expected `recoverLatest is not a function` failures.

First focused GREEN:

```text
Repository recovery + legacy repository: 2 files passed; 15 tests passed
Coordinator recovery + legacy coordinator: 2 files passed; 21 tests passed
Recovery/history IPC + legacy IPC/preload: 3 files passed; 13 tests passed
Renderer recovery/history/game: 9 files passed; 33 tests passed
```

## Electron restart verification

The restart E2E uses a workspace-owned isolated temporary user-data directory. It starts a match, completes one Round One clue, captures the exact board, scores, seed, used clue, and paused/null-anchor timer snapshot, terminates the exact Electron PID tree, relaunches the same profile, clicks Resume through the UI, and asserts the same board/scores with no running timer. It then completes all remaining clues and Final, returns Home, verifies Resume is disabled, and finds the original seed, completion state, and standing in History. Browser-level request observation records zero non-local requests, and cleanup is a hard `finally` gate.

Debugging evidence:

- Plain `ChildProcess.kill()` killed only Electron's root on Windows and left Chromium children holding the profile. The test now terminates the exact owned PID tree with `taskkill /T /F`.
- Opening an unclean WAL read-only after the crash caused SQLite `disk I/O error`; the snapshot is now read and closed immediately before the crash, while the real second application performs normal read-write WAL recovery.
- The safe board-phase canonical timer is `paused` with `startedAt=null`, not `idle`; the E2E asserts that exact engine-owned state.

Final E2E:

```text
npx playwright test
2 passed (1.3m)
```

This covers the existing complete fixture-backed match and the new process-restart Resume/History story.

## Verification

```text
npm run test:run
Test Files 38 passed (38); Tests 211 passed (211)

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

## Self-review

- Recovery: no snapshot validation, cursor, pruning, contiguous-prefix, row/payload cross-check, transaction, migration, or timer guarantee was removed or weakened.
- Privacy: the public bridge exposes none of the three Task 11 calls; strict history responses reject extra/private fields; notices contain only numeric sequence metadata; no new logging or network path exists.
- React: async effects cancel on unmount/API replacement, resumable truth belongs to the exact API instance, late Resume results cannot overwrite newer navigation, static components remain module-level, and no data-fetch waterfall or duplicated global listener was added.
- Accessibility: Home actions are native buttons with accurate disabled states; History uses headings, time, definition and ordered lists, plus status/alert semantics; all new screens have Back navigation.
- Scope: no migration, content, gameplay rule, public clue flow, persistent team profile, setting, or final-polish work was added.

## Concern

The pre-existing dependency audit findings remain outside this surgical task. No dependency version changed.

## Fix round 1: recovery integrity and atomic completion

Addressed all four verified review findings test-first:

- Snapshot recovery now requires the SQLite row cursor to equal the strict snapshot state's embedded `eventSequence`. Both ahead and behind corruption fall back with deterministic skipped-sequence metadata while self-sufficient snapshots remain valid after represented event rows are pruned.
- `ActionUndone` and `MatchEnded` replay now use the persisted event timestamp as the authoritative occurrence time, preserving exact event IDs and resulting state.
- Terminal events, terminal snapshot, and `completed_at` / `ended_incomplete` / `winner_team_id` are written in one SQLite transaction with the coordinator's single captured occurrence time. A forced completion-update failure proves that all event, snapshot, and metadata writes roll back together. Both incomplete endings and normal winners use this path; the separate guarded `completeMatch` method remains only for legacy reconciliation.
- Recovery reconciles a newest valid legacy terminal snapshot before skipping that entire match and considering an older incomplete match. Both incomplete endings and normal winners are excluded from Resume and appear correctly in History.
- Defensive terminal recovery is reconciled before any coordinator state, recovery metadata, revision, timer, or subscriber mutation. A throwing reconciliation probe leaves all of them byte-equivalent.

The first Electron restart rerun exposed an existing cursor inconsistency: `tickTimer` emitted `TimerExpired` without advancing `state.eventSequence`, so the newly strict cursor check correctly rejected the terminal History snapshot. A focused RED reproduced the mismatch (`expected 2, received 1`). Timer expiry now advances the state cursor while retaining the event ID's pre-transition cursor, making live persistence and replay exact.

Verification:

```text
Focused persistence/coordinator GREEN: 45 passed
Focused timer/recovery/coordinator GREEN: 43 passed
npm run test:run: 38 files passed; 220 tests passed
npm run lint: exit 0
npm run typecheck: exit 0
npx playwright test: 2 passed (1.3m)
npm run build: Electron Forge packaged win32 x64; exit 0
npx electron-forge package --platform win32 --arch x64: exit 0
PACKAGED_SEED_OK bytes=188416
PACKAGED_WIN32_X64_NATIVE_OK bytes=1989632
```

Final audit confirmed that contiguous-prefix replay, row/payload validation, transaction rollback, pruned-history support, migration behavior, timer retry/disposal, multi-match ordering, safe recovery metadata, public privacy, and terminal History truth remain intact. No TSX files changed in this fix round, so the prior React review remains applicable without new renderer surface area.

## Fix round 2: corrupt terminal snapshot reconciliation

Closed the remaining corrupt-terminal fallback gap. When the newest terminal snapshot is corrupt but a strict valid predecessor plus the repository-validated contiguous event prefix replays to a terminal state, the coordinator now passes that exact replayed state back to the guarded legacy completion API. The repository strict-parses it, requires the same match ID and terminal phase, and verifies its embedded cursor equals the latest persisted event sequence inside the transaction. It then atomically inserts a new valid terminal snapshot and updates completion metadata. History therefore reads the repaired newest snapshot, and the match is no longer resumable.

The canonical recovered completion timestamp is the persisted event occurrence that caused replay to cross into `phase=complete`: `MatchEnded.at` for incomplete endings and the winning `CommandApplied.at` for normal completion. Tests prove an incomplete event at `700` records `completedAt=700` even when the coordinator clock is `800`, and a winner event at `900` records `completedAt=900` with coordinator clock `1000`. A defensive already-terminal repository response with no replayed terminal event retains the coordinator clock fallback; the normal repository never exposes a valid terminal snapshot.

Negative coverage rejects wrong match ID, nonterminal state, cursor mismatch, invalid strict schema, snapshot insertion failure, and completion update failure. Each rejection leaves snapshot rows and completion metadata unchanged; coordinator probes additionally prove byte-equivalent state/revision/timers and zero host/public publication. The insertion and completion failure probes demonstrate transaction rollback across the repaired snapshot and metadata update.

Verification:

```text
Initial RED: 4 failed / 10 passed
Focused persistence/coordinator/history GREEN: 5 files; 56 tests passed
npm run test:run: 38 files; 230 tests passed
npm run lint: exit 0
npm run typecheck: exit 0
npx playwright test: 2 passed (1.3m)
npm run build: Electron Forge packaged win32 x64; exit 0
npx electron-forge package --platform win32 --arch x64: exit 0
PACKAGED_SEED_OK bytes=188416
PACKAGED_WIN32_X64_NATIVE_OK bytes=1989632
```

The first E2E packaging attempt did not execute application assertions because a previously launched packaged executable held the exact `out/quiz-stage-desktop-game-win32-x64` directory. After terminating only that identified packaged PID tree, the unchanged two-test Electron suite passed. No renderer, preload, IPC, public projection, migration, or content file changed in this fix round.

## Fix round 3: same-call multi-match fallback

`GameCoordinator.resumeLatest()` now continues recovery after a corrupt terminal candidate is durably reconciled. It re-queries repository authority and adopts the next older valid incomplete match in the same host call, so Home does not incorrectly disable Resume until reload. The returned view and recovery metadata belong only to the actually adopted older match.

The iteration is bounded by durable database progress: `adoptRecovered()` returns null only after guarded completion persistence succeeds, which changes that match to `completed_at IS NOT NULL` and removes it from the finite recovery candidate set. A set of durably reconciled match IDs rejects any repeated identity with `RECOVERY_DID_NOT_PROGRESS` before a second reconciliation call. Tests prove a repeated/buggy port gets one completion call only, while real all-terminal winner and incomplete cases return null after exactly one repaired snapshot without looping.

Real application plus SQLite regressions cover both corrupt terminal shapes followed by an older valid match. Before Resume, `hasResumableMatch()` is true. One `resumeMatch()` call repairs the newest History entry, returns and adopts the older match, leaves availability true for that older incomplete match, preserves its recovery metadata, and publishes exactly one host/public update for the adopted state—never for the reconciled terminal candidate. History remains deterministic with one entry, the original terminal event timestamp, completion kind, and winner.

Verification:

```text
Initial RED: 3 failed / 22 passed
Focused recovery/coordinator/IPC/navigation GREEN: 4 files; 29 tests passed
npm run test:run: 38 files; 233 tests passed
npm run lint: exit 0
npm run typecheck: exit 0
npx playwright test: 2 passed (1.1m)
npm run build: Electron Forge packaged win32 x64; exit 0
npx electron-forge package --platform win32 --arch x64: exit 0
PACKAGED_SEED_OK bytes=188416
PACKAGED_WIN32_X64_NATIVE_OK bytes=1989632
```

No repository validation, corruption handling, cursor rule, event timestamp, timer behavior, public bridge, renderer, migration, or privacy surface changed in this fix round.
