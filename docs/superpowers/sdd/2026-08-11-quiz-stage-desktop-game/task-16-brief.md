### Task 16: Add settings, original placeholder audio, and media overrides

**Files:**
- Modify: `package.json`
- Create: `scripts/generate-placeholder-audio.ts`
- Create: `resources/media/manifest.json`
- Create: `resources/media/audio/opening.wav`
- Create: `resources/media/audio/round-transition.wav`
- Create: `resources/media/audio/daily-double.wav`
- Create: `resources/media/audio/final-tension.wav`
- Create: `resources/media/audio/correct-applause.wav`
- Create: `resources/media/audio/incorrect-crowd.wav`
- Create: `resources/media/audio/time-expired.wav`
- Create: `resources/media/audio/winner.wav`
- Create: `src/main/media/mediaService.ts`
- Create: `src/renderer/features/settings/SettingsScreen.tsx`
- Create: `src/renderer/features/game/useGameAudio.ts`
- Create: `docs/media-overrides.md`
- Test: `tests/unit/media/mediaService.test.ts`
- Test: `tests/unit/renderer/SettingsScreen.test.tsx`

**Interfaces:**
- Consumes: game events, settings table, installer/portable data paths.
- Produces: `MediaService.resolve(assetKey)`, `AudioSettings`, and separate master/music/effects/crowd volume controls plus `M` mute.

- [ ] **Step 1: Write failing media-resolution and settings tests**

Test a valid override, invalid extension, unreadable file, missing file, and independent fallback. Assert effective channel gain equals `master × channel`, is clamped to 0–1, and persists.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/media tests/unit/renderer/SettingsScreen.test.tsx`

Expected: FAIL because media/settings modules do not exist.

- [ ] **Step 3: Generate original deterministic WAV placeholders**

The script must generate RIFF/WAV PCM assets for `opening`, `round-transition`, `daily-double`, `final-tension`, `correct-applause`, `incorrect-crowd`, `time-expired`, and `winner`. Use synthesized tones and filtered noise only; write SHA-256 hashes into `manifest.json` so reruns prove deterministic output.

- [ ] **Step 4: Implement media resolution and playback**

Resolve each override independently by manifest key, accepted extension, and readable file. Return a bundled asset when validation fails and publish a non-blocking host warning. Stop/duck music at phase transitions; never block a command on audio playback.

- [ ] **Step 5: Verify and document override behavior**

Run:

```powershell
npm run media:generate
npm run test:run -- tests/unit/media tests/unit/renderer/SettingsScreen.test.tsx
npm run lint
npm run typecheck
```

Expected: generated hashes are stable across two runs and tests pass.

- [ ] **Step 6: Commit**

```powershell
git add package.json scripts/generate-placeholder-audio.ts resources/media src/main/media src/renderer/features/settings src/renderer/features/game/useGameAudio.ts docs/media-overrides.md tests/unit/media tests/unit/renderer/SettingsScreen.test.tsx
git commit -m "feat(media): add audio settings and safe overrides"
```

