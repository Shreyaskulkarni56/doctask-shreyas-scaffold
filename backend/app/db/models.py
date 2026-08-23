"""
SQLAlchemy models mirroring migrations/001_init.sql.

Kept 1:1 with the SQL so the migration file stays the source of truth —
if you add a column, add it in both places and re-check they match.
"""
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    ARRAY,
    JSON,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def _uuid():
    return uuid.uuid4()


class Pile(Base):
    __tablename__ = "piles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name = Column(Text, nullable=False)
    domain = Column(Text, nullable=False)
    watched_path = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Run(Base):
    __tablename__ = "runs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    pile_id = Column(UUID(as_uuid=True), ForeignKey("piles.id"), nullable=False)
    run_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="running")
    checkpoint_thread_id = Column(Text, nullable=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    finished_at = Column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(run_type.in_(["full_ingest", "delta_update", "examine_only"])),
        CheckConstraint(status.in_(["running", "awaiting_review", "completed", "failed", "cancelled"])),
    )


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    pile_id = Column(UUID(as_uuid=True), ForeignKey("piles.id"), nullable=False)
    ingest_run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"))
    source_path = Column(Text, nullable=False)
    doc_type = Column(Text)
    content_hash = Column(Text, nullable=False)
    raw_text = Column(Text, nullable=False)
    ingested_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("pile_id", "content_hash"),)


class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    char_start = Column(Integer, nullable=False)
    char_end = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(1536))

    document = relationship("Document", back_populates="chunks")


class Fact(Base):
    __tablename__ = "facts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    char_start = Column(Integer, nullable=False)
    char_end = Column(Integer, nullable=False)
    fact_text = Column(Text, nullable=False)
    fact_type = Column(Text)
    confidence = Column(Numeric)
    extracted_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class DeliverableSection(Base):
    __tablename__ = "deliverable_sections"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    pile_id = Column(UUID(as_uuid=True), ForeignKey("piles.id"), nullable=False)
    section_key = Column(Text, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=False)
    content_hash = Column(Text, nullable=False)
    source_fact_ids = Column(ARRAY(UUID(as_uuid=True)), default=list)
    updated_by_run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("pile_id", "section_key", "version"),)


class Finding(Base):
    __tablename__ = "findings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    pile_id = Column(UUID(as_uuid=True), ForeignKey("piles.id"), nullable=False)
    rule_id = Column(Text, nullable=False)
    severity = Column(String, nullable=False, default="info")
    description = Column(Text, nullable=False)
    cited_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    cited_char_start = Column(Integer)
    cited_char_end = Column(Integer)
    status = Column(String, nullable=False, default="pending")
    decided_at = Column(DateTime(timezone=True))
    decided_by = Column(Text)

    __table_args__ = (
        CheckConstraint(severity.in_(["info", "warning", "violation", "no_finding"])),
        CheckConstraint(status.in_(["pending", "approved", "rejected"])),
    )


class Conflict(Base):
    __tablename__ = "conflicts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    deliverable_section_id = Column(UUID(as_uuid=True), ForeignKey("deliverable_sections.id"), nullable=False)
    conflicting_fact_id = Column(UUID(as_uuid=True), ForeignKey("facts.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending")
    decided_at = Column(DateTime(timezone=True))
    decided_by = Column(Text)


class RunEvent(Base):
    __tablename__ = "run_events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id"), nullable=False)
    stage = Column(Text, nullable=False)
    event_type = Column(Text, nullable=False)
    detail = Column(JSON)
    tokens_in = Column(Integer)
    tokens_out = Column(Integer)
    cost_usd = Column(Numeric(10, 6))
    latency_ms = Column(Integer)
    caused_by_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
