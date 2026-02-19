import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Paper, Alert,
} from '@mui/material';
import {
  Receipt, Payment, Settings, AccountBalance, TrendingUp,
  Add, People, MonetizationOn,
} from '@mui/icons-material';
import api from '../lib/api';

export default function BillingDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [aging, setAging] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/billing/invoices', { params: { status: undefined } }),
      api.get('/billing/payments'),
      api.get('/billing/aging'),
    ]).then(([invRes, payRes, agingRes]) => {
      setInvoices(invRes.data);
      setPayments(payRes.data);
      setAging(agingRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;

  const totalOutstanding = invoices
    .filter((i: any) => i.status !== 'void')
    .reduce((sum: number, i: any) => sum + (i.balance_due || 0), 0);
  const collectedThisMonth = payments
    .filter((p: any) => {
      const thisMonth = new Date().toISOString().slice(0, 7);
      return p.date?.startsWith(thisMonth);
    })
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue');
  const pendingInvoices = invoices.filter((i: any) => i.status === 'pending' || i.status === 'partial');

  const recentPayments = payments.slice(0, 5);
  const pastDueAccounts = invoices.filter((i: any) => i.status === 'overdue' && i.balance_due > 0).slice(0, 5);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Billing</Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/billing/invoices')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MonetizationOn sx={{ fontSize: 36, color: 'warning.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Total Outstanding</Typography>
              <Typography variant="h5" fontWeight={700} color="error.main">${totalOutstanding.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Payment sx={{ fontSize: 36, color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Collected This Month</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">${collectedThisMonth.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/billing/invoices?status=overdue')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 36, color: 'error.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Overdue Accounts</Typography>
              <Typography variant="h5" fontWeight={700}>{overdueInvoices.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/billing/invoices?status=pending')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Pending Invoices</Typography>
              <Typography variant="h5" fontWeight={700}>{pendingInvoices.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<Settings />} onClick={() => navigate('/billing/fees')}>Fee Configuration</Button>
            <Button variant="contained" startIcon={<Receipt />} onClick={() => navigate('/billing/invoices')}>Invoices</Button>
            <Button variant="contained" startIcon={<Payment />} onClick={() => navigate('/billing/payments')}>Record Payment</Button>
            <Button variant="contained" startIcon={<People />} onClick={() => navigate('/billing/families')}>Family Accounts</Button>
            <Button variant="contained" startIcon={<TrendingUp />} onClick={() => navigate('/billing/aging')}>Aging Report</Button>
            <Button variant="contained" startIcon={<Payment />} onClick={() => navigate('/billing/payment-methods')} color="secondary">Payment Methods</Button>
            <Button variant="outlined" startIcon={<Add />} onClick={() => navigate('/billing/invoices?action=create')}>Create Invoice</Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Recent Payments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Payments</Typography>
                <Button size="small" onClick={() => navigate('/billing/payments')}>View All</Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Family</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPayments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{p.family_first_name} {p.family_last_name}</TableCell>
                        <TableCell><Chip label={p.method} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>${(p.amount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {recentPayments.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No recent payments</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Past Due Accounts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Past Due Accounts</Typography>
                <Button size="small" onClick={() => navigate('/billing/aging')}>View Aging Report</Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Family</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pastDueAccounts.map((inv: any) => (
                      <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/billing/invoice/${inv.id}`)}>
                        <TableCell sx={{ fontWeight: 500 }}>{inv.invoice_number}</TableCell>
                        <TableCell>{inv.family_first_name} {inv.family_last_name}</TableCell>
                        <TableCell>{inv.due_date}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                          ${(inv.balance_due || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pastDueAccounts.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No past due accounts</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
