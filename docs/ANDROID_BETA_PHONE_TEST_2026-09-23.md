# SYSTEM Beta - Android phone test (23 September 2026)
Snapshot source: PR #138, including stacked Beta 2.0, World/Audio/Cards, ACTION 3.0, MOVE 1.0 and selected Character Forge/private camera integration.
Do not confuse a successful APK build with full production security validation.

## Install / startup
- Install APK on a physical Android phone from the EAS link (not Expo Go).
- Fresh install: cinematic Awakening, age mode, initial goal and first quest. Relaunch without losing state.
- Existing install: preserve player, streak, XP, quests, avatar and previous SQLite data. Keep a backup before overwriting your working build.
- Check no blank screens, dead routes, severe freezes, or runaway audio.

## Game loop
- Home 3.0: Real Level/XP, energy, streak, next action, Daily/Weekly/Boss/World/Social.
- Quest: BRIEFING > ACTIVE > VERIFY > REWARD > NEXT; test airplane mode, interruption, refusal of permissions, recovery and double-completion attempts.
- AI GM: quest guidance, history/context and recovery; AI text must never grant XP directly.
- Character: three styles, evolution, avatar gallery, camera permission and private-preview deletion after leaving/relaunch.
- World 3-hour events, Boss phases, perks, combat visualizer, smart notifications, card rarity and audio buses.

## MOVE and online
- Age modes UNDER_6, 6-8, 9-12, 13-17, adult; child-safe consent paths.
- 60-minute target in multiple segments, movement skills, daily quests, move streak, Family/School groups.
- GPS walk/run/bike on a real phone: start timer only after GPS readiness; foreground, screen lock, GPS loss, app restart, low GPS accuracy, fake location warning and battery use.
- TURN OFF mobile data and retry: verified contributions must be pending locally and reconcile after reconnect; never count repeated evidence twice.
- A local guardian acknowledgment is not a verified online ranking event.
- Test invitation expiry and group privacy under multiple accounts.

## Known boundaries for this snapshot
- Health Connect and Apple Health native providers are not installed; STEPS/HEALTH evidence can legitimately show unavailable.
- The new MOVE verified-ranking migration from PR #137/#138 was NOT deployed to the live Supabase instance. Test offline play; do not treat new online verified rankings as ready until migration/test/rollback review.
- Adult private camera preview stores only locally and is not verified quest proof for XP or cloud sharing. Do not enable child photo proof.
- Sensor summaries cannot prove physical activity cryptographically. Keep real-money/sponsor prizes and public competitive verification disabled.
- GitHub-hosted CI had runner allocation/billing failures; rerun Windows tests, Android bundle and install checks before beta distribution.

## Bug reports
Record phone model, Android version, package version, exact quest, age mode, GPS/background permission state, network state, UTC/local time, steps to reproduce, screenshots and crash log without posting personal location or photographs publicly.
