# Task 9 Node 24 source-check repair

Date: 2026-08-14
Implementer role: Codex Task 9 History author/coordinator
Parent revision: `521675bb0d99ddfbe943a45b7bc496ea1dd16554`
Candidate code tree: `f349871bd16515fe0d253a21f03d1695c0580b60`

## Scope and root cause

Node `v24.15.0` invokes the custom HTTPS DNS lookup with `{ all: true }`. `safeHttpsFetch` always resolved DNS with all addresses but returned only `safe[0].address` and `safe[0].family` to the HTTPS callback. Node expected the full address array and rejected the scalar callback shape with `ERR_INVALID_IP_ADDRESS`, which `checkOne` correctly converted to `SOURCE_REQUEST_FAILED`. That caused all 110 Task 9 source checks to fail despite reachable sources.

The production fix is one branch: when the HTTPS lookup options request `all`, return the full already-validated `LookupAddress[]`; otherwise retain the original single address/family callback. Private, mixed public/private, and empty resolution still reject before the response callback. No fallback fetch, proxy, retry, cache, redirect, URL, or hostname behavior changed.

## Reproduction and strict TDD

Pre-fix bounded live reproduction:

```text
npx tsx -e "...checkSourceUrls(['https://en.wikipedia.org/wiki/Abraham_Lincoln'], undefined, { maxAttempts: 1, timeoutMs: 10000, concurrency: 1 })..."
```

Node `v24.15.0` returned `ok:false`, `status:null`, `code:"SOURCE_REQUEST_FAILED"` for the reachable pinned Wikipedia URL.

The new unit harness invokes the real `checkSourceUrls`/`safeHttpsFetch` path and mocks only DNS and HTTPS network boundaries. It verifies the exact validated hostname, Node 24 `all:true` callback shape, single-address callback shape, and mixed/empty SSRF rejection before connect. No production test seam was required.

RED command:

```text
npx vitest run tests/unit/content/sourceCheck.test.ts
```

Valid RED result: exit 1, 1 failed / 3 passed. The `all:true` case returned `SOURCE_REQUEST_FAILED` instead of HTTP 200; the single-address and SSRF rejection cases passed.

GREEN command: the same command after the one-line production branch.

Initial GREEN result: exit 0, 4/4 passed. The final suite adds an explicit private-only preservation case and passes 5/5.

## Focused and clean-tree gates

Main shared worktree:

- Source-check tests: 5/5 passed.
- Full `verifyBatch.test.ts`: 26/26 passed.
- `npm run typecheck`: exit 0 using the shared dirty worktree.
- Focused ESLint for `sourceCheck.ts` and `sourceCheck.test.ts`: exit 0.

Clean candidate tree (`62ee13ddc64d356d6265c5b2009e7f76f91181f6`, tree `f349871bd16515fe0d253a21f03d1695c0580b60`):

- Source-check tests: 5/5 passed.
- Full verifyBatch tests: 26/26 passed.
- Focused ESLint: exit 0.
- Typecheck reported four inherited errors in `mapWikidataCandidates.ts` and `translationDiagnostics.test.ts`.

Clean parent revision produced the exact same four typecheck errors:

- `mapWikidataCandidates.ts:99:46` TS2345
- `mapWikidataCandidates.ts:114:7` TS2322
- `translationDiagnostics.test.ts:460:9` TS1117
- `translationDiagnostics.test.ts:494:65` TS2339

The repair introduces no typecheck regression. Clean Vitest runs retain the inherited Vite CommonJS-config warning without affecting their exit codes.

## Live smoke and cache evidence

Post-fix bounded smoke used the pinned URL `https://en.wikipedia.org/wiki/Abraham_Lincoln`, one attempt, 15-second timeout, and an ephemeral in-memory source cache. The first result was HTTP 200 with `ok:true`; the second result preserved the exact `retrievedAt` and full result, proving a stable cache hit. No repository cache file was written.

Task 9 artifacts were pinned immediately before verification:

- `generated.en-et.csv`: `db36eb0d32df98d12b16c42064ad34c7083925e5c36bd2f1e7930274307a2aba`
- `evidence.jsonl`: `07c3b3f158bceaf44aad41d896840cf4480dc53e7f5843782cdf6a887fbfacbf`

`verifyBatch` was invoked programmatically with its supported `sourceCache` option because the CLI does not expose that option. Configuration was concurrency 4, at most 2 attempts, and 15-second timeout.

- First run: 6,563 ms, 110/110 sources passed, blocking false.
- Second run with the same ephemeral cache: 457 ms, 110/110 passed, blocking false.
- Source result arrays were byte-stable between runs.
- Authored, generated, and translation validations were non-blocking.
- Evidence issues: 0; sample issues: 0.
- Work report SHA-256: `28f95811c14f6ab2f81f8541b7e25a141a73cd2898ff22e828d4595d8a4a4c62`.

The approved generated and evidence hashes remained unchanged after both runs. No accepted artifact, evidence, status, approval, or persistent source cache was edited.

## Intended commit scope

- `scripts/content/sourceCheck.ts`: one Node 24 callback-shape branch.
- `tests/unit/content/sourceCheck.test.ts`: five bounded regression cases.
- This report.

All unrelated shared WIP remains unstaged.
