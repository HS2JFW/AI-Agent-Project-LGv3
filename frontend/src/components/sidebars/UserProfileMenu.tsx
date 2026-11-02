import { useState, useEffect, useRef } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Mail, 
  CreditCard, 
  Copy, 
  Check, 
  KeyRound, 
  LogOut 
} from 'lucide-react';

export interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  isCollapsed?: boolean;
}

export default function UserProfileMenu({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenChangePassword,
  isCollapsed = false,
}: UserProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<'email' | 'userId' | null>(null);

  // Feature toggle switches (persisted in localStorage like LiteLLM)
  const [hideNewFeatures, setHideNewFeatures] = useState<boolean>(() => {
    return localStorage.getItem('litellm_pref_hide_new_features') === 'true';
  });
  const [hideAllPrompts, setHideAllPrompts] = useState<boolean>(() => {
    return localStorage.getItem('litellm_pref_hide_all_prompts') === 'true';
  });
  const [hideBlogPosts, setHideBlogPosts] = useState<boolean>(() => {
    return localStorage.getItem('litellm_pref_hide_blog_posts') === 'true';
  });
  const [hideBouncingIcon, setHideBouncingIcon] = useState<boolean>(() => {
    return localStorage.getItem('litellm_pref_hide_bouncing_icon') === 'true';
  });

  // Handle outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolved user info values
  const userEmail = currentUser?.email || `${currentUser?.username || 'user01'}@mdc.ai`;
  const rawUserId = currentUser?.id || '67cbf498-c24e-45d5-9981-a831bfa20199';
  const displayUserId = rawUserId.length > 20 ? `${rawUserId.substring(0, 18)}...` : rawUserId;
  const userRole = currentUser?.role || 'Super Admin';
  const userTier = currentUser?.role === 'superadmin' ? 'Enterprise' : 'Standard';

  const handleCopy = (text: string, field: 'email' | 'userId') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };

  const togglePreference = (
    key: string,
    currentVal: boolean,
    setter: (val: boolean) => void
  ) => {
    const nextVal = !currentVal;
    setter(nextVal);
    localStorage.setItem(key, String(nextVal));
  };

  return (
    <div
      ref={menuRef}
      className={`fixed ${
        isCollapsed ? 'bottom-3 left-16' : 'bottom-16 left-3'
      } z-50 w-72 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none`}
    >
      {/* 1. Header: Brand & Version */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
          <span>AI Builder</span>
          <span className="text-base">🌴</span>
        </div>
        <span className="text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-200/80 dark:border-zinc-700/80">
          v3.0
        </span>
      </div>

      {/* 2. Account Details Section */}
      <div className="px-4 py-3 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
        {/* Tier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Crown className="w-3.5 h-3.5" />
            <span className="font-medium">Tier</span>
          </div>
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-0.5 rounded-full font-medium text-[11px] flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-500" />
            <span>{userTier}</span>
          </span>
        </div>

        {/* Role */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium">Role</span>
          </div>
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-0.5 rounded-full font-medium text-[11px] capitalize">
            {userRole}
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 shrink-0">
            <Mail className="w-3.5 h-3.5" />
            <span className="font-medium">Email</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]" title={userEmail}>
              {userEmail}
            </span>
            <button
              onClick={() => handleCopy(userEmail, 'email')}
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title={copiedField === 'email' ? 'Copied!' : 'Copy Email'}
            >
              {copiedField === 'email' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* User ID */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
            <span className="font-medium">User ID</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]" title={rawUserId}>
              {displayUserId}
            </span>
            <button
              onClick={() => handleCopy(rawUserId, 'userId')}
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title={copiedField === 'userId' ? 'Copied!' : 'Copy User ID'}
            >
              {copiedField === 'userId' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Divider */}
      <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

      {/* 4. Preferences / Toggles (LiteLLM Style) */}
      <div className="px-4 py-3 space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
        {/* Toggle 1: Hide New Feature Indicators */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]">Hide New Feature Indicators</span>
          <button
            type="button"
            onClick={() =>
              togglePreference(
                'litellm_pref_hide_new_features',
                hideNewFeatures,
                setHideNewFeatures
              )
            }
            className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              hideNewFeatures ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        {/* Toggle 2: Hide All Prompts */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]">Hide All Prompts</span>
          <button
            type="button"
            onClick={() =>
              togglePreference(
                'litellm_pref_hide_all_prompts',
                hideAllPrompts,
                setHideAllPrompts
              )
            }
            className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              hideAllPrompts ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        {/* Toggle 3: Hide Blog Posts */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]">Hide Blog Posts</span>
          <button
            type="button"
            onClick={() =>
              togglePreference(
                'litellm_pref_hide_blog_posts',
                hideBlogPosts,
                setHideBlogPosts
              )
            }
            className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              hideBlogPosts ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        {/* Toggle 4: Hide Bouncing Icon */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]">Hide Bouncing Icon</span>
          <button
            type="button"
            onClick={() =>
              togglePreference(
                'litellm_pref_hide_bouncing_icon',
                hideBouncingIcon,
                setHideBouncingIcon
              )
            }
            className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              hideBouncingIcon ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
          </button>
        </div>
      </div>

      {/* 5. Divider */}
      <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

      {/* 6. Action Items */}
      <div className="p-1.5 space-y-0.5">
        {/* Change Password */}
        <button
          onClick={() => {
            onClose();
            onOpenChangePassword();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span>Change Password</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

