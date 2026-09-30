# HOME / WORLD 4.0 — Package 2

Base: `aa57e9a0861f1554e8ec8ee6522ab483d5cf8fa4`.
Branch: `feature/home-world-4`. No merge with Package 1.

## Boundaries

- `SystemHomeScreen` is the route entry and delegates to `home4/HomeWorldScreen`.
- `HomeWorldScreen` preserves the existing Director, quest routes, unlock rules, audio calls and receipt dismissal behavior. It reads provider state; it does not award, equip, complete or synchronize anything.
- `MissionFocus` accepts a `MissionAction` (label, callback, disabled). Package 1 can supply its canonical action here without replacing the scene or adding another quest state machine.
- `WorldStage` accepts derived presentation and an existing scene event. It owns art, atmosphere and finite entrance parallax.
- `CharacterStage` accepts identity, presentation event and an equipment slot. The current adapter supplies the actual equipped item names and opens the existing Character screen.
- `useWorldEnvironment` follows OS reduce motion and app lifecycle. It defaults to static until accessibility resolves. Day/night refreshes on focus and foreground; no background timer.
- `model` only derives presentation. No RNG, rewards, storage, network, backend or quest mutations.

The CTA now displays the selected quest's existing `rewards.realXp`, falling back to the story/awakening reward only when no quest was selected. It does not calculate or grant XP.

## Performance and assets

Existing local `ART.home`, `ART.boss`, `characterArt` and `IdentityAvatar` are reused. No asset files added or modified. Character art has an opaque background and remains an illustration, not a fabricated cutout. User photos retain priority. Failed art falls back to a solid scene surface; a changed source can load again.

Two finite animations (world 1400 ms, character 650 ms) run on focus/presentation changes, cancel on blur/background, and are disabled in LOW or OS reduce motion. No infinite loop, sensor subscription or frame-by-frame JS listener. At most six atmospheric particles; none in reduced mode. Parallax is an entrance depth effect, not device tilt.

## Requirement status (user's numbered list)

DONE in code/tests: 1–11, 13–18, 20, 22–25, 30–50.
PARTIAL: 12, 19, 21, 26–29.
NOT STARTED: none within the requested preparation scope.

Details of partial items:
- 12: existing story Boss art is in the world; no distinct World Boss feed was invented.
- 19: bounded atmospheric ash/mist layer; no live weather source or rain simulation.
- 21: local-hour lighting tint, no separate night illustration. Time refreshes on entry/foreground.
- 26: equipment slot and actual loadout names; no item-specific avatar compositing (assets lack alpha).
- 27–29: existing HOME/QUEST/BOSS/AWAKENING/VICTORY modes drive finite character/world/boss presentation. Package 1's detailed event stream is not connected.

## Integration precautions

Do not merge automatically with `feature/game-loop-4`. The only existing implementation file changed is `screens/SystemHomeScreen.tsx`; its old body has been moved/recomposed under `home4`. If Package 1 edited that file, manually retain its canonical action/completion ownership and feed the presentation seam. No `gameLoop/*` file was read or edited for implementation.

Keep current provider/receipt behavior until a coordinated Package 1 integration replaces it. This package deliberately does not implement reward sequencing. Other existing features remain reachable through the unchanged bottom navigation and their existing screens.

## Validation and remaining visual checks

Automated verification covers model, render tree, real action callbacks, route destinations, actual quest reward presentation, photo priority, equipment slot, image fallback, finite animation cancellation and accessibility lifecycle. Existing application, backend and script suites were also run; results are in the task report.

No phone render, native GPU profiling, screenshot comparison or APK build performed. Before release check 360 px screens, landscape, large fonts, opaque portrait/boss edges, daylight readability, LOW mode, OS reduce motion, and navigation while reward overlays are present. The day tint cannot remove the sunset baked into the source illustration.
