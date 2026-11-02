import {
  ShieldCheck,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import UserManagementSection from '../settings/UserManagementSection';

export interface UserAndRoleManagementPageProps {
  currentUser?: any;
  onNavigateHome?: () => void;
  showAlert?: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function UserAndRoleManagementPage({
  currentUser,
  onNavigateHome,
  showAlert,
}: UserAndRoleManagementPageProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-50/50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Header / Breadcrumbs Bar */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
        <div className="flex items-center space-x-2 text-xs">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer mr-1"
              title="Return to Projects Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <span className="text-zinc-400 dark:text-zinc-500">Platform</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Settings</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">User and Role Management</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Node v22.18 • SG-NORTH-01
          </span>
        </div>
      </header>

      {/* Main Container: Strictly Left-Aligned (NO mx-auto) */}
      <main className="flex-1 w-full max-w-5xl p-6 md:p-8 space-y-6 text-left">
        {/* Page Title & Intro */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              User and Role Management
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              RBAC Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10.5">
            Manage enterprise system users, assign role-based permissions (RBAC), and review account statuses.
          </p>
        </div>

        {/* User Management Section */}
        <div className="animate-in fade-in duration-150">
          <UserManagementSection currentUser={currentUser} showAlert={showAlert} />
        </div>
      </main>
    </div>
  );
}

