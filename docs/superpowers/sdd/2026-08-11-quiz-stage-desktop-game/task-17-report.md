# Task 17 report: display recovery, accessibility, and responsive layouts

## Status

Implemented host-authorized display recovery without game-state mutation; responsive 720p, 1080p, and 4K host/public
layouts for 2–8 teams; visible keyboard focus and full keyboard-only match play; and persisted explicit reduced motion that
combines with the operating-system preference. Task 8 window recreation, bootstrap, coordinator ownership, revision
subscriptions, and current-sender authorization remain unchanged.

## Display recovery contract

- `WindowManager` owns a narrow injectable display port and listens for display removal and metric changes. It matches
  live windows by their bounds, keeps and relocates the host safely, and never reads or mutates coordinator/game state.
- An affected public window is not moved until an asynchronous host-parented, localized confirmation resolves true.
  Rapid events deduplicate while a confirmation is pending. Decline leaves the surface untouched and a later display
  event can retry.
- Acceptance moves a live public surface fullscreen to a remaining display or recreates an already destroyed surface
  through the existing Task 8 creation/bootstrap path. Window-close races, missing displays, destroyed refs, and
  disposal cannot prompt or recreate during shutdown.
- The prompt contains only fixed localization strings; no game state, clue, team, score, or private data enters it.

## Responsive and accessibility contract

- Gameplay uses bounded `dvh` grids, `minmax()`, `clamp()` typography, responsive score cards, six-column/five-row board
  tracks, and a scroll-contained host console. The document itself does not scroll at the six required board fixtures.
- Focus uses a high-contrast focus-visible outline plus separation shadow. Native labels, roles, unique accessible names,
  and the existing shortcuts support setup, board selection, Daily Doubles, judgment/reveal, Final wagers/reveals, and
  match completion without mouse actions.
- Appearance settings are a separate strict host-only persisted record with one `reducedMotion` boolean. It is not added
  to Task 16's five-field audio contract. Both `prefers-reduced-motion` and the explicit renderer data attribute suppress
  nonessential animation, transition, and smooth scrolling.

## TDD and debugging evidence

Initial display RED produced four expected failures for absent prompt, reassignment, recreation, and host relocation;
the shutdown case already passed. Focused GREEN is 12/12 across the new display suite and existing Task 8 window suite.

Appearance RED failed on the absent repository/module and missing bilingual setting. Focused GREEN is 4/4.

The first keyboard run exposed asynchronous transition races in the test. Systematic evidence showed the authoritative
pending guard behaved correctly; the test now condition-waits for either a Daily Double wager or lockable team, then
uses native focus and Enter submission. The complete 60-clue keyboard-only match passes.

## Verification

```text
npm run lint
exit 0

npm run typecheck
exit 0

npm run test:run
Test Files 63 passed (63)
Tests 449 passed (449)

npx playwright test tests/visual/game-layout.spec.ts --workers=1
2 passed (six screenshot resolution/team fixtures)

npx playwright test tests/e2e/keyboard-only.spec.ts --workers=1
1 passed (complete 60-clue match, Daily Doubles, Final, winner)

npx playwright test tests/e2e --workers=1
6 passed (3.4m)

npm run build
Electron Forge package win32/x64; exit 0

npm run make:portable
Electron Forge ZIP win32/x64; exit 0
```

Screenshots were generated for 2 and 8 teams at 1280x720, 1920x1080, and 3840x2160. The 720p and 4K 8-team
artifacts were inspected directly: categories remain aligned, score cards and board stay in viewport, board values and
categories scale, and the host controls remain available in their dedicated scroll-contained region.

## React review

No component is defined inside another component. Persistent appearance loading remains an external subscription/I/O
effect, user saves remain event-driven, and renderer data is derived without duplicate game authority. Existing audio,
game, and media states retain separate ownership; no runtime dependency was added.

## Artifacts

- Portable ZIP: 157,099,625 bytes, SHA-256 `322906399C6DC6B65623DD3009ADF03EB64BF3590670C51C4A61C17E4B2A5D58`.
- Packaged executable: 225,442,304 bytes, SHA-256 `EE4777567F254CC96304D179E3F91E713D67944E08316FEB7C09818BB51C4CB4`.

## Fix round 1 (2026-08-12)

- Display confirmation is now bound to the triggering public `BrowserWindow` and web-contents generation. A stale
  confirmation cannot move a replacement, a recovered/non-orphaned window, a destroyed window, or a disposed manager.
- Appearance is a strict, persisted version-1 record with monotonic revision conflict detection and lossless migration
  of the earlier unversioned boolean. The current public sender receives only a read-only validated projection, with
  live-listener-before-bootstrap ordering and stale-revision suppression. Host and public apply the explicit preference
  to the document root; OS preference remains an independent CSS reduced-motion trigger.
- Settings fail closed until both audio and appearance are ready, expose localized load/save errors and Retry, and use
  load/save sequence plus revision ownership so delayed reads and stale saves cannot overwrite newer live settings.
- Authored team names are capped at 32 characters in the shared start-match schema and native input. Persisted legacy
  game-state parsing remains unbounded so old long-name snapshots still resume. Score cards constrain their flex content,
  allow predictable name wrapping, and keep signed six-digit scores on one line.
- Global Space now ignores native and ARIA interactive controls; body/surface Space retains the timer shortcut. The
  complete keyboard E2E now uses native Space for setup, Lock, Correct, Continue, Daily Double and Final actions, tests
  Shift+Tab/focus restoration, exercises Undo recovery, and remains mouse-free.

### Fix-round TDD and verification

RED first reproduced all five reviewer findings: stale display confirmation moved a replacement; public preload lacked
appearance; appearance had no revision/version; setup names had no maximum; and interactive Space invoked the timer.
Additional RED tests reproduced delayed appearance read reversal and swallowed appearance-save errors.

```text
npm run lint
exit 0

npm run typecheck
exit 0

npm run test:run
Test Files 63 passed (63)
Tests 457 passed (457)

npx playwright test tests/visual/game-layout.spec.ts --reporter=line
3 passed (ten screenshot artifacts: six 2/8-team board sizes plus max-name/signed-score ET board+clue at 720p/4K)

npx playwright test tests/e2e/{audio-settings,content-editor,core-match,i18n,keyboard-only,resume-match}.spec.ts
Each isolated spec passed (6/6 total). A combined run's immediate inter-spec Forge repack reproduced a Windows EBUSY
release delay after the first pass; exact executable inspection found no persistent worktree process, and every isolated
subsequent package completed.

npm run make:portable
exit 0

npm run make:installer
Squirrel packaging completed, but distributable creation failed on the repository's pre-existing empty `author` field
(`Authors is required`). Task 17 does not change product publishing metadata.
```

The final screenshots were inspected directly. At 1280x720 and 3840x2160, maximum-length Estonian team names wrap
inside their cards, ±999999 scores remain intact, focus is visibly separated from the viewport edge, category/value
tracks align, and board/clue content stays within the gameplay viewport. Host controls remain intentionally scrollable
inside the dedicated console rather than creating document scrollbars.

React review found no component definitions nested in render, no duplicated game authority, and no effect-driven user
actions. Appearance bootstrap remains an external subscription effect; writes remain event-driven; memoized API and
callbacks have complete dependencies.

Updated artifacts:

- Portable ZIP: 157,100,206 bytes, SHA-256 `DD47038DE78178294935D45869A368804FD64CBB7E0E499916845CBD887D13DD`.
- Packaged executable: 225,442,304 bytes, SHA-256 `7BA623EC8E68132A54DD6FF92295351408771A0BE9CD0A54CC6E7A6FF4FB5877`.

## Fix round 2 (2026-08-12)

- Shortcut policy is now key-specific. Space always yields to native and ARIA interactive controls so it cannot
  double-activate a focused button. Team-number, C, X, R, U, and M shortcuts remain global while non-editable buttons,
  links, and ARIA controls hold focus. Character shortcuts yield only to typing contexts (text/number inputs, textarea,
  select, contenteditable, textbox, and spinbutton); modifier and repeat protections remain unchanged.
- New-match authoring continues through the 32-character `gameConfigSchema`, while persisted `GameState` uses an
  otherwise identical backward-compatible config schema with unbounded nonempty team names. A 40+ character Unicode
  name is verified through snapshot fallback, event replay, a later command, match history, host rendering, and public
  rendering without normalization or truncation. This does not widen start-match or command IPC inputs.
- Appearance persistence completes before best-effort renderer notification. Host and public window references are
  re-read separately; destroyed or throwing web contents are isolated so one surface cannot reject the durable save or
  prevent the other current surface receiving it. Replacement surfaces still obtain the current revision through their
  validated bootstrap, and delayed bootstrap is inert after subscription teardown.

### Fix-round verification

```text
npm run lint
exit 0

npm run typecheck
exit 0

npm run test:run
Test Files 63 passed (63)
Tests 463 passed (463)

npx playwright test tests/e2e/keyboard-only.spec.ts tests/visual/game-layout.spec.ts --reporter=line
4 passed

Existing E2Es serialized with exact worktree-executable cleanup checks:
audio-settings, content-editor, core-match, i18n, keyboard-only, resume-match
6/6 passed

npm run build
exit 0

npm run make:portable
exit 0
```

React review: no production TSX changed in this round. The added renderer assertion uses existing top-level components
and authoritative fixtures; no nested component, derived-state effect, or new render authority was introduced.

Updated artifacts:

- Portable ZIP: 157,100,411 bytes, SHA-256 `0CD7B45DA624DFB1750086FEDAA76BDC33E263BADB8D6516208D3512AD14E1D0`.
- Packaged executable: 225,442,304 bytes, SHA-256 `FE7AA21C5B8F72A443C390C0BD7D71719E015E151A9ED7EDF8799A32636EE20A`.
