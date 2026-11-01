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
        from app.models.project_group import ProjectGroup
        await conn.run_sync(Base.metadata.create_all)

        # Lightweight auto-migration for SQLite to ensure new RBAC columns exist
        def auto_migrate(sync_conn):
            inspector = inspect(sync_conn)
            table_names = inspector.get_table_names()
            if "users" in table_names:
                user_cols = {c["name"] for c in inspector.get_columns("users")}
                if "full_name" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
                if "department" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(100)"))
                if "last_login_at" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
            if "workflows" in table_names:
                wf_cols = {c["name"] for c in inspector.get_columns("workflows")}
                if "owner_id" not in wf_cols:
                    sync_conn.execute(text("ALTER TABLE workflows ADD COLUMN owner_id VARCHAR(36)"))
                if "is_public" not in wf_cols:
                    sync_conn.execute(text("ALTER TABLE workflows ADD COLUMN is_public BOOLEAN DEFAULT 0"))
                if "group_id" not in wf_cols:
                    sync_conn.execute(text("ALTER TABLE workflows ADD COLUMN group_id VARCHAR(36)"))
                if "color" not in wf_cols:
                    sync_conn.execute(text("ALTER TABLE workflows ADD COLUMN color VARCHAR(50)"))
            if "workflow_runs" in table_names:
                run_cols = {c["name"] for c in inspector.get_columns("workflow_runs")}
                if "executed_by" not in run_cols:
                    sync_conn.execute(text("ALTER TABLE workflow_runs ADD COLUMN executed_by VARCHAR(36)"))

        await conn.run_sync(auto_migrate)
