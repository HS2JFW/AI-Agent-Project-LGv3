import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_WORKSPACE = BASE_DIR.parent

# Storage and Working Directories
QUEUE_PDF_TEMP_DIR = BASE_DIR / "queue_pdf_temp"
QUEUE_TXT_TEMP_DIR = BASE_DIR / "queue_txt_temp"
QUEUE_ZIP_TEMP_DIR = BASE_DIR / "queue_zip_temp"
AGENT_OUTPUTS_DIR = BASE_DIR / "agent_outputs"
LOGS_DIR = BASE_DIR / "logs"
WF_DIR = BASE_DIR / "WF"

for d in [QUEUE_PDF_TEMP_DIR, QUEUE_TXT_TEMP_DIR, QUEUE_ZIP_TEMP_DIR, AGENT_OUTPUTS_DIR, LOGS_DIR, WF_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Database Configuration
raw_db_url = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/workflows.db")
# Normalize PostgreSQL URLs for SQLAlchemy asyncpg
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    DATABASE_URL = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = raw_db_url

if "sqlite" in DATABASE_URL and ":memory:" not in DATABASE_URL:
    try:
        db_path_part = DATABASE_URL.split(":///")[-1]
        if db_path_part:
            Path(db_path_part).parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

# Server Configuration
PORT = int(os.getenv("PORT", "8001"))
HOST = os.getenv("HOST", "0.0.0.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "production").lower()

# CORS Configuration
raw_cors = os.getenv("CORS_ORIGINS", "").strip()
if raw_cors:
    if raw_cors == "*":
        CORS_ORIGINS = ["*"]
    else:
        CORS_ORIGINS = [orig.strip() for orig in raw_cors.split(",") if orig.strip()]
else:
    CORS_ORIGINS = [
        "https://aibuilder-dev.addpay.in.th",
        "http://aibuilder-dev.addpay.in.th",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]

# API Keys & Defaults
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", os.getenv("GEMINI_API_KEY", ""))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Central AI Gateway (LiteLLM) Configuration
AI_GATEWAY_URL = os.getenv("AI_GATEWAY_URL", os.getenv("LITELLM_GATEWAY_URL", "https://litellm.addpay.in.th/v1")).rstrip("/")
AI_GATEWAY_KEY = os.getenv("AI_GATEWAY_KEY", os.getenv("LITELLM_GATEWAY_KEY", ""))

# Authentication & JWT Configuration
DEFAULT_INSECURE_SECRET = "ai-agent-project-lgv3-jwt-secret-key-super-secure-2026"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()

if not JWT_SECRET_KEY:
    if ENVIRONMENT in ("development", "test"):
        JWT_SECRET_KEY = DEFAULT_INSECURE_SECRET
    else:
        print("[SECURITY WARNING] JWT_SECRET_KEY environment variable is not set! Using fallback key. Please configure a strong random secret in your production environment.")
        JWT_SECRET_KEY = DEFAULT_INSECURE_SECRET
elif JWT_SECRET_KEY == DEFAULT_INSECURE_SECRET and ENVIRONMENT == "production":
    print("[SECURITY WARNING] JWT_SECRET_KEY is using the default insecure value in production! Please generate a unique secret key.")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
