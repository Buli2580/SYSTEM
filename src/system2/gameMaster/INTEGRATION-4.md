# AI Game Master 4.0 × HOME/WORLD — implementation and integration report

> Raport historyczny Paczki 3. Aktualny stan integracji 1+2+3, 663 testy i pozostałe ograniczenia opisuje [CORE-INTEGRATION-4-REPORT.md](../../../CORE-INTEGRATION-4-REPORT.md).

Branch: `feature/ai-gm-home-integration`.
Worktree: `C:\SYSTEM\SYSTEM-ai-gm-home`.
Base: `f1c288cc9f9b0ac789682ad8654bfd45eeccd0da` (Package 2).
No merge, push, Game Loop edits, APK build or SQL deployment.

## Existing code reused

The existing Director owns active/awakening ordering. The Adaptive Engine computes readiness and target difficulty. Canonical quest catalog, availability rules, age policy, generated quest metadata, Journey priorities, archetypes, perks and deterministic World Events are reused. SQLite attempts/completions remain the outcome authority. The old campaign planner/AsyncStorage v1 remains a goal preview; the live campaign projection is v2 in profile SQLite, not another quest/reward engine.

## Public API and Package 1 contract

Exports in `gameMaster/index.ts`:
- `getGameMasterState(input)` returns mission, campaign, world, boss, character, explanation and telemetry.
- `getNextMission(state)`, `getWorldDirectives(state)`, `getCharacterDirectives(state)`, `getBossDirectives(state)`, `getDecisionExplanation(state)` select that same decision.
- `getCampaignState(campaign, now)` returns chain/arc context.
- `recordMissionOutcome(campaign, outcome)` is a pure projection reducer, NOT a completion or persistence command.
- `reconcileMissionOutcomes(choice?, expectedPlayerId?)` reads authoritative SQLite outcomes and durably updates the campaign in a profile transaction.

Package 1 must finish the existing canonical completion/attempt transaction FIRST, then call `reconcileMissionOutcomes(undefined, player.id)` outside that transaction and refresh the provider. Supply its returned `campaign/history`, provider snapshot, ISO `now`, local `hour` and receipt-derived `victory/levelUp` to `getGameMasterState`. Never send XP to this API. A technical failure should retain its technical reason in the attempt row. Unknown legacy verification quality stays unknown. A selected quest ID is an existing catalog/persisted Daily ID, including unchanged a1/a2 variants.

HOME's `MissionFocus` receives `MissionDirective` and a separate `MissionAction {label,onPress,disabled?}`. Package 1 should replace the temporary route callback with its canonical action. Do not place completion, XP, loot, equip or recovery transitions inside HOME. Preserve Package 1's ownership of receipt sequencing when resolving shared-screen/provider changes.

## Memory and adaptation

`quest_attempts`, `quest_completions` and `verified_events` supply result, activity, duration, verification score and reason. Up to 500 recent attempts and 500 completions are read; the underlying history is not deleted. The campaign projection is stored under `game_master_campaign_v2` in existing `app_state`, scoped to player ID and the existing reset transaction. No new migration. Choice and completed quest IDs survive reload; duplicate completions cannot advance a chain again. Corrupt campaign data fails without overwriting the saved value. Profile changes reject stale choice writes.

Semantic cooldown uses canonical family, activity, target stat, duration bucket and difficulty. It ignores wording; renamed/paraphrased AI copy cannot create novelty. Templates carry the semantic categories. Two days of recent nontechnical history exclude matching signatures. Behavioral preferences come from outcomes, not clicks. Diversity measures distinct signatures over recent outcomes.

Adaptation calls the existing Adaptive Engine with normalized real outcomes. Stable verified successes allow a higher target; failure/abandonment or repeated excessive duration selects recovery. Technical reasons including GPS_ERROR, DATABASE_ERROR, APP_CRASH, PROCESS_ENDED and PERMISSION_DENIED do not become player failures. Selection never rewrites a saved quest's target, ID or reward to achieve a difficulty recommendation.

Comeback follows at least four days without recorded activity and requests a short easy mission. Recovery uses actual overload, the existing recovery life state or a broken streak. Neither changes XP, debt, freeze tokens nor streak counters. Successful canonical gameplay still owns those changes.

## Campaign and consequences

Mini chains contain five outcome-driven stages: planning, action, review, practice, summary. Two chains form a ten-completion arc. A thirty-day campaign cycle has FOUNDATION/PRACTICE/CHALLENGE/REVIEW phases. These influence selection and explanation without modifying Story unlocks. The state exposes previous quest, current stage, next preparation, available next quest IDs, chosen direction and consequence. Existing Journey/goal priorities influence ranking.

Choice changes future ranking. Canonical results update PROGRESS/REST/RETRY; recent outcomes affect readiness and Recovery/Comeback directives. Boss/World Event state and player progress influence scene atmosphere. These are presentation/planning consequences, not new combat damage or Story reward mechanics.

## HOME integration

GM owns NORMAL/TENSION/THREAT/BOSS/RECOVERY/COMEBACK/VICTORY/AWAKENING. HOME only maps directives to bounded effects. World Boss presence can originate from existing MINI_BOSS/ELITE_ENEMY World Events and opens World; Story Boss opens Story. Weather is CLEAR/MIST/ASH, lighting DAY/NIGHT/WARM. Recovery/Comeback calm the atmosphere. Character accepts the typed reaction contract; victory/level-up/recovery have visual treatment. Existing equipment presentation slot and actual equipped names are preserved.

The old HOME-derived world model was removed. Audio reuses existing scene cues; no new assets or perpetual animations. Existing reduce-motion/LOW/background cancellation remains. Decision metrics enter the existing bounded telemetry queue, with no raw evidence, goal text, birth date, location or player identity.

## Package 3 status: all 50 requirements

DONE means implemented and covered at module/integration level, not verified on a phone.

| Points | Status | Scope |
|---|---|---|
| 1 | DONE | Existing player/profile plus one live campaign projection |
| 2–6 | DONE | Persisted canonical history and normalized outcomes/activity |
| 7–9 | PARTIAL | Modern records available; old missing duration/quality and historical boss difficulty cannot be reconstructed reliably |
| 10–16 | DONE | Reasons, semantic cooldown, diversity and outcome preferences |
| 17–23 | DONE | Adaptive selection/readiness, technical exclusion, Recovery/Comeback |
| 24 | PARTIAL | Chooses an existing easy return mission; cannot mint an absent persisted loadout entry |
| 25 | DONE | Recovery mission selection; preserves existing streak accounting |
| 26–29 | DONE | Linked five-stage chains and ten-completion arcs |
| 30 | DONE | Thirty-day cycle phases, no extra reward system |
| 31–36 | DONE | Persistence, recovery, predecessor/preparation, choice and planning consequences |
| 37 | PARTIAL | World presentation responds; no new authoritative Story branch mutations |
| 38–42 | DONE | Archetype/stats/perks/Boss/World Event influences |
| 43 | PARTIAL | One GM selection/explanation combines Daily/Weekly/Journey; existing generation and reward protocols remain their canonical subsystems |
| 44 | DONE | Existing access, time, difficulty and activity constraints |
| 45 | PARTIAL | All age modes filter candidates and saved AI copy; supervised Awakening variant is absent |
| 46–47 | PARTIAL | Deterministic offline decisions work with persisted safe candidates; return null explicitly when none exist |
| 48–50 | DONE | Telemetry, explanation and executed thirty-day simulation |

NOT STARTED: none of the requested mechanisms was wholly left unexamined/unimplemented. Partial gaps above are real release limitations.

## Package 2 former partials

12, 19, 21, 26, 27, 28, 29: logical contracts/integration DONE. Art pass remains for distinct World Boss art, equipment compositing, true night illustration and richer character/boss reactions. Weather directives are fictional atmosphere, not a weather service. The source sunset remains baked into the illustration.

## Validation

Baseline 590 tests preserved. New suites include nineteen GM tests and ten HOME × real GM integration cases plus hook lifecycle coverage. Simulation executes thirty calendar days including absence, successes, failures, a technical failure, broken streak, recovery, comeback, stats/level/perk changes, Boss state, World Events and choice. Result: 19 completions, 4 families, target difficulties 1/2/3, persisted reload every active day, later campaign chapters.

Final command counts and SHA are recorded in the task response. No native render or APK validation performed. Before release: verify small screens and large fonts, actual offline restart, world/portrait edges, reduce motion and cue balance on a physical phone.

## Do not merge yet

Do not merge into release or Package 1 automatically. Resolve the missing supervised Awakening mission/catalog contract before releasing to minors/unknown-age players. If no safe persisted candidate exists (age, cooldown or difficulty), HOME explains the lack of a mission instead of bypassing constraints. Package 1 must coordinate `home4/HomeWorldScreen.tsx`, existing Director and the added database memory adapter; `gameLoop/*` was not touched.

### Executed final verification

- Gameplay: 310/310, 21 groups each bounded to 180 seconds.
- Remaining app tests: 192/192 (including 19 GM tests and 22 HOME tests).
- Backend: 103/103; scripts/assets: 15/15.
- Total: 620/620 PASS, zero skipped.
- TypeScript: exit 0; diff whitespace check: exit 0.
- HOME × GM: ten dedicated cases; separate hook blur/profile test.
- Native build, phone tests, migration deployment: not run.
