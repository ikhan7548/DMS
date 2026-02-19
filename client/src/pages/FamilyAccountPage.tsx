import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, LinearProgress, Paper, IconButton,
} from '@mui/material';
import { ArrowBack, Search, Payment, Person } from '@mui/icons-material';
import api from '../lib/api';

interface FamilyAccount {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_cell: string;
  children_names: string;
  total_balance: number;
  last_payment_date: string | null;
}

export default function FamilyAccountPage() {
  const { familyId } = useParams();
  const navigate = useNavigate();

  if (familyId) {
    return <FamilyDetail familyId={Number(familyId)} navigate={navigate} />;
  }
  return <FamilyList navigate={navigate} />;
}

function FamilyList({ navigate }: { navigate: (path: string) => void }) {
  const [families, setFamilies] = useState<FamilyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/billing/families')
      .then(res => setFamilies(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? families.filter(f => `${f.first_name} ${f.last_name}`.toLowerCase().includes(search.toLowerCase()))
    : families;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/billing')}><ArrowBack /></IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>Family Accounts</Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <TextField
            size="small" placeholder="Search families..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: 300 }}
          />
        </CardContent>
      </Card>

      {loading ? <LinearProgress /> : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Family</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Children</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Last Payment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/billing/families/${f.id}`)}>
                    <TableCell sx={{ fontWeight: 600 }}>{f.first_name} {f.last_name}</TableCell>
                    <TableCell>
                      {f.email && <Typography variant="caption" display="block">{f.email}</Typography>}
                      {f.phone_cell && <Typography variant="caption" display="block">{f.phone_cell}</Typography>}
                    </TableCell>
                    <TableCell>{f.children_names || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: (f.total_balance || 0) > 0 ? 'error.main' : 'success.main' }}>
                      ${(f.total_balance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{f.last_payment_date || 'Never'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" startIcon={<Person />}
                        onClick={(e) => { e.stopPropagation(); navigate(`/billing/families/${f.id}`); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No families found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}

function FamilyDetail({ familyId, navigate }: { familyId: number; navigate: (path: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/billing/family/${familyId}`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [familyId]);

  if (loading) return <LinearProgress />;
  if (!data) return <Typography>Family not found</Typography>;

  const { parent, children, invoices, recentPayments, summary } = data;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/billing/families')}><ArrowBack /></IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>{parent.first_name} {parent.last_name} - Account</Typography>
        <Button variant="contained" startIcon={<Payment />} onClick={() => navigate(`/billing/payments?familyId=${familyId}`)}>
          Record Payment
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '3px solid', borderColor: summary.totalBalance > 0 ? 'error.main' : 'success.main' }}>
            <Typography variant="body2" color="text.secondary">Outstanding Balance</Typography>
            <Typography variant="h4" fontWeight={700} color={summary.totalBalance > 0 ? 'error.main' : 'success.main'}>
              ${(summary.totalBalance || 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '3px solid #4CAF50' }}>
            <Typography variant="body2" color="text.secondary">Total Paid</Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">${(summary.totalPaid || 0).toFixed(2)}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '3px solid #2196F3' }}>
            <Typography variant="body2" color="text.secondary">Total Invoices</Typography>
            <Typography variant="h4" fontWeight={700}>{summary.invoiceCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Children */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Enrolled Children</Typography>
              {(children || []).map((c: any) => (
                <Paper key={c.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                  <Typography fontWeight={600}>{c.first_name} {c.last_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.expected_schedule?.replace('_', ' ')} | {c.status}
                  </Typography>
                </Paper>
              ))}
              {(!children || children.length === 0) && <Typography color="text.secondary">No enrolled children</Typography>}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payments */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Payments</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(recentPayments || []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.date}</TableCell>
                        <TableCell><Chip label={p.method} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>${(p.amount || 0).toFixed(2)}</TableCell>
                        <TableCell>{p.reference_number || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {(!recentPayments || recentPayments.length === 0) && (
                      <TableRow><TableCell colSpan={4} align="center">No payments</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Invoice History</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(invoices || []).map((inv: any) => (
                      <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/billing/invoice/${inv.id}`)}>
                        <TableCell sx={{ fontWeight: 500 }}>{inv.invoice_number}</TableCell>
                        <TableCell>{inv.issued_date}</TableCell>
                        <TableCell>{inv.due_date}</TableCell>
                        <TableCell align="right">${(inv.total || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">${(inv.amount_paid || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: inv.balance_due > 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
                          ${(inv.balance_due || 0).toFixed(2)}
                        </TableCell>
                        <TableCell><Chip label={inv.status} size="small" color={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'error' : 'warning'} /></TableCell>
                      </TableRow>
                    ))}
                    {(!invoices || invoices.length === 0) && (
                      <TableRow><TableCell colSpan={7} align="center">No invoices</TableCell></TableRow>
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
