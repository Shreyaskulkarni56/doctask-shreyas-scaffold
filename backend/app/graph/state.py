"""
Graph state. Kept as plain, serializable data (dicts/lists/str/UUID-as-str)
because LangGraph checkpoints this state to Postgres between every node —
anything that doesn't survive JSON/pickle round-tripping breaks resumability.
"""
from typing import Literal, TypedDict


class ConflictDraft(TypedDict):
    deliverable_section_id: str
    conflicting_fact_id: str
    description: str


class FindingDraft(TypedDict):
    rule_id: str
    severity: Literal["info", "warning", "violation", "no_finding"]
    description: str
    cited_document_id: str | None
    cited_char_start: int | None
    cited_char_end: int | None


class PipelineState(TypedDict, total=False):
    run_id: str
    pile_id: str
    run_type: Literal["full_ingest", "delta_update", "examine_only"]

    # Understand
    pending_document_ids: list[str]       # docs not yet classified/extracted
    classified_document_ids: list[str]
    extracted_fact_ids: list[str]
    touched_section_keys: list[str]       # sections this run may have written

    # Conflict/finding rows are written to the DB in the nodes that produce
    # them (synthesize, examine) — NOT in human_review_gate. LangGraph
    # re-runs an interrupted node's full body from the top on every resume,
    # so any DB write placed before interrupt() would duplicate on resume.
    # These fields just carry the already-created row IDs downstream.
    conflict_item_ids: list[str]
    finding_item_ids: list[str]

    # Examine
    ruleset_id: str | None

    # Control flow
    retry_count: dict[str, int]           # node_name -> attempts so far
    last_error: str | None
    stage: str                            # current node, for the "visible stages" requirement

    # Human gate outcome, populated after interrupt() resumes
    review_decisions: dict[str, Literal["approved", "rejected"]]  # item_id -> decision