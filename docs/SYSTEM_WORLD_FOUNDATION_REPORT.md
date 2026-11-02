# SYSTEM WORLD FOUNDATION — verification report

Date: 2026-11-02. Branch `feature/system-world-foundation-1`. Baseline HEAD at start of this Cursor pass: `370f9a49e5cad296dde7bee22ce412cfa92111ba`. This is an isolated experiment. RC3 production APK, signing, SQLite gameplay DB and Supabase were not modified.

FOUNDATION is **not complete**. Required device gates remain NOT TESTED. Do not treat Editor PlayMode as Android PASS.

## What actually exists

Unity project `C:\SYSTEM\SYSTEM-UNITY-WORLD` (source mirror in `experiments/world-foundation/unity`) boots `WORLD_FOUNDATION.unity` via `FoundationBootstrap`. Runtime creates:

- labeled TEMP procedural avatar (not M1; M1 GLBs have zero skins/joints/animations)
- CharacterController + gravity
- collision pillars and terrain
- TPS camera with sphere-cast collision
- WASD + RMB look; Android left-thumb move / right-thumb look; E / portal button
- Idle / Walk / Run via injected or analog magnitude (outer stick = run)
- portal that only emits `OPEN_PANEL/QUESTS` through `SYSTEM_WORLD_BRIDGE_V1`
- OnGUI HUD and LOW/MEDIUM/HIGH quality (render scale 0.70/0.85/1.00, shadow 12/24/40 m, 512/1024/2048 maps, 8/24/48 particles). HIGH targets 60 FPS; others 30. These are settings, not measured device FPS.

React Native keeps XP, quests, SQLite, accounts and sensors. Unity has no GRANT_XP / COMPLETE_QUEST command. Isolated Expo host (`pl.systemworld.foundation.spike`) uses `createWorldHost` with an in-memory journal and fixture snapshot only.

## Verified this pass

| Gate | Result | Evidence |
|---|---|---|
| TypeScript `tsc --noEmit --incremental false` | PASS | local run |
| `node --test src/system2/tests/world-bridge.test.cjs` + asset/benchmark unit tests | PASS 35/35 | includes 24 codec/host/journal/snapshot tests |
| Portable TS/C# fixtures | PASS 11 valid + 8 invalid, C# matched | `scripts/world-foundation/bridge-parity.cjs` |
| `node --test src/system2/tests/gameplay.test.cjs` | PASS 322/322 | required SYSTEM regression file; not a 725-test mega-suite |
| Native Java `BridgeGate` | PASS | `scripts/world-foundation/android-compile.ps1` |
| Unity EditMode | PASS 14/14 | `E:\SYSTEM\.tmp\system-world-foundation\unity-runs\20261102-151016-12a1bd3900e84df38fbb57ca7fdc04a6\results.xml` |
| Unity PlayMode (batch, nographics) | PASS 9/9 | walk/run, pillar block, gravity, portal command, camera follow, saved scene, recorder timestamps. `...\20261102-151104-ebd9a9bc0c9546d8aecbaf0f34cff5e3\results.xml` |
| Unity Android Gradle export | PASS command exit 0 | unsigned ARM64 IL2CPP export at `E:\SYSTEM\.tmp\system-world-foundation\unity-export\unityLibrary` |
| Isolated RN host materialize + connect | PASS scripts | host uses canonical `protocol.ts` + `host.ts` |
| Isolated `:app:assembleDebug` | BLOCKED / in-flight | see Android section |
| Physical Android / adb device | NOT TESTED | `adb devices` empty |
| Backend local server suite | NOT TESTED this pass | not required for renderer spike; no production deploy |
| Device FPS 30/60 | NOT TESTED | no recording from a phone |

Earlier Codex claim of 725/725 SYSTEM tests was not reproduced as a single command. The mandated `gameplay.test.cjs` file passed 322/322.

## Android diagnosis (actual causes, in order)

1. **Kotlin DSL GenerateProjectAccessors timeout** on the first isolated Gradle configure. Later configures of the same host reused compiled plugin jars and passed this step. Do not wipe `E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home`.
2. **Missing Unity export** — resolved by `FoundationBuilder.ExportAndroid`.
3. **NDK mismatch** — Expo catalog default `27.1.12297006` vs Unity NDK `27.2.12479018`. Fix: set root `ext.ndkVersion`/`ndkPath` **before** `expo-root-project`, and do not set `ndk.dir` (that triggered CXX1104).
4. **AGP tried to install NDK into the read-only Unity SDK**. Fix: isolated overlay `E:\SYSTEM\.tmp\system-world-foundation\android\sdk-overlay` with junctions plus `ndk\27.2.12479018` → Unity NDK, licenses junctioned from the local Android Studio SDK (existing licenses only; hashes were not fabricated).
5. **`unityStreamingAssets` missing** when `unityLibrary` is included from the Expo host — add empty `unityStreamingAssets=` to host `gradle.properties`.
6. Latest assemble (`host-assemble-debug-4.log`) configured `:unityLibrary` then sat on read-only SDK `package.xml` marshalling. APK is **not** claimed.

Do not install this spike over RC3. ApplicationId is `pl.systemworld.foundation.spike`, unsigned debug.

## Authority remaining

- Host is not mounted in `SystemProvider`.
- Isolated host journal is in-memory; production `system-world-bridge-v1.db` is opt-in via `openWorldCommandJournal`.
- Process restart, ten entry/exit cycles, lock/unlock, account switch on a phone: NOT TESTED.
