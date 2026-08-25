# Release Acceptance Checklist (Task 43)

Date: 2026-08-13
Workspace: `E:\git\jeopardy`

## 1) Task 43 status

`Task 43` remains open only for the source-check and package-smoke gates. The packaged renderer-root and portable user-data blockers are fixed.

## 2) Completed plan items (Task 42/43 setup)

- Required CI/release workflow files exist:
  - `.github/workflows/ci.yml`
  - `.github/workflows/release.yml`
- Release artifacts/docs exist:
  - `README.md`
  - `docs/known-limitations.md`
  - `docs/portable-upgrades.md`
  - `docs/release-acceptance.md`
- Upgrade fixture and verification script are present.

## 3) Verified local gates

Executed:

- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run test:run` - 75 files / 540 tests pass
- `npm run build` - pass
- `npm run test:e2e` - 34 passed / 1 packaged-smoke test skipped pending an executable
- Durable import regression - pass: importing a duplicate pack now invalidates the selection cache, so it is immediately playable without restarting Electron.

## 4) Content evidence

- `content/reports/release-inventory.json` in workspace reflects production inventory thresholds met:
  - 6000 board clues
  - 1200 category sets
  - 1200 distinct category names
  - 150 final clues

## 5) Remaining release gates

- `npm run verify:content` currently returns `1` after reporting the expected inventory counts. The failure comes from its source-check subgate; it emits no diagnostic and must be resolved without making live endpoint calls during this work.
- Re-run local packaging and smoke checks from a clean checkout:
  - `npm run make:installer`
  - `npm run make:portable`
  - `pwsh -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both`
  - `pwsh -File scripts/verify-upgrade.ps1 -PackageRoot out/make`

The combined make-and-smoke invocation on 2026-08-13 exceeded five minutes without returning output and was terminated by the runner, so these artifact checks have no current pass result.

