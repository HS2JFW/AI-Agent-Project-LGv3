import { useState, useEffect } from 'react';
import { FolderKanban, Sparkles, Settings } from 'lucide-react';
import RailFooter from './RailFooter';

export interface DashboardNavRailProps {
  activeTab: string;
  onNavigateHome: () => void;
  onNavigateSettings?: () => void;
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

  return (
    <aside
      className={`border-r dark:border-zinc-800 border-zinc-200 dark:bg-[#101014] bg-white flex flex-col justify-between shrink-0 h-full z-20 select-none transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="p-3 space-y-4">
        {/* Brand Header */}
        <div className={`flex items-center gap-2.5 px-1 pb-2 border-b dark:border-zinc-800 border-zinc-200 ${isCollapsed ? 'justify-center' : ''}`}>
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

        {/* Navigation Menu */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
              Platform
            </div>
          )}

          {/* 1. Projects / Overview (Active on process tab) */}
          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'process'
                ? 'bg-zinc-100 dark:bg-indigo-500/15 border border-zinc-200 dark:border-indigo-500/30 text-zinc-950 dark:text-white font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-medium'
            }`}
            title="Projects & Analytics (ภาพรวมโปรเจกต์)"
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

          {/* 2. Setting */}
          <button
            onClick={onNavigateSettings}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'settings'
                ? 'bg-zinc-100 dark:bg-indigo-500/15 border border-zinc-200 dark:border-indigo-500/30 text-zinc-950 dark:text-white font-bold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-medium'
            }`}
            title="Setting (การตั้งค่า)"
          >
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
          </button>
        </div>
      </div>

      {/* Footer Actions & Profile */}
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
