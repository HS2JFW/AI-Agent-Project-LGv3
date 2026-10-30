import { ShieldCheck, Settings, LogOut } from 'lucide-react';

export interface RailFooterProps {
  currentUser: any;
  isUserManagementOpen: boolean;
  onOpenUserManagement: () => void;
  isUnifiedSettingsOpen: boolean;
  onOpenUnifiedSettings: () => void;
  onLogout: () => void;
  withTopBorder?: boolean;
}

export default function RailFooter({
  currentUser,
  isUserManagementOpen,
  onOpenUserManagement,
  isUnifiedSettingsOpen,
  onOpenUnifiedSettings,
  onLogout,
  withTopBorder = false,
}: RailFooterProps) {
  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  return (
    <div className={`flex flex-col items-center space-y-2.5 w-full px-1.5 pb-2 ${withTopBorder ? 'pt-2 border-t border-white/20' : ''}`}>
      {/* RBAC User Management (Superadmin / Admin) */}
      {isAdmin && (
        <button
          onClick={onOpenUserManagement}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isUserManagementOpen
              ? 'bg-cyber-neon/30 text-cyber-neon border border-cyber-neon/50 shadow-neon-glow scale-105'
              : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-102'
          }`}
          title="User & Role Management (RBAC)"
        >
          <ShieldCheck className="w-5 h-5 text-cyber-neon" />
        </button>
      )}

      {/* Settings */}
      <button
        onClick={onOpenUnifiedSettings}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isUnifiedSettingsOpen
            ? 'bg-white/25 text-white shadow-md scale-105'
            : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-102'
        }`}
        title="Settings (การตั้งค่า)"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-rose-500/30 transition-all cursor-pointer"
        title="Logout (ออกจากระบบ)"
      >
        <LogOut className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

