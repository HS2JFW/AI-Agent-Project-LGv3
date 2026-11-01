import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
import aiofiles

from app.models.user import User
from app.routers.auth import get_current_user, get_current_active_user_optional
from app.config import (
    QUEUE_PDF_TEMP_DIR, QUEUE_TXT_TEMP_DIR, QUEUE_ZIP_TEMP_DIR, AGENT_OUTPUTS_DIR
)
from app.schemas.queue import QueueFileListResponse, QueueFileItem

router = APIRouter(tags=["File Queues"])

def get_user_queue_dir(base_dir: str, user_id: Optional[str] = None) -> str:
    """
    Returns user-scoped directory path under base_dir.
    If user_id is provided, creates and returns base_dir / user_id.
    Otherwise returns base_dir.
    """
    if user_id:
        user_path = os.path.join(base_dir, str(user_id))
        os.makedirs(user_path, exist_ok=True)
        return user_path
    return base_dir

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

# ============================================================================
# PDF Queue
# ============================================================================
@router.post("/api/upload-pdf-queue", summary="อัปโหลดไฟล์ PDF เข้าสู่คิว")
async def upload_pdf_queue(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot upload files to queue")
    
    target_dir = get_user_queue_dir(str(QUEUE_PDF_TEMP_DIR), current_user.id)
    uploaded = []
    for file in files:
        target_path = os.path.join(target_dir, file.filename)
        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        uploaded.append(file.filename)
    return {"status": "success", "uploaded": uploaded, "count": len(uploaded)}

@router.get("/api/list-pdf-queue", response_model=QueueFileListResponse, summary="เรียกดูรายการไฟล์ PDF ในคิว")
async def list_pdf_queue(
    current_user: Optional[User] = Depends(get_current_active_user_optional)
):
    user_id = current_user.id if current_user else None
    if user_id:
        user_dir = get_user_queue_dir(str(QUEUE_PDF_TEMP_DIR), user_id)
        files = get_directory_files(user_dir)
        if not files:
            base_files = get_directory_files(str(QUEUE_PDF_TEMP_DIR))
            if base_files:
                files = base_files
    else:
        files = get_directory_files(str(QUEUE_PDF_TEMP_DIR))
    return {"status": "success", "files": files, "count": len(files)}

@router.delete("/api/clear-pdf-queue", summary="ล้างไฟล์ PDF ในคิวทั้งหมด")
async def clear_pdf_queue(
    current_user: User = Depends(get_current_user),
    all_users: bool = False
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear queue")
    
    if all_users and current_user.role in ['superadmin', 'admin']:
        clear_directory(str(QUEUE_PDF_TEMP_DIR))
    else:
        user_dir = get_user_queue_dir(str(QUEUE_PDF_TEMP_DIR), current_user.id)
        clear_directory(user_dir)
        if current_user.role in ['superadmin', 'admin']:
            # Also clean stray root files if admin clears
            for f in os.listdir(str(QUEUE_PDF_TEMP_DIR)):
                p = os.path.join(str(QUEUE_PDF_TEMP_DIR), f)
                if os.path.isfile(p):
                    os.remove(p)
    return {"status": "success", "message": "PDF Queue cleared"}

@router.delete("/api/delete-pdf-queue", summary="ลบไฟล์ PDF รายการเดี่ยวจากคิว")
async def delete_pdf_queue(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot delete queue files")
    
    user_path = os.path.join(get_user_queue_dir(str(QUEUE_PDF_TEMP_DIR), current_user.id), filename)
    if os.path.exists(user_path) and os.path.isfile(user_path):
        os.remove(user_path)
        return {"status": "success", "message": f"Deleted {filename}"}
    
    base_path = os.path.join(str(QUEUE_PDF_TEMP_DIR), filename)
    if os.path.exists(base_path) and os.path.isfile(base_path):
        os.remove(base_path)
        return {"status": "success", "message": f"Deleted {filename}"}

    raise HTTPException(status_code=404, detail="File not found")

@router.get("/api/queue-pdf/{filename}", summary="ดึงไฟล์ PDF จากคิว")
async def get_queue_pdf(
    filename: str,
    current_user: Optional[User] = Depends(get_current_active_user_optional)
):
    user_id = current_user.id if current_user else None
    if user_id:
        user_path = os.path.join(get_user_queue_dir(str(QUEUE_PDF_TEMP_DIR), user_id), filename)
        if os.path.exists(user_path) and os.path.isfile(user_path):
            return FileResponse(user_path, media_type="application/pdf")
    
    base_path = os.path.join(str(QUEUE_PDF_TEMP_DIR), filename)
    if os.path.exists(base_path) and os.path.isfile(base_path):
        return FileResponse(base_path, media_type="application/pdf")
        
    for root, _, files in os.walk(str(QUEUE_PDF_TEMP_DIR)):
        if filename in files:
            return FileResponse(os.path.join(root, filename), media_type="application/pdf")

    raise HTTPException(status_code=404, detail="File not found")

# ============================================================================
# TXT Queue
# ============================================================================
@router.post("/api/upload-txt-queue", summary="อัปโหลดไฟล์ Text เข้าสู่คิว")
async def upload_txt_queue(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot upload files to queue")
    
    target_dir = get_user_queue_dir(str(QUEUE_TXT_TEMP_DIR), current_user.id)
    uploaded = []
    for file in files:
        target_path = os.path.join(target_dir, file.filename)
        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        uploaded.append(file.filename)
    return {"status": "success", "uploaded": uploaded, "count": len(uploaded)}

@router.get("/api/list-txt-queue", response_model=QueueFileListResponse, summary="เรียกดูรายการไฟล์ Text ในคิว")
async def list_txt_queue(
    current_user: Optional[User] = Depends(get_current_active_user_optional)
):
    user_id = current_user.id if current_user else None
    if user_id:
        user_dir = get_user_queue_dir(str(QUEUE_TXT_TEMP_DIR), user_id)
        files = get_directory_files(user_dir)
        if not files:
            base_files = get_directory_files(str(QUEUE_TXT_TEMP_DIR))
            if base_files:
                files = base_files
    else:
        files = get_directory_files(str(QUEUE_TXT_TEMP_DIR))
    return {"status": "success", "files": files, "count": len(files)}

@router.delete("/api/clear-txt-queue", summary="ล้างไฟล์ Text ในคิวทั้งหมด")
async def clear_txt_queue(
    current_user: User = Depends(get_current_user),
    all_users: bool = False
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear queue")
    
    if all_users and current_user.role in ['superadmin', 'admin']:
        clear_directory(str(QUEUE_TXT_TEMP_DIR))
    else:
        user_dir = get_user_queue_dir(str(QUEUE_TXT_TEMP_DIR), current_user.id)
        clear_directory(user_dir)
        if current_user.role in ['superadmin', 'admin']:
            for f in os.listdir(str(QUEUE_TXT_TEMP_DIR)):
                p = os.path.join(str(QUEUE_TXT_TEMP_DIR), f)
                if os.path.isfile(p):
                    os.remove(p)
    return {"status": "success", "message": "TXT Queue cleared"}

@router.delete("/api/delete-txt-queue", summary="ลบไฟล์ Text รายการเดี่ยวจากคิว")
async def delete_txt_queue(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot delete queue files")
    
    user_path = os.path.join(get_user_queue_dir(str(QUEUE_TXT_TEMP_DIR), current_user.id), filename)
    if os.path.exists(user_path) and os.path.isfile(user_path):
        os.remove(user_path)
        return {"status": "success", "message": f"Deleted {filename}"}
    
    base_path = os.path.join(str(QUEUE_TXT_TEMP_DIR), filename)
    if os.path.exists(base_path) and os.path.isfile(base_path):
        os.remove(base_path)
        return {"status": "success", "message": f"Deleted {filename}"}

    raise HTTPException(status_code=404, detail="File not found")

@router.get("/api/queue-txt/{filename}", summary="ดึงไฟล์ Text จากคิว")
async def get_queue_txt(
    filename: str,
    current_user: Optional[User] = Depends(get_current_active_user_optional)
):
    user_id = current_user.id if current_user else None
    if user_id:
        user_path = os.path.join(get_user_queue_dir(str(QUEUE_TXT_TEMP_DIR), user_id), filename)
        if os.path.exists(user_path) and os.path.isfile(user_path):
            return FileResponse(user_path, media_type="text/plain")
            
    base_path = os.path.join(str(QUEUE_TXT_TEMP_DIR), filename)
    if os.path.exists(base_path) and os.path.isfile(base_path):
        return FileResponse(base_path, media_type="text/plain")

    for root, _, files in os.walk(str(QUEUE_TXT_TEMP_DIR)):
        if filename in files:
            return FileResponse(os.path.join(root, filename), media_type="text/plain")

    raise HTTPException(status_code=404, detail="File not found")

# ============================================================================
# ZIP Queue
# ============================================================================
@router.post("/api/upload-zip-queue", summary="อัปโหลดไฟล์ ZIP เข้าสู่คิว")
async def upload_zip_queue(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot upload files to queue")
    
    target_dir = get_user_queue_dir(str(QUEUE_ZIP_TEMP_DIR), current_user.id)
    uploaded = []
    for file in files:
        target_path = os.path.join(target_dir, file.filename)
        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
        uploaded.append(file.filename)
    return {"status": "success", "uploaded": uploaded, "count": len(uploaded)}

@router.get("/api/list-zip-queue", response_model=QueueFileListResponse, summary="เรียกดูรายการไฟล์ ZIP ในคิว")
async def list_zip_queue(
    current_user: Optional[User] = Depends(get_current_active_user_optional)
):
    user_id = current_user.id if current_user else None
    if user_id:
        user_dir = get_user_queue_dir(str(QUEUE_ZIP_TEMP_DIR), user_id)
        files = get_directory_files(user_dir)
        if not files:
            base_files = get_directory_files(str(QUEUE_ZIP_TEMP_DIR))
            if base_files:
                files = base_files
    else:
        files = get_directory_files(str(QUEUE_ZIP_TEMP_DIR))
    return {"status": "success", "files": files, "count": len(files)}

@router.delete("/api/clear-zip-queue", summary="ล้างไฟล์ ZIP ในคิวทั้งหมด")
async def clear_zip_queue(
    current_user: User = Depends(get_current_user),
    all_users: bool = False
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear queue")
    
    if all_users and current_user.role in ['superadmin', 'admin']:
        clear_directory(str(QUEUE_ZIP_TEMP_DIR))
    else:
        user_dir = get_user_queue_dir(str(QUEUE_ZIP_TEMP_DIR), current_user.id)
        clear_directory(user_dir)
        if current_user.role in ['superadmin', 'admin']:
            for f in os.listdir(str(QUEUE_ZIP_TEMP_DIR)):
                p = os.path.join(str(QUEUE_ZIP_TEMP_DIR), f)
                if os.path.isfile(p):
                    os.remove(p)
    return {"status": "success", "message": "ZIP Queue cleared"}

@router.delete("/api/delete-zip-queue", summary="ลบไฟล์ ZIP รายการเดี่ยวจากคิว")
async def delete_zip_queue(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot delete queue files")
    
    user_path = os.path.join(get_user_queue_dir(str(QUEUE_ZIP_TEMP_DIR), current_user.id), filename)
    if os.path.exists(user_path) and os.path.isfile(user_path):
        os.remove(user_path)
        return {"status": "success", "message": f"Deleted {filename}"}
    
    base_path = os.path.join(str(QUEUE_ZIP_TEMP_DIR), filename)
    if os.path.exists(base_path) and os.path.isfile(base_path):
        os.remove(base_path)
        return {"status": "success", "message": f"Deleted {filename}"}

    raise HTTPException(status_code=404, detail="File not found")

# ============================================================================
# Agent Results
# ============================================================================
@router.get("/api/list-agent-results", response_model=QueueFileListResponse, summary="เรียกดูรายการไฟล์ผลลัพธ์ของ Agent")
async def list_agent_results(
    current_user: Optional[User] = Depends(get_current_active_user_optional)
):
    user_id = current_user.id if current_user else None
    if user_id:
        user_dir = os.path.join(str(AGENT_OUTPUTS_DIR), user_id)
        if os.path.exists(user_dir):
            files = get_directory_files(user_dir)
            if files:
                return {"status": "success", "files": files, "count": len(files)}
    files = get_directory_files(str(AGENT_OUTPUTS_DIR))
    return {"status": "success", "files": files, "count": len(files)}

@router.get("/api/agent-result/{filename}", summary="ดาวน์โหลดไฟล์ผลลัพธ์ของ Agent")
async def get_agent_result(filename: str):
    # Search recursively in AGENT_OUTPUTS_DIR
    for root, _, files in os.walk(AGENT_OUTPUTS_DIR):
        if filename in files:
            return FileResponse(os.path.join(root, filename))
    raise HTTPException(status_code=404, detail="Result file not found")

@router.post("/api/clear-agent-results", summary="ล้างผลลัพธ์ของ Agent ทั้งหมด")
async def clear_agent_results(
    current_user: User = Depends(get_current_user),
    all_users: bool = False
):
    if current_user.role == 'viewer':
        raise HTTPException(status_code=403, detail="Permission denied: Role 'viewer' cannot clear agent results")
    
    if all_users and current_user.role in ['superadmin', 'admin']:
        clear_directory(str(AGENT_OUTPUTS_DIR))
    else:
        user_dir = os.path.join(str(AGENT_OUTPUTS_DIR), current_user.id)
        clear_directory(user_dir)
    return {"status": "success", "message": "Agent outputs cleared"}
