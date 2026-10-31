import { ShieldCheck, Settings, LogOut, ChevronLeft } from 'lucide-react';

export interface RailFooterProps {
  currentUser: any;
  isUserManagementOpen: boolean;
  onOpenUserManagement: () => void;
  isUnifiedSettingsOpen: boolean;
  onOpenUnifiedSettings: () => void;
  onLogout: () => void;
  withTopBorder?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function RailFooter({
  currentUser,
  isUserManagementOpen,
  onOpenUserManagement,
  isUnifiedSettingsOpen,
  onOpenUnifiedSettings,
  onLogout,
  withTopBorder = false,
  isCollapsed = false,
  onToggleCollapse,
}: RailFooterProps) {
  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  return (
    <div className={`w-full flex flex-col ${withTopBorder ? 'border-t dark:border-zinc-800/80 border-zinc-200/90' : ''}`}>
      {/* Collapse Sidebar Toggle Button */}
      {onToggleCollapse && (
        <div className="p-2 border-b dark:border-zinc-800/60 border-zinc-200/80">
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          >
            <ChevronLeft
              className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
            {!isCollapsed && <span className="truncate">Collapse Sidebar</span>}
          </button>
        </div>
      )}

      {/* Admin, Settings & Logout Actions */}
      <div className={`p-2 flex items-center gap-1.5 ${isCollapsed ? 'flex-col justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col' : ''}`}>
          {/* RBAC User Management (Superadmin / Admin) */}
          {isAdmin && (
            <button
              onClick={onOpenUserManagement}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                isUserManagementOpen
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="User & Role Management (RBAC)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </button>
          )}

          {/* Unified Settings */}
          <button
            onClick={onOpenUnifiedSettings}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              isUnifiedSettingsOpen
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* User Profile Info Footer */}
      <div className={`px-3 py-2.5 bg-zinc-50/60 dark:bg-[#0d0d10] border-t dark:border-zinc-800/80 border-zinc-200/80 flex items-center ${
        isCollapsed ? 'justify-center p-2' : 'justify-between'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-xs">
            {(currentUser?.username || 'U1').substring(0, 2)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                {currentUser?.full_name || currentUser?.username || 'user01'}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="capitalize">{currentUser?.role || 'Superadmin'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
