import pytest
from httpx import AsyncClient
from app.services.auth_service import create_access_token

@pytest.mark.asyncio
async def test_get_roles_list(client: AsyncClient):
    """Test public endpoint listing available RBAC roles."""
    response = await client.get("/api/users/roles")
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) == 5
    role_names = [r["role"] for r in roles]
    assert "superadmin" in role_names
    assert "admin" in role_names
    assert "builder" in role_names
    assert "operator" in role_names
    assert "viewer" in role_names

@pytest.mark.asyncio
async def test_default_users_login_and_roles(client: AsyncClient):
    """Verify all 5 seeded default users can login and return appropriate roles."""
    test_cases = [
        ("user01", "admin", "superadmin"),
        ("admin", "admin123", "admin"),
        ("builder01", "builder123", "builder"),
        ("operator01", "operator123", "operator"),
        ("viewer01", "viewer123", "viewer"),
    ]
    for username, password, expected_role in test_cases:
        resp = await client.post("/api/auth/login", json={"username": username, "password": password})
        assert resp.status_code == 200, f"Failed login for {username}: {resp.text}"
        data = resp.json()
        assert data["user"]["role"] == expected_role
        assert "access_token" in data

@pytest.mark.asyncio
async def test_rbac_user_list_permissions(client: AsyncClient):
    """Verify role-based access restrictions on GET /api/users."""
    # 1. Unauthenticated -> 401
    resp_unauth = await client.get("/api/users")
    assert resp_unauth.status_code == 401

    # Helper for creating bearer headers using existing seeded users
    def get_headers(username: str, role: str):
        t = create_access_token(data={"sub": username, "role": role})
        return {"Authorization": f"Bearer {t}"}

    # 2. Superadmin -> 200
    resp_super = await client.get("/api/users", headers=get_headers("user01", "superadmin"))
    assert resp_super.status_code == 200
    assert len(resp_super.json()) >= 5

    # 3. Admin -> 200
    resp_admin = await client.get("/api/users", headers=get_headers("admin", "admin"))
    assert resp_admin.status_code == 200

    # 4. Builder -> 403 Forbidden
    resp_builder = await client.get("/api/users", headers=get_headers("builder01", "builder"))
    assert resp_builder.status_code == 403

    # 5. Operator -> 403 Forbidden
    resp_op = await client.get("/api/users", headers=get_headers("operator01", "operator"))
    assert resp_op.status_code == 403

    # 6. Viewer -> 403 Forbidden
    resp_view = await client.get("/api/users", headers=get_headers("viewer01", "viewer"))
    assert resp_view.status_code == 403

@pytest.mark.asyncio
async def test_user_creation_and_elevation_restrictions(client: AsyncClient):
    """Test user creation and restriction on elevating to superadmin."""
    super_headers = {"Authorization": f"Bearer {create_access_token(data={'sub': 'user01', 'role': 'superadmin'})}"}
    admin_headers = {"Authorization": f"Bearer {create_access_token(data={'sub': 'admin', 'role': 'admin'})}"}
    builder_headers = {"Authorization": f"Bearer {create_access_token(data={'sub': 'builder01', 'role': 'builder'})}"}

    # Builder cannot create user -> 403
    resp = await client.post("/api/users", json={"username": "newuser1", "password": "password123"}, headers=builder_headers)
    assert resp.status_code == 403

    # Admin cannot create superadmin -> 403
    resp_adm_elevate = await client.post(
        "/api/users",
        json={"username": "super2", "password": "password123", "role": "superadmin"},
        headers=admin_headers
    )
    assert resp_adm_elevate.status_code == 403

    # Superadmin can create any user
    resp_create = await client.post(
        "/api/users",
        json={
            "username": "tester_builder",
            "password": "secretpassword",
            "full_name": "Test Builder One",
            "department": "Engineering",
            "role": "builder"
        },
        headers=super_headers
    )
    assert resp_create.status_code == 201
    created_user = resp_create.json()
    assert created_user["username"] == "tester_builder"
    assert created_user["role"] == "builder"
    assert created_user["full_name"] == "Test Builder One"

    # Test login with newly created user
    resp_login = await client.post("/api/auth/login", json={"username": "tester_builder", "password": "secretpassword"})
    assert resp_login.status_code == 200

@pytest.mark.asyncio
async def test_user_update_and_self_deletion_guard(client: AsyncClient):
    """Test updating user attributes and ensuring self-deletion is prevented."""
    super_headers = {"Authorization": f"Bearer {create_access_token(data={'sub': 'user01', 'role': 'superadmin'})}"}

    # 1. Fetch user01 id
    me_resp = await client.get("/api/auth/me", headers=super_headers)
    assert me_resp.status_code == 200
    my_id = me_resp.json()["id"]

    # 2. Try to self-delete -> 400
    del_self_resp = await client.delete(f"/api/users/{my_id}", headers=super_headers)
    assert del_self_resp.status_code == 400
    assert "Cannot delete your own account" in del_self_resp.json()["detail"]

    # 3. Create dummy user to update and delete
    create_resp = await client.post(
        "/api/users",
        json={"username": "temp_delete_user", "password": "password123", "role": "operator"},
        headers=super_headers
    )
    assert create_resp.status_code == 201
    temp_user_id = create_resp.json()["id"]

    # 4. Update dummy user
    update_resp = await client.patch(
        f"/api/users/{temp_user_id}",
        json={"full_name": "Updated Name", "department": "Operations Team"},
        headers=super_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["full_name"] == "Updated Name"
    assert update_resp.json()["department"] == "Operations Team"

    # 5. Delete dummy user -> 200
    del_resp = await client.delete(f"/api/users/{temp_user_id}", headers=super_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "ok"

    # 6. Verify deleted user no longer exists
    get_del = await client.get(f"/api/users/{temp_user_id}", headers=super_headers)
    assert get_del.status_code == 404
