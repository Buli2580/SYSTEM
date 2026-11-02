param([string]$AndroidPlayer = 'C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer', [string]$Output = 'E:\SYSTEM\.tmp\system-world-foundation\android')
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$source = Join-Path $repo 'experiments\world-foundation\android'
$aar = Get-ChildItem "$env:USERPROFILE\.gradle\caches\modules-2\files-2.1\com.facebook.react\react-android\0.86.3" -Recurse -Filter '*debug.aar' | Select-Object -First 1
if (!$aar) { throw 'Cached RN 0.86.3 debug AAR missing; no dependency installed automatically.' }
New-Item -ItemType Directory -Force "$Output\rn", "$Output\classes" | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Force "$Output\rn\extracted" | Out-Null
$archive = [System.IO.Compression.ZipFile]::OpenRead($aar.FullName)
try { [System.IO.Compression.ZipFileExtensions]::ExtractToFile($archive.GetEntry("classes.jar"), "$Output\rn\extracted\classes.jar", $true) } finally { $archive.Dispose() }
$classpath = "$AndroidPlayer\SDK\platforms\android-36\android.jar;$AndroidPlayer\Variations\il2cpp\Release\Classes\classes.jar;$Output\rn\extracted\classes.jar"
$files = (Get-ChildItem "$source\src\main\java\com\system\worldfoundation\*.java").FullName
& "$AndroidPlayer\OpenJDK\bin\javac.exe" -cp $classpath -d "$Output\classes" "$AndroidPlayer\Source\com\unity3d\player\UnityPlayerActivity.java" @files
if ($LASTEXITCODE -ne 0) { throw 'Native source compilation failed' }
& "$AndroidPlayer\OpenJDK\bin\javac.exe" -cp "$Output\classes" -d "$Output\classes" "$source\tests\BridgeGateTest.java"
if ($LASTEXITCODE -ne 0) { throw 'Gate test compilation failed' }
& "$AndroidPlayer\OpenJDK\bin\java.exe" -cp "$Output\classes" com.system.worldfoundation.BridgeGateTest
if ($LASTEXITCODE -ne 0) { throw 'Gate tests failed' }
& "$AndroidPlayer\OpenJDK\bin\jar.exe" --create --file "$Output\world-bridge-native.jar" -C "$Output\classes" com/system/worldfoundation
if ($LASTEXITCODE -ne 0) { throw 'JAR packaging failed' }
Write-Output "Native compile/test artifact: $Output\world-bridge-native.jar (not APK, not runtime verification)"


