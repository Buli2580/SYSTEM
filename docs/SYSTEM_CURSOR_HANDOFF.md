# SYSTEM CURSOR HANDOFF — WORLD FOUNDATION

For Codex / Claude Code / next Cursor. Read this before touching RC3 or the official APK.

## Git

- Worktree: `C:\SYSTEM\SYSTEM-RC2`
- Branch: `feature/system-world-foundation-1`
- Baseline: `370f9a49e5cad296dde7bee22ce412cfa92111ba` (`docs: preserve SYSTEM audit and WORLD 1.0 roadmap baseline`)
- Do not work on `master`. Do not force-push. Do not `reset --hard` / `clean -fd`.
- Unity Editor project (not this git root): `C:\SYSTEM\SYSTEM-UNITY-WORLD`. Keep `_SYSTEM` sources mirrored into `experiments/world-foundation/unity`.

## What changed after Codex

Codex delivered the bridge contract, TEMP scene bootstrap, native Java transport, isolated Expo host recipe, and docs drafts. This Cursor pass:

- Verified and extended Unity runtime (locomotion hold, portal proximity, camera tag, URP restore on destroy, quality getters).
- Synced `WorldBridgeClient` account/dispose/snapshot request, recorder `fffZ` timestamps, extra EditMode/PlayMode tests, saved scene.
- Wired isolated host `index.js` to `createWorldHost` (ACK after allowed UI/quality/snapshot only).
- Exported real `unityLibrary`. Fixed connect script (`-LiteralPath`, NDK ext, overlay notes, `unityStreamingAssets`).
- Re-ran TS/Unity/native tests honestly.

## Tests (this machine, 2026-11-02)

See `docs/SYSTEM_WORLD_FOUNDATION_REPORT.md` and `docs/SYSTEM_WORLD_DEVICE_BETA_READINESS.md`. Short form:

- tsc PASS
- world-bridge + asset + benchmark unit PASS 35/35
- codec parity 11/8 PASS
- gameplay.test.cjs PASS 322/322
- Unity EditMode 14/14 PASS
- Unity PlayMode 9/9 PASS
- Unity ExportAndroid PASS
- native BridgeGate PASS
- Gradle assembleDebug **PASS** (Metro) — preserved  
  `SYSTEM-WORLD-FOUNDATION-DEVICE-BETA-20261102-200813.apk` SHA-256 `1fad2534572cda5386086c3d1102e770aaa2f0024b5d567918189c16fc97bac2`
- Gradle assembleRelease standalone **PASS** (embedded `assets/index.android.bundle`; debug keystore)  
  `SYSTEM-WORLD-FOUNDATION-STANDALONE-20261102-204801.apk` SHA-256 `c16f43844daa9b6d1954b9cf7ef62eb181b1a33ca5ad496c88fbf4b87ec2b2ec`
- physical Android **NOT TESTED**

## Unity status

Scene `Assets/_SYSTEM/Scenes/WORLD_FOUNDATION.unity` is a bootstrap object. Content is created at runtime. TEMP avatar is intentional until M1 is rigged. Open Editor **6000.6.4f1** only. Never two Editors on one project. Lockfile: if `Temp\UnityLockfile` remains after `Unity.exe` (Editor, not Hub `unity.exe serve`) has exited, it is stale.

Verify: `powershell -File scripts/world-foundation/unity-verify.ps1 -Mode EditMode|PlayMode|ExportAndroid`

## Android status / how to continue the APK

Scratch only:

- Host: `E:\SYSTEM\.tmp\system-world-foundation\rn-host`
- Export: `E:\SYSTEM\.tmp\system-world-foundation\unity-export`
- Overlay SDK: `E:\SYSTEM\.tmp\system-world-foundation\android\sdk-overlay`
- Gradle home: `E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home` (keep; first-run Kotlin accessors timed out)

```powershell
$env:JAVA_HOME='C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Data\PlaybackEngines\AndroidPlayer\OpenJDK'
$env:ANDROID_HOME='E:\SYSTEM\.tmp\system-world-foundation\android\sdk-overlay'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:GRADLE_USER_HOME='E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home'
Set-Location E:\SYSTEM\.tmp\system-world-foundation\rn-host\android
.\gradlew.bat --no-daemon --console plain :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

If AGP hangs after “Probably the SDK is read-only”, replace overlay junctions for `build-tools`/`platforms` with writable copies of `package.xml` (do not write into `Program Files\Unity`). Do not run `sdkmanager --licenses` against the Unity SDK. Do not install over RC3.

Reconnect after script edits: `scripts/world-foundation/android-connect-host.ps1` (expects the export). Materialize protocol/host: `android-materialize-host.ps1`.

## Next work (priority)

1. On a physically attached phone (never uninstall RC3): follow `docs/SYSTEM_WORLD_DEVICE_BETA_READINESS.md` — Metro + `adb reverse`, install secured APK, launch/return ×5–10, pause/resume, process death + re-INIT, joystick + portal. Record JSONL with `WorldFrameRecorder` then `node scripts/world-foundation/benchmark.cjs` only with `android-physical`.
2. Optional later: release-style embed of JS bundle for Metro-free smoke (still debug or separate spike signing — never production cert).
3. Mount host in SYSTEM only behind an explicit experimental flag; keep journal on `system-world-bridge-v1.db`.
4. M1 rig remains blocked (no skins). Keep TEMP avatar labeled. Do not integrate REAL WORLD 2.1 into this spike yet.

## Do not do

Production deploy, official APK overwrite, signing change, gameplay SQLite reset, CHARACTER-FACTORY master overwrite, `reset-project`, Git history rewrite, claiming 30 FPS without a phone recording.
