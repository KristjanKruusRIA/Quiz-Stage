# Quiz Stage Desktop Game Design

**Status:** Approved design

**Date:** 2026-08-11

**Working title:** Quiz Stage

**Target:** Personal-use Windows 10/11 x64 desktop application

## 1. Purpose

Quiz Stage is a fully offline, host-operated, Jeopardy-style party game for 2–8 teams. It runs as a Windows desktop application, presents a clean game board on a television or projector, and gives the host private controls on the laptop when a second display is available.

The first release uses original placeholder branding and audio. It does not bundle television-show logos, music, archived clues, or other third-party show assets. A documented local override folder lets the owner substitute legally obtained personal-use media without modifying the application.

## 2. Product goals

The first release must:

1. Run without internet access after installation or extraction.
2. Support 2–8 named, color-coded teams.
3. Play a full classic match: Round One, Double Round, and Final.
4. Offer Easy, Medium, and Hard match difficulty.
5. Bundle at least 6,150 source-backed clues in English and pretranslated Estonian.
6. Randomly build valid, balanced boards while avoiding recent repeats.
7. Provide a projector-friendly public display and a private host console, with a single-screen fallback.
8. Provide safe host operations: autosave, resume, undo, manual score correction, timer controls, and bad-clue reporting.
9. Include a bilingual content editor with transactional CSV import and export.
10. Produce both a Windows installer and a portable ZIP containing a runnable `.exe`.

## 3. Non-goals for the first release

The first release does not include:

- Phone buzzers or any other networked controllers.
- Online play, user accounts, cloud synchronization, telemetry, advertisements, or runtime content downloads.
- Automatic speech recognition or automatic answer judging.
- Automatic application updates.
- Official television branding, recordings, music, or archived clue text.
- Windows ARM64, 32-bit Windows, macOS, or Linux builds.
- Persistent team profiles or an all-time leaderboard.

The architecture includes a dormant buzzer gateway interface so a local-Wi-Fi phone controller can be added later without changing the game rules.

## 4. Technology and process boundaries

The application uses Electron, React, and TypeScript. Electron Forge produces the installer and portable ZIP. SQLite stores content and user state.

The process boundaries are:

- **React renderer:** displays setup, host controls, public game screens, content editing, settings, and history. It has no direct filesystem, database, shell, or unrestricted Electron access.
- **Electron main process:** owns application lifecycle, windows, persistence, media resolution, imports and exports, and every authoritative game-state transition.
- **Typed preload bridge:** exposes a small set of validated commands and read-only subscriptions to the renderer. It never exposes raw Electron or Node APIs.
- **Pure TypeScript game engine:** implements the state machine and scoring rules without UI or database dependencies. It runs under the main process and can later accept commands from a local buzzer gateway.
- **SQLite persistence:** stores the writable content library, settings, seen-clue history, match snapshots, completed match summaries, content reports, and schema version.

The main process is the single source of truth. A renderer requests an action; the main process validates it, applies the transition, persists the result, and publishes the resulting state to both windows.

## 5. Application modules

Each module has one responsibility:

- `game-engine`: match state, legal actions, control, score changes, wagers, timers, ties, and undo events.
- `board-selector`: eligible-content filtering, balanced random selection, repeat avoidance, and seeded board construction.
- `content-library`: bundled seed import, content reads, local overrides, validation, reports, enable/disable state, and CSV operations.
- `persistence`: transactions, schema migrations, backups, match snapshots, settings, and history.
- `window-manager`: public and host windows, display assignment, fullscreen state, and single-screen fallback.
- `media-service`: bundled placeholder assets, local overrides, audio channels, and fallback behavior.
- `localization`: English and Estonian application strings plus localized content selection.
- `renderer-ui`: setup, game, editor, settings, history, and recovery screens.
- `buzzer-gateway`: an inactive interface in version one; it may submit the same team-lock command as the host console in a later release.

## 6. Match setup

The home screen offers New Match, Resume Match when an incomplete autosave exists, Content Library, Match History, and Settings.

New Match collects:

- Between 2 and 8 teams, each with a non-empty unique name and a distinct visual color. Team number is always shown, so color is not the sole identifier.
- Public language: English or Estonian.
- Match difficulty: Easy, Medium, or Hard. One choice applies to the entire match.
- Enabled bundled and custom packs.
- Ordinary clue duration from 5 to 60 seconds in five-second steps; default 15 seconds.
- Display mode: dual-screen when two displays are available, otherwise single-screen. The user may override automatic display assignment.

Setup cannot start until the selected language, difficulty, and packs can supply two valid six-category boards and one Final clue. A shortage message states the missing round, number of category sets, and Final availability.

At match start, the application generates and persists one random seed, both boards, the Final clue, and Daily Double positions. Resume always reconstructs the same match.

## 7. Board selection

A board category set is eligible only when it:

- Is enabled and belongs to an enabled pack.
- Matches the selected Easy, Medium, or Hard difficulty.
- Is tagged for the required round.
- Contains exactly one enabled clue at each tier from 1 through 5.
- Contains the selected public language for its category name, clue, canonical response, and explanation. Accepted variants are optional and localized when present.

The selector creates six categories for Round One and six for the Double Round. It must:

- Use 12 distinct category names across the match.
- Put no more than two categories from the same macro-topic on one board.
- Prefer category sets whose five clues have not appeared in completed or in-progress matches.
- When unseen content is insufficient, prefer the least-recently used valid sets.
- Use a deterministic seeded shuffle among equally eligible candidates.
- Choose a Final clue not used by the match and matching the selected difficulty and language.

After board selection, one Round One tile and two distinct Double Round tiles are selected uniformly for Daily Doubles. Daily Double positions remain hidden from renderers until their tiles are opened.

## 8. Gameplay rules

### 8.1 Round One

- The board contains six categories with five values: 200, 400, 600, 800, and 1,000.
- One Daily Double is hidden on the board.
- One team is selected randomly for initial control.

### 8.2 Double Round

- The board contains six new categories with five values: 400, 800, 1,200, 1,600, and 2,000.
- Two Daily Doubles are hidden on distinct tiles.
- The lowest-scoring team starts the round. A seeded random choice breaks a tie for lowest score.

### 8.3 Ordinary clue flow

1. The controlling team selects an unused tile.
2. The public display shows the clue and the configured countdown begins.
3. The host locks a responding team by clicking it or pressing its number from 1 through 8; locking pauses the timer.
4. The host judges the spoken response. The classic expectation is a response phrased as a question, but adjudication remains manual.
5. Correct adds the tile value, plays the correct-response crowd cue, gives that team control, and reveals the accepted response.
6. Incorrect subtracts the tile value, plays the incorrect-response cue, locks that team out for the clue, and resumes the remaining clue time for other teams.
7. If no eligible team answers correctly, the accepted response, short explanation, and source are revealed. The team that originally controlled the board retains control.

The app does not infer correctness from speech or typed text. The host may accept documented variants or use judgment for an equivalent response.

### 8.4 Daily Double

- Only the team that selected the tile may answer.
- The minimum wager is 5 points.
- The maximum wager is the greater of the team’s current score and the highest clue value in that round: 1,000 in Round One or 2,000 in the Double Round.
- The configured ordinary clue timer is used after the clue is shown.
- Correct adds the wager; incorrect subtracts it. The selecting team retains control afterward.

### 8.5 Final

- Only teams with a score greater than zero after the Double Round participate.
- The Final category is shown before wagers are committed.
- Each eligible team wagers an integer from 0 through its current score.
- Teams write wagers and responses privately. The host enters committed wagers in the private console; in single-screen mode the public display shows a neutral waiting screen.
- After the Final clue appears, a fixed 30-second timer and tension track begin.
- The host reveals teams from lowest to highest pre-Final score. Correct adds the wager; incorrect subtracts it.
- The highest resulting score wins.
- A tie for first place triggers one sudden-death clue. The first team locked by the host to answer correctly wins; an incorrect team is locked out while remaining tied teams may answer. Further sudden-death clues are used until one team wins.
- If no team enters Final, the highest score after the Double Round wins, with the same sudden-death rule for a first-place tie.

## 9. Host controls and recovery

During gameplay, shortcuts are scoped to the game window and are disabled while text inputs are focused:

- `1`–`8`: lock the corresponding team when eligible.
- `C`: mark the locked response correct.
- `X`: mark it incorrect.
- `Space`: pause or resume the active timer.
- `R`: reveal the accepted response when revealing is legal.
- `U` or `Ctrl+Z`: undo the last reversible game action.
- `M`: toggle global mute.

Every accepted state-changing command is appended to an event log and immediately followed by an atomic match snapshot. Undo creates a compensating event and never rewrites history. The host may also:

- Reset the active timer.
- Reopen a tile closed accidentally before another tile is selected.
- Adjust a team score after entering a required reason.
- Report and disable a bad clue immediately.
- End and save an incomplete match.

On restart after interruption, Resume Match loads the last valid snapshot and replays later valid events. If the newest snapshot fails validation, the app tries the preceding snapshot and informs the host what was recovered.

## 10. Public display and host console

### 10.1 Dual-screen mode

The public window is fullscreen on the chosen television or projector. It shows only material intended for players: board, category names, clue, timer, public team scores, wagers when revealed, responses, transitions, and results.

The private host window shows controls plus the accepted response, variants, explanation, source, current language, English original when the public language is Estonian, content-report action, timer controls, and event history.

If the public display disconnects, the host window remains authoritative and offers to move the public window to an available display. Reconnection does not change game state.

### 10.2 Single-screen mode

One window shows the public presentation with a collapsible host panel along the bottom. During private Final wager entry, the public area shows a waiting screen. Teams still submit wagers and responses on paper.

### 10.3 Visual system

The approved Classic Stage direction uses deep blue surfaces, warm gold point values, bold high-contrast typography, and restrained dramatic lighting. It must remain usable from 1280×720 through 3840×2160 without gameplay scrollbars.

Team numbers and names always accompany team colors. The interface provides visible keyboard focus, scalable clue text, a reduced-motion option, and no information conveyed through color alone.

“Quiz Stage” is a replaceable working title, not final branding.

## 11. Audio and media

The bundled placeholder media includes:

- Application logo and Classic Stage background.
- Opening and round-transition music.
- Daily Double sting.
- Final tension bed.
- Correct-response applause.
- Incorrect-response disappointment cue.
- Time-expired cue.
- Winner celebration.

Settings expose separate master, music, effects, and crowd volumes. Missing or unreadable audio produces a non-blocking warning and silent fallback.

In installer mode, overrides are read from the application’s user-data media folder. In portable mode, they are read from `UserData/media` beside the executable. A documented manifest lists supported filenames, formats, and recommended dimensions or duration. Each invalid override is ignored independently and the bundled placeholder is used.

## 12. Content library

### 12.1 Release inventory

The bundled release gate is:

- At least 6,000 board clues.
- At least 1,200 valid five-clue category sets.
- At least 600 distinct category names.
- At least 2,000 board clues and 400 category sets for each match difficulty.
- Within each difficulty, at least 200 category sets for each of the two rounds.
- At least 150 Final clues, with at least 50 per difficulty.

This inventory supports roughly 100 complete matches across the three difficulties before an individual board clue must repeat, or about 33 matches per difficulty.

### 12.2 Content record

Every bundled clue stores:

- Stable clue ID, pack ID, category-set ID, content kind, round, tier, match difficulty, and macro-topic.
- English and Estonian category name, clue, canonical response, accepted variants, and short explanation.
- Source title, source URL, source license, source retrieval date, and factual verification status.
- Translation status: machine-translated or reviewed.
- Enabled flag, created timestamp, and updated timestamp.

Final clues omit category-set tier and use `content kind = final` and `round = final`.

Time-sensitive facts are excluded unless the clue explicitly names its relevant date or period. The initial content uses compatible open factual sources, including CC0 structured facts, with original clue wording. Third-party source and license details are recorded in the repository and release notices.

### 12.3 Estonian translation

English is authoritative. A build-time content script translates English fields with the Apache-2.0 `Helsinki-NLP/opus-mt-en-et` model, writes the result into the content source, and marks it machine-translated. The model and Python translation runtime are build tools and are not shipped inside the application.

The validation report surfaces missing translations, unchanged English/Estonian strings, placeholder tokens, and suspiciously different numbers or named entities for review. Runtime translation never occurs.

### 12.4 Editor and CSV

The editor shows English and Estonian side by side, groups board clues into five-tier category sets, and validates continuously. Bundled records are changed through local overrides so an application upgrade cannot silently erase a correction. Custom packs are directly editable.

CSV is UTF-8 and uses one row per clue. Its documented columns cover the fields in the content record; semicolon-separated accepted variants are escaped according to RFC 4180 CSV rules. A single `content_kind` column distinguishes board and Final rows.

Import runs in a transaction:

1. Parse every row.
2. Validate types, required fields, unique IDs, category-set completeness, translation availability, sources, and duplicate normalized clue text.
3. Show all row-level errors without changing the database.
4. For a valid pack-ID conflict, require the user to choose Replace Existing or Keep Both as a newly generated pack ID.
5. Commit all rows together or commit none.

English-only custom packs can be used in English matches. They are excluded from Estonian matches until all required Estonian fields are present. Export writes a selected pack or the complete editable library to CSV.

### 12.5 Content disputes

Report Clue immediately disables the clue for future matches and records the match, host note, and timestamp. The current match continues. The editor lists reported clues first so they can be corrected and re-enabled or left disabled.

## 13. Persistence and files

Installer mode stores writable data under the operating system’s per-user application-data directory. Portable mode stores it in a writable `UserData` directory next to the executable. Portable startup fails with a clear message if that directory is not writable.

Writable data includes:

- SQLite database.
- Database backups.
- Media overrides.
- Local logs.
- CSV imports and exports selected by the user.

The bundled seed library remains inside application resources. On first launch, the persistence service initializes the writable database from the seed. Each schema migration first creates a timestamped backup and runs transactionally. A failed migration leaves the previous database and backup intact and opens a recovery screen.

Match history stores date, completion state, difficulty, language, enabled packs, team names/colors, final standings, duration, and match seed. It does not create reusable team identities or all-time statistics.

## 14. Error handling

- Invalid setup is blocked with field-specific messages.
- Insufficient eligible content is detected before a match is created and reports the exact shortage.
- A rejected game command leaves state and persistence unchanged and returns a host-visible explanation.
- Failed imports and migrations are atomic and preserve the prior database.
- Missing media falls back independently to bundled media.
- Loss of the public display does not stop or mutate the match.
- Unexpected errors are written to rotating local logs with no question content beyond stable IDs unless needed for a user-initiated diagnostic export.
- No logs or diagnostics are transmitted automatically.

## 15. Security and privacy

The app loads only packaged local UI code. Renderer sandboxing, context isolation, a restrictive Content Security Policy, blocked navigation, blocked unexpected windows, and sender-validated IPC remain enabled in production.

All IPC payloads are schema-validated in the main process. File access is limited to explicit import/export dialogs and the application-owned data locations. CSV content is data only and is never interpreted as HTML or executable code.

The application makes no runtime network requests. No telemetry, accounts, identifiers, cloud storage, or advertising are included.

## 16. Packaging and upgrades

Electron Forge produces:

- A Windows x64 Setup `.exe` installer.
- A Windows x64 portable ZIP containing the renamed application `.exe`, resources, and an initialized `UserData` directory.

The personal-use build is unsigned, so Windows SmartScreen may warn at first launch. Code signing and automatic updates are outside the first release.

Manual upgrades preserve user data. Installer upgrades reuse the same application-data directory. Portable upgrades require copying the previous `UserData` directory into the new extracted release; this procedure is documented beside the ZIP.

## 17. Verification strategy

### 17.1 Unit tests

Unit tests cover:

- Every legal and rejected state-machine transition.
- Correct, incorrect, Daily Double, Final, manual-adjustment, and undo score calculations.
- Control changes, team lockout, round transitions, Final eligibility, tie order, and sudden death.
- Timer pause, resume, reset, and expiration behavior using a fake clock.
- Seeded random selection, macro-topic limits, language/difficulty filtering, and least-recently-used fallback.
- Content normalization, duplicate detection, translation checks, and CSV validation.

### 17.2 Integration tests

Integration tests cover:

- Renderer-to-main IPC authorization and payload validation.
- SQLite initialization, backups, migrations, transactions, snapshots, event replay, and recovery.
- Bundled records plus user overrides.
- Transactional import conflict choices and export round-trips.
- Host/public window synchronization, display removal, and single-screen fallback.
- Media override resolution and fallback.

### 17.3 End-to-end tests

Automated desktop tests play complete matches with:

- 2 teams and 8 teams.
- Easy, Medium, and Hard difficulty.
- English and Estonian public language.
- Correct responses, multiple incorrect attempts, Daily Doubles, Final, no-Final eligibility, ties, and sudden death.
- Undo, score correction, clue reporting, autosave, process restart, and resume.
- Dual-screen simulation and single-screen mode.
- Missing/corrupt override media and an offline network environment.

### 17.4 Release checks

A release is acceptable only when:

- The content validator confirms every inventory threshold and finds no blocking issue.
- Unit, integration, and end-to-end suites pass from a clean checkout.
- The renderer build contains no remote URL dependency.
- Fresh Windows 10 and Windows 11 x64 smoke tests pass for installer install/launch/uninstall and portable extract/launch.
- Both packages can complete a match with outbound network access blocked.
- The public display is visually checked at 1280×720, 1920×1080, and 3840×2160 with 2 and 8 teams.
- Keyboard-only host operation and reduced-motion mode are manually checked.
- Upgrade tests preserve a prior version’s custom packs, reports, settings, history, and incomplete autosave.

## 18. Future phone buzzer extension

The future buzzer feature will add a local network gateway that translates an authenticated team button press into the existing `lockTeam(teamId)` game command. The game engine, scoring, persistence, and public display will not depend on transport details.

Version one does not open a listening socket, advertise a service, show join codes, or include inactive networking dependencies. The interface boundary exists in code and tests only where needed to keep host input independent from game rules.

## 19. Approved additions beyond the initial request

The design adds the following practical features:

- Dual-screen private hosting with a single-screen fallback.
- Autosave, crash recovery, undo, and reasoned score correction.
- Match history without persistent player profiling.
- Source-backed answer explanations and a clue-dispute workflow.
- Bilingual content editing and transactional pack import/export.
- Repeat avoidance and broad-topic balancing.
- Accessibility controls and projector-resolution verification.
- Replaceable placeholder media with original crowd reactions.

These additions support reliable in-person hosting without expanding version one into online play or account infrastructure.

## 20. Reference documentation

- Electron process model: https://www.electronjs.org/docs/latest/tutorial/process-model
- Electron security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron packaging: https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging
- Wikidata licensing: https://www.wikidata.org/wiki/Wikidata:Licensing
- English-to-Estonian OPUS-MT model: https://huggingface.co/Helsinki-NLP/opus-mt-en-et
