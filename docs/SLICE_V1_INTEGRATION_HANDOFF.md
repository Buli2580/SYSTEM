# Slice V1 — Integration Handoff (for Codex)

## What Cursor delivered

Isolated package under `packages/slice-v1` + docs + evidence. **No EX12 merge. No Android build. No host Awakening rewrite.**

## Branch / commits

See `evidence/slice-v1/SLICE_V1_REPORT.md` (filled at S8).

## Selective integration steps

1. Keep Codex Awakening Gate as source of `awakeningCompleted`.
2. On celebration dismiss / awakening confirmed → call Slice `confirmAwakening` + `issueFirstOrder(selectVariant(...))`.
3. Bind active quest UI to `first_movement_v1` (or TIMER flex).
4. On QE verified event → `markFirstOrderVerified` + `applyFirstOrderReward` with **same claim id**.
5. Route Base screen to `buildBaseScreen`.
6. Daily: `rollDaily` with player IANA timezone; claim via QE daily templates mapped from `DAILY_ORDER_SEVEN`.
7. Optionally import Unity SliceV1Content markers into a branch of World scene — not while Editor is locked.

## Dependencies

| Dependency | Status |
|------------|--------|
| Codex Awakening Gate | **REQUIRED** — full APK path NOT INTEGRATED until wired |
| EX12 host screens | REQUIRED for player-facing shell |
| QE `applyQuestRewards` / verified_events | REQUIRED |
| Unity live scene | OPTIONAL flavor markers |

## Conflicts

- Do not duplicate Awakening XP awards.
- Do not change Unity open gates.
- Do not claim L2 from first order alone (147 XP rule).

## Completeness

| Layer | Level |
|-------|-------|
| Content / state / adapters / tests | **REAL** |
| RN EX12 screens | **NOT WIRED** |
| Unity prefabs in live scene | **NOT WIRED** / Editor **BLOCKED** |
| Device APK playability | **NOT PROVEN** (Codex device test) |
