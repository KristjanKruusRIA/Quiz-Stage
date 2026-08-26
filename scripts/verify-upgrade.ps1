Param(
  [string]$PackageRoot = 'out/make'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$portableArchive = Join-Path $PackageRoot 'portable\QuizStage-win32-x64.zip'
& npm.cmd run verify-upgrade -- --target windows-x64 --archive $portableArchive
if ($LASTEXITCODE -ne 0) {
  throw "Upgrade validation failed for $portableArchive"
}
