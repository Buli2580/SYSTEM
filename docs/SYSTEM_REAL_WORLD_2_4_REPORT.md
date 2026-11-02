# SYSTEM REAL WORLD 2.4 — CITY DATA ENGINE: raport

Data: 2026-11-02. Worktree `C:\SYSTEM\SYSTEM-REAL-WORLD-CODEX`, branch `feature/system-real-world-2`, baza `ac4218b`. **Status: przygotowanie wielokafelkowego V1 wykonane; pełny silnik miasta z relacjami/otworami BLOCKED przez ograniczenie V1.** Nie wdrożono V2. Rzeczywisty regionalny PBF pobrany, lecz import centrum Lęborka BLOCKED przez brak Osmium.

## 1. Faktyczne dane i pochodzenie

Jedna próba GET z limitem 90 s, bez retry, zakończyła się HTTP 200 po około 43 s. Źródło [Geofabrik Pomorskie](https://download.geofabrik.de/europe/poland/pomorskie.html), datowany adres `https://download.geofabrik.de/europe/poland/pomorskie-261101.osm.pbf`. Wcześniejszy HEAD `latest` zwrócił 307 do tego datowanego pliku. Nie wykonywano nieskończonych prób ani pobierania tekstur.

- Lokalny plik: `.cache/real-world-2.4/geofabrik-download/pomorskie-261101.osm.pbf`.
- Rozmiar: **118 349 746 B**.
- Data pozyskania UTC: **2026-11-02T19:34:04.446Z** (czas zakończenia zapisu pliku; nie jest datą ostatniej edycji danych OSM).
- SHA-256: `ef7955c5873faec704278eae14d2565784735444375251005a605cc17ecb24b2`.
- ODbL-1.0, `© OpenStreetMap contributors`; [autorstwo](https://www.openstreetmap.org/copyright), [licencja](https://opendatacommons.org/licenses/odbl/1-0/).
- Dowody: `examples/real-world-2.4-evidence/geofabrik-source.json`, `real-import-status.json`; nagłówki w `.cache/real-world-2.4/geofabrik-download/response-headers.txt`.

Plik pobrano z publicznego HTTPS, obliczono hash pełnej odpowiedzi, zachowano oryginał. Nie porównywano z sumą wydawcy i nie odczytano semantycznie PBF; nazwa datowanego pliku nie dowodzi konkretnego replication timestamp. Status `DOWNLOADED_OSM_PBF_UNVERIFIED` nie jest potwierdzeniem poprawnej mapy Lęborka. Istniejąca kategoria przyjęcia lokalnego pliku `MANUALLY_SUPPLIED_OSM` nie ukrywa sposobu pobrania — metadane zawierają jawne `acquisition`.

`osmium` nie jest dostępne w PATH; sprawdzono też conda/micromamba/mamba/ogr2ogr, bez wyniku. Nie instalowano środowiska. Rzeczywiste wywołanie `prepare-geofabrik.cjs` z nowym PBF i jego metadanymi zwróciło **BLOCKED_OSMIUM_UNAVAILABLE**. Log: `.cache/real-world-2.4/real-import-attempt.log`. Nie ma rzeczywistego wycinka Lęborka, jego SVG, liczby budynków ani pomiarów pakietów miejskich. Nie zastępują ich wyniki fixture. PBF pozostaje w ignorowanym `.cache`, nie w Git.

## 2. Zmiany kodu

- `src/system2/realWorld/osm.ts`: walidacja typów/ról/referencji członów relacji, braki węzłów i członów, iteracyjne wykrywanie cykli/zagnieżdżeń; zachowane `UNSUPPORTED_RELATION`, dodane jawne diagnostyki. Powierzchnie relacji multipolygon/boundary oraz zagnieżdżonych członów nie są fałszywie renderowane jako pełne zewnętrzne way: `RELATION_REQUIRES_V2`, `RELATION_MEMBER_WITHHELD`. Niezależne cechy nadal eksportowane. Obsługa klasyfikacji i zachowania `building:part`.
- `src/system2/realWorld/geometry.ts`: walidacja `roof:height`, jednostek w `building:levels` oraz sprzeczności wysokości. Zachowane źródła height/estymacji i istniejąca płaska geometria dachu. `roof:shape`/`roof:height` są zachowane w tagach, ale nie wprowadzono ich pełnej rekonstrukcji geometrycznej; części budynków nie są scalane w jedną bryłę. Nie nazywamy tego fotorealizmem.
- `src/system2/realWorld/renderSession.ts`: adapter nad istniejącym WorldStream, nie drugi system świata. Szeregowe ładowanie, ostatnie oczekujące żądanie, jeden aktywny LOD, odrębne datasetId LOD, deterministyczna deduplikacja i zwalnianie; walidacja pakietów i budżetów. Nowe centrum może wyprzeć niżej priorytetowe sąsiedztwo także przy limicie jednego pakietu. Snapshoty nie usuwają danych oczekujących na publikację WorldStream.
- Transformacja: WGS84/ECEF przez dotychczasowe `geo.rebase`, pełny obrót lokalnych osi i przesunięcie do wspólnego origin; normalne tylko obracane. Oryginalne pakiety zachowują lokalny origin kafelka i zgodność V1.
- `scripts/real-world/city-fixture.cjs`: deterministyczna syntetyczna geometria, dane gęstości 100/500/1000 i kontrolowana relacja z otworem, bez podszywania się pod OSM Lęborka.
- `build-city-demo.cjs`: eksport czterech LOD, SHA-256, ramy i liczniki; weryfikacja kompletności 9+ kafelków i czterech wariantów, obowiązkowych ID/plików, limitów przed odczytem, braku wyjścia przez symlink poza pakiet i poprawności V1. To walidator opakowania narzędziowego; nie nowy protokół renderera.
- `benchmark-city.cjs`: izolowane procesy Node dla gęstości, pomiary sesji dziewięciu kafelków, LOD i zamknięcia/ponownego otwarcia SQLite.

Nie zmieniano `tiles.ts:validateTile`, `pipeline.ts:RenderPacket/validatePacket` ani formatu V1. Nie edytowano GM2, XP, questów, progresji, migracji, produkcji, Unity/Androida/Gradle/mostu/APK/katalogu Cursora. Nie usuwano i nie nadpisywano starszych pakietów i raportów.

## 3. Relacje i kryteria zakończenia

V1 ma wyłącznie ID node/way i jedną tablicę punktów obrysu; brak tożsamości relacji i inner rings. Sama możliwość przeniesienia dowolnych trójkątów nie rozwiązuje wierności źródłowej cechy i deduplikacji. Nie aliasowano relacji do fikcyjnej drogi, nie ukryto holes w tags i nie zmieniono walidatora pod nazwą V1.

`docs/SYSTEM_REAL_WORLD_V2_RELATIONS_PROPOSAL.md` zawiera gotową do oceny propozycję Polygon/MultiPolygon, ID relacji, limity i plan kompatybilnej migracji. **Wymaga zatwierdzenia; nie jest wdrożona.**

| Kryterium | Stan |
|---|---|
| Wielokafelkowy pakiet, 4 LOD, poprawne V1 | PASS w Node |
| Geometria niezależnych budynków/dróg/ciągów pieszych/parków/placów | PASS dla syntetycznych danych i istniejącego generatora przybliżeń |
| Relacje: referencje, role, cykle, bezpieczne wstrzymanie | PASS |
| Pełna rekonstrukcja multipolygon, otworów i renderowanie | **BLOCKED — V2 wymaga zatwierdzenia** |
| Rzeczywisty regionalny plik | Pobrany; semantyczna walidacja PBF NOT TESTED |
| Wycięcie i walidacja centrum Lęborka | **BLOCKED — Osmium** |
| Unity/C#/Android/rendering/fizyczna pamięć GPU | **NOT TESTED** |

Nie ogłaszamy spełnienia pełnego celu 2.4 dla relacji z otworami ani pełnej gotowości produkcyjnego silnika miasta.

## 4. Pakiet wielokafelkowy

`examples/real-world-2.4-multitile-synthetic/`: **SYNTHETIC**. 9 kafelków z18 × HIGH/MEDIUM/LOW/DISTANT = **36 pakietów V1**. Całość **40 plików / 257 929 B**, w tym 228 889 B pakietów. Pozostałe: `source.osm`, `source-preview.svg`, `.gitattributes`, `manifest.json`.

Eksportuje 14 unikalnych cech: 9 budynków, 3 drogi/ciągi piesze, 1 park i 1 plac. Dwie drogi mają rzeczywisty współdzielony węzeł w syntetycznym OSM; brak domyślania skrzyżowań lub brakujących chodników. Pełne obiekty powtarzają się w przecinanych kafelkach — obiektów nie tnie się na nowe fikcyjne ID, renderer musi deduplikować. Podział deterministyczny; ponowne dwa eksporty porównane poprzez identyczną serializację manifestu i hashe payloadów.

520 trójkątów zapisanych łącznie z powtórzeniami kafelków i LOD; 130 na jeden wariant przed deduplikacją. Liczba nie oznacza unikalnej geometrii sceny. Trzy estymacje wysokości oznaczone `ESTIMATED_HEIGHT_REQUIRED`; źródło zawiera również tagowane height i levels.

Jedna relacja z otworem jest w `source.osm`. `source-preview.svg` pokazuje ją fioletowo z `fill-rule=evenodd` i komunikatem **source only / BLOCKED in V1**. W V1 nie ma dla niej siatki; outer nie jest eksportowane jako fałszywie wypełniona zieleń. W manifestu: `relations.rendering=BLOCKED_V1_RELATION_AND_HOLES`. Źródło i SVG mają hashe. Skopiowanie takiego pakietu do Unity nie dowodzi obsługi otworów.

## 5. Benchmarki — wyłącznie Node desktop

Surowy wynik: `examples/real-world-2.4-evidence/benchmark-node.json`. Node 24.21.0, Intel i5-9300H, pojedyncza próbka na przypadek, brak twierdzeń o p95, FPS lub Unity/Androidzie. Przypadki gęstości uruchamiane w osobnych procesach po przygotowaniu modułu/fixture, z GC przed pomiarem. Inne kontrole mogły obciążać maszynę; nie jest to izolowany benchmark laboratoryjny. Wartości RSS po operacji obejmują proces Node/TypeScript; raw JSON zawiera również heap, RSS przed i lifetime maxRSS, a nie próbkowany szczyt konkretnej operacji.

| Syntetyczne budynki, LOW | Czas kompilacji | Kafelki eksportu | Pakiety JSON | RSS po (MB dziesiętne) |
|---|---:|---:|---:|---:|
| 100 | 119,22 ms | 9 | 573 117 B | 98,43 |
| 500 | 588,62 ms | 9 | 2 213 387 B | 121,52 |
| 1000 | 1070,78 ms | 25 | 4 876 714 B | 124,99 |

1000 budynków nie oznacza 25 aktywnych kafelków — przetwarzanie offline wyeksportowało 25; osobna sesja renderera ma maksymalnie 9. Istniejący limit sumy pakietów compileWorld 16 MB i budżet demonstracyjnego eksportu 32 MB nie były zwiększane dla uzyskania PASS.

| Sesja 9 kafelków, loader w RAM | Czas update | Rezydentny JSON | Miejsca liczbowe siatek ×8 |
|---|---:|---:|---:|
| Pierwszy LOW | 41,40 ms | 58 889 B | 21 840 B |
| LOW → HIGH | 37,16 ms | 59 047 B | 21 840 B |
| HIGH → MEDIUM | 32,27 ms | 59 123 B | 21 840 B |
| MEDIUM → DISTANT | 31,24 ms | 52 298 B | 21 840 B |
| DISTANT → LOW | 28,24 ms | 58 889 B | 21 840 B |

Za każdym razem 9 aktywnych kafelków i 14 deduplikowanych cech/siatek. Inne datasetId benchmarku wyjaśniają niewielką różnicę bajtów względem plików demonstracyjnych. Loader jest pamięciowy, czas nie mierzy sieci/Unity ani renderowania. RSS i heap przed/po każdej zmianie są w raw JSON.

Offline: **9/9 pakietów** identycznych po zamknięciu i ponownym otwarciu osobnej bazy Node SQLite; plik 90 112 B, cały cykl zapisu/otwarcia/odczytu/walidacji **1407,90 ms**, RSS po 129,59 MB. To pomiar łączny obejmujący przygotowanie modułu cache, nie sama latencja odczytu i nie restart procesu Androida. Nie użyto danych graczy.

## 6. Testy i diagnostyka procesu

Nowe pliki: `real-world-city-geometry.test.cjs`, `real-world-render-session.test.cjs`, `real-world-city-export.test.cjs` w `src/system2/tests/`.

Pokrycie: poprawne relacje i holes jako bezpieczna diagnostyka V1; brakujące węzły/role/człony i cykle; niewłaściwe współrzędne/duplikaty; błędne height/levels/roofheight; obiekty i drogi na granicach; wspólne pozycjonowanie WGS84, dedup i zwalnianie; LOD z różnymi datasetId, dispose i najnowsza kolejka; deterministyczność; SHA i uszkodzone/niekompletne manifesty/pakiety; wielkość i logiczne budżety siatek. Nie są to testy triangulacji otworów — tej implementacji nie ma.

Pierwszy pełny przebieg: 661/662 PASS, jeden FAIL w nowym teście deterministyczności. Diagnoza według systematic-debugging: identyczna serializacja, różne prototypy obiektów z osobnych VM; potwierdzono `crossVmPrototypesEqual:false`, `serializedBytesEqual:true`. Test eksportu poprawiono na porównanie JSON i hashy zamiast prototypów. Nie zmieniano wartości eksportu dla dopasowania testu.

Niezależny przegląd wykrył głodzenie nowego centrum przez budżet oraz niepełne sprawdzanie manifestu. Dodano testy RED, priorytetowe planowanie eviction i ścisłą walidację ID/kompletności/limitów, w tym pustego tileId omijającego walidator. Nie pominięto znalezionych problemów.

Końcowa pełna regresja: **PASS 664/664**, `node --test src/system2/tests/*.test.cjs`, w tym wymagane gameplay.test.cjs, 301 713 ms, 0 FAIL/skip. Log `.cache/real-world-2.4/regression-final.log`. Końcowy TypeScript **PASS**, `node node_modules/typescript/bin/tsc --noEmit --incremental false`, kod 0. Po ostatnim uszczelnieniu pustych ID wykonano cały dedykowany zestaw: **PASS 19/19**, 71 262 ms, 0 FAIL/skip, log `.cache/real-world-2.4/targeted-final.log`. Pełne 664/664 poprzedza tę ostatnią korektę CLI/testu; nie jest przedstawiane jako osobny przebieg 665 testów. **PASS git diff --check / git diff --cached --check**. Rzeczywisty `git -c core.autocrlf=true checkout-index` wszystkich plików pakietu do nowego własnego cache: **PASS 36/36 pakietów V1 i 39/39 hashy payloadów** (w tym source OSM/SVG/reguły LF). Manifest stanowi 40. plik, nie ma rekurencyjnego hasha samego siebie. Niezależny reviewer potwierdził zamknięcie trzech znalezionych problemów bez dalszych istotnych uwag; dodatkowo wykonał swój wcześniejszy zestaw 13/13.

## 7. Limity, ryzyka i dalsze decyzje

- Pakiety V1 są zgodne z dotychczasowym walidatorem, lecz część danych relacji jest celowo wstrzymana. To zmiana zachowania importu w stronę bezpiecznego odrzucenia, wymagająca uwzględnienia przez Cursora.
- Otwory, rozdzielone outer, zagnieżdżone powierzchnie, pełne bryły/dachy, części budynku/union i rekonstrukcja skrzyżowań nie są ukończone. Brakujące obiekty nie są wymyślane.
- Wstęgi dróg i mosty o estymowanej wysokości nie są mapą nawierzchni lub modelem terenu. Nie potwierdzono GPS, nawigacji i publicznego dostępu na realnym źródle.
- Budżet UTF-8 i numeric slots nie jest limitem rzeczywistego heap/GPU, obejmuje powtórzenia pakietów, wyklucza część tymczasowych alokacji loadera/walidacji. Snapshoty są pożyczone i nie wolno ich mutować. Loader hosta musi mieć timeout.
- Bezpieczeństwo referencji nie dowodzi pełnego pokrycia przestrzennego ekstraktu. Pozostają ograniczenia seed opartego o węzły opisane w procedurze Geofabrik; duża relacja regionalna może przekroczyć limity lub nie mieścić kompletnych zależności.
- V2, wybór biblioteki triangulacji/licencji i parytet parsera C# wymagają zatwierdzenia projektu. Propozycja jest przygotowana, implementacja wstrzymana.
- Następny krok operacyjny: udostępnić lokalne Osmium i wykonać przygotowane polecenie na pobranym PBF; przejrzeć rzeczywiste SVG/diagnostykę. Następny krok architektoniczny: zatwierdzić albo zmienić propozycję V2. Nie uruchamiać produkcji na podstawie syntetycznego demo.

## 8. Artefakty i przekazanie

Pakiet `examples/real-world-2.4-multitile-synthetic/`; dowody pobrania, blokady i benchmarków `examples/real-world-2.4-evidence/`; PBF i baza SQLite wyłącznie `.cache/real-world-2.4/`. Dokładne komendy, układy współrzędnych i plan dla Cursora: `docs/SYSTEM_REAL_WORLD_2_4_UNITY_HANDOFF.md`. Propozycja V2: `docs/SYSTEM_REAL_WORLD_V2_RELATIONS_PROPOSAL.md`. Plan realizacji: `docs/SYSTEM_REAL_WORLD_2_4_PLAN.md`.

Commity implementacji: `7134db4` (geometria/diagnostyka, renderSession, skrypty i testy) oraz `945f640` (wielokafelkowy SYNTHETIC i dowody rzeczywistego PBF/benchmarków). Niniejszy raport, handoff, plan i niewdrożona propozycja V2 są zapisane osobnym commitem dokumentacyjnym; jego identyfikator pokazuje `git log -1 --oneline`. Stan końcowy worktree weryfikowany po commicie dokumentacji. Wyłącznie branch `feature/system-real-world-2`; bez merge/push. Natywny rebuild nie jest potrzebny dla narzędzi Node i testów; rzeczywista integracja natywna nie została wykonana.
