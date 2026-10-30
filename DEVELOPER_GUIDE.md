# คู่มือนักพัฒนาและการทำงานร่วมกันเป็นทีม (Developer & Collaboration Guide)
**Project:** AI Agent Visual Workflow Builder (LGv3)  
**Target Environment:** Local Dev, Coolify Staging, and Production (`https://aibuilder-dev.addpay.in.th`)  
**Version:** Release v3.0.0 (Updated October 2026)

---

## 📖 สารบัญ (Table of Contents)
1. [ภาพรวมสถาปัตยกรรมระบบ (System Architecture & Tech Stack)](#1-ภาพรวมสถาปัตยกรรมระบบ)
2. [การติดตั้งและตั้งค่าเครื่องสำหรับพัฒนา (Local Development Setup)](#2-การติดตั้งและตั้งค่าเครื่องสำหรับพัฒนา)
3. [โครงสร้างโค้ดและการแบ่งโมดูล (Codebase Modularization)](#3-โครงสร้างโค้ดและการแบ่งโมดูล)
4. [มาตรฐานการทำงานกับ Git และกระบวนการเปิด PR (Git Workflow & Pull Requests)](#4-มาตรฐานการทำงานกับ-git-และกระบวนการเปิด-pr)
5. [ระบบควบคุมสิทธิ์ RBAC สำหรับนักพัฒนา (RBAC Guidelines for Developers)](#5-ระบบควบคุมสิทธิ์-rbac-สำหรับนักพัฒนา)
6. [การทดสอบระบบและการประกันคุณภาพ (Testing & Quality Assurance)](#6-การทดสอบระบบและการประกันคุณภาพ)
7. [การส่งขึ้นเซิร์ฟเวอร์และการทำงานกับ Coolify (Deployment & Environments)](#7-การส่งขึ้นเซิร์ฟเวอร์และการทำงานกับ-coolify)

---

## 1. ภาพรวมสถาปัตยกรรมระบบ

ระบบ **AI Agent Visual Workflow Builder** เป็นแพลตฟอร์ม Visual Node Canvas สำหรับออกแบบและประมวลผลกระบวนการทำงานอัตโนมัติด้วย Multi-Agent (LLM Chains, Document OCR, TOR/Rubric Extraction, SQL Analysis)

```text
┌────────────────────────────────────────────────────────┐
│                   Frontend (React 19)                  │
│       React Flow Canvas + Tailwind CSS v4 + Vite       │
└───────────────────────────┬────────────────────────────┘
                            │ (REST APIs + SSE Stream)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                     │
│      LangGraph Engine + SQLAlchemy + SQLite / aiosqlite │
│            RBAC Security Kernel + Task Queues          │
└───────────────────────────┬────────────────────────────┘
                            │ (Docker Compose)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Coolify Production                    │
│        Traefik Reverse Proxy (SSL) + Project ai-builder │
└────────────────────────────────────────────────────────┘
```

### 🛠️ Technology Stack
* **Frontend:** React 19, TypeScript, React Flow (`reactflow`), Tailwind CSS v4, Lucide React, TipTap, Vite 8
* **Backend:** FastAPI (Python 3.11), SQLAlchemy (Async), SQLite / aiosqlite, LangGraph, Polars, DuckDB, Pydantic v2
* **Authentication & RBAC:** OAuth2 Password Bearer, JWT Token (python-jose), Passlib (Bcrypt)
* **Testing:** Pytest, pytest-asyncio, httpx, ESLint, TypeScript Compiler (`tsc -b`)
* **Infrastructure:** Docker Compose, Coolify Cloud, Traefik Reverse Proxy

---

## 2. การติดตั้งและตั้งค่าเครื่องสำหรับพัฒนา (Local Setup)

### 2.1 สิ่งที่ต้องติดตั้งล่วงหน้า (Prerequisites)
1. **Git:** เวอร์ชัน 2.40 ขึ้นไป
2. **Node.js:** เวอร์ชัน 20 LTS หรือ 22 LTS (แนะนำติดตั้งผ่าน `nvm` หรือ `fnm`)
3. **Python:** เวอร์ชัน 3.11.x
4. **uv (แนะนำ):** Python Package & Virtual Environment Manager ที่เร็วที่สุดในปัจจุบัน  
   *ติดตั้งผ่าน PowerShell:*
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
5. **Docker Desktop:** สำหรับการจำลองคอนเทนเนอร์แบบครบวงจร

---

### 2.2 ขั้นตอนการ Clone และติดตั้งโปรเจกต์ (Step-by-step Quickstart)

```bash
# 1. Clone Repository
git clone https://github.com/HS2JFW/AI-Agent-Project-LGv3.git ai-agent-builder
cd ai-agent-builder

# 2. ตั้งค่า Backend
cd backend_fastapi
uv venv                       # หรือ python -m venv .venv
uv sync                       # หรือ pip install -r requirements.txt
cp .env.example .env          # หากมี หรือสร้าง .env กำหนดค่าพื้นฐาน

# 3. ตั้งค่า Frontend
cd ../frontend
npm install
cp .env.example .env          # ตรวจสอบ VITE_BACKEND_URL=http://localhost:8001
```

---

### 2.3 การรันระบบในโหมดพัฒนา (Development Run)

#### ทางเลือกที่ 1: รันผ่านคำสั่งสคริปต์อัตโนมัติ (ง่ายที่สุด)
ดับเบิลคลิกไฟล์ `start.bat` ในโฟลเดอร์หลัก หรือรันผ่านเทอร์มินัล:
```powershell
.\start.bat
```

#### ทางเลือกที่ 2: รันแยก Terminal (เหมาะสำหรับการดีบักเชิงลึก)
* **Terminal 1 (Backend FastAPI):**
  ```bash
  cd backend_fastapi
  uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
  ```
  *(API Documentation จะอยู่ที่ `http://localhost:8001/docs`)*

* **Terminal 2 (Frontend React Flow):**
  ```bash
  cd frontend
  npm run dev
  ```
  *(เว็บแอปพลิเคชันจะเปิดที่ `http://localhost:5173` หรือ `http://localhost:5176`)*

---

## 3. โครงสร้างโค้ดและการแบ่งโมดูล (Codebase Modularization)

```text
ai-agent-builder/
├── backend_fastapi/            # FastAPI Python Application
│   ├── app/
│   │   ├── config.py           # ตัวแปรระบบ และ Path เก็บไฟล์
│   │   ├── database.py         # SQLAlchemy Engine & Auto-Migration
│   │   ├── graph_engine/       # LangGraph Translator & Node Factory
│   │   ├── models/             # Database ORM (User, Workflow, Run, Logs)
│   │   ├── routers/            # API Endpoints (auth, users, workflows, executions)
│   │   ├── schemas/            # Pydantic Schemas (Request/Response Models)
│   │   └── services/           # Business Logic & SSE Stream Manager
│   └── tests/                  # Pytest Unit & Integration Test Suites
│
├── frontend/                   # React 19 Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI & Modal Dialogs
│   │   │   ├── UserManagementModal.tsx # RBAC Management Console
│   │   │   ├── UnifiedSettingsModal.tsx
│   │   │   ├── UserProfileModal.tsx
│   │   │   └── dialogs/
│   │   ├── nodes/              # Custom React Flow Node Components
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── constants/          # Static Configurations & Menus
│   │   ├── main.tsx            # Global Fetch Interceptor & Root Mount
│   │   └── App.tsx             # Main Canvas Workspace (กำลังถูกแตกโมดูล)
│   └── vite.config.ts
│
├── docker-compose.yml          # Production Docker Compose for Coolify
└── README.md
```

> [!WARNING]
> **กฎเหล็กเพื่อป้องกัน Merge Conflict:**  
> ไฟล์ `App.tsx` มีขนาดใหญ่และมีความซับซ้อนสูงมาก หากต้องการเพิ่มฟังก์ชันใหม่:
> 1. **ห้าม** เขียนโค้ด UI ยาวๆ ลงใน `App.tsx` โดยตรง ให้สร้างไฟล์ Component ใหม่ใน `frontend/src/components/` เสมอ
> 2. แยกฟังก์ชัน Logic หรือ API Calls ออกไปไว้ใน Custom Hook ภายใต้โฟลเดอร์ `frontend/src/hooks/`
> 3. ทำการ Import เฉพาะ Component ย่อยเข้ามาเรียกใช้ใน `App.tsx`

---

## 4. มาตรฐานการทำงานกับ Git และกระบวนการเปิด PR

### 4.1 แผนผังสาขาการทำงาน (Branching Strategy)
```text
  main (Production) ───────────────────────────────────► [Live Release]
    ▲
    │ (Merge via PR only - Requires QA & Review)
  develop (Staging) ───────────────────────────────────► [Staging Deploy]
    ▲
    ├─────── feat/custom-llm-node (Dev A)
    └─────── fix/sse-reconnect    (Dev B)
```

1. **`main`**: มีไว้สำหรับ Production เท่านั้น (ห้าม Push เข้าโดยตรง)
2. **`develop`**: สาขาหลักสำหรับรวมงานที่พร้อมทดสอบบน Staging
3. **`feat/<feature-name>`**: สาขาแยกสำหรับพัฒนาฟีเจอร์ใหม่
4. **`fix/<bug-name>`**: สาขาแยกสำหรับแก้ปัญหาเฉพาะจุด

---

### 4.2 มาตรฐานข้อความ Commit (Conventional Commits)
ให้ขึ้นต้นข้อความการ Commit ด้วย Prefix ดังต่อไปนี้:
* `feat:` เพิ่มฟังก์ชันหรือฟีเจอร์ใหม่ (เช่น `feat: add export workflow to json button`)
* `fix:` แก้ไขบักหรือข้อผิดพลาด (เช่น `fix: handle null owner_id in workflow response`)
* `refactor:` ปรับปรุงโครงสร้างโค้ดโดยไม่เปลี่ยนผลลัพธ์ (เช่น `refactor: split canvas header into separate component`)
* `test:` เพิ่มหรือแก้ไขชุดทดสอบ (เช่น `test: add rbac operator permission case`)
* `docs:` แก้ไขหรือเพิ่มเติมเอกสารประกอบ

---

### 4.3 Checklist ก่อนการเปิด Pull Request (PR Verification)
ก่อนส่ง Pull Request ขอให้ตรวจสอบสิ่งเหล่านี้ทุกครั้ง:

- [ ] รันชุดทดสอบ Backend ผ่านครบถ้วน 100%:
  ```bash
  cd backend_fastapi && uv run pytest
  ```
- [ ] ตรวจสอบความถูกต้องของ Types ใน Frontend:
  ```bash
  cd frontend && npx tsc -b
  ```
- [ ] ทดสอบ Build Frontend ว่าไม่มีข้อผิดพลาด:
  ```bash
  cd frontend && npm run build
  ```
- [ ] ตรวจสอบว่าไม่มี API Keys หรือ Secrets ติดเข้าไปใน Commit

---

## 5. ระบบควบคุมสิทธิ์ RBAC สำหรับนักพัฒนา

ระบบใช้โครงสร้าง 5-Tier RBAC ดังนี้:
1. `superadmin`: ผู้ดูแลระบบสูงสุด
2. `admin`: ผู้จัดการระบบ
3. `builder`: ผู้สร้างและแก้ไข Workflow ของตนเอง
4. `operator`: เจ้าหน้าที่สั่งรัน Workflow และอัปโหลดไฟล์ (ห้ามแก้ Flow)
5. `viewer`: ผู้ตรวจสอบ ดูผัง Flow และสถิติแบบ Read-only (ห้ามรัน/ห้ามแก้)

### 5.1 การใช้งาน Guard ใน Backend FastAPI
```python
from app.routers.auth import require_role, get_current_user
from app.models.user import User

# คุ้มครอง Endpoint เฉพาะ Superadmin และ Admin
@router.post("/api/admin-only-action")
async def admin_action(current_user: User = Depends(require_role("superadmin", "admin"))):
    return {"message": "Success"}

# คุ้มครอง Endpoint สำหรับผู้สร้าง Workflow
@router.post("/api/workflows")
async def create_wf(current_user: User = Depends(require_role("superadmin", "admin", "builder"))):
    # บันทึก owner_id เป็น current_user.id เสมอ
    pass
```

### 5.2 การควบคุมการแสดงผลบน Frontend
```tsx
// ตรวจสอบสิทธิ์ก่อนแสดงปุ่มสำคัญ
{(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
  <button onClick={openAdminPanel}>Admin Panel</button>
)}

// บล็อกผู้ใช้สิทธิ์ Viewer จากการสั่งรัน Flow
if (currentUser?.role === 'viewer') {
  showAlert('Role: Viewer (Read-only)', 'คุณไม่มีสิทธิ์สั่งรัน Workflow', 'error');
  return;
}
```

---

## 6. การทดสอบระบบและการประกันคุณภาพ (QA)

### 6.1 การรัน Backend Tests
```bash
cd backend_fastapi
uv run pytest                          # รันชุดทดสอบทั้งหมด
uv run pytest tests/test_rbac.py       # รันเฉพาะเทส RBAC
uv run pytest -v -s                    # รันแบบแสดงผลละเอียด
```

### 6.2 บัญชีสำหรับการทดสอบจำลองบทบาท
| Username | Password | Role | พฤติกรรมที่ต้องทดสอบ |
| :--- | :--- | :--- | :--- |
| `user01` | `admin` | `superadmin` | เห็นทุกเมนู เข้า User Management ได้ ลบ Flow ได้ทุกตัว |
| `admin` | `admin123` | `admin` | เข้า User Management ได้ แต่ยกระดับเป็น superadmin ไม่ได้ |
| `builder01` | `builder123` | `builder` | สร้าง Flow ได้ แก้ Flow ตัวเองได้ ห้ามแก้ Flow คนอื่น |
| `operator01` | `operator123` | `operator` | กดรัน Flow ได้ อัปโหลดไฟล์ได้ ห้ามสร้างหรือแก้ Flow |
| `viewer01` | `viewer123` | `viewer` | ดูผังได้อย่างเดียว กดรันไม่ได้และกดบันทึกไม่ได้ |

---

## 7. การส่งขึ้นเซิร์ฟเวอร์และการทำงานกับ Coolify

### 7.1 กฎระเบียบด้านพอร์ตและ Reverse Proxy
* ในไฟล์ `docker-compose.yml` **ห้าม** ใช้ `ports: ["80:80"]` เพราะพอร์ต 80 เป็นของ Traefik Proxy บน Coolify
* ให้ใช้ **`expose: ["80"]`** สำหรับบริการ Frontend เสมอ
* การกำหนดโดเมนบน Coolify ต้องกระทำผ่านฟิลด์ `docker_compose_domains`

### 7.2 ช่องทางเข้าใช้งานระบบจริง (Live Environment)
* 🌐 **Production Web Application:** [https://aibuilder-dev.addpay.in.th](https://aibuilder-dev.addpay.in.th)
* 🛡️ **User Management Console (Deep-Link):** [https://aibuilder-dev.addpay.in.th/?modal=users](https://aibuilder-dev.addpay.in.th/?modal=users)
* 📚 **API Swagger Documentation:** [https://aibuilder-dev.addpay.in.th/docs](https://aibuilder-dev.addpay.in.th/docs)
* 🩺 **Backend Health Check:** [https://aibuilder-dev.addpay.in.th/health](https://aibuilder-dev.addpay.in.th/health)
* ⚙️ **Coolify Control Panel:** [https://coolify.addpay.in.th](https://coolify.addpay.in.th) (Project: `ai-builder`)

---
*เอกสารนี้จัดทำขึ้นเพื่อให้การทำงานร่วมกันของทีมพัฒนาเป็นไปอย่างราบรื่น ปลอดภัย และมีประสิทธิภาพสูงสุด*
