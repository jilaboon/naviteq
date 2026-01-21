import { Role } from '@prisma/client'

export type Permission =
  | 'customers:read'
  | 'customers:write'
  | 'customers:delete'
  | 'projects:read'
  | 'projects:write'
  | 'projects:delete'
  | 'project_updates:read'
  | 'project_updates:write'
  | 'candidates:read'
  | 'candidates:read:full'
  | 'candidates:write'
  | 'candidates:delete'
  | 'engineers:read'
  | 'engineers:write'
  | 'engineers:delete'
  | 'project_candidates:read'
  | 'project_candidates:write'
  | 'project_candidates:delete'
  | 'notifications:read'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'settings:read'
  | 'settings:write'

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    'customers:read',
    'customers:write',
    'customers:delete',
    'projects:read',
    'projects:write',
    'projects:delete',
    'project_updates:read',
    'project_updates:write',
    'candidates:read',
    'candidates:read:full',
    'candidates:write',
    'candidates:delete',
    'engineers:read',
    'engineers:write',
    'engineers:delete',
    'project_candidates:read',
    'project_candidates:write',
    'project_candidates:delete',
    'notifications:read',
    'users:read',
    'users:write',
    'users:delete',
    'settings:read',
    'settings:write',
  ],
  SALES: [
    'customers:read',
    'customers:write',
    'projects:read',
    'projects:write',
    'project_updates:read',
    'project_updates:write',
    'candidates:read', // Limited view only
    'engineers:read',
    'project_candidates:read',
    'notifications:read',
  ],
  RECRUITER: [
    'customers:read',
    'projects:read',
    'project_updates:read',
    'project_updates:write',
    'candidates:read',
    'candidates:read:full',
    'candidates:write',
    'engineers:read',
    'engineers:write',
    'project_candidates:read',
    'project_candidates:write',
    'notifications:read',
  ],
  CLIENT_MANAGER: [
    'customers:read',
    'projects:read',
    'projects:write', // Limited to status updates
    'project_updates:read',
    'project_updates:write',
    'candidates:read',
    'candidates:read:full', // Only for assigned projects
    'engineers:read',
    'project_candidates:read',
    'project_candidates:write', // Limited to feedback
    'notifications:read',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] ?? []
}

export function canAccessFullCandidateInfo(role: Role): boolean {
  return hasPermission(role, 'candidates:read:full')
}

export function canManageUsers(role: Role): boolean {
  return hasPermission(role, 'users:write')
}

export function canDeleteEntity(role: Role, entityType: string): boolean {
  const permission = `${entityType}:delete` as Permission
  return hasPermission(role, permission)
}

// Role display names
export const roleDisplayNames: Record<Role, string> = {
  ADMIN: 'Administrator',
  SALES: 'Sales',
  RECRUITER: 'Recruiter',
  CLIENT_MANAGER: 'Client Manager',
}
