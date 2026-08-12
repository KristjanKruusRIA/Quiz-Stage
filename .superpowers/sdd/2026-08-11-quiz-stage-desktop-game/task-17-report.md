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
