import { LogOut } from 'lucide-react';

export interface RailFooterProps {
  currentUser: any;
  isUserManagementOpen?: boolean;
  onOpenUserManagement?: () => void;
  isUnifiedSettingsOpen?: boolean;
  onOpenUnifiedSettings?: () => void;
  onLogout: () => void;
  withTopBorder?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function RailFooter({
  currentUser,
  onLogout,
  withTopBorder = false,
  isCollapsed = false,
}: RailFooterProps) {
  return (
    <div className={`w-full ${withTopBorder ? 'border-t dark:border-zinc-800/80 border-zinc-200/90' : ''}`}>
      {/* User Profile Card & Logout (Uncluttered, No Duplicate Settings/User Management Buttons) */}
      {!isCollapsed ? (
        <div className="px-3 py-2.5 bg-zinc-50/60 dark:bg-[#0d0d10] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-xs">
              {(currentUser?.username || 'U1').substring(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                {currentUser?.full_name || currentUser?.username || 'user01'}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="capitalize">{currentUser?.role || 'Superadmin'}</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-2 bg-zinc-50/60 dark:bg-[#0d0d10] flex flex-col items-center gap-2">
          <div 
            className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-xs cursor-default"
            title={`${currentUser?.full_name || currentUser?.username || 'user01'} (${currentUser?.role || 'user'})`}
          >
            {(currentUser?.username || 'U1').substring(0, 2)}
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
