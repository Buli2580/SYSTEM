# SYSTEM Visual Integration 1.0

Gałąź: `feature/system-visual-assets`. Baza: `6fa22addf9af669f25d6f10f8a9230d8f30951a7`.

## Podłączenie do aplikacji

| Ekran / komponent | Wykorzystanie rzeczywistych danych |
| --- | --- |
| Intro / SystemBootSequence, Onboarding | Przyciemnione tło; zachowane kroki, animacje i przyciski |
| Account / SYSTEM ONLINE | Tło logowania pod formularzem |
| HOME 3.0 | Tło pod animacjami sceny, HUD, XP i działającymi wejściami do misji |
| Character / CharacterCard | 15 ilustracji: trzy istniejące style × pięć etapów ewolucji; zdjęcie użytkownika ma pierwszeństwo |
| Quests / QuestRun / QuestExperience | Miniatury według BOSS, aktywności RUN/BIKE/WALK lub głównej umiejętności; także questy adaptacyjne |
| Inventory | Ilustracje sześciu istniejących kosmetyków, tylko po odblokowaniu |
| Character — wyposażenie | Ilustracje według slotów istniejących przedmiotów; equip/unequip bez zmian |
| Achievements | Sześć ilustracji kategorii, zachowane ukryte osiągnięcia i rzeczywisty postęp |
| Story / Boss | The First Wall: ilustracja w istniejącej arenie z prawdziwym HP |
| Raids / BossStatusCard | Ilustracja przy rzeczywistych wierszach raidów pobranych przez istniejący ekran; bez tworzenia nowych bossów |
| RewardEventSequence | XP i awans z istniejącego receipt; bez zmiany kolejności, przyznawania lub zamykania nagród |
| World / NativeWorldMap | Mała ilustracja sygnału na jego współrzędnych; zachowane MapLibre, warstwy, GPS, kamera i fallback mapy |
| Partner Marketplace | Dziewięć kategorii offline i „Oferty w przygotowaniu”; wejścia z Expansion i Premium; bez ofert, marek, rabatów i przycisków zakupu |

## Zasoby i jakość

Źródła pozostają w `E:/SYSTEM/ASSETS`. Odczytano dwa manifesty i README. Paczka źródłowa: 260 WebP, 130 ilustracji w dwóch wariantach, 16 357 974 bajty. Wszystkie obrazy źródłowe dały się zdekodować, nie znaleziono identycznych plików po SHA256. Warianty telefoniczne są powiększeniami, nie nowymi renderami.

Zaimportowano **48 WebP, 1 340 092 bajty (1,278 MiB)**. Manifest w `assets/visual/manifest.json` zawiera każde źródło, rozmiar, hash, wymiary i informację o alfa. Centralny rejestr: `src/system2/visual/assets.ts`. W repozytorium jest tylko jeden wariant każdej wybranej grafiki.

- Brak brakujących lub uszkodzonych importowanych plików: zweryfikowano istnienie, SHA256 i dekodowanie wszystkich 48 obrazów.
- Żaden obraz nie ma kanału alfa. Nie usuwano tła. Postacie i przedmioty pozostają ilustracjami w ramkach.
- Questy/przedmioty mają około 70 px szerokości; miniatury wyświetlane są zwykle w 44 dp, znacznik w 28 dp, boss w 64 dp. Na telefonach o dużej gęstości pikseli mogą być miękkie.
- Postacie mają około 301×335 px; pełnoekranowe tła 1080×1920 pochodzą z małych wycinków około 331×465. Docelowo wymagają renderów w większej rozdzielczości.
- Znacznik z paczki mapy zawiera fragment sąsiedniego pola planszy. Wymaga ręcznego przygotowania osobnej ikony alfa; teraz jest małą ilustracją obok zachowanego, dokładnego znacznika wektorowego.
- Odznaki, mapa i efekty wymagają alfa dopiero do użycia jako samodzielne wycięte elementy. W manifeście oznaczono `alphaFollowUp`; nie wycinano poświat automatycznie.
- Tła mają warstwę przyciemnienia 82%, `cover` i centralne kadrowanie. Miniatury używają `contain`, nie są rozciągane na cały ekran. Tekst, przyciski i statystyki pozostały natywne.
- Miniatury i tła nie przechwytują dotyku. Miniatury po błędzie obrazu pokazują neutralny symbol; po zmianie źródła ponawiają wyświetlanie. Nieznany typ przedmiotu korzysta z tego samego fallbacku. Pod tłem pozostaje bazowy kolor ekranu.
- Obrazy są lokalne, bez nowych żądań sieciowych i bez prefetch całej paczki. `require` rejestruje identyfikatory Metro; dekodowanie następuje w zamontowanych widokach. Nie dodano zależności ani zmian w konfiguracji natywnej.
- 1,278 MiB to rozmiar plików źródłowych dodanych do aplikacji, nie zmierzony przyrost APK. Nie budowano APK.

## Kontrole

Końcowe kontrole po uzupełnieniu fallbacku:

- `node --test scripts/visual-assets.test.cjs scripts/apk-provenance.test.cjs src/system2/tests/gameplay.test.cjs`: **320/320**, zero błędów i pominięć, exit 0 (328,6 s). Zestaw obejmował wtedy 6 testów wizualnych, 8 testów pochodzenia APK i 306 testów gameplay.
- Po dodaniu osobnego testu fallbacku ponownie uruchomiono `node --test scripts/visual-assets.test.cjs`: **7/7**, exit 0. Łącznie sprawdzono 321 różnych testów; nie było jednego uruchomienia 321 testów.
- `npx.cmd tsc --noEmit --incremental false`: **exit 0**.
- `git diff --check` i `git diff --cached --check`: **exit 0**.
- Dekodowanie Pillow, zgodność SHA256, wymiary i istnienie importów: **48/48**, zero błędów.
- Nawigacja Marketplace: test potwierdza plik trasy i wejścia z istniejących ekranów Expansion/Premium. W Node renderowano drzewo Marketplace i sprawdzano fallback/dotyk komponentu miniatur; to nie jest test wizualny urządzenia.

W poprzedniej części tej samej pracy zakończył się eksport JavaScript dla Androida (`expo export --platform android --no-bytecode`) do `E:/SYSTEM/visual-assets-bundle-check`. Eksport potwierdził rozwiązywanie modułów i zasobów; nie był kompilacją natywną ani APK. Późniejszy fallback miniatur sprawdzono TypeScriptem i testami.

Expo public config: `pl.systemworld.app`, wersja `1.0.1`, OTA wyłączone. Nie zmieniono app.config.js, podpisu, Gradle ani gałęzi wydania. Nie zmieniono bazy, synchronizacji, ekonomii, weryfikacji i silników gameplay.

## Do sprawdzenia na telefonie

Nie wykonano testu wizualnego na telefonie ani pomiaru FPS/pamięci. Pozostają: ostrość na wysokim DPI, kadrowanie przy różnych proporcjach i dużej czcionce, wszystkie style postaci, czytelność Home podczas animacji, przewijanie kolekcji, nakładanie markera MapLibre i jego dotyk na Androidzie oraz prezentacja rzeczywistych nagród/awansów. Brak kanału alfa i mała rozdzielczość źródeł pozostają ograniczeniami jakości.

## Faktycznie zmienione i dodane pliki

- `assets/visual/aura.webp`
- `assets/visual/badgeBoss.webp`
- `assets/visual/badgeProgress.webp`
- `assets/visual/badgeQuest.webp`
- `assets/visual/badgeSpecial.webp`
- `assets/visual/badgeStreak.webp`
- `assets/visual/badgeWorld.webp`
- `assets/visual/boss.webp`
- `assets/visual/car.webp`
- `assets/visual/character01.webp`
- `assets/visual/character02.webp`
- `assets/visual/character03.webp`
- `assets/visual/character04.webp`
- `assets/visual/character05.webp`
- `assets/visual/character06.webp`
- `assets/visual/character07.webp`
- `assets/visual/character08.webp`
- `assets/visual/character09.webp`
- `assets/visual/character10.webp`
- `assets/visual/character11.webp`
- `assets/visual/character12.webp`
- `assets/visual/character13.webp`
- `assets/visual/character14.webp`
- `assets/visual/character15.webp`
- `assets/visual/core.webp`
- `assets/visual/creative.webp`
- `assets/visual/cycle.webp`
- `assets/visual/electronics.webp`
- `assets/visual/entertainment.webp`
- `assets/visual/focus.webp`
- `assets/visual/food.webp`
- `assets/visual/home.webp`
- `assets/visual/homeCategory.webp`
- `assets/visual/intro.webp`
- `assets/visual/jacket.webp`
- `assets/visual/levelUp.webp`
- `assets/visual/manifest.json`
- `assets/visual/mapSignal.webp`
- `assets/visual/pendant.webp`
- `assets/visual/pets.webp`
- `assets/visual/ring.webp`
- `assets/visual/run.webp`
- `assets/visual/social.webp`
- `assets/visual/strength.webp`
- `assets/visual/study.webp`
- `assets/visual/tool.webp`
- `assets/visual/travel.webp`
- `assets/visual/walk.webp`
- `assets/visual/xp.webp`
- `scripts/visual-assets.test.cjs`
- `src/app/partner-marketplace.tsx`
- `src/system2/components/BossStatusCard.tsx`
- `src/system2/components/CharacterCard.tsx`
- `src/system2/components/QuestExperience.tsx`
- `src/system2/components/RewardEventSequence.tsx`
- `src/system2/components/SystemBootSequence.tsx`
- `src/system2/components/SystemEventOverlay.tsx`
- `src/system2/components/SystemPage.tsx`
- `src/system2/components/VisualArt.tsx`
- `src/system2/components/world/NativeWorldMap.tsx`
- `src/system2/screens/AccountScreen.tsx`
- `src/system2/screens/AchievementsScreen.tsx`
- `src/system2/screens/CharacterScreen.tsx`
- `src/system2/screens/ExpansionHubScreen.tsx`
- `src/system2/screens/InventoryScreen.tsx`
- `src/system2/screens/OnboardingScreen.tsx`
- `src/system2/screens/PartnerMarketplaceScreen.tsx`
- `src/system2/screens/PremiumHubScreen.tsx`
- `src/system2/screens/StoryScreen.tsx`
- `src/system2/screens/SystemHomeScreen.tsx`
- `src/system2/tests/gameplay.test.cjs`
- `src/system2/visual/assets.ts`
- `docs/VISUAL-INTEGRATION-1.0.md` (ten raport)
