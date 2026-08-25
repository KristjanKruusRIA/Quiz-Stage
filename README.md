# Quiz Stage

Quiz Stage is a Windows desktop Jeopardy-style quiz host app built with Electron, React, and TypeScript. It runs offline, supports English + Estonian matches, and supports one-screen and dual-screen hosting.

## Run from source

Prerequisites: Node.js 24.15+.

```powershell
npm install
npm run start
```

## Windows packaging

The app is packaged as:

- `out/make/installer/QuizStageSetup.exe`
- `out/make/portable/QuizStage-win32-x64.zip`

```powershell
npm run make:installer
npm run make:portable
```

## Run checks

```powershell
npm run lint
npm run typecheck
npm run test:run
npm run verify:content
npm run test:e2e
npm run verify:product
npm run verify:release
```

## Run a match (host flow)

1. Click **New Match**.
2. Choose 2–8 teams and unique names/colors.
3. Select language, difficulty, and clue time.
4. Select one or more enabled packs.
5. Press **Start match**.
6. Use host controls to select tile, lock a team, judge response, reveal clues, adjust scores, report bad clues, undo, or save and resume.

## Run in dual-screen mode

If a second display is available, quiz board and host controls split into public/host windows by default. If the public host is unavailable, the app prompts to move the public surface.

## Content and media overrides

- Use **Content Library** for bilingual CSV import, export, report/re-enable, and edits.
- Place override `.wav` files under user media folder:
  - Installed: per-user app data `media` directory
  - Portable: `<package>/UserData/media`
- See `docs/media-overrides.md` for exact filenames, durations, and supported format.

## Upgrades

- Installer upgrades reuse the same installed app-data directory.
- Portable upgrades require copying previous `UserData` into the new extracted package.
- Portable upgrade steps are documented in `docs/portable-upgrades.md`.

## Offline behavior

The renderer is blocked from external network access in production. Tests and scripts validate this for both packaged modes.

