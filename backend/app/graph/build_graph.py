"""
Wires the nodes into a graph and attaches the Postgres checkpointer.

Every node signature is (state, db) -> partial_state, so we close over a
per-call db session with functools.partial when building the graph — this
keeps nodes testable with a fake session without touching graph wiring.
"""
from functools import partial

import psycopg
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import END, START, StateGraph
from sqlalchemy.orm import Session

from app.config import settings
from app.graph import nodes
from app.graph.state import PipelineState


def build_graph(db: Session):
    graph = StateGraph(PipelineState)

    graph.add_node("classify_documents", partial(nodes.classify_documents, db=db))
    graph.add_node("extract_facts", partial(nodes.extract_facts, db=db))
    graph.add_node("synthesize", partial(nodes.detect_conflicts_and_synthesize, db=db))
    graph.add_node("examine", partial(nodes.run_compliance_checks, db=db))
    graph.add_node("human_review_gate", partial(nodes.human_review_gate, db=db))
    graph.add_node("commit", partial(nodes.commit, db=db))

    graph.add_edge(START, "classify_documents")
    graph.add_conditional_edges(
        "classify_documents",
        nodes.route_after_gate,
        {"continue": "extract_facts", "retry": "classify_documents", "skip": "extract_facts"},
    )
    graph.add_conditional_edges(
        "extract_facts",
        nodes.route_after_gate,
        {"continue": "synthesize", "retry": "extract_facts", "skip": "synthesize"},
    )
    graph.add_conditional_edges(
        "synthesize",
        nodes.route_after_gate,
        {"continue": "examine", "retry": "synthesize", "skip": "examine"},
    )
    graph.add_edge("examine", "human_review_gate")
    graph.add_edge("human_review_gate", "commit")
    graph.add_edge("commit", END)

    checkpointer = get_checkpointer()
    return graph.compile(checkpointer=checkpointer)


_checkpointer_conn: psycopg.Connection | None = None
_checkpointer: PostgresSaver | None = None


def get_checkpointer() -> PostgresSaver:
    """Returns a application-wide singleton PostgresSaver instance with a single persistent connection."""
    global _checkpointer_conn, _checkpointer
    if _checkpointer is None or _checkpointer_conn is None or _checkpointer_conn.closed:
        _checkpointer_conn = psycopg.connect(
            settings.checkpointer_dsn, autocommit=True, prepare_threshold=0
        )
        _checkpointer = PostgresSaver(_checkpointer_conn)
        _checkpointer.setup()
    return _checkpointer


def close_checkpointer() -> None:
    """Closes the persistent checkpointer connection on shutdown."""
    global _checkpointer_conn, _checkpointer
    if _checkpointer_conn and not _checkpointer_conn.closed:
        _checkpointer_conn.close()
    _checkpointer_conn = None
    _checkpointer = None


def run_config(thread_id: str) -> dict:
    """LangGraph config dict keyed by thread_id — this is what makes
    'kill the process, start it again, resume from where it left off' work:
    re-invoking with the same thread_id reattaches to the saved checkpoint."""
    return {"configurable": {"thread_id": thread_id}}