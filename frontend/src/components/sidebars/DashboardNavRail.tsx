import { Home, FolderKanban } from 'lucide-react';
import RailFooter from './RailFooter';

export interface DashboardNavRailProps {
  activeTab: string;
  onNavigateHome: () => void;
  currentUser: any;
  isUserManagementOpen: boolean;
  onOpenUserManagement: () => void;
  isUnifiedSettingsOpen: boolean;
  onOpenUnifiedSettings: () => void;
  onLogout: () => void;
}

export default function DashboardNavRail({
  activeTab,
  onNavigateHome,
  currentUser,
  isUserManagementOpen,
  onOpenUserManagement,
  isUnifiedSettingsOpen,
  onOpenUnifiedSettings,
  onLogout,
}: DashboardNavRailProps) {
  if (activeTab === 'logic') return null;

  return (
    <aside className="w-[58px] bg-[#1A6AFF] flex flex-col h-full z-30 select-none items-center py-3.5 justify-between shadow-[4px_0_24px_rgba(26,106,255,0.18)]">
      <div className="flex flex-col items-center w-full space-y-4">
        {/* Dashboard Header: Replaced 'Dashboard' text with Home Icon */}
        <div className="flex flex-col items-center justify-center pb-2.5 border-b border-white/20 w-full px-2">
          <button
            onClick={onNavigateHome}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm hover:scale-105"
            title="Dashboard Home (หน้าหลัก Dashboard)"
          >
            <Home className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Top Menu Items: Projects, Workflow */}
        <div className="flex flex-col items-center w-full space-y-2.5 px-1.5">
          {/* 1. projects */}
          <button
            onClick={onNavigateHome}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
              activeTab === 'process'
                ? 'bg-white/25 text-white shadow-md scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-102'
            }`}
            title="Projects (Workflow Monitor)"
          >
            <FolderKanban className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <RailFooter
        currentUser={currentUser}
        isUserManagementOpen={isUserManagementOpen}
        onOpenUserManagement={onOpenUserManagement}
        isUnifiedSettingsOpen={isUnifiedSettingsOpen}
        onOpenUnifiedSettings={onOpenUnifiedSettings}
        onLogout={onLogout}
      />
    </aside>
  );
}

