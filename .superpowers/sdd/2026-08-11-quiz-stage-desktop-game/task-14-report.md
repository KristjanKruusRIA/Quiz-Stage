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
