# Task 42 report: Add Windows CI, release artifacts, offline smoke, and upgrade tests

Date: 2026-08-25

## Outcome

Task 42 release automation is complete in commit `086ca43` (`ci: verify and package Windows releases`). Windows CI and the unsigned release workflow now use Node 24.15.0, cache the Chromium Playwright browser, run the repository gates, build the exact installer and portable packages, exercise both packaged modes, verify a real application-driven schema upgrade, generate deterministic SHA-256 checksums, and upload the three release artifacts on manual dispatch or `v*` tags.

The local `verify:release` script mirrors the complete release sequence. Package smoke uses the exact product executable and layout, enables the packaged network guard, and requires a complete English/Medium two-team match with no setup alerts. The installer path is exact, installation is awaited and exit-checked, and cleanup removes the per-user installation. Temporary cleanup is restricted to task-specific directories below the system temporary root.

Upgrade verification no longer applies migration SQL directly. It extracts the actual portable package, copies the committed schema-version-1 `UserData`, launches `Quiz Stage.exe`, waits for the application's migration backup, then verifies schema version 2 and preservation of the custom pack, custom clue and override, non-default settings, complete history, incomplete autosave, content report, and media override. It also proves the committed fixture is unchanged.

## Release artifacts

- Installer: `out/make/installer/QuizStageSetup.exe`; SHA-256 `2B540664CC017FF3464A6A820AC8827247C673D1F357558B9706BB5C0FB245E1`.
- Portable ZIP: `out/make/portable/QuizStage-win32-x64.zip`; SHA-256 `2A5330817F02369BA2C525B5287727F7A8EAFA7C4789E792D23E614294081986`.
- Deterministic checksum manifest SHA-256: `92DDC7BCFD9B2D3161E58116191DED781110486EBCF38AF84A9F2712B58AA3D9`.

## Verification

- Workflow YAML parse — pass for CI job `windows` and release job `windows-release`.
- Focused packaging/release/path/product-harness Vitest gate — 4 files / 23 tests pass.
- Focused ESLint over the changed TypeScript — pass.
- Real portable application upgrade verification — pass twice; the application created the migration backup and preserved every fixture record and media byte.
- Release checksum generation — pass twice with byte-identical output.
- Installer smoke — silent installation reached the real application setup; uninstall and temporary cleanup completed without residue.
- Portable smoke — reached the real application setup with the network guard and correctly failed closed before match creation because the deferred production content is incomplete.
- `git diff --check` — pass before commit.

The full repository TypeScript gate still reports only the two pre-existing errors in `tests/unit/content/translationDiagnostics.test.ts` at lines 487 and 521; Task 42 does not change that file.

`npm run verify:content` remains blocking on the deferred content corpus, and the real package smoke reports `Round One: 2 category sets missing. Round Two: 2 category sets missing. Final: available.` The automation is complete, but `npm run verify:release` and the complete packaged match are intentionally not claimed green until Task 36 content is finished. Per the approved sequencing, content resumes with the Final package before the other deferred packages; Task 43 remains the final release-acceptance gate.
