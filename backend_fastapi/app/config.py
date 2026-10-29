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
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/workflows.db")
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

# API Keys & Defaults
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", os.getenv("GEMINI_API_KEY", ""))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Authentication & JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ai-agent-project-lgv3-jwt-secret-key-super-secure-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
