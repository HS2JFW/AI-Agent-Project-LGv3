import React, { useState } from 'react';
import {
  Bot,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Zap,
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Server,
  Sparkles,
  Lock,
  Layers,
  Star,
  Pencil,
  X
} from 'lucide-react';
import type { AiModelConfig } from '../../hooks/useAiModels';
import { getAuthHeaders } from '../../utils/apiConfig';

export interface ModelsAndEndpointsPageProps {
  currentUser?: any;
  onNavigateHome?: () => void;
  aiModels: AiModelConfig[];
  setAiModels: React.Dispatch<React.SetStateAction<AiModelConfig[]>>;
  showAlert?: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
}

interface ProviderOption {
  value: string;
  label: string;
  category: string;
  defaultEndpoint?: string;
  endpointPlaceholder: string;
  modelPlaceholder: string;
  keyPlaceholder: string;
  isEndpointRequired: boolean;
  isKeyRequired: boolean;
  badgeColor: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    value: 'openai_compatible',
    label: 'OpenAI Compatible (AI Gateway, LiteLLM, Ollama, vLLM, OpenRouter)',
    category: 'Gateway & Local',
    defaultEndpoint: 'https://llm.addpay.in.th/v1',
    endpointPlaceholder: 'e.g. https://llm.addpay.in.th/v1, http://localhost:11434/v1, https://openrouter.ai/api/v1',
    modelPlaceholder: 'e.g. qwen35-122b-a10b, gemma-4-31b-it, agents-a1, gpt-4o',
    keyPlaceholder: 'Virtual Key / API Key (Leave blank to use Server Master Key for https://llm.addpay.in.th)',
    isEndpointRequired: true,
    isKeyRequired: false,
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    value: 'google',
    label: 'Google Gemini (Gemini 2.0 Flash, 1.5 Pro)',
    category: 'Cloud Provider',
    defaultEndpoint: '',
    endpointPlaceholder: 'Default: Google Generative AI API (Leave blank for default)',
    modelPlaceholder: 'e.g. gemini-2.0-flash, gemini-1.5-pro, gemini-2.0-flash-thinking-exp',
    keyPlaceholder: 'Google AI Studio API Key (AIzaSy...)',
    isEndpointRequired: false,
    isKeyRequired: true,
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    value: 'openai',
    label: 'OpenAI (GPT-4o, GPT-4o-mini, o1, o3-mini)',
    category: 'Cloud Provider',
    defaultEndpoint: '',
    endpointPlaceholder: 'Default: https://api.openai.com/v1 (Leave blank for default)',
    modelPlaceholder: 'e.g. gpt-4o, gpt-4o-mini, o1, o3-mini',
    keyPlaceholder: 'OpenAI API Key (sk-proj-...)',
    isEndpointRequired: false,
    isKeyRequired: true,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    value: 'anthropic',
    label: 'Anthropic Claude (Claude 3.5 Sonnet, 3.5 Haiku, Opus)',
    category: 'Cloud Provider',
    defaultEndpoint: '',
    endpointPlaceholder: 'Default: https://api.anthropic.com/v1 (Leave blank for default)',
    modelPlaceholder: 'e.g. claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022',
    keyPlaceholder: 'Anthropic API Key (sk-ant-...)',
    isEndpointRequired: false,
    isKeyRequired: true,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    value: 'deepseek',
    label: 'DeepSeek (DeepSeek-V3, DeepSeek-R1 Reasoner)',
    category: 'Cloud Provider',
    defaultEndpoint: '',
    endpointPlaceholder: 'Default: https://api.deepseek.com (Leave blank for default)',
    modelPlaceholder: 'e.g. deepseek-chat, deepseek-reasoner',
    keyPlaceholder: 'DeepSeek API Key (sk-...)',
    isEndpointRequired: false,
    isKeyRequired: true,
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
  {
    value: 'groq',
    label: 'Groq Cloud (Llama 3.3 70B, Ultra-Fast)',
    category: 'Cloud Provider',
    defaultEndpoint: '',
    endpointPlaceholder: 'Default: https://api.groq.com/openai/v1 (Leave blank for default)',
    modelPlaceholder: 'e.g. llama-3.3-70b-versatile, deepseek-r1-distill-llama-70b',
    keyPlaceholder: 'Groq API Key (gsk_...)',
    isEndpointRequired: false,
    isKeyRequired: true,
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  {
    value: 'mistral',
    label: 'Mistral AI (Mistral Large, Codestral)',
    category: 'Cloud Provider',
    defaultEndpoint: '',
    endpointPlaceholder: 'Default: https://api.mistral.ai/v1 (Leave blank for default)',
    modelPlaceholder: 'e.g. mistral-large-latest, codestral-latest',
    keyPlaceholder: 'Mistral API Key',
    isEndpointRequired: false,
    isKeyRequired: true,
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
  {
    value: 'azure',
    label: 'Azure OpenAI Service',
    category: 'Enterprise Cloud',
    defaultEndpoint: '',
    endpointPlaceholder: 'e.g. https://your-resource.openai.azure.com/openai/deployments/...',
    modelPlaceholder: 'e.g. gpt-4o-deployment',
    keyPlaceholder: 'Azure API Key',
    isEndpointRequired: true,
    isKeyRequired: true,
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
];

export default function ModelsAndEndpointsPage({
  currentUser,
  onNavigateHome,
  aiModels,
  setAiModels,
  showAlert,
}: ModelsAndEndpointsPageProps) {
  // --- Check Permissions ---
  const userRole = (currentUser?.role || '').toLowerCase();
  const isSuperAdminOrAdmin = userRole === 'superadmin' || userRole === 'admin';

  // --- Active Tab State ---
  // If Superadmin/Admin, default to 'central'. Otherwise lock to 'personal'.
  const [activeTab, setActiveTab] = useState<'central' | 'personal'>(
    isSuperAdminOrAdmin ? 'central' : 'personal'
  );

  // --- Gateway Sync State ---
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // --- Add Model Form State (Used for both Central and Personal tabs) ---
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [providerValue, setProviderValue] = useState<string>('openai_compatible');
  const [modelIdentifier, setModelIdentifier] = useState<string>('');
  const [displayLabel, setDisplayLabel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [endpointUrl, setEndpointUrl] = useState<string>('');
  const [contextWindow, setContextWindow] = useState<string>('128000');
  const [supportsVision, setSupportsVision] = useState<boolean>(false);
  const [supportsTools, setSupportsTools] = useState<boolean>(true);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // --- Connection Test State ---
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);

  // --- Edit Model State ---
  const [editingModel, setEditingModel] = useState<AiModelConfig | null>(null);
  const [editProvider, setEditProvider] = useState<string>('openai_compatible');
  const [editModelIdentifier, setEditModelIdentifier] = useState<string>('');
  const [editDisplayLabel, setEditDisplayLabel] = useState<string>('');
  const [editApiKey, setEditApiKey] = useState<string>('');
  const [editEndpointUrl, setEditEndpointUrl] = useState<string>('');
  const [editContextWindow, setEditContextWindow] = useState<string>('128000');
  const [editSupportsVision, setEditSupportsVision] = useState<boolean>(false);
  const [editSupportsTools, setEditSupportsTools] = useState<boolean>(true);
  const [editIsEnabled, setEditIsEnabled] = useState<boolean>(true);
  const [editIsDefault, setEditIsDefault] = useState<boolean>(false);
  const [editScope, setEditScope] = useState<'system' | 'personal'>('system');
  const [editShowApiKey, setEditShowApiKey] = useState<boolean>(false);
  const [isTestingEditConnection, setIsTestingEditConnection] = useState<boolean>(false);
  const [editTestResult, setEditTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // --- Clear Stale Models State ---
  const [isClearStaleOpen, setIsClearStaleOpen] = useState<boolean>(false);
  const [clearStaleAction, setClearStaleAction] = useState<'reset_defaults' | 'clear_all' | 'clear_stale'>('reset_defaults');
  const [isClearingStale, setIsClearingStale] = useState<boolean>(false);

  // Current selected provider configs
  const selectedProviderConfig = PROVIDERS.find((p) => p.value === providerValue) || PROVIDERS[0];
  const selectedEditProviderConfig = PROVIDERS.find((p) => p.value === editProvider) || PROVIDERS[0];

  // Filter models
  const centralModels = aiModels.filter((m) => m.scope === 'system' || m.sourceType === 'gateway' || m.sourceType === 'central');
  const personalModels = aiModels.filter((m) => m.scope === 'personal');

  // --- Handlers ---

  const refreshModelsList = async () => {
    try {
      const listRes = await fetch('/api/models', {
        headers: getAuthHeaders(),
      });
      if (listRes.ok) {
        const freshData = await listRes.json();
        const mapped = freshData.map((m: any) => ({
          id: m.id,
          sourceType: m.source_type,
          provider: m.provider,
          modelName: m.model_identifier,
          label: m.display_label,
          endpoint: m.endpoint_url,
          maskedApiKey: m.masked_api_key,
          hasApiKey: m.has_api_key,
          apiKey: '',
          scope: m.scope,
          contextWindow: m.context_window,
          maxTokens: m.max_output_tokens,
          supportsVision: m.supports_vision,
          supportsTools: m.supports_tools,
          isEnabled: m.is_enabled,
          isDefault: m.is_default,
        }));
        setAiModels(mapped);
        localStorage.setItem('global_ai_models', JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('Failed to refresh models', e);
    }
  };

  const handleSyncGateway = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/models/sync-gateway', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshModelsList();
        if (showAlert) showAlert(data.message || 'Models synced from Central AI Gateway successfully', 'Gateway Sync', 'success');
      } else {
        if (showAlert) showAlert(data.detail || 'Failed to sync with Gateway', 'Sync Error', 'error');
      }
    } catch (e: any) {
      if (showAlert) showAlert(e.message || 'Error connecting to sync endpoint', 'Sync Error', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenEditModal = (model: AiModelConfig) => {
    setEditingModel(model);
    setEditProvider(model.provider || 'openai_compatible');
    setEditModelIdentifier(model.modelName || '');
    setEditDisplayLabel(model.label || model.modelName || '');
    setEditEndpointUrl(model.endpoint || '');
    setEditApiKey('');
    setEditShowApiKey(false);
    setEditContextWindow(model.contextWindow ? String(model.contextWindow) : '128000');
    setEditSupportsVision(Boolean(model.supportsVision));
    setEditSupportsTools(model.supportsTools !== false);
    setEditIsEnabled(model.isEnabled !== false);
    setEditIsDefault(Boolean(model.isDefault));
    setEditScope(model.scope || (activeTab === 'personal' ? 'personal' : 'system'));
    setEditTestResult(null);
  };

  const handleTestEditConnection = async () => {
    if (!editingModel) return;
    setIsTestingEditConnection(true);
    setEditTestResult(null);
    try {
      const res = await fetch('/api/models/test-connection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          source_type: 'direct_provider',
          provider: editProvider,
          api_key: editApiKey.trim() || undefined,
          endpoint_url: editEndpointUrl.trim() || undefined,
          model_identifier: editModelIdentifier.trim() || undefined,
          model_id: editingModel.id,
        }),
      });
      const data = await res.json();
      setEditTestResult(data);
      if (data.success) {
        if (showAlert) showAlert(`Connection verified! Response time: ${data.latency_ms || 0}ms`, 'Connection Verified', 'success');
      } else {
        if (showAlert) showAlert(data.message || 'Connection test failed', 'Connection Failed', 'error');
      }
    } catch (e: any) {
      setEditTestResult({ success: false, message: e.message || 'Network error' });
      if (showAlert) showAlert(e.message || 'Connection test failed', 'Test Error', 'error');
    } finally {
      setIsTestingEditConnection(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingModel) return;
    if (!editModelIdentifier.trim()) {
      if (showAlert) showAlert('Model Identifier is required', 'Validation Error', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const payload: any = {
        provider: editProvider,
        model_identifier: editModelIdentifier.trim(),
        display_label: editDisplayLabel.trim() || editModelIdentifier.trim(),
        endpoint_url: editEndpointUrl.trim() || null,
        context_window: parseInt(editContextWindow) || 128000,
        supports_vision: editSupportsVision,
        supports_tools: editSupportsTools,
        is_enabled: editIsEnabled,
        is_default: editIsDefault,
        scope: editScope,
      };
      if (editApiKey.trim()) {
        payload.api_key = editApiKey.trim();
      }

      const res = await fetch(`/api/models/${editingModel.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await refreshModelsList();
        if (showAlert) showAlert(`Model "${payload.display_label}" updated successfully`, 'Model Updated', 'success');
        setEditingModel(null);
      } else {
        const err = await res.json();
        if (showAlert) showAlert(err.detail || 'Failed to update model', 'Update Error', 'error');
      }
    } catch (e: any) {
      if (showAlert) showAlert(e.message || 'Error updating model', 'Update Error', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExecuteClearStale = async () => {
    setIsClearingStale(true);
    try {
      const res = await fetch('/api/models/clear-stale', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: clearStaleAction }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('global_ai_models');
        await refreshModelsList();
        setIsClearStaleOpen(false);
        if (showAlert) showAlert(data.message || 'Cleaned up stale models successfully', 'Catalog Cleaned', 'success');
      } else {
        if (showAlert) showAlert(data.detail || 'Failed to clear models', 'Clear Error', 'error');
      }
    } catch (e: any) {
      if (showAlert) showAlert(e.message || 'Network error while clearing models', 'Error', 'error');
    } finally {
      setIsClearingStale(false);
    }
  };

  const handleTestConnection = async () => {
    if (selectedProviderConfig.isEndpointRequired && !endpointUrl.trim()) {
      if (showAlert) showAlert('Endpoint / Base URL is required for this provider.', 'Validation Error', 'error');
      return;
    }
    if (selectedProviderConfig.isKeyRequired && !apiKey.trim()) {
      if (showAlert) showAlert('API Key is required for this provider.', 'Validation Error', 'error');
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/models/test-connection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          source_type: 'direct_provider',
          provider: providerValue,
          api_key: apiKey.trim() || undefined,
          endpoint_url: endpointUrl.trim() || undefined,
          model_identifier: modelIdentifier.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        if (showAlert) showAlert(`Connection verified! Response time: ${data.latency_ms || 0}ms`, 'Connection Verified', 'success');
      } else {
        if (showAlert) showAlert(data.message || 'Connection test failed', 'Connection Failed', 'error');
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Network error' });
      if (showAlert) showAlert(e.message || 'Connection test failed', 'Test Error', 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleAddModel = async (targetScope: 'system' | 'personal') => {
    if (!modelIdentifier.trim()) {
      if (showAlert) showAlert('Please enter a valid Model Identifier (e.g. gpt-4o, deepseek-chat)', 'Validation Error', 'error');
      return;
    }
    if (selectedProviderConfig.isEndpointRequired && !endpointUrl.trim()) {
      if (showAlert) showAlert('Endpoint / Base URL is required for OpenAI-Compatible providers.', 'Validation Error', 'error');
      return;
    }
    if (selectedProviderConfig.isKeyRequired && !apiKey.trim()) {
      if (showAlert) showAlert('API Key is required for this provider.', 'Validation Error', 'error');
      return;
    }

    try {
      const res = await fetch('/api/models/direct', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          provider: providerValue,
          model_identifier: modelIdentifier.trim(),
          display_label: displayLabel.trim() || modelIdentifier.trim(),
          api_key: apiKey.trim() || undefined,
          endpoint_url: endpointUrl.trim() || undefined,
          context_window: parseInt(contextWindow) || 128000,
          supports_vision: supportsVision,
          supports_tools: supportsTools,
          scope: targetScope,
          source_type: targetScope === 'system' ? 'central' : 'direct_provider',
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setAiModels((prev) => [
          ...prev,
          {
            id: created.id,
            sourceType: created.source_type,
            provider: created.provider,
            modelName: created.model_identifier,
            label: created.display_label,
            endpoint: created.endpoint_url,
            maskedApiKey: created.masked_api_key,
            hasApiKey: created.has_api_key,
            scope: created.scope,
            contextWindow: created.context_window,
            supportsVision: created.supports_vision,
            supportsTools: created.supports_tools,
            isEnabled: true,
            isDefault: false,
          },
        ]);

        // Reset form
        setModelIdentifier('');
        setDisplayLabel('');
        setApiKey('');
        setEndpointUrl('');
        setTestResult(null);
        setShowApiKey(false);
        setIsFormOpen(false);

        const scopeLabel = targetScope === 'system' ? 'Central Model (System)' : 'Personal Model';
        if (showAlert) showAlert(`Model "${created.display_label}" registered as ${scopeLabel} successfully`, 'Model Added', 'success');
      } else {
        const err = await res.json();
        if (showAlert) showAlert(err.detail || 'Failed to register model', 'Save Error', 'error');
      }
    } catch (e: any) {
      if (showAlert) showAlert(e.message || 'Error saving model', 'Save Error', 'error');
    }
  };

  const handleToggleModelEnabled = async (m: AiModelConfig) => {
    const updatedStatus = !m.isEnabled;
    try {
      await fetch(`/api/models/${m.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_enabled: updatedStatus }),
      });
      setAiModels((prev) => prev.map((item) => (item.id === m.id ? { ...item, isEnabled: updatedStatus } : item)));
    } catch (e) {
      setAiModels((prev) => prev.map((item) => (item.id === m.id ? { ...item, isEnabled: updatedStatus } : item)));
    }
  };

  const handleSetDefaultModel = async (modelId: string) => {
    try {
      await fetch(`/api/models/${modelId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_default: true }),
      });
      setAiModels((prev) => prev.map((item) => ({ ...item, isDefault: item.id === modelId })));
      if (showAlert) showAlert('Default system model updated', 'Default Model', 'success');
    } catch (e: any) {
      if (showAlert) showAlert(e.message || 'Failed to update default model', 'Error', 'error');
    }
  };

  const handleDeleteModel = async (id: string, label?: string) => {
    try {
      const res = await fetch(`/api/models/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setAiModels((prev) => prev.filter((m) => m.id !== id));
        if (showAlert) showAlert(`Model "${label || id}" removed successfully`, 'Model Removed', 'info');
      } else {
        const err = await res.json();
        if (showAlert) showAlert(err.detail || 'Failed to delete model', 'Error', 'error');
      }
    } catch (e: any) {
      if (showAlert) showAlert(e.message || 'Failed to delete model', 'Error', 'error');
    }
  };

  const getProviderBadge = (providerName: string) => {
    const p = PROVIDERS.find((item) => item.value === providerName.toLowerCase()) || {
      label: providerName,
      badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border uppercase tracking-wider ${p.badgeColor}`}>
        {providerName === 'openai_compatible' ? 'OpenAI Compatible' : providerName}
      </span>
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-50/50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Header / Breadcrumbs */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
        <div className="flex items-center space-x-2 text-xs">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer mr-1"
              title="Return to Projects Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <span className="text-zinc-400 dark:text-zinc-500">Platform</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Settings</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Model Management</span>
        </div>

        <div className="flex items-center space-x-2">
          {isSuperAdminOrAdmin && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold uppercase tracking-wider">{userRole} Privileges Active</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl p-6 md:p-8 space-y-6 text-left">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Model Management Hub
              </h1>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {aiModels.length} models
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-11.5">
              Multi-source AI orchestration supporting OpenAI-Compatible endpoints, Central Gateway, and Direct Providers.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isSuperAdminOrAdmin && activeTab === 'central' && (
              <>
                <button
                  onClick={() => setIsClearStaleOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 shadow-xs transition-colors cursor-pointer"
                  title="Clear stale / dummy models in DB and sync clean AddPay Gateway catalog"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Clear Stale Models</span>
                </button>

                <button
                  onClick={handleSyncGateway}
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Sync from Central LiteLLM AI Gateway"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Gateway'}</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFormOpen ? 'Close Form' : activeTab === 'central' ? 'Add Central Model' : 'Add Personal Model'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Available for Superadmin and Admin) */}
        {isSuperAdminOrAdmin ? (
          <div className="flex space-x-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 w-fit">
            <button
              onClick={() => {
                setActiveTab('central');
                setTestResult(null);
              }}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'central'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Central Models (โมเดลส่วนกลาง)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {centralModels.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('personal');
                setTestResult(null);
              }}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>My Personal Models (โมเดลส่วนตัว)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                {personalModels.length}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 w-fit text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>My Personal Models (BYOK)</span>
          </div>
        )}

        {/* --- ADD MODEL FORM (Identical capability for both Central & Personal models) --- */}
        {isFormOpen && (
          <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {activeTab === 'central' ? 'Add Central System Model' : 'Add Personal BYOK Model'}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {activeTab === 'central'
                      ? 'โมเดลนี้จะพร้อมใช้งานสำหรับทุกคนในองค์กร (System Scope)'
                      : 'โมเดลนี้จะมองเห็นและใช้งานได้เฉพาะบัญชีของคุณเท่านั้น (Personal Scope)'}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                  activeTab === 'central'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {activeTab === 'central' ? 'System Scope' : 'Personal Scope'}
              </span>
            </div>

            {/* Provider Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block">
                1. Select AI Provider & Protocol *
              </label>
              <select
                value={providerValue}
                onChange={(e) => {
                  setProviderValue(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    [{p.category}] {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Identifier & Display Label */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                  2. Model Identifier (API Name) *
                </label>
                <input
                  type="text"
                  value={modelIdentifier}
                  onChange={(e) => setModelIdentifier(e.target.value)}
                  placeholder={selectedProviderConfig.modelPlaceholder}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                  3. Display Label (Canvas Friendly Name)
                </label>
                <input
                  type="text"
                  value={displayLabel}
                  onChange={(e) => setDisplayLabel(e.target.value)}
                  placeholder="e.g. Qwen 2.5 Coder 32B (Gateway), Gemini 2.0 Direct"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Base URL / Endpoint & API Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                    4. Base URL / Endpoint {selectedProviderConfig.isEndpointRequired ? '*' : '(Optional Override)'}
                  </label>
                  {providerValue === 'openai_compatible' && (
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      Required for OpenAI-Compatible
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder={selectedProviderConfig.endpointPlaceholder}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {providerValue === 'openai_compatible' && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEndpointUrl('https://llm.addpay.in.th/v1');
                        if (!modelIdentifier) setModelIdentifier('qwen35-122b-a10b');
                        if (!displayLabel) setDisplayLabel('Qwen 35 122B (AddPay Gateway)');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer font-semibold transition-colors"
                    >
                      AddPay AI Gateway (https://llm.addpay.in.th/v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEndpointUrl('http://localhost:11434/v1');
                        if (!modelIdentifier) setModelIdentifier('llama3');
                        if (!displayLabel) setDisplayLabel('Llama 3 (Local Ollama)');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors"
                    >
                      Ollama Local
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEndpointUrl('https://openrouter.ai/api/v1');
                        if (!displayLabel) setDisplayLabel('OpenRouter Unified');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors"
                    >
                      OpenRouter
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                    5. API Key {selectedProviderConfig.isKeyRequired ? '*' : '(Optional for Local/Internal)'}
                  </label>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>AES-256 Encrypted</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedProviderConfig.keyPlaceholder}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Specifications & Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-1">
              <div>
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                  Context Window (Tokens)
                </label>
                <input
                  type="number"
                  value={contextWindow}
                  onChange={(e) => setContextWindow(e.target.value)}
                  placeholder="128000"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <input
                  type="checkbox"
                  id="visionCheckbox"
                  checked={supportsVision}
                  onChange={(e) => setSupportsVision(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="visionCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                  Supports Multimodal Vision
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <input
                  type="checkbox"
                  id="toolsCheckbox"
                  checked={supportsTools}
                  onChange={(e) => setSupportsTools(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="toolsCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                  Supports Function Calling / Tools
                </label>
              </div>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>
                  {testResult.message} {testResult.latency_ms ? `(${testResult.latency_ms}ms)` : ''}
                </span>
              </div>
            )}

            {/* Form Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{isTestingConnection ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAddModel(activeTab === 'central' ? 'system' : 'personal')}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{activeTab === 'central' ? 'Save as Central Model' : 'Save as Personal Model'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 1 CONTENT: CENTRAL MODELS (SUPERADMIN & ADMIN) --- */}
        {activeTab === 'central' && isSuperAdminOrAdmin && (
          <div className="space-y-4">
            {/* Status Info Banner */}
            <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Organization Central Model Catalog
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    System Scope
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  โมเดลทั้งหมดในแถบนี้ได้รับการบริหารจัดการโดยผู้ดูแลระบบ และเปิดให้สมาชิกทุกคน (Builders, Operators) เลือกใช้งานใน Visual Canvas ได้
                </p>
              </div>
            </div>

            {/* Central Models Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              {centralModels.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs space-y-2">
                  <Server className="w-8 h-8 mx-auto text-zinc-400 opacity-60" />
                  <p>ยังไม่มีโมเดลส่วนกลางในระบบ</p>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + คลิกที่นี่เพื่อเพิ่ม Central Model แรก
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                      <th className="py-2.5 px-3 font-bold text-center w-16">Active</th>
                      <th className="py-2.5 px-3 font-bold">Provider</th>
                      <th className="py-2.5 px-3 font-bold">Model Identifier / Label</th>
                      <th className="py-2.5 px-3 font-bold">Base Endpoint</th>
                      <th className="py-2.5 px-3 font-bold">Context Window</th>
                      <th className="py-2.5 px-3 font-bold">Capabilities</th>
                      <th className="py-2.5 px-3 font-bold text-center w-24">Default</th>
                      <th className="py-2.5 px-3 font-bold text-center w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {centralModels.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={m.isEnabled ?? true}
                            onChange={() => handleToggleModelEnabled(m)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            title="Toggle active status in canvas"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getProviderBadge(m.provider)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{m.modelName}</span>
                            {m.isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{m.label}</div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px] max-w-[180px] truncate" title={m.endpoint || 'Default Provider Endpoint'}>
                          {m.endpoint || '— Central Default —'}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                          {m.contextWindow ? `${(m.contextWindow / 1000).toFixed(0)}k tokens` : '128k tokens'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1.5">
                            {m.supportsVision && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">
                                Vision
                              </span>
                            )}
                            {m.supportsTools && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                                Tools
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {m.isDefault ? (
                            <span className="text-amber-500 flex items-center justify-center" title="Current Default">
                              <Star className="w-4 h-4 fill-amber-500" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultModel(m.id)}
                              className="text-zinc-400 hover:text-amber-500 transition-colors p-1 rounded cursor-pointer"
                              title="Set as Default Model"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title="Edit Central Model"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m.id, m.label)}
                              className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Central Model"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2 CONTENT: PERSONAL MODELS (ALL USERS) --- */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            {/* Personal Status Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    My Personal BYOK Models
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    Personal Scope
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  โมเดลส่วนตัวของคุณ (Bring Your Own Key) เฉพาะบัญชีของคุณเท่านั้นที่มีสิทธิ์มองเห็นและเรียกใช้งาน API Key ถูกเข้ารหัสด้วย AES-256 ปลอดภัยสูงสุด
                </p>
              </div>
            </div>

            {/* Personal Models Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              {personalModels.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs space-y-2">
                  <Key className="w-8 h-8 mx-auto text-zinc-400 opacity-60" />
                  <p>ยังไม่มีโมเดลส่วนตัวที่บันทึกไว้</p>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                  >
                    + คลิกที่นี่เพื่อเพิ่ม Personal Model (OpenAI Compatible, Gemini, Claude ฯลฯ)
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                      <th className="py-2.5 px-3 font-bold text-center w-16">Active</th>
                      <th className="py-2.5 px-3 font-bold">Provider</th>
                      <th className="py-2.5 px-3 font-bold">Model / Label</th>
                      <th className="py-2.5 px-3 font-bold">Encrypted Key</th>
                      <th className="py-2.5 px-3 font-bold">Endpoint URL</th>
                      <th className="py-2.5 px-3 font-bold">Capabilities</th>
                      <th className="py-2.5 px-3 font-bold text-center w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {personalModels.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={m.isEnabled ?? true}
                            onChange={() => handleToggleModelEnabled(m)}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getProviderBadge(m.provider)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">{m.modelName}</div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{m.label}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                          {m.maskedApiKey || (m.hasApiKey ? '••••••••' : 'None (Public/Local)')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500 max-w-[180px] truncate" title={m.endpoint || 'Standard Cloud Endpoint'}>
                          {m.endpoint || '— Default —'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1.5">
                            {m.supportsVision && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">
                                Vision
                              </span>
                            )}
                            {m.supportsTools && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                                Tools
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 p-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                              title="Edit Personal Model"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m.id, m.label)}
                              className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Personal Model"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Read-only view of Organization Central Models for non-admin users */}
            {!isSuperAdminOrAdmin && centralModels.length > 0 && (
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Available Organization Central Models ({centralModels.length})
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  โมเดลส่วนกลางที่องค์กรจัดเตรียมไว้ให้คุณใช้งานโดยอัตโนมัติ ไม่จำเป็นต้องใส่ API Key เพิ่มเติม
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {centralModels.map((cm) => (
                    <div
                      key={cm.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">{cm.modelName}</span>
                          {cm.isDefault && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500">{cm.label}</div>
                      </div>
                      <div>{getProviderBadge(cm.provider)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- EDIT MODEL MODAL --- */}
        {editingModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 my-8 text-left animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Edit Model Configuration / แก้ไขโมเดล
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      ID: {editingModel.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingModel(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block">
                  1. AI Provider & Protocol *
                </label>
                <select
                  value={editProvider}
                  onChange={(e) => {
                    setEditProvider(e.target.value);
                    setEditTestResult(null);
                  }}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      [{p.category}] {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Identifier & Display Label */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    2. Model Identifier (API Name) *
                  </label>
                  <input
                    type="text"
                    value={editModelIdentifier}
                    onChange={(e) => setEditModelIdentifier(e.target.value)}
                    placeholder={selectedEditProviderConfig.modelPlaceholder}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    3. Display Label (Canvas Friendly Name)
                  </label>
                  <input
                    type="text"
                    value={editDisplayLabel}
                    onChange={(e) => setEditDisplayLabel(e.target.value)}
                    placeholder="e.g. Qwen 3.5 122B (AddPay Gateway)"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Base URL / Endpoint & API Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                      4. Base URL / Endpoint {selectedEditProviderConfig.isEndpointRequired ? '*' : '(Optional Override)'}
                    </label>
                    {editProvider === 'openai_compatible' && (
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        Required
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editEndpointUrl}
                    onChange={(e) => setEditEndpointUrl(e.target.value)}
                    placeholder={selectedEditProviderConfig.endpointPlaceholder}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {editProvider === 'openai_compatible' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      <span className="text-[10px] text-zinc-400 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditEndpointUrl('https://llm.addpay.in.th/v1');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer font-semibold transition-colors"
                      >
                        AddPay Gateway (https://llm.addpay.in.th/v1)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditEndpointUrl('http://localhost:11434/v1');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors"
                      >
                        Ollama Local
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                      5. API Key {editingModel.hasApiKey ? '(Leave blank to keep existing key)' : '(Optional for Local/Internal)'}
                    </label>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>AES-256</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={editShowApiKey ? 'text' : 'password'}
                      value={editApiKey}
                      onChange={(e) => setEditApiKey(e.target.value)}
                      placeholder={editingModel.hasApiKey ? '•••••••• (Stored & Encrypted)' : selectedEditProviderConfig.keyPlaceholder}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setEditShowApiKey(!editShowApiKey)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {editShowApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Context Window & Capabilities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-1">
                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    Context Window (Tokens)
                  </label>
                  <input
                    type="number"
                    value={editContextWindow}
                    onChange={(e) => setEditContextWindow(e.target.value)}
                    placeholder="128000"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-3">
                  <input
                    type="checkbox"
                    id="editVisionCheckbox"
                    checked={editSupportsVision}
                    onChange={(e) => setEditSupportsVision(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="editVisionCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                    Supports Multimodal Vision
                  </label>
                </div>

                <div className="flex items-center space-x-2 pt-3">
                  <input
                    type="checkbox"
                    id="editToolsCheckbox"
                    checked={editSupportsTools}
                    onChange={(e) => setEditSupportsTools(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="editToolsCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                    Supports Function Calling / Tools
                  </label>
                </div>
              </div>

              {/* Status & Scope Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editEnabledCheckbox"
                    checked={editIsEnabled}
                    onChange={(e) => setEditIsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="editEnabledCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                    Active / Enabled
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editDefaultCheckbox"
                    checked={editIsDefault}
                    onChange={(e) => setEditIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="editDefaultCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                    Set as Default Model
                  </label>
                </div>

                {isSuperAdminOrAdmin && (
                  <div className="flex items-center space-x-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Scope:</label>
                    <select
                      value={editScope}
                      onChange={(e) => setEditScope(e.target.value as 'system' | 'personal')}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-medium"
                    >
                      <option value="system">Central Model (System)</option>
                      <option value="personal">Personal Model (BYOK)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Test Connection Result Box */}
              {editTestResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                    editTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {editTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>
                    {editTestResult.message} {editTestResult.latency_ms ? `(${editTestResult.latency_ms}ms)` : ''}
                  </span>
                </div>
              )}

              {/* Edit Modal Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleTestEditConnection}
                  disabled={isTestingEditConnection}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isTestingEditConnection ? 'Testing Connection...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingModel(null)}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- CLEAR STALE MODELS CONFIRMATION MODAL --- */}
        {isClearStaleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Clear Stale Models / ล้างแค็ตตาล็อก Model เก่า
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      ทำความสะอาดและจัดระเบียบโมเดลที่ค้างอยู่ในฐานข้อมูล
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsClearStaleOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 py-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  เลือกรูปแบบการล้างข้อมูล:
                </label>

                <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${clearStaleAction === 'reset_defaults' ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                  <input
                    type="radio"
                    name="clearStaleAction"
                    value="reset_defaults"
                    checked={clearStaleAction === 'reset_defaults'}
                    onChange={() => setClearStaleAction('reset_defaults')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                      1. Purge Legacy & Sync AddPay Gateway (แนะนำ)
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      ลบโมเดลทดสอบเก่าทั้งหมด (gemini-2.0-flash, gpt-4o, claude-3-5-sonnet ที่ไม่มีอยู่จริง) และกู้คืนเฉพาะโมเดลทางการของ AddPay Gateway (qwen35-122b-a10b, gemma-4-31b-it, agents-a1, qwen3-embedding-4b)
                    </span>
                  </div>
                </label>

                <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${clearStaleAction === 'clear_all' ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                  <input
                    type="radio"
                    name="clearStaleAction"
                    value="clear_all"
                    checked={clearStaleAction === 'clear_all'}
                    onChange={() => setClearStaleAction('clear_all')}
                    className="mt-1 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                      2. Clear All System Models & Fresh Re-seed
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      ล้าง Central Model ส่วนกลางทั้งหมดที่มีในฐานข้อมูลทิ้ง และสร้างใหม่เฉพาะ 4 โมเดลหลักของ Gateway
                    </span>
                  </div>
                </label>

                <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${clearStaleAction === 'clear_stale' ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                  <input
                    type="radio"
                    name="clearStaleAction"
                    value="clear_stale"
                    checked={clearStaleAction === 'clear_stale'}
                    onChange={() => setClearStaleAction('clear_stale')}
                    className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                      3. Remove Duplicates Only
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      ลบเฉพาะรายการที่ชื่อโมเดลและ Provider ซ้ำซ้อนกันในฐานข้อมูล
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsClearStaleOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClearStale}
                  disabled={isClearingStale}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isClearingStale && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isClearingStale ? 'กำลังดำเนินการ...' : 'ยืนยันการล้างข้อมูล'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
