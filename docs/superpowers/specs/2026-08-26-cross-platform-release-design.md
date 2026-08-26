# Quiz Stage macOS and Ubuntu release design

## Goal

Extend the accepted Windows x64 release so Quiz Stage also ships as executable, offline desktop packages for macOS and Ubuntu without changing gameplay, content, persistence semantics, or the existing Windows artifacts.

The release must be proven from packaged applications running on their native operating systems. A successful Forge build by itself is not acceptance.

## Supported targets

| Platform | Architecture | Artifacts | Installation model |
|---|---|---|---|
| Windows | x64 | Existing Squirrel installer and portable ZIP | Existing behavior, unchanged |
| macOS | arm64 | Unsigned application ZIP | Extract and run; optional move to `/Applications` |
| macOS | x64 | Unsigned application ZIP | Extract and run; optional move to `/Applications` |
| Ubuntu | x64 | Debian package and portable ZIP | Install with the system package manager or extract and run |

macOS and Ubuntu portable packages are installer-free, not self-contained-data editions. They use Electron's normal per-user data directory. The Windows portable package retains its existing `portable.flag` and adjacent `UserData` behavior.

## Packaging architecture

Electron Forge remains the single packaging system. Its maker configuration becomes platform-aware:

- Windows keeps Squirrel and ZIP makers.
- macOS uses the ZIP maker on native arm64 and x64 hosts.
- Ubuntu uses the DEB and ZIP makers on a native x64 host.

The build orchestration will use small cross-platform TypeScript entry points. Windows-only installer operations may remain in Windows-specific code, but artifact discovery, packaged-app inspection, checksum generation, smoke orchestration, and upgrade verification must not depend on PowerShell when the same behavior is needed on macOS or Linux.

Each native build must contain the correct Electron binary and `better-sqlite3` native module for its target architecture. Package inspection will fail if the native payload, bundled seed database, media manifest, ASAR, or required Electron fuse state is absent or wrong.

Artifact names are stable and architecture-explicit:

- `QuizStageSetup.exe`
- `QuizStage-win32-x64.zip`
- `QuizStage-darwin-arm64.zip`
- `QuizStage-darwin-x64.zip`
- a versioned Quiz Stage Ubuntu x64 `.deb`
- `QuizStage-linux-x64.zip`

Platform-appropriate application icons will be derived from the existing Quiz Stage icon source and included without changing the product's visual identity.

## macOS security behavior

The macOS packages are intentionally unsigned and unnotarized. Packaging them as ZIP archives does not bypass Gatekeeper. Documentation must tell users that the first launch can require **System Settings → Privacy & Security → Open Anyway**. Once approved, macOS records an exception and normal double-click launches work.

The implementation will not claim a workaround-free macOS installation. Signing, notarization, Mac App Store publication, and DMG distribution are explicitly outside this scope.

## Runtime and persistence

Application runtime behavior remains platform-neutral:

- Installed and installer-free macOS packages use the standard macOS application-support directory selected by Electron.
- Installed and installer-free Ubuntu packages use the standard Linux user-data directory selected by Electron.
- Windows installed and portable storage behavior remains unchanged.

The portable marker must not be added to macOS or Linux archives because the existing portable path is relative to the executable. In a macOS bundle that would place mutable data inside the `.app`; in an installed Linux package it could target a read-only application directory.

Upgrade verification uses the same previous-version fixture on all targets and must prove preservation of the database, settings, match history, unfinished match state, reports, and media.

## Native CI and release workflow

The shared quality gate runs lint, typecheck, unit/integration tests, and content verification once. Native packaging jobs depend on it and run on:

- `windows-latest`
- `macos-15` for Apple Silicon
- `macos-15-intel` for Intel
- `ubuntu-24.04` for Linux x64

Every packaging job must:

1. Install the pinned Node and npm dependency tree.
2. Build the native artifact set.
3. Inspect package contents, ASAR, fuses, offline assets, and native modules.
4. Launch the packaged application and complete the existing offline full-match smoke flow.
5. Verify previous-version data migration and preservation.
6. Generate SHA-256 checksums.
7. Upload only the expected artifacts and verification evidence.

Ubuntu Electron and Playwright execution runs under Xvfb. macOS jobs directly launch the extracted `.app`. CI cannot reproduce the quarantine metadata attached by an end-user web download, so Gatekeeper override behavior is documented rather than represented as an automated pass.

Any failed native package, smoke, upgrade, inspection, or checksum gate fails the release workflow. A tag and public GitHub Release are not created by this work.

## Testing strategy

Implementation follows test-driven development:

- Release-workflow contract tests first describe the platform matrix and expected artifacts.
- Forge configuration tests first describe maker selection per platform/profile.
- Artifact-location and package-inspection tests cover Windows, macOS bundle, and Linux executable layouts.
- Cross-platform checksum, archive, smoke, and upgrade helpers receive focused unit tests before replacing shared PowerShell behavior.
- Packaged full-match smoke and upgrade checks run against actual native outputs in CI.

Existing Windows release tests remain authoritative and must stay green. Cross-platform changes may generalize their helpers, but must not weaken their assertions or change accepted Windows artifact names and portable-data semantics.

## Documentation and acceptance

The README will include platform-specific download, launch, user-data, and uninstall instructions. `docs/known-limitations.md` will stop describing macOS and Linux as entirely unsupported and will instead record the unsigned macOS first-launch requirement and the architectures/formats not provided.

`docs/release-acceptance.md` is updated only after the native jobs produce fresh passing evidence. Final acceptance records exact artifact sizes and SHA-256 hashes, runner operating systems and architectures, package inspection results, packaged full-match results, upgrade results, and any unavoidable platform warnings.

## Explicit non-goals

- macOS signing or notarization
- DMG or Mac App Store distribution
- Linux AppImage, RPM, Snap, or Flatpak distribution
- Ubuntu ARM64 support
- automatic updates
- tag creation or public release publication
- gameplay, content, networking, or persistence feature changes
