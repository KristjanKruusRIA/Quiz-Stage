# SDD ledger — plan: docs/superpowers/plans/2026-08-11-quiz-stage-desktop-game.md
Task 1: human decision — use TypeScript 6.0.3 so typescript-eslint 8.67.0 can genuinely lint TS/TSX; this supersedes the Task 1 TypeScript 7.0.2 pin only.
Task 1: minor (deferred): x64 packaging currently relies on the build host architecture; Task 41 owns explicit release packaging.
Task 1: fix round 1/5 (3 addressed, 0 open — CSP/navigation/window blocking; real TS/TSX linting; generated artifact ignores; commit 50a7862)
Task 1: complete (commits bc0e834..50a7862, review clean)
Task 2: deferred verification to Task 8 — main-process sender validation and actual gateway integration consume these contracts there.
Task 2: fix round 1/5 (2 addressed, 0 open — persisted seed/Daily Double IDs; strict valid-command extra-field regression; commit 0d32deb)
Task 2: complete (commits 50a7862..0d32deb, review clean)
Task 3: minor (deferred): all-teams-locked test verifies reveal/phase but not control retention; final review should decide whether to strengthen it.
Task 3: decision — keep SelectClue timestamp-free; Task 3 initializes/preserves the positive timer seam and Task 4 owns elapsed-time arithmetic.
Task 3: fix round 1/5 (3 addressed, 0 open — seeded tied-lowest control test; full Double Round transition; timer invariant; commit 4f2b125)
Task 3: complete (commits 0d32deb..4f2b125, review clean)
Task 4: fix round 1/5 (8 original findings addressed, 2 new Important regressions open — legacy nested undo-frame parsing; ReportClue exits tiebreaker; commit 5cf9b30)
Task 4: decision — compact persisted undo frames restore mutable state; canonical private tiebreaker clues are supplied in order and Task 5 owns sourcing/selection.
Task 4: fix round 2/5 (2 addressed, 0 open — legacy nested undo-frame defaults; tiebreaker ReportClue flow; commit ac0a548)
Task 4: complete (commits 4f2b125..ac0a548, review clean)
Task 5: deferred verification to Task 8 — authoritative caller must append/persist each selected canonical tiebreaker before display.
Task 5: fix round 1/5 (1 addressed, 2 open — bounded search still unproved/combinatorial; Round Two ranking regression; commit dd9c846)
Task 5: fix round 2/5 (2 addressed, 0 open — polynomial exact allocation; independent Round Two ranking; commit 25f5b05)
Task 5: complete (commits ac0a548..25f5b05, review clean)
Task 6: minor (deferred): add database CHECK constraints for clue tier/value and selection-path indexes; final review should triage before release.
Task 6: fix round 1/5 (3 addressed, 1 Critical open — fallback replay skips invalid/wrong-match event gaps; commit c99d416)
Task 6: fix round 2/5 (replay-gap handling addressed, 1 new Critical open — valid snapshot discarded when historical events at/before its cursor are absent; commit d7b528c)
Task 6: fix round 3/5 (1 addressed, 0 open — pruned historical events no longer invalidate a valid snapshot; commit 4795565)
Task 6: complete (commits 25f5b05..4795565, review clean)
Task 7: decision — commit the deterministic development SQLite seed under resources/content so development and integration tests consume the same artifact.
Task 7: fix round 1/5 (2 builder-safety findings addressed, 1 Important dangling-symlink issue open — atomic replacement, repository-anchored defaults, direct builder coverage; commit 5d760af)
Task 7: fix round 2/5 (1 addressed, 0 open — dangling destination symlinks rejected before publication; commit 2b1d25a)
Task 7: complete (commits 4795565..2b1d25a, review clean; 183 clues, 36 category sets, 3 Finals; deterministic SHA-256 CAF759B94CE16CF2B2A06E0BCB4920A995CEEEA55F30A64BC5D08A4D24375FDC)
Task 8: fix round 1/5 (4 findings addressed, 1 Important partial-window recreation issue open — DD phase redaction, monotonic listener isolation, replay isolation, strict preload parsing; commit 2344e51)
Task 8: fix round 2/5 (window recreation race safety addressed, 1 new Important recovered-window bootstrap gap open; commit 177da3b)
Task 8: fix round 3/5 (1 addressed, 0 open — surface-authorized monotonic current-state bootstrap for recovered windows; commit bf9d0f2)
Task 8: complete (commits 2b1d25a..bf9d0f2, review clean; final full suite 127/127 and Win32 package verified)
Task 9: decision — extend the Task 8 bridge with narrow host-only setup options, content availability, and start-match IPC because the approved renderer flow otherwise had no authoritative production seam.
Task 9: fix round 1/5 (2 original findings plus reentrant submit addressed, 1 new Important availability overwrite race open — unused color allocation, localized start failure recovery, synchronous submit latch; commit 47311b7)
Task 9: fix round 2/5 (1 addressed, 0 open — key+generation-owned availability pipeline preserves latest editable setup across failed starts; commit c73ebec)
Task 9: complete (commits bf9d0f2..c73ebec, review clean; final full suite 146/146 and Win32 package verified)
Task 10: decision — safely extend PublicGameView with phase-gated display/timer/control/Final/tiebreaker facts; persist Final judgments and localized Final category; preserve legacy snapshot defaults.
Task 10: decision — activate the canonical Final clue only after the last wager and reveal its accepted response only at the first authoritative Final reveal.
Task 10: fix round 1/5 (original Critical timer and four Important UI/schema/accessibility findings addressed; 3 new Important reveal/score/retry issues open; commit d7ddb47)
Task 10: fix round 2/5 (explicit clue-reveal/Advance lifecycle, authoritative score correction, bounded expiry persistence retry addressed; 1 new Important ReportClue invariant open; commit 9a6022c)
Task 10: decision — Final clue reporting is hidden/rejected until a separate safe replacement/end policy is designed; returning to a board is never allowed.
Task 10: fix round 3/5 (active-clue and supported-phase ReportClue invariant addressed, 0 open; commit 8f9d223)
Task 10: complete (commits c73ebec..8f9d223, review clean; final full suite 199/199, strengthened Electron full-match E2E, and Win32 package verified)
Task 11: fix round 1/5 (four original recovery findings addressed; 1 Important corrupt-terminal reconciliation gap open — strict row/embedded cursor equality, persisted Undo/MatchEnded replay timestamps, atomic live terminal persistence, pre-adoption reconciliation, TimerExpired cursor consistency; commit 6f0d2f1)
Task 11: fix round 2/5 (corrupt terminal snapshot reconciliation addressed; 1 Important same-call older-match fallback gap open — strict replay-validated terminal materialization, event-derived completion time, atomic repaired snapshot/History metadata; commit e5b510f)
Task 11: fix round 3/5 (same-call multi-match fallback addressed, 0 open — bounded durable terminal reconciliation followed by older-match adoption with no-progress guard; commit aa68a98)
Task 11: complete (commits 8f9d223..aa68a98, review clean; final full suite 233/233, both Electron E2Es, and Win32 package verified)
Task 12: decision — preserve Task 10 fail-closed ReportClue progression; Task 12 current-match continuity means already-selected canonical clue data remains immutable while unresolved reports affect only future selection.
Task 12: fix round 1/5 (two findings addressed, 1 new Important pre-transaction eligibility race open — atomic tiebreaker/report/event/snapshot writes; stable base identity lookup behind disabled packs/categories; commit 5151741)
Task 12: fix round 2/5 (1 addressed, 0 open — BEGIN IMMEDIATE now serializes replacement eligibility selection with report, event, and snapshot persistence; commit 4e6bfaf)
Task 12: complete (commits aa68a98..4e6bfaf, review clean; final full suite 251/251 and Win32 package verified)
Task 13: decision — the plan's CSV dependency versions are transposed/nonexistent; official registry verification requires exact csv-parse@7.0.2 and csv-stringify@6.8.3.
Task 13: fix round 1/5 (one Critical and five Important CSV trust-boundary findings addressed; 3 Important unsafe-input findings open — global create collision rejection, self-validating export/source merge, post-dialog host authorization, strict variant escapes, resource caps, reversible spreadsheet text; commit cd54783)
Task 13: fix round 2/5 (3 Important plus path hardening addressed, 0 open — stored-variant validation, fatal UTF-8, in-parser row cap, byte/character limit clarity, file identity/symlink checks; commit ddf9d45)
Task 13: complete (commits 4e6bfaf..ddf9d45, review clean; final full suite 302/302, Win32 package and portable ZIP verified)
Task 14: decision — authorize a strict host-only content-editor bridge with main-derived ownership/IDs, optimistic revisions, safe DTOs, pathless dialogs, and no public-window content capabilities.
Task 14: fix round 1/5 (eight editor workflow findings addressed; 6 runtime-alignment findings open — category metadata overrides, authoritative bilingual completeness, report ABA guards, complete Final/category authoring, invalid preview delivery, owned token lifecycle, action latches, real offline E2E; commit 0ec80c7)
Task 14: fix round 2/5 (six addressed; 4 report/citation/test-seam findings open — effective Final enable, board enable controls, failed-import recovery, report error ownership, complete Final validation, HTTP(S) contract; commit 49d7e8d)
Task 14: fix round 3/5 (four addressed; 1 derived report-state trust-boundary finding open — exact custom report preservation, packaged guard, DD-safe E2E, safe citation projection; commit 9956d4a)
Task 14: fix round 4/5 (derived renderer state excluded by strict writable-only save DTOs; 1 bundled structured-source persistence finding open; commit 187bc9b)
Task 14: fix round 5/5 (full bundled source provenance persisted through shared codec; legacy plain title overlays preserved across unrelated edits and seed upgrades; 0 open; commits 158e0ab, a1ecd4d)
Task 14: complete (commits ddf9d45..a1ecd4d, review clean; final full suite 375/375, all three Electron E2Es, Win32 package and portable ZIP verified)
Task 15: fix round 1/5 (three localization findings addressed, 0 open — exhaustive safe CSV diagnostics, locale-aware generated team defaults with deterministic Unicode normalization, per-window document language ownership; commit 18b9e8c)
Task 15: complete (commits a1ecd4d..18b9e8c, review clean; final full suite 400/400, four Electron E2Es, Win32 package and portable ZIP verified)
Task 16: minor (deferred to release hardening): media protocol relies on strict URL/CSP/navigation boundaries rather than an explicit Origin rejection; Task 41 must include a true packaged-executable runtime launch because the current Playwright audio probe packages assets but launches the development main bundle.
Task 16: fix round 1/5 (four Important runtime findings and protocol/WAV/manifest hardening addressed, 0 open — tiebreaker judgment cues, active gain synchronization, authoritative settings bootstrap/save ordering, keyed warning recovery; commit cb843ed)
Task 16: complete (commits 18b9e8c..cb843ed, review clean; final full suite 443/443, five Electron E2Es, deterministic 8-asset media generation, Win32 package and portable ZIP verified)
Task 17: fix round 1/5 (five display/accessibility findings addressed; 3 Important shortcut/legacy/broadcast regressions open — stale dialog identity, public reduced motion, versioned appearance ordering, 32-char new-team cap with responsive long-name layout, native Space; commit 01c0c84)
Task 17: fix round 2/5 (3 addressed, 0 open — per-key shortcut focus policy, legacy persisted long-name compatibility, teardown-safe appearance notifications; commit c38a225)
Task 17: complete (commits cb843ed..c38a225, review clean; final full suite 463/463, combined keyboard+visual 4/4, all six Electron E2Es, Win32 package and portable ZIP verified)
Task 18: fix round 1/5 (four milestone-gate findings addressed, 0 open — canonical offline containment, exact durable persistence/undo/history/CSV assertions, cross-platform process/package helpers, tokenized source/build/exe/app.asar freshness stamp; commit f1bdd4f)
Task 18: complete (commits c38a225..f1bdd4f, review clean; exact verify:product passed 489/489 Vitest and 10/10 Playwright with 0 skipped)
Milestones 1–2: durable offline desktop product gate complete and review clean.
Task 13: fix round 1/5 (six confirmed findings addressed — global import identity ownership and insert-only create; self-validating metadata-safe export; post-dialog host reauthorization; strict variant escapes; bounded synchronous parsing; reversible formula neutralization; commit cd54783)
Task 13: fix round 2/5 (three Important findings plus path hardening addressed — strict stored accepted responses; fatal UTF-8; parser-callback row cap; exact opened-path identity; commit ddf9d45)
Task 15: decision — keep PublicGameView selected-language-only; derive the optional Estonian-match English comparison exclusively from private HostGameView state.
Task 15: decision — localize the reachable disabled Settings placeholder only; no SettingsScreen exists yet, so later settings functionality remains deferred.
Task 15: complete (canonical typed EN dictionary and exact ET parity; strict interpolation and localized-content selectors; all reachable UI localized; final full suite 391/391, all four Electron E2Es, Win32 package and portable ZIP verified)
Task 19: complete (tracked in `df1c0df`, review clean; offline content-validator and release inventory gate pipeline implemented)
Task 20: complete (tracked in `ede98b2`, content candidate ingestion and attribution, OpenTDB fixtures and coverage added)
Task 21: complete (tracked in `aa7eb55`, source-backed Wikidata candidate recipes and fixtures coverage added)
Task 22: complete (tracked in `19a0308`, reproducible English-to-Estonian pretranslation flow and diagnostics added)
Task 23: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 01-history)
Task 24: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 02-geography)
Task 25: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 03-science-nature)
Task 26: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 04-literature-language)
Task 27: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 05-art-architecture)
Task 28: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 06-music)
Task 29: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 07-film-television)
Task 30: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 08-sports-games)
Task 31: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 09-food-drink)
Task 32: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 10-technology-inventions)
Task 33: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 11-politics-economics-society)
Task 34: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 12-mythology-religion-philosophy)
Task 35: complete (tracked in `cded0ea`, content(tasks 23-35) draft bilingual batch: 13-finals)
Task 36: review step — build and verify the production seed database (not yet complete; in-progress scripts/seed/test integration pending)
Task 37: complete (commit `9d2005e`; original Classic Stage wordmark/background/icon, deterministic seven-size ICO, manifest hashes, 30/30 media tests)
Task 38: complete (commit `cffcc60`; hash-verified Classic Stage presentation, 81/81 focused tests, 5/5 visual tests, 24 screenshots inspected across 720p/1080p/4K)
Task 39: complete (commit `77ecb27`; privileged local renderer protocol, strict IPC boundaries, bounded redacted diagnostics, final Win32 ASAR/fuse inspection passed)
Task 40: complete (commit `005db45`; 24/24 full bilingual match combinations, focused 32/32 and repository-wide Playwright 44 pass/1 intentional skip)
Task 41: complete (commit `bc7946d`; exact installer and deterministic true-portable outputs, focused 19/19, final package/fuse inspection pass; complete-match smoke remains at the deferred Task 36 content boundary)
Task 42: complete (commit `086ca43`; Windows CI/release/checksum automation and real packaged migration verified, focused 23/23; complete-match smoke remains fail-closed on deferred Task 36 content)
Task 36: complete (commit `c021338`; deterministic production seed verified with 6,000 board clues, 1,200 category sets, 150 Finals, 1,464/1,464 sources, and zero blocking errors)
Task 43: complete (baseline `cc4fe45`; clean release gate, installer and portable offline full matches, upgrade, hardening, and Windows 11 plus Windows 10 Pro 22H2 x64 visual/manual evidence pass)

Task 12 (playable corpus): in-progress checkpoint handoff for `feat/playable-medium-hard-corpus`
- `origin/main` is `220c7d2`: Adult/Estonia and the verified 1,600-clue accessible-easy corpus are already published. The medium/hard branch merged that exact baseline at `80b90e0`.
- Reviewed History, Geography, and Science & Nature are complete at 66 categories / 330 clues each, with 33 medium / 33 hard per bank. Final Science implementation/fix commits were integrated on primary as `af9428d` and `e4fc130` after independent review caught and removed an accepted-easy red-cell/haemoglobin collision.
- Literature checkpoints 1–3 are reviewed and integrated through primary commit `a0bfba5`: 33/66 categories and 165/330 clues (16 medium/17 hard). Exactly 33 Literature categories / 165 clues remain in checkpoints 4–6; their exact ignored briefs are saved beside the local SDD ledger.
- Fresh primary gates at `e4fc130`: exact ledger order/count and unique keys/facts/subjects for all four Task 4 banks, scoped ESLint, `git diff --check`, 3 focused files / 226 tests, and `npm run typecheck` all pass; the tracked worktree is clean.
- Next: author Literature checkpoint 4 from approved lane head `e4e32b4`, independently review/fix/integrate it, then checkpoints 5–6. Task 5 remains a non-integrable `28f9351` checkpoint and Task 6 remains rejected at `bcf18db`; neither should be integrated without reauthoring and review.
- Resume from `.superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/progress.md`; do not redo easy publication, Adult/Estonia integration, History, Geography, Science, or Literature checkpoints 1–3. Continue Task 4 before repairing Tasks 5–6, rebuilding accepted artifacts, and running Windows-only final/package acceptance.
