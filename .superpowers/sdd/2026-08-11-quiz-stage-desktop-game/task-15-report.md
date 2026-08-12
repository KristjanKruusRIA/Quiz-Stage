# Task 15 report: complete English and Estonian interface localization

## Status

Implemented complete English/Estonian localization for every currently reachable host and public route, state, phase,
control, status, shortcut hint, error, and accessible name. The existing disabled Settings control is localized on Home;
there is no reachable `SettingsScreen` in the current application, so this task does not invent the later settings
workflow.

## Localization contract

- `en.ts` is the canonical literal dictionary. `et.ts` must satisfy the exact English key shape at compile time.
- Interpolated keys infer their exact parameter names from the English literal. Callers must provide only string or
  number values; missing, extra, or invalid runtime parameters fail with `I18N_PARAMS_MISMATCH`.
- English and Estonian placeholder sets are checked when the module loads. Interpolation returns plain strings and all
  renderer use flows through normal React text nodes, so translated or authored content is never HTML-interpreted.
- Plurals use an explicit `count === 1` convention. Numbers use deterministic `en-GB` / `et-EE` formatting and dates
  use the same locales with an explicit UTC timezone.
- Locale is instance-scoped through a memoized React context. Host setup/live/history routes and the public window can
  derive their own locale without global mutable state or cross-window/test leakage.

## Content and privacy contract

- Localized content selection fails closed with `LOCALIZED_CONTENT_MISSING`; it never silently falls back to English.
- `PublicGameView` adds only the selected match language and continues to expose scalar selected-language fields. It
  has no bilingual object or English-original field, and its strict Zod schema rejects contract widening.
- In an Estonian match, the host projects the English comparison from its private authoritative `HostGameView` only.
  The public window receives Estonian category, prompt, revealed response, explanation, accepted responses, and source
  fields only. Before reveal, its response/explanation/accepted-response fields remain absent.
- Authored team/user/category/proper names and content are preserved. The content editor intentionally keeps explicit
  bilingual field labels because both language records are being authored.
- Import validation ignores raw main/process exception text and maps structured issue codes to safe localized messages;
  unknown codes render a sanitized code and generic localized explanation.

## Reachable UI coverage

Localized Home, New Match/team setup and language switching, content availability shortages, Content Library pack and
report states, category/Final editors, import preview and validation rows, board/clue/Daily Double/Final/tiebreaker/
complete host and public phases, timers, score/status controls, history, resume/recovery notice, empty/loading/error
states, disabled Settings placeholder, buttons, aria labels, and shortcut help.

The route/phase matrix renders both languages and rejects raw translation keys or empty aria labels. Estonian route
tests additionally cover structured setup shortages, editor bilingual labels, deterministic history values, safe
import errors, host comparison, and public projection privacy.

## TDD and debugging evidence

Initial RED:

```text
npm run test:run -- tests/unit/renderer/i18n.test.tsx tests/unit/content/languageEligibility.test.ts
FAIL: renderer i18n and localized-content selector modules did not exist
```

Focused GREEN after implementation:

```text
Test Files 2 passed (2)
Tests 16 passed (16)
```

The full Electron run initially found one stale accessible-name contract: the localized content edit button had been
shortened from `Edit category set {category}` to `Edit {category}`. The screenshot showed the correct imported record,
isolating the failure to its accessible text. Restoring the descriptive EN/ET wording made the exact content lifecycle
spec pass, followed by a clean full four-spec run.

## Verification

```text
npm run test:run
Test Files 52 passed (52)
Tests 391 passed (391)

npm run lint
exit 0

npm run typecheck
exit 0

npx playwright test --workers=1
4 passed (2.1m)

npm run build
Electron Forge package win32/x64; exit 0

npm run make:portable
ZIP maker win32/x64; exit 0
```

The Electron suite verifies the complete 60-clue English fixture match, bilingual content create/export/delete/import/
report/correct/play lifecycle, interrupted-match resume and history persistence, and an Estonian dual-window setup to
live clue. The Estonian flow proves the host can see the English comparison while the public window contains neither
the English prompt/response nor any pre-reveal response. All flows remain offline.

## React review

Components and static field maps remain module-level. Translation and localized-content values are derived during
render without effects. Context state is memoized, locale ownership stays per renderer instance, async bridge behavior
remains at existing boundaries, and no new third-party runtime dependency was added.

## Artifacts

- Portable ZIP: `quiz-stage-desktop-game-win32-x64-0.1.0.zip`, 155,762,096 bytes, SHA-256
  `9CA7F667BA8C0E77F56AC8820623FC4B0EB53995F8D054B9959E5EDCF2405D38`.
- Packaged executable: 225,442,304 bytes, SHA-256
  `31B178D13C244653DDDFD9F58FEBBE03C25D9736B7D25234BB1D18F1A5A0A231`.
- Packaged seed: 196,608 bytes, SHA-256
  `C09CF55C4813771E70D6EC1A3A2E2CBB3E834383A4A313222314DF889AAA815C`; SQLite
  `integrity_check=ok`; schema 2; 1 pack, 39 category sets, 183 clues.
- ZIP inspection confirms the executable, `resources/app.asar`, `resources/dev-seed.sqlite`, and the
  `better-sqlite3` win32-x64 native prebuild.
