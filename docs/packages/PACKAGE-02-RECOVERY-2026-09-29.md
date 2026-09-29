# SYSTEM — Paczka 2 / Recovery + Ember + Consistency

Gałąź: `agent/package-02-recovery-20260929`. **Osobny, czysty moduł obliczeniowy**, bez podłączenia do ekranu, SQLite, XP lub istniejącego streaku. PR bazuje na zdalnym `integration/system-evening-build`, bez lokalnego commitu GPS.

**43/50 pozycji zaimplementowano w kodzie lub zapisano jako testy; 7/50 wymaga uruchomienia, integracji lub sprawdzenia na urządzeniu.** Zapisanie testu nie oznacza, że test przeszedł. Wskaźnik Ember jest propozycją projekcji regularności, nie nową walutą ani nagrodą.

**Kontrakt dat:** obliczenia grupują zdarzenia po dacie UTC z ISO timestampu; parametr `today` musi być zgodną datą UTC. Przed użyciem w UI należy ustalić lokalną strefę dnia gracza, aby nie przestawiać streaku o północy.

01. [x] Ustalić zasady bez kar za przerwę
02. [x] Zdefiniować NEW
03. [x] Zdefiniować ACTIVE
04. [x] Zdefiniować REBUILD
05. [x] Zdefiniować GENTLE_RETURN
06. [x] Oddzielić wskaźnik Ember od XP
07. [x] Nie mutować istniejącego streaku
08. [x] Liczyć aktywne dni w 7 dniach
09. [x] Liczyć aktywne dni w 30 dniach
10. [x] Deduplikować kilka questów dziennie
11. [x] Uznawać ukończenie za aktywność
12. [x] Uznawać recovery za aktywność
13. [x] Nie uznawać porażki za aktywność
14. [x] Nie uznawać reroll za aktywność
15. [x] Nie uznawać częściowego wyniku za pełny dzień
16. [x] Ignorować przyszłe zdarzenia
17. [x] Ignorować błędne daty zdarzeń
18. [x] Obsłużyć nowego gracza
19. [x] Obsłużyć jeden opuszczony dzień
20. [x] Obsłużyć dwa opuszczone dni
21. [x] Obsłużyć długą przerwę
22. [x] Wyznaczać missedDays
23. [x] Zwracać brak missedDays dla nowego gracza
24. [x] Wyznaczać consistency7
25. [x] Wyznaczać consistency30
26. [x] Wyznaczać Ember 0–100
27. [x] Ograniczyć sugestię NEW do 1 misji
28. [x] Ograniczyć sugestię GENTLE_RETURN do 1 misji
29. [x] Ograniczyć sugestię REBUILD do 2 misji
30. [x] Zachować ACTIVE 3 misje jako wskazówkę
31. [x] Dodać komunikat NEW
32. [x] Dodać komunikat ACTIVE
33. [x] Dodać komunikat REBUILD
34. [x] Dodać komunikat GENTLE_RETURN
35. [x] Dodać test nowego gracza
36. [x] Dodać test jednego opuszczonego dnia
37. [x] Dodać test powrotu po dwóch dniach
38. [x] Dodać test długiej przerwy
39. [x] Dodać test deduplikacji
40. [x] Dodać test ignorowania błędnych wyników
41. [x] Dodać test RECOVERY
42. [x] Dodać test pełnych 30 dni
43. [x] Dodać test nieprawidłowej daty
44. [ ] Uruchomić testy w CI
45. [ ] Sprawdzić TypeScript na SHA PR
46. [ ] Uzgodnić lokalną strefę czasową i UTC
47. [ ] Zintegrować z bazą danych i aktualnym streakiem
48. [ ] Podłączyć do Home/Quest UI
49. [ ] Zweryfikować restart i offline na Androidzie
50. [ ] Scalić po synchronizacji GPS
