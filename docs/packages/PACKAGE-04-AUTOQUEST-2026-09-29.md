# Paczka 4 — AutoQuest + Verification

Gałąź `agent/package-04-autoquest-20260929` pozostaje niezależna od lokalnych poprawek GPS. Istniejący `generation/autoQuest.ts` przygotowuje propozycje zgodnie z możliwościami urządzenia i budżetem czasu. `verification/autoQuest.ts` to osobny, ostrożny preflight postępu: nie przyznaje XP, nie omija `validateQuestEvidence` ani `localQuestVerification`. Dla aktywności GPS nie konstruuje dowodu na podstawie samego boolean `activityVerified`.

**Zapisane:** generowanie propozycji, limity do pięciu, filtrowanie wyłączonych aktywności i niedostępnych metod, preflight TIMER/GPS/MULTI, kontrola uprawnień i celu, ochrona przed nieprawidłowymi sygnałami, minimalnym score i fikcyjnym dowodem aktywności. Testy: `autoquest.test.cjs` i `autoquest-preflight.test.cjs`.

**Niezamknięte:** testy nieuruchomione; brak połączenia preflight z `useQuestRun`, brak sprawdzenia GPS na telefonie i zgodności z lokalnym commitem GPS. Bez scalania. Integracja musi zachować natywny background tracking i atomowe ukończenie misji.
