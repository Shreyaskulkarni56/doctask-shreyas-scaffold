"""
Behavior 9: "Two runs at the same time stay two runs, whether they are two
piles or the same pile hit twice. Concurrent work does not corrupt state."

This test hits the harder case: the SAME pile, same section_key, from two
threads at once, and asserts the deliverable_sections version sequence is
consistent (no lost update / no two rows claiming the same version).
"""
import threading
import uuid

from sqlalchemy.orm import sessionmaker

from app.db.models import DeliverableSection, Pile, Run
from app.services.locking import with_section_lock


def _write_section_version(engine, pile_id, run_id, section_key):
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        with session.begin():
            with_section_lock(session, pile_id, section_key)
            current = (
                session.query(DeliverableSection)
                .filter_by(pile_id=pile_id, section_key=section_key)
                .order_by(DeliverableSection.version.desc())
                .first()
            )
            next_version = (current.version + 1) if current else 1
            session.add(
                DeliverableSection(
                    pile_id=pile_id,
                    section_key=section_key,
                    version=next_version,
                    content=f"version {next_version}",
                    content_hash=f"hash-{next_version}",
                    updated_by_run_id=run_id,
                )
            )
    finally:
        session.close()


def test_same_pile_same_section_concurrent_writes_do_not_collide(db, engine):
    pile = Pile(name="concurrency test", domain="vendor_contracts")
    db.add(pile)
    db.commit()
    run = Run(pile_id=pile.id, run_type="delta_update", checkpoint_thread_id=str(uuid.uuid4()))
    db.add(run)
    db.commit()

    threads = [
        threading.Thread(target=_write_section_version, args=(engine, pile.id, run.id, "party.vendor_x.terms"))
        for _ in range(5)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    versions = [
        row.version
        for row in db.query(DeliverableSection)
        .filter_by(pile_id=pile.id, section_key="party.vendor_x.terms")
        .order_by(DeliverableSection.version)
        .all()
    ]
    assert versions == list(range(1, 6)), f"expected a clean 1..5 sequence, got {versions}"
