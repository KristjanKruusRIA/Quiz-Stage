# Errors

## [ERR-20260828-001] content:build-seed

**Logged**: 2026-08-28T11:40:41.2736620+03:00
**Priority**: low
**Status**: resolved
**Area**: config

### Summary
The production seed package script requires explicit input, evidence, output, and report arguments.

### Error
```
At least one evidence input glob is required
```

### Context
- Command attempted: `npm run content:build-seed`
- The package script invokes the builder without defaults for release inputs.

### Suggested Fix
Use the canonical command documented in the production content plan, including generated-content and evidence globs.

### Metadata
- Reproducible: yes
- Related Files: package.json, scripts/content/buildSeed.ts

### Resolution
- **Resolved**: 2026-08-28T11:40:41.2736620+03:00
- **Notes**: Located the canonical full command in the repository plans before retrying.

---

## [ERR-20260830-001] art-accessibility-bank-parse

**Logged**: 2026-08-30T13:25:30+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
A straight apostrophe inside a single-quoted accepted variant made the Art accessibility bank invalid TypeScript.

### Error
```
scripts/content/accessibility/banks/artMythology.ts:125:324: ERROR: Expected "]" but found "Keeffe"
```

### Context
- Operation attempted: import the edited Art/Mythology bank and run scoped ESLint.
- The variant `O'Keeffe` was added inside a single-quoted string literal.

### Suggested Fix
Use the typographic apostrophe already used by the primary response, or a double-quoted literal when a straight apostrophe is required.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/accessibility/banks/artMythology.ts

### Resolution
- **Resolved**: 2026-08-30T13:25:30+03:00
- **Notes**: Replaced the unsafe literal before rerunning the import and lint checks.

---

## [ERR-20260830-002] art-accessibility-variant-validation

**Logged**: 2026-08-30T13:27:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The Art bank rejected a question whose Estonian accepted-variant list was non-empty while its English list was empty.

### Error
```
Question art-famous-painting-nighthawks must provide bilingual accepted variants
```

### Context
- Operation attempted: import and validate the edited Art/Mythology bank.
- The bank contract requires accepted-variant presence to match across both languages.

### Suggested Fix
Provide a truthful variant in both languages or leave both variant lists empty.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/accessibility/banks/artMythology.ts

### Resolution
- **Resolved**: 2026-08-30T13:27:00+03:00
- **Notes**: Added a matching English title variant and retained the Estonian translated-title variant.

---

## [ERR-20260830-003] accessible-corpus-publish-file-lock

**Logged**: 2026-08-30T13:42:00+03:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
The transactional accessible-corpus publisher briefly could not rename one accepted evidence file on Windows.

### Error
```
EBUSY: resource busy or locked, rename 'E:\git\jeopardy\content\evidence\08-sports-games.jsonl' -> 'E:\git\jeopardy\content\evidence\08-sports-games.jsonl.<uuid>.bak'
```

### Context
- Operation attempted: `npx tsx scripts/content/applyAccessibleCorpus.ts --publish`.
- The publisher rolled back cleanly; no backup or temporary file remained and only the intentional Tokyo edits were present afterward.
- A Windows Restart Manager probe immediately afterward reported no process holding the target file.

### Suggested Fix
When this transient Windows lock occurs, first verify the publisher rollback and query the target with Restart Manager; retry once only after the target is confirmed free.

### Metadata
- Reproducible: no
- Related Files: scripts/content/applyAccessibleCorpus.ts, content/evidence/08-sports-games.jsonl

### Resolution
- **Resolved**: 2026-08-30T13:43:00+03:00
- **Notes**: The unchanged command succeeded on the next run and published all 36 artifacts.

---

## [ERR-20260830-004] easy-corpus-seed-validation

**Logged**: 2026-08-30T13:47:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The first canonical seed build rejected newly published easy rows whose valid translation diagnostics had not yet been recorded as reviewed release exceptions.

### Error
```
Production validation failed
```

### Context
- Operation attempted: canonical `content:build-seed` over all generated CSV and evidence inputs.
- The release report contained 32 new blocking diagnostic IDs: 16 `SUSPICIOUS_PROPER_NOUN_CHANGE` and 16 `UNCHANGED_TRANSLATION`.
- Manual bilingual review confirmed every flagged row was valid: correctly localized titles or terms, or intentionally language-stable names and accepted variants.

### Suggested Fix
After publishing new reviewed translations, inspect every newly blocking diagnostic and add only confirmed false positives to the report's reviewed translation exceptions before building the seed.

### Metadata
- Reproducible: yes
- Related Files: content/reports/release-inventory.json, scripts/content/validate.ts, scripts/content/buildSeed.ts

### Resolution
- **Resolved**: 2026-08-30T13:50:00+03:00
- **Notes**: Recorded the 32 reviewed exception IDs, reran release validation successfully, then produced two identical seed hashes.

---

## [ERR-20260830-005] product-e2e-electron-node-mode

**Logged**: 2026-08-30T14:03:00+03:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
Electron product tests could not launch because the parent Codex shell exported Electron's Node-only mode.

### Error
```
electron.exe: bad option: --remote-debugging-port=0
```

### Context
- Operation attempted: `npm run test:product-e2e` on Windows.
- Every attempted test failed before application startup while Electron parsed Playwright's Chromium flag as a Node option.
- The inherited environment contained `ELECTRON_RUN_AS_NODE=1`.

### Suggested Fix
Remove `ELECTRON_RUN_AS_NODE` from the child process environment before running Electron or Playwright product tests.

### Metadata
- Reproducible: yes
- Related Files: scripts/verify-product-e2e.ts, tests/e2e/productHarness.ts

### Resolution
- **Resolved**: 2026-08-30T14:04:00+03:00
- **Notes**: Retried with the variable absent; Electron launched and the real UI tests ran normally.

---

## [ERR-20260830-006] visual-setup-dom-timing

**Logged**: 2026-08-30T14:12:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
One visual setup-layout assertion sampled a checkbox before its DOM node was available at the end of a long serial E2E run.

### Error
```
TypeError: Cannot read properties of null (reading 'getBoundingClientRect')
```

### Context
- The Windows product run passed 44 of 45 tests; all gameplay and easy English/Estonian matrix cases passed.
- The failing test clicked New Match and immediately queried `.setup-screen input[type="checkbox"]` inside `page.evaluate` without a locator wait.
- The same test passed immediately in an isolated product-stamped run.

### Suggested Fix
If this recurs, wait for the setup checkbox locator to be visible before evaluating its geometry.

### Metadata
- Reproducible: no
- Related Files: tests/visual/game-layout.spec.ts

### Resolution
- **Resolved**: 2026-08-30T14:13:00+03:00
- **Notes**: Isolated Windows rerun passed 1/1; no product code change was required.

---

## [ERR-20260830-007] accessible-corpus-test-path

**Logged**: 2026-08-30T14:30:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The first focused Vitest rerun used the content script directory instead of the repository's test directory.

### Error
```
No test files found, exiting with code 1
```

### Context
- Operation attempted: rerun the accessible-corpus regression suite after two final clue corrections.
- The supplied path was `scripts/content/__tests__/accessibleCorpus.test.ts`; the actual test is `tests/unit/content/accessibleCorpus.test.ts`.

### Suggested Fix
Resolve focused test paths with `rg --files tests scripts` before invoking Vitest when the exact location is uncertain.

### Metadata
- Reproducible: yes
- Related Files: tests/unit/content/accessibleCorpus.test.ts

### Resolution
- **Resolved**: 2026-08-30T14:30:00+03:00
- **Notes**: Located the test under `tests/unit/content` and reran it with the correct path.

---

## [ERR-20260830-008] npm-content-cli-arguments

**Logged**: 2026-08-30T14:40:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tooling

### Summary
The installed npm version stripped named content-validator options from `npm run ... --`, turning evidence and report paths into positional arguments.

### Error
```
npm warn Unknown cli config "--input"
```

### Context
- Operation attempted: canonical release validation through the package-script wrapper.
- The wrapper launched the validator without option names and returned a non-zero result after printing inventory.

### Suggested Fix
Invoke the TypeScript CLI directly with `npx tsx scripts/content/validate.ts --input ...` when npm reports the content CLI flags as unknown configuration.

### Metadata
- Reproducible: yes
- Related Files: package.json, scripts/content/validate.ts

### Resolution
- **Resolved**: 2026-08-30T14:40:00+03:00
- **Notes**: Direct validator, source-checker, and seed-builder invocations completed successfully with the intended named arguments.

---

## [ERR-20260830-009] accessible-bank-source-slot

**Logged**: 2026-08-30T14:41:00+03:00
**Priority**: low
**Status**: resolved
**Area**: content

### Summary
A replacement Zelda source first used a nonexistent wiki slug, then briefly supplied separate title and slug strings to a tuple that accepts one source slug.

### Error
```
Question built-in-music-set-033:zelda-link-recurring-main-theme must provide English and Estonian accepted-variant arrays
```

### Context
- The live source gate correctly rejected `Music_of_The_Legend_of_Zelda` with HTTP 404.
- Adding a title plus a slug shifted the tuple's accepted-variant positions and triggered bank validation before publication.

### Suggested Fix
For the compact society/technology/culture bank tuple, supply one verified Wikipedia page slug; the helper derives its title and URL.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/accessibility/banks/societyTechnologyCulture.ts

### Resolution
- **Resolved**: 2026-08-30T14:41:00+03:00
- **Notes**: Used `The_Legend_of_Zelda_(video_game)` as the single source slot; bank publication and all 3,898 live source checks then passed.

---

## [ERR-20260830-010] vitest-min-workers-option

**Logged**: 2026-08-30T14:43:22+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The installed Vitest version rejects the `--minWorkers` CLI option.

### Error
```
CACError: Unknown option `--minWorkers`
```

### Context
- Operation attempted: focused medium/hard continuation baseline for the playability audit, corpus, and accessible-corpus tests.
- The command used both `--maxWorkers=1` and `--minWorkers=1`; option parsing stopped before any tests ran.

### Suggested Fix
Run this checkout's focused Vitest suites without `--minWorkers`; add supported worker controls only after checking `vitest --help` for the installed version.

### Metadata
- Reproducible: yes
- Related Files: package.json, tests/unit/content/playabilityAudit.test.ts, tests/unit/content/playableCorpus.test.ts, tests/unit/content/accessibleCorpus.test.ts

### Resolution
- **Resolved**: 2026-08-30T14:43:22+03:00
- **Notes**: Removed the unsupported flag before rerunning the focused baseline.

---

## [ERR-20260828-003] full-vitest-concurrency

**Logged**: 2026-08-28T12:00:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The full Vitest run exceeded fixed five-second test timeouts under file-level concurrency.

### Error
```
Error: Test timed out in 5000ms.
```

### Context
- Four unrelated packaging/content tests timed out when the suite ran beside lint/content verification; two packaging tests still timed out in the default full run alone.
- The reported files passed independently: 149 tests passed, 2 skipped.

### Suggested Fix
Avoid running the full suite alongside other CPU-heavy gates; consider calibrating fixed timeouts for the repository's expanded corpus.

### Metadata
- Reproducible: yes
- Related Files: tests/integration/packaging/packageContents.test.ts, tests/integration/packaging/packagedProcessCleanup.test.ts

### Resolution
- **Resolved**: 2026-08-28T12:03:00+03:00
- **Notes**: All reported timeout files passed independently; relevant feature tests passed in a focused run.

---

## [ERR-20260828-004] electron-forge-package

**Logged**: 2026-08-28T12:05:00+03:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
Forge could not replace the package directory while Quiz Stage was running from it.

### Error
```
EBUSY: resource busy or locked, rmdir 'E:\git\jeopardy\out\Quiz Stage-win32-x64'
```

### Context
- The active Quiz Stage process tree was executing from the exact Forge output directory.

### Suggested Fix
Close the packaged app before rebuilding the same output directory.

### Metadata
- Reproducible: yes
- Related Files: out/Quiz Stage-win32-x64

### Resolution
- **Resolved**: 2026-08-28T12:22:00+03:00
- **Notes**: Packaging succeeded after the user closed the running app.

---

## [ERR-20260828-003] sdd-workspace

**Logged**: 2026-08-28T12:03:17+03:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
The POSIX SDD workspace helper cannot inspect a Git-for-Windows linked worktree when invoked through WSL.

### Error
```
fatal: not a git repository: /mnt/e/git/jeopardy/.worktrees/playable-medium-hard-corpus/E:/git/jeopardy/.git/worktrees/playable-medium-hard-corpus
```

### Context
- Command attempted: run `sdd-workspace` through `C:\Windows\System32\bash.exe` from a Windows linked worktree.
- The worktree `.git` file contains an absolute Windows path, which WSL Git appended to the Linux working directory instead of resolving.

### Suggested Fix
Use Git for Windows Bash for these helpers, or resolve the documented `.superpowers/sdd/<plan-name>/` path directly with PowerShell when only WSL Bash is available.

### Metadata
- Reproducible: yes
- Related Files: `.git`, `.superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/progress.md`

### Resolution
- **Resolved**: 2026-08-28T12:03:17+03:00
- **Notes**: Used the existing plan-specific ledger path directly and continued without changing repository code.

---


## [ERR-20260828-002] report-comparison

**Logged**: 2026-08-28T11:42:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
A Node child-process comparison exceeded the default output buffer while reading the large release report from Git.

### Error
```
Error: spawnSync git ENOBUFS
```

### Context
- Operation attempted: compare the rebuilt release report with its checked-in version.
- `git show` returned a report larger than the default synchronous child-process buffer.

### Suggested Fix
Set an explicit `maxBuffer` when reading large tracked artifacts through `execFileSync`.

### Metadata
- Reproducible: yes
- Related Files: content/reports/release-inventory.json

### Resolution
- **Resolved**: 2026-08-28T11:42:00+03:00
- **Notes**: Re-ran the comparison with a 10 MiB buffer and confirmed only paths and timestamp changed.

---

## [ERR-20260830-011] playable-target-export-name

**Logged**: 2026-08-30T16:49:25+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
A one-off TypeScript corpus inspection imported non-existent inferred target-ledger and bank symbols.

### Error
```
SyntaxError: The requested module './scripts/content/playability/targets.ts' does not provide an export named 'mediumHardTargets'
SyntaxError: The requested module './scripts/content/playability/banks/packs01to04/literatureLanguage.ts' does not provide an export named 'packs01to04LiteratureLanguage'
```

### Context
- Operation attempted: list the still-unimplemented Science and Literature targets before preparing later checkpoints.
- The authoritative ledger exports `PLAYABLE_TARGETS`, and the banks export `SCIENCE_NATURE_CATEGORIES` / `LITERATURE_LANGUAGE_CATEGORIES`.

### Suggested Fix
Inspect each module's actual exports before composing one-off import scripts; use `PLAYABLE_TARGETS`, `SCIENCE_NATURE_CATEGORIES`, and `LITERATURE_LANGUAGE_CATEGORIES` here.

### Metadata
- Reproducible: yes
- Related Files: `scripts/content/playability/targets.ts`

### Resolution
- **Resolved**: 2026-08-30T16:49:25+03:00
- **Notes**: Queried all module exports and switched the inspection script to their declared uppercase symbols.

---
