import { useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, Home, GitBranch } from 'lucide-react';
import RailFooter from './RailFooter';

export interface CanvasNavRailProps {
  activeTab: string;
  isSubflowModeActive: boolean;
  isMiniSidebar: boolean;
  onToggleMiniSidebar: () => void;
  nodes: any[];
  selectedProcessNodeIds: string[];
  onSelectAllNodes: () => void;
  onDeselectAllNodes: () => void;
  onToggleNodeSelect: (nodeId: string, currentChecked: boolean) => void;
  onReturnToDashboard: () => void;
  groupMenus: any[];
  hoveredGroup: string | null;
  onGroupMouseEnter: (groupId: string) => void;
  onGroupMouseLeave: () => void;
  currentUser: any;
  isUserManagementOpen: boolean;
  onOpenUserManagement: () => void;
  isUnifiedSettingsOpen: boolean;
  onOpenUnifiedSettings: () => void;
  onLogout: () => void;
}

export default function CanvasNavRail({
  activeTab,
  isSubflowModeActive,
  isMiniSidebar,
  onToggleMiniSidebar,
  nodes,
  selectedProcessNodeIds,
  onSelectAllNodes,
  onDeselectAllNodes,
  onToggleNodeSelect,
  onReturnToDashboard,
  groupMenus,
  hoveredGroup,
  onGroupMouseEnter,
  onGroupMouseLeave,
  currentUser,
  isUserManagementOpen,
  onOpenUserManagement,
  isUnifiedSettingsOpen,
  onOpenUnifiedSettings,
  onLogout,
}: CanvasNavRailProps) {
  // Global shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onToggleMiniSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleMiniSidebar]);

  if (activeTab !== 'logic') return null;

  return (
    <aside
      className={`border-r dark:border-zinc-800 border-zinc-200 dark:bg-[#101014] bg-white flex flex-col justify-between shrink-0 h-full z-20 select-none transition-all duration-200 ease-in-out ${
        isMiniSidebar ? 'w-16' : 'w-56'
      }`}
    >
      {isSubflowModeActive ? (
        // Subflow Node Checklist Mode
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className={`p-3 border-b dark:border-zinc-800 border-zinc-200 flex items-center justify-between ${
              isMiniSidebar ? 'flex-col gap-2' : ''
            }`}>
              {!isMiniSidebar && (
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Subflow Nodes
                  </span>
                </div>
              )}
              <button
                onClick={onToggleMiniSidebar}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title={isMiniSidebar ? 'Expand (Ctrl+B)' : 'Collapse (Ctrl+B)'}
              >
                {isMiniSidebar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Checklist items */}
            <div className="p-3 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
              {!isMiniSidebar ? (
                <>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1 border-b dark:border-zinc-800 border-zinc-200">
                    <span>Selected ({selectedProcessNodeIds.length}/{nodes.length})</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={onSelectAllNodes} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        All
                      </button>
                      <span>|</span>
                      <button onClick={onDeselectAllNodes} className="hover:underline">
                        None
                      </button>
                    </div>
                  </div>
                  {nodes.map(n => {
                    const isChecked = selectedProcessNodeIds.includes(n.id);
                    return (
                      <label
                        key={n.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold'
                            : 'border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleNodeSelect(n.id, isChecked)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 cursor-pointer"
                        />
                        <span className="truncate">{n.data?.label || n.data?.name || n.id}</span>
                      </label>
                    );
                  })}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {nodes.map(n => {
                    const isChecked = selectedProcessNodeIds.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => onToggleNodeSelect(n.id, isChecked)}
                        className={`w-9 h-9 rounded-md flex items-center justify-center border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                        title={`${n.data?.label || n.data?.name || n.id} (Click to toggle)`}
                      >
                        {isChecked ? '✓' : (n.data?.label || n.data?.name || 'N').substring(0, 2).toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <RailFooter
            currentUser={currentUser}
            isUserManagementOpen={isUserManagementOpen}
            onOpenUserManagement={onOpenUserManagement}
            isUnifiedSettingsOpen={isUnifiedSettingsOpen}
            onOpenUnifiedSettings={onOpenUnifiedSettings}
            onLogout={onLogout}
            withTopBorder
            isCollapsed={isMiniSidebar}
            onToggleCollapse={onToggleMiniSidebar}
          />
        </div>
      ) : (
        // Standard Flow Builder Sidebar
        <div className="flex flex-col h-full justify-between">
          <div className="p-3 space-y-4">
            {/* Top Navigation Options: Return Home & Active Flow Builder */}
            <div className="space-y-1">
              {!isMiniSidebar && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
                  Navigation
                </div>
              )}

              {/* Return to Dashboard */}
              <button
                onClick={onReturnToDashboard}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer ${
                  isMiniSidebar ? 'justify-center px-0' : ''
                }`}
                title="Return to Dashboard (กลับหน้า Dashboard)"
              >
                <Home className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                {!isMiniSidebar && <span className="truncate">Projects Dashboard</span>}
              </button>

              {/* Active Menu: Flow Builder (High-contrast LiteLLM style) */}
              <button
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                  isMiniSidebar ? 'justify-center px-0' : ''
                } bg-zinc-100 dark:bg-indigo-500/15 border border-zinc-200 dark:border-indigo-500/30 text-zinc-950 dark:text-white font-bold shadow-xs`}
                title="Flow Builder (Active View)"
              >
                <GitBranch className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                {!isMiniSidebar && (
                  <span className="truncate text-zinc-950 dark:text-white font-bold">
                    Flow Builder
                  </span>
                )}
              </button>
            </div>

            {/* Workflow Tool Component Categories */}
            <div className="space-y-1 pt-1 border-t dark:border-zinc-800 border-zinc-200">
              {!isMiniSidebar && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
                  Node Toolset
                </div>
              )}

              <div className="space-y-1">
                {groupMenus.map((group) => {
                  const isHovered = hoveredGroup === group.id;
                  const IconComponent = group.icon;
                  return (
                    <div
                      key={group.id}
                      onMouseEnter={() => onGroupMouseEnter(group.id)}
                      onMouseLeave={onGroupMouseLeave}
                      className="w-full"
                    >
                      <button
                        onClick={() => onGroupMouseEnter(group.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isMiniSidebar ? 'justify-center px-0' : ''
                        } ${
                          isHovered
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                        title={group.label}
                      >
                        <IconComponent
                          className={`w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform ${
                            isHovered ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''
                          }`}
                        />
                        {!isMiniSidebar && <span className="truncate">{group.label}</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <RailFooter
            currentUser={currentUser}
            isUserManagementOpen={isUserManagementOpen}
            onOpenUserManagement={onOpenUserManagement}
            isUnifiedSettingsOpen={isUnifiedSettingsOpen}
            onOpenUnifiedSettings={onOpenUnifiedSettings}
            onLogout={onLogout}
            withTopBorder
            isCollapsed={isMiniSidebar}
            onToggleCollapse={onToggleMiniSidebar}
          />
        </div>
      )}
    </aside>
  );
}
