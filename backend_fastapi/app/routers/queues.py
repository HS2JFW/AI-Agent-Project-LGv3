import os
import shutil
from typing import List
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional
from app.models.user import User
from app.routers.auth import get_current_active_user_optional
from fastapi.responses import FileResponse
import aiofiles
from app.config import (
    QUEUE_PDF_TEMP_DIR, QUEUE_TXT_TEMP_DIR, QUEUE_ZIP_TEMP_DIR, AGENT_OUTPUTS_DIR
)
from app.schemas.queue import QueueFileListResponse, QueueFileItem

router = APIRouter(tags=["File Queues"])

def get_directory_files(directory: str) -> List[QueueFileItem]:
    if not os.path.exists(directory):
        return []
    items = []
    for f in sorted(os.listdir(directory)):
        if f.startswith("."):
            continue
        p = os.path.join(directory, f)
        if os.path.isfile(p):
            stat = os.stat(p)
            items.append(QueueFileItem(
                name=f,
                size=stat.st_size,
                modified=datetime.fromtimestamp(stat.st_mtime).isoformat()
            ))
    return items

def clear_directory(directory: str):
    if os.path.exists(directory):
        for f in os.listdir(directory):
            p = os.path.join(directory, f)
            if os.path.isfile(p):
                os.remove(p)
            elif os.path.isdir(p):
                shutil.rmtree(p)

# PDF Queue
@router.post("/api/upload-pdf-queue", summary="อัปโหลดไฟล์ PDF เข้าสู่คิว")
async def upload_pdf_queue(files: List[UploadFile] = File(...), current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot upload files to queue")
    uploaded = []
    for file in files:
        target_path = os.path.join(QUEUE_PDF_TEMP_DIR, file.filename)
        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        uploaded.append(file.filename)
    return {"status": "success", "uploaded": uploaded, "count": len(uploaded)}

@router.get("/api/list-pdf-queue", response_model=QueueFileListResponse, summary="เรียกดูรายการไฟล์ PDF ในคิว")
async def list_pdf_queue():
    files = get_directory_files(str(QUEUE_PDF_TEMP_DIR))
    return {"status": "success", "files": files, "count": len(files)}

@router.delete("/api/clear-pdf-queue", summary="ล้างไฟล์ PDF ในคิวทั้งหมด")
async def clear_pdf_queue(current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear queue")
    clear_directory(str(QUEUE_PDF_TEMP_DIR))
    return {"status": "success", "message": "PDF Queue cleared"}

@router.get("/api/queue-pdf/{filename}", summary="ดึงไฟล์ PDF จากคิว")
async def get_queue_pdf(filename: str):
    path = os.path.join(QUEUE_PDF_TEMP_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf")

# TXT Queue
@router.post("/api/upload-txt-queue", summary="อัปโหลดไฟล์ Text เข้าสู่คิว")
async def upload_txt_queue(files: List[UploadFile] = File(...), current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot upload files to queue")
    uploaded = []
    for file in files:
        target_path = os.path.join(QUEUE_TXT_TEMP_DIR, file.filename)
        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        uploaded.append(file.filename)
    return {"status": "success", "uploaded": uploaded, "count": len(uploaded)}

@router.get("/api/list-txt-queue", response_model=QueueFileListResponse, summary="เรียกดูรายการไฟล์ Text ในคิว")
async def list_txt_queue():
    files = get_directory_files(str(QUEUE_TXT_TEMP_DIR))
    return {"status": "success", "files": files, "count": len(files)}

@router.delete("/api/clear-txt-queue", summary="ล้างไฟล์ Text ในคิวทั้งหมด")
async def clear_txt_queue(current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear queue")
    clear_directory(str(QUEUE_TXT_TEMP_DIR))
    return {"status": "success", "message": "TXT Queue cleared"}

@router.get("/api/queue-txt/{filename}", summary="ดึงไฟล์ Text จากคิว")
async def get_queue_txt(filename: str):
    path = os.path.join(QUEUE_TXT_TEMP_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="text/plain")

# ZIP Queue
@router.post("/api/upload-zip-queue", summary="อัปโหลดไฟล์ ZIP เข้าสู่คิว")
async def upload_zip_queue(files: List[UploadFile] = File(...), current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot upload files to queue")
    uploaded = []
    for file in files:
        target_path = os.path.join(QUEUE_ZIP_TEMP_DIR, file.filename)
        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        uploaded.append(file.filename)
    return {"status": "success", "uploaded": uploaded, "count": len(uploaded)}

@router.get("/api/list-zip-queue", response_model=QueueFileListResponse, summary="เรียกดูรายการไฟล์ ZIP ในคิว")
async def list_zip_queue():
    files = get_directory_files(str(QUEUE_ZIP_TEMP_DIR))
    return {"status": "success", "files": files, "count": len(files)}

@router.delete("/api/clear-zip-queue", summary="ล้างไฟล์ ZIP ในคิวทั้งหมด")
async def clear_zip_queue(current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear queue")
    clear_directory(str(QUEUE_ZIP_TEMP_DIR))
    return {"status": "success", "message": "ZIP Queue cleared"}

# Agent Results
@router.get("/api/agent-result/{filename}", summary="ดาวน์โหลดไฟล์ผลลัพธ์ของ Agent")
async def get_agent_result(filename: str):
    # Search recursively in AGENT_OUTPUTS_DIR
    for root, _, files in os.walk(AGENT_OUTPUTS_DIR):
        if filename in files:
            return FileResponse(os.path.join(root, filename))
    raise HTTPException(status_code=404, detail="Result file not found")

@router.post("/api/clear-agent-results", summary="ล้างผลลัพธ์ของ Agent ทั้งหมด")
async def clear_agent_results(current_user: Optional[User] = Depends(get_current_active_user_optional)):
    if current_user and current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear agent results")
    clear_directory(str(AGENT_OUTPUTS_DIR))
    return {"status": "success", "message": "Agent outputs cleared"}

