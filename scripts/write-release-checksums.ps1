Param(
  [string]$PackageRoot = 'out/make'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

& npx tsx (Join-Path $PSScriptRoot 'write-release-checksums.ts') --target windows-x64 --package-root $PackageRoot
exit $LASTEXITCODE
