# Quiz Stage

Quiz Stage is a desktop Jeopardy-style quiz host app built with Electron, React, and TypeScript. It runs offline, supports English + Estonian matches, and supports one-screen and dual-screen hosting.

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

These personal-use Windows x64 artifacts are unsigned, so Windows SmartScreen may warn on first launch. Exact release evidence, hashes, and tested-platform status are recorded in [`docs/release-acceptance.md`](docs/release-acceptance.md).

```powershell
npm run make:installer
npm run make:portable
```

## macOS packages

- Apple Silicon Macs use the arm64 `QuizStage-darwin-arm64.zip` download.
- Intel Macs use the x64 `QuizStage-darwin-x64.zip` download.

Double-click the ZIP to extract `Quiz Stage.app`, then optionally move the app to `/Applications`. These macOS ZIPs are unsigned and unnotarized. For the one-time first launch, try to open the app, then open **System Settings** > **Privacy & Security**, click **Open Anyway**, authenticate, and confirm the launch. See Apple's [Open an app from an unidentified developer](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac) guidance.

macOS stores Quiz Stage data in the standard per-user `~/Library/Application Support/Quiz Stage` location. The extracted application has no adjacent portable marker or data directory.

## Ubuntu packages

Ubuntu x64 downloads are available as `quiz-stage_0.1.0_amd64.deb` and `QuizStage-linux-x64.zip`.

Install or remove the Debian package with:

```bash
sudo apt install ./quiz-stage_0.1.0_amd64.deb
sudo apt remove quiz-stage
```

To run the ZIP package, extract it and launch its executable:

```bash
unzip QuizStage-linux-x64.zip
cd Quiz\ Stage-linux-x64
./quiz-stage
```

Linux stores Quiz Stage data in `$XDG_CONFIG_HOME/Quiz Stage` when `XDG_CONFIG_HOME` is set; otherwise its default location is `~/.config/Quiz Stage`. The extracted application has no adjacent portable marker or data directory.

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
  - Windows portable: `<package>/UserData/media`
- See `docs/media-overrides.md` for exact filenames, durations, and supported format.

## Upgrades

- Installer upgrades reuse the same installed app-data directory.
- Windows portable upgrades require copying previous `UserData` into the new extracted package.
- Portable upgrade steps are documented in `docs/portable-upgrades.md`.

## Offline behavior

The renderer is blocked from external network access in production. Tests and scripts validate this for both packaged modes.

