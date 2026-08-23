# Progress log

Format: `[date] — assumption or decision — reasoning`

- [x] 2026-08-07 — Domain chosen: vendor contracts + amendments + invoices —
      familiar territory; contradictions between a contract
      and its amendment are easy to fabricate convincingly and easy for a
      reviewer to verify by eye.
- [x] 2026-08-07 — Deliverable versioned per `section_key`, not per document —
      lets an update touch one section and prove the rest is byte-identical
      via `content_hash`, per the brief's "an update should cost like an
      update" requirement.
- [x] 2026-08-07 — Concurrency handled via Postgres advisory locks scoped to
      `(pile_id, section_key)` rather than a queue/Redis — fewer moving
      parts for a stranger to stand up, and the lock releases automatically
      on transaction end so a killed process can't leave it stuck.
- [x] 2026-08-15 — Singleton PostgresSaver checkpointer — Maintains persistent connection across request lifecycles to prevent transaction loss during graph interrupts.
- [x] 2026-08-17 — Synthesis & conflict detection nodes implemented — Diffing facts into versioned sections and recording pending `Conflict` rows.
- [x] 2026-08-17 — Compliance examination & gated commit implemented — Ruleset evaluation producing cited `Finding` rows, applied to deliverable sections upon human review approval.
- [x] 2026-08-17 — Conditional graph routing — `route_after_gate` wired for retry, skip, and continue branches.
- [x] 2026-08-17 — React Review UI dashboard implemented — Interactive stage timeline, pending gate review cards, approval buttons, batch finalizer, and stage cost tracking.
- [x] 2026-08-17 — Task 2.1 Authenticated Agent Walkthrough created in `extensions/authenticated_agent_walkthrough.py`.
- [x] 2026-08-17 — Task 3 real-world use cases documented in `USE_CASES.md`.
- [x] 2026-08-17 — Task 4 submission write-up and architecture diagram created in `WRITEUP.md`.
