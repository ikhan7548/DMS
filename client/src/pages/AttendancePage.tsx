import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid2 as Grid, Tabs, Tab, Button,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Paper,
} from '@mui/material';
import { Login, Logout, CheckCircle, Warning, Today, History } from '@mui/icons-material';
import api from '../lib/api';

interface ChildAttendance {
  id: number; first_name: string; last_name: string; nickname: string;
  date_of_birth: string; checked_in: boolean; attendance_id: number | null;
  check_in_time: string | null;
}

interface StaffAttendance {
  id: number; first_name: string; last_name: string; position: string;
  clocked_in: boolean; time_clock_id: number | null; clock_in_time: string | null;
}

interface PointsData {
  totalPoints: number; caregiversNeeded: number; caregiversPresent: number;
  isCompliant: boolean; breakdown: { ageGroup: string; count: number; points: number }[];
}

export default function AttendancePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [children, setChildren] = useState<ChildAttendance[]>([]);
  const [staff, setStaff] = useState<StaffAttendance[]>([]);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({ id: 0, type: '', checkIn: '', checkOut: '', reason: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [childRes, staffRes, pointsRes] = await Promise.all([
        api.get('/attendance/today/children'),
        api.get('/attendance/today/staff'),
        api.get('/attendance/points'),
      ]);
      setChildren(childRes.data);
      setStaff(staffRes.data);
      setPoints(pointsRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleChildCheckIn = async (childId: number) => {
    try {
      await api.post('/attendance/children/checkin', { childId });
      fetchAll();
    } catch {}
  };

  const handleChildCheckOut = async (attendanceId: number) => {
    try {
      await api.post(`/attendance/children/${attendanceId}/checkout`);
      fetchAll();
    } catch {}
  };

  const handleStaffClockIn = async (staffId: number) => {
    try {
      await api.post('/attendance/staff/clockin', { staffId });
      fetchAll();
    } catch {}
  };

  const handleStaffClockOut = async (timeClockId: number) => {
    try {
      await api.post(`/attendance/staff/${timeClockId}/clockout`);
      fetchAll();
    } catch {}
  };

  const handleCorrection = async () => {
    try {
      await api.put(`/attendance/${correctionForm.id}/correct`, correctionForm);
      setCorrectionOpen(false);
      fetchAll();
    } catch {}
  };

  if (loading) return <LinearProgress />;

  const checkedInCount = children.filter(c => c.checked_in).length;
  const clockedInCount = staff.filter(s => s.clocked_in).length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Attendance</Typography>

      {/* Points Summary */}
      {points && (
        <Card sx={{ mb: 3, backgroundColor: (theme) => points.isCompliant ? (theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : '#E8F5E9') : (theme.palette.mode === 'dark' ? 'rgba(230, 81, 0, 0.15)' : '#FFF3E0') }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {points.isCompliant
                ? <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                : <Warning sx={{ color: 'warning.main', fontSize: 32 }} />
              }
              <Typography variant="h6">
                {points.isCompliant ? 'Compliant' : 'Non-Compliant'} - Virginia Point System
              </Typography>
              <Chip label={`Total Points: ${points.totalPoints}`} color="primary" />
              <Chip label={`Staff Needed: ${points.caregiversNeeded}`} color="secondary" />
              <Chip label={`Staff Present: ${points.caregiversPresent}`} variant="outlined" />
              {points.breakdown.map((b, i) => (
                <Chip key={i} label={`${b.ageGroup}: ${b.count} (${b.points}pts)`} size="small" variant="outlined" />
              ))}
            </Box>
            {!points.isCompliant && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You need {points.caregiversNeeded - points.caregiversPresent} more staff to be compliant!
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{checkedInCount}</Typography>
            <Typography variant="body2" color="text.secondary">Children Present</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{children.length - checkedInCount}</Typography>
            <Typography variant="body2" color="text.secondary">Children Absent</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{clockedInCount}</Typography>
            <Typography variant="body2" color="text.secondary">Staff On Duty</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{staff.length - clockedInCount}</Typography>
            <Typography variant="body2" color="text.secondary">Staff Off Duty</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Tabs
        value={0}
        onChange={(_e, val) => { if (val === 1) navigate('/attendance/history'); }}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Today />} iconPosition="start" label="Today" />
        <Tab icon={<History />} iconPosition="start" label="History" />
      </Tabs>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Children (${checkedInCount}/${children.length})`} />
        <Tab label={`Staff (${clockedInCount}/${staff.length})`} />
      </Tabs>

      {/* Children Tab */}
      {tab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check-In Time</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {children.map((child) => (
                  <TableRow key={child.id}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {child.first_name} {child.last_name}
                      {child.nickname && <Typography variant="caption" color="text.secondary"> ({child.nickname})</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={child.checked_in ? 'Present' : 'Absent'}
                        size="small"
                        color={child.checked_in ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{child.check_in_time || '-'}</TableCell>
                    <TableCell>
                      {child.checked_in ? (
                        <Button
                          size="small" variant="outlined" color="error"
                          startIcon={<Logout />}
                          onClick={() => handleChildCheckOut(child.attendance_id!)}
                        >
                          Check Out
                        </Button>
                      ) : (
                        <Button
                          size="small" variant="contained" color="primary"
                          startIcon={<Login />}
                          onClick={() => handleChildCheckIn(child.id)}
                        >
                          Check In
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Staff Tab */}
      {tab === 1 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Clock-In Time</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</TableCell>
                    <TableCell><Chip label={s.position || 'Staff'} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Chip
                        label={s.clocked_in ? 'On Duty' : 'Off Duty'}
                        size="small"
                        color={s.clocked_in ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{s.clock_in_time || '-'}</TableCell>
                    <TableCell>
                      {s.clocked_in ? (
                        <Button
                          size="small" variant="outlined" color="error"
                          startIcon={<Logout />}
                          onClick={() => handleStaffClockOut(s.time_clock_id!)}
                        >
                          Clock Out
                        </Button>
                      ) : (
                        <Button
                          size="small" variant="contained" color="primary"
                          startIcon={<Login />}
                          onClick={() => handleStaffClockIn(s.id)}
                        >
                          Clock In
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Correction Dialog */}
      <Dialog open={correctionOpen} onClose={() => setCorrectionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Time Correction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Check In" type="time" value={correctionForm.checkIn} onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Check Out" type="time" value={correctionForm.checkOut} onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Reason (required)" value={correctionForm.reason} onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })} multiline rows={2} required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorrectionOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCorrection} disabled={!correctionForm.reason}>Save Correction</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
