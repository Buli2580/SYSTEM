# Android RN ↔ Unity integration spike — PARTIAL

This is an isolated, compiled native transport, not a tested APK. No app was installed, uninstalled, or changed. RN gameplay and saves are not wired here.

## Implemented and actually checked

- Real ReactContextBaseJavaModule + ReactPackage against cached React Native 0.86.3 debug AAR. This uses New Architecture legacy native-module interop, not a generated TurboModule.
- UnityPlayerActivity subclass and UnitySendMessage against the installed Unity 6000.6.4f1 player Java classes and source, Android SDK 36, bundled OpenJDK.
- UTF-8 16 KiB transport bound, inactive/disposed gate, one scheduled inbound message, at most eight outbound messages, session/account/generation check, epoch invalidation of old queued work. Full schema validation and command authority remain in the RN protocol owner and Unity codec; native envelope checks are defense in depth only.
- JDK gate lifecycle/UTF-8 size and activity-generation readiness/detach tests: RED (missing class), then PASS. Native Java compile PASS with optional missing annotation warnings. This does not execute Android, RN, JNI, or Unity.
- Read-only adb inventory required escalation because sandbox adb could not create `\.android` despite local Android config directories. Escalated `adb devices -l` succeeded with an empty attached-device list. No physical performance/lifecycle claims.

## Integration boundary

Register `new WorldBridgePackage()` in a **separate** RN 0.86.3 host with Android applicationId `pl.systemworld.foundation.spike`, minimum Android API 31. Add this directory's manifest and Java sources. Do not add it to production Expo/RC3 or change signing. An actual separate Expo57 RN New Architecture Gradle host has been generated in task scratch; its reviewable fixture sources and reproduction steps are in `host/`. Native execution and APK assembly remain unverified.

Only an actual Unity export may supply `:unityLibrary`. Export target: `E:\SYSTEM\.tmp\system-world-foundation\unity-export`. Include that actual module from the experimental host's settings and `implementation project(':unityLibrary')`; never substitute fabricated engine stubs. Preserve Unity's native libs, assets, resources and Gradle requirements. The included source-compile command is independent of export availability and cannot produce an APK.

RN API (`NativeModules.SystemWorldBridge`):

- `launch(validatedWorldInitJson): Promise<void>` opens or returns to the retained full-screen Unity activity. Resolves when Android starts activity, not when the world is rendered.
- Unity calls static `WorldBridge.ready()` after `SystemWorldBridge.Receive` exists; native flushes one pending init.
- `send(validatedEnvelopeJson): Promise<void>` sends snapshots/directives/ACK/reject/lifecycle to `SystemWorldBridge.Receive`. Rejection before readiness is intentional; host waits for world readiness/initial snapshot request.
- `returnToHost()` reorders the retained RN activity to front; Android back also returns RN. It does not finish the Unity activity or call quit.
- `dispose()` invalidates queued messages, returns host and requests Unity unload; unload callback finishes Unity activity. Repeated unload/relaunch must still be validated on device with this Unity version.
- Events `WorldMessage` (untrusted string; RN must decode, validate and authorize before acting), `WorldLifecycle` (`CREATED`, `RESTART_REQUIRES_INIT`, `PAUSED`, `RESUMED`, `RETURNED`). These are observation events, never game-state ACKs.

Use `NativeEventEmitter(module)` and remove subscriptions before host teardown. Send explicit WORLD_PAUSE/RESUME envelopes from RN session owner on app-state changes, dispose/account change on switch; Android player pause/resume does not mutate RN game state. Process recreation never reads persisted player snapshots. RN must reinitialize from its authoritative current state. This native transport does not implement journal persistence, reward execution, SQLite, network access, or background message storage.

Compile from repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/world-foundation/android-compile.ps1
```

Evidence/artifacts live at `E:\SYSTEM\.tmp\system-world-foundation\android`: `red.log`, `compile.log`, `adb-devices-escalated.log`, compiled classes, `world-bridge-native.jar`. No runtime test is represented by this JAR.

## Runtime checks still NOT TESTED

Actual APK assembly; RN New Architecture module registration/events; Unity library loading/render readiness; initial/snapshot round trip; 10 entry/exit cycles; background/foreground; back gesture; screen lock/unlock; unload/relaunch; process kill/restart; account switch during queued/in-flight commands; RN data/progression preservation; PSS/FPS/frame-time/temperature/battery/ANR. Require an attached physical Android and a real exported unityLibrary plus a compatible assembled separate RN host. Installation requires a future explicit instruction and must never uninstall RC3.


Reviewed restart fix: matching-activity detach invalidates gate/readiness/epoch and pending INIT. Old-activity detach cannot invalidate the newer activity; stale ready callbacks are generation-checked. RED/GREEN evidence: red-readiness.log and final-compile.log.


Isolated Expo57 prebuild PASS and host Android Hermes bundle export PASS. Unity `unityLibrary` export now exists. Kotlin DSL accessor timeout was a first-configure issue; later configures of the same Gradle home pass that step. Isolated `:app:assembleDebug` was still not a PASS at handoff (NDK overlay + `unityStreamingAssets` required; last run configured `:unityLibrary` then stalled on read-only SDK package.xml). See `docs/SYSTEM_WORLD_FOUNDATION_REPORT.md`.

