# Task 18 report: durable offline product gate

## Status

Implemented one authoritative `npm run verify:product` milestone gate before production content work. The gate runs lint,
typecheck, all unit/integration tests, a Win32 x64 Forge package build, and every Milestone 1–2 Electron E2E, visual,
responsive, localization, audio, recovery, content-editor, and keyboard-only test. Its Playwright runner rejects focused
tests, fails when no tests are discovered, and parses the JSON report to fail on any skipped test.

## Durable cross-feature scenario

`tests/e2e/durable-product.spec.ts` uses one isolated workspace-owned profile and only product UI/keyboard actions,
apart from guarded E2E clock/network observation and Electron dialog selection:

- Imports a deterministic, complete 61-row bilingual custom CSV pack through Content Library: six Hard Round One sets,
  six Hard Double Round sets, and one Hard Final clue.
- Configures eight unique localized teams, Estonian, Hard, five-second clues, only the custom pack, and dual display.
- Verifies the host receives Estonian private response/explanation/source plus the English comparison while the public
  window receives neither English nor unrevealed Estonian response, explanation, source, report note, or score reason.
- Reports the active clue, sets a score with a nonblank reason, judges a later clue, undoes that judgment, judges again,
  and continues safely.
- Pauses a later active clue, kills only the exact launched Electron PID tree, relaunches the same profile, chooses
  Resume through Home, and verifies the exact prompt, scores, paused timer, private content, and public redaction.
- Completes all remaining Round One and Double Round clues, handles all three Daily Doubles, completes Final, verifies
  completed History, standings, pack identity, and the persisted nonempty seed.
- Exports the custom pack through the save dialog and reimports it with Keep Both through the import preview.
- Audits renderer console/page errors and the main blocked-request observer, then closes the exact application and
  recursively removes the isolated run directory in `finally`.

The scenario contains no database, private preload, raw IPC, game-coordinator, or filesystem-state shortcut. The CSV
fixture is data selected through the product import dialog; gameplay, reporting, scoring, undo, recovery, History,
export, and re-import are all exercised through visible product surfaces.

## Production offline policy

Added `registerOfflineRendererPolicy`, installed on `session.defaultSession` before database/application/window startup
and removed during application shutdown. Production permits only renderer files contained below the packaged renderer
root and exact `quiz-stage-media://asset/<key>` requests. Development additionally permits only the configured exact
`http://localhost:<port>` or `http://127.0.0.1:<port>` Vite origin and the corresponding exact `ws:` host/port.

The policy rejects external HTTP(S), WS(S), renderer/preload attempts, unrelated or escaping `file:` URLs, `data:`,
`blob:`, credential-bearing URLs, localhost lookalikes, wrong ports, and malformed custom-media URLs. Navigation and
window creation remain independently denied by the existing main-process window policy. The custom media protocol and
byte-range audio behavior remain green.

The renderer CSP remains local-only and no longer permits `data:` images. The unsupported `frame-ancestors` meta
directive was removed after the durable console audit proved Chromium ignores it; main-process navigation/window
blocking remains the effective boundary.

`tests/integration/security/offlineRenderer.test.ts` exercises the real policy registrar, strict development-origin
parser, production allowlist, main-frame/renderer/preload request types, protocol shape, teardown, blocked-request audit,
and exact CSP.

## TDD and systematic-debugging evidence

Initial RED:

```text
npm run test:run -- tests/integration/security/offlineRenderer.test.ts
FAIL: Cannot find module '../../../src/main/offlineRenderer'

npm run verify:product
FAIL: Missing script: "verify:product"
```

The first durable E2E run reached the real import preview and failed because the fixture encoded Final with a blank tier;
the UI reported the exact tier-0 validation errors. After fixing the fixture, role/label assertions were aligned to the
rendered Estonian accessibility contract. A final full-flow console assertion exposed Chromium's inert meta-CSP warning;
removing the ignored directive produced a clean run.

Two existing seeded-test assumptions surfaced only in the complete gate and were corrected at their roots:

- The maximum-name visual test now condition-waits for a Daily Double wager and commits it before asserting clue layout.
- The keyboard-only test now presses the number of the actually enabled lockable team, required when a Daily Double's
  controlling team is not team 1.

Focused GREEN:

```text
Offline policy: 13/13 passed
Durable product E2E: 1/1 passed (40.4s)
Maximum-name visual regression: 1/1 passed (21.2s)
Keyboard-only regression: 1/1 passed (30.8s)
Combined Playwright milestone runner: 10/10 passed, 0 skipped
```

## Final verification

Fresh authoritative command:

```text
npm run verify:product

lint: exit 0
typecheck: exit 0
Vitest: 64/64 files, 476/476 tests
electron-forge package: win32 x64, exit 0
Playwright: 10/10 tests passed (1.6m)
Product Playwright gate: 10 tests, 0 skipped.
overall exit: 0
```

Final audit found no `test.skip`, `test.only`, `describe.skip`, `describe.only`, or `test.fixme` markers in milestone
specs, no Electron process whose command line referenced this worktree, no remaining isolated durable run directory,
and no `git diff --check` errors. No dependency version or production content changed.
