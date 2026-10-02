# SYSTEM — integracja 1+2+3: wynik weryfikacji

Data: 2026-10-02. Raport dotyczy kodu, testów lokalnych i kontraktów; testów na telefonie nie wykonano.

## Git i zakres

- Worktree: `C:\SYSTEM\SYSTEM-core-integration`.
- Branch: `integration/game-loop-home-gm-4`.
- Zweryfikowany commit implementacji: `a7ba580a738e9bf49330e7e68a440939f183678e`.
- Istniejący merge Game Loop: `fda16b1ad432e8b2e1a12ad7e328a8a193d0c267`.
- Baza Paczki 2+3: `258a6b49552569ccb76f091fe9c071f588095575`.
- Game Loop włączono wcześniej przez merge bez fast-forward ze źródła `5d4a507760a89c4cd06cde8a53b72e7e3523d60d`; zero konfliktów Git. W tym wznowieniu nie wykonano kolejnego merge.
- Commit implementacji obejmuje 43 pliki. Osobny commit dokumentacji zapisuje ten raport. Jego SHA jest końcowym HEAD podanym w odpowiedzi; nie zmienia przetestowanego kodu.
- Nie zmieniono package.json ani cudzych worktree. Bez push, APK, rebase, force-push i deploymentu SQL.

## Faktycznie wykonane testy

| Zestaw | Wynik |
|---|---:|
| Gameplay — wszystkie nazwy, 22 grupy do 180 s | 318/318 |
| Pozostałe testy aplikacji | 225/225 |
| Backend: processor, mobile-sync, social-contract, calendar-fixtures | 105/105 |
| Scripts/assets: apk-provenance, visual-assets | 15/15 |
| **Razem, bez podwójnego liczenia testów celowanych** | **663/663 PASS** |
| TypeScript: tsc --noEmit --incremental false | exit 0 |
| git diff --check, także staged przed commitem | exit 0 |

Zero pominiętych testów, zero niezaliczonych. Baseline 620 zachowany; przybyły 43 przypadki.

W 225 testach aplikacji są: 7 testów fundamentu Game Loop, 16 testów integracji Game Loop, 6 testów rzeczywistego komponentu nagród, 23 testy GM oraz 22 testy HOME (w tym 10 HOME × GM). Nie doliczono ich ponownie do sumy.

Logi lokalne:
- `C:\SYSTEM\core-gameplay-summary.log` oraz `core-gameplay-group-1.log` … `core-gameplay-group-22.log`.
- `C:\SYSTEM\core-app-final.log`.
- `C:\SYSTEM\core-backend-scripts.log`.
- `C:\SYSTEM\core-typescript.log`.
- Runner grup: `C:\SYSTEM\core-run-groups.cjs`; odczytuje wszystkie nazwy z gameplay.test.cjs, sprawdza liczbę uruchomionych przypadków i narzuca 180 sekund na grupę.
- Pozostałe app: Node --test --test-concurrency=1 na wszystkich *.test.cjs w src/system2/tests poza gameplay.
- Backend/scripts: Node --test --test-concurrency=1 na czterech powyższych plikach backendu i dwóch scripts.

### Symulacje

**30 minut — PASS:** 2050 sekund czasu symulowanego, 4 ukończone misje, 4 trwałe wyniki GM, dostępna następna misja. Używa rzeczywistej warstwy SQLite, canonical completion, receipt, inventory i odtwarzania kursora nagrody. Ponowne ukończenie i restart każdego kroku nie zwiększają XP. To przyspieszony test z zegarem i dowodami testowymi; nie jest nagraniem 30 minut gry na telefonie.

**30 dni — PASS:** 19 ukończeń, 4 rodziny misji, trudności 1/2/3; tryby NORMAL, TENSION, THREAT, RECOVERY, COMEBACK, BOSS. Obejmuje nieobecność, błędy techniczne, porażki, zmianę wyboru i odtworzenie kampanii po każdym aktywnym dniu. Osobny test SQLite sprawdza trwałość pamięci.

### Naprawione regresje

- Providerowe mocki nie miały nowego odczytu checkpointu; uzupełniono kontrakt bez usuwania asercji.
- Test klasycznej listy Awakening nie określał wieku; profil dorosły zapisano jawnie. Osobne testy sprawdzają wszystkie bezpieczne warianty.
- Mock GM w teście blur/profile nie zawierał mission; uzupełniono kontrakt.
- Zapis parametrów START importował przez starsze API niepotrzebnie AsyncStorage. Starsze API preview ładuje go teraz dopiero przy swoim wywołaniu; canonical history pozostaje w SQLite.
- Crossfade pozostawiał poprzedni odtwarzacz przy zatrzymaniu w tle; retiring players są zwalniane.
- Pusta linia na końcu komponentu nagród została usunięta.

## Jeden przepływ i API

### Game Loop

Eksporty `gameLoop/index.ts` zachowują reducer/orchestrator, guards, checkpoint/session recovery, rewardPlan, reactions, telemetry i completionBridge. Dodano:
- `questRunLoopState(status, questId)`: adapter istniejącego useQuestRun.
- `selectHomeLoop({missionId, activeQuestId, pendingRewardId, observed})`.
- `selectPrimaryAction(state)`: jeden label, disabled, phase i missionId.
- `useGameLoopController(playerId)`: `state, observe, observeQuest`, używany w SystemProvider.
- `useRewardLoop()`: view, error, busy, advance, refresh.
- `gameLoopRewardPresentation(receiptId, expectedStep?, expectedPlayerId?)`: trwały odczyt/przesunięcie prezentacji istniejącej nagrody.

Brak drugiego completion/verification/reward engine. GPS i timer pozostają w useQuestRun; XP, loot i outbox pozostają w istniejącej transakcji profilu.

CHECKING → RECOVERY, READY → BRIEFING, STARTING → STARTING, TRACKING → ACTIVE, hook COMPLETING → VERIFYING; wejście do kanonicznego zapisu w Providerze → COMPLETING. Potwierdzona kolejka receipt przejmuje prezentację XP → opcjonalny LOOT → opcjonalny LEVEL → opcjonalny EQUIP → WORLD → NEXT.

RESUME wraca do BRIEFING i rzeczywistego sprawdzenia/uruchomienia trackera. Sam reducer nie udaje aktywnego GPS. Brak questId nie rozpoczyna misji; brak receipt nie rozpoczyna nagrody.

### AI GM

Zachowane API: getGameMasterState, getNextMission, getWorldDirectives, getCharacterDirectives, getBossDirectives, getDecisionExplanation, getCampaignState, recordMissionOutcome, reconcileMissionOutcomes.

`loadGameMasterMemory(choice?, expectedPlayerId?)` odczytuje kanoniczne próby, ukończenia i verified_events w serializowanej transakcji. Nie przyjmuje XP ani arbitralnego wyniku od komponentu UI. Parametry próby są zapisane przy START w istniejącym app_state; zdarzenie ukończenia zawiera difficulty i target.

Starszy planner kampanii zachowuje swoje API preview; aktualna projekcja kampanii v2 i gameplay nie przechodzą na AsyncStorage.

### HOME ↔ Loop ↔ GM

GM wybiera kanoniczną misję, uzasadnienie i kampanię. Loop wybiera główną akcję; pending receipt ma pierwszeństwo przed następnym questem. HOME pozostaje composerem WorldStage, CharacterStage i MissionFocus. Nie nalicza nagród.

Przed opuszczeniem WORLD_REACTION/NEXT_QUEST hook rekoncyliuje pamięć GM. Zapisany outcome aktualizuje kampanię, Chronicle i dyrektywy świata. Powrót do HOME odświeża następny wybór. Misja nie startuje automatycznie bez udziału gracza.

## Rewards, loot, recovery, offline

- Receipt pochodzi z canonical completion. Prezentacja nie wywołuje completeVerifiedQuest.
- Plan pomija loot lub level-up, jeśli faktycznie ich nie ma.
- Loot reveal pokazuje rzeczywisty inventory item, rarity, statystyki i poziom.
- Compare korzysta z compareItem; equip z istniejącego API Provider/SQLite. Podwójne naciśnięcie ma blokadę. Niespełniony poziom oferuje zachowanie przedmiotu, bez martwego przycisku equip.
- Pity: po czterech kolejnych COMMON kolejny quest loot ma co najmniej RARE. Licznik i item zapisują się z tą samą transakcją co nagroda. Replay nie przesuwa licznika. Dotychczasowe itemy nie są przeliczane. Nie zmienia to Real XP.
- Trwały cursor w app_state odnosi się do klucza kroku i receipt. Każda faza nagrody może być odtworzona; powtórzony expectedStep nie przesuwa kolejki drugi raz.
- Timer korzysta z istniejącego quest_checkpoint i dystansu zero. Zachowuje zapisane sekundy, nie nalicza czasu zamkniętego procesu. Checkpoint okresowy co 5 s oraz zapis przy opuszczeniu ekranu; brutalne zabicie procesu może utracić ostatni niezapisany fragment.
- Provider odnajduje checkpoint po restarcie; istniejący natywny background GPS pozostaje źródłem sesji GPS.
- Timeout zapisu sprawdza później kanoniczny wynik; nie traktuje samego timeoutu jako dowodu nieudanego commita.
- Offline: ukończenie, receipt, loot i kampania działają lokalnie. Istniejący outbox wysyła dowody po odzyskaniu sieci; backend zachowuje blokady użytkownika i deduplikację.
- Brak bezpiecznej/niewyczerpanej misji daje jawny stan bez nowego questa; nie generuje dodatkowego ID ani XP po ukończeniu Daily.

## Age Mode i backend

Trzy bezpieczne, 5-minutowe misje TIMER zastępują klasyczny GPS Awakening dla 6–8, 9–12, 13–17 i wieku nieznanego; konserwatywny wariant obejmuje też UNDER_6. Bez lokalizacji, obcych osób, sprzętu ani wysiłku. Dorosły zachowuje klasyczną ścieżkę; jawny link do bezpiecznego wariantu również działa.

Wspólna tożsamość etapu 1/2/3 zapobiega podwójnemu nagradzaniu wariantów. Po trzech safe questach suma wynosi 450 XP wraz z jednym bonusem rozdziału. Prerequisites przyjmują poprawny wariant tego samego etapu. AI copy dla niepełnoletnich jest zastępowane kuratorowaną treścią przed HOME.

Migracja `20261001120000_safe_awakening.sql` została przetestowana lokalnie z resztą migracji. Zachowuje a1/a2, ownership, lock, walidację czasu, prerequisites i reward ledger. Krótki timer i pominięcie etapów nie przechodzą. **Nie została wdrożona.** Backend produkcyjny musi otrzymać osobno zatwierdzoną migrację przed obsługą nowych ID.

## Daily / Weekly / Boss / Story

Generator nadal tworzy i utrwala Daily :a2:, w tym istniejący focus_return po przerwie. GM wybiera z zapisanych ID, szanuje cooldown, limity czasu, wieku, dostępnych aktywności i etapów. Nie przelicza nagrody wybranego questa.

Weekly zachowuje trwały target i kanoniczne bonusy; kampania uwzględnia postęp Weekly i przygotowanie kolejnych etapów. GM bierze pod uwagę wyłącznie odblokowany etap aktywnego Story Bossa: focus, potem walk/run, bez ponownego proponowania zamkniętego etapu. Daily nadal wpływa na istniejący boss support damage.

Outcome zapisuje idempotentny wpis GM_OUTCOME w istniejącym Chronicle i consequence PROGRESS/REST/RETRY. World/Character/Boss otrzymują dyrektywy na tej samej podstawie. Nie dodano arbitralnych nagród ani odblokowań fabularnych.

## Audio, haptics, telemetry

Istniejące sceny HOME/QUEST/BOSS/VICTORY i crossfade są zachowane. Zatrzymanie audio usuwa także odtwarzacze schodzące podczas fade-out. Nowa prezentacja wyłącza efekty w tle i anuluje animację; reduce motion pomija ruch i nowe haptyczne akcenty.

XP, loot, level-up i world mają różne reakcje. Istniejący wybór użytkownika dotyczący dźwięku/haptyki pozostaje w konfiguracji.

LOOP_* obejmuje wszystkie fazy; GM_DECISION, GM_FALLBACK, GM_COMEBACK i GM_RECOVERY_QUEST trafiają do istniejącej kolejki. Nie dodano surowych współrzędnych, daty urodzenia ani treści celu do telemetryki. LOCAL_CANONICAL oznacza lokalną decyzję, nie odpowiedź płatnego modelu.

## Paczka 1 — wszystkie 50 punktów

DONE oznacza działający kod/integrację i lokalną weryfikację, nie certyfikację telefonu.

| Nr | Status | Wynik |
|---|---|---|
| 1 | DONE | Kanoniczny lifecycle → reward → następna misja |
| 2 | DONE | Zachowany HOME World zamiast dashboardu |
| 3 | DONE | WorldStage i CharacterStage centralnie |
| 4 | DONE | Aktywna misja ma pierwszeństwo |
| 5 | DONE | Jedno primary CTA z Loop |
| 6 | DONE | Daily/Weekly/Boss drugorzędne |
| 7 | DONE | Istniejąca animacja startu powiązana z lifecycle |
| 8 | DONE | Istniejący completion i nowa sekwencja receipt |
| 9 | DONE | Pełnoekranowe XP z prawdziwego receipt |
| 10 | DONE | Skończona animacja paska, reduce motion |
| 11 | DONE | Osobny krok LEVEL_UP |
| 12 | DONE | Prawdziwy loot reveal |
| 13 | DONE | Rarity zapisanego przedmiotu |
| 14 | DONE | Equip z nagrody |
| 15 | DONE | Compare ze slotem wyposażenia |
| 16 | DONE | Reakcja postaci i aktualne nazwy wyposażenia |
| 17 | DONE | Dyrektywy świata po wyniku |
| 18 | DONE | Boss damage/reaction z receipt i stanu świata |
| 19 | DONE | Trwały Chronicle GM_OUTCOME |
| 20 | DONE | Pamięć canonical outcomes |
| 21 | DONE | Semantyczny cooldown |
| 22 | DONE | Istniejąca adaptacja trudności |
| 23 | DONE | Recovery po rzeczywistej utracie streak/overload |
| 24 | DONE | Comeback z kanonicznego loadoutu |
| 25 | DONE | Łańcuchy kampanii |
| 26 | DONE | Mini arc 5 ukończeń |
| 27 | DONE | Cykl 30 dni i fazy |
| 28 | DONE | Wybór kierunku zmienia ranking misji |
| 29 | DONE | Archetyp w rankingu |
| 30 | DONE | Statystyki w rankingu |
| 31 | DONE | Aktywne perks w rankingu |
| 32 | DONE | Istniejące trwałe milestone rewards |
| 33 | DONE | Streak wpływa na adaptację/Weekly |
| 34 | PARTIAL | Energia jest naliczana i widoczna; brak kanonicznego kosztu akcji lub innego zużycia w tym loopie |
| 35 | DONE | Istniejący trwały Daily reset |
| 36 | DONE | Istniejący Weekly reset i zachowany target |
| 37 | PARTIAL | Story Boss ma działające etapy, World Event rotuje; nie dodano powtarzalnego, nagradzanego cyklu nowych bossów |
| 38 | DONE | Trwałe pity po 4 COMMON, idempotentne |
| 39 | DONE | Replay/reroll/sync nie duplikują XP |
| 40 | DONE | Weryfikacja/GPS/SQL przed nagrodą |
| 41 | DONE | Lokalne offline completion |
| 42 | DONE | Istniejący outbox i testy processor/sync; deployment safe ID pozostaje oddzielny |
| 43 | DONE | Canonical claim i receipt idempotency |
| 44 | DONE | Checkpoint timer/GPS i odczyt po restarcie |
| 45 | DONE | Trwała prezentacja wszystkich kroków nagrody |
| 46 | DONE | Haptics zależne od zdarzenia |
| 47 | DONE | Dynamiczne istniejące sceny audio |
| 48 | DONE | Crossfade i sprzątanie odtwarzaczy |
| 49 | DONE | Telemetria faz i decyzji |
| 50 | DONE | Symulacja 2050 s bez dead screen |

NOT STARTED: brak. Punkty 34 i 37 pozostają ograniczeniami istniejącej rozgrywki, nie są oznaczone jako ukończone na podstawie samych zielonych testów. Dodanie kosztów energii wymaga kontraktu ekonomii; powtarzalne walki wymagają zakresu Boss/Combat, którego nie rozszerzano w tej integracji.

## Paczka 3 — wszystkie 50 punktów

| Nr | Status | Wynik |
|---|---|---|
| 1 | DONE | Profil i jedna projekcja kampanii v2 |
| 2 | DONE | Trwała historia SQLite |
| 3 | DONE | COMPLETED z canonical completion |
| 4 | DONE | FAILED z prób |
| 5 | DONE | ABANDONED z prób |
| 6 | DONE | Activity type z kanonicznych parametrów |
| 7 | PARTIAL | Nowe próby mają difficulty przy START; stare brakujące historyczne wartości są nieodtwarzalne |
| 8 | PARTIAL | Nowy czas z dowodu/próby; brakującego czasu starego rekordu nie można odzyskać |
| 9 | PARTIAL | Quality z verified event; starsze braki pozostają null, bez udawania sukcesu |
| 10 | DONE | Powody failure i technical/recovery |
| 11 | DONE | Anti-repetition ID i semantyki |
| 12 | DONE | Podpis rodzina/aktywność/stat/czas/trudność |
| 13 | DONE | Cooldown nie jest obchodzony dla pustego zestawu |
| 14 | DONE | Diversity score |
| 15 | DONE | Behavioral model z outcomes |
| 16 | DONE | Preferencje nie wynikają wyłącznie z kliknięć |
| 17 | DONE | Adaptacyjna selekcja |
| 18 | DONE | Stabilne sukcesy zwiększają poziom |
| 19 | DONE | Overload obniża poziom |
| 20 | DONE | Błędy techniczne wykluczone |
| 21 | DONE | Readiness |
| 22 | DONE | Recovery Mode |
| 23 | DONE | Comeback Mode |
| 24 | DONE | Persisted focus_return/Daily :a2:, bez dodatkowego XP po wyczerpaniu |
| 25 | DONE | Streak recovery bez zmiany księgowania streak |
| 26 | DONE | Chains |
| 27 | DONE | Kierunek/etap wpływa na kolejną misję |
| 28 | DONE | Mini arc 5 |
| 29 | DONE | Medium arc 10 |
| 30 | DONE | Long arc 30 dni |
| 31 | DONE | Persistent campaign |
| 32 | DONE | Restart kampanii |
| 33 | DONE | previousQuest |
| 34 | DONE | prepares/etap |
| 35 | DONE | PROGRESS/REST/RETRY |
| 36 | DONE | Choice zmienia przyszły ranking |
| 37 | DONE | Trwały Chronicle i dyrektywy World/Story po wyniku |
| 38 | DONE | Archetype influence |
| 39 | DONE | Stats influence |
| 40 | DONE | Perks influence |
| 41 | DONE | Odblokowany etap Bossa w selekcji |
| 42 | DONE | World Events wpływają na kierunek i scenę |
| 43 | DONE | Daily/Weekly/Boss/Journey w jednej decyzji; stare reward protocols zachowane |
| 44 | DONE | Ograniczenia dostępności/czasu/aktywności |
| 45 | DONE | Safe Awakening + filtrowanie treści dla wszystkich age modes |
| 46 | DONE | Deterministyczna decyzja, jawny brak kandydata gdy konieczny |
| 47 | DONE | Offline bez płatnego API |
| 48 | DONE | Decision telemetry |
| 49 | DONE | Explanation |
| 50 | DONE | Wykonana symulacja 30 dni |

Dawne PARTIAL 24, 37, 43, 45–47 domknięto w kodzie i testach. **Nie wszystkie PARTIAL można uznać za zamknięte:** 7–9 dla historycznych rekordów bez dowodów pozostają ograniczeniem danych. Nowe rekordy są poprawnie utrwalane; niczego nie sfabrykowano. NOT STARTED: brak.

## HOME/WORLD — pozostałe PARTIAL i telefon

Kontrakty reakcji, pogody, światła i dnia/nocy są podłączone. Nadal potrzebny osobny art pass: dedykowana grafika World Bossa, wizualne nakładanie poszczególnych elementów ekwipunku na sylwetkę, prawdziwa nocna ilustracja zamiast barwienia istniejącego tła, bogatsza animacja postaci/Bossa. Nie dodano atrap udających finalne zasoby.

Na fizycznym telefonie trzeba sprawdzić:
1. Nowy profil i aktualizacja istniejącego: adult GPS oraz safe age path, permissions/background/foreground.
2. Zabicie procesu w ACTIVE, podczas zapisu i w każdym kroku nagrody; brak podwójnego XP/equip.
3. GPS w tle i offline → restart → odzyskanie sieci na backendzie z wdrożoną migracją.
4. Mały ekran, duża czcionka, modal nagrody, hardware Back, przejście do HOME/następnego questa.
5. Reduce motion, niski tryb wydajności, zużycie baterii, głośność i realny crossfade/haptyka.
6. Podgląd rarity/compare i zdjęcia użytkownika, brak zasłoniętych elementów.

## Ocena gotowości

Rdzeń 1+2+3 przeszedł lokalną integrację i pełną regresję; nadaje się do kontrolowanej beta integration oraz testów na telefonie. **Nie jest to potwierdzenie gotowości publicznego APK ani zamknięcia wszystkich 100 wymagań produktu.** Przed chmurowymi beta-testami nowych safe ID potrzebne są osobno zatwierdzony deployment migracji i test środowiska. Nie wdrażano SQL ani nie budowano APK.

Energia (P1/34), powtarzalny Boss cycle (P1/37), braki historyczne (P3/7–9) oraz wymieniony art pass pozostają jawne. Zmiany nie są scalone z integration/system-evening-build.

## Zmienione pliki implementacji

- `src/app/quest.tsx`
- `src/system2/audio/engine.ts`
- `src/system2/components/RewardEventSequence.tsx`
- `src/system2/core/inventory.ts`
- `src/system2/core/questEngine.ts`
- `src/system2/core/types.ts`
- `src/system2/director/engine.ts`
- `src/system2/gameLoop/completionBridge.ts`
- `src/system2/gameLoop/index.ts`
- `src/system2/gameLoop/questRunAdapter.ts`
- `src/system2/gameLoop/recovery.ts`
- `src/system2/gameLoop/selectors.ts`
- `src/system2/gameLoop/stateMachine.ts`
- `src/system2/gameLoop/useGameLoopController.ts`
- `src/system2/gameLoop/useRewardLoop.ts`
- `src/system2/gameMaster/campaignStore.ts`
- `src/system2/gameMaster/director.ts`
- `src/system2/gameMaster/history.ts`
- `src/system2/gameMaster/runtime.ts`
- `src/system2/gameMaster/useGameMaster.ts`
- `src/system2/home4/CharacterStage.tsx`
- `src/system2/home4/HomeWorldScreen.tsx`
- `src/system2/quests/catalog.ts`
- `src/system2/quests/nextAction.ts`
- `src/system2/quests/safeAwakening.ts`
- `src/system2/quests/useQuestRun.ts`
- `src/system2/screens/AwakeningPathScreen.tsx`
- `src/system2/screens/QuestsScreen.tsx`
- `src/system2/state/SystemProvider.tsx`
- `src/system2/storage/database.ts`
- `src/system2/storage/gameLoopPresentation.ts`
- `src/system2/storage/gameMaster.ts`
- `src/system2/story/types.ts`
- `src/system2/telemetry/funnel.ts`
- `src/system2/tests/ai-gm-4.test.cjs`
- `src/system2/tests/game-loop-4.test.cjs`
- `src/system2/tests/game-loop-integration.test.cjs`
- `src/system2/tests/game-loop-ui.test.cjs`
- `src/system2/tests/gameplay.test.cjs`
- `src/system2/tests/gm-test-support.cjs`
- `src/system2/tests/home-world-4.test.cjs`
- `supabase/migrations/20261001120000_safe_awakening.sql`
- `supabase/tests/processor.test.cjs`

Dokumentacja w osobnym commicie: ten raport oraz odnośnik z wcześniejszego gameMaster/INTEGRATION-4.md.
