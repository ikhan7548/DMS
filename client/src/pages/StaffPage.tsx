import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, LinearProgress,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export default function StaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', position: '', email: '', phone: '',
    hire_date: new Date().toISOString().split('T')[0], hourly_rate: '',
  });

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', statusFilter, search],
    queryFn: () => api.get('/staff', { params: { status: statusFilter, search: search || undefined } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/staff', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); setDialogOpen(false); resetForm(); },
  });

  const resetForm = () => setForm({ first_name: '', last_name: '', position: '', email: '', phone: '', hire_date: new Date().toISOString().split('T')[0], hourly_rate: '' });

  const handleCreate = () => {
    createMutation.mutate({
      firstName: form.first_name,
      lastName: form.last_name,
      position: form.position || 'assistant',
      email: form.email || null,
      phone: form.phone || null,
      hireDate: form.hire_date,
      hourlyRate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Staff</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setDialogOpen(true); }}>
          Add Staff
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <TextField
            placeholder="Search staff..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? <LinearProgress /> : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Hire Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((s: any) => (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/staff/${s.id}`)}>
                    <TableCell sx={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</TableCell>
                    <TableCell><Chip label={s.position || 'Staff'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>{s.hire_date}</TableCell>
                    <TableCell><Chip label={s.status} size="small" color={s.status === 'active' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
                {staff.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center">No staff found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} fullWidth required />
              <TextField label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} fullWidth required />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select value={form.position} label="Position" onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <MenuItem value="lead_teacher">Lead Teacher</MenuItem>
                <MenuItem value="assistant_teacher">Assistant Teacher</MenuItem>
                <MenuItem value="aide">Aide</MenuItem>
                <MenuItem value="director">Director</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="substitute">Substitute</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Hire Date" type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Hourly Rate" type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.first_name || !form.last_name}>Add Staff</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
