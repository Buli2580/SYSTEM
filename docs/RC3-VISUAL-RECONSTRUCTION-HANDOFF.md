# RC3 — Visual Reconstruction Handoff 1.0

Data audytu: 2026-10-04 (Europe/Warsaw). Zadanie 006. Budżet: 0 zł.
Repozytorium: `C:\SYSTEM\SYSTEM-RC2` (wskazany przez sesję `E:\SYSTEM` nie istnieje).
Baza: `integration/rc3-awakening-world`, HEAD `e3218c0390ff154aa323459806f5caf30cf093e0`.
Gałąź pracy: `prep/rc3-visual-reconstruction`. Bez commita, push, merge, reset i rebase.

## 1. Bezpieczeństwo i zgodność z APK

Git przed rozpoczęciem był czysty. Oficjalny manifest w
`dist/official/e3218c0390ff154aa323459806f5caf30cf093e0-dc80fed2-fe1a-4b70-8d82-d7db93e037ad/`
wskazuje bazową gałąź i ten sam SHA. Wersja 1.0.1, versionCode 213171610,
builtAt 2026-10-03T06:20:08.924Z. Oficjalny APK i
`dist/rc3-device-beta/SYSTEM-RC3-DEVICE-BETA.apk` mają identyczny SHA-256:
`cd4b35bbac96dfd065811977761ff8eb807986d88f3706648fa06d06958703e9`.
To dowód zgodności lokalnego artefaktu ze źródłami, nie odczyt instalacji telefonu.
Działanie APK na telefonie i opis problemów UX pochodzą od właściciela zadania.

Nie zmieniono ekranów, routingu, BottomNavigation, nagród, SQLite, migracji,
profilów, danych świata, serwera, zależności ani `assets/video/system_boot.mp4`.
Stary `docs/OFFICIAL_APK_SOURCE.md` opisuje evening-build; aktualna lista dozwolonych
gałęzi jest w `scripts/apk-provenance.cjs`. Gałąź prep nie jest autoryzowana do
oficjalnej budowy APK. Nie rozszerzać tej listy przy przebudowie wyglądu bez zgody.

## 2. Pięć głównych zakładek

| Zakładka | Trasa | Plik trasy | Komponent |
| --- | --- | --- | --- |
| HOME | / | src/app/index.tsx | src/system2/screens/SystemHomeScreen.tsx → src/system2/home4/HomeWorldScreen.tsx |
| QUEST | /quests | src/app/quests.tsx | src/system2/screens/QuestsScreen.tsx |
| CHARACTER | /character | src/app/character.tsx | src/system2/screens/CharacterScreen.tsx |
| WORLD | /world | src/app/world.tsx | src/system2/screens/WorldScreen.tsx |
| SOCIAL | /social | src/app/social.tsx | src/system2/screens/SocialScreen.tsx |

Nie ma `QuestScreen.tsx`: właściwe nazwy to `QuestsScreen.tsx` (hub) oraz
`QuestRunScreen.tsx` (aktywna misja). Zadanie przygotowawcze nie zmienia żadnego z nich.
`src/system2/components/BottomNavigation.tsx` definiuje pięć przycisków i używa
`router.replace`. Nawigator to Stack w `src/app/_layout.tsx`, nie pięć natywnych Tabs.
`src/components/app-tabs.tsx` i wersja web to pozostałości startera; nie stanowią
bieżącego paska gry. Wspólne obramowanie: SystemPage, SystemScreen, SystemAmbientBackground.

### HOME

- Private Domain: sekcja DomainPanel na /, nie osobny ekran/trasa. Stan `system.domain`.
- Command Center: DomainPanel → /quests; misje i AI GM.
- Academy: /goals (cele/Journey) i /progression-2; nie osobna mechanika akademii.
- Vault: /inventory; realny loot Living Gear oraz kolekcja kosmetyczna.
- FORGE i SANCTUARY: LOCKED w domain/storage; brak mechaniki rzemiosła/regeneracji.
- WorldStage, CharacterStage, MissionFocus i DomainPanel znajdują się w `src/system2/home4/`.
- Rekomendacje HOME: gameMaster/useGameMaster, runtime, directives; nie zamieniać
  rekomendowanej misji na aktywną sesję. Aktywna misja pochodzi z provider/checkpoint.

### QUEST

- Awakening Path: /awakening-path → AwakeningPathScreen; /quests również pokazuje progres Awakening.
- Daily Director: AIDirectorPanel wewnątrz /quests. Nie istnieje /daily-director.
  /game-master tworzy kampanie; /ai-story prowadzi narrację. To inne istniejące funkcje.
- Daily / Weekly: sekcje /quests, nie osobne trasy. Weekly jest automatycznym bonusem;
  nie tworzyć przycisku uruchamiającego fikcyjny Weekly quest.
- Main Story: /story, Chapters + WORLD LINK + pierwszy boss. Wymogi rozdziału
  `world_sectors_3`, `first_signal`, `daily_clear` nie są RunnableQuest.
- Historia misji: /system-log (eventy i próby), /story (Chronicle), /tracebook (kronika).
- /quest?questId=...: runnable GPS_DISTANCE/TIMER/MULTI; brak ID wybiera istniejącą
  pierwszą misję; tablica/nieznane ID pokazują recovery. Bezpieczne warianty
  Awakening są mapowane zależnie od wieku. Zachować klucz komponentu quest.id.

### CHARACTER

- Profil, statystyki, ranga i ewolucja: sekcje /character, nie osobne trasy.
- Inventory / Living Gear: /inventory, komponent LivingGear i provider.inventory.
- Skill Tree: sekcja /character oraz /progression-2; istniejące skillTree2/storage.
- Evolution: player.avatarEvolution i istniejąca prezentacja tożsamości.
  Ewolucja konkretnej instancji ekwipunku i Forge pozostają LOCKED.
- Hero Card: cards/SystemPlayerCard, cards/HeroCardCollection, cards/engine;
  osadzone w /character i /social-profile, brak /hero-card.
- Tracebook: /tracebook; odnośnik m.in. z LivingGear. Nie rekonstruować historycznych
  dat/awansów, których nigdy nie zapisano.
- Istnieją dodatkowe /companions i /achievements; nie tworzyć alternatywnej progresji.

### WORLD

- /world oraz /explore to ten sam ekran, gated przez ready + worldUnlocked.
- MapLibre: components/world/WorldMap + NativeWorldMap; sektory, sygnał, follow/center.
- useWorldTracking → WorldTracking → storage/world. Cykl życia zależy od focus i AppState.
- Mapa 2.0: world/map2 i map2Storage; warstwy SECTORS/SIGNALS/EVENTS/BOSSES/MOVE.
- world/events.activeWorldEvent i WorldEventHUD: projekcja okna wydarzenia;
  sam HUD nie przyznaje nagrody.
- Pierwszy boss THE FIRST WALL: /story, story/catalog, storage/story,
  boss_progress i bossPhaseState. Etapy FOCUS → MOVE → DISCIPLINE, ostatni przez Daily.
- Podkład: world/mapConfig.ts obecnie wskazuje MapLibre Demo Tiles do QA.
  Brak płatnego klucza; nie traktować jako produkcyjnego źródła map.
- WORLD STATUS: ONLINE w obecnym UI jest tekstem prezentacji, nie dowodem połączenia
  z backendem. Nowy kontrakt nie przekazuje pola online.
- /raids to osobny moduł cloud, nie nowy lokalny boss mapy.

### SOCIAL

- /social: istniejące lokalne sesje GUILD/PVP/RAID z core/social i SQLite.
  Sesja może być przygotowana w LOBBY; ekran nie podpina realnych członków/opponentów.
- Profil społecznościowy /social-profile: player → toPublicPlayerProfile,
  rzeczywiste liczniki getCloudSocialCounts i sesja getValidSession.
- Guild /guilds: istniejące cloud/guilds + socialBattle.
- PvP /battle-network, tworzenie wyzwań również /friends: cloud/socialBattle.
- Raid /raids: cloud/raids. Wynik cloud rozlicza serwer, nie lokalny widok.
- Pozostałe trasy: /friends, /feed, /player-search, /leaderboard,
  /social-challenges, /seasons, /account.
- Kod API istnieje, ale ten audyt nie potwierdza dostępności wdrożonego backendu.
  Logowanie nie potwierdza matchmakingu, raidów ani aktualnej listy gildii.
- Zero fałszywych członków, rankingów i nagród. Nie wywoływać joinSession ani
  createSocialSession przy odczycie. Istniejąca akcja użytkownika może przygotować
  lokalną sesję; sam nowy kontrakt tego nie robi.

## 3. Pełny rejestr istniejących tras

Wszystkie poniższe pliki są w `src/app/<nazwa>.tsx`, HOME w index.tsx.
Komponenty są w `src/system2/screens/`. Rejestr kontrolny:
`src/system2/presentation/routes.ts`; nie zastępuje Expo Router.
Łącznie 45 adresów. `_layout.tsx` jest układem, nie ekranem.

| Trasa | Komponent | Stan i zależności |
| --- | --- | --- |
| `/account` | `AccountScreen` | Logowanie i profil cloud; API auth/social/state; wymaga rzeczywistej sesji. |
| `/achievements` | `AchievementsScreen` | Lokalna progresja i achievements/storage; bez osobnego naliczania XP. |
| `/ai-story` | `AIStoryDirectorScreen` | Narracja przez ai/story oraz story/director2; fallback, bez prawa do nagród. |
| `/awakening-path` | `AwakeningPathScreen` | Istniejąca ścieżka celu/Journey i Awakening; wariant zależny od wieku. |
| `/battle-network` | `BattleNetworkScreen` | Cloud PvP, Guild Wars i referral: cloud/socialBattle; sesja/API wymagane. |
| `/character` | `CharacterScreen` | Profil i sekcje stats/gear/skills/cards; główna zakładka. |
| `/companions` | `CompanionsScreen` | Istniejący katalog i companions/storage; nie dodawać nowych NPC. |
| `/expansion` | `ExpansionHubScreen` | Katalog odnośników do istniejących modułów. |
| `/explore` | `WorldScreen` | Alias tego samego WorldScreen co /world. |
| `/feed` | `FeedScreen` | Activity Feed: cloud/feed; żadnych wpisów syntetycznych. |
| `/friends` | `FriendsScreen` | Cloud socialCore/socialBattle: znajomi i wyzwania; sesja/API. |
| `/game-master` | `GameMasterScreen` | Istniejący kreator kampanii, guardrails i ai; operacje przez provider. |
| `/goals` | `GoalsScreen` | Istniejące cele/Journey; pierwszy cel również w SessionGate. |
| `/guardian` | `FamilySchoolScreen` | FamilySchoolScreen; istniejące zgody i ścieżki rodzinne. |
| `/guilds` | `GuildsScreen` | Cloud guilds/socialBattle; lista i dołączenie, bez fikcyjnych członków. |
| `/` | `SystemHomeScreen` | HomeWorldScreen przez re-export SystemHomeScreen. |
| `/inventory` | `InventoryScreen` | Living Gear SQLite oraz osobna kolekcja kosmetyczna AsyncStorage. |
| `/leaderboard` | `LeaderboardScreen` | Cloud social: rzeczywiste rankingi po logowaniu. |
| `/legacy` | `REDIRECT_HOME` | Wycofany adres, Redirect do HOME. |
| `/more` | `SettingsScreen` | Ustawienia/tożsamość/diagnostyka; zawiera akcję resetu, nie uruchamiać. |
| `/move-family-quest` | `MoveFamilyQuestScreen` | Istniejąca weryfikacja MOVE/family; chronić completeMoveActivity. |
| `/move-family` | `MoveFamilyScreen` | Istniejące rodzinne aktywności i loadMoveState; zasady wieku/bezpieczeństwa. |
| `/move-parent` | `MoveParentScreen` | Istniejący parentMoveSummary/loadMoveState. |
| `/move-quest` | `MoveQuestScreen` | Uruchamianie MOVE, useMoveVerification i serwerowa kolejka; questId. |
| `/move-school` | `MoveSchoolScreen` | Istniejący model szkoły/loadMoveState; nie dopisywać uczestników. |
| `/move` | `MoveScreen` | Istniejący katalog MOVE, plan i progresja; zapis przez database. |
| `/partner-marketplace` | `PartnerMarketplaceScreen` | Katalog kategorii; brak realnych ofert i nagród. |
| `/planner-2` | `Planner2Screen` | Istniejące habits/planning storage i lokalne przypomnienia. |
| `/player-search` | `PlayerSearchScreen` | Cloud social searchPlayers; wymaga API. |
| `/premium-hub` | `PremiumHubScreen` | Cloud premium/sponsors2; brak lokalnego sklepu z XP. |
| `/privacy` | `PrivacyScreen` | Istniejąca informacja prywatności. |
| `/progression-2` | `Progression2Screen` | Achievements, Titles, Skill Tree; aktywne węzły w AsyncStorage. |
| `/quest` | `QuestRunScreen` | Parametr questId, obsługa nieznanego ID i mapowanie bezpiecznego Awakening; QuestRunScreen. |
| `/quests` | `QuestsScreen` | Hub Awakening, Daily/Weekly, AI Director i Story; główna zakładka. |
| `/raids` | `RaidsScreen` | Cloud raids/getActiveRaids; wyniki rozlicza serwer. |
| `/seasons` | `SeasonsScreen` | Cloud seasons/getCurrentSeasonV2; sesja/API. |
| `/social-challenges` | `SocialChallengesScreen` | Cloud challenges/getSocialChallenges/getChallengeProgress. |
| `/social-profile` | `SocialProfileScreen` | Publiczny profil z social oraz liczniki z cloud/socialCore; błędy sieci osobno. |
| `/social` | `SocialScreen` | Lokalne GUILD/PVP/RAID state machine i social_history; brak podłączonego matchmakingu. |
| `/story` | `StoryScreen` | Chapters, pierwszy boss i Chronicle; startBossProtocol pozostaje w database. |
| `/system-lab` | `SystemLabScreen` | Istniejąca diagnostyka synchronizacji/telemetrii. |
| `/system-log` | `SystemLogScreen` | VerifiedEvent i próby: loadSystemLog/listQuestAttempts. |
| `/system-online` | `SystemOnlineScreen` | Istniejący ekran SystemOnlineScreen; odnośniki/account i diagnostyka cloud. |
| `/tracebook` | `TracebookScreen` | Istniejąca kronika z database.loadTracebook; filtrowanie po playerId. |
| `/world` | `WorldScreen` | Sektory, sygnał, GPS, wydarzenia i pierwszy boss; blokada do Awakening. |

Ekran bez osobnej trasy: OnboardingScreen montowany przez SessionGate.
HomeWorldScreen jest implementacją HOME za re-exportem SystemHomeScreen.
GameplayGate nie montuje efektów gameplay przed gotowością, onboardingiem i pierwszym celem.
LaunchGate, StoryNotice, AwakeningCelebration i RewardEventSequence montuje root layout.

## 4. Dokładne źródła danych

Wszystkie lokalizacje poniżej są względem korzenia repozytorium.

| Dane | Źródło / istniejące API | Właściciel zapisu |
| --- | --- | --- |
| Wspólny snapshot | src/system2/state/SystemProvider.tsx: useSystem, refreshPlayer | storage/database.loadSystemState, SystemSnapshot |
| Profil, XP, poziom, rank, siedem skills, energy, streak, evolution | src/system2/core/types.ts: PlayerProfile; provider.player | app_state/player; core/progression, core/questEngine; completion use case |
| Tożsamość i ustawienia | src/system2/identity/model.ts; provider.updateIdentity/saveSettings | storage/database, istniejący profil i ustawienia |
| Domena | provider.domain; src/system2/domain/storage.ts: readDomain | app_state/living_domain_v1:<playerId>; count unikalnych quest_completions |
| Aktualna misja | provider.activeQuestId; storage/database.loadBackgroundQuestSession/loadResumableQuestCheckpoint | background_quest_session, quest_checkpoint:<questId>, quest_attempts |
| Definicje i ograniczenia misji | src/system2/quests/catalog.ts: getQuest, awakeningQuestsForPlayer; availability.ts | istniejące catalogs, daily/templates, generation/templates i AI registry |
| Kanoniczny dostęp | storage/database.getQuestAccess | transakcja SQLite, prerequisites/daily + storage/story.bossAccess |
| Daily / Weekly / streak | provider.daily; src/system2/storage/daily.ts | daily_sets/instances, protocol_bonuses |
| Cele / Journey | provider.goals/journeys/journeyQuestIds | storage/goals.ts i storage/journeys.ts |
| AI Daily Director | provider.aiGameMaster/aiDaily/aiLoading/aiError | ai/, ai/registry; zaakceptowany plan w istniejącym storage |
| HOME GM | src/system2/gameMaster/useGameMaster.ts i runtime.ts | database.loadGameMasterMemory; gameMaster campaign/history |
| Progresja | provider.progression; src/system2/storage/progression.ts | istniejące tabele progresji, reward ledger |
| Living Gear | provider.inventory, equipItem/unequipItem; core/inventory.ts | inventory_items i database.loadInventory/equipInventoryItem/unequipInventoryItem |
| Kolekcja kosmetyczna | src/system2/inventory/catalog.ts i storage.ts | AsyncStorage system.inventory.equipped.v1; bez bonusów REAL XP |
| Statystyki prezentowane | core/inventory.presentedCharacterStats | projekcja; END/AGI nie są dodatkowymi skillami progresji |
| Skill Tree / aktywne węzły | progression/skillTree2.skillTreeState; skillTreeStorage.loadActiveSkillNodes | AsyncStorage system.skilltree.active.v1 |
| Aktywny companion | companions/storage.loadActiveCompanion | AsyncStorage system.companion.active.v1 |
| Achievements / aktywny title | provider.achievementState; achievements/storage.ts | istniejące SQLite tables achievements/titles |
| Hero Card | cards/engine.buildSystemCard(player) | czysta projekcja; nie nowy profil |
| Tracebook / loot history | database.loadTracebook/loadLootHistory; inventory/tracebook.ts | istniejące eventy/loot/domain; filtrować playerId |
| Próby / historia | database.listQuestAttempts/loadSystemLog/loadChronicle | quest_attempts, verified_events, story_events |
| Rozdziały / pierwszy boss | provider.story; story/types/catalog/selectors/bossEngine | storage/story.ts, boss_progress, story_progress |
| Sektory / sygnał / GPS | world/useWorldTracking.ts, tracking.ts, storage/world.loadWorld | discovered_sectors, world_signals; brak surowych tras w telemetry |
| Warstwy i zoom | world/map2.ts i map2Storage.loadWorldMap2State | AsyncStorage system.world.map2.v1 |
| Sesje lokalne Social / historia | provider.socialSessions; database.loadSocialSessions/loadSocialHistory | app_state/social_sessions, social_history; core/social state machine |
| Rzeczywista sesja cloud | cloud/auth.getValidSession; cloud/http i config.ts | SecureStore natywnie, AsyncStorage na web; nie ujawniać tokenów w UI |
| Profil/liczniki/friends/feed cloud | cloud/social.ts, socialCore.ts, feed.ts | rzeczywiste odpowiedzi API; nie zastępować błędu zerowym sukcesem |
| Guild / PvP / Raid / Seasons | cloud/guilds.ts, socialBattle.ts, raids.ts, seasons.ts | serwer; obsłużyć login, loading, empty i error osobno |

## 5. Kontrakty odczytu przygotowane dla Cursor

`src/system2/presentation/visualReadModels.ts`: selectHomeReadModel,
selectQuestReadModel, selectCharacterReadModel, selectWorldReadModel, selectSocialReadModel.
Eksportowane typy HomeReadModel, QuestReadModel, CharacterReadModel, WorldReadModel,
SocialReadModel i VisualReadSource są związane z istniejącym providerem.
ReadView daje głębokie readonly w TypeScript. Referencje są współdzielone, nie zamrażane
w runtime; nie mutować ich przez cast/JavaScript.

`src/system2/presentation/useVisualReadModels.ts`: opcjonalny hook nad useSystem.
Żaden istniejący ekran nie został na niego przełączony. Nie wykonuje IO, nie ma cache,
subskrypcji, zapisu ani nowego Context.

- HOME: gotowość/błąd, pełny profil, level/xp/xpToNextLevel/totalXp/energy/streak,
  activeMission (null gdy brak/nieznane ID), domain i istniejący Game Loop state.
  Rekomendację następnej misji dalej pobierać z istniejącego GM; nie udawać aktywnej sesji.
- QUEST: missions z access/conditions/rewards/progress/target, availableMissions,
  activeMission, Daily/Weekly, weeklyChallenges, Story, krótką historię prób,
  recentActivity, director i cele/Journey. Warunki weryfikacji i status dostępu to różne pola.
  Weekly jest projekcją daily; `weeklyChallenges` pochodzi z progression.
  Pełna historia przez istniejące listQuestAttempts/loadSystemLog, nie przez nowy magazyn.
- Postęp QUEST: opcjonalny `quests.checkpoint` pochodzi z loadQuestCheckpoint lub
  loadResumableQuestCheckpoint. Projekcja używa czasu dla TIMER i dystansu dla GPS/MULTI;
  checkpoint zawiera również pozostałe metryki. Bez niego progressSource=DEFINITION
  (katalogowy progress, nie obietnica aktualnego pomiaru). Żywy pomiar nadal z useQuestRun.
- Boss: opcjonalny `quests.bossAccess` napełnić wynikiem getQuestAccess(id).
  AVAILABLE/ACTIVE → true; pozostałe → false. Przy braku odczytu accessKnown=false,
  wiersz nie trafia do availableMissions. Nie powielać logiki sekwencji bossa w UI.
  Trudność i target pochodzą z story.boss.difficulty przez getQuest.
- CHARACTER: profil, siedem statystyk bazowych, istniejące presentedStats/gear,
  inventory/equipped, rank/evolution/titles/progression, skillTree i heroCard.
  Opcjonalne character.activeSkillNodes/legacyEquipped/activeCompanion dostarczyć
  przez istniejące loadery. Null oznacza brak przekazanego odczytu, nie pusty nowy zapis.
- WORLD: gotowość, unlock, liczba sektorów, dystans, story, tracking.
  Opcjonalny tracking przekazać z już zamontowanego useWorldTracking.
  Sam hook kontraktu nie uruchamia GPS, nie montować drugiego kontrolera.
  Dane mapy i eventy nadal przez istniejące map2Storage i activeWorldEvent.
- SOCIAL: istniejący lokalny profil i localSessions; brak tworzenia sesji i matchmakingu.
  Opcjonalny auth to obserwacja istniejącego getValidSession: loaded/session/error.
  Status UNKNOWN/SIGNED_OUT/AUTHENTICATED/ERROR opisuje odczyt autoryzacji.
  Tylko userId trafia do kontraktu; tokeny nie. Funkcje cloud mają stan
  UNCONFIRMED/REQUIRES_LOGIN/REQUIRES_API_CHECK. Po logowaniu konieczny rzeczywisty
  odczyt właściwego API; ten kontrakt nie ogłasza funkcji ONLINE.

Przykład integracji (w przyszłym ekranie, nie dodany w obecnym UI):

```ts
const {home, quest, character, world, social} = useVisualReadModels();
// Najpierw home.ready / home.error. Akcje nadal z useSystem().
```

Do przekazania pomiaru i już wczytanych danych:

```ts
const models = useVisualReadModels({
  tracking: existingWorldTracking,
  quests: {checkpoint: existingCheckpoint, bossAccess: existingBossAccess},
  character: {activeSkillNodes, legacyEquipped, activeCompanion},
  auth: {loaded: authLoaded, session: existingSession, error: authError},
});
```

## 6. Granice przebudowy bez ingerencji w Game Loop

Cursor może przebudować prezentację pięciu głównych ekranów, DomainPanel, MissionFocus,
CharacterStage/WorldStage, LivingGear, CharacterCard, karty questów, Hero Card i Tracebook
oraz prezentacyjne fragmenty Story/Progression/Inventory/Goals/SocialProfile.
Zachować wywołania provider/database, tożsamość misji, focus/AppState,
blokady przy wielokrotnym klikaniu, loading/error/locked i odświeżanie po mutacji.
Nowe podwidoki muszą konsumować te same dane; nie wymaga to nowych mechanik.

Elementy szczególnie powiązane z cyklem gry:
`quests/useQuestRun.ts`, `QuestRunScreen.tsx`, background/locationTask i locationService,
world/tracking/useWorldTracking, application/completeQuest, repositories/,
verification/, core/questEngine/rewards/progression, storage/database i migrations.
Nie przenosić ich efektów do dekoracyjnych kart ani uruchamiać ich przy zmianie layoutu.
Przy zmianie wyglądu QuestRunScreen zachować hook, key quest.id i cały lifecycle.

Kanoniczny przepływ: Quest → Proof → Verify → Reward → REAL XP → Skill XP.
Game Loop state machine i useGameLoopController obserwują prezentację.
Nagrody i pending receipts pochodzą z transakcji SQLite.
RewardEventSequence korzysta z trwałego kursora prezentacji; nie przeliczać nagrody
po ponownym montowaniu komponentu. Stop tracking/background i powrót z błędu
muszą dalej działać. Nowy router nie może ominąć GameplayGate/SessionGate.

## 7. Grafiki RC3 i importy

Pakiet: `assets/visual/rc3/SYSTEM_RC3_ASSETS_20/`; manifest.json i README.txt.
20 WebP, 1080×1920, bez kanału alpha; manifest wskazuje źródła 941×1672 upscale.
Nie są to gotowe przezroczyste avatary/logo/warstwy parallax.
Suma plików obrazów z poprzedniego audytu: 14,007,260 B (13.36 MiB).
Weryfikacja manifestów: scripts/visual-assets.test.cjs.

| Plik w pakiecie | Import ART / obecny stan |
| --- | --- |
| intro/01_system_emblem.webp | systemEmblem |
| intro/02_boot_void.webp | bootVoid |
| intro/03_boot_portal.webp | bootPortal |
| intro/04_world_reveal.webp | worldReveal |
| intro/05_first_awakening.webp | firstAwakening |
| character/06_vanguard.webp | plik dostępny, niezarejestrowany |
| character/07_shadow.webp | plik dostępny, niezarejestrowany |
| character/08_sage.webp | plik dostępny, niezarejestrowany |
| character/09_avatar_neutral.webp | avatarNeutral |
| home/10_private_domain.webp | privateDomain |
| character/11_character_selection.webp | characterSelection |
| boss/12_world_boss.webp | plik dostępny, niezarejestrowany |
| intro/13_portal_hall.webp | plik dostępny, niezarejestrowany |
| inventory/14_loot_chest.webp | plik dostępny, niezarejestrowany |
| boss/15_combat_scene.webp | plik dostępny, niezarejestrowany |
| progression/16_skill_tree.webp | plik dostępny, niezarejestrowany |
| world/17_settlement.webp | plik dostępny, niezarejestrowany |
| guild/18_guild_vista.webp | plik dostępny, niezarejestrowany |
| intro/19_awakening_power.webp | plik dostępny, niezarejestrowany |
| world/20_final_city_vista.webp | plik dostępny, niezarejestrowany |

Rejestr `src/system2/visual/assets.ts`: ART, questArt, characterArt, bootArt, itemArt.
Importować istniejące `ART.privateDomain` itp.; dla nowych użyć literalnego
`require('../../../assets/visual/rc3/SYSTEM_RC3_ASSETS_20/...webp')` w rejestrze.
Nie używać dynamicznego require ze ścieżką wyliczoną w runtime.
Komponenty `src/system2/components/VisualArt.tsx` (ArtBackdrop/ArtThumbnail),
IdentityAvatar oraz home4/WorldStage/CharacterStage już korzystają z lokalnych asset IDs.
W Expo Image można przekazać ten asset jako source i dobrać contentFit/contentPosition.
[Dokumentacja Expo Image SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/image/).

Stare ART.boss, ART.mapSignal, item/badge thumbnails są undefined i mają placeholdery;
nie podmieniać ich ilustracją, która sugeruje nieistniejący przedmiot/bossa.
characterArt obecnie wybiera ten sam neutralny asset dla wszystkich stage/style.
Zdjęcie użytkownika ma pierwszeństwo; dekoracja nie może nadpisać avatarUri.
Szczegóły dotychczasowej integracji: docs/RC3-GRAPHICS-INTEGRATION.md.

## 8. Expo SDK 57 / React Native

Zależności lokalne: Expo ~57.0.23, Router ~57.0.21, React 19.2.3,
React Native 0.86.3, Reanimated 4.5.1, Worklets 0.10.1, Skia 2.6.2.
Nie zmieniono zależności aplikacji, manifestów ani lockfile. Doinstalowano wyłącznie
już zadeklarowane @electric-sql/pglite 0.5.8 w ignorowanym supabase/tests/node_modules,
bez skryptów instalacyjnych, aby uruchomić istniejące testy backendu.
SDK 57 wymaga Node co najmniej 22.13.x i celuje w RN 0.86; sprawdzono
[wersjonowaną dokumentację](https://docs.expo.dev/versions/v57.0.0/).
Testy Node SQLite wymagają runtime z node:sqlite; tutaj Node 24.21.0.

Wnioski z kodu projektu:
- Nie importować browser CSS do natywnych ekranów. Używać już istniejących
  komponentów RN/StyleSheet i dostępnych bibliotek.
- Stack jest bieżącą strukturą; NativeTabs ze startera nie zachowają automatycznie
  obecnego routingu/gates. Zmiany struktury testować osobno.
- SafeAreaView ma edges top/left/right; BottomNavigation sam obsługuje bottom inset.
  Absolutny pasek minHeight 98 ma padding bottom. ScrollView muszą zostawić miejsce
  dla jego rzeczywistej wysokości, klawiatury i skalowania tekstu; obecne stałe nie
  są dowodem braku nakładania na wszystkich telefonach.
- Web WorldMap pokazuje fallback. Natywny MapLibre wymaga właściwego builda;
  pusty podkład lub fallback nie oznacza utraty zapisanych sektorów.
- Reanimated / Skia i pełne obrazy mają koszt pamięci GPU; utrzymać performanceMode,
  reduced motion oraz istniejące cleanup animacji/audio. Nie dekodować 20 teł naraz.
- Zmiana konfiguracji natywnej/libraries wymaga nowego native build.
  Ten task dodaje tylko TypeScript/testy/docs; sam nie wymaga prebuild.
  Oficjalny APK ma OTA wyłączone, więc dostarczenie przyszłej przebudowy telefonu
  wymaga nowego podpisanego APK.
- Nie uruchamiać GPS/background z kontraktu odczytu. Zachować istniejące uprawnienia
  i lifecycle. Zasady platformy: [Expo Location SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/location/).
- Nie zamieniać serializowanych transakcji na niezależne efekty UI.
  Referencja: [Expo SQLite SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/).

## 9. Zachowanie danych obecnych użytkowników

Baza `system2.db` z storage/database; `SCHEMA_VERSION=9` w storage/migrations.ts.
Przebudowa prezentacji nie potrzebuje migracji. Nie zmieniać nazwy/pliku bazy,
klucza player, player.id ani interpretacji totalRealXp/realXp/stat XP.
Zachować quest_completions, verified_events, inventory_items, story/boss progression,
Daily/Weekly, reward presentation cursors, outbox, domain i aktywne checkpointy.
Nie resetować danych przy brakującym opcjonalnym polu; ready/error mają osobne stany.

Domena używa `living_domain_v1:<playerId>`, nazwa jest zachowywana, a poziom
wyprowadzany z unikalnych ukończeń. Nie liczyć ukończeń z liczby wyrenderowanych kart.
Odtwarzanie misji pozostaje w refreshPlayer: background session → checkpoint →
poprzedni poprawny activeQuestId. Timer nie nalicza automatycznie czasu zamkniętej aplikacji.
Zachować profil/avatary zarządzane przez identity/avatar i dotychczasowe AsyncStorage
keys dla kosmetyków, Skill Tree, companion, map2, habits/planner oraz SecureStore auth.

Pakiet Android nadal `pl.systemworld.app`; aktualizacja musi mieć ten sam certyfikat
podpisu i odpowiedni versionCode. Nie odinstalowywać aplikacji ani czyścić danych,
aby ominąć błąd podpisu. Tester resetData/resetTesterProfile pozostają jawnie
destrukcyjnymi akcjami, nie procedurą migracji UI. Nie wytworzono nowego APK.

## 10. Znane problemy wizualne APK — zgłoszone przez właściciela

1. Tylko pięć głównych zakładek i brak czytelnej hierarchii podfunkcji.
2. Duże ScrollView łączą niezależne funkcje.
3. Character przypomina wielostronicowy dokument.
4. Questy wyglądają jak długa lista formularzy.
5. Dolna nawigacja zasłania treść na telefonie.
6. Grafiki RC3 są słabo wykorzystane.
7. Prezentacja słabo oddaje charakter gry RPG.

Dodatkowe ustalenia z kodu: alias /explore, sekcje bez własnych tras (Evolution/Hero Card),
placeholdery po usunięciu starych grafik, neutralny avatar dla różnych ewolucji,
tekst WORLD ONLINE bez potwierdzonego stanu sieci. Task nie naprawia tych widoków.
Ocena przyczyn nakładania paska wymaga native QA na rzeczywistych wymiarach telefonu.

## 11. Weryfikacja i przejęcie

Nowe testy: visual-read-models.test.cjs (pełny rejestr tras, dane i brak fikcyjnego online)
oraz dwie regresje w gameplay.test.cjs (rzeczywiste zamknięcie/otwarcie pliku SQLite i odtworzenie źródła providera, XP, wyposażenie,
profil/domena/aktywna misja/Game Loop i kanoniczny dostęp bossa).
Istniejące domain.test.cjs dodatkowo zamyka i otwiera bazę plikową.
Testy VM/mock-native nie zastępują instalacji APK na telefonie.

Weryfikacja:
- TypeScript: `npx.cmd tsc --noEmit --incremental false` — PASS, 0 błędów.
- Wszystkie testy aplikacji i skryptów: 589/589 PASS, 0 skipped.
- Testy supabase/tests (lokalny PGlite): 105/105 PASS, 0 skipped.
- Nowe kontrakty: 10/10 PASS; nowe regresje SQLite/access: 2/2 PASS.
- `git diff --check`: PASS. Obszary zabronione mają pusty diff.
- Końcowe pełne gameplay po wzmocnieniu harness: 322/322 PASS, 0 skipped.
  To ponowna kontrola części zestawu 589, nie kolejne 322 unikalne testy.
  Łącznie 694 unikalne testy aplikacji/skryptów/backendu przeszły.
- Git: HEAD nadal e3218c0390ff154aa323459806f5caf30cf093e0; gałąź prep/rc3-visual-reconstruction;
  1 plik zmodyfikowany, 5 nowych plików, wszystko bez staging/commita/push/merge.
- Status przejęcia: GOTOWE do rozpoczęcia przebudowy wizualnej w Cursor.

Środowisko ma błędne domyślne TEMP/TMP `E:\DEV\temp` i npm cache `E:\DEV\npm-cache`.
Pierwsze uruchomienie z tymi wartościami nie przeszło (ENOENT, brak PGlite).
To naprawiono dla procesów weryfikacji, bez zmiany ustawień globalnych ani UI:

```powershell
$env:TEMP = Join-Path (Get-Location) 'dist/task006-validation-temp'
$env:TMP = $env:TEMP
$env:NODE_DISABLE_COMPILE_CACHE = '1'
npx.cmd tsc --noEmit --incremental false
node --test src/system2/tests/gameplay.test.cjs
node --test src/system2/tests/*.test.cjs scripts/*.test.cjs
node --test supabase/tests/*.test.cjs
git diff --check
git status --short
```

Katalog tymczasowy musi istnieć. Wyłączono compile cache Node dla TypeScript, bo
domyślna konfiguracja katalogu tymczasowego zawieszała start shimu tsc.
Zależność testowa wymagała również lokalnego npm_config_cache pod dist.
Na tej sesji narzędzia miały błędny write-root E:\SYSTEM, więc testy tworzące pliki
w C:\SYSTEM wymagały zatwierdzonego wykonania poza sandboxem; repozytorium jest
tym wskazanym przez właściciela, nie zostało przeniesione.

Raporty lokalne (ignorowane przez Git): dist/task006-mobile-tests.log,
dist/task006-cloud-tests.log, dist/task006-gameplay-tests.log.
Jedyny zmodyfikowany istniejący plik to tests/gameplay.test.cjs (harness + 2 regresje).
Nowe pliki: trzy moduły presentation, visual-read-models.test.cjs i ten dokument.
Nie dotykano SQLite użytkownika; testy używają pamięci lub osobnych plików tymczasowych.
Nie zmieniono bazy migracji ani danych telefonu. Native QA i dostępność produkcyjnego
cloud pozostają niezweryfikowane w tym zadaniu.

Przejęcie: otworzyć ten katalog i bieżącą gałąź prep wraz ze zmianami niezatwierdzonymi.
Najpierw przeczytać ten dokument, AGENTS.md, docs/RC3-LIVING-DOMAIN-1.md,
docs/RC3-LIVING-GEAR-TRACEBOOK-1.md i system2/ARCHITECTURE.md.
Cursor może rozpocząć projektowanie na podstawie istniejących tras i kontraktów;
nie trzeba ponownie odkrywać właścicieli danych. Commit wymaga osobnej zgody właściciela.
