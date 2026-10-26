# AI Agent Visual Workflow - FastAPI & Swagger Backend

Backend ประสิทธิภาพสูง พัฒนาด้วย **Python FastAPI**, **LangGraph Python**, **Polars**, **DuckDB** และเอกสาร API แบบโต้ตอบอัตโนมัติด้วย **Swagger UI**

---

## จุดเด่นของระบบใหม่ (FastAPI + Swagger)

1. **Interactive Swagger Documentation**:
   - หน้า Swagger UI: `http://localhost:8001/docs`
   - หน้า ReDoc: `http://localhost:8001/redoc`
   - ทดสอบส่งคำขอ (Try it out), อัปโหลดไฟล์ PDF/Excel, และดูผลลัพธ์ JSON ได้โดยตรงบนเบราว์เซอร์
2. **Native LangGraph (Python)**:
   - รัน State Machine, Conditional Loop (`hasNext`), และ Branching Audit บน Python โดยตรง
3. **In-Memory Analytics**:
   - ใช้งาน **Polars** และ **DuckDB** ประมวลผล Parquet โดยตรงบนหน่วยความจำ ไม่ต้องผ่าน Subprocess IPC
4. **Real-time Server-Sent Events (SSE)**:
   - สตรีมสถานะ Node และ Log ไปแสดงผลบน React Flow Canvas แบบ 100% Backward Compatible

---

## วิธีการติดตั้งและเริ่มใช้งาน

### 1. ติดตั้ง Dependencies
```bash
cd backend_fastapi
pip install -r requirements.txt
```

### 2. รันเซิร์ฟเวอร์
```bash
python run.py
```
หรือใช้คำสั่ง Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## การเชื่อมต่อกับ Frontend (React Flow)
Frontend (`frontend/`) จะชี้มาที่พอร์ต `8001` โดยอัตโนมัติ และสามารถใช้งานฟังก์ชันเดิมได้ครบทุกอย่าง:
- การสร้าง/แก้ไข/บันทึก Workflow
- การอัปโหลดไฟล์เข้า PDF / TXT / ZIP Queue
- การกด Run Workflow และดู Real-time Log Stream
- การทดสอบรันเฉพาะโหนดเดี่ยว

