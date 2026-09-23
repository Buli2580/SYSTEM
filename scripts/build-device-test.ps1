# SYSTEM Beta Device Test - run on Windows in a fresh worktree.
# Never paste Expo/Supabase tokens here. EAS uses your existing Expo login.
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
function Invoke-CheckedStep {
  param([string]$Name, [scriptblock]$Action)
  Write-Host "\n=== $Name ===" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE. APK build was not started."
  }
}
Write-Host "SYSTEM APK snapshot: $(git rev-parse --short HEAD)"
Invoke-CheckedStep 'Install pinned npm dependencies' { npm.cmd ci --no-audit --no-fund }
Invoke-CheckedStep 'Validate Expo configuration' { npx.cmd expo config --type public | Out-Null }
Invoke-CheckedStep 'Validate TypeScript' { npx.cmd tsc --noEmit --incremental false }
$tests = @(Get-ChildItem 'src/system2/tests/*.test.cjs' | ForEach-Object { $_.FullName })
if ($tests.Count -eq 0) { throw 'No SYSTEM gameplay tests found.' }
Invoke-CheckedStep 'Run all SYSTEM tests' { node.exe --test @tests }
Invoke-CheckedStep 'Install Supabase tests' { npm.cmd ci --prefix supabase/tests --ignore-scripts --no-audit --no-fund }
Invoke-CheckedStep 'Run Supabase tests' { npm.cmd test --prefix supabase/tests }
Invoke-CheckedStep 'Bundle Android JavaScript' { npx.cmd expo export --platform android --output-dir .expo-device-test-check }
Write-Host "\nTests and bundle passed. Starting EAS Android APK build..." -ForegroundColor Green
Invoke-CheckedStep 'Build installable Android APK on Expo EAS' { npx.cmd eas-cli@latest build --platform android --profile device-test }
Write-Host "\nEAS prints the APK download link and QR code above." -ForegroundColor Green
