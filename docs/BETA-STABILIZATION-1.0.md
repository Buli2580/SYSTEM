# Beta Stabilization 1.0

Gałąź: `integration/system-evening-build`. Stan wejściowy: czysty Git,
`edef3d358618bf76ad4ce7e75f61892b4e797f14`, z obecną paczką Visual Assets 1.0.

## Przyczyny zgłoszonych błędów

Oba testy przechodzą bez normalizacji (2/2), a cały zestaw Supabase bez niej
przeszedł 96/96. Błędy odtworzono przez zastosowanie normalizatora używanego
w `.github/workflows/system-ci.yml`, bez zapisywania zmian do processor.test.cjs.
Przed poprawką oba wskazane testy po normalizacji zawiodły.

1. **legacy qualified clears…**: normalizator zmienił roszczenie tygodniowe
   z `2026-W38` na `2026-W39`, ale pozostawił początek 30-dniowego ciągu
   `Date.UTC(2026,7,22+n)`. Ledger kończył się 20 września (W38), więc SQL
   `private.sync_progression_eligible` nie znajdował serii kończącej się w W39.
   Wynik roszczenia: `RECEIVED`, zamiast oczekiwanego `PROCESSED`.
   Warunek SQL dla weekly_streak_keeper (`n>=7` i właściwy tydzień ISO) jest poprawny.
2. **local Monday attribution…**: timestamp niedzielny zmieniał się
   z `2026-09-20T22:30:00Z` na `2026-09-27T22:30:00Z`, ale completed_day
   pozostawał `2026-09-21`, podobnie jak identyfikatory poniedziałkowych Daily
   i ich tydzień. Różnica wynosiła sześć dni. SQL procesora odrzuca completed_day
   oddalony o więcej niż jeden dzień od timestampu: wynik `REJECTED` był prawidłowy.

## Poprawka

Normalizator przesuwa cały zestaw o wspólną liczbę pełnych tygodni względem
ostatniej niedzieli UTC: piątek–niedzielę, następny poniedziałek, timestamp,
oba tygodnie ISO oraz początek legacy streak. Zamiana jest jednoprzebiegowa,
więc W38 → W39 nie przechodzi omyłkowo ponownie w W40. Testy obejmują poniedziałek,
środek tygodnia, przełom roku ISO oraz niezmieniony tydzień bazowy.

Nie zmieniono asercji processor.test.cjs, funkcji SQL, migracji, katalogu nagród,
kontroli uprawnień ani ochrony przed podwójnym XP i fałszywymi datami.
Nie wykryto regresji wymagającej zmian ekranów lub grafik.

## Zmienione pliki

- `supabase/tests/normalize-calendar-fixtures.cjs`
- `supabase/tests/calendar-fixtures.test.cjs`
- `supabase/tests/package.json` — dołączenie testów normalizatora do npm test
- `docs/BETA-STABILIZATION-1.0.md`

## Rzeczywiste wyniki kontroli

- TypeScript: `npx.cmd tsc --noEmit --incremental false` — exit 0.
- Grafiki, pochodzenie APK i gameplay: 321/321, zero błędów i pominięć.
- Supabase przed normalizacją: 96/96.
- Dwa zgłoszone testy po starej normalizacji: 0/2; po poprawce: 2/2.
- Pełny zestaw z poprawioną normalizacją i nowymi testami: 100/100, exit 0.
  Znormalizowany processor uruchomiono z pamięci, z oryginalnym katalogiem
  modułu, fixture SQL i wszystkimi migracjami; plik processor.test.cjs pozostał niezmieniony.
- Nowe testy kalendarza: 4/4.
- `git diff --check` — exit 0.

Testy SQL wykonano lokalnie w PGlite 0.5.8. Nie testowano wdrożonej instancji
Supabase, nie wykonywano migracji zdalnych ani natywnego buildu Android/APK.
Nie ma lokalnej blokady testów. Kontrola wizualna na telefonie opisana w raporcie
Visual Integration pozostaje osobnym zadaniem.
