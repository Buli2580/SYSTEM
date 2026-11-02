# SYSTEM REAL WORLD 2.4 — UNITY MULTITILE RENDERER REPORT

Date: 2026-11-02  
Worktree: `C:\SYSTEM\SYSTEM-RC2` (`feature/system-world-foundation-1`)  
Live Unity project: `C:\SYSTEM\SYSTEM-UNITY-WORLD` (Unity `6000.6.4f1`)  
Package: `examples/real-world-2.4-multitile-synthetic/` (StreamingAssets junction)

## Verdict

| Gate | Result |
|------|--------|
| Protect FOUNDATION scene + existing APKs | **PASS** |
| C# `SYSTEM_REAL_WORLD_DATA_V1` validator + SHA bundle loader | **PASS** |
| Separate scene `REAL_WORLD_MULTITILE_LAB` | **PASS** |
| Load LOW × 9 with shared origin (X EAST / Y UP / Z NORTH) | **PASS** |
| Deduplicate cross-tile features (lowest `tileId`) | **PASS** |
| LOD switch LOW → MEDIUM → HIGH → DISTANT → LOW (one active) | **PASS** |
| Visible **SYNTHETIC** label | **PASS** |
| EditMode Unity tests | **11/11 PASS** |
| PlayMode Unity tests | **3/3 PASS** |
| Scene spawn geometry (14 meshes / 106 tris) | **PASS** (measured) |
| Android APK build | **NOT DONE** (blocked until Unity gates above) |
| GPS / XP / quests / user saves | **NOT INTEGRATED** (by design) |
| V1 contract change / V2 | **NOT DONE** |

Rendering is **PASS for the SYNTHETIC multitile lab** after EditMode + PlayMode + spawned mesh measurement. This is **not** actual Lębork data and **not** a device/APK FPS claim.

## Protection

| Artifact | SHA-256 | Status |
|----------|---------|--------|
| `WORLD_FOUNDATION.unity` | `5E76B5D19F1C0DAB14D98E843431919DE67E02D083BE2FB3FDA968C500FCEF64` | unchanged |
| Standalone APK `…STANDALONE-20261102-204801.apk` | `c16f43844daa9b6d1954b9cf7ef62eb181b1a33ca5ad496c88fbf4b87ec2b2ec` | unchanged |
| Metro debug APK `…DEVICE-BETA-20261102-200813.apk` | `1fad2534572cda5386086c3d1102e770aaa2f0024b5d567918189c16fc97bac2` | unchanged |

Lab scene is listed in Editor Build Settings as **disabled**. FOUNDATION remains the Android export entry. No merge/push performed.

## Implementation (new)

Under `Assets/_SYSTEM/RealWorld/`:

- `RealWorldValidator` — port of Codex `tiles.ts:validateTile` + `pipeline.ts:validatePacket` (strict keys, origin/sector, mesh accounting, limits)
- `RealWorldBundle` — `SYSTEM_CITY_MULTITILE_DEMO_V1` manifest verify (bytes, SHA-256, path safety) then V1 packet load
- `RealWorldMultitileSession` — one LOD at a time, budgets, deterministic dedupe by mesh/feature id (lowest tileId)
- `RealWorldMultitileLab` — scene/runtime spawn, keys `1–4` for LOW/MEDIUM/HIGH/DISTANT, OnGUI **SYNTHETIC** banner
- Editor: `MultitileLabBuilder.PrepareLab`, `MultitileLabReport.Capture`

Data path: `Assets/StreamingAssets/real-world-2.4-multitile-synthetic` → junction to `examples/real-world-2.4-multitile-synthetic/`.

## Measured geometry (batch Capture)

Source: `examples/real-world-2.4-evidence/unity-multitile-render-stats.json`

| LOD | Tiles | Errors | Unique meshes | Triangles (deduped) | Serialized tris (with tile repeats) | Packet UTF-8 |
|-----|-------|--------|---------------|---------------------|--------------------------------------|--------------|
| LOW | 9 | 0 | **14** | **106** | 130 | 58 772 |
| MEDIUM | 9 | 0 | 14 | 106 | 130 | 59 006 |
| HIGH | 9 | 0 | 14 | 106 | 130 | 58 930 |
| DISTANT | 9 | 0 | 14 | 106 | 130 | 52 181 |

Kinds after dedupe: BUILDING 9, ROAD 3, PARK 1, PLAZA 1.  
Play spawn (LOW): **14** `MeshFilter`s, **106** triangles.  
Shared OSM node `38` (EW/NS crossing) co-locates across west/north tile frames within **1 mm**. Ribbon junction fill remains a known V1 generator gap (~4 m between ribbon edge verts), not a frame bug.

## Unity tests (executed)

EditMode (`unity-editmode-results.xml`): **11 passed / 0 failed** — all 36 packets, SHA corruption reject, blank tileId, bad origin, wrong protocol, extra field, size limit, missing LOD file, LOW dedupe 14 meshes, frame axes, neighbor node alignment.

PlayMode (`unity-playmode-results.xml`): **3 passed / 0 failed** — 9 LOW tiles + SYNTHETIC + building scale/normals; LOD cycle + unload/reload; dispose guard.

## Explicit non-claims

- Not actual Lębork / Geofabrik mesh (Osmium real-import still blocked upstream).
- No Android APK / device GPU memory / FPS numbers from this pass.
- Relation with hole remains `BLOCKED_V1_RELATION_AND_HOLES` (source-only purple SVG).
- World Bridge / GM2 / quest / XP / GPS untouched.

## Follow-ups (optional)

1. Interactive open of `REAL_WORLD_MULTITILE_LAB` in Editor for visual LOD key check (automated spawn already measured).
2. Device memory/FPS only after an intentional lab APK — **do not** replace FOUNDATION standalone signing.
3. Keep V2 relations proposal gated until product decision.
