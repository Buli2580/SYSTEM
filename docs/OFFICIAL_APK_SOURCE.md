# Oficjalne źródło APK

Jedyna gałąź: `integration/system-evening-build` w `Buli2580/SYSTEM`.
Workflow: `.github/workflows/official-apk.yml`, uruchamiany po pushu lub ręcznie na tej gałęzi.
Lokalnie: `node scripts/official-apk.cjs --sha <pełny SHA zatwierdzonego commitu>`.

## Co zostało ustalone

- Przed naprawą lokalny katalog unified-final miał commit `b3d197758a0ae68f0a84741944f9c88267c64c9e`, czysty Git i origin wskazujący archiwum, nie GitHub.
- Zdalna gałąź evening-build miała `08b9d1d0b5fdf3162df83612dfd7fffa1bb51a3b`; nie obejmowała ostatniego scalenia. Nowy commit zachowuje obie historie i najnowszą aplikację.
- Udany sprawdzony workflow APK: https://github.com/Buli2580/SYSTEM/actions/runs/35434360780 — `master`, SHA `59938ec75255d73532d93c4b09e4082f27754b29`.
- Ostatni sprawdzony nightly: https://github.com/Buli2580/SYSTEM/actions/runs/35642819982 — `feature/beta-experience-2.0`, SHA `7996a32eb8dab3602b9705adf9a5b9c383e7e2a0`, failure.
- Stary workflow nightly kopiował pierwszy pasujący APK ze wspólnego incoming, nadpisywał SYSTEM-latest.apk i budował debug APK. Nie dawał pewności, że instalowany plik odpowiada najnowszej aplikacji.
- Stary skrypt EAS wysyłał bieżący lokalny katalog bez blokady gałęzi. Nie był buildem automatycznie związanym z gałęzią GitHuba.
- W sprawdzonej konfiguracji nie było adresu Expo Updates ani kanału OTA; expo-updates nie jest bezpośrednią zależnością. Nie ma dowodu, że OTA było przyczyną problemu. Oficjalna konfiguracja jawnie wyłącza OTA.
- ADB nie wykazał podłączonego telefonu. Nie potwierdzono pochodzenia APK zainstalowanego na telefonie.

## Zabezpieczenia

Skrypt wymaga czystej wskazanej gałęzi i pełnego oczekiwanego SHA. W CI sprawdza repozytorium, ref zdarzenia i SHA checkoutu. Buduje świeże `git archive` konkretnego commitu w odrębnym katalogu, instaluje zależności z lockfile i tworzy release APK z osadzonym bundle JS.

Gałąź, commit, UTC czas buildu, wersja i versionCode pochodzą z procesu i trafiają do Expo Constants. Są zawsze widoczne w Więcej → ABOUT / ŹRÓDŁO APLIKACJI.

Przed publikacją skrypt wyodrębnia `assets/app.config` z APK i porównuje diagnostykę ze źródłowym manifestem, sprawdza obecność JS, natywną nazwę pakietu i wersję oraz certyfikat podpisu. Publikuje tylko zweryfikowany plik o nazwie z SHA i unikalnym identyfikatorem wykonania, z JSON i SHA256. Kopiowanie używa COPYFILE_EXCL: istniejący APK nie jest nadpisywany. Nie ma SYSTEM-latest.apk ani skanowania wspólnego incoming.

Bezpośrednie EAS jest odrzucane przez app.config.js. Dawne workflow w tej gałęzi kończą się jawnym komunikatem o wycofaniu. Ich zdalne identyfikatory należy wyłączyć na poziomie GitHub Actions, aby również starsze gałęzie nie uruchamiały dawnych definicji.

## Podpis i dane

Pakiet nadal `pl.systemworld.app`; brak zmian SQLite, resetu lub odinstalowania. Konieczny jest dotychczasowy klucz aplikacji i SHA256 jego certyfikatu. Nie generujemy klucza zastępczego. VersionCode rośnie na podstawie czasu buildu i istniejącej konfiguracji.

CI wymaga sekretów: `SYSTEM_ANDROID_KEYSTORE_BASE64`, `SYSTEM_ANDROID_KEY_ALIAS`, `SYSTEM_ANDROID_STORE_PASSWORD`, `SYSTEM_ANDROID_KEY_PASSWORD`, `SYSTEM_ANDROID_CERT_SHA256`.
Lokalnie zamiast BASE64 używa `SYSTEM_ANDROID_KEYSTORE` wskazującego istniejący plik; pozostałe nazwy są zmiennymi środowiskowymi.

Na tej maszynie nie udostępniono podpisu ani jego potwierdzonego certyfikatu. Bez nich bezpieczna budowa aktualizacji jest blokowana przed pobieraniem zależności. Nie wolno odinstalowywać aplikacji, żeby ominąć niezgodność podpisu.

Artefakty nowego procesu: `dist/official/<pełny-SHA>-<run-id>/SYSTEM-<wersja>-<SHA12>-<run-id>.apk` oraz `.json` i `.sha256`. Katalog tworzony dopiero po pomyślnej weryfikacji.
