import pytest
from httpx import AsyncClient
from app.services.auth_service import create_access_token

def get_auth_header(username: str, role: str) -> dict:
    token = create_access_token(data={"sub": username, "role": role})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_non_owner_cannot_share_workflow(client: AsyncClient):
    """Verify that a user who does not own the workflow cannot share it (403)."""
    super_headers = get_auth_header("user01", "superadmin")
    await client.post(
        "/api/users",
        json={"username": "share_owner", "password": "pass123", "role": "builder"},
        headers=super_headers
    )
    await client.post(
        "/api/users",
        json={"username": "share_hacker", "password": "pass123", "role": "builder"},
        headers=super_headers
    )

    owner_headers = get_auth_header("share_owner", "builder")
    hacker_headers = get_auth_header("share_hacker", "builder")

    # Owner creates workflow
    create_res = await client.post(
        "/api/workflows",
        json={"name": "Owner Flow", "is_public": False, "nodes": [], "edges": []},
        headers=owner_headers
    )
    wf_id = create_res.json()["id"]

    # Hacker tries to add share -> 403
    hacker_share = await client.post(
        f"/api/workflows/{wf_id}/shares",
        json={"shared_with_username": "share_hacker", "permission": "edit"},
        headers=hacker_headers
    )
    assert hacker_share.status_code == 403

@pytest.mark.asyncio
async def test_owner_shares_view_and_edit_permissions(client: AsyncClient):
    """Verify granular sharing matrix: view-only blocks edit, edit permission allows update."""
    super_headers = get_auth_header("user01", "superadmin")
    await client.post(
        "/api/users",
        json={"username": "dev_alice", "password": "pass123", "role": "builder"},
        headers=super_headers
    )
    await client.post(
        "/api/users",
        json={"username": "dev_bob", "password": "pass123", "role": "builder"},
        headers=super_headers
    )

    alice_headers = get_auth_header("dev_alice", "builder")
    bob_headers = get_auth_header("dev_bob", "builder")

    # 1. Alice creates private workflow
    res_wf = await client.post(
        "/api/workflows",
        json={"name": "Alice Flow", "is_public": False, "nodes": [], "edges": []},
        headers=alice_headers
    )
    wf_id = res_wf.json()["id"]

    # Bob cannot view initially -> 403
    bob_get_initial = await client.get(f"/api/workflows/{wf_id}", headers=bob_headers)
    assert bob_get_initial.status_code == 403

    # 2. Alice shares with Bob as 'view'
    share_res = await client.post(
        f"/api/workflows/{wf_id}/shares",
        json={"shared_with_username": "dev_bob", "permission": "view"},
        headers=alice_headers
    )
    assert share_res.status_code == 200
    share_id = share_res.json()["id"]

    # Bob can now view
    bob_view = await client.get(f"/api/workflows/{wf_id}", headers=bob_headers)
    assert bob_view.status_code == 200
    assert bob_view.json()["is_shared"] is True
    assert bob_view.json()["can_edit"] is False

    # Bob tries to edit with view-only permission -> 403
    bob_edit_fail = await client.put(
        f"/api/workflows/{wf_id}",
        json={"name": "Bob Hacked Name"},
        headers=bob_headers
    )
    assert bob_edit_fail.status_code == 403

    # 3. Alice upgrades Bob's share to 'edit'
    await client.delete(f"/api/workflows/{wf_id}/shares/{share_id}", headers=alice_headers)
    share_edit = await client.post(
        f"/api/workflows/{wf_id}/shares",
        json={"shared_with_username": "dev_bob", "permission": "edit"},
        headers=alice_headers
    )
    assert share_edit.status_code == 200

    # Bob can now edit successfully
    bob_edit_success = await client.put(
        f"/api/workflows/{wf_id}",
        json={"name": "Alice & Bob Joint Flow"},
        headers=bob_headers
    )
    assert bob_edit_success.status_code == 200
    assert bob_edit_success.json()["name"] == "Alice & Bob Joint Flow"

@pytest.mark.asyncio
async def test_shared_execute_permission_allows_running(client: AsyncClient):
    """Verify that a private workflow shared with 'execute' permission can be run by the recipient."""
    super_headers = get_auth_header("user01", "superadmin")
    await client.post(
        "/api/users",
        json={"username": "pipeline_author", "password": "pass123", "role": "builder"},
        headers=super_headers
    )
    author_headers = get_auth_header("pipeline_author", "builder")
    operator_headers = get_auth_header("operator01", "operator")

    # Author creates private workflow
    create_wf = await client.post(
        "/api/workflows",
        json={"name": "Restricted Production Pipeline", "is_public": False, "nodes": [], "edges": []},
        headers=author_headers
    )
    wf_id = create_wf.json()["id"]

    # Operator cannot run initially -> 403
    run_initial = await client.post(
        f"/api/workflows/{wf_id}/run",
        json={"inputs": {}, "variables": {}},
        headers=operator_headers
    )
    assert run_initial.status_code == 403

    # Author shares with role 'operator' with 'execute' permission
    share_op = await client.post(
        f"/api/workflows/{wf_id}/shares",
        json={"shared_with_role": "operator", "permission": "execute"},
        headers=author_headers
    )
    assert share_op.status_code == 200

    # Operator can now run
    run_success = await client.post(
        f"/api/workflows/{wf_id}/run",
        json={"inputs": {}, "variables": {}},
        headers=operator_headers
    )
    assert run_success.status_code == 200
    assert run_success.json()["status"] == "started"

@pytest.mark.asyncio
async def test_visibility_tab_filtering_mine_and_shared(client: AsyncClient):
    """Verify that visibility filter query works for 'mine' and 'shared' tabs."""
    super_headers = get_auth_header("user01", "superadmin")
    await client.post(
        "/api/users",
        json={"username": "filter_user_1", "password": "pass123", "role": "builder"},
        headers=super_headers
    )
    await client.post(
        "/api/users",
        json={"username": "filter_user_2", "password": "pass123", "role": "builder"},
        headers=super_headers
    )

    u1_headers = get_auth_header("filter_user_1", "builder")
    u2_headers = get_auth_header("filter_user_2", "builder")

    # User 1 creates Flow 1
    w1 = await client.post(
        "/api/workflows",
        json={"name": "U1 Private Flow", "is_public": False, "nodes": [], "edges": []},
        headers=u1_headers
    )
    w1_id = w1.json()["id"]

    # User 2 creates Flow 2
    w2 = await client.post(
        "/api/workflows",
        json={"name": "U2 Private Flow", "is_public": False, "nodes": [], "edges": []},
        headers=u2_headers
    )
    w2_id = w2.json()["id"]

    # User 2 shares Flow 2 with User 1
    await client.post(
        f"/api/workflows/{w2_id}/shares",
        json={"shared_with_username": "filter_user_1", "permission": "view"},
        headers=u2_headers
    )

    # 1. User 1 queries 'mine': only sees w1
    mine_res = await client.get("/api/workflows?visibility=mine", headers=u1_headers)
    mine_ids = [w["id"] for w in mine_res.json()]
    assert w1_id in mine_ids
    assert w2_id not in mine_ids

    # 2. User 1 queries 'shared': sees w2
    shared_res = await client.get("/api/workflows?visibility=shared", headers=u1_headers)
    shared_ids = [w["id"] for w in shared_res.json()]
    assert w2_id in shared_ids
    assert w1_id not in shared_ids

