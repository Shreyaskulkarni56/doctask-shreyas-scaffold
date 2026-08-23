import os


class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/superdocs_task"
    )
    # Raw psycopg DSN (no driver prefix) — LangGraph's PostgresSaver wants this form.
    checkpointer_dsn: str = os.getenv(
        "CHECKPOINTER_DSN", "postgresql://postgres:postgres@localhost:5432/superdocs_task"
    )
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")  # 'mock' | 'groq' | 'anthropic'
    anthropic_api_key: str | None = os.getenv("ANTHROPIC_API_KEY")
    groq_api_key: str | None = os.getenv("GROQ_API_KEY")
    superdocs_api_key: str | None = os.getenv("SUPERDOCS_API_KEY")  # for Task 2, not Task 1
    superdocs_api_base: str = os.getenv("SUPERDOCS_API_BASE", "https://api.superdocs.app")
    max_operation_batch: int = int(os.getenv("MAX_OPERATION_BATCH", "25"))


settings = Settings()
