Param(
  [Parameter(Mandatory = $true)]
  [string]$InstallRoot,
  [Parameter(Mandatory = $true)]
  [string]$ReleasePackageName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$packageBaseName = [IO.Path]::GetFileNameWithoutExtension($ReleasePackageName)
$versionMatch = [regex]::Match($packageBaseName, '-(?<Version>\d+\.\d+\.\d+)-full$')
if (-not $versionMatch.Success) {
  throw "Invalid Squirrel release package name: $ReleasePackageName"
}

$executable = Join-Path $InstallRoot "app-$($versionMatch.Groups['Version'].Value)\Quiz Stage.exe"
if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
  throw "INSTALLED_EXECUTABLE_MISSING: Installed executable not found at $executable"
}

(Resolve-Path -LiteralPath $executable).Path
