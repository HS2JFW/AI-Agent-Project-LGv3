import React, { useState } from 'react';
import {
  Bot,
  Key,
  Database,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowLeft
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
  // --- Add AI Model Form State ---
  const [newModelProvider, setNewModelProvider] = useState<string>('Google');
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelLabel, setNewModelLabel] = useState<string>('');
  const [newModelApiKey, setNewModelApiKey] = useState<string>('');
  const [newModelEndpoint, setNewModelEndpoint] = useState<string>('');
  const [newModelIntelligenceMode, setNewModelIntelligenceMode] = useState<string>('Standard / Balanced (Default)');
  const [newModelTemperature] = useState<number>(0.0);
  const [newModelMaxTokens, setNewModelMaxTokens] = useState<string>('');
  const [newModelContextWindow, setNewModelContextWindow] = useState<string>('');
  const [showNewApiKey, setShowNewApiKey] = useState<boolean>(false);

  // --- Edit AI Model State ---
  const [editingAiModelId, setEditingAiModelId] = useState<string | null>(null);
  const [editAiModel, setEditAiModel] = useState<Partial<AiModelConfig>>({});
  const [showEditApiKey, setShowEditApiKey] = useState<boolean>(false);

  const handleEditAiModelStart = (m: AiModelConfig) => {
    setEditingAiModelId(m.id || m.modelName);
    setEditAiModel({ ...m });
    setShowEditApiKey(false);
  };

  const handleEditAiModelSave = () => {
    if (!editAiModel.modelName?.trim()) {
      if (showAlert) showAlert('Model Name cannot be empty', 'Save Error', 'error');
      return;
    }
    setAiModels((prev) =>
      prev.map((m) =>
        (m.id === editAiModel.id || m.modelName === editAiModel.id)
          ? ({ ...m, ...editAiModel, id: m.id } as AiModelConfig)
          : m
      )
    );
    setEditingAiModelId(null);
    if (showAlert) showAlert(`Updated AI Model "${editAiModel.modelName}" successfully`, 'Model Updated', 'success');
  };

  const handleAddAiModel = () => {
    if (!newModelName.trim()) {
      if (showAlert) showAlert('Please enter a valid Model Name', 'Validation Error', 'error');
      return;
    }

    const created: AiModelConfig = {
      id: `custom-${Date.now()}`,
      provider: newModelProvider,
      modelName: newModelName.trim(),
      label: newModelLabel.trim() || newModelName.trim(),
      apiKey: newModelApiKey.trim() || '',
      endpoint: newModelEndpoint.trim() || undefined,
      intelligenceMode: newModelIntelligenceMode,
      temperature: newModelTemperature,
      maxTokens: newModelMaxTokens ? parseInt(newModelMaxTokens) : undefined,
      contextWindow: newModelContextWindow ? parseInt(newModelContextWindow) : undefined,
    };

    setAiModels((prev) => [...prev, created]);
    setNewModelName('');
    setNewModelLabel('');
    setNewModelApiKey('');
    setNewModelEndpoint('');
    setNewModelMaxTokens('');
    setNewModelContextWindow('');
    setShowNewApiKey(false);

    if (showAlert) {
      showAlert(`AI Model "${created.label}" registered successfully`, 'Model Added', 'success');
    }
  };

  const handleDeleteAiModel = (idOrName: string) => {
    setAiModels((prev) => prev.filter((m) => m.id !== idOrName && m.modelName !== idOrName));
    if (showAlert) showAlert('AI Model deleted from system', 'Model Removed', 'info');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-50/50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Header / Breadcrumbs Bar */}
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
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Node v22.18 • SG-NORTH-01
          </span>
        </div>
      </header>

      {/* Main Container: Strictly Left-Aligned (NO mx-auto) */}
      <main className="flex-1 w-full max-w-5xl p-6 md:p-8 space-y-6 text-left">
        {/* Page Title & Intro */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
              <Bot className="w-4 h-4 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Models and Endpoints
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {aiModels.length} models
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10.5">
            Manage registered AI models, endpoints, credentials, and default LLM intelligence parameters.
          </p>
        </div>

        {/* Add New AI Model Form Card */}
        <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <Key className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Add New AI Model API Connection
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                AI Provider
              </label>
              <select
                value={newModelProvider}
                onChange={(e) => setNewModelProvider(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
              >
                <option value="Google">Google (Gemini)</option>
                <option value="OpenAI">OpenAI (ChatGPT / GPT-4)</option>
                <option value="Anthropic">Anthropic (Claude)</option>
                <option value="DeepSeek">DeepSeek AI</option>
                <option value="OpenRouter.ai">OpenRouter.ai (Multi-Provider AI)</option>
                <option value="Custom">Custom / Local LLM</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                Intelligence Mode / Reasoning
              </label>
              <select
                value={newModelIntelligenceMode}
                onChange={(e) => setNewModelIntelligenceMode(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
              >
                <option value="Standard / Balanced (Default)">Standard / Balanced (Default)</option>
                <option value="High Intelligence / Advanced Reasoning">High Intelligence / Advanced Reasoning</option>
                <option value="Thinking Mode (Chain-of-Thought)">Thinking Mode (Chain-of-Thought)</option>
                <option value="Fast / Low Latency">Fast / Low Latency</option>
                <option value="Coding & Math Specialized">Coding & Math Specialized</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                Model Name (e.g., gemini-2.5-flash, gpt-4o)
              </label>
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="e.g., gemini-2.5-flash, gpt-4o, claude-3-5-sonnet"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                Display Label (Optional)
              </label>
              <input
                type="text"
                value={newModelLabel}
                onChange={(e) => setNewModelLabel(e.target.value)}
                placeholder="e.g. Gemini 3.1 Pro (High Intelligence)"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                API Key / Secret Token
              </label>
              <div className="relative">
                <input
                  type={showNewApiKey ? 'text' : 'password'}
                  value={newModelApiKey}
                  onChange={(e) => setNewModelApiKey(e.target.value)}
                  placeholder="AIxaSy... (leave blank to use system ENV)"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 pr-9 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewApiKey(!showNewApiKey)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showNewApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                API Endpoint (Optional)
              </label>
              <input
                type="text"
                value={newModelEndpoint}
                onChange={(e) => setNewModelEndpoint(e.target.value)}
                placeholder="https://... (leave blank for default)"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                Context Window (Tokens)
              </label>
              <input
                type="number"
                value={newModelContextWindow}
                onChange={(e) => setNewModelContextWindow(e.target.value)}
                placeholder="e.g. 1000000 or 2000000"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddAiModel}
                className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add AI Model</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Models Table List Card */}
        <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <span>Registered AI Models ({aiModels.length})</span>
            </h4>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
              Shared automatically across all Agent Nodes in the workflow
            </span>
          </div>

          {aiModels.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              No AI Models registered. Fill out the form above to connect a provider.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                    <th className="py-2.5 px-3 font-bold text-center w-20">Actions</th>
                    <th className="py-2.5 px-3 font-bold">Provider</th>
                    <th className="py-2.5 px-3 font-bold">Model / Label</th>
                    <th className="py-2.5 px-3 font-bold">Intelligence Mode</th>
                    <th className="py-2.5 px-3 font-bold">API Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {aiModels.map((m, idx) => (
                    <React.Fragment key={m.id || idx}>
                      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleEditAiModelStart(m)}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer mr-1.5 inline-block"
                            title="Edit AI Model"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAiModel(m.id || m.modelName)}
                            className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer inline-block"
                            title="Delete AI Model"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{m.provider}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">{m.modelName}</div>
                          {m.label && m.label !== m.modelName && (
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{m.label}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                          {m.intelligenceMode || 'Standard'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                          {m.apiKey ? `${m.apiKey.substring(0, 6)}••••••••` : <span className="italic text-zinc-400">ENV (Default)</span>}
                        </td>
                      </tr>

                      {/* Inline Edit Row */}
                      {editingAiModelId === (m.id || m.modelName) && (
                        <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
                          <td colSpan={5} className="p-4">
                            <div className="space-y-3 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                  Edit Model: {m.modelName}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block mb-1">
                                    Model Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editAiModel.modelName || ''}
                                    onChange={(e) => setEditAiModel({ ...editAiModel, modelName: e.target.value })}
                                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block mb-1">
                                    Display Label
                                  </label>
                                  <input
                                    type="text"
                                    value={editAiModel.label || ''}
                                    onChange={(e) => setEditAiModel({ ...editAiModel, label: e.target.value })}
                                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block mb-1">
                                    API Key
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={showEditApiKey ? 'text' : 'password'}
                                      value={editAiModel.apiKey || ''}
                                      onChange={(e) => setEditAiModel({ ...editAiModel, apiKey: e.target.value })}
                                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 pr-8 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowEditApiKey(!showEditApiKey)}
                                      className="absolute right-2 top-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                                    >
                                      {showEditApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                  onClick={() => setEditingAiModelId(null)}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-xs"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleEditAiModelSave}
                                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs transition-colors cursor-pointer"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
