# SYSTEM — Agent Guardrails

> Expo version note: Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo-specific code.

This repository is developed by multiple AI-assisted workstreams. Keep `master` stable.

## Worktrees / branches

- Integration: `C:\\Users\\Ja\\SYSTEM` → `master`
- Codex: `C:\\Users\\Ja\\SYSTEM-codex` → `agent/codex`
- OpenCode/local: `C:\\Users\\Ja\\SYSTEM-local` → `agent/local`
- UI/Cline: `C:\\Users\\Ja\\SYSTEM-ui` → `agent/ui`
- Release: `C:\\Users\\Ja\\SYSTEM-release` → `agent/release`

Never do feature work directly on `master`.

## Before editing

1. Run `git status --short`.
2. Confirm the current branch and worktree.
3. Do not use `reset --hard`, `clean -fd`, force-push, or destructive history rewrites.
4. Preserve existing SQLite user data and migrations.
5. Do not install or upgrade dependencies unless the task requires it.

## SYSTEM invariants

- Equal Origin: REAL LEVEL 1, Rank E, XP 0, all seven skills at level 1.
- Skills: STR, VIT, INT, WIL, CHA, CRE, RES.
- Core loop: Quest → Proof → Verify → Reward → REAL XP → Skill XP.
- Missing sensors lower confidence; they do not automatically mean cheating.
- Reward/progression data is server-authoritative when cloud-connected.
- The mobile client must never contain Supabase secret/service-role keys.
- Do not upload raw GPS routes, photos, tokens, secrets, or continuous sensor streams to telemetry.
- Guest/offline mode must remain usable.
- Do not sell REAL LEVEL or REAL XP.

## Scope safety

Do not modify GPS, Quest Engine, Story Engine, reward logic, World, SQLite migrations, or server code unless the assigned task explicitly requires it.

## Required validation

At the end of a code task run:

```powershell
npx.cmd tsc --noEmit --incremental false
node --test src/system2/tests/gameplay.test.cjs
git diff --check
git status --short
```

If a task has additional relevant tests, run them once at the end.

Report:
- files changed
- tests/results
- whether a native rebuild is required
- known blockers or follow-up work

Do not commit unless explicitly requested by the task owner.
