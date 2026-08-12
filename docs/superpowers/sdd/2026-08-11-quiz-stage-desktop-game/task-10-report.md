# Task 10 report: complete fixture-backed match UI

## Status

Implemented the complete accessible fixture-backed gameplay surface for host and public renderers, including both boards, ordinary clues, Daily Doubles, Final, sudden death, winner/incomplete recovery presentation, exact shortcuts, timestamp-derived timers, and a deterministic full Electron match.

## Authorized contract extensions

Task 8's public projection did not contain the safe facts required for the approved screens. The root task authorized these minimal extensions before shared/main edits:

- Public projection: concrete display mode, copied timer, phase-appropriate control/winner IDs, current tiebreaker contenders, localized Final category, eligible Final teams, and only already-revealed `{teamId,wager,correct}` results.
- Canonical state: persisted `finalJudgments` with legacy snapshot/undo defaults and strict team/reveal validation.
- Canonical Final content: optional backward-compatible `categoryName`, required for newly selected Final content, preserved by the coordinator, and localized with `Final`/`Finaal` fallback for legacy snapshots.
- Final flow: the last wager activates the canonical Final clue; the first authoritative reveal makes its canonical response public; undo/replay preserve the exact hidden/revealed state.

No free-text team response, unrevealed wager/judgment, Daily Double marker, future tiebreaker clue, seed, undo frame, or recovery issue was added to the public contract. `M` remains a callback-only shortcut seam for Task 16.

## RED evidence

Initial renderer gate:

```text
npm run test:run -- tests/unit/renderer/game
Test Files 5 failed (5); all failed on missing gameplay modules; exit 1
```

Initial Electron gate reached the started match and failed at the first missing gameplay tile:

```text
npx playwright test tests/e2e/core-match.spec.ts
1 failed; first enabled board tile not found; exit 1
```

The state/projection gate produced five expected failures for missing `finalJudgments`, safe public timer/control/tiebreaker fields, localized Final category, and legacy defaults. The later Final active-clue regression produced two expected failures because committing the last wager left `activeClue=null` and the first reveal did not expose the canonical response.

## Implementation

- `PublicBoard`, `PublicClue`, and `PublicFinal` accept only `PublicGameView`; `HostConsole` and `HostTeamControls` accept only `HostGameView`.
- Single-screen composition uses only the audited shared `toPublicGameView(hostView.state)` result for Public components. No renderer cast, clone/delete redaction, or private state is passed to the public window.
- The board is a six-column/five-row CSS grid with named categories, values, native disabled used tiles, and keyboard-visible controls.
- `useDisplayedTimer` derives a nonnegative display from authoritative timestamps and a testable clock without mutating canonical state.
- `HostConsole` dispatches validated `GameCommand` intents through `desktopApi.dispatch`; the engine remains authoritative for phase legality and wager ranges.
- `useGameShortcuts` implements exactly `1–8`, `C`, `X`, `Space`, `R`, `U`/`Ctrl+Z`, and `M`, ignores repeats/modifier conflicts/editable focus, prevents default only when handled, removes its listener, and uses current callbacks.
- `App` subscribes to authoritative host/public state, keeps Home/Setup before host state, keeps public neutral before public state, and routes recovered/started matches to `GameSurface`.
- Playwright 1.62.1 and Chromium are pinned/installed. The Electron test builds Forge output, launches Electron with an isolated user-data directory, uses only a test-owned renderer clock override, and adds no production test seam.

## Fresh GREEN verification

```text
npm run lint
exit 0

npm run typecheck
exit 0

npm run test:run
Test Files 30 passed (30); Tests 162 passed (162); exit 0

npm run build
Electron Forge packaged x64 on win32; exit 0

npx playwright test tests/e2e/core-match.spec.ts
1 passed; 31.8s total, 11.0s match UI; exit 0

PACKAGED_SEED_OK bytes=188416
PACKAGED_NATIVE_OK win32-x64.node bytes=1989632

git diff --check
exit 0
```

The E2E starts a two-team English medium match through Setup, asserts exactly three Daily Doubles, completes all 60 board clues, commits every eligible Final wager, asserts the canonical Final prompt, advances the test-owned clock, reveals Final in engine order, reaches a winner, and records zero non-local requests.

## Self-review

- Phase coverage: Round One/Double boards, ordinary clue/lock/judgment/reveal, DD wager/clue/judgment, round transition, Final category/wagers/neutral waiting/clue/reveal, repeated tiebreaker presentation, winner, incomplete end, and recovery issue all have explicit paths. Repeated-clue tiebreaker rules remain engine-owned and covered by existing plus projection tests.
- Privacy: Final category is hidden before its legal phase; only current tiebreaker contenders are public; control/winner IDs are null when semantically inapplicable; canonical Final response remains hidden until the first reveal; all projected nested objects/arrays are fresh.
- Accessibility: semantic headings/regions/grid cells, visible team numbers/names, native form labels/ranges/disabled states, status/alert/timer roles, and keyboard controls are present without color-only meaning.
- Stale state/listeners: App and shortcut subscriptions return exact cleanup functions; shortcut callbacks use a current ref; public timers never decrement authoritative state; async command rejection is host-visible.
- React review: static helpers/components stay module-level, render-time facts remain derived rather than duplicated effects, the global listener is deduplicated, and no new waterfall or third-party bundle path was introduced.

## Concern

`npm install` continues to report the pre-existing transitive audit total: 3 low, 21 high, and 1 critical. Task 10 did not perform an unrelated dependency upgrade or audit fix.

## Review fix round 1

The Task 10 review identified one critical timer gap and four important UI/contract issues. They were addressed test-first without adding Task 11 history/resume UI or Task 12 durable report/override storage.

- Timed timestamp-free transitions now receive a coordinator occurrence time. That positive anchor is stored in both `event.at` and `timer.startedAt`, while legacy `at=0` replay remains compatible. Replay passes the persisted occurrence time back through the engine.
- The coordinator owns the authoritative scheduler. It clones before ticking, persists `TimerExpired` plus its snapshot before adopting or publishing, reschedules early callbacks, cancels/reschedules on every adopted state, safely anchors legacy running/null resumes, and disposes during application shutdown. Persistence failure leaves the prior canonical/public state unchanged.
- Ordinary, Daily Double, Final, and repeated tiebreaker timer starts are covered, together with pause, resume, reset, undo, early callbacks, failure isolation, legacy resume, and shutdown cleanup. Public display still derives from copied authoritative timestamps and never mutates authority.
- Host corrections now expose accessible `AdjustScore`, current-match-only `ReportClue`, and confirmation-gated `EndIncompleteMatch` controls. A synchronous shared in-flight guard prevents competing host intents; renderer prevalidation is advisory and rejected commands produce localized safe alerts without leaking internal errors.
- Board selection now synchronously blocks duplicate requests, catches rejection without an unhandled promise, shows an accessible host-only error, re-enables after current rejection, and ignores stale rejection after a newer authoritative view.
- `publicGameViewSchema` now enforces exact six-by-five boards, team identity/subset/uniqueness rules, and phase-semantic board, active clue, response, Final, tiebreaker, control, and winner combinations. The preload rejects adversarial Round One response/Final wager/judgment probes. Incomplete completion redacts residual Final/active clue data.
- `PublicBoard` now uses two rowgroups containing one six-column header row and five six-cell clue rows; CSS `display: contents` preserves the approved six-column visual layout.
- The Electron E2E records 60 distinct accessible category/value identities, asserts both Round One and Double board transitions, and observes non-local requests at the BrowserContext level for every Electron window. Final expiry uses an explicit main-process CLI seam that is refused when `app.isPackaged`; unit tests prove packaged activation is impossible. No renderer clock override or test IPC exists.

Review RED evidence:

```text
Focused timer: 3 failed / 19 passed
- timestamp-free event.at was 0
- timer.startedAt was null
- coordinator had no scheduled callback

Focused UI/contract: expected failures for shape-only public schema,
missing ARIA rows, duplicate/rejected selection handling, and missing host correction controls.

First strengthened E2E reached Final after all 60 tiles and failed at timer 26,
revealing a 30,000ms threshold edge; the scheduler receives roughly 29,999ms.
```

Fresh review GREEN evidence:

```text
npm run test:run
Test Files 33 passed (33); Tests 181 passed (181)

npm run typecheck
exit 0

npm run lint
exit 0 after React hook/ref review

npx playwright test
1 passed; 30.4s total, 11.2s full match

Win32 Forge package produced out/quiz-stage-desktop-game-win32-x64
```

Self-review confirmed expiry persistence ordering, no duplicate renderer authority, all timer lifecycle cancellation paths, strict public phase privacy, current-match-only report behavior, accessible grid hierarchy/forms/alerts, stale async selection handling, shortcut behavior unchanged, and a production-disabled E2E clock seam.

## Review fix round 2

Three remaining important findings were closed test-first while preserving the prior timer, privacy, selection, and accessibility fixes.

- Added canonical/public `clue-reveal` and the validated reversible `AdvanceAfterReveal` command. Ordinary correct/all-locked/no-answer resolution and Daily Double judgment/no-answer closure now score and mark the clue used, stop with the canonical response visible, and advance only after authoritative Continue. The advance applies the existing board, round, Final, or sudden-death progression rules.
- Public accepted clue content now contains prompt, response, explanation, and source only under an authoritative revealed state. The strict public schema rejects `responseRevealed` during ordinary clue play and requires a complete revealed clue during `clue-reveal`. Single-screen host composition uses the same audited projection.
- `ReportClue` remains an atomic direct progression for invalid content: it disables/closes the clue without entering a public reveal or exposing its accepted content. Tiebreaker report behavior remains engine-owned and unchanged.
- Host exposes an accessible Continue button. `R` dispatches `RevealResponse` while hidden and `AdvanceAfterReveal` in `clue-reveal`. The last clue remains visibly revealed before the Round One/Double transition. Undo restores the exact prior reveal state, and replay reproduces persisted Select→Reveal→Advance state exactly.
- Score corrections now use authoritative-score-keyed uncontrolled number inputs and `FormData`, so a changed team score refreshes before submission while another team’s draft and the reason remain intact. Complete matches render no adjustment, report, incomplete-end, Undo, or Reopen controls.
- Failed automatic expiry persistence schedules one generation-bound bounded retry (1000ms default, clamped 100–10000ms). Repeated failures never adopt/publish or busy-loop; eventual success durably persists one expiry before one adoption/publication. Reset/new timer, new match, host state changes, and disposal cancel stale callbacks; captured stale retries cannot cross generations or matches.

Round 2 RED evidence:

```text
Focused 41 tests: 10 failed / 31 passed
- ordinary and Daily Double resolution skipped the missing clue-reveal phase
- Continue/Advance and authoritative score rerender behavior were absent
- public schema accepted a revealed ordinary clue
- failed TimerExpired persistence left no retry callback
```

Fresh round 2 GREEN evidence:

```text
npm run test:run
Test Files 33 passed (33); Tests 190 passed (190)

npm run typecheck
exit 0

npm run lint
exit 0

npx playwright test
1 passed; 34.1s total, 15.5s full match

Electron Forge packaged x64 on win32 during the E2E preflight;
out/quiz-stage-desktop-game-win32-x64 refreshed successfully.
```

The strengthened E2E observes response, explanation, and source followed by Continue for all 60 clues (including all three Daily Doubles), asserts no board is present before Continue on clues 30 and 60, then verifies both round transitions, Final, winner, 60 distinct tiles, and zero non-local requests across the Electron BrowserContext.

## Review fix round 3

The remaining clue-report invariant was closed test-first without adding Final replacement policy or durable Task 12 reporting behavior.

- `ReportClue` now requires a non-null active clue, an exact active clue ID, and one of the explicitly supported ordinary, Daily Double wager/clue, clue-reveal, or tiebreaker phases before canonical content is resolved or state is changed.
- Inactive board clues, mismatched active IDs, board phases without an active clue, all Final phases, and complete matches reject with typed game-rule errors. Coordinator tests prove rejected commands preserve byte-equivalent authoritative state and cause no event persistence or host/public publication.
- Active ordinary and Daily Double reports disable and close only the current board clue, progress directly without accepted-content exposure, and preserve scores. Reporting from `clue-reveal` disables then advances the already-closed clue exactly once without duplicating its used ID or changing scores/control. Undo and event replay restore/reproduce the exact authoritative states.
- Active tiebreaker reports retain their established next-clue progression with unchanged scores and no future-clue public leak. Active Final reports return `INVALID_PHASE` and can never enter board closure.
- Host clue-report controls are absent throughout Final category, wagers, clue, reveal, and complete phases, while remaining available for supported current-clue phases.

Round 3 RED evidence:

```text
Focused 48 tests: 6 failed / 42 passed
- engine and coordinator accepted a report without an active clue
- Final category, wagers, clue, and reveal exposed clue-report controls
```

Fresh round 3 GREEN evidence:

```text
Focused reducer/Final/coordinator/HostConsole:
Test Files 4 passed (4); Tests 61 passed (61)

npm run test:run
Test Files 33 passed (33); Tests 199 passed (199)

npm run typecheck
exit 0

npm run lint
exit 0

npx playwright test
1 passed; 40.7s total, 15.8s full match

Electron Forge rebuilt production Vite bundles and packaged x64 on win32;
out/quiz-stage-desktop-game-win32-x64 refreshed successfully.
```

Final review confirmed report rejection happens before engine event creation and coordinator persistence/publication, no Final clue can route through board closure, bad accepted content remains private, reveal reporting is idempotent with respect to used IDs and scoring, and the strengthened full-match E2E remains offline and deterministic.
