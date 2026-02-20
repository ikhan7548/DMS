import { Router, Request, Response } from 'express';
import { sqlite } from '../db/connection';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/children - List children with optional filters
router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT c.*, fc.name as fee_tier_name FROM children c LEFT JOIN fee_configurations fc ON c.rate_tier_id = fc.id WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.nickname LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ` ORDER BY c.first_name, c.last_name`;

    const children = sqlite.prepare(query).all(...params);
    res.json(children);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/children/:id - Get child details with relations
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const child = sqlite.prepare(
      `SELECT c.*, fc.name as fee_tier_name FROM children c LEFT JOIN fee_configurations fc ON c.rate_tier_id = fc.id WHERE c.id = ?`
    ).get(req.params.id);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const parents = sqlite.prepare(
      `SELECT p.*, cp.relationship FROM parents p JOIN child_parent cp ON p.id = cp.parent_id WHERE cp.child_id = ?`
    ).all(req.params.id);

    const emergencyContacts = sqlite.prepare(
      `SELECT * FROM emergency_contacts WHERE child_id = ? ORDER BY priority_order`
    ).all(req.params.id);

    const authorizedPickups = sqlite.prepare(
      `SELECT * FROM authorized_pickups WHERE child_id = ?`
    ).all(req.params.id);

    const immunizations = sqlite.prepare(
      `SELECT * FROM immunizations WHERE child_id = ? ORDER BY date_administered DESC`
    ).all(req.params.id);

    res.json({ ...child as any, parents, emergencyContacts, authorizedPickups, immunizations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/children - Create child
router.post('/', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    const today = new Date().toISOString().split('T')[0];
    const result = sqlite.prepare(`
      INSERT INTO children (first_name, last_name, nickname, sex, date_of_birth, home_address,
        enrollment_date, expected_schedule, days_per_week, scheduled_days, school_dismissal_time,
        rate_tier_id, physician_name, physician_phone, medical_insurance, allergies,
        dietary_restrictions, special_needs, emergency_medical_auth, medication_admin_consent,
        is_provider_own_child, is_resident_child, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      d.firstName || d.first_name, d.lastName || d.last_name, d.nickname || null,
      d.sex || d.gender || 'male', d.dateOfBirth || d.date_of_birth,
      d.homeAddress || d.home_address || null,
      d.enrollmentDate || d.enrollment_date || today,
      d.expectedSchedule || d.expected_schedule || d.scheduleType || d.schedule_type || 'full_time',
      d.daysPerWeek || d.days_per_week || 5, d.scheduledDays || d.scheduled_days || null,
      d.schoolDismissalTime || d.school_dismissal_time || null,
      d.rateTierId || d.rate_tier_id || null, d.physicianName || d.physician_name || null,
      d.physicianPhone || d.physician_phone || null,
      d.medicalInsurance || d.medical_insurance || null, d.allergies || null,
      d.dietaryRestrictions || d.dietary_restrictions || null,
      (d.specialNeeds || d.special_needs || d.specialNeedsFlag) ? 1 : 0,
      (d.emergencyMedicalAuth || d.emergency_medical_auth) ? 1 : 0,
      (d.medicationAdminConsent || d.medication_admin_consent) ? 1 : 0,
      (d.isProviderOwnChild || d.is_provider_own_child) ? 1 : 0,
      (d.isResidentChild || d.is_resident_child) ? 1 : 0, d.notes || null
    );
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/children/:id - Update child
router.put('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(`
      UPDATE children SET first_name=?, last_name=?, nickname=?, sex=?, date_of_birth=?,
        home_address=?, enrollment_date=?, expected_schedule=?, days_per_week=?, scheduled_days=?,
        school_dismissal_time=?, rate_tier_id=?, physician_name=?, physician_phone=?,
        medical_insurance=?, allergies=?, dietary_restrictions=?, special_needs=?,
        emergency_medical_auth=?, medication_admin_consent=?, is_provider_own_child=?,
        is_resident_child=?, notes=?, status=?, updated_at=datetime('now')
      WHERE id=?
    `).run(
      d.firstName || d.first_name, d.lastName || d.last_name, d.nickname || null,
      d.sex || d.gender || 'male', d.dateOfBirth || d.date_of_birth,
      d.homeAddress || d.home_address || null,
      d.enrollmentDate || d.enrollment_date,
      d.expectedSchedule || d.expected_schedule || d.scheduleType || d.schedule_type || 'full_time',
      d.daysPerWeek || d.days_per_week || 5, d.scheduledDays || d.scheduled_days || null,
      d.schoolDismissalTime || d.school_dismissal_time || null, d.rateTierId || d.rate_tier_id || null,
      d.physicianName || d.physician_name || null, d.physicianPhone || d.physician_phone || null,
      d.medicalInsurance || d.medical_insurance || null, d.allergies || null,
      d.dietaryRestrictions || d.dietary_restrictions || null,
      (d.specialNeeds || d.special_needs) ? 1 : 0,
      (d.emergencyMedicalAuth || d.emergency_medical_auth) ? 1 : 0,
      (d.medicationAdminConsent || d.medication_admin_consent) ? 1 : 0,
      (d.isProviderOwnChild || d.is_provider_own_child) ? 1 : 0,
      (d.isResidentChild || d.is_resident_child) ? 1 : 0,
      d.notes || null, d.status || 'active', req.params.id
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/children/:id - Permanently delete child and all associated data
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const childId = req.params.id;

    // Verify child exists
    const child = sqlite.prepare(`SELECT id, first_name, last_name FROM children WHERE id = ?`).get(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    // Use a transaction to delete all associated data then the child
    const deleteChild = sqlite.transaction(() => {
      // Get linked parent IDs before removing the links
      const linkedParents = sqlite.prepare(
        `SELECT parent_id FROM child_parent WHERE child_id = ?`
      ).all(childId) as { parent_id: number }[];

      // Delete from all related tables
      sqlite.prepare(`DELETE FROM child_parent WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM emergency_contacts WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM authorized_pickups WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM immunizations WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM attendance_child WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM medication_logs WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM incident_reports WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM meal_log_children WHERE child_id = ?`).run(childId);
      sqlite.prepare(`DELETE FROM invoice_line_items WHERE child_id = ?`).run(childId);

      // Delete the child record itself
      sqlite.prepare(`DELETE FROM children WHERE id = ?`).run(childId);

      // Clean up orphaned parents (parents with no remaining children)
      for (const { parent_id } of linkedParents) {
        const remaining = sqlite.prepare(
          `SELECT COUNT(*) as count FROM child_parent WHERE parent_id = ?`
        ).get(parent_id) as { count: number };
        if (remaining.count === 0) {
          sqlite.prepare(`DELETE FROM parents WHERE id = ?`).run(parent_id);
        }
      }
    });

    deleteChild();
    res.json({ success: true, message: 'Child and all associated data permanently deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Emergency Contacts ---

// GET /api/children/:id/emergency-contacts
router.get('/:id/emergency-contacts', requireAuth, (req: Request, res: Response) => {
  try {
    const contacts = sqlite.prepare(
      `SELECT * FROM emergency_contacts WHERE child_id = ? ORDER BY priority_order`
    ).all(req.params.id);
    res.json(contacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/children/:id/emergency-contacts
router.post('/:id/emergency-contacts', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    const result = sqlite.prepare(
      `INSERT INTO emergency_contacts (child_id, name, relationship, phone, is_authorized_pickup, priority_order) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.params.id, d.name, d.relationship, d.phone, d.isAuthorizedPickup ? 1 : 0, d.priorityOrder || 1);
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/children/:childId/emergency-contacts/:id
router.put('/:childId/emergency-contacts/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(
      `UPDATE emergency_contacts SET name=?, relationship=?, phone=?, is_authorized_pickup=?, priority_order=? WHERE id=? AND child_id=?`
    ).run(d.name, d.relationship, d.phone, d.isAuthorizedPickup ? 1 : 0, d.priorityOrder || 1, req.params.id, req.params.childId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/children/:childId/emergency-contacts/:id
router.delete('/:childId/emergency-contacts/:id', requireAuth, (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM emergency_contacts WHERE id=? AND child_id=?`).run(req.params.id, req.params.childId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Authorized Pickups ---

router.get('/:id/authorized-pickups', requireAuth, (req: Request, res: Response) => {
  try {
    const pickups = sqlite.prepare(`SELECT * FROM authorized_pickups WHERE child_id = ?`).all(req.params.id);
    res.json(pickups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/authorized-pickups', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    const result = sqlite.prepare(
      `INSERT INTO authorized_pickups (child_id, name, relationship, phone) VALUES (?, ?, ?, ?)`
    ).run(req.params.id, d.name, d.relationship, d.phone);
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:childId/authorized-pickups/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(
      `UPDATE authorized_pickups SET name=?, relationship=?, phone=? WHERE id=? AND child_id=?`
    ).run(d.name, d.relationship, d.phone, req.params.id, req.params.childId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:childId/authorized-pickups/:id', requireAuth, (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM authorized_pickups WHERE id=? AND child_id=?`).run(req.params.id, req.params.childId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Immunizations ---

router.get('/:id/immunizations', requireAuth, (req: Request, res: Response) => {
  try {
    const records = sqlite.prepare(`SELECT * FROM immunizations WHERE child_id = ? ORDER BY date_administered DESC`).all(req.params.id);
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/immunizations', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    const result = sqlite.prepare(
      `INSERT INTO immunizations (child_id, immunization_type, date_administered, provider, notes) VALUES (?, ?, ?, ?, ?)`
    ).run(req.params.id, d.immunization_type || d.immunizationType, d.date_administered || d.dateAdministered, d.provider, d.notes);
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:childId/immunizations/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(
      `UPDATE immunizations SET immunization_type=?, date_administered=?, provider=?, notes=? WHERE id=? AND child_id=?`
    ).run(d.immunization_type || d.immunizationType, d.date_administered || d.dateAdministered, d.provider, d.notes, req.params.id, req.params.childId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:childId/immunizations/:id', requireAuth, (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM immunizations WHERE id=? AND child_id=?`).run(req.params.id, req.params.childId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
