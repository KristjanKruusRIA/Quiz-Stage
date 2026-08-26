# Task 38 report: Apply final Classic Stage presentation

Date: 2026-08-25

## Outcome

Task 38 is complete in commit `cffcc60` (`feat(ui): apply final Classic Stage presentation`). The original Task 37 branding is now rendered through the hash-verified media protocol and applied consistently across the Home screen, 6×5 board, ordinary clue, Daily Double, Final category, Final clue, winner, and host console.

The presentation uses the shared cobalt/gold Classic Stage tokens, keeps public clue text above the required 4.5:1 contrast threshold, and scales without page overflow at 1280×720, 1920×1080, and 3840×2160. Finite entrance motion uses opacity and transform only; reduced-motion modes collapse animation and transition durations immediately. The board itself remains geometrically stable during entry so dense 8-team layouts never leave the viewport.

Branding URLs are accepted only for the two manifest-bound assets. The main-process service verifies each asset hash before serving it, the offline renderer allows only the exact branding paths, and renderer CSP permits the existing custom media scheme without enabling network access.

## Verification

- `npm run test:run -- tests/unit/media tests/unit/renderer/game tests/integration/security/offlineRenderer.test.ts` — 15 files / 81 tests pass.
- `npx eslint` over every changed TypeScript/TSX file and focused test — pass.
- `node node_modules/@playwright/test/cli.js test tests/visual/classic-stage.spec.ts tests/visual/game-layout.spec.ts --workers=1 --reporter=line` — 5/5 pass.
- 24 final screenshots manually inspected: eight required states at 720p, 1080p, and 4K, including the 8-team host console.
- Automated visual assertions cover viewport containment, long Estonian team names, signed six-digit scores, focus visibility, minimum type sizes, clue contrast, animation completion, and reduced-motion behavior.
- `git diff --check` — pass before commit.

The project-wide TypeScript gate still reports only the two pre-existing errors in `tests/unit/content/translationDiagnostics.test.ts` at lines 487 and 521. Task 38 did not modify that file.
