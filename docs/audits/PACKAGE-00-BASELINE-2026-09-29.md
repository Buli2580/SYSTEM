# SYSTEM — Paczka 0: stan faktyczny i bramki synchronizacji

Data: 2026-09-29. Źródło: GitHub `Buli2580/SYSTEM`, gałąź `integration/system-evening-build`. Ten dokument jest **inwentaryzacją wstępną**, a nie raportem z uruchomionych testów ani potwierdzeniem gotowego APK.

## Potwierdzone w odczytanych plikach
- `package.json`: Expo ~57.0.23, React Native 0.86.3, React 19.2.3, TypeScript ~6.0.3; skrypty `typecheck`, `lint`, `android`. Samo istnienie skryptu nie potwierdza jego wyniku.
- `app.config.js`: bezpośredni EAS build jest blokowany; przewidziano oficjalny workflow APK, manifest pochodzenia buildu i wyłączone Expo Updates.
- `scripts/official-apk.cjs`: oficjalna ścieżka wymaga istniejącej tożsamości podpisu; nie wolno zastępować klucza.
- `src/system2/quests/useQuestRun.ts`: istnieje logika sesji misji, checkpointów, GPS, ryzyka lokalizacji i przekazania sesji do tła.
- `src/system2/screens/QuestRunScreen.tsx`: ekran uruchamiania misji korzysta z `useQuestRun` i komponentów przebiegu misji.
- `src/system2/tests/gameplay.test.cjs`: istnieje plik testów gameplayu; **nie uruchomiono go w ramach tej paczki**.

## Krytyczna rozbieżność przed synchronizacją
Według wcześniejszego lokalnego raportu poprawki GPS zapisano w lokalnym commicie `09309888269559b2e99c116685593d3e8dc42721`. Próba porównania tego SHA z gałęzią GitHub przez API zakończyła się 404. **Nie traktować lokalnych poprawek jako opublikowanych na GitHubie**; najpierw potwierdzić, czy commit został wypchnięty, czy trzeba przenieść go z lokalnego repo. Nie scalać automatycznie tego dokumentu z wersją używaną do APK.

## Lista kontrolna: 50 punktów paczki 0
Status: **P** = potwierdzono obecność w odczytanym źródle; **D** = do sprawdzenia w repo/testach/na urządzeniu. P nie oznacza pełnej sprawności funkcji.

### A. Źródło i wydanie
01. [P] Repozytorium i gałąź robocza są dostępne.
02. [D] Ustalić dokładny SHA HEAD gałęzi GitHub przed scalaniem.
03. [D] Porównać lokalny SHA APK z GitHub HEAD.
04. [D] Ustalić status lokalnego commitu GPS `0930988`.
05. [D] Zweryfikować brak niezatwierdzonych zmian przed oficjalnym buildem.
06. [P] Oficjalny skrypt budowania APK istnieje.
07. [P] Konfiguracja blokuje bezpośredni EAS build.
08. [P] Konfiguracja zawiera kontrolę pochodzenia buildu.
09. [P] Oficjalny skrypt wymaga dotychczasowej tożsamości podpisu.
10. [D] Sprawdzić wynik ostatniego oficjalnego APK i podpisu.

### B. Kompilacja i jakość
11. [P] Istnieje polecenie `typecheck`.
12. [P] Istnieje polecenie `lint`.
13. [P] Istnieje plik testów gameplayu.
14. [D] Uruchomić typecheck na docelowym SHA.
15. [D] Uruchomić testy gameplayu na docelowym SHA.
16. [D] Zweryfikować zależności i lockfile na docelowym SHA.
17. [D] Sprawdzić powtarzalność prebuilda.
18. [D] Wyjaśnić ostatni błąd natywnej kompilacji CMake/NDK.
19. [D] Potwierdzić finalny artefakt APK/AAB.
20. [D] Sprawdzić instalację i uruchomienie na Androidzie.

### C. Misje i GPS
21. [P] Istnieje hook przebiegu misji `useQuestRun`.
22. [P] Istnieje ekran `QuestRunScreen`.
23. [P] Hook korzysta z checkpointów misji.
24. [P] Hook zawiera integrację GPS.
25. [P] Hook odwołuje się do sesji GPS w tle.
26. [D] Zweryfikować pierwsze ustalenie pozycji na telefonie.
27. [D] Zweryfikować naliczanie dystansu 500 m.
28. [D] Zweryfikować blokadę i odblokowanie telefonu.
29. [D] Zweryfikować powrót do aplikacji bez resetu dystansu.
30. [D] Zweryfikować bezpieczne zakończenie i XP dokładnie raz.

### D. Pozostały gameplay
31. [D] Sprawdzić Home i stan bieżącej misji.
32. [D] Sprawdzić katalog misji i dobór dzienny.
33. [D] Sprawdzić Weekly/Boss i warunki ukończenia.
34. [D] Sprawdzić XP, poziomy i statystyki.
35. [D] Sprawdzić Inventory/Items.
36. [D] Sprawdzić Achievements/Titles.
37. [D] Sprawdzić Journeys i milestones.
38. [D] Sprawdzić mapę świata i uprawnienia lokalizacji.
39. [D] Sprawdzić tryby wiekowe i bezpieczeństwo dzieci.
40. [D] Sprawdzić offline, migracje i odzyskanie danych.

### E. Usługi i beta
41. [D] Sprawdzić logowanie i trwałość sesji.
42. [D] Sprawdzić synchronizację danych po offline.
43. [D] Sprawdzić AI Game Mastera i fallback bez sieci.
44. [D] Sprawdzić Social/Guild/PvP/Raid.
45. [D] Sprawdzić telemetrykę i zgodę użytkownika.
46. [D] Sprawdzić powiadomienia i ustawienia.
47. [D] Sprawdzić prywatność, usuwanie konta i danych.
48. [D] Sprawdzić konfigurację Google Play.
49. [D] Przeprowadzić test przejścia: start → quest → weryfikacja → XP → restart.
50. [D] Dopiero po 02–49 ustalić listę braków, właścicieli i kolejność następnych paczek.

## Zasady dalszych prac
- Nowe paczki przygotowywać na oddzielnych gałęziach i scalać po przeglądzie.
- Nie nadpisywać lokalnych zmian `package.json`, katalogu buildu ani backupu.
- Nie zmieniać klucza podpisu, nie tworzyć APK z niezweryfikowanego SHA.
- Nie oznaczać punktów D jako wykonanych bez kodu, testu lub dowodu z urządzenia.

## Kontrola źródeł — etap 2 (GitHub, bez uruchamiania kodu)
Odczytano dodatkowo: `src/system2/state/SystemProvider.tsx`, `src/system2/quests/catalog.ts`, `src/system2/storage/database.ts`, `src/system2/verification/gps.ts`, `src/system2/quests/firstMovement.ts`, `src/system2/telemetry/amplitude.ts`, `src/system2/core/inventory.ts`.

- [ŹRÓDŁO] `firstMovement.ts`: misja `first_movement_v1` wymaga 500 m GPS, progu weryfikacji 80 i deklaruje nagrodę 100 real XP / 80 VIT XP / 10 energii. Nie dowodzi to prawidłowego naliczenia na telefonie.
- [ŹRÓDŁO] `catalog.ts`: katalog łączy misje Awakening, Boss, generowane i Daily, a także prezentację AI. Nie dowodzi to prawidłowego doboru spersonalizowanych misji.
- [ŹRÓDŁO] `SystemProvider.tsx`: provider importuje mechanizmy adaptacyjne, osiągnięcia, przypomnienia i magazyn danych; wymaga sprawdzenia wywołań i integracji.
- [ŹRÓDŁO] `database.ts`: integruje MOVE, model adaptacyjny, osiągnięcia, lokalną weryfikację i ukończenie misji; sama obecność integracji nie dowodzi poprawności migracji ani trwałości danych.
- [ŹRÓDŁO] `inventory.ts`: istnieją typy przedmiotów, rzadkości, slotów i porównywania ekwipunku. Nie potwierdzono pełnego UI.
- [ŹRÓDŁO] `telemetry/amplitude.ts`: kolejka AsyncStorage ma limit 200 zdarzeń; wysyłka zależy od `EXPO_PUBLIC_AMPLITUDE_API_KEY`. Nie potwierdzono konfiguracji klucza ani faktycznej dostawy zdarzeń.
- [OGRANICZENIE] `quests/backgroundLocation.ts` nie istnieje pod sprawdzoną ścieżką; to **nie dowodzi braku obsługi tła** — hook importuje ją z innego modułu.
- [KRYTYCZNE] API GitHub potwierdza bazę PR #146: `d0241df4335b159849e0e958cbea04a59429ad24`, czyli starszy commit niż lokalnie zgłoszone `0930988`. Do czasu wypchnięcia/uzgodnienia poprawek GPS nie scalać PR i nie uruchamiać oficjalnego APK z tej gałęzi.

### Zaktualizowany stan punktów
Potwierdzono źródłowo dodatkowo istnienie: katalogu misji (32), modułu Inventory (35), modelu adaptacyjnego w integracji (część 32/43), kolejki telemetrycznej (45). Punkty 32, 35 i 45 pozostają **D**, ponieważ dotyczą sprawności całej funkcji, nie samej obecności pliku. Wszystkie wyniki testów, instalacji APK i zachowania na urządzeniu nadal **niezweryfikowane w tej paczce**.
