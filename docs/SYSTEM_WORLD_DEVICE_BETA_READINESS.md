# SYSTEM WORLD FOUNDATION — DEVICE BETA READINESS

Date: 2026-11-02  
Branch: `feature/system-world-foundation-1`  
Scope: isolated Expo host + Unity `unityLibrary` spike only. **Not** RC3 production. **Not** REAL WORLD 2.1.

## Verdict

| Gate | Status |
|------|--------|
| Isolated `assembleDebug` (Metro) | **PASS** — preserved |
| Isolated `assembleRelease` standalone (embedded JS) | **PASS** |
| Secured APK copies (no overwrite) | **PASS** |
| SHA-256 / size / version recorded | **PASS** |
| Manifest / package / SDK / ABI | **PASS** |
| Debug signature verify | **PASS** (Android Debug keystore; not production) |
| Unity + RN native libs packaged | **PASS** |
| JS bundle embedded (standalone) | **PASS** (`assets/index.android.bundle`) |
| Physical device install/run | **NOT TESTED** |
| REAL WORLD 2.1 | **NOT INTEGRATED** (by design) |
| Production signing | **UNCHANGED** |

**Prefer the STANDALONE APK for phone tests without a PC/Metro.**  
Do not claim FPS, stability, or launch success until a physical device run is logged.

## Secured artifacts

Do not delete or overwrite these files.

### A) STANDALONE (no Metro) — preferred for field install

| Field | Value |
|-------|--------|
| Secured APK | `dist/world-foundation-device-beta/SYSTEM-WORLD-FOUNDATION-STANDALONE-20261102-204801.apk` |
| SHA-256 | `c16f43844daa9b6d1954b9cf7ef62eb181b1a33ca5ad496c88fbf4b87ec2b2ec` |
| Size | 60 138 206 bytes (~57.35 MiB) |
| versionName / versionCode | `0.0.1-standalone` / `2` |
| JS | `assets/index.android.bundle` (1 167 780 bytes) |
| Build | `:app:assembleRelease` via `scripts/world-foundation/android-assemble-standalone.ps1` |
| Signing | Android **Debug** keystore (same as spike debug; **not** production) |

### B) Metro debug (preserved)

| Field | Value |
|-------|--------|
| Secured APK | `dist/world-foundation-device-beta/SYSTEM-WORLD-FOUNDATION-DEVICE-BETA-20261102-200813.apk` |
| SHA-256 | `1fad2534572cda5386086c3d1102e770aaa2f0024b5d567918189c16fc97bac2` |
| Size | 72 008 908 bytes (~68.67 MiB) |
| JS embedded | no — requires Metro |

```powershell
Get-FileHash dist\world-foundation-device-beta\SYSTEM-WORLD-FOUNDATION-STANDALONE-20261102-204801.apk -Algorithm SHA256
Get-FileHash dist\world-foundation-device-beta\SYSTEM-WORLD-FOUNDATION-DEVICE-BETA-20261102-200813.apk -Algorithm SHA256
```

## Manifest / identity (standalone)

| Field | Value |
|-------|--------|
| Package ID | `pl.systemworld.foundation.spike` |
| Label | WORLD Foundation Spike |
| versionName | `0.0.1-standalone` |
| versionCode | `2` |
| minSdk | **31** (Android 12) |
| targetSdk | **36** |
| compileSdk | 36 |
| native-code | **arm64-v8a only** |
| Hermes / New Arch | enabled |
| REAL WORLD 2.1 | not integrated |

## Signature

`apksigner verify --verbose --print-certs` → **Verifies**

- Scheme: APK Signature Scheme **v2**
- Signer: **Android Debug** (`CN=Android Debug, …`)
- Cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`

This is **not** production / Play signing. Do not replace with release keystore for this spike.

## Native payload (inside APK `lib/arm64-v8a`)

| Library | Present | Role |
|---------|---------|------|
| `libil2cpp.so` | yes (~54 MiB) | Unity IL2CPP |
| `libunity.so` | yes | Unity engine |
| `libmain.so` | yes | Unity entry |
| `libreactnative.so` | yes | React Native |
| `libexpo-modules-core.so` | yes | Expo modules |
| `libhermesvm.so` | yes | Hermes |
| `libjsi.so` | yes | JSI |
| `libc++_shared.so` | yes | NDK C++ |

Also present: Unity `assets/bin/Data/*` (IL2CPP data, `global-metadata.dat`, `level0`, etc.).

**Metro-debug APK** omits `assets/index.android.bundle` by design. **Standalone release-like APK** embeds it (`assets/index.android.bundle`, Hermes bytecode via `export:embed`).

## Tooling notes (rebuild path)

- Unity IL2CPP NDK: Unity 6000.6.4f1 bundled **27.2.12479018**
- Expo/RN CMake NDK: overlay **27.1.12297006**
- `GRADLE_USER_HOME=G:\` (subst of `E:\SYSTEM\.tmp\system-world-foundation\android\gradle-home`) for MAX_PATH
- Assemble: `scripts/world-foundation/android-assemble-debug.ps1`

## Error handling / diagnostics (what exists)

**RN host (`index.js`)**

- Status text for launch/send failures (`catch` → `setStatus`)
- Lifecycle events: `CREATED`, `PAUSED`, `RESUMED`, `RESTART_REQUIRES_INIT`, `RETURNED`
- Bridge reject codes from native: `WORLD_LAUNCH`, `WORLD_SEND`
- Fixture-only identity (`spike-fixture`); no XP awards; in-memory journal

**Native**

- `WorldBridgeModule`: Promise rejects on launch/send exceptions
- `BridgeGate`: generation/session gating; stale messages dropped
- Invalid envelopes rejected before Unity / RN mutation paths

**Unity**

- `WorldBridgeClient`: desktop fallback `Debug.Log` when AndroidJavaClass unavailable
- `WorldFrameRecorder`: JSONL frame log (physical path must use `platform=android-physical` + real 40-char build SHA) — **not auto-started on device yet**; enable only for measured runs

**Gaps for device beta**

- No persistent on-device crash reporter wired for the spike
- Logcat is the primary diagnostic channel (`adb logcat`)
- Without Metro, cold start shows redbox / unable to load script — not a Unity failure

## Install without ADB / without Metro (standalone)

Physical launch success is **NOT** claimed here.

### Prerequisites

- ARM64 phone, Android **12+**
- Allow install from unknown sources / “Install unknown apps” for Files / Drive / browser
- **Do not uninstall** production SYSTEM / RC3
- This spike installs as a **separate** app: `pl.systemworld.foundation.spike`

### Steps

1. Copy `SYSTEM-WORLD-FOUNDATION-STANDALONE-20261102-204801.apk` to the phone (USB file transfer, Drive, SD card — no PC runtime required after copy).
2. Optional: compare SHA-256 on a PC before copy  
   `c16f43844daa9b6d1954b9cf7ef62eb181b1a33ca5ad496c88fbf4b87ec2b2ec`
3. On the phone, open the APK with the package installer and confirm install.
4. If Android blocks “unknown app”, enable install permission for that file manager, then retry.
5. Open **WORLD Foundation Spike** from the launcher.
6. Tap **Open WORLD** — Unity should load **without** Metro or USB debugging.
7. Expect a one-time “allow unknown apps” / Play Protect prompt on some OEMs; this APK is **debug-signed**, not Play Store.

### Optional ADB path (still no Metro)

```powershell
adb install -r "C:\SYSTEM\SYSTEM-RC2\dist\world-foundation-device-beta\SYSTEM-WORLD-FOUNDATION-STANDALONE-20261102-204801.apk"
adb shell am start -n pl.systemworld.foundation.spike/.MainActivity
```

### Metro debug APK (legacy path only)

Use `SYSTEM-WORLD-FOUNDATION-DEVICE-BETA-20261102-200813.apk` only when intentionally testing with Expo Metro (`expo start` + `adb reverse tcp:8081 tcp:8081`).

## Manual test scenario (checklist)

Mark each on device. Do not invent PASS without observation.

1. **Cold start** — Metro connected; host screen shows fixture status text (not redbox).
2. **Open WORLD** — tap button; Unity activity starts; no immediate crash.
3. **Character** — TEMP avatar visible / controllable (procedural, unrigged — expected).
4. **Camera** — third-person follow; no stuck pitch/yaw.
5. **Joystick / touch locomotion** — move on plane; stop on release.
6. **HUD** — in-world HUD readable; quality LOW default from INIT payload.
7. **Missions / portal** — approach portal; proximity feedback; no REAL WORLD 2.1 content expected.
8. **Host panel command** — if Unity emits `OPEN_PANEL`, host shows panel name; **no XP**.
9. **Return to app** — Back / return path restores RN host; lifecycle shows return/pause as applicable.
10. **Dispose WORLD** — host Dispose button; Unity tears down without killing the whole process unexpectedly.
11. **Pause / resume** — Home then return; world resumes or requests re-INIT honestly.
12. **Repeat enter/exit ×5** — no black screen lock; no dual Unity activities.
13. **Process death** — force-stop app, relaunch + Metro; must `WORLD_INIT` again (no restored account snapshot).

### Explicit non-goals this build

- REAL WORLD 2.1 sectors / GPS world
- Official RC3 package or production cert
- Embedded release JS / offline Metro-free play
- Claiming 30 FPS without `WorldFrameRecorder` JSONL from `android-physical`

## After first device session — capture

- Phone model + Android version
- Pass/fail per checklist item
- Logcat excerpt for any crash (`AndroidRuntime`)
- Optional: recorder JSONL + `node scripts/world-foundation/benchmark.cjs` (only if recorder enabled with real SHA and `android-physical`)

## Related docs

- `docs/SYSTEM_WORLD_FOUNDATION_REPORT.md`
- `docs/SYSTEM_WORLD_BRIDGE_V1.md`
- `docs/SYSTEM_CURSOR_HANDOFF.md`
- `docs/SYSTEM_ANDROID_BENCHMARK.md`
