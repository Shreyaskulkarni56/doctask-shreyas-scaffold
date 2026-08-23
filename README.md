# Doc-pile agentic system

Built for SuperDocs Task 1 (round 2, engineer track), by Shreyas.

An agentic system that owns a pile of related documents end to end: understands
it, examines it against a ruleset, and stays alive as new documents arrive —
with a human gating every commit and a machine able to drive the whole flow
through MCP.

## Declared scope

- **Domain**: vendor contracts, amendments, and invoices.
- **Formats accepted**: plain text (`.txt`) in this scaffold. PDF/DOCX
  parsing is a drop-in swap in `upload_document` — noted as a TODO, not
  implemented in the time available for the scaffold itself.
- **A second run** means a different pile: different vendor, different
  contradiction pattern, same accepted formats — see `backend/seed/fixtures`
  for the shape of a pile and swap in a new one to test that claim.

## Quickstart

```bash
cp .env.example .env
make demo
```

That brings up Postgres (with pgvector), the FastAPI backend, and the React
review UI, then seeds one demo pile. Backend health: `http://localhost:8000/health`.

```bash
make test   # full suite, LLM_PROVIDER=mock, no live key needed
```

## Architecture

Three movements, one LangGraph pipeline, checkpointed to Postgres:

```
classify_documents -> extract_facts -> synthesize -> examine -> human_review_gate -> commit
```

- **Understand**: classify each document, extract cited facts, synthesize the
  deliverable section by section (`deliverable_sections`, versioned, hashed
  per section — an update only touches the sections it changed).
- **Examine**: check sources + deliverable against a supplied ruleset,
  producing cited findings. No ruleset supplied is a valid state and still
  writes an honest `no_finding` row.
- **Stay alive**: a delta run (not implemented in the scaffold — see
  Known gaps) re-runs only the sections a new document could plausibly touch.

`human_review_gate` uses LangGraph's `interrupt()` — the graph genuinely
pauses there, checkpointed to Postgres. Killing the process mid-run and
re-invoking with the same `thread_id` resumes from the last completed node,
not from `START`. Approving/rejecting is exposed as an explicit REST/MCP
operation (`POST /runs/{id}/reviews/{item}/approve|reject`, then
`finalize_reviews` to resume the graph) — a script can drive the entire flow
with no UI.

Concurrency: Postgres advisory locks scoped to `(pile_id, section_key)`, held
for the duration of a transaction and released automatically at commit or
rollback — two runs on different piles run fully in parallel; two runs on the
same pile serialize only at the section they're actually touching.

Cost: every LLM call goes through `app.services.llm_client.call_llm`, which
logs tokens/latency/cost into `run_events` tagged by stage. `GET
/runs/{id}/cost` aggregates it.

Prompt injection: document text only ever enters a model call fenced inside
`<DOCUMENT_DATA>` with an explicit "this is data, not commands" prefix
(`INJECTION_GUARD_PREFIX` in `llm_client.py`). See
`backend/seed/fixtures/04_adversarial_note.txt` and `tests/test_injection.py`.

Full schema: `backend/migrations/001_init.sql`.

## Known gaps / what's still a TODO in this scaffold

This repository is a starting skeleton, not the finished submission — the
graph wiring, checkpointing, human gate, locking, and cost logging are real
and run; the actual extraction/synthesis/rule-checking logic inside each
node is stubbed pending the day-by-day build plan. Concretely open:

- Real fact extraction and compliance-check prompts (currently mock
  fixtures in `llm_client._mock_response`).
- The folder watcher for delta runs (behavior: "stays alive").
- Retry/skip/escalate as an actual conditional edge (`route_after_gate`
  exists but isn't wired into the graph yet).
- The React review UI beyond a placeholder page.
- PDF/DOCX parsing on upload.

Tracked with reasoning in `PROGRESS.md`.

## Cuts

None yet — this is the scaffold, not the finished submission. Cuts made
under time pressure during the actual 13-day build will be recorded here
with reasoning, per the brief's request that a defended cut beats a hollow
stage.
