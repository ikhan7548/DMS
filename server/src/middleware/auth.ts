import { Request, Response, NextFunction } from 'express';
import { sqlite } from '../db/connection';

// Extend express session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
    displayName: string;
    role: string;
    staffId: number | null;
    language: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.session.role!)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Admin and provider always have full access
    if (req.session.role === 'admin' || req.session.role === 'provider') {
      return next();
    }
    // Check role_permissions table for ANY of the required permissions
    try {
      const placeholders = permissions.map(() => '?').join(', ');
      const row = sqlite.prepare(
        `SELECT COUNT(*) as cnt FROM role_permissions WHERE role = ? AND feature IN (${placeholders}) AND can_access = 1`
      ).get(req.session.role, ...permissions) as { cnt: number };

      if (row.cnt > 0) {
        return next();
      }
      return res.status(403).json({ error: 'You do not have permission to access this resource' });
    } catch (err) {
      console.error('Permission check error:', err);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// Helper to get all permissions for a role (used by auth routes)
export function getPermissionsForRole(role: string): Record<string, boolean> {
  if (role === 'admin' || role === 'provider') {
    // Return all features as true
    const ALL_FEATURES = [
      'dashboard', 'children_view', 'children_contacts', 'children_medical',
      'children_edit', 'children_enroll', 'staff_view', 'staff_edit',
      'attendance_checkin', 'attendance_checkout', 'attendance_history', 'attendance_edit_times',
      'billing_view', 'billing_manage', 'meals_view', 'meals_edit',
      'reports_view', 'reports_export', 'settings_view', 'settings_edit',
      'compliance_view', 'compliance_edit',
    ];
    const perms: Record<string, boolean> = {};
    ALL_FEATURES.forEach(f => { perms[f] = true; });
    return perms;
  }

  try {
    const rows = sqlite.prepare(
      `SELECT feature, can_access FROM role_permissions WHERE role = ?`
    ).all(role) as { feature: string; can_access: number }[];

    const perms: Record<string, boolean> = {};
    rows.forEach(r => { perms[r.feature] = r.can_access === 1; });
    return perms;
  } catch {
    return {};
  }
}
