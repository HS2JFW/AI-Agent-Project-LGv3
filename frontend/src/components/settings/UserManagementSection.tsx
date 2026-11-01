import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Building,
  Clock,
  UserCheck,
  UserX,
  Search,
  Key,
  Shield,
  Users
} from 'lucide-react';

export interface UserRecord {
  id: string;
  username: string;
  full_name?: string | null;
  department?: string | null;
  role: 'superadmin' | 'admin' | 'builder' | 'operator' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface UserManagementSectionProps {
  currentUser?: any;
  showAlert?: (msg: string, title?: string, type?: 'success' | 'error' | 'info') => void;
}

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  superadmin: {
    label: 'Super Admin',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    desc: 'สิทธิ์สูงสุด จัดการระบบ ผู้ใช้ และ Audit Logs'
  },
  admin: {
    label: 'Admin',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    desc: 'ผู้จัดการระบบ จัดการ Workflow และ Analytics'
  },
  builder: {
    label: 'Builder',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    desc: 'สร้าง/แก้ไข Workflow กราฟ และตั้งค่า Prompt'
  },
  operator: {
    label: 'Operator',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    desc: 'อัปโหลดไฟล์ สั่งรัน Workflow และดูผลลัพธ์'
  },
  viewer: {
    label: 'Viewer',
    badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    desc: 'ดูผัง Flow และสถิติการรันเท่านั้น (Read-only)'
  }
};

export default function UserManagementSection({ 
  currentUser,
  showAlert 
}: UserManagementSectionProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Sub-states: Add User & Edit User forms
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Form states for Add User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'admin' | 'builder' | 'operator' | 'viewer'>('builder');

  // Form states for Edit User
  const [editFullName, setEditFullName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRole, setEditRole] = useState<'superadmin' | 'admin' | 'builder' | 'operator' | 'viewer'>('builder');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  const currentUsername = currentUser?.username || '';
  const currentUserRole = currentUser?.role || '';
  const isAdmin = currentUserRole === 'superadmin' || currentUserRole === 'admin';

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('app_auth_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/users`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to fetch user list');
      }
      const data: UserRecord[] = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to user management API');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, getAuthHeaders]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
          full_name: newFullName.trim() || null,
          department: newDepartment.trim() || null,
          role: newRole
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create user');
      }

      const msg = `User @${newUsername.trim()} created successfully!`;
      setSuccessMsg(msg);
      if (showAlert) showAlert(msg, 'User Created', 'success');
      setTimeout(() => setSuccessMsg(null), 3500);

      // Reset and close
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewDepartment('');
      setNewRole('builder');
      setIsAddUserOpen(false);

      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditDepartment(user.department || '');
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setEditNewPassword('');
    setError(null);
    setIsAddUserOpen(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);

    const updatePayload: Record<string, any> = {
      full_name: editFullName.trim() || null,
      department: editDepartment.trim() || null,
      role: editRole,
      is_active: editIsActive
    };

    if (editNewPassword.trim()) {
      updatePayload.password = editNewPassword.trim();
    }

    try {
      const res = await fetch(`${backendUrl}/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to update user');
      }

      const msg = `User @${editingUser.username} updated successfully!`;
      setSuccessMsg(msg);
      if (showAlert) showAlert(msg, 'User Updated', 'success');
      setTimeout(() => setSuccessMsg(null), 3500);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (user: UserRecord) => {
    if (user.username === currentUsername) {
      alert('Cannot delete your own active account.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete user @${user.username} (${user.full_name || user.role})?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${backendUrl}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to delete user');
      }

      const msg = `User @${user.username} deleted.`;
      setSuccessMsg(msg);
      if (showAlert) showAlert(msg, 'User Deleted', 'info');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            User and Role Management (RBAC)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage user accounts, departmental access, role assignments, and password resets in one unified view.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
            title="Refresh user list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setIsAddUserOpen((prev) => !prev);
                setEditingUser(null);
                setError(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddUserOpen ? 'Cancel' : 'Add New User'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Total Accounts</div>
            <div className="text-base font-bold text-zinc-900 dark:text-white">{users.length}</div>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Active Accounts</div>
            <div className="text-base font-bold text-zinc-900 dark:text-white">
              {users.filter(u => u.is_active).length}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Superadmins & Admins</div>
            <div className="text-base font-bold text-zinc-900 dark:text-white">
              {users.filter(u => u.role === 'superadmin' || u.role === 'admin').length}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">Builders & Ops</div>
            <div className="text-base font-bold text-zinc-900 dark:text-white">
              {users.filter(u => u.role === 'builder' || u.role === 'operator').length}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="w-4 h-4 shrink-0" />
          <span className="flex-1 font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add User Card Form */}
      {isAddUserOpen && (
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#121215] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Create New User Account</span>
            </div>
            <button
              onClick={() => setIsAddUserOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. somchai_b"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. สมชาย ใจดี"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Department / Team (Optional)
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. Data Engineering"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Role & Permissions <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((r) => {
                  const cfg = ROLE_CONFIG[r];
                  const isSelected = newRole === r;
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setNewRole(r as any)}
                      className={`text-left p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/80 shadow-xs ring-1 ring-zinc-900 dark:ring-white'
                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cfg.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {cfg.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition shadow-xs cursor-pointer"
              >
                Save New User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Card Form */}
      {editingUser && (
        <div className="p-5 border border-amber-200 dark:border-amber-900/50 rounded-xl bg-amber-50/20 dark:bg-amber-950/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 dark:border-amber-900/50">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Edit User Account: @{editingUser.username}</span>
            </div>
            <button
              onClick={() => setEditingUser(null)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Department / Team
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="Department"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Reset Password (Leave blank to keep existing)
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="password"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Enter new password to reset"
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded border-zinc-300 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Account Active (อนุญาตให้เข้าใช้งานระบบได้)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Role & Permissions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((r) => {
                  const cfg = ROLE_CONFIG[r];
                  const isSelected = editRole === r;
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setEditRole(r as any)}
                      className={`text-left p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/80 shadow-xs ring-1 ring-zinc-900 dark:ring-white'
                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cfg.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {cfg.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80 dark:border-amber-900/50">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username, full name, or department..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-44 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-400 cursor-pointer"
        >
          <option value="all">All Roles ({users.length})</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="builder">Builder</option>
          <option value="operator">Operator</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* User Directory Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#121215] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Login</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    {isLoading ? 'Loading users...' : 'No user accounts match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const cfg = ROLE_CONFIG[user.role] || {
                    label: user.role,
                    badgeClass: 'bg-zinc-100 text-zinc-600',
                    desc: ''
                  };
                  const isSelf = user.username === currentUsername;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      {/* Name & Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 uppercase shadow-xs">
                            {(user.username || 'U').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {user.full_name || user.username}
                              {isSelf && (
                                <span className="text-[9px] px-1 py-0.2 rounded-sm bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                        {user.department ? (
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{user.department}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">-</span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500">
                            <UserX className="w-3 h-3 text-rose-500 shrink-0" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-3 text-zinc-500 text-[11px]">
                        {user.last_login_at ? (
                          <div className="flex items-center gap-1" title={user.last_login_at}>
                            <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{new Date(user.last_login_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600">Never</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3 px-3 text-zinc-500 text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition cursor-pointer"
                              title="Edit user details & permissions"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && !isSelf && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Guide */}
      <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2.5">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-zinc-500" />
          <span>Role Permissions Matrix Reference (สิทธิ์การเข้าถึงแต่ละระดับ)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
          {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((r) => {
            const cfg = ROLE_CONFIG[r];
            return (
              <div key={r} className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
                <div className={`inline-block px-1.5 py-0.2 rounded-sm text-[10px] font-bold border mb-1 ${cfg.badgeClass}`}>
                  {cfg.label}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 text-[10px] leading-relaxed">
                  {cfg.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

