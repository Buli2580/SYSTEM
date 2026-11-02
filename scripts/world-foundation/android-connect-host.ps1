param([string]$HostDirectory = 'E:\SYSTEM\.tmp\system-world-foundation\rn-host', [string]$UnityExport = 'E:\SYSTEM\.tmp\system-world-foundation\unity-export')
$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source=Join-Path $repo 'experiments\world-foundation\android'
if (!(Test-Path "$UnityExport\unityLibrary\build.gradle")) { throw "Real Unity export missing at $UnityExport\unityLibrary\build.gradle. Export Android Gradle project from Unity first; no placeholder engine is allowed." }
if (!(Test-Path "$HostDirectory\android\app\build.gradle")) { throw 'Generate the separate Expo host first; see host README.' }
$appGradle="$HostDirectory\android\app\build.gradle"
if (!(Select-String -LiteralPath $appGradle -SimpleMatch "applicationId 'pl.systemworld.foundation.spike'" -Quiet)) { throw 'Refusing to patch any other Android applicationId' }
$native="$HostDirectory\android\app\src\main\java\com\system\worldfoundation"
New-Item -ItemType Directory -Force $native | Out-Null
Copy-Item -Path "$source\src\main\java\com\system\worldfoundation\*.java" -Destination $native -Force
$main="$HostDirectory\android\app\src\main\java\pl\systemworld\foundation\spike\MainApplication.kt"
$text=Get-Content $main -Raw
if (!$text.Contains('add(com.system.worldfoundation.WorldBridgePackage())')) { $text=$text.Replace('// add(MyReactNativePackage())','add(com.system.worldfoundation.WorldBridgePackage())'); Set-Content $main $text }
$settings="$HostDirectory\android\settings.gradle"
if (!(Select-String -LiteralPath $settings -SimpleMatch "include ':unityLibrary'" -Quiet)) {
 $exportPath=$UnityExport.Replace('\','/')
 Add-Content $settings "`ninclude ':unityLibrary'`nproject(':unityLibrary').projectDir = new File('$exportPath/unityLibrary')"
}
$unityGradle="$UnityExport\unityLibrary\build.gradle"
$unityGradleText=Get-Content -LiteralPath $unityGradle -Raw
if ($unityGradleText -match "implementation fileTree\(dir: 'libs', include: \['\*\.jar'\]\)") {
 $unityGradleText=$unityGradleText.Replace("implementation fileTree(dir: 'libs', include: ['*.jar'])", "api fileTree(dir: 'libs', include: ['*.jar'])")
 Set-Content -LiteralPath $unityGradle -Value $unityGradleText
}
$appGradleText=Get-Content -LiteralPath $appGradle -Raw
$appGradleText=$appGradleText -replace '(?s)\r?\ndependencies \{ implementation project\('':unityLibrary''\) \}\r?\nandroid \{ defaultConfig \{ minSdkVersion 31 \} \}\s*',"`n"
if ($appGradleText -notmatch "implementation project\(':unityLibrary'\)") {
 $appGradleText=$appGradleText.Replace('implementation("com.facebook.react:react-android")', "implementation(`"com.facebook.react:react-android`")`n    implementation project(':unityLibrary')")
}
if ($appGradleText -match 'minSdkVersion rootProject.ext.minSdkVersion') {
 $appGradleText=$appGradleText.Replace('minSdkVersion rootProject.ext.minSdkVersion','minSdkVersion 31')
}
Set-Content -LiteralPath $appGradle $appGradleText
$manifest="$HostDirectory\android\app\src\main\AndroidManifest.xml"
[xml]$doc=Get-Content $manifest
$androidNs='http://schemas.android.com/apk/res/android'
$toolsNs='http://schemas.android.com/tools'
$doc.DocumentElement.SetAttribute('xmlns:tools','http://schemas.android.com/tools')
$appNode=$doc.manifest.application
$appNode.SetAttribute('enableOnBackInvokedCallback',$androidNs,'true')
$appNode.SetAttribute('replace',$toolsNs,'android:enableOnBackInvokedCallback')
$hasUnityActivity=@($doc.manifest.application.activity) | Where-Object { $_.GetAttribute('name',$androidNs) -eq 'com.system.worldfoundation.WorldUnityActivity' }
if (!$hasUnityActivity) {
 [xml]$fragment=Get-Content "$source\src\main\AndroidManifest.xml"
 $node=$doc.ImportNode($fragment.manifest.application.activity,$true)
 $doc.manifest.application.AppendChild($node) | Out-Null
}
$doc.Save($manifest)
$overlay = 'E:\SYSTEM\.tmp\system-world-foundation\android\sdk-overlay'
$expoNdk = Join-Path $overlay 'ndk\27.1.12297006'
$unityNdk = 'C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer\NDK'
if (!(Test-Path -LiteralPath (Join-Path $expoNdk 'source.properties'))) { throw "Expo catalog NDK missing at $expoNdk. Run android-sdk-overlay.ps1 first." }
if (!(Test-Path -LiteralPath (Join-Path $unityNdk 'source.properties'))) { throw "Unity Android NDK missing at $unityNdk" }
$ndkRevision = (Select-String -LiteralPath (Join-Path $expoNdk 'source.properties') -Pattern 'Pkg.Revision = (.+)').Matches[0].Groups[1].Value.Trim()
$sdkEscaped = $overlay.Replace('\','\\')
$ndkPosix = $expoNdk.Replace('\','/')
Set-Content -LiteralPath "$HostDirectory\android\local.properties" -Value "sdk.dir=$sdkEscaped`n"
$rootGradle = "$HostDirectory\android\build.gradle"
$rootText = Get-Content -LiteralPath $rootGradle -Raw
$extBlock = @"
ext {
  ndkVersion = "$ndkRevision"
  ndkPath = "$ndkPosix"
}

"@
if ($rootText -match '(?s)ext \{\s*ndkVersion = .*?ndkPath = .*?\}\r?\n') {
 $rootText = [regex]::Replace($rootText, '(?s)ext \{\s*ndkVersion = .*?ndkPath = .*?\}\r?\n', $extBlock)
} elseif ($rootText -notmatch 'ndkPath = ') {
 $rootText = $rootText.Replace('apply plugin: "expo-root-project"', $extBlock + 'apply plugin: "expo-root-project"')
}
Set-Content -LiteralPath $rootGradle $rootText
$appGradleText = Get-Content -LiteralPath $appGradle -Raw
$appGradleText = [regex]::Replace($appGradleText, "ndkVersion\s+(rootProject\.ext\.ndkVersion|'[^']+'|""[^""]+"")", "ndkVersion '$ndkRevision'")
Set-Content -LiteralPath $appGradle $appGradleText
$gradleProps = "$HostDirectory\android\gradle.properties"
$props = Get-Content $gradleProps -Raw
if ($props -notmatch 'android.ndkVersion=') {
 Add-Content $gradleProps "`nandroid.ndkVersion=$ndkRevision`norg.gradle.configuration-cache=false`n"
} else {
 $props = [regex]::Replace($props, 'android\.ndkVersion=.*', "android.ndkVersion=$ndkRevision")
 Set-Content -LiteralPath $gradleProps $props
}
if ((Get-Content $gradleProps -Raw) -notmatch 'unityStreamingAssets=') { Add-Content $gradleProps "`nunityStreamingAssets=`nunityTemplateVersion=26`n" }
# Drop the old one-shot Ninja rewrite hook if present. Path length is handled by
# GRADLE_USER_HOME=G:\ (subst of the real gradle-home) in android-assemble-debug.ps1.
$rootGradle = "$HostDirectory\android\build.gradle"
if (Select-String -LiteralPath $rootGradle -SimpleMatch 'rewriteCxxNinjaToShortGradleHome' -Quiet) {
  Set-Content -LiteralPath $rootGradle -Value @"
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}

ext {
  ndkVersion = "$ndkRevision"
  ndkPath = "$ndkPosix"
}
apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
"@
}
Write-Output "Prepared isolated host: Expo/RN NDK $ndkRevision from overlay; Unity IL2CPP keeps unity.androidNdkPath. Assemble via android-assemble-debug.ps1 with GRADLE_USER_HOME on short subst drive G:. No build or device installation performed."
