import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ai_model import AIModel
from app.utils.crypto import encrypt_secret
from app.config import AI_GATEWAY_URL, AI_GATEWAY_KEY

logger = logging.getLogger(__name__)

async def ensure_default_models(db: AsyncSession) -> None:
    """
    Seed initial central AddPay AI Gateway models if the catalog is empty
    (e.g. after fresh PostgreSQL database initialization).
    """
    res = await db.execute(select(AIModel))
    existing = res.scalars().all()
    if existing:
        return

    defaults = [
        {
            "provider": "openai_compatible",
            "model_identifier": "gemma-4-31b-it",
            "display_label": "gemma-4-31b-it",
            "endpoint_url": AI_GATEWAY_URL,
            "api_key": AI_GATEWAY_KEY,
            "context_window": 128000,
            "supports_vision": False,
            "supports_tools": True,
            "scope": "system",
            "is_default": True
        },
        {
            "provider": "openai_compatible",
            "model_identifier": "qwen35-122b-a10b",
            "display_label": "Qwen 3.5 122B (AddPay Gateway)",
            "endpoint_url": AI_GATEWAY_URL,
            "api_key": AI_GATEWAY_KEY,
            "context_window": 128000,
            "supports_vision": False,
            "supports_tools": True,
            "scope": "system",
            "is_default": False
        },
        {
            "provider": "openai_compatible",
            "model_identifier": "agents-a1",
            "display_label": "Agents A1 (AddPay Gateway)",
            "endpoint_url": AI_GATEWAY_URL,
            "api_key": AI_GATEWAY_KEY,
            "context_window": 128000,
            "supports_vision": False,
            "supports_tools": True,
            "scope": "system",
            "is_default": False
        },
        {
            "provider": "openai_compatible",
            "model_identifier": "qwen3-embedding-4b",
            "display_label": "Qwen 3 Embedding 4B (AddPay Gateway)",
            "endpoint_url": AI_GATEWAY_URL,
            "api_key": AI_GATEWAY_KEY,
            "context_window": 32768,
            "supports_vision": False,
            "supports_tools": False,
            "scope": "system",
            "is_default": False
        }
    ]

    for m in defaults:
        enc_key = encrypt_secret(m["api_key"]) if m.get("api_key") else None
        model = AIModel(
            provider=m["provider"],
            model_identifier=m["model_identifier"],
            display_label=m["display_label"],
            endpoint_url=m["endpoint_url"],
            encrypted_api_key=enc_key,
            context_window=m["context_window"],
            supports_vision=m["supports_vision"],
            supports_tools=m["supports_tools"],
            scope=m["scope"],
            is_default=m["is_default"],
            is_enabled=True,
            source_type="gateway"
        )
        db.add(model)
    await db.commit()
    logger.info("Initialized default central AI models (AddPay Gateway) successfully.")
