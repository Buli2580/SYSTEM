# REAL WORLD 2.4 — propozycja V2 dla relacji i otworów (NIEWDROŻONA)

Status: **DECISION REQUIRED / BLOCKED**. Nie zmieniono SYSTEM_REAL_WORLD_DATA_V1 ani walidatorów `pipeline.ts`/`tiles.ts`.

## Fakty z V1

`tiles.ts:validateTile` dopuszcza identyfikatory `osm:node:<id>` i `osm:way:<id>`. Feature zawiera `nodeIds` i jedną tablicę `points`; powierzchnia jest jednym zamkniętym pierścieniem. `geometry.ts:ring/triangulate` nie modelują otworów. Ścisłe `onlyKeys` odrzuca nowe pola. `pipeline.ts:validatePacket` rozlicza każdy obiekt jako dokładnie jedną siatkę lub diagnostykę.

Mesh z wieloma pierścieniami dałby się przenieść jako płaskie tablice trójkątów, ale V1 nie ma wiernej tożsamości relacji ani jej źródłowej geometrii. Podstawienie ID zewnętrznej drogi, wymyślonego ID way lub ukrycie otworów w tags oszukałoby znaczenie źródła i deduplikację. Zamiana relacji w zestaw fikcyjnych dróg też nie jest implementacją danych OSM. Nie wykonano takich obejść.

## Propozycja do zatwierdzenia

Nowy, jawny protocolVersion `SYSTEM_REAL_WORLD_DATA_V2`, bez nadpisania V1. Feature:

- źródłowy ID node/way/relation i osobna stabilna tożsamość renderowania części obiektu;
- geometria dyskryminowana Point / LineString / Polygon / MultiPolygon;
- Polygon ma jeden outer i zero lub więcej inner, każdy z referencjami węzłów i punktami; MultiPolygon ma tablicę takich powierzchni;
- zachowanie referencji do relacji i jej ról bez nazywania estymacji danymi pomiarowymi;
- jawna struktura wysokości: całkowita/body/roof i źródło każdego pomiaru albo estymacji;
- limity liczby pierścieni, wierzchołków, głębokości relacji, bajtów i triangulacji; niejednoznaczne role, samoprzecięcia, otwory poza outer i zagnieżdżenia cykliczne odrzucane z diagnostyką;
- ten sam układ WGS84 → lokalny E/U/N, wspólny origin w metadanych sesji i rozliczalne fragmenty/deduplikacja obiektów granicznych.

Ostateczne nazwy pól i schemat wymagają uzgodnienia z parserem C# Cursora; powyższe nie jest nowym formatem produkcyjnym. Dla triangulacji należy wybrać sprawdzony algorytm obsługujący otwory, zweryfikować licencję i dopiero wtedy dodać zależność. Nie instalowano biblioteki ani nie kopiowano kodu obcego pochodzenia.

## Bezpieczna migracja

1. Zatwierdzić semantykę ID, schemat i limity V2 oraz bibliotekę geometrii.
2. Napisać wspólne wektory TS/C#: rozdzielone outer, wiele outer, holes, odwrócone kierunki, brakujące węzły, niepoprawne role, cykle, otwory przecinające obrys, sąsiednie kafelki.
3. Dodać osobny importer/walidator V2 z testami porównania pola i sumy powierzchni trójkątów, bez mutowania poprawnych pakietów V1.
4. Cursor implementuje parser i renderer V2 równolegle z obsługą V1; niezrozumiana wersja ma być odrzucana.
5. Dopiero po rzeczywistych testach wielokafelkowych, offline i ograniczeń na urządzeniu dopuścić V2. Nie przepisywać zapisów graczy ani XP.

## Zachowanie wdrożone w 2.4 bez V2

OSM/XML i źródłowy podgląd zachowują relację z otworem. Importer waliduje referencje i role, raportuje `UNSUPPORTED_RELATION`, `RELATION_REQUIRES_V2`, braki i cykle; nie udaje rekonstrukcji pierścieni. Renderowalne człony powierzchni relacji są konserwatywnie wstrzymywane (`RELATION_MEMBER_WITHHELD`), by nie wypełniać otworu samym outer. Niezależne poprawne cechy nadal eksportują się w V1. To **bezpieczne odrzucenie nieobsługiwanej geometrii**, a nie pełna obsługa multipoligonów. Pełne kryterium 2.4 dla renderowanego otworu pozostaje BLOCKED do zatwierdzenia architektury V2.
