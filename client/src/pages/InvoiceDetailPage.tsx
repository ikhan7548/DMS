import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, LinearProgress, Alert, Divider, Paper, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Snackbar, InputAdornment,
  FormControlLabel,
} from '@mui/material';
import { ArrowBack, Print, Block, Add, Edit, Delete, Payment, CallSplit } from '@mui/icons-material';
import api from '../lib/api';
import PrintableInvoice from '../components/PrintableInvoice';

const LINE_ITEM_TYPES = ['tuition', 'registration', 'supply_fee', 'activity_fee', 'late_pickup', 'late_payment', 'other'];

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Line Item Dialog
  const [lineItemOpen, setLineItemOpen] = useState(false);
  const [editLineItem, setEditLineItem] = useState<any>(null);
  const [lineItemForm, setLineItemForm] = useState({
    description: '', item_type: 'tuition', quantity: '1', unit_price: '',
  });

  // Delete Line Item
  const [deleteLineOpen, setDeleteLineOpen] = useState(false);
  const [deleteLineTarget, setDeleteLineTarget] = useState<any>(null);

  // Payment Dialog
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', method: 'cash', date: new Date().toISOString().split('T')[0],
    reference_number: '', notes: '',
  });

  // Settings for printable invoice
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Split Billing
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitPct, setSplitPct] = useState('100');
  const [splitPayer, setSplitPayer] = useState('');
  const [splitPayerAddress, setSplitPayerAddress] = useState('');
  const [splitSaving, setSplitSaving] = useState(false);

  const fetchInvoice = () => {
    setLoading(true);
    api.get(`/billing/invoices/${id}`)
      .then((res) => {
        setInvoice(res.data);
        // Sync split billing state from invoice data
        if (res.data.split_billing_pct != null && res.data.split_billing_pct < 100) {
          setSplitEnabled(true);
          setSplitPct(String(res.data.split_billing_pct));
          setSplitPayer(res.data.split_billing_payer || '');
          setSplitPayerAddress(res.data.split_billing_payer_address || '');
        } else {
          setSplitEnabled(false);
          setSplitPct('100');
          setSplitPayer('');
          setSplitPayerAddress('');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoice(); }, [id]);
  useEffect(() => { api.get('/settings').then(res => setSettings(res.data)).catch(() => {}); }, []);

  const handleVoid = async () => {
    try {
      await api.post(`/billing/invoices/${id}/void`);
      setInvoice({ ...invoice, status: 'void' });
      setSnackbar({ open: true, message: 'Invoice voided' });
    } catch {}
  };

  const handlePrint = () => window.print();

  // Line Item handlers
  const openAddLineItem = () => {
    setEditLineItem(null);
    setLineItemForm({ description: '', item_type: 'tuition', quantity: '1', unit_price: '' });
    setLineItemOpen(true);
  };

  const openEditLineItem = (li: any) => {
    setEditLineItem(li);
    setLineItemForm({
      description: li.description || '',
      item_type: li.item_type || 'tuition',
      quantity: String(li.quantity || 1),
      unit_price: String(li.unit_price || 0),
    });
    setLineItemOpen(true);
  };

  const handleSaveLineItem = async () => {
    try {
      const payload = {
        description: lineItemForm.description,
        item_type: lineItemForm.item_type,
        quantity: parseFloat(lineItemForm.quantity) || 1,
        unit_price: parseFloat(lineItemForm.unit_price) || 0,
      };
      if (editLineItem) {
        await api.put(`/billing/invoices/${id}/line-items/${editLineItem.id}`, payload);
        setSnackbar({ open: true, message: 'Line item updated' });
      } else {
        await api.post(`/billing/invoices/${id}/line-items`, payload);
        setSnackbar({ open: true, message: 'Line item added' });
      }
      setLineItemOpen(false);
      fetchInvoice();
    } catch { setSnackbar({ open: true, message: 'Failed to save line item' }); }
  };

  const handleDeleteLineItem = async () => {
    if (!deleteLineTarget) return;
    try {
      await api.delete(`/billing/invoices/${id}/line-items/${deleteLineTarget.id}`);
      setDeleteLineOpen(false);
      setSnackbar({ open: true, message: 'Line item deleted' });
      fetchInvoice();
    } catch { setSnackbar({ open: true, message: 'Failed to delete line item' }); }
  };

  // Payment handler
  const handleRecordPayment = async () => {
    try {
      await api.post('/billing/payments', {
        invoice_id: id,
        amount: parseFloat(paymentForm.amount) || 0,
        method: paymentForm.method,
        date: paymentForm.date,
        reference_number: paymentForm.reference_number,
        notes: paymentForm.notes,
      });
      setPaymentOpen(false);
      setPaymentForm({ amount: '', method: 'cash', date: new Date().toISOString().split('T')[0], reference_number: '', notes: '' });
      setSnackbar({ open: true, message: 'Payment recorded' });
      fetchInvoice();
    } catch { setSnackbar({ open: true, message: 'Failed to record payment' }); }
  };

  // Split Billing handlers
  const handleSaveSplit = async () => {
    setSplitSaving(true);
    try {
      if (splitEnabled) {
        await api.put(`/billing/invoices/${id}/split-billing`, {
          split_billing_pct: parseFloat(splitPct) || 100,
          split_billing_payer: splitPayer,
          split_billing_payer_address: splitPayerAddress,
        });
      } else {
        await api.put(`/billing/invoices/${id}/split-billing`, {
          split_billing_pct: null,
          split_billing_payer: null,
          split_billing_payer_address: null,
        });
      }
      setSnackbar({ open: true, message: splitEnabled ? 'Split billing saved' : 'Split billing cleared' });
      fetchInvoice();
    } catch { setSnackbar({ open: true, message: 'Failed to save split billing' }); }
    finally { setSplitSaving(false); }
  };

  // Split calculations
  const invoiceTotal = invoice ? (invoice.total || 0) : 0;
  const parentPortion = splitEnabled ? invoiceTotal * ((parseFloat(splitPct) || 100) / 100) : invoiceTotal;
  const thirdPartyPortion = splitEnabled ? invoiceTotal - parentPortion : 0;

  if (loading) return <LinearProgress />;
  if (!invoice) return <Alert severity="error">Invoice not found</Alert>;

  const statusColor = (s: string) => {
    switch (s) { case 'paid': return 'success'; case 'pending': return 'warning'; case 'overdue': return 'error'; case 'partial': return 'info'; default: return 'default'; }
  };

  const isEditable = invoice.status !== 'void' && invoice.status !== 'paid';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/billing')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Invoice {invoice.invoice_number}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip label={invoice.status} color={statusColor(invoice.status) as any} size="small" />
            {splitEnabled && <Chip icon={<CallSplit />} label="Split Billing" size="small" color="info" variant="outlined" />}
          </Box>
        </Box>
        {isEditable && (
          <Button variant="contained" startIcon={<Payment />} onClick={() => {
            setPaymentForm({ ...paymentForm, amount: String(invoice.balance_due || 0) });
            setPaymentOpen(true);
          }}>
            Record Payment
          </Button>
        )}
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>Print</Button>
        {isEditable && (
          <Button variant="outlined" color="error" startIcon={<Block />} onClick={handleVoid}>Void</Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Invoice Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Bill To</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {invoice.family_first_name} {invoice.family_last_name}
                  </Typography>
                  {invoice.family_email && <Typography variant="body2">{invoice.family_email}</Typography>}
                  {invoice.family_phone && <Typography variant="body2">{invoice.family_phone}</Typography>}
                  {invoice.family_address && <Typography variant="body2">{invoice.family_address}</Typography>}
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Issued Date</Typography>
                  <Typography variant="body2">{invoice.issued_date}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Due Date</Typography>
                  <Typography variant="body2">{invoice.due_date}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Period Start</Typography>
                  <Typography variant="body2">{invoice.period_start}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Period End</Typography>
                  <Typography variant="body2">{invoice.period_end}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Line Items Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>Line Items</Typography>
                {isEditable && (
                  <Button size="small" startIcon={<Add />} onClick={openAddLineItem}>Add Line Item</Button>
                )}
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      {isEditable && <TableCell align="center">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(invoice.lineItems || []).map((li: any) => (
                      <TableRow key={li.id}>
                        <TableCell>{li.description}</TableCell>
                        <TableCell><Chip label={li.item_type || li.category} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right">{li.quantity}</TableCell>
                        <TableCell align="right">${(li.unit_price || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">${(li.total || li.amount || 0).toFixed(2)}</TableCell>
                        {isEditable && (
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => openEditLineItem(li)}><Edit fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => { setDeleteLineTarget(li); setDeleteLineOpen(true); }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {(invoice.lineItems || []).length === 0 && (
                      <TableRow><TableCell colSpan={isEditable ? 6 : 5} align="center">No line items</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Box sx={{ width: 280 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">${(invoice.subtotal || 0).toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>${(invoice.total || 0).toFixed(2)}</Typography>
                  </Box>

                  {/* Split billing breakdown */}
                  {splitEnabled && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(21, 101, 192, 0.15)' : '#e3f2fd', px: 1, borderRadius: 1, mt: 0.5 }}>
                        <Typography variant="body2" color="primary">Parent Portion ({splitPct}%)</Typography>
                        <Typography variant="body2" fontWeight={600} color="primary">${parentPortion.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(230, 81, 0, 0.15)' : '#fff3e0', px: 1, borderRadius: 1, mt: 0.5 }}>
                        <Typography variant="body2" color="warning.main">Third-Party ({(100 - (parseFloat(splitPct) || 0))}%)</Typography>
                        <Typography variant="body2" fontWeight={600} color="warning.main">${thirdPartyPortion.toFixed(2)}</Typography>
                      </Box>
                    </>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, mt: 0.5 }}>
                    <Typography variant="body2" color="success.main">Paid</Typography>
                    <Typography variant="body2" color="success.main">${(invoice.amount_paid || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color={invoice.balance_due > 0 ? 'error.main' : 'success.main'}>Balance Due</Typography>
                    <Typography variant="subtitle1" fontWeight={700} color={invoice.balance_due > 0 ? 'error.main' : 'success.main'}>
                      ${(invoice.balance_due || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {invoice.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{invoice.notes}</Typography>
                </>
              )}
            </CardContent>
          </Card>

          {/* Split Billing Section */}
          {isEditable && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CallSplit color="primary" />
                  <Typography variant="h6">Split Billing</Typography>
                </Box>

                <FormControlLabel
                  control={<Switch checked={splitEnabled} onChange={(_, checked) => setSplitEnabled(checked)} />}
                  label="Enable Split Billing"
                  sx={{ mb: 2 }}
                />

                {splitEnabled && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Parent Pays (%)"
                      type="number"
                      value={splitPct}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        setSplitPct(String(v));
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 1 },
                      }}
                      sx={{ maxWidth: 200 }}
                    />

                    <TextField
                      label="Third-Party Payer Name"
                      value={splitPayer}
                      onChange={(e) => setSplitPayer(e.target.value)}
                      placeholder="e.g., ABC Insurance, State Subsidy Program"
                      fullWidth
                    />

                    <TextField
                      label="Third-Party Payer Address"
                      value={splitPayerAddress}
                      onChange={(e) => setSplitPayerAddress(e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                      multiline
                      rows={2}
                      fullWidth
                    />

                    {/* Live preview of split amounts */}
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Split Preview</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ p: 1.5, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(21, 101, 192, 0.15)' : '#e3f2fd', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Parent Portion ({splitPct}%)</Typography>
                            <Typography variant="h6" color="primary" fontWeight={700}>${parentPortion.toFixed(2)}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ p: 1.5, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(230, 81, 0, 0.15)' : '#fff3e0', borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Third-Party ({(100 - (parseFloat(splitPct) || 0))}%)</Typography>
                            <Typography variant="h6" color="warning.main" fontWeight={700}>${thirdPartyPortion.toFixed(2)}</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}

                {!splitEnabled && invoice.split_billing_pct != null && invoice.split_billing_pct < 100 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Split billing will be cleared when you save.
                  </Alert>
                )}

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={handleSaveSplit} disabled={splitSaving}>
                    {splitSaving ? 'Saving...' : 'Save Split Billing'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Display split info when not editable */}
          {!isEditable && invoice.split_billing_pct != null && invoice.split_billing_pct < 100 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CallSplit color="primary" />
                  <Typography variant="h6">Split Billing</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(21, 101, 192, 0.15)' : '#e3f2fd', borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="caption">Parent Portion ({invoice.split_billing_pct}%)</Typography>
                      <Typography variant="h6" color="primary" fontWeight={700}>
                        ${(invoiceTotal * (invoice.split_billing_pct / 100)).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(230, 81, 0, 0.15)' : '#fff3e0', borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="caption">
                        {invoice.split_billing_payer || 'Third-Party'} ({100 - invoice.split_billing_pct}%)
                      </Typography>
                      <Typography variant="h6" color="warning.main" fontWeight={700}>
                        ${(invoiceTotal - invoiceTotal * (invoice.split_billing_pct / 100)).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                {invoice.split_billing_payer_address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Payer Address: {invoice.split_billing_payer_address}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Payments */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Payments Applied</Typography>
              {(invoice.payments || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No payments recorded</Typography>
              ) : (
                (invoice.payments || []).map((p: any) => (
                  <Paper key={p.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{p.date}</Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">${(p.amount || 0).toFixed(2)}</Typography>
                    </Box>
                    <Chip label={p.method} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                    {p.reference_number && <Typography variant="caption" display="block">Ref: {p.reference_number}</Typography>}
                    {p.notes && <Typography variant="caption" display="block" color="text.secondary">{p.notes}</Typography>}
                  </Paper>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Line Item Dialog */}
      <Dialog open={lineItemOpen} onClose={() => setLineItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editLineItem ? 'Edit Line Item' : 'Add Line Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Description" value={lineItemForm.description}
              onChange={(e) => setLineItemForm({ ...lineItemForm, description: e.target.value })} required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={lineItemForm.item_type} label="Type"
                onChange={(e) => setLineItemForm({ ...lineItemForm, item_type: e.target.value })}>
                {LINE_ITEM_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity" type="number" value={lineItemForm.quantity} fullWidth
                onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: e.target.value })}
                inputProps={{ min: 1, step: 1 }}
              />
              <TextField
                label="Unit Price" type="number" value={lineItemForm.unit_price} fullWidth
                onChange={(e) => setLineItemForm({ ...lineItemForm, unit_price: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total: ${((parseFloat(lineItemForm.quantity) || 1) * (parseFloat(lineItemForm.unit_price) || 0)).toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLineItemOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveLineItem} disabled={!lineItemForm.description}>
            {editLineItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Line Item Confirmation */}
      <Dialog open={deleteLineOpen} onClose={() => setDeleteLineOpen(false)}>
        <DialogTitle>Delete Line Item</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{deleteLineTarget?.description}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteLineOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteLineItem}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Amount" type="number" value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl fullWidth>
              <InputLabel>Method</InputLabel>
              <Select value={paymentForm.method} label="Method"
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="debit_card">Debit Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="money_order">Money Order</MenuItem>
                <MenuItem value="Zelle">Zelle</MenuItem>
                <MenuItem value="Venmo">Venmo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Date" type="date" value={paymentForm.date}
              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Reference #" value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
            />
            <TextField
              label="Notes" value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              multiline rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRecordPayment} disabled={!paymentForm.amount}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />

      {/* Printable Invoice - only visible during print */}
      <PrintableInvoice invoice={invoice} settings={settings} />
    </Box>
  );
}
