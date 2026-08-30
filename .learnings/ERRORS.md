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

## [ERR-20260830-012] playable-category-name-field

**Logged**: 2026-08-30T17:02:41+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
A one-off Science draft inspection assumed the category label field was named `title` instead of `name`.

### Error
```
TypeError: Cannot read properties of undefined (reading 'en')
```

### Context
- Operation attempted: print the newly drafted category names and clue responses for a controller-side editorial preview.
- Playable category records expose bilingual labels through `name`, while questions expose `clue` and `response`.

### Suggested Fix
Inspect representative object keys before writing ad hoc corpus introspection scripts.

### Metadata
- Reproducible: yes
- Related Files: `scripts/content/playability/banks/packs01to04/scienceNature.ts`

### Resolution
- **Resolved**: 2026-08-30T17:02:41+03:00
- **Notes**: Inspected the runtime object keys and switched the preview to `category.name`.

---

## [ERR-20260830-013] literature-draft-response-leak

**Logged**: 2026-08-30T17:07:43+03:00
**Priority**: medium
**Status**: resolved
**Area**: content

### Summary
An in-progress Literature checkpoint clue included its own accepted English response.

### Error
```
Error: Question playable-literature-language:built-in-literature-language-set-048:hawaiian-immersion-schools leaks its English response in the clue
```

### Context
- Operation attempted: import the uncommitted checkpoint-3 draft for a controller-side structure check.
- Literal `Hawaiian` and `havakeelsete` wording exposed the requested language in the English and Estonian clue text.

### Suggested Fix
Run `validatePlayableCorpus` after each literal category is added, then phrase language-identification clues using geographic and revival-program cues without repeating the response.

### Metadata
- Reproducible: yes
- Related Files: `scripts/content/playability/banks/packs01to04/literatureLanguage.ts`

### Resolution
- **Resolved**: 2026-08-30T17:07:43+03:00
- **Notes**: The author removed both answer terms; the bank now imports cleanly at 33 categories / 165 questions with zero playability diagnostics.

---

## [ERR-20260830-014] science-final-checkpoint-easy-collision

**Logged**: 2026-08-30T17:21:34+03:00
**Priority**: high
**Status**: resolved
**Area**: content

### Summary
The Science final-checkpoint author scan reported no accepted-corpus collisions but missed a direct easy-clue duplicate and explanation-to-answer leak.

### Error
```
New set-060:red-blood-cells-oxygen duplicates accepted easy clue built-in-science-nature-accessible-easy-020, including the canonical source URL; that easy explanation also teaches the new haemoglobin response.
```

### Context
- The checkpoint report claimed zero aliases, facts, source URLs, themes, and internal text-answer mentions across 3,645 prior questions.
- Independent review directly matched `content/generated/03-science-nature.en-et.csv:21` against the new blood-components category.
- The accepted easy row uses singular `a red blood cell` / `punalible`, while the new row uses plurals, so exact normalized-string logic can miss the semantic duplicate.

### Suggested Fix
For every new category, scan singular/plural and inflected answer forms, direct source URLs, and accepted clue/explanation text for every new response; manually inspect any category sharing a broad domain with accepted easy categories.

### Metadata
- Reproducible: yes
- Related Files: `content/generated/03-science-nature.en-et.csv`, `scripts/content/playability/banks/packs01to04/scienceNature.ts`

### Resolution
- **Resolved**: 2026-08-30T17:51:28+03:00
- **Notes**: Replaced both colliding records with fibrin and albumin, corrected the blood-category tier ramp, strengthened source-title/inflection/explanation scans, and obtained clean scoped re-review before primary integration.

---

## [ERR-20260830-015] ripgrep-windows-path-glob

**Logged**: 2026-08-30T17:28:59+03:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
A PowerShell ripgrep command passed a wildcard in a directory argument that Windows did not expand.

### Error
```
rg: content/generated/*.csv: IO error for operation on content/generated/*.csv: The filename, directory name, or volume label syntax is incorrect. (os error 123)
```

### Context
- Operation attempted: directly search generated CSVs for the proposed Science blood-question answers and variants.
- On this Windows invocation, `content/generated/*.csv` reached ripgrep as an invalid literal path.

### Suggested Fix
Pass the directory as the search path and express file selection with ripgrep's glob option: `rg -g '*.csv' PATTERN content/generated`.

### Metadata
- Reproducible: yes
- Related Files: `content/generated/*.csv`

### Resolution
- **Resolved**: 2026-08-30T17:28:59+03:00
- **Notes**: Re-ran with `-g '*.csv'`; the intended corpus search completed successfully.

---

## [ERR-20260830-016] literature-checkpoint-source-and-contract-review

**Logged**: 2026-08-30T17:35:20+03:00
**Priority**: high
**Status**: resolved
**Area**: content

### Summary
Literature checkpoint verification treated a live disambiguation URL as valid proposition support and missed three bilingual answer-contract defects.

### Error
```
The Namesake clue cited a live disambiguation page; The Snowman clue leaked its title stem; Pikakoivaline isa was missing; kerni keel and hawaii keel were accepted without Estonian authority.
```

### Context
- All 55 URLs returned successful HTTP responses, but reachability alone did not establish clue-level support.
- The validator did not stem inflected clue words such as `lumememmesid` back to the displayed response `Lumememm`.
- Catalog/terminology checks correctly found primary forms but did not fully police missing editions and permissive variants.

### Suggested Fix
Combine live-source checks with title/content inspection, apply language-aware stem review to title-answer clues, and verify every localized accepted variant against catalog or EKI evidence rather than only checking the primary response.

### Metadata
- Reproducible: yes
- Related Files: `scripts/content/playability/banks/packs01to04/literatureLanguage.ts`

### Resolution
- **Resolved**: 2026-08-30T17:51:28+03:00
- **Notes**: Corrected the Namesake source, Snowman clue, catalog title variant, and EKI variants; 55/55 sources and 224 focused tests passed, and scoped re-review approved the fix before primary integration.

---

## [ERR-20260830-017] tsx-commonjs-top-level-await

**Logged**: 2026-08-30T19:07:35.2112302+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
Task-local TypeScript inspection scripts failed when they used top-level `await` under this repository's CommonJS `tsx` transform.

### Error
```
Top-level await is currently not supported with the "cjs" output format
```

### Context
- Literature and Art content agents independently encountered the same failure in read-only source and collision checkers.
- The commands changed no source or accepted artifact state.

### Suggested Fix
Wrap asynchronous task-local checks in `async function main()` or an async IIFE, then surface failures through `.catch(...)`.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/sourceCheck.ts, content/work/playable-corpus-overhaul/checkpoint4-literature-collision.ts

### Resolution
- **Resolved**: 2026-08-30T19:07:35.2112302+03:00
- **Notes**: Both agents wrapped their asynchronous entry points and reran the checks successfully.

---

## [ERR-20260830-018] cross-worktree-git-path-query

**Logged**: 2026-08-30T19:07:35.2112302+03:00
**Priority**: low
**Status**: resolved
**Area**: tooling

### Summary
`git check-ignore` rejected an absolute report path owned by a sibling worktree.

### Error
```
fatal: task-5-report.md is outside repository at playable-packs-05-08
```

### Context
- A read-only ignore query ran from the Art recovery worktree against a coordination report stored under the primary worktree.
- The command did not change either worktree.

### Suggested Fix
Run Git path queries with `git -C <owning-worktree>` and a path relative to that worktree.

### Metadata
- Reproducible: yes
- Related Files: none

### Resolution
- **Resolved**: 2026-08-30T19:07:35.2112302+03:00
- **Notes**: The query was rerun from the primary worktree and confirmed that the report is intentionally ignored.

---

## [ERR-20260830-019] recovery-worktree-path-typo

**Logged**: 2026-08-30T19:07:35.2112302+03:00
**Priority**: low
**Status**: resolved
**Area**: tooling

### Summary
An Art checkpoint commit command initially used a nonexistent worktree path containing an extra segment.

### Error
```
The directory name is invalid. (os error 267)
```

### Context
- The command failed before Git started and changed no repository state.
- The assigned bank file remained staged and the learning notes remained untracked.

### Suggested Fix
Copy the already verified absolute worktree path directly into state-changing commands.

### Metadata
- Reproducible: yes
- Related Files: none

### Resolution
- **Resolved**: 2026-08-30T19:07:35.2112302+03:00
- **Notes**: The same commit succeeded from the correct `playable-packs-05-08` worktree.

---

## [ERR-20260830-020] mediawiki-source-inspection-rate-limit

**Logged**: 2026-08-30T19:07:35.2112302+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
Sequential one-page MediaWiki API requests were rate-limited during proposition-level inspection of 55 Art sources.

### Error
```
HTTP 429 Too Many Requests
```

### Context
- The repository source checker had already confirmed that all 55 unique URLs were reachable.
- The additional checker requested full extracts one page at a time and received a 429 after ten requests.

### Suggested Fix
Use bounded-concurrency direct article fetches for this task-local proposition inspection.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/playability/banks/packs05to08.ts

### Resolution
- **Resolved**: 2026-08-30T19:07:35.2112302+03:00
- **Notes**: Direct article HTML inspection with four workers completed for all 55 pages without further rate limiting.

---

## [ERR-20260830-C5L] literature-prefix-marker-mismatch

**Logged**: 2026-08-30T19:07:55+03:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
A checkpoint-5 byte-prefix probe omitted the bank terminator's `as const` tokens.

### Error
```
Error: marker missing
```

### Context
- The task-local probe searched for `] satisfies PlayableCategory[];`, while the module closes with `] as const satisfies readonly PlayableCategory[];`.

### Suggested Fix
Read the exact module terminator before constructing byte-preservation probes.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/playability/banks/packs01to04/literatureLanguage.ts

### Resolution
- **Resolved**: 2026-08-30T19:07:55+03:00
- **Notes**: Corrected the marker and captured the baseline prefix hash.

---

## [ERR-20260830-C5P] powershell-foreach-pipeline-parse

**Logged**: 2026-08-30T19:13:00+03:00
**Priority**: medium
**Status**: resolved
**Area**: tests

### Summary
A read-only collision query piped directly from a `foreach` statement and PowerShell rejected the pipeline position.

### Error
```
ParserError: An empty pipe element is not allowed.
```

### Context
- The query scanned candidate answers across `content/generated/*.csv` and changed no files.

### Suggested Fix
Assign the `foreach` output to a variable before piping it to `Format-Table`.

### Metadata
- Reproducible: yes
- Related Files: content/generated/*.csv

### Resolution
- **Resolved**: 2026-08-30T19:13:00+03:00
- **Notes**: Rewrote the query with an intermediate result variable. The same parser error recurred once in a later URL probe, confirming that future checkpoint scripts should always assign `foreach` output before formatting.

---

## [ERR-20260830-C5W] learning-log-relocated-during-task

**Logged**: 2026-08-30T19:14:00+03:00
**Priority**: low
**Status**: resolved
**Area**: tooling

### Summary
The primary-worktree learning log was consolidated to the repository root while this parallel task was running.

### Error
```
apply_patch verification failed: Failed to read file to update the primary-worktree .learnings/ERRORS.md
```

### Context
- A concurrent consolidation removed the formerly untracked primary copy after it had been inspected.
- No content or accepted artifact was affected.

### Suggested Fix
Recheck the current learning-log location immediately before appending during parallel work.

### Metadata
- Reproducible: no
- Related Files: .learnings/ERRORS.md

### Resolution
- **Resolved**: 2026-08-30T19:14:00+03:00
- **Notes**: Appended the resolved checkpoint-5 notes to the consolidated root log instead.

---

## [ERR-20260830-C5U] guessed-wikipedia-article-paths

**Logged**: 2026-08-30T19:20:00+03:00
**Priority**: medium
**Status**: resolved
**Area**: content

### Summary
Three guessed Wikipedia article paths returned HTTP 404 during pre-authoring source validation.

### Error
```
404 Not Found: The_First_Man_(novel), Briony_Tallis, March_family
```

### Context
- The URLs were candidate sources and had not yet been written into the content bank.
- No source or accepted artifact was changed by the failed requests.

### Suggested Fix
Probe exact source URLs before authoring and use direct live article pages that support the same proposition.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/playability/banks/packs01to04/literatureLanguage.ts

### Resolution
- **Resolved**: 2026-08-30T19:20:00+03:00
- **Notes**: Replaced them with live direct pages `The_First_Man`, `Atonement_(novel)`, and `Little_Women`; all returned HTTP 200. The same guessing mistake later recurred for `Joad_family`, `The_Long_Earth_(novel)`, and `Bridget_Jones_(character)`; live replacements `The_Grapes_of_Wrath`, `The_Long_Earth`, and `Bridget_Jones` were verified before authoring or committing.

---

## [ERR-20260830-C5V] category-title-answer-leak

**Logged**: 2026-08-30T19:31:00+03:00
**Priority**: medium
**Status**: resolved
**Area**: content

### Summary
The initial checkpoint-5 set-099 theme repeated the exact English and Estonian response for its first question.

### Error
```
Question ...:double-golyadkin leaks its Estonian response in the category title
```

### Context
- The corpus validator caught the leak immediately after the first five categories were appended.
- No commit had been made.

### Suggested Fix
Run the real validator after each authored category batch and make category themes descriptive without naming any displayed response.

### Metadata
- Reproducible: yes
- Related Files: scripts/content/playability/banks/packs01to04/literatureLanguage.ts

### Resolution
- **Resolved**: 2026-08-30T19:31:00+03:00
- **Notes**: Renamed the category before proceeding; the full doppelgänger category was later replaced with the collision-free `Two Authors, One Novel` / `Kaks autorit, üks romaan` theme during accepted-corpus review.

---
