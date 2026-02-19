import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Chip,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export default function ParentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '',
    relationship: 'parent', employer: '', work_phone: '', notes: '',
  });

  const { data: parents = [], isLoading } = useQuery({
    queryKey: ['parents', search],
    queryFn: () => api.get('/parents', { params: { search: search || undefined } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editId ? api.put(`/parents/${editId}`, data) : api.post('/parents', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parents'] }); setDialogOpen(false); resetForm(); },
  });

  const resetForm = () => {
    setEditId(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', address: '', relationship: 'parent', employer: '', work_phone: '', notes: '' });
  };

  const handleEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      first_name: p.first_name || '', last_name: p.last_name || '', email: p.email || '',
      phone: p.phone || '', address: p.address || '', relationship: p.relationship || 'parent',
      employer: p.employer || '', work_phone: p.work_phone || '', notes: p.notes || '',
    });
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Parents / Guardians</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setDialogOpen(true); }}>
          Add Parent
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <TextField
            placeholder="Search parents..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
        </CardContent>
      </Card>

      {isLoading ? <LinearProgress /> : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Employer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parents.map((p: any) => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleEdit(p)}>
                    <TableCell sx={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell><Chip label={p.relationship || 'parent'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{p.employer || '-'}</TableCell>
                  </TableRow>
                ))}
                {parents.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No parents found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Parent' : 'Add Parent'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} fullWidth required />
              <TextField label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} fullWidth required />
            </Box>
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} multiline rows={2} />
            <TextField label="Relationship" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="parent, guardian, etc." />
            <TextField label="Employer" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} />
            <TextField label="Work Phone" value={form.work_phone} onChange={(e) => setForm({ ...form, work_phone: e.target.value })} />
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate(form)} disabled={!form.first_name || !form.last_name}>
            {editId ? 'Save' : 'Add Parent'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
