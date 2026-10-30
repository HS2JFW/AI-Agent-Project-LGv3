# แผนปฏิบัติการเร่งด่วนเพื่อการขยายทีมพัฒนา (Executive Action Checklist)
**โครงการ:** AI Agent Visual Workflow Builder (LGv3)  
**เป้าหมาย:** เตรียมความพร้อมรองรับทีม Developer หลายคนเข้ามาร่วมพัฒนาระบบพร้อมกันได้อย่างมีประสิทธิภาพ ปลอดภัย และไร้รอยต่อ  
**ระดับความสำคัญ:** สูงสุด (Mission-Critical)  
**วันที่จัดทำ:** 30 ตุลาคม 2026  

---

## 🎯 1. วัตถุประสงค์และหลักการสำคัญ (Objectives)

การขยายทีมพัฒนาจากผู้พัฒนาคนเดียว (Solo Dev) สู่การทำงานร่วมกันเป็นทีม (Multi-Developer Team) มีความท้าทายหลัก 3 ประการที่ต้องแก้ไขอย่างเร่งด่วน:
1. **ป้องกันปัญหาการชนกันของโค้ด (Merge Conflicts):** โครงสร้างไฟล์ Frontend ปัจจุบันยังรวมศูนย์อยู่ที่ `App.tsx` หากมีผู้พัฒนามากกว่า 1 คนแก้ไขพร้อมกัน จะเกิดปัญหาการรวมโค้ดที่รุนแรง
2. **รักษาเสถียรภาพของระบบบน Production:** ทุกการเปลี่ยนแปลงต้องผ่านการทดสอบอัตโนมัติ (Automated CI) และการตรวจสอบโค้ด (Peer Review) ก่อนขึ้นระบบจริงเสมอ
3. **ลดเวลาเริ่มต้นทำงานของทีมงานใหม่ (Onboarding Time):** นักพัฒนาใหม่ทุกคนต้องสามารถ Clone โค้ดและรันระบบบนเครื่องตัวเองได้สำเร็จภายในเวลาไม่เกิน 10 นาที

---

## 📊 2. ตารางแผนปฏิบัติการเร่งด่วน (Urgent Action Matrix)

| ลำดับ | รายการงาน (Action Item) | ผลกระทบหากไม่ทำ | ผู้รับผิดชอบ (Role) | ระยะเวลา | ระดับความเร่งด่วน |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **ACT-01** | **Refactor สลายไฟล์ `App.tsx` ออกเป็นโมดูลย่อย** | เกิด Git Conflict รุนแรงทันทีที่มี Dev เข้ามามากกว่า 1 คน | Lead Frontend Dev | 3 - 5 วัน | 🔴 **เร่งด่วนสูงสุด (P0)** |
| **ACT-02** | **กำหนดนโยบาย Git Branching & Protection Rules** | เสี่ยงที่โค้ดบักหรือโค้ดที่ยังไม่พร้อมจะถูก Push ขึ้น Production ตรงๆ | Tech Lead | 1 วัน | 🔴 **เร่งด่วนสูงสุด (P0)** |
| **ACT-03** | **ติดตั้งระบบ Automated CI (GitHub Actions)** | ต้องคอยรันเทสด้วยมือ เสี่ยงบักหลุดรอดเข้าสู่ระบบหลัก | DevOps / QA | 1 - 2 วัน | 🟡 **สูง (P1)** |
| **ACT-04** | **จัดเตรียม Docker Development Environment** | Dev ใหม่เสียเวลาติดตั้ง Dependency นาน และสภาพแวดล้อมไม่ตรงกัน | DevOps / Backend | 1 - 2 วัน | 🟡 **สูง (P1)** |
| **ACT-05** | **แยกเซิร์ฟเวอร์ Staging ออกจาก Production บน Coolify** | การทดสอบฟังก์ชันใหม่จะรบกวนการใช้งานของผู้ใช้จริง | Infra / DevOps | 1 วัน | 🟡 **สูง (P1)** |
| **ACT-06** | **วางโครงสร้าง Database Migration ด้วย Alembic** | เกิดข้อผิดพลาดของ Schema เมื่อฐานข้อมูลมีความซับซ้อนขึ้น | Lead Backend Dev | 2 - 3 วัน | 🟢 **ปานกลาง (P2)** |

---

## 📝 3. รายละเอียดขั้นตอนการลงมือปฏิบัติ (Action Item Breakdown)

### 🔴 ACT-01: Refactor สลายไฟล์ `App.tsx` เป็นโมดูลย่อย (Critical)
* **สถานะปัจจุบัน:** ไฟล์ `frontend/src/App.tsx` มีขนาด 27,000+ บรรทัด รวบรวมทั้ง Canvas, Toolbar, Inspector, Modals, State, และ Handlers ไว้ในไฟล์เดียว
* **ขั้นตอนการปฏิบัติ:**
  1. สร้างโฟลเดอร์ `frontend/src/components/canvas/` แยก Component:
     - `CanvasWorkspace.tsx`: พื้นที่วาง React Flow
     - `CanvasHeader.tsx`: หัวข้อด้านบน, สถานะรัน, Profile Capsule
     - `CanvasControls.tsx`: แถบเครื่องมือซูม, จัดระเบียบผัง
  2. สร้างโฟลเดอร์ `frontend/src/components/sidebars/` แยก:
     - `LeftToolRail.tsx`: แถบเมนูด้านซ้ายล่าง (ปุ่ม RBAC, Settings, Logout)
     - `NodePaletteDrawer.tsx`: รายการประเภทโหนดสำหรับลากลง Canvas
  3. สร้างโฟลเดอร์ `frontend/src/components/panels/` แยก:
     - `PropertiesInspector.tsx`: แถบตั้งค่า Parameter ของโหนดที่เลือก
     - `ExecutionLogViewer.tsx`: หน้าต่างสตรีม Logs แบบเรียลไทม์
  4. สร้าง Custom Hooks ใน `frontend/src/hooks/` เพื่อแยก Logic:
     - `useFlowNodes.ts`, `useWorkflowSync.ts`, `useSSEStream.ts`
* **เกณฑ์การผ่าน (Definition of Done):** ไฟล์ `App.tsx` มีขนาดลดลงเหลือไม่เกิน 500 บรรทัด ทำหน้าที่เป็นตัวประกอบ Layout หลักเท่านั้น

---

### 🔴 ACT-02: กำหนดนโยบาย Git Branching & Protection Rules (Critical)
* **ขั้นตอนการปฏิบัติ:**
  1. สร้างกติกา Branching Model:
     - `main`: ผูกเข้ากับ Production Deployment (Protected)
     - `develop`: ผูกเข้ากับ Staging Deployment (Protected)
     - `feat/<name>`: แตกออกจาก `develop` สำหรับฟังก์ชันใหม่
     - `fix/<name>`: แตกออกมาแก้บัก
  2. ตั้งค่า **Branch Protection Rules บน GitHub**:
     - บังคับเปิด Pull Request (Require a pull request before merging)
     - บังคับมี Approvals จาก Reviewer อย่างน้อย 1 คน
     - บังคับให้ Status Checks (CI Tests) ผ่านเป็นสีเขียว 100%
     - ล็อกไม่ให้ Bypass สิทธิ์ แม้กระทั่ง Admin (Include administrators)
* **เกณฑ์การผ่าน:** ห้ามบุคคลใดสามารถรัน `git push origin main` ได้โดยตรง

---

### 🟡 ACT-03: ติดตั้งระบบ Automated CI Pipeline ผ่าน GitHub Actions
* **ขั้นตอนการปฏิบัติ:**
  1. สร้างไฟล์ `.github/workflows/ci.yml` ให้ทำงานอัตโนมัติทุกครั้งที่เปิด Pull Request:
     - **Job 1 (Backend Quality Gate):** ติดตั้ง Python 3.11, รัน `uv sync`, และรัน `uv run pytest` (ตรวจสอบ 24/24 Test Suites)
     - **Job 2 (Frontend Quality Gate):** ติดตั้ง Node.js 20, รัน `npm ci`, รัน `npx tsc -b` (Type Checking) และ `npm run build`
  2. ผูกผลลัพธ์ของ CI เข้ากับเงื่อนไขการ Merge ของ GitHub
* **เกณฑ์การผ่าน:** Pull Request ที่มี Type Error หรือรัน Test ไม่ผ่าน จะถูกบล็อกปุ่ม Merge อัตโนมัติ

---

### 🟡 ACT-04: จัดเตรียม Docker Development Environment & Secrets
* **ขั้นตอนการปฏิบัติ:**
  1. สร้างไฟล์ `docker-compose.dev.yml` ที่เปิดการ Mount Volume โค้ดสดเข้าคอนเทนเนอร์เพื่อให้รองรับ Hot-Reload
  2. จัดทำไฟล์ `.env.example` ทั้งฝั่ง Backend และ Frontend ที่บันทึกรายชื่อ Key ระบบทั้งหมดไว้ครบถ้วน
  3. กำหนดให้ไฟล์ `.gitignore` บล็อกไฟล์ `.env`, `*.db`, และโฟลเดอร์ temp queues อย่างรัดกุม
* **เกณฑ์การผ่าน:** Developer ใหม่สามารถรัน `docker compose -f docker-compose.dev.yml up` แล้วเปิดระบบได้ทันที

---

### 🟡 ACT-05: แยกสภาพแวดล้อม Staging บน Coolify
* **ขั้นตอนการปฏิบัติ:**
  1. เข้าสู่ Coolify Control Panel ในโปรเจกต์ `ai-builder`
  2. Clone แอปพลิเคชันเพิ่มอีก 1 ตัว ตั้งชื่อว่า `ai-builder-staging`
  3. กำหนด Branch เป็น `develop`
  4. ผูกโดเมนย่อย: `https://aibuilder-staging.addpay.in.th`
  5. ทดสอบการ Deploy อัตโนมัติเมื่อมีโค้ด Merge เข้า `develop`
* **เกณฑ์การผ่าน:** มีระบบ Staging แยกอิสระสำหรับทดสอบก่อนขึ้น Production

---

### 🟢 ACT-06: วางรากฐาน Database Migration ด้วย Alembic
* **ขั้นตอนการปฏิบัติ:**
  1. ติดตั้ง `alembic` ใน `backend_fastapi`
  2. ผูก `Base.metadata` เข้ากับ `alembic/env.py`
  3. สร้าง Migration Revision แรกสำหรับการสร้างตารางและคอลัมน์ RBAC
  4. จัดทำคู่มือคำสั่ง `alembic upgrade head` ให้ทีมงาน
* **เกณฑ์การผ่าน:** การปรับ Schema ฐานข้อมูลในอนาคตกระทำผ่าน Script Revision มีประวัติ Versioning ควบคุม 100%

---

## 🛡️ 4. ตารางประเมินความเสี่ยงและแผนรับมือ (Risk Mitigation Matrix)

| ความเสี่ยง (Risk Event) | โอกาสเกิด | ผลกระทบ | แผนรับมือเชิงป้องกัน (Mitigation Strategy) |
| :--- | :---: | :---: | :--- |
| **Merge Conflict ใน `App.tsx`** | สูงมาก (95%) | วิกฤต | เร่งทำ ACT-01 สลายโมดูลให้เสร็จก่อนเริ่มรับ Dev ใหม่ |
| **บั๊กหรือข้อผิดพลาดหลุดขึ้นระบบจริง** | ปานกลาง (50%) | สูง | ติดตั้ง CI Quality Gate (ACT-03) และแยก Staging (ACT-05) |
| **API Keys หรือรหัสผ่านรั่วไหลลง Git** | ปานกลาง (40%) | สูง | ใช้ `.env.example` และตั้งค่า Pre-commit Hook สแกน Secrets |
| **ข้อมูลบน Production เสียหายขณะปรับ Database** | ต่ำ (20%) | วิกฤต | มีระบบ Auto-Migration + Backup ฐานข้อมูลอัตโนมัติบน Coolify |

---

## 📅 5. แผนภูมิระยะเวลาดำเนินการ 4 สัปดาห์ (4-Week Implementation Roadmap)

```text
สัปดาห์ที่ 1 ────────────────────────► วางรากฐานระบบ
  [ACT-02] กำหนด Git Branching Rules & Setup Repositories
  [ACT-03] ติดตั้ง GitHub Actions Automated CI Pipeline
  [ACT-04] จัดทำ docker-compose.dev.yml & .env.example

สัปดาห์ที่ 2 ────────────────────────► ปรับปรุงโครงสร้างสถาปัตยกรรมโค้ด
  [ACT-01] Refactor แยกชิ้นส่วน App.tsx สู่โฟลเดอร์ components/ และ hooks/
  [ACT-06] วางระบบ Alembic Database Migration

สัปดาห์ที่ 3 ────────────────────────► เตรียมสภาพแวดล้อมและทดสอบจำลอง
  [ACT-05] ตั้งค่าระบบ Coolify Staging Server (aibuilder-staging)
  [ONBOARD] เชิญ Developer กลุ่มแรกเข้ามาทดสอบ Flow การทำงานตามคู่มือ

สัปดาห์ที่ 4 ────────────────────────► เริ่มต้นการทำงานแบบทีมเต็มรูปแบบ
  [SPRINT] เริ่ม Sprint แรก แบ่งงานผ่าน Task Board (Linear / GitHub Projects)
  [REVIEW] ปฏิบัติตามมาตรฐาน Code Review และ Deploy รอบ Staging -> Production
```

---

## 🏆 6. ดัชนีชี้วัดความสำเร็จ (Key Performance Indicators)

1. **Zero Conflict Rate on Main:** ไม่เกิดความขัดแย้งของโค้ดบนสาขา `main` จากการแยกขอบเขตงานชัดเจน
2. **100% Test Pass Guarantee:** ทุกฟังก์ชันใหม่ต้องมี Unit Test กำกับ และผลการรัน Pytest ผ่าน 100%
3. **Developer Setup Time < 15 Mins:** นักพัฒนาใหม่สามารถ Clone และรันโปรเจกต์ได้สำเร็จในเวลาไม่เกิน 15 นาที
4. **Zero Production Downtime:** การอัปเดตระบบขึ้น Production ไม่เกิด Downtime และข้อมูลผู้ใช้เดิมไม่สูญหาย

---
*เอกสารนี้จัดทำขึ้นเพื่อใช้เป็นแนวทางปฏิบัติการอย่างเป็นทางการในการขยายทีมพัฒนา AI Agent Visual Workflow Builder*
