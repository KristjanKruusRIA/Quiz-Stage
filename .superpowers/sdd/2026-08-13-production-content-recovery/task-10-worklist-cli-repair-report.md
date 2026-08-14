# Task 10 worklist CLI compatibility repair

## Scope and root cause

The exact recovery-plan command

```powershell
npm run content:build-worklist -- --batch 02-geography --output content/work/02-geography/worklist.jsonl
```

exited `1` under npm 11/PowerShell. npm removed the flag names and invoked the script with positional values:

```text
tsx scripts/content/buildAuthoringWorklist.ts 02-geography content/work/02-geography/worklist.jsonl
Unknown argument: 02-geography
```

`verifyBatch.ts`, `publishBatch.ts`, `validate.ts`, and `sourceCheck.ts` already reconstruct documented npm-normalized arguments with `restoreNpmRunArgs`. `buildAuthoringWorklist.ts` did not. The minimum repair calls the same helper with only its existing value options, `--batch` and `--output`, before the unchanged parser. Direct `tsx ... --batch ... --output ...` behavior remains unchanged.

## Strict TDD evidence

The regression invokes the actual npm script from PowerShell and uses an exclusively owned temporary output under `content/work`. When immutable candidate inputs are present, it parses the emitted JSONL, checks the exact combined input count, and requires every row to carry `batchId: '02-geography'`. In an environment without candidate inputs it still proves npm argument restoration by requiring the later missing-input error and rejecting `Unknown argument`.

RED command:

```powershell
npx vitest run --configLoader runner tests/unit/content/contentCliCompatibility.test.ts -t "worklist builder reconstructs"
```

RED result: exit `1`; 1 failed, 5 skipped. The child npm process supplied positional values and the production CLI failed with `Unknown argument: 02-geography`; the owned temporary directory was removed.

GREEN with the minimum production change: the same command exited `0`; 1 passed, 5 skipped. The real subprocess wrote and parsed 3,000 rows from the current immutable pools, all for `02-geography`, then removed the temporary output.

## Verification

Main-worktree focused evidence:

- `npx vitest run --configLoader runner tests/unit/content/candidatePaths.test.ts`: 9/9 passed.
- `npm run typecheck`: exited `0` in the shared dirty worktree.
- `npx eslint scripts/content/buildAuthoringWorklist.ts tests/unit/content/contentCliCompatibility.test.ts`: exited `0`.
- `git diff --check` on the two owned code/test paths: exited `0`.
- The combined main-worktree CLI/candidate selection had 14/15 passing; its one failure was the known unrelated dirty `validate.ts` report-placement heuristic changing the source-check fixture shape.

Detached exact-diff verification used a fresh worktree at parent `8ed9467941f7c125a59f14e4d532d0cc6c03d24d`, applied only the two owned hunks, copied the two immutable candidate inputs, and installed the committed lock with `npm ci --ignore-scripts`:

- full `contentCliCompatibility.test.ts`: 6/6 passed;
- full `candidatePaths.test.ts`: 9/9 passed;
- focused ESLint and `git diff --check`: exited `0`;
- exact-snapshot typecheck retained four parent errors in `mapWikidataCandidates.ts` and `translationDiagnostics.test.ts`. Those paths were byte-identical to the parent and are not part of this repair.

The detached worktree was unregistered and removed. An earlier verification attempt used a Windows directory junction for `node_modules`; worktree cleanup emptied the untracked main dependency directory through that junction. `npm ci --ignore-scripts` restored it immediately. `package.json` remained SHA-256 `bcea9718d4c61d7ae543af1961d1f88346afa7c9c07c8ece2e30648041557537` and `package-lock.json` remained `b365be9f3ea32ed118ce1cd96ffddf51362bdb252e8534706d9f131db70bbe89`; no tracked or user-authored file changed. No junction was used in the final detached verification.

## Scope

Owned repair paths are only:

- `scripts/content/buildAuthoringWorklist.ts`
- `tests/unit/content/contentCliCompatibility.test.ts`
- this report

No accepted content, candidate input, worklist, source cache, approval, or unrelated dirty WIP is part of the repair.
