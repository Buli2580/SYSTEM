# RC3 TASK 005 — Living Gear + Tracebook 1.0

Branch: `integration/rc3-awakening-world`. Base commit: `483ddd3c82a64809049a4bac38de7fe095bec650`.

## Changes

- `src/system2/components/LivingGear.tsx`: actual provider inventory, equipped items, rarity, stat bonuses, comparison, existing equip/unequip, synchronous repeated-tap guard, errors, latest acquisition marker and incremental list rendering.
- `src/system2/screens/InventoryScreen.tsx`: Living Gear added above retained cosmetic collection. Cosmetic mutations also guarded; errors surfaced. Corrected copy that previously described all Inventory as cosmetic.
- `src/system2/inventory/tracebook.ts`: read-only chronological projection and profile/category filter. Stable namespaced IDs; duplicates suppressed; invalid dates omitted. No invented historic levels.
- `src/system2/storage/database.ts`: `loadTracebook()` reads canonical records in the existing profile transaction. No new table, migration or reward mutation.
- `src/system2/screens/TracebookScreen.tsx`: offline chronicle with filters, pages of 40 entries, focus reload, request cancellation, profile isolation and retry.
- `src/app/tracebook.tsx`: existing router registration pattern.
- `src/system2/tests/tracebook.test.cjs`: chronology, duplicates, legacy dates, level evidence, loot, category and identity isolation.
- `src/system2/tests/home-world-4.test.cjs`: Living Gear comparison, repeated equip taps and Tracebook navigation.
- `src/system2/tests/gameplay.test.cjs`: canonical completion → loot → repeated equip → reload → chronicle → unequip, unchanged XP and no invented history.
- This report.

## Contracts and compatibility

InventoryItem IDs, reward keys, rarity, stats and acquiredAt remain unchanged. Living Gear uses the same provider and database operations as Character. Cosmetic collection remains available. Forge and item evolution stay LOCKED: there is no existing canonical item-evolution operation to invoke. Existing reward presentation remains responsible for loot reveal; Inventory marks the latest acquisition without replaying rewards.

Tracebook reads quest_completions, verified_events, chapter_completions, protocol_bonuses and inventory_items. Level transitions require saved levelBefore/levelAfter. Awakening requires its actual chapter record. Weekly entries require actual weekly_complete records. Domain milestones are projections of canonical quest thresholds, dated at the corresponding completion; they are not claims that a domain screen was visited then. Unknown quest titles fall back to their real ID. Missing historic data is not reconstructed from current XP. No SQL migration or backend change.

Profile linkage follows the existing local database scope, plus playerId on projected entries and UI filters. This does not add cross-device history synchronization. Current-profile legacy records are retained. Broken JSON yields a read error and retry, without modifying the stored record.

## Verification

- TypeScript: PASS.
- Gameplay: **320/320 PASS**, 116.920 seconds; includes canonical equipment/restart test and 2050-second simulation, four missions/four GM outcomes.
- HOME: **24/24 PASS**.
- Character Forge: **2/2 PASS**.
- Visual assets: **8/8 PASS**.
- Domain/SQLite: **3/3 PASS**.
- Tracebook: **4/4 PASS**.
- Total unique tests: **361/361 PASS**.
- Diff check: PASS.
- Initial model tests failed before implementation as expected. New UI test initially resumed before the VM promise settled; waiting for the event loop fixed the test timing without changing its assertions. No product regression failures in final runs.
- Physical phone rendering, process termination, screen/font sizes and native performance: NOT RUN. APK: NOT BUILT.

## Checklist

| # | Status | Implementation / limit |
|---|---|---|
| 01 | DONE | Branch, clean start and base SHA verified |
| 02 | DONE | Canonical loot and cosmetic collection located |
| 03 | DONE | Existing InventoryItem reused |
| 04 | DONE | Shared provider/equip API with Character |
| 05 | DONE | Existing rarity unchanged |
| 06 | DONE | Canonical completion/event tables |
| 07 | DONE | Existing SQLite profile transaction |
| 08 | DONE | Existing itemArt/ArtThumbnail |
| 09 | DONE | Existing Inventory screen extended |
| 10 | DONE | No character stat mutation added |
| 11 | DONE | Owned instances rendered in Living Gear |
| 12 | DONE | Equipped summary and per-item marker |
| 13 | DONE | Original rarity preserved |
| 14 | DONE | Stats, level requirement, source, date, instance |
| 15 | DONE | Canonical compareItem |
| 16 | DONE | Canonical equipmentBonuses |
| 17 | DONE | Existing equip/unequip |
| 18 | DONE | Synchronous lock and busy state; tested |
| 19 | DONE | No ID or acquiredAt replacement |
| 20 | DONE | Existing loot reveal retained; latest item marked |
| 21 | PARTIAL | Progression explanation and LOCKED evolution; no evolution stages exist |
| 22 | DONE | No invented evolution operation |
| 23 | DONE | Existing HOME Vault → Inventory retained |
| 24 | DONE | Existing collection and stored loot preserved |
| 25 | DONE | Database/module reload test |
| 26 | DONE | Typed dated chronological entries |
| 27 | DONE | Real quest_completions |
| 28 | DONE | Stored timestamps only |
| 29 | DONE | Recorded level transitions and chapter milestones |
| 30 | DONE | Daily, Weekly and Boss entries from canonical records |
| 31 | DONE | awakening_chapter_1 |
| 32 | DONE | Domain thresholds from actual completions |
| 33 | DONE | First Foundation entry |
| 34 | DONE | Canonical inventory acquisition history |
| 35 | DONE | Missing dates/levels not invented |
| 36 | DONE | Timestamp order, stable ID tie-break |
| 37 | DONE | Stable IDs, dedup, repeat-load tests |
| 38 | DONE | Category filters and profile isolation |
| 39 | DONE | Local SQLite, no network dependency |
| 40 | DONE | playerId-scoped projection and UI |
| 41 | DONE | Existing SystemPage/HUD styling |
| 42 | DONE | Existing asset engine; no unfit extra art |
| 43 | DONE | Neutral missing-art fallback |
| 44 | DONE | HOME → Vault → Inventory/Living Gear → Tracebook |
| 45 | DONE | XP and reward logic unchanged |
| 46 | DONE | Equipped instance persists after reload |
| 47 | DONE | Duplicate/repeated history tests |
| 48 | DONE | Canonical completion integration test |
| 49 | DONE | Gameplay, HOME, Character and visual regression |
| 50 | PARTIAL | Automated flow covered; physical-phone flow pending |

**48 DONE / 2 PARTIAL / 0 NOT STARTED.**

## Remaining work

Device validation of navigation, compare/equip, loot reveal and restart; genuine item-evolution rules in a separate approved gameplay package. Large history is read from SQLite before UI pagination; very long-lived profiles may later need database pagination. No dependency upgrade, cinematic edit, APK build, push, merge or deployment.
