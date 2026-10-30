import { useState, useEffect } from 'react';

export interface AiModelConfig {
  id: string;
  provider: string;
  endpoint?: string;
  modelName: string;
  apiKey: string;
  label?: string;
  intelligenceMode?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
}

export const DEFAULT_AI_MODELS: AiModelConfig[] = [
  { id: 'gemini-3.1-flash-lite', provider: 'Google', modelName: 'gemini-3.1-flash-lite', apiKey: '', label: 'Gemini 3.1 Flash Lite (Working)', intelligenceMode: 'Fast / Low Latency' },
  { id: 'gemini-3.1-flash-lite-preview', provider: 'Google', modelName: 'gemini-3.1-flash-lite-preview', apiKey: '', label: 'Gemini 3.1 Flash Lite Preview', intelligenceMode: 'Fast / Low Latency' },
  { id: 'gemini-3-flash-preview', provider: 'Google', modelName: 'gemini-3-flash-preview', apiKey: '', label: 'Gemini 3 Flash Preview', intelligenceMode: 'Standard / Balanced' },
  { id: 'gemini-flash-lite-latest', provider: 'Google', modelName: 'gemini-flash-lite-latest', apiKey: '', label: 'Gemini Flash Lite Latest', intelligenceMode: 'Fast / Low Latency' },
  { id: 'gemini-2.0-flash', provider: 'Google', modelName: 'gemini-2.0-flash', apiKey: '', label: 'Gemini 2.0 Flash (Free)', intelligenceMode: 'Fast / Standard' },
  { id: 'gemini-2.0-flash-lite', provider: 'Google', modelName: 'gemini-2.0-flash-lite-preview-02-05', apiKey: '', label: 'Gemini 2.0 Flash Lite (Free)', intelligenceMode: 'Fast / Low Latency' },
  { id: 'gemini-3.1-pro', provider: 'Google', modelName: 'gemini-3.1-pro-high', apiKey: '', label: 'Gemini 3.1 Pro (High)', intelligenceMode: 'High Intelligence / Advanced Reasoning' },
  { id: 'gemini-2.5-flash', provider: 'Google', modelName: 'gemini-2.5-flash', apiKey: '', label: 'Gemini 2.5 Flash (Stable)', intelligenceMode: 'Standard / Balanced (Default)' },
  { id: 'gemini-1.5-pro', provider: 'Google', modelName: 'gemini-1.5-pro', apiKey: '', label: 'Gemini 1.5 Pro', intelligenceMode: 'Standard / Balanced (Default)' },
  { id: 'gemini-1.5-flash', provider: 'Google', modelName: 'gemini-1.5-flash', apiKey: '', label: 'Gemini 1.5 Flash', intelligenceMode: 'Fast / Low Latency' }
];

export function useAiModels() {
  const [aiModels, setAiModels] = useState<AiModelConfig[]>(() => {
    try {
      const saved = localStorage.getItem('global_ai_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          DEFAULT_AI_MODELS.forEach((defModel) => {
            if (!merged.find((m) => m.id === defModel.id)) {
              merged.push(defModel);
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.error('Failed to load global_ai_models', e);
    }
    return DEFAULT_AI_MODELS;
  });

  useEffect(() => {
    localStorage.setItem('global_ai_models', JSON.stringify(aiModels));
  }, [aiModels]);

  return {
    aiModels,
    setAiModels,
    defaultAiModels: DEFAULT_AI_MODELS,
  };
}

