from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class QueueFileItem(BaseModel):
    name: str
    size: int
    modified: str
    url: Optional[str] = None

class QueueFileListResponse(BaseModel):
    status: str = "success"
    files: List[QueueFileItem]
    count: int

