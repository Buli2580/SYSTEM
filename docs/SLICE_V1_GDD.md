# Slice V1 — Game Design Document (First 10 Minutes)

## Fantasy

SYSTEM wybiera gracza. Nadaje **Rangę E**. Wydaje **Pierwszy Rozkaz**. Wykonanie → nagroda QE → odblokowanie **Bazy** → powód, by wrócić następnego dnia.

Lębork = miasto pilotażowe. Produkt ma działać globalnie.

## 10-minute scenario

| Min | Beat | Player sees |
|-----|------|-------------|
| 0–1 | Wybór | SYSTEM designation (no dashboard) |
| 1–2 | Ranga E | Equal Origin: LVL1, XP0, 7 skills @1 |
| 2–3 | Pierwszy Rozkaz | Jedna misja, jedna instrukcja |
| 3–9 | Wykonanie | GPS ~500 m lokalnie **lub** TIMER 5 min (safe/no GPS) |
| 9–10 | Nagroda + Baza | QE receipt, Znacznik, Baza, teaser „jutro” |

## Dialogs

See `packages/slice-v1/src/content/dialogs.pl.ts` (original PL copy).

## Rewards (QE-aligned)

- REAL XP **100** via `first_movement_v1` (or TIMER safe path XP per catalog)
- **Not** automatic L2 (needs **147** XP) — honest
- +1 development point (slice state; Codex maps to skill allocation if desired)
- Item **Znacznik Przebudzonego** (map to `relic-origin-shard` or new catalog id)
- **Base unlock** after verified first order

## Animations / FX (required)

Order issue → activate → QE-verified burst; Base marker appear. Specs in Unity package.

## Locked / unlocked

| Feature | Locked until |
|---------|----------------|
| Base | First order `REWARDED` after QE claim |
| Daily Orders | Base unlocked |
| World markers (flavor) | Optional; never substitute proof |

## Session end

Copy: SYSTEM czeka na jutrzejszy rozkaz. Streak starts on return — not on app open XP.
