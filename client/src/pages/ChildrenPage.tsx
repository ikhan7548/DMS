import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Alert, IconButton, SelectChangeEvent,
} from '@mui/material';
import { Add, Search, Close } from '@mui/icons-material';
import api from '../lib/api';

interface Child {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string | null;
  sex: 'male' | 'female' | 'other';
  date_of_birth: string;
  expected_schedule: 'full_time' | 'part_time' | 'drop_in' | 'after_school' | 'before_school';
  status: 'active' | 'inactive' | 'withdrawn';
  allergies: string | null;
  notes: string | null;
  enrollment_date: string;
  fee_tier_name: string | null;
}

interface ChildFormData {
  first_name: string;
  last_name: string;
  nickname: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  schedule_type: 'full_time' | 'part_time' | 'drop_in';
  allergies: string;
  medical_notes: string;
  notes: string;
}

const emptyForm: ChildFormData = {
  first_name: '',
  last_name: '',
  nickname: '',
  date_of_birth: '',
  gender: 'male',
  schedule_type: 'full_time',
  allergies: '',
  medical_notes: '',
  notes: '',
};

const scheduleLabels: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  drop_in: 'Drop In',
  after_school: 'After School',
  before_school: 'Before School',
};

const scheduleColors: Record<string, 'primary' | 'secondary' | 'warning' | 'info' | 'default'> = {
  full_time: 'primary',
  part_time: 'secondary',
  drop_in: 'warning',
  after_school: 'info',
  before_school: 'default',
};

const statusColors: Record<string, 'success' | 'default' | 'error'> = {
  active: 'success',
  inactive: 'default',
  withdrawn: 'error',
};

function calculateAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  if (today.getDate() < dob.getDate()) {
    months--;
    if (months < 0) months += 12;
  }

  if (years < 1) {
    return `${months}mo`;
  }
  if (years < 3) {
    return months > 0 ? `${years}y ${months}mo` : `${years}y`;
  }
  return `${years}y`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ChildrenPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [form, setForm] = useState<ChildFormData>(emptyForm);
  const [formError, setFormError] = useState('');

  // Fetch children
  const { data: children = [], isLoading, error } = useQuery<Child[]>({
    queryKey: ['children', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/children', { params });
      return res.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ChildFormData) =>
      api.post('/children', {
        firstName: data.first_name,
        lastName: data.last_name,
        nickname: data.nickname || null,
        sex: data.gender,
        dateOfBirth: data.date_of_birth,
        enrollmentDate: new Date().toISOString().split('T')[0],
        expectedSchedule: data.schedule_type,
        allergies: data.allergies || null,
        notes: [data.medical_notes, data.notes].filter(Boolean).join('\n---\n') || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      handleCloseDialog();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to create child record');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChildFormData }) =>
      api.put(`/children/${id}`, {
        first_name: data.first_name,
        last_name: data.last_name,
        nickname: data.nickname || null,
        sex: data.gender,
        date_of_birth: data.date_of_birth,
        expected_schedule: data.schedule_type,
        allergies: data.allergies || null,
        notes: [data.medical_notes, data.notes].filter(Boolean).join('\n---\n') || null,
        status: editingChild?.status || 'active',
        enrollment_date: editingChild?.enrollment_date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      handleCloseDialog();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to update child record');
    },
  });

  // Filter children by search text (client-side for responsiveness)
  const filteredChildren = useMemo(() => {
    if (!searchText.trim()) return children;
    const query = searchText.toLowerCase();
    return children.filter(
      (c) =>
        c.first_name.toLowerCase().includes(query) ||
        c.last_name.toLowerCase().includes(query) ||
        (c.nickname && c.nickname.toLowerCase().includes(query))
    );
  }, [children, searchText]);

  const handleOpenCreate = () => {
    setEditingChild(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (child: Child) => {
    setEditingChild(child);
    const noteParts = (child.notes || '').split('\n---\n');
    setForm({
      first_name: child.first_name,
      last_name: child.last_name,
      nickname: child.nickname || '',
      date_of_birth: child.date_of_birth,
      gender: child.sex,
      schedule_type: (['full_time', 'part_time', 'drop_in'].includes(child.expected_schedule)
        ? child.expected_schedule
        : 'full_time') as ChildFormData['schedule_type'],
      allergies: child.allergies || '',
      medical_notes: noteParts.length > 1 ? noteParts[0] : '',
      notes: noteParts.length > 1 ? noteParts.slice(1).join('\n---\n') : (child.notes || ''),
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChild(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleFieldChange = (field: keyof ChildFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectChange = (field: keyof ChildFormData) => (e: SelectChangeEvent) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.date_of_birth) {
      setFormError('First name, last name, and date of birth are required.');
      return;
    }
    setFormError('');

    if (editingChild) {
      updateMutation.mutate({ id: editingChild.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleRowClick = (child: Child) => {
    navigate(`/children/${child.id}`);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (error) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>Children</Typography>
        <Alert severity="error">Failed to load children. Please try again later.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Children</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Enroll Child
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by name or nickname..."
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 280, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="withdrawn">Withdrawn</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {filteredChildren.length} {filteredChildren.length === 1 ? 'child' : 'children'}
          </Typography>
        </Box>
      </Card>

      {/* Children Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nickname</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>DOB</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Age</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Schedule</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : filteredChildren.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchText ? 'No children match your search.' : 'No children found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredChildren.map((child) => (
                  <TableRow
                    key={child.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(child)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {child.first_name} {child.last_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {child.nickname || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(child.date_of_birth)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {calculateAge(child.date_of_birth)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={scheduleLabels[child.expected_schedule] || child.expected_schedule}
                        size="small"
                        color={scheduleColors[child.expected_schedule] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={child.status.charAt(0).toUpperCase() + child.status.slice(1)}
                        size="small"
                        color={statusColors[child.status] || 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Enroll / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingChild ? 'Edit Child' : 'Enroll Child'}
          <IconButton size="small" onClick={handleCloseDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={form.first_name}
                onChange={handleFieldChange('first_name')}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={form.last_name}
                onChange={handleFieldChange('last_name')}
                required
                fullWidth
              />
            </Box>

            <TextField
              label="Nickname"
              value={form.nickname}
              onChange={handleFieldChange('nickname')}
              fullWidth
            />

            <TextField
              label="Date of Birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleFieldChange('date_of_birth')}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={form.gender}
                label="Gender"
                onChange={handleSelectChange('gender')}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                value={form.schedule_type}
                label="Schedule Type"
                onChange={handleSelectChange('schedule_type')}
              >
                <MenuItem value="full_time">Full Time</MenuItem>
                <MenuItem value="part_time">Part Time</MenuItem>
                <MenuItem value="drop_in">Drop In</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Allergies"
              value={form.allergies}
              onChange={handleFieldChange('allergies')}
              fullWidth
              multiline
              rows={2}
              placeholder="List any known allergies..."
            />

            <TextField
              label="Medical Notes"
              value={form.medical_notes}
              onChange={handleFieldChange('medical_notes')}
              fullWidth
              multiline
              rows={2}
              placeholder="Any medical conditions or special needs..."
            />

            <TextField
              label="Notes"
              value={form.notes}
              onChange={handleFieldChange('notes')}
              fullWidth
              multiline
              rows={2}
              placeholder="Additional notes..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSaving || !form.first_name.trim() || !form.last_name.trim() || !form.date_of_birth}
          >
            {isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingChild ? (
              'Save Changes'
            ) : (
              'Enroll'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
