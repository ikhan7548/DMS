import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, LinearProgress, Alert,
  IconButton, Snackbar,
} from '@mui/material';
import {
  ArrowBack, Search, Edit, Delete, Add, Today, History,
} from '@mui/icons-material';
import api from '../lib/api';

interface HistoryRecord {
  id: number;
  date: string;
  name: string;
  type: 'child' | 'staff';
  checkIn: string;
  checkOut: string | null;
  totalHours?: number;
  notes?: string;
}

export default function AttendanceHistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState('all');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: 0, type: '', checkIn: '', checkOut: '', reason: '' });

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    type: 'child', entityId: '', date: new Date().toISOString().split('T')[0],
    checkIn: '08:00', checkOut: '', notes: '',
  });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HistoryRecord | null>(null);

  // Entity lists for Add dialog
  const [children, setChildren] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/children', { params: { status: 'active' } }),
      api.get('/staff', { params: { status: 'active' } }),
    ]).then(([childRes, staffRes]) => {
      setChildren(childRes.data);
      setStaffList(staffRes.data);
    });
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/history', {
        params: { startDate, endDate, type: typeFilter !== 'all' ? typeFilter : undefined },
      });
      setRecords(res.data);
      setError('');
    } catch { setError('Failed to load history'); }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [startDate, endDate, typeFilter]);

  const handleEdit = (record: HistoryRecord) => {
    setEditForm({
      id: record.id,
      type: record.type,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      reason: '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/attendance/${editForm.id}/correct`, editForm);
      setEditOpen(false);
      setSnackbar({ open: true, message: 'Time correction saved' });
      fetchHistory();
    } catch { setSnackbar({ open: true, message: 'Failed to save correction' }); }
  };

  const handleAddSave = async () => {
    try {
      await api.post('/attendance/history', addForm);
      setAddOpen(false);
      setSnackbar({ open: true, message: 'Attendance record added' });
      setAddForm({ type: 'child', entityId: '', date: new Date().toISOString().split('T')[0], checkIn: '08:00', checkOut: '', notes: '' });
      fetchHistory();
    } catch { setSnackbar({ open: true, message: 'Failed to add record' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/attendance/${deleteTarget.id}`, { params: { type: deleteTarget.type } });
      setDeleteOpen(false);
      setSnackbar({ open: true, message: 'Record deleted' });
      fetchHistory();
    } catch { setSnackbar({ open: true, message: 'Failed to delete record' }); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>Attendance</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}>
          Add Record
        </Button>
      </Box>

      <Tabs
        value={1}
        onChange={(_e, val) => { if (val === 0) navigate('/attendance'); }}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Today />} iconPosition="start" label="Today" />
        <Tab icon={<History />} iconPosition="start" label="History" />
      </Tabs>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Start Date" type="date" size="small" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date" type="date" size="small" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="children">Children</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<Search />} onClick={fetchHistory}>Search</Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? <LinearProgress /> : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={`${r.type}-${r.id}`}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{r.name}</TableCell>
                    <TableCell>
                      <Chip label={r.type} size="small" color={r.type === 'child' ? 'primary' : 'secondary'} />
                    </TableCell>
                    <TableCell>{r.checkIn || '-'}</TableCell>
                    <TableCell>{r.checkOut || '-'}</TableCell>
                    <TableCell>{r.totalHours ? `${r.totalHours}h` : '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(r)} title="Edit"><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => { setDeleteTarget(r); setDeleteOpen(true); }} title="Delete">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No attendance records found for this period</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Edit / Time Correction Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Time Correction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Check In Time" type="time" value={editForm.checkIn}
              onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Check Out Time" type="time" value={editForm.checkOut}
              onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Reason for Correction (required)" value={editForm.reason}
              onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
              multiline rows={2} required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editForm.reason}>Save Correction</Button>
        </DialogActions>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Attendance Record</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={addForm.type} label="Type" onChange={(e) => setAddForm({ ...addForm, type: e.target.value, entityId: '' })}>
                <MenuItem value="child">Child</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{addForm.type === 'child' ? 'Child' : 'Staff Member'}</InputLabel>
              <Select value={addForm.entityId} label={addForm.type === 'child' ? 'Child' : 'Staff Member'}
                onChange={(e) => setAddForm({ ...addForm, entityId: e.target.value })}>
                {(addForm.type === 'child' ? children : staffList).map((e: any) => (
                  <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date" type="date" value={addForm.date}
              onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Check In" type="time" value={addForm.checkIn} fullWidth
                onChange={(e) => setAddForm({ ...addForm, checkIn: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Check Out" type="time" value={addForm.checkOut} fullWidth
                onChange={(e) => setAddForm({ ...addForm, checkOut: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label="Notes" value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              multiline rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSave} disabled={!addForm.entityId || !addForm.date}>
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Attendance Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this attendance record for <strong>{deleteTarget?.name}</strong> on {deleteTarget?.date}?
          </Typography>
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
