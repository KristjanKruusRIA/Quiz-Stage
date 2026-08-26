# Quiz Stage release acceptance (Task 43)

- Evidence date: 2026-08-26 (Europe/Tallinn)
- Verified baseline: `1c02fc75897cd1a0ff50a9418a06174010ca482d`
- Host: Windows 11 Pro Insider Preview 10.0.26300.9032 x64, Node.js 24.15.0, npm 11.16.0

## Decision

The Windows x64 release candidate passes the clean automated release gate and both the installer and portable package complete a full match with outbound access blocked. Content, package hardening, upgrade preservation, visual layouts, and shipped-dependency security checks pass.

The release is accepted on the tested Windows 11 x64 host. The plan's separate Windows 10 x64 manual install/play/uninstall run was not available in this environment and remains the only open cross-version sign-off. It is not represented as tested.

## Requirements checklist

| Requirement | Result | Evidence |
|---|---:|---|
| Offline after installation/extraction | Pass | `npm run verify:release`; installer and portable `scripts/smoke-package.ps1 -Mode Both`; production package inspection |
| 2–8 named, color-coded teams | Pass | strict product E2E 44/44; visual suite at 2 and 8 teams |
| Full Round One, Double Round, Daily Doubles, Final, and sudden-death rules | Pass | unit/integration suite 705 passed; strict product E2E; packaged full-match smoke |
| Easy, Medium, and Hard whole-match difficulty | Pass | content inventory 400 category sets per difficulty and complete product coverage |
| At least 6,150 bilingual, source-backed clues | Pass | 6,000 board clues + 150 Finals; 1,464/1,464 sources verified; English/Estonian evidence approved |
| Balanced deterministic boards and repeat avoidance | Pass | selector unit/integration tests and complete-match E2E |
| Public display, private host console, and single-screen fallback | Pass | product E2E, display-loss/window tests, visual screenshots |
| Autosave, resume, undo, score correction, timer control, and bad-clue reporting | Pass | durable product tests and strict product E2E |
| Bilingual editor and transactional CSV import/export | Pass | import/export, editor, validation, and persistence tests |
| Windows x64 installer and runnable portable ZIP | Pass | both final artifacts built and smoke-tested below |
| Deferred phone/network controllers | Preserved | no networked controller implementation; local host control only |
| No online play, accounts, cloud sync, telemetry, ads, or runtime downloads | Preserved | package network guard, security tests, and package inspection |
| No speech recognition or automatic judging | Preserved | host judgment remains authoritative |
| No automatic updates or official television assets | Preserved | unsigned/manual release workflow and original Classic Stage assets |
| No ARM64, 32-bit, macOS, or Linux release | Preserved | artifacts are Windows x64 only |
| No persistent team profiles/all-time leaderboard | Preserved | match history only |

## Gameplay, recovery, and display evidence

| Area | Accepted behavior | Evidence |
|---|---|---|
| Setup | 2–8 unique teams, EN/ET, Easy/Medium/Hard, packs, 5–60 second timer, single/dual display | setup and availability integration tests; full product E2E |
| Board selection | 12 distinct names, macro-topic cap, language/difficulty/round completeness, seeded least-recent fallback | board-selector tests; `npm run verify:content` |
| Round One | 6×5 board, 200–1,000 values, one Daily Double, seeded initial control | engine tests and complete-match E2E |
| Double Round | new 6×5 board, 400–2,000 values, two Daily Doubles, lowest-score control | engine tests and complete-match E2E |
| Ordinary clue | lock pauses timer; correct/incorrect scoring, lockout, control, reveal, explanation, source | engine/UI tests and packaged full match |
| Daily Double | selecting team only, legal wager bounds, configured timer, wager scoring, retained control | engine tests and strict product E2E |
| Final/ties | positive-score eligibility, private wagers, 30-second clue, ordered reveals, sudden death | engine tests and strict product E2E |
| Host recovery | pause/resume/reset, undo, reopen, reasoned score adjustment, report clue, save incomplete match | recovery, persistence, and E2E tests |
| Display modes | private/public split, single-screen waiting state, display-loss recovery | window integration and E2E tests |
| Accessibility | visible focus, keyboard commands, team numbers plus colors, reduced motion, scalable clue text | keyboard and visual Playwright suites |
| Resolution | 1280×720, 1920×1080, and 3840×2160 at 2 and 8 teams | visual Playwright 5/5; 34 generated screenshots manually inspected |

The representative 720p 2-team and 8-team boards, the long Estonian clue/extreme-score state, the 720p host console, and the 4K 8-team board were manually inspected. Player content remained readable; controls and long host forms remained usable through the intended vertical scrolling; no gameplay surface was clipped.

## Content acceptance

`npm run verify:content` passes with this exact inventory:

- 6,000 board clues, 1,200 complete five-clue category sets, and 1,200 distinct category names.
- 150 Final clues.
- Easy 400 sets, Medium 400 sets, Hard 400 sets.
- Round One 600 sets and Double Round 600 sets; each difficulty/round cell has 200 sets.
- 1,464/1,464 source checks pass with zero source failures.
- 4,171 conservative translation warnings are tied to reviewed evidence exceptions; blocking errors are zero and waivers are zero.

Artifact hashes:

- `resources/content/seed.sqlite`: `50223d05453c369aa71d996c8d9b7488af2f795c89259520bea9502fb5ce9ed4`
- `content/reports/release-inventory.json`: `f9fd519c4c96afdd499069c9c15c0ce4f0f87d7ade800432a936e1e0b5e54ffe`
- `content/reports/source-check-cache.json`: `c803984386eb8b8f2749e010ca203bcf3ea3b0b697e40db0534fcf864707f583`

## Clean-checkout and package evidence

The release was verified in the detached clean worktree `E:\git\jeopardy-task43-release`. The complete clean release workflow passed at `4478fa3`; the final artifacts were rebuilt and re-smoked after the checkout-independent report-path fix at `1c02fc7`.

| Gate | Result |
|---|---|
| `npm ci` | Pass from an empty dependency tree |
| `npm run verify:release` | Pass in 1,435.6 seconds |
| Unit/integration | 86 files; 705 passed; two nonblocking pre-package registrations skipped because package payloads are produced later in the same release gate |
| Strict Electron product E2E | 44/44 passed, zero skips |
| General Playwright E2E | 44/44 passed |
| Installer packaged full offline match | Pass |
| Portable packaged full offline match | Pass |
| Upgrade preservation | Pass; custom content, reports, settings, history, incomplete autosave, and media preserved |
| Final baseline package rebuild/smoke/upgrade | Pass in 359 seconds |
| Package hardening | Pass; ASAR integrity and app-only-from-ASAR enabled, dangerous Electron environment/CLI fuses disabled |
| Visual Playwright | 5/5 passed in 72.3 seconds; 34 screenshots |
| Final documentation-baseline gate | Lint and typecheck pass; 86 test files / 707 tests pass; `npm run verify:content` pass; `git diff --check` pass |

Final artifacts:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `out/make/installer/QuizStageSetup.exe` | 159,518,720 | `da6d9fb17de07486b7e2118eac4d0b616fe1bea323cfd70af9a3ef859d47c029` |
| `out/make/portable/QuizStage-win32-x64.zip` | 164,529,802 | `2f331a853562547cf85957a0cb964d7b41b35e65e1ec8272a852f21cf3e023d1` |
| `out/make/release-checksums.txt` | 196 | `a0dd61b9a3758be97997a7b65758de93a297738029addbb37f149c85378788d7` |

The installer and packaged executable are intentionally unsigned (`NotSigned`), so Windows SmartScreen may warn. Shipped dependencies pass `npm audit --omit=dev --audit-level=high` with zero vulnerabilities. The complete development tree reports 28 advisories in packaging/development tooling (3 low, 24 high, 1 critical); they are not shipped runtime dependencies and have no available nonbreaking upgrade at this baseline.

## Operating-system matrix

| Platform | Installer | Portable | Offline match | Uninstall/cleanup | Status |
|---|---:|---:|---:|---:|---|
| Windows 11 Pro Insider Preview 10.0.26300.9032 x64 | Pass | Pass | Pass in both packages | Pass; no `%LOCALAPPDATA%\QuizStage` or task temp residue | Accepted |
| Windows 10 x64 | Not run | Not run | Not run | Not run | Open external sign-off |

## Final status

All implementation, content, deterministic seed, package, Windows 11, offline-match, upgrade, visual, and documentation gates available in this environment pass. The only unclosed Task 43 checklist item is the independent Windows 10 x64 manual package run. See `docs/known-limitations.md` for release boundaries.
