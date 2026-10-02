# RC3 — Graphics Integration 1.0

## Source and scope

Worktree: `C:\SYSTEM\SYSTEM-RC2`. Branch: `integration/rc3-awakening-world`, confirmed by the user. Starting HEAD: `74201f1cb25279c7c4fea548cc2d88ef14f3e0a2`.

The user confirmed that removal of the old 48 WebP files and `assets/visual/manifest.json` is intentional. Those removals are preserved. The existing `ART` registry and rendering components are extended; no second graphics engine, new character class, gameplay rule or dependency was introduced.

## Asset inventory

`assets/visual/rc3/SYSTEM_RC3_ASSETS_20` contains 20 unique WebP images plus its manifest and README. Every image header reports 1080 × 1920 with no alpha channel. All 20 SHA-256 values match the supplied manifest. Images total 14,007,260 bytes (13.36 MiB). The supplied manifest identifies upscaled 941 × 1672 sources; these are not native 1080p renders.

Eight statically registered images total 4,995,762 bytes (4.76 MiB):

| File | Actual use |
| --- | --- |
| intro/01_system_emblem.webp | Boot DETECTED; onboarding background |
| intro/02_boot_void.webp | Boot ONLINE and unknown-phase fallback |
| intro/03_boot_portal.webp | Boot AWAKENING |
| intro/04_world_reveal.webp | Boot WORLD |
| intro/05_first_awakening.webp | Awakening Path, final onboarding step, actual AWAKENING quest illustration |
| character/09_avatar_neutral.webp | Profile creation portrait, default HOME/Character portrait |
| home/10_private_domain.webp | HOME 4 world background |
| character/11_character_selection.webp | Existing profile creation step background |

Not registered or displayed: `06_vanguard`, `07_shadow`, `08_sage`, `12_world_boss`, `13_portal_hall`, `14_loot_chest`, `15_combat_scene`, `16_skill_tree`, `17_settlement`, `18_guild_vista`, `19_awakening_power`, `20_final_city_vista`. Their originals remain in the imported RC3 package. No Boss/Guild/PvP screen received these assets.

## Presentation and fallback

- Full scenes use centered `cover`; portraits use `contain` and a 9:16 frame in onboarding. No transparent cutouts are fabricated.
- Character Creation means the existing profile step; there is no separate class-selection screen in this source. All styles use the neutral portrait until dedicated variants exist. Real evolution values and equipment remain unchanged.
- A saved user photo retains priority over default art.
- `ArtImage` provides a native dark fallback on missing/failed source; changing the source allows loading again. Images do not intercept touch or add screen-reader noise.
- Boot/onboarding background transitions are 180 ms, disabled by reduce motion. No new repeating animations or eager loading of all 20 images.
- Removed legacy illustrations resolve to the existing neutral thumbnail fallback. This includes quest categories, item slots, badges, map marker art and marketplace categories. No unrelated RC3 image substitutes for missing reward/Boss artwork.
- `system_boot.mp4` is unchanged: Git blob before/after `7d450256026c340e027d37850e4318f54bddf26a`.

## Changed code and tests

- `src/system2/visual/assets.ts`
- `src/system2/components/VisualArt.tsx`
- `src/system2/components/SystemBootSequence.tsx`
- `src/system2/components/CharacterCard.tsx`
- `src/system2/screens/OnboardingScreen.tsx`
- `src/system2/screens/AwakeningPathScreen.tsx`
- `src/system2/home4/WorldStage.tsx`
- `scripts/visual-assets.test.cjs`
- `src/system2/tests/home-world-4.test.cjs`
- `src/system2/tests/gameplay.test.cjs` — native reduce-motion mock only
- This report, the RC3 package, and the user-confirmed removal of the old visual package.

The old asset assertions were updated to explicitly test the approved retirement of legacy art, native placeholders, and the supplied RC3 manifest. Reward, progression, navigation and photo-priority assertions remain intact.

## Verification

- Gameplay: 318/318 PASS, including the 30-minute loop simulation.
- Canonical goals/onboarding: 46/46 PASS.
- HOME/World: 22/22 PASS.
- Visual assets: 8/8 PASS.
- Total: 394/394 PASS.
- TypeScript: PASS.
- Static media scan: 36 references checked, no missing files (including the configured assets alias).
- `git diff --check`: PASS.

No Android/APK build, dependency installation, backend deployment or phone test was performed.

## Remaining device checks

On a physical Android phone, check text contrast and portrait framing at small/large font sizes, keyboard scrolling during profile creation, reduced-motion behavior, transitions between Boot phases, HOME photo priority, memory usage and frame rate. The illustrated backgrounds have baked-in detail; manual visual review is still required. Retired screens intentionally show neutral placeholders until suitable replacement artwork is supplied.
