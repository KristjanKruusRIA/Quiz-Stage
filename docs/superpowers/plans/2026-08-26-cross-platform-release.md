# Quiz Stage macOS and Ubuntu Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship and natively verify unsigned Quiz Stage packages for macOS arm64, macOS x64, and Ubuntu x64 while preserving the accepted Windows x64 release.

**Architecture:** Keep Electron Forge as the only packager, introduce one pure release-target model, and have small platform-aware TypeScript scripts normalize artifacts and run shared verification. Native GitHub Actions runners build and exercise each package, while Windows-only installation behavior remains isolated behind the existing PowerShell wrapper.

**Tech Stack:** Electron 43.3.0, Electron Forge 7.11.2, TypeScript 6.0.3, Node.js 24.15.0, Vitest 4.1.10, Playwright 1.62.1, GitHub Actions, `better-sqlite3` 13.0.3

**Spec:** `docs/superpowers/specs/2026-08-26-cross-platform-release-design.md`

## Global Constraints

- Preserve the existing Windows x64 Squirrel installer name `QuizStageSetup.exe` and portable archive name `QuizStage-win32-x64.zip`.
- Produce unsigned `QuizStage-darwin-arm64.zip` and `QuizStage-darwin-x64.zip` artifacts.
- Produce an Ubuntu x64 Debian package and `QuizStage-linux-x64.zip`.
- Build and exercise each artifact on its matching native operating system and architecture.
- Keep macOS and Linux user data in Electron's standard per-user directory; do not add `portable.flag` to those packages.
- Preserve Windows portable `portable.flag` and adjacent `UserData` behavior.
- Keep gameplay, content, networking, and persistence semantics unchanged.
- Do not add macOS signing, notarization, DMG, AppImage, RPM, Snap, Flatpak, Ubuntu ARM64, automatic updates, tag creation, or public release publication.
- Do not update release acceptance with a pass until fresh native package, smoke, upgrade, and inspection evidence exists.

---

### Task 1: Define supported release targets and Forge makers

**Files:**
- Create: `scripts/release/targets.ts`
- Create: `tests/unit/release/targets.test.ts`
- Modify: `forge.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `ReleaseTargetId`, `ReleaseTarget`, `releaseTargetFor(platform, arch)`, `releaseTargetForId(id)`, and `makerNamesFor(target, profile)`.
- Consumes: Node's `NodeJS.Platform` and `process.arch` values.
- Later tasks use `ReleaseTarget.artifacts`, `ReleaseTarget.forgePlatform`, `ReleaseTarget.forgeArch`, and `ReleaseTarget.executableName` as the only artifact-layout authority.

- [ ] **Step 1: Write the failing target-model tests**

Create `tests/unit/release/targets.test.ts` with table-driven assertions:

```ts
import { describe, expect, it } from 'vitest';
import { makerNamesFor, releaseTargetFor, releaseTargetForId } from '../../../scripts/release/targets';

describe('release targets', () => {
  it.each([
    ['win32', 'x64', 'windows-x64'],
    ['darwin', 'arm64', 'macos-arm64'],
    ['darwin', 'x64', 'macos-x64'],
    ['linux', 'x64', 'ubuntu-x64'],
  ] as const)('maps %s/%s to %s', (platform, arch, id) => {
    expect(releaseTargetFor(platform, arch).id).toBe(id);
    expect(releaseTargetForId(id).id).toBe(id);
  });

  it('rejects unsupported architectures', () => {
    expect(() => releaseTargetFor('linux', 'arm64')).toThrow('UNSUPPORTED_RELEASE_TARGET:linux:arm64');
  });

  it('selects only supported makers', () => {
    expect(makerNamesFor(releaseTargetForId('windows-x64'), 'all')).toEqual(['squirrel', 'zip']);
    expect(makerNamesFor(releaseTargetForId('macos-arm64'), 'all')).toEqual(['zip']);
    expect(makerNamesFor(releaseTargetForId('ubuntu-x64'), 'all')).toEqual(['deb', 'zip']);
  });
});
```

- [ ] **Step 2: Run the target-model test and verify RED**

Run: `npx vitest run tests/unit/release/targets.test.ts --configLoader runner`

Expected: FAIL because `scripts/release/targets.ts` does not exist.

- [ ] **Step 3: Implement the minimal target model**

Create `scripts/release/targets.ts` with these public types:

```ts
export type ReleaseTargetId = 'windows-x64' | 'macos-arm64' | 'macos-x64' | 'ubuntu-x64';
export type PackageProfile = 'all' | 'installer' | 'portable';
export type MakerName = 'squirrel' | 'zip' | 'deb';

export interface ReleaseArtifact {
  kind: 'installer' | 'portable';
  relativePath: string;
}

export interface ReleaseTarget {
  id: ReleaseTargetId;
  forgePlatform: 'win32' | 'darwin' | 'linux';
  forgeArch: 'x64' | 'arm64';
  executableName: string;
  artifacts: readonly ReleaseArtifact[];
}
```

Define four immutable targets. Throw `UNSUPPORTED_RELEASE_TARGET:<platform>:<arch>` and `UNKNOWN_RELEASE_TARGET:<id>` on invalid input. Filter the target's makers for `installer` and `portable` profiles without inventing another profile.

- [ ] **Step 4: Install and configure the Linux maker**

Run: `npm install --save-dev @electron-forge/maker-deb@7.11.2`

Modify `forge.config.ts` to import the target model, use `resources/media/icon.ico` for Windows, configure explicit maker platforms, and derive `makers` from `makerNamesFor`. Configure DEB with:

```ts
const debMaker = {
  name: '@electron-forge/maker-deb',
  config: {
    options: {
      name: 'quiz-stage',
      productName: 'Quiz Stage',
      genericName: 'Quiz game',
      categories: ['Game'],
      maintainer: 'Quiz Stage',
      icon: join(process.cwd(), 'resources', 'media', 'icon-source.png'),
    },
  },
  platforms: ['linux'],
};
```

Do not add signing or notarization. Set Linux `executableName` to `quiz-stage`; preserve `Quiz Stage` on Windows and macOS.

- [ ] **Step 5: Run focused and existing packaging tests**

Run: `npx vitest run tests/unit/release/targets.test.ts tests/integration/packaging/packageContents.test.ts tests/integration/packaging/releaseWorkflow.test.ts --configLoader runner`

Expected: target tests PASS; Windows contracts remain PASS.

- [ ] **Step 6: Commit the target model**

```bash
git add scripts/release/targets.ts tests/unit/release/targets.test.ts forge.config.ts package.json package-lock.json
git commit -m "build(release): define native package targets"
```

---

### Task 2: Build and normalize native artifacts

**Files:**
- Create: `scripts/release/artifacts.ts`
- Create: `scripts/make-platform.ts`
- Create: `scripts/build-macos-icon.ts`
- Create: `tests/unit/release/artifacts.test.ts`
- Modify: `scripts/prepare-electron-zip.ts`
- Modify: `scripts/build-icon.ts`
- Modify: `scripts/make-installer.ts`
- Modify: `scripts/make-portable.ts`
- Modify: `forge.config.ts`
- Modify: `src/main/main.ts`
- Modify: `tests/integration/packaging/packageContents.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `ReleaseTarget` and `ReleaseArtifact` from Task 1.
- Produces: `normalizedArtifactPath(root, target, artifact)`, `findForgeArtifact(root, target, artifact)`, `normalizeArtifacts(root, target)`, and CLI `tsx scripts/make-platform.ts --target $targetId` where `$targetId` is a validated `ReleaseTargetId`.
- `make-platform.ts` is the only new entry point used by native CI jobs.

- [ ] **Step 1: Write failing artifact normalization tests**

Create temporary Forge-like trees and assert exact output paths:

```ts
expect(normalizedArtifactPath(root, macArm, macArm.artifacts[0])).toBe(
  path.join(root, 'out', 'make', 'portable', 'QuizStage-darwin-arm64.zip'),
);
expect(normalizedArtifactPath(root, ubuntu, ubuntu.artifacts[0])).toMatch(
  /out[\\/]make[\\/]installer[\\/]quiz-stage_0\.1\.0_amd64\.deb$/,
);
expect(() => findForgeArtifact(root, macArm, macArm.artifacts[0])).toThrow('FORGE_ARTIFACT_NOT_UNIQUE');
```

Include one success fixture for every output and one duplicate-candidate fixture.

- [ ] **Step 2: Run artifact tests and verify RED**

Run: `npx vitest run tests/unit/release/artifacts.test.ts --configLoader runner`

Expected: FAIL because `scripts/release/artifacts.ts` does not exist.

- [ ] **Step 3: Implement exact artifact discovery and normalization**

Use `globSync`, `copyFileSync`, and `mkdirSync`. Match only:

- `out/make/squirrel.windows/x64/QuizStageSetup.exe`
- `out/make/zip/darwin/<arch>/*.zip`
- `out/make/zip/linux/x64/*.zip`
- `out/make/deb/x64/*.deb`

Require exactly one source candidate per artifact. Copy only after validating a regular file. Never recursively delete `out` or use an unresolved glob as a deletion target.

- [ ] **Step 4: Make Electron archive preparation host-aware**

Name the local archive with both host values:

```ts
const archivePath = path.join(
  archiveDirectory,
  `electron-v${electronVersion}-${process.platform}-${process.arch}.zip`,
);
```

Keep PowerShell compression on Windows. On macOS and Linux, invoke `zip -qry <archive> .` with `cwd` set to `node_modules/electron/dist` so symlinks and executable modes survive. Export and test a pure `electronArchiveCommand(platform, runtimeDirectory, archivePath)` description.

- [ ] **Step 5: Generate the macOS icon on macOS**

Create `.cache/icons/QuizStage.iconset`, use `sips -z` for the required iconset PNG dimensions, then execute:

```ts
execFileSync('iconutil', ['-c', 'icns', iconsetDirectory, '-o', outputPath], { stdio: 'inherit' });
```

Reject non-macOS invocation with `MACOS_ICON_REQUIRES_DARWIN`. Update `forge.config.ts` to select `.cache/icons/QuizStage.icns` for macOS, `resources/media/icon.ico` for Windows, and the source PNG in the DEB maker. For Linux BrowserWindow instances, merge `icon: path.join(process.resourcesPath, 'media', 'icon-source.png')` into the existing window options in `src/main/main.ts`; do not change window dimensions or security preferences. Add package-content source assertions for all three icon paths.

- [ ] **Step 6: Implement the platform build CLI**

`scripts/make-platform.ts` must parse one `--target`, reject host/target mismatches, preserve the Windows entry points, build the Mac icon before Mac Forge, run host-aware archive preparation, invoke the local Forge CLI with explicit platform/architecture/makers, normalize artifacts, and print their paths as JSON. Use `execFileSync`, not a shell string.

- [ ] **Step 7: Add package scripts**

Add:

```json
"make:platform": "tsx scripts/make-platform.ts",
"make:macos-arm64": "npm run make:platform -- --target macos-arm64",
"make:macos-x64": "npm run make:platform -- --target macos-x64",
"make:ubuntu-x64": "npm run make:platform -- --target ubuntu-x64"
```

Keep `make:installer` and `make:portable` working on Windows.

- [ ] **Step 8: Run focused tests and local Windows builds**

```powershell
npx vitest run tests/unit/release/artifacts.test.ts tests/unit/release/targets.test.ts --configLoader runner
npm run make:installer
npm run make:portable
```

Expected: tests PASS and existing Windows artifact names remain present.

- [ ] **Step 9: Commit native artifact building**

```bash
git add scripts/release/artifacts.ts scripts/make-platform.ts scripts/build-macos-icon.ts scripts/prepare-electron-zip.ts scripts/build-icon.ts scripts/make-installer.ts scripts/make-portable.ts forge.config.ts src/main/main.ts tests/unit/release/artifacts.test.ts tests/integration/packaging/packageContents.test.ts package.json
git commit -m "build(release): create native platform artifacts"
```

---

### Task 3: Inspect Windows, macOS, and Linux package layouts

**Files:**
- Create: `scripts/release/packageLayout.ts`
- Create: `tests/unit/release/packageLayout.test.ts`
- Modify: `scripts/inspect-package.ts`
- Modify: `tests/integration/packaging/packageContents.test.ts`

**Interfaces:**
- Consumes: `ReleaseTarget` from Task 1.
- Produces: `resolvePackagedExecutable(inputPath, target)`, `packagedResourcesDirectory(executablePath, target)`, and `expectedNativeModuleSuffix(target)`.
- `inspect-package.ts --app $applicationPath --target $targetId` emits one JSON report and exits nonzero on invalid package state.

- [ ] **Step 1: Write failing platform-layout tests**

```ts
expect(resolvePackagedExecutable('/tmp/Quiz Stage.app', macArm)).toBe(
  '/tmp/Quiz Stage.app/Contents/MacOS/Quiz Stage',
);
expect(packagedResourcesDirectory('/tmp/Quiz Stage.app/Contents/MacOS/Quiz Stage', macArm)).toBe(
  '/tmp/Quiz Stage.app/Contents/Resources',
);
expect(resolvePackagedExecutable('/tmp/Quiz Stage-linux-x64', ubuntu)).toBe(
  '/tmp/Quiz Stage-linux-x64/quiz-stage',
);
expect(expectedNativeModuleSuffix(ubuntu)).toBe('prebuilds/linux-x64.node');
```

Also assert existing Windows executable and resource paths.

- [ ] **Step 2: Run layout tests and verify RED**

Run: `npx vitest run tests/unit/release/packageLayout.test.ts --configLoader runner`

Expected: FAIL because `packageLayout.ts` does not exist.

- [ ] **Step 3: Implement the layout resolver**

Accept only a target-defined directory, `.app` bundle, or exact executable. Require one executable match. Return target-specific resources and native suffixes: `win32-x64.node`, `darwin-arm64.node`, `darwin-x64.node`, or `linux-x64.node` beneath `better-sqlite3/prebuilds`.

- [ ] **Step 4: Generalize package inspection**

Require `--target`, resolve `app.asar` through the target layout, and run the existing fuse/offline-renderer checks against PE, Mach-O, or ELF. Add checks for `seed.sqlite`, `manifest.json`, and the target native module. Keep all five existing fuse expectations unchanged.

- [ ] **Step 5: Generalize package-content integration tests**

Select the current release target. When normalized artifacts exist, extract and inspect them. Assert `portable.flag` and `UserData/.keep` only for Windows portable and absent for macOS/Linux.

- [ ] **Step 6: Run inspection tests**

```powershell
npx vitest run tests/unit/release/packageLayout.test.ts tests/integration/packaging/packageContents.test.ts --configLoader runner
```

Then create `$inspectRoot` beneath `$env:TEMP`, extract the Windows archive there with `Expand-Archive`, run `npm run security:inspect-package -- --target windows-x64 --app $inspectRoot`, and remove only that validated directory.

- [ ] **Step 7: Commit package inspection**

```bash
git add scripts/release/packageLayout.ts scripts/inspect-package.ts tests/unit/release/packageLayout.test.ts tests/integration/packaging/packageContents.test.ts
git commit -m "test(packaging): inspect native application layouts"
```

---

### Task 4: Run packaged full-match smoke tests cross-platform

**Files:**
- Create: `scripts/release/extractArchive.ts`
- Create: `scripts/smoke-portable.ts`
- Create: `tests/unit/release/extractArchive.test.ts`
- Modify: `tests/e2e/package-smoke.spec.ts`
- Modify: `scripts/smoke-package.ps1`
- Modify: `package.json`

**Interfaces:**
- Consumes: `resolvePackagedExecutable` from Task 3.
- Produces: `archiveExtractionCommand(platform, archive, destination)` and CLI `smoke-portable.ts --target $targetId --archive $archivePath`.
- The Playwright test consumes `QUIZ_STAGE_PACKAGED_EXECUTABLE` and `QUIZ_STAGE_PACKAGED_USER_DATA` on every supported platform.

- [ ] **Step 1: Write failing archive-command and enablement tests**

Test that Windows uses PowerShell `Expand-Archive` and macOS/Linux use `unzip -q`. Add a source contract asserting `package-smoke.spec.ts` no longer contains `process.platform === 'win32'`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npx vitest run tests/unit/release/extractArchive.test.ts tests/integration/packaging/releaseWorkflow.test.ts --configLoader runner`

Expected: FAIL because the extraction helper is absent and package smoke remains Windows-only.

- [ ] **Step 3: Implement safe archive extraction**

Require a caller-created destination beneath `tmpdir()` whose basename starts with `quiz-stage-package-`. Refuse every other extraction or cleanup target. Execute commands with `execFileSync` argument arrays; do not interpolate a shell command.

- [ ] **Step 4: Generalize Playwright packaged smoke**

Change enablement to:

```ts
const packagedSmokeEnabled = process.env.QUIZ_STAGE_PACKAGED_EXECUTABLE !== undefined;
```

Use the supplied temporary user-data directory for macOS and Linux. Check `portable.flag` through `packagedResourcesDirectory`; preserve adjacent Windows `UserData`. Spawn with the existing CDP, deterministic clock, and network-guard switches. Keep the 60-clue match, Final, Match History, SQLite completion, and zero-request assertions unchanged.

- [ ] **Step 5: Implement the portable smoke CLI**

Parse exact `--target` and `--archive` arguments; create `quiz-stage-package-smoke-*` extraction and user-data directories; extract and resolve the executable; invoke the local Playwright CLI for `tests/e2e/package-smoke.spec.ts`; and remove only the two validated temporary directories in `finally`.

- [ ] **Step 6: Reuse shared smoke from Windows installer handling**

Keep installation/uninstall in `scripts/smoke-package.ps1`. Delegate the portable archive to `smoke-portable.ts` and use the same Playwright environment for the installed executable. Preserve the refusal to overwrite live `%LOCALAPPDATA%` data.

- [ ] **Step 7: Run Windows packaged smoke**

```powershell
npx vitest run tests/unit/release/extractArchive.test.ts tests/integration/packaging/releaseWorkflow.test.ts --configLoader runner
npm run smoke:portable -- --target windows-x64 --archive out/make/portable/QuizStage-win32-x64.zip
pwsh -NoProfile -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Installer
```

Expected: focused tests PASS and both package modes complete a full offline match.

- [ ] **Step 8: Commit cross-platform smoke support**

```bash
git add scripts/release/extractArchive.ts scripts/smoke-portable.ts scripts/smoke-package.ps1 tests/unit/release/extractArchive.test.ts tests/e2e/package-smoke.spec.ts package.json
git commit -m "test(packaging): run native packaged match smoke"
```

---

### Task 5: Verify package upgrades cross-platform

**Files:**
- Create: `scripts/verify-upgrade.ts`
- Create: `tests/integration/packaging/upgradeWorkflow.test.ts`
- Modify: `scripts/verify-upgrade.ps1`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 3 executable resolution and Task 4 extraction.
- Produces: CLI `verify-upgrade.ts --target $targetId --archive $archivePath` and `verifyUpgrade(options): Promise<void>`.
- Continues to use `scripts/verify-upgrade-data.ts` as the data-level authority.

- [ ] **Step 1: Write the failing upgrade-workflow contract**

Import `verifyUpgrade` with injected `spawnApplication`, use a copied previous-version fixture, simulate one backup, and assert the verifier passes the database and backup paths to the existing data checker. Add rejection tests for no backup, early process exit, and committed-fixture mutation.

- [ ] **Step 2: Run the upgrade test and verify RED**

Run: `npx vitest run tests/integration/packaging/upgradeWorkflow.test.ts --configLoader runner`

Expected: FAIL because `scripts/verify-upgrade.ts` does not exist.

- [ ] **Step 3: Implement the shared verifier**

Create a `quiz-stage-upgrade-check-*` workspace, extract the package, copy `tests/fixtures/previous-version/UserData`, and launch with:

```ts
[
  `--user-data-dir=${userDataDirectory}`,
  '--quiz-stage-e2e-network-guard',
]
```

Wait at most ten seconds for one `.bak`, fail on early exit, stop the process, and call `scripts/verify-upgrade-data.ts`. Hash the committed fixture database and media before/after and fail on mutation. For Windows portable, copy into adjacent `UserData`; macOS/Linux use only the temporary standard user-data directory.

- [ ] **Step 4: Preserve the Windows command**

Make `scripts/verify-upgrade.ps1` a thin Windows wrapper or retain only its Windows process cleanup while delegating data checks. Add `verify-upgrade` to `package.json` and keep `verify:release` verifying Windows portable migration.

- [ ] **Step 5: Run Windows upgrade verification**

```powershell
npx vitest run tests/integration/packaging/upgradeWorkflow.test.ts tests/integration/packaging/releaseWorkflow.test.ts --configLoader runner
npm run verify-upgrade -- --target windows-x64 --archive out/make/portable/QuizStage-win32-x64.zip
```

Expected: migration backup and every fixture-preservation check PASS.

- [ ] **Step 6: Commit upgrade verification**

```bash
git add scripts/verify-upgrade.ts scripts/verify-upgrade.ps1 tests/integration/packaging/upgradeWorkflow.test.ts package.json
git commit -m "test(packaging): verify native package upgrades"
```

---

### Task 6: Generate deterministic cross-platform checksums

**Files:**
- Create: `scripts/write-release-checksums.ts`
- Create: `tests/unit/release/checksums.test.ts`
- Modify: `scripts/write-release-checksums.ps1`
- Modify: `package.json`

**Interfaces:**
- Consumes: normalized artifact paths from Tasks 1 and 2.
- Produces: `checksumLines(files)`, `writeReleaseChecksums(target, packageRoot)`, and `release-checksums-<target>.txt`.

- [ ] **Step 1: Write failing checksum tests**

Use two temporary files and assert lowercase SHA-256 lines sorted by basename:

```ts
expect(checksumLines([second, first])).toEqual([
  `${firstHash}  first.zip`,
  `${secondHash}  second.deb`,
]);
```

Assert missing and duplicate expected artifacts fail closed.

- [ ] **Step 2: Run checksum test and verify RED**

Run: `npx vitest run tests/unit/release/checksums.test.ts --configLoader runner`

Expected: FAIL because the TypeScript checksum module does not exist.

- [ ] **Step 3: Implement checksums**

Compute SHA-256 with `createHash('sha256')`, sort by basename, terminate with one LF, and write only `out/make/release-checksums-<target>.txt`. Reject any resolved file outside `out/make`.

- [ ] **Step 4: Preserve the Windows alias**

Change `release:checksums` to `tsx scripts/write-release-checksums.ts --target windows-x64 --package-root out/make`. Keep the PowerShell file as a compatibility wrapper that returns the new command's exit code.

- [ ] **Step 5: Run checksum tests and generate Windows output**

```powershell
npx vitest run tests/unit/release/checksums.test.ts --configLoader runner
npm run release:checksums
Get-Content out/make/release-checksums-windows-x64.txt
```

Expected: exactly the Windows installer and portable ZIP hashes.

- [ ] **Step 6: Commit checksums**

```bash
git add scripts/write-release-checksums.ts scripts/write-release-checksums.ps1 tests/unit/release/checksums.test.ts package.json
git commit -m "build(release): generate portable checksums"
```

---

### Task 7: Add the native CI and release matrix

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `tests/integration/packaging/releaseWorkflow.test.ts`

**Interfaces:**
- Consumes: package, inspect, smoke, upgrade, and checksum commands from Tasks 2–6.
- Produces: one shared `quality` job and four native `package` matrix executions.

- [ ] **Step 1: Write a failing native matrix contract**

Assert all exact runner/target pairs:

```ts
for (const [runner, target] of [
  ['windows-latest', 'windows-x64'],
  ['macos-15', 'macos-arm64'],
  ['macos-15-intel', 'macos-x64'],
  ['ubuntu-24.04', 'ubuntu-x64'],
] as const) {
  expect(release).toContain(`runner: ${runner}`);
  expect(release).toContain(`target: ${target}`);
}
```

Require `needs: quality`, Xvfb for Ubuntu, inspection, smoke, upgrade, checksums, artifact upload, and no GitHub Release publication action.

- [ ] **Step 2: Run workflow contract and verify RED**

Run: `npx vitest run tests/integration/packaging/releaseWorkflow.test.ts --configLoader runner`

Expected: FAIL because workflows contain only Windows jobs.

- [ ] **Step 3: Create the shared quality job**

Use `windows-latest`, Node `24.15.0`, and these exact commands:

```yaml
- run: npm ci
- run: npm run lint
- run: npm run typecheck
- run: npm run test:run
- run: npm run verify:content
```

Upload test artifacts only on failure.

- [ ] **Step 4: Add the four-entry package matrix**

Use `strategy.fail-fast: false` and matrix fields `runner`, `target`, and `artifactName`. Every entry runs `npm ci`, its make command, package inspection, portable full-match smoke, upgrade verification, target checksums, and `actions/upload-artifact@v4`.

Ubuntu installs `fakeroot`, `dpkg`, `zip`, `unzip`, and Playwright dependencies. Prefix package execution with `xvfb-run -a`. Install the DEB, smoke `/usr/bin/quiz-stage`, remove the package, and assert the executable is absent.

macOS uses `smoke-portable.ts`; verify the executable architecture with `file` before smoke. Windows preserves installer smoke/uninstall plus portable smoke.

- [ ] **Step 5: Keep ordinary CI focused**

Make `.github/workflows/ci.yml` run shared quality on pushes and pull requests. Run platform-model/workflow tests there, but keep the expensive native package matrix in `release.yml`, triggered by tags and manual dispatch.

- [ ] **Step 6: Run workflow and static contracts**

```powershell
npx vitest run tests/integration/packaging/releaseWorkflow.test.ts tests/unit/release --configLoader runner
npm run lint
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 7: Commit native workflows**

```bash
git add .github/workflows/ci.yml .github/workflows/release.yml tests/integration/packaging/releaseWorkflow.test.ts
git commit -m "ci(release): verify Windows macOS and Ubuntu packages"
```

---

### Task 8: Document downloads, Gatekeeper, data, and limitations

**Files:**
- Modify: `README.md`
- Modify: `docs/known-limitations.md`
- Modify: `docs/portable-upgrades.md`
- Create: `tests/integration/packaging/releaseDocumentation.test.ts`

**Interfaces:**
- Consumes: artifact names and storage behavior from Tasks 1–7.
- Produces: installation, first-launch, user-data, upgrade, and uninstall instructions.

- [ ] **Step 1: Write failing documentation contract**

Assert the README names all six normalized artifacts, distinguishes Intel from Apple Silicon, documents DEB and ZIP flows, and links to Apple's `Open Anyway` guidance. Assert limitations say unsigned/unnotarized macOS, no Ubuntu ARM64, and no DMG/AppImage/RPM/Flatpak. Assert portable upgrades does not tell macOS/Linux users to copy adjacent `UserData`.

- [ ] **Step 2: Run documentation contract and verify RED**

Run: `npx vitest run tests/integration/packaging/releaseDocumentation.test.ts --configLoader runner`

Expected: FAIL because documentation says macOS and Linux are unsupported.

- [ ] **Step 3: Update README**

Document processor selection, extraction, optional `/Applications` move, one-time **Open Anyway**, Ubuntu DEB installation/removal, Ubuntu ZIP execution, and standard macOS/Linux user-data locations. Preserve Windows instructions.

Use “unsigned and unnotarized,” never “safe,” “trusted,” or “workaround-free.”

- [ ] **Step 4: Update limitations and upgrades**

Remove blanket macOS/Linux unsupported text. Add exact unsupported architectures/formats. Explain that installer-free macOS/Linux packages keep data outside the extracted application, so upgrades replace application files only.

- [ ] **Step 5: Run docs and whitespace checks**

```powershell
npx vitest run tests/integration/packaging/releaseDocumentation.test.ts --configLoader runner
git diff --check
```

Expected: PASS.

- [ ] **Step 6: Commit user documentation**

```bash
git add README.md docs/known-limitations.md docs/portable-upgrades.md tests/integration/packaging/releaseDocumentation.test.ts
git commit -m "docs(release): explain macOS and Ubuntu packages"
```

---

### Task 9: Run local Windows regression and release gates

**Files:**
- Modify only if a test exposes a defect in Tasks 1–8.

**Interfaces:**
- Consumes: every implementation task.
- Produces: fresh local Windows evidence before push.

- [ ] **Step 1: Run focused tests**

Run: `npx vitest run tests/unit/release tests/integration/packaging --configLoader runner`

Expected: all focused tests PASS.

- [ ] **Step 2: Run static, unit/integration, and content gates**

```powershell
npm run lint
npm run typecheck
npm run test:run
npm run verify:content
```

Expected: all exit zero; content remains 6,000 board clues, 1,200 sets, 150 Finals, and 1,464 verified sources.

- [ ] **Step 3: Rebuild and inspect Windows artifacts**

```powershell
npm run make:installer
npm run make:portable
npm run release:checksums
```

Create `$inspectRoot = Join-Path $env:TEMP ("quiz-stage-package-inspect-" + [guid]::NewGuid().ToString('N'))`, extract the ZIP there, run `npm run security:inspect-package -- --target windows-x64 --app $inspectRoot`, and remove only `$inspectRoot` in `finally`.

- [ ] **Step 4: Run packaged smoke and upgrade gates**

```powershell
pwsh -NoProfile -File scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both
npm run verify-upgrade -- --target windows-x64 --archive out/make/portable/QuizStage-win32-x64.zip
```

Expected: both modes complete the offline match; uninstall and upgrade preservation PASS.

- [ ] **Step 5: Commit only evidence-backed fixes**

If no defect was found, do not create an empty commit. If a defect was fixed, stage only its test and implementation and use a scoped conventional commit.

---

### Task 10: Obtain native CI evidence and close release acceptance

**Files:**
- Modify after green evidence: `docs/release-acceptance.md`
- Create after green evidence: `docs/superpowers/sdd/2026-08-11-quiz-stage-desktop-game/task-44-cross-platform-release-evidence.json`

**Interfaces:**
- Consumes: GitHub Actions outputs for all four target jobs.
- Produces: exact native artifact hashes, packaged-run evidence, and the supported-platform matrix.

- [ ] **Step 1: Verify pre-push boundary**

```powershell
git status --short
git diff --check
git log -1 --oneline
```

Expected: no implementation residue and all intended commits present.

- [ ] **Step 2: Push current branch**

Run: `git push origin codex/finish-quiz-stage`

Do not force push, tag, create a GitHub Release, or merge another branch.

- [ ] **Step 3: Dispatch and watch release workflow**

```powershell
gh workflow run release.yml --ref codex/finish-quiz-stage
$runId = gh run list --workflow release.yml --branch codex/finish-quiz-stage --limit 1 --json databaseId --jq '.[0].databaseId'
if (-not $runId) { throw 'RELEASE_WORKFLOW_RUN_NOT_FOUND' }
gh run watch $runId --exit-status
```

Expected: quality and all four package jobs PASS.

- [ ] **Step 4: Diagnose native failures**

For each failed job, run `gh run view $runId --log-failed`, add a focused failing test where locally reproducible, make the smallest fix, rerun Task 9, push normally, and dispatch a fresh run. Never accept a target from a partial artifact set.

- [ ] **Step 5: Download and verify artifacts**

```powershell
$artifactRoot = Join-Path $env:TEMP ("quiz-stage-native-release-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $artifactRoot | Out-Null
gh run download $runId --dir $artifactRoot
Get-ChildItem -LiteralPath $artifactRoot -Recurse -File | Get-FileHash -Algorithm SHA256
```

Compare every file to its target checksum and confirm the expected distributables and verification evidence only.

- [ ] **Step 6: Record exact acceptance evidence**

The Task 44 JSON records commit/run IDs, runner OS/architectures, artifact paths/sizes/SHA-256, inspection summaries, full-match and zero-request results, upgrade results, Windows uninstall, Ubuntu DEB removal, and the macOS Gatekeeper limitation. Update release acceptance with the same matrix without weakening Windows 10/11 history.

- [ ] **Step 7: Verify and commit acceptance documentation**

```powershell
npm run lint
npm run typecheck
npm run test:run
npm run verify:content
git diff --check
git add docs/release-acceptance.md docs/superpowers/sdd/2026-08-11-quiz-stage-desktop-game/task-44-cross-platform-release-evidence.json
git commit -m "docs(release): accept macOS and Ubuntu packages"
git push origin codex/finish-quiz-stage
```

- [ ] **Step 8: Confirm final state**

```powershell
git status --short
git rev-parse HEAD
git rev-parse origin/codex/finish-quiz-stage
```

Expected: tree and index clean; local and remote heads identical; no tag or public release created.
