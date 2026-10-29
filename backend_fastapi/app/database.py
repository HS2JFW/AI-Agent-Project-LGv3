from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import inspect, text
from app.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # Import models so they are registered with Base metadata
        from app.models.workflow import Workflow
        from app.models.workflow_run import WorkflowRun
        from app.models.execution_log import ExecutionLog
        from app.models.user import User
        await conn.run_sync(Base.metadata.create_all)

        # Lightweight auto-migration for SQLite to ensure new RBAC columns exist
        def auto_migrate(sync_conn):
            inspector = inspect(sync_conn)
            if "users" in inspector.get_table_names():
                existing_cols = {c["name"] for c in inspector.get_columns("users")}
                if "full_name" not in existing_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
                if "department" not in existing_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(100)"))
                if "last_login_at" not in existing_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))

        await conn.run_sync(auto_migrate)
