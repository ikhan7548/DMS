import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Tabs, Tab, Button,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, LinearProgress, Alert, Paper, Snackbar, Tooltip,
} from '@mui/material';
import { ArrowBack, Edit, Add, Delete, Phone, Email, Warning, Link, LinkOff } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import api from '../lib/api';

interface ChildDetail {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  gender: string;
  schedule_type: string;
  status: string;
  allergies: string;
  medical_notes: string;
  notes: string;
  enrollment_date: string;
  parents: any[];
  emergencyContacts: any[];
  authorizedPickups: any[];
  immunizations: any[];
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 24) return `${totalMonths} months`;
  return `${Math.floor(totalMonths / 12)} years`;
}

const emptyContact = { name: '', relationship: '', phone: '', email: '', is_emergency: true };
const emptyPickup = { name: '', relationship: '', phone: '' };
const emptyImmun = { immunization_type: '', date_administered: '', provider: '', notes: '' };

export default function ChildDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState('');

  // Edit child
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Emergency contacts
  const [contactDialog, setContactDialog] = useState(false);
  const [contactForm, setContactForm] = useState({ ...emptyContact });
  const [editingContactId, setEditingContactId] = useState<number | null>(null);

  // Authorized pickups
  const [pickupDialog, setPickupDialog] = useState(false);
  const [pickupForm, setPickupForm] = useState({ ...emptyPickup });
  const [editingPickupId, setEditingPickupId] = useState<number | null>(null);

  // Immunizations
  const [immunDialog, setImmunDialog] = useState(false);
  const [immunForm, setImmunForm] = useState({ ...emptyImmun });
  const [editingImmunId, setEditingImmunId] = useState<number | null>(null);

  // Delete confirmation (sub-items)
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: number; name: string } | null>(null);

  // Delete child confirmation
  const [deleteChildOpen, setDeleteChildOpen] = useState(false);
  const [deleteChildConfirmText, setDeleteChildConfirmText] = useState('');

  // Parent linking
  const [parentDialog, setParentDialog] = useState(false);
  const [allParents, setAllParents] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [parentRelationship, setParentRelationship] = useState('');
  const [createNewParent, setCreateNewParent] = useState(false);
  const [newParentForm, setNewParentForm] = useState({ first_name: '', last_name: '', email: '', phone: '', relationship: '' });

  const fetchChild = () => {
    setLoading(true);
    api.get(`/children/${id}`)
      .then((res) => { setChild(res.data); setEditForm(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchChild(); }, [id]);

  const handleSave = async () => {
    try {
      await api.put(`/children/${id}`, editForm);
      setEditOpen(false);
      setSnack('Child updated');
      fetchChild();
    } catch {}
  };

  // ─── Emergency Contacts ─────────────────────────────
  const openAddContact = () => {
    setEditingContactId(null);
    setContactForm({ ...emptyContact });
    setContactDialog(true);
  };

  const openEditContact = (c: any) => {
    setEditingContactId(c.id);
    setContactForm({ name: c.name, relationship: c.relationship || '', phone: c.phone || '', email: c.email || '', is_emergency: c.is_emergency ?? true });
    setContactDialog(true);
  };

  const handleSaveContact = async () => {
    try {
      if (editingContactId) {
        await api.put(`/children/${id}/emergency-contacts/${editingContactId}`, contactForm);
        setSnack('Contact updated');
      } else {
        await api.post(`/children/${id}/emergency-contacts`, contactForm);
        setSnack('Contact added');
      }
      setContactDialog(false);
      fetchChild();
    } catch {}
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await api.delete(`/children/${id}/emergency-contacts/${contactId}`);
      setSnack('Contact deleted');
      setDeleteDialog(null);
      fetchChild();
    } catch {}
  };

  // ─── Authorized Pickups ─────────────────────────────
  const openAddPickup = () => {
    setEditingPickupId(null);
    setPickupForm({ ...emptyPickup });
    setPickupDialog(true);
  };

  const openEditPickup = (p: any) => {
    setEditingPickupId(p.id);
    setPickupForm({ name: p.name, relationship: p.relationship || '', phone: p.phone || '' });
    setPickupDialog(true);
  };

  const handleSavePickup = async () => {
    try {
      if (editingPickupId) {
        await api.put(`/children/${id}/authorized-pickups/${editingPickupId}`, pickupForm);
        setSnack('Pickup person updated');
      } else {
        await api.post(`/children/${id}/authorized-pickups`, pickupForm);
        setSnack('Pickup person added');
      }
      setPickupDialog(false);
      fetchChild();
    } catch {}
  };

  const handleDeletePickup = async (pickupId: number) => {
    try {
      await api.delete(`/children/${id}/authorized-pickups/${pickupId}`);
      setSnack('Pickup person deleted');
      setDeleteDialog(null);
      fetchChild();
    } catch {}
  };

  // ─── Immunizations ─────────────────────────────────
  const openAddImmun = () => {
    setEditingImmunId(null);
    setImmunForm({ ...emptyImmun });
    setImmunDialog(true);
  };

  const openEditImmun = (im: any) => {
    setEditingImmunId(im.id);
    setImmunForm({ immunization_type: im.immunization_type, date_administered: im.date_administered || '', provider: im.provider || '', notes: im.notes || '' });
    setImmunDialog(true);
  };

  const handleSaveImmun = async () => {
    try {
      if (editingImmunId) {
        await api.put(`/children/${id}/immunizations/${editingImmunId}`, immunForm);
        setSnack('Immunization updated');
      } else {
        await api.post(`/children/${id}/immunizations`, immunForm);
        setSnack('Immunization added');
      }
      setImmunDialog(false);
      fetchChild();
    } catch {}
  };

  const handleDeleteImmun = async (immunId: number) => {
    try {
      await api.delete(`/children/${id}/immunizations/${immunId}`);
      setSnack('Immunization deleted');
      setDeleteDialog(null);
      fetchChild();
    } catch {}
  };

  // ─── Delete confirmation handler (sub-items) ───────
  const confirmDelete = () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === 'contact') handleDeleteContact(deleteDialog.id);
    else if (deleteDialog.type === 'pickup') handleDeletePickup(deleteDialog.id);
    else if (deleteDialog.type === 'immunization') handleDeleteImmun(deleteDialog.id);
    else if (deleteDialog.type === 'parent') handleConfirmUnlinkParent(deleteDialog.id);
  };

  // ─── Delete entire child record ────────────────────
  const handleDeleteChild = async () => {
    try {
      await api.delete(`/children/${id}`);
      navigate('/children');
    } catch {
      setSnack('Failed to delete child');
    }
  };

  // ─── Parent Linking ───────────────────────────────
  const openLinkParent = async () => {
    try {
      const res = await api.get('/parents');
      // Filter out already-linked parents
      const linkedIds = new Set((child?.parents || []).map((p: any) => p.id));
      setAllParents(res.data.filter((p: any) => !linkedIds.has(p.id)));
    } catch {}
    setSelectedParent(null);
    setParentRelationship('');
    setCreateNewParent(false);
    setNewParentForm({ first_name: '', last_name: '', email: '', phone: '', relationship: '' });
    setParentDialog(true);
  };

  const handleLinkParent = async () => {
    try {
      if (createNewParent) {
        // Create new parent then link
        const res = await api.post('/parents', {
          firstName: newParentForm.first_name,
          lastName: newParentForm.last_name,
          email: newParentForm.email || null,
          phoneCell: newParentForm.phone || null,
          relationship: newParentForm.relationship || 'parent',
        });
        await api.post(`/parents/${res.data.id}/link/${id}`, { relationship: newParentForm.relationship || 'parent' });
        setSnack('Parent created and linked');
      } else if (selectedParent) {
        await api.post(`/parents/${selectedParent.id}/link/${id}`, { relationship: parentRelationship || null });
        setSnack('Parent linked');
      }
      setParentDialog(false);
      fetchChild();
    } catch {
      setSnack('Failed to link parent');
    }
  };

  const handleUnlinkParent = async (parentId: number, parentName: string) => {
    setDeleteDialog({ type: 'parent', id: parentId, name: parentName });
  };

  const handleConfirmUnlinkParent = async (parentId: number) => {
    try {
      await api.delete(`/parents/${parentId}/unlink/${id}`);
      setSnack('Parent unlinked');
      setDeleteDialog(null);
      fetchChild();
    } catch {
      setSnack('Failed to unlink parent');
    }
  };

  if (loading) return <LinearProgress />;
  if (!child) return <Alert severity="error">Child not found</Alert>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/children')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">
            {child.first_name} {child.last_name}
            {child.nickname && <Typography component="span" variant="h6" color="text.secondary"> ({child.nickname})</Typography>}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip label={child.status} size="small" color={child.status === 'active' ? 'success' : 'default'} />
            <Chip label={child.schedule_type?.replace('_', ' ')} size="small" variant="outlined" />
            <Chip label={calculateAge(child.date_of_birth)} size="small" variant="outlined" />
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)}>Edit</Button>
        <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteChildOpen(true)}>Delete</Button>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Details" />
        <Tab label="Parents" />
        <Tab label="Emergency Contacts" />
        <Tab label="Authorized Pickups" />
        <Tab label="Immunizations" />
      </Tabs>

      {/* Details Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
                <InfoRow label="Date of Birth" value={child.date_of_birth} />
                <InfoRow label="Gender" value={child.gender} />
                <InfoRow label="Schedule" value={child.schedule_type?.replace('_', ' ')} />
                <InfoRow label="Enrolled" value={child.enrollment_date} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Medical Information</Typography>
                <InfoRow label="Allergies" value={child.allergies || 'None'} />
                <InfoRow label="Medical Notes" value={child.medical_notes || 'None'} />
                <InfoRow label="Notes" value={child.notes || 'None'} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Parents Tab */}
      {tab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Parents / Guardians</Typography>
              <Button startIcon={<Add />} variant="contained" size="small" onClick={openLinkParent}>
                Add Parent
              </Button>
            </Box>
            {(child.parents || []).length === 0 ? (
              <Typography color="text.secondary">No parents linked. Click "Add Parent" to link an existing parent or create a new one.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Relationship</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {child.parents.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</TableCell>
                        <TableCell>{p.relationship || '-'}</TableCell>
                        <TableCell>{p.phone_cell || p.phone || '-'}</TableCell>
                        <TableCell>{p.email || '-'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Unlink parent">
                            <IconButton size="small" color="error" onClick={() => handleUnlinkParent(p.id, `${p.first_name} ${p.last_name}`)}>
                              <LinkOff fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts Tab */}
      {tab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Emergency Contacts</Typography>
              <Button startIcon={<Add />} variant="contained" size="small" onClick={openAddContact}>
                Add Contact
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Relationship</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(child.emergencyContacts || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                      <TableCell>{c.relationship}</TableCell>
                      <TableCell><Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{c.phone}</TableCell>
                      <TableCell>{c.email && <><Email sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{c.email}</>}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditContact(c)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ type: 'contact', id: c.id, name: c.name })}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(child.emergencyContacts || []).length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center">No emergency contacts</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Authorized Pickups Tab */}
      {tab === 3 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Authorized Pickups</Typography>
              <Button startIcon={<Add />} variant="contained" size="small" onClick={openAddPickup}>Add Person</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Relationship</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(child.authorizedPickups || []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                      <TableCell>{p.relationship}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditPickup(p)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ type: 'pickup', id: p.id, name: p.name })}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(child.authorizedPickups || []).length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No authorized pickups</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Immunizations Tab */}
      {tab === 4 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Immunizations</Typography>
              <Button startIcon={<Add />} variant="contained" size="small" onClick={openAddImmun}>Add Record</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vaccine / Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(child.immunizations || []).map((im: any) => (
                    <TableRow key={im.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{im.immunization_type}</TableCell>
                      <TableCell>{im.date_administered}</TableCell>
                      <TableCell>{im.provider || '-'}</TableCell>
                      <TableCell>{im.notes || '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditImmun(im)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ type: 'immunization', id: im.id, name: im.immunization_type })}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(child.immunizations || []).length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center">No immunization records</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Edit Child Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Child</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="First Name" value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
            <TextField label="Last Name" value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
            <TextField label="Nickname" value={editForm.nickname || ''} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} />
            <TextField label="Allergies" value={editForm.allergies || ''} onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })} multiline rows={2} />
            <TextField label="Medical Notes" value={editForm.medical_notes || ''} onChange={(e) => setEditForm({ ...editForm, medical_notes: e.target.value })} multiline rows={2} />
            <TextField label="Notes" value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Emergency Contact Dialog (Add/Edit) */}
      <Dialog open={contactDialog} onClose={() => setContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
            <TextField label="Relationship" value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} />
            <TextField label="Phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} required />
            <TextField label="Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveContact}>{editingContactId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Authorized Pickup Dialog (Add/Edit) */}
      <Dialog open={pickupDialog} onClose={() => setPickupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPickupId ? 'Edit Authorized Pickup' : 'Add Authorized Pickup'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={pickupForm.name} onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })} required />
            <TextField label="Relationship" value={pickupForm.relationship} onChange={(e) => setPickupForm({ ...pickupForm, relationship: e.target.value })} />
            <TextField label="Phone" value={pickupForm.phone} onChange={(e) => setPickupForm({ ...pickupForm, phone: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePickup}>{editingPickupId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Immunization Dialog (Add/Edit) */}
      <Dialog open={immunDialog} onClose={() => setImmunDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingImmunId ? 'Edit Immunization Record' : 'Add Immunization Record'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Vaccine / Immunization Type" value={immunForm.immunization_type} onChange={(e) => setImmunForm({ ...immunForm, immunization_type: e.target.value })} required />
            <TextField label="Date Administered" type="date" value={immunForm.date_administered} onChange={(e) => setImmunForm({ ...immunForm, date_administered: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Provider" value={immunForm.provider} onChange={(e) => setImmunForm({ ...immunForm, provider: e.target.value })} />
            <TextField label="Notes" value={immunForm.notes} onChange={(e) => setImmunForm({ ...immunForm, notes: e.target.value })} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImmunDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveImmun}>{editingImmunId ? 'Update' : 'Add'}</Button>
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

      {/* Delete Child Confirmation Dialog */}
      <Dialog open={deleteChildOpen} onClose={() => { setDeleteChildOpen(false); setDeleteChildConfirmText(''); }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" /> Permanently Delete Child
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will <strong>permanently delete</strong> {child.first_name} {child.last_name} and <strong>all associated data</strong> including:
          </Typography>
          <Typography component="ul" variant="body2" sx={{ pl: 2, mb: 2 }}>
            <li>Parent/guardian records (if not linked to other children)</li>
            <li>Emergency contacts</li>
            <li>Authorized pickups</li>
            <li>Immunization records</li>
            <li>Attendance history</li>
            <li>Medication logs</li>
            <li>Incident reports</li>
            <li>Meal logs</li>
            <li>Invoice line items</li>
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>This action cannot be undone.</Alert>
          <TextField
            fullWidth
            label={`Type "${child.first_name}" to confirm`}
            value={deleteChildConfirmText}
            onChange={(e) => setDeleteChildConfirmText(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteChildOpen(false); setDeleteChildConfirmText(''); }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteChildConfirmText !== child.first_name}
            onClick={handleDeleteChild}
          >
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link Parent Dialog */}
      <Dialog open={parentDialog} onClose={() => setParentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Parent / Guardian</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={!createNewParent ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setCreateNewParent(false)}
              >
                Link Existing
              </Button>
              <Button
                variant={createNewParent ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setCreateNewParent(true)}
              >
                Create New
              </Button>
            </Box>

            {!createNewParent ? (
              <>
                <Autocomplete
                  options={allParents}
                  getOptionLabel={(p: any) => `${p.first_name} ${p.last_name}${p.email ? ` (${p.email})` : ''}`}
                  value={selectedParent}
                  onChange={(_, v) => setSelectedParent(v)}
                  renderInput={(params) => <TextField {...params} label="Select Parent" placeholder="Search by name..." />}
                />
                <TextField
                  label="Relationship to Child"
                  value={parentRelationship}
                  onChange={(e) => setParentRelationship(e.target.value)}
                  placeholder="e.g., mother, father, guardian"
                />
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="First Name" value={newParentForm.first_name} onChange={(e) => setNewParentForm({ ...newParentForm, first_name: e.target.value })} fullWidth required />
                  <TextField label="Last Name" value={newParentForm.last_name} onChange={(e) => setNewParentForm({ ...newParentForm, last_name: e.target.value })} fullWidth required />
                </Box>
                <TextField label="Email" value={newParentForm.email} onChange={(e) => setNewParentForm({ ...newParentForm, email: e.target.value })} />
                <TextField label="Phone" value={newParentForm.phone} onChange={(e) => setNewParentForm({ ...newParentForm, phone: e.target.value })} />
                <TextField label="Relationship" value={newParentForm.relationship} onChange={(e) => setNewParentForm({ ...newParentForm, relationship: e.target.value })} placeholder="e.g., mother, father, guardian" />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleLinkParent}
            disabled={!createNewParent ? !selectedParent : (!newParentForm.first_name.trim() || !newParentForm.last_name.trim())}
          >
            {createNewParent ? 'Create & Link' : 'Link Parent'}
          </Button>
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
