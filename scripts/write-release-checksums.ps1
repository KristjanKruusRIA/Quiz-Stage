Param(
  [string]$PackageRoot = 'out/make'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$resolvedRoot = [IO.Path]::GetFullPath($PackageRoot)
$artifacts = @(
  'installer\QuizStageSetup.exe',
  'portable\QuizStage-win32-x64.zip'
)
$lines = foreach ($relativePath in $artifacts) {
  $artifact = Join-Path $resolvedRoot $relativePath
  if (-not (Test-Path -LiteralPath $artifact -PathType Leaf)) {
    throw "Release artifact not found: $artifact"
  }
  $hash = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash
  "{0}  {1}" -f $hash, $relativePath.Replace('\', '/')
}

$destination = Join-Path $resolvedRoot 'release-checksums.txt'
[IO.File]::WriteAllLines($destination, $lines, [Text.UTF8Encoding]::new($false))
