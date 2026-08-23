import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.models import Chunk, Document, Pile, Run, RunEvent
from app.db.session import get_db
from app.graph.build_graph import build_graph, run_config
from app.services.embeddings import chunk_text, embed_text

router = APIRouter()


@router.post("/piles")
def create_pile(name: str, domain: str, db: Session = Depends(get_db)):
    existing = db.query(Pile).filter_by(name=name, domain=domain).first()
    if existing:
        return {"pile_id": str(existing.id)}
    pile = Pile(name=name, domain=domain)
    db.add(pile)
    db.commit()
    return {"pile_id": str(pile.id)}


def sanitize_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\x00", "")
    return "".join(ch for ch in text if ch.isprintable() or ch in "\n\r\t")


def extract_text_from_file(filename: str, raw_bytes: bytes) -> str:
    ext = (filename.split(".")[-1] if "." in filename else "").lower()
    text = ""
    if ext == "pdf":
        try:
            import io, pypdf
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            text_pages = [p.extract_text() for p in reader.pages if p.extract_text()]
            if text_pages:
                text = "\n".join(text_pages)
        except Exception:
            pass

    if not text and ext in ("docx", "doc"):
        try:
            import io, zipfile, xml.etree.ElementTree as ET
            with zipfile.ZipFile(io.BytesIO(raw_bytes)) as z:
                xml_content = z.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                paragraphs = []
                for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                    texts = [node.text for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if node.text]
                    if texts:
                        paragraphs.append("".join(texts))
                if paragraphs:
                    text = "\n".join(paragraphs)
        except Exception:
            pass

    if not text:
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = raw_bytes.decode("latin-1", errors="ignore")

    return sanitize_text(text)


@router.get("/piles/{pile_id}/documents/upload")
def upload_file_info():
    return {"message": "Document upload requires an HTTP POST request with a file payload."}


@router.get("/piles/{pile_id}/documents")
def list_documents(pile_id: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter_by(pile_id=pile_id).all()
    return [
        {
            "id": str(d.id),
            "source_path": d.source_path,
            "content_hash": d.content_hash,
            "ingested_at": d.ingested_at.isoformat() if d.ingested_at else None,
        }
        for d in docs
    ]


@router.post("/piles/{pile_id}/documents/upload")
async def upload_document_file(pile_id: str, file: UploadFile, db: Session = Depends(get_db)):
    if not pile_id or pile_id == "undefined":
        existing = db.query(Pile).first()
        if not existing:
            existing = Pile(name="Vendor Contract Pile", domain="vendor_contracts")
            db.add(existing)
            db.flush()
        pile_id = str(existing.id)

    raw_bytes = await file.read()
    import hashlib

    content_hash = hashlib.sha256(raw_bytes).hexdigest()

    existing_doc = db.query(Document).filter_by(pile_id=pile_id, content_hash=content_hash).first()
    if existing_doc:
        return {"document_id": str(existing_doc.id), "filename": file.filename, "chunks_created": 0, "status": "duplicate_skipped"}

    text = extract_text_from_file(file.filename, raw_bytes)
    doc = Document(
        pile_id=pile_id,
        source_path=file.filename,
        content_hash=content_hash,
        raw_text=text,
    )
    db.add(doc)
    db.flush()

    spans = chunk_text(text)
    for char_start, char_end, chunk_str in spans:
        db.add(
            Chunk(
                document_id=doc.id,
                char_start=char_start,
                char_end=char_end,
                text=chunk_str,
                embedding=embed_text(chunk_str),
            )
        )
    db.commit()
    return {"document_id": str(doc.id), "filename": file.filename, "chunks_created": len(spans)}


@router.post("/piles/{pile_id}/documents")
async def upload_document(pile_id: str, payload: dict, db: Session = Depends(get_db)):
    import hashlib

    source_path = payload.get("source_path", "pasted_document.txt")
    text = payload.get("raw_text", "")
    raw_bytes = text.encode("utf-8")
    content_hash = hashlib.sha256(raw_bytes).hexdigest()

    existing_doc = db.query(Document).filter_by(pile_id=pile_id, content_hash=content_hash).first()
    if existing_doc:
        return {"document_id": str(existing_doc.id), "chunks_created": 0, "status": "duplicate_skipped"}

    doc = Document(
        pile_id=pile_id,
        source_path=source_path,
        content_hash=content_hash,
        raw_text=text,
    )
    db.add(doc)
    db.flush()

    spans = chunk_text(text)
    for char_start, char_end, chunk_str in spans:
        db.add(
            Chunk(
                document_id=doc.id,
                char_start=char_start,
                char_end=char_end,
                text=chunk_str,
                embedding=embed_text(chunk_str),
            )
        )
    db.commit()
    return {"document_id": str(doc.id), "chunks_created": len(spans)}


@router.post("/piles/{pile_id}/runs")
def start_run(pile_id: str, run_type: str = "full_ingest", db: Session = Depends(get_db)):
    thread_id = str(uuid.uuid4())
    run = Run(pile_id=pile_id, run_type=run_type, checkpoint_thread_id=thread_id)
    db.add(run)
    db.commit()

    pending_docs = [str(d.id) for d in db.query(Document).filter_by(pile_id=pile_id, ingest_run_id=None)]

    graph = build_graph(db)
    initial_state = {
        "run_id": str(run.id),
        "pile_id": pile_id,
        "run_type": run_type,
        "pending_document_ids": pending_docs,
    }
    graph.invoke(initial_state, config=run_config(thread_id))

    # This LangGraph version doesn't surface "__interrupt__" inside invoke()'s
    # return value — confirmed by direct inspection: it was absent even when
    # the graph had genuinely paused. get_state().next is the reliable way to
    # check: a non-empty tuple names the node(s) still waiting to run.
    snapshot = graph.get_state(run_config(thread_id))
    run.status = "awaiting_review" if snapshot.next else "completed"
    db.commit()
    return {"run_id": str(run.id), "status": run.status}


@router.post("/runs/{run_id}/resume")
def resume_run(run_id: str, db: Session = Depends(get_db)):
    """
    Kill/resume path (behavior 2): re-invoking the graph with the same
    thread_id and no new input reattaches to the last checkpoint and
    continues — nothing already completed is redone.
    """
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "run not found")
    graph = build_graph(db)
    graph.invoke(None, config=run_config(run.checkpoint_thread_id))
    snapshot = graph.get_state(run_config(run.checkpoint_thread_id))
    run.status = "awaiting_review" if snapshot.next else "completed"
    db.commit()
    return {"run_id": run_id, "status": run.status}


@router.get("/runs/{run_id}/status")
def run_status(run_id: str, db: Session = Depends(get_db)):
    try:
        uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(404, "run not found")
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "run not found")
    return {"run_id": run_id, "status": run.status, "run_type": run.run_type}


@router.get("/runs/{run_id}/cost")
def run_cost(run_id: str, db: Session = Depends(get_db)):
    try:
        uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(404, "run not found")
    events = db.query(RunEvent).filter_by(run_id=run_id).all()
    by_stage: dict[str, dict] = {}
    for e in events:
        s = by_stage.setdefault(e.stage, {"tokens_in": 0, "tokens_out": 0, "cost_usd": 0.0, "latency_ms": 0})
        s["tokens_in"] += e.tokens_in or 0
        s["tokens_out"] += e.tokens_out or 0
        s["cost_usd"] += float(e.cost_usd or 0)
        s["latency_ms"] += e.latency_ms or 0
    return {"run_id": run_id, "by_stage": by_stage}


@router.get("/runs/{run_id}/changelog")
def run_changelog(run_id: str, db: Session = Depends(get_db)):
    """Answers: what changed, when, because of which source."""
    events = (
        db.query(RunEvent)
        .filter_by(run_id=run_id)
        .filter(RunEvent.caused_by_document_id.isnot(None))
        .order_by(RunEvent.created_at)
        .all()
    )
    return [
        {
            "stage": e.stage,
            "at": e.created_at.isoformat(),
            "caused_by_document_id": str(e.caused_by_document_id),
            "detail": e.detail,
        }
        for e in events
    ]

    