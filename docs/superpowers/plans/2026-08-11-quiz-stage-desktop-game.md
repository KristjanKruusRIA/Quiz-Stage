# Quiz Stage Desktop Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and release the approved fully offline, bilingual, host-operated Quiz Stage Windows game with a 6,150-clue library, installer, and portable ZIP.

**Architecture:** Electron’s main process owns the game engine, SQLite database, windows, filesystem access, and every state transition. A sandboxed React renderer receives redacted host/public projections through a narrow preload bridge; the pure TypeScript game engine stays independent of Electron so a phone-buzzer transport can be added later.

**Tech Stack:** Node.js 24.15.0, npm 11.16.0, Electron 43.3.0, Electron Forge 7.11.2, React 19.2.8, TypeScript 7.0.2, Vite 8.2.1, Vitest 4.1.10, Playwright 1.62.1, Zod 4.4.3, better-sqlite3 13.0.3, and plain CSS.

## Global Constraints

- Treat `docs/superpowers/specs/2026-08-11-jeopardy-desktop-game-design.md` as authoritative.
- Target Windows 10/11 x64 only; produce an unsigned Setup `.exe` and portable ZIP.
- The installed application must make no runtime network requests and must finish a complete match with outbound access blocked.
- Support 2–8 teams, English or Estonian, and one Easy/Medium/Hard difficulty for a whole match.
- Implement Round One, Double Round, one/two Daily Doubles, Final, and sudden-death ties with the exact score and wager rules in the spec.
- Keep Electron’s renderer sandbox, context isolation, web security, restrictive CSP, blocked navigation, and sender-validated IPC enabled.
- The main process is authoritative; never store canonical game state only in React.
- Public state must not expose unrevealed responses, source notes, Daily Double positions, or private wagers.
- Bundle original placeholder media only; do not add official television assets or archived show clues.
- Bundle at least 6,000 board clues, 1,200 five-clue category sets, 600 distinct category names, and 150 Final clues in English and Estonian.
- Use test-driven development: observe each focused test fail before adding its implementation.
- Run repository-wide lint, type checking, tests, content validation, packaging, and smoke checks before release.
- Commit after every task with the exact conventional-commit message listed in that task.

---

## Milestones and scope boundaries

1. **Playable core (Tasks 1–10):** a complete match runs with a small deterministic fixture library.
2. **Durable desktop product (Tasks 11–18):** persistence, editing, localization, media, accessibility, and recovery work end to end.
3. **Production content (Tasks 19–36):** source-backed English clues, automated Estonian translation, inventory gates, and the final seed database.
4. **Release hardening (Tasks 37–43):** final visuals/audio, security, E2E coverage, packages, CI, and acceptance evidence.

Do not start a later milestone until the preceding milestone’s verification task passes.

## Planned file structure

```text
.
├── .github/workflows/
│   ├── ci.yml                         # lint, types, unit/integration/E2E tests
│   └── release.yml                    # unsigned Windows installer/ZIP artifacts
├── content/
│   ├── authored/*.csv                 # twelve source-backed English topic batches + Finals
│   ├── generated/*.en-et.csv          # translated, validated bilingual batches
│   ├── imports/                       # cached OpenTDB and Wikidata source candidates
│   ├── reports/                       # deterministic validation/translation reports
│   ├── LICENSE-CC-BY-SA-4.0.txt       # bundled clue-content license
│   └── THIRD_PARTY_NOTICES.md         # source and model attribution
├── docs/
│   ├── media-overrides.md             # supported override names/formats
│   ├── portable-upgrades.md           # preserving portable UserData
│   └── superpowers/{specs,plans}/
├── resources/
│   ├── content/seed.sqlite            # reproducible bundled library
│   └── media/                          # original logo/background/WAV cues
├── scripts/
│   ├── content/                        # fetch, adapt, translate, validate, seed scripts
│   ├── generate-placeholder-audio.ts  # deterministic original WAV generation
│   ├── make-portable.ts                # portable-only marker/UserData packaging
│   └── smoke-package.ps1               # installed and portable release smoke checks
├── src/
│   ├── main/
│   │   ├── main.ts                     # Electron lifecycle and production security policy
│   │   ├── application.ts              # dependency composition
│   │   ├── coordinator/gameCoordinator.ts
│   │   ├── content/{contentRepository,contentService,csvPacks}.ts
│   │   ├── ipc/{channels,registerIpc,validateSender}.ts
│   │   ├── media/mediaService.ts
│   │   ├── persistence/{database,migrations,matchRepository}.ts
│   │   └── windows/windowManager.ts
│   ├── preload/preload.ts              # surface-aware narrow context bridge
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/desktopApi.ts
│   │   ├── features/{home,setup,game,content,history,settings}/
│   │   ├── i18n/{en,et,index}.ts
│   │   └── styles/{tokens,global,game}.css
│   └── shared/
│       ├── appMeta.ts
│       ├── content/{schema,validation}.ts
│       ├── game/{types,commands,events,inputGateway,reducer,engine,boardSelector,views}.ts
│       └── ipc/contracts.ts
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   ├── integration/
│   ├── unit/
│   └── visual/
├── eslint.config.mjs
├── forge.config.ts
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vite.{main,preload,renderer}.config.ts
└── vitest.config.ts
```

## Milestone 1: Playable core

### Task 1: Scaffold the secure Electron/React workspace

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `forge.config.ts`
- Create: `vite.main.config.ts`
- Create: `vite.preload.config.ts`
- Create: `vite.renderer.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/main/main.ts`
- Create: `src/preload/preload.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/shared/appMeta.ts`
- Test: `tests/unit/appMeta.test.ts`

**Interfaces:**
- Consumes: approved design only.
- Produces: `APP_NAME`, `APP_VERSION`, a Forge/Vite build, and scripts `start`, `lint`, `typecheck`, `test`, `test:run`, `build`, `make:installer`, and `make:portable`.

- [ ] **Step 1: Install pinned runtime and build dependencies**

Run:

```powershell
npm init -y
npm install --save-exact react@19.2.8 react-dom@19.2.8 zod@4.4.3 electron-squirrel-startup@1.0.1
npm install --save-dev --save-exact electron@43.3.0 @electron-forge/cli@7.11.2 @electron-forge/maker-squirrel@7.11.2 @electron-forge/maker-zip@7.11.2 @electron-forge/plugin-vite@7.11.2 @vitejs/plugin-react@6.0.5 vite@8.2.1 typescript@7.0.2 tsx@4.23.12 vitest@4.1.10 eslint@10.8.1 typescript-eslint@8.67.0 eslint-plugin-react-hooks@7.1.1 @types/node@26.2.0 @types/react@19.2.18 @types/react-dom@19.2.4
```

Expected: `package-lock.json` pins the listed versions and `npm audit --omit=dev` reports no known runtime vulnerability.

- [ ] **Step 2: Write the first failing metadata test and configuration**

Create the configs listed above, set `package.json.main` to `.vite/build/main.js`, set `engines.node` to `>=24.15.0 <25`, and add:

```ts
// tests/unit/appMeta.test.ts
import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../../src/shared/appMeta';

describe('app metadata', () => {
  it('uses the approved working title and semantic version', () => {
    expect(APP_NAME).toBe('Quiz Stage');
    expect(APP_VERSION).toMatch(/^0\.1\.0$/);
  });
});
```

- [ ] **Step 3: Run the focused test and observe the expected failure**

Run: `npm run test:run -- tests/unit/appMeta.test.ts`

Expected: FAIL because `src/shared/appMeta.ts` does not exist.

- [ ] **Step 4: Implement the minimal secure shell**

Create:

```ts
// src/shared/appMeta.ts
export const APP_NAME = 'Quiz Stage';
export const APP_VERSION = '0.1.0';
```

Configure one sandboxed `BrowserWindow` with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and the preload script. Render a React heading containing `APP_NAME`; do not enable DevTools in packaged builds.

- [ ] **Step 5: Verify the scaffold**

Run:

```powershell
npm run lint
npm run typecheck
npm run test:run -- tests/unit/appMeta.test.ts
npm run build
```

Expected: all four commands exit 0; the focused test reports `1 passed`.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json forge.config.ts vite.*.config.ts tsconfig.json eslint.config.mjs vitest.config.ts src tests/unit/appMeta.test.ts
git commit -m "build: scaffold secure Electron application"
```

### Task 2: Define the game domain and IPC-safe contracts

**Files:**
- Create: `src/shared/game/types.ts`
- Create: `src/shared/game/commands.ts`
- Create: `src/shared/game/events.ts`
- Create: `src/shared/game/inputGateway.ts`
- Create: `src/shared/ipc/contracts.ts`
- Test: `tests/unit/game/contracts.test.ts`

**Interfaces:**
- Consumes: `APP_VERSION` from Task 1.
- Produces: `GameConfig`, `Team`, `Clue`, `Board`, `GameState`, `GameCommand`, `GameEvent`, `HostGameView`, `PublicGameView`, transport-neutral `GameInputGateway.submit(command)`, and Zod schemas `gameCommandSchema`, `gameConfigSchema`, `gameStateSchema`, and `gameEventSchema`.

- [ ] **Step 1: Write failing contract tests**

```ts
// tests/unit/game/contracts.test.ts
import { describe, expect, it } from 'vitest';
import { gameCommandSchema, gameConfigSchema } from '../../../src/shared/ipc/contracts';

describe('IPC contracts', () => {
  it('accepts 2-8 unique teams and one match difficulty', () => {
    const result = gameConfigSchema.safeParse({
      language: 'et', difficulty: 'hard', clueSeconds: 15,
      teams: [{ id: 't1', name: 'Alpha', color: '#E3B341' }, { id: 't2', name: 'Beta', color: '#50A7F5' }],
      packIds: ['bundled'], displayMode: 'single',
    });
    expect(result.success).toBe(true);
  });

  it('rejects renderer-supplied score deltas', () => {
    expect(gameCommandSchema.safeParse({ type: 'AwardPoints', teamId: 't1', delta: 99999 }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and observe the expected failure**

Run: `npm run test:run -- tests/unit/game/contracts.test.ts`

Expected: FAIL because the contract modules do not exist.

- [ ] **Step 3: Implement discriminated domain types and schemas**

Define command variants only for user intent:

```ts
export type GameCommand =
  | { type: 'SelectClue'; clueId: string }
  | { type: 'LockTeam'; teamId: string; at: number }
  | { type: 'JudgeResponse'; correct: boolean; at: number }
  | { type: 'SubmitDailyDoubleWager'; wager: number }
  | { type: 'SubmitFinalWager'; teamId: string; wager: number }
  | { type: 'RevealFinalTeam'; teamId: string; correct: boolean }
  | { type: 'PauseTimer'; at: number }
  | { type: 'ResumeTimer'; at: number }
  | { type: 'ResetTimer'; at: number }
  | { type: 'RevealResponse' }
  | { type: 'UndoLast' }
  | { type: 'ReopenClue' }
  | { type: 'EndIncompleteMatch' }
  | { type: 'AdjustScore'; teamId: string; score: number; reason: string }
  | { type: 'ReportClue'; clueId: string; reason: string };
```

Keep canonical responses and source fields in `GameState`; omit them from unrevealed `PublicGameView` by type.

Define `GameInputGateway` as an interface that accepts validated `GameCommand` values and returns a transition result. Implement no socket, HTTP server, service discovery, join code, or networking dependency.

- [ ] **Step 4: Verify contract behavior**

Run: `npm run test:run -- tests/unit/game/contracts.test.ts`

Expected: PASS with both cases green.

- [ ] **Step 5: Run repository checks and commit**

```powershell
npm run lint
npm run typecheck
git add src/shared tests/unit/game/contracts.test.ts
git commit -m "feat(game): define domain and IPC contracts"
```

### Task 3: Implement ordinary clue and round transitions

**Files:**
- Create: `src/shared/game/reducer.ts`
- Create: `src/shared/game/engine.ts`
- Test: `tests/unit/game/ordinaryPlay.test.ts`
- Test: `tests/unit/game/roundTransitions.test.ts`

**Interfaces:**
- Consumes: domain types and `GameCommand` from Task 2.
- Produces: `createGame(config, selectedBoards, now): GameState` and `applyGameCommand(state, command): { state: GameState; events: GameEvent[] }`.

- [ ] **Step 1: Write failing ordinary-play tests**

Cover these exact assertions:

```ts
it('adds value and transfers control after a correct response', () => {
  const opened = selectFixtureClue(game, 'r1-c1-600');
  const locked = command(opened, { type: 'LockTeam', teamId: 't2', at: 1000 });
  const judged = command(locked, { type: 'JudgeResponse', correct: true, at: 1100 });
  expect(scoreOf(judged, 't2')).toBe(600);
  expect(judged.controllingTeamId).toBe('t2');
});

it('subtracts value, locks the team out, and preserves remaining time', () => {
  const judged = openLockAndJudge(game, 'r1-c1-400', 't1', false);
  expect(scoreOf(judged, 't1')).toBe(-400);
  expect(judged.activeClue?.lockedOutTeamIds).toContain('t1');
  expect(judged.timer.remainingMs).toBeGreaterThan(0);
});
```

Add round tests for the 200–1,000 and 400–2,000 value ladders, random initial control, and lowest-score Round Two control.

- [ ] **Step 2: Run the focused tests and observe failure**

Run: `npm run test:run -- tests/unit/game/ordinaryPlay.test.ts tests/unit/game/roundTransitions.test.ts`

Expected: FAIL because the engine functions do not exist.

- [ ] **Step 3: Implement the smallest state machine that passes**

Use explicit phases:

```ts
export type GamePhase =
  | 'round-one-board' | 'ordinary-clue' | 'round-two-board'
  | 'daily-double-wager' | 'daily-double-clue'
  | 'final-category' | 'final-wagers' | 'final-clue'
  | 'final-reveal' | 'tiebreaker' | 'complete';
```

Reject illegal commands with a typed `GameRuleError`; never silently coerce a command into another phase.

- [ ] **Step 4: Verify ordinary play and both round transitions**

Run: `npm run test:run -- tests/unit/game/ordinaryPlay.test.ts tests/unit/game/roundTransitions.test.ts`

Expected: all tests pass; add explicit coverage for no-correct-answer control retention and all-teams-locked response reveal.

- [ ] **Step 5: Run checks and commit**

```powershell
npm run lint
npm run typecheck
npm run test:run -- tests/unit/game
git add src/shared/game tests/unit/game
git commit -m "feat(game): add ordinary play and round flow"
```

### Task 4: Add timers, Daily Doubles, Final, ties, and reversible host actions

**Files:**
- Modify: `src/shared/game/types.ts`
- Modify: `src/shared/game/events.ts`
- Modify: `src/shared/game/reducer.ts`
- Modify: `src/shared/game/engine.ts`
- Test: `tests/unit/game/timers.test.ts`
- Test: `tests/unit/game/dailyDouble.test.ts`
- Test: `tests/unit/game/final.test.ts`
- Test: `tests/unit/game/recoveryActions.test.ts`

**Interfaces:**
- Consumes: `applyGameCommand` and `GameState` from Task 3.
- Produces: `createCompensatingEvent(events): GameEvent`, `tickTimer(state, now): GameEvent[]`, and complete classic-match transitions.

- [ ] **Step 1: Write failing advanced-rule tests**

Tests must prove:

```ts
expect(maxDailyDoubleWager(scoreMinus400, 'round-one')).toBe(1000);
expect(maxDailyDoubleWager(score2400, 'round-one')).toBe(2400);
expect(finalEligibleTeams(state).map((t) => t.id)).toEqual(['positive-only']);
expect(applyFinalJudgment(1200, 1000, false)).toBe(200);
```

Also test timer pause arithmetic with a fake `now`, 30-second Final duration, lowest-to-highest reveal order, repeated sudden-death clues, required score-adjustment reasons, undo as a compensating event, timer reset, reopening only the most recently closed clue before another selection, and saving an explicitly ended incomplete match.

- [ ] **Step 2: Run tests and observe rule failures**

Run: `npm run test:run -- tests/unit/game/timers.test.ts tests/unit/game/dailyDouble.test.ts tests/unit/game/final.test.ts tests/unit/game/recoveryActions.test.ts`

Expected: FAIL on missing functions and unsupported phases.

- [ ] **Step 3: Implement exact rules from design Sections 8 and 9**

Represent timers as data, not renderer intervals:

```ts
export interface GameTimer {
  durationMs: number;
  remainingMs: number;
  startedAt: number | null;
  status: 'idle' | 'running' | 'paused' | 'expired';
}
```

`tickTimer` emits `TimerExpired` once. `UndoLast` may reverse only the last reversible host action and appends `ActionUndone`; it never deletes prior events.

- [ ] **Step 4: Verify the complete rules engine**

Run: `npm run test:run -- tests/unit/game`

Expected: PASS with explicit tests for wager minimum/maximum boundaries, negative scores, zero-score Final exclusion, tied lowest-score Round Two selection, and no Final-eligible teams.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/game tests/unit/game
git commit -m "feat(game): implement classic wagers and recovery rules"
```

### Task 5: Build deterministic balanced board selection

**Files:**
- Create: `src/shared/game/boardSelector.ts`
- Create: `tests/fixtures/contentFactory.ts`
- Test: `tests/unit/game/boardSelector.test.ts`

**Interfaces:**
- Consumes: `Clue`, `Board`, and `GameConfig` from Task 2.
- Produces: `selectMatchContent(input: SelectionInput): SelectedMatchContent`, `selectNextTiebreakerClue(input, excludedIds, tieIndex): FinalClue`, and deterministic `createSeededRandom(seed): () => number`.

- [ ] **Step 1: Write failing selection tests**

```ts
it('selects 12 unique names, balanced macro topics, and one Final', () => {
  const result = selectMatchContent(selectionInput({ seed: 'fixed-seed' }));
  expect(new Set(result.categorySets.map((set) => set.name.en)).size).toBe(12);
  for (const board of [result.roundOne, result.roundTwo]) {
    expect(maxMacroTopicCount(board)).toBeLessThanOrEqual(2);
  }
  expect(result.final.difficulty).toBe('medium');
});

it('prefers unseen then least-recently used sets', () => {
  const result = selectMatchContent(selectionInputWithHistory());
  expect(result.categorySets.map((set) => set.id)).toEqual(expectedLeastRecentIds);
});
```

Add shortage tests that return exact `roundOneMissing`, `roundTwoMissing`, and `finalMissing` counts without partially creating a match.

Add a tiebreaker test proving each tie index deterministically selects a previously unused Final-eligible clue and persists that selected clue before it is shown.

- [ ] **Step 2: Run the test and observe failure**

Run: `npm run test:run -- tests/unit/game/boardSelector.test.ts`

Expected: FAIL because `selectMatchContent` is missing.

- [ ] **Step 3: Implement filtering, ranking, and seeded choice**

Filter by enabled pack, language completeness, match difficulty, round, exactly five tiers, and enabled status. Rank unseen sets first, then ascending `lastSeenAt`, and seeded-shuffle only equal-ranked candidates. Place one/two Daily Doubles after board selection and omit their IDs from `PublicGameView` until opened.

- [ ] **Step 4: Verify deterministic behavior and invariants**

Run: `npm run test:run -- tests/unit/game/boardSelector.test.ts --reporter=verbose`

Expected: PASS; running twice with the same seed produces byte-equivalent selected content.

- [ ] **Step 5: Commit**

```powershell
git add src/shared/game/boardSelector.ts tests/fixtures/contentFactory.ts tests/unit/game/boardSelector.test.ts
git commit -m "feat(game): select balanced deterministic boards"
```

### Task 6: Add SQLite migrations and repositories

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/main/persistence/database.ts`
- Create: `src/main/persistence/migrations.ts`
- Create: `src/main/persistence/sql/001_initial.sql`
- Create: `src/main/persistence/matchRepository.ts`
- Test: `tests/integration/persistence/database.test.ts`
- Test: `tests/integration/persistence/matchRepository.test.ts`

**Interfaces:**
- Consumes: `GameState` and `GameEvent` from Tasks 2–4.
- Produces: `openDatabase(options): DatabaseConnection`, `migrateDatabase(db, backupDirectory): void`, and `MatchRepository` methods `persistTransition`, `loadResumable`, `completeMatch`, and `listHistory`.

- [ ] **Step 1: Install the pinned SQLite dependency**

Run:

```powershell
npm install --save-exact better-sqlite3@13.0.3
npm install --save-dev --save-exact @types/better-sqlite3@9.6.0 @electron-forge/plugin-auto-unpack-natives@7.11.2
```

Add Forge’s auto-unpack-natives plugin and keep database access in the main process only.

- [ ] **Step 2: Write failing migration and atomic-save tests**

```ts
it('creates schema version 1 in a new database', () => {
  const db = openTestDatabase();
  migrateDatabase(db, backupDir);
  expect(readSchemaVersion(db)).toBe(1);
});

it('commits events and snapshot in one transaction', () => {
  repository.persistTransition(matchId, events, state);
  expect(repository.loadResumable()?.state.phase).toBe(state.phase);
  expect(repository.readEvents(matchId)).toHaveLength(events.length);
});
```

Add a forced-insert-failure test proving neither events nor snapshot commit.

Add a migration test proving a timestamped backup is created before schema change and the prior database remains readable after a forced migration failure.

- [ ] **Step 3: Run the tests and observe failure**

Run: `npm run test:run -- tests/integration/persistence`

Expected: FAIL because the database layer does not exist.

- [ ] **Step 4: Implement schema versioning and repositories**

`001_initial.sql` must create `schema_version`, `matches`, `match_events`, `match_snapshots`, `settings`, `content_packs`, `category_sets`, `clues`, `content_overrides`, `content_reports`, and `seen_clues`. Enable foreign keys and WAL mode. Serialize state/event JSON only after Zod validation.

- [ ] **Step 5: Verify native-module packaging and persistence**

Run:

```powershell
npm run test:run -- tests/integration/persistence
npm run build
npx electron-forge package --platform win32 --arch x64
```

Expected: tests pass and the packaged application contains an unpacked working `better-sqlite3` binary.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json forge.config.ts src/main/persistence tests/integration/persistence
git commit -m "feat(persistence): add transactional SQLite storage"
```

### Task 7: Build a development seed and content service

**Files:**
- Modify: `package.json`
- Create: `src/main/content/contentRepository.ts`
- Create: `src/main/content/contentService.ts`
- Create: `src/shared/content/schema.ts`
- Create: `scripts/content/build-dev-seed.ts`
- Create: `tests/fixtures/dev-content.json`
- Test: `tests/integration/content/contentService.test.ts`

**Interfaces:**
- Consumes: `selectMatchContent`, database connection, and content domain records.
- Produces: `ContentRepository`, `ContentService.checkAvailability(config)`, `ContentService.selectForMatch(config, seed)`, and a deterministic `resources/content/dev-seed.sqlite` for development/tests.

- [ ] **Step 1: Write failing service tests**

Create fixture data containing exactly 12 category sets and one Final per difficulty, five tiers per set, both languages, and source metadata. Assert:

```ts
expect(service.checkAvailability(mediumEnglish).ok).toBe(true);
expect(service.selectForMatch(mediumEnglish, 'seed').roundOne.categories).toHaveLength(6);
expect(service.checkAvailability(estonianWithMissingTranslation)).toEqual({
  ok: false, roundOneMissing: 1, roundTwoMissing: 0, finalMissing: 0,
});
```

- [ ] **Step 2: Run the tests and observe failure**

Run: `npm run test:run -- tests/integration/content/contentService.test.ts`

Expected: FAIL because content services and the seed do not exist.

- [ ] **Step 3: Implement schema, seed builder, and read service**

Use one `LocalizedText` object for `en` and `et`, validate all persisted records with Zod, and keep SQL row mapping inside `contentRepository.ts`. `build-dev-seed.ts` must delete only its explicit output file, create a new database, run migrations, and import the fixture transactionally.

- [ ] **Step 4: Build and verify the dev seed**

Run:

```powershell
npm run content:build-dev-seed
npm run test:run -- tests/integration/content/contentService.test.ts
```

Expected: the seed script reports `183 clues, 36 category sets, 3 Finals`; tests pass.

- [ ] **Step 5: Commit**

```powershell
git add package.json src/main/content src/shared/content scripts/content tests/fixtures/dev-content.json tests/integration/content
git commit -m "feat(content): add validated development library"
```

### Task 8: Make the main process authoritative and synchronize both windows

**Files:**
- Create: `src/main/application.ts`
- Create: `src/main/coordinator/gameCoordinator.ts`
- Create: `src/main/ipc/channels.ts`
- Create: `src/main/ipc/registerIpc.ts`
- Create: `src/main/ipc/validateSender.ts`
- Create: `src/main/windows/windowManager.ts`
- Modify: `src/main/main.ts`
- Modify: `src/preload/preload.ts`
- Create: `src/shared/game/views.ts`
- Modify: `src/shared/ipc/contracts.ts`
- Test: `tests/unit/game/views.test.ts`
- Test: `tests/integration/ipc/registerIpc.test.ts`
- Test: `tests/integration/windows/windowManager.test.ts`

**Interfaces:**
- Consumes: game engine, repositories, content service, and IPC schemas.
- Produces: `GameCoordinator.startMatch`, `GameCoordinator.dispatch`, `GameCoordinator.subscribe`; `toHostGameView`, `toPublicGameView`; and preload API `window.quizStage`.

- [ ] **Step 1: Write redaction and sender-validation tests**

```ts
it('redacts an unrevealed response and Daily Double from public state', () => {
  const view = toPublicGameView(fixtureStateWithHiddenAnswer());
  expect(JSON.stringify(view)).not.toContain('Heisenberg');
  expect(JSON.stringify(view)).not.toContain('daily-double');
});

it('rejects commands from the public webContents sender', async () => {
  await expect(invokeAs(publicSender, validCommand)).rejects.toThrow('HOST_SENDER_REQUIRED');
});
```

- [ ] **Step 2: Run focused tests and observe failure**

Run: `npm run test:run -- tests/unit/game/views.test.ts tests/integration/ipc tests/integration/windows`

Expected: FAIL on missing projections, coordinator, and window manager.

- [ ] **Step 3: Implement the coordinator and projections**

`dispatch` must validate the command, apply it, persist events plus snapshot in one transaction, and only then publish a host projection and a separately constructed public projection. Never clone host state and delete fields afterward.

- [ ] **Step 4: Implement dual/single window creation and preload surface checks**

Pass `--surface=host` or `--surface=public` as an additional argument. Expose `dispatch` only for the host surface; expose `subscribeToState` to both. In main IPC handlers, independently verify `event.sender.id === hostWindow.webContents.id`.

- [ ] **Step 5: Verify synchronization and security**

Run:

```powershell
npm run test:run -- tests/unit/game/views.test.ts tests/integration/ipc tests/integration/windows
npm run lint
npm run typecheck
```

Expected: all commands exit 0 and redaction tests prove unrevealed data is absent.

- [ ] **Step 6: Commit**

```powershell
git add src/main src/preload src/shared tests/unit/game/views.test.ts tests/integration/ipc tests/integration/windows
git commit -m "feat(desktop): synchronize secure host and public views"
```

### Task 9: Implement Home and New Match setup

**Files:**
- Create: `src/renderer/api/desktopApi.ts`
- Modify: `src/renderer/App.tsx`
- Create: `src/renderer/features/home/HomeScreen.tsx`
- Create: `src/renderer/features/setup/SetupScreen.tsx`
- Create: `src/renderer/features/setup/TeamEditor.tsx`
- Create: `src/renderer/styles/tokens.css`
- Create: `src/renderer/styles/global.css`
- Test: `tests/unit/renderer/HomeScreen.test.tsx`
- Test: `tests/unit/renderer/SetupScreen.test.tsx`

**Interfaces:**
- Consumes: preload `window.quizStage`, `gameConfigSchema`, and content-availability response.
- Produces: a validated `GameConfig` submitted through `desktopApi.startMatch(config)`.

- [ ] **Step 1: Install renderer-test dependencies**

Run:

```powershell
npm install --save-dev --save-exact @testing-library/react@16.3.2 @testing-library/user-event@14.6.3 @testing-library/jest-dom@7.0.1 jsdom@30.0.1
```

Configure a `jsdom` Vitest project for renderer tests and a typed mock desktop API.

- [ ] **Step 2: Write failing setup tests**

Tests must add/remove teams to the 2/8 limits, reject duplicate/empty names, select language/difficulty/timer/packs/display mode, show exact availability shortages, and submit this payload:

```ts
expect(api.startMatch).toHaveBeenCalledWith(expect.objectContaining({
  language: 'et', difficulty: 'hard', clueSeconds: 15,
  teams: expect.arrayContaining([expect.objectContaining({ name: 'Alpha' })]),
}));
```

- [ ] **Step 3: Run the tests and observe failure**

Run: `npm run test:run -- tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/SetupScreen.test.tsx`

Expected: FAIL because the screens do not exist.

- [ ] **Step 4: Implement minimal accessible setup screens**

Use native form controls and visible labels. Generate stable team IDs with `crypto.randomUUID()`. Always render team numbers alongside colors. Disable Start until local schema validation and main-process availability both succeed.

- [ ] **Step 5: Verify setup behavior**

Run:

```powershell
npm run test:run -- tests/unit/renderer/HomeScreen.test.tsx tests/unit/renderer/SetupScreen.test.tsx
npm run lint
npm run typecheck
```

Expected: all tests pass with no accessibility-query fallback to test IDs for labeled inputs.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json vitest.config.ts src/renderer tests/unit/renderer
git commit -m "feat(ui): add home and match setup"
```

### Task 10: Deliver the complete fixture-backed match UI

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/renderer/features/game/GameSurface.tsx`
- Create: `src/renderer/features/game/PublicBoard.tsx`
- Create: `src/renderer/features/game/PublicClue.tsx`
- Create: `src/renderer/features/game/PublicFinal.tsx`
- Create: `src/renderer/features/game/HostConsole.tsx`
- Create: `src/renderer/features/game/HostTeamControls.tsx`
- Create: `src/renderer/features/game/useGameShortcuts.ts`
- Create: `src/renderer/features/game/useDisplayedTimer.ts`
- Create: `src/renderer/styles/game.css`
- Create: `playwright.config.ts`
- Test: `tests/unit/renderer/game/PublicBoard.test.tsx`
- Test: `tests/unit/renderer/game/HostConsole.test.tsx`
- Test: `tests/unit/renderer/game/FinalFlow.test.tsx`
- Test: `tests/unit/renderer/game/shortcuts.test.tsx`
- Test: `tests/e2e/core-match.spec.ts`

**Interfaces:**
- Consumes: host/public projections and `desktopApi.dispatch(command)`.
- Produces: every player/host screen needed to complete a fixture-backed match and shortcut mapping `1–8`, `C`, `X`, `Space`, `R`, `U`/`Ctrl+Z`, and `M`.

- [ ] **Step 1: Write failing component tests**

Install the pinned E2E runner first:

```powershell
npm install --save-dev --save-exact @playwright/test@1.62.1
npx playwright install chromium
```

Assert that public tiles expose category/value but not answers, clue screens render the active timer, host console shows canonical response/source, incorrect judgment leaves other teams enabled, Daily Double accepts only valid wagers, single-screen Final wager entry replaces public content with a neutral waiting screen, Final reveals in required order, and shortcuts do nothing while an input owns focus.

- [ ] **Step 2: Write the failing full-match E2E test**

Use Playwright’s Electron launcher to start a two-team English medium match, play all Round One and Double Round tiles through a deterministic fixture, complete Daily Doubles and Final, and assert the winner screen. Listen to all requests and fail if a non-local URL is requested.

- [ ] **Step 3: Run tests and observe failure**

Run:

```powershell
npm run test:run -- tests/unit/renderer/game
npx playwright test tests/e2e/core-match.spec.ts
```

Expected: both commands fail because gameplay components are absent.

- [ ] **Step 4: Implement the minimal complete host/public flow**

Render by `GamePhase`, use CSS Grid for the 6×5 board, derive the displayed timer from authoritative timestamps, and dispatch only intent commands. Public components accept `PublicGameView`; host components accept `HostGameView` so TypeScript prevents accidental answer leakage.

- [ ] **Step 5: Verify Milestone 1**

Run:

```powershell
npm run lint
npm run typecheck
npm run test:run
npm run build
npx playwright test tests/e2e/core-match.spec.ts
```

Expected: all commands exit 0 and E2E completes one entire fixture-backed match without an external request.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json src/renderer playwright.config.ts tests/unit/renderer/game tests/e2e/core-match.spec.ts
git commit -m "feat(ui): complete fixture-backed classic match"
```

## Milestone 2: Durable desktop product

### Task 11: Add autosave recovery, Resume, and Match History

**Files:**
- Modify: `src/main/persistence/matchRepository.ts`
- Modify: `src/main/coordinator/gameCoordinator.ts`
- Modify: `src/shared/ipc/contracts.ts`
- Modify: `src/renderer/features/home/HomeScreen.tsx`
- Create: `src/renderer/features/history/HistoryScreen.tsx`
- Create: `src/renderer/features/history/RecoveryNotice.tsx`
- Test: `tests/integration/persistence/recovery.test.ts`
- Test: `tests/unit/renderer/HistoryScreen.test.tsx`
- Test: `tests/e2e/resume-match.spec.ts`

**Interfaces:**
- Consumes: atomic event/snapshot persistence and coordinator dispatch.
- Produces: `GameCoordinator.resumeLatest()`, `MatchRepository.recoverLatest()`, `desktopApi.listHistory()`, and `desktopApi.resumeMatch()`.

- [ ] **Step 1: Write failing recovery tests**

Test a valid latest snapshot, a corrupt latest snapshot with valid predecessor, and a completed match that is not offered for resume:

```ts
expect(repository.recoverLatest()).toEqual(expect.objectContaining({
  recoveredFromSnapshotSequence: 41,
  skippedInvalidSnapshotSequence: 42,
}));
```

History tests must render date, completion state, language, difficulty, teams, standings, duration, pack IDs, and seed without creating persistent team identities.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/integration/persistence/recovery.test.ts tests/unit/renderer/HistoryScreen.test.tsx`

Expected: FAIL on missing recovery and history interfaces.

- [ ] **Step 3: Implement recovery and history**

Validate every loaded JSON snapshot with `gameStateSchema`; walk snapshots newest-to-oldest until one is valid; replay only later events that pass `gameEventSchema`. Return a recovery notice describing skipped data without exposing clue text in logs.

- [ ] **Step 4: Verify process-restart resume E2E**

Run: `npx playwright test tests/e2e/resume-match.spec.ts`

Expected: E2E kills the app during Round One, relaunches it, resumes the same seed/board/scores, completes the match, and finds it in History.

- [ ] **Step 5: Commit**

```powershell
git add src/main src/shared/ipc src/renderer/features/home src/renderer/features/history tests/integration/persistence/recovery.test.ts tests/unit/renderer/HistoryScreen.test.tsx tests/e2e/resume-match.spec.ts
git commit -m "feat(persistence): recover matches and show history"
```

### Task 12: Add local content overrides and clue reporting

**Files:**
- Modify: `src/main/content/contentRepository.ts`
- Modify: `src/main/content/contentService.ts`
- Modify: `src/main/coordinator/gameCoordinator.ts`
- Modify: `src/shared/content/schema.ts`
- Create: `src/shared/content/validation.ts`
- Test: `tests/integration/content/overrides.test.ts`
- Test: `tests/integration/content/reportClue.test.ts`

**Interfaces:**
- Consumes: `ReportClue` command, content tables, and board eligibility rules.
- Produces: `ContentRepository.saveOverride`, `reportClue`, `resolveReport`, `listReported`, and merged reads where a local override wins over a bundled record.

- [ ] **Step 1: Write failing override/report tests**

```ts
it('disables a reported clue for future selection but not the current match', () => {
  coordinator.dispatch({ type: 'ReportClue', clueId, reason: 'Incorrect date' });
  expect(coordinator.hostView().activeClue?.id).toBe(clueId);
  expect(contentService.isEligible(clueId)).toBe(false);
});

it('keeps a bundled correction across seed upgrades', () => {
  repository.saveOverride(correctedClue);
  repository.replaceBundledSeed(newSeed);
  expect(repository.getClue(correctedClue.id)?.response.en).toBe('Corrected');
});
```

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/integration/content/overrides.test.ts tests/integration/content/reportClue.test.ts`

Expected: FAIL because overrides/reports are not implemented.

- [ ] **Step 3: Implement merged content reads and reports**

Store user changes as field-complete override JSON keyed by stable clue ID. Disable reports immediately in the same transaction as the report record. Re-enable only after an explicit corrected override or Resolve Without Change action.

- [ ] **Step 4: Verify board selection respects reports**

Run: `npm run test:run -- tests/integration/content tests/unit/game/boardSelector.test.ts`

Expected: all pass; reported IDs never appear in newly selected boards.

- [ ] **Step 5: Commit**

```powershell
git add src/main/content src/main/coordinator src/shared/content tests/integration/content
git commit -m "feat(content): preserve overrides and report bad clues"
```

### Task 13: Implement transactional CSV import and export

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/main/content/csvPacks.ts`
- Create: `src/shared/content/csvColumns.ts`
- Modify: `src/main/ipc/registerIpc.ts`
- Test: `tests/unit/content/csvValidation.test.ts`
- Test: `tests/integration/content/csvRoundTrip.test.ts`

**Interfaces:**
- Consumes: content schemas, validation, repository transactions, and Electron file dialogs.
- Produces: `parsePackCsv(text): ParsedPack`, `validatePack(pack): ValidationIssue[]`, `importPack(options)`, and `exportPack(packId, destination)`.

- [ ] **Step 1: Install pinned CSV libraries**

Run:

```powershell
npm install --save-exact csv-parse@6.8.3 csv-stringify@7.0.2
```

- [ ] **Step 2: Write failing RFC 4180 and transaction tests**

Define the exact ordered columns in `csvColumns.ts`:

```ts
export const CSV_COLUMNS = [
  'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind',
  'round', 'tier', 'difficulty', 'macro_topic', 'category_name_en',
  'category_name_et', 'clue_en', 'clue_et', 'response_en', 'response_et',
  'accepted_variants_en', 'accepted_variants_et', 'explanation_en',
  'explanation_et', 'source_title', 'source_url', 'source_license',
  'source_retrieved_at', 'translation_status', 'enabled',
] as const;
```

Tests must cover quoted commas/newlines, UTF-8 BOM, semicolon variant escaping, duplicate normalized clue text, incomplete five-tier sets, English-only custom packs, Replace Existing, Keep Both, and rollback after one invalid row.

- [ ] **Step 3: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/content/csvValidation.test.ts tests/integration/content/csvRoundTrip.test.ts`

Expected: FAIL because the parser/importer does not exist.

- [ ] **Step 4: Implement parse → validate → preview → commit**

Never write during parse/preview. `Keep Both` generates a new pack ID and rewrites every imported row’s pack ID in memory before one transaction. Export must re-import to byte-equivalent domain records after normalized ordering.

- [ ] **Step 5: Verify round trip and commit**

```powershell
npm run test:run -- tests/unit/content tests/integration/content/csvRoundTrip.test.ts
npm run lint
npm run typecheck
git add package.json package-lock.json src/main/content src/main/ipc src/shared/content tests/unit/content tests/integration/content/csvRoundTrip.test.ts
git commit -m "feat(content): import and export validated CSV packs"
```

### Task 14: Build the bilingual Content Library editor

**Files:**
- Create: `src/renderer/features/content/ContentLibraryScreen.tsx`
- Create: `src/renderer/features/content/PackList.tsx`
- Create: `src/renderer/features/content/CategorySetEditor.tsx`
- Create: `src/renderer/features/content/FinalClueEditor.tsx`
- Create: `src/renderer/features/content/ImportPreview.tsx`
- Create: `src/renderer/features/content/ValidationPanel.tsx`
- Modify: `src/renderer/api/desktopApi.ts`
- Test: `tests/unit/renderer/content/ContentLibraryScreen.test.tsx`
- Test: `tests/unit/renderer/content/CategorySetEditor.test.tsx`
- Test: `tests/unit/renderer/content/ImportPreview.test.tsx`
- Test: `tests/e2e/content-editor.spec.ts`

**Interfaces:**
- Consumes: content CRUD, reports, import/export, and validation issues from Tasks 12–13.
- Produces: side-by-side English/Estonian editing, category-set completeness UI, report resolution, and import/export flows.

- [ ] **Step 1: Write failing editor tests**

Tests must prove bundled edits save as overrides, custom packs edit directly, reported clues sort first, missing Estonian fields block Estonian eligibility but not English eligibility, five tiers are visible together, and invalid imports show every row-level error before a write.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/renderer/content`

Expected: FAIL because editor components do not exist.

- [ ] **Step 3: Implement focused editor screens**

Keep one category set per edit form. Display source URL/license and translation status beside the clue. Save through schema-validated main-process commands; never persist draft state directly from React.

- [ ] **Step 4: Verify editor E2E**

Run: `npx playwright test tests/e2e/content-editor.spec.ts`

Expected: create a custom pack, add a complete five-tier bilingual set, export it, delete it, re-import it, report/correct/re-enable one clue, and confirm it becomes selectable.

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/features/content src/renderer/api tests/unit/renderer/content tests/e2e/content-editor.spec.ts
git commit -m "feat(ui): add bilingual content editor"
```

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

### Task 17: Complete display recovery, accessibility, and responsive layouts

**Files:**
- Modify: `src/main/windows/windowManager.ts`
- Modify: `src/renderer/styles/tokens.css`
- Modify: `src/renderer/styles/global.css`
- Modify: `src/renderer/styles/game.css`
- Modify: `src/renderer/features/game/PublicBoard.tsx`
- Modify: `src/renderer/features/game/PublicClue.tsx`
- Modify: `src/renderer/features/game/PublicFinal.tsx`
- Modify: `src/renderer/features/game/HostConsole.tsx`
- Modify: `src/renderer/features/game/HostTeamControls.tsx`
- Create: `tests/unit/windows/displayRecovery.test.ts`
- Create: `tests/visual/game-layout.spec.ts`
- Create: `tests/e2e/keyboard-only.spec.ts`

**Interfaces:**
- Consumes: host/public windows, Settings reduced-motion flag, and game components.
- Produces: display reassignment without state mutation, 720p/1080p/4K layouts, visible focus, scalable clue text, and keyboard-complete play.

- [ ] **Step 1: Write failing display and accessibility tests**

Simulate removal of the public display and assert the host remains open, the public window moves only after confirmation, and `GameState` is byte-identical. Test 2-team and 8-team boards at 1280×720, 1920×1080, and 3840×2160 with no gameplay scrollbar or clipped score.

- [ ] **Step 2: Run tests and observe failure**

Run:

```powershell
npm run test:run -- tests/unit/windows/displayRecovery.test.ts
npx playwright test tests/visual/game-layout.spec.ts tests/e2e/keyboard-only.spec.ts
```

Expected: FAIL on missing recovery behavior and layout assertions.

- [ ] **Step 3: Implement responsive and accessible behavior**

Use CSS `clamp()` for category/clue/score type, grid min/max constraints for team cards, `:focus-visible`, `prefers-reduced-motion`, and an explicit reduced-motion class. Every interactive host control needs a label, focus order, and keyboard equivalent.

- [ ] **Step 4: Verify all target resolutions and keyboard flow**

Run the commands from Step 2 again.

Expected: six visual layout cases and the full keyboard-only match pass.

- [ ] **Step 5: Commit**

```powershell
git add src/main/windows src/renderer/styles src/renderer/features/game tests/unit/windows tests/visual tests/e2e/keyboard-only.spec.ts
git commit -m "feat(ui): harden displays and accessibility"
```

### Task 18: Verify the durable-product milestone

**Files:**
- Create: `tests/e2e/durable-product.spec.ts`
- Create: `tests/integration/security/offlineRenderer.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: all Milestone 1–2 features.
- Produces: `npm run verify:product`, the gate required before production content work.

- [ ] **Step 1: Add a failing cross-feature scenario**

The scenario must create an Estonian custom pack, start an 8-team hard match in dual-window simulation, report one clue, adjust a score with a reason, undo a later judgment, kill/restart/resume, complete Final, verify History, and export/re-import the pack.

- [ ] **Step 2: Add the offline renderer assertion**

Intercept Electron session requests and fail on any URL whose scheme is not the packaged custom protocol or Vite’s localhost development URL when `NODE_ENV !== 'production'`.

- [ ] **Step 3: Run the cross-feature scenario**

Run: `npx playwright test tests/e2e/durable-product.spec.ts`

Expected: PASS. If any assertion fails, stop the milestone gate, make only the smallest correction supported by that failure, rerun the single case, then rerun the complete scenario.

- [ ] **Step 4: Run the full milestone gate**

Define `verify:product` as lint + typecheck + all unit/integration tests + build + Milestone 1–2 E2E. Run: `npm run verify:product`.

Expected: exit 0 with no skipped tests and no unexpected network request.

- [ ] **Step 5: Commit**

```powershell
git add package.json src tests/e2e/durable-product.spec.ts tests/integration/security
git commit -m "test: verify durable offline game product"
```

## Milestone 3: Production bilingual content

### Task 19: Create the production content validator and release inventory gate

**Files:**
- Create: `scripts/content/validate.ts`
- Create: `scripts/content/readCsv.ts`
- Create: `scripts/content/releaseThresholds.ts`
- Create: `scripts/content/sourceCheck.ts`
- Create: `content/reports/.gitkeep`
- Modify: `package.json`
- Test: `tests/unit/content/productionValidator.test.ts`
- Test: `tests/fixtures/content-invalid/missing-tier.csv`
- Test: `tests/fixtures/content-invalid/duplicate-id.csv`
- Test: `tests/fixtures/content-invalid/duplicate-text.csv`
- Test: `tests/fixtures/content-invalid/duplicate-category.csv`
- Test: `tests/fixtures/content-invalid/invalid-round.csv`
- Test: `tests/fixtures/content-invalid/missing-source.csv`
- Test: `tests/fixtures/content-invalid/undated-changing-fact.csv`
- Test: `tests/fixtures/content-invalid/missing-translation.csv`
- Test: `tests/fixtures/content-invalid/number-drift.csv`
- Test: `tests/fixtures/content-invalid/release-shortage.csv`

**Interfaces:**
- Consumes: shared content schema and `CSV_COLUMNS`.
- Produces: CLI `npm run content:validate -- --input <glob> --mode batch|release [--allow-missing-et] --report <path>` and `npm run content:source-check -- --input <file>` with exit 0 only when no blocking issue exists.

- [ ] **Step 1: Install the pinned build-time glob dependency**

Run: `npm install --save-dev --save-exact glob@13.0.6`

Expected: package and lockfile contain `glob` only as a development dependency.

- [ ] **Step 2: Write failing validator tests**

Fixtures must independently trigger: missing tier, duplicate ID, duplicate normalized clue, duplicate category name, invalid difficulty/round, missing source, time-sensitive wording without an explicit date, missing translation, number mismatch between languages, 12-category shortage, and each release inventory shortage.

```ts
expect(validateRelease(validRecords).summary).toEqual({
  boardClues: 6000, categorySets: 1200, distinctCategoryNames: 1200,
  finalClues: 150, easySets: 400, mediumSets: 400, hardSets: 400,
});
```

- [ ] **Step 3: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/content/productionValidator.test.ts`

Expected: FAIL because the production validator does not exist.

- [ ] **Step 4: Implement deterministic validation**

Sort every issue by file, row, code, and message. Treat the approved release thresholds as constants. Add warning codes for unchanged translations and suspicious proper-noun changes; warnings do not affect exit code unless promoted in `--mode release` by an unreviewed exception. Report writes must atomically merge a `validation` property into an existing JSON report rather than erase other report sections.

`sourceCheck.ts` must validate HTTPS URLs, reject official-show clue-archive hosts, cache successful checks by URL, use a descriptive User-Agent with bounded concurrency/backoff, and support Wikidata entity batching. It records status and retrieval time without copying page text.

- [ ] **Step 5: Verify machine-readable reports**

Run:

```powershell
npm run test:run -- tests/unit/content/productionValidator.test.ts
npm run content:validate -- --input "tests/fixtures/content-invalid/*.csv" --mode batch --report content/reports/invalid-fixture.json
```

Expected: the test passes; the CLI exits nonzero and the report contains every expected issue code in stable order.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json scripts/content content/reports/.gitkeep tests/unit/content/productionValidator.test.ts tests/fixtures/content-invalid
git commit -m "build(content): enforce production inventory gates"
```

### Task 20: Add resumable Open Trivia DB candidate ingestion and attribution

**Files:**
- Modify: `package.json`
- Create: `scripts/content/fetchOpenTdb.ts`
- Create: `scripts/content/adaptOpenTdb.ts`
- Create: `tests/fixtures/opentdb/token.json`
- Create: `tests/fixtures/opentdb/page.json`
- Create: `tests/fixtures/opentdb/exhausted.json`
- Create: `tests/fixtures/opentdb/rate-limited.json`
- Create: `content/imports/.gitkeep`
- Create: `content/LICENSE-CC-BY-SA-4.0.txt`
- Create: `content/THIRD_PARTY_NOTICES.md`
- Test: `tests/unit/content/openTdbImport.test.ts`

**Interfaces:**
- Consumes: OpenTDB token/category/count/API responses encoded as Base64.
- Produces: `content/imports/opentdb-candidates.jsonl` with stable source IDs, decoded question/answer, original category/difficulty, attribution, and normalized duplicate key.

- [ ] **Step 1: Write failing importer tests with recorded responses**

Test token exhaustion, response codes, retry-after handling, deduplication across resumed runs, Base64 decoding, HTML-free output, and preservation of `CC-BY-SA-4.0` provenance.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/content/openTdbImport.test.ts`

Expected: FAIL because fetch/adapt functions are missing.

- [ ] **Step 3: Implement polite resumable fetching**

Use `https://opentdb.com/api.php?amount=50&encode=base64&token=...`, a descriptive User-Agent, a minimum five-second delay, exponential retry for 429/5xx, and an explicit checkpoint file. CI tests use fixtures and never call the live API.

- [ ] **Step 4: Implement candidate adaptation and notices**

Adapted candidates are inspiration inputs, not final records. Keep the original source ID/text/license, strip multiple-choice distractors from the intended canonical response, and require a separate factual source during batch authoring. Add OpenTDB attribution and CC BY-SA 4.0 terms to `THIRD_PARTY_NOTICES.md`.

- [ ] **Step 5: Verify a live cache build once**

Run: `npm run content:fetch-opentdb -- --resume --output content/imports/opentdb-candidates.jsonl`

Expected: clean exit after token exhaustion or explicit configured candidate target; output contains unique stable IDs and is restart-safe. Record fetched count and retrieval date in the notice.

- [ ] **Step 6: Commit**

```powershell
git add scripts/content tests/fixtures/opentdb content/imports/opentdb-candidates.jsonl content/LICENSE-CC-BY-SA-4.0.txt content/THIRD_PARTY_NOTICES.md tests/unit/content/openTdbImport.test.ts package.json
git commit -m "build(content): ingest attributed OpenTDB candidates"
```

### Task 21: Add source-backed Wikidata candidate recipes

**Files:**
- Modify: `package.json`
- Create: `scripts/content/wikidataRecipes.ts`
- Create: `scripts/content/fetchWikidata.ts`
- Create: `scripts/content/mapWikidataCandidates.ts`
- Create: `tests/fixtures/wikidata/historical-events-page1.json`
- Create: `tests/fixtures/wikidata/places-page1.json`
- Create: `tests/fixtures/wikidata/missing-label.json`
- Create: `tests/fixtures/wikidata/rate-limited.json`
- Test: `tests/unit/content/wikidataImport.test.ts`

**Interfaces:**
- Consumes: Wikidata SPARQL JSON results from small paginated recipe queries.
- Produces: `content/imports/wikidata-candidates.jsonl` with entity/property IDs, English labels, factual values, entity URLs, retrieval date, and `CC0-1.0` license.

- [ ] **Step 1: Write failing recipe/import tests**

Require twelve named recipe families: `historical-events`, `places-and-features`, `scientists-and-discoveries`, `authors-and-works`, `artists-and-works`, `composers-and-works`, `films-and-directors`, `athletes-and-teams`, `foods-and-origins`, `inventions-and-inventors`, `institutions-and-foundings`, and `mythology-philosophy`. Test pagination, retry, duplicate fact keys, missing labels, and stable entity URLs.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/content/wikidataImport.test.ts`

Expected: FAIL because recipes/importer are missing.

- [ ] **Step 3: Implement bounded SPARQL recipes**

Each query must request at most 500 rows, use keyset pagination rather than a broad offset scan, request English labels, and send a descriptive User-Agent. Cache raw responses before mapping so content builds never depend on a live query.

- [ ] **Step 4: Implement candidate mapping and CC0 attribution**

Reject candidates lacking the facts needed to author a self-contained clue. Store all Q/P IDs used by the fact so a reviewer can reopen the source. Add Wikidata CC0 attribution and retrieval method to `THIRD_PARTY_NOTICES.md`.

- [ ] **Step 5: Fetch and verify the source cache**

Run:

```powershell
npm run content:fetch-wikidata -- --all-recipes --output content/imports/wikidata-candidates.jsonl
npm run test:run -- tests/unit/content/wikidataImport.test.ts
```

Expected: twelve recipe summaries, no duplicate fact key, no request over 500 rows, tests pass.

- [ ] **Step 6: Commit**

```powershell
git add scripts/content tests/fixtures/wikidata content/imports/wikidata-candidates.jsonl content/THIRD_PARTY_NOTICES.md tests/unit/content/wikidataImport.test.ts package.json
git commit -m "build(content): fetch CC0 Wikidata candidates"
```

### Task 22: Implement reproducible English-to-Estonian pretranslation

**Files:**
- Modify: `package.json`
- Create: `scripts/content/requirements-translate.txt`
- Create: `scripts/content/translate_en_et.py`
- Create: `scripts/content/translationDiagnostics.ts`
- Create: `tests/fixtures/translation/source.csv`
- Create: `tests/fixtures/translation/expected-structure.csv`
- Test: `tests/unit/content/translationDiagnostics.test.ts`
- Modify: `.gitignore`
- Modify: `content/THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: validated English batch CSV and model `Helsinki-NLP/opus-mt-en-et`.
- Produces: bilingual CSV preserving IDs/source fields, `translation_status=machine`, and JSON diagnostics for missing/unchanged text, number drift, and named-entity drift.

- [ ] **Step 1: Pin translation tooling and write failing diagnostics tests**

`requirements-translate.txt` must contain:

```text
transformers==4.57.6
torch==2.11.0
sentencepiece==0.2.1
```

Tests must flag `1969` becoming `1968`, a missing proper noun, blank Estonian output, and unchanged multiword English, while allowing unchanged stable IDs and URLs.

- [ ] **Step 2: Run diagnostics tests and observe failure**

Run: `npm run test:run -- tests/unit/content/translationDiagnostics.test.ts`

Expected: FAIL because diagnostic code is missing.

- [ ] **Step 3: Implement direct model loading and resumable batches**

Use `AutoTokenizer.from_pretrained` and `AutoModelForSeq2SeqLM.from_pretrained`; translate category name, clue, canonical response, accepted variants, and explanation in bounded batches. Cache the model under `.cache/translation/`, checkpoint after each CSV row, and never include the model in packaged resources.

- [ ] **Step 4: Implement deterministic diagnostics and exception records**

Every diagnostic exception must include clue ID, issue code, reviewer reason, and corrected Estonian text. Diagnostic writes atomically merge a `translation` property into the batch report and preserve its `validation` property. Add `.cache/` to `.gitignore` and attribute the Apache-2.0 model in `THIRD_PARTY_NOTICES.md`.

- [ ] **Step 5: Verify fixture translation structure**

Run:

```powershell
python -m pip install -r scripts/content/requirements-translate.txt
python scripts/content/translate_en_et.py --input tests/fixtures/translation/source.csv --output content/reports/translation-fixture.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/reports/translation-fixture.csv --report content/reports/translation-fixture.json
```

Expected: output preserves row/ID/source counts, fills every Estonian field, and diagnostics JSON is structurally valid.

- [ ] **Step 6: Commit**

```powershell
git add .gitignore scripts/content tests/fixtures/translation content/THIRD_PARTY_NOTICES.md package.json
git commit -m "build(content): pretranslate English clues to Estonian"
```

### Production batch allocation

Every topic task below produces exactly 100 distinct category sets and 500 board clues. Every set has one clue at each tier 1–5; all English category names are globally unique. Exactly 100 clues per batch are adapted from attributed OpenTDB candidates and independently checked against a CC0 factual source; the other 400 use Wikidata/compatible open facts with original wording. No source may be an official-show clue archive.

| Task | Topic file | Easy R1/R2 | Medium R1/R2 | Hard R1/R2 |
|---|---|---:|---:|---:|
| 23 | `01-history` | 17/17 | 17/16 | 16/17 |
| 24 | `02-geography` | 17/17 | 16/17 | 17/16 |
| 25 | `03-science-nature` | 17/17 | 17/16 | 16/17 |
| 26 | `04-literature-language` | 17/17 | 16/17 | 17/16 |
| 27 | `05-art-architecture` | 17/16 | 17/17 | 16/17 |
| 28 | `06-music` | 16/17 | 17/17 | 17/16 |
| 29 | `07-film-television` | 17/16 | 17/17 | 16/17 |
| 30 | `08-sports-games` | 16/17 | 17/17 | 17/16 |
| 31 | `09-food-drink` | 17/16 | 16/17 | 17/17 |
| 32 | `10-technology-inventions` | 16/17 | 17/16 | 17/17 |
| 33 | `11-politics-economics-society` | 17/16 | 16/17 | 17/17 |
| 34 | `12-mythology-religion-philosophy` | 16/17 | 17/16 | 17/17 |

Across the twelve tasks this yields exactly 200 category sets for each difficulty/round pair and 400 sets per match difficulty.

### Task 23: Author and translate the History batch

**Files:**
- Create: `content/authored/01-history.csv`
- Create: `content/generated/01-history.en-et.csv`
- Create: `content/reports/01-history.json`

**Interfaces:**
- Consumes: candidate caches, CSV schema, validator, source checker, and translator from Tasks 19–22.
- Produces: pack `built-in-history`, exactly 100 category sets/500 bilingual clues with distribution E 17/17, M 17/16, H 16/17 for R1/R2.

- [ ] **Step 1: Prove the batch gate is initially red**

Run: `npm run content:validate -- --input content/authored/01-history.csv --mode batch --allow-missing-et --report content/reports/01-history.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the exact English inventory**

Write UTF-8 CSV rows for ancient, medieval, early-modern, modern, political, social, military, economic, archaeological, and cultural history. Use at least eight of those subthemes and no more than 15 category sets from one subtheme. Every clue must be self-contained, have an original formulation, an answer/explanation, and a checked source URL; exactly 100 rows identify OpenTDB adaptation in `source_title`.

- [ ] **Step 3: Validate counts, tiers, uniqueness, sources, and difficulty**

Run:

```powershell
npm run content:validate -- --input content/authored/01-history.csv --mode batch --allow-missing-et --report content/reports/01-history.json
npm run content:source-check -- --input content/authored/01-history.csv
```

Expected: `100 sets, 500 clues, 50 R1, 50 R2, 100 OpenTDB-adapted`; no blocking issue or inaccessible source.

- [ ] **Step 4: Translate and resolve diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/01-history.csv --output content/generated/01-history.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/01-history.en-et.csv --report content/reports/01-history.json
npm run content:validate -- --input content/generated/01-history.en-et.csv --mode batch --report content/reports/01-history.json
```

Expected: 500 bilingual rows and no unresolved number, name, blank, or unchanged-text diagnostic.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/01-history.csv content/generated/01-history.en-et.csv content/reports/01-history.json
git commit -m "content(history): add 500 bilingual clues"
```

### Task 24: Author and translate the Geography batch

**Files:**
- Create: `content/authored/02-geography.csv`
- Create: `content/generated/02-geography.en-et.csv`
- Create: `content/reports/02-geography.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-geography`, 100 sets/500 bilingual clues with distribution E 17/17, M 16/17, H 17/16.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/02-geography.csv --mode batch --allow-missing-et --report content/reports/02-geography.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover countries/capitals, cities, physical geography, rivers/lakes, mountains, islands, borders, maps/coordinates, human geography, and landmarks. Use at least eight subthemes with no more than 15 sets in one. Create 500 original, sourced clues in the exact table distribution and mark exactly 100 OpenTDB adaptations in `source_title`.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/02-geography.csv --mode batch --allow-missing-et --report content/reports/02-geography.json
npm run content:source-check -- --input content/authored/02-geography.csv
```

Expected: 100 unique sets, 500 clues, 50/50 rounds, correct difficulty split, and no source failure.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/02-geography.csv --output content/generated/02-geography.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/02-geography.en-et.csv --report content/reports/02-geography.json
npm run content:validate -- --input content/generated/02-geography.en-et.csv --mode batch --report content/reports/02-geography.json
```

Expected: zero blocking or unresolved translation issue.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/02-geography.csv content/generated/02-geography.en-et.csv content/reports/02-geography.json
git commit -m "content(geography): add 500 bilingual clues"
```

### Task 25: Author and translate the Science and Nature batch

**Files:**
- Create: `content/authored/03-science-nature.csv`
- Create: `content/generated/03-science-nature.en-et.csv`
- Create: `content/reports/03-science-nature.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-science-nature`, 100 sets/500 bilingual clues with distribution E 17/17, M 17/16, H 16/17.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/03-science-nature.csv --mode batch --allow-missing-et --report content/reports/03-science-nature.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover physics, chemistry, astronomy, biology, medicine history, earth science, weather/climate, ecology, animals, and plants. Avoid personal medical advice and undated records. Use at least eight subthemes, no more than 15 sets per subtheme, the exact difficulty/round distribution, and exactly 100 sourced OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/03-science-nature.csv --mode batch --allow-missing-et --report content/reports/03-science-nature.json
npm run content:source-check -- --input content/authored/03-science-nature.csv
```

Expected: `100 sets, 500 clues`; formulas/units and source URLs validate.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/03-science-nature.csv --output content/generated/03-science-nature.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/03-science-nature.en-et.csv --report content/reports/03-science-nature.json
npm run content:validate -- --input content/generated/03-science-nature.en-et.csv --mode batch --report content/reports/03-science-nature.json
```

Expected: no number/unit drift and no blocking issue.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/03-science-nature.csv content/generated/03-science-nature.en-et.csv content/reports/03-science-nature.json
git commit -m "content(science): add 500 bilingual clues"
```

### Task 26: Author and translate the Literature and Language batch

**Files:**
- Create: `content/authored/04-literature-language.csv`
- Create: `content/generated/04-literature-language.en-et.csv`
- Create: `content/reports/04-literature-language.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-literature-language`, 100 sets/500 bilingual clues with distribution E 17/17, M 16/17, H 17/16.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/04-literature-language.csv --mode batch --allow-missing-et --report content/reports/04-literature-language.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover world literature, authors, novels, poetry, drama, literary movements, fictional characters, linguistics, etymology, and writing systems. Quote no more than a title or other short identifying fragment; paraphrase copyrighted plot text. Use at least eight subthemes, the exact allocation, and exactly 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/04-literature-language.csv --mode batch --allow-missing-et --report content/reports/04-literature-language.json
npm run content:source-check -- --input content/authored/04-literature-language.csv
```

Expected: all names/titles/source links and 500 clue rows validate.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/04-literature-language.csv --output content/generated/04-literature-language.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/04-literature-language.en-et.csv --report content/reports/04-literature-language.json
npm run content:validate -- --input content/generated/04-literature-language.en-et.csv --mode batch --report content/reports/04-literature-language.json
```

Expected: titles/proper names remain correct and no unresolved diagnostic remains.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/04-literature-language.csv content/generated/04-literature-language.en-et.csv content/reports/04-literature-language.json
git commit -m "content(literature): add 500 bilingual clues"
```

### Task 27: Author and translate the Art and Architecture batch

**Files:**
- Create: `content/authored/05-art-architecture.csv`
- Create: `content/generated/05-art-architecture.en-et.csv`
- Create: `content/reports/05-art-architecture.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-art-architecture`, 100 sets/500 bilingual clues with distribution E 17/16, M 17/17, H 16/17.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/05-art-architecture.csv --mode batch --allow-missing-et --report content/reports/05-art-architecture.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover painting, sculpture, photography history, design, artists, museums, architecture, buildings, movements, and materials/techniques. Use at least eight subthemes, no more than 15 sets per subtheme, the exact difficulty/round allocation, and exactly 100 sourced OpenTDB adaptations. Do not bundle artwork images in this batch.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/05-art-architecture.csv --mode batch --allow-missing-et --report content/reports/05-art-architecture.json
npm run content:source-check -- --input content/authored/05-art-architecture.csv
```

Expected: 100 unique sets and 500 valid source-backed rows.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/05-art-architecture.csv --output content/generated/05-art-architecture.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/05-art-architecture.en-et.csv --report content/reports/05-art-architecture.json
npm run content:validate -- --input content/generated/05-art-architecture.en-et.csv --mode batch --report content/reports/05-art-architecture.json
```

Expected: artwork/building titles and creator names survive translation; zero blocking issue.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/05-art-architecture.csv content/generated/05-art-architecture.en-et.csv content/reports/05-art-architecture.json
git commit -m "content(art): add 500 bilingual clues"
```

### Task 28: Author and translate the Music batch

**Files:**
- Create: `content/authored/06-music.csv`
- Create: `content/generated/06-music.en-et.csv`
- Create: `content/reports/06-music.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-music`, 100 sets/500 bilingual clues with distribution E 16/17, M 17/17, H 17/16.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/06-music.csv --mode batch --allow-missing-et --report content/reports/06-music.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover classical, jazz, rock, pop, folk/world music, composers, performers, albums, instruments, and music theory/history. Do not reproduce lyrics. Use at least eight subthemes, exact allocation, and exactly 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/06-music.csv --mode batch --allow-missing-et --report content/reports/06-music.json
npm run content:source-check -- --input content/authored/06-music.csv
```

Expected: 500 clues validate and the copyright scan finds no lyric excerpt.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/06-music.csv --output content/generated/06-music.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/06-music.en-et.csv --report content/reports/06-music.json
npm run content:validate -- --input content/generated/06-music.en-et.csv --mode batch --report content/reports/06-music.json
```

Expected: names/titles remain intact and no unresolved diagnostic remains.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/06-music.csv content/generated/06-music.en-et.csv content/reports/06-music.json
git commit -m "content(music): add 500 bilingual clues"
```

### Task 29: Author and translate the Film and Television batch

**Files:**
- Create: `content/authored/07-film-television.csv`
- Create: `content/generated/07-film-television.en-et.csv`
- Create: `content/reports/07-film-television.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-film-television`, 100 sets/500 bilingual clues with distribution E 17/16, M 17/17, H 16/17.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/07-film-television.csv --mode batch --allow-missing-et --report content/reports/07-film-television.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover world cinema, directors, actors, awards with explicit years, genres, animation, television history, series, production craft, and screen adaptations. Do not quote scripts or dialogue except non-copyrightable titles. Use at least eight subthemes, exact allocation, and 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/07-film-television.csv --mode batch --allow-missing-et --report content/reports/07-film-television.json
npm run content:source-check -- --input content/authored/07-film-television.csv
```

Expected: dates, titles, people, and 500 rows validate; no archived-show source appears.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/07-film-television.csv --output content/generated/07-film-television.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/07-film-television.en-et.csv --report content/reports/07-film-television.json
npm run content:validate -- --input content/generated/07-film-television.en-et.csv --mode batch --report content/reports/07-film-television.json
```

Expected: title/entity diagnostics are resolved and validation passes.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/07-film-television.csv content/generated/07-film-television.en-et.csv content/reports/07-film-television.json
git commit -m "content(screen): add 500 bilingual clues"
```

### Task 30: Author and translate the Sports and Games batch

**Files:**
- Create: `content/authored/08-sports-games.csv`
- Create: `content/generated/08-sports-games.en-et.csv`
- Create: `content/reports/08-sports-games.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-sports-games`, 100 sets/500 bilingual clues with distribution E 16/17, M 17/17, H 17/16.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/08-sports-games.csv --mode batch --allow-missing-et --report content/reports/08-sports-games.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover association football, basketball, athletics, winter sports, racket sports, motorsport, Olympics, traditional sports, board/card games, and video-game history. Every record/officeholder clue must name its date or event. Use at least eight subthemes, exact allocation, and 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/08-sports-games.csv --mode batch --allow-missing-et --report content/reports/08-sports-games.json
npm run content:source-check -- --input content/authored/08-sports-games.csv
```

Expected: time-sensitive scan passes because every changing fact is explicitly dated.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/08-sports-games.csv --output content/generated/08-sports-games.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/08-sports-games.en-et.csv --report content/reports/08-sports-games.json
npm run content:validate -- --input content/generated/08-sports-games.en-et.csv --mode batch --report content/reports/08-sports-games.json
```

Expected: score/year/team-name diagnostics are resolved; bilingual validation passes.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/08-sports-games.csv content/generated/08-sports-games.en-et.csv content/reports/08-sports-games.json
git commit -m "content(sports): add 500 bilingual clues"
```

### Task 31: Author and translate the Food and Drink batch

**Files:**
- Create: `content/authored/09-food-drink.csv`
- Create: `content/generated/09-food-drink.en-et.csv`
- Create: `content/reports/09-food-drink.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-food-drink`, 100 sets/500 bilingual clues with distribution E 17/16, M 16/17, H 17/17.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/09-food-drink.csv --mode batch --allow-missing-et --report content/reports/09-food-drink.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover world cuisines, ingredients, dishes, cooking techniques, baking, non-alcoholic drinks, wine/beer/spirits history, food geography, culinary figures, and food science. Avoid health claims. Use at least eight subthemes, exact allocation, and exactly 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/09-food-drink.csv --mode batch --allow-missing-et --report content/reports/09-food-drink.json
npm run content:source-check -- --input content/authored/09-food-drink.csv
```

Expected: 100 sets/500 clues and all quantities/origins/sources validate.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/09-food-drink.csv --output content/generated/09-food-drink.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/09-food-drink.en-et.csv --report content/reports/09-food-drink.json
npm run content:validate -- --input content/generated/09-food-drink.en-et.csv --mode batch --report content/reports/09-food-drink.json
```

Expected: units and proper food names are resolved; no blocking issue.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/09-food-drink.csv content/generated/09-food-drink.en-et.csv content/reports/09-food-drink.json
git commit -m "content(food): add 500 bilingual clues"
```

### Task 32: Author and translate the Technology and Inventions batch

**Files:**
- Create: `content/authored/10-technology-inventions.csv`
- Create: `content/generated/10-technology-inventions.en-et.csv`
- Create: `content/reports/10-technology-inventions.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-technology-inventions`, 100 sets/500 bilingual clues with distribution E 16/17, M 17/16, H 17/17.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/10-technology-inventions.csv --mode batch --allow-missing-et --report content/reports/10-technology-inventions.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover computing history, communications, transportation, engineering, materials, energy, space technology, inventors, standards/units, and everyday devices. Date all changing technology claims. Use at least eight subthemes, exact allocation, and exactly 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/10-technology-inventions.csv --mode batch --allow-missing-et --report content/reports/10-technology-inventions.json
npm run content:source-check -- --input content/authored/10-technology-inventions.csv
```

Expected: 500 source-backed clues; no undated changing fact.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/10-technology-inventions.csv --output content/generated/10-technology-inventions.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/10-technology-inventions.en-et.csv --report content/reports/10-technology-inventions.json
npm run content:validate -- --input content/generated/10-technology-inventions.en-et.csv --mode batch --report content/reports/10-technology-inventions.json
```

Expected: acronyms/numbers/names are resolved and validation passes.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/10-technology-inventions.csv content/generated/10-technology-inventions.en-et.csv content/reports/10-technology-inventions.json
git commit -m "content(technology): add 500 bilingual clues"
```

### Task 33: Author and translate the Politics, Economics, and Society batch

**Files:**
- Create: `content/authored/11-politics-economics-society.csv`
- Create: `content/generated/11-politics-economics-society.en-et.csv`
- Create: `content/reports/11-politics-economics-society.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-politics-economics-society`, 100 sets/500 bilingual clues with distribution E 17/16, M 16/17, H 17/17.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/11-politics-economics-society.csv --mode batch --allow-missing-et --report content/reports/11-politics-economics-society.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover political systems, constitutions, historical leaders with explicit dates, international institutions, economics vocabulary/history, currencies with dated context, law/courts, sociology, education, and demographics with census year. Remain neutral and factual. Use at least eight subthemes, exact allocation, and exactly 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/11-politics-economics-society.csv --mode batch --allow-missing-et --report content/reports/11-politics-economics-society.json
npm run content:source-check -- --input content/authored/11-politics-economics-society.csv
```

Expected: neutral-language and time-sensitive checks pass; 500 rows valid.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/11-politics-economics-society.csv --output content/generated/11-politics-economics-society.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/11-politics-economics-society.en-et.csv --report content/reports/11-politics-economics-society.json
npm run content:validate -- --input content/generated/11-politics-economics-society.en-et.csv --mode batch --report content/reports/11-politics-economics-society.json
```

Expected: institution names, dates, and numerical values are resolved; validation passes.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/11-politics-economics-society.csv content/generated/11-politics-economics-society.en-et.csv content/reports/11-politics-economics-society.json
git commit -m "content(society): add 500 bilingual clues"
```

### Task 34: Author and translate the Mythology, Religion, and Philosophy batch

**Files:**
- Create: `content/authored/12-mythology-religion-philosophy.csv`
- Create: `content/generated/12-mythology-religion-philosophy.en-et.csv`
- Create: `content/reports/12-mythology-religion-philosophy.json`

**Interfaces:**
- Consumes: content toolchain from Tasks 19–22.
- Produces: pack `built-in-mythology-religion-philosophy`, 100 sets/500 bilingual clues with distribution E 16/17, M 17/16, H 17/17.

- [ ] **Step 1: Prove the missing batch fails**

Run: `npm run content:validate -- --input content/authored/12-mythology-religion-philosophy.csv --mode batch --allow-missing-et --report content/reports/12-mythology-religion-philosophy.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English inventory**

Cover Greek/Roman, Norse, Egyptian, Baltic/Finnic, Asian, African, and American mythologies; world-religion history/texts/practices; ancient, early-modern, and modern philosophy. Use neutral attribution such as “In X tradition”; do not present belief claims as adjudicated fact. Use at least eight subthemes, exact allocation, and exactly 100 verified OpenTDB adaptations.

- [ ] **Step 3: Validate and source-check**

```powershell
npm run content:validate -- --input content/authored/12-mythology-religion-philosophy.csv --mode batch --allow-missing-et --report content/reports/12-mythology-religion-philosophy.json
npm run content:source-check -- --input content/authored/12-mythology-religion-philosophy.csv
```

Expected: neutral-language/source checks pass and all 500 rows validate.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/12-mythology-religion-philosophy.csv --output content/generated/12-mythology-religion-philosophy.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/12-mythology-religion-philosophy.en-et.csv --report content/reports/12-mythology-religion-philosophy.json
npm run content:validate -- --input content/generated/12-mythology-religion-philosophy.en-et.csv --mode batch --report content/reports/12-mythology-religion-philosophy.json
```

Expected: names and tradition qualifiers remain correct; no blocking issue.

- [ ] **Step 5: Commit**

```powershell
git add content/authored/12-mythology-religion-philosophy.csv content/generated/12-mythology-religion-philosophy.en-et.csv content/reports/12-mythology-religion-philosophy.json
git commit -m "content(culture): add 500 bilingual clues"
```

### Task 35: Author and translate 150 Final clues

**Files:**
- Create: `content/authored/13-finals.csv`
- Create: `content/generated/13-finals.en-et.csv`
- Create: `content/reports/13-finals.json`

**Interfaces:**
- Consumes: content toolchain and twelve topic packs.
- Produces: pack `built-in-finals` with exactly 150 bilingual Final/tiebreaker clues: 50 Easy, 50 Medium, 50 Hard.

- [ ] **Step 1: Prove the Final inventory gate is red**

Run: `npm run content:validate -- --input content/authored/13-finals.csv --mode batch --allow-missing-et --report content/reports/13-finals.json`

Expected: nonzero exit with `INPUT_NOT_FOUND`.

- [ ] **Step 2: Author the English Final inventory**

Create 12–13 Final clues for each of the twelve macro-topic families, totaling 150. Each clue has `content_kind=final`, `round=final`, an empty tier/category-set ID, a unique category name, one unambiguous canonical response, accepted variants where needed, explanation, source, and exact difficulty. Do not reuse any board clue wording or source fact.

- [ ] **Step 3: Validate and source-check English Finals**

```powershell
npm run content:validate -- --input content/authored/13-finals.csv --mode batch --allow-missing-et --report content/reports/13-finals.json
npm run content:source-check -- --input content/authored/13-finals.csv
```

Expected: `150 Finals; Easy 50; Medium 50; Hard 50`; no duplicate or inaccessible source.

- [ ] **Step 4: Translate and clear diagnostics**

```powershell
python scripts/content/translate_en_et.py --input content/authored/13-finals.csv --output content/generated/13-finals.en-et.csv --model Helsinki-NLP/opus-mt-en-et
npm run content:translation-diagnostics -- --input content/generated/13-finals.en-et.csv --report content/reports/13-finals.json
npm run content:validate -- --input content/generated/13-finals.en-et.csv --mode batch --report content/reports/13-finals.json
```

Expected: 150 bilingual Final records with no unresolved diagnostic.

- [ ] **Step 5: Verify repeated tiebreaker supply**

Run the board-selector test that requests ten consecutive tiebreaker clues at each difficulty.

Expected: 30 selected clues, no repeated ID, deterministic order for the same match seed.

- [ ] **Step 6: Commit**

```powershell
git add content/authored/13-finals.csv content/generated/13-finals.en-et.csv content/reports/13-finals.json tests/unit/game/boardSelector.test.ts
git commit -m "content(final): add 150 bilingual Final clues"
```

### Task 36: Build and verify the production seed database

**Files:**
- Create: `scripts/content/buildSeed.ts`
- Create: `scripts/content/verifySeed.ts`
- Create: `resources/content/seed.sqlite`
- Create: `content/reports/release-inventory.json`
- Modify: `package.json`
- Modify: `src/main/content/contentService.ts`
- Test: `tests/integration/content/productionSeed.test.ts`

**Interfaces:**
- Consumes: all `content/generated/*.en-et.csv`, database migrations, and release validator.
- Produces: immutable bundled `resources/content/seed.sqlite`, `npm run verify:content`, and production first-launch initialization.

- [ ] **Step 1: Write the failing production-seed test**

```ts
it('contains the approved release inventory', () => {
  const inventory = inspectSeed(seedPath);
  expect(inventory).toEqual(expect.objectContaining({
    boardClues: 6000, categorySets: 1200, finalClues: 150,
    easySets: 400, mediumSets: 400, hardSets: 400,
  }));
  expect(inventory.distinctCategoryNames).toBeGreaterThanOrEqual(600);
});
```

Add 300 match-selection trials—100 per difficulty—asserting valid 12-category boards, selected language completeness, no within-match name repeat, macro-topic maximum two per board, and unused deterministic tiebreakers.

- [ ] **Step 2: Run the test and observe failure**

Run: `npm run test:run -- tests/integration/content/productionSeed.test.ts`

Expected: FAIL because the production seed does not exist.

- [ ] **Step 3: Validate the full corpus before building**

Run:

```powershell
npm run content:validate -- --input "content/generated/*.en-et.csv" --mode release --report content/reports/release-inventory.json
npm run content:source-check -- --input "content/generated/*.en-et.csv"
```

Expected summary: `6,000 board clues; 1,200 sets; >=600 distinct names; 400 sets/difficulty; 200 sets/difficulty/round; 150 Finals; 50 Finals/difficulty; 1,200 OpenTDB-adapted clues`; zero blocking issue and zero unreviewed translation warning.

- [ ] **Step 4: Build the seed reproducibly**

Sort input by pack/category-set/tier/clue ID, create a new explicit temporary database, run migrations, import in one transaction, run `PRAGMA integrity_check`, then atomically replace only `resources/content/seed.sqlite`. Write the input SHA-256 manifest and database SHA-256 into `release-inventory.json`.

- [ ] **Step 5: Verify production selection and first-launch copy**

Run:

```powershell
npm run content:build-seed
npm run verify:content
npm run test:run -- tests/integration/content/productionSeed.test.ts
```

Expected: identical seed hash on two consecutive builds; all 300 selection trials and SQLite integrity checks pass.

- [ ] **Step 6: Commit**

```powershell
git add scripts/content resources/content/seed.sqlite content/reports/release-inventory.json package.json src/main/content/contentService.ts tests/integration/content/productionSeed.test.ts
git commit -m "feat(content): bundle verified production library"
```

## Milestone 4: Release hardening

### Task 37: Create original Classic Stage visual assets

**Files:**
- Create: `resources/media/logo.png`
- Create: `resources/media/classic-stage-background.png`
- Create: `resources/media/icon-source.png`
- Create: `resources/media/icon.ico`
- Create: `scripts/build-icon.ts`
- Modify: `resources/media/manifest.json`
- Modify: `package.json`
- Test: `tests/unit/media/imageAssets.test.ts`

**Interfaces:**
- Consumes: approved Classic Stage direction and media manifest.
- Produces: original replaceable raster assets and a multi-size Windows icon, with no official-show logo likeness.

- [ ] **Step 1: Write the failing image-asset test**

Assert exact minimum dimensions, PNG signatures, nonempty alpha/opaque pixels, ICO header, manifest keys, and SHA-256 matches. Run: `npm run test:run -- tests/unit/media/imageAssets.test.ts`.

Expected: FAIL because the assets are missing.

- [ ] **Step 2: Invoke the `imagegen` skill and generate original art**

Generate three separate assets:

```text
1. “Quiz Stage” original wordmark, deep cobalt and warm gold, transparent background, bold geometric game-show typography, no resemblance to any television logo, 2048×1024.
2. Abstract empty television quiz-stage background, deep blue illuminated panels, subtle gold rim lights, center kept quiet for text, no people, logos, letters, or numbers, 3840×2160.
3. Square original app emblem using a gold Q-shaped spotlight over a cobalt tile, no words and no television-show motifs, 1024×1024.
```

Save outputs to the exact PNG paths above and inspect them visually before proceeding.

- [ ] **Step 3: Build the Windows icon**

Run: `npm install --save-dev --save-exact png-to-ico@3.0.2`. Implement `build-icon.ts` to create `icon.ico` from 16, 24, 32, 48, 64, 128, and 256 pixel renders of `icon-source.png` without altering the source.

- [ ] **Step 4: Verify assets and manifest**

Run:

```powershell
npm run media:build-icon
npm run test:run -- tests/unit/media/imageAssets.test.ts
```

Expected: PASS; manual inspection confirms original branding, clear transparency, quiet text area, and legibility at 32×32.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json resources/media scripts/build-icon.ts tests/unit/media/imageAssets.test.ts
git commit -m "feat(branding): add original Classic Stage assets"
```

### Task 38: Apply final Classic Stage presentation and motion

**Files:**
- Modify: `src/renderer/styles/tokens.css`
- Modify: `src/renderer/styles/global.css`
- Modify: `src/renderer/styles/game.css`
- Modify: `src/renderer/features/home/HomeScreen.tsx`
- Modify: `src/renderer/features/setup/SetupScreen.tsx`
- Modify: `src/renderer/features/game/GameSurface.tsx`
- Modify: `src/renderer/features/game/PublicBoard.tsx`
- Modify: `src/renderer/features/game/PublicClue.tsx`
- Modify: `src/renderer/features/game/PublicFinal.tsx`
- Modify: `src/renderer/features/game/HostConsole.tsx`
- Modify: `src/renderer/features/game/HostTeamControls.tsx`
- Modify: `tests/visual/game-layout.spec.ts`
- Create: `tests/visual/classic-stage.spec.ts`

**Interfaces:**
- Consumes: final media, all public/host screens, reduced-motion settings.
- Produces: polished Classic Stage UI with deterministic transitions and stable screenshot baselines.

- [ ] **Step 1: Capture failing visual expectations**

Add screenshots for Home, 6×5 board, ordinary clue, Daily Double, Final category, Final clue, winner, and 8-team host console at 720p, 1080p, and 4K. Assert gold/blue token use, no overflow, and public clue text contrast of at least 4.5:1.

- [ ] **Step 2: Run visual tests and observe mismatch**

Run: `npx playwright test tests/visual/classic-stage.spec.ts tests/visual/game-layout.spec.ts`

Expected: FAIL against the approved visual structure before final styling.

- [ ] **Step 3: Implement final styles and reduced-motion equivalents**

Use the generated background beneath a dark readability overlay, gold score values, cobalt tiles, and font stacks bundled with the OS. Limit transitions to opacity/transform; reduced-motion mode replaces them with immediate state changes. Do not animate score values in a way that delays authoritative display.

- [ ] **Step 4: Review and accept baselines**

Run the visual suite, inspect every new image at original size, update baselines only after confirming no clipping, stale host controls, answer leakage, or unreadable 8-team scores.

Expected: all approved screenshots pass at all target resolutions.

- [ ] **Step 5: Commit**

```powershell
git add src/renderer resources/media tests/visual
git commit -m "feat(ui): apply final Classic Stage presentation"
```

### Task 39: Harden Electron security and local diagnostics

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `forge.config.ts`
- Modify: `src/main/main.ts`
- Modify: `src/main/ipc/registerIpc.ts`
- Modify: `src/main/ipc/validateSender.ts`
- Create: `src/main/diagnostics/localLogger.ts`
- Create: `src/main/security/contentPolicy.ts`
- Test: `tests/integration/security/electronHardening.test.ts`
- Test: `tests/integration/security/ipcFuzz.test.ts`

**Interfaces:**
- Consumes: all windows/IPC and application data path.
- Produces: hardened fuses, packaged custom protocol/CSP, rotating local logs, and a diagnostic export requiring explicit user action.

- [ ] **Step 1: Install pinned hardening/log dependencies**

Run:

```powershell
npm install --save-exact electron-log@5.4.4
npm install --save-dev --save-exact @electron/fuses@2.1.3 @electron-forge/plugin-fuses@7.11.2
```

- [ ] **Step 2: Write failing security tests**

Assert renderer sandbox/context isolation/web security, blocked navigation/new windows, restrictive CSP, host-sender validation, rejection of malformed/oversized IPC, absence of secrets/full clue text in logs, no listening socket or network-server dependency, and these production fuses: `RunAsNode=false`, `EnableNodeOptionsEnvironmentVariable=false`, `EnableNodeCliInspectArguments=false`, `EnableEmbeddedAsarIntegrityValidation=true`, `OnlyLoadAppFromAsar=true`.

- [ ] **Step 3: Run tests and observe failure**

Run: `npm run test:run -- tests/integration/security/electronHardening.test.ts tests/integration/security/ipcFuzz.test.ts`

Expected: FAIL until fuses, CSP, protocol, logging, and payload limits are complete.

- [ ] **Step 4: Implement hardening and diagnostics**

Package renderer assets in ASAR, register a privileged local `app://` protocol before ready, disallow external navigation, and validate sender plus Zod payload for every handler. Rotate three 1 MiB local log files; log clue IDs rather than content. Diagnostic export copies logs/schema/app version only after a save dialog.

- [ ] **Step 5: Verify packaged security**

Run:

```powershell
npm run test:run -- tests/integration/security
npx electron-forge package --platform win32 --arch x64
npm run security:inspect-package
```

Expected: tests pass; fuse inspection matches the required values; packaged renderer contains no `http://` or `https://` runtime dependency.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json forge.config.ts src/main tests/integration/security
git commit -m "security: harden Electron runtime and diagnostics"
```

### Task 40: Complete the full gameplay and regression E2E matrix

**Files:**
- Create: `tests/e2e/full-matrix.spec.ts`
- Create: `tests/e2e/edge-cases.spec.ts`
- Create: `tests/e2e/media-fallback.spec.ts`
- Create: `tests/e2e/display-modes.spec.ts`
- Create: `tests/e2e/helpers/fastMatch.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: complete product and production seed.
- Produces: deterministic 24-combination full-match matrix plus focused recovery/error scenarios.

- [ ] **Step 1: Write the parameterized full-match matrix**

Generate all combinations of `{teams: 2|8} × {difficulty: easy|medium|hard} × {language: en|et} × {display: single|dual}`. Use a test clock and direct host actions so timers do not add wall-clock delay. Every case must complete 60 board clues, Daily Doubles, Final, and winner persistence.

- [ ] **Step 2: Add focused edge scenarios**

Cover all teams nonpositive before Final, ten successive tiebreakers, all teams incorrect on one clue, timer expiration, invalid wager boundaries, score adjustment reason, undo after correct/incorrect, public display removal/reconnect, corrupt override audio, missing media, bad clue report, and migration recovery.

- [ ] **Step 3: Run the new regression files**

Run: `npx playwright test tests/e2e/full-matrix.spec.ts tests/e2e/edge-cases.spec.ts tests/e2e/media-fallback.spec.ts tests/e2e/display-modes.spec.ts`

Expected: all cases pass. If a case fails, preserve its reported phase/seed, fix only that demonstrated gap, rerun the case, then rerun all four files.

- [ ] **Step 4: Run the full E2E and visual suite**

Run: `npx playwright test`

Expected: all 24 full matches and focused scenarios pass with zero unexpected request, page error, console error, or screenshot mismatch.

- [ ] **Step 5: Commit**

```powershell
git add src tests/e2e tests/visual playwright.config.ts
git commit -m "test(e2e): cover complete bilingual match matrix"
```

### Task 41: Produce separate installer and true portable packages

**Files:**
- Modify: `forge.config.ts`
- Modify: `package.json`
- Modify: `src/main/main.ts`
- Create: `src/main/persistence/userDataPath.ts`
- Create: `scripts/make-portable.ts`
- Create: `docs/portable-upgrades.md`
- Test: `tests/unit/persistence/userDataPath.test.ts`
- Test: `tests/integration/packaging/packageContents.test.ts`

**Interfaces:**
- Consumes: Forge makers, production seed, icon, migrations, media paths.
- Produces: `out/make/installer/QuizStageSetup.exe` and `out/make/portable/QuizStage-win32-x64.zip` with distinct data-path behavior.

- [ ] **Step 1: Write failing path/package tests**

Test installed mode uses Electron’s per-user application data; portable mode detects only `process.resourcesPath/portable.flag` and uses `<exe-directory>/UserData`. Verify portable startup returns `PORTABLE_DATA_NOT_WRITABLE` before database creation when the directory is read-only.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm run test:run -- tests/unit/persistence/userDataPath.test.ts tests/integration/packaging/packageContents.test.ts`

Expected: FAIL because portable detection/build split does not exist.

- [ ] **Step 3: Implement two explicit Forge build profiles**

`make:installer` enables only Squirrel and excludes `portable.flag`. `make:portable` packages to a temporary explicit staging directory, adds `resources/portable.flag` and empty `UserData`, then runs the ZIP maker. Never mutate the installer package. Set the application icon/product name and include `seed.sqlite` plus media manifest in both.

- [ ] **Step 4: Build and inspect both packages**

Run:

```powershell
npm run make:installer
npm run make:portable
npm run test:run -- tests/integration/packaging/packageContents.test.ts
```

Expected: Setup `.exe` has no portable marker; ZIP has marker/UserData; each contains one application `.exe`, seed database, manifest, ASAR, and native SQLite binary.

- [ ] **Step 5: Verify upgrade documentation**

Document exact portable upgrade steps: close app, extract new ZIP to a new writable directory, copy previous `UserData` into it, launch, confirm automatic backup/migration, retain old directory until verified.

- [ ] **Step 6: Commit**

```powershell
git add forge.config.ts package.json src/main scripts/make-portable.ts docs/portable-upgrades.md tests/unit/persistence/userDataPath.test.ts tests/integration/packaging/packageContents.test.ts
git commit -m "build: package installer and portable Windows releases"
```

### Task 42: Add Windows CI, release artifacts, offline smoke, and upgrade tests

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`
- Create: `scripts/smoke-package.ps1`
- Create: `scripts/verify-upgrade.ps1`
- Create: `scripts/create-upgrade-fixture.ts`
- Create: `tests/e2e/package-smoke.spec.ts`
- Create: `tests/fixtures/previous-version/UserData/quiz-stage.sqlite`
- Create: `tests/fixtures/previous-version/UserData/media/logo.png`
- Modify: `package.json`

**Interfaces:**
- Consumes: `verify:product`, `verify:content`, E2E, and both packages.
- Produces: Windows CI gate, manually triggered/tag release artifacts with SHA-256, and `npm run verify:release`.

- [ ] **Step 1: Write failing local smoke and upgrade fixtures**

`create-upgrade-fixture.ts` must build the previous schema version with one custom pack, one report, non-default settings, one completed history entry, one incomplete autosave, and a logo override. `smoke-package.ps1` must launch the portable app with a temporary copied `UserData`, assert no external request, create/complete a two-team match through Playwright’s packaged-Electron driver, and verify history. Installer smoke performs silent per-user install, launch, the same check, then uninstall. `verify-upgrade.ps1` checks every fixture record survives migration.

- [ ] **Step 2: Run scripts before workflow implementation**

Run:

```powershell
pwsh -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Portable
pwsh -File scripts/verify-upgrade.ps1 -PackageRoot out/make
```

Expected: both scripts exit 0 against the Task 41 packages; portable/upgrade checks use temporary copied data and leave the committed fixture unchanged.

- [ ] **Step 3: Implement CI workflow**

On `windows-latest`, use Node 24.15.0, `npm ci`, cached Playwright browsers and translation model only where required, then run lint, typecheck, unit/integration tests, production content validation, build, and E2E. Upload test reports on failure.

- [ ] **Step 4: Implement release workflow**

On manual dispatch and `v*` tags, run the entire CI gate, make installer/portable packages, run both smoke modes and upgrade verification, calculate SHA-256 files, and upload unsigned artifacts. Do not publish or auto-update.

- [ ] **Step 5: Verify workflows locally where possible**

Run:

```powershell
npm run verify:release
pwsh -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both
pwsh -File scripts/verify-upgrade.ps1 -PackageRoot out/make
```

Expected: all commands exit 0, create no persistent test install, and leave package artifacts plus checksums.

- [ ] **Step 6: Commit**

```powershell
git add .github/workflows scripts/smoke-package.ps1 scripts/verify-upgrade.ps1 tests/fixtures/previous-version package.json
git commit -m "ci: verify and package Windows releases"
```

### Task 43: Execute and record final acceptance

**Files:**
- Create: `docs/release-acceptance.md`
- Create: `docs/known-limitations.md`
- Create: `README.md`

**Interfaces:**
- Consumes: all code, content, tests, packages, and the approved design.
- Produces: verified release evidence and user-facing run/host/import/upgrade instructions.

- [ ] **Step 1: Write the acceptance checklist from the spec**

The checklist must enumerate every Product Goal, Non-goal, gameplay rule, inventory threshold, language/display mode, host recovery control, security constraint, package, resolution, and upgrade-preservation item. Link each item to its automated test or manual evidence command.

- [ ] **Step 2: Run the complete clean-checkout gate**

Run:

```powershell
npm ci
npm run verify:release
git diff --check
```

Expected: exit 0; no skipped blocking test; content report shows the exact release thresholds.

- [ ] **Step 3: Perform user-facing manual verification**

On Windows 10 and 11 x64, verify fresh installer install/launch/uninstall and portable extract/launch; play one complete match offline; inspect public display at 1280×720, 1920×1080, 3840×2160 with 2 and 8 teams; verify keyboard-only and reduced-motion operation; confirm SmartScreen expectation for unsigned builds.

- [ ] **Step 4: Record exact evidence and limitations**

Write command timestamps, test counts, package filenames/SHA-256, content counts, tested Windows builds, screenshots, and pass/fail status in `release-acceptance.md`. `known-limitations.md` must list deferred phone buzzers, online play/accounts, speech judging, auto-updates, official assets, ARM64, and 32-bit builds.

- [ ] **Step 5: Re-run only the final gate after documentation changes**

Run:

```powershell
npm run lint
npm run typecheck
npm run test:run
npm run verify:content
git diff --check
```

Expected: all commands exit 0 and the worktree contains only intended documentation changes.

- [ ] **Step 6: Commit**

```powershell
git add README.md docs/release-acceptance.md docs/known-limitations.md
git commit -m "docs: record verified Quiz Stage release"
```

## Spec coverage self-review

| Design section | Implemented and verified by |
|---|---|
| 1. Purpose | Tasks 1, 10, 37, 41, 43 |
| 2. Product goals | Tasks 3–18, 23–43 |
| 3. Non-goals | Tasks 2, 20–22, 37, 39, 43 |
| 4. Technology/process boundaries | Tasks 1, 6, 8, 39 |
| 5. Application modules | Tasks 2–8, 11–17 |
| 6. Match setup | Tasks 7, 9, 15, 17 |
| 7. Board selection | Tasks 5, 7, 35, 36 |
| 8. Gameplay rules | Tasks 3, 4, 10, 40 |
| 9. Host controls/recovery | Tasks 4, 10, 11, 17, 40 |
| 10. Public/host display | Tasks 8, 10, 17, 38, 40 |
| 11. Audio/media | Tasks 16, 37, 38, 40 |
| 12. Content library | Tasks 7, 12–15, 19–36 |
| 13. Persistence/files | Tasks 6, 11, 12, 36, 41, 42 |
| 14. Error handling | Tasks 4–8, 11–14, 16–18, 39, 40 |
| 15. Security/privacy | Tasks 8, 18, 39, 40, 42 |
| 16. Packaging/upgrades | Tasks 37, 39, 41, 42 |
| 17. Verification strategy | Tasks 1–43, especially 18, 36, 40, 42, 43 |
| 18. Future buzzer extension | Tasks 2, 8, 39; interface only, no network runtime |
| 19. Approved additions | Tasks 5, 11–17, 37–40 |
| 20. References | Tasks 1, 20–22, 39, 41 |

Self-review result: all approved requirements map to implementation and verification tasks. No first-release task adds a deferred network, account, speech, auto-update, official-asset, ARM64, or 32-bit feature.

## Execution completion condition

The project is complete only when Task 43’s fresh evidence is recorded and both packaged artifacts can complete a full offline match. Source edits, a successful development build, or a partially populated content library do not satisfy completion.
