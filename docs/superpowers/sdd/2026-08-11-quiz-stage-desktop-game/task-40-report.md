# Task 40 report: Complete the full gameplay and regression E2E matrix

Date: 2026-08-25

## Outcome

Task 40 is complete in commit `005db45` (`test(e2e): cover complete bilingual match matrix`). The 24-case matrix now completes and persists every combination of two or eight teams, easy/medium/hard difficulty, English/Estonian gameplay, and single/dual display mode. Each case plays all 60 board clues, records three Daily Doubles, completes Final, and verifies the persisted winner.

Focused product scenarios now cover nonpositive teams skipping Final, ten successive all-team sudden-death misses before a winner, invalid Daily Double wager bounds, invalid clue reporting, score corrections with reasons, undo after an incorrect judgment, accelerated timer expiry, host-only privacy, public-window recreation, corrupt replacement-audio fallback, controlled missing-media responses, and previous-schema migration with a readable pre-migration backup. The existing durable-product E2E continues to cover undo after a correct judgment and crash/resume persistence.

The deterministic development seed contains twelve hard Final clues so the ten-successive-tiebreaker scenario never reuses a clue. This Task 40 matrix deliberately uses that fixture: production content remains deferred under the approved sequencing, so this report does not claim the production-seed release gate is complete.

## Verification

- Focused Task 40 Playwright gate — 32/32 pass in 5.3 minutes.
- Full Playwright and visual sweep — 44 pass, 1 intentional skip, 0 failures across 45 tests in 7.7 minutes.
- Development-seed builder and persistence integration sweep — 2 files / 11 tests pass.
- Focused ESLint over all changed TypeScript files — pass.
- `git diff --check` — pass before commit.
- Full Vitest sweep — 698/701 pass. The three failures are the pre-existing deferred-content boundaries: two report-placement expectations and the blocking production-seed validation.
- Project TypeScript gate reports only the two pre-existing errors in `tests/unit/content/translationDiagnostics.test.ts` at lines 487 and 521. Task 40 did not modify that file.
