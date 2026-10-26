from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class DuckDBQueryRequest(BaseModel):
    query: str = Field(..., description="คำสั่ง SQL ที่ต้องการรัน เช่น SELECT * FROM read_parquet('...') LIMIT 10")
    parquet_path: Optional[str] = Field(None, description="Path ของไฟล์ Parquet ที่ต้องการ Query")

class AutoTeamPlannerRequest(BaseModel):
    catalog: List[Dict[str, Any]] = Field(..., description="Schema Metadata ของไฟล์ที่อัปโหลด")
    objective: Optional[str] = Field("", description="เป้าหมายหรือโจทย์การวิเคราะห์")

class ParquetConvertResponse(BaseModel):
    status: str
    catalog: List[Dict[str, Any]]
    total_rows: int
    generated_files: List[str]

