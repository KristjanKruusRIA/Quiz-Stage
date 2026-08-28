# Adult and Estonia content acceptance

Accepted on 2026-08-28 (Europe/Tallinn) against content head `f7cac2b09daed42ee02b231e9826a4742a046b28`.

## Reviewed batches

All three canonical reports are non-blocking.

| Batch | Report SHA-256 | Authored SHA-256 | Generated SHA-256 | Evidence SHA-256 |
| --- | --- | --- | --- | --- |
| `13-finals` | `4d3a0f82679b3190378bd7731e619274b7a6b84e41ea1227b9aed117a6f8e1b1` | `f1b131211bf89d918d5121ad279c3470bdee1448f667be648e946f364d9cc995` | `126426f7d3f3aa356d4d39850546aa42b4237dff8a71cc7807d5e91261bf6205` | `32eb8df3289f254f7730e03c85ac00238ab7fb1cf58df11c6dbb0e4bcd520c57` |
| `14-adult` | `c7af03a641d1ac39b3b405f3381d7ca466b7c715656549844dfba108236e0c25` | `85c8c70e8204ac0609c95526dae186b5cab924f78c9b072095c7c0c2ab735a2e` | `663097a82107d1965e8715a44e2e87068c2c5a0f13d2d364d5461616536213cf` | `37ddc4ae0ec348286697e09e84bea4de9df75317d2fa8e72faa8e8f205f195db` |
| `15-estonia` | `35971d70bb44b1549aa92b0703c29bd723993fe218d91e0d3cdf568bec979196` | `90e58feb54881ec64a03e9ea7d8753f8c2cf14ec3e0291ffb0698eb334fe45c2` | `6cea8b4988eee5e57c080bf8ec8e4862c91736777b645edcddad63339b610a6e` | `e1d4ac3fe6737b637ec0dffd84be5953d379c5a620947c3bc786e8bd2197f6a5` |

Adult contains 100 category sets and 500 board clues split 33 easy, 34 medium, and 33 hard. Estonia contains 100 category sets and 500 board clues split 34 easy, 33 medium, and 33 hard. Each category has five distinct primary subject keys.

## Release inventory and seed

- Release validation: `blocking: false`.
- Inventory: 15 built-in packs, 7,000 board clues, 1,400 category sets and distinct category names, and 174 Final clues.
- Difficulty distribution: 467 easy sets, 467 medium sets, and 466 hard sets; 58 Final clues per difficulty.
- Translation exceptions: 4,934 reviewed exception IDs.
- Source checks: 2,791/2,791 release sources passed.
- Deterministic temporary builds and the production seed share SHA-256 `ffd674c3aa8262f5d663af5738a717cbc028d991132639a907a2332434b79018`.
- Independent SQLite readback: 15 packs and 7,174 total clues; Adult and Estonia each contain 100 board sets, 500 board clues, and 12 Final clues, while `built-in-finals` contains 150 Final clues.

## Verification evidence

All commands below exited 0 on Windows x64 on 2026-08-28.

- `npm run verify:content`: exact release inventory above and a valid production seed.
- `npx vitest run --configLoader runner --no-file-parallelism --maxWorkers=1`: 100 files passed; 848 tests passed and 5 skipped.
- `npm run verify:product`: lint, typecheck, 100 Vitest files, package build, and 45/45 product Playwright tests with zero skipped.
- `npm run test:e2e`: 45/45 passed.
- `npm run make:installer`, `npm run make:portable`, and `npm run release:checksums`: unsigned Windows artifacts built successfully.
- `pwsh -NoProfile -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both`: two consecutive complete cycles passed for both installer and portable artifacts.
- `pwsh -NoProfile -File scripts/verify-upgrade.ps1 -PackageRoot out/make`: passed.

The packaged smoke explicitly verified that Adult is initially unchecked and excluded from the first persisted match while Estonia is checked and included. It then enabled Adult for the second persisted match, completed all 60 board clues and Final, and confirmed history contains one incomplete and one complete match. After each complete package cycle, `QUIZ_PROCESS_COUNT=0` and `%LOCALAPPDATA%\QuizStage` was absent.

Windows artifact hashes:

- `installer/QuizStageSetup.exe`: `04ba02876a73e701b96cf46b92177921d4fe6389bfdb9fc84927ac073ef25b16`
- `portable/QuizStage-win32-x64.zip`: `aa24fa32db7fec310b70b0ffa34bb8f9187509b3cb69a3288c3d3e72caf22156`

## Scope

No GitHub release workflow was triggered. macOS and Ubuntu artifacts were not rebuilt or claimed by this Windows-only acceptance pass.
