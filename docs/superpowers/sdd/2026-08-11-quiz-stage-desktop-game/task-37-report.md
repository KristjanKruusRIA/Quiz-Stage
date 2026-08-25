# Task 37 report: Create original Classic Stage visual assets

Date: 2026-08-25

## Outcome

Task 37 is complete in commit `9d2005e` (`feat(branding): add original Classic Stage assets`). The application now has original Quiz Stage branding with no television-show logo or set likeness:

- transparent 2048×1024 cobalt/gold wordmark;
- opaque 3840×2160 Classic Stage background with a quiet UI center;
- 1024×1024 Q-shaped spotlight icon source;
- deterministic Windows ICO containing 16, 24, 32, 48, 64, 128, and 256 pixel images.

The generated sources were inspected at original resolution before acceptance. The media manifest binds each file to exact dimensions, MIME type, and SHA-256, and the shared manifest schema validates that branding contract.

## Verification

- `npm run media:build-icon` — pass.
- `npm run test:run -- tests/unit/media/imageAssets.test.ts` — 4/4 pass.
- `npm run test:run -- tests/unit/media` — 30/30 pass.
- `npx eslint scripts/build-icon.ts tests/unit/media/imageAssets.test.ts src/shared/media/contracts.ts` — pass.
- `git diff --check` — pass before commit.

Asset SHA-256 values:

- `logo.png`: `9854781b1a533fe2af0806bcbcbc688dd3b4a3bcdcc45e44bfbaea4a4886f50f`
- `classic-stage-background.png`: `3420db36b44c4e5a45f4f351aadf10b28909674391822b9168171652bf05ea20`
- `icon-source.png`: `7cb27548d5790bc5cdcb556be4f713ca99dd4a6eb05fcb530bf497dedf17731f`
- `icon.ico`: `c1263ca62cdafbcc0948b90e5ac23e0d2dba2311418892936ced76951688ed9a`

The project-wide TypeScript gate still has two pre-existing errors in `tests/unit/content/translationDiagnostics.test.ts`; Task 37 introduced no remaining TypeScript diagnostic and did not modify that content test.
