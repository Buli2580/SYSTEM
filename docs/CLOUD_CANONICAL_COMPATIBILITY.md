# Canonical cloud processor compatibility

Migration: 20260920123417_canonical_processor_compatibility.sql. Local only; not deployed.

The server owns 105 generated Daily variants (35 templates, three difficulties) and eight progression bonuses. Catalog values and verification thresholds are checked against mobile definitions. Server level gates remain retryable until prerequisite progression arrives. Generated sets allow three movement quests within the existing three-total-Daily budget; legacy movement limits remain unchanged.

Weekly rewards count accepted direct evidence only. TIMER metadata cannot contribute distance. Verified GPS fractions are retained. Daily dates come from validated quest IDs; other new mobile events carry a bounded local completion day. Older events fall back to their bounded completion timestamp in UTC, then server receive time.

Milestones use consecutive accepted Daily-clear dates. Claim identity is authenticated account plus period/challenge or lifetime threshold, independent of local profile ID and event key. Claims, ledger, XP, skills and summaries retain the existing transaction/savepoint boundary.

The forward migration preserves settled ledger rows and requeues newly recognized UNKNOWN_QUEST events from older processor versions. Boss claims still require trusted server boss completion; client completion flags or reward amounts grant nothing. Existing world/story prerequisite checks remain in force.

Validation: 57/57 local PGlite and mobile-sync tests passed, including migration upgrade, pending claims, replay across local profiles, transient rollback/retry, generated catalog parity, timezone boundary, story and boss claims. No remote database operation was performed.
