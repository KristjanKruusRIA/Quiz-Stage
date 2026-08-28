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
