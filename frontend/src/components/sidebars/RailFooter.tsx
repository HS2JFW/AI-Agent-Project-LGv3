import { useState } from 'react';
import { LogOut, ChevronUp } from 'lucide-react';
import UserProfileMenu from './UserProfileMenu';
import ChangePasswordModal from '../modals/ChangePasswordModal';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <div className={`w-full relative ${withTopBorder ? 'border-t dark:border-zinc-800/80 border-zinc-200/90' : ''}`}>
      {/* LiteLLM-style User Profile Popup Menu */}
      <UserProfileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        isCollapsed={isCollapsed}
      />

      {/* Change Password Dialog Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* User Profile Card Trigger Button & Quick Logout */}
      {!isCollapsed ? (
        <div className="px-2.5 py-2 bg-zinc-50/60 dark:bg-[#0d0d10] flex items-center justify-between gap-1.5">
          {/* Interactive Trigger Card: Opens LiteLLM Profile Menu */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`flex-1 flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-all text-left cursor-pointer min-w-0 ${
              isMenuOpen ? 'bg-zinc-200/70 dark:bg-zinc-800/70 ring-1 ring-zinc-300 dark:ring-zinc-700' : ''
            }`}
            title="Click to view Account Profile & Preferences"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-xs">
                {(currentUser?.username || 'U1').substring(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                  {currentUser?.full_name || currentUser?.username || 'user01'}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="capitalize truncate">{currentUser?.role || 'Superadmin'}</span>
                </div>
              </div>
            </div>

            <ChevronUp
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                isMenuOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
              }`}
            />
          </button>

          {/* Direct Logout Icon Button */}
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
          {/* Collapsed Avatar Trigger: Opens LiteLLM Profile Menu */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-xs cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all ${
              isMenuOpen ? 'ring-2 ring-indigo-500' : ''
            }`}
            title={`${currentUser?.full_name || currentUser?.username || 'user01'} - View Profile`}
          >
            {(currentUser?.username || 'U1').substring(0, 2)}
          </button>

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
