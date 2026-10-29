import pytest
from httpx import AsyncClient
from app.services.auth_service import create_access_token

def get_auth_header(username: str, role: str) -> dict:
    token = create_access_token(data={"sub": username, "role": role})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_workflow_rbac_creation_restrictions(client: AsyncClient):
    """Verify that only superadmin, admin, and builder can create workflows."""
    payload = {
        "name": "Access Control Test Flow",
        "description": "Testing RBAC creation barriers",
        "nodes": [{"id": "n1", "type": "custom", "data": {"label": "Start"}}],
        "edges": []
    }

    # 1. Viewer cannot create -> 403 Forbidden
    viewer_headers = get_auth_header("viewer01", "viewer")
    res_view = await client.post("/api/workflows", json=payload, headers=viewer_headers)
    assert res_view.status_code == 403

    # 2. Operator cannot create -> 403 Forbidden
    op_headers = get_auth_header("operator01", "operator")
    res_op = await client.post("/api/workflows", json=payload, headers=op_headers)
    assert res_op.status_code == 403

    # 3. Builder can create -> 200/201 Success
    builder_headers = get_auth_header("builder01", "builder")
    res_builder = await client.post("/api/workflows", json=payload, headers=builder_headers)
    assert res_builder.status_code in [200, 201]
    created = res_builder.json()
    assert created["name"] == "Access Control Test Flow"
    assert created["owner_id"] is not None

@pytest.mark.asyncio
async def test_workflow_ownership_isolation_between_builders(client: AsyncClient):
    """Verify that Builder A cannot edit or delete Builder B's private workflow."""
    # Create two builders
    super_headers = get_auth_header("user01", "superadmin")
    await client.post(
        "/api/users",
        json={"username": "builder_alpha", "password": "pass123", "role": "builder"},
        headers=super_headers
    )
    await client.post(
        "/api/users",
        json={"username": "builder_beta", "password": "pass123", "role": "builder"},
        headers=super_headers
    )

    alpha_headers = get_auth_header("builder_alpha", "builder")
    beta_headers = get_auth_header("builder_beta", "builder")

    # Alpha creates a private workflow
    create_res = await client.post(
        "/api/workflows",
        json={
            "name": "Alpha Private Pipeline",
            "description": "Proprietary Alpha logic",
            "is_public": False,
            "nodes": [],
            "edges": []
        },
        headers=alpha_headers
    )
    assert create_res.status_code in [200, 201]
    alpha_wf_id = create_res.json()["id"]

    # Beta attempts to read Alpha's private workflow -> 403 Forbidden
    read_res = await client.get(f"/api/workflows/{alpha_wf_id}", headers=beta_headers)
    assert read_res.status_code == 403

    # Beta attempts to update Alpha's private workflow -> 403 Forbidden
    update_res = await client.put(
        f"/api/workflows/{alpha_wf_id}",
        json={"name": "Tampered By Beta"},
        headers=beta_headers
    )
    assert update_res.status_code == 403

    # Beta attempts to delete Alpha's private workflow -> 403 Forbidden
    del_res = await client.delete(f"/api/workflows/{alpha_wf_id}", headers=beta_headers)
    assert del_res.status_code == 403

    # Superadmin can view and delete Alpha's workflow
    super_get = await client.get(f"/api/workflows/{alpha_wf_id}", headers=super_headers)
    assert super_get.status_code == 200

    super_del = await client.delete(f"/api/workflows/{alpha_wf_id}", headers=super_headers)
    assert super_del.status_code == 200

@pytest.mark.asyncio
async def test_viewer_cannot_execute_workflow(client: AsyncClient):
    """Verify that Viewer role cannot execute workflows."""
    super_headers = get_auth_header("user01", "superadmin")
    viewer_headers = get_auth_header("viewer01", "viewer")

    # Create a test workflow
    create_res = await client.post(
        "/api/workflows",
        json={"name": "Execution Guard Flow", "nodes": [], "edges": []},
        headers=super_headers
    )
    wf_id = create_res.json()["id"]

    # Viewer tries to execute -> 403 Forbidden
    run_res = await client.post(
        f"/api/workflows/{wf_id}/run",
        json={"inputs": {}, "variables": {}},
        headers=viewer_headers
    )
    assert run_res.status_code == 403
    assert "viewer" in run_res.json()["detail"].lower()

