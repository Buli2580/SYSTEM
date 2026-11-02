# SYSTEM REAL WORLD 2.4 — UNITY HANDOFF

2026-11-02. Instrukcja przygotowana, **integracja Unity/Android NIE wykonana**. Nie zmieniono scen, C#, Gradle, mostu, APK ani katalogu Cursora.

## Pakiet i co faktycznie pokazuje

`examples/real-world-2.4-multitile-synthetic/`: **SYNTHETIC**, nie mapa Lęborka. 9 kafelków z18, cztery warianty LOD, 36 poprawnych pakietów SYSTEM_REAL_WORLD_DATA_V1. Źródło ma 9 budynków, dwie drogi ze wspólnym węzłem skrzyżowania, osobny chodnik, park i plac; 14 eksportowanych cech. Człony relacji z otworem są zachowane w `source.osm`, ale nie eksportowane jako nieprawdziwe wypełnienie. Fioletowy otwór w `source-preview.svg` jest **tylko kontrolą źródła**, nie dowodem siatki w V1.

Manifest `SYSTEM_CITY_MULTITILE_DEMO_V1` to opakowanie narzędzia, nie zmiana protokołu renderera. Zawiera globalny origin, macierze ram dla kafelków, liczniki, SHA-256 i diagnostykę relacji. Nie przekazywać manifestu do parsera pakietu V1. `verifyBundle` w `scripts/real-world/build-city-demo.cjs` wymaga co najmniej 9 kafelków, wszystkich czterech LOD, identyfikatorów i plików źródłowych, kontroluje limity przed odczytem oraz hashe i V1. Nie jest podpisem kryptograficznym od niezależnego wydawcy — manifest i dane są zaufaną parą z tego samego repozytorium.

40 plików, 257 929 B łącznie; same pakiety 228 889 B. 520 trójkątów zapisanych łącznie z powtórzeniami kafelków i czterema LOD, nie 520 unikalnych trójkątów sceny. Jeden LOD ma 130 zapisanych trójkątów, przed deduplikacją. HIGH/MEDIUM nadal mają tylko opisy fasad; brak tekstur/fotorealizmu i rozbudowanego dachu.

## 1. Przyjęcie i walidacja bez ingerencji w istniejące zasoby

Cursor wykonuje wszystko w swoim worktree po przeglądzie commitów. Skopiować cały nowy katalog wraz z `.gitattributes` (LF dla JSON/OSM/SVG). Nie nadpisywać pakietów 2.3 i starych scen. Sprawdzić SHA-256 i liczby bajtów; odrzucić brak pliku, nieznaną wersję, pusty ID kafelka, obcy datasetId, niepoprawne indeksy/normalne oraz nadmiarowe pola. Wzorce: `real-world-city-export.test.cjs`, `real-world-integration-ready.test.cjs`, `pipeline.ts:validatePacket`, `tiles.ts:validateTile`. Nie instalowano parsera C# i nie potwierdzono jego zgodności.

## 2. Transformacja WGS84 i wspólny origin

Wierzchołki V1 **pozostają w lokalnej ramie kafelka**. WGS84 `tile.origin` ma szerokość/długość w stopniach, altitude w metrach. Oś x=wschód, y=góra, z=północ; wszystkie wierzchołki w metrach. `manifest.origin` jest wspólną ramą testu.

Dla transformacji `T=manifest.tileTransforms[tileId]`:

```text
scenePosition = T.translation + T.x * local.x + T.y * local.y + T.z * local.z
sceneNormal   =                 T.x * normal.x + T.y * normal.y + T.z * normal.z
```

T.x/T.y/T.z są kolumnami obrotu, nie skalą lub kątami Eulera. Po przeniesieniu do floatów normalną można znormalizować. Pozycje/origin i obliczenia ram utrzymać jako double do momentu lokalnego renderowania. Sama różnica latitude/longitude lub przesunięcie bez obrotu nie jest pełną transformacją WGS84.

Referencja: `renderSession.ts:rendererTransform`, `transformPosition`, `transformNormal`, wykorzystujące `geo.ts:rebase`. Testy sprawdzają wspólny punkt sąsiednich ramek i punkt odległy. Nie modyfikować oryginalnego pakietu tak, aby punkty były w ramie sceny, a origin nadal udawał ramę kafelka. Macierze z manifestu nie są elementem V1 i służą temu konkretnemu testowi.

## 3. Sesja, granice i LOD

Referencyjny adapter przygotowania (TS, bez montowania UI):

```text
new RenderSession(loadPacket(id,lod), {
  maxTiles:9, maxPacketBytes:4000000, maxMeshBytes:4000000,
  maxObjects:100, minUpdateMs:0
}, manifest.origin)
await session.update(manifest.origin, 'LOW', 0)
snapshot = session.snapshot()
session.dispose()
```

Adapter używa dotychczasowego WorldStream. Żądania ładowane są szeregowo, kolejka zachowuje co najwyżej ostatnią aktualizację. Host loadera musi zapewnić timeout/odwołanie I/O — adapter nie przerywa zawieszonego zewnętrznego Promise. Błędy są raportowane w snapshot, nie uznawać częściowego załadowania za 9 kompletnych kafelków.

Deduplikować pełne cechy i siatki po ID w aktywnym zbiorze, deterministycznie wybierając kafelek o najmniejszym ID; zachować jego transformację. Nie przycina się siatek do granicy kafelka: pełny obiekt może być w kilku plikach. Nie rysować go wielokrotnie i nie dodawać wysokości drugi raz. Mapowanie identycznych ID pomiędzy plikami jest kontraktem zaufanego eksportera; nie przeprowadzono niezależnego porównania zgodności geometrii każdego duplikatu.

Ładować jeden LOD naraz. DatasetId różni się pomiędzy LOD celowo; wewnątrz jednego wariantu musi być stały. Testować LOW→HIGH→MEDIUM→DISTANT→LOW, bez pozostawiania obiektów starego wariantu. Przejść do sąsiedniego centrum: nowy centralny kafelek ma priorytet nad zachowanymi sąsiadami także przy budżecie mieszczącym jeden kafelek. Oddalić centrum i sprawdzić zwolnienie starych tile/mesh. Po dispose nie dopuszczać spóźnionych wyników.

Budżet packetBytes to JSON UTF-8 wszystkich rezydentnych pakietów; meshBytes to liczba miejsc liczbowych positions/normals/indices ×8. Obejmuje powtórzenia w plikach, nie tylko deduplikowane siatki. Nie są to gwarancje zużycia heap/GPU; tworzenie JSON/walidacja oraz odbiorca zachowujący snapshot mogą zwiększyć pamięć. Snapshoty zawierają pożyczone referencje i nie wolno ich mutować. Na urządzeniu osobno zmierzyć realne zużycie oraz zwalnianie zasobów.

## 4. Testy do wykonania po stronie Cursora

- EditMode: parser/walidator V1 i hashe, wszystkie 36 pakietów; błędny ID, origin, wersja, indeksy, brakujące pliki i przekroczenie rozmiarów muszą zostać odrzucone.
- PlayMode: 9 kafelków względem wspólnego origin, droga/chodnik na granicach bez duplikatów i szczelin wynikających z niepoprawnej ramy, wspólny węzeł skrzyżowania; normalki/winding i skala budynku.
- Sesja: ruch centrum, zwalnianie, podmiana LOD i scenariusz jednego kafelka budżetu, brak późnej publikacji po dispose.
- Pamięć/CPU/GPU: realne pomiary na urządzeniu; wyniki Node w raporcie nie są FPS Unity/Androida. Nie budować ani nie zastępować istniejącego APK w ramach tego przekazania.

Wszystkie powyższe wyniki Unity/C# pozostają **NOT TESTED**. Drobne powierzchnie dróg są wstęgami; istniejący generator nie modeluje pełnych powierzchni skrzyżowań, krawężników, terenu ani połączeń dachu. Nie wywnioskowano brakujących chodników z samego tagu sidewalk, nie dodawano nieistniejących ulic.

## 5. Rzeczywiste dane i blokada V2

Regionalny PBF został pobrany: `.cache/real-world-2.4/geofabrik-download/pomorskie-261101.osm.pbf`. Metadane/hash: `examples/real-world-2.4-evidence/geofabrik-source.json`. Nie dodano binarnego PBF do Git. Rzeczywista próba konwersji zwróciła `BLOCKED_OSMIUM_UNAVAILABLE`. Po udostępnieniu lokalnego programu:

```powershell
Set-Location C:\SYSTEM\SYSTEM-REAL-WORLD-CODEX
node scripts/real-world/prepare-geofabrik.cjs .cache/real-world-2.4/geofabrik-download/pomorskie-261101.osm.pbf examples/real-world-2.4-evidence/geofabrik-source.json .cache/real-world-2.4/real-import-with-osmium C:\Tools\osmium\osmium.exe
```

Ścieżka programu jest przykładem, nie stwierdzeniem instalacji. Cała procedura, limity i bramka referencji: `docs/SYSTEM_GEOFABRIK_POMORSKIE_IMPORT.md`. Nadal wymagana weryfikacja obrysów, ulic, chodników i parków w rzeczywistym SVG; nie ma dziś potwierdzonego wycinka Lęborka ani jego pomiarów wydajności.

Pełna relacja z otworem nie mieści się wiernie w cechach V1. `docs/SYSTEM_REAL_WORLD_V2_RELATIONS_PROPOSAL.md` to **niewdrożona propozycja wymagająca zatwierdzenia**. Nie przełączać parsera samowolnie, nie aliasować relacji do wymyślonych way IDs i nie ukrywać otworu płaskim wypełnieniem. Ten pakiet potwierdza działające wielokafelkowe przygotowanie V1 i bezpieczne pomijanie nieobsługiwanej powierzchni, a nie pełny silnik miasta z relacjami.
