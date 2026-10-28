# AI Agent Project (LGv3)

ระบบ **Visual Multi-Agent Workflow Automation Platform** สำหรับการประมวลผลเอกสารขั้นสูง (Document Intelligence), การทำ Thai Verbatim OCR, การประเมินเกณฑ์จัดซื้อจัดจ้าง (TOR / Rubric / MCA) และการวิเคราะห์ Big Data ด้วย In-Process SQL (Polars + DuckDB)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── backend_fastapi/        #  FastAPI Backend (Python 3.11, LangGraph, Polars, DuckDB, Swagger UI)
├── backend_node/           # 📦 Express.js Backend เดิม (Node.js TypeScript, @langchain/langgraph)
├── frontend/               # 🖥️ React Flow Canvas UI (React 19, TypeScript, Vite 8, Tailwind CSS)
├── _work flow/             # 📑 Workflow Templates ที่บันทึกไว้ (TOR Analysis, OCR Chains)
├── memory/                 # 🧠 Project Context & Rules
├── scripts/                # 🛠️ สคริปต์ควบคุมระบบ (Start / Restart / Archived)
│   ├── start_all.bat
│   ├── restart_all.bat
│   ├── start_backend_fastapi.bat
│   ├── start_frontend.bat
│   └── archived/           # สคริปต์เวอร์ชันเดิมที่จัดเก็บไว้
├── start.bat               # 🚀 คำสั่งหลักเปิดระบบทั้งหมด
├── restart.bat             # 🔄 คำสั่งรีสตาร์ตระบบทั้งหมด
├── docker-compose.yml      # 🐳 Docker Compose Configuration
└── .gitignore              # 🛡️ Git Ignore Configuration
```

---

## 🚀 วิธีการเริ่มต้นใช้งาน (Quick Start)

### 1. รันระบบผ่านสคริปต์
ดับเบิลคลิกที่ไฟล์ **`start.bat`** ในโฟลเดอร์หลัก เพื่อเปิดทั้ง Backend (FastAPI) และ Frontend (React Flow) พร้อมเปิดเบราว์เซอร์อัตโนมัติ

### 2. ช่องทางการเข้าใช้งาน
* **หน้าจอ Visual Canvas (Frontend)**: [http://localhost:5176](http://localhost:5176)
  * *Username*: `user01`
  * *Password*: `admin`
* **Interactive Swagger UI (Backend)**: [http://localhost:8001/docs](http://localhost:8001/docs)
* **ReDoc Documentation**: [http://localhost:8001/redoc](http://localhost:8001/redoc)
