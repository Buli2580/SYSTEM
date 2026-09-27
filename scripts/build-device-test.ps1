param([Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedSha)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
node.exe scripts/official-apk.cjs --sha $ExpectedSha
if ($LASTEXITCODE -ne 0) { throw 'Official APK build failed. No replacement APK was published.' }
