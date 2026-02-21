import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { sqlite } from '../db/connection';
import { requireAuth, getPermissionsForRole } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ error: 'Username and PIN are required' });
    }

    const user = sqlite.prepare(
      `SELECT id, username, pin_hash, display_name, role, staff_id, language, is_active FROM users WHERE username = ?`
    ).get(username) as any;

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid username or PIN' });
    }

    const valid = bcrypt.compareSync(pin, user.pin_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or PIN' });
    }

    // Update last login
    sqlite.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.displayName = user.display_name;
    req.session.role = user.role;
    req.session.staffId = user.staff_id;
    req.session.language = user.language;

    // Get permissions for this role
    const permissions = getPermissionsForRole(user.role);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        staffId: user.staff_id,
        language: user.language,
      },
      permissions,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('dms.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/session
router.get('/session', (req: Request, res: Response) => {
  if (!req.session || !req.session.userId) {
    return res.json({ authenticated: false });
  }

  // Get permissions for this role
  const permissions = getPermissionsForRole(req.session.role!);

  res.json({
    authenticated: true,
    user: {
      id: req.session.userId,
      username: req.session.username,
      displayName: req.session.displayName,
      role: req.session.role,
      staffId: req.session.staffId,
      language: req.session.language,
    },
    permissions,
  });
});

export default router;
