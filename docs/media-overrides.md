# Personal audio replacements

Quiz Stage ships with eight original synthesized placeholder sounds. They contain generated tones and filtered noise only; no television-show recordings, music, branding, or other third-party media is included.

You may replace a placeholder with a legally obtained personal-use WAV file. Replacements are optional and are never downloaded by the application.

## Override folder

- Installed build: open the Quiz Stage per-user data folder and create `media` inside it.
- Portable build: once the portable marker is added by the deferred Task 41 packaging work, create `UserData/media`
  beside `Quiz Stage.exe`. Task 16 recognizes that marker but does not invent or ship it; without the marker, the
  current package intentionally continues to use the installed-build per-user data folder.
- Development: use the Electron user-data folder's `media` directory.

Do not place replacement files inside the application installation or `app.asar`; upgrades may replace those files.

## Supported files

Only PCM RIFF/WAVE files with a `.wav` extension are accepted. Mono or stereo, 16-bit PCM, and sample rates from 8,000 through 192,000 Hz are supported. Each file must be at most 10 MiB.

Use any subset of these exact base names:

| File | Purpose | Bundled duration |
| --- | --- | ---: |
| `opening.wav` | Match opening | 2.5 s |
| `round-transition.wav` | Round transition | 1.8 s |
| `daily-double.wav` | Daily Double reveal | 0.9 s |
| `final-tension.wav` | Final countdown bed | 5.0 s |
| `correct-applause.wav` | Correct response | 1.8 s |
| `incorrect-crowd.wav` | Incorrect response | 1.4 s |
| `time-expired.wav` | Timer expiration | 0.6 s |
| `winner.wav` | Winner celebration | 2.5 s |

Extension matching is case-insensitive. Symlinks, hard links, directories, files outside the owned override folder, malformed headers, and oversized or unreadable files are rejected. Each key is resolved independently: an invalid replacement affects only that sound, falls back to the bundled placeholder, and produces one nonblocking host warning. The warning never displays a local path or operating-system error. Replacing the bad file with a valid WAV recovers that key.

`resources/media/manifest.json` records the bundled filename, channel, duration, MIME type, and SHA-256 hash for every placeholder. Run `npm run media:generate` to reproduce all eight binary files and the manifest exactly; do not hand-edit the generated WAV files.
