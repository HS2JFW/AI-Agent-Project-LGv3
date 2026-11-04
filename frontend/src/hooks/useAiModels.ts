import { useState, useEffect, useCallback } from 'react';
import { getBackendUrl, getAuthHeaders, getAuthOnlyHeaders } from '../utils/apiConfig';

export interface AiModelConfig {
  id: string;
  sourceType?: 'gateway' | 'direct_provider' | 'central';
  provider: string;
  endpoint?: string;
  modelName: string;
  apiKey?: string;
  maskedApiKey?: string;
  hasApiKey?: boolean;
  label?: string;
  intelligenceMode?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  isEnabled?: boolean;
  isDefault?: boolean;
  supportsVision?: boolean;
  supportsTools?: boolean;
  scope?: 'system' | 'personal';
}

export const DEFAULT_AI_MODELS: AiModelConfig[] = [
  {
    id: 'qwen35-122b-a10b',
    sourceType: 'central',
    provider: 'openai_compatible',
    modelName: 'qwen35-122b-a10b',
    label: 'Qwen 3.5 122B (AddPay Gateway)',
    endpoint: 'https://llm.addpay.in.th/v1',
    isDefault: true,
    isEnabled: true,
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    scope: 'system'
  },
  {
    id: 'gemma-4-31b-it',
    sourceType: 'central',
    provider: 'google',
    modelName: 'gemma-4-31b-it',
    label: 'Gemma 4 31B IT (AddPay Gateway)',
    endpoint: 'https://llm.addpay.in.th/v1',
    isDefault: false,
    isEnabled: true,
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
    scope: 'system'
  },
  {
    id: 'agents-a1',
    sourceType: 'central',
    provider: 'openai_compatible',
    modelName: 'agents-a1',
    label: 'Agents A1 (AddPay Gateway)',
    endpoint: 'https://llm.addpay.in.th/v1',
    isDefault: false,
    isEnabled: true,
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    scope: 'system'
  },
  {
    id: 'qwen3-embedding-4b',
    sourceType: 'central',
    provider: 'openai_compatible',
    modelName: 'qwen3-embedding-4b',
    label: 'Qwen 3 Embedding 4B (AddPay Gateway)',
    endpoint: 'https://llm.addpay.in.th/v1',
    isDefault: false,
    isEnabled: true,
    contextWindow: 32768,
    supportsVision: false,
    supportsTools: false,
    scope: 'system'
  }
];

export function useAiModels() {
  const [aiModels, setAiModels] = useState<AiModelConfig[]>(DEFAULT_AI_MODELS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${getBackendUrl()}/api/models`, {
        headers: getAuthOnlyHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: AiModelConfig[] = data.map((m: any) => ({
            id: m.id || m.model_identifier,
            sourceType: m.source_type || 'gateway',
            provider: m.provider || 'gateway',
            modelName: m.model_identifier,
            label: m.display_label || m.model_identifier,
            endpoint: m.endpoint_url || undefined,
            maskedApiKey: m.masked_api_key || undefined,
            hasApiKey: m.has_api_key || false,
            apiKey: '',
            scope: m.scope || 'system',
            contextWindow: m.context_window,
            maxTokens: m.max_output_tokens,
            temperature: m.temperature_default,
            supportsVision: m.supports_vision,
            supportsTools: m.supports_tools,
            isEnabled: m.is_enabled ?? true,
            isDefault: m.is_default ?? false,
          }));
          setAiModels(mapped);
          localStorage.setItem('global_ai_models', JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Could not fetch models from backend, using cached models.', e);
    } finally {
      setIsLoading(false);
    }

    // Fallback to localStorage or defaults, filtering out obsolete legacy dummy entries
    try {
      const saved = localStorage.getItem('global_ai_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const legacyDummyIds = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gpt-4o', 'claude-3-5-sonnet'];
          const cleaned = parsed.filter((m: any) => !legacyDummyIds.includes(m.modelName || m.id));
          if (cleaned.length > 0) {
            setAiModels(cleaned);
            return cleaned;
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_AI_MODELS;
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const syncGateway = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/models/sync-gateway`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      await fetchModels();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const createDirectModel = async (payload: {
    provider: string;
    model_identifier: string;
    display_label: string;
    api_key?: string;
    endpoint_url?: string;
    scope?: string;
    source_type?: string;
    context_window?: number;
    max_output_tokens?: number;
    supports_vision?: boolean;
    supports_tools?: boolean;
    temperature_default?: number;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/models/direct`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create model');
      }
      const data = await res.json();
      await fetchModels();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const updateModel = async (modelId: string, payload: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/models/${modelId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update model');
      }
      const data = await res.json();
      await fetchModels();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const clearStaleModels = async (action: 'reset_defaults' | 'clear_all' | 'clear_stale' = 'reset_defaults') => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/models/clear-stale`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to clear models');
      }
      const data = await res.json();
      localStorage.removeItem('global_ai_models');
      await fetchModels();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteModel = async (modelId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/models/${modelId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete model');
      }
      await fetchModels();
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (payload: {
    source_type?: string;
    provider: string;
    api_key?: string;
    endpoint_url?: string;
    model_identifier?: string;
    model_id?: string;
  }) => {
    const res = await fetch(`${getBackendUrl()}/api/models/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  };

  return {
    aiModels,
    setAiModels,
    defaultAiModels: DEFAULT_AI_MODELS,
    isLoading,
    fetchModels,
    syncGateway,
    createDirectModel,
    updateModel,
    deleteModel,
    clearStaleModels,
    testConnection,
  };
}
