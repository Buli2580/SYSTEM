# SYSTEM — Global Backend 1.0

This slice defines the application-side backend boundary before selecting production vendors.

## Data model
- account/profile
- registered devices
- revisioned cloud save
- analytics event vocabulary
- runtime feature flags
- AI Game Master fallback

## Sync guarantees
Cloud saves carry schemaVersion, revision, deviceId and updatedAt. Server adapters should use optimistic concurrency and reject stale expected revisions. Client conflict resolution prefers revision first, timestamp second.

## Security baseline
Authentication tokens, sponsor administration, AI provider credentials and payment secrets must never be stored in the mobile bundle. Production adapters must enforce authorization server-side. Verification data should be minimized and retained only as long as required.

## Rollout
All network-dependent capabilities default OFF. Concrete adapters can be introduced independently while local gameplay remains usable.
