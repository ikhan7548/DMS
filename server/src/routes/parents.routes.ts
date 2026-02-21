import { Router, Request, Response } from 'express';
import { sqlite } from '../db/connection';
import { requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

// GET /api/parents
router.get('/', requireAuth, requirePermission('children_view'), (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = `SELECT * FROM parents WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone_cell LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    query += ` ORDER BY last_name, first_name`;

    const parents = sqlite.prepare(query).all(...params) as any[];

    // Attach linked children names for each parent
    const childQuery = sqlite.prepare(
      `SELECT c.id, c.first_name, c.last_name FROM children c
       JOIN child_parent cp ON c.id = cp.child_id
       WHERE cp.parent_id = ? ORDER BY c.first_name`
    );
    const enriched = parents.map((parent) => {
      const children = childQuery.all(parent.id) as any[];
      return {
        ...parent,
        children_names: children.map((c) => `${c.first_name} ${c.last_name}`),
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/parents/:id
router.get('/:id', requireAuth, requirePermission('children_view'), (req: Request, res: Response) => {
  try {
    const parent = sqlite.prepare(`SELECT * FROM parents WHERE id = ?`).get(req.params.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const children = sqlite.prepare(
      `SELECT c.*, cp.relationship FROM children c JOIN child_parent cp ON c.id = cp.child_id WHERE cp.parent_id = ?`
    ).all(req.params.id);

    res.json({ ...(parent as any), children });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/parents
router.post('/', requireAuth, requirePermission('children_edit'), (req: Request, res: Response) => {
  try {
    const d = req.body;
    const result = sqlite.prepare(
      `INSERT INTO parents (first_name, last_name, relationship, home_address, phone_cell, phone_home, email, employer_name, employer_phone, work_schedule, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      d.firstName, d.lastName, d.relationship || 'mother', d.homeAddress || null,
      d.phoneCell || null, d.phoneHome || null, d.email || null,
      d.employerName || null, d.employerPhone || null, d.workSchedule || null,
      d.isPrimary ? 1 : 0
    );
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/parents/:id
router.put('/:id', requireAuth, requirePermission('children_edit'), (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(
      `UPDATE parents SET first_name=?, last_name=?, relationship=?, home_address=?, phone_cell=?, phone_home=?, email=?, employer_name=?, employer_phone=?, work_schedule=?, is_primary=?, updated_at=datetime('now') WHERE id=?`
    ).run(
      d.firstName || d.first_name, d.lastName || d.last_name, d.relationship || 'mother',
      d.homeAddress || d.home_address || null, d.phoneCell || d.phone_cell || null,
      d.phoneHome || d.phone_home || null, d.email || null,
      d.employerName || d.employer_name || null, d.employerPhone || d.employer_phone || null,
      d.workSchedule || d.work_schedule || null, (d.isPrimary || d.is_primary) ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/parents/:id/link/:childId
router.post('/:id/link/:childId', requireAuth, requirePermission('children_edit'), (req: Request, res: Response) => {
  try {
    const { relationship } = req.body;
    sqlite.prepare(
      `INSERT INTO child_parent (child_id, parent_id, relationship) VALUES (?, ?, ?)`
    ).run(req.params.childId, req.params.id, relationship || null);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/parents/:id/unlink/:childId - Unlink parent from child
router.delete('/:id/unlink/:childId', requireAuth, requirePermission('children_edit'), (req: Request, res: Response) => {
  try {
    sqlite.prepare(
      `DELETE FROM child_parent WHERE parent_id = ? AND child_id = ?`
    ).run(req.params.id, req.params.childId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/parents/:id
router.delete('/:id', requireAuth, requirePermission('children_edit'), (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM child_parent WHERE parent_id = ?`).run(req.params.id);
    sqlite.prepare(`DELETE FROM parents WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
