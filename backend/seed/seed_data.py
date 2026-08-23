"""
Loads the synthetic fixture pile so `make demo` gives a stranger something
to run against without them writing test data themselves.

Usage: python -m seed.seed_data
"""
import hashlib
from pathlib import Path

from app.db.models import Chunk, Document, Pile
from app.db.session import SessionLocal
from app.services.embeddings import chunk_text, embed_text

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def main():
    db = SessionLocal()
    pile = Pile(name="Acme Vendor Corp — demo pile", domain="vendor_contracts")
    db.add(pile)
    db.commit()

    doc_count, chunk_count = 0, 0
    for path in sorted(FIXTURES_DIR.glob("*.txt")):
        raw = path.read_bytes()
        text = raw.decode("utf-8")
        doc = Document(
            pile_id=pile.id,
            source_path=path.name,
            content_hash=hashlib.sha256(raw).hexdigest(),
            raw_text=text,
        )
        db.add(doc)
        db.flush()

        for char_start, char_end, chunk_str in chunk_text(text):
            db.add(
                Chunk(
                    document_id=doc.id,
                    char_start=char_start,
                    char_end=char_end,
                    text=chunk_str,
                    embedding=embed_text(chunk_str),
                )
            )
            chunk_count += 1
        doc_count += 1

    db.commit()
    print(f"Seeded pile {pile.id} with {doc_count} documents and {chunk_count} chunks.")
    db.close()


if __name__ == "__main__":
    main()