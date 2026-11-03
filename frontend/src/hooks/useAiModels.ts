import { useState, useEffect, useCallback } from 'react';

export interface AiModelConfig {
  id: string;
  sourceType?: 'gateway' | 'direct_provider';
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
  { id: 'gemini-2.0-flash', sourceType: 'gateway', provider: 'google', modelName: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Gateway)', isDefault: true, isEnabled: true, contextWindow: 1048576, supportsVision: true, supportsTools: true },
  { id: 'gemini-1.5-pro', sourceType: 'gateway', provider: 'google', modelName: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Gateway)', isDefault: false, isEnabled: true, contextWindow: 2097152, supportsVision: true, supportsTools: true },
  { id: 'gpt-4o', sourceType: 'gateway', provider: 'openai', modelName: 'gpt-4o', label: 'GPT-4o (Gateway)', isDefault: false, isEnabled: true, contextWindow: 128000, supportsVision: true, supportsTools: true },
  { id: 'claude-3-5-sonnet', sourceType: 'gateway', provider: 'anthropic', modelName: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Gateway)', isDefault: false, isEnabled: true, contextWindow: 200000, supportsVision: true, supportsTools: true }
];

export function useAiModels() {
  const [aiModels, setAiModels] = useState<AiModelConfig[]>(DEFAULT_AI_MODELS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/models');
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

    // Fallback to localStorage or defaults
    try {
      const saved = localStorage.getItem('global_ai_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiModels(parsed);
          return parsed;
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
      const res = await fetch('/api/models/sync-gateway', { method: 'POST' });
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
    context_window?: number;
    supports_vision?: boolean;
    supports_tools?: boolean;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/models/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create direct model');
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
      const res = await fetch(`/api/models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update model');
      }
      await fetchModels();
    } finally {
      setIsLoading(false);
    }
  };

  const deleteModel = async (modelId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/models/${modelId}`, {
        method: 'DELETE',
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
    source_type: string;
    provider: string;
    api_key?: string;
    endpoint_url?: string;
  }) => {
    const res = await fetch('/api/models/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    testConnection,
  };
}
