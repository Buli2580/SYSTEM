# RC3 TASK 004 — Living Domain 1.0

Branch: `integration/rc3-awakening-world`. Base: `7d3ff92e1517cd13d8ae6a3db6f18af5cf79145c`.

## Implementation

- `src/system2/domain/storage.ts`: versioned domain record under `living_domain_v1:<playerId>` in existing SQLite `app_state`. Created only after onboarding. Existing profiles initialize from their canonical completions. Name persists across identity edits and restarts.
- `src/system2/storage/database.ts`: domain included in the existing transactional snapshot, including completion results. Provider already publishes those snapshots; no parallel provider or reward flow.
- `src/system2/home4/DomainPanel.tsx`: compact neutral HUD, real routes to quests, goals, progression and inventory. Navigation lock resets on focus. Forge and Sanctuary are text-only LOCKED entries.
- `src/system2/home4/HomeWorldScreen.tsx`: composes DomainPanel below existing mission and Daily/Weekly focus. Background, avatar, main CTA, animations and safe-area layout retained.
- Tests: `src/system2/tests/domain.test.cjs`, `gameplay.test.cjs`, `home-world-4.test.cjs`.

## Persistence and progression contract

Canonical `quest_completions` is the sole source of development. Level = 1 + floor(unique completions / 5). No additive counter, no new XP, no new reward claim. First completion exposes the domain milestone “Pierwszy fundament”, without XP or loot. This is a domain milestone, not a new claim in the global achievement reward catalog.

The database already scopes gameplay to its current local profile. The domain additionally stores and validates playerId in its key and payload. It is a local offline feature, not a new cloud synchronization contract. Opening HOME writes only if the canonical projection changed. Unreadable or unsupported saved records are preserved and surfaced as a retryable snapshot error instead of silently overwritten. No SQLite schema change or migration.

Real file-backed SQLite test closes and reopens the database. Gameplay integration test uses actual database API: onboarding → domain → verified safe quest → concurrent duplicate completion → module restart → same domain and XP. Device process death and visual rendering remain untested.

## 50-point checklist

DONE means implemented or explicitly preserved and checked in code/tests. PARTIAL identifies missing device or visual validation. Updated user scope explicitly keeps Forge and Sanctuary locked.

| # | Status | Evidence / limitation |
|---|---|---|
| 1 | DONE | Correct branch/base; clean starting status |
| 2 | DONE | Existing HomeWorldScreen, WorldStage and CharacterStage inspected |
| 3 | DONE | Existing snapshot, completion transaction and app_state used |
| 4 | DONE | ART retained; no second asset registry |
| 5 | DONE | Private Domain image unchanged |
| 6 | DONE | DomainPanel composed into existing HOME |
| 7 | DONE | Versioned DomainState |
| 8 | DONE | Legacy profile test |
| 9 | DONE | No player/inventory replacement; gameplay regression |
| 10 | DONE | SQLite only, no network requirement |
| 11 | DONE | Onboarding marker gates creation |
| 12 | PARTIAL | Initial state labelled ruined refuge; existing background retained, no new ruin-stage art |
| 13 | DONE | playerId key and payload |
| 14 | DONE | Persistent initial name from profile |
| 15 | DONE | One domain level per five unique completions |
| 16 | DONE | Explicit location states |
| 17 | DONE | Versioned locations and development thresholds |
| 18 | DONE | No payments dependency |
| 19 | DONE | Existing app_state and profile transaction |
| 20 | DONE | Database close/reopen test |
| 21 | DONE | Command Center → existing quests; HOME GM CTA retained |
| 22 | DONE | Forge LOCKED, future crafting described |
| 23 | DONE | Academy → goals and progression |
| 24 | DONE | Sanctuary LOCKED, future regeneration described |
| 25 | DONE | Vault → inventory/equipment |
| 26 | DONE | Available entries have real functions; two locked per approved scope |
| 27 | DONE | AVAILABLE/LOCKED displayed |
| 28 | DONE | Typed versioned location model |
| 29 | DONE | No fake screens or crafting/regeneration buttons |
| 30 | DONE | Existing routes reused |
| 31 | DONE | Canonical quest completion table |
| 32 | DONE | Verified completion integration test |
| 33 | DONE | Repeated reads do not increase progress |
| 34 | DONE | No XP mutation introduced |
| 35 | DONE | Existing completion uniqueness; concurrent completion test |
| 36 | DONE | First Foundation domain milestone, no economic reward |
| 37 | DONE | Level, completion count and next threshold |
| 38 | DONE | Existing active quest CTA retained |
| 39 | DONE | Completion snapshot includes updated domain |
| 40 | DONE | Game Loop untouched; regression |
| 41 | DONE | Existing dark palette and neutral HUD |
| 42 | DONE | No opaque full-screen panel or replacement background |
| 43 | DONE | Existing finite Reanimated scene effects retained |
| 44 | DONE | Memoized panel, no polling or extra animation loop |
| 45 | PARTIAL | Wrapping layout and scrolling; physical phone sizes not tested |
| 46 | DONE | Inside existing safe-area scroll layout |
| 47 | DONE | Navigation guard tested with repeated taps |
| 48 | DONE | Separate file-backed SQLite persistence tests |
| 49 | DONE | HOME/navigation and real progression regression tests |
| 50 | PARTIAL | Automated API/restart flow covered; complete physical-device flow pending |

Total: **47 DONE / 3 PARTIAL / 0 NOT STARTED** under approved scope.

## Remaining checks

## Executed verification

- `npm.cmd run typecheck`: PASS, exit 0.
- `node --test src/system2/tests/gameplay.test.cjs`: 319/319 PASS, 124.478 seconds. Includes 2050-second simulated gameplay with four missions and four remembered GM outcomes.
- `node --test src/system2/tests/home-world-4.test.cjs`: 23/23 PASS (run together with the following two suites).
- `node --test scripts/visual-assets.test.cjs`: 8/8 PASS.
- `node --test src/system2/tests/domain.test.cjs`: 3/3 PASS.
- Combined final targeted run: 34/34 PASS. Total unique tests: **353/353 PASS**.
- `git diff --check`: PASS.
- No regression failures in the final runs. Initial domain tests failed because the new module did not yet exist, then passed after implementation.
- Device rendering/native rebuild: NOT RUN. No new native dependency; delivery still requires a separately authorized updated app build or applicable update process.

## Device and follow-up limitations

Phone: small/large screens and font scaling, background visibility, return navigation, actual process termination/restart after completion, Android performance. New art depicting progressive rebuilding was not created. Domain is local; cross-device domain persistence is not claimed. Forge crafting and Sanctuary regeneration await their own implementation. Next requested package: Living Gear + Tracebook 1.0.

No APK build, push, merge, SQL deployment, dependency changes or cinematic edits.
