# Working with this repo

- State lives in Postgres, not memory. Every LangGraph node writes through
  `db` and logs a `run_events` row — if you add a node, follow that pattern
  so cost tracking and the changelog stay accurate for free.
- Document text only ever reaches an LLM call through
  `app.services.llm_client.call_llm(document_text=...)`. Never f-string raw
  document content into a prompt by hand — that's the one rule that keeps
  behavior 8 (no orders from documents) true everywhere, not just in one node.
- Tests run with `LLM_PROVIDER=mock` and no live key. Keep it that way;
  wire the real Anthropic call behind the same `call_llm` signature so
  swapping providers never touches node code.
- Log every assumption in PROGRESS.md as you make it, not at the end —
  half the value is the timestamp showing it was a real-time call, not a
  post-hoc justification.
