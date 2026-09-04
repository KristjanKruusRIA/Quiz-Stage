# Learnings

## [LRN-20260828-001] correction

**Logged**: 2026-08-28T11:47:00+03:00
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
Synchronizing only missing built-in packs leaves existing bundled categories and clues stale after a content release.

### Details
Adult and Estonia appeared after the first synchronization fix, but previously installed packs still used their old easy-category names. Existing user databases need a full bundled-content refresh, not only insertion of absent pack IDs.

### Suggested Action
Upsert current bundled packs, category sets, and clues by stable ID; disable bundled rows no longer shipped; preserve user settings, overrides, reports, history, and pack enablement.

### Metadata
- Source: user_feedback
- Related Files: src/main/content/bundledContentSync.ts, resources/content/seed.sqlite
- Tags: bundled-content, upgrades, sqlite

### Resolution
- **Resolved**: 2026-08-28T12:21:00+03:00
- **Notes**: Full bundled-content upsert and tombstoning behavior is covered by the upgrade regression and passed review.

---

## [LRN-20260831-002] correction

**Logged**: 2026-08-31T21:12:21+03:00
**Priority**: high
**Status**: resolved
**Area**: docs

### Summary
After the verified Easy release checkpoint, all corpus-authoring effort must stay on Medium and Hard unless a concrete cross-difficulty collision requires an Easy check.

### Details
The user correctly challenged continued Easy-oriented auditing after Easy had been verified and pushed to main. Easy remains part of collision authority, but that read-only ownership check must not expand into another Easy review or remediation lane while the approved Medium/Hard overhaul is unfinished.

### Suggested Action
Treat Easy as frozen comparison authority. Scope authoring and playability review to the current Medium/Hard checkpoint, and report any unavoidable Easy collision narrowly without reopening the Easy corpus.

### Metadata
- Source: user_feedback
- Related Files: docs/superpowers/plans/2026-08-28-playable-medium-hard-corpus-overhaul.md
- Tags: priority, scope, medium-hard, easy

### Resolution
- **Resolved**: 2026-08-31T21:12:21+03:00
- **Notes**: Easy was closed at `452f87e`; active authoring moved to Medium Technology and no further Easy remediation was scheduled.

---
