# Portable Upgrade Guide

Windows portable releases write user data in `<extracted executable>/UserData` and rely on an adjacent
`resources/portable.flag` marker to switch from per-user data mode.

## Upgrade procedure

1. Close the running portable app.
2. Extract the new `QuizStage-win32-x64.zip` package into a new temporary folder.
3. Copy the previous `UserData` directory from the old package location into the new package folder:
   - `<old-package>/UserData` → `<new-package>/UserData`
4. Launch the new app once.
5. Verify automatic migration by opening history and checking:
   - existing completed matches are present,
   - incomplete autosave remains accessible,
   - custom packs/custom content overrides still load.
6. Keep the old folder untouched until migration is verified.

If verification fails, restore the old folder and retry from a clean extract.

## macOS and Linux ZIP upgrades

macOS and Linux ZIPs keep user data in Electron's standard per-user location outside the extracted application. Replace the extracted application files to upgrade; no data migration is needed. These ZIPs do not use an adjacent `UserData` directory or `portable.flag` marker.
