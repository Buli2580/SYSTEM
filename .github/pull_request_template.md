## SYSTEM change

### What changed
<!-- Briefly describe the change. -->

### Scope
- [ ] Mobile UI
- [ ] Gameplay / progression
- [ ] Cloud / Supabase
- [ ] World / GPS
- [ ] Release / build
- [ ] Tests / tooling
- [ ] Docs only

### Safety checks
- [ ] No secret/service-role keys committed
- [ ] Guest/offline mode still works
- [ ] No raw GPS routes/photos/tokens added to telemetry
- [ ] No unintended SQLite reset/migration
- [ ] Server-authoritative rewards/progression preserved

### Validation
- [ ] `npx tsc --noEmit --incremental false`
- [ ] `node --test src/system2/tests/gameplay.test.cjs`
- [ ] `git diff --check`

### Native rebuild
- [ ] Required
- [ ] Not required

### Notes / QA
<!-- Device checks, migration notes, screenshots, blockers. -->
