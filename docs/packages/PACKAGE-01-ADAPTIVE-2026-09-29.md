# SYSTEM — Paczka 1 / Adaptive Life Engine

Gałąź: `agent/package-01-adaptive-20260929`. Bazuje na zdalnym `integration/system-evening-build` (`d0241df`), bez lokalnych poprawek GPS `0930988`. Nie scalać przed uzgodnieniem baz.

**Stan:** 41/50 pozycji ma implementację lub potwierdzenie źródłowe; 9/50 wymaga uruchomienia testów, integracji i sprawdzenia na urządzeniu. Pozycje źródłowe oznaczają istnienie kodu, a nie udowodnione działanie. Testów nie uruchomiono.

01. [x] Zidentyfikować istniejący silnik adaptacyjny
02. [x] Zidentyfikować model użytkownika
03. [x] Zidentyfikować zapis modelu w SQLite
04. [x] Zidentyfikować historię rezultatów
05. [x] Zidentyfikować NORMAL
06. [x] Zidentyfikować BUSY
07. [x] Zidentyfikować TRAVEL
08. [x] Zidentyfikować RECOVERY
09. [x] Zidentyfikować VACATION
10. [x] Zidentyfikować dostępny czas
11. [x] Zidentyfikować plan dzienny
12. [x] Zidentyfikować plan tygodniowy
13. [x] Zidentyfikować trudność bossa
14. [x] Zidentyfikować readiness
15. [x] Zidentyfikować effort
16. [x] Zidentyfikować suggestedState
17. [x] Zidentyfikować deduplikację rezultatów
18. [x] Zidentyfikować preferencje typów
19. [x] Zidentyfikować próg przeciążenia
20. [x] Zidentyfikować łagodny powrót
21. [x] Ograniczyć dzienny budżet BUSY
22. [x] Ograniczyć dzienny budżet TRAVEL
23. [x] Ograniczyć dzienny budżet RECOVERY
24. [x] Ograniczyć dzienny budżet VACATION
25. [x] Zachować NORMAL bez regresji
26. [x] Uwzględnić krótszy dostępny czas
27. [x] Nie podnosić specjalnego dnia przy dobrej serii
28. [x] Zachować obniżanie obciążenia po porażkach
29. [x] Zachować jeden quest po długiej przerwie
30. [x] Wyjaśnić ograniczenie budżetu w powodach planu
31. [x] Dodać test pięciu trybów dnia
32. [x] Dodać test ograniczonego czasu
33. [x] Dodać test zwykłego dnia
34. [x] Dodać test tygodniowego celu w trybach specjalnych
35. [x] Dodać test wzrostu przy dobrej serii
36. [x] Dodać test ograniczenia wzrostu przez czas
37. [x] Dodać test przeciążenia
38. [x] Dodać test dolnego limitu RECOVERY
39. [x] Dodać test powrotu po siedmiu dniach
40. [x] Dodać test zdarzeń z przyszłości
41. [x] Dodać test błędnego budżetu czasu
42. [ ] Uruchomić testy adaptacyjne na docelowym SHA
43. [ ] Uruchomić pełne testy gameplayu na docelowym SHA
44. [ ] Uruchomić TypeScript na docelowym SHA
45. [ ] Sprawdzić migrację istniejących modeli
46. [ ] Sprawdzić aktualizację UI po zmianie trybu
47. [ ] Sprawdzić plan po restarcie aplikacji
48. [ ] Sprawdzić offline na urządzeniu
49. [ ] Sprawdzić konflikt z lokalnym commitem GPS
50. [ ] Zatwierdzić scalanie dopiero po synchronizacji

Zmiana zachowuje istniejący kontrakt `Plan` i zapis `UserModel` (bez migracji schematu). Limity czasu: NORMAL 240, BUSY 24, TRAVEL 36, RECOVERY 12, VACATION 24 minut; limity są górną granicą dla deklarowanego czasu, a nie obietnicą dokładnego czasu trwania questów. W trybach specjalnych aktualny baseline wynosi jeden quest. Dopasowanie realnej długości pojedynczych questów do budżetu pozostaje zadaniem do integracji z generatorem questów.
