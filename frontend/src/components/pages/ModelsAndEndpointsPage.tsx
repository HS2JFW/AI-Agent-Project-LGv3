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
  AlertCircle
} from 'lucide-react';
import type { AiModelConfig } from '../../hooks/useAiModels';

export interface ModelsAndEndpointsPageProps {
  currentUser?: any;
  onNavigateHome?: () => void;
  aiModels: AiModelConfig[];
  setAiModels: React.Dispatch<React.SetStateAction<AiModelConfig[]>>;
  showAlert?: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ModelsAndEndpointsPage({
  onNavigateHome,
  aiModels,
  setAiModels,
  showAlert,
}: ModelsAndEndpointsPageProps) {
  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<'gateway' | 'direct'>('gateway');

  // --- Gateway Sync State ---
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // --- Add Direct Model Form State ---
  const [newModelProvider, setNewModelProvider] = useState<string>('Google');
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelLabel, setNewModelLabel] = useState<string>('');
  const [newModelApiKey, setNewModelApiKey] = useState<string>('');
  const [newModelEndpoint, setNewModelEndpoint] = useState<string>('');
  const [newModelContextWindow, setNewModelContextWindow] = useState<string>('128000');
  const [newModelSupportsVision, setNewModelSupportsVision] = useState<boolean>(false);
  const [showNewApiKey, setShowNewApiKey] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);

  // Filter models by source type
  const gatewayModels = aiModels.filter((m) => m.sourceType === 'gateway' || (!m.sourceType && !m.apiKey));
  const directModels = aiModels.filter((m) => m.sourceType === 'direct_provider' || (m.sourceType !== 'gateway' && m.apiKey));

  // --- Handlers ---

  const handleSyncGateway = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/models/sync-gateway', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        // Refresh models list from backend
        const listRes = await fetch('/api/models');
        if (listRes.ok) {
          const freshData = await listRes.json();
          setAiModels(freshData.map((m: any) => ({
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
            isDefault: m.is_default
          })));
        }
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

  const handleTestConnection = async () => {
    if (!newModelApiKey.trim()) {
      if (showAlert) showAlert('Please enter an API Key to test connection', 'Validation Error', 'error');
      return;
    }
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/models/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: 'direct_provider',
          provider: newModelProvider.toLowerCase(),
          api_key: newModelApiKey.trim(),
          endpoint_url: newModelEndpoint.trim() || undefined,
        })
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

  const handleAddDirectModel = async () => {
    if (!newModelName.trim()) {
      if (showAlert) showAlert('Please enter a valid Model Identifier (e.g. gemini-2.0-flash)', 'Validation Error', 'error');
      return;
    }

    try {
      const res = await fetch('/api/models/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newModelProvider.toLowerCase(),
          model_identifier: newModelName.trim(),
          display_label: newModelLabel.trim() || newModelName.trim(),
          api_key: newModelApiKey.trim() || undefined,
          endpoint_url: newModelEndpoint.trim() || undefined,
          context_window: parseInt(newModelContextWindow) || 128000,
          supports_vision: newModelSupportsVision,
          scope: 'system'
        })
      });

      if (res.ok) {
        const created = await res.json();
        setAiModels((prev) => [...prev, {
          id: created.id,
          sourceType: 'direct_provider',
          provider: created.provider,
          modelName: created.model_identifier,
          label: created.display_label,
          endpoint: created.endpoint_url,
          maskedApiKey: created.masked_api_key,
          hasApiKey: created.has_api_key,
          contextWindow: created.context_window,
          supportsVision: created.supports_vision,
          isEnabled: true,
          isDefault: false
        }]);

        // Reset form
        setNewModelName('');
        setNewModelLabel('');
        setNewModelApiKey('');
        setNewModelEndpoint('');
        setTestResult(null);
        setShowNewApiKey(false);

        if (showAlert) showAlert(`Direct model "${created.display_label}" registered successfully`, 'Model Added', 'success');
      } else {
        const err = await res.json();
        if (showAlert) showAlert(err.detail || 'Failed to register direct model', 'Save Error', 'error');
      }
    } catch (e: any) {
      if (showAlert) showAlert(e.message || 'Error saving direct model', 'Save Error', 'error');
    }
  };

  const handleToggleModelEnabled = async (m: AiModelConfig) => {
    const updatedStatus = !m.isEnabled;
    try {
      await fetch(`/api/models/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: updatedStatus })
      });
      setAiModels((prev) => prev.map((item) => (item.id === m.id ? { ...item, isEnabled: updatedStatus } : item)));
    } catch (e) {
      // Local fallback
      setAiModels((prev) => prev.map((item) => (item.id === m.id ? { ...item, isEnabled: updatedStatus } : item)));
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await fetch(`/api/models/${id}`, { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
    setAiModels((prev) => prev.filter((m) => m.id !== id));
    if (showAlert) showAlert('Model removed from catalog', 'Model Removed', 'info');
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
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Models and Endpoints</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Central AI Gateway Active</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl p-6 md:p-8 space-y-6 text-left">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Models and Endpoints Hub
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {aiModels.length} models
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10.5">
              Centralized AI Gateway orchestration with seamless Direct External Provider connections.
            </p>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncGateway}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Models from Gateway'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 w-fit">
          <button
            onClick={() => setActiveTab('gateway')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'gateway'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>Central AI Gateway</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {gatewayModels.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Direct External Providers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              {directModels.length}
            </span>
          </button>
        </div>

        {/* TAB 1: CENTRAL AI GATEWAY */}
        {activeTab === 'gateway' && (
          <div className="space-y-4">
            {/* Gateway Status Card */}
            <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Enterprise LiteLLM Gateway
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    Zero-Key Leakage Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  All models below route through your organization's unified AI proxy with automatic load balancing, retry, and token spend tracking.
                </p>
              </div>
            </div>

            {/* Gateway Models List */}
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                    <th className="py-2.5 px-3 font-bold text-center w-16">Active</th>
                    <th className="py-2.5 px-3 font-bold">Provider</th>
                    <th className="py-2.5 px-3 font-bold">Model Identifier / Label</th>
                    <th className="py-2.5 px-3 font-bold">Context Window</th>
                    <th className="py-2.5 px-3 font-bold">Capabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {gatewayModels.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={m.isEnabled ?? true}
                          onChange={() => handleToggleModelEnabled(m)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                          {m.provider}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">{m.modelName}</span>
                          {m.isDefault && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{m.label}</div>
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
                          <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                            Tools / JSON
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECT EXTERNAL PROVIDERS */}
        {activeTab === 'direct' && (
          <div className="space-y-6">
            {/* Form: Add Direct Provider Model */}
            <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <Key className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Add Direct Provider Model Connection
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    AI Provider
                  </label>
                  <select
                    value={newModelProvider}
                    onChange={(e) => setNewModelProvider(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Google">Google (Gemini API)</option>
                    <option value="OpenAI">OpenAI (Direct Key)</option>
                    <option value="Anthropic">Anthropic (Claude)</option>
                    <option value="Groq">Groq (Ultra-Fast Llama/DeepSeek)</option>
                    <option value="Azure">Azure OpenAI</option>
                    <option value="Custom_HTTP">Custom OpenAI-Compatible Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    Model Identifier *
                  </label>
                  <input
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="e.g. gemini-2.0-flash, gpt-4o, llama-3.3-70b"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    Display Label (Canvas)
                  </label>
                  <input
                    type="text"
                    value={newModelLabel}
                    onChange={(e) => setNewModelLabel(e.target.value)}
                    placeholder="e.g. Gemini 2.0 Direct"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    API Key (Encrypted with AES-256) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewApiKey ? 'text' : 'password'}
                      value={newModelApiKey}
                      onChange={(e) => setNewModelApiKey(e.target.value)}
                      placeholder="Enter provider API key"
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewApiKey(!showNewApiKey)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showNewApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    Custom Base URL (Optional for Azure/Custom)
                  </label>
                  <input
                    type="text"
                    value={newModelEndpoint}
                    onChange={(e) => setNewModelEndpoint(e.target.value)}
                    placeholder="https://api.groq.com/openai/v1"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                    Context Window (Tokens)
                  </label>
                  <input
                    type="number"
                    value={newModelContextWindow}
                    onChange={(e) => setNewModelContextWindow(e.target.value)}
                    placeholder="128000"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="visionCheckbox"
                    checked={newModelSupportsVision}
                    onChange={(e) => setNewModelSupportsVision(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="visionCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                    Supports Multimodal Vision & Image Analysis
                  </label>
                </div>
              </div>

              {/* Test Connection Banner */}
              {testResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddDirectModel}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Direct Model</span>
                </button>
              </div>
            </div>

            {/* Direct Models Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              {directModels.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                  No Direct Provider models registered yet. Use the form above to add a Google or OpenAI direct key.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                      <th className="py-2.5 px-3 font-bold text-center w-20">Actions</th>
                      <th className="py-2.5 px-3 font-bold">Provider</th>
                      <th className="py-2.5 px-3 font-bold">Model / Label</th>
                      <th className="py-2.5 px-3 font-bold">Stored Key</th>
                      <th className="py-2.5 px-3 font-bold">Scope</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {directModels.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteModel(m.id)}
                            className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Direct Model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                            {m.provider}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">{m.modelName}</div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{m.label}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                          {m.maskedApiKey || '••••••••'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[9px] rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                            {m.scope || 'system'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
