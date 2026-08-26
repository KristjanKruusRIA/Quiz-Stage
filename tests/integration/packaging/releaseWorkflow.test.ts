import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

describe('Windows release workflow', () => {
  it('runs the complete local release gate', () => {
    const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;
    const release = scripts['verify:release'] ?? '';

    expect(release).toContain('verify:product');
    expect(release).toContain('verify:content');
    expect(release).toContain('make:installer');
    expect(release).toContain('make:portable');
    expect(release).toContain('release:checksums');
    expect(release).toContain('smoke-package.ps1 -PackageRoot out/make -Mode Both');
    expect(release).toContain('verify-upgrade.ps1 -PackageRoot out/make');
  });

  it('pins Windows CI and release artifact checks', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
    const release = readFileSync('.github/workflows/release.yml', 'utf8');

    expect(ci).toContain('runs-on: windows-latest');
    expect(ci).toContain('node-version: 24.15.0');
    expect(ci).toContain('~/AppData/Local/ms-playwright');
    expect(ci).toContain('npm run verify:content');
    expect(ci).toContain('if: failure()');
    expect(release).toContain('workflow_dispatch:');
    expect(release).toContain('~/AppData/Local/ms-playwright');
    expect(release).toContain("- 'v*'");
    expect(release).toContain('scripts/smoke-package.ps1 -PackageRoot out/make -Mode Both');
    expect(release).toContain('scripts/verify-upgrade.ps1 -PackageRoot out/make');
    expect(release).toContain('out/make/release-checksums.txt');
    expect(release).toContain('scripts/write-release-checksums.ps1');
  });

  it('targets the exact packages and exercises automatic packaged migration', () => {
    const smoke = readFileSync('scripts/smoke-package.ps1', 'utf8');
    const upgrade = readFileSync('scripts/verify-upgrade.ps1', 'utf8');
    const upgradeData = readFileSync('scripts/verify-upgrade-data.ts', 'utf8');

    expect(smoke).toContain("installer\\QuizStageSetup.exe");
    expect(smoke).toContain("$_.Name -eq 'Quiz Stage.exe'");
    expect(upgrade).toContain("portable\\QuizStage-win32-x64.zip");
    expect(upgrade).toContain('Start-Process -FilePath $executable');
    expect(upgrade).toContain("Join-Path $fixtureCopy 'backups'");
    expect(upgradeData).toContain("media', 'logo.png");
  });

  it('runs packaged smoke only from the post-package smoke gate', () => {
    const packagedSmoke = readFileSync('tests/e2e/package-smoke.spec.ts', 'utf8');
    const portableSmoke = readFileSync('scripts/smoke-portable.ts', 'utf8');
    const smoke = readFileSync('scripts/smoke-package.ps1', 'utf8');

    expect(packagedSmoke).not.toContain('test.skip(');
    expect(packagedSmoke).not.toContain("process.platform === 'win32'");
    expect(packagedSmoke).toContain("process.env.QUIZ_STAGE_PACKAGED_EXECUTABLE !== undefined");
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
    } finally {
      database.close();
    }
    const logo = path.join(userData, 'media', 'logo.png');
    expect(existsSync(logo)).toBe(true);
    expect(statSync(logo).size).toBeGreaterThan(0);
  });
});
