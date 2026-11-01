import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Users, 
  User as UserIcon, 
  Shield, 
  Trash2, 
  Globe, 
  Lock, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export interface WorkflowShareModalProps {
  workflow: any | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  backendUrl?: string;
  onWorkflowUpdated?: () => void;
}

export default function WorkflowShareModal({
  workflow,
  isOpen,
  onClose,
  currentUser,
  backendUrl,
  onWorkflowUpdated,
}: WorkflowShareModalProps) {
  void currentUser;
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
  const [shares, setShares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareType, setShareType] = useState<'user' | 'role'>('user');
  const [targetUsername, setTargetUsername] = useState('');
  const [targetRole, setTargetRole] = useState<'operator' | 'viewer' | 'builder'>('operator');
  const [permission, setPermission] = useState<'view' | 'execute' | 'edit'>('view');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState<boolean>(Boolean(workflow?.is_public));

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('app_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (workflow) {
      setIsPublic(Boolean(workflow.is_public));
      fetchShares();
    }
  }, [workflow]);

  const fetchShares = async () => {
    if (!workflow?.id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(workflow.id)}/shares`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setShares(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || 'Could not load shares');
      }
    } catch (e) {
      setErrorMessage('Network error while loading shares');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!workflow?.id) return;
    const nextPublic = !isPublic;
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(workflow.id)}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_public: nextPublic }),
      });
      if (res.ok) {
        setIsPublic(nextPublic);
        setSuccessMessage(nextPublic ? 'Workflow is now Public to entire organization' : 'Workflow is now Private');
        setTimeout(() => setSuccessMessage(null), 3000);
        onWorkflowUpdated?.();
      }
    } catch (e) {
      setErrorMessage('Failed to update workflow privacy status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow?.id) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload: any = {
      permission,
    };

    if (shareType === 'user') {
      if (!targetUsername.trim()) {
        setErrorMessage('กรุณาระบุ Username ของผู้รับสิทธิ์');
        return;
      }
      payload.shared_with_username = targetUsername.trim();
    } else {
      payload.shared_with_role = targetRole;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(workflow.id)}/shares`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTargetUsername('');
        setSuccessMessage('แชร์สิทธิ์เรียบร้อยแล้ว');
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchShares();
        onWorkflowUpdated?.();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || 'Failed to add share');
      }
    } catch (e) {
      setErrorMessage('Network error while adding share');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!workflow?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/${encodeURIComponent(workflow.id)}/shares/${encodeURIComponent(shareId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setShares(prev => prev.filter(s => s.id !== shareId));
        setSuccessMessage('ยกเลิกการแชร์เรียบร้อย');
        setTimeout(() => setSuccessMessage(null), 3000);
        onWorkflowUpdated?.();
      }
    } catch (e) {
      setErrorMessage('Failed to revoke share');
    }
  };

  if (!isOpen || !workflow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <span>Share Workflow</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {workflow.name}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                กำหนดสิทธิ์การมองเห็น การสั่งรัน และการแก้ไขสำหรับเพื่อนร่วมงาน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Messages */}
          {errorMessage && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Privacy Switch: Public vs Private */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPublic ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                  <span>{isPublic ? 'Public Workflow (สาธารณะในองค์กร)' : 'Private Workflow (ส่วนตัว)'}</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isPublic 
                    ? 'ทุกคนในองค์กรสามารถมองเห็นและเปิดดู Workflow นี้ได้'
                    : 'เฉพาะคุณและผู้ที่ได้รับสิทธิ์แชร์ด้านล่างเท่านั้นที่เข้าถึงได้'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTogglePublic}
              disabled={isSaving}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                isPublic 
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {isPublic ? 'Make Private' : 'Make Public'}
            </button>
          </div>

          {/* Add Share Form */}
          <form onSubmit={handleAddShare} className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>แชร์สิทธิ์ใหม่</span>
            </h4>

            {/* Target Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShareType('user')}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                  shareType === 'user'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>แชร์ให้บุคคล (User)</span>
              </button>

              <button
                type="button"
                onClick={() => setShareType('role')}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                  shareType === 'role'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>แชร์ให้ทั้ง Role</span>
              </button>
            </div>

            {/* Inputs based on type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shareType === 'user' ? (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Username ผู้รับสิทธิ์
                  </label>
                  <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="เช่น builder01, operator01"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    เลือก Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e: any) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operator">Operator (ผู้สั่งรันและควบคุม)</option>
                    <option value="viewer">Viewer (ผู้ดูอย่างเดียว)</option>
                    <option value="builder">Builder (นักพัฒนา Workflow)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  ระดับสิทธิ์ (Permission)
                </label>
                <select
                  value={permission}
                  onChange={(e: any) => setPermission(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="view">👁️ Can View (ดูผลและ Canvas)</option>
                  <option value="execute">⚡ Can Execute (สั่งรัน Workflow ได้)</option>
                  <option value="edit">✏️ Can Edit (แก้ไข Node / Edge ได้)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <span>บันทึกการแชร์</span>
              </button>
            </div>
          </form>

          {/* Active Shares List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              ผู้ได้รับสิทธิ์ในปัจจุบัน ({shares.length})
            </h4>

            {isLoading ? (
              <div className="text-center py-4 text-xs text-zinc-400">กำลังโหลดรายการสิทธิ์...</div>
            ) : shares.length === 0 ? (
              <div className="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                ยังไม่มีการแชร์สิทธิ์เฉพาะเจาะจง
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => {
                  const isUser = Boolean(share.shared_with_user_id || share.shared_with_username);
                  const permColor = 
                    share.permission === 'edit'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : share.permission === 'execute'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';

                  return (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#151518]"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                          {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {isUser ? `@${share.shared_with_username || 'user'}` : `Role: ${share.shared_with_role}`}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            เพิ่มเมื่อ {new Date(share.created_at).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border font-medium uppercase ${permColor}`}>
                          {share.permission}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteShare(share.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="ยกเลิกสิทธิ์"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition-colors cursor-pointer shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
