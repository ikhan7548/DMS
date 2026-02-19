import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Tabs, Tab, Button,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, LinearProgress, Paper, Alert,
} from '@mui/material';
import { Add, Receipt, Payment, TrendingUp } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export default function BillingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    family_id: '', due_date: '', period_start: '', period_end: '',
    lineItems: [{ description: 'Weekly Tuition', category: 'tuition', amount: 0, quantity: 1 }],
    notes: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '', amount: '', method: 'cash', date: new Date().toISOString().split('T')[0],
    reference_number: '', notes: '',
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => api.get('/billing/invoices', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } }).then(r => r.data),
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/billing/payments').then(r => r.data),
    enabled: tab === 1,
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['fees'],
    queryFn: () => api.get('/billing/fees').then(r => r.data),
    enabled: tab === 2,
  });

  const { data: aging } = useQuery({
    queryKey: ['aging'],
    queryFn: () => api.get('/billing/aging').then(r => r.data),
    enabled: tab === 3,
  });

  const { data: children = [] } = useQuery({
    queryKey: ['children-list'],
    queryFn: () => api.get('/children').then(r => r.data),
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['parents-list'],
    queryFn: () => api.get('/parents').then(r => r.data),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => api.post('/billing/invoices', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setInvoiceDialog(false); },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => api.post('/billing/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentDialog(false);
    },
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'partial': return 'info';
      case 'void': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Billing</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Payment />} onClick={() => setPaymentDialog(true)}>Record Payment</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setInvoiceDialog(true)}>Create Invoice</Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Invoices" icon={<Receipt />} iconPosition="start" />
        <Tab label="Payments" icon={<Payment />} iconPosition="start" />
        <Tab label="Fee Schedule" />
        <Tab label="Aging Report" icon={<TrendingUp />} iconPosition="start" />
      </Tabs>

      {/* Invoices Tab */}
      {tab === 0 && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="void">Void</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {loadingInvoices ? <LinearProgress /> : (
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Family</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/billing/invoice/${inv.id}`)}>
                        <TableCell sx={{ fontWeight: 500 }}>{inv.invoice_number}</TableCell>
                        <TableCell>{inv.issued_date}</TableCell>
                        <TableCell>{inv.family_first_name} {inv.family_last_name}</TableCell>
                        <TableCell align="right">${(inv.total || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">${(inv.amount_paid || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: inv.balance_due > 0 ? 'error.main' : 'success.main' }}>
                          ${(inv.balance_due || 0).toFixed(2)}
                        </TableCell>
                        <TableCell><Chip label={inv.status} size="small" color={statusColor(inv.status) as any} /></TableCell>
                      </TableRow>
                    ))}
                    {invoices.length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center">No invoices found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </>
      )}

      {/* Payments Tab */}
      {tab === 1 && (
        loadingPayments ? <LinearProgress /> : (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Family</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{p.invoice_number}</TableCell>
                      <TableCell>{p.family_first_name} {p.family_last_name}</TableCell>
                      <TableCell><Chip label={p.method} size="small" variant="outlined" /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>${(p.amount || 0).toFixed(2)}</TableCell>
                      <TableCell>{p.reference_number || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center">No payments found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )
      )}

      {/* Fee Schedule Tab */}
      {tab === 2 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Age Group</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Registration</TableCell>
                  <TableCell align="right">Supply Fee</TableCell>
                  <TableCell>Effective</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{f.name}</TableCell>
                    <TableCell><Chip label={f.age_group} size="small" variant="outlined" /></TableCell>
                    <TableCell>{f.schedule_type}</TableCell>
                    <TableCell align="right">${(f.amount || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${(f.registration_fee || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${(f.supply_fee || 0).toFixed(2)}</TableCell>
                    <TableCell>{f.effective_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Aging Report Tab */}
      {tab === 3 && aging && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Current', value: aging.totals.current, color: '#4CAF50' },
              { label: '1-30 Days', value: aging.totals.days30, color: '#FF9800' },
              { label: '31-60 Days', value: aging.totals.days60, color: '#F44336' },
              { label: '61-90 Days', value: aging.totals.days90, color: '#9C27B0' },
              { label: '90+ Days', value: aging.totals.over90, color: '#D32F2F' },
            ].map((bucket) => (
              <Grid size={{ xs: 6, md: 2.4 }} key={bucket.label}>
                <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${bucket.color}` }}>
                  <Typography variant="body2" color="text.secondary">{bucket.label}</Typography>
                  <Typography variant="h5" fontWeight={700}>${(bucket.value || 0).toFixed(2)}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Alert severity="info">
            Total Outstanding: <strong>${(aging.totalOutstanding || 0).toFixed(2)}</strong>
          </Alert>
        </Box>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Family</InputLabel>
              <Select value={invoiceForm.family_id} label="Family" onChange={(e) => setInvoiceForm({ ...invoiceForm, family_id: e.target.value })}>
                {parents.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Due Date" type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Period Start" type="date" value={invoiceForm.period_start} onChange={(e) => setInvoiceForm({ ...invoiceForm, period_start: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Period End" type="date" value={invoiceForm.period_end} onChange={(e) => setInvoiceForm({ ...invoiceForm, period_end: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            </Box>
            <Typography variant="subtitle2">Line Items</Typography>
            {invoiceForm.lineItems.map((li, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField label="Description" value={li.description} size="small" sx={{ flex: 2 }}
                  onChange={(e) => { const items = [...invoiceForm.lineItems]; items[idx].description = e.target.value; setInvoiceForm({ ...invoiceForm, lineItems: items }); }} />
                <TextField label="Amount" type="number" value={li.amount} size="small" sx={{ flex: 1 }}
                  onChange={(e) => { const items = [...invoiceForm.lineItems]; items[idx].amount = parseFloat(e.target.value) || 0; setInvoiceForm({ ...invoiceForm, lineItems: items }); }} />
              </Box>
            ))}
            <Button size="small" onClick={() => setInvoiceForm({ ...invoiceForm, lineItems: [...invoiceForm.lineItems, { description: '', category: 'other', amount: 0, quantity: 1 }] })}>
              + Add Line Item
            </Button>
            <TextField label="Notes" value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createInvoiceMutation.mutate(invoiceForm)}>Create Invoice</Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Invoice</InputLabel>
              <Select value={paymentForm.invoice_id} label="Invoice" onChange={(e) => setPaymentForm({ ...paymentForm, invoice_id: e.target.value })}>
                {invoices.filter((i: any) => i.balance_due > 0).map((inv: any) => (
                  <MenuItem key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {inv.family_first_name} {inv.family_last_name} (${(inv.balance_due || 0).toFixed(2)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Amount" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Method</InputLabel>
              <Select value={paymentForm.method} label="Method" onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="debit_card">Debit Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="money_order">Money Order</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Date" type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Reference #" value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} />
            <TextField label="Notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => recordPaymentMutation.mutate(paymentForm)}>Record Payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
