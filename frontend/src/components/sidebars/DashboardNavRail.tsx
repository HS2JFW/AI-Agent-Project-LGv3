import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Sparkles, 
  Settings, 
  Bot, 
  Sliders, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight, 
  PanelLeft
} from 'lucide-react';
import RailFooter from './RailFooter';

export interface DashboardNavRailProps {
  activeTab: string;
  currentSettingsTab?: 'profile' | 'ai' | 'canvas' | 'users';
  onNavigateHome: () => void;
  onNavigateSettings?: (subTab?: 'profile' | 'ai' | 'canvas' | 'users') => void;
  currentUser: any;
  isUserManagementOpen: boolean;
  onOpenUserManagement: () => void;
  isUnifiedSettingsOpen: boolean;
  onOpenUnifiedSettings: () => void;
  onLogout: () => void;
  onNavigateCanvas?: () => void;
  isMiniSidebar?: boolean;
  onToggleMiniSidebar?: () => void;
}

export default function DashboardNavRail({
  activeTab,
  currentSettingsTab = 'profile',
  onNavigateHome,
  onNavigateSettings,
  currentUser,
  isUserManagementOpen,
  onOpenUserManagement,
  isUnifiedSettingsOpen,
  onOpenUnifiedSettings,
  onLogout,
  isMiniSidebar: propMiniSidebar,
  onToggleMiniSidebar: propToggle,
}: DashboardNavRailProps) {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_builder_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // State to manage expand/collapse of Settings sub-menus
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(true);

  const isCollapsed = propMiniSidebar !== undefined ? propMiniSidebar : internalCollapsed;
  const handleToggleCollapse = propToggle || (() => {
    const next = !internalCollapsed;
    setInternalCollapsed(next);
    try {
      localStorage.setItem('ai_builder_sidebar_collapsed', next ? 'true' : 'false');
    } catch {
      // storage disabled
    }
  });

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  // Keyboard shortcut: Ctrl + B or Cmd + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleCollapse]);

  if (activeTab === 'logic') return null;

  const handleSettingsClick = () => {
    if (activeTab !== 'settings') {
      setIsSettingsExpanded(true);
      onNavigateSettings?.(currentSettingsTab || 'ai');
    } else {
      // Toggle collapse/expand when already on settings
      setIsSettingsExpanded((prev) => !prev);
    }
  };

  const handleSubmenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab !== 'settings') {
      onNavigateSettings?.(currentSettingsTab || 'ai');
      setIsSettingsExpanded(true);
    } else {
      setIsSettingsExpanded((prev) => !prev);
    }
  };

  return (
    <aside
      className={`border-r dark:border-zinc-800 border-zinc-200 dark:bg-[#101014] bg-white flex flex-col justify-between shrink-0 h-full z-20 select-none transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Top Section: Brand Header with LiteLLM-style Top Toggle Button */}
      <div className="p-3 space-y-4">
        {/* LiteLLM-style Top Header with Sidebar Collapse Toggle Button */}
        <div className={`flex items-center gap-2 px-1 pb-3 border-b dark:border-zinc-800 border-zinc-200 ${
          isCollapsed ? 'flex-col justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                  AI Builder <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">v3.0</span>
                </div>
                <div className="text-[10px] text-zinc-400 truncate">Enterprise Platform</div>
              </div>
            )}
          </div>

          {/* LiteLLM-style Collapse / Expand Toggle Button at the top */}
          <button
            onClick={handleToggleCollapse}
            className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0 ${
              isCollapsed ? 'mt-1' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Menu (Platform Workspace) */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
              Platform
            </div>
          )}

          {/* 1. Projects & Workflows */}
          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'process'
                ? 'bg-zinc-100 dark:bg-indigo-500/15 border border-zinc-200 dark:border-indigo-500/30 text-zinc-950 dark:text-white font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-medium'
            }`}
            title="Projects & Workflows (ภาพรวมโปรเจกต์)"
          >
            <FolderKanban
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'process' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}
            />
            {!isCollapsed && (
              <span className={`truncate ${activeTab === 'process' ? 'text-zinc-950 dark:text-white font-bold' : ''}`}>
                Projects & Workflows
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Flexible Spacer: pushes Settings to the bottom at all times */}
      <div className="flex-1" />

      {/* Bottom Section: Settings Menu & Interactive Submenu */}
      <div className="p-3 pt-2 space-y-1 border-t dark:border-zinc-800/60 border-zinc-200/80">
        {!isCollapsed && (
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
            System
          </div>
        )}

        {/* Main Setting Menu Button with Expand/Collapse toggle */}
        <div
          onClick={handleSettingsClick}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          } ${
            activeTab === 'settings'
              ? 'bg-zinc-100 dark:bg-indigo-500/15 border border-zinc-200 dark:border-indigo-500/30 text-zinc-950 dark:text-white font-bold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-medium'
          }`}
          title="Setting (การตั้งค่า)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Settings
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}
            />
            {!isCollapsed && (
              <span className={`truncate ${activeTab === 'settings' ? 'text-zinc-950 dark:text-white font-bold' : ''}`}>
                Setting
              </span>
            )}
          </div>
          {!isCollapsed && activeTab === 'settings' && (
            <button
              type="button"
              onClick={handleSubmenuToggle}
              className="p-1 rounded hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              title={isSettingsExpanded ? "Click to collapse sub-menu" : "Click to expand sub-menu"}
            >
              {isSettingsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
          )}
        </div>

        {/* Interactive Collapsible Sub-menu under Setting */}
        {!isCollapsed && isSettingsExpanded && activeTab === 'settings' && (
          <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-indigo-500/40 dark:border-indigo-500/50 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Sub-menu 1: AI Models */}
            <button
              onClick={() => onNavigateSettings?.('ai')}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                currentSettingsTab === 'ai'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Bot className="w-3 h-3 shrink-0" />
              <span className="truncate">AI Models</span>
            </button>

            {/* Sub-menu 3: Canvas */}
            <button
              onClick={() => onNavigateSettings?.('canvas')}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                currentSettingsTab === 'canvas'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Sliders className="w-3 h-3 shrink-0" />
              <span className="truncate">Canvas & Controls</span>
            </button>

            {/* Sub-menu 4: User and Role Management (RBAC) */}
            {isAdmin && (
              <button
                onClick={() => onNavigateSettings?.('users')}
                className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  currentSettingsTab === 'users'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate">User & Role Management</span>
                </div>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono shrink-0">
                  RBAC
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer: User Profile Info & Logout */}
      <RailFooter
        currentUser={currentUser}
        isUserManagementOpen={isUserManagementOpen}
        onOpenUserManagement={onOpenUserManagement}
        isUnifiedSettingsOpen={activeTab === 'settings' || isUnifiedSettingsOpen}
        onOpenUnifiedSettings={onNavigateSettings || onOpenUnifiedSettings}
        onLogout={onLogout}
        withTopBorder
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
    </aside>
  );
}
