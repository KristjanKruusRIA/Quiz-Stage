### Task 15: Localize the complete interface in English and Estonian

**Files:**
- Create: `src/renderer/i18n/en.ts`
- Create: `src/renderer/i18n/et.ts`
- Create: `src/renderer/i18n/index.ts`
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/features/home/HomeScreen.tsx`
- Modify: `src/renderer/features/setup/SetupScreen.tsx`
- Modify: `src/renderer/features/setup/TeamEditor.tsx`
- Modify: `src/renderer/features/game/GameSurface.tsx`
- Modify: `src/renderer/features/game/PublicBoard.tsx`
- Modify: `src/renderer/features/game/PublicClue.tsx`
- Modify: `src/renderer/features/game/PublicFinal.tsx`
- Modify: `src/renderer/features/game/HostConsole.tsx`
- Modify: `src/renderer/features/content/ContentLibraryScreen.tsx`
- Modify: `src/renderer/features/content/PackList.tsx`
- Modify: `src/renderer/features/content/CategorySetEditor.tsx`
- Modify: `src/renderer/features/content/FinalClueEditor.tsx`
- Modify: `src/renderer/features/content/ImportPreview.tsx`
- Modify: `src/renderer/features/content/ValidationPanel.tsx`
- Modify: `src/renderer/features/history/HistoryScreen.tsx`
- Modify: `src/renderer/features/history/RecoveryNotice.tsx`
- Modify: `src/renderer/features/settings/SettingsScreen.tsx`
- Test: `tests/unit/renderer/i18n.test.tsx`
- Test: `tests/unit/content/languageEligibility.test.ts`

**Interfaces:**
- Consumes: match language and localized clue records.
- Produces: `translate(key, params)`, typed `TranslationKey`, and `LocalizedContent` selection with host-only English-original comparison.

- [ ] **Step 1: Write failing localization tests**

Render Home, Setup, ordinary clue, Daily Double, Final, History, Settings, and Content Library in both languages. Fail if a rendered text equals a translation key. In Estonian public mode, assert the host view can reveal the English original while the public projection contains only Estonian fields.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/renderer/i18n.test.tsx tests/unit/content/languageEligibility.test.ts`

Expected: FAIL because dictionaries and selectors are missing.

- [ ] **Step 3: Implement typed dictionaries and selectors**

English defines the canonical key shape; TypeScript must reject a missing Estonian key. Keep interpolation limited to typed string/number values and escape all content through React’s normal text rendering.

- [ ] **Step 4: Verify complete bilingual UI**

Run:

```powershell
npm run test:run -- tests/unit/renderer/i18n.test.tsx tests/unit/content/languageEligibility.test.ts
npm run typecheck
```

Expected: all routes and phases pass in both languages; no key is missing.

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/i18n src/renderer/App.tsx src/renderer/features tests/unit/renderer/i18n.test.tsx tests/unit/content/languageEligibility.test.ts
git commit -m "feat(i18n): localize interface in English and Estonian"
```

