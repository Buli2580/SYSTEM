# Slice V1 — S0 Audit (read-only)

**Date:** 2026-11-06  
**Worktree:** `C:\SYSTEM\.tmp\system-slice-v1` (`feat/slice-v1` @ `cd53f3f9`)  
**Scope rule:** Cursor does **not** modify Codex EX12 APK, Awakening Gate host, HOME overlap, active Unity Lębork scene, RN↔Unity Bridge, or run Android builds.

## Authoritative facts (Quest Engine)

| Fact | Source | Value |
|------|--------|-------|
| Equal Origin | `AGENTS.md` / `createNewPlayer` | REAL LEVEL 1, Rank **E**, XP 0, seven skills @ 1 |
| Skills | progression | STR, VIT, INT, WIL, CHA, CRE, RES |
| XP L1→L2 | `xpNeededForRealLevel(1)` | **147** REAL XP |
| First quest XP | `firstMovement.ts` | **100** REAL XP (+ VIT 80) — **not** enough alone for L2 |
| Focus / Final | focus/finalTrial | 80 + 120 REAL XP |
| Chapter award | `AWAKENING_REWARD_XP` + `awardAwakeningIfEligible` | **+300** REAL XP once when all Awakening quests done |
| Reward authority | `applyQuestRewards` / verified events | Client must not write XP outside QE path |
| Inventory start relic | `inventory/catalog.ts` | `relic-origin-shard` after awakening |
| Daily rules | `daily/calendar.ts` | 3 slots, clear XP 75, weekly target 5 |
| World unlock | storage snapshot | `worldUnlocked === awakeningCompleted` |

**Level-2 honesty:** With current QE math, **first quest alone cannot grant L2**. L2 becomes reachable after ~180 XP (quest 1+2) or earlier only if Codex later changes thresholds/rewards. Slice V1 must **not** invent a parallel XP ledger.

## Awakening (do not compete)

| Item | Detail |
|------|--------|
| Chapter id | `awakening_chapter_1` |
| Adult quests | `first_movement_v1` → `focus_protocol_v1` → `final_trial_v1` |
| Safe path | `SAFE_AWAKENING_QUESTS` (TIMER 300s × 3) via age mode |
| Completion | `awardAwakeningIfEligible` when `getAwakeningProgress` complete; INSERT `chapter_completions` |
| Signals | `awakeningCompleted`, `worldUnlocked`, `awakeningPending` celebration |
| Gate helpers | `firstGoalGatePending`, `LaunchGate`, `GameplayGate`, director reason `AWAKENING` |

**Cursor contract:** consume Awakening **confirmed** as an input event. No new host Awakening, no DEV bypass, no Unity open-condition changes.

## Existing “Pierwszy Ruch”

`src/system2/quests/firstMovement.ts` already defines GPS 500 m Awakening quest. Slice V1 **reframes and packages** presentation + flexible variants + Base/Daily around QE — it does not replace the authoritative quest id without Codex wiring.

## Player-facing problems (host)

| Kind | Examples |
|------|----------|
| FALLBACK | `SAFE FALLBACK` AI labels (`HomeCommandCenter`, story director) |
| MOCK | `MOCK_LOCATION` anti-cheat; audio `placeholder:true` awakening music |
| Technical codes | `GPS_ERROR`, `DATABASE_ERROR`, reason enums surfaced near GM |
| Not wired / sealed | World `SEALED` until awakening; AI sealed pre-awakening |
| Dead / dense screens | Quests as large panels + ids; HOME command center status soup |
| First-launch friction | Onboarding → goals gate → multi-quest Awakening (500 m + 10 min focus + 600 m/10 min) exceeds “10 minutes to Base” fantasy |
| Catalog noise | Generated/daily/boss mixed with Awakening |

## EX12 / Unity / UI9 (ownership)

| Area | Owner | Cursor action |
|------|-------|---------------|
| EX12 Android APK / Gate B unblock | Codex | **Do not touch** |
| Awakening Gate + debug profile | Codex | Spec handoff only (S2) |
| HOME overlap | Codex | **Do not retouch** |
| Active Unity Lębork / World5 | Codex (`SYSTEM-WORLD-5-CODEX` etc.) | Isolated Unity **content package** only |
| UI9 redesign tree | Codex UI (`SYSTEM-UI-9-CODEX`) | Isolated presentation components |
| Atlas 11.x | Separate `.tmp` packages | Out of slice scope except “structure exists” |

RC2 working tree at audit time also had dirty World Bridge / HOME / Quests files — treat as **Codex-active**; all Slice work stays under `packages/slice-v1`, `docs/SLICE_V1_*`, `evidence/slice-v1`.

## Contracts

- Gameplay loop: Quest → Proof → Verify → Reward → REAL XP → Skill XP  
- Missing sensors lower confidence; not automatic cheating  
- Guest/offline must remain usable  
- No selling REAL LEVEL / REAL XP  
- QUEST↔WORLD: prefer existing world bridge contracts; Slice Unity adapter is selective drop-in

## Isolation plan

```
packages/slice-v1/     content, state, presentation, adapters, unity package, tests
docs/SLICE_V1_*.md     GDD + handoff
evidence/slice-v1/     audit, stage log, report
```

## S0 conclusion

Host already has Awakening + first_movement + chapter XP, but the **first 10 minutes are not a coherent RPG beat** (status language, long multi-quest gate, no Base narrative, weak Daily Orders fantasy). Slice V1 delivers isolated content/mechanics for Codex selective integration.

**Code changes in S0:** none.
