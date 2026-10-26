from typing import TypedDict, Annotated, List, Dict, Any
import operator

def merge_dicts(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    res = dict(a or {})
    res.update(b or {})
    return res

def append_list(a: List[Any], b: List[Any]) -> List[Any]:
    return list(a or []) + list(b or [])

class WorkflowState(TypedDict):
    current_run_id: str
    workflow_id: str
    active_node: str
    logs: Annotated[List[str], append_list]
    variables: Annotated[Dict[str, Any], merge_dicts]
    messages: Annotated[List[Any], append_list]

