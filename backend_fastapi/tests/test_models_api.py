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
async def test_list_models_no_auto_seed(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/models", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    # Verify keys are not exposed as plaintext if any models exist
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
    assert created["provider"] == "google"
    assert created["has_api_key"] is True
    assert "••••••••" in created["masked_api_key"]

    # Full Update model (Edit feature test)
    update_res = await client.put(f"/api/models/{model_id}", json={
        "provider": "openai_compatible",
        "model_identifier": "qwen-custom-edit",
        "display_label": "Qwen Custom Edited Label",
        "endpoint_url": "https://llm.addpay.in.th/v1",
        "context_window": 64000,
        "supports_vision": False,
        "supports_tools": True,
        "is_enabled": False
    }, headers=auth_headers)
    assert update_res.status_code == 200
    updated_body = update_res.json()
    assert updated_body["success"] is True
    assert updated_body["model"]["display_label"] == "Qwen Custom Edited Label"
    assert updated_body["model"]["model_identifier"] == "qwen-custom-edit"
    assert updated_body["model"]["provider"] == "openai_compatible"
    assert updated_body["model"]["is_enabled"] is False

    # Delete model
    del_res = await client.delete(f"/api/models/{model_id}", headers=auth_headers)
    assert del_res.status_code == 200

@pytest.mark.asyncio
async def test_clear_stale_models(client: AsyncClient, auth_headers: dict):
    # Call clear-stale endpoint
    res = await client.post("/api/models/clear-stale", json={"action": "reset_defaults"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True

@pytest.mark.asyncio
async def test_test_connection_validation(client: AsyncClient, auth_headers: dict):
    # Missing API key for google
    res = await client.post("/api/models/test-connection", json={
        "source_type": "direct_provider",
        "provider": "google",
        "api_key": ""
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False

    # Missing endpoint for openai_compatible
    res_compat = await client.post("/api/models/test-connection", json={
        "source_type": "direct_provider",
        "provider": "openai_compatible",
        "endpoint_url": ""
    }, headers=auth_headers)
    assert res_compat.status_code == 200
    assert res_compat.json()["success"] is False

@pytest.mark.asyncio
async def test_create_openai_compatible_model(client: AsyncClient, auth_headers: dict):
    payload = {
        "provider": "openai_compatible",
        "model_identifier": "qwen2.5-coder-32b",
        "display_label": "Qwen 2.5 Coder (Central Gateway)",
        "api_key": "sk-gateway-secret-token",
        "endpoint_url": "http://ai-gateway:4000/v1",
        "scope": "system",
        "context_window": 32768,
        "supports_vision": False,
        "supports_tools": True
    }
    res = await client.post("/api/models/direct", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["provider"] == "openai_compatible"
    assert data["model_identifier"] == "qwen2.5-coder-32b"
    assert data["endpoint_url"] == "http://ai-gateway:4000/v1"
    assert data["scope"] == "system"
    assert data["has_api_key"] is True

    # Clean up
    await client.delete(f"/api/models/{data['id']}", headers=auth_headers)
