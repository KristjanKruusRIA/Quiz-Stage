# Task 41 report: Produce separate installer and true portable packages

Date: 2026-08-25

## Outcome

Task 41 is complete in commit `bc7946d` (`build: package installer and portable Windows releases`). The Windows build now emits the two required artifacts with explicit, separate profiles:

- `out/make/installer/QuizStageSetup.exe`
- `out/make/portable/QuizStage-win32-x64.zip`

Both payloads use the product identity `Quiz Stage`, contain one application executable named `Quiz Stage.exe`, and include the production seed, media manifest, ASAR, and Win32 x64 native SQLite binary. The installer payload has no portable marker. The portable ZIP has `Quiz Stage.exe`, `resources/portable.flag`, and `UserData/.keep` at its archive root, so extraction produces a deterministic layout and portable data remains beside the executable.

The portable builder now selects only the current product-named Forge ZIP, passes paths containing spaces to PowerShell without shell re-parsing, archives staging contents rather than a randomly named staging folder, and removes the staging directory in `finally`. The installer builder copies the Squirrel setup executable to the exact release path. Installed mode continues to use Electron's per-user data directory; portable mode recognizes only `process.resourcesPath/portable.flag` and fails with `PORTABLE_DATA_NOT_WRITABLE` before database creation when its adjacent data directory is not writable.

The portable upgrade guide already records the exact new-directory/copy-`UserData`/launch/verify/retain-old-directory procedure. The media override guide now reflects the shipped portable marker instead of calling Task 41 deferred.

## Artifacts

- Installer: 158,739,968 bytes; SHA-256 `2B540664CC017FF3464A6A820AC8827247C673D1F357558B9706BB5C0FB245E1`.
- Portable ZIP: 163,768,793 bytes; SHA-256 `2A5330817F02369BA2C525B5287727F7A8EAFA7C4789E792D23E614294081986`.

## Verification

- `npm run make:installer` — pass; Squirrel produced `QuizStageSetup.exe` and the builder copied it to the exact installer path.
- `npm run make:portable` — pass; final product-named ZIP rebuilt with deterministic root contents and no staging residue.
- Focused package/path/harness Vitest gate — 3 files / 19 tests pass.
- Focused ESLint over all changed TypeScript files — pass.
- Hardened package inspection against `out/Quiz Stage-win32-x64/Quiz Stage.exe` — pass: offline renderer present and all five required Electron fuse states correct.
- Direct archive inspection — pass: application executable, seed, manifest, ASAR, native SQLite, and installer/portable marker asymmetry all confirmed.
- `git diff --check` — pass before commit.
- Project TypeScript gate reports only the two pre-existing errors in `tests/unit/content/translationDiagnostics.test.ts` at lines 487 and 521; Task 41 did not modify that file.

The true packaged portable executable launched successfully and reached the live match setup through Playwright. The complete-match smoke then stopped because the currently deferred production seed reports `roundOneMissing: 2`, `roundTwoMissing: 2`, and `finalMissing: 0` for English/Medium across all 13 enabled packs. That is the existing Task 36/content-release boundary, not a packaging failure. Task 42 owns the full installer/portable smoke and upgrade gate; under the approved sequencing it can implement and verify the release machinery now, while the final green complete-match run remains dependent on returning to the deferred content stages.
