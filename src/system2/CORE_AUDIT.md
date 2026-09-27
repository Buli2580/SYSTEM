# SYSTEM core audit — 2026-09-18

Scope: C:\Users\Ja\SYSTEM-codex, agent/codex. Clean working tree before edits. Existing Expo 57 documentation read as required by AGENTS.md. No branch switch, merge, worktree modification, UI redesign, new library or database migration.

## Architecture and inventory

- Expo Router in src/app: Home (/), Character, Quests, Quest Run, Story, World, More/Settings, System Log. Onboarding is presented through SessionGate. Also retained legacy and Expo explore routes.
- SYSTEM 2.0 is src/system2: core, quests, verification, activity, daily, world, story, identity, storage, notifications, state, screens and components. React Context/SystemProvider orchestrates snapshots, refresh, rewards and lifecycle; transient verification state lives in useQuestRun. No competing Redux/Zustand layer.
- Existing PlayerProfile has id/displayName, realLevel/realXp/totalRealXp/realXpToNextLevel, createdAt, streak and verifiedQuestCount. Completed IDs/timestamps are canonical quest_completions rows, exposed through SystemSnapshot, not duplicated in player JSON.
- Stats already cover strength STR, endurance VIT, discipline WIL, intelligence INT, social CHA plus CRE and RES. Preserve these established keys and save format rather than add aliases with competing values.
- Quest already includes category/difficulty/rewards/status/timestamps. RunnableQuest definitions omit stored status; availability derives from completions/prerequisites and active session. Failed/interrupted history is QuestAttempt, so failure does not permanently lock a retry. MAIN/DAILY/SIDE and additional categories already exist.
- Existing progression supports the real/skill XP curves, multiple level-ups, ranks and avatar evolution. rewardReceipt/hasLevelUp provide level-up detection. normalizePlayer rebuilds derived values from canonical totals.
- Verification: real foreground GPS/TIMER/MULTI, validated evidence, classification and lifecycle cleanup. Three Awakening quests, Daily/Weekly, World sectors/Signal, Chapter 2, Side/Hidden/Rematch and staged Boss already function; these are not merely visual concepts.
- Persistence: expo-sqlite, schema v5, serialized operations plus exclusive transactions and unique claims. Existing migrations preserve saves. Player/settings in app_state; completion/event, Daily/protocol, sector/signal, story and attempt tables. Avatar is an app-owned permanent file. No account/cloud progression sync.
- Reusable UI: SystemScreen/SystemPage safe area, Action, bars/cards, PlayerHero, IdentityAvatar, rewards/celebrations, SystemError/Boundary, BottomNavigation, map components. All preserved.
- Tests: node:test + installed TypeScript loader + real Node in-memory SQLite adapter; 173 baseline passing tests. Native device behavior still requires Android QA.
- Legacy src/game/core.ts and src/system/game.ts carry other models/progression; src/screens and legacy route remain separate. server/server.js is an Express/OpenAI media service, not an authoritative progression backend. Neither is modified.

## Findings and bounded foundation

Working systems already exceed a first MVP foundation. Missing future functionality includes authoritative remote persistence/time and server verification, account sync, guild/social and achievements. Chapter 3 is intentionally locked. Coins/chests and several verification/category types are reserved model vocabulary, not implemented inventory/sensor features. GPS capability exists; steps/motion/watch remain false. MapLibre Demo Tiles remain development configuration.

Main debt addressed: repeated reward arithmetic in quest, chapter, Daily, Story and World persistence; arithmetic accepted NaN/Infinity/fractions/negative XP; current time was implicit in XP helpers. Other debt (large database module, legacy duplication, broad single test file) is reported, not cleaned up opportunistically.

core/questEngine.ts is the pure domain boundary: applyQuestRewards validates and computes XP/stat/energy changes; completeQuest validates evidence and produces the updated player, completed quest and VerifiedEvent using an explicit timestamp. No React, storage or wall-clock reads in these functions. It rejects unsupported inventory rewards rather than silently losing them. Existing XP helpers accept an optional injected timestamp, preserve their compatibility defaults and reject invalid/overflow XP.

SQLite still owns availability (including time-sensitive Daily/Boss), unique claims and all-or-nothing commits. A pure function cannot protect two separate callers from double spending; the existing transaction is the final guard. It resolves access before calling completeQuest and writes its result in the same transaction with Story/protocol rewards. No manual completion UI or unverified reward path was added. No new storage abstraction is needed for an already-working SQLite adapter; a future adapter can call the same pure functions but must enforce equivalent access/claim semantics.

Existing nextStreak stays the pure streak rule: only full Daily Clear changes streak, in its existing unique protocol transaction. Ordinary quest completion and failed attempts do not increment or penalize it. Reward values, XP curves, thresholds and schema v5 stay unchanged.

## Validation and remaining limits

Baseline: all 173 tests pass. Baseline TypeScript reports only missing declarations for animated-icon.module.css and the global.css side-effect import in unrelated Expo web/template files. No ESLint config or local ESLint package exists; CI-mode expo lint tries automatic setup and fails with network EACCES. No lint dependency/config was installed. These existing failures are reported separately; they do not justify unrelated UI changes.

Added domain tests cover normal/exact/one/multiple level gains, level-up detection, zero/invalid/overflow XP, stat rewards/multiple skill levels, immutability, deterministic timestamps, verified completion/event output, blocked/failed/double completion, insufficient GPS evidence and unchanged timer distance/streak. Existing transaction concurrency/rollback tests remain the persistence-level duplicate guard.

Next core task (not started): formalize a repository/service contract for verified completion access and idempotency before adding a remote progression adapter. Do not introduce cloud authority without a verification/security design.

## Final validation

- 186/186 tests PASS (173 existing + 13 domain cases), zero skipped.
- Full TypeScript: only the same two baseline missing CSS declaration errors (TS2307 animated-icon.module.css, TS2882 global.css); no new errors.
- Lint unavailable: missing ESLint configuration/dependency; automatic setup failed with network EACCES, no installation performed.
- git diff --check PASS. Nine scoped files; no UI, routing, dependencies, schema or secrets added.
- Test loader corrected to use live default wall time with live GPS fixtures; explicitly injected clocks stay deterministic. This removes false future-GPS failures on slower runs without changing application verification tolerances.
