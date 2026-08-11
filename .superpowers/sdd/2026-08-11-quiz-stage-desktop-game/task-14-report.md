# Task 14 report: bilingual Content Library editor

## Status

Implemented an accessible host-only Content Library with reported-content priority, five-tier category-set forms, side-by-side English/Estonian fields, Final editing, continuous post-submit validation, source/translation metadata, custom pack lifecycle, report correction/resolution, and transactional CSV import/export.

## Authorized boundary extension

Tasks 12–13 intentionally exposed no renderer content capability. Task 14 therefore adds a narrow editor surface only to the host preload and `HostDesktopApi`. The public preload type and runtime object contain no content methods.

- Shared strict Zod schemas validate every editor request and response and reject extra fields.
- Main re-authorizes the current live host for every command and again after import/export dialogs before selected-path I/O.
- Renderer commands contain no paths, SQL, database rows, private match state, or future selection order.
- Main derives bundled/custom ownership from persisted pack source; renderer-supplied ownership never selects a write path.
- Main generates custom pack, category, and clue IDs and checks them across all stable ID namespaces.
- Revisions are SHA-256 fingerprints of authoritative pack/category/clue/override/report state. Stale drafts fail before writing.

## Persistence behavior

- Bundled board and Final corrections route through Task 12 field-complete overrides; enabled corrections resolve unresolved reports in the same immediate transaction.
- Custom packs update their authoritative category/clue rows directly. Category-set writes require exactly tiers 1–5 with correct round values and complete source metadata.
- English-only custom sets remain English-eligible while Estonian eligibility stays blocked until category, clue, response, and explanation translations are complete.
- Deleting a bundled pack is rejected. Deleting a custom pack is rejected when an override, report (including resolved history), or seen-clue history protects any child row; otherwise the pack and its unprotected children delete atomically.
- Import preview remains read-only and shows every Task 13 row issue. Commit uses the opaque main-held preview, revalidates it, rechecks live identity conflicts under `BEGIN IMMEDIATE`, and writes all-or-nothing.

## UI behavior

- Home enables Content Library only on the host surface.
- Reported packs/category sets sort first, and unresolved report notes appear before the library.
- One category set is edited per form with all five tiers visible together. Every field has a programmatic label, keyboard focus remains visible, and failures return the form to an operable state.
- Source title, URL, license, retrieval date, and translation status appear beside each clue. Legacy bundled metadata is explicitly shown as unavailable instead of fabricated.
- Drafts stay in React state; only explicit validated saves persist. A synchronous latch blocks duplicate saves/import commits.
- Async list responses use a generation owner, so late responses cannot replace newer content.
- Reporting and resolving use labeled inline controls; no inaccessible prompt is required.

## TDD evidence

Initial RED:

```text
npm run test:run -- tests/integration/content/contentEditor.test.ts tests/unit/renderer/content
Test Files 4 failed (4)
Missing ContentEditorService and content editor component modules
exit 1
```

Focused integrated GREEN:

```text
Content/editor/IPC/preload/Home suite: 7 files; 23 tests passed
CSV roundtrip-inclusive checkpoint: 7 files; 55 tests passed
```

Coverage includes bundled override vs custom direct persistence, immutable/generated IDs, stale revisions, report-first order, report correction/resolution, English-only eligibility, five-tier/source rendering, accessible labels, single-submit behavior, all import issues, cancellation/failure recovery, strict host-only IPC, public preload absence, and protected deletion.

## Verification

```text
npm run test:run
Test Files 47 passed (47)
Tests 312 passed (312)

npm run lint
exit 0

npm run typecheck
exit 0

npx playwright test tests/e2e/content-editor.spec.ts
1 passed

npx playwright test tests/e2e/core-match.spec.ts tests/e2e/resume-match.spec.ts
2 passed

npm run build
Electron Forge package win32/x64; exit 0

npm run make:portable
ZIP maker win32/x64; exit 0
```

The content-editor E2E uses one isolated profile and export file, closes its exact Electron application, removes its profile, and makes no external requests. It creates a complete bilingual five-tier set, exports it, deletes it, reimports it, reports/corrects/re-enables a clue, and proves the pack is available in New Match setup.

Packaged artifacts:

- Portable ZIP: `quiz-stage-desktop-game-win32-x64-0.1.0.zip`, 155,749,142 bytes, SHA-256 `2EB8C9688BBFD1E62257956D5297A91FF64202E0BA464B262F90862B5329F526`.
- Packaged executable: 225,442,304 bytes.
- Packaged seed: 188,416 bytes; SQLite `integrity_check=ok`; 1 pack, 39 categories, 183 clues.
- ZIP contains the executable, `resources/app.asar`, `resources/dev-seed.sqlite`, and `better-sqlite3` win32-x64 prebuild.

## React review

Components remain module-level, async bridge work is isolated at the external boundary, draft validation is derived during render after the first attempt, stale async ownership uses primitive generation tokens, and mutable submit latches use refs rather than render state. No new third-party bundle dependency was added.

## Remaining release concern

`npm run make:installer` reaches the Squirrel maker but fails because the repository's existing `package.json` has an empty `author` value (`Authors is required`). Task 14 does not change unrelated release metadata; installer configuration remains owned by the later release-packaging task. Package and portable ZIP are verified.

## Important-findings fix round (2026-08-12)

The follow-up review findings are resolved:

- Bundled category and Final metadata now use schema-version-2 `category_set_overrides`. Reads merge the stable-ID override with current seed rows, so local names, difficulty, macro-topic, and enabled state survive restarts and seed upgrades without mutating bundled rows. Metadata-only saves do not create clue overrides.
- Editor eligibility and gameplay selection share one localized-completeness predicate. A language requires localized prompt, response, explanation, and accepted responses when variants exist.
- Editor reports expose only their safe ID/timestamp on clues. Report and resolve commands carry the authoritative editor revision; resolve additionally carries the exact report ID. Both validate under an immediate transaction, preventing stale corrections and ABA report resolution.
- Custom packs have complete R1, R2, and Final creation flows. Category and Final forms expose bilingual accepted variants, complete source provenance, translation status, classification, and enabled state. Main-generated stable IDs remain immutable.
- CSV preview has strict valid/invalid wire variants. Invalid pack-level previews return every issue without minting a commit token. Valid tokens are host-bound, TTL-limited, capacity-bounded, explicitly discardable, consumed before every commit attempt, discarded on replacement/unmount, and cleared on IPC disposal.
- Create/import/delete/report/resolve/export actions use synchronous action-key latches. Import conflict radios share a name; editor headings receive focus; dirty drafts require discard confirmation.

Fix-round RED: 4 files, 46 tests; seven new regressions failed for the mapped findings while 39 existing tests passed.

Fix-round verification:

```text
npm run lint
exit 0

npm run typecheck
exit 0

npm test -- --run
Test Files 48 passed (48)
Tests 319 passed (319)

npx playwright test tests/e2e/content-editor.spec.ts
1 passed (33.3s total; 15.7s workflow)

npx playwright test tests/e2e/core-match.spec.ts tests/e2e/resume-match.spec.ts
2 passed (1.1m)

npm run build
Electron Forge package win32/x64; exit 0

npm run make:portable
ZIP maker win32/x64; exit 0
```

The strengthened editor E2E creates six complete bilingual R1 sets, six complete bilingual R2 sets, and a complete bilingual Final through the UI. It exports, deletes, reimports, reports, corrects and re-enables content, selects only the custom pack, waits for authoritative availability, starts a match, and opens the corrected custom clue on the board. Its BrowserContext aborts and records non-local HTTP(S); the recorded list is empty. The exact isolated Electron app closes and its profile/export directory is removed.

Updated artifacts:

- Portable ZIP: `quiz-stage-desktop-game-win32-x64-0.1.0.zip`, 155,751,536 bytes, SHA-256 `2E10E43745510D759A2429E5E3DBAA25492103E1876C6126DBDB05EB493463C7`.
- Packaged executable: 225,442,304 bytes.
- Packaged seed: 196,608 bytes; SQLite `integrity_check=ok`; schema 2; 1 pack, 39 categories, 183 clues.

## Runtime-rules alignment fix round (2026-08-12)

The second review round aligns the editor and runtime at their remaining seams:

- Final loading now applies effective category enabled metadata before selection, including base-disabled/override-enabled and base-enabled/override-disabled cases. Setup availability, editor eligibility, direct clue reads, and gameplay selection consequently agree.
- Category forms expose both the category enabled control and an enabled control for every tier. Correcting a report resolves that report without silently re-enabling content the host intentionally left disabled.
- Failed import commits clear their consumed preview and instruct the host to choose the file again. A fresh preview remains available; the consumed token never appears as retryable.
- Report actions own stale/service failures, keep the note and draft visible, render only a safe alert, release their synchronous latch, and prevent a duplicate callback from following the success path.
- Final validation is continuous and field-specific for localized content, accepted variants, classification, provenance, translation status, and enabled state. Invalid drafts never reach the bridge.
- One shared HTTP(S)-only source URL rule is enforced by renderer validation, strict editor DTOs, main persistence, and CSV import. Non-HTTP schemes and credential-bearing URLs are rejected; valid URLs survive save/export/preview roundtrips.
- The content E2E installs a main-process HTTP(S) observer before creating any window and an immediate Playwright context route after launch. Both cancel or record non-local requests, and both recorded lists are empty.

Round-two RED exercised 49 focused tests: 17 expected regressions failed and two deliberately rejected report promises exposed unhandled errors before the fixes. Round-two focused GREEN passed 61 tests, followed by explicit Setup/selector coverage for both Final enabled override directions.

Round-two verification:

```text
npm run lint
exit 0

npm run typecheck
exit 0

npm test
Test Files 49 passed (49)
Tests 346 passed (346)

npx playwright test tests/e2e/content-editor.spec.ts --workers=1
1 passed (34.4s)

npx playwright test tests/e2e/core-match.spec.ts tests/e2e/resume-match.spec.ts --workers=1
2 passed (1.1m)

npm run build
Electron Forge package win32/x64; exit 0

npm run make:portable
ZIP maker win32/x64; exit 0
```

Final round-two artifacts:

- Portable ZIP: `quiz-stage-desktop-game-win32-x64-0.1.0.zip`, 155,752,599 bytes, SHA-256 `9B4A78B7C92DE643F6BCDC36635481AAF7E4A6D47825FD028A3738B4E6FF98BF`.
- Packaged executable: 225,442,304 bytes, SHA-256 `16E859AEE63926984E2F1E87FDE0285F83181608702A67AF24A8917C20DB804E`.
- Packaged seed: 196,608 bytes, SHA-256 `C09CF55C4813771E70D6EC1A3A2E2CBB3E834383A4A313222314DF889AAA815C`; SQLite `integrity_check=ok`; 1 pack, 39 categories, 183 clues.

## Report and citation preservation fix round (2026-08-12)

The third review round closes four runtime-integrity gaps and one navigation-state issue:

- Custom category and Final saves compare each authoritative pre-save clue with the strict-schema-normalized submitted content inside the existing immediate transaction. Only a reported clue whose localized content, accepted variants, provenance, or enabled state changed is resolved. Category metadata, unchanged saves, and corrections to other tiers preserve the original report; a real correction can remain disabled and still resolve its own report.
- The E2E network guard now requires both the explicit test flag and an unpackaged Electron runtime. Packaged applications cannot install the web-request listener, attach the test global, or alter requests under any argv. The compiled main bundle was audited and retains the `requested && !isPackaged` gate directly before all guard side effects.
- The content-editor E2E waits for either the corrected prompt or the authoritative Daily Double wager phase. If the corrected tile is a Daily Double, it commits a valid wager before checking the prompt. Three independent repeated runs passed.
- Recognized `quiz-stage-csv-v1` source metadata is converted to its validated human-readable title only at the content-to-game canonical boundary. Editor and CSV storage retain the full structured metadata. Board and Final host/public projections contain the citation title rather than JSON; malformed, unknown, and plain legacy source strings remain inert text.
- Leaving, saving, or reopening an editor and returning Home clears any prior report-action alert, so unrelated navigation cannot resurrect a stale error.

Round-three RED ran 39 focused tests: five intended regressions failed while 34 existing tests passed. Failures were the two custom report-preservation cases, raw structured source projection, packaged guard activation, and stale alert reappearance.

Round-three verification:

```text
npm run lint
exit 0

npm run typecheck
exit 0

npm test
Test Files 50 passed (50)
Tests 351 passed (351)

npx playwright test tests/e2e/content-editor.spec.ts --repeat-each=3 --workers=1
3 passed (1.7m)

npx playwright test tests/e2e/core-match.spec.ts tests/e2e/resume-match.spec.ts --workers=1
2 passed (1.1m)

npm run build
Electron Forge package win32/x64; exit 0; compiled guard predicate audited

npm run make:portable
ZIP maker win32/x64; exit 0
```

Final round-three artifacts:

- Portable ZIP: `quiz-stage-desktop-game-win32-x64-0.1.0.zip`, 155,752,754 bytes, SHA-256 `AB58412751E91E1568824B31945D50C9488709293831EE963BA32BDBE2C09B64`.
- Packaged executable: 225,442,304 bytes, SHA-256 `42633609392515F3E8691D743C0C97666E016F00DBB9C7064E5C9E02504D2552`.
- Packaged seed: 196,608 bytes, SHA-256 `C09CF55C4813771E70D6EC1A3A2E2CBB3E834383A4A313222314DF889AAA815C`; SQLite `integrity_check=ok`; 1 pack, 39 categories, 183 clues.

## Editor save trust-boundary fix round (2026-08-12)

The fourth review round removes renderer-derived editor state from both save contracts:

- Category and Final save commands now use strict writable DTOs. Read-only `reported`, `report`, `eligibility`, `ownership`, and embedded revision fields are rejected before persistence; renderer save code explicitly projects drafts to the writable contract.
- Bundled and custom board/Final paths compare the same canonical writable clue fields: localized prompt/response/explanation, accepted responses, source, and enabled state. Report eligibility comes only from the authoritative repository record loaded inside the existing immediate transaction.
- Status-only hostile payloads cannot create category/clue overrides, resolve reports, or change the editor revision. Metadata-only and unrelated-tier saves preserve reports. A real accepted-response/source/enabled correction resolves only its exact reported clue and may leave the clue disabled.
- Stable identity and bundled/custom ownership remain main-owned: create paths generate IDs, update paths validate persisted identities, and persisted pack ownership selects the write path.

Round-four RED:

```text
npm run test:run -- tests/integration/content/contentEditor.test.ts tests/integration/ipc/contentEditorIpc.test.ts
Test Files 2 failed (2)
Tests 6 failed, 11 passed (17)
```

The six intended failures covered hostile bundled/custom board and Final service payloads plus bundled board and Final IPC payloads. Each failure showed the old command resolving instead of rejecting.

Round-four verification:

```text
Focused editor/report/IPC/preload/renderer suite
Test Files 8 passed (8)
Tests 61 passed (61)

npm run test:run
Test Files 50 passed (50)
Tests 357 passed (357)

npm run lint
exit 0

npm run typecheck
exit 0

npx playwright test tests/e2e/content-editor.spec.ts tests/e2e/core-match.spec.ts tests/e2e/resume-match.spec.ts --workers=1
3 passed (1.7m)

npm run build
Electron Forge package win32/x64; exit 0

npm run make:portable
ZIP maker win32/x64; exit 0
```

Final round-four artifacts:

- Portable ZIP: `quiz-stage-desktop-game-win32-x64-0.1.0.zip`, 155,754,393 bytes, SHA-256 `66401998B26D3E2D82116A6FBB04A88B464604E99CEF6EBCDF56C759F68B0070`.
- Packaged executable: 225,442,304 bytes, SHA-256 `C07B049205E3524315C19C982F78BD975BBC9E6D14EA55F00A56C942CC657CEF`.
- Packaged seed: 196,608 bytes, SHA-256 `C09CF55C4813771E70D6EC1A3A2E2CBB3E834383A4A313222314DF889AAA815C`; SQLite `integrity_check=ok`; 1 pack, 39 categories, 183 clues.
- The ZIP contains the executable, `resources/app.asar`, `resources/dev-seed.sqlite`, and the `better-sqlite3` win32-x64 prebuild.
