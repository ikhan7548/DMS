import { Router, Request, Response } from 'express';
import { sqlite } from '../db/connection';
import { requireAuth, requirePermission } from '../middleware/auth';
import { VIRGINIA_POINT_TABLE, MAX_POINTS_PER_CAREGIVER } from '../../../shared/constants/virginia-points';

const router = Router();

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateAgeMonths(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

// ─── Dashboard Summary ───────────────────────────────

// GET /api/reports/dashboard
router.get('/dashboard', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const d = today();

    // Children stats
    const totalChildren = (sqlite.prepare(`SELECT COUNT(*) as count FROM children WHERE status = 'active'`).get() as any).count;
    const checkedInChildren = (sqlite.prepare(`
      SELECT COUNT(*) as count FROM attendance_child WHERE date = ? AND check_out_time IS NULL
    `).get(d) as any).count;

    // Staff stats
    const totalStaff = (sqlite.prepare(`SELECT COUNT(*) as count FROM staff WHERE status = 'active'`).get() as any).count;
    const clockedInStaff = (sqlite.prepare(`
      SELECT COUNT(*) as count FROM attendance_staff WHERE date = ? AND clock_out IS NULL
    `).get(d) as any).count;

    // Virginia Points
    const checkedInWithDOB = sqlite.prepare(`
      SELECT c.date_of_birth FROM children c
      JOIN attendance_child ac ON c.id = ac.child_id
      WHERE ac.date = ? AND ac.check_out_time IS NULL
    `).all(d) as any[];

    let totalPoints = 0;
    for (const child of checkedInWithDOB) {
      const ageMonths = calculateAgeMonths(child.date_of_birth);
      const entry = VIRGINIA_POINT_TABLE.find(e => ageMonths >= e.minAgeMonths && ageMonths <= e.maxAgeMonths);
      totalPoints += entry ? entry.points : 0;
    }

    const caregiversNeeded = Math.ceil(totalPoints / MAX_POINTS_PER_CAREGIVER);
    const isCompliant = clockedInStaff >= caregiversNeeded || totalPoints === 0;

    // Billing summary for current month
    const monthStart = d.substring(0, 7) + '-01';
    const billingStats = sqlite.prepare(`
      SELECT
        COALESCE(SUM(total), 0) as totalBilled,
        COALESCE(SUM(amount_paid), 0) as totalCollected,
        COALESCE(SUM(balance_due), 0) as totalOutstanding,
        COUNT(*) as invoiceCount
      FROM invoices
      WHERE issued_date >= ? AND status != 'void'
    `).get(monthStart) as any;

    // Recent activity
    const recentActivity = sqlite.prepare(`
      SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10
    `).all();

    // Upcoming expirations (certs, background checks)
    const upcomingExpirations = sqlite.prepare(`
      SELECT sc.id, sc.staff_id, sc.cert_name as name, sc.expiry_date, s.first_name, s.last_name, 'certification' as doc_type
      FROM staff_certifications sc
      JOIN staff s ON sc.staff_id = s.id
      WHERE sc.expiry_date IS NOT NULL AND sc.expiry_date <= date('now', '+30 days') AND sc.expiry_date >= date('now')
      UNION ALL
      SELECT bc.id, bc.staff_id, bc.check_type as name, bc.expiry_date, s.first_name, s.last_name, 'background_check' as doc_type
      FROM background_checks bc
      JOIN staff s ON bc.staff_id = s.id
      WHERE bc.expiry_date IS NOT NULL AND bc.expiry_date <= date('now', '+30 days') AND bc.expiry_date >= date('now')
      ORDER BY expiry_date ASC
      LIMIT 10
    `).all();

    res.json({
      children: { total: totalChildren, checkedIn: checkedInChildren },
      staff: { total: totalStaff, clockedIn: clockedInStaff },
      compliance: { totalPoints, caregiversNeeded, caregiversPresent: clockedInStaff, isCompliant },
      billing: billingStats,
      recentActivity,
      upcomingExpirations,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Attendance Reports ──────────────────────────────

// GET /api/reports/attendance
// Query params: startDate, endDate, type (all|children|staff), entityId, groupBy, mode (summary|detail)
router.get('/attendance', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy, type, entityId, mode } = req.query;
    const start = (startDate as string) || today();
    const end = (endDate as string) || today();
    const reportType = (type as string) || 'all';
    const reportMode = (mode as string) || 'summary';

    if (groupBy === 'daily') {
      const daily = sqlite.prepare(`
        SELECT ac.date,
          COUNT(DISTINCT ac.child_id) as children_count,
          (SELECT COUNT(DISTINCT staff_id) FROM attendance_staff WHERE date = ac.date) as staff_count
        FROM attendance_child ac
        WHERE ac.date >= ? AND ac.date <= ?
        GROUP BY ac.date
        ORDER BY ac.date DESC
      `).all(start, end);
      return res.json(daily);
    }

    // ─── Detail mode: return individual daily records ───
    if (reportMode === 'detail') {
      const records: any[] = [];

      // Child records
      if (reportType === 'children' || reportType === 'all') {
        let childQuery = `
          SELECT
            ac.date,
            c.first_name || ' ' || c.last_name as name,
            ac.check_in_time as checkIn,
            ac.check_out_time as checkOut,
            'child' as type
          FROM attendance_child ac
          JOIN children c ON ac.child_id = c.id
          WHERE ac.date >= ? AND ac.date <= ?
        `;
        const childParams: (string | number)[] = [start, end];

        if (entityId) {
          childQuery += ' AND ac.child_id = ?';
          childParams.push(Number(entityId));
        }

        childQuery += ' ORDER BY ac.date DESC, name';
        const childRows = sqlite.prepare(childQuery).all(...childParams) as any[];

        for (const row of childRows) {
          let totalHours: number | null = null;
          if (row.checkIn && row.checkOut) {
            const checkInDate = new Date(`${row.date}T${row.checkIn}`);
            const checkOutDate = new Date(`${row.date}T${row.checkOut}`);
            totalHours = Math.round(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)) * 100) / 100;
          }
          records.push({ ...row, totalHours });
        }
      }

      // Staff records
      if (reportType === 'staff' || reportType === 'all') {
        let staffQuery = `
          SELECT
            ast.date,
            s.first_name || ' ' || s.last_name as name,
            ast.clock_in as checkIn,
            ast.clock_out as checkOut,
            'staff' as type
          FROM attendance_staff ast
          JOIN staff s ON ast.staff_id = s.id
          WHERE ast.date >= ? AND ast.date <= ?
        `;
        const staffParams: (string | number)[] = [start, end];

        if (entityId) {
          staffQuery += ' AND ast.staff_id = ?';
          staffParams.push(Number(entityId));
        }

        staffQuery += ' ORDER BY ast.date DESC, name';
        const staffRows = sqlite.prepare(staffQuery).all(...staffParams) as any[];

        for (const row of staffRows) {
          let totalHours: number | null = null;
          if (row.checkIn && row.checkOut) {
            const checkInDate = new Date(`${row.date}T${row.checkIn}`);
            const checkOutDate = new Date(`${row.date}T${row.checkOut}`);
            totalHours = Math.round(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)) * 100) / 100;
          }
          records.push({ ...row, totalHours });
        }
      }

      // Sort combined results by date descending, then name
      records.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.name.localeCompare(b.name);
      });

      return res.json({ records, total: records.length });
    }

    // ─── Summary mode (default): aggregated per-child/staff ───
    const childAttendance = (reportType === 'children' || reportType === 'all') ? sqlite.prepare(`
      SELECT c.id, c.first_name, c.last_name,
        COUNT(DISTINCT ac.date) as days_present,
        MIN(ac.check_in_time) as earliest_checkin,
        MAX(ac.check_out_time) as latest_checkout
      FROM children c
      LEFT JOIN attendance_child ac ON c.id = ac.child_id AND ac.date >= ? AND ac.date <= ?
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.first_name, c.last_name
    `).all(start, end) : [];

    const staffAttendance = (reportType === 'staff' || reportType === 'all') ? sqlite.prepare(`
      SELECT s.id, s.first_name, s.last_name,
        COUNT(DISTINCT a.date) as days_present,
        ROUND(COALESCE(SUM(a.total_hours), 0), 2) as total_hours
      FROM staff s
      LEFT JOIN attendance_staff a ON s.id = a.staff_id AND a.date >= ? AND a.date <= ?
      WHERE s.status = 'active'
      GROUP BY s.id
      ORDER BY s.first_name, s.last_name
    `).all(start, end) : [];

    res.json({ children: childAttendance, staff: staffAttendance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Financial Reports ───────────────────────────────

// GET /api/reports/financial
router.get('/financial', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = (startDate as string) || today().substring(0, 7) + '-01';
    const end = (endDate as string) || today();

    // Revenue summary
    const revenue = sqlite.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status != 'void' THEN total ELSE 0 END), 0) as total_billed,
        COALESCE(SUM(CASE WHEN status != 'void' THEN amount_paid ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status != 'void' THEN balance_due ELSE 0 END), 0) as total_outstanding,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
      FROM invoices
      WHERE issued_date >= ? AND issued_date <= ?
    `).get(start, end);

    // Payment breakdown by method
    const paymentsByMethod = sqlite.prepare(`
      SELECT method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE date >= ? AND date <= ?
      GROUP BY method
      ORDER BY total DESC
    `).all(start, end);

    // Monthly revenue trend
    const monthlyTrend = sqlite.prepare(`
      SELECT strftime('%Y-%m', issued_date) as month,
        COALESCE(SUM(total), 0) as billed,
        COALESCE(SUM(amount_paid), 0) as collected
      FROM invoices
      WHERE issued_date >= ? AND issued_date <= ? AND status != 'void'
      GROUP BY month
      ORDER BY month
    `).all(start, end);

    // Payroll summary
    const payroll = sqlite.prepare(`
      SELECT
        COUNT(*) as records,
        COALESCE(SUM(gross_pay), 0) as total_gross
      FROM payroll
      WHERE period_start >= ? AND period_end <= ?
    `).get(start, end);

    res.json({ revenue, paymentsByMethod, monthlyTrend, payroll });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Financial Drill-Down ────────────────────────────

// GET /api/reports/financial/invoices – Get invoices filtered by status
router.get('/financial/invoices', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;
    const start = (startDate as string) || today().substring(0, 7) + '-01';
    const end = (endDate as string) || today();

    let query = `
      SELECT i.id, i.invoice_number, i.issued_date, i.due_date,
        p.first_name || ' ' || p.last_name as family_name,
        i.subtotal, i.total, i.amount_paid, i.balance_due, i.status
      FROM invoices i
      LEFT JOIN parents p ON i.family_id = p.id
      WHERE i.issued_date >= ? AND i.issued_date <= ? AND i.status != 'void'
    `;
    const params: (string | number)[] = [start, end];

    if (status && status !== 'all') {
      // Support special filters
      if (status === 'billed') {
        // All non-void invoices (already filtered above)
      } else if (status === 'collected') {
        query += ` AND i.amount_paid > 0`;
      } else if (status === 'outstanding') {
        query += ` AND i.balance_due > 0`;
      } else {
        query += ` AND i.status = ?`;
        params.push(status as string);
      }
    }

    query += ' ORDER BY i.issued_date DESC';

    const invoices = sqlite.prepare(query).all(...params);
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/financial/payments – Get payments for a date range
router.get('/financial/payments', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, method } = req.query;
    const start = (startDate as string) || today().substring(0, 7) + '-01';
    const end = (endDate as string) || today();

    let query = `
      SELECT pay.id, pay.date, pay.amount, pay.method, pay.reference_number, pay.notes,
        p.first_name || ' ' || p.last_name as family_name,
        i.invoice_number
      FROM payments pay
      LEFT JOIN parents p ON pay.family_id = p.id
      LEFT JOIN invoices i ON pay.invoice_id = i.id
      WHERE pay.date >= ? AND pay.date <= ?
    `;
    const params: (string | number)[] = [start, end];

    if (method && method !== 'all') {
      query += ` AND pay.method = ?`;
      params.push(method as string);
    }

    query += ' ORDER BY pay.date DESC';

    const payments = sqlite.prepare(query).all(...params);
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Staff Payroll Report ───────────────────────────

// GET /api/reports/payroll – Calculate staff hours and estimated pay
router.get('/payroll', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    const start = (startDate as string) || today().substring(0, 7) + '-01';
    const end = (endDate as string) || today();

    let query = `
      SELECT
        s.id as staff_id,
        s.first_name,
        s.last_name,
        s.position,
        s.hourly_rate,
        s.overtime_rate,
        s.pay_frequency,
        COUNT(DISTINCT a.date) as days_worked,
        ROUND(COALESCE(SUM(a.total_hours), 0), 2) as total_hours,
        ROUND(COALESCE(SUM(CASE WHEN a.total_hours <= 8 THEN a.total_hours ELSE 8 END), 0), 2) as regular_hours,
        ROUND(COALESCE(SUM(CASE WHEN a.total_hours > 8 THEN a.total_hours - 8 ELSE 0 END), 0), 2) as overtime_hours
      FROM staff s
      LEFT JOIN attendance_staff a ON s.id = a.staff_id AND a.date >= ? AND a.date <= ?
      WHERE s.status = 'active'
    `;
    const params: (string | number)[] = [start, end];

    if (staffId) {
      query += ' AND s.id = ?';
      params.push(Number(staffId));
    }

    query += ' GROUP BY s.id ORDER BY s.first_name, s.last_name';

    const staffData = sqlite.prepare(query).all(...params) as any[];

    // Calculate pay
    const result = staffData.map(s => {
      const hourlyRate = s.hourly_rate || 0;
      const overtimeRate = s.overtime_rate || (hourlyRate * 1.5);
      const regularPay = s.regular_hours * hourlyRate;
      const overtimePay = s.overtime_hours * overtimeRate;
      const grossPay = regularPay + overtimePay;

      return {
        ...s,
        overtime_rate: overtimeRate,
        regular_pay: Math.round(regularPay * 100) / 100,
        overtime_pay: Math.round(overtimePay * 100) / 100,
        gross_pay: Math.round(grossPay * 100) / 100,
      };
    });

    // Totals
    const totals = {
      total_hours: result.reduce((sum, s) => sum + s.total_hours, 0),
      regular_hours: result.reduce((sum, s) => sum + s.regular_hours, 0),
      overtime_hours: result.reduce((sum, s) => sum + s.overtime_hours, 0),
      regular_pay: result.reduce((sum, s) => sum + s.regular_pay, 0),
      overtime_pay: result.reduce((sum, s) => sum + s.overtime_pay, 0),
      gross_pay: result.reduce((sum, s) => sum + s.gross_pay, 0),
    };

    res.json({ staff: result, totals });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/payroll/detail – Daily breakdown for a specific staff member
router.get('/payroll/detail', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    const start = (startDate as string) || today().substring(0, 7) + '-01';
    const end = (endDate as string) || today();

    if (!staffId) return res.status(400).json({ error: 'staffId is required' });

    // Get staff info
    const staffInfo = sqlite.prepare(`
      SELECT id, first_name, last_name, position, hourly_rate, overtime_rate, pay_frequency
      FROM staff WHERE id = ?
    `).get(Number(staffId)) as any;

    if (!staffInfo) return res.status(404).json({ error: 'Staff not found' });

    // Get daily attendance records
    const records = sqlite.prepare(`
      SELECT date, clock_in, clock_out, break_minutes, total_hours, notes
      FROM attendance_staff
      WHERE staff_id = ? AND date >= ? AND date <= ?
      ORDER BY date DESC
    `).all(Number(staffId), start, end) as any[];

    const hourlyRate = staffInfo.hourly_rate || 0;
    const overtimeRate = staffInfo.overtime_rate || (hourlyRate * 1.5);

    // Calculate pay per day
    const detailedRecords = records.map(r => {
      const hours = r.total_hours || 0;
      const regHrs = Math.min(hours, 8);
      const otHrs = Math.max(hours - 8, 0);
      const dayPay = (regHrs * hourlyRate) + (otHrs * overtimeRate);
      return {
        ...r,
        regular_hours: Math.round(regHrs * 100) / 100,
        overtime_hours: Math.round(otHrs * 100) / 100,
        day_pay: Math.round(dayPay * 100) / 100,
      };
    });

    res.json({ staff: staffInfo, records: detailedRecords, hourlyRate, overtimeRate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/export/payroll – Export payroll as CSV
router.get('/export/payroll', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    const start = (startDate as string) || today().substring(0, 7) + '-01';
    const end = (endDate as string) || today();

    let query = `
      SELECT
        s.first_name, s.last_name, s.position, s.hourly_rate, s.overtime_rate,
        COUNT(DISTINCT a.date) as days_worked,
        ROUND(COALESCE(SUM(a.total_hours), 0), 2) as total_hours,
        ROUND(COALESCE(SUM(CASE WHEN a.total_hours <= 8 THEN a.total_hours ELSE 8 END), 0), 2) as regular_hours,
        ROUND(COALESCE(SUM(CASE WHEN a.total_hours > 8 THEN a.total_hours - 8 ELSE 0 END), 0), 2) as overtime_hours
      FROM staff s
      LEFT JOIN attendance_staff a ON s.id = a.staff_id AND a.date >= ? AND a.date <= ?
      WHERE s.status = 'active'
    `;
    const params: (string | number)[] = [start, end];

    if (staffId) {
      query += ' AND s.id = ?';
      params.push(Number(staffId));
    }

    query += ' GROUP BY s.id ORDER BY s.first_name, s.last_name';
    const rows = sqlite.prepare(query).all(...params) as any[];

    let csv = 'First Name,Last Name,Position,Hourly Rate,Overtime Rate,Days Worked,Total Hours,Regular Hours,Overtime Hours,Regular Pay,Overtime Pay,Gross Pay\n';
    for (const r of rows) {
      const hr = r.hourly_rate || 0;
      const otr = r.overtime_rate || (hr * 1.5);
      const regPay = (r.regular_hours * hr).toFixed(2);
      const otPay = (r.overtime_hours * otr).toFixed(2);
      const gross = (parseFloat(regPay) + parseFloat(otPay)).toFixed(2);
      csv += `${r.first_name},${r.last_name},${r.position || ''},${hr},${otr},${r.days_worked},${r.total_hours},${r.regular_hours},${r.overtime_hours},${regPay},${otPay},${gross}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-${start}-${end}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Compliance Reports ──────────────────────────────

// GET /api/reports/compliance
router.get('/compliance', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    // Staff certifications status
    const certifications = sqlite.prepare(`
      SELECT s.id as staff_id, s.first_name, s.last_name, s.position,
        sc.cert_type, sc.cert_name, sc.issue_date, sc.expiry_date, sc.training_hours, sc.sponsoring_org
      FROM staff s
      LEFT JOIN staff_certifications sc ON s.id = sc.staff_id
      WHERE s.status = 'active'
      ORDER BY s.last_name, sc.expiry_date
    `).all();

    // Background check status
    const backgroundChecks = sqlite.prepare(`
      SELECT s.id as staff_id, s.first_name, s.last_name,
        bc.check_type, bc.result, bc.check_date, bc.expiry_date
      FROM staff s
      LEFT JOIN background_checks bc ON s.id = bc.staff_id
      WHERE s.status = 'active'
      ORDER BY s.last_name, bc.expiry_date
    `).all();

    // Immunization compliance
    const immunizations = sqlite.prepare(`
      SELECT c.id as child_id, c.first_name, c.last_name,
        COUNT(im.id) as immunization_count
      FROM children c
      LEFT JOIN immunizations im ON c.id = im.child_id
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.last_name
    `).all();

    // Drill logs
    const drills = sqlite.prepare(`
      SELECT * FROM drill_logs ORDER BY date DESC LIMIT 20
    `).all();

    res.json({ certifications, backgroundChecks, immunizations, drills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Export CSV ──────────────────────────────────────

// GET /api/reports/export/attendance
// Query params: startDate, endDate, type (all|children|staff), entityId
router.get('/export/attendance', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, entityId } = req.query;
    const start = (startDate as string) || today();
    const end = (endDate as string) || today();
    const reportType = (type as string) || 'all';

    const rows: any[] = [];

    // Child records
    if (reportType === 'children' || reportType === 'all') {
      let childQuery = `
        SELECT ac.date, c.first_name, c.last_name, ac.check_in_time as check_in, ac.check_out_time as check_out, 'Child' as type
        FROM attendance_child ac
        JOIN children c ON ac.child_id = c.id
        WHERE ac.date >= ? AND ac.date <= ?
      `;
      const childParams: (string | number)[] = [start, end];

      if (entityId && reportType === 'children') {
        childQuery += ' AND ac.child_id = ?';
        childParams.push(Number(entityId));
      }
      childQuery += ' ORDER BY ac.date, c.last_name';
      const childRows = sqlite.prepare(childQuery).all(...childParams) as any[];

      for (const r of childRows) {
        let totalHours = '';
        if (r.check_in && r.check_out) {
          const ci = new Date(`${r.date}T${r.check_in}`);
          const co = new Date(`${r.date}T${r.check_out}`);
          totalHours = (Math.round(((co.getTime() - ci.getTime()) / (1000 * 60 * 60)) * 100) / 100).toString();
        }
        rows.push({ date: r.date, first_name: r.first_name, last_name: r.last_name, type: r.type, check_in: r.check_in || '', check_out: r.check_out || '', total_hours: totalHours });
      }
    }

    // Staff records
    if (reportType === 'staff' || reportType === 'all') {
      let staffQuery = `
        SELECT a.date, s.first_name, s.last_name, a.clock_in as check_in, a.clock_out as check_out, 'Staff' as type
        FROM attendance_staff a
        JOIN staff s ON a.staff_id = s.id
        WHERE a.date >= ? AND a.date <= ?
      `;
      const staffParams: (string | number)[] = [start, end];

      if (entityId && reportType === 'staff') {
        staffQuery += ' AND a.staff_id = ?';
        staffParams.push(Number(entityId));
      }
      staffQuery += ' ORDER BY a.date, s.last_name';
      const staffRows = sqlite.prepare(staffQuery).all(...staffParams) as any[];

      for (const r of staffRows) {
        let totalHours = '';
        if (r.check_in && r.check_out) {
          const ci = new Date(`${r.date}T${r.check_in}`);
          const co = new Date(`${r.date}T${r.check_out}`);
          totalHours = (Math.round(((co.getTime() - ci.getTime()) / (1000 * 60 * 60)) * 100) / 100).toString();
        }
        rows.push({ date: r.date, first_name: r.first_name, last_name: r.last_name, type: r.type, check_in: r.check_in || '', check_out: r.check_out || '', total_hours: totalHours });
      }
    }

    // Sort by date then name
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.last_name.localeCompare(b.last_name));

    let csv = 'Date,First Name,Last Name,Type,Check In / Clock In,Check Out / Clock Out,Total Hours\n';
    for (const r of rows) {
      csv += `${r.date},${r.first_name},${r.last_name},${r.type},${r.check_in},${r.check_out},${r.total_hours}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${start}-${end}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/export/financial
router.get('/export/financial', requireAuth, requirePermission('reports_view'), (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = (startDate as string) || today().substring(0, 7) + '-01';
    const end = (endDate as string) || today();

    const invoices = sqlite.prepare(`
      SELECT i.invoice_number, i.issued_date, i.due_date,
        p.first_name as family_first, p.last_name as family_last,
        i.subtotal, i.total, i.amount_paid, i.balance_due, i.status
      FROM invoices i
      LEFT JOIN parents p ON i.family_id = p.id
      WHERE i.issued_date >= ? AND i.issued_date <= ?
      ORDER BY i.issued_date DESC
    `).all(start, end) as any[];

    let csv = 'Invoice #,Date,Due Date,Family,Subtotal,Total,Paid,Balance,Status\n';
    for (const i of invoices) {
      csv += `${i.invoice_number},${i.issued_date},${i.due_date},${i.family_first} ${i.family_last},${i.subtotal},${i.total},${i.amount_paid},${i.balance_due},${i.status}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="financial-${start}-${end}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
