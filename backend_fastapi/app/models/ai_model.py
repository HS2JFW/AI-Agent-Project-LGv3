from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
import uuid
from app.database import Base

class AIModel(Base):
    """
    Unified AI Model catalog supporting both:
    1) Central AI Gateway models (LiteLLM Proxy)
    2) Direct Provider models (Google Gemini, OpenAI, Anthropic, Azure, Groq, Custom HTTP)
    """
    __tablename__ = "ai_models"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Model Source & Provider Identifier
    source_type = Column(String(20), nullable=False, default="gateway") # "gateway" | "direct_provider"
    provider = Column(String(50), nullable=False, default="gateway")    # "gateway", "google", "openai", "anthropic", "azure", "groq", "custom_http"
    model_identifier = Column(String(100), nullable=False)              # e.g. "gemini-2.0-flash", "gpt-4o", "claude-3-5-sonnet"
    display_label = Column(String(150), nullable=False)                 # e.g. "Gemini 2.0 Flash (Gateway)"
    
    # Connection & Credentials
    endpoint_url = Column(String(255), nullable=True)                  # Custom endpoint or Azure URL (null for Gateway/default cloud)
    encrypted_api_key = Column(Text, nullable=True)                    # AES-256 encrypted API key
    
    # RBAC & Ownership
    scope = Column(String(20), default="system")                       # "system" (organization-wide) | "personal" (BYOK)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Specifications & Capabilities
    context_window = Column(Integer, default=128000)
    max_output_tokens = Column(Integer, default=8192)
    supports_vision = Column(Boolean, default=False)
    supports_tools = Column(Boolean, default=True)
    temperature_default = Column(Float, default=0.2)
    
    # Cost & Ordering
    cost_per_1k_input = Column(Float, default=0.0)
    cost_per_1k_output = Column(Float, default=0.0)
    is_enabled = Column(Boolean, default=True)                         # Show in visual canvas dropdown
    is_default = Column(Boolean, default=False)                         # Default model when creating new agent node
    display_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
