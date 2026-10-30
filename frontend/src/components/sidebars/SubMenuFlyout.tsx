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
}: SubMenuFlyoutProps) {
  if (!hoveredGroup || activeTab !== 'logic' || isSubflowModeActive) {
    return null;
  }

  const currentGroupMeta = groupMenus.find(g => g.id === hoveredGroup);
  const templateSection = draggableTemplates.find(s => s.category === hoveredGroup);

  if (!templateSection) return null;

  return (
    <div
      className="absolute left-[58px] top-0 bottom-0 z-40 flex items-start pt-3 pl-1.5 pointer-events-auto"
      onMouseEnter={onFlyoutMouseEnter}
      onMouseLeave={onFlyoutMouseLeave}
    >
      <div className="w-64 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_16px_40px_rgba(30,60,110,0.14)] flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">
        {/* Flyout Header */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentGroupMeta && (
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <currentGroupMeta.icon className="w-4 h-4" />
              </div>
            )}
            <div>
              <h4 className="text-xs font-bold text-slate-800 tracking-wide">
                {currentGroupMeta?.label || hoveredGroup}
              </h4>
              <span className="text-[10px] text-slate-400">
                {templateSection.items.length} {templateSection.items.length === 1 ? 'tool' : 'tools'} • Click or drag
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Flyout Items List */}
        <div className="p-2.5 overflow-y-auto space-y-1.5 max-h-[calc(85vh-65px)]">
          {templateSection.items.map((item: any, itemIdx: number) => (
            <div
              key={itemIdx}
              onClick={() => onCreateNewNode(item.category, item.name)}
              draggable
              onDragStart={(e) => {
                onDragStart(e, 'customNode', item.category, item.name);
                setTimeout(onClose, 50);
              }}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-400 cursor-pointer shadow-sm transition-all group"
              title="Click to add to canvas or drag"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 text-blue-600 group-hover:scale-105 shrink-0 transition-transform">
                  {renderSidebarIcon(item.category, item.name)}
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-600 font-bold shrink-0 ml-1">
                + Add
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

