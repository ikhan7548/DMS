import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Tabs, Tab, Button,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Alert, LinearProgress, Snackbar, Checkbox, IconButton, Tooltip,
  Radio, RadioGroup, FormLabel, Divider, Paper,
} from '@mui/material';
import {
  Save, PersonAdd, Backup, Security, Settings as SettingsIcon,
  AdminPanelSettings, Edit, LockReset, Download, Delete,
  Palette, Language, Receipt, SettingsBackupRestore,
} from '@mui/icons-material';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [tabKey, setTabKey] = useState('facility');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const showMsg = (msg: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message: msg, severity });

  // Build tab list dynamically to avoid conditional rendering index issues
  const tabs: { key: string; label: string; icon: any }[] = [
    { key: 'facility', label: 'Facility', icon: <SettingsIcon /> },
    ...(isAdmin ? [
      { key: 'users', label: 'Users', icon: <PersonAdd /> },
      { key: 'billing', label: 'Billing & Invoices', icon: <Receipt /> },
      { key: 'permissions', label: 'Permissions', icon: <AdminPanelSettings /> },
      { key: 'backup', label: 'Backup', icon: <Backup /> },
      { key: 'audit', label: 'Audit Log', icon: <Security /> },
    ] : []),
    { key: 'appearance', label: 'Appearance', icon: <Palette /> },
    { key: 'language', label: 'Language', icon: <Language /> },
  ];

  const tabIndex = Math.max(0, tabs.findIndex(t => t.key === tabKey));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>

      <Tabs value={tabIndex} onChange={(_, v) => setTabKey(tabs[v].key)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        {tabs.map(t => (
          <Tab key={t.key} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {tabKey === 'facility' && <FacilitySettings onMessage={(msg, s) => showMsg(msg, s)} />}
      {tabKey === 'users' && isAdmin && <UserManagement onMessage={(msg, s) => showMsg(msg, s)} />}
      {tabKey === 'billing' && isAdmin && <BillingSettings onMessage={(msg, s) => showMsg(msg, s)} />}
      {tabKey === 'permissions' && isAdmin && <PermissionsSection onMessage={(msg) => showMsg(msg)} />}
      {tabKey === 'backup' && isAdmin && <BackupSection onMessage={(msg, s) => showMsg(msg, s)} />}
      {tabKey === 'audit' && isAdmin && <AuditLogSection />}
      {tabKey === 'appearance' && <AppearanceSection onMessage={(msg) => showMsg(msg)} />}
      {tabKey === 'language' && <LanguageSection onMessage={(msg) => showMsg(msg)} />}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}

// ─── Facility Settings ──────────────────────────────────────

function FacilitySettings({ onMessage }: { onMessage: (msg: string, severity?: 'success' | 'error') => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSettings(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/settings', settings);
      onMessage('Settings saved successfully');
    } catch { onMessage('Failed to save settings', 'error'); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* App Branding */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>App Branding</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize the application name shown in the header, login screen, and browser title.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="App Title" value={settings.app_name || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                helperText="Shown in header and login screen" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="App Abbreviation" value={settings.app_abbreviation || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, app_abbreviation: e.target.value })}
                helperText="Short name shown on login screen" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Facility Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Facility Information</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Facility Name" value={settings.facility_name || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, facility_name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="License Number" value={settings.license_number || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, license_number: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Address" value={settings.facility_address || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, facility_address: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Phone" value={settings.facility_phone || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, facility_phone: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Email" value={settings.facility_email || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, facility_email: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="EIN" value={settings.facility_ein || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, facility_ein: e.target.value })}
                helperText="Used on tax statements" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Max Capacity" type="number" value={settings.max_capacity || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, max_capacity: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Opening Time" type="time" value={settings.operating_hours_start || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, operating_hours_start: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Closing Time" type="time" value={settings.operating_hours_end || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, operating_hours_end: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Fiscal Year Start</InputLabel>
                <Select value={settings.fiscal_year_start || '01'} label="Fiscal Year Start"
                  onChange={(e) => setSettings({ ...settings, fiscal_year_start: e.target.value })}>
                  <MenuItem value="01">January</MenuItem>
                  <MenuItem value="04">April</MenuItem>
                  <MenuItem value="07">July</MenuItem>
                  <MenuItem value="10">October</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Late Pickup Fee ($)" type="number" value={settings.late_pickup_fee || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, late_pickup_fee: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Grace Period (min)" type="number" value={settings.late_pickup_grace_minutes || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, late_pickup_grace_minutes: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Timezone" value={settings.timezone || ''} size="small" fullWidth
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>Save Settings</Button>
      </Box>
    </Box>
  );
}

// ─── User Management ────────────────────────────────────────

function UserManagement({ onMessage }: { onMessage: (msg: string, severity?: 'success' | 'error') => void }) {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ username: '', pin: '', display_name: '', role: 'staff', language: 'en', staff_id: '' as string });

  // Edit user
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: 0, username: '', display_name: '', role: 'staff', staff_id: '' as string, is_active: true });

  // Reset PIN
  const [pinDialog, setPinDialog] = useState(false);
  const [pinForm, setPinForm] = useState({ userId: 0, username: '', pin: '' });

  // Delete user
  const [deleteDialog, setDeleteDialog] = useState<{ id: number; username: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/settings/users'),
      api.get('/settings/active-staff').catch(() => ({ data: [] })),
    ]).then(([usersRes, staffRes]) => {
      setUsers(usersRes.data);
      setStaffList(staffRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/settings/users', {
        ...form,
        staff_id: form.staff_id ? Number(form.staff_id) : null,
      });
      setDialogOpen(false);
      setForm({ username: '', pin: '', display_name: '', role: 'staff', language: 'en', staff_id: '' });
      fetchData();
      onMessage('User created successfully');
    } catch (err: any) {
      onMessage(err.response?.data?.error || 'Failed to create user', 'error');
    }
  };

  const openEdit = (u: any) => {
    setEditForm({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      role: u.role,
      staff_id: u.staff_id ? String(u.staff_id) : '',
      is_active: !!u.is_active,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/settings/users/${editForm.id}`, {
        display_name: editForm.display_name,
        role: editForm.role,
        staff_id: editForm.staff_id ? Number(editForm.staff_id) : null,
        is_active: editForm.is_active ? 1 : 0,
      });
      setEditOpen(false);
      fetchData();
      onMessage('User updated successfully');
    } catch (err: any) {
      onMessage(err.response?.data?.error || 'Failed to update user', 'error');
    }
  };

  const handleResetPin = async () => {
    try {
      await api.put(`/settings/users/${pinForm.userId}/pin`, { pin: pinForm.pin });
      setPinDialog(false);
      onMessage('PIN reset successfully');
    } catch { onMessage('Failed to reset PIN', 'error'); }
  };

  const handleToggleActive = async (userId: number, currentlyActive: boolean) => {
    try {
      await api.put(`/settings/users/${userId}`, { is_active: currentlyActive ? 0 : 1 });
      fetchData();
    } catch {}
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/settings/users/${deleteDialog.id}`);
      setDeleteDialog(null);
      setDeleteConfirmText('');
      fetchData();
      onMessage('User deleted successfully');
    } catch (err: any) {
      onMessage(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Users</Typography>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setDialogOpen(true)}>Add User</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Linked Staff</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{u.username}</TableCell>
                    <TableCell>{u.display_name}</TableCell>
                    <TableCell>
                      <Chip label={u.role} size="small" variant="outlined"
                        color={u.role === 'admin' ? 'error' : u.role === 'provider' ? 'primary' : 'default'} />
                    </TableCell>
                    <TableCell>
                      {u.staff_first_name ? (
                        <Typography variant="body2">{u.staff_first_name} {u.staff_last_name}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not linked</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={!!u.is_active}
                        onChange={() => handleToggleActive(u.id, !!u.is_active)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit User">
                        <IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Reset PIN">
                        <IconButton size="small" onClick={() => { setPinForm({ userId: u.id, username: u.username, pin: '' }); setPinDialog(true); }}>
                          <LockReset fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u.id !== currentUser?.id && (
                        <Tooltip title="Delete User">
                          <IconButton size="small" color="error" onClick={() => { setDeleteDialog({ id: u.id, username: u.username }); setDeleteConfirmText(''); }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Display Name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="PIN" type="password" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} required helperText="4+ digit PIN" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select value={form.role} label="Role" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="provider">Provider</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="substitute">Substitute</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Link to Staff Member</InputLabel>
                  <Select value={form.staff_id} label="Link to Staff Member" onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                    <MenuItem value="">None</MenuItem>
                    {staffList.map((s: any) => (
                      <MenuItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.position})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select value={form.language} label="Language" onChange={(e) => setForm({ ...form, language: e.target.value })}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="ur">Urdu</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.username || !form.pin}>Create User</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Username" value={editForm.username} disabled fullWidth />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Display Name" value={editForm.display_name} fullWidth
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select value={editForm.role} label="Role" onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="provider">Provider</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="substitute">Substitute</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Link to Staff Member</InputLabel>
                  <Select value={editForm.staff_id} label="Link to Staff Member" onChange={(e) => setEditForm({ ...editForm, staff_id: e.target.value })}>
                    <MenuItem value="">None</MenuItem>
                    {staffList.map((s: any) => (
                      <MenuItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.position})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />}
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={pinDialog} onClose={() => setPinDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset PIN for "{pinForm.username}"</DialogTitle>
        <DialogContent>
          <TextField
            label="New PIN" type="password" fullWidth sx={{ mt: 1 }}
            value={pinForm.pin} onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value })}
            helperText="Minimum 4 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPinDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleResetPin} disabled={!pinForm.pin || pinForm.pin.length < 4}>Reset</Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => { setDeleteDialog(null); setDeleteConfirmText(''); }}>
        <DialogTitle sx={{ color: 'error.main' }}>Permanently Delete User</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will <strong>permanently delete</strong> user <strong>"{deleteDialog?.username}"</strong> and remove their access to the system.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Audit log entries by this user will be preserved but unlinked.
          </Alert>
          <Alert severity="error" sx={{ mb: 2 }}>This action cannot be undone.</Alert>
          <TextField
            fullWidth
            label={`Type "${deleteDialog?.username}" to confirm`}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialog(null); setDeleteConfirmText(''); }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== deleteDialog?.username}
            onClick={handleDeleteUser}
          >
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Billing & Invoice Settings ─────────────────────────────

function BillingSettings({ onMessage }: { onMessage: (msg: string, severity?: 'success' | 'error') => void }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSettings(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/settings', settings);
      onMessage('Billing settings saved successfully');
    } catch { onMessage('Failed to save billing settings', 'error'); }
  };

  if (loading) return <LinearProgress />;

  const dueDateType = settings.invoice_due_date_type || 'days_after';
  const footerLine1 = settings.invoice_footer_line1 || '';
  const footerLine2 = settings.invoice_footer_line2 || '';
  const footerLine3 = settings.invoice_footer_line3 || '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Due Date Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Invoice Due Date</Typography>
          <FormControl component="fieldset">
            <FormLabel component="legend">When are invoices due?</FormLabel>
            <RadioGroup value={dueDateType} onChange={(e) => setSettings({ ...settings, invoice_due_date_type: e.target.value })}>
              <FormControlLabel value="upon_receipt" control={<Radio />} label="Due upon receipt" />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel value="days_after" control={<Radio />} label="Due after" />
                <TextField
                  size="small" type="number"
                  value={settings.invoice_due_date_days || '7'}
                  onChange={(e) => setSettings({ ...settings, invoice_due_date_days: e.target.value })}
                  disabled={dueDateType !== 'days_after'}
                  sx={{ width: 80 }}
                  inputProps={{ min: 1, max: 90 }}
                />
                <Typography variant="body2" color="text.secondary">days from billing period end</Typography>
              </Box>
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* Invoice Footer */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Invoice Footer</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Contact information displayed at the bottom of printed invoices. Leave blank to hide the footer.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Footer Line 1"
                placeholder="e.g., Your Daycare Name — LLC"
                value={footerLine1}
                onChange={(e) => setSettings({ ...settings, invoice_footer_line1: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Footer Line 2"
                placeholder="e.g., 123 Main Street, City, State ZIP | Phone: (555) 123-4567"
                value={footerLine2}
                onChange={(e) => setSettings({ ...settings, invoice_footer_line2: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Footer Line 3"
                placeholder="e.g., Email: info@daycare.com | EIN: XX-XXXXXXX"
                value={footerLine3}
                onChange={(e) => setSettings({ ...settings, invoice_footer_line3: e.target.value })} />
            </Grid>
          </Grid>
          {(footerLine1 || footerLine2 || footerLine3) && (
            <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Preview</Typography>
              {footerLine1 && <Typography variant="body2" color="text.secondary">{footerLine1}</Typography>}
              {footerLine2 && <Typography variant="body2" color="text.secondary">{footerLine2}</Typography>}
              {footerLine3 && <Typography variant="body2" color="text.secondary">{footerLine3}</Typography>}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Data Retention</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Default retention period for archived records. After the retention period expires, archived records are automatically deleted.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField size="small" type="number" label="Retention Period"
              value={settings.data_retention_days || '365'}
              onChange={(e) => setSettings({ ...settings, data_retention_days: e.target.value })}
              sx={{ width: 150 }}
              inputProps={{ min: 30, max: 3650 }} />
            <Typography variant="body2" color="text.secondary">days (default: 365)</Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>Save Billing Settings</Button>
      </Box>
    </Box>
  );
}

// ─── Permissions Section ────────────────────────────────────

const ROLES = ['admin', 'provider', 'staff', 'substitute', 'parent'];
const FEATURES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'children_view', label: 'View Children' },
  { key: 'children_contacts', label: 'View Child Contacts' },
  { key: 'children_medical', label: 'View Child Medical Info' },
  { key: 'children_edit', label: 'Edit / Enroll Children' },
  { key: 'children_enroll', label: 'Enroll New Children' },
  { key: 'staff_view', label: 'View Staff' },
  { key: 'staff_edit', label: 'Edit Staff' },
  { key: 'attendance_checkin', label: 'Check In / Out' },
  { key: 'attendance_checkout', label: 'Check Out' },
  { key: 'attendance_history', label: 'Attendance History' },
  { key: 'attendance_edit_times', label: 'Edit Attendance Times' },
  { key: 'billing_view', label: 'View Billing' },
  { key: 'billing_manage', label: 'Manage Billing' },
  { key: 'meals_view', label: 'View Meals' },
  { key: 'meals_edit', label: 'Edit Meals' },
  { key: 'reports_view', label: 'View Reports' },
  { key: 'reports_export', label: 'Export Reports' },
  { key: 'settings_view', label: 'View Settings' },
  { key: 'settings_edit', label: 'Edit Settings' },
  { key: 'compliance_view', label: 'View Compliance' },
  { key: 'compliance_edit', label: 'Edit Compliance' },
];

function PermissionsSection({ onMessage }: { onMessage: (msg: string) => void }) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('staff');
  const [rolePerms, setRolePerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/permissions');
      setPermissions(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPermissions(); }, []);

  useEffect(() => {
    const permsForRole: Record<string, boolean> = {};
    FEATURES.forEach(f => { permsForRole[f.key] = false; });
    permissions
      .filter((p: any) => p.role === selectedRole)
      .forEach((p: any) => { permsForRole[p.feature] = !!p.can_access; });
    setRolePerms(permsForRole);
  }, [selectedRole, permissions]);

  const handleToggle = (feature: string) => {
    setRolePerms(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/permissions', { role: selectedRole, permissions: rolePerms });
      onMessage(`Permissions saved for ${selectedRole}`);
      fetchPermissions();
    } catch { onMessage('Failed to save permissions'); }
    setSaving(false);
  };

  if (loading) return <LinearProgress />;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Role Permissions</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Role</InputLabel>
              <Select value={selectedRole} label="Role" onChange={(e) => setSelectedRole(e.target.value)}>
                {ROLES.map(r => <MenuItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </Box>
        </Box>

        {selectedRole === 'admin' && (
          <Alert severity="info" sx={{ mb: 2 }}>Admin role has full access to all features by default.</Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Feature</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {FEATURES.map((f) => (
                <TableRow key={f.key} hover>
                  <TableCell>{f.label}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={selectedRole === 'admin' ? true : !!rolePerms[f.key]}
                      onChange={() => handleToggle(f.key)}
                      disabled={selectedRole === 'admin'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

// ─── Backup Section ─────────────────────────────────────────

function BackupSection({ onMessage }: { onMessage: (msg: string, severity?: 'success' | 'error') => void }) {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingData, setCreatingData] = useState(false);
  const [creatingFull, setCreatingFull] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  // Auto-backup state
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoInterval, setAutoInterval] = useState('24');
  const [autoType, setAutoType] = useState('data');
  const [autoMaxBackups, setAutoMaxBackups] = useState('0');
  const [autoLastBackup, setAutoLastBackup] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  // Restore state
  const [restoreDialog, setRestoreDialog] = useState<string | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);

  const fetchBackups = () => {
    setLoading(true);
    api.get('/settings/backups')
      .then((res) => setBackups(res.data))
      .finally(() => setLoading(false));
  };

  const fetchAutoSettings = () => {
    api.get('/settings/auto-backup')
      .then((res) => {
        setAutoEnabled(res.data.enabled);
        setAutoInterval(String(res.data.intervalHours));
        setAutoType(res.data.type);
        setAutoMaxBackups(String(res.data.maxBackups || 0));
        setAutoLastBackup(res.data.lastAutoBackup);
      })
      .catch(() => {});
  };

  useEffect(() => { fetchBackups(); fetchAutoSettings(); }, []);

  // Data-only backup
  const handleDataBackup = async () => {
    setCreatingData(true);
    try {
      const res = await api.post('/settings/backup');
      onMessage(`Data backup created (${formatSize(res.data.size)})`);
      fetchBackups();
    } catch { onMessage('Failed to create data backup', 'error'); }
    setCreatingData(false);
  };

  // Full app backup
  const handleFullBackup = async () => {
    setCreatingFull(true);
    try {
      const res = await api.post('/settings/backup/full');
      onMessage(`Full backup created (${formatSize(res.data.size)})`);
      fetchBackups();
    } catch { onMessage('Failed to create full backup', 'error'); }
    setCreatingFull(false);
  };

  // Download raw file
  const handleDownload = (name: string) => {
    const baseURL = api.defaults.baseURL || '';
    window.open(`${baseURL}/settings/backups/${encodeURIComponent(name)}/download`, '_blank');
  };

  // Download as zip (wraps .db files in zip)
  const handleDownloadZip = async (name: string) => {
    try {
      const baseURL = api.defaults.baseURL || '';
      // For .zip files, just download directly; for .db files, wrap in zip
      if (name.endsWith('.zip')) {
        window.open(`${baseURL}/settings/backups/${encodeURIComponent(name)}/download`, '_blank');
      } else {
        // Use the zip endpoint
        const response = await api.post('/settings/backup/download-zip', { filename: name }, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = name.replace(/\.db$/, '.zip');
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { onMessage('Failed to download zip', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/settings/backups/${encodeURIComponent(deleteDialog)}`);
      onMessage('Backup deleted');
      setDeleteDialog(null);
      fetchBackups();
    } catch { onMessage('Failed to delete backup', 'error'); }
  };

  // Save auto-backup settings
  const handleSaveAutoBackup = async () => {
    setAutoSaving(true);
    try {
      await api.put('/settings/auto-backup', {
        enabled: autoEnabled,
        intervalHours: parseInt(autoInterval, 10),
        type: autoType,
        maxBackups: parseInt(autoMaxBackups, 10),
      });
      onMessage(`Auto-backup ${autoEnabled ? 'enabled' : 'disabled'} — every ${autoInterval}h, ${autoType} backup, retention: ${autoMaxBackups === '0' ? 'unlimited' : autoMaxBackups}`);
      fetchAutoSettings();
    } catch { onMessage('Failed to save auto-backup settings', 'error'); }
    setAutoSaving(false);
  };

  // Restore from backup
  const handleRestore = async () => {
    if (!restoreDialog || restoreConfirmText !== 'RESTORE') return;
    setRestoring(true);
    try {
      const res = await api.post('/settings/restore', { filename: restoreDialog });
      onMessage(res.data.message || 'Restore prepared. Restart the service to apply.');
      setRestoreDialog(null);
      setRestoreConfirmText('');
      fetchBackups();
    } catch (err: any) {
      onMessage(err.response?.data?.error || 'Failed to restore backup', 'error');
    }
    setRestoring(false);
  };

  // Run auto-backup now
  const handleRunNow = async () => {
    try {
      await api.post('/settings/auto-backup/run-now');
      onMessage('Auto-backup triggered');
      setTimeout(fetchBackups, 2000); // Give it time to finish
    } catch { onMessage('Failed to trigger auto-backup', 'error'); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Create Backups Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Create Backup</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Data Backup</strong> saves a copy of the database (.db file).
            <strong> Full App Backup</strong> packages the entire application — database, client, server source, config files — into a single .zip for disaster recovery.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Backup />}
              onClick={handleDataBackup}
              disabled={creatingData || creatingFull}
            >
              {creatingData ? 'Creating...' : 'Data Backup'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Backup />}
              onClick={handleFullBackup}
              disabled={creatingData || creatingFull}
            >
              {creatingFull ? 'Creating...' : 'Full App Backup'}
            </Button>
          </Box>
          {creatingFull && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Packaging entire application... This may take a moment.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Automated Backup Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Automated Backups</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Schedule automatic backups at a defined interval. Backups are saved under the application's backup folder.
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControlLabel
                control={<Switch checked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)} />}
                label={autoEnabled ? 'Enabled' : 'Disabled'}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Interval</InputLabel>
                <Select value={autoInterval} label="Interval" onChange={(e) => setAutoInterval(e.target.value)} disabled={!autoEnabled}>
                  <MenuItem value="1">Every 1 hour</MenuItem>
                  <MenuItem value="4">Every 4 hours</MenuItem>
                  <MenuItem value="8">Every 8 hours</MenuItem>
                  <MenuItem value="12">Every 12 hours</MenuItem>
                  <MenuItem value="24">Every 24 hours</MenuItem>
                  <MenuItem value="48">Every 48 hours</MenuItem>
                  <MenuItem value="168">Every 7 days</MenuItem>
                  <MenuItem value="720">Every 30 days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Backup Type</InputLabel>
                <Select value={autoType} label="Backup Type" onChange={(e) => setAutoType(e.target.value)} disabled={!autoEnabled}>
                  <MenuItem value="data">Data Only (.db)</MenuItem>
                  <MenuItem value="full">Full App (.zip)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Retention</InputLabel>
                <Select value={autoMaxBackups} label="Retention" onChange={(e) => setAutoMaxBackups(e.target.value)} disabled={!autoEnabled}>
                  <MenuItem value="0">Unlimited</MenuItem>
                  <MenuItem value="5">Keep last 5</MenuItem>
                  <MenuItem value="10">Keep last 10</MenuItem>
                  <MenuItem value="15">Keep last 15</MenuItem>
                  <MenuItem value="20">Keep last 20</MenuItem>
                  <MenuItem value="30">Keep last 30</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" onClick={handleSaveAutoBackup} disabled={autoSaving}>
                  {autoSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outlined" size="small" onClick={handleRunNow} disabled={!autoEnabled}>
                  Run Now
                </Button>
              </Box>
            </Grid>
          </Grid>

          {autoLastBackup && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Last auto-backup: {new Date(autoLastBackup).toLocaleString()}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Backup History Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Backup History</Typography>

          {loading ? <LinearProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((b, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip label={b.type === 'full' ? 'Full App' : 'Data'}
                            size="small" variant="outlined"
                            color={b.type === 'full' ? 'secondary' : 'primary'} />
                          {b.auto && (
                            <Chip label="Auto" size="small" variant="outlined" color="info" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{formatSize(b.size)}</TableCell>
                      <TableCell>{new Date(b.created).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {b.format === 'zip' ? (
                            <Tooltip title="Download .zip">
                              <Button size="small" variant="outlined" startIcon={<Download />}
                                onClick={() => handleDownload(b.name)}>ZIP</Button>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="Download as .db file">
                                <Button size="small" variant="outlined" startIcon={<Download />}
                                  onClick={() => handleDownload(b.name)}>.db</Button>
                              </Tooltip>
                              <Tooltip title="Download as .zip">
                                <Button size="small" variant="outlined" startIcon={<Download />}
                                  onClick={() => handleDownloadZip(b.name)}>.zip</Button>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Restore this backup">
                            <IconButton size="small" color="warning" onClick={() => { setRestoreDialog(b.name); setRestoreConfirmText(''); }}>
                              <SettingsBackupRestore fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete backup">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog(b.name)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {backups.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No backups found. Create one to get started.</Typography>
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete Backup</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this backup?</Typography>
          {deleteDialog && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{deleteDialog}</Typography>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation */}
      <Dialog open={!!restoreDialog} onClose={() => setRestoreDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'warning.main' }}>Restore Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will replace the current database with the backup data. A safety backup will be created automatically before restoring.
          </Alert>
          {restoreDialog && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Backup file: <strong>{restoreDialog}</strong>
            </Typography>
          )}
          <Typography variant="body2" sx={{ mb: 1 }}>
            After restoring, the service must be restarted for changes to take effect.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Type <strong>RESTORE</strong> to confirm:
          </Typography>
          <TextField
            fullWidth size="small"
            value={restoreConfirmText}
            onChange={(e) => setRestoreConfirmText(e.target.value)}
            placeholder="Type RESTORE to confirm"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRestore}
            disabled={restoreConfirmText !== 'RESTORE' || restoring}
          >
            {restoring ? 'Restoring...' : 'Restore Backup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Audit Log Section ──────────────────────────────────────

function AuditLogSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [limit, setLimit] = useState('100');

  const fetchLogs = (params?: Record<string, string>) => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    const sd = params?.startDate ?? startDate;
    const ed = params?.endDate ?? endDate;
    const fa = params?.action ?? filterAction;
    const lm = params?.limit ?? limit;
    if (sd) queryParams.set('startDate', sd);
    if (ed) queryParams.set('endDate', ed);
    if (fa) queryParams.set('action', fa);
    if (lm) queryParams.set('limit', lm);
    api.get(`/settings/audit-log?${queryParams.toString()}`)
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleFilter = () => fetchLogs();

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setFilterAction('');
    setLimit('100');
    fetchLogs({ startDate: '', endDate: '', action: '', limit: '100' });
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date/Time', 'User', 'Action', 'Entity', 'Details'];
    const rows = logs.map(l => [
      l.timestamp, l.display_name || l.username || '', l.action, l.entity_type || '', (l.details || '').replace(/,/g, ';')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6">Audit Log</Typography>
          <Button variant="outlined" size="small" onClick={handleExportCSV} disabled={logs.length === 0}>
            Export CSV
          </Button>
        </Box>

        {/* Filters */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Start Date" type="date" size="small" fullWidth
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="End Date" type="date" size="small" fullWidth
                value={endDate} onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select value={filterAction} label="Action" onChange={(e) => setFilterAction(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="create">Create</MenuItem>
                  <MenuItem value="update">Update</MenuItem>
                  <MenuItem value="delete">Delete</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="logout">Logout</MenuItem>
                  <MenuItem value="backup">Backup</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField label="Limit" type="number" size="small" fullWidth
                value={limit} onChange={(e) => setLimit(e.target.value)}
                inputProps={{ min: 10, max: 1000 }} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" onClick={handleFilter}>Filter</Button>
                <Button variant="outlined" size="small" onClick={handleClear}>Clear</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? <LinearProgress /> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.display_name || log.username || '-'}</TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" variant="outlined"
                        color={log.action === 'create' ? 'success' : log.action === 'delete' ? 'error' : log.action === 'login' ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No audit logs found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Showing {logs.length} records
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Appearance Section ─────────────────────────────────────

const THEME_OPTIONS = [
  { id: 'blue', name: 'Ocean Blue', primary: '#1565C0', secondary: '#FF6F00', sidebar: '#0D47A1', bg: '#f5f5f5' },
  { id: 'teal', name: 'Teal', primary: '#00695C', secondary: '#FF6F00', sidebar: '#004D40', bg: '#f5f5f5' },
  { id: 'purple', name: 'Royal Purple', primary: '#6A1B9A', secondary: '#FF6F00', sidebar: '#4A148C', bg: '#f5f5f5' },
  { id: 'green', name: 'Forest Green', primary: '#2E7D32', secondary: '#FF6F00', sidebar: '#1B5E20', bg: '#f5f5f5' },
  { id: 'red', name: 'Crimson', primary: '#C62828', secondary: '#FF6F00', sidebar: '#B71C1C', bg: '#f5f5f5' },
  { id: 'indigo', name: 'Indigo', primary: '#283593', secondary: '#FF6F00', sidebar: '#1A237E', bg: '#f5f5f5' },
  { id: 'orange', name: 'Sunset Orange', primary: '#E65100', secondary: '#1565C0', sidebar: '#BF360C', bg: '#f5f5f5' },
  { id: 'dark', name: 'Dark Mode', primary: '#90CAF9', secondary: '#FFB74D', sidebar: '#1e1e1e', bg: '#121212' },
];

function AppearanceSection({ onMessage }: { onMessage: (msg: string) => void }) {
  const { primaryColor, setPrimaryColor, mode, toggleMode } = useThemeStore();

  const handleThemeSelect = (theme: typeof THEME_OPTIONS[0]) => {
    setPrimaryColor(theme.primary);
    if (theme.id === 'dark' && mode === 'light') toggleMode();
    if (theme.id !== 'dark' && mode === 'dark') toggleMode();
    onMessage(`Theme "${theme.name}" applied`);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Palette color="primary" />
          <Typography variant="h6">Appearance</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose a color theme for the application. The theme will be applied immediately.
        </Typography>

        <Grid container spacing={2}>
          {THEME_OPTIONS.map((theme) => {
            const isSelected = primaryColor === theme.primary && ((theme.id === 'dark') === (mode === 'dark'));
            return (
              <Grid key={theme.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'grey.300',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isSelected ? 'primary.main' : 'grey.400',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    },
                    position: 'relative',
                  }}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <CardContent sx={{ textAlign: 'center', pb: '16px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                      {[theme.primary, theme.secondary, theme.sidebar, theme.bg].map((c, i) => (
                        <Box key={i} sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          bgcolor: c, border: '2px solid rgba(0,0,0,0.1)',
                        }} />
                      ))}
                    </Box>
                    <Typography variant="subtitle2" fontWeight={600}>{theme.name}</Typography>
                    {isSelected && (
                      <Chip label="Selected" size="small" color="primary" sx={{ mt: 0.5 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={mode === 'dark'} onChange={toggleMode} />}
            label="Dark Mode"
          />
          <Typography variant="body2" color="text.secondary">
            Toggle between light and dark mode
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Language Section ───────────────────────────────────────

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English (US)' },
  { code: 'es', name: 'Spanish', native: 'Espa\u00f1ol' },
  { code: 'ur', name: 'Urdu', native: '\u0627\u0631\u062F\u0648' },
];

function LanguageSection({ onMessage }: { onMessage: (msg: string) => void }) {
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('language') || 'en');

  const handleChange = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('language', lang);
    onMessage(`Language set to ${LANGUAGES.find(l => l.code === lang)?.name || lang}`);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Language color="primary" />
          <Typography variant="h6">Language</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select your preferred language for the application interface.
        </Typography>

        <Grid container spacing={2}>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <Grid key={lang.code} size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'grey.300',
                    bgcolor: isSelected ? 'primary.50' : undefined,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isSelected ? 'primary.main' : 'grey.400',
                    },
                  }}
                  onClick={() => handleChange(lang.code)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ mb: 0.5 }}>{lang.native}</Typography>
                    <Typography variant="body2" color="text.secondary">{lang.name}</Typography>
                    {isSelected && (
                      <Chip label="Selected" size="small" color="primary" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
