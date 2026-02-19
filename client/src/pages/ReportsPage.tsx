import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Tabs, Tab, Button,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Paper, Chip, FormControl, InputLabel, Select, MenuItem,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton,
  Tooltip, CardActionArea,
} from '@mui/material';
import {
  Download, EventAvailable, AttachMoney, Security, Search,
  Assessment, PictureAsPdf, Close, People, ArrowBack,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Types ──────────────────────────────────────────

interface AttendanceRecord {
  date: string;
  name: string;
  type: 'child' | 'staff';
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number | null;
}

interface EntityOption {
  id: number;
  first_name: string;
  last_name: string;
}

// ─── Helpers ────────────────────────────────────────

function formatHours(hours?: number | null): string {
  if (hours == null) return '-';
  return `${hours.toFixed(1)} hrs`;
}

function formatCurrency(amount?: number | null): string {
  if (amount == null) return '$0.00';
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Main Component ─────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab] = useState(0);

  // ─── Attendance state ───
  const [attStartDate, setAttStartDate] = useState(defaultStartDate);
  const [attEndDate, setAttEndDate] = useState(todayDate);
  const [attType, setAttType] = useState<'all' | 'children' | 'staff'>('all');
  const [attEntityId, setAttEntityId] = useState<number | ''>('');
  const [attRecords, setAttRecords] = useState<AttendanceRecord[]>([]);
  const [attGenerated, setAttGenerated] = useState(false);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // ─── Entity dropdown options ───
  const [childOptions, setChildOptions] = useState<EntityOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<EntityOption[]>([]);

  // ─── Financial state ───
  const [finStartDate, setFinStartDate] = useState(() => todayDate().substring(0, 7) + '-01');
  const [finEndDate, setFinEndDate] = useState(todayDate);
  const [finDrillDown, setFinDrillDown] = useState<{ type: string; title: string } | null>(null);
  const [finDrillData, setFinDrillData] = useState<any[]>([]);
  const [finDrillLoading, setFinDrillLoading] = useState(false);

  // ─── Payroll state ───
  const [payStartDate, setPayStartDate] = useState(() => todayDate().substring(0, 7) + '-01');
  const [payEndDate, setPayEndDate] = useState(todayDate);
  const [payStaffId, setPayStaffId] = useState<number | ''>('');
  const [payData, setPayData] = useState<any>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payGenerated, setPayGenerated] = useState(false);
  const [payDetailOpen, setPayDetailOpen] = useState(false);
  const [payDetailData, setPayDetailData] = useState<any>(null);
  const [payDetailLoading, setPayDetailLoading] = useState(false);

  const { data: financialData, isLoading: loadingFinancial } = useQuery({
    queryKey: ['report-financial', finStartDate, finEndDate],
    queryFn: () => api.get('/reports/financial', { params: { startDate: finStartDate, endDate: finEndDate } }).then(r => r.data),
    enabled: tab === 1,
  });

  const { data: complianceData, isLoading: loadingCompliance } = useQuery({
    queryKey: ['report-compliance'],
    queryFn: () => api.get('/reports/compliance').then(r => r.data),
    enabled: tab === 3,
  });

  // ─── Load dropdown data ───
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [childRes, staffRes] = await Promise.all([
          api.get('/children', { params: { status: 'active' } }),
          api.get('/staff', { params: { status: 'active' } }),
        ]);
        setChildOptions(Array.isArray(childRes.data) ? childRes.data : (childRes.data?.children || []));
        setStaffOptions(Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data?.staff || []));
      } catch { /* ignore */ }
    };
    loadOptions();
  }, []);

  // Reset entity selection when type changes
  useEffect(() => { setAttEntityId(''); }, [attType]);

  // ─── Generate Attendance Report ───
  const handleGenerateAttendance = async () => {
    setAttLoading(true);
    setAttError(null);
    setAttGenerated(false);
    try {
      const params: Record<string, string | number> = { startDate: attStartDate, endDate: attEndDate, type: attType, mode: 'detail' };
      if (attEntityId !== '') params.entityId = attEntityId;
      const res = await api.get('/reports/attendance', { params });
      setAttRecords(res.data.records || []);
      setAttGenerated(true);
    } catch (err: any) {
      setAttError(err?.response?.data?.error || 'Failed to generate report');
    } finally { setAttLoading(false); }
  };

  const entityDropdownItems = (): { id: number; label: string }[] => {
    if (attType === 'children') return childOptions.map(c => ({ id: c.id, label: `${c.first_name} ${c.last_name}` }));
    if (attType === 'staff') return staffOptions.map(s => ({ id: s.id, label: `${s.first_name} ${s.last_name}` }));
    return [];
  };

  // ─── Export handlers ───
  const handleExportAttendanceCsv = async () => {
    setExportingCsv(true);
    try {
      const params: Record<string, string | number> = { startDate: attStartDate, endDate: attEndDate, type: attType };
      if (attEntityId !== '') params.entityId = attEntityId;
      const response = await api.get('/reports/export/attendance', { params, responseType: 'blob' });
      downloadBlob(response.data, `attendance-${attStartDate}-${attEndDate}.csv`);
    } catch { /* ignore */ }
    finally { setExportingCsv(false); }
  };

  const handleExportFinancialCsv = async () => {
    try {
      const response = await api.get('/reports/export/financial', { params: { startDate: finStartDate, endDate: finEndDate }, responseType: 'blob' });
      downloadBlob(response.data, `financial-${finStartDate}-${finEndDate}.csv`);
    } catch { /* ignore */ }
  };

  const handleExportPayrollCsv = async () => {
    try {
      const params: Record<string, string | number> = { startDate: payStartDate, endDate: payEndDate };
      if (payStaffId !== '') params.staffId = payStaffId;
      const response = await api.get('/reports/export/payroll', { params, responseType: 'blob' });
      downloadBlob(response.data, `payroll-${payStartDate}-${payEndDate}.csv`);
    } catch { /* ignore */ }
  };

  const downloadBlob = (data: any, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => { window.print(); };

  // ─── Financial Drill-Down ───
  const handleFinDrillDown = async (drillType: string, title: string) => {
    setFinDrillDown({ type: drillType, title });
    setFinDrillLoading(true);
    setFinDrillData([]);
    try {
      if (drillType === 'billed' || drillType === 'collected' || drillType === 'outstanding'
        || drillType === 'paid' || drillType === 'pending' || drillType === 'overdue') {
        const res = await api.get('/reports/financial/invoices', {
          params: { startDate: finStartDate, endDate: finEndDate, status: drillType },
        });
        setFinDrillData(res.data);
      } else if (drillType.startsWith('method:')) {
        const method = drillType.replace('method:', '');
        const res = await api.get('/reports/financial/payments', {
          params: { startDate: finStartDate, endDate: finEndDate, method },
        });
        setFinDrillData(res.data);
      }
    } catch { /* ignore */ }
    finally { setFinDrillLoading(false); }
  };

  // ─── Generate Payroll Report ───
  const handleGeneratePayroll = async () => {
    setPayLoading(true);
    setPayGenerated(false);
    try {
      const params: Record<string, string | number> = { startDate: payStartDate, endDate: payEndDate };
      if (payStaffId !== '') params.staffId = payStaffId;
      const res = await api.get('/reports/payroll', { params });
      setPayData(res.data);
      setPayGenerated(true);
    } catch { /* ignore */ }
    finally { setPayLoading(false); }
  };

  // ─── Payroll Detail (daily breakdown) ───
  const handlePayrollDetail = async (staffId: number) => {
    setPayDetailOpen(true);
    setPayDetailLoading(true);
    setPayDetailData(null);
    try {
      const res = await api.get('/reports/payroll/detail', {
        params: { startDate: payStartDate, endDate: payEndDate, staffId },
      });
      setPayDetailData(res.data);
    } catch { /* ignore */ }
    finally { setPayDetailLoading(false); }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Reports</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Attendance" icon={<EventAvailable />} iconPosition="start" />
        <Tab label="Financial" icon={<AttachMoney />} iconPosition="start" />
        <Tab label="Staff Payroll" icon={<People />} iconPosition="start" />
        <Tab label="Compliance" icon={<Security />} iconPosition="start" />
      </Tabs>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ATTENDANCE REPORT TAB                                  */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                  <TextField fullWidth size="small" type="date" label="Start Date" value={attStartDate} onChange={e => setAttStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                  <TextField fullWidth size="small" type="date" label="End Date" value={attEndDate} onChange={e => setAttEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Report Type</InputLabel>
                    <Select value={attType} label="Report Type" onChange={e => setAttType(e.target.value as any)}>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="children">Children</MenuItem>
                      <MenuItem value="staff">Staff</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                  {attType !== 'all' ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>{attType === 'children' ? 'Select Child' : 'Select Staff'}</InputLabel>
                      <Select value={attEntityId} label={attType === 'children' ? 'Select Child' : 'Select Staff'} onChange={e => setAttEntityId(e.target.value as number | '')}>
                        <MenuItem value=""><em>All {attType === 'children' ? 'Children' : 'Staff'}</em></MenuItem>
                        {entityDropdownItems().map(item => (
                          <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : <Box />}
                </Grid>
                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                  <Button variant="contained" fullWidth startIcon={attLoading ? <CircularProgress size={18} color="inherit" /> : <Search />} onClick={handleGenerateAttendance} disabled={attLoading}>
                    Generate
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {attError && <Alert severity="error" sx={{ mb: 2 }}>{attError}</Alert>}

          {attGenerated && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Chip icon={<Assessment />} label={`${attRecords.length} record${attRecords.length !== 1 ? 's' : ''} found`} color="primary" variant="outlined" />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={exportingCsv ? <CircularProgress size={16} /> : <Download />} onClick={handleExportAttendanceCsv} disabled={exportingCsv || attRecords.length === 0}>Export CSV</Button>
                  <Button variant="outlined" size="small" startIcon={<PictureAsPdf />} onClick={handlePrintPdf} disabled={attRecords.length === 0}>Print / PDF</Button>
                </Box>
              </Box>
              <Card className="printable-report">
                <Box sx={{ p: 2, display: 'none', '@media print': { display: 'block' } }}>
                  <Typography variant="h5" fontWeight={700}>Attendance Report</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {attStartDate} to {attEndDate} &bull; Type: {attType === 'all' ? 'All' : attType === 'children' ? 'Children' : 'Staff'}
                    {attEntityId !== '' && ` \u2022 ${entityDropdownItems().find(e => e.id === attEntityId)?.label || ''}`}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' } }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Check In / Clock In</TableCell>
                        <TableCell>Check Out / Clock Out</TableCell>
                        <TableCell align="right">Total Hours</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attRecords.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" sx={{ py: 4 }}>No records found for the selected criteria.</Typography></TableCell></TableRow>
                      ) : attRecords.map((record, idx) => (
                        <TableRow key={`${record.type}-${idx}-${record.date}`} hover>
                          <TableCell>{record.date}</TableCell>
                          <TableCell><Typography fontWeight={500}>{record.name}</Typography></TableCell>
                          <TableCell><Chip label={record.type === 'child' ? 'Child' : 'Staff'} size="small" color={record.type === 'child' ? 'primary' : 'secondary'} /></TableCell>
                          <TableCell>{record.checkIn || '-'}</TableCell>
                          <TableCell>{record.checkOut || <Chip label="Still Present" size="small" color="success" />}</TableCell>
                          <TableCell align="right">{formatHours(record.totalHours)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {attRecords.length > 0 && (
                  <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600}>Total Records: {attRecords.length}</Typography>
                    {attRecords.some(r => r.totalHours != null) && (
                      <Typography variant="body2" fontWeight={600}>Total Hours: {attRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0).toFixed(1)}</Typography>
                    )}
                  </Box>
                )}
              </Card>
            </Box>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* FINANCIAL REPORT TAB                                   */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <TextField label="Start Date" type="date" size="small" value={finStartDate} onChange={e => setFinStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="End Date" type="date" size="small" value={finEndDate} onChange={e => setFinEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </CardContent>
          </Card>

          {loadingFinancial ? <LinearProgress /> : financialData && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<Download />} variant="outlined" onClick={handleExportFinancialCsv}>Export CSV</Button>
              </Box>

              {/* Clickable Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { key: 'billed', label: 'Total Billed', value: financialData.revenue?.total_billed, color: '#1565C0', desc: 'Click to see all invoices' },
                  { key: 'collected', label: 'Total Collected', value: financialData.revenue?.total_collected, color: '#2E7D32', desc: 'Click to see invoices with payments' },
                  { key: 'outstanding', label: 'Outstanding', value: financialData.revenue?.total_outstanding, color: '#E65100', desc: 'Click to see unpaid balances' },
                ].map((stat) => (
                  <Grid size={{ xs: 12, md: 4 }} key={stat.key}>
                    <Card sx={{ borderTop: `3px solid ${stat.color}`, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
                      <CardActionArea onClick={() => handleFinDrillDown(stat.key, stat.label)} sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                        <Typography variant="h5" fontWeight={700}>{formatCurrency(stat.value)}</Typography>
                        <Typography variant="caption" color="text.secondary">{stat.desc}</Typography>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={3}>
                {/* Payments by Method - clickable rows */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Payments by Method</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Method</TableCell>
                              <TableCell align="right">Count</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(financialData.paymentsByMethod || []).map((p: any) => (
                              <TableRow key={p.method} hover sx={{ cursor: 'pointer' }} onClick={() => handleFinDrillDown(`method:${p.method}`, `Payments: ${p.method}`)}>
                                <TableCell><Chip label={p.method} size="small" variant="outlined" /></TableCell>
                                <TableCell align="right">{p.count}</TableCell>
                                <TableCell align="right">{formatCurrency(p.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Invoice Status - clickable boxes */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Invoice Status</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {[
                          { key: 'paid', label: 'Paid', count: financialData.revenue?.paid_count || 0, color: 'success.main' },
                          { key: 'pending', label: 'Pending', count: financialData.revenue?.pending_count || 0, color: 'warning.main' },
                          { key: 'overdue', label: 'Overdue', count: financialData.revenue?.overdue_count || 0, color: 'error.main' },
                        ].map(s => (
                          <Paper key={s.key} variant="outlined"
                            sx={{ p: 2, flex: 1, textAlign: 'center', minWidth: 100, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}
                            onClick={() => handleFinDrillDown(s.key, `${s.label} Invoices`)}
                          >
                            <Typography variant="h4" color={s.color}>{s.count}</Typography>
                            <Typography variant="caption">{s.label}</Typography>
                          </Paper>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Financial Drill-Down Dialog */}
          <Dialog open={!!finDrillDown} onClose={() => setFinDrillDown(null)} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Back"><IconButton size="small" onClick={() => setFinDrillDown(null)}><ArrowBack /></IconButton></Tooltip>
                {finDrillDown?.title}
              </Box>
              <IconButton onClick={() => setFinDrillDown(null)}><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
              {finDrillLoading ? <LinearProgress /> : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' } }}>
                        {finDrillDown?.type.startsWith('method:') ? (
                          <>
                            <TableCell>Date</TableCell>
                            <TableCell>Family</TableCell>
                            <TableCell>Invoice #</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Reference</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>Invoice #</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Family</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Paid</TableCell>
                            <TableCell align="right">Balance</TableCell>
                            <TableCell>Status</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {finDrillData.length === 0 ? (
                        <TableRow><TableCell colSpan={8} align="center"><Typography color="text.secondary" sx={{ py: 3 }}>No records found.</Typography></TableCell></TableRow>
                      ) : finDrillData.map((row: any, idx: number) => (
                        finDrillDown?.type.startsWith('method:') ? (
                          <TableRow key={idx} hover>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.family_name || '-'}</TableCell>
                            <TableCell>{row.invoice_number || '-'}</TableCell>
                            <TableCell><Chip label={row.method} size="small" variant="outlined" /></TableCell>
                            <TableCell>{row.reference_number || '-'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(row.amount)}</TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{row.invoice_number}</TableCell>
                            <TableCell>{row.issued_date}</TableCell>
                            <TableCell>{row.due_date || '-'}</TableCell>
                            <TableCell>{row.family_name || '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(row.total)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.amount_paid)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: row.balance_due > 0 ? 'error.main' : 'success.main' }}>
                              {formatCurrency(row.balance_due)}
                            </TableCell>
                            <TableCell>
                              <Chip label={row.status} size="small"
                                color={row.status === 'paid' ? 'success' : row.status === 'overdue' ? 'error' : row.status === 'pending' ? 'warning' : 'default'} />
                            </TableCell>
                          </TableRow>
                        )
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {finDrillData.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={600}>Total Records: {finDrillData.length}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Total: {formatCurrency(finDrillData.reduce((sum: number, r: any) => sum + (r.amount || r.total || 0), 0))}
                  </Typography>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STAFF PAYROLL REPORT TAB                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField fullWidth size="small" type="date" label="Period Start" value={payStartDate} onChange={e => setPayStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField fullWidth size="small" type="date" label="Period End" value={payEndDate} onChange={e => setPayEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Staff Member</InputLabel>
                    <Select value={payStaffId} label="Staff Member" onChange={e => setPayStaffId(e.target.value as number | '')}>
                      <MenuItem value=""><em>All Staff</em></MenuItem>
                      {staffOptions.map(s => (
                        <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button variant="contained" fullWidth startIcon={payLoading ? <CircularProgress size={18} color="inherit" /> : <Search />} onClick={handleGeneratePayroll} disabled={payLoading}>
                    Generate
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {payGenerated && payData && (
            <Box>
              {/* Payroll Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Total Hours', value: payData.totals?.total_hours?.toFixed(1) || '0', suffix: ' hrs', color: '#1565C0' },
                  { label: 'Regular Hours', value: payData.totals?.regular_hours?.toFixed(1) || '0', suffix: ' hrs', color: '#2E7D32' },
                  { label: 'Overtime Hours', value: payData.totals?.overtime_hours?.toFixed(1) || '0', suffix: ' hrs', color: '#E65100' },
                  { label: 'Total Gross Pay', value: formatCurrency(payData.totals?.gross_pay), suffix: '', color: '#6A1B9A' },
                ].map(s => (
                  <Grid size={{ xs: 6, md: 3 }} key={s.label}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
                      <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                      <Typography variant="h5" fontWeight={700}>{s.value}{s.suffix}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Export Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExportPayrollCsv}>Export CSV</Button>
                <Button variant="outlined" size="small" startIcon={<PictureAsPdf />} onClick={handlePrintPdf}>Print / PDF</Button>
              </Box>

              {/* Staff Payroll Table */}
              <Card className="printable-report">
                <Box sx={{ p: 2, display: 'none', '@media print': { display: 'block' } }}>
                  <Typography variant="h5" fontWeight={700}>Staff Payroll Report</Typography>
                  <Typography variant="body2" color="text.secondary">{payStartDate} to {payEndDate}</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' } }}>
                        <TableCell>Name</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell align="right">Rate/hr</TableCell>
                        <TableCell align="right">OT Rate</TableCell>
                        <TableCell align="right">Days</TableCell>
                        <TableCell align="right">Reg Hrs</TableCell>
                        <TableCell align="right">OT Hrs</TableCell>
                        <TableCell align="right">Total Hrs</TableCell>
                        <TableCell align="right">Reg Pay</TableCell>
                        <TableCell align="right">OT Pay</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Gross Pay</TableCell>
                        <TableCell align="center">Detail</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(payData.staff || []).length === 0 ? (
                        <TableRow><TableCell colSpan={12} align="center"><Typography color="text.secondary" sx={{ py: 4 }}>No staff records found.</Typography></TableCell></TableRow>
                      ) : (payData.staff || []).map((s: any) => (
                        <TableRow key={s.staff_id} hover>
                          <TableCell><Typography fontWeight={500}>{s.first_name} {s.last_name}</Typography></TableCell>
                          <TableCell><Chip label={s.position || 'N/A'} size="small" variant="outlined" /></TableCell>
                          <TableCell align="right">{formatCurrency(s.hourly_rate)}</TableCell>
                          <TableCell align="right">{formatCurrency(s.overtime_rate)}</TableCell>
                          <TableCell align="right">{s.days_worked}</TableCell>
                          <TableCell align="right">{s.regular_hours?.toFixed(1)}</TableCell>
                          <TableCell align="right" sx={{ color: s.overtime_hours > 0 ? 'warning.main' : undefined }}>{s.overtime_hours?.toFixed(1)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{s.total_hours?.toFixed(1)}</TableCell>
                          <TableCell align="right">{formatCurrency(s.regular_pay)}</TableCell>
                          <TableCell align="right" sx={{ color: s.overtime_pay > 0 ? 'warning.main' : undefined }}>{formatCurrency(s.overtime_pay)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(s.gross_pay)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="View daily breakdown">
                              <IconButton size="small" color="primary" onClick={() => handlePayrollDetail(s.staff_id)}>
                                <Assessment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      {(payData.staff || []).length > 0 && (
                        <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderTop: '2px solid', borderColor: 'divider' } }}>
                          <TableCell colSpan={4}>TOTALS</TableCell>
                          <TableCell align="right">{payData.staff?.reduce((s: number, r: any) => s + (r.days_worked || 0), 0)}</TableCell>
                          <TableCell align="right">{payData.totals?.regular_hours?.toFixed(1)}</TableCell>
                          <TableCell align="right">{payData.totals?.overtime_hours?.toFixed(1)}</TableCell>
                          <TableCell align="right">{payData.totals?.total_hours?.toFixed(1)}</TableCell>
                          <TableCell align="right">{formatCurrency(payData.totals?.regular_pay)}</TableCell>
                          <TableCell align="right">{formatCurrency(payData.totals?.overtime_pay)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '1rem' }}>{formatCurrency(payData.totals?.gross_pay)}</TableCell>
                          <TableCell />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              {/* No rate warning */}
              {(payData.staff || []).some((s: any) => !s.hourly_rate) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Some staff members don't have an hourly rate configured. Set their rate in the Staff management page for accurate pay calculations.
                </Alert>
              )}
            </Box>
          )}

          {/* Payroll Detail Dialog */}
          <Dialog open={payDetailOpen} onClose={() => setPayDetailOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                {payDetailData?.staff ? `${payDetailData.staff.first_name} ${payDetailData.staff.last_name} — Daily Breakdown` : 'Daily Breakdown'}
              </Box>
              <IconButton onClick={() => setPayDetailOpen(false)}><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
              {payDetailLoading ? <LinearProgress /> : payDetailData && (
                <Box>
                  {/* Staff info header */}
                  <Box sx={{ display: 'flex', gap: 3, mb: 2, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderRadius: 1, flexWrap: 'wrap' }}>
                    <Box><Typography variant="caption" color="text.secondary">Position</Typography><Typography fontWeight={600}>{payDetailData.staff.position || 'N/A'}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">Hourly Rate</Typography><Typography fontWeight={600}>{formatCurrency(payDetailData.hourlyRate)}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">Overtime Rate</Typography><Typography fontWeight={600}>{formatCurrency(payDetailData.overtimeRate)}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">Pay Frequency</Typography><Typography fontWeight={600}>{payDetailData.staff.pay_frequency || 'N/A'}</Typography></Box>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' } }}>
                          <TableCell>Date</TableCell>
                          <TableCell>Clock In</TableCell>
                          <TableCell>Clock Out</TableCell>
                          <TableCell align="right">Break (min)</TableCell>
                          <TableCell align="right">Reg Hrs</TableCell>
                          <TableCell align="right">OT Hrs</TableCell>
                          <TableCell align="right">Total Hrs</TableCell>
                          <TableCell align="right">Day Pay</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(payDetailData.records || []).length === 0 ? (
                          <TableRow><TableCell colSpan={9} align="center"><Typography color="text.secondary" sx={{ py: 3 }}>No attendance records found.</Typography></TableCell></TableRow>
                        ) : (payDetailData.records || []).map((r: any, idx: number) => (
                          <TableRow key={idx} hover>
                            <TableCell>{r.date}</TableCell>
                            <TableCell>{r.clock_in || '-'}</TableCell>
                            <TableCell>{r.clock_out || <Chip label="Active" size="small" color="success" />}</TableCell>
                            <TableCell align="right">{r.break_minutes || 0}</TableCell>
                            <TableCell align="right">{r.regular_hours?.toFixed(1)}</TableCell>
                            <TableCell align="right" sx={{ color: r.overtime_hours > 0 ? 'warning.main' : undefined }}>{r.overtime_hours?.toFixed(1)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{r.total_hours != null ? r.total_hours.toFixed(1) : '-'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(r.day_pay)}</TableCell>
                            <TableCell>{r.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {/* Detail totals */}
                        {(payDetailData.records || []).length > 0 && (
                          <TableRow sx={{ '& td': { fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderTop: '2px solid', borderColor: 'divider' } }}>
                            <TableCell colSpan={3}>TOTALS ({payDetailData.records.length} days)</TableCell>
                            <TableCell align="right">{payDetailData.records.reduce((s: number, r: any) => s + (r.break_minutes || 0), 0)}</TableCell>
                            <TableCell align="right">{payDetailData.records.reduce((s: number, r: any) => s + (r.regular_hours || 0), 0).toFixed(1)}</TableCell>
                            <TableCell align="right">{payDetailData.records.reduce((s: number, r: any) => s + (r.overtime_hours || 0), 0).toFixed(1)}</TableCell>
                            <TableCell align="right">{payDetailData.records.reduce((s: number, r: any) => s + (r.total_hours || 0), 0).toFixed(1)}</TableCell>
                            <TableCell align="right">{formatCurrency(payDetailData.records.reduce((s: number, r: any) => s + (r.day_pay || 0), 0))}</TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* COMPLIANCE REPORT TAB                                  */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 3 && (
        loadingCompliance ? <LinearProgress /> : complianceData && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Staff Certifications</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Staff</TableCell>
                          <TableCell>Position</TableCell>
                          <TableCell>Certification</TableCell>
                          <TableCell>Expiry Date</TableCell>
                          <TableCell>Training Hours</TableCell>
                          <TableCell>Sponsoring Org</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(complianceData.certifications || []).map((c: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{c.first_name} {c.last_name}</TableCell>
                            <TableCell>{c.position}</TableCell>
                            <TableCell>{c.cert_name || '-'}</TableCell>
                            <TableCell>{c.expiry_date || 'N/A'}</TableCell>
                            <TableCell>{c.training_hours || '-'}</TableCell>
                            <TableCell>{c.sponsoring_org || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Immunization Compliance</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Child</TableCell>
                          <TableCell align="right">Total Records</TableCell>
                          <TableCell align="right">Completed</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(complianceData.immunizations || []).map((im: any) => (
                          <TableRow key={im.child_id}>
                            <TableCell>{im.first_name} {im.last_name}</TableCell>
                            <TableCell align="right">{im.immunization_count || 0}</TableCell>
                            <TableCell align="right">{im.completed_count || 0}</TableCell>
                            <TableCell>
                              <Chip label={im.immunization_count > 0 ? 'Has Records' : 'No Records'} size="small" color={im.immunization_count > 0 ? 'success' : 'warning'} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-report, .printable-report * { visibility: visible; }
          .printable-report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </Box>
  );
}
