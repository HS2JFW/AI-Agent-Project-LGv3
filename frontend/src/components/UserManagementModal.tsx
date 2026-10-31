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
  Search
} from 'lucide-react';

interface UserRecord {
  id: string;
  username: string;
  full_name?: string | null;
  department?: string | null;
  role: 'superadmin' | 'admin' | 'builder' | 'operator' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  currentUserRole?: string;
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

export default function UserManagementModal({ 
  isOpen, 
  onClose, 
  currentUsername = '',
  currentUserRole = '' 
}: UserManagementModalProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal sub-states: Add User & Edit User
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
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

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

      setSuccessMsg(`User @${newUsername.trim()} created successfully!`);
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

      setSuccessMsg(`User @${editingUser.username} updated successfully!`);
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

      setSuccessMsg(`User @${user.username} deleted.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Bar */}
        <div className="h-1 w-full bg-zinc-900 dark:bg-zinc-100" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 select-none">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-wide font-mono">
                  Role-Based Access Control (RBAC) Management
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {users.length} Active Accounts
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                จัดการบัญชีผู้ใช้ สิทธิ์การเข้าถึง และการจำกัดบทบาทในระบบ AI Visual Workflow Builder
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyber-neon' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-400">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Toolbar: Search, Filter, and Add User Button */}
        <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, username หรือแผนก..."
                className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
            >
              <option value="all">All Roles (ทุกบทบาท)</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="builder">Builder</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <button
            onClick={() => {
              setIsAddUserOpen(true);
              setError(null);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full text-left text-xs text-zinc-900 dark:text-zinc-100">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-mono">
                <th className="py-2.5 px-3">User & Identity</th>
                <th className="py-2.5 px-3">Role & Permissions</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleCfg = ROLE_CONFIG[u.role] || { label: u.role, badgeClass: 'bg-gray-500/20 text-gray-300 border-gray-500/40', desc: '' };
                  const isCurrent = u.username === currentUsername;

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold text-xs">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">@{u.username}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">{u.full_name || '—'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${roleCfg.badgeClass}`}>
                          {roleCfg.label}
                        </span>
                        <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[200px] truncate" title={roleCfg.desc}>
                          {roleCfg.desc}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300">
                        <span className="flex items-center space-x-1">
                          <Building className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span>{u.department || 'General'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] font-medium">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-rose-400 text-[11px] font-medium">
                            <UserX className="w-3.5 h-3.5" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        {u.last_login_at ? (
                          <span className="flex items-center space-x-1" title={u.last_login_at}>
                            <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            <span>{new Date(u.last_login_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-cyber-neon hover:bg-cyber-dark transition-colors cursor-pointer"
                            title="Edit Role & Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent 
                                ? 'text-gray-600 cursor-not-allowed' 
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                            }`}
                            title={isCurrent ? 'Cannot delete current account' : 'Delete user'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Active Role: <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{currentUserRole.toUpperCase()}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer text-xs shadow-xs"
          >
            Close
          </button>
        </div>

        {/* Sub-Dialog: Add User Form */}
        {isAddUserOpen && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-cyber-neon" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Create New User Account</h3>
                </div>
                <button 
                  onClick={() => setIsAddUserOpen(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. somchai_dev"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Somchai Prasert"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Department</label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="Engineering / Operations"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Assigned Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                  >
                    <option value="builder">Builder (สร้างและแก้ไข Workflow)</option>
                    <option value="operator">Operator (สั่งรัน Workflow และอัปโหลดไฟล์)</option>
                    <option value="viewer">Viewer (ดูผังและสถิติ Read-only)</option>
                    <option value="admin">Admin (ผู้จัดการระบบ)</option>
                    <option value="superadmin">Superadmin (ผู้ดูแลระบบสูงสุด)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sub-Dialog: Edit User Form */}
        {editingUser && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Edit2 className="w-5 h-5 text-cyber-neon" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Edit User: @{editingUser.username}</h3>
                </div>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Role *</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="admin">Admin</option>
                    <option value="builder">Builder</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-semibold">Reset Password (เว้นว่างไว้หากไม่เปลี่ยน)</label>
                  <input
                    type="password"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Enter new password to reset"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-xs"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded bg-[#0c0c0e] border-zinc-200 dark:border-zinc-800 text-cyber-neon focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="edit_is_active" className="text-white cursor-pointer select-none">
                    Account is Active (เปิดใช้งานบัญชีนี้)
                  </label>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
