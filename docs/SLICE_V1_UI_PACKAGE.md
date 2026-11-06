# Slice V1 — UI / Presentation Package

**Code:** `packages/slice-v1/src/presentation/shell.ts`  
**Copy:** `packages/slice-v1/src/content/dialogs.pl.ts`

## Surfaces

| Surface | Intent |
|---------|--------|
| GRA | Narrative HUD: one order, one objective, progress |
| MISJE | RPG journal entries (no technical codes first) |
| BOHATER | Rank E, level, 4 readable stats, starter item |
| MIASTO | Discoveries + pilot city note — no fake shop coords |
| AKCJA | Context button from slice state |
| BAZA | Locked/unlocked screens |

## Rules

- Do **not** overwrite EX12 RN screens in this package.
- Do **not** fix HOME overlap (Codex).
- Keep debug diagnostics separate from production copy.
- Status: presentation models = **REAL** code; host wiring = **NOT WIRED**.
