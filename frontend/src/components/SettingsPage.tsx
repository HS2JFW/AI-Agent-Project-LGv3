import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Bot, 
  Sliders, 
  Key, 
  Database, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  CreditCard, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Undo2, 
  Redo2, 
  Activity, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import type { AiModelConfig } from '../hooks/useAiModels';

export interface SettingsPageProps {
  initialTab?: 'profile' | 'ai' | 'canvas';
  currentUser?: any;
  onNavigateHome?: () => void;
  onTabChange?: (tab: 'profile' | 'ai' | 'canvas') => void;
  // AI Models
  aiModels: AiModelConfig[];
  setAiModels: React.Dispatch<React.SetStateAction<AiModelConfig[]>>;
  showAlert?: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
  // Canvas Settings
  historyLimit: number;
  setHistoryLimit: (limit: number) => void;
  pastCount: number;
  futureCount: number;
  undo: () => void;
  redo: () => void;
  onClearHistory?: () => void;
}

export default function SettingsPage({
  initialTab = 'profile',
  currentUser,
  onNavigateHome,
  onTabChange,
  aiModels,
  setAiModels,
  showAlert,
  historyLimit,
  setHistoryLimit,
  pastCount,
  futureCount,
  undo,
  redo,
  onClearHistory,
}: SettingsPageProps) {
  const [currentTab, setCurrentTab] = useState<'profile' | 'ai' | 'canvas'>(initialTab);

  React.useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  const handleTabClick = (tab: 'profile' | 'ai' | 'canvas') => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
    try {
      const isSettings = window.location.pathname.toLowerCase().includes('settings');
      const basePath = isSettings ? '/settings' : '/setting';
      const search = tab !== 'profile' ? `?tab=${tab}` : '';
      window.history.replaceState({ tab: 'settings', subTab: tab }, '', `${basePath}${search}`);
    } catch {
      // Ignore if history state cannot be modified
    }
  };

  // --- Add AI Model Form State ---
  const [newModelProvider, setNewModelProvider] = useState<string>('Google');
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelLabel, setNewModelLabel] = useState<string>('');
  const [newModelApiKey, setNewModelApiKey] = useState<string>('');
  const [newModelEndpoint, setNewModelEndpoint] = useState<string>('');
  const [newModelIntelligenceMode, setNewModelIntelligenceMode] = useState<string>('Standard / Balanced (Default)');
  const [newModelTemperature, setNewModelTemperature] = useState<number>(0.0);
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
    if (showAlert) showAlert('AI Model updated successfully', 'Saved', 'success');
  };

  const handleAddAiModel = () => {
    if (!newModelName.trim()) {
      if (showAlert) showAlert('กรุณาระบุชื่อ Model Name', 'Add Model Error', 'error');
      else alert('กรุณาระบุชื่อ Model Name');
      return;
    }
    const id = `${newModelProvider.toLowerCase()}-${newModelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: AiModelConfig = {
      id,
      provider: newModelProvider,
      modelName: newModelName.trim(),
      apiKey: newModelApiKey.trim(),
      endpoint: newModelEndpoint.trim(),
      label: newModelLabel.trim() || `${newModelProvider} - ${newModelName.trim()}`,
      intelligenceMode: newModelIntelligenceMode,
      temperature: newModelTemperature,
      maxTokens: newModelMaxTokens ? Number(newModelMaxTokens) : undefined,
      contextWindow: newModelContextWindow ? Number(newModelContextWindow) : undefined
    };
    setAiModels((prev) => [...prev, newEntry]);
    setNewModelName('');
    setNewModelLabel('');
    setNewModelApiKey('');
    setNewModelEndpoint('');
    setNewModelIntelligenceMode('Standard / Balanced (Default)');
    setNewModelTemperature(0.0);
    setNewModelMaxTokens('');
    setNewModelContextWindow('');
    if (showAlert) showAlert(`AI Model "${newEntry.label}" added successfully`, 'Model Added', 'success');
  };

  const handleDeleteAiModel = (idOrModelName: string) => {
    setAiModels((prev) => prev.filter((m) => m.id !== idOrModelName && m.modelName !== idOrModelName));
    if (showAlert) showAlert('AI Model removed successfully', 'Deleted', 'info');
  };

  const username = currentUser?.username || 'user01';

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
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Setting</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Node v22.18 • SG-NORTH-01
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Page Title & Intro */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Setting</h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10.5">
            Manage your user account profile, configure registered AI models, and adjust workspace preferences.
          </p>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentTab === 'profile'
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => handleTabClick('ai')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentTab === 'ai'
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Models</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              currentTab === 'ai' 
                ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800' 
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}>
              {aiModels.length}
            </span>
          </button>

          <button
            onClick={() => handleTabClick('canvas')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentTab === 'canvas'
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Canvas & Controls</span>
          </button>
        </div>

        {/* Tab 1: Profile */}
        {currentTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* User Account Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block">Full Name</span>
                <p className="text-zinc-900 dark:text-zinc-100 font-medium text-sm flex items-center space-x-1.5">
                  <span>{currentUser?.full_name || 'Enterprise User (Admin)'}</span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block">Username</span>
                <p className="text-zinc-900 dark:text-zinc-100 font-mono font-medium text-sm">@{username}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block">Role</span>
                <p className="text-zinc-700 dark:text-zinc-300 font-mono text-xs capitalize flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{currentUser?.role || 'Superadmin'}</span>
                </p>
              </div>
            </div>

            {/* Package Details Section */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-900 dark:text-zinc-100">Current Subscription Package</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tracking-tight">
                    AI Agent Enterprise Pro Package
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    แพ็กเกจระดับองค์กร • สิทธิ์การใช้งานระบบประมวลผล AI Agent และ Pipeline อัตโนมัติเต็มรูปแบบ
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active • ชำระเงินแล้ว</span>
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-1">รอบบิล: รายปี (Annual Plan)</p>
                </div>
              </div>

              {/* Package Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 relative z-10">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
                  <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Start Date</span>
                  </div>
                  <p className="text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100">15 Jan 2026</p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
                  <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Expiry Date</span>
                  </div>
                  <p className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">15 Jan 2027</p>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400">(เหลืออีก 108 วัน)</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
                  <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Amount Paid</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">฿ 48,000 / ปี</p>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">Invoice #INV-9821</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60">
                  <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold mb-1">
                    <Key className="w-3.5 h-3.5 text-zinc-400" />
                    <span>License Key</span>
                  </div>
                  <p className="text-[11px] font-mono font-semibold text-zinc-800 dark:text-zinc-200 truncate" title="LIC-LG3-9984-ENT">
                    LIC-LG3-9984-ENT
                  </p>
                </div>
              </div>
            </div>

            {/* Quota and Usage Limits */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <span>Package Quota & Resources (โควตาสิทธิการใช้งาน)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Workflows Quota */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Workflows Creation</span>
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">Unlimited (ไม่จำกัด)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-zinc-900 dark:bg-zinc-100 h-full w-full" />
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">สร้างและจัดเก็บ Workflow ได้ไม่จำกัดจำนวนโปรเจกต์</p>
                </div>

                {/* Monthly AI Executions */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Execution Runs / Month</span>
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">8,450 / 50,000</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-zinc-900 dark:bg-zinc-100 h-full w-[17%]" />
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">เหลือโควตา 41,550 รัน สำหรับรอบเดือนนี้</p>
                </div>

                {/* Concurrency */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Concurrent Pipelines</span>
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">10 Simultaneous</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">รันประมวลผลหลาย Workflow ขนานกันได้สูงสุด 10 สายงาน</p>
                </div>

                {/* AI Models Access */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center space-x-1.5">
                      <Database className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Multi-Provider Models</span>
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">All Providers Unlocked</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">ปลดล็อกทุกโมเดลระดับสูง Gemini, OpenAI, Claude, DeepSeek</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Models */}
        {currentTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-150">
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
          </div>
        )}

        {/* Tab 3: Canvas */}
        {currentTab === 'canvas' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* History Limits and Undo/Redo Engine Card */}
            <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <Sliders className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Canvas Undo / Redo History Configuration
                </h4>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Maximum Undo History Steps
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={historyLimit}
                    onChange={(e) => {
                      const val = Math.max(5, Math.min(200, Number(e.target.value) || 50));
                      setHistoryLimit(val);
                    }}
                    className="w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Range: 5 - 200 steps (Current setting: {historyLimit})
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Determines how many canvas changes and node position adjustments are retained in memory. Higher limits allow longer rollback history.
                </p>
              </div>

              {/* History Stack Status & Manual Controls */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block">
                  History Stack Status
                </span>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs block">Undo Steps</span>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">
                      {pastCount} available
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs block">Redo Steps</span>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">
                      {futureCount} available
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={pastCount === 0}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo Step</span>
                    <span className="text-[9px] font-normal opacity-60">(Ctrl+Z)</span>
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={futureCount === 0}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>Redo Step</span>
                    <span className="text-[9px] font-normal opacity-60">(Ctrl+Y)</span>
                  </button>
                  {onClearHistory && (
                    <button
                      type="button"
                      onClick={onClearHistory}
                      disabled={pastCount === 0 && futureCount === 0}
                      className="py-2 px-3 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Purge Undo & Redo History Stacks"
                    >
                      Clear Stack
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Canvas Navigation & Shortcuts Info Card */}
            <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <Activity className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Canvas Controls & Shortcuts Guide
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Pan / Navigate Canvas</span>
                  <p className="text-[11px]">Hold Right-Click / Scroll Wheel or Drag background to pan around nodes.</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Zoom Range</span>
                  <p className="text-[11px]">Mouse wheel zooms from 0.25x up to 2.0x scale with crisp vector rendering.</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Multi-Selection</span>
                  <p className="text-[11px]">Click and drag a marquee selection box across nodes to select and move multiple nodes.</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Keyboard Shortcuts</span>
                  <p className="text-[11px]">Ctrl+B toggles Sidebar • Ctrl+J toggles Dark/Light theme • Del removes nodes.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
