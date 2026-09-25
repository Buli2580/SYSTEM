# SYSTEM 2.0 architecture

UI → application/use cases → domain → repository contracts → SQLite adapter.

## Current completion path

SystemProvider keeps calling storage/database.completeVerifiedQuest (compatibility facade). It delegates to application/completeQuest, which depends only on domain functions, a VerificationProvider and a CompletionUnitOfWork. No React or SQLite imports exist in the use case.

1. Copy incoming evidence and verify outside the write lock. Local provider reuses the existing GPS/TIMER/MULTI validator/classifier. REJECTED, PENDING and UNAVAILABLE return without opening a write transaction.
2. Enter the existing serialized exclusive SQLite transaction; acquire a write lock before any reads.
3. Bind the canonical operation to the current player and quest instance. Return DUPLICATE if already applied, even if a Daily has since expired.
4. Resolve current availability using existing prerequisites/capabilities and transaction-derived Daily/Boss state. This happens after verification to avoid a stale pre-verification access decision.
5. Read the fresh player (availability reconciliation may apply existing chapter rules), calculate completion through core/questEngine, claim the unique completion, apply existing Story/Daily/Weekly/Boss effects, save player and append VerifiedEvent.
6. Build the existing snapshot/receipt inside that transaction; return only after commit. Any failure rolls back claim, player, related rewards and event. SQLite uniqueness remains authoritative across connections.

## Focused contracts

- PlayerRepository: read/save the existing profile. Progression lives in this profile; a separate ProgressionRepository would duplicate ownership.
- QuestRepository: catalog lookup, availability, atomic completion claim. Catalog definitions are not mutable persisted rows. List screens keep their existing catalog/Daily projections; no generic CRUD is invented.
- EventRepository: append and existence check, with unique event IDs.
- IdempotencyRepository: find an applied canonical completion operation.
- CompletionUnitOfWork: commit/rollback boundary, exposing transaction-bound repositories and CompletionEffects. Effects compose existing SQL-backed protocol/story rules; these are not falsely presented as storage-independent yet.

SQLite implementation is storage/completionRepositories plus wiring in database.ts. It uses the supplied transaction handle exclusively. The database module still owns queue/connection, initialization, snapshots and existing World/identity operations. UI, schema v5 and saved data are unchanged.

## Identity and offline-first preparation

CompletionOperation distinguishes kind, operation key, player ID, local quest-instance ID and VerifiedEvent ID. Canonical key is quest-completion:<encoded playerId>:<encoded questId>; Daily IDs already include the day. Callers may send that key; foreign/mismatched keys are rejected, not treated as a new reward. Keys are intentionally not arbitrary request UUIDs.

APPLIED and appliedAt are projected from the existing unique quest_completions row and completed_at. Marker and event commit atomically, so no new journal/table/migration is necessary for local replay protection. Existing completed quests are recognized immediately. PENDING verification is ephemeral and never an applied completion. Event createdAt remains in VerifiedEvent; no raw GPS route or extra private evidence is recorded.

This database contains one player. Event IDs remain the existing quest_<instance> format; future transport must namespace them by player ID. A reset/new player has a different operation identity. There is no sync/outbox, account identity mapping, remote acknowledgement or server trust implementation in this change.

## Availability and verification

quests/availability is a reusable pure projection: LOCKED/AVAILABLE/ACTIVE/COMPLETED/FAILED plus code/canComplete. Existing prerequisites and capabilities are reused. Daily eligibility includes current assigned IDs and clock anomaly; Boss access comes from WORLD LINK and persisted stage state. Weekly is an automatic bonus, not a separately runnable quest. World/Story unlock rules continue in their existing storage participants.

An active/failed attempt can be supplied as context; failed history is not a permanent quest lock. The current compatibility access API keeps offering retry. Attempt identity/terminal validation still happens transactionally in completeStoryActivity.

VerificationProvider<E> has canHandle/verify; its result is VERIFIED with typed evidence, or REJECTED/PENDING/UNAVAILABLE with reason/code, provider ID and checkedAt. Only local-gps-timer-v1 is implemented. The domain revalidates accepted current evidence before rewards as a defense against a mistaken provider. A new method requires an actual provider, evidence validation and a deliberate domain extension; merely returning VERIFIED cannot bypass today's rules.

## Future integrations (not implemented)

- Cloud Sync: consume stable player/quest/event/operation identities; specify account mapping, journal/outbox and authoritative conflict policy first. Incoming network data must not directly invoke profile saves.
- AI Game Master/achievements/sponsors/guilds: propose validated domain commands or consume committed events; never mutate XP inside UI or bypass transaction/idempotency rules.
- Health/photo/QR/NFC/workout verification: implement typed providers with explicit provenance/trust policy. Remote work belongs outside SQLite locks; availability and unique claims must be rechecked when committing. No fake providers or external APIs are added.

## Validation

The complete existing regression suite is retained, with new use-case/provider/availability/idempotency tests. Real Node SQLite integration tests cover concurrent completion, restart/replay and rollback. Native Android behavior still requires device QA. The two pre-existing CSS declaration errors are unrelated to this layer.

Final checks: 200/200 tests PASS (186 retained + 14 new), zero skipped; git diff --check PASS. Full TypeScript reports only the same baseline TS2307 animated-icon.module.css and TS2882 global.css declaration errors, with no new errors. No UI, dependency or schema changes.
