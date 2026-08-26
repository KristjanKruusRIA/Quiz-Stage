# Personal audio replacements

Quiz Stage ships with eight licensed audio clips sourced from Freesound and converted to normalized 16-bit PCM WAV files. Source, creator, license, download, and conversion details are recorded with each entry in `resources/media/manifest.json` and summarized in the packaged `resources/media/THIRD_PARTY_NOTICES.md`. No audio from the Jeopardy television production is included.

You may replace a bundled clip with a legally obtained personal-use WAV file. Replacements are optional and are never downloaded by the application.

## Override folder

- Installed build: open the Quiz Stage per-user data folder and create `media` inside it.
- Portable build: create `UserData/media` beside `Quiz Stage.exe`. The portable package includes the
  `resources/portable.flag` marker that makes the app use this adjacent data directory.
- Development: use the Electron user-data folder's `media` directory.

Do not place replacement files inside the application installation or `app.asar`; upgrades may replace those files.

## Supported files

Only PCM RIFF/WAVE files with a `.wav` extension are accepted. Mono or stereo, 16-bit PCM, and sample rates from 8,000 through 192,000 Hz are supported. Each file must be at most 10 MiB.

Use any subset of these exact base names:

| File | Purpose | Bundled duration |
| --- | --- | ---: |
| `opening.wav` | Match opening | 8.022 s |
| `round-transition.wav` | Round transition | 1.995 s |
| `daily-double.wav` | Daily Double reveal | 3.833 s |
| `final-tension.wav` | Final countdown bed | 59.726 s |
| `correct-applause.wav` | Correct response | 4.310 s |
| `incorrect-crowd.wav` | Incorrect response | 2.113 s |
| `time-expired.wav` | Timer expiration | 1.530 s |
| `winner.wav` | Winner celebration | 3.381 s |

Extension matching is case-insensitive. Symlinks, hard links, directories, files outside the owned override folder, malformed headers, and oversized or unreadable files are rejected. Each key is resolved independently: an invalid replacement affects only that sound, falls back to the bundled audio, and produces one nonblocking host warning. The warning never displays a local path or operating-system error. Replacing the bad file with a valid WAV recovers that key.

`resources/media/manifest.json` records each bundled filename, channel, duration, MIME type, SHA-256 hash, source preview hash, attribution, and license. The licensed WAV files are checked in directly; replacing one requires updating its measured metadata and provenance in the manifest.
