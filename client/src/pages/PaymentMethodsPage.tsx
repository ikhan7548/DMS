import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, Chip, LinearProgress, Snackbar, Tooltip,
} from '@mui/material';
import { ArrowBack, Add, Edit } from '@mui/icons-material';
import api from '../lib/api';

interface PaymentMethod {
  id: number;
  name: string;
  is_active: number;
}

export default function PaymentMethodsPage() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '' });

  const fetchMethods = () => {
    setLoading(true);
    api.get('/billing/payment-methods/all')
      .then(res => setMethods(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/billing/payment-methods/${id}`, { is_active: isActive ? 1 : 0 });
      setSnack(`Payment method ${isActive ? 'enabled' : 'disabled'}`);
      fetchMethods();
    } catch {}
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        // Update name - we'd need a PUT endpoint for this; for now just toggle is simpler
        await api.put(`/billing/payment-methods/${editId}`, { name: form.name });
        setSnack('Payment method updated');
      } else {
        await api.post('/billing/payment-methods', { name: form.name });
        setSnack('Payment method added');
      }
      setDialogOpen(false);
      fetchMethods();
    } catch {}
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/billing')}><ArrowBack /></IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>Payment Methods</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Method</Button>
      </Box>

      {loading ? <LinearProgress /> : (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage accepted payment methods. Disabled methods will not appear in payment dropdowns.
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Method Name</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {methods.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{m.name}</TableCell>
                      <TableCell align="center">
                        <Chip label={m.is_active ? 'Active' : 'Disabled'} size="small"
                          color={m.is_active ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="center">
                        <Switch checked={!!m.is_active} onChange={(_, checked) => handleToggle(m.id, checked)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {methods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        No payment methods configured. Add one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField label="Method Name" fullWidth value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="e.g., Cash, Check, Credit Card, Zelle"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>Add</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
