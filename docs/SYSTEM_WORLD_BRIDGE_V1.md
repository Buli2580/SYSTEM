# SYSTEM_WORLD_BRIDGE_V1

Status: **implemented as an isolated contract/host controller and experimental Unity/native transport**. It is not mounted in RC3 `SystemProvider`; no new completion, XP, loot, ledger or Supabase handler is connected. Runtime RN ↔ Unity on Android remains separately gated by the FOUNDATION report.

## Authority and transport

React Native owns profile, quests, verification, REAL XP, inventory, SQLite and cloud synchronization. Unity owns rendering, local avatar locomotion, camera and UI presentation. Virtual avatar movement is not real GPS evidence. AI output is narrative/directive input, never a reward authorization.

TS source: `src/system2/worldBridge/{protocol,host,sqlJournal,snapshot}.ts`. C# implementation lives in `C:\SYSTEM\SYSTEM-UNITY-WORLD\Assets\_SYSTEM\Bridge` and the tracked source mirror `experiments/world-foundation/unity`. Android transport is `experiments/world-foundation/android`, using `SystemWorldBridge.Receive` and `com.system.worldfoundation.WorldBridge`. The native transport's envelope checks are defense in depth; full codec validation and command authorization are still mandatory on both endpoints.

## Envelope

All messages are UTF-8 JSON, maximum **16384 bytes**; nesting maximum 32. Unknown properties/types/versions, duplicate decoded JSON keys, invalid Unicode, numeric ranges and malformed timestamps are rejected. `protocolVersion` is the literal `SYSTEM_WORLD_BRIDGE_V1`, not a guessed numeric version. JSON property order is immaterial. Dates must round-trip as UTC `yyyy-MM-ddTHH:mm:ss.fffZ`. Integers are bounded by 2147483647 for C# parity. IDs use `[A-Za-z0-9_.:-]{1,96}`.

```json
{
  "protocolVersion":"SYSTEM_WORLD_BRIDGE_V1",
  "type":"WORLD_COMMAND",
  "messageId":"msg:123",
  "timestamp":"2026-11-02T12:00:00.000Z",
  "playerId":"player:1",
  "profileGeneration":1,
  "sessionId":"session:1",
  "stateRevision":4,
  "payload":{
    "commandId":"command:1",
    "expectedRevision":4,
    "activeSessionId":"session:1",
    "action":"OPEN_PANEL",
    "panel":"QUESTS"
  }
}
```

This is a synthetic schema example, not user data or a recorded Android message. `playerId/profileGeneration/sessionId` bind the active host session. Host controls revision and must call `updateRevision` when its canonical snapshot changes. Recreate/dispose host ownership on account changes; never reuse a previous account's in-flight callbacks.

## Message payloads

| Type | Direction | Exact payload |
|---|---|---|
| WORLD_INIT | RN → Unity | `hostBuildSha`: 40 lowercase hex; `quality`: LOW/MEDIUM/HIGH |
| WORLD_SNAPSHOT | RN → Unity | `displayName` ≤80 UTF16 units; `realLevel` ≥1; `realXp` ≥0; `skills` exactly STR/VIT/INT/WIL/CHA/CRE/RES levels ≥1; `equippedItemIds` ≤12 unique IDs; `domainLevel` ≥1; `activeQuestId`: ID or null |
| WORLD_DIRECTIVE | RN → Unity | `mode`: NORMAL/RECOVERY/VICTORY/THREAT; `message` ≤240 UTF16 units |
| WORLD_COMMAND | Unity → RN | `commandId`, `expectedRevision`, `activeSessionId`, `action`, and only the action's required extra field |
| WORLD_COMMAND_ACK | RN → Unity | `commandId`, `result:"APPLIED"` |
| WORLD_COMMAND_REJECT | RN → Unity | `commandId`, `code` from the rejection list |
| WORLD_PAUSE | RN → Unity | `reason`: USER/BACKGROUND/ACCOUNT_CHANGE/TIMEOUT |
| WORLD_RESUME | RN → Unity | same reason enum |
| WORLD_DISPOSE | RN → Unity | same reason enum |

Command allowlist: REQUEST_SNAPSHOT (no extra fields), OPEN_PANEL (`panel`: QUESTS/CHARACTER/INVENTORY), SET_QUALITY (`quality`: LOW/MEDIUM/HIGH). **No COMPLETE_QUEST, GRANT_XP, EQUIP, reward amount, raw GPS, photo, secret or arbitrary URL command exists.** Adding another action requires a new reviewed schema and authority/use-case tests; it must not bypass `application/completeQuest.ts`.

Reject codes: INVALID_MESSAGE, STALE_SESSION, STALE_REVISION, REPLAY_CONFLICT, IN_DOUBT, TIMEOUT, HOST_ERROR, DISPOSED, PAUSED. Invalid JSON cannot provide a trusted commandId; host uses the sentinel `invalid`. Do not use error text to display raw payloads or secrets.

## Host lifecycle and durability

`createWorldHost(options)` accepts a durable journal, identity, current revision, clock, timeout (default 10s) and an allowlisted executor. Commands must be within ±5 minutes of host time and match identity/session/revision. Old envelope/session mismatch is rejected before any effect. Pausing invalidates earlier in-flight work; resume does not make its callbacks current again. Dispose is terminal.

The executor receives `(command, isCurrent)` and must check `isCurrent()` immediately before a delayed effect. It resolves **APPLIED only after the actual allowed action commits**, or CANCELLED when no effect was committed. Silent successful completion after skipping a cancelled effect is not an applied receipt. Exceptions are HOST_ERROR. Changing revision invalidates an awaited effect; the executor must cooperate with cancellation. No controller can roll back a side effect that an incorrectly written executor committed after ignoring this guard.

Journal identity includes player, generation, session and commandId; the semantic fingerprint includes action parameters, not incoming JSON key order or transport messageId. Atomic durable PENDING claim precedes execution. Same command/payload while pending returns IN_DOUBT; changed payload returns REPLAY_CONFLICT. APPLIED replay returns ACK when admitted against current session/revision and never executes again. ACK is emitted only after executor APPLIED **and** durable completion write. Timeout does not authorize retry; late committed work can update its journal but cannot produce a stale ACK.

`openWorldCommandJournal(openDatabaseAsync)` explicitly opens **system-world-bridge-v1.db**, with its own `world_command_journal` table and exclusive transaction claims. It never opens/migrates the existing gameplay database. No journal is opened merely by importing the module; RC3 behavior is unchanged. Preserve unresolved PENDING entries after crashes/timeouts. No automatic pruning or reset is provided. A future operational reconciliation/retention policy must be reviewed before sustained deployment; storage growth is a known limitation.

On process restart, a restored valid journal prevents old effects from reexecuting. Native recreation requires fresh init from the current RN owner, not a cached player snapshot. New sessions reject previous-session commands; the journal does not authorize reusing a command as a new intent. Canonical reward idempotency would still need the existing player+quest operation key if reward actions are ever proposed; FOUNDATION does not expose them.

`selectWorldSnapshot` copies a whitelist from actual canonical profile/domain/equipped items. It excludes birthDate, avatar photo path, raw location, token, history and telemetry. An uninitialized domain, domain playerId mismatch or invalid canonical values fail closed rather than fabricate progress. The host must wait for existing onboarding/domain readiness before projecting a real profile. It is a projection, not cloud hydration or a new save system.

## Integration sequence

1. In the experimental host, establish a fresh identity/session, durable journal and canonical snapshot; register native listeners with cleanup.
2. Validate/encode WORLD_INIT, launch the separate Unity activity, wait for real receiver readiness. Native launch resolution is not a rendered-frame ACK.
3. Send WORLD_SNAPSHOT and directives only on meaningful state/event changes. Unity controls locomotion locally; there is no frame-by-frame bridge.
4. Decode Unity commands as UNITY_TO_HOST; route through `host.receive`. Execute only the allowlisted UI/quality actions after `isCurrent()` validation. Send encoded ACK/reject back through native send.
5. On app-state transitions send explicit lifecycle messages. On account switch dispose the old host/native session before sending new init. Coordinate audio focus/render cleanup with RN.
6. Verify back/return, ten entry/exit cycles, background/foreground, lock/unlock, process restart and account change on a physical phone. Do not install by uninstalling RC3.

The integration sequence is a required wiring contract, **not a claim that production RC3 is wired**. The isolated Expo fixture now copies `host.ts` as well as `protocol.ts` and ACKs only `REQUEST_SNAPSHOT`, `OPEN_PANEL` and `SET_QUALITY` through `createWorldHost`. Host fixture/scratch Gradle work and actual runtime results are listed in `SYSTEM_WORLD_FOUNDATION_REPORT.md`.

## Verification

`node --test src/system2/tests/world-bridge.test.cjs` exercises actual TS codec/controller with real Node SQLite for journal/restart boundaries: round-trip, nine message kinds, invalid fields/version/direction/size, duplicate JSON, Unicode/depth, concurrent duplicate, replay conflict, stale account/session/revision, durable ACK ordering/failure, timeout/restart, cancellation and snapshot privacy. RED→GREEN evidence is retained at `E:\SYSTEM\.tmp\system-world-foundation`.

SQLite tests use a Node adapter, not native Expo SQLite on Android. C# EditMode/PlayMode results and portable fixture verification must be read from the final report; TypeScript PASS does not prove C# parity, JNI transport, native rendering, physical GPS, battery or save preservation on a phone. These boundaries remain explicitly gated.
