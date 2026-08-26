# Task 43 report: Execute and record final acceptance

Date: 2026-08-26

## Outcome

The Quiz Stage Windows x64 release candidate is verified at baseline `cc4fe45874e10405065cb49612d5d8e71c297c23`. A clean install completed the full release workflow, the production seed passed every inventory and source gate, and both the installer and portable package completed a full match with outbound network access blocked. The final package rebuild, package hardening inspection, visual suite, checksum generation, and upgrade-preservation run all pass.

Acceptance is complete on Windows 11 x64 and Windows 10 x64. The Windows 10 run used Microsoft Windows 10 Pro 22H2 build 19045 in a disposable Hyper-V guest with its network adapter disconnected.

## Release-hardening changes

- `35175db` — restored a clean release installation with the Electron-compatible fuses API and clean TypeScript/lint state.
- `6104f92` — separated pre-package test registration from the mandatory later packaged smoke gate.
- `7aa0b95` — prepared clean Electron packaging, including the Electron-compatible `better-sqlite3` native module and explicit package script permissions.
- `6943837` — prevented the strict product gate from reporting an intentional pre-package package-smoke skip.
- `4478fa3` — removed the Daily Double E2E synchronization race by waiting for either wager or clue state.
- `1c02fc7` — made release-report paths checkout-independent while preserving every inventory count, source result, reviewed warning, and seed byte.

Every fix was driven by a failing focused regression or a clean-worktree release failure. The clean `npm ci && npm run verify:release` at `4478fa3` completed in 1,435.6 seconds. Unit/integration tests passed 705 assertions in 86 files; strict Electron product E2E passed 44/44 with zero skips; general Playwright passed 44/44; `npm run verify:content` passed; and installer/portable full-match smoke plus upgrade preservation passed. After the checkout-independent report-path regression was added and final artifacts were rebuilt at `1c02fc7`, the documentation-baseline gate passed 707/707 tests in the same 86 files, plus lint, typecheck, content verification, and diff checks.

## Production content

The deterministic production database contains 6,000 board clues, 1,200 complete category sets, 1,200 distinct category names, and 150 Finals. Difficulty allocation is exactly 400/400/400; each difficulty/round cell contains 200 sets. All 1,464 source checks pass. The 4,171 conservative translation warnings have reviewed evidence exceptions, with zero errors and zero waivers.

The final seed SHA-256 is `50223d05453c369aa71d996c8d9b7488af2f795c89259520bea9502fb5ce9ed4`.

## Package evidence

- Installer: `out/make/installer/QuizStageSetup.exe`; 159,518,720 bytes; SHA-256 `da6d9fb17de07486b7e2118eac4d0b616fe1bea323cfd70af9a3ef859d47c029`.
- Portable ZIP: `out/make/portable/QuizStage-win32-x64.zip`; 164,529,802 bytes; SHA-256 `2f331a853562547cf85957a0cb964d7b41b35e65e1ec8272a852f21cf3e023d1`.
- Checksum manifest: `out/make/release-checksums.txt`; 196 bytes; SHA-256 `a0dd61b9a3758be97997a7b65758de93a297738029addbb37f149c85378788d7`.

The package inspector confirms ASAR integrity and app-only-from-ASAR fuses are enabled while RunAsNode, Node options environment variables, and Node CLI inspection are disabled. Both packages are intentionally unsigned and report `NotSigned`, so SmartScreen warnings are expected. The shipped dependency audit reports zero vulnerabilities. The full development tree retains 28 Electron Forge/package-tooling advisories that are not present in shipped runtime dependencies and have no nonbreaking fix at this baseline.

## User-facing verification

The visual Playwright suite passed 5/5 and produced 34 screenshots across 1280×720, 1920×1080, and 3840×2160. Representative 2-team and 8-team boards, a long Estonian clue with extreme scores, the 720p host console, and the 4K 8-team board were inspected manually. Text remained readable, gameplay surfaces were not clipped, and long host forms remained usable by intended vertical scrolling. Keyboard and reduced-motion paths are covered by the product/visual suites.

Installer and portable package smoke each completed an offline match on Windows 11 Pro Insider Preview 10.0.26300.9032 x64. Installer cleanup left no `%LOCALAPPDATA%\QuizStage` directory; task-specific temporary roots were removed. The real application upgrade preserved custom content, reports, settings, history, incomplete autosave, and media overrides.

## Windows 10 x64 sign-off

The exact final installer and portable ZIP were copied into a Windows 10 Pro 22H2 10.0.19045 x64 guest and independently rehashed. With the guest network adapter disconnected, each package completed a 60-clue English/Medium two-team match through Final, displayed a winner, and recorded a `Complete` Match History entry. The application recorded zero HTTP(S) requests in both runs. Setup, board, and winner screenshots from both package forms were manually inspected.

The installer uninstalled with exit code 0. The installed executable and desktop/Start Menu shortcuts were removed; only Squirrel's `.dead` tombstone/bootstrap residue remained inside the disposable guest. Squirrel logged one failed nonblocking attempt to fetch an uninstall icon from `raw.githubusercontent.com` while offline. This did not affect installation, gameplay, or uninstall and is recorded in Known Limitations.

The Windows 10 evidence record is `task-43-windows10-evidence.json`. No product, content, package, security, upgrade, visual, documentation, or cross-version blocker remains. Task 43 is complete.
