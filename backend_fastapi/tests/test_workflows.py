import json
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_workflows(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/workflows", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_create_get_update_delete_workflow_lifecycle(client: AsyncClient, auth_headers: dict):
    # 1. Create Workflow
    payload = {
        "name": "Integration Test Pipeline",
        "description": "Pytest workflow creation test",
        "nodes": [
            {"id": "node-1", "type": "customNode", "position": {"x": 100, "y": 100}, "data": {"label": "PDF OCR"}},
            {"id": "node-2", "type": "customNode", "position": {"x": 300, "y": 100}, "data": {"label": "LLM Audit"}}
        ],
        "edges": [
            {"id": "edge-1", "source": "node-1", "target": "node-2"}
        ]
    }
    create_res = await client.post("/api/workflows", json=payload, headers=auth_headers)
    assert create_res.status_code in [200, 201]
    created = create_res.json()
    wf_id = created["id"]
    assert created["name"] == "Integration Test Pipeline"

    # 2. Get Workflow by ID
    get_res = await client.get(f"/api/workflows/{wf_id}", headers=auth_headers)
    assert get_res.status_code == 200
    fetched = get_res.json()
    assert fetched["id"] == wf_id
    nodes_data = json.loads(fetched["nodes"]) if isinstance(fetched["nodes"], str) else fetched["nodes"]
    edges_data = json.loads(fetched["edges"]) if isinstance(fetched["edges"], str) else fetched["edges"]
    assert len(nodes_data) == 2
    assert len(edges_data) == 1

    # 3. Update Workflow
    update_payload = {
        "name": "Updated Test Pipeline",
        "description": "Updated description",
        "nodes": nodes_data,
        "edges": edges_data
    }
    update_res = await client.put(f"/api/workflows/{wf_id}", json=update_payload, headers=auth_headers)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Updated Test Pipeline"

    # 4. Delete Workflow
    del_res = await client.delete(f"/api/workflows/{wf_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # 5. Confirm Workflow is deleted (404)
    get_after_del = await client.get(f"/api/workflows/{wf_id}", headers=auth_headers)
    assert get_after_del.status_code == 404

@pytest.mark.asyncio
async def test_get_nonexistent_workflow(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/workflows/non-existent-uuid-12345", headers=auth_headers)
    assert response.status_code == 404
