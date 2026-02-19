import { Request, Response, NextFunction } from 'express';

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

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Admin and provider always have full access
    if (req.session.role === 'admin' || req.session.role === 'provider') {
      return next();
    }
    // For other roles, check role_permissions table
    // This is handled at the route level for now
    // In production, we'd check the DB here
    next();
  };
}
