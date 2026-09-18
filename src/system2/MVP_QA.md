# SYSTEM 2.0 — MVP 70% milestone: raport i Android QA

Stan: zakres zaimplementowany, kontrole automatyczne poprawne; fizyczne QA Androida pozostaje do wykonania. Nie wykonano commita ani natywnego rebuilda. Nie instalowano bibliotek. Zachowano wcześniejsze niezacommitowane zmiany SYSTEM WORLD i MapLibre Demo Tiles.

## Kontrole

- `npx tsc --noEmit --incremental false`: PASS.
- `node --test src/system2/tests/gameplay.test.cjs`: 91/91 PASS. Zachowane 71 wcześniejszych testów, dodane 20 regresji MVP.
- `git diff --check`: PASS; jedynie informacyjne ostrzeżenia Git o LF/CRLF.
- Sprawdzono git status. Zmiany obejmują wyłącznie `src/system2` i routing `src/app`. Pozostają niezacommitowane.
- Odświeżono ignorowany plik `.expo/types/router.d.ts` zainstalowanym generatorem Expo dla nowych tras.

## Onboarding i tożsamość

Nowa baza tworzy profil EQUAL ORIGIN i `onboarding_complete=false`. Cztery kroki przedstawiają SYSTEM, równy start, weryfikowane działania oraz SYSTEM NAME. Zapis nazwy i zakończenia odbywa się w jednej transakcji. Powtórne naciśnięcie nie tworzy drugiego profilu. Ponowne otwarcie niedokończonego onboardingu zaczyna go od pierwszego kroku.

Migracja istniejącego profilu oznacza onboarding jako ukończony, bez resetowania XP, ukończeń, World ani tożsamości. Nazwa jest pseudonimem długości 2–24 znaków. Profil pozostaje lokalny — nie jest kontem online.

## POSTAĆ, avatar, Evolution i Title

POSTAĆ pokazuje zapisany profil, REAL LEVEL, rank, bieżący XP, Evolution, 7 skillów wraz z paskami i szczegółami, dominant skill i zdobyte Title. Dominant skill używa totalXp; wszystkie równe wartości dają BALANCED ORIGIN, remis liderów MIXED BUILD. Archetyp pozostaje UNFORMED.

Galeria i aparat korzystają z istniejącego expo-image-picker. Zdjęcie jest kopiowane istniejącym expo-file-system do `Paths.document/system2-avatars`; SQLite przechowuje URI. Zmiana/usunięcie avatara nie usuwa oryginału z galerii. Brak pliku lub błąd obrazu daje abstrakcyjny core. Po niejednoznacznym błędzie zapisu kopia nie jest usuwana pochopnie, ponieważ transakcja mogła się zakończyć; pełny reset usuwa również takie kopie.

Evolution pochodzi z jednego serwisu progresji: 0 dla leveli 1–9, 1 dla 10–24, 2 od 25. Zmienia obramowanie, pierścienie i kolor aury, nie twarz. Zachowano dotychczasowe progi XP i ranków.

UNAWAKENED jest dostępny od początku, AWAKENED po Awakening, SIGNAL HUNTER po rzeczywistym VerifiedEvent pierwszego sygnału. Wybór jest walidowany w SQLite i zapisywany w profilu.

## Nagrody, awanse i historia

Transakcje questów i sygnału zwracają RewardReceipt wyliczony z profilu przed i po nagrodzie. Uwzględnia rzeczywisty XP, bonus Chapter 01, skill XP, energy, dystans questa, level/rank, awanse skillów i odblokowania. Duplikat ukończenia nie zwraca nowego receipt.

LEVEL UP trwa około 3 sekund i można go pominąć dotknięciem. Wielopoziomowy awans pokazuje poziom końcowy; awanse wielu skillów są łączone. Zwykły odczyt profilu po restarcie nie uruchamia animacji. Istniejąca celebracja Awakening czeka na zamknięcie overlayu level-up.

Wspólny RewardSummary jest dostępny po ukończeniu questa, na Home dla ostatniej nagrody w sesji oraz w World dla sygnału. Zniknięcie podsumowania po restarcie nie usuwa wpisu w historii.

SYSTEM LOG odczytuje maksymalnie 50 najnowszych VerifiedEvents przy wejściu/ponowieniu. Nazwa jest rozwiązywana przez katalog; nieznany quest daje SYSTEM EVENT, pierwszy sygnał UNKNOWN SIGNAL. Historia pokazuje nagrody, datę i weryfikację, bez surowych współrzędnych.

## Settings, reset i integralność

WIĘCEJ zawiera SYSTEM ID, uprawnienia, ustawienia haptics/audio, lokalne dane, wersję aplikacji i reset. Haptics są obsługiwane wspólnym modułem i respektują zapisane ON/OFF, także przy starcie. Audio to zapisana preferencja — ten build nie odtwarza jeszcze dźwięku.

Reset wymaga potwierdzenia ostrzeżenia, a następnie wpisania RESET i drugiego potwierdzenia. Wspólna kolejka/exclusive transaction usuwa profil, ukończenia, wydarzenia, rozdział, sektory, sygnał i ustawienia, po czym tworzy czysty profil do onboardingu. Usunięcie katalogu avatarów jest osobnym krokiem plikowym; trwały marker umożliwia ponowienie cleanupu po błędzie/restarcie. Oryginały galerii oraz pliki projektu pozostają nietknięte. Nie resetowano danych użytkownika podczas wdrożenia — reset testowano na bazach w pamięci.

`PRAGMA user_version` obsługuje migracje 0→1→2→3 w jednej transakcji. v1: podstawowe tabele, v2: Chapter/World, v3: indeks historii i migracja onboardingu. Schemat nowszy niż obsługiwany wywołuje kontrolowany błąd zamiast downgrade'u.

Sumy XP są źródłem prawdy dla levelu, bieżącego XP, ranku i Evolution. Proste pochodne można odbudować. Uszkodzone wartości źródłowe wywołują SYSTEM ERROR; dane nie są po cichu resetowane. Nadzwyczajnie duże wartości wymagające ponad 100 000 iteracji progresji wywołują błąd kontroli zapisu zamiast blokować UI bez końca.

## Nawigacja, layout i wydajność

Pięć tabów prowadzi do prawdziwych ekranów przez współdzielony BottomNavigation z `router.replace`, bez dokładania Home/Character do stosu przy każdym przełączeniu. SYSTEM LOG jest ekranem szczegółowym POSTAĆ.

Home zachowuje styl i pokazuje avatar w istniejącym core. Po Awakening pokazuje AWAKENING COMPLETE i eksplorację World. QUESTY zachowują ukończone misje, blokady i informację NEXT CHAPTER // NOT YET AVAILABLE.

Home i QuestRun korzystają z SafeArea; nowe ekrany używają wspólnego scrollowalnego SystemPage. Onboarding i potwierdzenie resetu obsługują klawiaturę/scroll. HUD World można przewijać. Core Home jest zmniejszany na wąskich ekranach i zatrzymuje animacje po utracie focusu. Główne przyciski oraz taby mają role i etykiety dostępności. Nie wykonywano wizualnego testu wszystkich rozmiarów urządzeń.

## Android QA — dokładna kolejność

1. Na aktualnej instalacji z progresem otwórz aplikację. Onboarding nie powinien się pojawić. Porównaj XP, skille, energy, dystans, ukończenia i odkrycia z poprzednim stanem.
2. Przełączaj SYSTEM → POSTAĆ → WIĘCEJ → QUESTY → ŚWIAT kilkakrotnie. Sprawdź aktywne zakładki i Back Androida. SYSTEM LOG powinien dać powrót do POSTAĆ.
3. W POSTAĆ zmień pseudonim. Wybierz avatar z galerii; zamknij aplikację i otwórz ją ponownie. Zweryfikuj nazwę i obraz. Sprawdź zmianę zdjęcia, aparat, odmowę dostępu do aparatu i usunięcie avatara. Sprawdź, że oryginał galerii pozostał.
4. Otwórz każdy skill; porównaj level, XP i pasek z Home. Sprawdź dominant skill oraz dostępne Title. Wybierz zdobyty Title, zrestartuj aplikację i sprawdź wybór.
5. W WIĘCEJ wyłącz haptics, uruchom aktywność i sprawdź brak wibracji. Po restarcie ustawienie ma pozostać OFF. Włącz ponownie. Przełącz audio i sprawdź zapis, bez oczekiwania dźwięków.
6. Sprawdź przycisk uprawnień GPS oraz link do systemowych ustawień aplikacji. Odmowa, trwała odmowa i wyłączony GPS powinny dawać kontrolowane komunikaty i możliwość ponowienia.
7. Na profilu testowym wykonaj FIRST MOVEMENT: rzeczywiste 500 m, brak ręcznego ukończenia, dialog permission bez przerwania startu. Zweryfikuj podsumowanie i SYSTEM LOG. Ponowne wejście nie może dać drugiej nagrody.
8. Wykonaj FOCUS PROTOCOL: pełne 10 minut na pierwszym planie; przejście do tła ma przerwać próbę. Udana próba powinna pokazać rzeczywisty reward i ewentualny LEVEL UP.
9. Wykonaj FINAL TRIAL: zarówno 600 m, jak i 10 minut. Sprawdź jednorazowy bonus Chapter 01, połączone awanse skillów, World Unlock i AWAKENED. Po restarcie nie może być ponownego LEVEL UP ani ponownej nagrody.
10. Sprawdź Home po Awakening oraz CHAPTER 01 // COMPLETE w QUESTY. Chapter 02 pozostaje niedostępny.
11. W World uruchom tracking. Sprawdź Demo Tiles, marker, CENTER/FOLLOW, sektory, fog oraz pauzę po przejściu do tła/opuszczeniu zakładki. Po restarcie odkrycia mają pozostać.
12. Użyj SCAN FOR SIGNAL, następnie RELOCATE w razie niedostępnego punktu. Nie wchodź na teren prywatny ani niebezpieczny. Dotarcie z wiarygodnym GPS ma automatycznie dać nagrodę raz, wpis historii i SIGNAL HUNTER. World nie zwiększa ponownie dystansu questów.
13. Sprawdź układ na małym ekranie, z klawiaturą, gestową i przyciskową nawigacją Androida oraz większym fontem. Przyciski nie powinny wypadać poza bezpieczny obszar; sprawdź przewijanie Character, Settings i HUD World.
14. Reset wykonuj dopiero na profilu, którego dane chcesz świadomie usunąć. Najpierw anuluj na pierwszym etapie, potem na drugim — dane muszą pozostać. Błędny tekst nie może dopuścić resetu.
15. Potwierdź pełny reset dwukrotnie. Powinien pojawić się onboarding, a REAL LEVEL/skills wrócić do 1, XP i energy do 0, World do LOCKED, historia do pustej, avatar do core. Ukończ 4 kroki i zrestartuj aplikację: onboarding nie może wrócić.

## Rebuild i ograniczenia

Ten etap nie zmienia konfiguracji natywnej i sam nie wymaga rebuilda Development Build. Korzysta z już zainstalowanych expo-image-picker, expo-file-system i pozostałych modułów. Lokalny scalony manifest Androida zawiera CAMERA. Jeśli używany na telefonie build pochodzi sprzed dołączenia tych modułów, będzie wymagał aktualizacji; nie zweryfikowano binarki na urządzeniu.

Fizyczny test UI, aparatu, MapLibre, GPS i zachowania Android Back pozostaje do wykonania. MapLibre Demo Tiles jest konfiguracją developerską. Unknown Signal nadal jest prototypem bez sprawdzania dostępności terenu i bez nawigacji drogowej. Audio nie odtwarza dźwięków. Evolution jest wizualne i deterministyczne; naturalny próg 10/25 nie jest osiągany po jednym spacerze. Chapter 02, konta online, cloud sync i pełne Gates nie są zaimplementowane.

## Pliki tego etapu

Lista poniżej jest względem stanu na początku tego etapu MVP, a nie względem ostatniego commita. Dlatego niektóre zmienione pliki World nadal figurują w Git jako untracked po wcześniejszym etapie.

### Nowe pliki (22)

- [src/app/character.tsx](C:/Users/Ja/SYSTEM/src/app/character.tsx)
- [src/app/more.tsx](C:/Users/Ja/SYSTEM/src/app/more.tsx)
- [src/app/system-log.tsx](C:/Users/Ja/SYSTEM/src/app/system-log.tsx)
- [src/system2/components/Action.tsx](C:/Users/Ja/SYSTEM/src/system2/components/Action.tsx)
- [src/system2/components/IdentityAvatar.tsx](C:/Users/Ja/SYSTEM/src/system2/components/IdentityAvatar.tsx)
- [src/system2/components/LevelUpCelebration.tsx](C:/Users/Ja/SYSTEM/src/system2/components/LevelUpCelebration.tsx)
- [src/system2/components/RewardSummary.tsx](C:/Users/Ja/SYSTEM/src/system2/components/RewardSummary.tsx)
- [src/system2/components/SessionGate.tsx](C:/Users/Ja/SYSTEM/src/system2/components/SessionGate.tsx)
- [src/system2/components/SystemBoundary.tsx](C:/Users/Ja/SYSTEM/src/system2/components/SystemBoundary.tsx)
- [src/system2/components/SystemError.tsx](C:/Users/Ja/SYSTEM/src/system2/components/SystemError.tsx)
- [src/system2/core/rewards.ts](C:/Users/Ja/SYSTEM/src/system2/core/rewards.ts)
- [src/system2/identity/avatar.ts](C:/Users/Ja/SYSTEM/src/system2/identity/avatar.ts)
- [src/system2/identity/feedback.ts](C:/Users/Ja/SYSTEM/src/system2/identity/feedback.ts)
- [src/system2/identity/history.ts](C:/Users/Ja/SYSTEM/src/system2/identity/history.ts)
- [src/system2/identity/model.ts](C:/Users/Ja/SYSTEM/src/system2/identity/model.ts)
- [src/system2/identity/reset.ts](C:/Users/Ja/SYSTEM/src/system2/identity/reset.ts)
- [src/system2/screens/CharacterScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/CharacterScreen.tsx)
- [src/system2/screens/OnboardingScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/OnboardingScreen.tsx)
- [src/system2/screens/SettingsScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/SettingsScreen.tsx)
- [src/system2/screens/SystemLogScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/SystemLogScreen.tsx)
- [src/system2/storage/migrations.ts](C:/Users/Ja/SYSTEM/src/system2/storage/migrations.ts)
- [src/system2/MVP_QA.md](C:/Users/Ja/SYSTEM/src/system2/MVP_QA.md)

### Zmienione pliki (18)

- [src/app/_layout.tsx](C:/Users/Ja/SYSTEM/src/app/_layout.tsx)
- [src/system2/components/AwakeningCelebration.tsx](C:/Users/Ja/SYSTEM/src/system2/components/AwakeningCelebration.tsx)
- [src/system2/components/BottomNavigation.tsx](C:/Users/Ja/SYSTEM/src/system2/components/BottomNavigation.tsx)
- [src/system2/components/QuestCard.tsx](C:/Users/Ja/SYSTEM/src/system2/components/QuestCard.tsx)
- [src/system2/components/SystemPage.tsx](C:/Users/Ja/SYSTEM/src/system2/components/SystemPage.tsx)
- [src/system2/core/progression.ts](C:/Users/Ja/SYSTEM/src/system2/core/progression.ts)
- [src/system2/core/types.ts](C:/Users/Ja/SYSTEM/src/system2/core/types.ts)
- [src/system2/quests/useQuestRun.ts](C:/Users/Ja/SYSTEM/src/system2/quests/useQuestRun.ts)
- [src/system2/screens/QuestRunScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/QuestRunScreen.tsx)
- [src/system2/screens/QuestsScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/QuestsScreen.tsx)
- [src/system2/screens/SystemHomeScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/SystemHomeScreen.tsx)
- [src/system2/screens/WorldScreen.tsx](C:/Users/Ja/SYSTEM/src/system2/screens/WorldScreen.tsx)
- [src/system2/state/SystemProvider.tsx](C:/Users/Ja/SYSTEM/src/system2/state/SystemProvider.tsx)
- [src/system2/storage/database.ts](C:/Users/Ja/SYSTEM/src/system2/storage/database.ts)
- [src/system2/storage/world.ts](C:/Users/Ja/SYSTEM/src/system2/storage/world.ts)
- [src/system2/tests/gameplay.test.cjs](C:/Users/Ja/SYSTEM/src/system2/tests/gameplay.test.cjs)
- [src/system2/world/tracking.ts](C:/Users/Ja/SYSTEM/src/system2/world/tracking.ts)
- [src/system2/world/useWorldTracking.ts](C:/Users/Ja/SYSTEM/src/system2/world/useWorldTracking.ts)


# MVP 90% QA

Etap z 2026-09-18. Poprzednie sekcje opisują historyczny MVP 70%. Poniżej aktualny zakres i bramka QA przed zaproszeniem użytkowników. Nie wykonano testów fizycznego urządzenia, commita, instalacji pakietów ani rebuilda.

## Architektura i zakres

- SQLite **v4**: addytywna migracja v3 → v4 tworzy `daily_sets`, `daily_instances`, `protocol_bonuses` i indeks tygodnia. Nie usuwa profilu, XP, historii, onboardingu, World ani avatara. Evidence pozostaje zagregowanym JSON-em w istniejącym `verified_events`; rozszerzone ustawienia są kompatybilnym JSON-em w `app_state`.
- Activity Verification Engine: `features.ts` agreguje pomiar; `classifier.ts` ocenia całe okno/sesję i profil WALK/RUN/BIKE/EXPLORATION. Jeden anchor GPS i stały histogram 161 przedziałów; nie rośnie tablica punktów. Obliczane są dystans, czas, średnia/mediana/maksimum prędkości, wariancja, przyspieszenia, postoje, czas ruchu/bezruchu, luki, odrzucenia, teleporty i dokładność.
- Klasyfikator łączy te cechy oraz opcjonalne steps/cadence/motion. Są to jawne heurystyki, nie AI/ML. GPS-only: maks. 87; jedno dodatkowe źródło: 93; steps + motion: 98. Jakość GPS, luki i skoki obniżają wynik. Niejednoznaczność ogranicza score do 60, odrzucenie daje 0. Jednorazowy spike może zostać odrzucony bez zepsucia kolejnego odcinka.
- VERIFIED: próg dowodu i cel spełnione → transakcja. SUSPICIOUS: zero XP, neutralne wyjaśnienie, `additionalProofRequired`, ponowna próba. REJECTED: zero XP i retry. Ostatnia nieudana próba dla instancji jest zapisana jako event z `verified=false`, bez completion. Historia pokazuje verdict i przejrzyste agregaty.
- WALK 1500 m (+80/+70 VIT/+8), RUN 1000 m (+100/+90 VIT/+10), RIDE 3000 m (+100/+80 VIT/+10). Wszystkie korzystają z istniejącego wspólnego watchera `useQuestRun`; Awakening zachowuje swój sprawdzony pomiar.
- Timery: FOCUS 15 min (+60/+60 WIL/+5), LEARN 20 min (+60/+60 INT/+5), CREATE 20 min (+50/+50 CRE/+5), ORGANIZE 15 min (+50/+50 RES/+5). Timer potwierdza czas aktywnej sesji, nie jakość/rezultat działania. Brak ręcznego ukończenia. Powtarzalność oznacza kolejne dzienne instancje, nie nielimitowany farming jednego dnia.
- Daily po Awakening: jeden dostępny quest ruchowy i dwa timery, lub trzy timery przy wyłączonych aktywnościach ruchowych. Deterministyczny seed gracz + lokalny dzień; zapis zestawu przy pierwszym odczycie. Zmiana preferencji nie losuje ponownie dnia. Running/Cycling domyślnie OFF, Walking ON.
- Klucz ukończenia `daily:YYYY-MM-DD:template`; SQL uniqueness i wspólna kolejka chronią przed wielokrotną wypłatą. Trzy ukończenia → DAILY CLEAR +75 REAL XP/+10 ENERGY. Pięć pojedynczych Daily w tygodniu ISO → +150/+15. Quest, completion, bonusy, streak, eventy i profil są w jednej exclusive transaction.
- Streak: tylko Daily Clear; pierwszy 1, kolejny dzień +1, po luce następny clear =1. Po pełnym opuszczonym dniu widoczny bieżący streak =0. Brak multiplikatorów XP.
- Zapis `last_known_wall_clock` i ostatniego dnia zapobiega oczywistemu rollbackowi (>5 min lub cofnięcie lokalnego dnia). CLOCK_ANOMALY zachowuje historię i blokuje wypłatę Daily; poprawienie zegara pozwala wrócić. To nie DRM ani ochrona serwerowa przed dowolnym przestawieniem daty.
- Local notifications: opt-in, domyślnie OFF, godzina 19:00, permission dopiero po włączeniu. Siedem jednorazowych terminów, odnawianych po otwarciu/zmianie dnia/ustawień. Daily Clear usuwa dzisiejszy termin. OFF usuwa wyłącznie identyfikatory SYSTEM 2.0, nie przypomnienia legacy. Android może opóźniać delivery. Brak backend push.
- Audio: istniejące `quest_complete.mp3` lub `level_up.mp3`, jeden player, priorytet level-up, cleanup na tle/unmount/OFF i po 5 s. Brak pasującego assetu quest-start: nie podstawiono losowego dźwięku; start ma haptic. Haptics nadal korzystają ze wspólnego helpera i respektują OFF.
- Settings: preferencje aktywności, reminder/time, permission center, rzeczywiste capabilities; DEV diagnostics odczytuje schema, liczbę eventów, sektory, skrócone ID, wersję, `PRAGMA quick_check`, reload profilu. Bez cheat rewards.

## Sygnały i natywny build

Sprawdzono package.json, node_modules oraz wynik lokalnego `expo-modules-autolinking resolve --platform android --json`: expo-audio 57.0.5 i expo-notifications 57.0.19 są dostępne; expo-sensors nie występuje. Działa PHONE/GPS. STEPS, cadence i MOTION są **UNAVAILABLE** w tej wersji, WATCH/Health nie są implementowane. Nie zapisujemy zerowych kroków zamiast brakującego sensora.

Przygotowano ExternalActivityEvidenceProvider PHONE/WATCH/HEALTH_CONNECT/APPLE_HEALTH, capability adapter, VerificationStrength STANDARD/ENHANCED/STRICT oraz future proof/WORKOUT_SESSION/QuestDifficultyProfile. STRICT bez wymaganych capabilities jest niedostępny. Walidacja nie przyjmuje spreparowanych dodatkowych źródeł, których obecny adapter nie udostępnia.

**Te zmiany JS/TS nie wymagają rebuilda**, jeśli Development Build zawiera aktualne zależności projektu. Nie odczytano zawartości APK z telefonu, więc obecność modułów w zainstalowanej binarce wymaga QA. Przyszłe uruchomienie kroków/akcelerometru wymaga oficjalnego `expo-sensors`, implementacji adaptera i **nowego Development Build**; nie zainstalowano pakietu automatycznie.

## Prywatność, stabilność i świadome ograniczenia

- Brak trasy, współrzędnych czy surowego motion stream w activity evidence; jawna projekcja dozwolonych agregatów przed zapisem. Brak transferu na backend. World nadal przechowuje sektory i położenie swojego sygnału zgodnie z wcześniejszą funkcjonalnością.
- Brak wiarygodnej wysokości w aktualnym pomiarze — nie wyliczamy elevation gain. Nie symulujemy jakości pracy ani powtórzeń STR/CHA. Nie przyznajemy retroaktywnego XP.
- GPS-only nie rozróżni pewnie wolnego roweru/samochodu od biegu. Stały, niejednoznaczny bieg lub wolna jazda mogą trafić do SUSPICIOUS. Wynik 87 nie oznacza laboratoryjnej probabilistycznej pewności. Potrzebna kalibracja terenowa przed szeroką betą.
- GPS pozostaje foreground-only. Watchery/timery/listenery mają cleanup i timeout. Zabicie procesu nie kończy ani nie wznawia misji jako zaliczonej. Próba przekraczająca lokalną północ nie może odebrać nagrody za wygasły Daily; potrzebna nowa próba w aktualnym zestawie.
- Dane i zegar są lokalne; brak ochrony przed zmodyfikowaną aplikacją/rootem lub celowym skokiem zegara w przyszłość. Cofnięcie strefy czasowej może czasowo wywołać CLOCK_ANOMALY. Nie wolno resetować danych jako obejścia.
- Bez urządzenia nie potwierdzono dźwięku, delivery notification, dokładności GPS, poboru baterii, renderingu/Android Back ani rzeczywistego przebiegu migracji istniejącego zapisu telefonu. Node sprawdza logikę, nie system operacyjny.
- Przypomnienia mają horyzont 7 dni i nie odnawiają się bez ponownego otwarcia aplikacji. Ustawienie dokładnej godziny nie jest gwarancją delivery co do sekundy. Zdarzenia permission/schedule failure mają obsługę błędu i retry.
- Historię zachowujemy; UI Log odczytuje ostatnie 50 wpisów. Nieudane próby przechowują tylko ostatni agregat dla danej instancji. Bounded są bufory pomiarów i deduplikacja prezentacji, nie trwała historia użytkownika.

## A. Migracje

- [ ] Na testowym telefonie z istniejącą bazą v3 zachowaj kopię danych testowych. Otwórz nowy bundle bez resetu/odinstalowania.
- [ ] Sprawdź niezmienione ID, nazwę, avatar, XP, skille, title, Awakening, sektory i Signal. DEV integrity = ok, schema =4.
- [ ] Osobno sprawdź świeżą instalację: onboarding, brak Daily przed Awakening i brak samoczynnego permission promptu.

## B. Daily

- [ ] Po Awakening widoczne trzy misje i rzeczywiste 0/3. Restart nie zmienia zestawu.
- [ ] Running/Cycling OFF: brak odpowiednich misji. Zmiana preferencji działa od nowego dnia, nie przerzuca bieżących.
- [ ] Ukończ 3/3: reward summary obejmuje +75/+10 tylko raz; ponowne otwarcie i restart nie wypłacają bonusu.
- [ ] Nowy lokalny dzień daje nowe instance IDs i zachowuje stare eventy. Cofnięcie daty sygnalizuje CLOCK_ANOMALY bez utraty danych.

## C. Walking

- [ ] Na otwartej przestrzeni przejdź 1,5 km normalnym i szybszym marszem. Brak ręcznego completion.
- [ ] Obserwuj dystans, czas, current/average speed, GPS quality, ACTIVITY MATCH. STEPS/CADENCE pozostają „—”.
- [ ] Po VERIFIED sprawdź +80 real/+70 VIT/+8 energy oraz wzrost totalDistance tylko raz.

## D. Running

- [ ] Włącz Running przed wygenerowaniem kolejnego zestawu. Przebiegnij 1 km: wolno, normalnie, z krótkim postojem i interwałami.
- [ ] Zapisz verdict i score; oceń false positives. GPS-only równomierny bieg może wymagać retry — nie traktuj tego jako dowodu oszustwa.
- [ ] Próba rowerem 10/15 km/h i samochodem nie może uzyskać nagrody jako oczywisty RUN. Niejednoznaczność = zero XP i SUSPICIOUS.

## E. Cycling

- [ ] Włącz Cycling; sprawdź 3 km, płynny i wolniejszy profil. Brak wymogu kroków.
- [ ] Zweryfikowany przejazd daje +100/+80 VIT/+10, tylko raz na instancję. Niejednoznaczny przejazd może pozostać SUSPICIOUS.

## F. Suspicious / rejected

- [ ] Kontrolowana próba niepasująca do misji: neutralne wyjaśnienie, brak completion i XP, event z verdict.
- [ ] RETRY / SPRÓBUJ PONOWNIE uruchamia świeży pomiar bez restartu aplikacji; watcher poprzedniej próby nie działa.
- [ ] Przy mock location, słabym GPS i przerwach nie ma fałszywej nagrody. Przeanalizuj tolerancję pojedynczego spike.

## G. Timer

- [ ] FOCUS/ORGANIZE 15 minut, LEARN/CREATE 20 minut: przed czasem nie ma reward; dokładny próg kończy automatycznie.
- [ ] Home Androida, blokada telefonu lub wyjście ze screena przerywa próbę. Powrót nie dolicza tła.
- [ ] UI uczciwie opisuje weryfikację czasu, nie wiedzy/produktywności.

## H. Weekly

- [ ] Zrób łącznie 5 pojedynczych Daily w jednym tygodniu: przy piątym +150/+15 exactly once.
- [ ] Szósty quest, restart i ponowne wejście nie dodają drugiego bonusu. Nowy tydzień ISO zaczyna licznik od 0; historia pozostaje.

## I. Streak

- [ ] Pierwszy clear =1, następny dzień clear =2. Kolejne wejścia tego dnia nie zwiększają wartości.
- [ ] Pełny dzień bez clear wygasza bieżący streak; następny clear =1. Brak mnożnika XP.
- [ ] Używaj osobnego profilu QA do zmian daty. W prawdziwym profilu przywróć zegar, nie kasuj danych.

## J. Notifications

- [ ] Po pierwszym starcie brak promptu. Włącz reminder: dopiero wtedy Android prosi o zgodę.
- [ ] Odmowa jest czytelna i nie blokuje aplikacji. Przy OFF brak schedule SYSTEM 2.0.
- [ ] Ustaw najbliższą przyszłą minutę: sprawdź powiadomienie na urządzeniu. Przetestuj ograniczenia baterii/Doze.
- [ ] Ukończ daily przed terminem: brak dzisiejszego reminder, przyszłe terminy zachowane. Godzina 25:00 odrzucona.
- [ ] Restart, OFF, zmiana czasu i reset testowego profilu nie pozostawiają duplikatów.

## K. Audio / haptics

- [ ] OFF jest respektowane dla questów, sector discovery i level-up. ON: pojedynczy completion albo level-up, nie oba jednocześnie.
- [ ] Tło lub OFF zatrzymuje player. Sprawdź brak crasha przy wyciszeniu / niedostępnym wyjściu audio.
- [ ] Start ma haptic; nie oczekuj dźwięku startu — nie ma pasującego assetu.

## L. Restart persistence

- [ ] Zabij aplikację podczas GPS i timera: restart nie kończy misji ani nie przyznaje XP.
- [ ] Zabij po ukończeniu: zapis jest kompletny, brak częściowego bonusu; ponowienie nie duplikuje reward.
- [ ] Nazwa/avatar/settings/preferencje/reminder/questy/eventy/World przetrwały restart.

## M. World regression

- [ ] Awakening nadal odblokowuje World; MapLibre Demo Tiles ładuje się jako DEVELOPMENT config.
- [ ] Fog i odkrywanie sektorów działają; jeden sektor nie jest zapisywany wielokrotnie.
- [ ] Unknown Signal: scan, relocation, automatyczne location verification i jednorazowa nagroda działają bez regresji.
- [ ] Brak przyrostu quest distance od samego World i brak audio spam przy każdym sektorze.

## N. Android Back / lifecycle

- [ ] Dialog zgody GPS w STARTING nie przerywa startu. Prawdziwe tło po utworzeniu subskrypcji ją usuwa.
- [ ] Wielokrotne szybkie START/RETRY nie tworzy dodatkowych watcherów. Wchodź/wychodź ze screena 20 razy; brak narastających callbacków.
- [ ] Back, zakładki, ekran ustawień i powrót nie duplikują timera, DB requests, nagród ani schedule.
- [ ] Sprawdź mały ekran, duży font, gesture navigation, brak zasłaniania przycisków i stabilność mapy po powrocie.

## Do pełnego MVP

Bramka wejścia do bety: powyższe fizyczne QA, kalibracja profili GPS na różnych telefonach i analiza false positives. Dalej: rzeczywisty adapter expo-sensors + rebuild i testy braków uprawnień, polityka sesji na granicy doby/stref, końcowy balans, stabilność delivery notification na producentach Androida, wydajność i bateria, plan prywatności/backup lokalnych danych. Zegarki, sponsorzy, backend, social, płatności i Chapter 2 pozostają poza tym etapem.

## Pliki tego etapu

Nowe:
- `src/system2/activity/capabilities.ts`
- `src/system2/activity/classifier.ts`
- `src/system2/activity/features.ts`
- `src/system2/activity/types.ts`
- `src/system2/components/BetaSettings.tsx`
- `src/system2/daily/calendar.ts`
- `src/system2/daily/templates.ts`
- `src/system2/identity/audio.ts`
- `src/system2/notifications/planner.ts`
- `src/system2/notifications/service.ts`
- `src/system2/storage/daily.ts`

Zmienione względem stanu zastanego (wcześniejsze zmiany MVP70/World zachowane):
- `src/system2/core/types.ts`
- `src/system2/identity/history.ts`
- `src/system2/identity/model.ts`
- `src/system2/quests/catalog.ts`
- `src/system2/quests/types.ts`
- `src/system2/quests/useQuestRun.ts`
- `src/system2/screens/QuestRunScreen.tsx`
- `src/system2/screens/QuestsScreen.tsx`
- `src/system2/screens/SettingsScreen.tsx`
- `src/system2/screens/SystemHomeScreen.tsx`
- `src/system2/screens/SystemLogScreen.tsx`
- `src/system2/state/SystemProvider.tsx`
- `src/system2/storage/database.ts`
- `src/system2/storage/migrations.ts`
- `src/system2/tests/gameplay.test.cjs`
- `src/system2/MVP_QA.md`


## Kontrola końcowa MVP 90 (2026-09-18)

- `npx tsc --noEmit --incremental false`: PASS w C:\Users\Ja\SYSTEM (exit 0).
- `node --test src/system2/tests/gameplay.test.cjs`: **146/146 PASS**, 0 failed/skipped. Zachowano wszystkie 91 wcześniejszych regresji, dodano 55 scenariuszy.
- `git diff --check`: PASS po usunięciu jednej końcowej spacji w nagłówku QuestRun; informacyjne LF/CRLF w zastanym progression.ts nie są błędem.
- `git status`: zmiany niezacommitowane; aktualny etap dotyczy wyłącznie src/system2. Wcześniejsze pliki routingu/MVP70/World pozostają zachowane. Bez commita.
- Fizyczne Android QA: **NIEWYKONANE**; checklista A–N powyżej jest obowiązkową bramką przed zamkniętą betą.


## STORY ENGINE QA (2026-09-18)

Status: implementacja gotowa do fizycznego Android QA; testy telefonu nie zostały wykonane. Bez commita, nowych bibliotek ani zmian natywnych. Wcześniejsze poprawki avatara i wspólnego Safe Area pozostają zachowane.

### Architektura i reguły

- ARC 01 AWAKENING zawiera CH01 FIRST AWAKENING oraz CH02 WORLD LINK. Chapter 3 jest wyłącznie UNKNOWN / LOCKED. Modele obejmują Main, Side, Hidden, Boss i Rematch; katalog i selektory są oddzielone od transakcji i UI. Dotychczasowy silnik GPS/TIMER obsługuje również Bossa.
- Home pokazuje faktyczny główny cel: Awakening → World Link → The First Wall → STORY SIGNAL LOST. Story/Chronicle otwierają się z Home i Questów bez nowej zakładki dolnego menu.
- WORLD LINK po Awakening: 3 różne sektory, pierwszy Signal fizycznie LOCATED, dowolny pełny Daily Clear. Każdy warunek jest trwały. Nagroda raz: +400 REAL XP, +100 RES XP, +25 ENERGY i dostępny tytuł PATHFINDER.
- EXTRA MILE: nowa poprawnie VERIFIED aktywność ruchowa Daily osiąga >=125% bazowego dystansu. Nagroda raz +50 REAL XP / +40 WIL XP. Ponieważ standardowy GPS kończy się automatycznie przy 100%, przed zwykłym rozpoczęciem Daily można wybrać cel rozszerzony 125%. To ta sama sesja i watcher; bez osobnego startu Side Questa ani ręcznego ukończenia. Zwykłe 100% i first_movement pozostają bez zmian.
- NO TURNING BACK: nowa pomyślna próba po wcześniejszej kwalifikowanej porażce/przerwaniu tego samego rodzaju. Nazwa ukryta do odkrycia. Nagroda raz +60 REAL XP / +50 WIL XP. Rodzaj to WALK/RUN/BIKE, a bez klasyfikacji typ weryfikacji (TIMER lub GPS_DISTANCE); różne timery mogą więc spełnić ten warunek.
- QuestAttempt: id, questId, kind, startedAt, endedAt, result, duration, distance, reason, eligibility; brak surowej trasy. Rezultaty COMPLETED/INTERRUPTED/FAILED/SUSPICIOUS/REJECTED/ABANDONED. Pozostawione po zabiciu procesu próby przechodzą na ABANDONED przy inicjalizacji, bez nagrody i bez Rematch.
- Rematch wymaga realnego przerwania aktywnej sesji (BACKGROUND/LEFT_SCREEN) lub odrzucenia weryfikacji, dodatniego czasu działania i zakończenia porażki przed rozpoczęciem nowej próby. Odmowa permission i techniczne błędy GPS/SQLite nie kwalifikują. BEGIN REMATCH uruchamia zwykłą próbę; +15 WIL XP raz dla konkretnej instancji questa. Kolejne porażki nie kumulują premii, nie odejmują XP i nie modyfikują streaka.
- THE FIRST WALL po WORLD LINK: jawny start zapisuje lokalny dzień. Stage 1 TIMER 15 minut, Stage 2 WALK albo RUN 2 km, Stage 3 nowy ukończony Daily po Stage 2, w następnym lokalnym dniu od startu Bossa lub później. Pominięcie następnego dnia nie blokuje Bossa na stałe. Etapy trwają między sesjami; nagroda końcowa raz +500 REAL XP / +120 WIL XP / +80 VIT XP / +30 ENERGY, tytuł WALLBREAKER.
- Chronicle przechowuje kamienie milowe StoryEvents oddzielnie od VerifiedEvents. System Log pokazuje próby osobno. Ostatnie 50 wpisów/prob jest ładowane dla UI, bez skanowania całej historii w renderze. Rematch Available/Completed pozostają w StoryEvents, ale są wyłączone z listy kamieni milowych Chronicle.
- StoryNotice pokazuje krótki komunikat; durable consumed zapisywane przed pokazaniem chroni przed ponownym odtwarzaniem po starcie. Awaria między zapisem consumed a renderem może pominąć banner; sam wpis Chronicle i nagrody pozostają trwałe.

### Migracja i atomowość

SQLite schema **v5**, migracja addytywna: story_progress, quest_attempts, story_events, boss_progress oraz indeksy. Istniejące app_state/player, quest_completions, verified_events, chapter_completions, discovered_sectors, world_signals, daily_sets/daily_instances, protocol_bonuses pozostają zachowane, bez resetu profilu.

Istniejące ukończone Awakening, odkryte sektory, LOCATED Signal i Daily Clear są odczytywane jako kamienie milowe. Nie trzeba ponownie odkrywać trzech sektorów. Spełniony już WORLD LINK może przyznać nową nagrodę rozdziału podczas pierwszego odczytu; nie odtwarza nagród bazowych wcześniejszych questów, Signal ani Daily Clear. Side/Hidden/Rematch wymagają nowych weryfikacji i nowych zapisów prób. Nie fabrykujemy dawnej historii porażek.

Wspólna kolejka i exclusive SQLite transaction obejmują bazową nagrodę, profil, ukończenie questa, VerifiedEvent, ukończenie próby oraz powiązane nagrody i StoryEvents. WORLD LINK również rozlicza się w transakcji ostatniego kamienia milowego. Extra Mile, Hidden, Rematch i końcowy Boss korzystają z unikatowych markerów; failure/rollback nie pozostawia częściowego XP. Testy obejmują awarie zapisu markera, eventu i COMMIT oraz ponowną próbę. Tytuły są wyliczane z trwałych markerów i nie zmieniają automatycznie wybranego tytułu gracza.

### Android QA — do wykonania na telefonie

- [ ] Existing Awakening migration: zaktualizować istniejący profil, sprawdzić XP, avatar, sektory, Signal, Daily/Weekly i brak powtórnych starych nagród.
- [ ] World Link: dostępny dopiero po Awakening; Home i Story zgodnie pokazują postęp 0–3.
- [ ] Sector milestone: 3 unikalne sektory zaliczają raz; ponowne wejście do tego samego nie zwiększa licznika.
- [ ] Signal milestone: dopiero fizyczne LOCATED, z zachowaniem dotychczasowych progów GPS.
- [ ] Daily Clear milestone: pełny zestaw, a nie pojedynczy Daily; istniejący Clear rozpoznawany.
- [ ] Chapter completion: 400/100 RES/25, PATHFINDER raz, odświeżenie i restart nie powielają.
- [ ] Side Quest: standardowe 100% działa jak wcześniej; wybrać 125%, osiągnąć realny dystans, sprawdzić 50/40 WIL raz.
- [ ] Failed quest: aktywny TIMER/GPS przerwać tłem lub wyjściem; permission dialog i błąd techniczny nie dają Rematch.
- [ ] Rematch: BEGIN REMATCH, ta sama instancja, sukces i +15 WIL raz mimo kilku porażek.
- [ ] Hidden Quest: wcześniejsza prawdziwa porażka → późniejszy sukces tego samego rodzaju, odkrycie i 60/50 WIL raz.
- [ ] Boss Stage 1: start zapisany, 15 minut foreground; tło przerywa bieżącą próbę, nie kasuje wcześniejszych etapów.
- [ ] Boss Stage 2: po focus WALK lub RUN 2 km, klasyfikacja rzeczywistego GPS, drugi wariant nie daje dodatkowego etapu.
- [ ] Next-day Stage 3: ten sam dzień nie zalicza; nowy Daily po Stage 2 następnego dnia lub później zalicza.
- [ ] Boss reward: 500/120 WIL/80 VIT/30, WALLBREAKER raz; Home kończy na UNKNOWN bez fikcyjnego Chapter 3.
- [ ] Restart persistence: wyłączyć proces między etapami; ukończone etapy, Chronicle, tytuły zostają, otwarta próba ABANDONED.
- [ ] Duplicate protection: szybkie podwójne tapnięcia/starty, refresh i restart nie powielają nagród ani bannerów.
- [ ] Regresje: pierwszy GPS 500 m i permission dialog, focus/final trial, Daily/Weekly, World Signal, avatar, Safe Area, foreground cleanup oraz diagnostyka gps:true / steps:false / motion:false / watch:false.

### Kontrole i ograniczenia

173 testy regresji (wszystkie 151 wcześniejsze zachowane, 22 dodatkowe przypadki) przechodzą w kopii roboczej. Wyniki końcowych kontroli w C:\Users\Ja\SYSTEM podano poniżej po wdrożeniu plików.

Zmiany są JavaScript/TypeScript/SQLite i routingiem, bez nowych modułów natywnych: **rebuild obecnego Development Build nie jest potrzebny**. Potrzebne przeładowanie aktualnego bundla; nowe /story trafia do generowanych typów Expo.

Ograniczenia: brak fizycznego Android QA w tym środowisku, SQLite testowane adapterem testowym zamiast natywnej biblioteki telefonu; lokalny zegar/dzień bez serwera, istniejąca detekcja cofania czasu nie zastępuje autorytatywnego czasu; GPS-only nie rozróżnia niezawodnie wszystkich pojazdów; brak nowych sensorów, background tracking, Chapter 3, backendu i Health Connect. Historia prób nie odtwarza dawnych porażek. Kwalifikacja Hidden dotyczy rodzaju aktywności, Rematch konkretnej instancji (Daily innego dnia jest inną instancją).

### Nowe pliki Story Engine

- src/app/story.tsx
- src/system2/components/StoryNotice.tsx
- src/system2/screens/StoryScreen.tsx
- src/system2/storage/story.ts
- src/system2/story/catalog.ts
- src/system2/story/selectors.ts
- src/system2/story/types.ts

### Zmienione pliki Story Engine

- src/app/_layout.tsx
- src/system2/core/types.ts
- src/system2/identity/model.ts
- src/system2/quests/catalog.ts
- src/system2/quests/types.ts
- src/system2/quests/useQuestRun.ts
- src/system2/screens/QuestRunScreen.tsx
- src/system2/screens/QuestsScreen.tsx
- src/system2/screens/SystemHomeScreen.tsx
- src/system2/screens/SystemLogScreen.tsx
- src/system2/state/SystemProvider.tsx
- src/system2/storage/database.ts
- src/system2/storage/migrations.ts
- src/system2/storage/world.ts
- src/system2/tests/gameplay.test.cjs
- src/system2/MVP_QA.md

### Wyniki końcowe w docelowym repozytorium

- TypeScript: PASS (exit 0), npx tsc --noEmit --incremental false.
- Wszystkie testy: 173/173 PASS, 0 failed/skipped (node --test src/system2/tests/gameplay.test.cjs).
- git diff --check: PASS (exit 0); tylko informacja o konwersji LF/CRLF w tym dokumencie.
- git status: zmiany Story Engine oraz wcześniejsze poprawki avatar/Safe Area pozostają niezacommitowane. Bez zmian package.json ani lockfile.
