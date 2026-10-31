import React from 'react';
import { X } from 'lucide-react';

export interface SubMenuFlyoutProps {
  hoveredGroup: string | null;
  activeTab: string;
  isSubflowModeActive: boolean;
  groupMenus: any[];
  draggableTemplates: any[];
  onFlyoutMouseEnter: () => void;
  onFlyoutMouseLeave: () => void;
  onClose: () => void;
  onCreateNewNode: (category: string, name: string) => void;
  onDragStart: (e: React.DragEvent, nodeType: string, category: string, name: string) => void;
  renderSidebarIcon: (category: string, name: string) => React.ReactNode;
  isMiniSidebar?: boolean;
}

export default function SubMenuFlyout({
  hoveredGroup,
  activeTab,
  isSubflowModeActive,
  groupMenus,
  draggableTemplates,
  onFlyoutMouseEnter,
  onFlyoutMouseLeave,
  onClose,
  onCreateNewNode,
  onDragStart,
  renderSidebarIcon,
  isMiniSidebar = false,
}: SubMenuFlyoutProps) {
  if (!hoveredGroup || activeTab !== 'logic' || isSubflowModeActive) {
    return null;
  }

  const currentGroupMeta = groupMenus.find(g => g.id === hoveredGroup);
  const templateSection = draggableTemplates.find(s => s.category === hoveredGroup);

  if (!templateSection) return null;

  return (
    <div
      className={`absolute ${isMiniSidebar ? 'left-16' : 'left-56'} top-0 bottom-0 z-40 flex items-start pt-3 pl-2 pointer-events-auto transition-all duration-200`}
      onMouseEnter={onFlyoutMouseEnter}
      onMouseLeave={onFlyoutMouseLeave}
    >
      <div className="w-64 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">
        {/* Flyout Header */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            {currentGroupMeta && (
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
                <currentGroupMeta.icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide truncate">
                {currentGroupMeta?.label || hoveredGroup}
              </h4>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                {templateSection.items.length} {templateSection.items.length === 1 ? 'tool' : 'tools'} • Click or drag
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Flyout Items List */}
        <div className="p-2 overflow-y-auto space-y-1.5 max-h-[calc(85vh-65px)]">
          {templateSection.items.map((item: any, itemIdx: number) => (
            <div
              key={itemIdx}
              onClick={() => onCreateNewNode(item.category, item.name)}
              draggable
              onDragStart={(e) => {
                onDragStart(e, 'customNode', item.category, item.name);
                setTimeout(onClose, 50);
              }}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/40 hover:bg-indigo-50/60 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer shadow-xs transition-all group"
              title="Click to add to canvas or drag"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 shrink-0 transition-transform shadow-2xs">
                  {renderSidebarIcon(item.category, item.name)}
                </div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-semibold shrink-0 ml-1">
                + Add
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
