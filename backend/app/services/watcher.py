"""
Folder watcher service (behavior: "stays alive").

Monitors watched directories for new source documents arriving in a pile's
`watched_path`. When a new file arrives, it dedupes against existing document
hashes, ingests the file, and triggers a focused `delta_update` run so only the
affected deliverable sections get updated.
"""
import hashlib
import time
from pathlib import Path

from app.db.models import Chunk, Document, Pile, Run
from app.db.session import SessionLocal
from app.graph.build_graph import build_graph, run_config
from app.services.embeddings import chunk_text, embed_text


def scan_watched_piles():
    """Scans all piles with a non-null watched_path for newly arrived files."""
    db = SessionLocal()
    try:
        piles = db.query(Pile).filter(Pile.watched_path.isnot(None)).all()
        for pile in piles:
            folder = Path(pile.watched_path)
            if not folder.exists() or not folder.is_dir():
                continue

            new_docs = []
            for file_path in folder.glob("*.txt"):
                raw_bytes = file_path.read_bytes()
                content_hash = hashlib.sha256(raw_bytes).hexdigest()

                existing = db.query(Document).filter_by(pile_id=pile.id, content_hash=content_hash).first()
                if existing:
                    continue

                text = raw_bytes.decode("utf-8", errors="ignore")
                doc = Document(
                    pile_id=pile.id,
                    source_path=file_path.name,
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
                new_docs.append(str(doc.id))

            if new_docs:
                db.commit()
                # Trigger a focused delta_update run for newly arrived documents
                import uuid

                thread_id = str(uuid.uuid4())
                run = Run(pile_id=pile.id, run_type="delta_update", checkpoint_thread_id=thread_id)
                db.add(run)
                db.commit()

                graph = build_graph(db)
                initial_state = {
                    "run_id": str(run.id),
                    "pile_id": str(pile.id),
                    "run_type": "delta_update",
                    "pending_document_ids": new_docs,
                }
                graph.invoke(initial_state, config=run_config(thread_id))
                snapshot = graph.get_state(run_config(thread_id))
                run.status = "awaiting_review" if snapshot.next else "completed"
                db.commit()
    finally:
        db.close()
