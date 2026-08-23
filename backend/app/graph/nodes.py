"""
Node functions for the pipeline graph. Each node:
  1. logs a stage_start run_event,
  2. does its work (currently stubbed — fill in per the day-by-day plan),
  3. logs a stage_end run_event with cost/latency,
  4. returns a partial state update (LangGraph merges this into PipelineState).

Nodes are plain functions, not methods, so they're trivially unit-testable
with a fake db session and the mock LLM provider.
"""
import hashlib
import json
import time

from langgraph.types import interrupt
from sqlalchemy.orm import Session

from app.db.models import Conflict, DeliverableSection, Document, Fact, Finding, RunEvent
from app.graph.state import PipelineState
from app.services.llm_client import call_llm
from app.services.locking import with_section_lock

MAX_RETRIES = 2


def _log_event(
    db: Session,
    run_id: str,
    stage: str,
    event_type: str,
    tokens_in: int | None = None,
    tokens_out: int | None = None,
    cost_usd: float | None = None,
    latency_ms: int | None = None,
    caused_by_document_id: str | None = None,
    **detail,
) -> None:
    db.add(
        RunEvent(
            run_id=run_id,
            stage=stage,
            event_type=event_type,
            detail=detail or None,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            caused_by_document_id=caused_by_document_id,
        )
    )
    db.commit()


def classify_documents(state: PipelineState, db: Session) -> dict:
    """Work out what each pending document is (contract / amendment / invoice / ...)."""
    stage = "classify_documents"
    _log_event(db, state["run_id"], stage, "stage_start")

    classified: list[str] = []
    for doc_id in state.get("pending_document_ids", []):
        doc = db.get(Document, doc_id)
        if not doc:
            continue
        result = call_llm(
            task="classify",
            system=(
                "Classify this document as exactly one of: contract, amendment, "
                "invoice, other. Respond with just the label."
            ),
            document_text=doc.raw_text,
        )
        doc.doc_type = (result.text or "other").strip()
        _log_event(
            db,
            state["run_id"],
            stage,
            "llm_call",
            tokens_in=result.tokens_in,
            tokens_out=result.tokens_out,
            cost_usd=result.cost_usd,
            latency_ms=result.latency_ms,
            caused_by_document_id=str(doc.id),
        )
        classified.append(doc_id)
    db.commit()

    _log_event(db, state["run_id"], stage, "stage_end", classified=len(classified))
    return {"stage": stage, "classified_document_ids": classified, "pending_document_ids": []}


def extract_facts(state: PipelineState, db: Session) -> dict:
    """Pull cited facts out of each classified document, each traceable to an exact char span."""
    stage = "extract_facts"
    _log_event(db, state["run_id"], stage, "stage_start")

    fact_ids: list[str] = []
    for doc_id in state.get("classified_document_ids", []):
        doc = db.get(Document, doc_id)
        if not doc:
            continue
        result = call_llm(
            task="extract_facts",
            system=(
                "Extract every fact that matters (payment terms, amounts, dates, "
                "parties) as a JSON list of objects with keys: char_start, char_end, "
                "fact_text, fact_type, confidence. char_start/char_end must be exact "
                "character offsets into the document text supplied."
            ),
            document_text=doc.raw_text,
        )
        try:
            extracted = json.loads(result.text)
        except (ValueError, TypeError):
            extracted = []

        for item in extracted:
            fact = Fact(
                document_id=doc.id,
                run_id=state["run_id"],
                char_start=item["char_start"],
                char_end=item["char_end"],
                fact_text=item["fact_text"],
                fact_type=item.get("fact_type"),
                confidence=item.get("confidence"),
            )
            db.add(fact)
            db.flush()
            fact_ids.append(str(fact.id))

        _log_event(
            db,
            state["run_id"],
            stage,
            "llm_call",
            tokens_in=result.tokens_in,
            tokens_out=result.tokens_out,
            cost_usd=result.cost_usd,
            latency_ms=result.latency_ms,
            caused_by_document_id=str(doc.id),
            extracted=len(extracted),
        )
    db.commit()

    _log_event(db, state["run_id"], stage, "stage_end", extracted=len(fact_ids))
    return {"stage": stage, "extracted_fact_ids": fact_ids}


def _fact_section_key(fact: Fact) -> str:
    ftype = fact.fact_type or "general"
    return f"section.{ftype}"


def detect_conflicts_and_synthesize(state: PipelineState, db: Session) -> dict:
    """
    Update the deliverable section by section. Where a new fact contradicts
    an existing section, write a Conflict row directly here — conflicts get
    resolved at the human gate, never silently.
    """
    stage = "synthesize"
    t0 = time.time()
    _log_event(db, state["run_id"], stage, "stage_start")

    touched: list[str] = []
    conflict_ids: list[str] = []

    fact_ids = state.get("extracted_fact_ids", [])
    if fact_ids:
        facts = db.query(Fact).filter(Fact.id.in_(fact_ids)).all()
    else:
        facts = db.query(Fact).filter_by(run_id=state["run_id"]).all()

    by_section: dict[str, list[Fact]] = {}
    for f in facts:
        key = _fact_section_key(f)
        by_section.setdefault(key, []).append(f)

    for section_key, section_facts in by_section.items():
        with_section_lock(db, state["pile_id"], section_key)

        current = (
            db.query(DeliverableSection)
            .filter_by(pile_id=state["pile_id"], section_key=section_key)
            .order_by(DeliverableSection.version.desc())
            .first()
        )

        fact_texts = [f.fact_text for f in section_facts]
        new_content = "\n".join(fact_texts)
        new_hash = hashlib.sha256(new_content.encode("utf-8")).hexdigest()

        if current is None:
            new_sec = DeliverableSection(
                pile_id=state["pile_id"],
                section_key=section_key,
                version=1,
                content=new_content,
                content_hash=new_hash,
                source_fact_ids=[f.id for f in section_facts],
                updated_by_run_id=state["run_id"],
            )
            db.add(new_sec)
            db.flush()
            touched.append(section_key)
        elif current.content_hash == new_hash:
            pass
        else:
            has_contradiction = False
            for f in section_facts:
                if f.fact_text.lower() not in current.content.lower():
                    has_contradiction = True
                    c_row = Conflict(
                        run_id=state["run_id"],
                        deliverable_section_id=current.id,
                        conflicting_fact_id=f.id,
                        description=f"Fact '{f.fact_text}' contradicts section {section_key} (v{current.version}).",
                        status="pending",
                    )
                    db.add(c_row)
                    db.flush()
                    conflict_ids.append(str(c_row.id))

            if not has_contradiction:
                next_v = current.version + 1
                combined = f"{current.content}\n{new_content}"
                new_sec = DeliverableSection(
                    pile_id=state["pile_id"],
                    section_key=section_key,
                    version=next_v,
                    content=combined,
                    content_hash=hashlib.sha256(combined.encode("utf-8")).hexdigest(),
                    source_fact_ids=list(set((current.source_fact_ids or []) + [f.id for f in section_facts])),
                    updated_by_run_id=state["run_id"],
                )
                db.add(new_sec)
                db.flush()
                touched.append(section_key)

    db.commit()
    latency_ms = max(1, int((time.time() - t0) * 1000))
    _log_event(db, state["run_id"], stage, "stage_end", latency_ms=latency_ms, touched=len(touched), conflicts=len(conflict_ids))
    return {"stage": stage, "touched_section_keys": touched, "conflict_item_ids": conflict_ids}


def run_compliance_checks(state: PipelineState, db: Session) -> dict:
    """Check sources + deliverable against the user's ruleset, stage by stage."""
    stage = "examine"
    t0 = time.time()
    _log_event(db, state["run_id"], stage, "stage_start")

    finding_ids: list[str] = []
    ruleset_id = state.get("ruleset_id")
    tokens_in, tokens_out, cost_usd = 0, 0, 0.0

    if ruleset_id:
        sections = db.query(DeliverableSection).filter_by(pile_id=state["pile_id"]).all()
        for sec in sections:
            result = call_llm(
                task="compliance_check",
                system=f"Check section {sec.section_key} against ruleset {ruleset_id}.",
                document_text=sec.content,
            )
            tokens_in += result.tokens_in or 0
            tokens_out += result.tokens_out or 0
            cost_usd += float(result.cost_usd or 0)
            if "violation" in (result.text or "").lower():
                finding = Finding(
                    run_id=state["run_id"],
                    pile_id=state["pile_id"],
                    rule_id=f"rule_{ruleset_id}",
                    severity="violation",
                    description=f"Compliance check failed for section {sec.section_key}",
                    status="pending",
                )
                db.add(finding)
                db.flush()
                finding_ids.append(str(finding.id))

        if not finding_ids:
            finding = Finding(
                run_id=state["run_id"],
                pile_id=state["pile_id"],
                rule_id=f"rule_{ruleset_id}",
                severity="no_finding",
                description=f"Ruleset {ruleset_id} checked cleanly with no findings.",
                status="pending",
            )
            db.add(finding)
            db.flush()
            finding_ids.append(str(finding.id))
    else:
        row = Finding(
            run_id=state["run_id"],
            pile_id=state["pile_id"],
            rule_id="no_ruleset_supplied",
            severity="no_finding",
            description="No compliance ruleset was provided for this run.",
            status="pending",
        )
        db.add(row)
        db.flush()
        finding_ids.append(str(row.id))

    db.commit()
    latency_ms = max(1, int((time.time() - t0) * 1000))
    _log_event(db, state["run_id"], stage, "stage_end", tokens_in=tokens_in, tokens_out=tokens_out, cost_usd=cost_usd, latency_ms=latency_ms, findings=len(finding_ids))
    return {"stage": stage, "finding_item_ids": finding_ids}


def human_review_gate(state: PipelineState, db: Session) -> dict:
    """
    Pause the graph and wait for a decision on every pending item.

    IMPORTANT: this node writes NOTHING to the database before interrupt()
    is called. LangGraph re-runs an interrupted node's entire body from the
    top every time execution resumes into it.
    """
    stage = "human_review_gate"

    item_ids = state.get("finding_item_ids", []) + state.get("conflict_item_ids", [])

    decisions = interrupt({"pending_item_ids": item_ids})

    _log_event(db, state["run_id"], stage, "stage_end", decided=len(decisions or {}))
    return {"stage": stage, "review_decisions": decisions or {}}


def commit(state: PipelineState, db: Session) -> dict:
    """Apply approved items, discard rejected ones, leave everything else untouched."""
    stage = "commit"
    t0 = time.time()
    _log_event(db, state["run_id"], stage, "stage_start")

    from datetime import datetime
    decisions = state.get("review_decisions", {})
    committed_count = 0
    now = datetime.utcnow()

    import uuid
    for item_id, decision in decisions.items():
        try:
            uuid.UUID(str(item_id))
        except (ValueError, AttributeError, TypeError):
            continue

        finding = db.get(Finding, item_id)
        if finding:
            finding.status = decision
            finding.decided_at = now
            if decision == "approved":
                committed_count += 1
            continue

        conflict = db.get(Conflict, item_id)
        if conflict:
            conflict.status = decision
            conflict.decided_at = now
            if decision == "approved":
                sec = db.get(DeliverableSection, conflict.deliverable_section_id)
                fact = db.get(Fact, conflict.conflicting_fact_id)
                if sec and fact:
                    with_section_lock(db, state["pile_id"], sec.section_key)
                    next_version = sec.version + 1
                    updated_content = f"{sec.content}\n[Resolved Amendment]: {fact.fact_text}"
                    new_sec = DeliverableSection(
                        pile_id=state["pile_id"],
                        section_key=sec.section_key,
                        version=next_version,
                        content=updated_content,
                        content_hash=hashlib.sha256(updated_content.encode("utf-8")).hexdigest(),
                        source_fact_ids=list(set((sec.source_fact_ids or []) + [fact.id])),
                        updated_by_run_id=state["run_id"],
                    )
                    db.add(new_sec)
                committed_count += 1

    db.commit()
    latency_ms = max(1, int((time.time() - t0) * 1000))
    _log_event(db, state["run_id"], stage, "stage_end", latency_ms=latency_ms, committed=committed_count)
    return {"stage": stage}


def route_after_gate(state: PipelineState) -> str:
    """Conditional edge: escalate to a human is already handled by interrupt();
    this covers the retry/skip branch for a stage that failed before the gate."""
    if state.get("last_error"):
        retries = state.get("retry_count", {}).get(state["stage"], 0)
        if retries < MAX_RETRIES:
            return "retry"
        return "skip"
    return "continue"