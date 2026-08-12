# Task 18 report: durable offline product gate

## Status

Implemented one authoritative `npm run verify:product` milestone gate before production content work. The gate runs lint,
typecheck, all unit/integration tests, a current-platform/current-architecture Forge package build, and every Milestone 1–2 Electron E2E, visual,
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

The scenario contains no private preload, raw IPC, game-coordinator, or filesystem-state action shortcut. Product
actions remain UI-driven; test-owned read-only SQLite connections assert the exact durable snapshots, event payloads,
report identity, generated Keep Both identities, and selected-match configuration after those visible actions.

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

## Task 18 review fix round 1

The production file policy now canonicalizes the existing renderer root once and canonicalizes/stats each requested
existing file before containment is accepted. Packaged-shaped `resources/app.asar/.vite/renderer` fixtures prove an
owned file remains allowed while a junction/symlink escape and broken link are cancelled without reading the outside
target. Missing roots, UNC/device URLs, encoded traversal, case/lookalike roots, non-files, HTTP(S), WS(S), `data:`,
and `blob:` remain denied; the pathless local audio protocol remains allowed. Electron's ASAR-aware filesystem is the
intentional production canonicalization boundary, while the integration fixture exercises the equivalent directory
shape without requiring Node/Vitest to mount a real ASAR archive.

The durable scenario now proves exact identities and durable effects rather than presence of headings. It binds the
reported clue's stable ID and bilingual fields to the imported fixture, verifies the report closes that clue and makes
the sole pack unavailable for a subsequent match, then corrects it through Content Library and verifies it becomes
eligible again. Read-only persistence assertions cover the exact `AdjustScore` reason and team/score, judgment delta,
`ActionUndone` target, exact score restoration, rejudgment, paused timer anchor/remaining state, crash/relaunch identity,
and exact resumed host-private/public-redacted fields. History assertions compare all eight names, competition ranks,
scores, completion state, pack, and seed with the completed durable snapshot.

The exported CSV is parsed independently with `parsePackCsv`/`validatePack`; all 61 exact rows, stable IDs, bilingual
board/Final fields, corrected enabled clue, and deterministic source metadata are compared. Keep Both is asserted to
produce a main-generated pack ID, 13 rewritten category IDs, 61 rewritten clue IDs, and zero collisions. The test then
selects only that generated pack through Setup, proves Estonian/Hard availability, starts a match, and verifies its
persisted pack ID and 60-clue board.

The public environment skip flag was removed. The product runner now creates a mode-`wx`, per-run random-token stamp
containing SHA-256 fingerprints of all source/test/config inputs, required Vite outputs, the current-platform packaged
executable, and packaged `app.asar`. Every Playwright worker recomputes and validates it; missing, mismatched, inherited,
or stale stamps fail closed. Standalone specs still build normally. Forge arguments, Electron/package/archive paths,
and exact tree termination are platform-specific for Windows, Linux, and macOS; Windows uses exact `taskkill /PID /T /F`
and POSIX uses the exact negative PID process group. Stamp directories are removed both after the child and on runner
exit, including stamp-creation failures.

Review RED/GREEN evidence:

```text
Initial focused RED: 2 files failed, 10 failures (junction allowed, missing root accepted, eight gate APIs absent)
Canonical containment/gate focused GREEN: 2 files, 26/26 tests
Durable runtime RED: locale-specific Hard label after switching to Estonian
Durable runtime GREEN: 1/1 passed (50.2s)
First fresh gate RED after 486/486 tests/build: nonexistent vite.renderer.config.mts stamp input
Cross-platform package-path RED: 2/26 tests (host path.join leaked Windows separators for Linux/macOS)
Final exact npm run verify:product: exit 0
  lint: exit 0
  typecheck: exit 0
  Vitest: 65/65 files, 489/489 tests
  electron-forge package: current win32 x64, exit 0
  Playwright: 10/10 passed (2.1m), 0 skipped
```

Final cleanup found no Electron process referencing this worktree, no remaining `quiz-stage-product-gate-*` stamp
directory, no skipped/focused Milestone tests, and no diff whitespace errors.
