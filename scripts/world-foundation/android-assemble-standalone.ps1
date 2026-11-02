param(
  [string]$HostDirectory = 'E:\SYSTEM\.tmp\system-world-foundation\rn-host',
  [string]$UnityExport = 'E:\SYSTEM\.tmp\system-world-foundation\unity-export',
  [string]$CDriveJunction = 'C:\SYSTEM\world-foundation-rn-host',
  [string]$GradleHomeLong = 'E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home',
  [string]$GradleHomeDrive = 'G:',
  [string]$DistDirectory = 'C:\SYSTEM\SYSTEM-RC2\dist\world-foundation-device-beta'
)
$ErrorActionPreference='Stop'
$androidPlayer = 'C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer'
$javaHome = Join-Path $androidPlayer 'OpenJDK'
$unityNdk = Join-Path $androidPlayer 'NDK'
$overlay = 'E:\SYSTEM\.tmp\system-world-foundation\android\sdk-overlay'
$expoNdk = Join-Path $overlay 'ndk\27.1.12297006'
if (!(Test-Path -LiteralPath (Join-Path $javaHome 'bin\java.exe'))) { throw "Unity OpenJDK missing: $javaHome" }
if (!(Test-Path -LiteralPath (Join-Path $unityNdk 'source.properties'))) { throw "Unity NDK missing: $unityNdk" }
if (!(Test-Path -LiteralPath (Join-Path $expoNdk 'source.properties'))) { throw "Expo catalog NDK missing: $expoNdk. Run android-sdk-overlay.ps1 first." }
if (!(Test-Path -LiteralPath (Join-Path $UnityExport 'unityLibrary\build.gradle'))) { throw 'unityLibrary export missing' }
if (!(Test-Path -LiteralPath (Join-Path $HostDirectory 'android\gradlew.bat'))) { throw 'isolated host android missing' }

# Preserve prior Metro-debug secured artifact; never delete/overwrite it.
$prior = Join-Path $DistDirectory 'SYSTEM-WORLD-FOUNDATION-DEVICE-BETA-20261102-200813.apk'
if (Test-Path -LiteralPath $prior) {
  $priorSha = (Get-FileHash -LiteralPath $prior -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($priorSha -ne '1fad2534572cda5386086c3d1102e770aaa2f0024b5d567918189c16fc97bac2') {
    throw "Prior Metro-debug APK hash drift: $priorSha"
  }
  Write-Output "Preserved Metro-debug APK SHA-256=$priorSha"
}

$exportProps = Get-Content -LiteralPath (Join-Path $UnityExport 'gradle.properties')
$hostPropsPath = Join-Path $HostDirectory 'android\gradle.properties'
$hostProps = Get-Content -LiteralPath $hostPropsPath
foreach ($line in $exportProps) {
  if ($line -match '^(unity\.|unityStreamingAssets=|unityTemplateVersion=|unityProjectPath=)') {
    $key = ($line -split '=',2)[0]
    if ($hostProps -notmatch [regex]::Escape($key + '=')) { Add-Content $hostPropsPath $line }
  }
}
$extra = @(
  'kotlin.incremental=false',
  'kotlin.incremental.java=false',
  'kotlin.compiler.execution.strategy=in-process',
  'kotlin.daemon.enabled=false',
  'org.gradle.unsafe.configuration-cache=false',
  'org.gradle.caching=false',
  'org.gradle.parallel=false',
  'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m',
  'expo.useLegacyPackaging=true',
  'android.experimental.suppressExtractNativeLibsWarnings=true',
  'hermesEnabled=true',
  'newArchEnabled=true',
  'android.enableMinifyInReleaseBuilds=false',
  'android.enableShrinkResourcesInReleaseBuilds=false'
)
$hostText = Get-Content -LiteralPath $hostPropsPath -Raw
foreach ($line in $extra) {
  $key = ($line -split '=',2)[0]
  if ($hostText -match "(?m)^$([regex]::Escape($key))=.*$") {
    $hostText = [regex]::Replace($hostText, "(?m)^$([regex]::Escape($key))=.*$", $line)
  } else {
    $hostText = $hostText.TrimEnd() + "`r`n$line`r`n"
  }
}
Set-Content -LiteralPath $hostPropsPath -Value $hostText -NoNewline

# Mark release as standalone test variant (debug keystore; not production). Keep debug path unchanged.
$appGradle = Join-Path $HostDirectory 'android\app\build.gradle'
$appText = Get-Content -LiteralPath $appGradle -Raw
if ($appText -match 'versionCode 1') {
  $appText = $appText.Replace('versionCode 1', 'versionCode 2')
}
if ($appText -notmatch 'versionNameSuffix "-standalone"') {
  $appText = $appText.Replace(
    'signingConfig signingConfigs.debug' + "`r`n            def enableShrinkResources",
    "signingConfig signingConfigs.debug`r`n            versionNameSuffix `"-standalone`"`r`n            def enableShrinkResources"
  )
  if ($appText -notmatch 'versionNameSuffix "-standalone"') {
    $appText = $appText.Replace(
      'signingConfig signingConfigs.debug' + "`n            def enableShrinkResources",
      "signingConfig signingConfigs.debug`n            versionNameSuffix `"-standalone`"`n            def enableShrinkResources"
    )
  }
  # Only the release block should get the suffix — if replace hit debug first, fix by ensuring release contains it.
  if ($appText -notmatch '(?s)release \{.*?versionNameSuffix "-standalone"') {
    throw 'Failed to mark release buildType as standalone test variant'
  }
}
# Strip accidental versionCode from BuildType if a prior run left it
$appText = [regex]::Replace($appText, '(?m)^\s*versionCode 2\s*\r?\n(?=\s*def enableShrinkResources)', '')
Set-Content -LiteralPath $appGradle -Value $appText

if (Test-Path -LiteralPath $CDriveJunction) {
  $item = Get-Item -LiteralPath $CDriveJunction
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { cmd /c "rmdir `"$CDriveJunction`"" }
  elseif ($item.PSIsContainer) { throw "Refusing to replace non-junction $CDriveJunction" }
}
New-Item -ItemType Junction -Path $CDriveJunction -Target $HostDirectory | Out-Null

$mapped = @(cmd /c subst)
$driveLetter = $GradleHomeDrive.TrimEnd(':')
$current = $mapped | Where-Object { $_ -match "^${driveLetter}:" }
if ($current) {
  $target = ($current -split '=>',2)[1].Trim()
  if ([IO.Path]::GetFullPath($target).TrimEnd('\') -ne [IO.Path]::GetFullPath($GradleHomeLong).TrimEnd('\')) {
    cmd /c "subst ${driveLetter}: /d" | Out-Null
    $current = $null
  }
}
if (-not $current) {
  cmd /c "subst ${driveLetter}: `"$GradleHomeLong`""
  if ($LASTEXITCODE -ne 0) { throw "subst ${driveLetter}: failed for $GradleHomeLong" }
}
$gradleHomeShort = $GradleHomeDrive + '\'
if (!(Test-Path -LiteralPath (Join-Path $gradleHomeShort 'wrapper'))) {
  throw "Short Gradle home $gradleHomeShort is not readable after subst"
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $overlay
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_NDK_HOME = $expoNdk
Remove-Item Env:ANDROID_NDK_ROOT -ErrorAction SilentlyContinue
$env:GRADLE_USER_HOME = $gradleHomeShort
$env:NODE_ENV = 'production'
$env:EXPO_NO_TELEMETRY = '1'
$androidDir = Join-Path $CDriveJunction 'android'
Write-Output "assembleRelease standalone from $androidDir NODE_ENV=$env:NODE_ENV GRADLE_USER_HOME=$env:GRADLE_USER_HOME"
Write-Output "Unity NDK (IL2CPP): $unityNdk"
Write-Output "Expo NDK (RN/CMake): $expoNdk"
Write-Output "Signing: debug.keystore only (not production)"
Set-Location $androidDir
& .\gradlew.bat --stop | Out-Host
& .\gradlew.bat --no-daemon --no-build-cache --console plain :app:assembleRelease "-PreactNativeArchitectures=arm64-v8a" --warning-mode summary
if ($LASTEXITCODE -ne 0) { throw "assembleRelease failed: $LASTEXITCODE" }

$built = Get-ChildItem -Path (Join-Path $androidDir 'app\build\outputs\apk\release') -Recurse -Filter '*.apk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $built) { throw 'Release APK missing under app/build/outputs/apk/release' }
Write-Output ("BUILT {0} bytes={1}" -f $built.FullName, $built.Length)

New-Item -ItemType Directory -Force $DistDirectory | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$destName = "SYSTEM-WORLD-FOUNDATION-STANDALONE-$stamp.apk"
$dest = Join-Path $DistDirectory $destName
if (Test-Path -LiteralPath $dest) { throw "Refusing to overwrite $dest" }
[IO.File]::Copy($built.FullName, $dest, $false)
$sha = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath "$dest.sha256" -Value "$sha  $destName`n" -NoNewline
Write-Output ("SECURED {0}" -f $dest)
Write-Output ("SHA256={0}" -f $sha)
Write-Output ("BYTES={0}" -f (Get-Item -LiteralPath $dest).Length)
