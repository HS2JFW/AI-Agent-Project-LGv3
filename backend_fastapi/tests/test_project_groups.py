import pytest
from httpx import AsyncClient
from app.services.auth_service import create_access_token

def get_auth_header(username: str, role: str) -> dict:
    token = create_access_token(data={"sub": username, "role": role})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_unauthenticated_cannot_create_group(client: AsyncClient):
    """Verify that creating a group without authentication returns 401."""
    res = await client.post("/api/groups", json={"name": "No Auth Group"})
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_viewer_and_operator_cannot_create_group(client: AsyncClient):
    """Verify that Viewer and Operator roles cannot create groups (403 Forbidden)."""
    payload = {"name": "Restricted Folder", "description": "Should fail", "color": "emerald"}

    # Viewer
    v_headers = get_auth_header("viewer01", "viewer")
    res_v = await client.post("/api/groups", json=payload, headers=v_headers)
    assert res_v.status_code == 403

    # Operator
    op_headers = get_auth_header("operator01", "operator")
    res_op = await client.post("/api/groups", json=payload, headers=op_headers)
    assert res_op.status_code == 403

@pytest.mark.asyncio
async def test_builder_can_create_group_and_subgroup(client: AsyncClient):
    """Verify that a Builder can create a root folder and a nested sub-folder."""
    b_headers = get_auth_header("builder01", "builder")

    # 1. Create root group
    res_root = await client.post(
        "/api/groups",
        json={"name": "Engineering Projects", "description": "Root folder", "color": "blue"},
        headers=b_headers
    )
    assert res_root.status_code == 200
    root_data = res_root.json()
    root_id = root_data["id"]
    assert root_data["name"] == "Engineering Projects"
    assert root_data["parent_id"] is None
    assert root_data["owner_id"] is not None

    # 2. Create sub-group
    res_sub = await client.post(
        "/api/groups",
        json={"name": "Backend Services", "parent_id": root_id, "color": "purple"},
        headers=b_headers
    )
    assert res_sub.status_code == 200
    sub_data = res_sub.json()
    assert sub_data["parent_id"] == root_id

    # 3. List groups
    list_res = await client.get("/api/groups", headers=b_headers)
    assert list_res.status_code == 200
    groups = list_res.json()
    ids = [g["id"] for g in groups]
    assert root_id in ids
    assert sub_data["id"] in ids

@pytest.mark.asyncio
async def test_group_ownership_isolation_between_builders(client: AsyncClient):
    """Verify that Builder A cannot edit or delete Builder B's folder."""
    super_headers = get_auth_header("user01", "superadmin")
    await client.post(
        "/api/users",
        json={"username": "folder_alpha", "password": "pass123", "role": "builder"},
        headers=super_headers
    )
    await client.post(
        "/api/users",
        json={"username": "folder_beta", "password": "pass123", "role": "builder"},
        headers=super_headers
    )

    alpha_headers = get_auth_header("folder_alpha", "builder")
    beta_headers = get_auth_header("folder_beta", "builder")

    # Alpha creates a group
    create_res = await client.post(
        "/api/groups",
        json={"name": "Alpha Private Folder", "color": "indigo"},
        headers=alpha_headers
    )
    assert create_res.status_code == 200
    group_id = create_res.json()["id"]

    # Beta tries to edit Alpha's group -> 403 Forbidden
    edit_res = await client.patch(
        f"/api/groups/{group_id}",
        json={"name": "Beta Overwrite"},
        headers=beta_headers
    )
    assert edit_res.status_code == 403

    # Beta tries to delete Alpha's group -> 403 Forbidden
    del_res = await client.delete(f"/api/groups/{group_id}", headers=beta_headers)
    assert del_res.status_code == 403

    # Superadmin can delete
    super_del = await client.delete(f"/api/groups/{group_id}", headers=super_headers)
    assert super_del.status_code == 200

@pytest.mark.asyncio
async def test_workflow_group_assignment_and_unlinking(client: AsyncClient):
    """Verify that workflows can be assigned to a group and unlinked when group is deleted."""
    builder_headers = get_auth_header("builder01", "builder")

    # 1. Create a group
    grp_res = await client.post(
        "/api/groups",
        json={"name": "Operations Folder", "color": "amber"},
        headers=builder_headers
    )
    grp_id = grp_res.json()["id"]

    # 2. Create a workflow assigned to this group
    wf_res = await client.post(
        "/api/workflows",
        json={
            "name": "Grouped Pipeline Flow",
            "group_id": grp_id,
            "color": "amber",
            "nodes": [],
            "edges": []
        },
        headers=builder_headers
    )
    wf_id = wf_res.json()["id"]
    assert wf_res.json().get("group_id") == grp_id

    # 3. Read workflow by ID
    get_wf = await client.get(f"/api/workflows/{wf_id}", headers=builder_headers)
    assert get_wf.json()["group_id"] == grp_id
    assert get_wf.json()["color"] == "amber"

    # 4. Delete group without deleting workflows
    del_grp = await client.delete(f"/api/groups/{grp_id}?delete_workflows=false", headers=builder_headers)
    assert del_grp.status_code == 200

    # 5. Verify workflow still exists but group_id is now None
    after_wf = await client.get(f"/api/workflows/{wf_id}", headers=builder_headers)
    assert after_wf.status_code == 200
    assert after_wf.json()["group_id"] is None

@pytest.mark.asyncio
async def test_client_groups_sync_auto_migration(client: AsyncClient):
    """Verify auto-migration endpoint syncing client localStorage groups and mappings."""
    builder_headers = get_auth_header("builder01", "builder")

    # Create a workflow first
    wf_res = await client.post(
        "/api/workflows",
        json={"name": "Legacy Workflow To Migrate", "nodes": [], "edges": []},
        headers=builder_headers
    )
    wf_id = wf_res.json()["id"]

    # Sync payload from client localStorage
    sync_payload = {
        "groups": [
            {
                "id": "client_grp_001",
                "name": "Migrated Folder 1",
                "description": "Originally from localStorage",
                "color": "rose",
                "parent_id": None
            }
        ],
        "workflow_group_map": {
            wf_id: "client_grp_001"
        },
        "workflow_color_map": {
            wf_id: "rose"
        }
    }

    sync_res = await client.post("/api/groups/sync", json=sync_payload, headers=builder_headers)
    assert sync_res.status_code == 200
    assert sync_res.json()["migrated_groups"] == 1
    assert sync_res.json()["migrated_workflows"] == 1

    # Verify workflow reflects new group_id and color
    wf_check = await client.get(f"/api/workflows/{wf_id}", headers=builder_headers)
    assert wf_check.json()["group_id"] == "client_grp_001"
    assert wf_check.json()["color"] == "rose"

