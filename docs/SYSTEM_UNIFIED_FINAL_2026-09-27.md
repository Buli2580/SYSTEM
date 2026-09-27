# SYSTEM unified-final — raport scalenia, 2026-09-27

## Baza i źródła

Katalog: `E:\SYSTEM\SYSTEM-unified-final`.
Gałąź: `integration/system-unified-final-20260927`.

| Źródło | Zachowane funkcje |
| --- | --- |
| `30db29fca4dd95584b73cba3821e901781687f7c` — baza najnowszego UI | HOME 3.0, onboarding z celem i ścieżką, animacje, nawigacja pięciu zakładek, Character 3, ekwipunek i lokalna progresja |
| `74e99d59ff7a116d19b802fdc24d1c21550fad35` — pierwsze scalenie | AI Game Master, personalizacja, Adaptive Daily/Weekly/Boss, generator g1, trwałe cele i Journey, migracje v9, transakcyjne nagrody, GPS/checkpointy |
| `fd7e52d2d24eae52facbfec1c0569d3f8bc050c3` — drugie scalenie | MOVE i cykl śledzenia, Family/School i ograniczenia wieku, rozszerzenia Character i audio, trwała kolejka prezentacji nagród, AI v2, Social/Guild/PvP/Raid/Seasons, migracje backendu i synchronizacja |

Pierwszy merge: `ab8b8fa81a6b63649be710a50b538f05cad88440`.
Drugi merge zachowuje oboje rodziców; jego identyfikator znajduje się w końcowym komunikacie i `git log -1`.
Baza nie została zastąpiona wersją `2299de07`. HOME i ekran onboardingu są identyczne z pierwszym scaleniem; zapis celu onboardingu rozszerzono o kanoniczną listę celów bez ponownego przyznawania XP.

## Rozwiązywanie konfliktów

- Pierwsze scalenie: 15 konfliktów plików.
- Drugie scalenie: 107 konfliktów plików.
- Razem: 122 wystąpienia konfliktów; nie jest to liczba różnych plików.
- Łączono implementacje i zależności. Zachowano adaptacyjne cele, starsze migracje, nowsze ekrany i transakcyjne zapisy. Nie użyto globalnego wyboru ours/theirs.

## Naprawy integracji

1. GPS: powrót na pierwszy plan czeka na zakończenie przekazania śledzenia i zapisu checkpointu. Test obejmuje szybkie background → active, zachowanie dystansu, usuwanie spóźnionego watchera oraz wznowienie pomiaru.
2. MOVE: poprawiono wyrażenie regularne daty, które odrzucało poprawny dzień. Oficjalny wkład grupy nadal wymaga zaakceptowanego dowodu serwerowego.
3. Onboarding: wybrany cel zapisuje się atomowo również w trwałych celach, z kluczem idempotencji. Ponowienie nie tworzy drugiego celu ani XP.
4. Boss: dowody w testach korzystają z zapisanej trudności, zamiast ze stałych wartości starego bossa.
5. Kolejka nagród, ekwipunek oraz nagrody misji pozostają transakcyjne i odporne na powtórzenia.

## Kontrakt Adaptive–backend

Nowa migracja: `supabase/migrations/20260927090000_adaptive_sync_v1.sql`. Nie zmieniono historycznych migracji w celu wdrożenia nowego kontraktu.

- Backend rozpoznaje `:a1:difficulty:target` i sam wylicza cel z ograniczonego budżetu czasu, liczby zadań i katalogu. Nie przyjmuje dowolnego celu ani nagrody z klienta.
- Plan dnia i cel tygodnia zostają zapisane w prywatnych tabelach przy pierwszym zaakceptowanym dowodzie. Zmiana trybu w kolejnych dniach nie zmienia ustalonego celu Weekly.
- Czwarty slot wymaga wcześniejszej aktywności zaakceptowanej przez serwer. Piąty jest odrzucany.
- Plan difficulty=1 nie może pobierać nagrody NORMAL/HARD. Zmiana sufiksu, poziomu, urządzenia lub klucza zdarzenia nie daje kolejnej nagrody za tę samą misję danego dnia.
- Budżety i nagrody są zapisywane w jednej transakcji pod istniejącą blokadą użytkownika. Zachowano sprawdzanie właściciela, uprawnień, wyniku weryfikacji, czasu, dystansu, prędkości, rodzaju aktywności i warunków wstępnych.
- Boss zachowuje trudność między etapami. Nagroda finału wymaga zaakceptowanych etapów i Daily z późniejszego dnia lub istniejącego zaufanego stanu bossa.
- Dawne zdarzenia można wzbogacić wyłącznie o brakujący kontekst Adaptive, przy identycznym dowodzie i braku przyznanej nagrody. Przetworzone zdarzenia nie są przepisywane.
- Lokalny backfill używa historycznego planu, nie dzisiejszych preferencji. Brak historycznego planu nie blokuje naprawy kolejnych wpisów i nie powoduje wymyślania danych.

## Weryfikacja

| Kontrola | Wynik |
| --- | --- |
| Wszystkie testy aplikacji: `node --test src/system2/tests/*.test.cjs` | 441/441 PASS, 0 skipped |
| Wszystkie testy backendu: `node --test supabase/tests/*.test.cjs` | 96/96 PASS, 0 skipped |
| TypeScript: `npx.cmd tsc --noEmit --incremental false` | PASS, exit 0 |
| Android: `node scripts/check-play-readiness.mjs` | PASS, exit 0 |
| Trasy | Test wszystkich literalnych router.push/router.replace do istniejących tras: PASS |
| Migracje, replay nagród, rollback, uprawnienia, GPS w tle | Uwzględnione w powyższych zestawach |

Logi: `artifacts/unified-verification/mobile-full.log`, `backend-final.log`, `typescript.log`, `android.log`. Katalog artifacts jest ignorowany przez Git.

## Granice potwierdzenia i kolejne działania

- Nie zbudowano APK i nie wdrożono zdalnego backendu. Przed testem online trzeba zastosować nowe migracje i odpowiednie funkcje backendu w środowisku testowym.
- Kod może przejść do testowej budowy natywnej. Nie jest to potwierdzenie gotowości publikacji: test GPS na fizycznym Androidzie, wygaszanie ekranu, ograniczenia baterii producenta i ponowne uruchomienie procesu wymagają urządzenia.
- Testy tras i UI potwierdzają lokalną strukturę i zachowanie w harnessach, nie zastępują sprawdzenia każdego ekranu na telefonie ani połączenia z wdrożonym backendem.
- Zachowane rozszerzenia źródłowe nie oznaczają ukończenia każdego pomysłu produktowego. Widoki lokalnego podglądu School Raid/World events, sprzętowe integracje Health/pose oraz kosmetyczne dane zapisane lokalnie nadal wymagają odrębnej weryfikacji lub dalszej implementacji. Nie uznano podglądu za serwerowo potwierdzony wynik.
- Jeśli historyczny wpis Adaptive nie ma zachowanego planu, pozostaje do indywidualnego odzyskania; backend nie zgaduje parametrów nagrody.

## Bezpieczeństwo i stare katalogi

Nie zmieniano `SYSTEM-release`, nie usuwano gałęzi ani katalogów, nie wykonano resetu ani force push. Istniejące kopie bezpieczeństwa zachowano; najnowsza kontynuacja nie modyfikowała ich.

Żadnego starego katalogu nie należy jeszcze usuwać. `node_modules` jest junction do `SYSTEM-integration`, a `supabase/tests/node_modules` do `SYSTEM-CANONICAL`. Przed późniejszym sprzątaniem trzeba zainstalować zależności niezależnie, przeprowadzić test urządzenia/backendu oraz ponownie sprawdzić archiwa. Pozostałe źródła można dopiero wtedy ocenić jako kandydatów do archiwizacji.
