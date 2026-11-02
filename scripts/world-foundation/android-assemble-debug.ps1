param(
  [string]$HostDirectory = 'E:\SYSTEM\.tmp\system-world-foundation\rn-host',
  [string]$UnityExport = 'E:\SYSTEM\.tmp\system-world-foundation\unity-export',
  [string]$CDriveJunction = 'C:\SYSTEM\world-foundation-rn-host',
  [string]$GradleHomeLong = 'E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home',
  [string]$GradleHomeDrive = 'G:'
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
  'android.experimental.suppressExtractNativeLibsWarnings=true'
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

if (Test-Path -LiteralPath $CDriveJunction) {
  $item = Get-Item -LiteralPath $CDriveJunction
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { cmd /c "rmdir `"$CDriveJunction`"" }
  elseif ($item.PSIsContainer) { throw "Refusing to replace non-junction $CDriveJunction" }
}
New-Item -ItemType Junction -Path $CDriveJunction -Target $HostDirectory | Out-Null

# Durable MAX_PATH fix: Gradle/CMake/Ninja must all see the short drive letter.
# G: is a subst of the real gradle-home; do not also point GRADLE_USER_HOME at the long path.
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
$env:NODE_ENV = 'development'
$env:EXPO_NO_TELEMETRY = '1'
$androidDir = Join-Path $CDriveJunction 'android'
Write-Output "assemble from $androidDir NODE_ENV=$env:NODE_ENV GRADLE_USER_HOME=$env:GRADLE_USER_HOME"
Write-Output "Unity NDK (IL2CPP): $unityNdk"
Write-Output "Expo NDK (RN/CMake): $expoNdk"
Set-Location $androidDir
& .\gradlew.bat --stop | Out-Host
& .\gradlew.bat --no-daemon --no-build-cache --console plain :app:assembleDebug "-PreactNativeArchitectures=arm64-v8a" --warning-mode summary
if ($LASTEXITCODE -ne 0) { throw "assembleDebug failed: $LASTEXITCODE" }
$apk = Get-ChildItem -Path (Join-Path $androidDir 'app\build\outputs\apk') -Recurse -Filter '*.apk' | Select-Object -First 5
$apk | ForEach-Object { Write-Output ("APK {0} bytes={1}" -f $_.FullName, $_.Length) }
