from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.database import init_db, AsyncSessionLocal
from app.services.auth_service import ensure_default_users
from app.routers import (
    workflows_router,
    executions_router,
    queues_router,
    analytics_router,
    logs_router,
    scheduler_router,
    auth_router,
    users_router
)

import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables
    await init_db()
    print("[*] Database tables initialized successfully.")
    # Seed default user accounts
    async with AsyncSessionLocal() as session:
        await ensure_default_users(session)
    print("[*] Default users (user01/admin, admin/admin123) verified.")
    yield
    # Shutdown
    print("[*] Server shutting down.")

tags_metadata = [
    {
        "name": "Authentication",
        "description": "ระบบลงชื่อเข้าใช้งาน (OAuth2 Password Bearer & JWT Token) และตรวจสอบสิทธิ์ผู้ใช้งาน"
    },
    {
        "name": "User Management & RBAC",
        "description": "ระบบจัดการบัญชีผู้ใช้งาน, กำหนดบทบาทสิทธิ์ (RBAC: Superadmin, Admin, Builder, Operator, Viewer)"
    },
    {
        "name": "Workflows",
        "description": "CRUD operations สำหรับสร้าง, แก้ไข, ลบ และดึงข้อมูล Workflow บน React Flow Canvas"
    },
    {
        "name": "Executions",
        "description": "สั่งรัน Workflow ด้วย LangGraph, สตรีม Event แบบ Real-time ผ่าน SSE และหยุดการประมวลผล"
    },
    {
        "name": "File Queues",
        "description": "จัดการคิวไฟล์เอกสารเข้าสู่ระบบ (PDF Queue, TXT Queue, ZIP Queue) และดาวน์โหลดผลลัพธ์ของ Agent"
    },
    {
        "name": "Big Data & Analytics",
        "description": "แปลงไฟล์ Excel/CSV เป็น Parquet ด้วย Polars และคิวรีข้อมูลความเร็วสูงด้วย DuckDB In-process SQL"
    },
    {
        "name": "Scheduler & Automation",
        "description": "ตั้งรอบเวลาการรัน Workflow อัตโนมัติ (node-cron / APScheduler)"
    },
    {
        "name": "Logs & Monitoring",
        "description": "ระบบบันทึก Audit Logs, System Logs, AI Generation Logs และความคืบหน้าของ Node"
    }
]

app = FastAPI(
    title="AI Agent Visual Workflow API",
    description="""
## ระบบ Multi-Agent Visual Workflow & Document Analytics Engine

REST APIs และ Server-Sent Events (SSE) สำหรับควบคุมระบบ AI Agent Canvas (React Flow)
ประมวลผลด้วย **LangGraph Python**, **Polars (Parquet)**, **DuckDB** และ **Google Gemini / OpenAI**:

* **Authentication**: ระบบยืนยันตัวตนด้วย JWT Token (OAuth2 Bearer)
* **LangGraph Engine**: สร้าง State Machine ประมวลผลเอกสาร วนลูปคิวอัตโนมัติ และแยกสายเงื่อนไข Audit
* **Real-time SSE Stream**: สตรีม Logs และ Node Completion ไปยัง Frontend
* **In-Memory Analytics**: วิเคราะห์ตารางข้อมูลขนาดใหญ่ด้วย SQL บน Parquet ได้ทันที
* **Verbatim Thai OCR**: ถอดความตัวอักษรภาษาไทยคำต่อคำจาก PDF สู่ Markdown
    """,
    version="3.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration (Matching frontend ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(workflows_router)
app.include_router(executions_router)
app.include_router(queues_router)
app.include_router(analytics_router)
app.include_router(logs_router)
app.include_router(scheduler_router)

@app.get("/", include_in_schema=False)
async def root_redirect():
    """เปิดหน้าแรกแล้ว Redirect ไปยัง Swagger UI อัตโนมัติ"""
    return RedirectResponse(url="/docs")

@app.get("/health", tags=["Monitoring"])
async def health_check():
    return {"status": "ok", "service": "fastapi-backend", "version": "3.0.0"}
