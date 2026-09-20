# Global platform foundation

Provider-neutral boundaries let SYSTEM keep local gameplay stable while production services are added.

Production tracks: account/auth + cloud sync; AI Game Master; health/location/photo verification; analytics + feature flags; social/guild/raid backend; premium entitlements; sponsored challenges; localization and regional configuration.

Rules: keep secrets/model keys server-side; make cloud writes idempotent and revisioned; minimize sensitive verification retention; gate unfinished network features; preserve offline/local gameplay when providers fail.
