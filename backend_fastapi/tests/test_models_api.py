import pytest
from httpx import AsyncClient
from app.utils.crypto import encrypt_secret, decrypt_secret, mask_secret

@pytest.mark.asyncio
async def test_crypto_utilities():
    raw_key = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz"
    encrypted = encrypt_secret(raw_key)
    assert encrypted != raw_key
    assert len(encrypted) > 20

    decrypted = decrypt_secret(encrypted)
    assert decrypted == raw_key

    # Test masking
    masked = mask_secret(raw_key)
    assert "sk-" in masked
    assert "wxyz" in masked
    assert "••••••••" in masked
    assert raw_key not in masked

@pytest.mark.asyncio
async def test_list_and_seed_models(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/models", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    # Verify default gateway model exists
    identifiers = [m["model_identifier"] for m in data]
    assert "gemini-2.0-flash" in identifiers
    assert "gpt-4o" in identifiers
    # Verify keys are not exposed as plaintext
    for m in data:
        assert m["masked_api_key"] is None or "••••••••" in m["masked_api_key"]

@pytest.mark.asyncio
async def test_create_and_manage_direct_model(client: AsyncClient, auth_headers: dict):
    payload = {
        "provider": "google",
        "model_identifier": "gemini-2.5-pro",
        "display_label": "Gemini 2.5 Pro (Direct Key)",
        "api_key": "AIzaSyD-sample-gemini-key-12345",
        "scope": "system",
        "context_window": 2000000,
        "supports_vision": True,
        "supports_tools": True
    }
    # Create direct model
    res = await client.post("/api/models/direct", json=payload, headers=auth_headers)
    assert res.status_code == 200
    created = res.json()
    model_id = created["id"]
    assert created["source_type"] == "direct_provider"
    assert created["provider"] == "google"
    assert created["has_api_key"] is True
    assert "••••••••" in created["masked_api_key"]

    # Update model
    update_res = await client.put(f"/api/models/{model_id}", json={
        "display_label": "Gemini 2.5 Pro Updated",
        "is_enabled": False
    }, headers=auth_headers)
    assert update_res.status_code == 200

    # Delete model
    del_res = await client.delete(f"/api/models/{model_id}", headers=auth_headers)
    assert del_res.status_code == 200

@pytest.mark.asyncio
async def test_test_connection_validation(client: AsyncClient, auth_headers: dict):
    # Missing API key
    res = await client.post("/api/models/test-connection", json={
        "source_type": "direct_provider",
        "provider": "google",
        "api_key": ""
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
