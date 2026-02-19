import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Tabs, Tab, Button,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, LinearProgress, Alert, Paper, Snackbar, Tooltip,
} from '@mui/material';
import { ArrowBack, Edit, Add, Delete } from '@mui/icons-material';
import api from '../lib/api';

const emptyCert = { cert_type: '', cert_name: '', issue_date: '', expiry_date: '', training_hours: '', sponsoring_org: '' };
const emptyCheck = { check_type: '', check_date: '', expiry_date: '', result: 'clear', notes: '' };

export default function StaffDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState('');

  // Edit staff
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Certifications
  const [certDialog, setCertDialog] = useState(false);
  const [certForm, setCertForm] = useState({ ...emptyCert });
  const [editingCertId, setEditingCertId] = useState<number | null>(null);

  // Background checks
  const [checkDialog, setCheckDialog] = useState(false);
  const [checkForm, setCheckForm] = useState({ ...emptyCheck });
  const [editingCheckId, setEditingCheckId] = useState<number | null>(null);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: number; name: string } | null>(null);

  const fetchStaff = () => {
    setLoading(true);
    api.get(`/staff/${id}`)
      .then((res) => { setStaff(res.data); setEditForm(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, [id]);

  const handleSave = async () => {
    try {
      await api.put(`/staff/${id}`, editForm);
      setEditOpen(false);
      setSnack('Staff member updated');
      fetchStaff();
    } catch {}
  };

  // ─── Certifications ─────────────────────────────────
  const openAddCert = () => {
    setEditingCertId(null);
    setCertForm({ ...emptyCert });
    setCertDialog(true);
  };

  const openEditCert = (c: any) => {
    setEditingCertId(c.id);
    setCertForm({
      cert_type: c.cert_type || '', cert_name: c.cert_name || '',
      issue_date: c.issue_date || '', expiry_date: c.expiry_date || '',
      training_hours: c.training_hours || '', sponsoring_org: c.sponsoring_org || '',
    });
    setCertDialog(true);
  };

  const handleSaveCert = async () => {
    try {
      if (editingCertId) {
        await api.put(`/staff/${id}/certifications/${editingCertId}`, certForm);
        setSnack('Certification updated');
      } else {
        await api.post(`/staff/${id}/certifications`, certForm);
        setSnack('Certification added');
      }
      setCertDialog(false);
      fetchStaff();
    } catch {}
  };

  const handleDeleteCert = async (certId: number) => {
    try {
      await api.delete(`/staff/${id}/certifications/${certId}`);
      setSnack('Certification deleted');
      setDeleteDialog(null);
      fetchStaff();
    } catch {}
  };

  // ─── Background Checks ─────────────────────────────
  const openAddCheck = () => {
    setEditingCheckId(null);
    setCheckForm({ ...emptyCheck });
    setCheckDialog(true);
  };

  const openEditCheck = (bc: any) => {
    setEditingCheckId(bc.id);
    setCheckForm({
      check_type: bc.check_type || '', check_date: bc.check_date || '',
      expiry_date: bc.expiry_date || '', result: bc.result || 'clear', notes: bc.notes || '',
    });
    setCheckDialog(true);
  };

  const handleSaveCheck = async () => {
    try {
      if (editingCheckId) {
        await api.put(`/staff/${id}/background-checks/${editingCheckId}`, checkForm);
        setSnack('Background check updated');
      } else {
        await api.post(`/staff/${id}/background-checks`, checkForm);
        setSnack('Background check added');
      }
      setCheckDialog(false);
      fetchStaff();
    } catch {}
  };

  const handleDeleteCheck = async (checkId: number) => {
    try {
      await api.delete(`/staff/${id}/background-checks/${checkId}`);
      setSnack('Background check deleted');
      setDeleteDialog(null);
      fetchStaff();
    } catch {}
  };

  // ─── Delete confirmation handler ────────────────────
  const confirmDelete = () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === 'cert') handleDeleteCert(deleteDialog.id);
    else if (deleteDialog.type === 'check') handleDeleteCheck(deleteDialog.id);
  };

  if (loading) return <LinearProgress />;
  if (!staff) return <Alert severity="error">Staff member not found</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/staff')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">{staff.first_name} {staff.last_name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip label={staff.status} size="small" color={staff.status === 'active' ? 'success' : 'default'} />
            <Chip label={staff.position || 'Staff'} size="small" variant="outlined" />
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)}>Edit</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Details" />
        <Tab label="Certifications" />
        <Tab label="Background Checks" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
                <InfoRow label="Position" value={staff.position} />
                <InfoRow label="Email" value={staff.email} />
                <InfoRow label="Phone" value={staff.phone} />
                <InfoRow label="Hire Date" value={staff.hire_date} />
                <InfoRow label="Hourly Rate" value={staff.hourly_rate ? `$${staff.hourly_rate}` : '-'} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
                <Typography variant="body2">{staff.notes || 'No notes'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Certifications Tab */}
      {tab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Certifications</Typography>
              <Button startIcon={<Add />} variant="contained" size="small" onClick={openAddCert}>Add</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Training Hours</TableCell>
                    <TableCell>Sponsoring Org</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(staff.certifications || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{c.cert_type}</TableCell>
                      <TableCell>{c.cert_name}</TableCell>
                      <TableCell>{c.issue_date}</TableCell>
                      <TableCell>
                        {c.expiry_date ? (
                          <Chip label={c.expiry_date} size="small"
                            color={new Date(c.expiry_date) < new Date() ? 'error' : 'success'} variant="outlined" />
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{c.training_hours || '-'}</TableCell>
                      <TableCell>{c.sponsoring_org || '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditCert(c)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ type: 'cert', id: c.id, name: `${c.cert_type} - ${c.cert_name}` })}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(staff.certifications || []).length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center">No certifications</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Background Checks Tab */}
      {tab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Background Checks</Typography>
              <Button startIcon={<Add />} variant="contained" size="small" onClick={openAddCheck}>Add</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Check Date</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(staff.backgroundChecks || []).map((bc: any) => (
                    <TableRow key={bc.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{bc.check_type}</TableCell>
                      <TableCell>{bc.check_date}</TableCell>
                      <TableCell>
                        {bc.expiry_date ? (
                          <Chip label={bc.expiry_date} size="small"
                            color={new Date(bc.expiry_date) < new Date() ? 'error' : 'success'} variant="outlined" />
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell><Chip label={bc.result} size="small" color={bc.result === 'clear' ? 'success' : 'error'} /></TableCell>
                      <TableCell>{bc.notes || '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditCheck(bc)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ type: 'check', id: bc.id, name: `${bc.check_type} check` })}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(staff.backgroundChecks || []).length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center">No background checks</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Edit Staff Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="First Name" value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
            <TextField label="Last Name" value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
            <TextField label="Email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <TextField label="Phone" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <TextField label="Hourly Rate" type="number" value={editForm.hourly_rate || ''} onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })} />
            <TextField label="Notes" value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Certification Dialog (Add/Edit) */}
      <Dialog open={certDialog} onClose={() => setCertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCertId ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Type" value={certForm.cert_type} onChange={(e) => setCertForm({ ...certForm, cert_type: e.target.value })} placeholder="e.g., CPR, First Aid" />
            <TextField label="Name" value={certForm.cert_name} onChange={(e) => setCertForm({ ...certForm, cert_name: e.target.value })} />
            <TextField label="Issue Date" type="date" value={certForm.issue_date} onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Expiry Date" type="date" value={certForm.expiry_date} onChange={(e) => setCertForm({ ...certForm, expiry_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Training Hours" type="number" value={certForm.training_hours} onChange={(e) => setCertForm({ ...certForm, training_hours: e.target.value })} />
            <TextField label="Sponsoring Organization" value={certForm.sponsoring_org} onChange={(e) => setCertForm({ ...certForm, sponsoring_org: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCert}>{editingCertId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Background Check Dialog (Add/Edit) */}
      <Dialog open={checkDialog} onClose={() => setCheckDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCheckId ? 'Edit Background Check' : 'Add Background Check'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Type" value={checkForm.check_type} onChange={(e) => setCheckForm({ ...checkForm, check_type: e.target.value })} placeholder="e.g., FBI, State, CPS" />
            <TextField label="Check Date" type="date" value={checkForm.check_date} onChange={(e) => setCheckForm({ ...checkForm, check_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Expiry Date" type="date" value={checkForm.expiry_date} onChange={(e) => setCheckForm({ ...checkForm, expiry_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Result" select value={checkForm.result} onChange={(e) => setCheckForm({ ...checkForm, result: e.target.value })}>
              <MenuItem value="clear">Clear</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
            <TextField label="Notes" value={checkForm.notes} onChange={(e) => setCheckForm({ ...checkForm, notes: e.target.value })} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCheck}>{editingCheckId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 140 }}>{label}</Typography>
      <Typography variant="body2">{value || '-'}</Typography>
    </Box>
  );
}
