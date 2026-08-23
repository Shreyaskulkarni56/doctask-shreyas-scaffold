"""
Behavior 2: "Kill the process in the middle of a run and start it again.
It continues from where it left off, and no finished work is lost."

Strategy: run the graph with a thread_id, but stop after the first node
completes (LangGraph supports `interrupt_after` for exactly this in tests).
Assert:
  - run_events shows classify_documents' stage_end exactly once (not lost,
    not re-run when we resume).
  - resuming with the same thread_id reaches human_review_gate and pauses
    there (not restarted from START).
"""
import uuid

from app.db.models import Document, Pile, Run, RunEvent
from app.graph.build_graph import build_graph, run_config


def test_kill_and_resume_does_not_duplicate_or_lose_work(db):
    pile = Pile(name="test pile", domain="vendor_contracts")
    db.add(pile)
    db.commit()

    doc = Document(pile_id=pile.id, source_path="contract_a.txt", content_hash="abc123", raw_text="Payment due in 30 days.")
    db.add(doc)
    db.commit()

    thread_id = str(uuid.uuid4())
    run = Run(pile_id=pile.id, run_type="full_ingest", checkpoint_thread_id=thread_id)
    db.add(run)
    db.commit()

    graph = build_graph(db)
    initial_state = {
        "run_id": str(run.id),
        "pile_id": str(pile.id),
        "run_type": "full_ingest",
        "pending_document_ids": [str(doc.id)],
    }

    # Simulate a kill right after the first stage by only compiling with
    # interrupt_after for this test invocation.
    graph.invoke(
        initial_state,
        config={**run_config(thread_id), "interrupt_after": ["classify_documents"]},
    )

    stage_end_count = (
        db.query(RunEvent)
        .filter_by(run_id=str(run.id), stage="classify_documents", event_type="stage_end")
        .count()
    )
    assert stage_end_count == 1, "classify_documents should have completed exactly once before the kill"

    # "Restart the process": re-invoke with the same thread_id and no new
    # input. This is the resume path exercised by POST /runs/{id}/resume.
    result = graph.invoke(None, config=run_config(thread_id))

    # It should reach the human gate (interrupt), not re-run classify_documents.
    stage_end_count_after = (
        db.query(RunEvent)
        .filter_by(run_id=str(run.id), stage="classify_documents", event_type="stage_end")
        .count()
    )
    assert stage_end_count_after == 1, "resuming must not re-run a stage that already completed"
    snapshot = graph.get_state(run_config(thread_id))
    assert snapshot.next == ("human_review_gate",), "run should pause at the human review gate"
