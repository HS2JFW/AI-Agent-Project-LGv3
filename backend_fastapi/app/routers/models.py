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
    provider: Optional[str] = None
    model_identifier: Optional[str] = None
    display_label: Optional[str] = None
    api_key: Optional[str] = None
    endpoint_url: Optional[str] = None
    is_enabled: Optional[bool] = None
    is_default: Optional[bool] = None
    display_order: Optional[int] = None
    context_window: Optional[int] = None
    max_output_tokens: Optional[int] = None
    supports_vision: Optional[bool] = None
    supports_tools: Optional[bool] = None
    temperature_default: Optional[float] = None
    scope: Optional[str] = None

class TestConnectionRequest(BaseModel):
    source_type: str = "direct_provider" # "gateway" or "direct_provider"
    provider: str = "google"
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    model_identifier: Optional[str] = None
    model_id: Optional[str] = None

class ClearStaleRequest(BaseModel):
    action: str = "reset_defaults" # "reset_defaults", "clear_stale", "clear_all"

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
    gateway_url = (AI_GATEWAY_URL or "https://llm.addpay.in.th/v1").rstrip("/")
    gateway_key = AI_GATEWAY_KEY
    
    models_endpoint = f"{gateway_url}/models" if gateway_url.endswith("/v1") else f"{gateway_url}/v1/models"
    headers = {}
    if gateway_key:
        headers["Authorization"] = f"Bearer {gateway_key}"
        
    synced_count = 0
    raw_models = []
    
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
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
    """Update model settings (provider, identifier, label, endpoint, key, specs, enabled/default, scope)."""
    res = await db.execute(select(AIModel).where(AIModel.id == model_id))
    model = res.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Check permission
    if model.scope == "personal" and model.owner_id != current_user.id and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this model")
    if model.scope == "system" and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Only Superadmin and Admin can modify central system models")

    if payload.provider is not None and payload.provider.strip():
        model.provider = payload.provider.lower().strip()
    if payload.model_identifier is not None and payload.model_identifier.strip():
        model.model_identifier = payload.model_identifier.strip()
    if payload.display_label is not None and payload.display_label.strip():
        model.display_label = payload.display_label.strip()
    if payload.endpoint_url is not None:
        model.endpoint_url = payload.endpoint_url.strip() or None
    if payload.api_key is not None and payload.api_key.strip():
        model.encrypted_api_key = encrypt_secret(payload.api_key.strip())
    if payload.is_enabled is not None:
        model.is_enabled = payload.is_enabled
    if payload.context_window is not None:
        model.context_window = payload.context_window
    if payload.max_output_tokens is not None:
        model.max_output_tokens = payload.max_output_tokens
    if payload.supports_vision is not None:
        model.supports_vision = payload.supports_vision
    if payload.supports_tools is not None:
        model.supports_tools = payload.supports_tools
    if payload.temperature_default is not None:
        model.temperature_default = payload.temperature_default
    if payload.display_order is not None:
        model.display_order = payload.display_order

    if payload.scope is not None and current_user.role in ["superadmin", "admin"]:
        if payload.scope in ["system", "personal"]:
            model.scope = payload.scope
            if payload.scope == "system":
                model.source_type = "central"
                model.owner_id = None
            else:
                model.source_type = "direct_provider"
                model.owner_id = current_user.id

    # If setting default, unset others
    if payload.is_default:
        all_res = await db.execute(select(AIModel))
        for m in all_res.scalars().all():
            m.is_default = (m.id == model_id)
    elif payload.is_default is False:
        model.is_default = False

    await db.commit()
    await db.refresh(model)

    decrypted = decrypt_secret(model.encrypted_api_key) if model.encrypted_api_key else ""
    masked = mask_secret(decrypted) if decrypted else None

    return {
        "success": True,
        "message": f"Updated model '{model.display_label}' successfully.",
        "model": {
            "id": model.id,
            "provider": model.provider,
            "model_identifier": model.model_identifier,
            "display_label": model.display_label,
            "endpoint_url": model.endpoint_url,
            "masked_api_key": masked,
            "has_api_key": bool(model.encrypted_api_key),
            "scope": model.scope,
            "context_window": model.context_window,
            "max_output_tokens": model.max_output_tokens,
            "supports_vision": model.supports_vision,
            "supports_tools": model.supports_tools,
            "is_enabled": model.is_enabled,
            "is_default": model.is_default,
        }
    }

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

@router.post("/clear-stale", response_model=Dict[str, Any])
async def clear_stale_models(
    payload: Optional[ClearStaleRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clear stale/lingering/dummy models in the database and re-synchronize clean official models.
    - reset_defaults: Purges legacy placeholder models (gemini-2.0-flash, gpt-4o, claude-3-5-sonnet) and ensures verified AddPay Gateway models.
    - clear_all: Clears all system models and re-seeds verified AddPay Gateway models.
    - clear_stale: Removes duplicate or unmatched system models.
    Only Superadmin and Admin can perform catalog cleanup.
    """
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Only Superadmin and Admin can clear models from the database")

    action = payload.action if payload else "reset_defaults"
    deleted_count = 0

    if action == "clear_all":
        res = await db.execute(select(AIModel).where(AIModel.scope == "system"))
        models = res.scalars().all()
        for m in models:
            await db.delete(m)
            deleted_count += 1
        await db.commit()
        msg = f"Cleared {deleted_count} system models."

    elif action == "reset_defaults":
        legacy_identifiers = {"gemini-2.0-flash", "gemini-1.5-pro", "gpt-4o", "claude-3-5-sonnet"}
        res = await db.execute(select(AIModel).where(AIModel.scope == "system"))
        all_system = res.scalars().all()
        for m in all_system:
            if m.model_identifier in legacy_identifiers:
                await db.delete(m)
                deleted_count += 1
        await db.commit()
        msg = f"Purged {deleted_count} legacy models."

    else: # clear_stale
        res = await db.execute(select(AIModel).where(AIModel.scope == "system"))
        all_system = res.scalars().all()
        seen = set()
        for m in all_system:
            key = (m.model_identifier, m.provider)
            if key in seen:
                await db.delete(m)
                deleted_count += 1
            else:
                seen.add(key)
        await db.commit()
        msg = f"Removed {deleted_count} duplicate/stale models."

    return {
        "success": True,
        "message": msg,
        "deleted_count": deleted_count
    }

@router.post("/test-connection", response_model=Dict[str, Any])
async def test_model_connection(
    payload: TestConnectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test model inference by sending a test prompt to verify that the model actually responds and works.
    Returns success status, model reply, and latency in milliseconds.
    """
    start_time = time.time()
    provider = payload.provider.lower()
    key = payload.api_key
    endpoint = (payload.endpoint_url or "").strip().rstrip('/')
    model_name = (payload.model_identifier or "").strip()

    # If model_id is provided (e.g. testing existing model in Edit modal), fill in missing parameters
    if payload.model_id:
        res = await db.execute(select(AIModel).where(AIModel.id == payload.model_id))
        existing_model = res.scalars().first()
        if existing_model:
            if not key and existing_model.encrypted_api_key:
                key = decrypt_secret(existing_model.encrypted_api_key)
            if not endpoint and existing_model.endpoint_url:
                endpoint = existing_model.endpoint_url.strip().rstrip('/')
            if not model_name and existing_model.model_identifier:
                model_name = existing_model.model_identifier.strip()
            if not provider and existing_model.provider:
                provider = existing_model.provider.lower()

    if not model_name:
        return {
            "success": False,
            "message": "กรุณาระบุ Model Identifier (API Name) เพื่อส่งข้อความทดสอบการตอบสนองของโมเดล",
            "latency_ms": 0
        }

    # 1. OpenAI-Compatible, AI Gateway, LiteLLM, Ollama, Custom HTTP
    if provider in ("openai_compatible", "custom_http") or payload.source_type == "gateway":
        effective_ep = endpoint or AI_GATEWAY_URL
        if not effective_ep:
            return {"success": False, "message": "Endpoint / Base URL is required for OpenAI-Compatible providers."}

        effective_key = key
        if not effective_key and ('llm.addpay.in.th' in effective_ep or 'litellm' in effective_ep or effective_ep == AI_GATEWAY_URL):
            effective_key = AI_GATEWAY_KEY

        clean_ep = effective_ep.strip().rstrip('/')
        headers = {"Content-Type": "application/json"}
        if effective_key:
            headers["Authorization"] = f"Bearer {effective_key}"

        # Check if embedding model
        is_embedding = any(x in model_name.lower() for x in ["embed", "embedding"])
        if is_embedding:
            if clean_ep.endswith("/v1"):
                target_url = f"{clean_ep}/embeddings"
            elif clean_ep.endswith("/embeddings"):
                target_url = clean_ep
            else:
                target_url = f"{clean_ep}/v1/embeddings"
            req_body = {
                "model": model_name,
                "input": "Health check connection probe"
            }
        else:
            if clean_ep.endswith("/v1"):
                target_url = f"{clean_ep}/chat/completions"
            elif clean_ep.endswith("/chat/completions"):
                target_url = clean_ep
            else:
                target_url = f"{clean_ep}/v1/chat/completions"
            req_body = {
                "model": model_name,
                "messages": [
                    {"role": "user", "content": "Ping. Reply with 'OK' if you can read this message."}
                ],
                "max_tokens": 15,
                "temperature": 0.1
            }

        try:
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                r = await client.post(target_url, json=req_body, headers=headers)
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    data = r.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        reply_text = data["choices"][0].get("message", {}).get("content", "").strip()
                        return {
                            "success": True,
                            "message": f"โมเดล '{model_name}' ทำงานได้ปกติ ตอบกลับ: \"{reply_text[:60]}\"",
                            "reply": reply_text,
                            "latency_ms": latency
                        }
                    elif "data" in data and len(data["data"]) > 0:
                        vec_dim = len(data["data"][0].get("embedding", []))
                        return {
                            "success": True,
                            "message": f"โมเดล Embedding '{model_name}' ทำงานสมบูรณ์ (Vector Dim: {vec_dim})",
                            "latency_ms": latency
                        }
                    return {
                        "success": True,
                        "message": f"โมเดล '{model_name}' ตอบรับคำขอสำเร็จ (HTTP 200)",
                        "latency_ms": latency
                    }
                else:
                    err_detail = ""
                    try:
                        err_json = r.json()
                        if "error" in err_json:
                            err_info = err_json["error"]
                            err_detail = err_info.get("message") if isinstance(err_info, dict) else str(err_info)
                        elif "detail" in err_json:
                            err_detail = str(err_json["detail"])
                    except Exception:
                        err_detail = r.text[:200]
                    if not err_detail:
                        err_detail = f"HTTP {r.status_code}"
                    return {
                        "success": False,
                        "message": f"โมเดล '{model_name}' ปฏิเสธคำขอ (HTTP {r.status_code}): {err_detail}",
                        "latency_ms": latency
                    }
        except httpx.TimeoutException:
            latency = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "message": f"โมเดล '{model_name}' ไม่ตอบสนองภายใน 15 วินาที (Connection Timeout)",
                "latency_ms": latency
            }
        except Exception as e:
            return {"success": False, "message": f"เชื่อมต่อไปยังโมเดล '{model_name}' ล้มเหลว: {str(e)}"}

    # 2. Google Gemini Direct
    if provider == "google":
        if not key:
            return {"success": False, "message": "API Key is required for Google Gemini."}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
        req_body = {
            "contents": [{"parts": [{"text": "Ping. Reply with 'OK'"}]}],
            "generationConfig": {"maxOutputTokens": 10, "temperature": 0.1}
        }
        try:
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                r = await client.post(url, json=req_body)
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    data = r.json()
                    candidates = data.get("candidates", [])
                    reply_text = ""
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            reply_text = parts[0].get("text", "").strip()
                    return {
                        "success": True,
                        "message": f"Google Gemini '{model_name}' ตอบกลับสำเร็จ: \"{reply_text[:60]}\"",
                        "reply": reply_text,
                        "latency_ms": latency
                    }
                else:
                    err_msg = ""
                    try:
                        err_msg = r.json().get("error", {}).get("message", r.text[:150])
                    except Exception:
                        err_msg = r.text[:150]
                    return {
                        "success": False,
                        "message": f"Google Gemini Error (HTTP {r.status_code}): {err_msg}",
                        "latency_ms": latency
                    }
        except Exception as e:
            return {"success": False, "message": f"Google Gemini connection failed: {str(e)}"}

    # 3. Anthropic Claude Direct
    if provider == "anthropic":
        if not key:
            return {"success": False, "message": "API Key is required for Anthropic Claude."}
        headers = {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        req_body = {
            "model": model_name,
            "max_tokens": 15,
            "messages": [{"role": "user", "content": "Ping. Reply with 'OK'"}]
        }
        try:
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                r = await client.post("https://api.anthropic.com/v1/messages", json=req_body, headers=headers)
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    data = r.json()
                    contents = data.get("content", [])
                    reply_text = contents[0].get("text", "").strip() if contents else "OK"
                    return {
                        "success": True,
                        "message": f"Claude '{model_name}' ตอบกลับสำเร็จ: \"{reply_text[:60]}\"",
                        "reply": reply_text,
                        "latency_ms": latency
                    }
                else:
                    err_msg = ""
                    try:
                        err_msg = r.json().get("error", {}).get("message", r.text[:150])
                    except Exception:
                        err_msg = r.text[:150]
                    return {
                        "success": False,
                        "message": f"Anthropic Claude Error (HTTP {r.status_code}): {err_msg}",
                        "latency_ms": latency
                    }
        except Exception as e:
            return {"success": False, "message": f"Anthropic connection failed: {str(e)}"}

    # 4. Standard OpenAI / DeepSeek / Groq / Mistral Direct
    target_base = endpoint
    if not target_base:
        if provider == "openai": target_base = "https://api.openai.com/v1"
        elif provider == "deepseek": target_base = "https://api.deepseek.com/v1"
        elif provider == "groq": target_base = "https://api.groq.com/openai/v1"
        elif provider == "mistral": target_base = "https://api.mistral.ai/v1"

    if not key and provider != "azure":
        return {"success": False, "message": f"API Key is required for provider '{provider}'."}

    if target_base:
        url = f"{target_base.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        req_body = {
            "model": model_name,
            "messages": [{"role": "user", "content": "Ping. Reply with 'OK'"}],
            "max_tokens": 15
        }
        try:
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                r = await client.post(url, json=req_body, headers=headers)
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    data = r.json()
                    reply_text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                    return {
                        "success": True,
                        "message": f"{provider.capitalize()} '{model_name}' ตอบกลับสำเร็จ: \"{reply_text[:60]}\"",
                        "reply": reply_text,
                        "latency_ms": latency
                    }
                else:
                    err_msg = ""
                    try:
                        err_msg = r.json().get("error", {}).get("message", r.text[:150])
                    except Exception:
                        err_msg = r.text[:150]
                    return {
                        "success": False,
                        "message": f"{provider.capitalize()} Error (HTTP {r.status_code}): {err_msg}",
                        "latency_ms": latency
                    }
        except Exception as e:
            return {"success": False, "message": f"{provider.capitalize()} connection failed: {str(e)}"}

    # 5. Azure OpenAI
    if provider == "azure":
        if not endpoint:
            return {"success": False, "message": "Azure Endpoint URL is required."}
        headers = {"api-key": key, "Content-Type": "application/json"} if key else {"Content-Type": "application/json"}
        req_body = {
            "messages": [{"role": "user", "content": "Ping. Reply with 'OK'"}],
            "max_tokens": 15
        }
        try:
            async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                r = await client.post(endpoint, json=req_body, headers=headers)
                latency = int((time.time() - start_time) * 1000)
                if r.status_code == 200:
                    return {"success": True, "message": f"Azure OpenAI '{model_name}' ตอบกลับสำเร็จ!", "latency_ms": latency}
                return {"success": False, "message": f"Azure Error (HTTP {r.status_code}): {r.text[:150]}", "latency_ms": latency}
        except Exception as e:
            return {"success": False, "message": f"Azure connection failed: {str(e)}"}

    return {"success": True, "message": f"Provider '{provider}' configuration validated."}
