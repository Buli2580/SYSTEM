# Reproducible isolated Expo 57 host

The host uses only explicit temporary fixture state (level 1, XP 0), never the real player database. `hostBuildSha` is materialized from the actual baseline Git HEAD. `build-metadata.json` separately marks the uncommitted experiment and records canonical protocol/source SHA256 hashes.

Verified against exact Expo SDK57 docs: https://docs.expo.dev/versions/v57.0.0/ . Installed `expo/template.tgz` generated a real Android Gradle RN New Architecture host successfully. SDK57 maps to RN0.86 and Android compile/target36. No npm install, Expo upgrade, production app config, or official signing changes were made.

From repository root, prepare a fresh task-specific directory (do not reuse the production app directory):

```powershell
$spike = 'E:\SYSTEM\.tmp\system-world-foundation\rn-host'
New-Item -ItemType Directory -Force $spike | Out-Null
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/world-foundation/android-materialize-host.ps1 -HostDirectory $spike
New-Item -ItemType Junction -Path "$spike\node_modules" -Target "$PWD\node_modules"
$env:CI='1'
$env:EXPO_NO_TELEMETRY='1'
$env:TEMP="$spike\tmp"
$env:TMP=$env:TEMP
$env:npm_config_cache="$spike\npm-cache"
$env:EXPO_HOME="$spike\expo-home"
New-Item -ItemType Directory -Force $env:TEMP,$env:npm_config_cache,$env:EXPO_HOME | Out-Null
Push-Location $spike
node node_modules/expo/bin/cli prebuild --platform android --no-install --template node_modules/expo/template.tgz
Pop-Location
# Requires a real Unity Android Gradle export; fails explicitly when missing:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/world-foundation/android-connect-host.ps1
```

The fixture imports `./bridge/protocol`, materialized directly from canonical `src/system2/worldBridge/protocol.ts`; all sends use `encodeWorldMessage` and all inbound strings use `decodeWorldMessage(raw,'UNITY_TO_HOST')`, followed by fixture identity/session/revision checks. This fixture only responds to read-only REQUEST_SNAPSHOT and has no durable command executor or mutation ACKs.

The connect command validates the separate applicationId, registers the RN package, copies experimental Java sources, merges the Unity activity manifest and references actual `unityLibrary`. It does not fabricate a library or alter the engine export. Gradle compatibility between Expo's generated host and the exported Unity library remains a build gate.

The real generated host is at `E:\SYSTEM\.tmp\system-world-foundation\rn-host\android`. No complete APK exists yet. After actual export/connection, assemble with installed Gradle and the bundled SDK/JDK, isolated Gradle user home, task-local temp, and a read-only cache parent:

```powershell
$env:JAVA_HOME='C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer\OpenJDK'
$env:ANDROID_HOME='C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer\SDK'
$env:GRADLE_USER_HOME='E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home'
$env:GRADLE_RO_DEP_CACHE="$env:USERPROFILE\.gradle\caches"
Push-Location "$spike\android"
.\gradlew.bat --offline --no-daemon --console plain :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
Pop-Location
```

Offline mode may expose uncached dependencies. An APK assembly success still does not establish JNI, renderer, lifecycle, or physical-device performance PASS. Debug APK needs a Metro server unless JS is explicitly bundled. Do not install or uninstall anything as part of these scripts.


Gradle history: first configure hit Kotlin DSL GenerateProjectAccessors timeout (host-gradle-tasks-escalated.log). Later configures using `E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home` pass plugin compilation. After Unity export, remaining blockers were Expo NDK 27.1 vs Unity NDK 27.2, `ndk.dir` CXX1104, AGP trying to install NDK into the Unity SDK, and missing `unityStreamingAssets`. Use the SDK overlay + root `ext.ndkVersion`/`ndkPath` described in `docs/SYSTEM_CURSOR_HANDOFF.md`. No APK assembly PASS is claimed until `:app:assembleDebug` finishes with an artifact.


Actual Metro validation PASS: Expo Android export bundled579 modules into a1.4MB Hermes bundle using the canonical protocol import and build metadata, at E:\SYSTEM\.tmp\system-world-foundation\android\host-bundle. This verifies JS transformation/bundling only, not RN/native/JNI execution. Evidence: host-bundle.log.

