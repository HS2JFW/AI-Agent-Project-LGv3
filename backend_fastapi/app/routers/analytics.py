import os
from typing import List
from fastapi import APIRouter, UploadFile, File
import aiofiles
from app.config import BASE_DIR
from app.schemas.analytics import DuckDBQueryRequest, AutoTeamPlannerRequest
from app.services.analytics_service import convert_files_to_parquet, query_duckdb, auto_team_planner

router = APIRouter(prefix="/api/analytics", tags=["Big Data & Analytics"])

TEMP_UPLOAD_DIR = os.path.join(BASE_DIR, "workflow_inputs", "temp_analytics")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

PARQUET_OUTPUT_DIR = os.path.join(BASE_DIR, "workflow_inputs", "parquet_cache")
os.makedirs(PARQUET_OUTPUT_DIR, exist_ok=True)

@router.post("/convert-parquet", summary="แปลงไฟล์ Excel/CSV เป็น Apache Parquet ด้วย Polars")
async def convert_to_parquet_endpoint(files: List[UploadFile] = File(...)):
    saved_paths = []
    for f in files:
        target_path = os.path.join(TEMP_UPLOAD_DIR, f.filename)
        async with aiofiles.open(target_path, "wb") as out:
            await out.write(await f.read())
        saved_paths.append(target_path)

    result = convert_files_to_parquet(saved_paths, PARQUET_OUTPUT_DIR)
    return result

@router.post("/duckdb-query", summary="รันคำสั่ง SQL บนไฟล์ Parquet ด้วย DuckDB")
async def run_duckdb_query(payload: DuckDBQueryRequest):
    result = query_duckdb(payload.query, payload.parquet_path)
    return result

@router.post("/auto-team-planner", summary="สร้าง Multi-Agent Team อัตโนมัติจาก Schema และเป้าหมาย")
async def plan_team(payload: AutoTeamPlannerRequest):
    result = auto_team_planner(payload.catalog, payload.objective)
    return result

