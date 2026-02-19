import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Paper, Alert, IconButton, Chip,
} from '@mui/material';
import { ArrowBack, Print, Refresh } from '@mui/icons-material';
import api from '../lib/api';

export default function AgingReportPage() {
  const navigate = useNavigate();
  const [aging, setAging] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAging = () => {
    setLoading(true);
    api.get('/billing/aging')
      .then(res => setAging(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAging(); }, []);

  if (loading) return <LinearProgress />;
  if (!aging) return <Alert severity="error">Failed to load aging report</Alert>;

  const buckets = [
    { label: 'Current', key: 'current', color: '#4CAF50', items: aging.aging.current },
    { label: '1-30 Days', key: 'days30', color: '#FF9800', items: aging.aging.days30 },
    { label: '31-60 Days', key: 'days60', color: '#F44336', items: aging.aging.days60 },
    { label: '61-90 Days', key: 'days90', color: '#9C27B0', items: aging.aging.days90 },
    { label: '90+ Days', key: 'over90', color: '#D32F2F', items: aging.aging.over90 },
  ];

  // Build family-level aging breakdown
  const familyMap: Record<string, any> = {};
  for (const bucket of buckets) {
    for (const inv of bucket.items) {
      const familyName = `${inv.family_first_name} ${inv.family_last_name}`;
      if (!familyMap[familyName]) {
        familyMap[familyName] = { name: familyName, current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 };
      }
      familyMap[familyName][bucket.key] += inv.balance_due;
      familyMap[familyName].total += inv.balance_due;
    }
  }
  const familyRows = Object.values(familyMap).sort((a: any, b: any) => b.total - a.total);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/billing')}><ArrowBack /></IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>Aging Report</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAging}>Refresh</Button>
        <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>Print</Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {buckets.map((bucket) => (
          <Grid size={{ xs: 6, md: 2 }} key={bucket.key}>
            <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${bucket.color}` }}>
              <Typography variant="body2" color="text.secondary">{bucket.label}</Typography>
              <Typography variant="h5" fontWeight={700}>
                ${(aging.totals[bucket.key] || 0).toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {bucket.items.length} invoice{bucket.items.length !== 1 ? 's' : ''}
              </Typography>
            </Paper>
          </Grid>
        ))}
        <Grid size={{ xs: 6, md: 2 }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '3px solid', borderColor: 'text.primary', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100' }}>
            <Typography variant="body2" color="text.secondary">Total</Typography>
            <Typography variant="h5" fontWeight={700} color="error.main">
              ${(aging.totalOutstanding || 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Detail Table by Family */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Breakdown by Family</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Family</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>Current</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.main' }}>1-30</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>31-60</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'secondary.main' }}>61-90</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.dark' }}>90+</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {familyRows.map((fam: any) => (
                  <TableRow key={fam.name} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{fam.name}</TableCell>
                    <TableCell align="right">{fam.current ? `$${fam.current.toFixed(2)}` : '-'}</TableCell>
                    <TableCell align="right">{fam.days30 ? `$${fam.days30.toFixed(2)}` : '-'}</TableCell>
                    <TableCell align="right">{fam.days60 ? `$${fam.days60.toFixed(2)}` : '-'}</TableCell>
                    <TableCell align="right">{fam.days90 ? `$${fam.days90.toFixed(2)}` : '-'}</TableCell>
                    <TableCell align="right">{fam.over90 ? `$${fam.over90.toFixed(2)}` : '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${fam.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {familyRows.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No outstanding balances</TableCell></TableRow>
                )}
                {familyRows.length > 0 && (
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${(aging.totals.current || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${(aging.totals.days30 || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${(aging.totals.days60 || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${(aging.totals.days90 || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${(aging.totals.over90 || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>${(aging.totalOutstanding || 0).toFixed(2)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
