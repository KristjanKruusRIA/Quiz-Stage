# Task 16 report: original placeholder audio and host settings

## Status

Implemented eight original, deterministic synthesized WAV placeholders; a hash-verified media manifest; persistent
host audio settings; English and Estonian Settings UI; host-only mute and media warnings; safe independent personal
WAV overrides; and nonblocking game-phase audio. No recorded, branded, downloaded, or copyrighted media was added.

## Media and security contract

- `npm run media:generate` synthesizes exactly eight mono 44.1 kHz, 16-bit PCM RIFF/WAVE files from fixed numeric
  parameters. The checked-in manifest contains the exact allowlisted key, relative filename, `audio/wav` MIME type,
  SHA-256, duration, and channel for each file.
- The renderer requests only allowlisted keys through `quiz-stage-media://asset/<key>`. The main process parses the
  exact URL shape, resolves the bytes itself, and returns `200` or byte-range `206` responses. Neither preload surface
  exposes a filesystem API or path, and the public preload has no settings or warning methods.
- Overrides live only in the main-owned user-data media directory (or the future portable marker's adjacent
  `UserData/media` directory). Keys resolve independently. Extension, canonical containment, basename, regular-file,
  symlink/hard-link, open-descriptor identity, size, readability, RIFF/PCM header, channel, sample-rate, bit-depth, and
  data-length checks fail closed to the bundled hash-verified asset.
- Invalid overrides produce one deduplicated structured host warning per key. Recovery clears that warning state.
  Renderer-visible warnings contain only the allowlisted key and reason; raw paths and operating-system errors never
  cross IPC or render publicly.
- CSP permits only the local custom media scheme and retains the runtime network prohibition.

Personal replacement locations, exact filenames/formats, validation/fallback behavior, and legal-use guidance are
documented in `docs/media-overrides.md`.

## Settings and playback contract

- `AudioSettings` is a strict five-field schema: master, music, effects, crowd, and muted. Finite input volumes are
  clamped to `[0, 1]` in the main-owned repository and persisted in the existing SQLite settings table. Unknown fields,
  `NaN`, and malformed stored values fail closed. Effective gain is `master * channel`; mute outputs zero without
  changing remembered volumes.
- The localized, accessible Settings route replaces the former disabled Home placeholder. Four labelled sliders expose
  percentage outputs, and a labelled checkbox controls mute. The `M` shortcut ignores editable controls and removes its
  global listener on unmount.
- Game audio derives only from monotonic authoritative host-view transitions. Bootstrap, resume, same/stale revisions,
  another match, undo, and manual score corrections do not replay effects. Daily Double, round transition, Final
  tension, correct, incorrect, timer expiry, and winner transitions map to their exact keys.
- Audio commands never await playback. Autoplay rejection becomes a sanitized host-only warning. Music stops when Final
  ends, effects duck active music temporarily, and audio objects, ended listeners, and timers are released on failure,
  completion, stop, and unmount.

## TDD and systematic debugging evidence

Initial focused RED introduced six missing-module suites covering generation, contracts, service validation, paths,
persistence, UI, and game mapping. The first focused GREEN was 6 files / 17 tests. IPC/protocol/Home integration was
then driven through a second RED/GREEN cycle.

Two runtime regressions were isolated with focused evidence:

1. Development E2E packaged media correctly but the dev resolver used the generated Vite directory. Pointing the dev
   path at the repository `resources/media` directory restored both content and core-match flows.
2. `fetch()` returned valid RIFF bytes through the custom protocol, while a real Chromium `Audio` element reported an
   infinite duration. RED byte-range tests reproduced the missing HTTP semantics; adding strict single-range parsing,
   `Content-Length`, `Accept-Ranges`, and `Content-Range` made the audio element report the expected 2.5 seconds.

The final React/lifecycle review added a RED cleanup assertion for rejected playback. Tracking and explicitly releasing
ended listeners made the focused test green and moved live settings mutation out of render into an effect.

## Verification

```text
npm run test
Test Files 60 passed (60)
Tests 428 passed (428)

npm run lint
exit 0

npm run typecheck
exit 0

npx playwright test --workers=1
5 passed (2.3m)

Final audio + complete-game Electron rerun
2 passed (1.0m)

npm run build
Electron Forge package win32/x64; exit 0

npm run make:portable
Electron Forge ZIP win32/x64; exit 0
```

The five Electron flows cover persistent audio settings across restart, malformed-override fallback and host warning,
pathless custom-protocol fetch, real audio metadata/playback URL, the complete 60-clue game with Daily Doubles/Final/
winner, bilingual content lifecycle, Estonian dual-window privacy, and interrupted-match resume. All remain offline.

Two consecutive generator runs changed none of the nine generated files (eight WAV files plus manifest). Unit tests also
verify byte-identical output, SHA-256 values, exact key set, RIFF/PCM fields, duration-derived data sizes, and signed
16-bit sample bounds.

## Packaged artifacts

- Portable ZIP: `quiz-stage-desktop-game-win32-x64-0.1.0.zip`, 157,095,666 bytes, SHA-256
  `DE86C2221BECDAEF55B529F1C6DE696D5719F968AFCFDF93998EA3DCA53C52F0`.
- Packaged executable: 225,442,304 bytes, SHA-256
  `EB9AA43E9A7C3713FDC6929F5C646E7036E006C0232520B823CA7F6864EC1D7B`.
- Package inspection found `resources/app.asar`, the manifest, and all eight WAV files in both the packaged directory
  and ZIP. Every packaged WAV hash matches the manifest (`8` checked, `0` failures).

The optional Squirrel installer maker was also probed. Packaging succeeded, but the maker rejected the repository's
pre-existing empty `package.json` author field (`Authors is required`). No product-author identity was invented for this
audio task. The required packaged application and portable ZIP both complete successfully.

## React review

Static field definitions remain module-level, host-only state stays above the route boundary, and the public surface is
unchanged. Effects own subscriptions, live audio mutation, and cleanup; transient warning callbacks use a current ref;
async persistence remains nonblocking; controls retain native labels and values. No runtime dependency was added.
