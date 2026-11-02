# REAL WORLD 2.4 — plan wykonania

Worktree C:\SYSTEM\SYSTEM-REAL-WORLD-CODEX, branch feature/system-real-world-2, baza ac4218b. Zakres zgodny z załącznikiem użytkownika; bez Unity/Android/APK/GM2/XP/migracji/merge/push.

1. Jednorazowo sprawdzić oficjalny Geofabrik, lokalne pliki i Osmium. Brak środowiska rzeczywistego importu = BLOCKED; bez ponawianych pobrań i instalacji.
2. Audyt V1: Feature.id dopuszcza tylko osm:node/way, points to jeden pierścień; relacje/otwory wymagają rozszerzenia. Zachować V1, zaproponować V2 bez wdrożenia; sprawdzać relacje i bezpiecznie wstrzymywać błędne lub nieobsługiwane wypełnienia. Pełne renderowanie relacji pozostaje BLOCKED.
3. Geometria: walidacja relacji/referencji, building:part i roof:height; bez wymyślania obiektów i fotorealistycznych obietnic. Osobne pliki testów.
4. Adapter renderSession oparty na WorldStream i geo: wspólny origin/obrót ram, 9 kafelków, dedup, jeden LOD, ograniczone ładowanie i budżety, bez zmiany pakietów V1.
5. Skrypty city-fixture.cjs, build-city-demo.cjs, benchmark-city.cjs: deterministyczny syntetyczny obszar co najmniej 9 kafelków × 4 LOD, raw OSM z relacją/otworem, V1-pakiety z jawną diagnostyką braku renderowania relacji, SVG z otworem jako kontrola źródła, manifest SHA-256 i limity. Poprzednich pakietów nie nadpisywać.
6. Bench 100/500/1000 budynków oraz 9 aktywnych kafelków/LOD/offline SQLite. Pomiar Node czasu, rozmiaru i pamięci, bez twierdzeń o Unity/Android. Wynik ponad budżetem = jawny błąd, bez zmiany limitów dla PASS.
7. Testy RED/GREEN, przegląd współpracy, pełna regresja i TypeScript; raport i handoff z kryteriami spełnionymi i BLOCKED. Małe commity tylko we własnym worktree.
