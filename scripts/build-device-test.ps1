# SYSTEM Beta Device Test - Windows, in a clean fresh git worktree.
# Tokens stay in Expo login or environment; never paste them into this file.
# -SkipRootInstall can be used only after a completed successful npm ci in this checkout.
param([switch]$SkipRootInstall)
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
function Invoke-CheckedStep {
  param([string]$Name, [scriptblock]$Action)
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE. APK build was not started."
  }
}
Write-Host "SYSTEM APK snapshot: $(git rev-parse --short HEAD)"
if ($SkipRootInstall) {
  foreach ($required in @('node_modules/.package-lock.json', 'node_modules/expo/package.json', 'node_modules/typescript/package.json')) {
    if (-not (Test-Path $required)) { throw "Cannot skip npm install: missing $required" }
  }
  Write-Host "Skipping root npm ci: use this only after a completed successful installation in this checkout." -ForegroundColor Yellow
} else {
  Invoke-CheckedStep 'Install pinned npm dependencies' { npm.cmd ci --no-audit --no-fund }
}
Invoke-CheckedStep 'Validate Expo configuration' { npx.cmd expo config --type public | Out-Null }
Invoke-CheckedStep 'Validate TypeScript' { npx.cmd tsc --noEmit --incremental false }
$tests = @(Get-ChildItem 'src/system2/tests/*.test.cjs' | ForEach-Object { $_.FullName })
if ($tests.Count -eq 0) { throw 'No SYSTEM gameplay tests found.' }
Invoke-CheckedStep 'Run all SYSTEM tests' { node.exe --test @tests }
Invoke-CheckedStep 'Install Supabase test dependencies' { npm.cmd ci --prefix supabase/tests --ignore-scripts --no-audit --no-fund }
Invoke-CheckedStep 'Run Supabase tests' { npm.cmd test --prefix supabase/tests }
Invoke-CheckedStep 'Bundle Android JavaScript' { npx.cmd expo export --platform android --output-dir .expo-device-test-check }
# Do not upload the export-check folder as part of the subsequent cloud EAS source archive.
Remove-Item '.expo-device-test-check' -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "`nValidation passed. Starting EAS Android APK build..." -ForegroundColor Green
Invoke-CheckedStep 'Build installable Android APK on Expo EAS' { npx.cmd eas-cli@latest build --platform android --profile device-test }
Write-Host "`nEAS prints the APK download link and QR code above." -ForegroundColor Green
