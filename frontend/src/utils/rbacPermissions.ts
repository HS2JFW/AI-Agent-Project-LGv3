/**
 * RBAC Permission Helper Functions
 * 
 * Strict implementation of AI Builder RBAC Permission Matrix:
 * 
 * | Capability                             | superadmin | admin | builder  | operator | viewer |
 * |----------------------------------------|:----------:|:-----:|:--------:|:--------:|:------:|
 * | User Management                        |     ✅     |   ❌  |    ❌    |    ❌    |   ❌   |
 * | View Audit Logs / System Logs          |     ✅     |   ✅  |    ❌    |    ❌    |   ❌   |
 * | API Keys & System Setup                |     ✅     |   ✅  |    ❌    |    ❌    |   ❌   |
 * | Create New Workflow / Group            |     ✅     |   ✅  |    ✅    |    ❌    |   ❌   |
 * | Edit / Save Workflow Graph             |     ✅     |   ✅  | ✅ (Own) |    ❌    |   ❌   |
 * | Delete Workflow / Group                |     ✅     |   ✅  | ✅ (Own) |    ❌    |   ❌   |
 * | Move Workflows & Folders               |     ✅     |   ✅  |    ✅    |    ❌    |   ❌   |
 * | Upload Files to Queue / Inputs         |     ✅     |   ✅  |    ✅    |    ✅    |   ❌   |
 * | Execute / Resume / Stop Workflow       |     ✅     |   ✅  |    ✅    |    ✅    |   ❌   |
 * | Download Output Artifacts / Markdown   |     ✅     |   ✅  |    ✅    |    ✅    |   ✅   |
 * | View Workflow Canvas (Read-Only)       |     ✅     |   ✅  |    ✅    |    ✅    |   ✅   |
 * | View Analytics & Dashboards            |     ✅     |   ✅  |    ✅    |    ✅    |   ✅   |
 */

export interface CurrentUser {
  id?: string;
  username?: string;
  role?: 'superadmin' | 'admin' | 'builder' | 'operator' | 'viewer' | string;
  full_name?: string;
  department?: string;
}

export const canCreateWorkflow = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return ['superadmin', 'admin', 'builder'].includes(user.role.toLowerCase());
};

export const canCreateGroup = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return ['superadmin', 'admin', 'builder'].includes(user.role.toLowerCase());
};

export const canEditWorkflow = (user?: CurrentUser | null, ownerId?: string | null): boolean => {
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  if (role === 'superadmin' || role === 'admin') return true;
  if (role === 'builder') {
    // Builder can edit workflows they own, or unassigned/legacy workflows
    return !ownerId || ownerId === user.id;
  }
  return false;
};

export const canDeleteWorkflow = (user?: CurrentUser | null, ownerId?: string | null): boolean => {
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  if (role === 'superadmin' || role === 'admin') return true;
  if (role === 'builder') {
    return !ownerId || ownerId === user.id;
  }
  return false;
};

export const canDeleteGroup = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return ['superadmin', 'admin', 'builder'].includes(user.role.toLowerCase());
};

export const canMoveItems = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return ['superadmin', 'admin', 'builder'].includes(user.role.toLowerCase());
};

export const canExecuteWorkflow = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return ['superadmin', 'admin', 'builder', 'operator'].includes(user.role.toLowerCase());
};

export const canUploadQueue = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return ['superadmin', 'admin', 'builder', 'operator'].includes(user.role.toLowerCase());
};

export const canManageUsers = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return user.role.toLowerCase() === 'superadmin';
};

export const canViewSystemLogs = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return false;
  return ['superadmin', 'admin'].includes(user.role.toLowerCase());
};

export const isReadOnlyUser = (user?: CurrentUser | null): boolean => {
  if (!user || !user.role) return true;
  return user.role.toLowerCase() === 'viewer';
};

