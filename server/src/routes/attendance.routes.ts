import { Router, Request, Response } from 'express';
import { sqlite } from '../db/connection';
import { requireAuth } from '../middleware/auth';
import { VIRGINIA_POINT_TABLE, MAX_POINTS_PER_CAREGIVER } from '../../../shared/constants/virginia-points';

const router = Router();

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function nowTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function calculateAgeMonths(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function getPointsForAge(ageMonths: number): number {
  const entry = VIRGINIA_POINT_TABLE.find(e => ageMonths >= e.minAgeMonths && ageMonths <= e.maxAgeMonths);
  return entry ? entry.points : 0;
}

// GET /api/attendance/today/children
router.get('/today/children', requireAuth, (req: Request, res: Response) => {
  try {
    const d = today();
    const children = sqlite.prepare(`
      SELECT c.id, c.first_name, c.last_name, c.nickname, c.date_of_birth, c.status,
        ac.id as attendance_id, ac.check_in_time, ac.check_out_time
      FROM children c
      LEFT JOIN attendance_child ac ON c.id = ac.child_id AND ac.date = ? AND ac.check_out_time IS NULL
      WHERE c.status = 'active'
      ORDER BY c.first_name, c.last_name
    `).all(d);

    const result = (children as any[]).map(child => ({
      ...child,
      checked_in: child.attendance_id !== null,
      check_in_time: child.check_in_time || null,
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/today/staff
router.get('/today/staff', requireAuth, (req: Request, res: Response) => {
  try {
    const d = today();
    const staffList = sqlite.prepare(`
      SELECT s.id, s.first_name, s.last_name, s.position,
        a.id as time_clock_id, a.clock_in, a.clock_out
      FROM staff s
      LEFT JOIN attendance_staff a ON s.id = a.staff_id AND a.date = ? AND a.clock_out IS NULL
      WHERE s.status = 'active'
      ORDER BY s.first_name, s.last_name
    `).all(d);

    const result = (staffList as any[]).map(s => ({
      ...s,
      clocked_in: s.time_clock_id !== null,
      clock_in_time: s.clock_in || null,
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/children/checkin
router.post('/children/checkin', requireAuth, (req: Request, res: Response) => {
  try {
    const { childId } = req.body;
    if (!childId) {
      return res.status(400).json({ success: false, error: 'childId is required' });
    }
    const d = today();
    const time = nowTime();
    // Check if already checked in
    const existing = sqlite.prepare(
      `SELECT id FROM attendance_child WHERE child_id = ? AND date = ? AND check_out_time IS NULL`
    ).get(childId, d);

    if (existing) {
      return res.status(400).json({ success: false, error: 'Child is already checked in' });
    }

    const result = sqlite.prepare(
      `INSERT INTO attendance_child (child_id, date, check_in_time) VALUES (?, ?, ?)`
    ).run(childId, d, time);

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/attendance/children/:id/checkout
router.post('/children/:id/checkout', requireAuth, (req: Request, res: Response) => {
  try {
    const time = nowTime();
    sqlite.prepare(
      `UPDATE attendance_child SET check_out_time = ? WHERE id = ?`
    ).run(time, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/attendance/staff/clockin
router.post('/staff/clockin', requireAuth, (req: Request, res: Response) => {
  try {
    const { staffId } = req.body;
    const d = today();
    const time = nowTime();

    const existing = sqlite.prepare(
      `SELECT id FROM attendance_staff WHERE staff_id = ? AND date = ? AND clock_out IS NULL`
    ).get(staffId, d);

    if (existing) {
      return res.status(400).json({ success: false, error: 'Staff member is already clocked in' });
    }

    const result = sqlite.prepare(
      `INSERT INTO attendance_staff (staff_id, date, clock_in) VALUES (?, ?, ?)`
    ).run(staffId, d, time);

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/attendance/staff/:id/clockout
router.post('/staff/:id/clockout', requireAuth, (req: Request, res: Response) => {
  try {
    const time = nowTime();
    const record = sqlite.prepare(`SELECT clock_in FROM attendance_staff WHERE id = ?`).get(req.params.id) as any;

    let totalHours = null;
    if (record && record.clock_in) {
      const [inH, inM] = record.clock_in.split(':').map(Number);
      const [outH, outM] = time.split(':').map(Number);
      totalHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100;
    }

    sqlite.prepare(
      `UPDATE attendance_staff SET clock_out = ?, total_hours = ? WHERE id = ?`
    ).run(time, totalHours, req.params.id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/attendance/points - Virginia Point System status
router.get('/points', requireAuth, (req: Request, res: Response) => {
  try {
    const d = today();

    // Get checked-in children
    const checkedIn = sqlite.prepare(`
      SELECT c.date_of_birth FROM children c
      JOIN attendance_child ac ON c.id = ac.child_id
      WHERE ac.date = ? AND ac.check_out_time IS NULL
    `).all(d) as any[];

    // Get clocked-in staff count
    const clockedInStaff = sqlite.prepare(`
      SELECT COUNT(*) as count FROM attendance_staff
      WHERE date = ? AND clock_out IS NULL
    `).get(d) as any;

    // Calculate points
    const breakdown: { ageGroup: string; count: number; points: number }[] = [];
    let totalPoints = 0;

    for (const entry of VIRGINIA_POINT_TABLE) {
      const matchingChildren = checkedIn.filter(c => {
        const ageMonths = calculateAgeMonths(c.date_of_birth);
        return ageMonths >= entry.minAgeMonths && ageMonths <= entry.maxAgeMonths;
      });

      if (matchingChildren.length > 0) {
        const points = matchingChildren.length * entry.points;
        totalPoints += points;
        breakdown.push({
          ageGroup: entry.label,
          count: matchingChildren.length,
          points,
        });
      }
    }

    const caregiversPresent = clockedInStaff.count;
    const caregiversNeeded = Math.ceil(totalPoints / MAX_POINTS_PER_CAREGIVER);
    const isCompliant = caregiversPresent >= caregiversNeeded || totalPoints === 0;

    res.json({
      totalPoints,
      caregiversNeeded,
      caregiversPresent,
      isCompliant,
      breakdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/history
router.get('/history', requireAuth, (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, entityId } = req.query;
    const start = startDate || today();
    const end = endDate || today();

    let records: any[] = [];

    if (!type || type === 'all' || type === 'children') {
      let childQuery = `
        SELECT ac.id, ac.date, c.first_name || ' ' || c.last_name as name, 'child' as type,
          ac.check_in_time as checkIn, ac.check_out_time as checkOut, ac.notes
        FROM attendance_child ac
        JOIN children c ON ac.child_id = c.id
        WHERE ac.date >= ? AND ac.date <= ?
      `;
      const childParams: any[] = [start, end];
      if (entityId) {
        childQuery += ` AND ac.child_id = ?`;
        childParams.push(entityId);
      }
      records = records.concat(sqlite.prepare(childQuery).all(...childParams));
    }

    if (!type || type === 'all' || type === 'staff') {
      let staffQuery = `
        SELECT a.id, a.date, s.first_name || ' ' || s.last_name as name, 'staff' as type,
          a.clock_in as checkIn, a.clock_out as checkOut, a.total_hours as totalHours, a.notes
        FROM attendance_staff a
        JOIN staff s ON a.staff_id = s.id
        WHERE a.date >= ? AND a.date <= ?
      `;
      const staffParams: any[] = [start, end];
      if (entityId) {
        staffQuery += ` AND a.staff_id = ?`;
        staffParams.push(entityId);
      }
      records = records.concat(sqlite.prepare(staffQuery).all(...staffParams));
    }

    // Sort by date desc, then name
    records.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/attendance/:id/correct - Time correction
router.put('/:id/correct', requireAuth, (req: Request, res: Response) => {
  try {
    const { type, checkIn, checkOut, reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for time corrections' });
    }

    if (type === 'child') {
      sqlite.prepare(
        `UPDATE attendance_child SET check_in_time = ?, check_out_time = ?, notes = ? WHERE id = ?`
      ).run(checkIn, checkOut || null, `Time correction: ${reason}`, req.params.id);
    } else {
      let totalHours = null;
      if (checkIn && checkOut) {
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        totalHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100;
      }
      sqlite.prepare(
        `UPDATE attendance_staff SET clock_in = ?, clock_out = ?, total_hours = ?, notes = ? WHERE id = ?`
      ).run(checkIn, checkOut || null, totalHours, `Time correction: ${reason}`, req.params.id);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/history - Add a new attendance record manually
router.post('/history', requireAuth, (req: Request, res: Response) => {
  try {
    const { type, entityId, date, checkIn, checkOut, notes } = req.body;
    if (!type || !entityId || !date) {
      return res.status(400).json({ error: 'type, entityId, and date are required' });
    }

    if (type === 'child') {
      const result = sqlite.prepare(
        `INSERT INTO attendance_child (child_id, date, check_in_time, check_out_time, notes) VALUES (?, ?, ?, ?, ?)`
      ).run(entityId, date, checkIn || nowTime(), checkOut || null, notes || null);
      res.json({ success: true, id: Number(result.lastInsertRowid) });
    } else {
      let totalHours = null;
      if (checkIn && checkOut) {
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        totalHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100;
      }
      const result = sqlite.prepare(
        `INSERT INTO attendance_staff (staff_id, date, clock_in, clock_out, total_hours, notes) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(entityId, date, checkIn || nowTime(), checkOut || null, totalHours, notes || null);
      res.json({ success: true, id: Number(result.lastInsertRowid) });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/attendance/:id - Delete an attendance record
router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    if (type === 'child') {
      sqlite.prepare(`DELETE FROM attendance_child WHERE id = ?`).run(req.params.id);
    } else {
      sqlite.prepare(`DELETE FROM attendance_staff WHERE id = ?`).run(req.params.id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
