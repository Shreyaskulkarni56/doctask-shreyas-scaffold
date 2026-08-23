from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_review, routes_runs

app = FastAPI(title="Doc-pile agentic system (SuperDocs Task 1)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_runs.router, tags=["runs"])
app.include_router(routes_review.router, tags=["review"])


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )


from app.db.models import Base
from app.db.session import engine
from app.graph.build_graph import close_checkpointer, get_checkpointer


@app.on_event("startup")
def _setup_checkpointer_tables():
    """
    Initialize domain tables and the application-wide persistent checkpointer
    at process startup, before any request is served.
    """
    try:
        import os
        from sqlalchemy import text
        sql_file = os.path.join(os.path.dirname(__file__), "..", "migrations", "001_init.sql")
        if os.path.exists(sql_file):
            with open(sql_file, "r") as f:
                sql_content = f.read()
            with engine.begin() as conn:
                conn.execute(text(sql_content))
    except Exception as e:
        print(f"[DB Init Notice]: {e}")

    Base.metadata.create_all(bind=engine)
    get_checkpointer()


@app.on_event("shutdown")
def _shutdown_checkpointer():
    close_checkpointer()


@app.get("/health")
def health():
    return {"status": "ok"}