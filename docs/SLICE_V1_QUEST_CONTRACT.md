# Slice V1 — Quest Contract

## Binding

| Slice content | Authoritative QE id |
|---------------|---------------------|
| Pierwszy Ruch (GPS) | `first_movement_v1` |
| Flex TIMER | safe awakening TIMER quest / Codex-approved TIMER id |
| Chapter complete | `awakening_chapter_1` via `awardAwakeningIfEligible` |
| DEV harness | validation path only — `producesRealWorldProof: false` |

## States

`LOCKED → ISSUED → ACTIVE → SUBMITTED → VERIFIED → REWARDED | REJECTED`

Persistence: `SLICE_V1_STATE` JSON (`serialize`/`deserialize`). Idempotent reward via `rewardClaimId`.

## Evidence rules

- GPS_DISTANCE ≥ 500 m, score ≥ 80
- TIMER ≥ 300 s (flex), score 100
- DEV_SIMULATED_PATH **never** becomes real proof
- No virtual POI entry as physical activity proof
- Lebork POI is optional marker only

## Rewards

Only through Quest Engine port (`validateAndReward`). Slice store updates Base/item **after** successful claim id.

## Awakening

Do not emit competing completion events. Consume Codex/host `awakeningConfirmed`.
