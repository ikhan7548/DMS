export type UserRole = 'admin' | 'provider' | 'staff' | 'substitute' | 'parent';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  provider: ['*'],
  staff: [
    'attendance:read', 'attendance:write',
    'child:read',
    'meal:read', 'meal:write',
    'compliance:medication:write', 'compliance:incident:write',
    'dashboard:read',
  ],
  substitute: [
    'attendance:read', 'attendance:write',
    'child:read',
    'meal:read', 'meal:write',
    'dashboard:read',
  ],
  parent: [
    'child:read:own',
    'attendance:read:own',
    'billing:read:own',
    'dashboard:read',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions.includes('*')) return true;
  return permissions.some(p => {
    if (p === permission) return true;
    const parts = p.split(':');
    const checkParts = permission.split(':');
    return parts.every((part, i) => part === checkParts[i] || part === '*');
  });
}
