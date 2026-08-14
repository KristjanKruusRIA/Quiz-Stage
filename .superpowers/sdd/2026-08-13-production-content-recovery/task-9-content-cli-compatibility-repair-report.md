# Task 9 content CLI compatibility repair

Recorded: 2026-08-14T05:35:09.1976132+03:00
Base: `d2f4db2f2090f4a7fb307b9f15fab363d8226b3d`

## Scope

This bounded repair changes only the four Content Batch Execution Rule CLI boundaries, their focused tests, and the two recovery-plan source-check commands. It does not publish or edit accepted content.

## Root cause

Under npm 11.16.0 invoked from PowerShell, `npm run <script> -- --name value` removes the option name, leaves `value` positional, and sets `npm_config_name=true`. The existing CLIs therefore either rejected the call or interpreted the first value for every missing option. The npm-reserved `--cache` is different: npm consumes its value as `npm_config_cache` and creates an npm cache directory at that path.

A probe of the documented verify form produced positional values `01-history`, `content/work`, and `content/reports/source-check-cache.json`, with `npm_config_batch`, `npm_config_work_root`, and `npm_config_source_cache` all equal to `true`. The requested `--source-cache` value remained positional and created no filesystem entry. The equivalent source-check probe with `--cache` created a directory containing npm `_logs` at the requested JSON path. Those probe artifacts were removed before implementation.

## RED

Command:

```powershell
npm run test:run -- tests/unit/content/contentCliCompatibility.test.ts tests/unit/content/verifyBatch.test.ts
```

Result: exit `1`; 5 intended failures and 26 passes. The exact PowerShell/npm verify command used the batch ID as the work root, publish used it as both work and accepted roots, validate produced no report, and source-check produced neither its report merge nor named cache file. All test destinations were temporary; the accidental root-level preflight report produced by the old verify parser was removed.

## Implementation

- `restoreNpmRunArgs` reconstructs only the documented single-value option forms when npm supplies matching `npm_config_* = true` markers; direct flag invocations and legacy positional calls remain unchanged.
- Verify-batch opens, uses, and atomically publishes the named file-backed source cache.
- Publish-batch reconstructs batch/work/temporary accepted-root arguments while retaining atomic publication.
- Validate reconstructs input/evidence/batch/mode/report and `allow-missing-et`; only this CLI import/parse hunk is owned because other `validate.ts` edits are unrelated WIP.
- Source-check accepts direct `--cache` and `--source-cache`, uses safe `--source-cache` for npm, preflights report/cache destinations, and atomically merges `{ sources: freshResults }` at the report top level through `publishValidationReport(..., { placement: 'top-level' })`. Existing report siblings remain. Input/parse/check infrastructure failures do not publish the report. Completed non-OK results are published and return exit `1`.
- The recovery plan now uses `--source-cache` in the batch rules and Task 22 release command.

## GREEN and isolated verification

The current main worktree intentionally contains an unrelated unstaged `validate.ts` placement heuristic. In that dirty tree, the combined focused run reports 82/84 passing: the unrelated heuristic breaks its own default-placement test and nests the new source result despite the explicit placement option. This repair does not absorb that WIP.

Pre-report staged code tree: `1abc088015512204a0dd4b262d909d3f78c5d048`
Initial detached verification commit: `88f80420199298eb2a212933b408c185ec9da320`

```powershell
npm run test:run -- tests/unit/content/contentCliCompatibility.test.ts tests/unit/content/verifyBatch.test.ts tests/unit/content/productionValidator.test.ts
```

Initial result in the detached snapshot: exit `0`; 3 files and 84 tests passed. After adding explicit report-symlink and non-file-cache coverage, the same command at detached candidate `267ca2454abe618c29ca2e522095c673f75e9eee` exited `0` with 3 files and 85 tests passed.

```powershell
npm run test:run -- tests/unit/content/sourceCheck.test.ts tests/unit/content/evidence.test.ts
```

Result: exit `0`; 2 files and 19 tests passed.

```powershell
npx eslint scripts/content/npmCliCompatibility.ts scripts/content/verifyBatch.ts scripts/content/publishBatch.ts scripts/content/validate.ts scripts/content/sourceCheck.ts tests/unit/content/contentCliCompatibility.test.ts tests/unit/content/verifyBatch.test.ts
```

Result: exit `0`.

```powershell
npm run typecheck
```

The detached candidate and its exact parent both exit `2` with the same four inherited errors: two nullable-value errors in `mapWikidataCandidates.ts` and two translation-diagnostics test typing errors. The dirty main worktree currently exits `0` because unrelated WIP fixes those files. No Task 9 CLI file introduces an additional typecheck error.

## Safety and remaining state

- No accepted content, Task 9 work CSV/evidence, review artifact, approval, or publication report was changed.
- Actual publish coverage targets only a temporary accepted root.
- Source completed-failure coverage uses `https://127.0.0.1/source`, which is rejected before network access.
- The staged `validate.ts` diff contains only the compatibility import and parser call; unrelated work remains unstaged.
