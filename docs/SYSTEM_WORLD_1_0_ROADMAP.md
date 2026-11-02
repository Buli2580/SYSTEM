# SYSTEM WORLD 1.0 — roadmapa bezpiecznej kontynuacji

Data: 2026-11-02 (Europe/Warsaw). Baza: `C:\SYSTEM\SYSTEM-RC2`, `prep/rc3-visual-reconstruction`, `afcf9be361755cb56e43e8acf16561af4927bc91`. Dokument jest **propozycją produkcji do zatwierdzenia**, nie zgodą na implementację, zmianę brancha, podpisu lub produkcyjnej bazy. Dowody i pełna inwentaryzacja: `docs/SYSTEM_FULL_AUDIT.md`.

## Cel i granice WORLD 1.0

Pełnoekranowa prywatna domena 3D na Androidzie: postać TPS, kamera z kolizją, joystick/look/interact, Idle/Walk/Run, czytelne misje i HUD, interaktywne lokalizacje, widoczny wpływ istniejącego progresu, AI GM z offline fallback, XP/statystyki/gear z kanonicznego zapisu, kontrolowane audio/VFX i profile jakości.

Proponowany pierwszy scope: jedna domena, jeden legalny rigged avatar, proste dojścia do COMMAND/ACADEMY/VAULT, odczyt Domain level i loadoutu, start/resume istniejącej misji przez host i powrót do nagrody bez duplikatów. FORGE/SANCTUARY pozostają LOCKED do osobnego projektu. Nie zakładać w 1.0 otwartego świata multiplayer, aktywnej walki TPS, NPC konwersacyjnych bez limitu, Shadow Rival, craftingu, płatnej ekonomii ani wyznaczania REAL XP za chodzenie avatarem. Włączenie tych elementów jest zmianą scope wymagającą decyzji.

## Kierunek architektoniczny

**Rekomendacja: obecny RN/Expo jako host + Unity URP jako pełnoekranowy moduł WORLD.** Three zachować jako referencję i wariant porównawczy. Bez przepisywania rdzenia do C# na początku.

- Host zachowuje `SystemProvider`, use case completion, SQLite, outbox, konta, sensory, powiadomienia, privacy i aktualne ekrany. Cloud pozostaje autorytetem dla zdalnych rozliczeń, ale reconciliation wymaga domknięcia.
- Unity posiada scenę, kamerę, lokomocję, wizualne attachmenty, HUD i prezentację zdarzeń. Nie nalicza REAL XP, nie zapisuje gameplay bezpośrednio do SQLite i nie otrzymuje sekretów.
- Nowy mostek: wersjonowane snapshot/directives/receipt, niewielkie komendy, ACK dopiero po commit, profile generation/revision, timeout, idempotencja i odrzucanie spóźnionych odpowiedzi. To praca do wykonania; obecne TypeScript read models nie są gotowym transportem native.
- Pozycja w domenie 3D jest odrębna od realnego GPS/MapLibre. Real-life misja korzysta z istniejącej weryfikacji. Backend/AI nie mogą otrzymać surowych tras, zdjęć lub ciągłego strumienia sensorów przez renderer/telemetrię.
- Nie wywoływać JS/bridge co frame. Audio i AppState mają jednego koordynatora, by nie grały równolegle dwie sceny audio i nie pozostawały sensory/render loop po zamknięciu WORLD.

## Etapy i kryteria przejścia

| Etap | Konkretny rezultat | Kryterium wyjścia / zależności |
|---|---|---|
| **0 — Zatwierdzenie i zabezpieczenie baseline** | decyzje scope/silnik/urządzenia, mapa właścicieli danych, kopia zapisu i źródeł z kontrolą hash, runbook rollback, CI dla dokładnego SHA | zachowany branch i podpis; odtwarzalny baseline 589 app/scripts + 105 backend + 31 lab; ustalona autoryzacja przyszłego release; żadnych zmian produkcji |
| **1 — Kontrakty i bramki danych/AI** | polityka guest/account/offline/cloud restore, reconciliation i receipt; zgoda/age policy AI, quota/body/deadline; staging provisioning/deletion/export plan | brak drugiej progresji; testy konflikt/retry/change-account; AI bez opt-in nie wysyła kontekstu; brak nieograniczonego kosztu; remote writes wyłącznie osobno zatwierdzone staging |
| **2 — Pipeline postaci i porównywalny benchmark** | legalny rigged avatar + Idle/Walk/Run, minimalny Unity URP projekt testowy oraz ten sam układ świata/asset/preset co Three | rig/deformacje/licencja/import potwierdzone; fizyczny Android, porównywalne pomiary i jawne NOT TESTED; brak deklaracji przewagi bez danych |
| **3 — Spike integracji RN ↔ Unity** | eksport unityLibrary, kontrolowany pełnoekranowy launch/return, snapshot read-only, jedna bezpieczna komenda przez host | brak utraty SQLite/XP; restart/rotate/back/background/profile change i błędy bridge obsłużone; AppState/FGS/audio/RAM zmierzone; nie jest jeszcze produkcyjny świat |
| **4 — TPS vertical slice** | kamera z kolizją, dotyk i multi-touch, lokomocja, Idle/Walk/Run blend, interakcja w promieniu, pause/resume i safe UI | powtarzalna trasa na urządzeniu, zero zablokowań kamery/joysticka; crossfade/deformacje bez widocznych błędów; krótkie device recording i regresja |
| **5 — Living Domain i kanoniczny HUD** | stan istniejącej domeny odwzorowany na scenę, COMMAND/ACADEMY/VAULT, misje/XP/statystyki/gear z snapshot | wizyta/interakcja nie daje nagrody; Domain level zgodny z canonical completions; equip mapuje realny instance; powrót do RN bez starych danych |
| **6 — Misje, Game Loop i AI GM w świecie** | quest start/resume, recovery, receipt/reward presentation, GM directives/atmosfera, offline fallback | end-to-end Quest → Proof → Verify → Reward i restart/replay; AI/Unity nigdy nie nalicza XP; cofnięta zgoda i brak sieci nie blokują gry |
| **7 — Art/audio/VFX i optymalizacja** | legalny content, URP material conversion, LOD/compression, light/shadow budgets, finite cinematic, koordynowane busy audio, LOW/MEDIUM/HIGH | device CPU/GPU/RAM/thermal/size/startup evidence; LOW/reduce-motion i kontrast HUD; bez zwiększania efektów kosztem stabilności |
| **8 — Zamknięta beta Android** | podpisany exact-SHA build z pełną bramką testów, upgrade istniejącego zapisu, aktualny staging backend, multi-account/device QA | żadnej utraty danych/duplikatów reward; GPS screen-lock/process-kill/reconnect; rollback ćwiczony; security/AI/deletion/export zamknięte dla wydawanego scope |
| **9 — Release readiness WORLD 1.0** | zatwierdzony AAB/store pipeline, privacy/deletion/data safety i manualne wyniki urządzeń | jawne GO właściciela; brak blockerów P1; dopiero osobno zatwierdzone produkcyjne migracje/wydanie |

Etapów nie wyceniono w godzinach ani datach: brak pomiaru czasu pracy i brak proof bridge. Po etapach 2–3 należy przygotować estymację na podstawie faktycznego kosztu portu/lifecycle i liczby zaakceptowanych zasobów. Naprawy bezpieczeństwa mogą toczyć się niezależnie od grafiki, lecz nie zwalniają z bramek wydania.

## Benchmark i warunki decyzji o silniku

Użyć `C:\SYSTEM\THREE-LAB\docs\ENGINE-BENCHMARK-SCORECARD.md`, `UNITY-WORLD-MANIFEST.md` i `UNITY-GAMEPLAY-CONTRACT.md`. Dwa oddzielne porównania: **engine parity** na tej samej geometrii/fallbacku i **art upgrade** na tym samym nowym avatarze/assetach. Lepszego modelu nie zaliczać jako zalety silnika.

Zatwierdzić 3 fizyczne urządzenia z dolnej/średniej/docelowej półki, OS/GPU/RAM/API, orientację, faktyczną rozdzielczość wewnętrzną, jakość, VSync/limit FPS i tryb builda. Porównywać Unity release z Three production na tym samym telefonie; oznaczyć browser versus WebView. Desktop nie zastępuje Androida.

Proponowana bramka startowa (do zatwierdzenia, nie wynik audytu): stabilny profil **30 FPS** na najniższym wspieranym urządzeniu, p95 frame time ≤40 ms przy zdefiniowanej trasie; 60 FPS jako opcjonalny profil wyższy. Co najmniej 3 przebiegi po warmup oraz **20 minut** ciągłej sesji termicznej. Raportować p50/p95 CPU/GPU frame times, FPS/1% low, render resolution, draw calls, process/native/managed/GPU memory osobno, thermal/battery i crashy. Budżet pamięci/rozmiaru ustalić po baseline obu runtime, nie wymyślać go przed pomiarem.

Sprawdzić cold/warm startup do first-frame/ready oddzielnie od końca intro; wielokrotne wejście/wyjście WORLD, back, system permission dialog, background, lock, proces killed, resume, audio focus, zerwanie bridge i zmianę konta. Nie porównywać JS heap z całym Unity RAM ani JS gzip z pełnym APK. Zachować raw evidence i exact SHA/versions.

**Decyzja po benchmarku:** jeśli RN+Unity spełnia bramki i zachowuje dane — rozwijać hybrydę. Jeśli dwa runtime przekraczają zaakceptowany budżet/lifecycle jest niestabilny — zatrzymać rollout i ocenić Three/WebView albo odrębnego klienta Unity na podstawie tych samych kryteriów. Unity-only wymaga osobnej estymacji portu sensorów/zapisu/auth; nie jest automatycznym fallbackiem i nie usuwa obecnego klienta.

## Pierwsze 10 zadań programistycznych — proponowana kolejność

Każde zadanie zaczyna się dopiero po zatwierdzeniu etapu. Zadania 1–6 można odbierać bez budowania nowego świata; nie wolno czekać z bramkami danych/AI do końca produkcji.

| # | Zadanie i punkt wejścia | Warunek odbioru |
|---:|---|---|
| **1** | Ujednolicić wymaganą bramkę CI exact-SHA dla przyszłych branchy WORLD/release (`.github/workflows`, `official-apk.cjs`), zachowując allowlistę i istniejący podpis | typecheck + app/scripts + backend muszą przejść przed podpisaniem; test awarii blokuje publikację; brak automatycznej autoryzacji prep |
| **2** | Zdefiniować wersjonowany kontrakt danych host/renderer i politykę offline/cloud restore; oprzeć na `repositories/contracts.ts`, read models, completion receipts i `cloud/sync.ts` | jedno źródło zapisu per stan, opis utraty urządzenia i konfliktów; command replay/stale profile nie daje XP; testy kontraktu przed bridge |
| **3** | Podłączyć zgodę AI i egzekwowanie polityki wieku do daily/story (`privacy/consent.ts`, `ai/runtime.ts`, `ai/story.ts`, Edge) | brak kontekstu wysyłanego bez opt-in; revoke odcina request; offline GM działa; serwer nie ufa tylko polu player klienta |
| **4** | Dodać serwerowe quota/rate limits/body limit/deadline/provider cancel oraz ograniczenie kontekstu GM (`supabase/functions/ai-game-master`) | testy guest/account quota, oversized input, timeout i provider failure; fallback; logi bez sekretów i treści prywatnych |
| **5** | Wydzielić odtwarzalny test clean-room staging migracji/restore i contract tests cloud reconciliation | baseline jest jawny i odtwarzalny; replay/rollback/device switch/profile binding; bez production migrations; jawne rozróżnienie local versus accepted cloud |
| **6** | Dostarczyć legalny pilot avatara: rig/weights + Idle/Walk/Run + LOD/PBR/import checks; użyć CHARACTER-FACTORY tylko po potwierdzeniu praw | licencja/proweniencja, deformacje, skala, skeleton/klipy i asset hashes sprawdzone; model nie jest tylko unrigged MIXAMO_READY |
| **7** | Utworzyć izolowany Unity URP benchmark z przypiętą zatwierdzoną wersją, kontrolerem TPS i sceną parity z manifestu THREE-LAB | powtarzalny Android release test; te same assets/rozdzielczość/preset i trasa; zapis pomiarów, nie deklaracja lepszych FPS |
| **8** | Zbudować minimalny native bridge RN ↔ unityLibrary: launch/return + snapshot + command ACK, bez migracji zapisu | zero drugiej bazy/nagród; restart/back/background/change-account/lost ACK; poprawny cleanup/audio/FGS; pełna istniejąca regresja |
| **9** | Dopracować multi-touch TPS/kamerę/animacje/interakcje i odwzorować Domain COMMAND/ACADEMY/VAULT na realne host actions | dotyk nie koliduje z UI; LOW/reduce-motion; zachowanie istniejącego loadoutu/domeny; Forge/Sanctuary nadal jawnie LOCKED |
| **10** | Zintegrować pierwszy kanoniczny end-to-end quest w 3D HUD: start/resume → host verification → committed receipt → loot/XP/GM reaction | duplikat/restart/offline/reconnect nie daje drugiego XP ani loot; fizyczny Android i nagranie flow; porównanie stanu SQLite przed/po |

Deletion/export, bezpieczeństwo legacy API i rejestr licencji audio/map są obowiązkowymi zadaniami etapu 1/8 przed publikacją nawet jeśli nie zajmują osobnej pozycji w pierwszej dziesiątce. Jeśli planowane jest wcześniejsze wydanie AI/account, ich realizacja przesuwa się przed to wydanie.

## Odbiór i ochrona dotychczasowej pracy

Każda zmiana progresji: testy kanonicznych ID, Equal Origin, transakcji, rollback, idempotencji, plikowego restartu, durable reward cursor i zgodności katalogów local/server. Każda zmiana native: osobny rebuild/device QA, nie sam TypeScript. Każda zmiana SQL: staging, forward migration, bezpieczeństwo uprawnień i plan rollback/naprawy, bez przepisywania historii. Każda zmiana art: źródło/licencja/hash i porównanie visual bez nadpisania masterów.

Chronić wszystkie dotychczasowe dane, migracje, branche/worktree, nadrzędne repo `.git`, podpis/applicationId, manifesty i historyczne APK, cinematic `system_boot.mp4`, oryginały RC3 i CHARACTER-FACTORY oraz testy. Nie uruchamiać reset-project, clean, hard reset ani odinstalowania aplikacji jako skrótu. Pełna lista w raporcie audytu §13.

## Decyzje wymagające zatwierdzenia

1. Kierunek RN + Unity URP i budżet ograniczonego benchmarku; wersja LTS i uprawnienia licencyjne Unity sprawdzone przed instalacją.
2. Minimalny scope 1.0, urządzenia/OS, portrait versus landscape, wymagany FPS i budżety pamięci/pakietu/thermal po pomiarze.
3. Autorytet offline/cloud, przywracanie zapisu, konflikt/reconciliation i tożsamość gracza; rozdzielenie REAL XP od ruchu w świecie.
4. Avatar, licencja assetów/animacji/audio/map i możliwość zewnętrznego riggingu.
5. Polityka AI dla guest/małoletnich, zgody/retencja i limity kosztów.
6. Branch wydania, obowiązkowe CI, istniejący podpis, AAB/Play i strategia rollback. Obecny prep pozostaje bez zmiany w tym zadaniu.
7. Osobny staging, zakres online beta oraz późniejsze, jawne zatwierdzenie operacji produkcyjnych.

**Najbliższe działanie:** zatwierdzić etap 0 i kontrakt etapu 1 na podstawie raportu, a następnie zlecić ograniczone zadania 1–2. Ten audyt nie uruchamia produkcji ani implementacji roadmapy.
