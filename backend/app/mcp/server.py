"""
MCP server for Task 1 (behavior 4: a machine can drive the whole flow
without a human clicking through the UI). Tools are thin wrappers over the
same service calls the REST routes use — kept thin deliberately so REST and
MCP can never drift into different behavior for the same operation.

Run standalone: `python -m app.mcp.server`
"""
from mcp.server.fastmcp import FastMCP

from app.db.session import SessionLocal

mcp = FastMCP("superdocs-task1-agentic-system")


@mcp.tool()
def start_run(pile_id: str, run_type: str = "full_ingest") -> dict:
    """Start an ingest/update/examine run against a pile. Returns run_id and status."""
    from app.api.routes_runs import start_run as _start_run

    db = SessionLocal()
    try:
        return _start_run(pile_id, run_type, db)
    finally:
        db.close()


@mcp.tool()
def get_run_status(run_id: str) -> dict:
    """Check whether a run is running, awaiting_review, completed, or failed."""
    from app.api.routes_runs import run_status as _run_status

    db = SessionLocal()
    try:
        return _run_status(run_id, db)
    finally:
        db.close()


@mcp.tool()
def list_pending_reviews(run_id: str) -> dict:
    """List findings and conflicts still awaiting a human/machine decision."""
    from app.api.routes_review import pending_reviews as _pending_reviews

    db = SessionLocal()
    try:
        return _pending_reviews(run_id, db)
    finally:
        db.close()


@mcp.tool()
def approve_item(run_id: str, item_id: str, decided_by: str = "mcp-client") -> dict:
    """Approve a pending finding or conflict. Explicit — whoever calls this makes the call."""
    from app.api.routes_review import approve_item as _approve

    db = SessionLocal()
    try:
        return _approve(run_id, item_id, decided_by, db)
    finally:
        db.close()


@mcp.tool()
def reject_item(run_id: str, item_id: str, decided_by: str = "mcp-client") -> dict:
    """Reject a pending finding or conflict. Rejecting one never discards the rest."""
    from app.api.routes_review import reject_item as _reject

    db = SessionLocal()
    try:
        return _reject(run_id, item_id, decided_by, db)
    finally:
        db.close()


@mcp.tool()
def finalize_reviews(run_id: str, decided_by: str = "mcp-client") -> dict:
    """Resume the run past the human gate once every pending item has a decision."""
    from app.api.routes_review import finalize_reviews as _finalize

    db = SessionLocal()
    try:
        return _finalize(run_id, decided_by, db)
    finally:
        db.close()


@mcp.tool()
def get_cost_report(run_id: str) -> dict:
    """Get token/latency/cost breakdown for a run, stage by stage."""
    from app.api.routes_runs import run_cost as _run_cost

    db = SessionLocal()
    try:
        return _run_cost(run_id, db)
    finally:
        db.close()


if __name__ == "__main__":
    mcp.run()
