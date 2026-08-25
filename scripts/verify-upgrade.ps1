Param(
  [string]$PackageRoot = 'out/make'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path -Path (Get-Location) -ErrorAction Stop
$fixtureRoot = Join-Path $root 'tests\fixtures\previous-version\UserData'
$portableArchive = Join-Path $PackageRoot 'portable\QuizStage-win32-x64.zip'
$installerSetup = Get-ChildItem -Path (Join-Path $PackageRoot 'squirrel.windows') -Filter '* Setup.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not (Test-Path -LiteralPath $portableArchive) -and $installerSetup -eq $null) {
  throw "Package artifacts not found in $PackageRoot"
}
if (-not (Test-Path -LiteralPath $fixtureRoot)) {
  throw "Previous-version fixture not found at $fixtureRoot"
}

$migrationSql = Join-Path $root 'src\main\persistence\sql\002_category_set_overrides.sql'

function Invoke-UpgradeCheck {
  param([string]$Workspace)

  $fixtureCopy = Join-Path $Workspace 'UserData'
  New-Item -ItemType Directory -Path $fixtureCopy | Out-Null
  Copy-Item -Path (Join-Path $fixtureRoot '*') -Destination $fixtureCopy -Recurse -Force

  $databasePath = Join-Path $fixtureCopy 'quiz-stage.sqlite'
  if (-not (Test-Path -LiteralPath $databasePath)) {
    throw "Fixture database not copied correctly: $databasePath"
  }

  $checker = Join-Path $Workspace 'verify-upgrade-check.js'
  $script = @'
const fs = require('node:fs');
const Database = require('better-sqlite3');

const databasePath = process.argv[2];
const migrationPath = process.argv[3];

function run(sql) {
  return fs.readFileSync(sql, 'utf8');
}

const database = new Database(databasePath);
  try {
  const schemaVersion = database.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_version').pluck().get();
  if (schemaVersion === 0) {
    throw new Error('Missing schema_version in fixture');
  }
  if (schemaVersion === 1) {
    database.exec(run(migrationPath));
    database.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(2, Date.now());
  } else if (schemaVersion !== 2) {
    throw new Error(`Unexpected schema version ${schemaVersion}`);
  }

  const count = (sql, params = []) => Number(database.prepare(sql).pluck().get(...params));
  const countAll = (sql, params = []) => Number(database.prepare(sql).all(...params).length);
  if (count('SELECT COUNT(*) FROM schema_version WHERE version = 2') !== 1) {
    throw new Error('Schema did not migrate to version 2');
  }
  if (count('SELECT COUNT(*) FROM content_packs WHERE id = ?', ['previous-version-pack']) !== 1) {
    throw new Error('Custom pack missing after migration');
  }
  if (count('SELECT COUNT(*) FROM clues WHERE id = ?', ['previous-version-round-one-clue-100']) !== 1) {
    throw new Error('Custom clue missing after migration');
  }
  if (count('SELECT COUNT(*) FROM settings WHERE key = ? OR key = ?', ['audio', 'appearance']) !== 2) {
    throw new Error('Expected non-default settings were not preserved');
  }
  if (count('SELECT COUNT(*) FROM matches WHERE completed_at IS NOT NULL') < 1) {
    throw new Error('Expected completed history match missing after migration');
  }
  if (count('SELECT COUNT(*) FROM matches WHERE completed_at IS NULL') < 1) {
    throw new Error('Expected incomplete autosave match missing after migration');
  }
  if (count('SELECT COUNT(*) FROM content_reports') !== 1) {
    throw new Error('Expected report row missing after migration');
  }
} finally {
  database.close();
}
'@

  Set-Content -Path $checker -Value $script -NoNewline
  $originalNodePath = $env:NODE_PATH
  $env:NODE_PATH = Join-Path $root 'node_modules'
  try {
    & node $checker $databasePath $migrationSql
  } finally {
    $env:NODE_PATH = $originalNodePath
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Upgrade validation failed in workspace $Workspace"
  }

  Remove-Item -Path $checker -Force -ErrorAction SilentlyContinue
}

$workspace = Join-Path $env:TEMP ("quiz-stage-upgrade-check-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $workspace | Out-Null
try {
  Invoke-UpgradeCheck -Workspace $workspace
}
finally {
  Remove-Item -Path $workspace -Recurse -Force -ErrorAction SilentlyContinue
}
