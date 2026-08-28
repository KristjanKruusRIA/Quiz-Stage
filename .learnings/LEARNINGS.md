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
