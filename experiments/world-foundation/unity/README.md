# SYSTEM WORLD FOUNDATION — experimental Unity module

Editor: **6000.6.4f1 (12bfff696524)**, supported Unity 6 update, **not LTS**. URP **17.6.0** from installed URP template. This is an isolated source mirror of `C:\SYSTEM\SYSTEM-UNITY-WORLD`, not the official APK pipeline. RN retains player, SQLite, quest and reward authority. TEMP avatar is unrigged procedural geometry, not M1.

Open this folder with the exact Editor. `FoundationBuilder.Prepare` saves `Assets/_SYSTEM/Scenes/WORLD_FOUNDATION.unity` and selects it for builds. Runtime bootstrap generates terrain, collisions, temporary articulated avatar, finite portal particles, TPS camera, left touch joystick, right touch look and HUD. Desktop controls: WASD, right mouse drag. Joystick outer edge runs. Portal opens QUESTS through the host only; preview has no host and grants nothing.

## Batch commands (PowerShell)

```
$editor='C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Unity.exe'
$project='C:\SYSTEM\SYSTEM-UNITY-WORLD'
Start-Process $editor -WindowStyle Hidden -Wait -ArgumentList '-batchmode','-nographics','-projectPath',$project,'-executeMethod','FoundationBuilder.Prepare','-quit','-logFile','E:\SYSTEM\.tmp\system-world-foundation\unity\prepare.log'
Start-Process $editor -WindowStyle Hidden -Wait -ArgumentList '-batchmode','-nographics','-projectPath',$project,'-runTests','-testPlatform','EditMode','-testResults','E:\SYSTEM\.tmp\system-world-foundation\unity\editmode.xml','-logFile','E:\SYSTEM\.tmp\system-world-foundation\unity\editmode.log'
Start-Process $editor -WindowStyle Hidden -Wait -ArgumentList '-batchmode','-nographics','-projectPath',$project,'-runTests','-testPlatform','PlayMode','-testResults','E:\SYSTEM\.tmp\system-world-foundation\unity\playmode.xml','-logFile','E:\SYSTEM\.tmp\system-world-foundation\unity\playmode.log'
Start-Process $editor -WindowStyle Hidden -Wait -ArgumentList '-batchmode','-nographics','-projectPath',$project,'-buildTarget','Android','-executeMethod','FoundationBuilder.ExportAndroid','-quit','-logFile','E:\SYSTEM\.tmp\system-world-foundation\unity\android-export.log'
```

Preferred wrapper (refuses to start if `Temp\UnityLockfile` exists):

```
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/world-foundation/unity-verify.ps1 -Mode EditMode
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/world-foundation/unity-verify.ps1 -Mode PlayMode
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/world-foundation/unity-verify.ps1 -Mode ExportAndroid
```

Use separate invocations; never run two Editors against one project. Hub process `unity.exe serve` is not the Editor. The Android method creates an unsigned development ARM64 IL2CPP Gradle export at `E:\SYSTEM\.tmp\system-world-foundation\unity-export`. No account/license changes, signing or application installation are part of these commands.

## Bridge

Native host calls `UnityPlayer.UnitySendMessage("SystemWorldBridge", "Receive", json)`. Unity calls static `com.system.worldfoundation.WorldBridge.ready()` after bootstrap and `emit(String)` for validated commands. INIT requests one snapshot per session. Three command actions only: REQUEST_SNAPSHOT, OPEN_PANEL, SET_QUALITY; no reward operations. Receiver checks current identity/generation/session and nondecreasing revision. Disposal blocks input and commands; a new valid INIT can establish a replacement session after disposal. Android lifecycle still requires physical-device testing.

Codec uses strict JSON (duplicate/unknown keys rejected), UTF8 <=16384 bytes, bounded fields and max nesting32. Shared fixtures cover all message types. The host owns durable command journaling/idempotency; Unity never confirms a reward or persists profile state.

## Quality and measurements

LOW/MEDIUM/HIGH use 0.70/0.85/1.00 render scale, 12/24/40m shadow distance, 512/1024/2048 shadow map and bounded 8/24/48 particles. LOW/MEDIUM target30; HIGH targets60. Postprocessing intentionally disabled in every preset at this stage. Initial selection uses available RAM/graphics memory; a one-shot 10-second measured >38ms average downgrades to LOW. Manual override stops the measurement decision. These are configurations, not achieved FPS claims.

Recorder is opt-in, never produces sample benchmark data automatically. Call `WorldFrameRecorder.Begin(path, scenario, platform, preset, actualBuildSha, conditions)` with schema values documented by the benchmark analyzer, then `End()`. Frame JSONL includes wall timestamps, unscaled frame duration and supported CPU thread counters; GPU is null until a reliable measurement exists. Disk recording/JSON allocation adds overhead; compare runs with and without collection. Desktop/null graphics tests do not establish Android performance.

## Validation evidence

See the main foundation report and raw XML/logs in `E:\SYSTEM\.tmp\system-world-foundation\unity`. Absence of a test result is NOT TESTED. Physical Android lifecycle, visual touch usability, thermal/battery and performance targets require a real device.
