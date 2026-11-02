# SYSTEM REAL WORLD 2.4 — CURSOR ACCEPTANCE

Date: 2026-11-02  
Worktree: `C:\SYSTEM\SYSTEM-RC2` (`feature/system-world-foundation-1`)  
Source commits reviewed: `C:\SYSTEM\SYSTEM-REAL-WORLD-CODEX` @ `5a8acc5` / `945f640` / `7134db4`

## Scope of this acceptance

| Action | Done |
|--------|------|
| Copy `examples/real-world-2.4-multitile-synthetic/` + `.gitattributes` into RC2 | **YES** |
| Copy `examples/real-world-2.4-evidence/` | **YES** |
| Copy 2.4 docs (handoff, report, plan, Geofabrik, V2 relations proposal) | **YES** |
| Overwrite 2.3 / Lebork packages / Unity scenes / C# / Gradle / bridge / APK | **NO** |
| Install C# V1 parser / Unity EditMode–PlayMode / device FPS | **NOT DONE** → remain **NOT TESTED** |
| Integrate REAL WORLD 2.1/2.4 into FOUNDATION APK or World Bridge | **NO** |
| Declare actual Lęborka / Osmium real-import success | **NO** (`BLOCKED_OSMIUM_UNAVAILABLE` evidence only) |

## Artifact received (RC2 copy)

Path: `examples/real-world-2.4-multitile-synthetic/`

| Check | Result |
|-------|--------|
| File count | **40** |
| Total bytes | **257 929** |
| Codex → RC2 SHA-256 mismatches | **0** |
| `.gitattributes` LF for json/osm/svg | present |
| `dataStatus` | `SYNTHETIC` |
| `actualLeborkData` | `false` |
| `unityStatus` (manifest) | `NOT_TESTED` |
| Format | `SYSTEM_CITY_MULTITILE_DEMO_V1` (tooling wrapper; **not** V1 packet body) |
| Protocol of packets | `SYSTEM_REAL_WORLD_DATA_V1` |

## Node validation (engine in Codex worktree)

`verifyBundle` from `scripts/real-world/build-city-demo.cjs`:

- Against Codex tree: `{ verifiedPackets: 36, verifiedFiles: 39 }`
- Against RC2 copy (absolute path): identical **PASS**

`node --test` (Codex, 2026-11-02):

- `real-world-city-export.test.cjs`
- `real-world-integration-ready.test.cjs`
- `real-world-render-session.test.cjs`

**21/21 PASS** — includes hash corruption rejection, blank tile ID rejection, four LOD coherence, shared frame / neighbor alignment, LOD swap/dispose, single-tile budget center replace, mesh admission limits.

Manifest is **not** fed to `validatePacket`; only listed packet JSON files are.

## Honest gaps (do not upgrade these to PASS)

- Unity EditMode / PlayMode V1 C# parser: **NOT TESTED** (no C# parser installed in this pass)
- Physical Android / GPU memory / FPS: **NOT TESTED**
- Real Geofabrik Pomorskie → Osmium crop: still **BLOCKED_OSMIUM_UNAVAILABLE** (see `examples/real-world-2.4-evidence/`)
- V2 relations/holes: **proposal only** (`docs/SYSTEM_REAL_WORLD_V2_RELATIONS_PROPOSAL.md`); purple SVG hole is source evidence, not V1 mesh
- World Foundation standalone APK: **unchanged**  
  SHA-256 `c16f43844daa9b6d1954b9cf7ef62eb181b1a33ca5ad496c88fbf4b87ec2b2ec`

## Transform contract (for a future Unity pass — not applied here)

Vertices stay in **tile-local** meters. Scene placement uses `manifest.tileTransforms[tileId]`:

```text
scenePosition = T.translation + T.x * local.x + T.y * local.y + T.z * local.z
sceneNormal   =                 T.x * normal.x + T.y * normal.y + T.z * normal.z
```

(T.x/T.y/T.z are rotation columns, not Euler; keep WGS84/origin math in double until render.)

Deduplicate features/meshes by ID (lowest tileId wins). One LOD at a time. Do not rewrite packet meshes into scene frame while leaving `tile.origin` as tile-local.

## Next (explicitly out of this acceptance)

1. C# V1 validator + EditMode over all 36 packets  
2. PlayMode multitile session with shared origin  
3. Optional: mount behind experimental flag — never replace FOUNDATION spike signing or RC3  

Primary handoff text: `docs/SYSTEM_REAL_WORLD_2_4_UNITY_HANDOFF.md`.
