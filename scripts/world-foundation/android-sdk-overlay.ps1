param(
  [string]$Overlay = 'E:\SYSTEM\.tmp\system-world-foundation\android\sdk-overlay',
  [string]$UnitySdk = 'C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer\SDK',
  [string]$UnityNdk = 'C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer\NDK',
  [string]$StudioSdk = "$env:LOCALAPPDATA\Android\Sdk"
)
$ErrorActionPreference='Stop'
if (!(Test-Path -LiteralPath (Join-Path $UnityNdk 'source.properties'))) { throw "Unity NDK missing: $UnityNdk" }
New-Item -ItemType Directory -Force $Overlay,(Join-Path $Overlay 'ndk') | Out-Null
foreach ($name in @('platforms','platform-tools','cmake','cmdline-tools','tools')) {
  $src = Join-Path $UnitySdk $name
  $dst = Join-Path $Overlay $name
  if (Test-Path -LiteralPath $dst) { continue }
  if (Test-Path -LiteralPath $src) { New-Item -ItemType Junction -Path $dst -Target $src | Out-Null }
}
$licensesSrc = Join-Path $StudioSdk 'licenses'
$licensesDst = Join-Path $Overlay 'licenses'
if ((Test-Path -LiteralPath $licensesSrc) -and -not (Test-Path -LiteralPath $licensesDst)) {
  New-Item -ItemType Junction -Path $licensesDst -Target $licensesSrc | Out-Null
}
$ndkLink = Join-Path $Overlay 'ndk\27.2.12479018'
if (!(Test-Path -LiteralPath $ndkLink)) { New-Item -ItemType Junction -Path $ndkLink -Target $UnityNdk | Out-Null }
$expoNdkSrc = Join-Path $StudioSdk 'ndk\27.1.12297006'
$expoNdkLink = Join-Path $Overlay 'ndk\27.1.12297006'
if (!(Test-Path -LiteralPath $expoNdkSrc)) { throw "Expo catalog NDK missing: $expoNdkSrc" }
if (!(Test-Path -LiteralPath $expoNdkLink)) { New-Item -ItemType Junction -Path $expoNdkLink -Target $expoNdkSrc | Out-Null }
$overlayBt = Join-Path $Overlay 'build-tools'
if (Test-Path -LiteralPath $overlayBt) {
  $item = Get-Item -LiteralPath $overlayBt
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { cmd /c "rmdir `"$overlayBt`"" }
}
New-Item -ItemType Directory -Force $overlayBt | Out-Null
$unity36 = Join-Path $UnitySdk 'build-tools\36.0.0'
$studio35 = Join-Path $StudioSdk 'build-tools\35.0.0'
$link36 = Join-Path $overlayBt '36.0.0'
$link35 = Join-Path $overlayBt '35.0.0'
if ((Test-Path -LiteralPath $unity36) -and -not (Test-Path -LiteralPath $link36)) { New-Item -ItemType Junction -Path $link36 -Target $unity36 | Out-Null }
if ((Test-Path -LiteralPath $studio35) -and -not (Test-Path -LiteralPath $link35)) { New-Item -ItemType Junction -Path $link35 -Target $studio35 | Out-Null }
Write-Output "SDK overlay ready at $Overlay (no Program Files writes, no fabricated licenses)"
