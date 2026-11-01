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



@pytest.mark.asyncio
async def test_viewer_cannot_upload_or_clear_queues(client: AsyncClient):
    """Verify that Viewer role cannot upload to or clear file queues."""
    viewer_headers = get_auth_header("viewer01", "viewer")
    
    # 1. Upload PDF
    res = await client.post(
        "/api/upload-pdf-queue",
        files=[("files", ("test.pdf", b"%PDF-dummy", "application/pdf"))],
        headers=viewer_headers
    )
    assert res.status_code == 403
    assert "viewer" in res.json()["detail"].lower()

    # 2. Clear PDF
    res = await client.delete("/api/clear-pdf-queue", headers=viewer_headers)
    assert res.status_code == 403
    assert "viewer" in res.json()["detail"].lower()

@pytest.mark.asyncio
async def test_viewer_cannot_access_system_logs(client: AsyncClient):
    """Verify that Viewer cannot view system logs, but Superadmin can."""
    viewer_headers = get_auth_header("viewer01", "viewer")
    super_headers = get_auth_header("user01", "superadmin")

    res_view = await client.get("/api/system-logs", headers=viewer_headers)
    assert res_view.status_code == 403

    res_super = await client.get("/api/system-logs", headers=super_headers)
    assert res_super.status_code == 200

@pytest.mark.asyncio
async def test_unauthenticated_cannot_execute_workflow(client: AsyncClient):
    """Verify that execution without token fails with 401 Unauthorized."""
    super_headers = get_auth_header("user01", "superadmin")
    create_res = await client.post(
        "/api/workflows",
        json={"name": "Auth Guard Flow", "nodes": [], "edges": []},
        headers=super_headers
    )
    wf_id = create_res.json()["id"]

    # No auth header -> 401
    run_res = await client.post(
        f"/api/workflows/{wf_id}/run",
        json={"inputs": {}, "variables": {}}
    )
    assert run_res.status_code == 401

@pytest.mark.asyncio
async def test_unauthenticated_cannot_upload_or_clear_queues(client: AsyncClient):
    """Verify that uploading or clearing queues without token fails with 401 Unauthorized."""
    # 1. Upload without token
    res_upload = await client.post(
        "/api/upload-pdf-queue",
        files=[("files", ("test.pdf", b"%PDF-dummy", "application/pdf"))]
    )
    assert res_upload.status_code == 401

    # 2. Clear without token
    res_clear = await client.delete("/api/clear-pdf-queue")
    assert res_clear.status_code == 401

@pytest.mark.asyncio
async def test_workflow_defaults_to_private(client: AsyncClient):
    """Verify that new workflows are private by default."""
    builder_headers = get_auth_header("builder01", "builder")
    create_res = await client.post(
        "/api/workflows",
        json={"name": "Private By Default Flow", "nodes": [], "edges": []},
        headers=builder_headers
    )
    assert create_res.status_code in [200, 201]
    data = create_res.json()
    assert data["is_public"] is False

@pytest.mark.asyncio
async def test_workflow_run_records_executed_by_audit_trail(client: AsyncClient):
    """Verify that workflow run records the user ID who initiated it in executed_by."""
    builder_headers = get_auth_header("builder01", "builder")
    create_res = await client.post(
        "/api/workflows",
        json={"name": "Audit Trail Run Flow", "nodes": [], "edges": []},
        headers=builder_headers
    )
    wf_id = create_res.json()["id"]

    run_res = await client.post(
        f"/api/workflows/{wf_id}/run",
        json={"inputs": {}, "variables": {}},
        headers=builder_headers
    )
    assert run_res.status_code == 200
    run_id = run_res.json()["run_id"]

    # Verify run record in workflow runs list
    runs_res = await client.get(f"/api/workflows/{wf_id}/runs", headers=builder_headers)
    assert runs_res.status_code == 200
    runs = runs_res.json()
    assert len(runs) > 0
    matched_run = next((r for r in runs if r["id"] == run_id), None)
    assert matched_run is not None
    assert matched_run.get("executed_by") is not None
