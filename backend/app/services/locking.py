"""
Concurrency safety (behavior 9): two runs on the same pile must not corrupt
each other's writes, but two runs on *different* piles should run fully in
parallel — so we lock at (pile_id, section_key) granularity via Postgres
advisory locks, not a single mutex around the whole run.

pg_advisory_xact_lock takes a bigint; we hash the (pile_id, section_key)
pair down to one so unrelated sections never contend.
"""
import hashlib

from sqlalchemy import text
from sqlalchemy.orm import Session


def _lock_key(pile_id: str, section_key: str) -> int:
    digest = hashlib.sha256(f"{pile_id}:{section_key}".encode()).digest()[:8]
    # Postgres advisory locks take a signed bigint; mask to fit.
    return int.from_bytes(digest, "big", signed=False) % (2**63)


def with_section_lock(db: Session, pile_id: str, section_key: str):
    """
    Call inside an open transaction. The lock is released automatically at
    transaction end (commit or rollback) — no manual unlock needed, which
    also means a killed process can't leave a lock stuck forever.
    """
    db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _lock_key(pile_id, section_key)})
