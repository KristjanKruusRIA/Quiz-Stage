Param(
  [string]$PackageRoot = 'out/make',
  [ValidateSet('Portable', 'Installer', 'Both')]
  [string]$Mode = 'Both'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Remove-TemporaryDirectory {
  param(
    [string]$Path,
    [string]$ExpectedPrefix
  )

  $resolved = [IO.Path]::GetFullPath($Path)
  $temporaryRoot = [IO.Path]::GetFullPath($env:TEMP + [IO.Path]::DirectorySeparatorChar)
  if (-not $resolved.StartsWith($temporaryRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove non-temporary directory: $resolved"
  }
  if (-not [IO.Path]::GetFileName($resolved).StartsWith($ExpectedPrefix, [StringComparison]::Ordinal)) {
    throw "Refusing to remove unexpected temporary directory: $resolved"
  }
  $maximumAttempts = 10
  for ($attempt = 1; $attempt -le $maximumAttempts; $attempt += 1) {
    if (-not (Test-Path -LiteralPath $resolved)) { return }
    try {
      Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop
    } catch {
      if ($attempt -eq $maximumAttempts) {
        throw "PACKAGED_SMOKE_CLEANUP_FAILED:$resolved ($($_.Exception.Message))"
      }
    }
    if (-not (Test-Path -LiteralPath $resolved)) { return }
    if ($attempt -lt $maximumAttempts) { Start-Sleep -Milliseconds 200 }
  }
  throw "PACKAGED_SMOKE_CLEANUP_FAILED:$resolved"
}

function Invoke-PackageSmoke {
  param(
    [string]$Executable,
    [string]$ModeLabel
  )

  $userDataRoot = Join-Path $env:TEMP ("quiz-stage-package-smoke-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $userDataRoot | Out-Null

  $environment = @{
    QUIZ_STAGE_PACKAGED_EXECUTABLE = $Executable
    QUIZ_STAGE_PACKAGED_USER_DATA = $userDataRoot
  }

  try {
    Write-Host "Running package smoke [$ModeLabel] against $Executable"
    $envLines = $environment.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
    $envLines | ForEach-Object { $parts = $_.Split('=', 2); [Environment]::SetEnvironmentVariable($parts[0], $parts[1], 'Process') }
    & npx playwright test tests/e2e/package-smoke.spec.ts
    if ($LASTEXITCODE -ne 0) { throw "Playwright package smoke failed for $ModeLabel" }
  }
  finally {
    Remove-TemporaryDirectory -Path $userDataRoot -ExpectedPrefix 'quiz-stage-package-smoke-'
    $environment.Keys | ForEach-Object { [Environment]::SetEnvironmentVariable($_, $null, 'Process') }
  }
}

function Invoke-InstallerPackage {
  param([string]$Root)

  $setup = Join-Path $Root 'installer\QuizStageSetup.exe'
  if (-not (Test-Path -LiteralPath $setup -PathType Leaf)) {
    throw "Installer package not found at $setup"
  }

  $releasePackages = @(Get-ChildItem -Path (Join-Path $Root 'squirrel.windows') -Filter '*-full.nupkg' -Recurse)
  if ($releasePackages.Count -ne 1) {
    throw "Expected exactly one Squirrel release package under $(Join-Path $Root 'squirrel.windows'); found $($releasePackages.Count)"
  }
  $releasePackage = $releasePackages[0]
  $packageNameMatch = [regex]::Match($releasePackage.BaseName, '^(?<ApplicationId>.+)-\d+\.\d+\.\d+-full$')
  if (-not $packageNameMatch.Success) {
    throw "Invalid Squirrel release package name: $($releasePackage.Name)"
  }
  $applicationId = $packageNameMatch.Groups['ApplicationId'].Value
  $installRoot = Join-Path $env:LOCALAPPDATA $applicationId
  $resolver = Join-Path $PSScriptRoot 'resolve-installer-executable.ps1'
  if (-not (Test-Path -LiteralPath $resolver -PathType Leaf)) {
    throw "Installer executable resolver not found at $resolver"
  }
  if (Test-Path -LiteralPath $installRoot) {
    if (Test-Path -LiteralPath (Join-Path $installRoot '.dead')) {
      Remove-Item -Path $installRoot -Recurse -Force
    }
    else {
      throw "Refusing to replace existing installer application data at $installRoot"
    }
  }

  try {
    Write-Host "Installing installer package from $setup"
    $installArguments = @('/S')
    $installProcess = Start-Process -FilePath $setup -ArgumentList $installArguments -PassThru -Wait
    if ($installProcess.ExitCode -ne 0) {
      throw "Install failed with exit code $($installProcess.ExitCode)"
    }
    $installedExe = $null
    $resolveError = $null
    for ($attempt = 0; $attempt -lt 60 -and $installedExe -eq $null; $attempt += 1) {
      try {
        $installedExe = & $resolver -InstallRoot $installRoot -ReleasePackageName $releasePackage.Name
      }
      catch {
        if ($_.Exception.Message -notlike 'INSTALLED_EXECUTABLE_MISSING:*') { throw }
        $resolveError = $_
        Start-Sleep -Seconds 1
      }
    }
    if ($installedExe -eq $null) {
      throw $resolveError
    }

    Invoke-PackageSmoke -Executable $installedExe -ModeLabel 'Installer'

    Get-Process | Where-Object { $_.Path -like "$installRoot*" } | Stop-Process -Force
    $updater = Join-Path $installRoot 'Update.exe'
    if (-not (Test-Path -LiteralPath $updater)) {
      throw "No Squirrel updater found under $installRoot"
    }

    $uninstallProcess = Start-Process -FilePath $updater -ArgumentList '--uninstall' -PassThru -Wait
    if ($uninstallProcess.ExitCode -ne 0) {
      throw "Uninstall failed with exit code $($uninstallProcess.ExitCode)"
    }
    if (Test-Path -LiteralPath (Join-Path $installRoot '.dead')) {
      Remove-Item -Path $installRoot -Recurse -Force
    }
  }
  finally {
    $updater = Join-Path $installRoot 'Update.exe'
    if (Test-Path -LiteralPath $updater) {
      Start-Process -FilePath $updater -ArgumentList '--uninstall' -Wait -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath (Join-Path $installRoot '.dead')) {
      Remove-Item -Path $installRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

$packageRoot = Resolve-Path -Path $PackageRoot -ErrorAction SilentlyContinue
if ($packageRoot -eq $null) {
  throw "Package root not found: $PackageRoot"
}

if ($Mode -eq 'Portable' -or $Mode -eq 'Both') {
  $portableArchive = Join-Path $packageRoot 'portable\QuizStage-win32-x64.zip'
  Write-Host "Running portable package smoke against $portableArchive"
  & npm.cmd run smoke:portable -- -- --target windows-x64 --archive $portableArchive
  if ($LASTEXITCODE -ne 0) { throw 'Portable package smoke failed' }
}

if ($Mode -eq 'Installer' -or $Mode -eq 'Both') {
  Invoke-InstallerPackage -Root $packageRoot
}
