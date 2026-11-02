# SYSTEM REAL WORLD 2.3 — Geofabrik Pomorskie: procedura lokalna

Stan 2026-11-02: **realny import BLOCKED** (brak pliku oraz brak `osmium` w PATH). Nie pobierano PBF i nie instalowano zależności. Sprawdzono oficjalną stronę regionu i dokumentację poleceń, nie wykonano konwersji rzeczywistego PBF. Poniższa procedura jest przygotowana, lecz wymaga potwierdzenia na realnym pliku.

## 1. Źródło i narzędzia

Pobrać ręcznie `pomorskie-latest.osm.pbf` z [oficjalnej strony Geofabrik dla Pomorskiego](https://download.geofabrik.de/europe/poland/pomorskie.html). Użyć zwykłego bieżącego pliku danych, nie historii `.osh.pbf`, zmian `.osc` ani SHP. Zachować datę rzeczywistego pobrania UTC, datę stanu danych podaną na stronie (oddzielna informacja), adres i ewentualną sumę kontrolną wydawcy. Nie wpisywać daty importu jako daty pozyskania. Nazwa `latest` jest zmienna; lokalny SHA-256 identyfikuje konkretny egzemplarz, lecz nie uwierzytelnia jego wydawcy.

Źródło deklarowane w metadanych: `https://download.geofabrik.de/europe/poland/pomorskie-latest.osm.pbf`. Dane OSM: ODbL-1.0, wymagane `© OpenStreetMap contributors`; dołączyć [link do autorstwa](https://www.openstreetmap.org/copyright) i [licencji](https://opendatacommons.org/licenses/odbl/1-0/). Publiczne ekstrakty Geofabrik usuwają wybrane dane osobowe autorów edycji — nie korzystać z wewnętrznych ekstraktów z pełnymi metadanymi. Przy dystrybucji wynikowej bazy ocenić również obowiązki ODbL dotyczące baz pochodnych; sam podpis na ekranie nie zastępuje licencji.

Wymagane lokalnie: Node z `node:sqlite` (tu testowano 24.21.0), istniejące zależności repozytorium i narzędzie `osmium`. [Oficjalna strona Osmium](https://osmcode.org/osmium-tool/) wskazuje dystrybucje, w tym Windows przez conda-forge. Instalacja nie jest częścią tego zadania; nie zmieniać globalnego środowiska bez potrzeby. Skrypt przyjmuje ścieżkę do już dostępnego pliku wykonywalnego jako ostatni argument. Nie obsługuje tekstu polecenia shell ani wrappera `.cmd`; przekazać rzeczywisty program wykonywalny z kompletnym środowiskiem bibliotek.

```powershell
osmium --version
node --version
```

Brak programu to **BLOCKED**, nie PASS. Operacje mogą wielokrotnie czytać cały PBF i potrzebować znacznej pamięci oraz przestrzeni dyskowej. Nie konwertować całego Pomorskiego do XML w importerze Node.

## 2. Metadane i wywołanie

Własny worktree, bez edycji katalogu Cursora:

```powershell
Set-Location C:\SYSTEM\SYSTEM-REAL-WORLD-CODEX
New-Item -ItemType Directory .cache/real-world-2.3 -Force | Out-Null
Copy-Item examples/real-world-2.3-geofabrik/source-metadata.template.json .cache/pomorskie-source.json
$m = Get-Content .cache/pomorskie-source.json -Raw | ConvertFrom-Json
$m.sha256 = (Get-FileHash C:\Users\Ja\Downloads\pomorskie-latest.osm.pbf -Algorithm SHA256).Hash.ToLowerInvariant()
```

Ustawić `$m.retrievedAt` na **faktyczną datę pobrania w UTC**, np. format `YYYY-MM-DDTHH:mm:ssZ`. Placeholder jest celowo niepoprawny; nie wpisywać przykładowej daty. Następnie:

```powershell
$m | ConvertTo-Json -Depth 10 | Set-Content .cache/pomorskie-source.json -Encoding utf8
node scripts/real-world/prepare-geofabrik.cjs C:\Users\Ja\Downloads\pomorskie-latest.osm.pbf .cache/pomorskie-source.json .cache/real-world-2.3/lebork-geofabrik-1
```

Opcjonalnie ścieżka programu, bez dopisywania argumentów do tej wartości:

```powershell
node scripts/real-world/prepare-geofabrik.cjs C:\Users\Ja\Downloads\pomorskie-latest.osm.pbf .cache/pomorskie-source.json .cache/real-world-2.3/lebork-geofabrik-2 C:\Tools\osmium\osmium.exe
```

Ostatni katalog wyjściowy musi być nowy i mieścić się w tym worktree. Brak nadpisywania, kasowania i automatycznych pobrań. Przy błędzie po rozpoczęciu wycinania pozostają pliki diagnostyczne/częściowe; ponowić do nowego katalogu. Nie traktować częściowego katalogu jako pakietu.

## 3. Co skrypt wykonuje

Polecenia uruchamiane bez shell, bez `--overwrite`, każde musi zwrócić 0:

```text
osmium extract --bbox=17.74,54.535,17.76,54.545 --strategy=smart -S types=any INPUT -o seed.osm.pbf
osmium getid INPUT -I seed.osm.pbf -r -o complete.osm.pbf
osmium check-refs -r complete.osm.pbf
osmium cat complete.osm.pbf -o lebork.osm
```

Nazwy wyjść w praktyce są pełnymi ścieżkami we wskazanym katalogu. Buforowany seed jest większy niż docelowy pilot. Strategia `smart` rozszerzona o `types=any` uwzględnia różne typy relacji; nie gwarantuje pełnego pokrycia przestrzennego. `getid -r` dobiera wymagane elementy rekurencyjnie z **oryginalnego PBF**, a nie z niepełnego seed. `check-refs -r` sprawdza również relacje. Podstawa: oficjalne instrukcje [extract](https://docs.osmcode.org/osmium/latest/osmium-extract.html), [getid](https://docs.osmcode.org/osmium/latest/osmium-getid.html), [check-refs](https://docs.osmcode.org/osmium/latest/osmium-check-refs.html). Samo wycięcie lub kontrola bez `-r` nie wystarcza.

Wyjście XML przechodzi `import-local.cjs`: dokładny ROI `[17.74612,54.53775,17.75388,54.54225]` w kolejności west/south/east/north, około 500 × 500 m. Zachowywane są kompletne drogi i domknięcie referencji/rodziców relacji; nie przycina się wierzchołków, nie zmienia ID. Następuje istniejący pipeline budynki/drogi/kafelki/4 LOD/SQLite/SVG. Powstaje łańcuch SHA-256 oryginalnego PBF → XML → wycinek. Raport zewnętrzny zawiera wersję Osmium, czasy poleceń i wynik kontroli referencji.

Oryginalny ekstrakt regionalny może sam nie zawierać członów relacji wychodzących poza region. W takim przypadku polecenia muszą zakończyć się błędem — nie ignorować brakujących obiektów ani nie kasować relacji dla uzyskania PASS. Domknięcie dużych granic/tras może być bardzo duże; XML ponad 64 MB lub wycinek ponad 2 MB/20 tys. obiektów zostaną odrzucone. Zewnętrzny Osmium może zapisać duży plik przed tym sprawdzeniem; zaplanować wolne miejsce. Nie zwiększać limitów automatycznie.

**Istotna granica pokrycia:** wycinanie Osmium wybiera obiekty na podstawie węzłów. Wielki obszar obejmujący cały seed lub odcinek przecinający go bez węzłów w seed może nie wejść do wyniku. Bufor ogranicza ryzyko, ale go nie dowodzi. Późniejszy crop nie odtworzy obiektu, którego nie ma w XML. Kontrola referencji dowodzi wyłącznie kompletności wybranych zależności. Wymagany przegląd mapy i porównanie ze źródłem; `spatialCoverage` pozostaje `NOT_VERIFIED`.

## 4. Kryteria rzeczywistego testu

Wymagane łącznie: `geofabrik-result.json`, `import/import-result.json`, `import/bundle/manifest.json`; poprawne hashe i źródło; `referenceCheck: PASS`; pełne liczby obiektów, diagnostyka, czasy i rozmiary z faktycznego przebiegu; przegląd `import/bundle/control-preview.svg`; `offline-result.json` po ponownym otwarciu Node SQLite. Nie zastępuje to testu restartu aplikacji Android.

Dane ręcznie dostarczone nadal mają status `MANUAL_OSM_UNVERIFIED`. Nie wprowadzać nowej flagi REAL na podstawie samej nazwy pliku. Należy osobno zweryfikować obrysy, ulice, ciągi piesze i zieleń; brak tagów nie jest potwierdzeniem ich nieistnienia. Relacje pozostają w XML, ale istniejący renderer ich nie rekonstruuje: bramka `REVIEW_REQUIRED_RELATIONS_NOT_RENDERED` nie może być pominięta. Bez pliku rzeczywiste SVG/liczby/czasy/rozmiar i cała konwersja PBF są **BLOCKED**.
