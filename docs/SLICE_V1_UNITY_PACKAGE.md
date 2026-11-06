# Slice V1 — Unity Content Package

**Path:** `packages/slice-v1/unity/SliceV1Content/`

## Contents

- Prefab specs: Checkpoint, MissionMarker, BaseMarker
- FX: start / activate / verified
- Audio: original SFX placeholders (commission)
- Adapter stub: `SliceV1MarkerAdapter.cs.txt`

## Integration

1. Copy into **isolated** Unity project / cache — not Codex live Library.
2. Instantiate markers via existing world contracts.
3. Drive visibility from RN/QE state through **existing** bridge.
4. Do **not** add World5Bootstrap, Quest Bridge, or player controller.

## Tests

Unity Editor / PlayMode: **BLOCKED** while Codex builds or shares the project. No Editor launched in this Cursor pass.
