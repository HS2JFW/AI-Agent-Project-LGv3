import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "fastapi-backend"
    assert data["version"] == "3.0.0"

@pytest.mark.asyncio
async def test_login_json_success(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "username": "user01",
        "password": "admin"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "user01"
    assert data["user"]["role"] in ["superadmin", "admin"]
    assert data["user"]["is_active"] is True

@pytest.mark.asyncio
async def test_login_form_success(client: AsyncClient):
    response = await client.post("/api/auth/token", data={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "username": "user01",
        "password": "wrong_password"
    })
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data

@pytest.mark.asyncio
async def test_login_unknown_user(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "username": "unknown_user",
        "password": "password"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_with_valid_token(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "user01"
    assert data["role"] in ["superadmin", "admin"]

@pytest.mark.asyncio
async def test_get_me_without_token(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_with_invalid_token(client: AsyncClient):
    response = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.xyz"})
    assert response.status_code == 401

