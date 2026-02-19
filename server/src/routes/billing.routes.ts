import { Router, Request, Response } from 'express';
import { sqlite } from '../db/connection';
import { requireAuth, requirePermission } from '../middleware/auth';

const router = Router();

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Fee Configurations ────────────────────────────────────────

// GET /api/billing/fees
router.get('/fees', requireAuth, (req: Request, res: Response) => {
  try {
    const fees = sqlite.prepare(`SELECT * FROM fee_configurations WHERE is_active = 1 ORDER BY age_group, schedule_type`).all();
    res.json(fees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/fees/all (include inactive)
router.get('/fees/all', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const fees = sqlite.prepare(`SELECT * FROM fee_configurations ORDER BY age_group, schedule_type`).all();
    res.json(fees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/fees
router.post('/fees', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { name, age_group, schedule_type, weekly_rate, daily_rate, hourly_rate, registration_fee, late_pickup_fee_per_minute, late_payment_fee, sibling_discount_pct, effective_date } = req.body;
    const result = sqlite.prepare(`
      INSERT INTO fee_configurations (name, age_group, schedule_type, weekly_rate, daily_rate, hourly_rate, registration_fee, late_pickup_fee_per_minute, late_payment_fee, sibling_discount_pct, effective_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, age_group, schedule_type, weekly_rate || 0, daily_rate || 0, hourly_rate || 0, registration_fee || 0, late_pickup_fee_per_minute || 1, late_payment_fee || 25, sibling_discount_pct || 0, effective_date || today());
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/billing/fees/:id
router.put('/fees/:id', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { name, age_group, schedule_type, weekly_rate, daily_rate, hourly_rate, registration_fee, late_pickup_fee_per_minute, late_payment_fee, sibling_discount_pct, effective_date, is_active } = req.body;
    sqlite.prepare(`
      UPDATE fee_configurations SET name = ?, age_group = ?, schedule_type = ?, weekly_rate = ?,
        daily_rate = ?, hourly_rate = ?, registration_fee = ?, late_pickup_fee_per_minute = ?,
        late_payment_fee = ?, sibling_discount_pct = ?, effective_date = ?, is_active = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name, age_group, schedule_type, weekly_rate || 0, daily_rate || 0, hourly_rate || 0, registration_fee || 0, late_pickup_fee_per_minute || 1, late_payment_fee || 25, sibling_discount_pct || 0, effective_date, is_active ?? 1, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invoices ────────────────────────────────────────

// GET /api/billing/invoices
router.get('/invoices', requireAuth, (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, familyId } = req.query;
    let query = `
      SELECT i.*,
        p.first_name as family_first_name, p.last_name as family_last_name
      FROM invoices i
      LEFT JOIN parents p ON i.family_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND i.status = ?`;
      params.push(status);
    }
    if (startDate) {
      query += ` AND i.issued_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND i.issued_date <= ?`;
      params.push(endDate);
    }
    if (familyId) {
      query += ` AND i.family_id = ?`;
      params.push(familyId);
    }

    query += ` ORDER BY i.issued_date DESC, i.created_at DESC`;
    const invoices = sqlite.prepare(query).all(...params);
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/invoices/:id
router.get('/invoices/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const invoice = sqlite.prepare(`
      SELECT i.*,
        p.first_name as family_first_name, p.last_name as family_last_name,
        p.email as family_email, p.phone_cell as family_phone, p.home_address as family_address
      FROM invoices i
      LEFT JOIN parents p ON i.family_id = p.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const lineItems = sqlite.prepare(`
      SELECT li.*, c.first_name as child_first_name, c.last_name as child_last_name
      FROM invoice_line_items li
      LEFT JOIN children c ON li.child_id = c.id
      WHERE li.invoice_id = ? ORDER BY li.id
    `).all(req.params.id);
    const payments = sqlite.prepare(`SELECT * FROM payments WHERE invoice_id = ? ORDER BY date DESC`).all(req.params.id);

    res.json({ ...(invoice as any), lineItems, payments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/invoices
router.post('/invoices', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { family_id, due_date, period_start, period_end, lineItems, notes } = req.body;

    const subtotal = (lineItems || []).reduce((sum: number, li: any) => sum + ((li.unit_price || li.amount || 0) * (li.quantity || 1)), 0);
    const total = subtotal;

    const invoiceNumber = `INV-${Date.now()}`;

    const insertInvoice = sqlite.prepare(`
      INSERT INTO invoices (invoice_number, family_id, issued_date, due_date, period_start, period_end,
        subtotal, total, amount_paid, balance_due, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending', ?)
    `);

    const insertLineItem = sqlite.prepare(`
      INSERT INTO invoice_line_items (invoice_id, child_id, description, item_type, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = sqlite.transaction(() => {
      const result = insertInvoice.run(
        invoiceNumber, family_id, today(), due_date,
        period_start, period_end, subtotal, total, total, notes || null
      );
      const invoiceId = Number(result.lastInsertRowid);

      for (const li of (lineItems || [])) {
        const liTotal = (li.unit_price || li.amount || 0) * (li.quantity || 1);
        insertLineItem.run(invoiceId, li.child_id || null, li.description, li.item_type || 'tuition', li.quantity || 1, li.unit_price || li.amount || 0, liTotal);
      }

      return invoiceId;
    });

    const invoiceId = transaction();
    res.json({ success: true, id: invoiceId, invoiceNumber });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/billing/invoices/:id
router.put('/invoices/:id', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { due_date, notes, status } = req.body;
    sqlite.prepare(`
      UPDATE invoices SET due_date = COALESCE(?, due_date), notes = COALESCE(?, notes),
        status = COALESCE(?, status), updated_at = datetime('now')
      WHERE id = ?
    `).run(due_date || null, notes !== undefined ? notes : null, status || null, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/invoices/:id/void
router.post('/invoices/:id/void', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    sqlite.prepare(`UPDATE invoices SET status = 'void', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/billing/invoices/:id/split-billing
router.put('/invoices/:id/split-billing', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { split_billing_pct, split_billing_payer, split_billing_payer_address } = req.body;
    sqlite.prepare(`
      UPDATE invoices SET
        split_billing_pct = ?,
        split_billing_payer = ?,
        split_billing_payer_address = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      split_billing_pct ?? null,
      split_billing_payer ?? null,
      split_billing_payer_address ?? null,
      req.params.id
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Payments ────────────────────────────────────────

// POST /api/billing/payments
router.post('/payments', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { invoice_id, family_id, amount, method, date: payDate, reference_number, notes } = req.body;

    const transaction = sqlite.transaction(() => {
      // Determine family_id from invoice if not provided
      let fid = family_id;
      if (!fid && invoice_id) {
        const inv = sqlite.prepare(`SELECT family_id FROM invoices WHERE id = ?`).get(invoice_id) as any;
        fid = inv?.family_id;
      }

      const result = sqlite.prepare(`
        INSERT INTO payments (family_id, invoice_id, date, amount, method, reference_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(fid, invoice_id || null, payDate || today(), amount, method || 'cash', reference_number || null, notes || null);

      // Update invoice amounts if linked to an invoice
      if (invoice_id) {
        const invoice = sqlite.prepare(`SELECT total, amount_paid FROM invoices WHERE id = ?`).get(invoice_id) as any;
        if (invoice) {
          const newAmountPaid = (invoice.amount_paid || 0) + amount;
          const newBalance = invoice.total - newAmountPaid;
          const newStatus = newBalance <= 0 ? 'paid' : 'partial';
          sqlite.prepare(`
            UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ?, updated_at = datetime('now') WHERE id = ?
          `).run(newAmountPaid, Math.max(0, newBalance), newStatus, invoice_id);
        }
      }

      return Number(result.lastInsertRowid);
    });

    const paymentId = transaction();
    res.json({ success: true, id: paymentId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/payments
router.get('/payments', requireAuth, (req: Request, res: Response) => {
  try {
    const { startDate, endDate, method } = req.query;
    let query = `
      SELECT p.*, i.invoice_number,
        pr.first_name as family_first_name, pr.last_name as family_last_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN parents pr ON p.family_id = pr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) { query += ` AND p.date >= ?`; params.push(startDate); }
    if (endDate) { query += ` AND p.date <= ?`; params.push(endDate); }
    if (method) { query += ` AND p.method = ?`; params.push(method); }

    query += ` ORDER BY p.date DESC`;
    res.json(sqlite.prepare(query).all(...params));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Family Account / Balance Summary ────────────────

// GET /api/billing/family/:parentId
router.get('/family/:parentId', requireAuth, (req: Request, res: Response) => {
  try {
    const parentId = req.params.parentId;

    const parent = sqlite.prepare(`SELECT * FROM parents WHERE id = ?`).get(parentId);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const children = sqlite.prepare(`
      SELECT c.* FROM children c
      JOIN child_parent cp ON c.id = cp.child_id
      WHERE cp.parent_id = ?
    `).all(parentId);

    const invoices = sqlite.prepare(`
      SELECT * FROM invoices WHERE family_id = ? ORDER BY issued_date DESC
    `).all(parentId);

    const totalBalance = (invoices as any[]).reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
    const totalPaid = (invoices as any[]).reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);

    const recentPayments = sqlite.prepare(`
      SELECT p.* FROM payments p
      WHERE p.family_id = ?
      ORDER BY p.date DESC LIMIT 10
    `).all(parentId);

    res.json({
      parent,
      children,
      invoices,
      recentPayments,
      summary: { totalBalance, totalPaid, invoiceCount: (invoices as any[]).length }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Aging Report ────────────────────────────────────

// GET /api/billing/aging
router.get('/aging', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const d = today();
    const invoices = sqlite.prepare(`
      SELECT i.*, p.first_name as family_first_name, p.last_name as family_last_name
      FROM invoices i
      LEFT JOIN parents p ON i.family_id = p.id
      WHERE i.balance_due > 0 AND i.status != 'void'
      ORDER BY i.due_date ASC
    `).all() as any[];

    const aging = {
      current: [] as any[],
      days30: [] as any[],
      days60: [] as any[],
      days90: [] as any[],
      over90: [] as any[],
    };

    for (const inv of invoices) {
      const dueDate = new Date(inv.due_date);
      const todayDate = new Date(d);
      const daysPast = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPast <= 0) aging.current.push(inv);
      else if (daysPast <= 30) aging.days30.push(inv);
      else if (daysPast <= 60) aging.days60.push(inv);
      else if (daysPast <= 90) aging.days90.push(inv);
      else aging.over90.push(inv);
    }

    const totals = {
      current: aging.current.reduce((s, i) => s + i.balance_due, 0),
      days30: aging.days30.reduce((s, i) => s + i.balance_due, 0),
      days60: aging.days60.reduce((s, i) => s + i.balance_due, 0),
      days90: aging.days90.reduce((s, i) => s + i.balance_due, 0),
      over90: aging.over90.reduce((s, i) => s + i.balance_due, 0),
    };

    res.json({ aging, totals, totalOutstanding: Object.values(totals).reduce((a, b) => a + b, 0) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Generate Batch Invoices ─────────────────────────

// POST /api/billing/generate
router.post('/generate', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { period_start, period_end, due_date } = req.body;

    // Get all active children with their fee config and primary billing parent
    const children = sqlite.prepare(`
      SELECT c.id as child_id, c.first_name, c.last_name, c.expected_schedule, c.date_of_birth,
        cp.parent_id as family_id
      FROM children c
      JOIN child_parent cp ON c.id = cp.child_id
      WHERE c.status = 'active'
      GROUP BY c.id
    `).all() as any[];

    const insertInvoice = sqlite.prepare(`
      INSERT INTO invoices (invoice_number, family_id, issued_date, due_date, period_start, period_end,
        subtotal, total, amount_paid, balance_due, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending')
    `);

    const insertLineItem = sqlite.prepare(`
      INSERT INTO invoice_line_items (invoice_id, child_id, description, item_type, quantity, unit_price, total)
      VALUES (?, ?, ?, 'tuition', 1, ?, ?)
    `);

    const generated: any[] = [];

    const transaction = sqlite.transaction(() => {
      for (const child of children) {
        // Find matching fee config
        const ageMonths = calculateAgeMonths(child.date_of_birth);
        const ageGroup = getAgeGroup(ageMonths);
        const fee = sqlite.prepare(`
          SELECT * FROM fee_configurations
          WHERE age_group = ? AND schedule_type = ? AND is_active = 1
          ORDER BY effective_date DESC LIMIT 1
        `).get(ageGroup, child.expected_schedule || 'full_time') as any;

        if (!fee) continue;

        const invoiceNumber = `INV-${Date.now()}-${child.child_id}`;
        const amount = fee.weekly_rate || fee.daily_rate || fee.hourly_rate || 0;

        const result = insertInvoice.run(
          invoiceNumber, child.family_id, today(), due_date,
          period_start, period_end, amount, amount, amount
        );
        const invoiceId = Number(result.lastInsertRowid);

        insertLineItem.run(invoiceId, child.child_id, `Tuition - ${fee.name}`, amount, amount);

        generated.push({ invoiceId, invoiceNumber, childName: `${child.first_name} ${child.last_name}`, amount });
      }
    });

    transaction();
    res.json({ success: true, generated, count: generated.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Payment Methods ─────────────────────────────────

// GET /api/billing/payment-methods
router.get('/payment-methods', requireAuth, (req: Request, res: Response) => {
  try {
    const methods = sqlite.prepare(`SELECT * FROM payment_methods WHERE is_active = 1`).all();
    res.json(methods);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/payment-methods/all (include inactive)
router.get('/payment-methods/all', requireAuth, (req: Request, res: Response) => {
  try {
    const methods = sqlite.prepare(`SELECT * FROM payment_methods ORDER BY name`).all();
    res.json(methods);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/payment-methods
router.post('/payment-methods', requireAuth, (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const result = sqlite.prepare(`
      INSERT INTO payment_methods (name) VALUES (?)
    `).run(name);
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/billing/payment-methods/:id - Update name and/or toggle active
router.put('/payment-methods/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const { is_active, name } = req.body;
    if (name !== undefined) {
      sqlite.prepare(`UPDATE payment_methods SET name = ? WHERE id = ?`).run(name, req.params.id);
    }
    if (is_active !== undefined) {
      sqlite.prepare(`UPDATE payment_methods SET is_active = ? WHERE id = ?`).run(is_active ? 1 : 0, req.params.id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invoice Line Items CRUD ────────────────────────

// POST /api/billing/invoices/:id/line-items
router.post('/invoices/:id/line-items', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id;
    const { description, item_type, quantity, unit_price, child_id } = req.body;
    const total = (unit_price || 0) * (quantity || 1);

    const result = sqlite.prepare(`
      INSERT INTO invoice_line_items (invoice_id, child_id, description, item_type, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceId, child_id || null, description, item_type || 'tuition', quantity || 1, unit_price || 0, total);

    // Recalculate invoice totals
    recalculateInvoiceTotals(Number(invoiceId));

    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/billing/invoices/:invoiceId/line-items/:id
router.put('/invoices/:invoiceId/line-items/:id', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    const { description, item_type, quantity, unit_price } = req.body;
    const total = (unit_price || 0) * (quantity || 1);

    sqlite.prepare(`
      UPDATE invoice_line_items SET description = ?, item_type = ?, quantity = ?, unit_price = ?, total = ?
      WHERE id = ? AND invoice_id = ?
    `).run(description, item_type || 'tuition', quantity || 1, unit_price || 0, total, req.params.id, req.params.invoiceId);

    recalculateInvoiceTotals(Number(req.params.invoiceId));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/billing/invoices/:invoiceId/line-items/:id
router.delete('/invoices/:invoiceId/line-items/:id', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM invoice_line_items WHERE id = ? AND invoice_id = ?`).run(req.params.id, req.params.invoiceId);
    recalculateInvoiceTotals(Number(req.params.invoiceId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Family Accounts ────────────────────────────────

// GET /api/billing/families - List all families with balances
router.get('/families', requireAuth, (req: Request, res: Response) => {
  try {
    const families = sqlite.prepare(`
      SELECT p.id, p.first_name, p.last_name, p.email, p.phone_cell,
        GROUP_CONCAT(DISTINCT c.first_name || ' ' || c.last_name) as children_names,
        COALESCE(SUM(CASE WHEN i.status != 'void' THEN i.balance_due ELSE 0 END), 0) as total_balance,
        (SELECT MAX(py.date) FROM payments py WHERE py.family_id = p.id) as last_payment_date
      FROM parents p
      LEFT JOIN child_parent cp ON p.id = cp.parent_id
      LEFT JOIN children c ON cp.child_id = c.id AND c.status = 'active'
      LEFT JOIN invoices i ON p.id = i.family_id
      GROUP BY p.id
      ORDER BY p.last_name, p.first_name
    `).all();
    res.json(families);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/billing/fees/:id
router.delete('/fees/:id', requireAuth, requirePermission('manage_billing'), (req: Request, res: Response) => {
  try {
    sqlite.prepare(`DELETE FROM fee_configurations WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ─────────────────────────────────────────

function recalculateInvoiceTotals(invoiceId: number) {
  const items = sqlite.prepare(`SELECT COALESCE(SUM(total), 0) as subtotal FROM invoice_line_items WHERE invoice_id = ?`).get(invoiceId) as any;
  const invoice = sqlite.prepare(`SELECT amount_paid FROM invoices WHERE id = ?`).get(invoiceId) as any;
  const subtotal = items.subtotal;
  const amountPaid = invoice?.amount_paid || 0;
  const balanceDue = Math.max(0, subtotal - amountPaid);
  const status = balanceDue <= 0 && amountPaid > 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
  sqlite.prepare(`UPDATE invoices SET subtotal = ?, total = ?, balance_due = ?, status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(subtotal, subtotal, balanceDue, status, invoiceId);
}


function calculateAgeMonths(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function getAgeGroup(ageMonths: number): string {
  if (ageMonths <= 15) return 'infant';
  if (ageMonths <= 23) return 'toddler';
  if (ageMonths <= 59) return 'preschool';
  if (ageMonths <= 119) return 'school_age';
  return 'school_age';
}

export default router;
