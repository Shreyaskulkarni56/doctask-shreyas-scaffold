"""
All tests run against LLM_PROVIDER=mock (set in .env.test / CI) so the full
suite runs with no live key and no network call — behavior 7 in the brief.
"""
import os

os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/superdocs_task_test")
os.environ.setdefault("CHECKPOINTER_DSN", "postgresql://postgres:postgres@localhost:5432/superdocs_task_test")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.db.models import Base


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(settings.database_url)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)


@pytest.fixture()
def db(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()
