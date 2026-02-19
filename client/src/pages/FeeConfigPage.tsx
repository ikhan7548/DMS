import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, LinearProgress,
  IconButton, Snackbar, Switch, FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack } from '@mui/icons-material';
import api from '../lib/api';

interface FeeConfig {
  id: number;
  name: string;
  age_group: string;
  schedule_type: string;
  weekly_rate: number;
  daily_rate: number;
  hourly_rate: number;
  registration_fee: number;
  late_pickup_fee_per_minute: number;
  late_payment_fee: number;
  sibling_discount_pct: number;
  effective_date: string;
  is_active: number;
}

const AGE_GROUPS = ['infant', 'toddler', 'preschool', 'school_age'];
const SCHEDULE_TYPES = ['full_time', 'part_time', 'after_school', 'before_school', 'drop_in'];

const defaultForm = {
  name: '', age_group: 'infant', schedule_type: 'full_time',
  weekly_rate: '', daily_rate: '', hourly_rate: '',
  registration_fee: '', late_pickup_fee_per_minute: '1',
  late_payment_fee: '25', sibling_discount_pct: '0',
  effective_date: new Date().toISOString().split('T')[0], is_active: true,
};

export default function FeeConfigPage() {
  const navigate = useNavigate();
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeeConfig | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/fees/all');
      setFees(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchFees(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (fee: FeeConfig) => {
    setEditId(fee.id);
    setForm({
      name: fee.name || '', age_group: fee.age_group, schedule_type: fee.schedule_type,
      weekly_rate: String(fee.weekly_rate || ''), daily_rate: String(fee.daily_rate || ''),
      hourly_rate: String(fee.hourly_rate || ''), registration_fee: String(fee.registration_fee || ''),
      late_pickup_fee_per_minute: String(fee.late_pickup_fee_per_minute || ''),
      late_payment_fee: String(fee.late_payment_fee || ''),
      sibling_discount_pct: String(fee.sibling_discount_pct || ''),
      effective_date: fee.effective_date || '', is_active: !!fee.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        weekly_rate: parseFloat(form.weekly_rate) || 0,
        daily_rate: parseFloat(form.daily_rate) || 0,
        hourly_rate: parseFloat(form.hourly_rate) || 0,
        registration_fee: parseFloat(form.registration_fee) || 0,
        late_pickup_fee_per_minute: parseFloat(form.late_pickup_fee_per_minute) || 1,
        late_payment_fee: parseFloat(form.late_payment_fee) || 25,
        sibling_discount_pct: parseFloat(form.sibling_discount_pct) || 0,
        is_active: form.is_active ? 1 : 0,
      };
      if (editId) {
        await api.put(`/billing/fees/${editId}`, payload);
        setSnackbar({ open: true, message: 'Fee updated' });
      } else {
        await api.post('/billing/fees', payload);
        setSnackbar({ open: true, message: 'Fee created' });
      }
      setDialogOpen(false);
      fetchFees();
    } catch { setSnackbar({ open: true, message: 'Failed to save' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/billing/fees/${deleteTarget.id}`);
      setDeleteOpen(false);
      setSnackbar({ open: true, message: 'Fee deleted' });
      fetchFees();
    } catch { setSnackbar({ open: true, message: 'Failed to delete' }); }
  };

  const u = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/billing')}><ArrowBack /></IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>Fee Configuration</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Fee Tier</Button>
      </Box>

      {loading ? <LinearProgress /> : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Age Group</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell align="right">Weekly</TableCell>
                  <TableCell align="right">Daily</TableCell>
                  <TableCell align="right">Hourly</TableCell>
                  <TableCell align="right">Registration</TableCell>
                  <TableCell>Effective</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{f.name}</TableCell>
                    <TableCell><Chip label={f.age_group} size="small" variant="outlined" /></TableCell>
                    <TableCell>{f.schedule_type?.replace('_', ' ')}</TableCell>
                    <TableCell align="right">${(f.weekly_rate || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${(f.daily_rate || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${(f.hourly_rate || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">${(f.registration_fee || 0).toFixed(2)}</TableCell>
                    <TableCell>{f.effective_date}</TableCell>
                    <TableCell>
                      <Chip label={f.is_active ? 'Active' : 'Inactive'} size="small" color={f.is_active ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEdit(f)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => { setDeleteTarget(f); setDeleteOpen(true); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {fees.length === 0 && (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}>No fee configurations found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Fee Tier' : 'Add Fee Tier'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => u('name', e.target.value)} required />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Age Group</InputLabel>
                <Select value={form.age_group} label="Age Group" onChange={(e) => u('age_group', e.target.value)}>
                  {AGE_GROUPS.map(g => <MenuItem key={g} value={g}>{g.replace('_', ' ')}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Schedule Type</InputLabel>
                <Select value={form.schedule_type} label="Schedule Type" onChange={(e) => u('schedule_type', e.target.value)}>
                  {SCHEDULE_TYPES.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Weekly Rate" type="number" value={form.weekly_rate} onChange={(e) => u('weekly_rate', e.target.value)} fullWidth inputProps={{ step: 0.01 }} />
              <TextField label="Daily Rate" type="number" value={form.daily_rate} onChange={(e) => u('daily_rate', e.target.value)} fullWidth inputProps={{ step: 0.01 }} />
              <TextField label="Hourly Rate" type="number" value={form.hourly_rate} onChange={(e) => u('hourly_rate', e.target.value)} fullWidth inputProps={{ step: 0.01 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Registration Fee" type="number" value={form.registration_fee} onChange={(e) => u('registration_fee', e.target.value)} fullWidth inputProps={{ step: 0.01 }} />
              <TextField label="Sibling Discount %" type="number" value={form.sibling_discount_pct} onChange={(e) => u('sibling_discount_pct', e.target.value)} fullWidth inputProps={{ step: 1, min: 0, max: 100 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Late Pickup $/min" type="number" value={form.late_pickup_fee_per_minute} onChange={(e) => u('late_pickup_fee_per_minute', e.target.value)} fullWidth inputProps={{ step: 0.01 }} />
              <TextField label="Late Payment Fee" type="number" value={form.late_payment_fee} onChange={(e) => u('late_payment_fee', e.target.value)} fullWidth inputProps={{ step: 0.01 }} />
            </Box>
            <TextField label="Effective Date" type="date" value={form.effective_date} onChange={(e) => u('effective_date', e.target.value)} InputLabelProps={{ shrink: true }} />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => u('is_active', e.target.checked)} />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name}>{editId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Fee Tier</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete the fee tier "{deleteTarget?.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  );
}
