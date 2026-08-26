# Known limitations

The first release intentionally defers these items:

- Phone buzzers or other networked controllers.
- Online play, user accounts, cloud synchronization, telemetry, advertisements, or runtime content downloads.
- Automatic speech recognition and automatic answer judging.
- Automatic application updates.
- Official television branding, archived clues from shows, recordings, or other show content.
- Windows ARM64 and 32-bit Windows packages.
- macOS and Linux support.
- Persistent team profiles and all-time leaderboard features beyond match history.

Release-specific limitations:

- The installer and portable executable are unsigned personal-use builds. Windows SmartScreen may warn on first launch.
- Final package acceptance was performed on Windows 11 x64. The separate Windows 10 x64 install, portable, offline-match, and uninstall pass required by the release plan remains unexecuted.
- The shipped/runtime dependency audit is clean. The full development dependency tree has 28 advisories in Electron Forge packaging tooling (3 low, 24 high, 1 critical) with no nonbreaking upgrade available at this baseline.

These items may be considered in future versions after release validation.
