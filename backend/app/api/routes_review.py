from fastapi import APIRouter, Depends, HTTPException
from langgraph.types import Command
from sqlalchemy.orm import Session

from app.db.models import Conflict, Finding, Run
from app.db.session import get_db
from app.graph.build_graph import build_graph, run_config

router = APIRouter()


@router.get("/runs/{run_id}/pending-reviews")
def pending_reviews(run_id: str, db: Session = Depends(get_db)):
    findings = db.query(Finding).filter_by(run_id=run_id, status="pending").all()
    conflicts = db.query(Conflict).filter_by(run_id=run_id, status="pending").all()
    return {
        "findings": [{"id": str(f.id), "description": f.description, "severity": f.severity} for f in findings],
        "conflicts": [{"id": str(c.id), "description": c.description} for c in conflicts],
    }


def _decide(run_id: str, item_id: str, decision: str, decided_by: str, db: Session):
    row = db.get(Finding, item_id) or db.get(Conflict, item_id)
    if not row:
        raise HTTPException(404, "review item not found")
    row.status = decision
    row.decided_by = decided_by
    from datetime import datetime

    row.decided_at = datetime.utcnow()
    db.commit()
    return row


@router.post("/runs/{run_id}/reviews/{item_id}/approve")
def approve_item(run_id: str, item_id: str, decided_by: str = "reviewer", db: Session = Depends(get_db)):
    _decide(run_id, item_id, "approved", decided_by, db)
    return {"item_id": item_id, "status": "approved"}


@router.post("/runs/{run_id}/reviews/{item_id}/reject")
def reject_item(run_id: str, item_id: str, decided_by: str = "reviewer", db: Session = Depends(get_db)):
    # Rejecting this item is independent of every other pending item — no
    # shared "discard batch" state exists, so the rest are untouched.
    _decide(run_id, item_id, "rejected", decided_by, db)
    return {"item_id": item_id, "status": "rejected"}


@router.post("/runs/{run_id}/reviews/finalize")
def finalize_reviews(run_id: str, decided_by: str = "reviewer", db: Session = Depends(get_db)):
    """
    Once all pending items for this run have been approved/rejected, resume
    the graph past human_review_gate's interrupt() with the collected
    decisions. This is the explicit "approval is an operation the machine
    interface exposes" call (behavior 4) — a script can drive the whole
    flow by calling approve/reject then this, with no UI involved.
    """
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "run not found")

    still_pending = db.query(Finding).filter_by(run_id=run_id, status="pending").count() + db.query(
        Conflict
    ).filter_by(run_id=run_id, status="pending").count()
    if still_pending:
        raise HTTPException(409, f"{still_pending} item(s) still pending")

    decisions = {}
    for f in db.query(Finding).filter_by(run_id=run_id):
        if f.status in ("approved", "rejected"):
            decisions[str(f.id)] = f.status
    for c in db.query(Conflict).filter_by(run_id=run_id):
        if c.status in ("approved", "rejected"):
            decisions[str(c.id)] = c.status

    graph = build_graph(db)
    config = run_config(run.checkpoint_thread_id)
    try:
        graph.update_state(config, {"review_decisions": decisions}, as_node="human_review_gate")
    except Exception:
        pass
    graph.invoke(Command(resume=decisions), config=config)
    snapshot = graph.get_state(config)
    run.status = "awaiting_review" if snapshot.next else "completed"
    db.commit()
    return {"run_id": run_id, "status": run.status, "decided_by": decided_by}