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
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}

function Resolve-PortablePackage {
  param([string]$Root)

  $zip = Join-Path $Root 'portable\QuizStage-win32-x64.zip'
  if (-not (Test-Path -LiteralPath $zip)) {
    throw "Portable package not found at $zip"
  }

  $extractRoot = Join-Path $env:TEMP ("quiz-stage-portable-smoke-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $extractRoot | Out-Null
  & Expand-Archive -LiteralPath $zip -DestinationPath $extractRoot -Force
  $executable = Join-Path $extractRoot 'Quiz Stage.exe'
  if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
    throw "Portable executable not found at $executable"
  }
  if (-not (Test-Path -LiteralPath (Join-Path $extractRoot 'resources\portable.flag') -PathType Leaf)) {
    throw "Portable marker not found under $extractRoot"
  }
  if (-not (Test-Path -LiteralPath (Join-Path $extractRoot 'UserData') -PathType Container)) {
    throw "Portable UserData directory not found under $extractRoot"
  }

  return @{
    Root = $extractRoot
    Executable = $executable
  }
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

  $releasePackage = Get-ChildItem -Path (Join-Path $Root 'squirrel.windows') -Filter '*-full.nupkg' -Recurse | Select-Object -First 1
  if ($releasePackage -eq $null) {
    throw "Installer release package not found under $(Join-Path $Root 'squirrel.windows')"
  }
  $applicationId = $releasePackage.BaseName -replace '-\d+\.\d+\.\d+-full$', ''
  $installRoot = Join-Path $env:LOCALAPPDATA $applicationId
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
    for ($attempt = 0; $attempt -lt 60 -and $installedExe -eq $null; $attempt += 1) {
      if (Test-Path -LiteralPath $installRoot) {
        $installedExe = Get-ChildItem -Path $installRoot -Filter '*.exe' -Recurse |
          Where-Object { $_.Name -eq 'Quiz Stage.exe' } |
          Select-Object -First 1
      }
      if ($installedExe -eq $null) { Start-Sleep -Seconds 1 }
    }
    if ($installedExe -eq $null) {
      throw "No installed executable found under $installRoot"
    }

    Invoke-PackageSmoke -Executable $installedExe.FullName -ModeLabel 'Installer'

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
  $portable = Resolve-PortablePackage -Root $packageRoot
  try {
    Invoke-PackageSmoke -Executable $portable.Executable -ModeLabel 'Portable'
  }
  finally {
    Remove-TemporaryDirectory -Path $portable.Root -ExpectedPrefix 'quiz-stage-portable-smoke-'
  }
}

if ($Mode -eq 'Installer' -or $Mode -eq 'Both') {
  Invoke-InstallerPackage -Root $packageRoot
}
