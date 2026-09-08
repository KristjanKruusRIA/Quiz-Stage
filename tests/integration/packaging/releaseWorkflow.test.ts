import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const expectedExpansionClueId = 'built-in-history-easy-expansion-001';

describe('release workflow', () => {
  it('runs the complete local release gate', () => {
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;
    const release = scripts['verify:release'] ?? '';

    expect(release).toContain('verify:product');
    expect(release).toContain('verify:content');
    expect(release).toContain('make:installer');
    expect(release).toContain('make:portable');
    expect(release).toContain('release:checksums');
    expect(release).toContain(
      `smoke-package.ps1 -PackageRoot out/make -Mode Both -ExpectedClueId ${expectedExpansionClueId}`,
    );
    expect(release).toContain('verify-upgrade.ps1 -PackageRoot out/make');
  });

  it('keeps ordinary CI and release quality gates focused', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
    const release = readFileSync('.github/workflows/release.yml', 'utf8');
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;

    for (const workflow of [ci, release]) {
      expect(workflow).toContain('quality:');
      expect(workflow).toContain('runs-on: windows-2022');
      expect(workflow).toContain('node-version: 24.15.0');
      for (const command of [
        'npm ci',
        'npm run lint',
        'npm run typecheck',
        'npm run test:run',
      ]) {
        expect(workflow).toContain(`- run: ${command}`);
      }
      expect(workflow).toContain('npm run test:e2e');
      expect(workflow).toContain('if: failure()');
      expect(workflow).toContain('actions/upload-artifact@v4');
    }

    expect(ci).toMatch(/- run: npm run verify:content:cached\r?$/m);
    expect(release).toMatch(/- run: npm run verify:content\r?$/m);
    expect(scripts['verify:content:cached']).toContain('--source-cache-only');
    expect(scripts['verify:content']).not.toContain('--source-cache-only');

    expect(ci).not.toContain('make:platform');
    expect(ci).not.toContain('strategy:');
    expect(release).toContain('workflow_dispatch:');
    expect(release).toContain("- 'v*'");
  });

  it('defines the exact native release matrix and package gates', () => {
    const release = readFileSync('.github/workflows/release.yml', 'utf8');

    for (const [runner, target] of [
      ['windows-2022', 'windows-x64'],
      ['macos-15', 'macos-arm64'],
      ['macos-15-intel', 'macos-x64'],
      ['ubuntu-24.04', 'ubuntu-x64'],
    ] as const) {
      expect(release).toContain(`runner: ${runner}`);
      expect(release).toContain(`target: ${target}`);
    }

    expect(release).toContain('needs: quality');
    expect(release).toContain('fail-fast: false');
    expect(release).toContain('artifactName:');
    expect(release).toContain('runs-on: ${{ matrix.runner }}');
    expect(release).toContain('npm run make:platform');
    expect(release).toContain('npm run security:inspect-package');
    expect(release).toContain('scripts/smoke-portable.ts');
    expect(release).toContain(
      `scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both -ExpectedClueId ${expectedExpansionClueId}`,
    );
    expect(release).toContain('npm run verify-upgrade');
    expect(release).toContain('scripts/write-release-checksums.ts');
    expect(release).toContain('actions/upload-artifact@v4');

    expect(release).toContain('sudo apt-get install -y fakeroot dpkg zip unzip');
    expect(release).toContain('npx playwright install --with-deps chromium');
    expect(release).toContain('xvfb-run -a npm run make:platform');
    expect(release).toContain('xvfb-run -a npx tsx scripts/smoke-portable.ts');
    expect(release).toContain('xvfb-run -a npm run verify-upgrade');
    expect(release).toContain('sudo apt-get install -y "./$deb_path"');
    expect(release).not.toContain('sudo dpkg -i');
    expect(release).toContain('sudo dpkg --remove');
    expect(release).toContain('QUIZ_STAGE_PACKAGED_EXECUTABLE=/usr/bin/quiz-stage');
    expect(release).toContain('test ! -e /usr/bin/quiz-stage');

    expect(release).toContain('file "out/Quiz Stage-darwin-arm64/Quiz Stage.app/Contents/MacOS/Quiz Stage"');
    expect(release).toContain('file "out/Quiz Stage-darwin-x64/Quiz Stage.app/Contents/MacOS/Quiz Stage"');
    expect(release).toContain('arm64');
    expect(release).toContain('x86_64');

    for (const artifactPath of [
      'out/make/installer/QuizStageSetup.exe',
      'out/make/portable/QuizStage-win32-x64.zip',
      'out/make/portable/QuizStage-darwin-arm64.zip',
      'out/make/portable/QuizStage-darwin-x64.zip',
      'out/make/installer/quiz-stage_0.1.0_amd64.deb',
      'out/make/portable/QuizStage-linux-x64.zip',
      'out/make/release-checksums-windows-x64.txt',
      'out/make/release-checksums-macos-arm64.txt',
      'out/make/release-checksums-macos-x64.txt',
      'out/make/release-checksums-ubuntu-x64.txt',
    ]) {
      expect(release).toContain(artifactPath);
    }

    expect(release).not.toMatch(/softprops\/action-gh-release|actions\/create-release|\bgh release\b/);
  });

  it('targets the exact packages and exercises automatic packaged migration', () => {
    const smoke = readFileSync('scripts/smoke-package.ps1', 'utf8');
    const upgrade = readFileSync('scripts/verify-upgrade.ps1', 'utf8');
    const upgradeData = readFileSync('scripts/verify-upgrade-data.ts', 'utf8');
    const fixtureBuilder = readFileSync('scripts/create-upgrade-fixture.ts', 'utf8');
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;

    expect(smoke).toContain("installer\\QuizStageSetup.exe");
    expect(upgrade).toContain("portable\\QuizStage-win32-x64.zip");
    expect(upgrade).toContain('& npm.cmd run verify-upgrade -- -- --target windows-x64 --archive $portableArchive');
    expect(upgrade).not.toContain('Start-Process');
    expect(scripts['verify-upgrade']).toBe('tsx scripts/verify-upgrade.ts');
    expect(upgradeData).toContain("media', 'logo.png");
    expect(upgradeData).toContain(expectedExpansionClueId);
    expect(fixtureBuilder).toContain(expectedExpansionClueId);
    expect(smoke).toContain('QUIZ_STAGE_PACKAGED_EXPECTED_CLUE_ID');
  });

  it('runs packaged smoke only from the post-package smoke gate', () => {
    const packagedSmoke = readFileSync('tests/e2e/package-smoke.spec.ts', 'utf8');
    const portableSmoke = readFileSync('scripts/smoke-portable.ts', 'utf8');
    const smoke = readFileSync('scripts/smoke-package.ps1', 'utf8');

    expect(packagedSmoke).not.toContain('test.skip(');
    expect(packagedSmoke).not.toContain("process.platform === 'win32'");
    expect(packagedSmoke).toContain("process.env.QUIZ_STAGE_PACKAGED_EXECUTABLE !== undefined");
    expect(packagedSmoke).toContain('process.env.QUIZ_STAGE_PACKAGED_EXPECTED_CLUE_ID');
    expect(packagedSmoke).toContain('test.setTimeout(300_000);');
    expect(packagedSmoke).not.toContain('600_000');
    expect(packagedSmoke).toContain("const useDomPointerActivation = process.platform === 'darwin' && process.arch === 'x64';");
    expect(packagedSmoke).toContain('await expect(control).toBeVisible({ timeout: 30_000 });');
    expect(packagedSmoke).toContain('await expect(control).toBeEnabled({ timeout: 30_000 });');
    expect(packagedSmoke).toContain('async function activateInitialControl(control: Locator): Promise<void>');
    expect(packagedSmoke.match(/control\.evaluate/g)).toHaveLength(1);
    expect(packagedSmoke).toContain('control.evaluate((element) => (element as HTMLElement).click())');
    expect(packagedSmoke).not.toContain('requestSubmit(');
    expect(packagedSmoke).toContain('await control.click();');
    expect(packagedSmoke).toContain('await expect(radio).toBeVisible({ timeout: 30_000 });');
    expect(packagedSmoke).toContain('await expect(radio).toBeEnabled({ timeout: 30_000 });');
    expect(packagedSmoke).toContain('await expect(radio).toBeChecked({ timeout: 30_000 });');
    expect(packagedSmoke).toContain('await radio.check();');
    expect(packagedSmoke).toContain("activateInitialControl(page.getByRole('button', { name: 'New Match' }))");
    expect(packagedSmoke).toContain("activateRadio(page.getByRole('radio', { name: 'English' }))");
    expect(packagedSmoke).toMatch(/waitForPackagedConnection\([\s\S]*?\}, \{ attempts: 300 \}\);/);
    expect(packagedSmoke).toContain('page.setDefaultTimeout(30_000);');
    expect(packagedSmoke).toContain('PACKAGED_SMOKE_PROGRESS:${phase}');
    expect(packagedSmoke).toContain("reportPackagedSmokeProgress('clues', clueNumber);");
    expect(packagedSmoke).toContain("test.use({ trace: 'off', screenshot: 'off' });");
    expect(packagedSmoke).toMatch(/catch \(error: unknown\) \{\s+console\.error\('PACKAGED_SMOKE_ORIGINAL_ERROR', error\);\s+throw error;\s+\}/);
    expect(portableSmoke).not.toContain('portableSmokeCliArguments');
    expect(smoke).toContain('npm.cmd run smoke:portable -- -- --target windows-x64 --archive');
    expect(smoke).toContain('playwright test tests/e2e/package-smoke.spec.ts');
  });

  it.skipIf(process.platform !== 'win32')(
    'retries temporary profile cleanup until the exact directory is absent',
    () => {
      const cleanupProbe = `
$source = Get-Content -Raw scripts/smoke-package.ps1
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseInput($source, [ref]$tokens, [ref]$errors)
$functionAst = $ast.Find({
  param($node)
  $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Remove-TemporaryDirectory'
}, $true)
if ($null -eq $functionAst) { throw 'REMOVE_TEMPORARY_DIRECTORY_NOT_FOUND' }
Invoke-Expression $functionAst.Extent.Text

$target = Join-Path $env:TEMP ('quiz-stage-package-smoke-regression-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $target | Out-Null
$script:removeAttempts = 0
function Remove-Item {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][string]$LiteralPath,
    [switch]$Recurse,
    [switch]$Force
  )
  $script:removeAttempts += 1
  if ($script:removeAttempts -eq 1) { return }
  Microsoft.PowerShell.Management\\Remove-Item -LiteralPath $LiteralPath -Recurse:$Recurse -Force:$Force -ErrorAction Stop
}

try {
  Remove-TemporaryDirectory -Path $target -ExpectedPrefix 'quiz-stage-package-smoke-'
  if (Test-Path -LiteralPath $target) { throw 'TEMPORARY_DIRECTORY_STILL_EXISTS' }
  if ($script:removeAttempts -ne 2) { throw "UNEXPECTED_REMOVE_ATTEMPTS:$script:removeAttempts" }
  Write-Output "REMOVE_ATTEMPTS=$script:removeAttempts"
} finally {
  if (Test-Path -LiteralPath $target) {
    Microsoft.PowerShell.Management\\Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop
  }
}

$stubbornTarget = Join-Path $env:TEMP ('quiz-stage-package-smoke-regression-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stubbornTarget | Out-Null
$script:removeAttempts = 0
function Remove-Item {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)][string]$LiteralPath,
    [switch]$Recurse,
    [switch]$Force
  )
  $script:removeAttempts += 1
}

try {
  $cleanupError = $null
  try {
    Remove-TemporaryDirectory -Path $stubbornTarget -ExpectedPrefix 'quiz-stage-package-smoke-'
  } catch {
    $cleanupError = $_.Exception.Message
  }
  if ($cleanupError -notlike 'PACKAGED_SMOKE_CLEANUP_FAILED:*') {
    throw "EXPECTED_CLEANUP_FAILURE:$cleanupError"
  }
  if ($script:removeAttempts -ne 10) { throw "UNEXPECTED_FINAL_REMOVE_ATTEMPTS:$script:removeAttempts" }
  Write-Output "FINAL_REMOVE_ATTEMPTS=$script:removeAttempts"
} finally {
  Microsoft.PowerShell.Management\\Remove-Item -LiteralPath $stubbornTarget -Recurse -Force -ErrorAction Stop
}
`;
      const result = spawnSync('pwsh', ['-NoProfile', '-Command', cleanupProbe], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(result.status, result.stderr || result.stdout).toBe(0);
      expect(result.stdout).toContain('REMOVE_ATTEMPTS=2');
      expect(result.stdout).toContain('FINAL_REMOVE_ATTEMPTS=10');
    },
    10_000,
  );

  it('contains every previous-version preservation fixture', () => {
    const userData = path.join(process.cwd(), 'tests', 'fixtures', 'previous-version', 'UserData');
    const database = new Database(path.join(userData, 'quiz-stage.sqlite'), { readonly: true });
    try {
      expect(database.prepare('SELECT MAX(version) FROM schema_version').pluck().get()).toBe(1);
      expect(database.prepare("SELECT COUNT(*) FROM content_packs WHERE id = 'previous-version-pack'").pluck().get()).toBe(1);
      expect(database.prepare('SELECT COUNT(*) FROM content_reports').pluck().get()).toBe(1);
      expect(database.prepare('SELECT COUNT(*) FROM settings').pluck().get()).toBe(2);
      expect(database.prepare('SELECT COUNT(*) FROM matches WHERE completed_at IS NOT NULL').pluck().get()).toBe(1);
      expect(database.prepare('SELECT COUNT(*) FROM matches WHERE completed_at IS NULL').pluck().get()).toBe(1);
      expect(database.prepare('SELECT COUNT(*) FROM clues WHERE id = ?').pluck().get(expectedExpansionClueId)).toBe(0);
    } finally {
      database.close();
    }
    const logo = path.join(userData, 'media', 'logo.png');
    expect(existsSync(logo)).toBe(true);
    expect(statSync(logo).size).toBeGreaterThan(0);
  });
});
