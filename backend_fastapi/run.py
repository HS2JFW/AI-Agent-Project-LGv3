import uvicorn
import os

import uvicorn
import os
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[*] Starting FastAPI Server on http://{host}:{port}")
    print(f"[*] Interactive Swagger UI available at http://localhost:{port}/docs")
    print(f"[*] ReDoc documentation available at http://localhost:{port}/redoc")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)

