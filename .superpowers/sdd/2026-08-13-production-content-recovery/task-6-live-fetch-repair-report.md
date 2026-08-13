# Task 6 live fetch repair report

Base: `b545b05`

## Assumptions and decisions

- OpenTDB token, count, and question responses are ordinary JSON envelopes. With `encode=base64`, only question fields are decoded from base64.
- A non-resume fetch replaces its destination only after the complete bounded run succeeds. A resume fetch preserves prior bytes and appends the successful staged rows atomically.
- Candidate output is published before checkpoint/cache state, so a later resume cannot permanently skip rows that were never published.
- Wikidata requests use a documented bounded 120-second timeout because the observed live second page exceeded 30 seconds. Rejected network and abort requests use the existing capped exponential retry window.

## TDD evidence

1. Live-shape OpenTDB fixtures made `tests/unit/content/openTdbImport.test.ts` fail 5 tests with `OpenTDB response was not valid JSON` while the implementation decoded the whole envelope.
2. Wikidata retry, failure atomicity, and exact-target tests failed 3 tests: rejected requests were not retried, the output changed after a later-page failure, and a target of 1 wrote 2 rows.
3. OpenTDB rejected-request and failure-atomicity tests then failed 2 tests: rejected requests were not retried and later-page failure had already published rows/checkpoint state.
4. Minimal production changes made all focused tests green.

## Implemented behavior

- Removed whole-envelope base64 decoding from OpenTDB token, count, and question parsers while retaining field decoding.
- Retried rejected OpenTDB and Wikidata requests within `maxAttempts` with bounded exponential backoff.
- Staged OpenTDB output/checkpoint and Wikidata output/cache in memory until successful completion, then used guarded temporary-file renames.
- Added Wikidata `target: number | null` and CLI `--target`; publication stops exactly at the requested number of unique candidates.
- Removed pre-fetch truncation from both CLIs, preserving prior bytes across network, API, or parse failures.
- Preserved candidate-root, symlink/junction, notice, attribution, cache, checkpoint, and resume guards.

## Verification

- `npm run test:run -- tests/unit/content/candidatePaths.test.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts` -> 3 files, 30 tests passed.
- `npm run typecheck` -> exit 0.
- `npx eslint scripts/content/fetchOpenTdb.ts scripts/content/fetchWikidata.ts tests/unit/content/openTdbImport.test.ts tests/unit/content/wikidataImport.test.ts` -> exit 0.
- `git diff --check` -> exit 0.

## Guarded live smoke evidence

- OpenTDB command: `npx tsx scripts/content/fetchOpenTdb.ts --output content/imports/.task-6-opentdb-smoke.jsonl --checkpoint content/imports/.task-6-opentdb-smoke-checkpoint.json --target 2 --delay-ms 0 --max-attempts 3`
  - Result: 2 candidates, 0 skipped, token not exhausted.
  - Candidate rows: 2.
  - Candidate SHA-256: `B31204978F1E4AD70EAE8918D2A1A8CB0D3761D665C6CD05FA1DA144C043CB9E`.
  - Checkpoint SHA-256: `68A37EB9FCB05AC8C1BF87BA8B8678A894E93D68131B47C486DC52312CC936A1`.
- Wikidata command: `npx tsx scripts/content/fetchWikidata.ts --output content/imports/.task-6-wikidata-smoke.jsonl --cache content/imports/.task-6-wikidata-smoke-cache.json --recipes historical-events --target 2 --page-size 10 --delay-ms 1000 --max-attempts 2`
  - Result: 2 candidates, 0 skipped.
  - Candidate rows: 2.
  - Candidate SHA-256: `EF32988F47393C73113FB116ECF4EC045DC3B80FC9C781DFFFE17932B4779919`.
  - Cache SHA-256: `592A824480941CA2F4E0E4DBFBEDF114DBDA77DDAC8005E0C8DC9A0DDD1CCF10`.
- Existing partial `content/imports/wikidata-candidates.jsonl` SHA-256 before and after both smokes: `854C6513CE8ED1FF5ED93029F6218D77E74EF13FD4264CD84E65AFC6D09D2EAD`.
- Smoke outputs were removed after hashing, and the legal-notice file was restored byte-for-byte to its pre-smoke SHA-256 `6F73E1330BFCC9A0950A18453AC243F996EA08ACC54529B68682DBA78A1FAC9E`.

## Notes

- `npm run content:fetch-opentdb -- --output ...` was rejected by the installed Windows npm argument parser before the script ran; the direct `npx tsx` command above was used instead. No candidate file was created by the rejected command.
- The pre-existing 500-line Wikidata file remains partial unpublished output. It was neither manually deleted nor staged.
