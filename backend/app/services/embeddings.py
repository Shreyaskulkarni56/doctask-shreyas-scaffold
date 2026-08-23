"""
Chunking is for retrieval only — fact citations always trace to exact
char spans on the *document*, not the chunk, so chunk boundaries never
affect citation precision even if you change chunk_size later.

Mock embeddings are deterministic (same text -> same vector) but NOT
semantically meaningful — they exist so the pgvector column, similarity
queries, and tests all have something real to run against without an API
key or cost. Swap embed_text's mock branch for a real call when you record
the demo; nothing else needs to change since every caller goes through
this one function.
"""
import hashlib

from app.config import settings

EMBEDDING_DIM = 1536


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 80) -> list[tuple[int, int, str]]:
    """Fixed-size sliding window with overlap. Returns (char_start, char_end, text)."""
    if chunk_size <= overlap:
        raise ValueError("chunk_size must exceed overlap")
    if not text:
        return []

    chunks: list[tuple[int, int, str]] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + chunk_size, n)
        chunks.append((start, end, text[start:end]))
        if end == n:
            break
        start = end - overlap
    return chunks


def embed_text(text: str) -> list[float]:
    return _mock_embedding(text)


def _mock_embedding(text: str) -> list[float]:
    digest = hashlib.sha256(text.encode()).digest()
    return [(digest[i % len(digest)] / 255.0) * 2 - 1 for i in range(EMBEDDING_DIM)]