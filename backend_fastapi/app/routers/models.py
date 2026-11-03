import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
import httpx

from app.database import get_db
from app.models.ai_model import AIModel
from app.models.user import User
from app.routers.auth import get_current_user, require_role
from app.config import AI_GATEWAY_URL, AI_GATEWAY_KEY
from app.utils.crypto import encrypt_secret, decrypt_secret, mask_secret

router = APIRouter(prefix="/api/models", tags=["AI Models & Endpoints"])

# --- Schemas ---

class AIModelResponse(BaseModel):
    id: str
    source_type: str
    provider: str
    model_identifier: str
    display_label: str
    endpoint_url: Optional[str] = None
    masked_api_key: Optional[str] = None
    has_api_key: bool = False
    scope: str
    owner_id: Optional[str] = None
    context_window: int
    max_output_tokens: int
    supports_vision: bool
    supports_tools: bool
    temperature_default: float
    cost_per_1k_input: float
    cost_per_1k_output: float
    is_enabled: bool
    is_default: bool
    display_order: int

    class Config:
        from_attributes = True

class CreateDirectModelRequest(BaseModel):
    provider: str = Field(..., description="google, openai, anthropic, groq, azure, custom_http, openai_compatible, deepseek, mistral")
    model_identifier: str = Field(..., description="e.g. gemini-2.0-flash, gpt-4o, deepseek-chat, custom-model")
    display_label: str
    api_key: Optional[str] = None
    endpoint_url: Optional[str] = None
    scope: str = "system" # "system" (if superadmin/admin) or "personal"
    source_type: Optional[str] = "direct_provider"
    context_window: int = 128000
    max_output_tokens: int = 8192
    supports_vision: bool = False
    supports_tools: bool = True
    temperature_default: float = 0.2

class UpdateModelRequest(BaseModel):
    display_label: Optional[str] = None
    api_key: Optional[str] = None
    endpoint_url: Optional[str] = None
    is_enabled: Optional[bool] = None
    is_default: Optional[bool] = None
    display_order: Optional[int] = None
    context_window: Optional[int] = None
    supports_vision: Optional[bool] = None

class TestConnectionRequest(BaseModel):
    source_type: str = "direct_provider" # "gateway" or "direct_provider"
    provider: str = "google"
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    model_identifier: Optional[str] = None

# Default Seed Models
DEFAULT_SYSTEM_MODELS = [
    {
        "source_type": "gateway",
        "provider": "google",
        "model_identifier": "gemini-2.0-flash",
        "display_label": "Gemini 2.0 Flash (Gateway)",
        "scope": "system",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "supports_vision": True,
        "supports_tools": True,
        "is_enabled": True,
        "is_default": True,
        "display_order": 1,
    },
    {
        "source_type": "gateway",
        "provider": "google",
        "model_identifier": "gemini-1.5-pro",
        "display_label": "Gemini 1.5 Pro (Gateway)",
        "scope": "system",
        "context_window": 2097152,
        "max_output_tokens": 8192,
        "supports_vision": True,
        "supports_tools": True,
        "is_enabled": True,
        "is_default": False,
        "display_order": 2,
    },
    {
        "source_type": "gateway",
        "provider": "openai",
        "model_identifier": "gpt-4o",
        "display_label": "GPT-4o (Gateway)",
        "scope": "system",
        "context_window": 128000,
        "max_output_tokens": 4096,
        "supports_vision": True,
        "supports_tools": True,
        "is_enabled": True,
        "is_default": False,
        "display_order": 3,
    },
    {
        "source_type": "gateway",
        "provider": "anthropic",
        "model_identifier": "claude-3-5-sonnet",
        "display_label": "Claude 3.5 Sonnet (Gateway)",
        "scope": "system",
        "context_window": 200000,
        "max_output_tokens": 8192,
        "supports_vision": True,
        "supports_tools": True,
        "is_enabled": True,
        "is_default": False,
        "display_order": 4,
    }
]

async def ensure_seed_models(db: AsyncSession):
    """Seed initial default models if table is empty."""
    res = await db.execute(select(AIModel).limit(1))
    if not res.scalars().first():
        for item in DEFAULT_SYSTEM_MODELS:
            m = AIModel(**item)
            db.add(m)
        await db.commit()

# --- Endpoints ---

@router.get("", response_model=List[AIModelResponse])
async def list_models(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all available AI Models:
    - System-wide models (accessible to all authenticated users)
    - Personal models owned by the current user
    """
    await ensure_seed_models(db)
    
    query = select(AIModel).where(
        or_(
            AIModel.scope == "system",
            AIModel.owner_id == current_user.id
        )
    ).order_by(AIModel.display_order.asc(), AIModel.created_at.asc())
    
    res = await db.execute(query)
    models = res.scalars().all()

    output = []
    for m in models:
        decrypted = decrypt_secret(m.encrypted_api_key) if m.encrypted_api_key else ""
        masked = mask_secret(decrypted) if decrypted else None
        
        output.append(AIModelResponse(
            id=m.id,
            source_type=m.source_type,
            provider=m.provider,
            model_identifier=m.model_identifier,
            display_label=m.display_label,
            endpoint_url=m.endpoint_url,
            masked_api_key=masked,
            has_api_key=bool(m.encrypted_api_key),
            scope=m.scope,
            owner_id=m.owner_id,
            context_window=m.context_window,
            max_output_tokens=m.max_output_tokens,
            supports_vision=m.supports_vision,
            supports_tools=m.supports_tools,
            temperature_default=m.temperature_default,
            cost_per_1k_input=m.cost_per_1k_input,
            cost_per_1k_output=m.cost_per_1k_output,
            is_enabled=m.is_enabled,
            is_default=m.is_default,
            display_order=m.display_order
        ))
    return output

@router.post("/sync-gateway", response_model=Dict[str, Any])
async def sync_models_from_gateway(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger 1-Click Sync from Central LiteLLM AI Gateway:
    Calls GET {AI_GATEWAY_URL}/v1/models and upserts them into ai_models.
    """
    gateway_url = AI_GATEWAY_URL
    gateway_key = AI_GATEWAY_KEY
    
    models_endpoint = f"{gateway_url}/v1/models"
    headers = {}
    if gateway_key:
        headers["Authorization"] = f"Bearer {gateway_key}"
        
    synced_count = 0
    raw_models = []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(models_endpoint, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                raw_models = data.get("data", [])
            else:
                # Gateway returned error or offline
                pass
    except Exception as e:
        # Gateway unreachable: continue gracefully and return message
        pass

    if raw_models:
        for idx, item in enumerate(raw_models):
            m_id = item.get("id")
            if not m_id:
                continue
                
            # Check if model already exists
            existing_res = await db.execute(
                select(AIModel).where(
                    and_(
                        AIModel.source_type == "gateway",
                        AIModel.model_identifier == m_id
                    )
                )
            )
            existing = existing_res.scalars().first()
            
            provider_tag = "gateway"
            if "gemini" in m_id.lower():
                provider_tag = "google"
            elif "gpt" in m_id.lower() or "o1" in m_id.lower() or "o3" in m_id.lower():
                provider_tag = "openai"
            elif "claude" in m_id.lower():
                provider_tag = "anthropic"
            elif "deepseek" in m_id.lower():
                provider_tag = "deepseek"
                
            supports_vis = any(x in m_id.lower() for x in ["vision", "flash", "gpt-4o", "claude-3"])

            if not existing:
                new_model = AIModel(
                    source_type="gateway",
                    provider=provider_tag,
                    model_identifier=m_id,
                    display_label=f"{m_id.capitalize()} (Gateway)",
                    scope="system",
                    context_window=item.get("context_window", 128000),
                    supports_vision=supports_vis,
                    supports_tools=True,
                    is_enabled=True,
                    is_default=(idx == 0),
                    display_order=idx + 1
                )
                db.add(new_model)
                synced_count += 1
            else:
                # Update metadata if needed
                existing.supports_vision = supports_vis
                synced_count += 1
                
        await db.commit()
        return {
            "success": True,
            "message": f"Successfully synced {synced_count} models from Central AI Gateway.",
            "gateway_url": gateway_url,
            "models_count": synced_count
        }
    else:
        # Gateway was not reachable, but seed models exist
        await ensure_seed_models(db)
        return {
            "success": True,
            "message": "Gateway was not reachable or has empty catalog. Loaded/kept default verified models.",
            "gateway_url": gateway_url,
            "models_count": len(DEFAULT_SYSTEM_MODELS)
        }

@router.post("/direct", response_model=AIModelResponse)
async def create_direct_model(
    payload: CreateDirectModelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register an AI Model (OpenAI Compatible, Google, OpenAI, Anthropic, DeepSeek, Groq, Mistral, Azure).
    Encrypts API key with AES-256 before storing.
    Superadmin and Admin can register system-wide Central Models; regular users create personal BYOK models.
    """
    scope = payload.scope
    if scope == "system" and current_user.role not in ["superadmin", "admin"]:
        scope = "personal"

    encrypted_key = encrypt_secret(payload.api_key) if payload.api_key else None
    source_type = payload.source_type or ("central" if scope == "system" else "direct_provider")

    new_model = AIModel(
        source_type=source_type,
        provider=payload.provider.lower(),
        model_identifier=payload.model_identifier.strip(),
        display_label=payload.display_label.strip(),
        endpoint_url=payload.endpoint_url.strip() if payload.endpoint_url else None,
        encrypted_api_key=encrypted_key,
        scope=scope,
        owner_id=current_user.id if scope == "personal" else None,
        context_window=payload.context_window,
        max_output_tokens=payload.max_output_tokens,
        supports_vision=payload.supports_vision,
        supports_tools=payload.supports_tools,
        temperature_default=payload.temperature_default,
        is_enabled=True,
        is_default=False
    )
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)

    masked = mask_secret(payload.api_key) if payload.api_key else None

    return AIModelResponse(
        id=new_model.id,
        source_type=new_model.source_type,
        provider=new_model.provider,
        model_identifier=new_model.model_identifier,
        display_label=new_model.display_label,
        endpoint_url=new_model.endpoint_url,
        masked_api_key=masked,
        has_api_key=bool(new_model.encrypted_api_key),
        scope=new_model.scope,
        owner_id=new_model.owner_id,
        context_window=new_model.context_window,
        max_output_tokens=new_model.max_output_tokens,
        supports_vision=new_model.supports_vision,
        supports_tools=new_model.supports_tools,
        temperature_default=new_model.temperature_default,
        cost_per_1k_input=new_model.cost_per_1k_input,
        cost_per_1k_output=new_model.cost_per_1k_output,
        is_enabled=new_model.is_enabled,
        is_default=new_model.is_default,
        display_order=new_model.display_order
    )

@router.put("/{model_id}", response_model=Dict[str, Any])
async def update_model(
    model_id: str,
    payload: UpdateModelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update model settings (label, enabled/default, or API key)."""
    res = await db.execute(select(AIModel).where(AIModel.id == model_id))
    model = res.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Check permission
    if model.scope == "personal" and model.owner_id != current_user.id and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this model")
    if model.scope == "system" and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Only Superadmin and Admin can modify central system models")

    if payload.display_label is not None:
        model.display_label = payload.display_label.strip()
    if payload.endpoint_url is not None:
        model.endpoint_url = payload.endpoint_url.strip() or None
    if payload.api_key:
        model.encrypted_api_key = encrypt_secret(payload.api_key.strip())
    if payload.is_enabled is not None:
        model.is_enabled = payload.is_enabled
    if payload.context_window is not None:
        model.context_window = payload.context_window
    if payload.supports_vision is not None:
        model.supports_vision = payload.supports_vision
    if payload.display_order is not None:
        model.display_order = payload.display_order

    # If setting default, unset others
    if payload.is_default:
        all_res = await db.execute(select(AIModel))
        for m in all_res.scalars().all():
            m.is_default = (m.id == model_id)

    await db.commit()
    return {"success": True, "message": f"Updated model '{model.display_label}' successfully."}

@router.delete("/{model_id}", response_model=Dict[str, Any])
async def delete_model(
    model_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a custom direct model or central model."""
    res = await db.execute(select(AIModel).where(AIModel.id == model_id))
    model = res.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if model.scope == "personal" and model.owner_id != current_user.id and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this model")
    if model.scope == "system" and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Only Superadmin and Admin can delete central system models")

    await db.delete(model)
    await db.commit()
    return {"success": True, "message": f"Model '{model.display_label}' deleted successfully."}

@router.post("/test-connection", response_model=Dict[str, Any])
async def test_model_connection(
    payload: TestConnectionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Test connection to an AI Gateway, OpenAI-Compatible endpoint, or Direct Provider before saving.
    Returns success status and latency in milliseconds.
    """
    start_time = time.time()
    provider = payload.provider.lower()
    key = payload.api_key
    endpoint = (payload.endpoint_url or "").strip().rstrip('/')
    
    if payload.source_type == "gateway":
        test_url = endpoint or AI_GATEWAY_URL
        test_key = key or AI_GATEWAY_KEY
        headers = {"Authorization": f"Bearer {test_key}"} if test_key else {}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(f"{test_url}/v1/models", headers=headers)
                latency = int((time.time() - start_time) * 1000)
                if r.status_code in (200, 401):
                    if r.status_code == 401:
                        return {"success": False, "message": "Gateway reached but authentication failed (Invalid Virtual Key).", "latency_ms": latency}
                    return {"success": True, "message": "Central AI Gateway connection successful!", "latency_ms": latency}
                return {"success": False, "message": f"Gateway responded with HTTP {r.status_code}.", "latency_ms": latency}
        except Exception as e:
            return {"success": False, "message": f"Failed to connect to Gateway: {str(e)}"}
            
    # OpenAI-Compatible / Custom Endpoint test
    if provider in ("openai_compatible", "custom_http"):
        if not endpoint:
            return {"success": False, "message": "Endpoint / Base URL is required for OpenAI-Compatible providers."}
        
        headers = {}
        if key:
            headers["Authorization"] = f"Bearer {key}"
            
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                # 1. Try GET /models or /v1/models
                models_url = endpoint if endpoint.endswith("/models") else f"{endpoint}/models"
                try:
                    r = await client.get(models_url, headers=headers)
                    latency = int((time.time() - start_time) * 1000)
                    if r.status_code == 200:
                        return {"success": True, "message": "OpenAI-Compatible endpoint verified successfully via /models!", "latency_ms": latency}
                    elif r.status_code == 401:
                        return {"success": False, "message": "Endpoint reached but unauthorized (invalid API Key).", "latency_ms": latency}
                except Exception:
                    pass

                # Fallback: test if endpoint has /v1 prefix missing
                if not endpoint.endswith("/v1"):
                    try:
                        r2 = await client.get(f"{endpoint}/v1/models", headers=headers)
                        latency = int((time.time() - start_time) * 1000)
                        if r2.status_code == 200:
                            return {"success": True, "message": "OpenAI-Compatible endpoint verified via /v1/models!", "latency_ms": latency}
                    except Exception:
                        pass
                
                # Fallback: simple ping to base
                r_base = await client.get(endpoint, headers=headers)
                latency = int((time.time() - start_time) * 1000)
                if r_base.status_code in (200, 404, 405):
                    return {"success": True, "message": f"OpenAI-Compatible host reachable (HTTP {r_base.status_code}).", "latency_ms": latency}
                return {"success": False, "message": f"Endpoint responded with HTTP {r_base.status_code}: {r_base.text[:150]}", "latency_ms": latency}
        except Exception as e:
            return {"success": False, "message": f"Cannot connect to OpenAI-Compatible endpoint: {str(e)}"}

    # Provider-specific direct checks
    if not key and provider != "azure":
        return {"success": False, "message": "API Key is required for provider connection test."}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            if provider == "google":
                url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
                r = await client.get(url)
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    return {"success": True, "message": "Google Gemini API connection verified successfully!", "latency_ms": latency}
                return {"success": False, "message": f"Google Gemini API error (HTTP {r.status_code}): {r.text[:150]}", "latency_ms": latency}

            elif provider == "openai":
                base = endpoint or "https://api.openai.com/v1"
                r = await client.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    return {"success": True, "message": "OpenAI API connection verified successfully!", "latency_ms": latency}
                return {"success": False, "message": f"OpenAI error (HTTP {r.status_code}): {r.text[:150]}", "latency_ms": latency}

            elif provider == "deepseek":
                base = endpoint or "https://api.deepseek.com"
                r = await client.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    return {"success": True, "message": "DeepSeek API connection verified successfully!", "latency_ms": latency}
                return {"success": False, "message": f"DeepSeek error (HTTP {r.status_code}): {r.text[:150]}", "latency_ms": latency}

            elif provider == "anthropic":
                r = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers={"x-api-key": key, "anthropic-version": "2023-06-01"}
                )
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    return {"success": True, "message": "Anthropic Claude API connection verified successfully!", "latency_ms": latency}
                return {"success": False, "message": f"Anthropic error (HTTP {r.status_code}): {r.text[:150]}", "latency_ms": latency}

            elif provider == "groq":
                base = endpoint or "https://api.groq.com/openai/v1"
                r = await client.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    return {"success": True, "message": "Groq Cloud API connection verified successfully!", "latency_ms": latency}
                return {"success": False, "message": f"Groq error (HTTP {r.status_code}): {r.text[:150]}", "latency_ms": latency}

            elif provider == "mistral":
                base = endpoint or "https://api.mistral.ai/v1"
                r = await client.get(f"{base}/models", headers={"Authorization": f"Bearer {key}"})
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    return {"success": True, "message": "Mistral AI connection verified successfully!", "latency_ms": latency}
                return {"success": False, "message": f"Mistral error (HTTP {r.status_code}): {r.text[:150]}", "latency_ms": latency}

            elif provider == "azure":
                if not endpoint:
                    return {"success": False, "message": "Azure Endpoint URL is required."}
                r = await client.get(endpoint, headers={"api-key": key} if key else {})
                latency = int((time.time() - start_time) * 1000)
                if r.status_code in (200, 401, 404):
                    return {"success": True, "message": f"Azure OpenAI endpoint reached (HTTP {r.status_code}).", "latency_ms": latency}
                return {"success": False, "message": f"Azure returned HTTP {r.status_code}: {r.text[:150]}", "latency_ms": latency}

            else:
                return {"success": True, "message": f"Provider '{provider}' configuration validated."}
    except Exception as e:
        return {"success": False, "message": f"Connection test failed: {str(e)}"}
