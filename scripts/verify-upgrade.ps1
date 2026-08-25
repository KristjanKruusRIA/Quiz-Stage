Param(
  [string]$PackageRoot = 'out/make'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path -Path (Get-Location) -ErrorAction Stop
$fixtureRoot = Join-Path $root 'tests\fixtures\previous-version\UserData'
$portableArchive = Join-Path $PackageRoot 'portable\QuizStage-win32-x64.zip'

if (-not (Test-Path -LiteralPath $portableArchive -PathType Leaf)) {
  throw "Portable package not found at $portableArchive"
}
if (-not (Test-Path -LiteralPath $fixtureRoot -PathType Container)) {
  throw "Previous-version fixture not found at $fixtureRoot"
}

function Remove-TemporaryDirectory {
  param([string]$Path)

  $resolved = [IO.Path]::GetFullPath($Path)
  $temporaryRoot = [IO.Path]::GetFullPath($env:TEMP + [IO.Path]::DirectorySeparatorChar)
  if (-not $resolved.StartsWith($temporaryRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove non-temporary directory: $resolved"
  }
  if (-not [IO.Path]::GetFileName($resolved).StartsWith('quiz-stage-upgrade-check-', [StringComparison]::Ordinal)) {
    throw "Refusing to remove unexpected temporary directory: $resolved"
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
}

function Invoke-UpgradeCheck {
  param([string]$Workspace)

  $applicationRoot = Join-Path $Workspace 'Application'
  New-Item -ItemType Directory -Path $applicationRoot | Out-Null
  Expand-Archive -LiteralPath $portableArchive -DestinationPath $applicationRoot -Force

  $executable = Join-Path $applicationRoot 'Quiz Stage.exe'
  if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
    throw "Portable executable not found at $executable"
  }

  $fixtureCopy = Join-Path $applicationRoot 'UserData'
  if (-not (Test-Path -LiteralPath $fixtureCopy -PathType Container)) {
    throw "Portable UserData directory not found at $fixtureCopy"
  }
  Copy-Item -Path (Join-Path $fixtureRoot '*') -Destination $fixtureCopy -Recurse -Force

  $databasePath = Join-Path $fixtureCopy 'quiz-stage.sqlite'
  $backupRoot = Join-Path $fixtureCopy 'backups'
  $applicationProcess = Start-Process -FilePath $executable -ArgumentList '--quiz-stage-e2e-network-guard' -WorkingDirectory $applicationRoot -WindowStyle Hidden -PassThru
  $backup = $null
  try {
    for ($attempt = 0; $attempt -lt 100 -and $backup -eq $null; $attempt += 1) {
      if ($applicationProcess.HasExited) {
        throw "Packaged application exited before migration completed: $($applicationProcess.ExitCode)"
      }
      if (Test-Path -LiteralPath $backupRoot -PathType Container) {
        $backup = Get-ChildItem -LiteralPath $backupRoot -Filter '*.bak' | Select-Object -First 1
      }
      if ($backup -eq $null) { Start-Sleep -Milliseconds 100 }
    }
    if ($backup -eq $null) {
      throw "Packaged application did not create a migration backup under $backupRoot"
    }
    Start-Sleep -Seconds 1
  }
  finally {
    if (-not $applicationProcess.HasExited) {
      & taskkill.exe /PID $applicationProcess.Id /T /F | Out-Null
      $applicationProcess.WaitForExit(5000) | Out-Null
    }
  }

  & npx tsx scripts/verify-upgrade-data.ts $databasePath $backup.FullName $fixtureRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Upgrade validation failed in workspace $Workspace"
  }
}

$fixtureDatabase = Join-Path $fixtureRoot 'quiz-stage.sqlite'
$fixtureLogo = Join-Path $fixtureRoot 'media\logo.png'
$databaseHashBefore = (Get-FileHash -LiteralPath $fixtureDatabase -Algorithm SHA256).Hash
$logoHashBefore = (Get-FileHash -LiteralPath $fixtureLogo -Algorithm SHA256).Hash
$workspace = Join-Path $env:TEMP ("quiz-stage-upgrade-check-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $workspace | Out-Null
try {
  Invoke-UpgradeCheck -Workspace $workspace
}
finally {
  Remove-TemporaryDirectory -Path $workspace
}

if ((Get-FileHash -LiteralPath $fixtureDatabase -Algorithm SHA256).Hash -ne $databaseHashBefore) {
  throw 'Committed upgrade database fixture changed during verification'
}
if ((Get-FileHash -LiteralPath $fixtureLogo -Algorithm SHA256).Hash -ne $logoHashBefore) {
  throw 'Committed upgrade media fixture changed during verification'
}
