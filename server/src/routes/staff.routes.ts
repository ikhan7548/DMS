import { Router, Request, Response } from 'express';
import { sqlite } from '../db/connection';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/staff
router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT * FROM staff WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s);
    }
    query += ` ORDER BY first_name, last_name`;

    const staffList = sqlite.prepare(query).all(...params);
    res.json(staffList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/staff/:id
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const staffMember = sqlite.prepare(`SELECT * FROM staff WHERE id = ?`).get(req.params.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' });

    const certifications = sqlite.prepare(
      `SELECT * FROM staff_certifications WHERE staff_id = ? ORDER BY expiry_date`
    ).all(req.params.id);

    const backgroundChecks = sqlite.prepare(
      `SELECT * FROM background_checks WHERE staff_id = ? ORDER BY check_date DESC`
    ).all(req.params.id);

    res.json({ ...(staffMember as any), certifications, backgroundChecks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff
router.post('/', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    const result = sqlite.prepare(`
      INSERT INTO staff (first_name, last_name, date_of_birth, home_address, phone, email,
        hire_date, position, hourly_rate, overtime_rate, pay_frequency,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        high_school_diploma, tb_screening_date, tb_screening_result, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      d.firstName, d.lastName, d.dateOfBirth || null, d.homeAddress || null,
      d.phone || null, d.email || null, d.hireDate, d.position || 'assistant',
      d.hourlyRate || null, d.overtimeRate || null, d.payFrequency || null,
      d.emergencyContactName || null, d.emergencyContactPhone || null,
      d.emergencyContactRelationship || null, d.highSchoolDiploma ? 1 : 0,
      d.tbScreeningDate || null, d.tbScreeningResult || null, d.notes || null
    );
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(`
      UPDATE staff SET first_name=?, last_name=?, date_of_birth=?, home_address=?, phone=?, email=?,
        hire_date=?, position=?, hourly_rate=?, overtime_rate=?, pay_frequency=?, status=?,
        emergency_contact_name=?, emergency_contact_phone=?, emergency_contact_relationship=?,
        high_school_diploma=?, tb_screening_date=?, tb_screening_result=?, notes=?,
        updated_at=datetime('now')
      WHERE id=?
    `).run(
      d.firstName || d.first_name, d.lastName || d.last_name,
      d.dateOfBirth || d.date_of_birth || null, d.homeAddress || d.home_address || null,
      d.phone || null, d.email || null, d.hireDate || d.hire_date,
      d.position || 'assistant', d.hourlyRate || d.hourly_rate || null,
      d.overtimeRate || d.overtime_rate || null, d.payFrequency || d.pay_frequency || null,
      d.status || 'active',
      d.emergencyContactName || d.emergency_contact_name || null,
      d.emergencyContactPhone || d.emergency_contact_phone || null,
      d.emergencyContactRelationship || d.emergency_contact_relationship || null,
      (d.highSchoolDiploma || d.high_school_diploma) ? 1 : 0,
      d.tbScreeningDate || d.tb_screening_date || null,
      d.tbScreeningResult || d.tb_screening_result || null,
      d.notes || null, req.params.id
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Certifications ---

router.get('/:id/certifications', requireAuth, (req: Request, res: Response) => {
  try {
    const certs = sqlite.prepare(`SELECT * FROM staff_certifications WHERE staff_id = ? ORDER BY expiry_date`).all(req.params.id);
    res.json(certs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/certifications', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    const result = sqlite.prepare(
      `INSERT INTO staff_certifications (staff_id, cert_type, cert_name, issue_date, expiry_date, training_hours, sponsoring_org) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(req.params.id, d.cert_type || d.certType, d.cert_name || d.certName, d.issue_date || d.issueDate, d.expiry_date || d.expiryDate, d.training_hours || d.trainingHours, d.sponsoring_org || d.sponsoringOrg);
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:staffId/certifications/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(
      `UPDATE staff_certifications SET cert_type=?, cert_name=?, issue_date=?, expiry_date=?, training_hours=?, sponsoring_org=? WHERE id=? AND staff_id=?`
    ).run(d.cert_type || d.certType, d.cert_name || d.certName, d.issue_date || d.issueDate, d.expiry_date || d.expiryDate, d.training_hours || d.trainingHours, d.sponsoring_org || d.sponsoringOrg, req.params.id, req.params.staffId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:staffId/certifications/:id', requireAuth, (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM staff_certifications WHERE id=? AND staff_id=?`).run(req.params.id, req.params.staffId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Background Checks ---

router.get('/:id/background-checks', requireAuth, (req: Request, res: Response) => {
  try {
    const checks = sqlite.prepare(`SELECT * FROM background_checks WHERE staff_id = ? ORDER BY check_date DESC`).all(req.params.id);
    res.json(checks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/background-checks', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    const result = sqlite.prepare(
      `INSERT INTO background_checks (staff_id, check_type, check_date, expiry_date, result, notes) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.params.id, d.check_type || d.checkType, d.check_date || d.checkDate, d.expiry_date || d.expiryDate, d.result, d.notes);
    res.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:staffId/background-checks/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const d = req.body;
    sqlite.prepare(
      `UPDATE background_checks SET check_type=?, check_date=?, expiry_date=?, result=?, notes=? WHERE id=? AND staff_id=?`
    ).run(d.check_type || d.checkType, d.check_date || d.checkDate, d.expiry_date || d.expiryDate, d.result, d.notes, req.params.id, req.params.staffId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:staffId/background-checks/:id', requireAuth, (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM background_checks WHERE id=? AND staff_id=?`).run(req.params.id, req.params.staffId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
