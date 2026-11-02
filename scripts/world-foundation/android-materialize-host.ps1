param([string]$HostDirectory = 'E:\SYSTEM\.tmp\system-world-foundation\rn-host')
$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source=Join-Path $repo 'experiments\world-foundation\android'
$resolved=[IO.Path]::GetFullPath($HostDirectory)
if ($resolved.StartsWith($repo,[StringComparison]::OrdinalIgnoreCase)) { throw 'Host must be outside production repository; use task scratch.' }
if (Test-Path "$HostDirectory\app.json") {
 $existing=Get-Content "$HostDirectory\app.json" -Raw | ConvertFrom-Json
 if ($existing.expo.android.package -ne 'pl.systemworld.foundation.spike') { throw 'Refusing another app package' }
}
New-Item -ItemType Directory -Force $HostDirectory,"$HostDirectory\bridge" | Out-Null
Copy-Item -LiteralPath "$source\host\package.json","$source\host\app.json","$source\host\index.js" -Destination $HostDirectory -Force
$protocol=Join-Path $repo 'src\system2\worldBridge\protocol.ts'
$bridgeHost=Join-Path $repo 'src\system2\worldBridge\host.ts'
Copy-Item -LiteralPath $protocol,$bridgeHost -Destination "$HostDirectory\bridge" -Force
$sha=(& git -C $repo rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $sha -notmatch '^[a-f0-9]{40}$') { throw 'Cannot resolve real baseline SHA' }
$hashes=@()
$files=@((Get-Item $protocol)) + @(Get-ChildItem "$source\host" -File) + @(Get-ChildItem "$source\src\main\java\com\system\worldfoundation" -Filter '*.java')
foreach ($file in $files) { $hashes+=@{canonicalSource=$file.FullName;sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()} }
@{hostBuildSha=$sha;uncommittedExperiment=$true;protocolCanonicalSource=$protocol;sourceHashes=$hashes} | ConvertTo-Json -Depth 6 | Set-Content "$HostDirectory\build-metadata.json"
Write-Output 'Materialized fixture with canonical protocol codec and source hashes. No npm install, native generation, APK build or device installation performed.'
